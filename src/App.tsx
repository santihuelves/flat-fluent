import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Discover = lazy(() => import("./pages/Discover"));
const Listings = lazy(() => import("./pages/Listings"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const MyListings = lazy(() => import("./pages/MyListings"));
const Matches = lazy(() => import("./pages/Matches"));
const Connections = lazy(() => import("./pages/Connections"));
const Chat = lazy(() => import("./pages/Chat"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Test = lazy(() => import("./pages/Test"));
const Debug = lazy(() => import("./pages/Debug"));
const GitHubConnection = lazy(() => import("./pages/GitHubConnection"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">Cargando...</p>
    </div>
  </div>
);

const protectedRouteMessages: Record<string, string> = {
  '/onboarding': 'Crea tu cuenta o inicia sesión para completar tu perfil.',
  '/welcome': 'Crea tu cuenta o inicia sesión para empezar en Convinter.',
  '/discover': 'Inicia sesión para descubrir personas compatibles.',
  '/listings': 'Inicia sesión para ver anuncios y contactar con personas compatibles.',
  '/my-listings': 'Inicia sesión para gestionar tus anuncios.',
  '/matches': 'Inicia sesión para ver tus mensajes y conexiones.',
  '/connections': 'Inicia sesión para ver tus conexiones.',
  '/notifications': 'Inicia sesión para ver tus notificaciones.',
  '/profile': 'Inicia sesión para ver y editar tu perfil.',
  '/settings': 'Inicia sesión para configurar tu cuenta.',
  '/create-listing': 'Inicia sesión para publicar un anuncio.',
  '/test': 'Crea tu cuenta o inicia sesión para hacer el test y guardar tus resultados.',
};

const getProtectedRouteMessage = (pathname: string) => {
  if (pathname.startsWith('/listing/')) {
    return 'Inicia sesión para ver el anuncio completo y contactar.';
  }

  if (pathname.startsWith('/u/')) {
    return 'Inicia sesión para ver perfiles completos y contactar.';
  }

  if (pathname.startsWith('/chat/')) {
    return 'Inicia sesión para continuar la conversación.';
  }

  return protectedRouteMessages[pathname] ?? 'Inicia sesión para continuar.';
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session));
      setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session));
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isCheckingSession) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    const searchParams = new URLSearchParams({
      redirect,
      reason: getProtectedRouteMessage(location.pathname),
    });

    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  return children;
};

const isStaleChunkError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'dynamically imported module',
    'ChunkLoadError',
    'Loading chunk',
  ].some((fragment) => message.includes(fragment));
};

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  isChunkError: boolean;
};

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    isChunkError: false,
  };

  componentDidMount() {
    sessionStorage.removeItem('convinter-stale-chunk-reload');
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      isChunkError: isStaleChunkError(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Application render error:', error, errorInfo);

    if (!isStaleChunkError(error)) return;

    const reloadKey = 'convinter-stale-chunk-reload';
    if (sessionStorage.getItem(reloadKey) === 'done') return;

    sessionStorage.setItem(reloadKey, 'done');
    window.location.reload();
  }

  handleReload = () => {
    sessionStorage.removeItem('convinter-stale-chunk-reload');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">
            {this.state.isChunkError ? 'Actualizando la app' : 'Algo no ha cargado bien'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.isChunkError
              ? 'Hay una version nueva disponible. Recarga la pagina para continuar.'
              : 'Recarga la pagina para recuperar la vista.'}
          </p>
          <Button className="mt-5 gap-2" onClick={this.handleReload}>
            <RefreshCw className="h-4 w-4" />
            Recargar
          </Button>
        </div>
      </div>
    );
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
              <Route path="/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />
              <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
              <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/chat/:matchId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/u/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="/admin" element={import.meta.env.DEV ? <Admin /> : <Navigate to="/" replace />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
              <Route path="/debug" element={import.meta.env.DEV ? <Debug /> : <Navigate to="/" replace />} />
              <Route path="/github" element={import.meta.env.DEV ? <GitHubConnection /> : <Navigate to="/" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
