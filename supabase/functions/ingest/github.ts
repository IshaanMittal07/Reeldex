// Starts .github/workflows/process-reel.yml, which turns the reel into a card
// with Gemini and cuts its frames. It runs on a free Actions runner because a
// long reel needs more than the Edge Function's 150 s.
// Returns null once started, or why not (saved on the job).

export async function dispatchJob(jobId: string) {
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
    body: JSON.stringify({
      event_type: 'process-reel',
      // Model names are config (Supabase secrets), not secret, so they travel in the payload.
      client_payload: {
        job_id: jobId,
        model: Deno.env.get('GEMINI_MODEL'),
        budget_model: Deno.env.get('GEMINI_MODEL_BUDGET'),
      },
    }),
  });
  if (res.ok) return null;
  const reason = `GitHub dispatch ${res.status}: ${(await res.text()).slice(0, 200)}`;
  console.error('dispatch failed', reason);
  return reason;
}
