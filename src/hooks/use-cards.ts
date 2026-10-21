import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Card } from '@/lib/types';

const COLUMNS = 'id, category, title, summary, data, frames, source_url, creator_handle, pinned, created_at';

// All of the user's cards (RLS scopes the query), newest first, kept live via
// Realtime so a card shared from the Shortcut appears without a refresh.
export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('cards')
      .select(COLUMNS)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setError(error?.message ?? null);
    if (data) setCards(data as Card[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load once the channel settles (or fails), so no change slips in between.
    const channel = supabase
      .channel('cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => refresh())
      .subscribe(() => refresh());
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { cards, error, isLoading, refresh };
}

export function useCard(id: string) {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      supabase
        .from('cards')
        .select(COLUMNS)
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          setCard(data as Card | null);
          setIsLoading(false);
        });
    // Live: frames are added to the card a minute or so after it's created.
    const channel = supabase
      .channel(`card-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cards', filter: `id=eq.${id}` }, load)
      .subscribe(() => load());
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { card, isLoading, setCard };
}
