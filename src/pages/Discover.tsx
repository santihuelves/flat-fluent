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
  // Madrid
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
    name: 'Laura Fernández',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    city: 'Madrid',
    neighborhood: 'Chamberí',
    budget: '500-600€',
    score: 88,
    reasons: ['Profesionales ambos', 'Mismo nivel de orden', 'Horarios compatibles'],
    friction: 'Ella prefiere más silencio por las noches',
    tags: ['Profesional', 'Ordenada', 'Tranquilo'],
    testDone: true,
  },
  // Barcelona
  {
    id: 4,
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
  {
    id: 5,
    name: 'Marc Soler',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    city: 'Barcelona',
    neighborhood: 'El Born',
    budget: '450-550€',
    score: 91,
    reasons: ['Estilo de vida similar', 'Ambos creativos', 'Horarios flexibles'],
    friction: 'Él trabaja desde casa, puede haber ruido',
    tags: ['Creativo', 'Freelance', 'Flexible'],
    testDone: true,
  },
  {
    id: 6,
    name: 'Laia Puig',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    city: 'Barcelona',
    neighborhood: 'Eixample',
    budget: '550-650€',
    score: 82,
    reasons: ['Ambas profesionales', 'Gustan de cocinar', 'Mismo nivel de orden'],
    friction: 'Diferentes gustos musicales',
    tags: ['Profesional', 'Cocinera', 'Social'],
    testDone: true,
  },
  // Valencia
  {
    id: 7,
    name: 'Lucía Navarro',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    city: 'Valencia',
    neighborhood: 'Ruzafa',
    budget: '350-450€',
    score: 95,
    reasons: ['Artistas ambos', 'Horarios nocturnos', 'Les gusta socializar'],
    friction: 'Puede haber visitas frecuentes',
    tags: ['Artista', 'Nocturno', 'Social'],
    testDone: true,
  },
  {
    id: 8,
    name: 'Pablo Hernández',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    city: 'Valencia',
    neighborhood: 'El Carmen',
    budget: '300-400€',
    score: 76,
    reasons: ['Estudiantes ambos', 'Presupuesto similar', 'Zona preferida igual'],
    friction: 'Él tiene mascota (perro pequeño)',
    tags: ['Estudiante', 'Mascota', 'Activo'],
    testDone: true,
  },
  // Sevilla
  {
    id: 9,
    name: 'Carmen López',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    city: 'Sevilla',
    neighborhood: 'Triana',
    budget: '280-380€',
    score: 89,
    reasons: ['Profesionales ambas', 'Tranquilas', 'Les gusta el orden'],
    friction: 'Ella viaja mucho por trabajo',
    tags: ['Profesional', 'Viajera', 'Ordenada'],
    testDone: true,
  },
  {
    id: 10,
    name: 'Javier Moreno',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    city: 'Sevilla',
    neighborhood: 'Nervión',
    budget: '300-400€',
    score: 71,
    reasons: ['Deportistas ambos', 'Madrugadores', 'Sin mascotas'],
    friction: 'Diferentes niveles de limpieza',
    tags: ['Deportista', 'Madrugador', 'Activo'],
    testDone: true,
  },
  // Bilbao
  {
    id: 11,
    name: 'Ane Etxebarria',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    city: 'Bilbao',
    neighborhood: 'Casco Viejo',
    budget: '380-480€',
    score: 86,
    reasons: ['Profesionales ambas', 'Teletrabajo', 'Tranquilas'],
    friction: 'Ella prefiere temperatura más alta',
    tags: ['Profesional', 'Teletrabajo', 'Tranquila'],
    testDone: true,
  },
  {
    id: 12,
    name: 'Mikel Aguirre',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
    city: 'Bilbao',
    neighborhood: 'Deusto',
    budget: '320-420€',
    score: 79,
    reasons: ['Universitarios ambos', 'Horarios similares', 'Presupuesto ajustado'],
    friction: 'Él estudia de noche, puede haber luz',
    tags: ['Universitario', 'Nocturno', 'Estudioso'],
    testDone: true,
  },
  // Zaragoza
  {
    id: 13,
    name: 'Sara Pérez',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400',
    city: 'Zaragoza',
    neighborhood: 'Centro',
    budget: '250-350€',
    score: 93,
    reasons: ['Horarios similares', 'Ordenadas', 'Les gusta cocinar juntas'],
    friction: 'Ninguna destacable',
    tags: ['Profesional', 'Cocinera', 'Ordenada'],
    testDone: true,
  },
  // Málaga
  {
    id: 14,
    name: 'Marina Costa',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    city: 'Málaga',
    neighborhood: 'Centro',
    budget: '350-450€',
    score: 84,
    reasons: ['Profesionales ambas', 'Les gusta la playa', 'Sociables'],
    friction: 'Ella tiene horarios irregulares',
    tags: ['Profesional', 'Playera', 'Social'],
    testDone: true,
  },
  {
    id: 15,
    name: 'Alejandro Ruiz',
    age: 31,
    photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400',
    city: 'Málaga',
    neighborhood: 'El Palo',
    budget: '380-480€',
    score: 77,
    reasons: ['Profesionales ambos', 'Deportistas', 'Madrugadores'],
    friction: 'Él hace deporte en casa',
    tags: ['Profesional', 'Deportista', 'Madrugador'],
    testDone: true,
  },
  // San Sebastián
  {
    id: 16,
    name: 'Amaia Gómez',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    city: 'San Sebastián',
    neighborhood: 'Gros',
    budget: '480-580€',
    score: 90,
    reasons: ['Profesionales ambas', 'Tranquilas', 'Amantes del surf'],
    friction: 'Ella tiene tabla de surf que ocupa espacio',
    tags: ['Profesional', 'Surfer', 'Tranquila'],
    testDone: true,
  },
  // Granada
  {
    id: 17,
    name: 'Fernando García',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    city: 'Granada',
    neighborhood: 'Albaicín',
    budget: '280-350€',
    score: 87,
    reasons: ['Estudiantes ambos', 'Les gusta la cultura', 'Presupuesto similar'],
    friction: 'Él toca la guitarra (con horarios)',
    tags: ['Estudiante', 'Músico', 'Cultural'],
    testDone: true,
  },
  // Alicante
  {
    id: 18,
    name: 'Elena Vidal',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400',
    city: 'Alicante',
    neighborhood: 'Centro',
    budget: '320-420€',
    score: 81,
    reasons: ['Profesionales ambas', 'Playeras', 'Ordenadas'],
    friction: 'Diferentes horarios de trabajo',
    tags: ['Profesional', 'Playera', 'Ordenada'],
    testDone: true,
  },
  // A Coruña
  {
    id: 19,
    name: 'Martín Iglesias',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    city: 'A Coruña',
    neighborhood: 'Centro',
    budget: '300-400€',
    score: 73,
    reasons: ['Profesionales ambos', 'Les gusta el mar', 'Tranquilos'],
    friction: 'Él tiene un gato',
    tags: ['Profesional', 'Mascota', 'Tranquilo'],
    testDone: true,
  },
  // Palma
  {
    id: 20,
    name: 'Claudia Serra',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    city: 'Palma',
    neighborhood: 'Centro',
    budget: '450-550€',
    score: 88,
    reasons: ['Profesionales ambas', 'Activas', 'Les gusta viajar'],
    friction: 'Ella recibe visitas de familia',
    tags: ['Profesional', 'Viajera', 'Activa'],
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
