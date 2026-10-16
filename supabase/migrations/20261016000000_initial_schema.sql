-- Initial schema (plan Section 6), with three fixes to the plan's SQL:
--   1. A trigger creates the profile row on sign-up (jobs/cards reference it).
--   2. on delete cascade, so in-app account deletion (Apple requirement) works.
--   3. Users can only read their profile; quotas are changed server-side
--      (service role bypasses RLS), so a user can't raise their own quota.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz default now(),
  monthly_quota int default 60,
  used_this_month int default 0
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
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
  user_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
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
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
create policy "own cards" on cards for all using (auth.uid() = user_id);

-- Create a profile for every new auth user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
