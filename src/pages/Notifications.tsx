import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bell, CheckCheck, Home, Inbox, Loader2, MessageCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  type AppNotification,
  getNotificationCopy,
  getNotificationPath,
  useNotifications,
} from '@/hooks/useNotifications';

const formatNotificationTime = (date: string | null) => {
  if (!date) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'NEW_MESSAGE':
      return MessageCircle;
    case 'CONSENT_REQUEST_RECEIVED':
    case 'CONSENT_REQUEST_ACCEPTED':
    case 'CONSENT_REQUEST_REJECTED':
      return UserCheck;
    case 'LISTING_VERIFIED':
    case 'LISTING_VERIFICATION_REJECTED':
      return Home;
    case 'SELFIE_APPROVED':
    case 'SELFIE_REJECTED':
      return ShieldCheck;
    case 'MOD_WARNING':
    case 'MOD_RESTRICTION':
      return AlertTriangle;
    default:
      return Inbox;
  }
};

const getNotificationAction = (notification: AppNotification) => {
  switch (notification.notification_type) {
    case 'NEW_MESSAGE':
      return 'Abrir chat';
    case 'CONSENT_REQUEST_RECEIVED':
    case 'CONSENT_REQUEST_ACCEPTED':
    case 'CONSENT_REQUEST_REJECTED':
      return 'Ver conexiones';
    case 'REQUEST_FULL_TEST':
      return 'Ver test';
    case 'LISTING_VERIFIED':
    case 'LISTING_VERIFICATION_REJECTED':
      return 'Ver anuncio';
    case 'SELFIE_APPROVED':
    case 'SELFIE_REJECTED':
    case 'MOD_WARNING':
    case 'MOD_RESTRICTION':
      return 'Ver ajustes';
    default:
      return 'Abrir';
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const handleOpenNotification = async (notification: AppNotification) => {
    await markAsRead(notification.id);
    window.dispatchEvent(new CustomEvent('convinter:notifications-read'));
    navigate(getNotificationPath(notification));
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    window.dispatchEvent(new CustomEvent('convinter:notifications-read'));
  };

  const handleMarkOne = async (notificationId: number) => {
    await markAsRead(notificationId);
    window.dispatchEvent(new CustomEvent('convinter:notifications-read'));
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" className="mb-4 gap-2 px-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
                <p className="text-muted-foreground">
                  Revisa mensajes, solicitudes y avisos importantes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar
            </Button>
            <Button onClick={() => void handleMarkAll()} disabled={unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar leídas
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'} className="rounded-full">
            {unreadCount} sin leer
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {notifications.length} recientes
          </Badge>
        </div>

        {isLoading && notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando notificaciones...
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">Todo tranquilo por ahora</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cuando recibas mensajes, solicitudes de compatibilidad o avisos importantes aparecerán aquí.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/discover">Explorar perfiles</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const copy = getNotificationCopy(notification);
              const Icon = getNotificationIcon(notification.notification_type);
              const unread = !notification.read_at;

              return (
                <Card
                  key={notification.id}
                  className={`transition-colors ${unread ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      unread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{copy.title}</h2>
                        {unread && (
                          <Badge variant="destructive" className="rounded-full">
                            Nueva
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <Button size="sm" onClick={() => void handleOpenNotification(notification)}>
                        {getNotificationAction(notification)}
                      </Button>
                      {unread && (
                        <Button size="sm" variant="ghost" onClick={() => void handleMarkOne(notification.id)}>
                          Marcar leída
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
