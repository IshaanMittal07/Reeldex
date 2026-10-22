<div align="center">

<img src="assets/icon/icon-1024.png" alt="Reeldex icon" width="140" />

# Reeldex

**The reels you save, turned into notes you actually use.**

[Open the app](https://reeldex.expo.app) · [How it works](#how-it-works) · [Build the Shortcut](docs/ios-shortcut.md)

![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge-3ECF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-video%20understanding-4285F4?logo=googlegemini&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Cost](https://img.shields.io/badge/running%20cost-%240-0E9F5A)

</div>

---

## The problem

You know the move. A reel comes up with a resume trick, a cold DM template that
actually got someone a reply, a four-ingredient protein recipe. You tap save.
You never see it again.

Instagram's Saved folder is where good advice goes to die. It's a wall of
thumbnails with no search, no way to tell a resume tip from a recipe, and
nothing you can copy. To find the template you need, you have to rewatch
twelve reels while someone talks over trending audio.

## What Reeldex does

Share a reel to Reeldex and, about a minute later, you have a **card**:

- 📌 **The point, in one line.** No rewatching.
- ✅ **A checklist of steps** you can copy straight into your notes.
- 🕒 **Key points with timestamps**, in case you want to check the source.
- 🔗 **Every tool, link and promo code** mentioned, copied exactly as shown.
- ✉️ **Templates you can copy**, for cold DMs, outreach messages and resume bullets.
- ⚠️ **Warnings** when health or fitness advice is sketchy, instead of quietly passing it on.
- 🎬 **A link back to the original reel.**

Cards are sorted into categories (resume, cold DMs, opportunities, student
perks, fitness, food and more), and you can search all of them.

> **Example.** A 40-second reel about Waterloo students getting free PitchBook
> access became a card titled *"Access Waterloo Alumni Contacts on PitchBook
> for Co-op Referrals"*. It has four timestamped key points, the PitchBook URL
> read off the screen, and a five-step checklist ending in "draft an outreach
> message to request co-op referrals."

## How it works

```
 Instagram ── Download ──▶ Photos ── Share ──▶ Reeldex Shortcut (iOS)
                                                   │  shrinks to 540p,
                                                   │  attaches the reel link
                                                   ▼
                                  Supabase Edge Function  `ingest`
                                  token check · dedupe · quota · 202
                                                   │  background task
                                                   ▼
                                  Gemini watches the video, reads the
                                  on-screen text, listens to the audio
                                                   │  JSON, validated with Zod
                                                   ▼
                                  Postgres `cards`  ──realtime──▶  Reeldex web app
```

A few decisions worth knowing about:

- **No scraping.** Instagram has no API for reel content, and downloading from
  it is against its terms and App Store rules. So Reeldex never fetches
  anything itself: you download the reel with Instagram's own Download button
  and share the file. Reeldex just processes a video you handed it.
- **No App Store, no Mac, no cost.** The phone side is an iOS Shortcut plus a
  web app added to the Home Screen, which sidesteps the $99/year developer
  account entirely. Everything runs on free tiers: Supabase, the Gemini API
  and EAS Hosting.
- **Videos aren't kept.** Each one is deleted from storage, and from Gemini,
  as soon as its card is saved.
- **Built to fail gracefully.** If Gemini hits its daily limit, the function
  falls back to a lighter model. Jobs that stall are retried by a `pg_cron`
  sweeper every five minutes. Re-sharing a video you've already sent doesn't
  make a duplicate card.
- **Your data is yours.** Row Level Security is on every table. The Shortcut
  signs in with a personal token, and the database stores only its SHA-256 hash.

## Tech stack

| Layer | What |
|---|---|
| App | Expo SDK 57 · Expo Router · React Native Web · TypeScript |
| Backend | Supabase Postgres, Auth, Storage, Realtime, Edge Functions (Deno), `pg_cron` |
| AI | Gemini video understanding, with structured JSON output checked against a shared schema |
| Hosting | EAS Hosting at [reeldex.expo.app](https://reeldex.expo.app) |
| Capture | iOS Shortcuts: Encode Media → POST to the Edge Function |

## Project layout

```
src/app/                    screens: sign-in, library, card, settings
src/components/             card sections, category chips, reel link, tab bar
supabase/functions/ingest/  upload → Gemini → card (REST, no SDK, fits the 5 MB bundle limit)
supabase/migrations/        schema, RLS, ingest tokens, retry sweeper, realtime
shared/                     card schema and link cleanup, used by both app and backend
prompts/                    versioned extraction prompts
docs/                       product plan and Shortcut guide
```

## Run it yourself

```bash
cp .env.example .env              # Gemini key, Supabase URL + publishable key
npm install
npx expo start --web
```

Backend:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=... GEMINI_MODEL_BUDGET=...
npx supabase functions deploy ingest --use-api
```

Ship the web app:

```bash
npx expo export --platform web --clear
npx eas-cli@latest deploy --prod
```

Then follow [docs/ios-shortcut.md](docs/ios-shortcut.md) to set up the Shortcut on your iPhone.

## What's next

- [ ] Richer cards for every category (recipes with amounts and times, workouts with sets and reps)
- [ ] A test set of 100 reels so prompt changes are scored, not guessed
- [ ] Export a card as an image or PDF
- [ ] Offline reading

---

<div align="center">
<sub>Built by <a href="https://github.com/IshaanMittal07">Ishaan Mittal</a>. Personal project, not affiliated with Instagram or Meta.</sub>
</div>
