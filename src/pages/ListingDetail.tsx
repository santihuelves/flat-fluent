import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, Euro, Home, Users, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const mockListings = [
  {
    id: '1',
    type: 'offering_room',
    title: 'Habitación luminosa en Malasaña',
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    city: 'Madrid',
    neighborhood: 'Malasaña',
    price: 550,
    billsIncluded: true,
    deposit: 550,
    availableFrom: '2026-02-01',
    minStay: 6,
    furnished: true,
    description: 'Habitación amplia y luminosa en el corazón de Malasaña. El piso está completamente reformado y cuenta con calefacción central. La habitación tiene armario empotrado y una ventana grande que da a un patio interior muy tranquilo. Buscamos a alguien responsable, limpio y respetuoso con los horarios de descanso.',
    ambiance: 'balanced',
    householdProfile: {
      residents: 2,
      ages: '25-30',
      telecommute: true,
      routine: 'Trabajamos desde casa la mayoría de días. Noches tranquilas entre semana.',
    },
    rules: ['No fumar', 'Mascotas permitidas', 'Visitas con aviso previo'],
    tags: ['WiFi incluido', 'Calefacción central', 'Terraza común'],
    owner: {
      name: 'María G.',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      verified: true,
      testCompleted: true,
    },
    compatibility: {
      score: 87,
      reasons: ['Horarios similares', 'Mismo nivel de limpieza', 'Ambos teletrabajan'],
      friction: 'Diferentes preferencias de temperatura',
    },
  },
  {
    id: '2',
    type: 'seeking_room',
    title: 'Busco habitación en Gràcia o Eixample',
    photos: [
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800',
    ],
    city: 'Barcelona',
    neighborhood: 'Gràcia / Eixample',
    price: 600,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-15',
    minStay: 12,
    furnished: null,
    description: 'Soy Carlos, 28 años, ingeniero de software. Busco una habitación en un piso tranquilo pero sociable. Trabajo desde casa 3 días a la semana. Me gusta cocinar y no me importa compartir la limpieza. Preferiblemente en Gràcia o Eixample, cerca de transporte público.',
    ambiance: 'balanced',
    householdProfile: null,
    rules: null,
    tags: ['No fumador', 'Sin mascotas', 'Teletrabajo'],
    owner: {
      name: 'Carlos M.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      verified: true,
      testCompleted: true,
    },
    compatibility: {
      score: 92,
      reasons: ['Estilo de vida similar', 'Mismas expectativas de limpieza', 'Horarios compatibles'],
      friction: 'Él prefiere más silencio',
    },
  },
  {
    id: '3',
    type: 'seeking_roommate',
    title: 'Buscamos 1 compi para piso en Ruzafa',
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    city: 'Valencia',
    neighborhood: 'Ruzafa',
    price: 400,
    billsIncluded: false,
    deposit: 800,
    availableFrom: '2026-02-15',
    minStay: 9,
    furnished: true,
    description: 'Somos Lucía (26) y Pedro (27). Tenemos un piso de 3 habitaciones en Ruzafa y buscamos una tercera persona. El piso es luminoso, con balcón y está muy bien comunicado. Nos gusta cenar juntos de vez en cuando pero respetamos mucho el espacio personal. Buscamos alguien entre 24-32 años, preferiblemente que trabaje o estudie.',
    ambiance: 'social',
    householdProfile: {
      residents: 2,
      ages: '26-27',
      telecommute: false,
      routine: 'Trabajamos fuera. Fines de semana sociales.',
    },
    rules: ['No fumar dentro', 'Mascotas negociable', 'Limpieza rotativa'],
    tags: ['Balcón', 'Cerca del metro', 'Lavadora'],
    owner: {
      name: 'Lucía & Pedro',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      verified: false,
      testCompleted: true,
    },
    compatibility: {
      score: 78,
      reasons: ['Edades similares', 'Ambos sociables', 'Misma zona preferida'],
      friction: 'Diferentes horarios de sueño',
    },
  },
];

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const listing = mockListings.find((l) => l.id === id);

  if (!listing) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">{t('listings.detail.notFound')}</h1>
            <Button onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('listings.detail.backToListings')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const typeLabels: Record<string, string> = {
    offering_room: t('listings.types.offeringRoom'),
    seeking_room: t('listings.types.seekingRoom'),
    seeking_roommate: t('listings.types.seekingRoommate'),
  };

  const ambianceLabels: Record<string, string> = {
    quiet: t('listings.detail.ambianceQuiet'),
    balanced: t('listings.detail.ambianceBalanced'),
    social: t('listings.detail.ambianceSocial'),
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('listings.detail.backToListings')}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photo Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Carousel className="w-full">
                  <CarouselContent>
                    {listing.photos.map((photo, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video rounded-xl overflow-hidden">
                          <img
                            src={photo}
                            alt={`${listing.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {listing.photos.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              </motion.div>

              {/* Title and Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Badge variant="secondary" className="mb-3">
                  {typeLabels[listing.type]}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{listing.city}, {listing.neighborhood}</span>
                </div>
              </motion.div>

              {/* Key Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Euro className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">{listing.price}€</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.billsIncluded ? t('listings.detail.billsIncluded') : t('listings.detail.billsNotIncluded')}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">
                          {new Date(listing.availableFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('listings.detail.available')}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">{listing.minStay} {t('common.months')}</p>
                        <p className="text-xs text-muted-foreground">{t('listings.detail.minStay')}</p>
                      </div>
                      {listing.deposit && (
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Home className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold text-foreground">{listing.deposit}€</p>
                          <p className="text-xs text-muted-foreground">{t('listings.detail.deposit')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      {t('listings.detail.description')}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {listing.description}
                    </p>

                    {listing.ambiance && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">{t('listings.detail.ambiance')}: </span>
                        <Badge variant="outline">{ambianceLabels[listing.ambiance]}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Household Profile (for offering_room) */}
              {listing.householdProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {t('listings.detail.householdProfile')}
                      </h2>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('listings.detail.residents')}: </span>
                          <span className="text-foreground font-medium">{listing.householdProfile.residents}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('listings.detail.ages')}: </span>
                          <span className="text-foreground font-medium">{listing.householdProfile.ages}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('listings.detail.routine')}: </span>
                          <span className="text-foreground">{listing.householdProfile.routine}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* House Rules */}
              {listing.rules && listing.rules.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3">
                        {t('listings.detail.rules')}
                      </h2>
                      <ul className="space-y-2">
                        {listing.rules.map((rule, index) => (
                          <li key={index} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="sticky top-20 space-y-4"
              >
                {/* Owner Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={listing.owner.photo} alt={listing.owner.name} />
                        <AvatarFallback>{listing.owner.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.owner.name}</h3>
                        {listing.owner.verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('common.verified')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t('listings.detail.contact')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Compatibility Card */}
                {listing.compatibility && listing.owner.testCompleted && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {listing.compatibility.score}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('listings.detail.compatibility')}
                        </p>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            {t('listings.detail.matchReasons')}
                          </p>
                          <ul className="space-y-1">
                            {listing.compatibility.reasons.map((reason, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {listing.compatibility.friction && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                              {t('listings.detail.possibleFriction')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              {listing.compatibility.friction}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListingDetail;
