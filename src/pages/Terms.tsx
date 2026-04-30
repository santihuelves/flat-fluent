import { Layout } from '@/components/layout/Layout';
import { useSEO } from '@/hooks/useSEO';

export default function Terms() {
  useSEO({ page: 'terms' });

  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Aceptación de los términos</h2>
            <p className="text-muted-foreground">
              Al acceder y utilizar Convinter, aceptas estos términos y condiciones en su totalidad. 
              Si no estás de acuerdo con alguna parte, no debes utilizar nuestros servicios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Uso del servicio</h2>
            <p className="text-muted-foreground">
              Debes ser mayor de 18 años para usar Convinter. Te comprometes a proporcionar 
              información veraz y a utilizar el servicio de manera responsable. Está prohibido 
              el uso fraudulento, el acoso y cualquier actividad ilegal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Contenido del usuario</h2>
            <p className="text-muted-foreground">
              Eres responsable del contenido que publiques. Nos otorgas una licencia para usar, 
              mostrar y distribuir tu contenido dentro de la plataforma. Nos reservamos el derecho 
              de eliminar contenido que viole nuestras normas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Propiedad intelectual</h2>
            <p className="text-muted-foreground">
              Convinter y todo su contenido, características y funcionalidad son propiedad de 
              Convinter S.L. y están protegidos por leyes de propiedad intelectual.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Limitación de responsabilidad</h2>
            <p className="text-muted-foreground">
              Convinter actúa como intermediario y no se responsabiliza de las interacciones 
              entre usuarios ni de los acuerdos de alquiler que puedan derivarse. Recomendamos 
              verificar la identidad y tomar precauciones en los encuentros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Modificaciones</h2>
            <p className="text-muted-foreground">
              Podemos modificar estos términos en cualquier momento. Te notificaremos de cambios 
              significativos por email o mediante aviso en la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Contacto</h2>
            <p className="text-muted-foreground">
              Para consultas sobre estos términos: legal@convinter.com
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
