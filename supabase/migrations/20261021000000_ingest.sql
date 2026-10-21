-- Ingest pipeline: iOS Shortcut -> Edge Function `ingest` -> Gemini -> card.
--   1. Personal ingest tokens, so the Shortcut never holds a password.
--      Only a SHA-256 hash is stored; the plaintext is shown once.
--   2. Private "incoming" bucket. Videos are deleted once a job finishes.
--   3. pg_cron sweeper that re-invokes `ingest` for stuck jobs, plus a
--      monthly quota reset. The sweeper reads two Vault secrets that are
--      set outside migrations (never committed): project_url and
--      ingest_worker_secret.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 1. Ingest tokens ----------------------------------------------------------

create table ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  token_hash text unique not null,
  label text,
  created_at timestamptz default now(),
  last_used_at timestamptz
);

alter table ingest_tokens enable row level security;
create policy "read own tokens" on ingest_tokens for select using (auth.uid() = user_id);
create policy "revoke own tokens" on ingest_tokens for delete using (auth.uid() = user_id);

create function public.issue_ingest_token(p_user_id uuid, p_label text)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  token text := 'rdx_' || encode(extensions.gen_random_bytes(32), 'hex');
begin
  insert into public.ingest_tokens (user_id, token_hash, label)
  values (p_user_id, encode(extensions.digest(token, 'sha256'), 'hex'), p_label);
  return token;
end;
$$;

-- Called by the signed-in app.
create function public.create_ingest_token(label text default 'iPhone Shortcut')
returns text
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  return public.issue_ingest_token(auth.uid(), label);
end;
$$;

-- Run from the dashboard SQL editor until the app has a settings screen:
--   select public.admin_create_ingest_token('you@example.com');
create function public.admin_create_ingest_token(email text, label text default 'iPhone Shortcut')
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users u where u.email = admin_create_ingest_token.email;
  if uid is null then
    raise exception 'no user with email %', email;
  end if;
  return public.issue_ingest_token(uid, label);
end;
$$;

revoke execute on function public.issue_ingest_token(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_create_ingest_token(text, text) from public, anon, authenticated;
revoke execute on function public.create_ingest_token(text) from public, anon;
grant execute on function public.create_ingest_token(text) to authenticated;

-- 2. Jobs + storage ---------------------------------------------------------

alter table jobs
  add column mime_type text,
  add column started_at timestamptz,
  add column updated_at timestamptz default now();

create index jobs_user_hash_idx on jobs (user_id, video_hash);
create index jobs_open_idx on jobs (status, created_at) where status in ('queued', 'processing');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('incoming', 'incoming', false, 52428800, array['video/mp4', 'video/quicktime']);
-- No storage policies: only the service role (the Edge Function) can touch it.

-- Atomic quota check-and-count, called by the Edge Function (service role).
create function public.use_quota(p_user_id uuid)
returns boolean
language sql
security definer set search_path = ''
as $$
  update public.profiles set used_this_month = used_this_month + 1
  where id = p_user_id and used_this_month < monthly_quota
  returning true;
$$;

revoke execute on function public.use_quota(uuid) from public, anon, authenticated;

-- 3. Scheduled jobs ---------------------------------------------------------

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
  where exists (select 1 from public.jobs where status in ('queued', 'processing'));
  $$
);

select cron.schedule(
  'reset-monthly-quota',
  '0 0 1 * *',
  $$ update public.profiles set used_this_month = 0 $$
);
