// Starts .github/workflows/frames.yml, which cuts the key frames with ffmpeg.
// Edge Functions can't decode video (2 s CPU), so this runs on a free Actions runner.
// Returns null once started, or why not (saved on the job) so the caller can fall back.

export async function dispatchFrames(jobId: string) {
  const token = Deno.env.get('GITHUB_DISPATCH_TOKEN');
  const repo = Deno.env.get('GITHUB_REPO');
  if (!token || !repo) return 'GITHUB_DISPATCH_TOKEN or GITHUB_REPO not set';

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'reeldex-ingest',
    },
    body: JSON.stringify({ event_type: 'extract-frames', client_payload: { job_id: jobId } }),
  });
  if (res.ok) return null;
  const reason = `GitHub dispatch ${res.status}: ${(await res.text()).slice(0, 200)}`;
  console.error('frames dispatch failed', reason);
  return reason;
}
