import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Bell, Shield, Trash2, LogOut, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Visibility = Database['public']['Enums']['convinter_visibility'];

type NotificationSettings = {
  matches: boolean;
  messages: boolean;
  listings: boolean;
  marketing: boolean;
};

const NOTIFICATIONS_KEY = 'convinder-notification-settings';

const defaultNotifications: NotificationSettings = {
  matches: true,
  messages: true,
  listings: false,
  marketing: false,
};

const readNotificationSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return defaultNotifications;
    return { ...defaultNotifications, ...JSON.parse(raw) };
  } catch {
    return defaultNotifications;
  }
};

const getVisibilityFromToggles = (profileVisible: boolean, searchable: boolean): Visibility => {
  if (!profileVisible) return 'hidden';
  return searchable ? 'public' : 'registered_only';
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState<NotificationSettings>(() => readNotificationSettings());
  const [profileVisible, setProfileVisible] = useState(true);
  const [searchable, setSearchable] = useState(true);

  const visibility = useMemo(
    () => getVisibilityFromToggles(profileVisible, searchable),
    [profileVisible, searchable],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;
    setUser(currentUser);

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('convinter_profiles')
      .select('visibility')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn('Error loading privacy settings:', error);
      toast.warning('No se pudo cargar la privacidad del perfil.');
    }

    const currentVisibility = profile?.visibility ?? 'public';
    setProfileVisible(currentVisibility !== 'hidden');
    setSearchable(currentVisibility === 'public');
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveNotifications = (next: NotificationSettings) => {
    setNotifications(next);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    toast.success('Preferencias guardadas');
  };

  const savePrivacy = async (nextProfileVisible: boolean, nextSearchable: boolean) => {
    if (!user) {
      toast.error('Inicia sesión para cambiar la privacidad.');
      return;
    }

    const nextVisibility = getVisibilityFromToggles(nextProfileVisible, nextSearchable);
    setProfileVisible(nextProfileVisible);
    setSearchable(nextProfileVisible ? nextSearchable : false);
    setSavingPrivacy(true);

    const { error } = await supabase
      .from('convinter_profiles')
      .upsert({
        user_id: user.id,
        visibility: nextVisibility,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    setSavingPrivacy(false);

    if (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('No se pudo guardar la privacidad.');
      await loadSettings();
      return;
    }

    toast.success('Privacidad actualizada');
  };

  const handlePasswordChange = async () => {
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      console.error('Error updating password:', error);
      toast.error('No se pudo cambiar la contraseña.');
      return;
    }

    setPassword('');
    setConfirmPassword('');
    toast.success('Contraseña actualizada');
  };

  const handleDownloadData = async () => {
    if (!user) {
      toast.error('Inicia sesión para descargar tus datos.');
      return;
    }

    const [{ data: profile }, { data: listings }, { data: intentions }] = await Promise.all([
      supabase.from('convinter_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('convinter_listings').select('*').eq('owner_id', user.id),
      supabase.from('convinter_profile_intentions').select('*').eq('profile_id', user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile,
      intentions: intentions ?? [],
      listings: listings ?? [],
      notifications,
      privacy: { visibility },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `convinder-datos-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    toast.error('Esta acción requiere confirmación adicional', {
      description: 'Por seguridad, contacta con soporte para eliminar tu cuenta de forma definitiva.',
    });
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Ajusta tu cuenta, privacidad y preferencias de uso.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cuenta
              </CardTitle>
              <CardDescription>
                Gestiona tu acceso y datos principales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loading ? 'Cargando...' : user?.email ?? 'No has iniciado sesión'}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  El cambio de email requiere verificación adicional.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
              </div>

              <Button
                variant="outline"
                onClick={handlePasswordChange}
                disabled={savingPassword || !user}
              >
                {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Guarda tus preferencias en este dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['matches', 'Nuevos matches', 'Cuando alguien coincida contigo.'],
                ['messages', 'Mensajes', 'Cuando recibas un nuevo mensaje.'],
                ['listings', 'Nuevos anuncios', 'Anuncios que coincidan con tu búsqueda.'],
                ['marketing', 'Novedades y ofertas', 'Noticias sobre Convinder.'],
              ].map(([key, title, description], index) => (
                <div key={key}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof NotificationSettings]}
                      onCheckedChange={(checked) =>
                        saveNotifications({ ...notifications, [key]: checked })
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad
              </CardTitle>
              <CardDescription>
                Controla cómo aparece tu perfil en Convinder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Perfil visible</p>
                  <p className="text-sm text-muted-foreground">
                    Otros usuarios registrados pueden ver tu perfil.
                  </p>
                </div>
                <Switch
                  checked={profileVisible}
                  disabled={savingPrivacy || !user}
                  onCheckedChange={(checked) => void savePrivacy(checked, checked ? searchable : false)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Mostrar en Discover</p>
                  <p className="text-sm text-muted-foreground">
                    Permite que tu perfil aparezca en búsquedas y recomendaciones.
                  </p>
                </div>
                <Switch
                  checked={profileVisible && searchable}
                  disabled={savingPrivacy || !user || !profileVisible}
                  onCheckedChange={(checked) => void savePrivacy(profileVisible, checked)}
                />
              </div>

              <Separator />

              <Button variant="outline" className="w-full" onClick={handleDownloadData} disabled={!user}>
                <Download className="mr-2 h-4 w-4" />
                Descargar mis datos
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Zona de peligro
              </CardTitle>
              <CardDescription>
                Acciones sensibles de la cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar cuenta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
