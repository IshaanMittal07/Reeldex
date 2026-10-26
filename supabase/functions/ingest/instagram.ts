// Reads a public reel's caption and video from Instagram's embed page, which
// needs no login. Best effort: returns nulls if Instagram blocks us or the page
// layout changes.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(html: string) {
  return html.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function parseCaption(html: string) {
  // <div class="Caption"><a class="CaptionUsername">name</a> caption <div class="CaptionComments">
  const match = html.match(/class="Caption">\s*<a[^>]*class="CaptionUsername"[^>]*>.*?<\/a>(.*?)(?:<div|<\/div>)/s);
  if (!match) return null;
  const text = decode(match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || null;
}

// The video URL sits in an escaped JSON blob: video_url\":\"https:\/\/...mp4?...&...
function parseVideoUrl(html: string) {
  const match = html.match(/video_url[\\"]+:[\\"]+(https:.*?)[\\]*"/);
  return match ? match[1].replace(/\\+u0026/g, '&').replace(/\\/g, '') : null;
}

export async function fetchEmbed(reelUrl: string) {
  try {
    const res = await fetch(`${reelUrl.replace(/\/$/, '')}/embed/captioned/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; reeldex)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { caption: null, videoUrl: null };
    const html = await res.text();
    return { caption: parseCaption(html), videoUrl: parseVideoUrl(html) };
  } catch {
    return { caption: null, videoUrl: null };
  }
}

export async function fetchCaption(reelUrl: string) {
  return (await fetchEmbed(reelUrl)).caption;
}

// Streams into one buffer (a plain arrayBuffer() briefly holds the video twice,
// too much for 256 MB). Gives up after 20 s without data, or 100 s in all.
export async function downloadVideo(videoUrl: string, maxBytes: number) {
  const controller = new AbortController();
  const total = setTimeout(() => controller.abort(), 100_000);
  let idle = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(videoUrl, { signal: controller.signal });
    if (!res.ok || !res.body) throw new Error(`Instagram video ${res.status}`);
    const length = Number(res.headers.get('content-length') ?? 0);
    if (length > maxBytes) throw new Error('Instagram video too large');

    let buffer = new Uint8Array(length || 16 * 1024 * 1024);
    let size = 0;
    for await (const chunk of res.body) {
      clearTimeout(idle);
      idle = setTimeout(() => controller.abort(), 20_000);
      if (size + chunk.byteLength > maxBytes) throw new Error('Instagram video too large');
      if (size + chunk.byteLength > buffer.byteLength) {
        const grown = new Uint8Array(Math.min(maxBytes, Math.max(buffer.byteLength * 2, size + chunk.byteLength)));
        grown.set(buffer.subarray(0, size));
        buffer = grown;
      }
      buffer.set(chunk, size);
      size += chunk.byteLength;
    }
    return buffer.subarray(0, size);
  } catch (err) {
    if (controller.signal.aborted) throw new Error('Instagram download timed out');
    throw err;
  } finally {
    clearTimeout(total);
    clearTimeout(idle);
  }
}
