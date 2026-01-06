import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MessageCircle, MapPin, Briefcase, Calendar, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock profiles data
const mockProfiles: Record<string, {
  id: string;
  name: string;
  age: number;
  photo: string;
  city: string;
  neighborhood: string;
  occupation: string;
  bio: string;
  score: number;
  verified: boolean;
  testCompleted: boolean;
  tags: string[];
  languages: string[];
  budget: { min: number; max: number };
  moveInDate: string;
  matchReasons: string[];
}> = {
  '1': {
    id: '1',
    name: 'María García',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    city: 'Madrid',
    neighborhood: 'Malasaña',
    occupation: 'Diseñadora UX',
    bio: 'Diseñadora UX apasionada por el arte y la cultura. Me encanta cocinar y organizar cenas con amigos. Busco un ambiente tranquilo pero social, donde poder trabajar en remoto y disfrutar de buenas conversaciones.',
    score: 94,
    verified: true,
    testCompleted: true,
    tags: ['No fumadora', 'Madrugadora', 'Ordenada', 'Social', 'Amante de los gatos'],
    languages: ['Español', 'Inglés', 'Francés'],
    budget: { min: 400, max: 600 },
    moveInDate: 'Febrero 2025',
    matchReasons: ['Mismo horario de trabajo', 'Ambos valoran el orden', 'Zona preferida compatible'],
  },
  '2': {
    id: '2',
    name: 'Carlos Ruiz',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    occupation: 'Ingeniero de Software',
    bio: 'Ingeniero de software trabajando en remoto. Me gusta el deporte, especialmente correr y nadar. Busco un piso tranquilo donde poder concentrarme durante el día.',
    score: 91,
    verified: true,
    testCompleted: true,
    tags: ['No fumador', 'Deportista', 'Tranquilo', 'Limpio'],
    languages: ['Español', 'Inglés', 'Catalán'],
    budget: { min: 450, max: 650 },
    moveInDate: 'Marzo 2025',
    matchReasons: ['Ambos trabajan en remoto', 'Estilo de vida tranquilo', 'Presupuesto similar'],
  },
};

export default function PublicProfile() {
  const { id } = useParams();
  const profile = mockProfiles[id || '1'] || mockProfiles['1'];

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Link to="/discover">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile.photo} alt={profile.name} />
                  <AvatarFallback className="text-3xl">{profile.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold">{profile.name}, {profile.age}</h1>
                      {profile.verified && (
                        <Shield className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.neighborhood}, {profile.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {profile.occupation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-primary">{profile.score}%</div>
                    <div className="text-sm text-muted-foreground">
                      compatibilidad
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Heart className="mr-2 h-4 w-4" />
                      Dar like
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mensaje
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Sobre mí</h2>
              <p className="text-muted-foreground">{profile.bio}</p>
            </CardContent>
          </Card>

          {/* Match Reasons */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Por qué hacéis match</h2>
              <div className="space-y-2">
                {profile.matchReasons.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Estilo de vida</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Idiomas</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, index) => (
                    <Badge key={index} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Preferencias de búsqueda</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Presupuesto</p>
                  <p className="font-medium">{profile.budget.min}€ - {profile.budget.max}€</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de entrada</p>
                  <p className="font-medium">{profile.moveInDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Test completado</p>
                  <p className="font-medium flex items-center gap-1">
                    {profile.testCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Sí
                      </>
                    ) : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
