import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Inbox, Loader2, MessageCircle, Search, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MatchItem = {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  photo_url: string | null;
  city: string | null;
  compatibility_score: number | null;
  compatibility_reasons: string[] | null;
  matched_at: string | null;
  last_message: {
    body: string;
    created_at: string;
    is_mine: boolean;
  } | null;
  unread_count: number | null;
};

type MatchesResponse = {
  ok: boolean;
  code?: string;
  matches?: MatchItem[];
  count?: number;
};

const getName = (match: MatchItem) => match.display_name || match.handle || 'Usuario';

const formatRelativeTime = (date: string | null) => {
  if (!date) return '';

  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;

  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(date));
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadTotal = useMemo(() => {
    return matches.reduce((sum, match) => sum + Math.max(0, Number(match.unread_count ?? 0)), 0);
  }, [matches]);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('convinter_get_my_matches', {
      p_limit: 50,
      p_offset: 0,
    });

    if (rpcError) {
      console.error('Error loading matches:', rpcError);
      setError('No se pudieron cargar tus mensajes.');
      toast.error('No se pudieron cargar tus mensajes');
      setIsLoading(false);
      return;
    }

    const result = data as unknown as MatchesResponse;
    if (!result.ok) {
      setError(result.code === 'NOT_AUTHENTICATED' ? 'Inicia sesion para ver tus mensajes.' : 'No se pudieron cargar tus mensajes.');
      setIsLoading(false);
      return;
    }

    setMatches(result.matches ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const EmptyState = ({ message }: { message?: string }) => (
    <Layout>
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sin mensajes todavia</h2>
          <p className="text-muted-foreground mb-6">
            {message || 'Cuando haya consentimiento mutuo, tus conversaciones apareceran aqui.'}
          </p>
          {!message && (
            <div className="text-left rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>Pide compatibilidad desde Discover o desde un perfil.</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>Cuando haya consentimiento mutuo, la conversacion aparecera aqui.</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <span>Desde cada tarjeta podras abrir el chat directamente.</span>
              </div>
            </div>
          )}
          <Button asChild variant="hero" className="gap-2">
            <Link to="/discover">
              <Search className="h-5 w-5" />
              Explorar perfiles
            </Link>
          </Button>
        </motion.div>
      </div>
    </Layout>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              <Inbox className="h-4 w-4" />
              Bandeja de conversaciones
            </div>
            <h1 className="text-3xl font-bold">Mensajes</h1>
            <p className="mt-2 text-muted-foreground">
              Tus matches y chats activos en un solo lugar.
            </p>
          </div>
          <Badge variant={unreadTotal > 0 ? 'default' : 'secondary'} className="w-fit rounded-full px-3 py-1">
            {unreadTotal} sin leer
          </Badge>
        </div>

        <div className="space-y-4 max-w-2xl">
          {matches.map((match, index) => {
            const name = getName(match);
            const lastMessage = match.last_message;
            const reasons = match.compatibility_reasons ?? [];
            const score = match.compatibility_score ?? 0;
            const unread = match.unread_count ?? 0;

            return (
              <motion.div
                key={match.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-2xl p-4 card-hover"
              >
                <Link to={`/chat/${match.user_id}`} className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={match.photo_url || '/placeholder.svg'}
                      alt={name}
                      className="w-16 h-16 rounded-xl object-cover bg-muted"
                    />
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success text-success-foreground text-xs font-semibold">
                      <Star className="h-3 w-3" />
                      {score}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate">{name}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(lastMessage?.created_at || match.matched_at)}
                      </span>
                    </div>
                    <p className={unread > 0 ? 'text-sm font-semibold text-foreground line-clamp-1 mb-2' : 'text-sm text-muted-foreground line-clamp-1 mb-2'}>
                      {lastMessage ? `${lastMessage.is_mine ? 'Tu: ' : ''}${lastMessage.body}` : match.city || 'Conversacion reciente'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 2).map((reason, reasonIndex) => (
                        <Badge key={`${reason}-${reasonIndex}`} variant="secondary" className="text-xs rounded-full">
                          {reason}
                        </Badge>
                      ))}
                      {reasons.length === 0 && (
                        <Badge variant="outline" className="text-xs rounded-full">
                          Consentimiento nivel 1
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
