# Reeldex — Product & Engineering Plan

**Turn the reels you save into notes, guides and checklists you actually use.**

| | |
|---|---|
| Prepared | October 16, 2026 |
| Roles covered | Project manager, product designer, mobile dev, backend dev, AI engineer, QA, launch |
| Status | Plan, ready to start Sprint 0 |
| Research basis | Two research passes run today (AI/stack/costs; Instagram rules/competitors/naming). Sources at the end. |

---

## 0. Read this first: five things that shape the whole project

These are the facts that will make or break the app. The rest of the plan is built around them.

1. **There is no official Instagram API that gives you a reel's video, audio or caption.** Every Instagram API needs a business/creator account, the old personal-account API was shut down in December 2024, and oEmbed returns only embed HTML. Anything that "pulls the video from a link" is scraping.
2. **Apple will reject an app that downloads video from Instagram.** App Store Review Guideline 5.2.3 bans saving or downloading media from third-party sources without their explicit permission, and 5.2.2 says you need the other service's permission to access its content. Developers report real rejections under 5.2.3. Instagram's own Terms also forbid automated collection.
3. **The legal way in exists and it's good enough.** Instagram has a built-in **Download** button on public reels (unless the creator turned it off). The user downloads the reel themselves, then shares that file to Reeldex. Because the *user* did the downloading, Reeldex is just processing a file the user gave it, like any video editor. This is the core ingestion path.
4. **"Free" has one unavoidable cost on iPhone.** Apple charges **$99 USD/year** to publish on the App Store (or even TestFlight). The fee waiver doesn't cover individuals or students. Google Play is **$25 one-time**. Everything else (AI, backend, builds) can run on free tiers at your scale. Section 11 covers free ways to use it yourself before you pay.
5. **The best AI for this job is Google Gemini, because it watches the video directly** (picture + sound + on-screen text in one call). Claude and OpenAI's APIs don't take video files. Gemini's free tier is usable for development and early users, but **you must be 18+ to use the Gemini API**, and free-tier data may be used by Google to improve its products, so your privacy policy must say so.

---

## 1. App name

### Recommendation: **Reeldex**

*Reel + index (like a Pokédex for everything you've saved).* Short, ownable, easy to say, and no existing app with this exact name turned up in today's search.

**App Store listing (App Store Optimization — "ASO", which is what "ATS-optimized" means for app stores):**

| Field | Limit | Value | Length |
|---|---|---|---|
| App name | 30 chars | `Reeldex: Video Notes & Guides` | 29 |
| Subtitle | 30 chars | `AI tips, templates & plans` | 26 |
| Keyword field | 100 bytes | `resume,cold dm,workout,meal plan,student,discount,glowup,summarize,guide,checklist,internship` | 93 |
| Google Play title | 30 chars | `Reeldex: Video Notes & Guides` | 29 |
| Play short description | 80 chars | `Turn saved videos into resume tips, workout plans, DM templates & checklists.` | 77 |

Why it's built this way:
- The **name field carries the most search weight**, so it holds the two highest-intent terms: "video notes" and "guides".
- **Don't put "Instagram", "IG", "Reels" or "TikTok" in the name, icon, subtitle or keywords.** Guidelines 2.3.7 and 4.1(c) ban other companies' trademarks in metadata, and it's an easy rejection. You can say "works with videos you save from social apps" in the description.
- Keywords don't repeat words already in the name (Apple indexes the name already, so repeats waste bytes).
- On Google Play there's no keyword field; the full description (4,000 chars) is indexed, so work the category words in naturally there.

**Backups** (no exact-match app found today): **Keepwise**, **Scrollsmith**.
**Avoid** (already taken): ReelMind, SaveSense, Clipwise.

**Before you commit (15 min):** search the name in the App Store and Play Store on your phone, try reserving it in App Store Connect (it rejects names in use), search the USPTO and CIPO (Canada) trademark databases, and grab the domain (e.g. `reeldex.app`) and the social handles.

---

## 2. The product

### Problem
You save reels that are genuinely useful (a resume trick, a cold-DM script, a free student perk, a workout split) and never open them again. The useful part is trapped in a 45-second video, buried in a Saved folder with hundreds of others.

### Solution
Share a reel to Reeldex → in ~20 seconds you get a clean, structured card: the key points, any templates written out word-for-word, step-by-step guides, links and resources mentioned, deadlines, and a checklist you can tick off. Everything is searchable and sorted into collections.

### Target user
Students and early-career people (you're user #1) who save advice content about careers, money, fitness, food and self-improvement.

### Competitors and how Reeldex wins

| App | What it does | Price | Gap Reeldex fills |
|---|---|---|---|
| Recall | Summarizes TikToks, YouTube, podcasts, articles | Free 10/mo; $10–38/mo | General summarizer, not structured guides |
| Fofo | Organizes saved videos, recipes from links | $4.99/mo Pro | Recipe-heavy |
| SousChef AI | Reels → recipes | Free 5/mo; $7.99/mo | Food only |
| ReelSave | Bookmarks + AI summaries | Free 25–50/mo | Summaries, not actionable output |
| Pestle | Recipes from reel captions | Freemium | Caption only, food only |

**Reeldex's edge:** category-specific output. A cold-DM reel produces a copy-ready message template. A student-perk reel produces "what, how to claim, eligibility, link". A workout reel produces a sets × reps table. A competitor gives you a paragraph; Reeldex gives you the thing you'd actually use. Plus it's free.

---

## 3. Features

### MVP (v1.0 — what you build first)
1. **Share to Reeldex** from the iOS/Android share sheet (video file or link).
2. **Import from Photos/Files** (for reels you downloaded or screen-recorded).
3. **AI extraction** into a category-specific card (Section 5).
4. **Resources panel:** every link, @handle, website, app, product, tool or promo code mentioned, with a "search the web" button for each.
5. **Visual guide view:** steps, checklists (tickable), tables, templates with a Copy button.
6. **Library:** auto-sorted collections by category, full-text search, pin and tag.
7. **Edit any card** (AI makes mistakes; you get the final say).
8. **Export/share a card** as an image or PDF.
9. **Sign in with Apple / Google**, synced across devices.

### v1.1–v1.3 (after launch)
- **Deadlines → reminders** ("Applications close Nov 30" becomes a notification / calendar event).
- **Resource verification:** checks that links still work and that a "free student perk" still exists (web search grounding), flagged "verified today" or "couldn't confirm".
- **"Ask your library":** "what were those resume tips about metrics?" answered across all your saved cards.
- **Weekly digest:** "You saved 6 reels this week, here are your 3 action items."
- **Merge:** combine 5 workout reels into one weekly plan.
- Home-screen widget: "one tip from your library".

### Out of scope (deliberately)
- Auto-importing your Instagram Saved folder (needs your login and scraping; banned).
- Re-hosting or replaying the creator's video (Reeldex keeps notes and a link back, not the video).

---

## 4. How a reel gets in (the legal ingestion design)

```
Path A — Video file (best quality, primary path)
Instagram → ⋯ → Download  →  Photos  →  Share → Reeldex
            (user downloads with Instagram's own button)

Path B — Link only (fallback when Download is off)
Instagram → Share → Reeldex (receives the URL)
   → Reeldex saves the link, shows "Add the video for full notes",
     offers: screen-record it, or paste the caption

Path C — Screen recording
Control Center → Screen Record the reel → Share the recording → Reeldex
```

Rules the code follows (these are what keep you inside Apple's rules and Instagram's Terms):
- **The server never fetches anything from instagram.com.** No yt-dlp, no scraping APIs, no "paste a link and we download it".
- The video is processed and then **deleted within 24 hours** (immediately on success). Only the notes, a thumbnail frame you generated, and the original link are kept.
- Every card shows the creator's @handle (read from the watermark/on-screen text when present) and an "Open original" link. Credit the creator.
- In the App Review notes, explain exactly this: "Users import video files they have downloaded with Instagram's built-in download feature, or recorded themselves. The app does not download media from any third-party service."

**Test on a real device in Sprint 1:** what exactly Instagram's iOS and Android share sheets hand to other apps (URL only, or URL + text). Today's research couldn't confirm it; build Path B to handle "URL only".

---

## 5. The AI: what it extracts and how

### 5.1 Model choice

| Role | Model | Why | Cost per 60-sec reel |
|---|---|---|---|
| **Primary** | **Gemini 3.8 Flash** (native video input) | Watches frames at 1 fps + hears audio + reads on-screen text in one call; strong at structured JSON | Free tier; ~$0.02 paid (≈$0.01 at low resolution). Paid prices double Jan 1, 2027 → ~$0.04 |
| **Budget** | Gemini 3.5 Flash-Lite | Same video input, cheaper | Free tier; ~$0.006–0.009 paid |
| **Fallback** (if Gemini is down or quota is hit) | Groq Whisper (transcript) + ~15 frames + Claude Haiku 5.5 | Text + images pipeline, very cheap | ~$0.003 |

Notes:
- Gemini's free-tier rate limits are no longer published; check your project's limits in Google AI Studio. Design for low limits (queue + retries, Section 6).
- **Gemini's free tier isn't allowed for apps serving EEA/UK/Swiss users.** Either geo-limit the launch to Canada/US first, or use the paid tier for those regions.
- Groq's free tier allows ~480 one-minute transcriptions a day, plenty for the fallback.
- Model names and prices change fast. Keep the model name in a config value, never hard-coded, so you can swap in one line.

### 5.2 The extraction pipeline (the in-app AI "agents")

Each step is a small, testable function. Steps 2–4 run in **one** Gemini call to keep it fast and cheap; steps 5–6 are separate.

| # | Agent | Job | Output |
|---|---|---|---|
| 1 | **Ingest** | Validate file (≤3 min, ≤50 MB), compress to 720p if needed, hash it (dedupe) | Clean video + hash |
| 2 | **Perceive** | Transcribe speech, read ALL on-screen text (including fast-flashing text and captions), note what's shown | Transcript + OCR text + visual notes |
| 3 | **Classify** | Pick 1 primary + up to 2 secondary categories with confidence | `category`, `confidence` |
| 4 | **Extract** | Fill the category's schema (Section 5.3). Only facts present in the reel. | Structured JSON |
| 5 | **Critic / verifier** | Second, cheap pass: compare JSON against the transcript+OCR; remove anything not supported; flag unsafe advice; fix schema errors | Validated JSON + warnings |
| 6 | **Resource resolver** (v1.1) | For each named resource, find the official URL, check it's live, mark verified/unverified | Enriched resources |
| 7 | **Renderer** (in the app, not AI) | Turns JSON into native visual cards | The screen you see |

### 5.3 Category schemas (what "the important information" means per category)

Every card shares a **base**: `title`, `one_line_summary`, `key_points[]`, `resources[]` (name, type: link/app/website/handle/product/code, url_if_shown, verified), `creator_handle`, `action_items[]`, `confidence`, `warnings[]`, `source_timestamps` (where in the video each point came from).

Then each category adds its own fields:

| Category | Extra fields | Visual it renders as |
|---|---|---|
| **Resume** | `do[]`, `dont[]`, `before_after_examples[]` (bullet rewrites), `sections_mentioned`, `tools[]` (e.g. resume checkers) | Do/Don't columns + before→after examples |
| **Applying / job search** | `steps[]`, `where_to_apply[]`, `timeline`, `deadlines[]`, `eligibility` | Numbered steps + deadline chips |
| **Cold DM / outreach** | `templates[]` (verbatim text, platform, purpose), `follow_up_rules`, `personalization_slots` (e.g. `{name}`, `{company}`) | Copy-ready template boxes with fill-in blanks |
| **Opportunities** (internships, programs, scholarships, competitions) | `name`, `organization`, `who_can_apply`, `deadline`, `benefits`, `how_to_apply[]`, `link` | Opportunity card + deadline reminder |
| **Free student benefits** | `perks[]`: `provider`, `what_you_get`, `value`, `how_to_claim[]`, `verification_needed` (e.g. .edu email, SheerID, ISIC), `region_limits`, `link` | Perk table, sorted by value |
| **Fitness** | `goal`, `exercises[]`: `name`, `sets`, `reps`, `rest`, `form_cues[]`, `equipment`, `alternatives`; `frequency` | Workout table + form-cue checklist |
| **Meal plan / nutrition** | `meals[]`: `name`, `ingredients[]` (qty, unit), `steps[]`, `prep_time`, `macros_if_stated`; `grocery_list[]` | Recipe cards + combined grocery list |
| **Looksmaxing / grooming / style** | `routine[]` (AM/PM, step, product type, frequency), `products_mentioned[]`, `claims_needing_caution[]` | Routine timeline + caution panel |
| **Video / content creation** | `techniques[]`, `settings` (fps, resolution, lighting), `apps_tools[]`, `shot_list[]`, `hooks_or_scripts[]` | Technique checklist + settings table |
| **General / other** | Base fields only | Key points + resources |

Rule for every category: **numbers, templates, links and names are copied exactly as said or shown, never invented.** If the reel says "DM me for the link", the resource is recorded as "creator says: DM for link" with no URL, not a guessed URL.

### 5.4 The system prompt (starting version)

```text
You are Reeldex's extraction engine. You receive one short video that a user saved
because it contains useful advice. Watch the frames, listen to the audio, and read
ALL on-screen text, including text that appears briefly.

Rules:
1. Use ONLY information present in the video (speech, on-screen text, visible content,
   or caption text supplied below). Never add outside facts, links or numbers.
2. Copy templates, scripts, numbers, prices, names, handles, URLs and promo codes
   exactly. If a URL is not shown or spoken, set url_if_shown to null.
3. If something is unclear (mumbled, cut off, too fast), include it with
   "uncertain": true rather than guessing.
4. For each key point, give the approximate timestamp (mm:ss).
5. Classify into exactly one primary category from: resume, applying, cold_dm,
   opportunity, student_benefit, fitness, meal_plan, grooming, video_creation, general.
6. Health, fitness, nutrition, grooming and supplement advice: add a warning to
   "warnings" for anything potentially unsafe (e.g. extreme calorie deficits,
   unproven medical claims, unregulated substances, DIY procedures). Do not remove the
   advice; flag it.
7. If the video has no useful advice (meme, music, vlog), return category "general"
   with is_actionable: false.
8. Output valid JSON matching the provided schema. No prose outside JSON.

Caption text supplied by the user (may be empty): {caption}
```

Use Gemini's **structured output** mode (pass the JSON schema) so the response is guaranteed parseable, and validate it again with Zod on the server.

### 5.5 How you'll know the AI is good ("make no mistakes" — measured, not hoped)

No AI is error-free, so you build an **evaluation set** and measure:
- Collect **10 reels per category (100 total)** you've already saved. For each, hand-write the "perfect" card once (the golden answer).
- Run the pipeline on all 100 after every prompt or model change. Score:
  - **Hallucination rate:** facts/links in the card that aren't in the reel. **Target: 0 on links and numbers; <2% overall.**
  - **Recall:** share of golden key points captured. **Target ≥90%.**
  - **Template fidelity:** cold-DM templates match word-for-word. **Target 100%.**
  - **Category accuracy.** **Target ≥95%.**
- A simple script (`/eval/run.ts`) prints the scores. A prompt change ships only if no score drops.

---

## 6. System architecture

```
┌──────────────── Phone (Expo / React Native) ────────────────┐
│ Share Extension  ·  Photo/File import  ·  Library  ·  Cards │
│ Local cache (SQLite) for offline reading                    │
└───────────────┬─────────────────────────────────────────────┘
                │ 1. upload video (signed URL)      4. realtime update
                ▼                                   ▲
┌──────────────────────── Supabase ─────────────────┴─────────┐
│ Auth (Apple/Google) · Postgres (cards, jobs, quotas, RLS)   │
│ Storage bucket "incoming" (auto-delete ≤24h)                │
│ Edge Function  POST /process  → creates job                 │
└───────────────┬─────────────────────────────────────────────┘
                │ 2. job queued
                ▼
┌───────────────── Worker (Edge Function) ────────────────────┐
│ dedupe by hash → upload to Gemini File API → extract        │
│ → critic pass → validate (Zod) → save card → delete video   │
│ retries w/ backoff; fallback pipeline on failure            │
└───────────────┬─────────────────────────────────────────────┘
                ▼ 3.
        Google Gemini API (primary) / Groq + Claude (fallback)
```

### Stack (all free to start)

| Layer | Choice | Free-tier facts that matter |
|---|---|---|
| Mobile | **React Native + Expo** (SDK 58, TypeScript) | One codebase → iOS + Android |
| Share sheet | `expo-share-intent` (or `expo-share-extension`) | Needs a development build, not Expo Go. Its docs list support up to SDK 51 — check the repo for SDK 58 support in Sprint 0, or pin Expo to a supported SDK |
| Builds | **EAS Build** free plan | 15 iOS + 15 Android builds/month, slow queue |
| Backend | **Supabase** | 500 MB DB, 1 GB storage, 50 MB max upload, 50K monthly users, 500K function calls. **Pauses after 1 week of inactivity** — add a daily scheduled ping |
| AI | Gemini API (+ Groq/Claude fallback) | See 5.1 |
| Navigation/UI | Expo Router, NativeWind, FlashList | — |
| State/data | TanStack Query + Supabase realtime; `expo-sqlite` offline cache | — |
| Validation | Zod (shared schemas app ↔ server) | — |
| Crash/analytics | Sentry (free dev tier), PostHog (free tier) | Check current limits at signup |

Why not process video in Cloudflare Workers? Its free tier allows only 10 ms CPU per request, too little. Supabase Edge Functions only *orchestrate* (upload to Gemini, wait, save); Gemini does the heavy lifting. Check the current Edge Function wall-clock limit in Sprint 0; if long reels hit it, split into "start job" and "poll result" calls.

### Data model (Postgres)

```sql
create table profiles (
  id uuid primary key references auth.users,
  created_at timestamptz default now(),
  monthly_quota int default 60,
  used_this_month int default 0
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  status text check (status in ('queued','processing','done','failed')) default 'queued',
  source_type text check (source_type in ('video','link','screen_recording')),
  source_url text,            -- original reel link, if shared
  video_path text,            -- storage path, deleted after processing
  video_hash text,            -- dedupe
  caption text,
  error text,
  attempts int default 0,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  job_id uuid references jobs(id),
  category text not null,
  title text not null,
  summary text,
  data jsonb not null,        -- category-specific schema (Section 5.3)
  resources jsonb default '[]',
  warnings jsonb default '[]',
  source_url text,
  creator_handle text,
  thumbnail_path text,
  pinned boolean default false,
  tags text[] default '{}',
  model_version text,
  prompt_version text,
  search tsvector generated always as
    (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index cards_search_idx on cards using gin (search);
create index cards_user_cat_idx on cards (user_id, category, created_at desc);

-- Row Level Security: users only ever see their own rows
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table cards enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
create policy "own cards" on cards for all using (auth.uid() = user_id);
```

### Repository layout

```
reeldex/
├── app/                    # Expo Router screens
│   ├── (tabs)/library.tsx
│   ├── (tabs)/search.tsx
│   ├── card/[id].tsx
│   ├── import.tsx
│   └── settings.tsx
├── components/cards/       # one renderer per category (ResumeCard, ColdDmCard, …)
├── shared/schemas/         # Zod schemas used by app AND server
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── process/        # create job
│       ├── worker/         # run AI pipeline
│       └── keepalive/
├── prompts/                # versioned prompt files (extract.v1.md, critic.v1.md)
├── eval/                   # golden set + scoring script
└── app.config.ts
```

---

## 7. Screens (UX)

1. **Onboarding (3 screens):** what Reeldex does → how to share a reel (animated: Download → Share → Reeldex) → sign in.
2. **Library (home):** category chips across the top (Career, Money/Perks, Fitness, Food, Glow-up, Creating), cards in a grid with thumbnail, title, category color, and a "3 action items" badge.
3. **Processing state:** card appears instantly with a shimmer ("Reading on-screen text… Writing your guide…"); push notification when done.
4. **Card detail:** title + one-line summary → category visual (template box / workout table / perk table…) → key points with timestamps → resources (tap to open, copy, search) → action-item checklist → warnings (yellow) → "Open original" + creator credit → Edit.
5. **Search:** full-text across everything.
6. **Settings:** account, export all data (JSON), delete account (Apple requires in-app account deletion), privacy policy, usage this month.

Design notes: dark mode first (people use it at night while scrolling), large copy buttons on templates, one-thumb reachable actions, accessible contrast and Dynamic Type.

---

## 8. Staying free as it scales

| Users | Reels/month | AI cost if paid tier | Plan |
|---|---|---|---|
| You alone | ~100 | $0 (free tier) | Free tier covers it |
| 100 users | ~3,000 | ~$0 – $60 | Free tier + queue; Flash-Lite where possible |
| 1,000 users | ~30,000 | ~$180 – $600 | Needs a decision (below) |
| 10,000 users | ~300,000 | ~$1.8K – $6K | Needs a decision (below) |

(Assumes ~30 reels/user/month, $0.006–0.02 per reel at today's paid prices; Gemini Flash prices double Jan 2027.)

Levers that keep it free for users:
1. **Per-user monthly quota** (start at 60 reels/month; plenty for real use).
2. **Dedupe:** the same viral reel saved by 500 users is processed once (match by video hash), each user gets their own copy of the card.
3. **Low-resolution video mode** (~3× fewer tokens) for talking-head reels; most advice reels don't need full resolution.
4. **Route by length/complexity:** Flash-Lite by default, full Flash only when the critic finds low confidence.
5. **On-device pre-processing** (v2): Apple's Speech and Vision frameworks transcribe and OCR on the phone for free, and only text + a few frames go to the AI, cutting cost ~80%.
6. **Bring-your-own key** (optional power-user setting): users can paste their own free Gemini key.
7. If costs still grow past what you'll pay: an optional "supporter" tier or tip jar, never paywalling the core.

Also: Supabase's 1 GB storage is fine because videos are deleted after processing; cards are a few KB each (500 MB ≈ 100K+ cards).

---

## 9. Privacy, safety and compliance checklist

- [ ] **Privacy policy** (hosted page, linked in the app and store listing). Must state: videos are sent to Google Gemini for processing and deleted within 24 hours; on the free tier Google may use submitted content to improve its products and humans may review it; what you store; how to delete.
- [ ] **App Privacy "nutrition label"** in App Store Connect and **Data safety** form in Play Console, matching the policy.
- [ ] **In-app account deletion** (Apple requirement).
- [ ] **Sign in with Apple** offered alongside Google (Apple requires it when you offer other social logins).
- [ ] **No Instagram/Meta trademarks** in name, icon, screenshots' headlines, subtitle, keywords.
- [ ] **App Review notes** explaining the user-download ingestion model (Section 4).
- [ ] **Health disclaimer** on fitness, nutrition and grooming cards: "Summarized from a creator's video. Not medical advice." plus the AI's warnings panel.
- [ ] **Age:** Gemini API terms require the developer to be 18+; set the app's age rating honestly (likely 12+ or 13+ depending on the questionnaire).
- [ ] **Creator credit** and link back on every card; no re-hosting of video.
- [ ] Gemini free tier not for EEA/UK/Swiss users → limit launch regions or use paid tier there.
- [ ] Never store API keys in the app; all AI calls go through your Edge Function.

---

## 10. Project plan (PM view)

### Team (that's you, wearing each hat — or Claude helping with each)
| Role | Responsibility |
|---|---|
| Product / PM | Scope, priorities, roadmap, success metrics |
| Designer | Wireframes in Figma (free), card visuals, icon |
| Mobile dev | Expo app, share extension, renderers |
| Backend dev | Supabase schema, functions, queue |
| AI engineer | Prompts, schemas, eval set, model routing |
| QA | Device testing, eval runs, regression |
| Launch | Store listings, screenshots, privacy policy, review |

### Timeline (≈10 weeks part-time, ~10–12 h/week)

| Sprint | Weeks | Goal | Done when |
|---|---|---|---|
| **0 — Setup & proof** | 1 | Prove the core works | Gemini key works; one downloaded reel → correct JSON in a script; Expo dev build runs on your phone; share-intent library confirmed on chosen SDK; tested what Instagram's share sheet passes |
| **1 — Eval set & prompts** | 2 | AI quality first | 100-reel golden set; extract + critic prompts hit targets in 5.5 |
| **2 — Backend** | 3 | Pipeline end-to-end | Supabase schema + RLS; upload → job → worker → card; retries, dedupe, video deletion, keepalive |
| **3 — App core** | 4–5 | Usable app | Auth, share extension, import, library, card detail with 10 category renderers, realtime updates |
| **4 — Polish** | 6 | Feels great | Search, edit, export image/PDF, offline cache, onboarding, empty/error states, dark mode |
| **5 — Hardening** | 7 | Trustworthy | Quotas, fallback pipeline, Sentry, analytics, account deletion, privacy policy, accessibility pass |
| **6 — Beta** | 8–9 | Real users | Android closed test (Play requires **12 testers for 14 continuous days** for new personal accounts — start this early); iOS TestFlight with friends; fix top issues |
| **7 — Launch** | 10 | In the stores | Listings, screenshots, review submission, launch post |

**Critical path:** Sprint 0 proof → eval set → backend → app. Start recruiting your 12 Android testers in Week 5 so the 14-day clock doesn't delay launch.

### Success metrics
- **Activation:** % of new users who process ≥1 reel in their first day (target 60%).
- **The real goal — re-use:** % of cards opened again ≥7 days after creation (target 30%; this is the problem you're solving).
- **Quality:** card edit rate (lower = better AI), thumbs-down rate <5%, hallucination rate from eval.
- **Speed:** median share → finished card <25 s.
- **Cost:** AI cost per active user/month.

### Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| App Store rejection under 5.2.2/5.2.3 | Medium | High | User-download model only, no server fetching, clear review notes, no Meta trademarks |
| Creator disables Download on a reel | High | Medium | Path B (link + caption) and Path C (screen recording) |
| AI hallucinates a link or number | Medium | High | "Only from video" rule, critic pass, eval gate, "uncertain" flags, easy editing |
| Gemini free quota too low / changes | Medium | Medium | Queue + backoff, Flash-Lite routing, Groq+Claude fallback, BYO key |
| Gemini price increase (Jan 2027 doubling) | Certain | Medium | Dedupe, low-res mode, on-device pre-processing |
| Supabase project pauses | Medium | Medium | Daily keepalive scheduled function |
| Share-extension library not updated for latest Expo | Medium | Medium | Verify in Sprint 0; pin SDK or use alternative library |
| Unsafe health/looksmaxing advice | Medium | High | Warnings panel, disclaimer, age rating |

---

## 11. Getting it on your phone (free options first)

| Option | Cost | Catch |
|---|---|---|
| **Android, sideload the APK** (EAS build) | $0 | Android only |
| **iPhone via Xcode "Personal Team"** (free Apple account) | $0 | Needs a Mac; app expires every **7 days** (re-install from Xcode); max 3 devices |
| **iPhone without a Mac: AltStore / Sideloadly on Windows** (free Apple ID) | $0 | Same 7-day expiry (AltStore can auto-renew); max 3 sideloaded apps, and AltStore itself likely takes one slot; you still need a built .ipa (see below) |
| **iPhone via TestFlight** | $99/yr | Friends can test too |
| **App Store** | $99/yr | Public, auto-updates |
| **Google Play** | $25 once | 12 testers × 14 days before production |

A web app (PWA) isn't a workaround: iOS Safari doesn't let web apps receive shared files from the share sheet, which is the core feature.

### Installing on iPhone without a Mac

You don't need a Mac to *install*, but you need a way to *build* the app file (.ipa), and iPhone builds normally run on macOS.

**Installing:**
1. On your Windows PC, install **AltServer** (from AltStore) or **Sideloadly**.
2. On the iPhone, turn on **Developer Mode**: Settings → Privacy & Security → Developer Mode.
3. Connect the iPhone and sign in with your **free Apple ID**. The tool signs the .ipa and installs it.
4. Every 7 days the app expires. AltStore can renew it automatically while your PC is on the same Wi-Fi; otherwise re-install it.

**Building the .ipa without a Mac:**

| Option | Cost | Notes |
|---|---|---|
| **GitHub Actions macOS runner** (recommended) | $0 for public repos; private repos use free minutes, and macOS minutes count extra (check GitHub's current allowance) | A workflow (`.github/workflows/ios-unsigned.yml`) runs `expo prebuild`, then `xcodebuild` without code signing, and uploads an unsigned .ipa. AltStore/Sideloadly then signs it with your Apple ID |
| EAS Build (Expo cloud) | Needs the paid $99 Apple account for real-device iOS builds | Easiest once you pay; doesn't solve the free case |
| Rented cloud Mac (e.g. MacinCloud) | Pay by the hour | For occasional builds |

**Recommended order:** build and test on **Android first** (free, installs straight from Windows, no 7-day limit), then move to iPhone through GitHub Actions + AltStore once the app works. Re-signing every 7 days gets tedious for an app you use daily, which is the point where the $99 for TestFlight starts to be worth it.

**Suggested path:** build and use it free (Android sideload or 7-day iPhone install) through the beta. Pay the $99 only once you're happy and ready to launch publicly.

---

## 12. Version control: a commit at every step, authored by you

**Rule: every step in this plan ends with a commit, and every commit has you as the author.** That includes each Sprint task, each Day-1 step in Section 14, every prompt change, and every eval run that changes scores. This gives you a full history to roll back to, and a GitHub profile that shows the work (useful for internships).

### One-time setup (do this before the first commit)

```bash
git config --global user.name  "Your Name"          # your real name
git config --global user.email "ishmittal12@gmail.com"

# Check it's set before every new machine / cloud environment
git config user.name && git config user.email
```

- Use the same email on your GitHub account so commits link to your profile. If you'd rather keep that address private, use GitHub's `@users.noreply.github.com` address instead (GitHub → Settings → Emails).
- **When an AI assistant (Claude or other) makes commits for you**, the author must still be you. Check the setup above first, or pass `--author="Your Name <ishmittal12@gmail.com>"` on the commit. Commits made with Claude may include a `Co-Authored-By: Claude` line at the bottom of the message. That line doesn't change the author; tell the assistant to leave it out if you don't want it.
- After any session, verify authorship:
  ```bash
  git log --format='%h  %an <%ae>  %s' -20
  ```
  If one is wrong: `git commit --amend --reset-author --no-edit` (for the latest commit, before pushing).

### Commit rules

| Rule | Why |
|---|---|
| **One step = one commit.** Commit as soon as a step works, not at the end of the day | Small commits are easy to review and undo |
| **Conventional Commit messages:** `type(scope): what changed` | Readable history; types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `prompt`, `eval` |
| **Never commit secrets.** API keys live in `.env` (listed in `.gitignore`) and Supabase/EAS secrets | A leaked Gemini key can be abused immediately |
| **Never commit reel videos** — `eval/videos/` is in `.gitignore`; only the golden JSON answers are committed | Copyright, and repo size |
| **Tag prompt versions** in the message, e.g. `prompt(extract): v3 — stricter URL rule (recall 91%→93%)` | Ties AI quality changes to commits |
| Work on `main` for Sprint 0–1; from Sprint 2 use short branches (`feat/share-extension`) merged by pull request | Keeps `main` always working |
| Tag releases: `git tag v1.0.0` | Matches App Store versions |

### `.gitignore` essentials

```
.env
.env.*
node_modules/
eval/videos/
*.ipa
*.apk
*.aab
ios/
android/
.expo/
```

(`ios/` and `android/` are regenerated by `expo prebuild`; remove them from this list only if you start editing native code by hand.)

### Example commit sequence for Sprint 0

```
chore: initialize Expo app with TypeScript
chore: add .gitignore and .env.example
docs: add project plan
feat(ai): gemini extraction script for one reel
prompt(extract): v1 base extraction prompt
feat(app): add expo-dev-client and share-intent plugin
feat(app): receive shared video in development build
chore(db): initial Supabase schema with RLS
ci: GitHub Actions workflow for unsigned iOS build
```

---

## 13. Launch checklist

- [ ] Name reserved in App Store Connect + Play Console
- [ ] Icon (1024×1024, no Instagram look-alike glyphs)
- [ ] 5–6 screenshots per platform; captions are searchable, so use phrases like "Cold DM templates, ready to copy"
- [ ] Privacy policy + support URL live
- [ ] App Privacy / Data safety forms done
- [ ] Review notes + a demo account + a sample video file for reviewers
- [ ] Age rating questionnaire
- [ ] Crash-free beta (Sentry), eval scores at target
- [ ] Launch post: TikTok/Reels showing a before (messy Saved folder) → after (Reeldex library). Your target users live there.

---

## 14. Your first day (Sprint 0, step by step)

Each step ends with a commit (Section 12).

1. Set your git name and email (Section 12), create the GitHub repo, `npx create-expo-app reeldex`, add `.gitignore` and `.env.example`, and copy this plan into `docs/`.
   → `chore: initialize Expo app with TypeScript` · `docs: add project plan`
2. Create a Google AI Studio account → API key (you must be 18+) → put it in `.env` (never committed).
3. Download 5 reels you've saved using Instagram's Download button (keep them in `eval/videos/`, which is git-ignored).
4. Write a 30-line Node script: upload one video with the Gemini File API → call the model with the prompt in 5.4 and the Resume/Cold-DM schema → print JSON. Compare against the reel.
   → `feat(ai): gemini extraction script for one reel` · `prompt(extract): v1 base extraction prompt`
5. Add `expo-dev-client` + the share-intent library and share a video into the app on a phone:
   - **Android (start here, no Mac needed):** build an APK with EAS (free) and install it directly.
   - **iPhone without a Mac:** GitHub Actions unsigned build → AltStore/Sideloadly (Section 11).
   → `feat(app): receive shared video in development build`
6. Create a Supabase project and run the SQL in Section 6.
   → `chore(db): initial Supabase schema with RLS`
7. Push to GitHub and check every commit shows you as the author: `git log --format='%h  %an <%ae>  %s'`.

If steps 4 and 5 work, the hardest unknowns are solved and the rest is building.

---

## 15. Things to double-check (fast-moving facts)

These were accurate in today's research but change often; confirm when you get to them:
- Gemini model names, free-tier limits (shown per project in AI Studio) and prices.
- `expo-share-intent` support for your Expo SDK.
- Supabase free-tier limits and Edge Function time limits.
- What Instagram's share sheet passes to other apps (test on device).
- Name availability (stores + USPTO + CIPO).

---

## Sources

- Gemini pricing — https://ai.google.dev/gemini-api/docs/pricing
- Gemini video understanding — https://ai.google.dev/gemini-api/docs/video-understanding
- Gemini rate limits — https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API terms — https://ai.google.dev/gemini-api/terms
- Claude vision (image-only input) — https://platform.claude.com/docs/en/build-with-claude/vision
- Claude pricing — https://platform.claude.com/docs/en/about-claude/pricing
- OpenAI pricing — https://developers.openai.com/api/docs/pricing
- Groq rate limits — https://console.groq.com/docs/rate-limits
- Expo changelog — https://expo.dev/changelog
- Expo/EAS pricing — https://expo.dev/pricing
- expo-share-intent — https://npmjs.com/package/expo-share-intent
- Supabase pricing — https://supabase.com/pricing
- Cloudflare Workers pricing — https://developers.cloudflare.com/workers/platform/pricing/
- Firebase pricing — https://firebase.google.com/pricing
- Apple fee waiver — https://developer.apple.com/support/membership-fee-waiver/
- Apple membership comparison — https://developer.apple.com/support/compare-memberships/
- Google Play registration — https://support.google.com/googleplay/android-developer/answer/6112435
- AltStore sideloading guide (XDA) — https://www.xda-developers.com/how-to-sideload-apps-on-iphone/
- Google Play testing requirement — https://support.google.com/googleplay/android-developer/answer/14151465
- Instagram Platform overview — https://developers.facebook.com/docs/instagram-platform/overview
- Meta oEmbed updates — https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/
- Basic Display API shutdown — https://help.zapier.com/hc/en-us/articles/32429170578317-Instagram-app-deprecation-on-Dec-4-2024
- Instagram on scraping — https://help.instagram.com/740480200552298
- Instagram Reels download — https://help.instagram.com/iphone-app/520831036611383
- Meta v. Bright Data — https://www.fbm.com/post/102kqw7/
- App Store Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- App Store Connect app information limits — https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- ASO ranking factors — https://appradar.com/academy/aso-basics/app-store-ranking-factors
- Recall pricing — https://www.recall.it/pricing
- Fofo — https://apps.apple.com/us/app/id6738624828
- SousChef AI — https://apps.apple.com/app/id6761611403
- Pestle — https://techcrunch.com/?p=2920293
