import { Bell, CheckCheck, Inbox, MessageCircle, ShieldCheck, UserCheck, Home, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AppNotification,
  getNotificationCopy,
  getNotificationPath,
} from '@/hooks/useNotifications';

type NotificationsMenuProps = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading?: boolean;
  onMarkAsRead: (notificationId: number) => void | Promise<void>;
  onMarkAllAsRead: () => void | Promise<void>;
};

const formatTime = (date: string | null) => {
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

export function NotificationsMenu({
  notifications,
  unreadCount,
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsMenuProps) {
  const navigate = useNavigate();

  const handleOpenNotification = async (notification: AppNotification) => {
    await onMarkAsRead(notification.id);
    window.dispatchEvent(new CustomEvent('convinter:notifications-read'));
    navigate(getNotificationPath(notification));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-1rem)] bg-background p-0">
        <div className="flex items-center justify-between px-3 py-3">
          <div>
            <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={(event) => {
                event.preventDefault();
                navigate('/notifications');
              }}
            >
              Ver todo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={unreadCount === 0}
              onClick={(event) => {
                event.preventDefault();
                void Promise.resolve(onMarkAllAsRead()).then(() => {
                  window.dispatchEvent(new CustomEvent('convinter:notifications-read'));
                });
              }}
            >
              <CheckCheck className="h-4 w-4" />
              Leer
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto py-1">
          {isLoading && notifications.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Cargando actividad...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sin notificaciones por ahora.
            </div>
          )}

          {notifications.map((notification) => {
            const copy = getNotificationCopy(notification);
            const unread = !notification.read_at;
            const Icon = getNotificationIcon(notification.notification_type);

            return (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer items-start gap-3 rounded-none px-3 py-3"
                onClick={() => {
                  void handleOpenNotification(notification);
                }}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="block text-sm font-medium leading-tight">{copy.title}</span>
                    {unread && (
                      <Badge variant="destructive" className="h-5 rounded-full px-2 text-[10px]">
                        Nueva
                      </Badge>
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">
                    {copy.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatTime(notification.created_at)}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
