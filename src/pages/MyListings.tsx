import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Euro,
  Eye,
  Home,
  Loader2,
  MapPin,
  PauseCircle,
  Plus,
  RotateCcw,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { buildRoomListingDetailsFromForm, roomListingDetailsFormFromDetails, homeEnvironmentOptions, occupancyPolicyOptions, visitsPolicyOptions, type RoomListingDetailsForm } from '@/lib/listingDetails';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

type Listing = Tables<'convinter_listings'>;

type ListingAction = {
  listing: Listing;
  status: 'active' | 'paused';
} | null;

type UpdateListingResponse = {
  ok: boolean;
  code?: string;
};

type EditForm = {
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  price: string;
  availableFrom: string;
  minStay: string;
  billsIncluded: boolean;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  photos: string[];
  roomDetails: RoomListingDetailsForm;
};

type ListingStatusFilter = 'all' | 'active' | 'paused';
type ListingSort = 'updated_desc' | 'price_asc' | 'available_asc';

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 1200;

const cities = [
  'Madrid',
  'Barcelona',
  'Valencia',
  'Sevilla',
  'Bilbao',
  'Zaragoza',
  'Malaga',
  'Granada',
  'San Sebastian',
  'Alicante',
  'A Coruna',
  'Palma de Mallorca',
];

const statusLabels: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  inactive: 'Pausado',
  draft: 'Borrador',
  pending: 'Pendiente',
};

const formatDate = (date: string | null) => {
  if (!date) return 'Flexible';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

const formatUpdatedAt = (date: string | null) => {
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
};

const getListingTypeLabel = (listingType: Listing['listing_type']) => (
  listingType === 'room' ? 'Habitacion disponible' : 'Busca companero/a para alquilar juntos'
);

const getListingImage = (listing: Listing) => {
  if (Array.isArray(listing.photos)) {
    return listing.photos[0] || '/placeholder.svg';
  }

  return listing.thumbnail_url || '/placeholder.svg';
};

const getErrorMessage = (code?: string) => {
  if (code === 'NOT_AUTHENTICATED') return 'Inicia sesion para gestionar tus anuncios.';
  if (code === 'LISTING_NOT_FOUND') return 'No se ha encontrado el anuncio.';
  if (code === 'NOT_OWNER') return 'Solo puedes modificar tus propios anuncios.';
  return 'No se pudo actualizar el anuncio.';
};

const LEGACY_NEIGHBORHOOD_PATTERN = /\n*\s*Barrio\/Zona:\s*(.+?)\s*$/i;

const extractLegacyNeighborhood = (description: string | null | undefined) => {
  if (!description) return { cleanDescription: '', neighborhood: '' };

  const match = description.match(LEGACY_NEIGHBORHOOD_PATTERN);
  if (!match) {
    return { cleanDescription: description, neighborhood: '' };
  }

  return {
    cleanDescription: description.replace(LEGACY_NEIGHBORHOOD_PATTERN, '').trimEnd(),
    neighborhood: match[1].trim(),
  };
};

const toEditForm = (listing: Listing): EditForm => {
  const roomDetails = roomListingDetailsFormFromDetails(listing.details);
  const { cleanDescription, neighborhood: legacyNeighborhood } = extractLegacyNeighborhood(listing.description);

  return {
    title: listing.title,
    description: cleanDescription,
    city: listing.city ?? '',
    neighborhood: roomDetails.neighborhood || legacyNeighborhood,
    price: listing.price_monthly?.toString() ?? '',
    availableFrom: listing.available_from ?? '',
    minStay: listing.min_stay_months?.toString() ?? '',
    billsIncluded: Boolean(listing.bills_included),
    smokingAllowed: Boolean(listing.smoking_allowed),
    petsAllowed: Boolean(listing.pets_allowed),
    photos: listing.photos ?? [],
    roomDetails,
  };
};

const sanitizeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');

export default function MyListings() {
  useSEO({ page: 'myListings', noIndex: true });

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [pendingAction, setPendingAction] = useState<ListingAction>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>('all');
  const [sortBy, setSortBy] = useState<ListingSort>('updated_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = useMemo(() => listings.filter((listing) => listing.status === 'active').length, [listings]);
  const pausedCount = useMemo(() => listings.filter((listing) => listing.status === 'paused' || listing.status === 'inactive').length, [listings]);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleListings = useMemo(() => {
    const filtered = listings.filter((listing) => {
      const status = listing.status ?? '';
      const matchesStatus = statusFilter === 'all'
        || status === statusFilter
        || (statusFilter === 'paused' && status === 'inactive');

      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      return [
        listing.title,
        listing.description,
        listing.city,
        listing.province_code,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });

    return [...filtered].sort((first, second) => {
      if (sortBy === 'price_asc') {
        return (first.price_monthly ?? Number.MAX_SAFE_INTEGER) - (second.price_monthly ?? Number.MAX_SAFE_INTEGER);
      }

      if (sortBy === 'available_asc') {
        const firstDate = first.available_from ? new Date(first.available_from).getTime() : Number.MAX_SAFE_INTEGER;
        const secondDate = second.available_from ? new Date(second.available_from).getTime() : Number.MAX_SAFE_INTEGER;
        return firstDate - secondDate;
      }

      return new Date(second.updated_at ?? 0).getTime() - new Date(first.updated_at ?? 0).getTime();
    });
  }, [listings, normalizedSearch, sortBy, statusFilter]);
  const photoPreviews = useMemo(() => newPhotoFiles.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  })), [newPhotoFiles]);
  const isEditingRoomListing = editingListing?.listing_type === 'room';

  useEffect(() => () => {
    photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [photoPreviews]);

  const loadListings = useCallback(async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      toast.error('Inicia sesion para gestionar tus anuncios');
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('convinter_listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading my listings:', error);
      toast.error('No se pudieron cargar tus anuncios');
      setListings([]);
      setLoading(false);
      return;
    }

    setListings(data ?? []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const openEditor = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm(toEditForm(listing));
    setNewPhotoFiles([]);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditingListing(null);
    setEditForm(null);
    setNewPhotoFiles([]);
  };

  const handlePhotosSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;

    const files = Array.from(event.target.files ?? []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const validFiles = imageFiles.filter((file) => file.size <= 5 * 1024 * 1024);
    const totalPhotos = editForm.photos.length + newPhotoFiles.length + validFiles.length;

    if (validFiles.length !== files.length) {
      toast.warning('Algunas fotos se han omitido: solo imagenes de hasta 5MB.');
    }

    if (totalPhotos > 8) {
      toast.warning('Puedes tener un maximo de 8 fotos por anuncio.');
    }

    const remainingSlots = Math.max(0, 8 - editForm.photos.length - newPhotoFiles.length);
    setNewPhotoFiles((current) => [...current, ...validFiles.slice(0, remainingSlots)]);
    event.target.value = '';
  };

  const removeCurrentPhoto = (photoUrl: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      photos: editForm.photos.filter((photo) => photo !== photoUrl),
    });
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const validateEditForm = () => {
    if (!editForm) return false;

    const title = editForm.title.trim();
    const description = editForm.description.trim();

    if (title.length < TITLE_MIN_LENGTH) {
      toast.error(`El titulo debe tener al menos ${TITLE_MIN_LENGTH} caracteres`);
      return false;
    }

    if (title.length > TITLE_MAX_LENGTH) {
      toast.error(`El titulo no puede superar ${TITLE_MAX_LENGTH} caracteres`);
      return false;
    }

    if (description.length < DESCRIPTION_MIN_LENGTH) {
      toast.error(`La descripcion debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres`);
      return false;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      toast.error(`La descripcion no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres`);
      return false;
    }

    if (editForm.price) {
      const price = Number(editForm.price);
      if (!Number.isFinite(price) || price < 0) {
        toast.error('Introduce un precio valido');
        return false;
      }
      if (price > 10000) {
        toast.error('El precio mensual parece demasiado alto');
        return false;
      }
    }

    if (editForm.availableFrom) {
      const selectedDate = new Date(`${editForm.availableFrom}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error('La fecha disponible no puede estar en el pasado');
        return false;
      }
    }

    const currentHouseholdCount = editForm.roomDetails.currentHouseholdCount.trim();
    if (currentHouseholdCount) {
      const count = Number(currentHouseholdCount);
      if (!Number.isInteger(count) || count < 0) {
        toast.error('Indica un numero valido de personas viviendo actualmente');
        return false;
      }
    }

    return true;
  };

  const uploadPhotos = async (userId: string) => {
    const uploadedUrls: string[] = [];

    for (const [index, file] of newPhotoFiles.entries()) {
      const path = `${userId}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const saveListing = async () => {
    if (!editingListing || !editForm) return;

    if (!validateEditForm()) return;

    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        toast.error('Inicia sesion para gestionar tus anuncios');
        navigate('/login');
        return;
      }

      const uploadedPhotos = await uploadPhotos(user.id);
      const photos = [...editForm.photos, ...uploadedPhotos];
      const roomDetails = editingListing.listing_type === 'room'
        ? buildRoomListingDetailsFromForm({
            ...editForm.roomDetails,
            neighborhood: editForm.neighborhood,
          })
        : undefined;

      const { data, error } = await supabase.rpc('convinter_update_listing', {
        p_listing_id: editingListing.id,
        p_title: editForm.title.trim(),
        p_description: editForm.description.trim(),
        p_city: editForm.city || undefined,
        p_price_monthly: editForm.price ? Number(editForm.price) : undefined,
        p_available_from: editForm.availableFrom || undefined,
        p_min_stay_months: editForm.minStay ? Number(editForm.minStay) : undefined,
        p_bills_included: editForm.billsIncluded,
        p_smoking_allowed: editForm.smokingAllowed,
        p_pets_allowed: editForm.petsAllowed,
        p_photos: photos,
        p_details: roomDetails,
      });

      if (error) throw error;

      const result = data as unknown as UpdateListingResponse;
      if (!result.ok) {
        toast.error(getErrorMessage(result.code));
        return;
      }

      toast.success('Anuncio actualizado');
      closeEditor();
      await loadListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('No se pudo guardar el anuncio');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    if (!pendingAction) return;

    setSaving(true);

    try {
      const nextStatus = pendingAction.status;
      const { data, error } = await supabase.rpc('convinter_update_listing', {
        p_listing_id: pendingAction.listing.id,
        p_status: nextStatus,
      });

      if (error) throw error;

      const result = data as unknown as UpdateListingResponse;
      if (!result.ok) {
        toast.error(getErrorMessage(result.code));
        return;
      }

      toast.success(pendingAction.status === 'active' ? 'Anuncio reactivado' : 'Anuncio pausado');
      setListings((current) => current.map((listing) => (
        listing.id === pendingAction.listing.id
          ? { ...listing, status: nextStatus, updated_at: new Date().toISOString() }
          : listing
      )));
      setPendingAction(null);
      loadListings().catch((refreshError) => {
        console.warn('Listing status changed, but refreshing listings failed:', refreshError);
      });
    } catch (error) {
      console.error('Error changing listing status:', error);
      toast.error('No se pudo cambiar el estado del anuncio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis anuncios</h1>
            <p className="text-muted-foreground">Gestiona tus anuncios publicados, pausados y sus datos principales.</p>
          </div>
          <Button asChild variant="hero" className="gap-2">
            <Link to="/create-listing">
              <Plus className="h-4 w-4" />
              Crear anuncio
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{listings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pausados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pausedCount}</p>
            </CardContent>
          </Card>
        </div>

        {listings.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex rounded-lg border border-border bg-background p-1">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activos' },
                  { value: 'paused', label: 'Pausados' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={statusFilter === option.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8"
                    onClick={() => setStatusFilter(option.value as ListingStatusFilter)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por titulo, ciudad o descripcion"
                className="w-full sm:w-80"
              />
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as ListingSort)}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Mas recientes</SelectItem>
                <SelectItem value="price_asc">Precio menor</SelectItem>
                <SelectItem value="available_asc">Disponible antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Todavia no tienes anuncios</h2>
            <p className="text-muted-foreground mb-5">Crea tu primer anuncio para aparecer en el buscador.</p>
            <Button asChild variant="hero">
              <Link to="/create-listing">Crear anuncio</Link>
            </Button>
          </div>
        ) : visibleListings.length === 0 ? (
          <div className="text-center py-16">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No hay anuncios con estos filtros</h2>
            <p className="text-muted-foreground mb-5">Prueba con otro estado, cambia el orden o limpia la busqueda.</p>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
                setSortBy('updated_desc');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleListings.map((listing) => {
              const image = getListingImage(listing);
              const isActive = listing.status === 'active';

              return (
                <motion.article
                  key={listing.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <div className="grid sm:grid-cols-[180px_1fr]">
                    <Link to={`/listing/${listing.id}`} className="block bg-muted">
                      <img src={image} alt={listing.title} className="h-48 sm:h-full w-full object-cover" />
                    </Link>

                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant={isActive ? 'default' : 'secondary'} className="rounded-full">
                              {statusLabels[listing.status ?? ''] ?? listing.status ?? 'Sin estado'}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {getListingTypeLabel(listing.listing_type)}
                            </Badge>
                          </div>
                          <h2 className="font-semibold text-lg line-clamp-2">{listing.title}</h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            Actualizado {formatUpdatedAt(listing.updated_at)}
                          </p>
                        </div>
                      </div>

                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{listing.city || 'Ciudad no indicada'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-primary" />
                          <span>{listing.price_monthly ? `${listing.price_monthly} EUR/mes` : 'Sin precio'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{formatDate(listing.available_from)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary" />
                          <span>{listing.min_stay_months ? `${listing.min_stay_months} meses` : 'Sin minimo'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <Link to={`/listing/${listing.id}`}>
                            <Eye className="h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditor(listing)}>
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Button>
                        {isActive ? (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setPendingAction({ listing, status: 'paused' })}>
                            <PauseCircle className="h-4 w-4" />
                            Pausar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setPendingAction({ listing, status: 'active' })}>
                            <RotateCcw className="h-4 w-4" />
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(editingListing)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar anuncio</DialogTitle>
            <DialogDescription>Actualiza la informacion principal del anuncio.</DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="listing-title">Titulo</Label>
                <Input
                  id="listing-title"
                  value={editForm.title}
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editForm.title.length}/{TITLE_MAX_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="listing-description">Descripcion</Label>
                <Textarea
                  id="listing-description"
                  rows={5}
                  value={editForm.description}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editForm.description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Select value={editForm.city} onValueChange={(value) => setEditForm({ ...editForm, city: value })} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listing-neighborhood">Barrio o zona</Label>
                  <Input
                    id="listing-neighborhood"
                    value={editForm.neighborhood}
                    onChange={(event) => setEditForm({ ...editForm, neighborhood: event.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listing-price">Precio mensual</Label>
                  <Input
                    id="listing-price"
                    type="number"
                    min="0"
                    value={editForm.price}
                    onChange={(event) => setEditForm({ ...editForm, price: event.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listing-available">Disponible desde</Label>
                  <Input
                    id="listing-available"
                    type="date"
                    value={editForm.availableFrom}
                    onChange={(event) => setEditForm({ ...editForm, availableFrom: event.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listing-min-stay">Estancia minima</Label>
                  <Select value={editForm.minStay} onValueChange={(value) => setEditForm({ ...editForm, minStay: value })} disabled={saving}>
                    <SelectTrigger id="listing-min-stay">
                      <SelectValue placeholder="Sin minimo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mes</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Gastos incluidos</Label>
                  <Switch checked={editForm.billsIncluded} onCheckedChange={(checked) => setEditForm({ ...editForm, billsIncluded: checked })} disabled={saving} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Fumar</Label>
                  <Switch checked={editForm.smokingAllowed} onCheckedChange={(checked) => setEditForm({ ...editForm, smokingAllowed: checked })} disabled={saving} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Mascotas</Label>
                  <Switch checked={editForm.petsAllowed} onCheckedChange={(checked) => setEditForm({ ...editForm, petsAllowed: checked })} disabled={saving} />
                </div>
              </div>

              {isEditingRoomListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h3 className="font-semibold">Condiciones de convivencia</h3>
                    <p className="text-sm text-muted-foreground">Edita las normas concretas de esta habitacion anunciada.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Politica de visitas</Label>
                      <Select
                        value={editForm.roomDetails.visitsPolicy}
                        onValueChange={(value) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, visitsPolicy: value },
                        })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opcion" />
                        </SelectTrigger>
                        <SelectContent>
                          {visitsPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>¿Para quien esta disponible la habitacion?</Label>
                      <Select
                        value={editForm.roomDetails.occupancyPolicy}
                        onValueChange={(value) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, occupancyPolicy: value },
                        })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opcion" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupancyPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ambiente del piso</Label>
                      <Select
                        value={editForm.roomDetails.homeEnvironment}
                        onValueChange={(value) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, homeEnvironment: value },
                        })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opcion" />
                        </SelectTrigger>
                        <SelectContent>
                          {homeEnvironmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Acepta menores</Label>
                      <Select
                        value={editForm.roomDetails.allowsMinors}
                        onValueChange={(value) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, allowsMinors: value as RoomListingDetailsForm['allowsMinors'] },
                        })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Si</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Propietario vive en la vivienda</Label>
                      <Select
                        value={editForm.roomDetails.ownerLivesHere}
                        onValueChange={(value) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, ownerLivesHere: value as RoomListingDetailsForm['ownerLivesHere'] },
                        })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Si</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="listing-household-count">Personas viviendo actualmente</Label>
                      <Input
                        id="listing-household-count"
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.roomDetails.currentHouseholdCount}
                        onChange={(event) => setEditForm({
                          ...editForm,
                          roomDetails: { ...editForm.roomDetails, currentHouseholdCount: event.target.value },
                        })}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Fotos del anuncio</Label>
                    <p className="text-xs text-muted-foreground">La primera foto se usara como portada.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {editForm.photos.length + newPhotoFiles.length}/8
                  </Badge>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotosSelected}
                />

                {(editForm.photos.length > 0 || photoPreviews.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {editForm.photos.map((photo, index) => (
                      <div key={photo} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                        <img src={photo} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <Badge className="absolute left-1 top-1 rounded-full">Portada</Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7"
                          onClick={() => removeCurrentPhoto(photo)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {photoPreviews.map(({ file, url }, index) => (
                      <div key={`${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-primary/40">
                        <img src={url} alt={file.name} className="h-full w-full object-cover" />
                        {editForm.photos.length === 0 && index === 0 && (
                          <Badge className="absolute left-1 top-1 rounded-full">Portada</Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7"
                          onClick={() => removeNewPhoto(index)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Este anuncio aun no tiene fotos.
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving || editForm.photos.length + newPhotoFiles.length >= 8}
                >
                  <Upload className="h-4 w-4" />
                  Anadir fotos
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditor} disabled={saving}>Cancelar</Button>
            <Button onClick={saveListing} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.status === 'active' ? 'Reactivar anuncio' : 'Pausar anuncio'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.status === 'active'
                ? 'El anuncio volvera a mostrarse en las busquedas publicas.'
                : 'El anuncio dejara de mostrarse en las busquedas publicas, pero podras reactivarlo despues.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={changeStatus} disabled={saving}>
              {pendingAction?.status === 'active' ? 'Reactivar' : 'Pausar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
