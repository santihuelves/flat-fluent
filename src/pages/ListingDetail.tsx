import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Cigarette, Clock, Edit2, Euro, Home, Loader2, MapPin, MessageCircle, PawPrint, Send, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SafetyActions } from '@/components/SafetyActions';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { getRoomListingDetailItems, normalizeRoomListingDetails } from '@/lib/listingDetails';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

type ListingType = 'room' | 'flatmate';

type ListingDetailData = {
  id: string;
  owner_id: string;
  listing_type: ListingType;
  title: string;
  description: string | null;
  province_code: string | null;
  city: string | null;
  price_monthly: number | null;
  bills_included: boolean | null;
  available_from: string | null;
  min_stay_months: number | null;
  smoking_allowed: boolean | null;
  pets_allowed: boolean | null;
  thumbnail_url: string | null;
  photos?: string[] | null;
  details?: Json | null;
  listing_verified: boolean | null;
  listing_verified_at: string | null;
  listing_verification_level: number | null;
  status: string | null;
};

type ListingOwner = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  photo_url: string | null;
  selfie_verified: boolean | null;
  trust_score: number | null;
  trust_badge: string | null;
  province_code: string | null;
  city: string | null;
};

type ListingDetailResponse = {
  ok: boolean;
  code?: string;
  listing?: ListingDetailData;
  owner?: ListingOwner;
};

type CompatibilityData = {
  ok: boolean;
  score?: number;
  breakdown?: {
    reasons?: string[];
    friction?: string;
  };
  code?: string;
};

type OwnerConnectionState = 'unknown' | 'none' | 'incoming' | 'outgoing' | 'connected';

type ConsentOverviewProfile = {
  user_id?: string;
};

type ConsentRequestItem = {
  from_user?: string;
  to_user?: string;
  profile?: ConsentOverviewProfile;
};

type ActiveConnectionItem = {
  user_id?: string;
  profile?: ConsentOverviewProfile;
};

type ConsentOverviewResponse = {
  ok: boolean;
  incoming?: ConsentRequestItem[];
  outgoing?: ConsentRequestItem[];
  connections?: ActiveConnectionItem[];
  code?: string;
};

const formatDate = (date: string | null) => {
  if (!date) return 'Disponibilidad flexible';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
};

const getOwnerName = (owner: ListingOwner) => owner.display_name || owner.handle || 'Usuario';

const getListingPhotos = (listing: ListingDetailData) => {
  const photos = listing.photos?.filter(Boolean) ?? [];
  if (photos.length > 0) return photos;
  return [listing.thumbnail_url || '/placeholder.svg'];
};

const getErrorMessage = (code?: string) => {
  if (code === 'NOT_AUTHENTICATED') return 'Inicia sesión para ver este anuncio.';
  if (code === 'NOT_FOUND') return 'Este anuncio no existe.';
  if (code === 'NOT_AVAILABLE') return 'Este anuncio ya no está disponible.';
  if (code === 'HIDDEN') return 'Este anuncio no está disponible públicamente.';
  return 'No se pudo cargar el anuncio.';
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetailData | null>(null);
  const [owner, setOwner] = useState<ListingOwner | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompatibility, setIsLoadingCompatibility] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [ownerConnectionState, setOwnerConnectionState] = useState<OwnerConnectionState>('unknown');
  const [isRequestingConsent, setIsRequestingConsent] = useState(false);

  const listingStructuredData = useMemo(() => {
    if (!listing) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: listing.title,
      description: listing.description || listing.title,
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: listing.price_monthly ?? undefined,
      priceCurrency: 'EUR',
      image: getListingPhotos(listing),
      areaServed: listing.city ? {
        '@type': 'City',
        name: listing.city,
      } : undefined,
      seller: owner ? {
        '@type': 'Person',
        name: owner.display_name || owner.handle || 'Usuario Convinter',
      } : undefined,
    };
  }, [listing, owner]);

  useSEO({
    page: 'listings',
    fallbackTitle: listing?.title,
    fallbackDescription: listing?.description || (listing?.city ? `Anuncio de convivencia en ${listing.city}.` : undefined),
    noIndex: listing?.status !== 'active',
    image: listing?.thumbnail_url,
    type: 'article',
    structuredData: listingStructuredData,
  });

  const loadOwnerConnectionState = useCallback(async (ownerId: string) => {
    const { data, error: overviewError } = await supabase.rpc('convinter_get_my_consent_overview');

    if (overviewError) {
      console.warn('Error loading owner connection state:', overviewError);
      setOwnerConnectionState('none');
      return;
    }

    const result = data as unknown as ConsentOverviewResponse;
    if (!result.ok) {
      setOwnerConnectionState('none');
      return;
    }

    const isConnected = result.connections?.some((connection) => {
      return (connection.user_id ?? connection.profile?.user_id) === ownerId;
    });

    if (isConnected) {
      setOwnerConnectionState('connected');
      return;
    }

    const hasIncoming = result.incoming?.some((request) => {
      return (request.from_user ?? request.profile?.user_id) === ownerId;
    });

    if (hasIncoming) {
      setOwnerConnectionState('incoming');
      return;
    }

    const hasOutgoing = result.outgoing?.some((request) => {
      return (request.to_user ?? request.profile?.user_id) === ownerId;
    });

    setOwnerConnectionState(hasOutgoing ? 'outgoing' : 'none');
  }, []);

  const loadBlockState = useCallback(async (viewerId: string, ownerId: string) => {
    if (viewerId === ownerId) return false;

    const { data, error: blockError } = await supabase.rpc('convinter_is_blocked', {
      p_user_a: viewerId,
      p_user_b: ownerId,
    });

    if (blockError) {
      console.warn('Error loading listing block state:', blockError);
      return false;
    }

    const blocked = Boolean(data);
    setIsBlocked(blocked);
    return blocked;
  }, []);

  const loadCompatibility = useCallback(async (ownerId: string) => {
    setIsLoadingCompatibility(true);
    const { data, error: rpcError } = await supabase.rpc('convinter_compute_and_cache_guarded', {
      p_other_user: ownerId,
      p_detail_level: 1,
    });

    if (rpcError) {
      setCompatibility({ ok: false, code: rpcError.code });
      setIsLoadingCompatibility(false);
      return;
    }

    setCompatibility(data as unknown as CompatibilityData);
    setIsLoadingCompatibility(false);
  }, []);

  const loadListing = useCallback(async () => {
    if (!id) {
      setError('Anuncio no encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setActivePhotoIndex(0);

    const { data: userData } = await supabase.auth.getUser();
    setCurrentUserId(userData.user?.id ?? null);

    const { data, error: rpcError } = await supabase.rpc('convinter_get_listing_detail', {
      p_listing_id: id,
    });

    if (rpcError) {
      console.error('Error loading listing detail:', rpcError);
      setError('No se pudo cargar el anuncio.');
      setIsLoading(false);
      return;
    }

    const result = data as unknown as ListingDetailResponse;
    if (!result.ok || !result.listing || !result.owner) {
      setError(getErrorMessage(result.code));
      setIsLoading(false);
      return;
    }

    setListing(result.listing);
    setOwner(result.owner);
    setIsLoading(false);

    if (userData.user?.id && userData.user.id !== result.owner.user_id) {
      const blocked = await loadBlockState(userData.user.id, result.owner.user_id);
      if (blocked) {
        setCompatibility({ ok: false, code: 'BLOCKED' });
        return;
      }

      await Promise.all([
        loadCompatibility(result.owner.user_id),
        loadOwnerConnectionState(result.owner.user_id),
      ]);
    } else {
      setCompatibility(null);
      setOwnerConnectionState('none');
    }
  }, [id, loadBlockState, loadCompatibility, loadOwnerConnectionState]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const handleOpenChat = async () => {
    if (!owner) return;
    if (isBlocked) {
      toast.info('Has bloqueado a este usuario.');
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('convinter_create_chat', {
      p_other: owner.user_id,
    });

    if (rpcError) {
      toast.error('No se pudo abrir el chat');
      return;
    }

    const result = data as unknown as { ok: boolean; chat_id?: string; code?: string };
    if (!result.ok) {
      toast.error(result.code === 'INVALID_TARGET' ? 'No puedes abrir chat contigo mismo' : 'No se pudo abrir el chat');
      return;
    }

    navigate(`/chat/${owner.user_id}`);
  };

  const handleRequestConsent = async () => {
    if (!owner) return;
    if (isBlocked) {
      toast.info('Has bloqueado a este usuario.');
      return;
    }

    setIsRequestingConsent(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('convinter_request_consent', {
        p_to_user: owner.user_id,
        p_requested_level: 1,
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as { ok: boolean; code?: string };
      if (result.ok || result.code === 'ALREADY_REQUESTED') {
        setOwnerConnectionState('outgoing');
        toast.success(result.code === 'ALREADY_REQUESTED' ? 'Ya habias enviado esta solicitud' : 'Solicitud enviada al propietario');
        return;
      }

      toast.error(result.code === 'ALREADY_CONNECTED' ? 'Ya estais conectados' : 'No se pudo enviar la solicitud');
      if (result.code === 'ALREADY_CONNECTED') {
        setOwnerConnectionState('connected');
      }
    } catch (requestError) {
      console.error('Error requesting listing owner consent:', requestError);
      toast.error('No se pudo enviar la solicitud');
    } finally {
      setIsRequestingConsent(false);
    }
  };

  const getOwnerAction = () => {
    if (isBlocked) {
      return {
        label: 'Usuario bloqueado',
        description: 'Has bloqueado a este usuario. Puedes gestionarlo desde ajustes.',
        icon: AlertCircle,
        disabled: true,
        onClick: undefined,
      };
    }

    if (ownerConnectionState === 'connected') {
      return {
        label: 'Mensaje',
        description: 'Ya teneis conexion activa. Puedes escribirle directamente.',
        icon: MessageCircle,
        disabled: false,
        onClick: handleOpenChat,
      };
    }

    if (ownerConnectionState === 'incoming') {
      return {
        label: 'Responder solicitud',
        description: 'Este usuario ya te ha pedido compartir compatibilidad.',
        icon: UserCheck,
        disabled: false,
        onClick: () => navigate('/connections'),
      };
    }

    if (ownerConnectionState === 'outgoing') {
      return {
        label: 'Solicitud enviada',
        description: 'Te avisaremos cuando el propietario responda.',
        icon: CheckCircle,
        disabled: true,
        onClick: undefined,
      };
    }

    return {
      label: isRequestingConsent ? 'Enviando...' : 'Me interesa',
      description: 'Solicita compartir compatibilidad para poder iniciar conversacion.',
      icon: isRequestingConsent ? Loader2 : Send,
      disabled: isRequestingConsent || ownerConnectionState === 'unknown',
      onClick: handleRequestConsent,
    };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !listing || !owner) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{error || 'Anuncio no encontrado'}</h1>
            <Button onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a anuncios
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const ownerName = getOwnerName(owner);
  const photos = getListingPhotos(listing);
  const activePhoto = photos[Math.min(activePhotoIndex, photos.length - 1)] || '/placeholder.svg';
  const compatibilityReasons = compatibility?.breakdown?.reasons ?? [];
  const isOwner = currentUserId === owner.user_id;
  const isListingPaused = listing.status === 'paused';
  const isListingDeleted = listing.status === 'deleted';
  const ownerAction = getOwnerAction();
  const OwnerActionIcon = ownerAction.icon;
  const roomDetails = normalizeRoomListingDetails(listing.details);
  const roomDetailItems = listing.listing_type === 'room'
    ? getRoomListingDetailItems(roomDetails)
    : [];
  const descriptionWithoutLegacyNeighborhood = (listing.description ?? '').replace(/\n*\s*Barrio\/Zona:\s*(.+?)\s*$/i, '').trimEnd();

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a anuncios
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img
                      src={activePhoto}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {photos.length > 1 && (
                      <Badge className="absolute right-3 top-3 rounded-full bg-background/90 text-foreground">
                        {activePhotoIndex + 1}/{photos.length}
                      </Badge>
                    )}
                  </div>

                  {photos.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {photos.map((photo, index) => (
                        <button
                          key={`${photo}-${index}`}
                          type="button"
                          className={`aspect-video rounded-lg overflow-hidden border transition-colors ${
                            index === activePhotoIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                          }`}
                          onClick={() => setActivePhotoIndex(index)}
                          aria-label={`Ver foto ${index + 1}`}
                        >
                          <img src={photo} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={listing.listing_type === 'room' ? 'default' : 'secondary'} className="rounded-full">
                    {listing.listing_type === 'room' ? (
                      <>
                        <Home className="w-3 h-3 mr-1" />
                        Habitación disponible
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 mr-1" />
                        Busca compañero/a para alquilar juntos
                      </>
                    )}
                  </Badge>
                  {listing.listing_verified && (
                    <Badge variant="outline" className="rounded-full">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Anuncio verificado
                    </Badge>
                  )}
                  {isListingPaused && (
                    <Badge variant="secondary" className="rounded-full">
                      Pausado
                    </Badge>
                  )}
                  {isListingDeleted && (
                    <Badge variant="destructive" className="rounded-full">
                      Eliminado
                    </Badge>
                  )}
                  {isOwner && (
                    <Badge variant="outline" className="rounded-full">
                      Tu anuncio
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-3">{listing.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.city || 'Ciudad no indicada'}{listing.province_code ? `, ${listing.province_code}` : ''}</span>
                </div>
                {roomDetails.neighborhood && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Barrio/Zona: {roomDetails.neighborhood}</span>
                  </div>
                )}
              </motion.div>

              {isOwner && (isListingPaused || isListingDeleted) && (
                <Card className={isListingDeleted ? 'border-rose-200 bg-rose-50 text-rose-950' : 'border-amber-200 bg-amber-50 text-amber-950'}>
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h2 className="font-semibold">{isListingDeleted ? 'Este anuncio esta eliminado' : 'Este anuncio esta pausado'}</h2>
                        <p className={`text-sm ${isListingDeleted ? 'text-rose-900' : 'text-amber-900'}`}>
                          {isListingDeleted
                            ? 'Solo tu puedes verlo. No aparece en busquedas publicas y no se puede recuperar desde esta pantalla.'
                            : 'Solo tu puedes verlo. No aparece en busquedas publicas ni en listados de otros usuarios.'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/my-listings')}>
                      Gestionar
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <Euro className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="font-semibold">{listing.price_monthly ? `${listing.price_monthly}€/mes` : 'A consultar'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Calendar className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Disponible</p>
                    <p className="font-semibold">{formatDate(listing.available_from)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Clock className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Estancia mínima</p>
                    <p className="font-semibold">{listing.min_stay_months ? `${listing.min_stay_months} meses` : 'Flexible'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <CheckCircle className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Gastos</p>
                    <p className="font-semibold">{listing.bills_included ? 'Incluidos' : 'No incluidos'}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Descripción</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {descriptionWithoutLegacyNeighborhood || 'Este anuncio todavía no tiene descripción.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Condiciones</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Cigarette className="w-4 h-4 text-muted-foreground" />
                      <span>{listing.smoking_allowed ? 'Permite fumar' : 'No permite fumar'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-muted-foreground" />
                      <span>{listing.pets_allowed ? 'Permite mascotas' : 'No permite mascotas'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {roomDetailItems.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Condiciones de convivencia</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {roomDetailItems.map((item) => (
                        <div key={item.label} className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={owner.photo_url ?? ''} alt={ownerName} />
                        <AvatarFallback>{ownerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{ownerName}</h3>
                        <div className="flex gap-2 mt-1">
                          {owner.selfie_verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confianza</span>
                        <span className="font-medium">{owner.trust_score ?? 0}/100</span>
                      </div>
                      {owner.city && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ciudad</span>
                          <span className="font-medium">{owner.city}</span>
                        </div>
                      )}
                    </div>

                    {isOwner ? (
                      <Button onClick={() => navigate('/my-listings')} className="w-full gap-2" variant="hero">
                        <Edit2 className="w-4 h-4" />
                        Gestionar mi anuncio
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={ownerAction.onClick}
                          className="w-full gap-2"
                          variant="hero"
                          disabled={ownerAction.disabled}
                        >
                          <OwnerActionIcon className={`w-4 h-4 ${isRequestingConsent ? 'animate-spin' : ''}`} />
                          {ownerAction.label}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          {ownerAction.description}
                        </p>
                        <SafetyActions
                          targetType="listing"
                          targetId={listing.id}
                          targetUserId={owner.user_id}
                          targetName={ownerName}
                          buttonLabel="Reportar o bloquear"
                          onBlocked={() => setIsBlocked(true)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isOwner && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      {isLoadingCompatibility ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      ) : compatibility?.ok ? (
                        <>
                          <div className="text-3xl font-bold text-primary mb-1">{compatibility.score ?? 0}%</div>
                          <p className="text-sm text-muted-foreground">Compatibilidad</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {isBlocked ? 'Usuario bloqueado' : 'Compatibilidad pendiente de consentimiento'}
                          </p>
                        </>
                      )}
                    </div>

                    {compatibility?.ok && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          {compatibilityReasons.slice(0, 3).map((reason, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {reason}
                            </div>
                          ))}
                          {compatibility.breakdown?.friction && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              {compatibility.breakdown.friction}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
