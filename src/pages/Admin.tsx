import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, MessageSquare, TrendingUp, Shield } from 'lucide-react';

export default function Admin() {
  // Mock stats
  const stats = [
    { label: 'Usuarios registrados', value: '1,234', icon: Users, trend: '+12%' },
    { label: 'Anuncios activos', value: '567', icon: Home, trend: '+8%' },
    { label: 'Matches realizados', value: '2,891', icon: MessageSquare, trend: '+23%' },
    { label: 'Tasa de conversión', value: '34%', icon: TrendingUp, trend: '+5%' },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, anuncios y estadísticas
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios recientes</CardTitle>
              <CardDescription>Últimos usuarios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidad en desarrollo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anuncios pendientes</CardTitle>
              <CardDescription>Anuncios que requieren revisión</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidad en desarrollo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <CardDescription>Reportes de usuarios y contenido</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No hay reportes pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
              <CardDescription>Registro de actividad del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidad en desarrollo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
