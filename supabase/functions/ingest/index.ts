// POST /functions/v1/ingest
//   From the iOS Shortcut: header `x-reeldex-token: rdx_...`, plus `?url=` (the
//   reel link). The body is empty (the server fetches the video from Instagram),
//   the raw video bytes, or multipart/form-data (field `video`). Stores the
//   video, replies 202 with the job id and starts the GitHub Actions worker
//   (tools/worker), which makes the card and cuts the frames.
//   From pg_cron: header `x-worker-secret`, body {"sweep": true}. Restarts stuck jobs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';

import { reelUrl } from '../../../shared/reel-url.ts';
import { dispatchJob } from './github.ts';
import { downloadVideo, fetchCaption, fetchEmbed } from './instagram.ts';

const MAX_ATTEMPTS = 3;
// The whole video sits in memory (256 MB on the free plan), so stay well under that.
const MAX_BYTES = 120 * 1024 * 1024;
const BUCKET = 'incoming';
// Free-plan Storage caps each file at 50 MB, so bigger videos are stored as
// numbered parts: <path>, <path>.1, <path>.2 ...
const PART_BYTES = 45 * 1024 * 1024;
const MAX_PARTS = Math.ceil(MAX_BYTES / PART_BYTES);
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

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
  if (VIDEO_TYPES.includes(declared)) return declared;
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
    // A view, not a Blob: a 120 MB video must not be copied again (256 MB memory).
    const part = bytes.subarray(i * PART_BYTES, (i + 1) * PART_BYTES);
    const { error } = await db.storage.from(BUCKET).upload(partPath(path, i), part, { contentType });
    if (error) return error;
  }
  return null;
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

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) {
    await req.body?.cancel().catch(() => {});
    return json({ error: `Video is over the ${MAX_BYTES / 1024 / 1024} MB limit` }, 413);
  }

  const upload = await readUpload(req);
  if (!upload) return json({ error: 'No video in request' }, 400);
  upload.url = reelUrl(upload.url);

  // Link only (Shortcut v4): fetch the video from Instagram's public embed page.
  // Shortcuts sends an empty JSON body ("{}") for a POST without a file.
  const downloaded = upload.bytes.byteLength < 1024;
  if (downloaded) {
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
  } else if (!upload.caption && upload.url) {
    // Uploaded video: still read the caption (often the full recipe) from Instagram.
    upload.caption = await fetchCaption(upload.url);
  }

  upload.mimeType = sniffMime(upload.bytes, upload.mimeType);
  if (upload.bytes.byteLength > MAX_BYTES) {
    const mb = (upload.bytes.byteLength / 1024 / 1024).toFixed(1);
    return json({ error: `Video is ${mb} MB; the limit is ${MAX_BYTES / 1024 / 1024} MB` }, 413);
  }
  if (!VIDEO_TYPES.includes(upload.mimeType)) return json({ error: `Unsupported type ${upload.mimeType}` }, 415);

  // Downloaded reels are deduped by link above. Hashing copies the whole video,
  // which a 120 MB download can't afford next to the bytes themselves.
  const videoHash = downloaded ? null : await sha256Hex(upload.bytes);
  if (videoHash) {
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
  if (jobError) {
    await removeVideo(videoPath);
    return json({ error: `Jobs: ${jobError.message}` }, 500);
  }

  // Not started: keep the reason on the job; the sweeper tries again within 5 minutes.
  const dispatchError = await dispatchJob(jobId);
  if (dispatchError) await db.from('jobs').update({ error: dispatchError }).eq('id', jobId);
  return json({ job_id: jobId, status: 'queued' }, 202);
}

// Out of attempts: the video is never kept (plan Section 4).
async function fail(jobId: string, videoPath: string | null, error: string) {
  if (videoPath) await removeVideo(videoPath);
  await db
    .from('jobs')
    .update({ status: 'failed', error, video_path: null, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}

// Restarts jobs whose worker never started or died. The worker's own timeout is
// 25 minutes, so anything "processing" for 30 has died.
async function sweep() {
  const now = Date.now();
  const queuedBefore = new Date(now - 3 * 60_000).toISOString();
  const processingBefore = new Date(now - 30 * 60_000).toISOString();
  const { data: stuck } = await db
    .from('jobs')
    .select('id, status, attempts, video_path, error')
    .or(
      `and(status.eq.queued,updated_at.lt.${queuedBefore}),` +
        `and(status.eq.processing,started_at.lt.${processingBefore})`,
    )
    .order('created_at')
    .limit(10);

  // Attempts only count worker runs, so a broken dispatch (e.g. an expired GitHub
  // token) keeps retrying until it's fixed instead of failing the reel.
  for (const job of stuck ?? []) {
    if (job.attempts >= MAX_ATTEMPTS) {
      await fail(job.id, job.video_path, job.error ?? 'Gave up after retries');
      continue;
    }
    // Requeue before dispatching (the worker only claims queued jobs), and only
    // if nothing touched the job since it was read.
    const { data: requeued } = await db
      .from('jobs')
      .update({ status: 'queued', updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', job.status)
      .eq('attempts', job.attempts)
      .select('id');
    if (!requeued?.length) continue;
    const dispatchError = await dispatchJob(job.id);
    if (dispatchError) await db.from('jobs').update({ error: dispatchError }).eq('id', job.id);
  }
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
