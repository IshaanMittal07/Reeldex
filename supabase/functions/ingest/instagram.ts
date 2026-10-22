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

export async function downloadVideo(videoUrl: string, maxBytes: number) {
  const res = await fetch(videoUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Instagram video ${res.status}`);
  if (Number(res.headers.get('content-length') ?? 0) > maxBytes) throw new Error('Instagram video too large');
  return new Uint8Array(await res.arrayBuffer());
}
