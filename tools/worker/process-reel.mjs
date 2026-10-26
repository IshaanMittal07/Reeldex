// Processes one saved reel on a GitHub Actions runner, which has no 150 s limit
// (long reels timed out in the Edge Function): Gemini turns the video into a
// card, ffmpeg cuts its frames (always at least one, for the thumbnail), then
// the video is deleted (plan Section 4).
// Usage: node tools/worker/process-reel.mjs <job_id>
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY (service access; bypasses RLS),
//      GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MODEL_BUDGET.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { cardJsonSchema, cardSchema } from '../../shared/schemas/card.ts';
import { deleteFile, extract, GeminiError, uploadFile, waitUntilActive } from './gemini.mjs';

const PROMPT_VERSION = 'extract.v4';
const MAX_ATTEMPTS = 3;
// Matches the ingest function's part layout: <path>, <path>.1, <path>.2.
const MAX_PARTS = 3;
// Stop starting new Gemini retries after this, so the job ends (and saves why)
// before the workflow's 25-minute timeout kills it.
const DEADLINE = Date.now() + 18 * 60_000;
// Gemini names .mov as video/mov, iOS sends video/quicktime.
const GEMINI_MIME = { 'video/mp4': 'video/mp4', 'video/quicktime': 'video/mov' };

const jobId = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(jobId ?? '')) throw new Error(`Bad job id: ${jobId}`);

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const partPath = (path, i) => (i === 0 ? path : `${path}.${i}`);
const now = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "mm:ss", "h:mm:ss" or plain seconds.
function toSeconds(timestamp) {
  return String(timestamp)
    .split(':')
    .reduce((total, part) => total * 60 + Number(part), 0);
}

const toTimestamp = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// Every stored part, listed first: a failed download must not pass for "no more
// parts" and leave a cut-off video.
async function loadVideo(path) {
  const slash = path.lastIndexOf('/');
  const name = path.slice(slash + 1);
  const { data: files, error } = await db.storage
    .from('incoming')
    .list(path.slice(0, slash), { search: name, limit: 100 });
  if (error) throw new Error(`Storage list: ${error.message}`);
  const names = new Set(files.map((f) => f.name));
  if (!names.has(name)) throw new Error('Video missing from storage');

  const parts = [];
  for (let i = 0; i < MAX_PARTS && names.has(partPath(name, i)); i++) {
    parts.push(await withRetries(`Download part ${i}`, async () => {
      const { data, error } = await db.storage.from('incoming').download(partPath(path, i));
      if (error) throw new Error(`Download part ${i}: ${error.message}`);
      return Buffer.from(await data.arrayBuffer());
    }));
  }
  return Buffer.concat(parts);
}

// Overload (503), rate limits (429), timeouts (504) and dropped connections
// pass, so wait and retry.
const isTransient = (err) =>
  err instanceof GeminiError ? [429, 500, 502, 503, 504].includes(err.status) : err instanceof TypeError;

async function withRetries(what, fn, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt >= tries || Date.now() > DEADLINE) throw err;
      console.warn(`${what} attempt ${attempt}: ${String(err.message).slice(0, 120)}`);
      await sleep(attempt * 15_000);
    }
  }
}

// Then fall back to the budget model.
async function extractWithRetries(opts) {
  const models = [process.env.GEMINI_MODEL, process.env.GEMINI_MODEL_BUDGET].filter(Boolean);
  let lastError;
  for (const model of models) {
    try {
      return { model, text: await withRetries(model, () => extract({ ...opts, model })) };
    } catch (err) {
      if (!isTransient(err)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

async function makeCard(job, bytes) {
  const mimeType = GEMINI_MIME[job.mime_type] ?? 'video/mp4';
  let file = await withRetries('Gemini upload', () => uploadFile(bytes, mimeType, job.id));
  try {
    file = await withRetries('Gemini processing', () => waitUntilActive(file));
    const prompt = readFileSync(new URL('../../prompts/extract.v4.md', import.meta.url), 'utf8').replace(
      '{caption}',
      job.caption ?? '',
    );
    const { model, text } = await extractWithRetries({ prompt, fileUri: file.uri, mimeType, schema: cardJsonSchema });
    const data = cardSchema.parse(JSON.parse(text));
    const { data: card, error } = await db
      .from('cards')
      .insert({
        user_id: job.user_id,
        job_id: job.id,
        category: data.category,
        title: data.title,
        summary: data.one_line_summary,
        data,
        resources: data.resources,
        warnings: data.warnings,
        source_url: job.source_url,
        creator_handle: data.creator_handle,
        model_version: model,
        prompt_version: PROMPT_VERSION,
      })
      .select('id, data')
      .single();
    if (error) throw new Error(`Cards: ${error.message}`);
    console.log(`Card ${card.id} by ${model}: ${data.title}`);
    return card;
  } finally {
    await deleteFile(file.name).catch(() => {});
  }
}

// Gemini's key frames, or one cover frame early in the reel so every card has
// a thumbnail (talking-head reels have no key frames).
async function cutFrames(job, card, video, dir) {
  const duration = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]),
  );
  const wanted = card.data.key_frames?.length
    ? card.data.key_frames
    : [{ timestamp: toTimestamp(Math.min(2, duration / 3)), caption: 'Cover' }];

  const frames = [];
  for (const [i, frame] of wanted.entries()) {
    // Clamp: the model's timestamps are approximate and can overshoot the end.
    const at = Math.max(0, Math.min(toSeconds(frame.timestamp), duration - 0.5));
    const out = join(dir, `${i}.jpg`);
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', "scale='min(720,iw)':-2", '-q:v', '3', '-y', out]);
    } catch (err) {
      console.error(`Frame ${i} at ${frame.timestamp} failed:`, err.message);
      continue;
    }
    const path = `${job.user_id}/${card.id}/${i}.jpg`;
    const { error } = await db.storage.from('frames').upload(path, readFileSync(out), {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) console.error(`Upload ${path} failed:`, error.message);
    else frames.push({ path, timestamp: frame.timestamp, caption: frame.caption });
  }

  // In video order, so frames[0] (the card's thumbnail) is the first one captured.
  frames.sort((a, b) => toSeconds(a.timestamp) - toSeconds(b.timestamp));
  await db.from('cards').update({ frames }).eq('id', card.id);
  console.log(`Saved ${frames.length} frame(s) for card ${card.id}`);
  return frames;
}

// Done or out of attempts: the video is never kept. Every write is tied to this
// run's attempt, so a run the sweeper replaced can't overwrite the newer one.
async function finish(job, attempts, fields) {
  await db.storage.from('incoming').remove(Array.from({ length: MAX_PARTS }, (_, i) => partPath(job.video_path, i)));
  await db
    .from('jobs')
    .update({ ...fields, video_path: null, updated_at: now() })
    .eq('id', job.id)
    .eq('attempts', attempts);
}

const { data: job } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle();
if (!job || job.status !== 'queued' || !job.video_path) {
  console.log('Nothing to do for', jobId);
  process.exit(0);
}

// Claim the job; if a second dispatch of it got here first, leave it alone.
const attempts = (job.attempts ?? 0) + 1;
const { data: claimed } = await db
  .from('jobs')
  .update({ status: 'processing', attempts, started_at: now(), updated_at: now() })
  .eq('id', jobId)
  .eq('status', 'queued')
  .eq('attempts', job.attempts ?? 0)
  .select('id');
if (!claimed?.length) {
  console.log('Already claimed:', jobId);
  process.exit(0);
}

try {
  const dir = mkdtempSync(join(tmpdir(), 'reel-'));
  const video = join(dir, 'video');
  const bytes = await loadVideo(job.video_path);
  writeFileSync(video, bytes);

  // A retry after a frames failure already has its card.
  const { data: existing } = await db.from('cards').select('id, data').eq('job_id', jobId).limit(1);
  const card = existing?.[0] ?? (await makeCard(job, bytes));
  const frames = await cutFrames(job, card, video, dir);
  await finish(job, attempts, { status: 'done', error: null, frames_status: frames.length ? 'done' : 'failed' });
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Attempt ${attempts} failed:`, message);
  if (attempts >= MAX_ATTEMPTS) {
    await finish(job, attempts, { status: 'failed', error: message });
  } else {
    // Back in the queue; the pg_cron sweeper starts it again within 5 minutes.
    await db
      .from('jobs')
      .update({ status: 'queued', error: message, updated_at: now() })
      .eq('id', jobId)
      .eq('attempts', attempts);
  }
  process.exitCode = 1;
}
