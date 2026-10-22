// Reads a reel's caption from Instagram's public embed page, which needs no login.
// Best effort: returns null if Instagram blocks us or the page layout changes.

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

export async function fetchCaption(reelUrl: string) {
  try {
    const res = await fetch(`${reelUrl.replace(/\/$/, '')}/embed/captioned/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; reeldex)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // <div class="Caption"><a class="CaptionUsername">name</a> caption <div class="CaptionComments">
    const match = html.match(/class="Caption">\s*<a[^>]*class="CaptionUsername"[^>]*>.*?<\/a>(.*?)(?:<div|<\/div>)/s);
    if (!match) return null;
    const text = decode(match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
