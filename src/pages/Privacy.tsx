import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Información que recopilamos</h2>
            <p className="text-muted-foreground">
              Recopilamos información que nos proporcionas directamente, como tu nombre, email, 
              fotos, preferencias de vivienda y respuestas al test de compatibilidad. También 
              recopilamos datos de uso automáticamente, como tu dirección IP y tipo de dispositivo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Cómo usamos tu información</h2>
            <p className="text-muted-foreground">
              Utilizamos tu información para proporcionar y mejorar nuestros servicios, 
              calcular compatibilidad con otros usuarios, enviarte notificaciones relevantes 
              y garantizar la seguridad de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Compartición de información</h2>
            <p className="text-muted-foreground">
              Tu perfil público es visible para otros usuarios de Convinter. No vendemos 
              tu información personal a terceros. Podemos compartir datos agregados y 
              anonimizados con fines analíticos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Tus derechos</h2>
            <p className="text-muted-foreground">
              Tienes derecho a acceder, corregir o eliminar tu información personal. 
              Puedes descargar tus datos desde la configuración de tu cuenta o 
              solicitar su eliminación contactando con nosotros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Seguridad</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas para proteger 
              tu información, incluyendo encriptación de datos y acceso restringido.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier pregunta sobre esta política, contacta con nosotros en: 
              privacidad@convinter.com
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
