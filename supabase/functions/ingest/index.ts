// POST /functions/v1/ingest
//   From the iOS Shortcut: header `x-reeldex-token: rdx_...`, body is either
//   multipart/form-data (field `video`, optional `url` and `caption`) or the raw
//   video bytes (optional `?url=` and `?caption=`). Replies 202 with the job id
//   right away; extraction runs in the background (EdgeRuntime.waitUntil).
//   From pg_cron: header `x-worker-secret`, body {"sweep": true}. Retries stuck jobs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';

import { cardJsonSchema, cardSchema } from '../../../shared/schemas/card.ts';
import { reelUrl } from '../../../shared/reel-url.ts';
import { deleteFile, extract, RateLimitError, uploadFile, waitUntilActive } from './gemini.ts';
import { dispatchFrames } from './github.ts';
import { downloadVideo, fetchCaption, fetchEmbed } from './instagram.ts';

const PROMPT_VERSION = 'extract.v3';
const MAX_ATTEMPTS = 3;
// The whole video sits in memory (256 MB on the free plan), so stay well under that.
const MAX_BYTES = 120 * 1024 * 1024;
const BUCKET = 'incoming';
// Free-plan Storage caps each file at 50 MB, so bigger videos are stored as
// numbered parts: <path>, <path>.1, <path>.2 ...
const PART_BYTES = 45 * 1024 * 1024;
const MAX_PARTS = Math.ceil(MAX_BYTES / PART_BYTES);
// Gemini names .mov as video/mov, iOS sends video/quicktime.
const GEMINI_MIME: Record<string, string> = { 'video/mp4': 'video/mp4', 'video/quicktime': 'video/mov' };

const promptTemplate = Deno.readTextFile(new URL('../../../prompts/extract.v3.md', import.meta.url));

function secretKey() {
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
  const key = keys.default ?? Object.values(keys)[0] ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('No Supabase secret key in env');
  return key;
}

const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(data: string | Uint8Array) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function userFromToken(token: string | null) {
  if (!token?.startsWith('rdx_')) return null;
  const { data } = await db
    .from('ingest_tokens')
    .select('id, user_id')
    .eq('token_hash', await sha256Hex(token))
    .maybeSingle();
  if (!data) return null;
  await db.from('ingest_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data.user_id as string;
}

// Shortcuts often labels uploads application/octet-stream, so trust the bytes:
// MP4 and MOV both start with an `ftyp` box; brand `qt  ` means QuickTime.
function sniffMime(bytes: Uint8Array, declared: string) {
  if (GEMINI_MIME[declared]) return declared;
  const box = new TextDecoder().decode(bytes.subarray(4, 12));
  if (!box.startsWith('ftyp')) return declared;
  return box.slice(4) === 'qt  ' ? 'video/quicktime' : 'video/mp4';
}

async function readUpload(req: Request) {
  const params = new URL(req.url).searchParams;
  const type = req.headers.get('content-type') ?? '';
  if (type.startsWith('multipart/form-data')) {
    const form = await req.formData();
    const video = form.get('video');
    if (!(video instanceof File)) return null;
    return {
      bytes: new Uint8Array(await video.arrayBuffer()),
      mimeType: video.type,
      url: (form.get('url') as string | null) || params.get('url'),
      caption: (form.get('caption') as string | null) || params.get('caption'),
    };
  }
  return {
    bytes: new Uint8Array(await req.arrayBuffer()),
    mimeType: type.split(';')[0],
    url: params.get('url'),
    caption: params.get('caption'),
  };
}

const partPath = (path: string, i: number) => (i === 0 ? path : `${path}.${i}`);

async function storeVideo(path: string, bytes: Uint8Array, contentType: string) {
  for (let i = 0; i * PART_BYTES < bytes.byteLength; i++) {
    const part = new Blob([bytes.subarray(i * PART_BYTES, (i + 1) * PART_BYTES)], { type: contentType });
    const { error } = await db.storage.from(BUCKET).upload(partPath(path, i), part, { contentType });
    if (error) return error;
  }
  return null;
}

// Reads parts in order until the next one is missing.
async function loadVideo(path: string) {
  const parts: Uint8Array[] = [];
  for (let i = 0; i < MAX_PARTS; i++) {
    const { data, error } = await db.storage.from(BUCKET).download(partPath(path, i));
    if (error || !data) {
      if (i === 0) throw new Error(`Video missing from storage: ${error?.message}`);
      break;
    }
    parts.push(new Uint8Array(await data.arrayBuffer()));
  }
  if (parts.length === 1) return parts[0];
  const bytes = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.byteLength;
  }
  return bytes;
}

function removeVideo(path: string) {
  return db.storage.from(BUCKET).remove(Array.from({ length: MAX_PARTS }, (_, i) => partPath(path, i)));
}

async function handleUpload(req: Request) {
  const userId = await userFromToken(req.headers.get('x-reeldex-token'));
  if (!userId) {
    // Read the unread video first: replying mid-upload stalls the connection and
    // the Shortcut shows "network connection was lost" instead of this error.
    await req.arrayBuffer().catch(() => {});
    return json({ error: 'Invalid or missing x-reeldex-token' }, 401);
  }

  const upload = await readUpload(req);
  if (!upload) return json({ error: 'No video in request' }, 400);
  upload.url = reelUrl(upload.url);

  // Link only (Shortcut v4): fetch the video from Instagram's public embed page.
  // Shortcuts sends an empty JSON body ("{}") for a POST without a file.
  if (upload.bytes.byteLength < 1024) {
    upload.bytes = new Uint8Array();
    if (!upload.url) return json({ error: 'Send a video or an Instagram reel link' }, 400);
    const { data: seen } = await db
      .from('jobs')
      .select('id, status')
      .eq('user_id', userId)
      .eq('source_url', upload.url)
      .neq('status', 'failed')
      .limit(1)
      .maybeSingle();
    if (seen) return json({ job_id: seen.id, status: seen.status, duplicate: true });

    const embed = await fetchEmbed(upload.url);
    if (!embed.videoUrl) {
      return json({ error: "Couldn't get this reel from Instagram (private or blocked). Tap Download, then share." }, 422);
    }
    try {
      upload.bytes = await downloadVideo(embed.videoUrl, MAX_BYTES);
    } catch (err) {
      return json({ error: `Couldn't download the reel: ${err instanceof Error ? err.message : err}` }, 502);
    }
    upload.caption ||= embed.caption;
  }

  upload.mimeType = sniffMime(upload.bytes, upload.mimeType);
  if (upload.bytes.byteLength > MAX_BYTES) {
    const mb = (upload.bytes.byteLength / 1024 / 1024).toFixed(1);
    return json({ error: `Video is ${mb} MB; the limit is ${MAX_BYTES / 1024 / 1024} MB` }, 413);
  }
  if (!GEMINI_MIME[upload.mimeType]) return json({ error: `Unsupported type ${upload.mimeType}` }, 415);

  const videoHash = await sha256Hex(upload.bytes);
  const { data: existing } = await db
    .from('jobs')
    .select('id, status')
    .eq('user_id', userId)
    .eq('video_hash', videoHash)
    .neq('status', 'failed')
    .limit(1)
    .maybeSingle();
  if (existing) {
    // Re-sharing a saved video with its link backfills the link.
    if (upload.url) {
      await db.from('jobs').update({ source_url: upload.url }).eq('id', existing.id).is('source_url', null);
      await db.from('cards').update({ source_url: upload.url }).eq('job_id', existing.id).is('source_url', null);
    }
    return json({ job_id: existing.id, status: existing.status, duplicate: true });
  }

  const { data: allowed } = await db.rpc('use_quota', { p_user_id: userId });
  if (!allowed) return json({ error: 'Monthly quota used up' }, 429);

  const jobId = crypto.randomUUID();
  const videoPath = `${userId}/${jobId}`;
  const storeError = await storeVideo(videoPath, upload.bytes, upload.mimeType);
  if (storeError) {
    await removeVideo(videoPath);
    return json({ error: `Storage: ${storeError.message}` }, 500);
  }

  const { error: jobError } = await db.from('jobs').insert({
    id: jobId,
    user_id: userId,
    source_type: 'video',
    source_url: upload.url,
    caption: upload.caption,
    video_path: videoPath,
    video_hash: videoHash,
    mime_type: upload.mimeType,
  });
  if (jobError) return json({ error: `Jobs: ${jobError.message}` }, 500);

  EdgeRuntime.waitUntil(processJob(jobId, upload.bytes));
  return json({ job_id: jobId, status: 'queued' }, 202);
}

async function processJob(jobId: string, bytes?: Uint8Array) {
  const { data: job, error } = await db
    .from('jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .in('status', ['queued', 'processing'])
    .select('*')
    .single();
  if (error || !job) return console.error('processJob: could not claim', jobId, error);

  const attempts = job.attempts + 1;
  await db.from('jobs').update({ attempts }).eq('id', jobId);

  let geminiFile: string | undefined;
  try {
    bytes ??= await loadVideo(job.video_path);

    const mimeType = GEMINI_MIME[job.mime_type ?? 'video/mp4'] ?? 'video/mp4';
    let file = await uploadFile(bytes, mimeType, jobId);
    geminiFile = file.name;
    file = await waitUntilActive(file);

    // The Shortcut only sends the link, so read the caption (often the full recipe) ourselves.
    if (!job.caption && job.source_url) {
      job.caption = await fetchCaption(job.source_url);
      if (job.caption) await db.from('jobs').update({ caption: job.caption }).eq('id', jobId);
    }

    const prompt = (await promptTemplate).replace('{caption}', job.caption ?? '');
    const primary = Deno.env.get('GEMINI_MODEL')!;
    const budget = Deno.env.get('GEMINI_MODEL_BUDGET')!;
    let model = primary;
    let text: string;
    try {
      text = await extract({ model, prompt, fileUri: file.uri, mimeType, schema: cardJsonSchema });
    } catch (err) {
      if (!(err instanceof RateLimitError) || !budget) throw err;
      model = budget;
      text = await extract({ model, prompt, fileUri: file.uri, mimeType, schema: cardJsonSchema });
    }

    const card = cardSchema.parse(JSON.parse(text)) as Record<string, any>;
    const { data: saved, error: cardError } = await db.from('cards').insert({
      user_id: job.user_id,
      job_id: jobId,
      category: card.category,
      title: card.title,
      summary: card.one_line_summary,
      data: card,
      resources: card.resources,
      warnings: card.warnings,
      source_url: job.source_url,
      creator_handle: card.creator_handle,
      model_version: model,
      prompt_version: PROMPT_VERSION,
    }).select('id').single();
    if (cardError || !saved) throw new Error(`Cards: ${cardError?.message}`);

    // Frames to cut: keep the video for the Actions job, which deletes it when done.
    const framesError = card.key_frames?.length ? await dispatchFrames(jobId) : 'no key frames';
    if (!framesError) {
      await db
        .from('jobs')
        .update({ status: 'done', error: null, frames_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', jobId);
    } else {
      // The card is done either way; keep the dispatch reason so a silent failure is visible.
      const error = card.key_frames?.length ? framesError : null;
      await finish(jobId, job.video_path, { status: 'done', error });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('processJob failed', jobId, attempts, message);
    if (attempts >= MAX_ATTEMPTS) {
      await finish(jobId, job.video_path, { status: 'failed', error: message });
    } else {
      // Back in the queue; the pg_cron sweeper picks it up within 5 minutes.
      await db.from('jobs').update({ status: 'queued', error: message, updated_at: new Date().toISOString() }).eq('id', jobId);
    }
  } finally {
    if (geminiFile) await deleteFile(geminiFile).catch(() => {});
  }
}

// Done or out of attempts: the video is never kept (plan Section 4).
async function finish(jobId: string, videoPath: string | null, fields: { status: string; error: string | null }) {
  if (videoPath) await removeVideo(videoPath);
  await db
    .from('jobs')
    .update({ ...fields, video_path: null, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}

async function sweep() {
  const now = Date.now();
  const queuedBefore = new Date(now - 2 * 60_000).toISOString();
  // 150 s wall clock, so anything "processing" for 5 minutes has died.
  const processingBefore = new Date(now - 5 * 60_000).toISOString();
  const { data: stuck } = await db
    .from('jobs')
    .select('id, attempts, video_path')
    .or(
      `and(status.eq.queued,updated_at.lt.${queuedBefore}),` +
        `and(status.eq.processing,started_at.lt.${processingBefore})`,
    )
    .order('created_at')
    .limit(10);

  let next: string | undefined;
  for (const job of stuck ?? []) {
    if (job.attempts >= MAX_ATTEMPTS) {
      await finish(job.id, job.video_path, { status: 'failed', error: 'Gave up after retries' });
    } else {
      next ??= job.id;
    }
  }
  // Frame jobs that never reported back: drop the video, keep the card.
  const framesBefore = new Date(now - 20 * 60_000).toISOString();
  const { data: lostFrames } = await db
    .from('jobs')
    .select('id, video_path')
    .eq('frames_status', 'pending')
    .lt('updated_at', framesBefore);
  for (const job of lostFrames ?? []) {
    if (job.video_path) await removeVideo(job.video_path);
    await db.from('jobs').update({ frames_status: 'failed', video_path: null }).eq('id', job.id);
  }

  // One job per run keeps us inside the wall-clock limit and Gemini's RPM.
  if (next) await processJob(next);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const workerSecret = req.headers.get('x-worker-secret');
  if (workerSecret !== null) {
    if (workerSecret !== Deno.env.get('INGEST_WORKER_SECRET')) return json({ error: 'Forbidden' }, 403);
    EdgeRuntime.waitUntil(sweep());
    return json({ ok: true }, 202);
  }

  try {
    return await handleUpload(req);
  } catch (err) {
    console.error('ingest failed', err);
    return json({ error: 'Internal error' }, 500);
  }
});
