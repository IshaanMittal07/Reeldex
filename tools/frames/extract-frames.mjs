// Cuts a job's key frames with ffmpeg, stores them in the private `frames`
// bucket, records them on the card, then deletes the video (plan Section 4).
// Usage: node tools/frames/extract-frames.mjs <job_id>
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY (service access; bypasses RLS).
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const jobId = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(jobId ?? '')) throw new Error(`Bad job id: ${jobId}`);

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// "mm:ss", "h:mm:ss" or plain seconds.
function toSeconds(timestamp) {
  return String(timestamp)
    .split(':')
    .reduce((total, part) => total * 60 + Number(part), 0);
}

const { data: job } = await db
  .from('jobs')
  .select('id, user_id, video_path, frames_status')
  .eq('id', jobId)
  .maybeSingle();
if (!job || job.frames_status !== 'pending' || !job.video_path) {
  console.log('Nothing to do for', jobId);
  process.exit(0);
}

let frames = [];
try {
  const { data: card, error: cardError } = await db
    .from('cards')
    .select('id, data')
    .eq('job_id', jobId)
    .single();
  if (cardError) throw cardError;

  const dir = mkdtempSync(join(tmpdir(), 'frames-'));
  const video = join(dir, 'video');
  const { data: blob, error: downloadError } = await db.storage.from('incoming').download(job.video_path);
  if (downloadError) throw downloadError;
  writeFileSync(video, Buffer.from(await blob.arrayBuffer()));

  const duration = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]),
  );

  for (const [i, frame] of (card.data.key_frames ?? []).entries()) {
    // Clamp: the model's timestamps are approximate and can overshoot the end.
    const at = Math.max(0, Math.min(toSeconds(frame.timestamp), duration - 0.5));
    const out = join(dir, `${i}.jpg`);
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '3', '-y', out]);
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

  await db.from('cards').update({ frames }).eq('id', card.id);
  console.log(`Saved ${frames.length} frame(s) for card ${card.id}`);
} finally {
  // Always drop the video, even if cutting failed.
  await db.storage.from('incoming').remove([job.video_path]);
  await db
    .from('jobs')
    .update({ frames_status: frames.length ? 'done' : 'failed', video_path: null, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}
