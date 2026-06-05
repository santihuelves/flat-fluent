import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapPin, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ListingBadge = {
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
};

type ListingFact = {
  icon: LucideIcon;
  label: string;
};

type ListingMeta = {
  label: string;
  icon?: LucideIcon;
};

type RoomListingSummaryCardProps = {
  href: string;
  image: string;
  title: string;
  badges: ListingBadge[];
  meta: ListingMeta[];
  description?: string | null;
  facts: ListingFact[];
  quickFacts: ListingFact[];
  footer: ReactNode;
  actions: ReactNode;
  imageAlt?: string;
  hover?: boolean;
};

export const RoomListingSummaryCard = ({
  href,
  image,
  title,
  badges,
  meta,
  description,
  facts,
  quickFacts,
  footer,
  actions,
  imageAlt = title,
  hover = true,
}: RoomListingSummaryCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card rounded-2xl overflow-hidden ${hover ? 'card-hover' : ''}`}
  >
    <div className="grid sm:grid-cols-[180px_1fr]">
      <Link to={href} className="block bg-muted">
        <img src={image} alt={imageAlt} className="h-48 sm:h-full w-full object-cover" />
      </Link>

      <div className="p-5 space-y-4">
        <div className="min-w-0">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {badges.map(({ label, icon: Icon, variant = 'outline' }) => (
                <Badge key={label} variant={variant} className="rounded-full">
                  {Icon && <Icon className="h-3 w-3 mr-1" />}
                  {label}
                </Badge>
              ))}
            </div>
          )}

          <Link to={href} className="hover:text-primary transition-colors">
            <h2 className="font-semibold text-lg line-clamp-2">{title}</h2>
          </Link>

          {meta.length > 0 && (
            <div className="mt-1 space-y-1">
              {meta.map(({ label, icon: Icon = MapPin }) => (
                <div key={label} className="flex items-center gap-1 text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm line-clamp-1">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {facts.length > 1 && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-primary/5 p-3 text-sm">
            {facts.map(({ icon: Icon, label }) => (
              <div key={`${label}`} className="flex items-center gap-2 text-primary">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium leading-tight text-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}

        {quickFacts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {quickFacts.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-3 pt-3 border-t border-border/50 ${footer ? 'justify-between' : 'justify-start'}`}>
          {footer && <div className="min-w-0">{footer}</div>}
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      </div>
    </div>
  </motion.article>
);
