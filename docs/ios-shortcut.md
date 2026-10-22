# iOS Shortcut: send a reel to Reeldex without leaving Instagram

In Instagram: **Share → Reeldex**. That's it. The Shortcut sends only the reel's
link; the server fetches the video (and caption) from Instagram's public embed
page. Nothing is downloaded to your phone, so there's nothing to wait for or
delete.

## 1. Get a token

In the app: **Settings → New Shortcut token**. Copy the `rdx_…` value; it's
shown once.

## 2. Build the Shortcut

Shortcuts → **+** → name it **Reeldex** → tap the name → **Details** → turn on
**Show in Share Sheet**.

| # | Action | Settings |
|---|---|---|
| 1 | Receive input from Share Sheet | Types: **URLs** and **Text** only. If there's no input: **Stop and Respond** |
| 2 | URL Encode | **Encode** *Shortcut Input* |
| 3 | Get Contents of URL | `https://<project-ref>.supabase.co/functions/v1/ingest?url=` + *URL Encoded Text*. Method **POST**. Header `x-reeldex-token: rdx_…`. No request body (leave it as JSON with no fields) |
| 4 | Get Dictionary Value | Value for key `job_id` in *Contents of URL* |
| 5 | If | *Dictionary Value* **has any value** |
| 6 | Show Notification (inside If) | `Saved to Reeldex ✓` |
| 7 | Show Notification (inside Otherwise) | *Contents of URL* (shows the server's error) |

## 3. Use it

1. In Instagram, open the reel's share menu and tap **Share to…** (or **More**),
   then **Reeldex**. The first time, scroll the app row to the end, tap **More**,
   and pin Reeldex near the front.
2. The first run asks for access to `supabase.co`: **Always Allow**.

The card appears in the app about a minute later. Useful frames from the video
follow a minute or two after that.

## Fallback: private reels

Instagram only shows public reels on its embed page. For a private account's
reel the Shortcut shows "Couldn't get this reel from Instagram". For those, keep
a second Shortcut that uploads the downloaded video instead: in Instagram tap
**Download**, then share to it.

| # | Action | Settings |
|---|---|---|
| 1 | Receive input from Share Sheet | Types: **URLs** and **Text** only. If there's no input: **Stop and Respond** |
| 2 | Find Photos | Filter **Media Type is Video**. Sort by **Creation Date**, **Latest First**. Limit **1** |
| 3 | Get Time Between Dates | Between *Photos › Creation Date* and **Current Date**, in **Minutes** |
| 4 | If | *Time Between Dates* **is greater than** `3`: Show Notification `Tap Download on the reel first, then share again.`, then Stop This Shortcut |
| 5 | Encode Media | *Photos*, Size **960×540** |
| 6 | URL Encode | **Encode** *Shortcut Input* |
| 7 | Get Contents of URL | As above, plus Request Body **File** = *Encoded Media* |
| 8 | Get Dictionary Value | Value for key `job_id` in *Contents of URL* |
| 9 | If | *Dictionary Value* **has any value**: Delete Photos (*Photos*), then Show Notification `Saved to Reeldex ✓`. Otherwise: Show Notification *Contents of URL* |

Videos over 45 MB are stored in parts, so uploads up to 120 MB work.

## Responses

| HTTP | Meaning |
|---|---|
| 202 `{job_id, status: "queued"}` | Accepted; the card appears in about a minute |
| 200 `{duplicate: true}` | You already saved this reel (a link is still added if the card had none) |
| 401 | Token missing or wrong |
| 413 | Over 120 MB |
| 415 | Not an MP4/MOV video |
| 422 | Instagram didn't return the video (private reel): use the fallback |
| 429 | Monthly quota used up |
