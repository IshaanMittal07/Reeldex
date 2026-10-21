-- Key frames: Gemini picks timestamps, a GitHub Actions job cuts them with
-- ffmpeg and stores them here as <user_id>/<card_id>/<n>.jpg.

alter table cards add column frames jsonb not null default '[]';  -- [{path, timestamp, caption}]

-- pending: video kept until the frames job finishes; the sweeper gives up after 20 min.
alter table jobs add column frames_status text check (frames_status in ('pending', 'done', 'failed'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('frames', 'frames', false, 2097152, array['image/jpeg']);

-- Users read their own folder; only the service role writes.
create policy "read own frames" on storage.objects for select to authenticated
  using (bucket_id = 'frames' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Same sweeper, now also woken by frame jobs that never reported back.
select cron.schedule(
  'ingest-sweeper',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'ingest_worker_secret')
    ),
    body := '{"sweep": true}'::jsonb
  )
  where exists (
    select 1 from public.jobs
    where status in ('queued', 'processing') or frames_status = 'pending'
  );
  $$
);
