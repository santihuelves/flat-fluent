import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Clock,
  Inbox,
  Loader2,
  MessageCircle,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RpcInvoker = (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>;

type ConnectionProfile = {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  photo_url: string | null;
  city: string | null;
  province_code: string | null;
  bio: string | null;
  trust_score: number | null;
  trust_badge: string | null;
  selfie_verified: boolean | null;
};

type ConsentRequestItem = {
  request_id: number;
  from_user?: string;
  to_user?: string;
  requested_level: number | null;
  status: string | null;
  created_at: string | null;
  profile: ConnectionProfile;
  compatibility_score: number | null;
  compatibility_reasons: string[] | null;
};

type ActiveConnectionItem = {
  user_id: string;
  consent_level: number | null;
  connected_at: string | null;
  chat_id: string | null;
  profile: ConnectionProfile;
  compatibility_score: number | null;
  compatibility_reasons: string[] | null;
};

type ConnectionsResponse = {
  ok: boolean;
  code?: string;
  incoming?: ConsentRequestItem[];
  outgoing?: ConsentRequestItem[];
  connections?: ActiveConnectionItem[];
};

const CONNECTION_NOTIFICATION_TYPES = [
  'CONSENT_REQUEST_RECEIVED',
  'CONSENT_REQUEST_ACCEPTED',
  'CONSENT_REQUEST_REJECTED',
];

const rpc = supabase.rpc.bind(supabase) as unknown as RpcInvoker;

const getName = (profile: ConnectionProfile) => profile.display_name || profile.handle || 'Usuario';

const getInitials = (profile: ConnectionProfile) => {
  const name = getName(profile);
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const formatDate = (date: string | null) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const countLabel = (count: number, singular: string, plural: string) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const ProfileSummary = ({
  profile,
  score,
  reasons,
}: {
  profile: ConnectionProfile;
  score: number | null;
  reasons: string[] | null;
}) => {
  const name = getName(profile);
  const safeScore = Number(score ?? 0);

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar className="h-14 w-14 rounded-2xl">
        <AvatarImage src={profile.photo_url || undefined} alt={name} className="object-cover" />
        <AvatarFallback className="rounded-2xl">{getInitials(profile)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">{name}</h3>
          {profile.selfie_verified && (
            <Badge variant="secondary" className="rounded-full text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Verificado
            </Badge>
          )}
          {safeScore > 0 && (
            <Badge className="rounded-full text-xs">
              {safeScore}% compatible
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[profile.city, profile.province_code].filter(Boolean).join(', ') || 'Sin ubicacion'}
        </p>
        {profile.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
        )}
        {reasons && reasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reasons.slice(0, 2).map((reason, index) => (
              <Badge key={`${reason}-${index}`} variant="outline" className="rounded-full text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyPanel = ({ icon: Icon, title, body }: { icon: typeof Inbox; title: string; body: string }) => (
  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="font-semibold">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
  </div>
);

export default function Connections() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<ConsentRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<ConsentRequestItem[]>([]);
  const [connections, setConnections] = useState<ActiveConnectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const totalPending = useMemo(() => incoming.length + outgoing.length, [incoming.length, outgoing.length]);

  const markConnectionNotificationsRead = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { error: notificationError } = await supabase
      .from('convinter_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
      .in('notification_type', CONNECTION_NOTIFICATION_TYPES);

    if (notificationError) {
      console.warn('No se pudieron marcar las notificaciones de conexiones como leidas', notificationError);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await rpc('convinter_get_my_consent_overview');

      if (rpcError) {
        console.error('Error loading connections:', rpcError);
        setError('No se pudieron cargar tus conexiones.');
        setIsLoading(false);
        return;
      }

      const result = data as ConnectionsResponse;
      if (!result.ok) {
        setError(result.code === 'NOT_AUTHENTICATED' ? 'Inicia sesion para ver tus conexiones.' : 'No se pudieron cargar tus conexiones.');
        setIsLoading(false);
        return;
      }

      setIncoming(result.incoming ?? []);
      setOutgoing(result.outgoing ?? []);
      setConnections(result.connections ?? []);
    } catch (error) {
      console.error('Unexpected error loading connections:', error);
      setError('No se pudieron cargar tus conexiones.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    void markConnectionNotificationsRead();
  }, [markConnectionNotificationsRead]);

  const respondToRequest = async (requestId: number, accept: boolean) => {
    setRespondingId(requestId);

    const { data, error: rpcError } = await supabase.rpc('convinter_respond_consent_request', {
      p_request_id: requestId,
      p_accept: accept,
    });

    if (rpcError) {
      console.error('Error responding consent request:', rpcError);
      toast.error('No se pudo responder la solicitud');
      setRespondingId(null);
      return;
    }

    const result = data as unknown as { ok: boolean; code?: string };
    if (!result.ok) {
      toast.error(result.code === 'REQUEST_NOT_FOUND' ? 'La solicitud ya no existe' : 'No se pudo responder la solicitud');
      setRespondingId(null);
      return;
    }

    toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada');
    setRespondingId(null);
    await loadConnections();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4" />
          Volver a mensajes
        </Button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Solicitudes de compatibilidad
            </div>
            <h1 className="text-3xl font-bold">Conexiones</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Revisa quien quiere compartir compatibilidad contigo y gestiona tus conexiones activas.
            </p>
          </div>
          <Badge variant={totalPending > 0 ? 'default' : 'secondary'} className="w-fit rounded-full px-3 py-1">
            {countLabel(totalPending, 'pendiente', 'pendientes')}
          </Badge>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <h2 className="font-semibold text-destructive">No se pudo cargar</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => void loadConnections()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="incoming" className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
              <TabsTrigger value="incoming">Recibidas ({incoming.length})</TabsTrigger>
              <TabsTrigger value="outgoing">Enviadas ({outgoing.length})</TabsTrigger>
              <TabsTrigger value="active">Activas ({connections.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-4">
              {incoming.length === 0 ? (
                <EmptyPanel
                  icon={Inbox}
                  title="Sin solicitudes recibidas"
                  body="Cuando alguien quiera compartir compatibilidad contigo, aparecera aqui para aceptar o rechazar."
                />
              ) : (
                incoming.map((request, index) => (
                  <motion.div
                    key={request.request_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <ProfileSummary profile={request.profile} score={request.compatibility_score} reasons={request.compatibility_reasons} />
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/u/${request.profile.user_id}`}>
                            <UserRound className="mr-2 h-4 w-4" />
                            Ver perfil
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={respondingId === request.request_id}
                          onClick={() => void respondToRequest(request.request_id, false)}
                        >
                          {respondingId === request.request_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          disabled={respondingId === request.request_id}
                          onClick={() => void respondToRequest(request.request_id, true)}
                        >
                          {respondingId === request.request_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Aceptar
                        </Button>
                      </div>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Recibida {formatDate(request.created_at)}
                    </p>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4">
              {outgoing.length === 0 ? (
                <EmptyPanel
                  icon={Clock}
                  title="Sin solicitudes enviadas"
                  body="Las solicitudes que envies desde Discover o desde un perfil quedaran aqui hasta que respondan."
                />
              ) : (
                outgoing.map((request, index) => (
                  <motion.div
                    key={request.request_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <ProfileSummary profile={request.profile} score={request.compatibility_score} reasons={request.compatibility_reasons} />
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          Pendiente
                        </Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/u/${request.profile.user_id}`}>
                            <UserRound className="mr-2 h-4 w-4" />
                            Ver perfil
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Enviada {formatDate(request.created_at)}
                    </p>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {connections.length === 0 ? (
                <EmptyPanel
                  icon={Users}
                  title="Sin conexiones activas"
                  body="Cuando aceptes una solicitud, o alguien acepte la tuya, la conexion aparecera aqui."
                />
              ) : (
                connections.map((connection, index) => (
                  <motion.div
                    key={connection.user_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <ProfileSummary profile={connection.profile} score={connection.compatibility_score} reasons={connection.compatibility_reasons} />
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          Nivel {connection.consent_level ?? 1}
                        </Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/u/${connection.profile.user_id}`}>
                            <UserRound className="mr-2 h-4 w-4" />
                            Perfil
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link to={`/chat/${connection.profile.user_id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Mensaje
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5" />
                      Conectado {formatDate(connection.connected_at)}
                    </p>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
