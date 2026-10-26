-- A job makes at most one card, even if two workers run it at once.
create unique index cards_job_id_key on public.cards (job_id);
