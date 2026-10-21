# Reeldex

Turn the reels you save into notes, guides and checklists you actually use.

**App:** https://reeldex.expo.app (add it to your iPhone Home Screen from Safari: Share → Add to Home Screen)

## How it works

```
Instagram "Download" → Photos → Share → Reeldex Shortcut
   → Supabase Edge Function `ingest` (token auth, stores video, replies 202)
   → Gemini extracts a card in the background → Postgres `cards`
   → web app updates live (Supabase Realtime)
```

Everything runs on free tiers: Supabase (Postgres, Storage, Edge Functions, pg_cron),
Gemini API, and EAS Hosting. See [docs/Reeldex_Project_Plan.md](docs/Reeldex_Project_Plan.md).

## Layout

| Path | What |
|---|---|
| `src/app/` | Expo Router screens: sign-in, library, card detail, settings |
| `src/lib/` | Supabase client, session provider, types |
| `supabase/functions/ingest/` | Edge Function: upload → Gemini → card |
| `supabase/migrations/` | Schema, RLS, ingest tokens, sweeper cron |
| `shared/schemas/card.ts` | Card JSON Schema + Zod validator (used by the script and the function) |
| `prompts/` | Versioned extraction prompts |
| `docs/ios-shortcut.md` | How to build the iPhone Shortcut |

## Setup

```bash
cp .env.example .env            # fill in the values
npm install
npx expo start --web            # local dev
```

Backend (Supabase CLI, run from this folder):

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=... GEMINI_MODEL_BUDGET=...
npx supabase functions deploy ingest --use-api
```

Deploy the web app:

```bash
npx expo export --platform web --clear
npx eas-cli@latest deploy --prod
```

Try the extractor on one local video: `npm run extract -- eval/videos/reel.mp4`.
