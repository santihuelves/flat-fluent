import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type MatchWithUnread = {
  unread_count?: number | null;
};

type MatchesResponse = {
  ok?: boolean;
  matches?: MatchWithUnread[];
};

export function useUnreadMessages() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const hasSession = Boolean(sessionData.session?.user);
    setIsAuthenticated(hasSession);

    if (!hasSession) {
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase.rpc('convinter_get_my_matches', {
      p_limit: 100,
      p_offset: 0,
    });

    if (error) {
      console.warn('No se pudo cargar el contador de mensajes', error);
      return;
    }

    const result = data as unknown as MatchesResponse;
    if (!result?.ok) {
      setUnreadCount(0);
      return;
    }

    const total = (result.matches ?? []).reduce((sum, match) => {
      return sum + Math.max(0, Number(match.unread_count ?? 0));
    }, 0);

    setUnreadCount(total);
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadUnreadCount();
    });

    return () => subscription.unsubscribe();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('convinter-unread-messages-nav')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convinter_messages',
        },
        () => {
          void loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loadUnreadCount]);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount, location.pathname]);

  useEffect(() => {
    const refresh = () => {
      void loadUnreadCount();
    };

    window.addEventListener('focus', refresh);
    window.addEventListener('convinter:messages-read', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('convinter:messages-read', refresh);
    };
  }, [loadUnreadCount]);

  return unreadCount;
}
