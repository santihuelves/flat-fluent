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
  {
    id: 1,
    type: 'offer_room',
    title: 'Habitación luminosa en Malasaña',
    photo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
    city: 'Madrid',
    neighborhood: 'Malasaña',
    price: 450,
    billsIncluded: true,
    availableFrom: '2025-02-01',
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
    availableFrom: '2025-01-15',
    minStay: '3 meses',
    owner: 'Miguel A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['Estudiantes', 'Social', 'Cocina compartida'],
  },
  {
    id: 3,
    type: 'seek_room',
    title: 'Busco habitación en Gràcia',
    photo: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    price: 400,
    billsIncluded: false,
    availableFrom: '2025-02-15',
    minStay: 'Indefinido',
    owner: 'Paula M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    tags: ['Profesional', 'Tranquilo', 'Teletrabajo'],
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
