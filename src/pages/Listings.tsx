import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Check, Euro, Home, Loader2, MapPin, Plus, Search as SearchIcon, ShieldCheck, Users, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ListingType = 'room' | 'flatmate';

type ListingOwner = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  trust_score: number | null;
  trust_badge: string | null;
  selfie_verified: boolean | null;
};

type ListingSummary = {
  id: string;
  listing_type: ListingType;
  title: string;
  description: string | null;
  city: string | null;
  province_code: string | null;
  price_monthly: number | null;
  bills_included: boolean | null;
  available_from: string | null;
  min_stay_months: number | null;
  listing_verified: boolean | null;
  listing_verification_level: number | null;
  thumbnail_url: string | null;
  owner: ListingOwner;
};

type SearchListingsResponse = {
  ok: boolean;
  code?: string;
  total?: number;
  items?: ListingSummary[];
};

const MIN_PRICE = 200;
const MAX_PRICE = 1200;
const PAGE_SIZE = 50;

const cityOptions = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga', 'Granada', 'Alicante'];

const formatDate = (date: string | null) => {
  if (!date) return 'Disponibilidad flexible';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

const getOwnerName = (owner: ListingOwner) => owner.display_name || owner.handle || 'Usuario';

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);
  const [activeTab, setActiveTab] = useState<'all' | 'offer' | 'seek'>('all');
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listingType = activeTab === 'offer' ? 'room' : activeTab === 'seek' ? 'flatmate' : null;

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('convinter_search_listings', {
      p_city: selectedCity,
      p_listing_type: listingType,
      p_price_min: priceRange[0],
      p_price_max: priceRange[1],
      p_limit: PAGE_SIZE,
      p_offset: 0,
    });

    if (rpcError) {
      console.error('Error loading listings:', rpcError);
      setError('No se pudieron cargar los anuncios.');
      toast.error('No se pudieron cargar los anuncios');
      setListings([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    const result = data as unknown as SearchListingsResponse;
    if (!result.ok) {
      const message = result.code === 'NOT_AUTHENTICATED'
        ? 'Inicia sesión para ver anuncios.'
        : 'No se pudieron cargar los anuncios.';
      setError(message);
      setListings([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setListings(result.items ?? []);
    setTotal(result.total ?? result.items?.length ?? 0);
    setIsLoading(false);
  }, [listingType, priceRange, selectedCity]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const visibleListings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return listings;

    return listings.filter((listing) => {
      return [
        listing.title,
        listing.description,
        listing.city,
        getOwnerName(listing.owner),
      ].some((value) => value?.toLowerCase().includes(search));
    });
  }, [listings, searchTerm]);

  const hasActiveFilters = searchTerm || selectedCity || priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE || activeTab !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity(null);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setActiveTab('all');
  };

  const ListingCard = ({ listing }: { listing: ListingSummary }) => {
    const ownerName = getOwnerName(listing.owner);
    const image = listing.thumbnail_url || '/placeholder.svg';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden card-hover"
      >
        <Link to={`/listing/${listing.id}`}>
          <div className="relative aspect-[4/3] bg-muted">
            <img src={image} alt={listing.title} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant={listing.listing_type === 'room' ? 'default' : 'secondary'} className="rounded-full">
                {listing.listing_type === 'room' ? 'Ofrece habitación' : 'Busca habitación'}
              </Badge>
              {listing.listing_verified && (
                <Badge variant="outline" className="rounded-full bg-background/90">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
          </div>
        </Link>

        <div className="p-5 space-y-4">
          <div>
            <Link to={`/listing/${listing.id}`} className="hover:text-primary transition-colors">
              <h3 className="font-semibold text-lg line-clamp-2">{listing.title}</h3>
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{listing.city || 'Ciudad no indicada'}</span>
            </div>
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {listing.price_monthly ? `${listing.price_monthly}€/mes` : 'Precio a consultar'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formatDate(listing.available_from)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{ownerName}</p>
              <p className="text-xs text-muted-foreground">
                Confianza {listing.owner.trust_score ?? 0}/100
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/listing/${listing.id}`}>Ver detalle</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Anuncios</h1>
            <p className="text-muted-foreground">Habitaciones y personas buscando piso, desde Supabase.</p>
          </div>
          <Button asChild variant="hero" className="gap-2">
            <Link to="/create-listing">
              <Plus className="h-4 w-4" />
              Crear anuncio
            </Link>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, ciudad o persona..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>

          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                {selectedCity || 'Toda España'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 bg-popover" align="start">
              <Command>
                <CommandInput placeholder="Buscar ciudad..." />
                <CommandList>
                  <CommandEmpty>Sin resultados</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedCity(null); setCityOpen(false); }}>
                      <Check className={`mr-2 h-4 w-4 ${!selectedCity ? 'opacity-100' : 'opacity-0'}`} />
                      Toda España
                    </CommandItem>
                    {cityOptions.map((city) => (
                      <CommandItem key={city} onSelect={() => { setSelectedCity(city); setCityOpen(false); }}>
                        <Check className={`mr-2 h-4 w-4 ${selectedCity === city ? 'opacity-100' : 'opacity-0'}`} />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={priceOpen} onOpenChange={setPriceOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Euro className="h-4 w-4" />
                {priceRange[0] === MIN_PRICE && priceRange[1] === MAX_PRICE ? 'Precio' : `${priceRange[0]}€ - ${priceRange[1]}€`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] bg-popover" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rango de precio</span>
                  <span className="text-sm text-muted-foreground">{priceRange[0]}€ - {priceRange[1]}€</span>
                </div>
                <Slider min={MIN_PRICE} max={MAX_PRICE} step={25} value={priceRange} onValueChange={(value) => setPriceRange(value as [number, number])} />
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" className="gap-2">
              <Home className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-2">
              <Home className="h-4 w-4" />
              Ofrecen
            </TabsTrigger>
            <TabsTrigger value="seek" className="gap-2">
              <Users className="h-4 w-4" />
              Buscan
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? 'Cargando anuncios...' : `Mostrando ${visibleListings.length} de ${total || visibleListings.length} anuncios`}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        ) : visibleListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay anuncios con esos filtros</h3>
            <p className="text-muted-foreground mb-4">Prueba cambiando ciudad, precio o tipo de anuncio.</p>
            <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
