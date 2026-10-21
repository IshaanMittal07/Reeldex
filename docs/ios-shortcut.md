# iOS Shortcut: send a reel to Reeldex without leaving Instagram

In Instagram: **Download** the reel, then **Share → Reeldex**. The Shortcut runs
on top of Instagram. It gets the reel link from Instagram, takes the video you
just downloaded (the newest video in Photos), shrinks it to 720p, uploads it,
and deletes it from Photos. Then you keep scrolling.

## 1. Get a token

In the app: **Settings → New Shortcut token**. Copy the `rdx_…` value; it's
shown once.

## 2. Build the Shortcut

Shortcuts → **+** → name it **Reeldex** → tap the name → **Details** → turn on
**Show in Share Sheet**.

| # | Action | Settings |
|---|---|---|
| 1 | Receive input from Share Sheet | Types: **URLs** and **Text** only. If there's no input: **Stop and Respond** |
| 2 | Find Photos | Add filter **Media Type is Video**. Sort by **Creation Date**, **Latest First**. Limit: on, **1** |
| 3 | Get Details of Photos | **Creation Date** of *Photos* |
| 4 | Get Time Between Dates | Between *Creation Date* and **Current Date**, in **Minutes** |
| 5 | If | *Time Between Dates* **is greater than** `3` |
| 6 | Show Notification (inside If) | `Tap Download on the reel first, then share again.` |
| 7 | Stop This Shortcut (inside If) | |
| 8 | End If | (comes with step 5; leave the Otherwise branch empty or delete it) |
| 9 | Encode Media | *Photos*, Size **1280×720** |
| 10 | URL Encode | **Encode** *Shortcut Input* |
| 11 | Get Contents of URL | `https://<project-ref>.supabase.co/functions/v1/ingest?url=` + *URL Encoded Text*. Method **POST**. Header `x-reeldex-token: rdx_…`. Request Body **File** = *Encoded Media* |
| 12 | Get Dictionary Value | Value for key `job_id` in *Contents of URL* |
| 13 | If | *Dictionary Value* **has any value** |
| 14 | Delete Photos (inside If) | *Photos* (iOS asks you to confirm; it goes to Recently Deleted) |
| 15 | Show Notification (inside If) | `Saved to Reeldex ✓` |
| 16 | Show Notification (inside Otherwise) | *Contents of URL* (shows the server's error) |

Steps 3–8 stop the Shortcut from sending an old video if you forgot to tap
Download, or if the download hadn't finished.

## 3. Use it

1. In Instagram, open the reel's share menu and tap **Download**. Wait for the
   "Saved" message (a second or two).
2. In the same share menu, tap **Share to…** (or **More**), then **Reeldex**.
   The first time, scroll the app row to the end, tap **More**, and pin
   Reeldex near the front.
3. The first run asks for access to Photos and to `supabase.co`: **Always Allow**.

The card appears in the app about a minute later. Useful frames from the video
follow a minute after that.

## Responses

| HTTP | Meaning |
|---|---|
| 202 `{job_id, status: "queued"}` | Accepted; the card appears in about a minute |
| 200 `{duplicate: true}` | You already sent this exact video (a link is still added if the card had none) |
| 401 | Token missing or wrong |
| 413 | Over 50 MB (check Encode Media is on) |
| 415 | Not an MP4/MOV video |
| 429 | Monthly quota used up |
