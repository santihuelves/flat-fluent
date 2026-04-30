import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
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
    sessionStorage.removeItem('convinder-stale-chunk-reload');
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

    const reloadKey = 'convinder-stale-chunk-reload';
    if (sessionStorage.getItem(reloadKey) === 'done') return;

    sessionStorage.setItem(reloadKey, 'done');
    window.location.reload();
  }

  handleReload = () => {
    sessionStorage.removeItem('convinder-stale-chunk-reload');
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
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/chat/:matchId" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/admin" element={import.meta.env.DEV ? <Admin /> : <Navigate to="/" replace />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/test" element={<Test />} />
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
