import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const faqs = [
  {
    question: '¿Cómo funciona Convinter?',
    answer: 'Convinter utiliza un test de compatibilidad avanzado para encontrar compañeros de piso que realmente encajen contigo. Completa tu perfil, realiza el test, y empieza a descubrir personas compatibles. Cuando dos personas se gustan mutuamente, ¡es un match!'
  },
  {
    question: '¿Es gratis usar Convinter?',
    answer: 'Sí, Convinter es completamente gratis para uso básico. Puedes crear tu perfil, realizar el test de compatibilidad, ver perfiles y hacer matches sin coste. Próximamente lanzaremos funciones premium opcionales.'
  },
  {
    question: '¿Cómo se calcula la compatibilidad?',
    answer: 'Nuestro algoritmo analiza múltiples factores: horarios, hábitos de limpieza, nivel de ruido, preferencias sociales, mascotas, fumador/no fumador, y más. El test de compatibilidad genera un perfil detallado que comparamos con otros usuarios.'
  },
  {
    question: '¿Puedo buscar habitación y compañero a la vez?',
    answer: 'Sí, puedes configurar tu perfil para buscar habitación (si necesitas un piso), ofrecer habitación (si tienes una disponible), o buscar compañero (para alquilar juntos). Incluso puedes combinar opciones.'
  },
  {
    question: '¿Cómo verifico mi perfil?',
    answer: 'Ofrecemos varios niveles de verificación: email, teléfono y documento de identidad. Los perfiles verificados generan más confianza y tienen mejor visibilidad. Ve a tu perfil y sigue los pasos de verificación.'
  },
  {
    question: '¿Qué hago si tengo un problema con un usuario?',
    answer: 'Puedes reportar a cualquier usuario desde su perfil. Nuestro equipo revisará el reporte y tomará las medidas necesarias. También puedes bloquear usuarios para que no puedan contactarte.'
  },
  {
    question: '¿Cómo elimino mi cuenta?',
    answer: 'Ve a Configuración > Zona de peligro > Eliminar cuenta. Ten en cuenta que esta acción es irreversible y perderás todos tus datos, matches y conversaciones.'
  },
  {
    question: '¿En qué ciudades está disponible Convinter?',
    answer: 'Actualmente estamos disponibles en las principales ciudades de España: Madrid, Barcelona, Valencia, Sevilla, Bilbao, Zaragoza, Málaga, Granada, San Sebastián, Alicante, A Coruña y Palma. Próximamente ampliaremos a más ciudades.'
  },
];

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FAQ() {
  useSEO({ page: 'faq', structuredData: faqStructuredData });

  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h1>
          <p className="text-muted-foreground">
            Encuentra respuestas a las preguntas más comunes sobre Convinter
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12 p-6 rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">
            ¿No encuentras lo que buscas?
          </p>
          <a 
            href="/contact" 
            className="text-primary hover:underline font-medium"
          >
            Contacta con nosotros
          </a>
        </div>
      </div>
    </Layout>
  );
}
