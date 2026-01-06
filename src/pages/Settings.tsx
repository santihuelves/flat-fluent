import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Bell, Shield, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    listings: false,
    marketing: false,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    toast.error('Esta acción requiere confirmación adicional', {
      description: 'Por favor, contacta con soporte para eliminar tu cuenta.',
    });
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-3xl font-bold mb-8">Configuración</h1>

        <div className="space-y-6">
          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cuenta
              </CardTitle>
              <CardDescription>
                Gestiona tu información de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="tu@email.com"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Contacta con soporte para cambiar tu email
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••"
                />
              </div>
              
              <Button variant="outline">Cambiar contraseña</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura qué notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos matches</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando alguien coincida contigo
                  </p>
                </div>
                <Switch
                  checked={notifications.matches}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, matches: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mensajes</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando recibas un nuevo mensaje
                  </p>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, messages: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos anuncios</p>
                  <p className="text-sm text-muted-foreground">
                    Anuncios que coincidan con tu búsqueda
                  </p>
                </div>
                <Switch
                  checked={notifications.listings}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, listings: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novedades y ofertas</p>
                  <p className="text-sm text-muted-foreground">
                    Noticias sobre Convinder
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, marketing: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad
              </CardTitle>
              <CardDescription>
                Controla tu visibilidad y datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Perfil visible</p>
                  <p className="text-sm text-muted-foreground">
                    Otros usuarios pueden ver tu perfil
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar en búsquedas</p>
                  <p className="text-sm text-muted-foreground">
                    Aparecer en Discover para otros usuarios
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full">
                Descargar mis datos
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Zona de peligro
              </CardTitle>
              <CardDescription>
                Acciones irreversibles
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
