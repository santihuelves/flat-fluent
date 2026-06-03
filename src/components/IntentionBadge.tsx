import { Home, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

type LegacyIntentionType = 'seek_room' | 'offer_room' | 'seek_flatmate';
type SupportedIntentionType = Exclude<LegacyIntentionType, 'seek_flatmate'>;
type IntentionBadgeItem = {
  intention_type: LegacyIntentionType;
  is_primary: boolean;
  urgency?: string;
};
type SupportedIntentionBadgeItem = IntentionBadgeItem & {
  intention_type: SupportedIntentionType;
};

interface IntentionBadgeProps {
  intentionType: SupportedIntentionType;
  isPrimary?: boolean;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
  perspective?: 'self' | 'public';
}

export const IntentionBadge = ({ 
  intentionType, 
  variant = 'default',
  showIcon = true,
  perspective = 'public',
}: IntentionBadgeProps) => {
  const { t } = useTranslation();

  const selfLabels = {
    seek_room: 'Busco habitación',
    offer_room: 'Ofrezco habitación',
  };

  const config = {
    seek_room: {
      icon: Home,
      label: perspective === 'self' ? selfLabels.seek_room : t('discover.filters.intentions.seek_room'),
      color: 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    },
    offer_room: {
      icon: Key,
      label: perspective === 'self' ? selfLabels.offer_room : t('discover.filters.intentions.offer_room'),
      color: 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    }
  };

  const { icon: Icon, label, color } = config[intentionType];

  if (variant === 'compact') {
    return (
      <Badge 
        variant="outline" 
        className={`rounded-full text-xs ${color}`}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {label}
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${color}`}>
      {showIcon && <Icon className="h-4 w-4" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

interface IntentionBadgesProps {
  intentions: IntentionBadgeItem[];
  variant?: 'default' | 'compact';
  maxDisplay?: number;
  perspective?: 'self' | 'public';
}

export const IntentionBadges = ({ 
  intentions, 
  variant = 'compact',
  maxDisplay = 3,
  perspective = 'public',
}: IntentionBadgesProps) => {
  if (!intentions || intentions.length === 0) return null;

  const supportedIntentions = intentions.filter((
    intention
  ): intention is SupportedIntentionBadgeItem => intention.intention_type !== 'seek_flatmate');
  if (supportedIntentions.length === 0) return null;

  // Sort by primary first
  const sortedIntentions = [...supportedIntentions].sort((a, b) =>
    (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  );

  const displayIntentions = sortedIntentions.slice(0, maxDisplay);
  const remainingCount = supportedIntentions.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayIntentions.map((intention, index) => (
        <IntentionBadge
          key={`${intention.intention_type}-${index}`}
          intentionType={intention.intention_type}
          variant={variant}
          perspective={perspective}
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
