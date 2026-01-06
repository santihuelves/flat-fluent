import { ReactNode } from 'react';
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${showMobileNav ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showMobileNav && !isLanding && <MobileNav />}
    </div>
  );
}
