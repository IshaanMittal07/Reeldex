// Gemini over plain REST (fetch). The SDK is too big for the 5 MB `--use-api`
// bundle limit; this mirrors what scripts/extract-one.ts does with the SDK.

const BASE = 'https://generativelanguage.googleapis.com';

type GeminiFile = { name: string; uri: string; state: string; mimeType: string };

export class RateLimitError extends Error {}

function apiKey() {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

async function check(res: Response, what: string) {
  if (res.ok) return res;
  const body = await res.text();
  const msg = `${what} failed: ${res.status} ${body.slice(0, 500)}`;
  throw res.status === 429 ? new RateLimitError(msg) : new Error(msg);
}

export async function uploadFile(bytes: Uint8Array, mimeType: string, displayName: string) {
  const start = await fetch(`${BASE}/upload/v1beta/files`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey(),
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(bytes.byteLength),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  }).then((r) => check(r, 'Gemini upload start'));

  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini upload start returned no upload URL');

  const done = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
    body: bytes,
  }).then((r) => check(r, 'Gemini upload'));
  return ((await done.json()) as { file: GeminiFile }).file;
}

export async function waitUntilActive(file: GeminiFile, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (file.state !== 'ACTIVE') {
    if (file.state === 'FAILED') throw new Error('Gemini could not process the video');
    if (Date.now() > deadline) throw new Error('Gemini file processing timed out');
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/v1beta/${file.name}`, { headers: { 'x-goog-api-key': apiKey() } });
    file = (await (await check(res, 'Gemini file get')).json()) as GeminiFile;
  }
  return file;
}

export async function deleteFile(name: string) {
  await fetch(`${BASE}/v1beta/${name}`, { method: 'DELETE', headers: { 'x-goog-api-key': apiKey() } });
}

type Interaction = { steps?: { type: string; content?: { type: string; text?: string }[] }[] };

export async function extract(opts: {
  model: string;
  prompt: string;
  fileUri: string;
  mimeType: string;
  schema: unknown;
}) {
  const res = await fetch(`${BASE}/v1beta/interactions`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      system_instruction: opts.prompt,
      input: [{ type: 'video', uri: opts.fileUri, mime_type: opts.mimeType }],
      response_format: { type: 'text', mime_type: 'application/json', schema: opts.schema },
      store: false,
    }),
  });
  const interaction = (await (await check(res, `Gemini ${opts.model}`)).json()) as Interaction;
  const text = (interaction.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');
  if (!text) throw new Error('Gemini returned no text');
  return text;
}
