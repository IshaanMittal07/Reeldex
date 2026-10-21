-- Live updates in the app: a job moving to done/failed and its new card show
-- up without a refresh. Realtime still applies RLS, so users only get their rows.
alter publication supabase_realtime add table public.jobs, public.cards;
