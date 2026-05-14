import { ReactNode, useEffect, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showMobileNav?: boolean;
}

export function Layout({ children, showFooter = true, showMobileNav = true }: LayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const unreadMessages = useUnreadMessages();
  const notifications = useNotifications();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateScrollTopVisibility = () => {
      setShowScrollTop(window.scrollY > 480);
    };

    updateScrollTopVisibility();
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateScrollTopVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header unreadMessages={unreadMessages} notifications={notifications} />
      <main className={`flex-1 ${showMobileNav ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showScrollTop && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={`fixed right-4 z-50 h-11 w-11 rounded-full border border-border/70 bg-background/95 text-black shadow-lg backdrop-blur transition hover:bg-background hover:text-black ${showMobileNav && !isLanding ? 'bottom-24 md:bottom-6' : 'bottom-6'}`}
          onClick={scrollToTop}
          aria-label="Subir arriba"
          title="Subir arriba"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
      {showMobileNav && !isLanding && <MobileNav unreadMessages={unreadMessages} />}
    </div>
  );
}
