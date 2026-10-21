# iOS Shortcut: send a reel to Reeldex

The Shortcut is how reels get in: Photos → Share → **Reeldex**. It shrinks the
video to 720p (keeps uploads well under the 50 MB storage limit) and posts it to
the `ingest` Edge Function with your personal token.

## 1. Get a token

In the app: **Settings → New Shortcut token**. Or, in the Supabase SQL editor:

```sql
select public.admin_create_ingest_token('you@example.com');
```

Copy the `rdx_…` value. It is shown once; make a new one if you lose it.

## 2. Build the Shortcut

Shortcuts → **+** → name it **Reeldex**. Turn on **Show in Share Sheet**
(tap the name → Details on some iOS versions).

| # | Action | Settings |
|---|---|---|
| 1 | Receive input from Share Sheet | Types: **Media**, **Files**. If there's no input: **Ask For → Photos** |
| 2 | Encode Media | Shortcut Input, Size **1280×720** |
| 3 | Get Contents of URL | `https://<project-ref>.supabase.co/functions/v1/ingest`, Method **POST**, Header `x-reeldex-token: rdx_…`, Request Body **File** = *Encoded Media* |
| 4 | Get Dictionary Value | Value for key `job_id` in *Contents of URL* |
| 5 | If | *Dictionary Value* **has any value** |
| 6 | Show Notification (inside If) | `Saved to Reeldex ✓ Card ready in about a minute` |
| 7 | Show Notification (inside Otherwise) | *Contents of URL* (shows the server's error) |

## 3. Use it

Instagram → reel → Share → **Download** (saves to Photos). Photos → the video →
Share → **Reeldex**. The first run asks to connect to `supabase.co`: **Always Allow**.

## Responses

| HTTP | Meaning |
|---|---|
| 202 `{job_id, status: "queued"}` | Accepted; the card appears in about a minute |
| 200 `{duplicate: true}` | You already sent this exact video |
| 401 | Token missing or wrong |
| 413 | Over 50 MB (check Encode Media is on) |
| 415 | Not an MP4/MOV video |
| 429 | Monthly quota used up |
