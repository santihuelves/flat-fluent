import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { MessageCircle, Star, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const mockMatches = [
  {
    id: 1,
    user: {
      name: 'María García',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      city: 'Madrid',
    },
    score: 92,
    reasons: ['Horarios similares', 'Trabajan desde casa', 'Casa tranquila'],
    lastMessage: '¡Hola! Me encantaría conocer más sobre el piso.',
    lastMessageTime: 'Hace 2h',
    unread: 2,
  },
  {
    id: 2,
    user: {
      name: 'Carlos Ruiz',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      city: 'Madrid',
    },
    score: 85,
    reasons: ['Limpieza similar', 'Madrugadores', 'Gastos compartidos'],
    lastMessage: 'Perfecto, ¿quedamos para ver el piso?',
    lastMessageTime: 'Ayer',
    unread: 0,
  },
];

export default function Matches() {
  const { t } = useTranslation();

  if (mockMatches.length === 0) {
    return (
      <Layout>
        <div className="container py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('matches.noMatches')}</h2>
            <p className="text-muted-foreground mb-6">
              Cuando alguien te dé like y tú también, aparecerán aquí.
            </p>
            <Link to="/discover">
              <Button variant="hero" className="gap-2">
                <Search className="h-5 w-5" />
                {t('matches.startExploring')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-8">{t('matches.title')}</h1>

        <div className="space-y-4 max-w-2xl">
          {mockMatches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-4 card-hover"
            >
              <Link to={`/chat/${match.id}`} className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img 
                    src={match.user.photo} 
                    alt={match.user.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  {/* Score */}
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success text-success-foreground text-xs font-semibold">
                    <Star className="h-3 w-3" />
                    {match.score}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{match.user.name}</h3>
                    <span className="text-xs text-muted-foreground">{match.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {match.lastMessage}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {match.reasons.slice(0, 2).map((reason, j) => (
                      <Badge key={j} variant="secondary" className="text-xs rounded-full">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {match.unread > 0 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full gradient-bg text-primary-foreground text-xs font-semibold">
                      {match.unread}
                    </span>
                  )}
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
