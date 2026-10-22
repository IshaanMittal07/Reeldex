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

const PROMPT_VERSION = 'extract.v2';
const MAX_ATTEMPTS = 3;
const MAX_BYTES = 50 * 1024 * 1024;
const BUCKET = 'incoming';
// Gemini names .mov as video/mov, iOS sends video/quicktime.
const GEMINI_MIME: Record<string, string> = { 'video/mp4': 'video/mp4', 'video/quicktime': 'video/mov' };

const promptTemplate = Deno.readTextFile(new URL('../../../prompts/extract.v2.md', import.meta.url));

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

async function handleUpload(req: Request) {
  const userId = await userFromToken(req.headers.get('x-reeldex-token'));
  if (!userId) {
    // Read the unread video first: replying mid-upload stalls the connection and
    // the Shortcut shows "network connection was lost" instead of this error.
    await req.arrayBuffer().catch(() => {});
    return json({ error: 'Invalid or missing x-reeldex-token' }, 401);
  }

  const upload = await readUpload(req);
  if (!upload || upload.bytes.byteLength === 0) return json({ error: 'No video in request' }, 400);
  upload.mimeType = sniffMime(upload.bytes, upload.mimeType);
  upload.url = reelUrl(upload.url);
  if (upload.bytes.byteLength > MAX_BYTES) return json({ error: 'Video is over 50 MB' }, 413);
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
  const { error: storeError } = await db.storage
    .from(BUCKET)
    .upload(videoPath, upload.bytes, { contentType: upload.mimeType });
  if (storeError) return json({ error: `Storage: ${storeError.message}` }, 500);

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
    if (!bytes) {
      const { data, error } = await db.storage.from(BUCKET).download(job.video_path);
      if (error || !data) throw new Error(`Video missing from storage: ${error?.message}`);
      bytes = new Uint8Array(await data.arrayBuffer());
    }

    const mimeType = GEMINI_MIME[job.mime_type ?? 'video/mp4'] ?? 'video/mp4';
    let file = await uploadFile(bytes, mimeType, jobId);
    geminiFile = file.name;
    file = await waitUntilActive(file);

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
    if (card.key_frames?.length && (await dispatchFrames(jobId))) {
      await db
        .from('jobs')
        .update({ status: 'done', error: null, frames_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', jobId);
    } else {
      await finish(jobId, job.video_path, { status: 'done', error: null });
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
  if (videoPath) await db.storage.from(BUCKET).remove([videoPath]);
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
    if (job.video_path) await db.storage.from(BUCKET).remove([job.video_path]);
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
