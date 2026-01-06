import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Search, MapPin, Euro, Calendar, Filter, Heart, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

// Mock data for demo
const mockProfiles = [
  {
    id: 1,
    name: 'María García',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    city: 'Madrid',
    neighborhood: 'Malasaña',
    budget: '400-500€',
    score: 92,
    reasons: ['Horarios similares', 'Ambos trabajan desde casa', 'Prefieren casa tranquila'],
    friction: 'Ella tiene un gato, revisa si tienes alergias',
    tags: ['No fumador', 'Teletrabajo', 'Tranquilo'],
    testDone: true,
  },
  {
    id: 2,
    name: 'Carlos Ruiz',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    city: 'Madrid',
    neighborhood: 'Lavapiés',
    budget: '350-450€',
    score: 85,
    reasons: ['Limpieza similar (4/5)', 'Ambos madrugadores', 'Gastos compartidos OK'],
    friction: 'Él es más social, tú prefieres tranquilidad',
    tags: ['No fumador', 'Estudiante', 'Social'],
    testDone: true,
  },
  {
    id: 3,
    name: 'Ana Martínez',
    age: 31,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    budget: '500-600€',
    score: 78,
    reasons: ['Ambos trabajan fuera', 'Sin mascotas', 'Horarios compatibles'],
    friction: 'Diferente nivel de limpieza',
    tags: ['No fumador', 'Profesional', 'Tranquilo'],
    testDone: true,
  },
];

export default function Discover() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentProfile = mockProfiles[currentIndex];

  const handleLike = () => {
    setDirection('right');
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
    }, 300);
  };

  const handlePass = () => {
    setDirection('left');
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
    }, 300);
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('common.search') + '...'} 
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Madrid
            </Button>
            <Button variant="outline" className="gap-2">
              <Euro className="h-4 w-4" />
              300-500€
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-lg mx-auto">
          <motion.div
            key={currentProfile.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
              rotate: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Photo */}
            <div className="relative h-80">
              <img 
                src={currentProfile.photo} 
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Score Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-success text-success-foreground font-semibold">
                <Star className="h-4 w-4" />
                {currentProfile.score}%
              </div>

              {/* Name & Info */}
              <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                <h2 className="text-2xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="h-4 w-4" />
                  {currentProfile.neighborhood}, {currentProfile.city}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {currentProfile.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
                <Badge variant="outline" className="rounded-full">
                  <Euro className="h-3 w-3 mr-1" />
                  {currentProfile.budget}
                </Badge>
              </div>

              {/* Compatibility Reasons */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {t('matches.reasons')}
                </h3>
                <ul className="space-y-1">
                  {currentProfile.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-success">✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Friction Warning */}
              {currentProfile.friction && (
                <div className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                  <h3 className="font-semibold text-sm text-accent-foreground mb-1">
                    {t('matches.friction')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{currentProfile.friction}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-6 p-6 pt-0">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-16 w-16 rounded-full border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                onClick={handlePass}
              >
                <X className="h-8 w-8 text-destructive" />
              </Button>
              <Button 
                variant="hero" 
                size="icon" 
                className="h-20 w-20 rounded-full"
                onClick={handleLike}
              >
                <Heart className="h-10 w-10" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
