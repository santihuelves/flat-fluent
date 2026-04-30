import { Layout } from '@/components/layout/Layout';
import { useSEO } from '@/hooks/useSEO';

export default function Cookies() {
  useSEO({ page: 'cookies' });

  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Política de Cookies</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. ¿Qué son las cookies?</h2>
            <p className="text-muted-foreground">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
              cuando visitas un sitio web. Nos permiten recordar tus preferencias y mejorar 
              tu experiencia de navegación.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Cookies que utilizamos</h2>
            <p className="text-muted-foreground">
              <strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico 
              del sitio, como mantener tu sesión iniciada.
            </p>
            <p className="text-muted-foreground">
              <strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo interactúas 
              con el sitio para mejorarlo.
            </p>
            <p className="text-muted-foreground">
              <strong>Cookies de funcionalidad:</strong> Recuerdan tus preferencias como 
              idioma o tema visual.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Cookies de terceros</h2>
            <p className="text-muted-foreground">
              Utilizamos servicios de terceros que pueden establecer sus propias cookies, 
              como Google Analytics para análisis de uso. Estos servicios tienen sus propias 
              políticas de privacidad.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Control de cookies</h2>
            <p className="text-muted-foreground">
              Puedes controlar y/o eliminar las cookies desde la configuración de tu navegador. 
              Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Más información</h2>
            <p className="text-muted-foreground">
              Para más información sobre cómo gestionamos tus datos, consulta nuestra 
              <a href="/privacy" className="text-primary hover:underline ml-1">Política de Privacidad</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
