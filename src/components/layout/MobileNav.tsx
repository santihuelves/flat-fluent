import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Home, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { href: '/discover', label: t('nav.discover'), icon: Search },
    { href: '/listings', label: t('nav.listings'), icon: Home },
    { href: '/matches', label: t('nav.matches'), icon: Heart },
    { href: '/profile', label: t('nav.profile'), icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform",
              isActive(item.href) && "scale-110"
            )} />
            <span className="text-xs font-medium">{item.label}</span>
            {isActive(item.href) && (
              <div className="absolute bottom-1 h-1 w-6 rounded-full gradient-bg" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
