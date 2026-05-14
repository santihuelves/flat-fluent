import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Check, Euro, Home, Loader2, MapPin, Plus, Search as SearchIcon, ShieldCheck, SlidersHorizontal, Users, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { getRoomListingCardHighlights, getRoomListingLocationLabel, normalizeRoomListingDetails, stripLegacyNeighborhoodFromDescription } from '@/lib/listingDetails';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

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
  photos?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  details?: Json | null;
  owner: ListingOwner;
};

type SearchListingsResponse = {
  ok: boolean;
  code?: string;
  total?: number;
  items?: ListingSummary[];
};

type SortMode = 'recommended' | 'newest' | 'updated_desc' | 'price_asc' | 'price_desc' | 'available_asc' | 'trust_desc';

const MIN_PRICE = 200;
const MAX_PRICE = 1200;
const PAGE_SIZE = 50;

const cityOptions = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga', 'Granada', 'Alicante'];

const formatDate = (date: string | null) => {
  if (!date) return 'Disponibilidad flexible';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

const getMinStayLabel = (months: number | null) => {
  if (!months) return 'Estancia flexible';
  return months === 1 ? '1 mes mínimo' : `${months} meses mínimo`;
};

const getOccupancyLabel = (policy: string | undefined) => {
  if (policy === 'single_only') return 'Una persona';
  if (policy === 'couple') return 'Pareja';
  if (policy === 'two_people') return 'Dos personas';
  if (policy === 'to_agree') return 'A valorar';
  return null;
};

const getOwnerName = (owner: ListingOwner) => owner.display_name || owner.handle || 'Usuario';

export default function Listings() {
  useSEO({ page: 'listings' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);
  const [activeTab, setActiveTab] = useState<'all' | 'offer' | 'seek'>('all');
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [billsIncludedOnly, setBillsIncludedOnly] = useState(false);
  const [listingVerifiedOnly, setListingVerifiedOnly] = useState(false);
  const [ownerVerifiedOnly, setOwnerVerifiedOnly] = useState(false);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const [contractOnly, setContractOnly] = useState(false);
  const [registrationOnly, setRegistrationOnly] = useState(false);
  const [petsAllowedOnly, setPetsAllowedOnly] = useState(false);
  const [couplesAllowedOnly, setCouplesAllowedOnly] = useState(false);
  const [noSmokingOnly, setNoSmokingOnly] = useState(false);
  const [noPartiesOnly, setNoPartiesOnly] = useState(false);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [privateBathroomOnly, setPrivateBathroomOnly] = useState(false);
  const [transportNearOnly, setTransportNearOnly] = useState(false);
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listingType = activeTab === 'offer' ? 'room' : activeTab === 'seek' ? 'flatmate' : null;

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const hasCustomPriceRange = priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE;

    const { data, error: rpcError } = await supabase.rpc('convinter_search_listings', {
      p_city: selectedCity,
      p_listing_type: listingType,
      p_price_min: hasCustomPriceRange ? priceRange[0] : null,
      p_price_max: hasCustomPriceRange ? priceRange[1] : null,
      p_bills_included: billsIncludedOnly ? true : null,
      p_listing_verified_only: listingVerifiedOnly,
      p_verified_only: ownerVerifiedOnly,
      p_trust_min: minTrustScore > 0 ? minTrustScore : null,
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

    const items = result.items ?? [];
    const listingIds = items.map((listing) => listing.id);

    if (listingIds.length > 0) {
      const { data: detailRows, error: detailsError } = await supabase
        .from('convinter_listings')
        .select('id, details, photos, created_at, updated_at')
        .in('id', listingIds);

      if (!detailsError && detailRows) {
        const metaById = new Map(detailRows.map((row) => [row.id, row]));
        setListings(items.map((listing) => ({
          ...listing,
          details: metaById.get(listing.id)?.details ?? null,
          photos: metaById.get(listing.id)?.photos ?? null,
          created_at: metaById.get(listing.id)?.created_at ?? null,
          updated_at: metaById.get(listing.id)?.updated_at ?? null,
        })));
      } else {
        setListings(items);
      }
    } else {
      setListings(items);
    }
    setTotal(result.total ?? result.items?.length ?? 0);
    setIsLoading(false);
  }, [billsIncludedOnly, listingType, listingVerifiedOnly, minTrustScore, ownerVerifiedOnly, priceRange, selectedCity]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const visibleListings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const searchedListings = search
      ? listings.filter((listing) => {
        return [
          listing.title,
          listing.description,
          listing.city,
          getOwnerName(listing.owner),
        ].some((value) => value?.toLowerCase().includes(search));
      })
      : listings;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const advancedFilteredListings = searchedListings.filter((listing) => {
      const roomDetails = normalizeRoomListingDetails(listing.listing_type === 'room' ? listing.details : null);
      const isRoomListing = listing.listing_type === 'room';
      const hasPhotos = Boolean(listing.thumbnail_url) || Boolean(listing.photos?.length);
      const availableFrom = listing.available_from ? new Date(`${listing.available_from}T00:00:00`) : null;
      const isAvailableNow = !availableFrom || availableFrom <= today;
      const allowsCouples = roomDetails.occupancy_policy === 'couple'
        || roomDetails.occupancy_policy === 'two_people'
        || roomDetails.allows_couples === true
        || roomDetails.allows_two_people === true;
      const isFurnished = ['furnished', 'partly_furnished', 'ready_to_move'].includes(roomDetails.room_furnishing_status ?? '');
      const hasPrivateBathroom = roomDetails.room_bathroom === 'private' || roomDetails.room_bathroom === 'preferred_use';
      const hasTransportNear = Boolean(roomDetails.nearest_transport)
        || Boolean(roomDetails.nearby_services?.some((service) => ['metro', 'bus', 'train'].includes(service)));

      if (withPhotosOnly && !hasPhotos) return false;
      if (availableNowOnly && !isAvailableNow) return false;
      if (contractOnly && (!isRoomListing || roomDetails.contract_available !== 'yes')) return false;
      if (registrationOnly && (!isRoomListing || roomDetails.registration_allowed !== 'yes')) return false;
      if (petsAllowedOnly && listing.pets_allowed !== true) return false;
      if (couplesAllowedOnly && (!isRoomListing || !allowsCouples)) return false;
      if (noSmokingOnly && listing.smoking_allowed !== false) return false;
      if (noPartiesOnly && (!isRoomListing || roomDetails.party_policy !== 'no_parties')) return false;
      if (furnishedOnly && (!isRoomListing || !isFurnished)) return false;
      if (privateBathroomOnly && (!isRoomListing || !hasPrivateBathroom)) return false;
      if (transportNearOnly && (!isRoomListing || !hasTransportNear)) return false;

      return true;
    });

    return [...advancedFilteredListings].sort((a, b) => {
      if (sortMode === 'newest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }

      if (sortMode === 'updated_desc') {
        return new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      }

      if (sortMode === 'price_asc') {
        return (a.price_monthly ?? Number.MAX_SAFE_INTEGER) - (b.price_monthly ?? Number.MAX_SAFE_INTEGER);
      }

      if (sortMode === 'price_desc') {
        return (b.price_monthly ?? 0) - (a.price_monthly ?? 0);
      }

      if (sortMode === 'available_asc') {
        return new Date(a.available_from ?? '9999-12-31').getTime() - new Date(b.available_from ?? '9999-12-31').getTime();
      }

      if (sortMode === 'trust_desc') {
        return (b.owner.trust_score ?? 0) - (a.owner.trust_score ?? 0);
      }

      return 0;
    });
  }, [availableNowOnly, contractOnly, couplesAllowedOnly, furnishedOnly, listings, noPartiesOnly, noSmokingOnly, petsAllowedOnly, privateBathroomOnly, registrationOnly, searchTerm, sortMode, transportNearOnly, withPhotosOnly]);

  const advancedFilterCount = [
    billsIncludedOnly,
    listingVerifiedOnly,
    ownerVerifiedOnly,
    withPhotosOnly,
    availableNowOnly,
    contractOnly,
    registrationOnly,
    petsAllowedOnly,
    couplesAllowedOnly,
    noSmokingOnly,
    noPartiesOnly,
    furnishedOnly,
    privateBathroomOnly,
    transportNearOnly,
    minTrustScore > 0,
  ].filter(Boolean).length;
  const hasAdvancedFilters = advancedFilterCount > 0;
  const hasActiveFilters = searchTerm || selectedCity || priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE || activeTab !== 'all' || hasAdvancedFilters || sortMode !== 'recommended';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity(null);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setActiveTab('all');
    setBillsIncludedOnly(false);
    setListingVerifiedOnly(false);
    setOwnerVerifiedOnly(false);
    setWithPhotosOnly(false);
    setAvailableNowOnly(false);
    setContractOnly(false);
    setRegistrationOnly(false);
    setPetsAllowedOnly(false);
    setCouplesAllowedOnly(false);
    setNoSmokingOnly(false);
    setNoPartiesOnly(false);
    setFurnishedOnly(false);
    setPrivateBathroomOnly(false);
    setTransportNearOnly(false);
    setMinTrustScore(0);
    setSortMode('recommended');
  };

  const ListingCard = ({ listing }: { listing: ListingSummary }) => {
    const ownerName = getOwnerName(listing.owner);
    const image = listing.thumbnail_url || '/placeholder.svg';
    const roomDetails = normalizeRoomListingDetails(listing.listing_type === 'room' ? listing.details : null);
    const locationLabel = listing.listing_type === 'room'
      ? getRoomListingLocationLabel(roomDetails, listing.city)
      : listing.city || 'Ciudad no indicada';
    const cleanDescription = stripLegacyNeighborhoodFromDescription(listing.description);
    const highlights = listing.listing_type === 'room'
      ? getRoomListingCardHighlights(roomDetails, { billsIncluded: listing.bills_included, maxItems: 5 })
      : [];
    const occupancyLabel = listing.listing_type === 'room' ? getOccupancyLabel(roomDetails.occupancy_policy) : null;
    const quickFacts = listing.listing_type === 'room'
      ? [
        { icon: Euro, label: listing.price_monthly ? `${listing.price_monthly}€/mes` : 'Precio a consultar' },
        { icon: Calendar, label: formatDate(listing.available_from) },
        { icon: Home, label: getMinStayLabel(listing.min_stay_months) },
        ...(occupancyLabel ? [{ icon: Users, label: occupancyLabel }] : []),
        ...(listing.bills_included ? [{ icon: Check, label: 'Gastos incluidos' }] : []),
      ]
      : [
        { icon: MapPin, label: locationLabel },
        { icon: Calendar, label: formatDate(listing.available_from) },
      ];

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
                {listing.listing_type === 'room' ? 'Habitación disponible' : 'Busca compañero/a para alquilar juntos'}
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
              <span className="text-sm">{locationLabel}</span>
            </div>
            {roomDetails.address_hint && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{roomDetails.address_hint}</p>
            )}
          </div>

          {cleanDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">{cleanDescription}</p>
          )}

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight) => (
                <Badge key={highlight} variant="outline" className="rounded-full bg-background/60">
                  {highlight}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            {quickFacts.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium leading-tight">{label}</span>
              </div>
            ))}
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
            <p className="text-muted-foreground">Habitaciones disponibles y personas buscando compañero/a para alquilar juntos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/my-listings">
                <Home className="h-4 w-4" />
                Mis anuncios
              </Link>
            </Button>
            <Button asChild variant="hero" className="gap-2">
              <Link to="/create-listing">
                <Plus className="h-4 w-4" />
                Crear anuncio
              </Link>
            </Button>
          </div>
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

          <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant={hasAdvancedFilters ? 'default' : 'outline'} className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {hasAdvancedFilters && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
                    {advancedFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-h-[75vh] w-[340px] overflow-y-auto bg-popover" align="start">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold">Filtros avanzados</h3>
                  <p className="text-xs text-muted-foreground">Refina resultados sin salir de anuncios.</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confianza</h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={listingVerifiedOnly}
                      onCheckedChange={(checked) => setListingVerifiedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Solo anuncios verificados</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={ownerVerifiedOnly}
                      onCheckedChange={(checked) => setOwnerVerifiedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Solo propietarios verificados</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disponibilidad y coste</h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={availableNowOnly}
                      onCheckedChange={(checked) => setAvailableNowOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Disponible ya</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={billsIncludedOnly}
                      onCheckedChange={(checked) => setBillsIncludedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Gastos incluidos</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={contractOnly}
                      onCheckedChange={(checked) => setContractOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Contrato escrito</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={registrationOnly}
                      onCheckedChange={(checked) => setRegistrationOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Permite empadronamiento</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Habitación y zona</h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={withPhotosOnly}
                      onCheckedChange={(checked) => setWithPhotosOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Con fotos</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={furnishedOnly}
                      onCheckedChange={(checked) => setFurnishedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Amueblada o lista para entrar</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={privateBathroomOnly}
                      onCheckedChange={(checked) => setPrivateBathroomOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Baño privado o preferente</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={transportNearOnly}
                      onCheckedChange={(checked) => setTransportNearOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Transporte cerca</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convivencia</h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={couplesAllowedOnly}
                      onCheckedChange={(checked) => setCouplesAllowedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Acepta parejas</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={petsAllowedOnly}
                      onCheckedChange={(checked) => setPetsAllowedOnly(Boolean(checked))}
                    />
                    <span className="text-sm">Acepta mascotas</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={noSmokingOnly}
                      onCheckedChange={(checked) => setNoSmokingOnly(Boolean(checked))}
                    />
                    <span className="text-sm">No fumadores</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      checked={noPartiesOnly}
                      onCheckedChange={(checked) => setNoPartiesOnly(Boolean(checked))}
                    />
                    <span className="text-sm">No fiestas</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Confianza mínima</Label>
                    <span className="text-sm text-muted-foreground">{minTrustScore || 'Todos'}</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={10}
                    value={[minTrustScore]}
                    onValueChange={(value) => setMinTrustScore(value[0])}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="w-full lg:w-[190px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recomendados</SelectItem>
              <SelectItem value="newest">Últimos publicados</SelectItem>
              <SelectItem value="updated_desc">Actualizados recientemente</SelectItem>
              <SelectItem value="available_asc">Disponibles antes</SelectItem>
              <SelectItem value="price_asc">Precio bajo</SelectItem>
              <SelectItem value="price_desc">Precio alto</SelectItem>
              <SelectItem value="trust_desc">Más confianza</SelectItem>
            </SelectContent>
          </Select>

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
          {isLoading
            ? 'Cargando anuncios...'
            : `Mostrando ${visibleListings.length} de ${total || visibleListings.length} anuncios${hasActiveFilters ? ' con filtros aplicados' : ''}`}
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

