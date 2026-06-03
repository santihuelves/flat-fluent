import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Sparkles, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useSEO } from '@/hooks/useSEO';

const getSafeNext = (next: string | null) => {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/discover';
  }

  if (next === '/welcome') {
    return '/discover';
  }

  return next;
};

export default function Welcome() {
  useSEO({
    page: 'welcome',
    fallbackTitle: 'Bienvenida',
    fallbackDescription: 'Elige si quieres completar tu perfil de Convinter o explorar primero.',
    noIndex: true,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeNext(searchParams.get('next'));
  const exploreTarget = next === '/onboarding' ? '/discover' : next;

  return (
    <Layout showFooter={false}>
      <main className="container flex min-h-[calc(100vh-4rem)] items-center py-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-3xl"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
              Bienvenido/a a Convinter
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              Puedes completar tu perfil ahora para recibir mejores coincidencias o echar un vistazo primero.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="group flex h-full flex-col rounded-2xl border border-primary/25 bg-primary/5 p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <UserRoundCheck className="h-5 w-5" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold">Completar mi perfil</h2>
                <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                  Recomendado
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Añade tus preferencias, convivencia, ubicación e intenciones para que los filtros y las coincidencias trabajen mejor para ti.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Empezar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate(exploreTarget)}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
                <Eye className="h-5 w-5" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Quiero echar un vistazo</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Entra a descubrir cómo se ve la plataforma. Podrás completar el perfil después desde tu cuenta.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                Explorar primero
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </motion.section>
      </main>
    </Layout>
  );
}
