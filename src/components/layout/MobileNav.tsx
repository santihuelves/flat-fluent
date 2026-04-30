import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Home, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  unreadMessages?: number;
}

export function MobileNav({ unreadMessages = 0 }: MobileNavProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { href: '/discover', label: t('nav.discover'), icon: Search },
    { href: '/listings', label: t('nav.listings'), icon: Home },
    { href: '/matches', label: t('nav.messages'), icon: Heart, badge: unreadMessages },
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
            {'badge' in item && item.badge > 0 && (
              <span className="absolute -top-0.5 right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground shadow-sm">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
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
