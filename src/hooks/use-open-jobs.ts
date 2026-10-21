import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Job } from '@/lib/types';

// Jobs that are still running, plus failures from the last day, so the library
// can say "1 reel processing" or show why one failed.
export function useOpenJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const refresh = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('jobs')
      .select('id, status, error, attempts, created_at')
      .or(`status.in.(queued,processing),and(status.eq.failed,created_at.gt.${since})`)
      .order('created_at', { ascending: false });
    if (data) setJobs(data as Job[]);
  }, []);

  useEffect(() => {
    // Load once the channel settles (or fails), so no change slips in between.
    const channel = supabase
      .channel('jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => refresh())
      .subscribe(() => refresh());
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return jobs;
}
