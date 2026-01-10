import { Home, Key, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface IntentionBadgeProps {
  intentionType: 'seek_room' | 'offer_room' | 'seek_flatmate';
  isPrimary?: boolean;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

export const IntentionBadge = ({ 
  intentionType, 
  isPrimary = false, 
  variant = 'default',
  showIcon = true 
}: IntentionBadgeProps) => {
  const { t } = useTranslation();

  const config = {
    seek_room: {
      icon: Home,
      label: t('discover.filters.intentions.seek_room'),
      color: 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    },
    offer_room: {
      icon: Key,
      label: t('discover.filters.intentions.offer_room'),
      color: 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    },
    seek_flatmate: {
      icon: Users,
      label: t('discover.filters.intentions.seek_flatmate'),
      color: 'bg-green-500/20 text-green-600 border-green-500/30'
    }
  };

  const { icon: Icon, label, color } = config[intentionType];

  if (variant === 'compact') {
    return (
      <Badge 
        variant="outline" 
        className={`rounded-full text-xs ${color} ${isPrimary ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {label}
        {isPrimary && <span className="ml-1 text-[10px]">★</span>}
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${color} ${isPrimary ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
      {showIcon && <Icon className="h-4 w-4" />}
      <span className="text-sm font-medium">{label}</span>
      {isPrimary && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full">
          {t('common.primary')}
        </span>
      )}
    </div>
  );
};

interface IntentionBadgesProps {
  intentions: Array<{
    intention_type: 'seek_room' | 'offer_room' | 'seek_flatmate';
    is_primary: boolean;
    urgency?: string;
  }>;
  variant?: 'default' | 'compact';
  maxDisplay?: number;
}

export const IntentionBadges = ({ 
  intentions, 
  variant = 'compact',
  maxDisplay = 3 
}: IntentionBadgesProps) => {
  if (!intentions || intentions.length === 0) return null;

  // Sort by primary first
  const sortedIntentions = [...intentions].sort((a, b) => 
    (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  );

  const displayIntentions = sortedIntentions.slice(0, maxDisplay);
  const remainingCount = intentions.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayIntentions.map((intention, index) => (
        <IntentionBadge
          key={`${intention.intention_type}-${index}`}
          intentionType={intention.intention_type}
          isPrimary={intention.is_primary}
          variant={variant}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="rounded-full text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};
