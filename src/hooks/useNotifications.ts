import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AppNotification = {
  id: number;
  notification_type: string;
  payload: Json | null;
  read_at: string | null;
  created_at: string | null;
};

type NotificationPayload = Record<string, unknown>;

const asPayload = (payload: Json | null): NotificationPayload => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as NotificationPayload;
  }

  return {};
};

export const getNotificationCopy = (notification: AppNotification) => {
  const payload = asPayload(notification.payload);
  const message = typeof payload.message === 'string' ? payload.message : null;

  if (message) {
    return {
      title: 'Actividad',
      body: message,
    };
  }

  switch (notification.notification_type) {
    case 'NEW_MESSAGE':
      return {
        title: 'Nuevo mensaje',
        body: 'Tienes un mensaje nuevo en una conversacion.',
      };
    case 'CONSENT_REQUEST_RECEIVED':
      return {
        title: 'Nueva solicitud',
        body: 'Alguien quiere compartir compatibilidad contigo.',
      };
    case 'CONSENT_REQUEST_ACCEPTED':
      return {
        title: 'Compatibilidad aceptada',
        body: 'Ya puedes ver mas informacion y conversar.',
      };
    case 'CONSENT_REQUEST_REJECTED':
      return {
        title: 'Solicitud respondida',
        body: 'Tu solicitud de compatibilidad fue respondida.',
      };
    case 'REQUEST_FULL_TEST':
      return {
        title: 'Test completo solicitado',
        body: 'Un usuario quiere conocer mejor vuestra compatibilidad.',
      };
    case 'LISTING_VERIFIED':
      return {
        title: 'Anuncio verificado',
        body: 'Tu anuncio ha sido verificado.',
      };
    case 'LISTING_VERIFICATION_REJECTED':
      return {
        title: 'Verificacion de anuncio',
        body: 'Tu solicitud de verificacion necesita revision.',
      };
    case 'SELFIE_APPROVED':
      return {
        title: 'Verificacion aprobada',
        body: 'Tu selfie de verificacion ha sido aprobada.',
      };
    case 'SELFIE_REJECTED':
      return {
        title: 'Verificacion rechazada',
        body: 'Tu selfie de verificacion necesita revision.',
      };
    case 'MOD_WARNING':
      return {
        title: 'Aviso de seguridad',
        body: 'Hay un aviso de moderacion en tu cuenta.',
      };
    case 'MOD_RESTRICTION':
      return {
        title: 'Restriccion temporal',
        body: 'Se ha aplicado una restriccion temporal a tu cuenta.',
      };
    case 'DEMO_MATCH_READY':
      return {
        title: 'Demo preparada',
        body: 'Tienes datos demo disponibles para probar.',
      };
    default:
      return {
        title: 'Nueva actividad',
        body: 'Tienes una actualizacion pendiente.',
      };
  }
};

export const getNotificationPath = (notification: AppNotification) => {
  const payload = asPayload(notification.payload);
  const from = typeof payload.from === 'string' ? payload.from : null;
  const fromUser = typeof payload.from_user === 'string' ? payload.from_user : null;
  const byUser = typeof payload.by_user === 'string' ? payload.by_user : null;
  const listingId = typeof payload.listing_id === 'string' ? payload.listing_id : null;

  switch (notification.notification_type) {
    case 'NEW_MESSAGE':
      return from ? `/chat/${from}` : '/matches';
    case 'CONSENT_REQUEST_RECEIVED':
      return '/connections';
    case 'CONSENT_REQUEST_ACCEPTED':
    case 'CONSENT_REQUEST_REJECTED':
      return '/connections';
    case 'REQUEST_FULL_TEST':
      return from ? `/u/${from}` : '/test';
    case 'LISTING_VERIFIED':
    case 'LISTING_VERIFICATION_REJECTED':
      return listingId ? `/listing/${listingId}` : '/my-listings';
    case 'SELFIE_APPROVED':
    case 'SELFIE_REJECTED':
    case 'MOD_WARNING':
    case 'MOD_RESTRICTION':
      return '/settings';
    default:
      return '/matches';
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read_at).length;
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user ?? null;
    setUserId(sessionUser?.id ?? null);

    if (!sessionUser) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('convinter_notifications')
      .select('id, notification_type, payload, read_at, created_at')
      .eq('user_id', sessionUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setIsLoading(false);

    if (error) {
      console.warn('No se pudieron cargar las notificaciones', error);
      return;
    }

    setNotifications((data ?? []) as AppNotification[]);
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read_at: notification.read_at ?? readAt } : notification
      )
    );

    const { error } = await supabase
      .from('convinter_notifications')
      .update({ read_at: readAt })
      .eq('id', notificationId)
      .is('read_at', null);

    if (error) {
      console.warn('No se pudo marcar la notificacion como leida', error);
      await loadNotifications();
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read_at: notification.read_at ?? readAt }))
    );

    const { error } = await supabase
      .from('convinter_notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.warn('No se pudieron marcar las notificaciones como leidas', error);
      await loadNotifications();
    }
  }, [loadNotifications, unreadCount, userId]);

  useEffect(() => {
    void loadNotifications();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadNotifications();
    });

    return () => subscription.unsubscribe();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`convinter-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'convinter_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
