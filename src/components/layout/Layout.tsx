import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showMobileNav?: boolean;
}

export function Layout({ children, showFooter = true, showMobileNav = true }: LayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (isLanding) {
      document.body.classList.add('landing-page');
      document.documentElement.classList.add('landing-page');
    } else {
      document.body.classList.remove('landing-page');
      document.documentElement.classList.remove('landing-page');
    }
    
    return () => {
      document.body.classList.remove('landing-page');
      document.documentElement.classList.remove('landing-page');
    };
  }, [isLanding]);

  return (
    <div className={`min-h-screen flex flex-col ${isLanding ? '' : 'relative'}`}>
      <Header />
      <main className={`flex-1 ${showMobileNav ? 'pb-20 md:pb-0' : ''} ${isLanding ? 'relative z-10' : 'relative'}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showMobileNav && !isLanding && <MobileNav />}
    </div>
  );
}
