import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Frames live in a private bucket, so each one needs a short-lived signed URL.
// One batched request per set of paths; returns a path → URL map.
export function useFrameUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.join('|');

  useEffect(() => {
    if (!key) return;
    supabase.storage
      .from('frames')
      .createSignedUrls(key.split('|'), 60 * 60)
      .then(({ data }) => {
        const next: Record<string, string> = {};
        for (const item of data ?? []) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
        setUrls(next);
      });
  }, [key]);

  return urls;
}
