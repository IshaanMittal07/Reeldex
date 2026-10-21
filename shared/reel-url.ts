// Pull a clean Instagram link out of any text (a share-sheet URL, the clipboard,
// "Check out this reel https://…?igsh=…"). Drops tracking params so the same
// reel always has the same link. Used by the ingest function and the app.
const INSTAGRAM = /https?:\/\/(?:www\.)?instagram\.com\/(reels?|p|tv)\/([\w-]+)/i;

export function reelUrl(text: string | null | undefined): string | null {
  const match = text?.match(INSTAGRAM);
  if (!match) return null;
  const kind = match[1].toLowerCase() === 'reels' ? 'reel' : match[1].toLowerCase();
  return `https://www.instagram.com/${kind}/${match[2]}/`;
}
