import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { MapPin, Euro, Calendar, Plus, Home, Search as SearchIcon, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockListings = [
  // Madrid
  {
    id: 1,
    type: 'offer_room',
    title: 'Habitación luminosa en Malasaña',
    photo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
    city: 'Madrid',
    neighborhood: 'Malasaña',
    price: 450,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Laura P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    tags: ['No fumadores', 'Sin mascotas', 'Tranquilo'],
  },
  {
    id: 2,
    type: 'offer_room',
    title: 'Piso compartido cerca de Gran Vía',
    photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    city: 'Madrid',
    neighborhood: 'Centro',
    price: 520,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '3 meses',
    owner: 'Miguel A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['Estudiantes', 'Social', 'Cocina compartida'],
  },
  {
    id: 3,
    type: 'offer_room',
    title: 'Habitación en Chamberí con terraza',
    photo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    city: 'Madrid',
    neighborhood: 'Chamberí',
    price: 580,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '12 meses',
    owner: 'Carmen R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    tags: ['Profesionales', 'Terraza', 'Luminoso'],
  },
  {
    id: 4,
    type: 'seek_room',
    title: 'Busco habitación en Lavapiés',
    photo: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    city: 'Madrid',
    neighborhood: 'Lavapiés',
    price: 400,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: 'Indefinido',
    owner: 'Pablo S.',
    ownerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tags: ['Artista', 'Flexible', 'Social'],
  },
  // Barcelona
  {
    id: 5,
    type: 'seek_room',
    title: 'Busco habitación en Gràcia',
    photo: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400',
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    price: 500,
    billsIncluded: false,
    availableFrom: '2026-02-01',
    minStay: 'Indefinido',
    owner: 'Paula M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    tags: ['Profesional', 'Tranquilo', 'Teletrabajo'],
  },
  {
    id: 6,
    type: 'offer_room',
    title: 'Ático con vistas en Eixample',
    photo: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400',
    city: 'Barcelona',
    neighborhood: 'Eixample',
    price: 650,
    billsIncluded: true,
    availableFrom: '2026-03-01',
    minStay: '6 meses',
    owner: 'Jordi V.',
    ownerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    tags: ['Vistas', 'Ático', 'Reformado'],
  },
  {
    id: 7,
    type: 'offer_room',
    title: 'Habitación en El Born',
    photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    city: 'Barcelona',
    neighborhood: 'El Born',
    price: 580,
    billsIncluded: false,
    availableFrom: '2026-01-25',
    minStay: '4 meses',
    owner: 'Marta L.',
    ownerPhoto: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100',
    tags: ['Céntrico', 'Cultural', 'Joven'],
  },
  // Valencia
  {
    id: 8,
    type: 'offer_room',
    title: 'Piso acogedor en Ruzafa',
    photo: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400',
    city: 'Valencia',
    neighborhood: 'Ruzafa',
    price: 380,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Lucía F.',
    ownerPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    tags: ['Artístico', 'Mascota OK', 'Balcón'],
  },
  {
    id: 9,
    type: 'seek_room',
    title: 'Busco piso en El Carmen',
    photo: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
    city: 'Valencia',
    neighborhood: 'El Carmen',
    price: 350,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '3 meses',
    owner: 'David G.',
    ownerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    tags: ['Estudiante', 'Flexible', 'Nocturno'],
  },
  // Sevilla
  {
    id: 10,
    type: 'offer_room',
    title: 'Casa con patio en Triana',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    city: 'Sevilla',
    neighborhood: 'Triana',
    price: 320,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Rocío M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100',
    tags: ['Patio', 'Tradicional', 'Tranquilo'],
  },
  {
    id: 11,
    type: 'offer_room',
    title: 'Habitación en Nervión',
    photo: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400',
    city: 'Sevilla',
    neighborhood: 'Nervión',
    price: 350,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '4 meses',
    owner: 'Antonio J.',
    ownerPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100',
    tags: ['Cerca metro', 'Deportivo', 'Joven'],
  },
  // Bilbao
  {
    id: 12,
    type: 'offer_room',
    title: 'Piso moderno en Casco Viejo',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    city: 'Bilbao',
    neighborhood: 'Casco Viejo',
    price: 420,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Iker Z.',
    ownerPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
    tags: ['Céntrico', 'Reformado', 'WiFi'],
  },
  {
    id: 13,
    type: 'seek_room',
    title: 'Busco habitación en Deusto',
    photo: 'https://images.unsplash.com/photo-1598928506311-c55ez3a3b0e3?w=400',
    city: 'Bilbao',
    neighborhood: 'Deusto',
    price: 380,
    billsIncluded: false,
    availableFrom: '2026-01-25',
    minStay: 'Indefinido',
    owner: 'Amaia R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    tags: ['Universitario', 'Tranquilo', 'Estudioso'],
  },
  // Zaragoza
  {
    id: 14,
    type: 'offer_room',
    title: 'Habitación amplia en Centro',
    photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    city: 'Zaragoza',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '3 meses',
    owner: 'Jorge N.',
    ownerPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
    tags: ['Económico', 'Amplio', 'Luminoso'],
  },
  {
    id: 15,
    type: 'offer_room',
    title: 'Piso en Delicias',
    photo: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=400',
    city: 'Zaragoza',
    neighborhood: 'Delicias',
    price: 280,
    billsIncluded: false,
    availableFrom: '2026-01-30',
    minStay: '6 meses',
    owner: 'Pilar H.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100',
    tags: ['Transporte', 'Familiar', 'Tranquilo'],
  },
  // Málaga
  {
    id: 16,
    type: 'offer_room',
    title: 'Habitación cerca de la playa',
    photo: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400',
    city: 'Málaga',
    neighborhood: 'El Palo',
    price: 400,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '4 meses',
    owner: 'Marina C.',
    ownerPhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100',
    tags: ['Playa', 'Luminoso', 'Tranquilo'],
  },
  {
    id: 17,
    type: 'seek_room',
    title: 'Busco piso en Centro Málaga',
    photo: 'https://images.unsplash.com/photo-1529408686214-b48b8532f72c?w=400',
    city: 'Málaga',
    neighborhood: 'Centro',
    price: 380,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '6 meses',
    owner: 'Andrés T.',
    ownerPhoto: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100',
    tags: ['Profesional', 'Activo', 'Social'],
  },
  // San Sebastián
  {
    id: 18,
    type: 'offer_room',
    title: 'Piso con vistas al mar',
    photo: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    city: 'San Sebastián',
    neighborhood: 'Gros',
    price: 550,
    billsIncluded: true,
    availableFrom: '2026-03-01',
    minStay: '6 meses',
    owner: 'Leire A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100',
    tags: ['Vistas mar', 'Premium', 'Tranquilo'],
  },
  // Granada
  {
    id: 19,
    type: 'offer_room',
    title: 'Habitación en el Albaicín',
    photo: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400',
    city: 'Granada',
    neighborhood: 'Albaicín',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '3 meses',
    owner: 'Fernando L.',
    ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    tags: ['Histórico', 'Vistas Alhambra', 'Bohemio'],
  },
  // Alicante
  {
    id: 20,
    type: 'seek_room',
    title: 'Busco habitación cerca del puerto',
    photo: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
    city: 'Alicante',
    neighborhood: 'Centro',
    price: 350,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: 'Indefinido',
    owner: 'Elena P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100',
    tags: ['Profesional', 'Playa', 'Madrugador'],
  },
];

export default function Listings() {
  const { t } = useTranslation();

  const ListingCard = ({ listing }: { listing: typeof mockListings[0] }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden card-hover"
    >
      <div className="relative h-48">
        <img 
          src={listing.photo} 
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`rounded-full ${listing.type === 'offer_room' ? 'bg-success' : 'bg-secondary'}`}>
            {listing.type === 'offer_room' ? t('listings.types.offerRoom') : t('listings.types.seekRoom')}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm font-semibold">
          <Euro className="h-4 w-4" />
          {listing.price}/mes
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            {listing.neighborhood}, {listing.city}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="outline" className="rounded-full text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <img 
              src={listing.ownerPhoto} 
              alt={listing.owner}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{listing.owner}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(listing.availableFrom).toLocaleDateString('es')}
          </div>
        </div>

        <Link to={`/listing/${listing.id}`}>
          <Button variant="outline" className="w-full">
            {t('listings.viewDetails')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('listings.title')}</h1>
          </div>
          <Link to="/create-listing">
            <Button variant="hero" className="gap-2">
              <Plus className="h-5 w-5" />
              {t('listings.createListing')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('common.search') + '...'} 
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Toda España
            </Button>
            <Button variant="outline" className="gap-2">
              <Euro className="h-4 w-4" />
              Precio
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" className="gap-2">
              <Home className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-2">
              <Home className="h-4 w-4" />
              {t('listings.types.offerRoom')}
            </TabsTrigger>
            <TabsTrigger value="seek" className="gap-2">
              <Users className="h-4 w-4" />
              {t('listings.types.seekRoom')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
