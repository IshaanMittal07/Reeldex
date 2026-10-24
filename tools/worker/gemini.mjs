// Gemini over plain REST (fetch): upload the video to the Files API, wait until
// it's processed, then ask for the card as structured JSON.

const BASE = 'https://generativelanguage.googleapis.com';

// Carries the HTTP status so the caller can retry overload (503) and rate limits (429).
export class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

async function check(res, what) {
  if (res.ok) return res;
  const body = await res.text();
  throw new GeminiError(`${what} failed: ${res.status} ${body.slice(0, 300)}`, res.status);
}

export async function uploadFile(bytes, mimeType, displayName) {
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
  return (await done.json()).file;
}

// Long videos can take a few minutes to process; there's no wall-clock limit here.
export async function waitUntilActive(file, timeoutMs = 5 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (file.state !== 'ACTIVE') {
    if (file.state === 'FAILED') throw new Error('Gemini could not process the video');
    if (Date.now() > deadline) throw new Error('Gemini file processing timed out');
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/v1beta/${file.name}`, { headers: { 'x-goog-api-key': apiKey() } });
    file = await (await check(res, 'Gemini file get')).json();
  }
  return file;
}

export async function deleteFile(name) {
  await fetch(`${BASE}/v1beta/${name}`, { method: 'DELETE', headers: { 'x-goog-api-key': apiKey() } });
}

export async function extract({ model, prompt, fileUri, mimeType, schema }) {
  const res = await fetch(`${BASE}/v1beta/interactions`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system_instruction: prompt,
      input: [{ type: 'video', uri: fileUri, mime_type: mimeType }],
      response_format: { type: 'text', mime_type: 'application/json', schema },
      store: false,
    }),
  });
  const interaction = await (await check(res, `Gemini ${model}`)).json();
  const text = (interaction.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');
  if (!text) throw new Error('Gemini returned no text');
  return text;
}
