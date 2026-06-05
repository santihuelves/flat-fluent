import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Key, Loader2, Search, Upload, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { MIN_STAY_INDEFINITE_VALUE, MIN_STAY_MAX_MONTHS, MIN_STAY_MIN_MONTHS, bathroomUsePolicyOptions, buildRoomListingDetailsFromForm, cleaningPolicyOptions, contractAvailableOptions, depositMonthsOptions, emptyRoomListingDetailsForm, formatMinStayLabel, getMinStaySliderValue, homeEnvironmentOptions, homeFloorOptions, homeOrientationOptions, householdContextOptions, householdGenderMixOptions, householdOccupationOptions, kitchenEquipmentOptions, kitchenUsePolicyOptions, livingRoomUsePolicyOptions, nearbyServiceOptions, noticePeriodOptions, occupancyPolicyOptions, partyPolicyOptions, preferredGenderOptions, quietHoursPolicyOptions, registrationAllowedOptions, remoteWorkPolicyOptions, roomBathroomOptions, roomFurnitureOptions, roomFurnishingStatusOptions, roomLockOptions, roomNaturalLightOptions, roomOrientationOptions, roomWindowOptions, visitsPolicyOptions, type RoomListingDetailsForm } from '@/lib/listingDetails';
import { AUTONOMOUS_COMMUNITIES, PROVINCES } from '@/lib/profileOptions';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

const listingTypes = [
  { value: 'offer_room', rpcType: 'room', label: 'Ofrezco habitación', icon: Key, description: 'Publica una habitación concreta que tienes disponible' },
  { value: 'seek_room', rpcType: null, label: 'Busco habitación', icon: Search, description: 'Prepara una búsqueda de habitación sin mezclarla con una oferta' },
] as const;

type ListingKind = typeof listingTypes[number]['value'];

const getListingKindFromParam = (value: string | null): ListingKind | null =>
  value === 'offer_room' || value === 'seek_room' ? value : null;

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 1200;
const NEIGHBORHOOD_MAX_LENGTH = 80;
const ADDRESS_HINT_MAX_LENGTH = 140;
const AGE_RANGE_MIN = 18;
const AGE_RANGE_MAX = 75;
const EXPENSES_ESTIMATE_MAX = 1000;
const HOUSEHOLD_COUNT_MAX = 8;
const HOME_SIZE_MIN = 20;
const HOME_SIZE_MAX = 300;
const BEDROOM_COUNT_MIN = 1;
const BEDROOM_COUNT_MAX = 8;
const BATHROOM_COUNT_MIN = 1;
const BATHROOM_COUNT_MAX = 5;
const ROOM_SIZE_MIN = 6;
const ROOM_SIZE_MAX = 40;
const TRANSPORT_WALK_MINUTES_MAX = 30;

type FormData = {
  type: ListingKind | '';
  title: string;
  description: string;
  autonomousCommunity: string;
  province: string;
  city: string;
  neighborhood: string;
  price: string;
  expensesIncluded: boolean;
  availableDate: string;
  minStay: string;
  smokingAllowed: boolean | null;
  petsAllowed: boolean | null;
  roomDetails: RoomListingDetailsForm;
};

type CreateListingResponse = {
  ok: boolean;
  code?: string;
  listing_id?: string;
};

type ProfilePrefillData = {
  autonomous_community: string | null;
  province: string | null;
  city: string | null;
  lifestyle_tags: string[] | null;
  user_type: 'seeking_room' | 'offering_room' | 'seeking_roommate' | null;
};

type ProfileIntentionPrefill = {
  intention_type?: 'seek_room' | 'offer_room' | 'seek_flatmate';
  is_primary?: boolean;
  details?: {
    selected_goal?: string | null;
  } | null;
};

const getCreateErrorMessage = (code?: string) => {
  if (code === 'NOT_AUTHENTICATED') return 'Inicia sesión para publicar anuncios.';
  if (code === 'TITLE_REQUIRED') return 'El título es obligatorio.';
  if (code === 'TITLE_TOO_SHORT') return 'El título debe tener al menos 10 caracteres.';
  if (code === 'DESCRIPTION_TOO_SHORT') return 'La descripción debe tener al menos 20 caracteres.';
  if (code === 'INVALID_LISTING_TYPE') return 'Tipo de anuncio no válido.';
  return 'No se pudo crear el anuncio.';
};

const sanitizeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getSelectedGoal = (details: unknown) =>
  isRecord(details) && typeof details.selected_goal === 'string' ? details.selected_goal : null;

const syncOfferRoomIntention = async (
  userId: string,
  listingId: string,
  formData: FormData
) => {
  const details = {
    source: 'listing_created',
    listing_id: listingId,
    city: formData.city || null,
    province: formData.province || null,
    price_monthly: formData.price ? Number(formData.price) : null,
    available_from: formData.availableDate || null,
    min_stay_months: formData.minStay ? Number(formData.minStay) : null,
  };

  const { error: intentionError } = await supabase.rpc('convinter_set_intention', {
    p_intention_type: 'offer_room',
    p_is_primary: true,
    p_urgency: 'flexible',
    p_details: details,
  });

  if (intentionError) {
    console.warn('Could not sync offer_room intention after listing creation:', intentionError);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ user_type: 'offering_room' })
    .eq('id', userId);

  if (profileError) {
    console.warn('Could not sync profile user_type after listing creation:', profileError);
  }
};

const syncSeekRoomIntention = async (userId: string) => {
  const { error: intentionError } = await supabase.rpc('convinter_set_intention', {
    p_intention_type: 'seek_room',
    p_is_primary: true,
    p_urgency: 'flexible',
    p_details: {
      source: 'create_listing_seek_room_path',
    },
  });

  if (intentionError) {
    console.warn('Could not sync seek_room intention from create listing:', intentionError);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ user_type: 'seeking_room' })
    .eq('id', userId);

  if (profileError) {
    console.warn('Could not sync profile user_type for seek_room:', profileError);
  }
};

export default function CreateListing() {
  useSEO({ page: 'createListing', noIndex: true });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedListingType = getListingKindFromParam(searchParams.get('type'));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasUserEditedFormRef = useRef(false);
  const [step, setStep] = useState(requestedListingType ? 2 : 1);
  const [typeStepSkipped, setTypeStepSkipped] = useState(Boolean(requestedListingType));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePrefillApplied, setProfilePrefillApplied] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: requestedListingType ?? '',
    title: '',
    description: '',
    autonomousCommunity: '',
    province: '',
    city: '',
    neighborhood: '',
    price: '',
    expensesIncluded: false,
    availableDate: '',
    minStay: '6',
    smokingAllowed: null,
    petsAllowed: null,
    roomDetails: emptyRoomListingDetailsForm(),
  });

  const selectedType = listingTypes.find((type) => type.value === formData.type);
  const isFlatmateListing = false;
  const progressSteps = typeStepSkipped ? [2, 3] : [1, 2, 3];

  const previews = useMemo(() => photoFiles.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  })), [photoFiles]);

  useEffect(() => () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  useEffect(() => {
    if (!requestedListingType || hasUserEditedFormRef.current) return;

    setFormData((current) => {
      if (current.type === requestedListingType) return current;

      return {
        ...current,
        type: requestedListingType,
      };
    });
    setStep((current) => Math.max(current, 2));
    setTypeStepSkipped(true);
  }, [requestedListingType]);

  useEffect(() => {
    let cancelled = false;

    const prefillFromProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: profileData, error: profileError }, { data: intentionsData, error: intentionsError }] = await Promise.all([
          supabase
            .from('profiles')
            .select('autonomous_community, province, city, lifestyle_tags, user_type')
            .eq('id', user.id)
            .maybeSingle(),
          supabase.rpc('convinter_get_intentions', {
            p_profile_id: user.id,
          }),
        ]);

        if (profileError) {
          console.warn('Error loading profile for listing prefill:', profileError);
        }
        if (intentionsError) {
          console.warn('Error loading intentions for listing prefill:', intentionsError);
        }

        if (cancelled || hasUserEditedFormRef.current) return;

        const profile = (profileData ?? null) as ProfilePrefillData | null;
        const intentionsResult = intentionsData as unknown as { ok?: boolean; intentions?: ProfileIntentionPrefill[] } | null;
        const intentions = intentionsResult?.ok ? intentionsResult.intentions ?? [] : [];
        const offerIntention = intentions.find((intention) => intention.intention_type === 'offer_room') ?? null;
        const hasOfferGoal =
          profile?.user_type === 'offering_room' ||
          Boolean(offerIntention) ||
          intentions.some((intention) => getSelectedGoal(intention.details) === 'have_flat_seek_housemate');

        setFormData((current) => {
          if (hasUserEditedFormRef.current) return current;

          let applied = false;
          const next: FormData = { ...current };

          if (requestedListingType === 'offer_room' && hasOfferGoal && !next.type) {
            next.type = 'offer_room';
            applied = true;
          }

          if (profile?.autonomous_community && !next.autonomousCommunity) {
            next.autonomousCommunity = profile.autonomous_community;
            applied = true;
          }
          if (profile?.province && !next.province) {
            next.province = profile.province;
            applied = true;
          }
          if (profile?.city && !next.city) {
            next.city = profile.city;
            applied = true;
          }

          if (applied) {
            setProfilePrefillApplied(true);
          }

          return next;
        });

        if (requestedListingType === 'offer_room' && hasOfferGoal) {
          setTypeStepSkipped(true);
          setStep((current) => Math.max(current, 2));
        }
      } catch (error) {
        console.warn('Unexpected error preloading listing form from profile:', error);
      }
    };

    prefillFromProfile();

    return () => {
      cancelled = true;
    };
  }, [requestedListingType]);

  const handleTypeSelect = (type: ListingKind) => {
    hasUserEditedFormRef.current = true;
    setTypeStepSkipped(false);
    setFormData({
      ...formData,
      type,
      roomDetails: {
        ...formData.roomDetails,
        neighborhood: formData.neighborhood,
      },
    });
    setStep(2);
  };

  const handleBack = () => {
    if (step > 2) {
      setStep((current) => current - 1);
      return;
    }

    if (step === 2 && !typeStepSkipped) {
      setStep(1);
      return;
    }

    navigate('/listings');
  };

  const handlePhotosSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const validFiles = imageFiles.filter((file) => file.size <= 5 * 1024 * 1024);
    const availableSlots = Math.max(0, 8 - photoFiles.length);

    if (validFiles.length !== files.length) {
      toast.warning('Algunas fotos se han omitido: solo imágenes de hasta 5MB.');
    }

    if (validFiles.length > availableSlots) {
      toast.warning('Puedes subir un máximo de 8 fotos por anuncio.');
    }

    setPhotoFiles((current) => [...current, ...validFiles.slice(0, availableSlots)]);
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const validateStepTwo = () => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    const neighborhood = formData.neighborhood.trim();

    if (title.length < TITLE_MIN_LENGTH) {
      toast.error(`El título debe tener al menos ${TITLE_MIN_LENGTH} caracteres`);
      return false;
    }
    if (title.length > TITLE_MAX_LENGTH) {
      toast.error(`El título no puede superar ${TITLE_MAX_LENGTH} caracteres`);
      return false;
    }
    if (description.length < DESCRIPTION_MIN_LENGTH) {
      toast.error(`La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres`);
      return false;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      toast.error(`La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres`);
      return false;
    }
    if (neighborhood.length > NEIGHBORHOOD_MAX_LENGTH) {
      toast.error(`La zona o barrio no puede superar ${NEIGHBORHOOD_MAX_LENGTH} caracteres`);
      return false;
    }
    if (formData.roomDetails.addressHint.length > ADDRESS_HINT_MAX_LENGTH) {
      toast.error(`La dirección aproximada no puede superar ${ADDRESS_HINT_MAX_LENGTH} caracteres`);
      return false;
    }
    if (!formData.autonomousCommunity) {
      toast.error('Selecciona una comunidad autónoma');
      return false;
    }
    if (!formData.province) {
      toast.error('Selecciona una provincia');
      return false;
    }
    if (!formData.city) {
      toast.error('Introduce un municipio o ciudad');
      return false;
    }
    return true;
  };

  const booleanSelectValue = (value: boolean) => (value ? 'yes' : 'no');
  const parseBooleanSelectValue = (value: string) => value === 'yes';
  const nullableBooleanSelectValue = (value: boolean | null | undefined) => {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return 'unspecified';
  };
  const parseNullableBooleanSelectValue = (value: string) => {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
  };
  const preferredAgeRange = [
    Number(formData.roomDetails.preferredAgeMin) || AGE_RANGE_MIN,
    Number(formData.roomDetails.preferredAgeMax) || AGE_RANGE_MAX,
  ];
  const householdAgeRange = [
    Number(formData.roomDetails.householdAgeMin) || AGE_RANGE_MIN,
    Number(formData.roomDetails.householdAgeMax) || AGE_RANGE_MAX,
  ];
  const expensesEstimateValue = Number(formData.roomDetails.expensesEstimateMonthly) || 0;
  const householdCountValue = Number(formData.roomDetails.currentHouseholdCount) || 0;
  const homeSizeValue = Number(formData.roomDetails.homeSizeSqm) || 90;
  const bedroomCountValue = Number(formData.roomDetails.bedroomCount) || 3;
  const bathroomCountValue = Number(formData.roomDetails.bathroomCount) || 1;
  const roomSizeValue = Number(formData.roomDetails.roomSizeSqm) || 12;
  const transportWalkMinutesValue = Number(formData.roomDetails.transportWalkMinutes) || 0;

  const validateDetails = () => {
    if (formData.price) {
      const price = Number(formData.price);
      if (!Number.isFinite(price) || price < 0) {
        toast.error('Introduce un precio válido');
        return false;
      }
      if (price > 10000) {
        toast.error('El precio mensual parece demasiado alto');
        return false;
      }
    }

    if (formData.availableDate) {
      const selectedDate = new Date(`${formData.availableDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error('La fecha disponible no puede estar en el pasado');
        return false;
      }
    }

    const currentHouseholdCount = formData.roomDetails.currentHouseholdCount.trim();
    if (currentHouseholdCount) {
      const count = Number(currentHouseholdCount);
      if (!Number.isInteger(count) || count < 0) {
        toast.error('Indica un número válido de personas viviendo actualmente');
        return false;
      }
    }

    return true;
  };

  const uploadPhotos = async (userId: string) => {
    const uploadedUrls: string[] = [];

    for (const [index, file] of photoFiles.entries()) {
      const path = `${userId}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!selectedType || selectedType.rpcType !== 'room' || !validateStepTwo() || !validateDetails()) return;

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        toast.error('Inicia sesión para publicar anuncios');
        navigate('/login');
        return;
      }

      const photos = await uploadPhotos(user.id);
      const details = selectedType.rpcType === 'room'
        ? buildRoomListingDetailsFromForm({
            ...formData.roomDetails,
            neighborhood: formData.neighborhood,
          })
        : {};

      const { data, error } = await supabase.rpc('convinter_create_listing', {
        p_listing_type: selectedType.rpcType,
        p_title: formData.title.trim(),
        p_description: formData.description.trim(),
        p_city: formData.city,
        p_province_code: formData.province,
        p_price_monthly: formData.price ? Number(formData.price) : null,
        p_bills_included: formData.expensesIncluded,
        p_available_from: formData.availableDate || null,
        p_min_stay_months: formData.minStay ? Number(formData.minStay) : null,
        p_smoking_allowed: formData.smokingAllowed ?? undefined,
        p_pets_allowed: formData.petsAllowed ?? undefined,
        p_photos: photos.length > 0 ? photos : null,
        p_details: details,
      });

      if (error) throw error;

      const result = data as unknown as CreateListingResponse;
      if (!result.ok || !result.listing_id) {
        toast.error(getCreateErrorMessage(result.code));
        return;
      }

      if (formData.type === 'offer_room') {
        await syncOfferRoomIntention(user.id, result.listing_id, formData);
      }

      toast.success('Anuncio creado correctamente', {
        description: 'Tu anuncio ya está visible para otros usuarios.',
      });
      navigate(`/listing/${result.listing_id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('No se pudo crear el anuncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeekRoomDiscovery = async () => {
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        toast.error('Inicia sesión para guardar tu búsqueda');
        navigate('/login');
        return;
      }

      await syncSeekRoomIntention(user.id);
      toast.success('Búsqueda guardada', {
        description: 'Ya puedes encontrar personas afines que buscan habitación.',
      });
      navigate('/discover');
    } catch (error) {
      console.error('Error syncing seek room intention:', error);
      toast.error('No se pudo guardar la búsqueda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div
        className="container py-8 max-w-2xl"
        onInputCapture={() => {
          hasUserEditedFormRef.current = true;
        }}
        onChangeCapture={() => {
          hasUserEditedFormRef.current = true;
        }}
      >
        <Button
          variant="ghost"
          className="mb-6"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 1 && !typeStepSkipped ? 'Anterior' : 'Volver a anuncios'}
        </Button>

        <div className="flex gap-2 mb-8">
          {progressSteps.map((currentStep) => (
            <div
              key={currentStep}
              className={`h-2 flex-1 rounded-full transition-colors ${currentStep <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {profilePrefillApplied && step > 1 && formData.type === 'offer_room' && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            Hemos usado datos básicos de ubicación de tu perfil para ahorrar tiempo. La convivencia y las normas se rellenan para esta vivienda concreta.
          </div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Crear anuncio</h1>
            <p className="text-muted-foreground mb-8">Elige qué vas a publicar ahora.</p>
            <p className="mb-4 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Tu perfil de convivencia queda separado. Aquí eliges si vas a ofrecer una habitación concreta o preparar una búsqueda de habitación.
            </p>

            <div className="grid gap-4">
              {listingTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${formData.type === type.value ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && formData.type === 'seek_room' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Busco habitación</h1>
            <p className="text-muted-foreground mb-8">
              Esta opción debe ser un anuncio de búsqueda, distinto del formulario para ofrecer una habitación.
            </p>

            <div className="space-y-5 rounded-2xl border border-border bg-background p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Siguiente microtarea: formulario de búsqueda</h2>
                  <p className="text-sm text-muted-foreground">
                    Para no mezclar conceptos, este camino no abre el formulario de "ofrezco habitación". Aquí construiremos los campos propios de quien busca: zona, presupuesto, disponibilidad, tipo de casa y preferencias.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Elegir otra opción
                </Button>
                <Button variant="hero" onClick={handleSeekRoomDiscovery} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar búsqueda y conocer personas
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && formData.type === 'offer_room' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Información básica</h1>
            <p className="text-muted-foreground mb-8">Cuéntanos más sobre tu habitación disponible</p>

            <div className="space-y-6">
              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h2 className="font-semibold">
                    Información del anuncio
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Resume la habitación y su ubicación. No hace falta publicar una dirección exacta.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título del anuncio</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Habitación luminosa cerca del metro"
                    value={formData.title}
                    maxLength={TITLE_MAX_LENGTH}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/{TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción general</Label>
                  <Textarea
                    id="description"
                    placeholder="Cuenta brevemente qué hace especial la habitación, el piso o la convivencia."
                    rows={5}
                    value={formData.description}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Comunidad autónoma</Label>
                    <Select
                      value={formData.autonomousCommunity}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        autonomousCommunity: value,
                        province: '',
                        city: '',
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona comunidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTONOMOUS_COMMUNITIES.map((community) => (
                          <SelectItem key={community} value={community}>{community}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => setFormData({ ...formData, province: value, city: '' })}
                      disabled={!formData.autonomousCommunity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {(PROVINCES[formData.autonomousCommunity] ?? []).map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Municipio o ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Madrid, Móstoles, Pinto, Cullera, Telde..."
                      value={formData.city}
                      maxLength={80}
                      onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                      disabled={!formData.province}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Zona o barrio</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Ej: Centro, Malasaña, Vecindario, Gràcia..."
                      value={formData.neighborhood}
                      maxLength={NEIGHBORHOOD_MAX_LENGTH}
                      onChange={(event) => setFormData({ ...formData, neighborhood: event.target.value })}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.neighborhood.length}/{NEIGHBORHOOD_MAX_LENGTH}
                    </p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addressHint">Dirección aproximada del inmueble</Label>
                    <Input
                      id="addressHint"
                      placeholder="Ej: cerca del metro Puente de Vallecas, zona avenida de la Albufera"
                      value={formData.roomDetails.addressHint}
                      maxLength={ADDRESS_HINT_MAX_LENGTH}
                      onChange={(event) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, addressHint: event.target.value },
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Evita portal, piso o datos demasiado exactos. Se mostrará como referencia aproximada.
                    </p>
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.roomDetails.addressHint.length}/{ADDRESS_HINT_MAX_LENGTH}
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => validateStepTwo() && setStep(3)}>
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">
              Detalles y fotos
            </h1>
            <p className="text-muted-foreground mb-8">
              Añade los últimos detalles
            </p>

            <div className="space-y-6">
              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Buscando</h2>
                    <p className="text-sm text-muted-foreground">Define qué persona encaja mejor con esta habitación.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-4 sm:col-span-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Edad preferida</Label>
                        <span className="text-sm font-medium">
                          {preferredAgeRange[0]} - {preferredAgeRange[1]} años
                        </span>
                      </div>
                      <Slider
                        min={AGE_RANGE_MIN}
                        max={AGE_RANGE_MAX}
                        step={1}
                        value={preferredAgeRange}
                        onValueChange={([min, max]) => setFormData({
                          ...formData,
                          roomDetails: {
                            ...formData.roomDetails,
                            preferredAgeMin: String(min),
                            preferredAgeMax: String(max),
                          },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{AGE_RANGE_MIN} años</span>
                        <span>{AGE_RANGE_MAX} años</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Género preferido</Label>
                      <Select
                        value={formData.roomDetails.preferredGender}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, preferredGender: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferredGenderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableDate">Disponible desde</Label>
                      <Input
                        id="availableDate"
                        type="date"
                        value={formData.availableDate}
                        onChange={(event) => setFormData({ ...formData, availableDate: event.target.value })}
                      />
                    </div>

                    <div className="space-y-4 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="minStay">Estancia mínima</Label>
                        <span className="text-sm font-medium">
                          {formatMinStayLabel(getMinStaySliderValue(formData.minStay))}
                        </span>
                      </div>
                      <Slider
                        id="minStay"
                        min={MIN_STAY_MIN_MONTHS}
                        max={MIN_STAY_INDEFINITE_VALUE}
                        step={1}
                        value={[getMinStaySliderValue(formData.minStay)]}
                        onValueChange={([value]) => setFormData({ ...formData, minStay: String(value) })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{MIN_STAY_MIN_MONTHS} mes</span>
                        <span>{MIN_STAY_MAX_MONTHS} meses</span>
                        <span>Indefinido</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Disponible para</Label>
                      <Select
                        value={formData.roomDetails.occupancyPolicy}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, occupancyPolicy: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupancyPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Acepta menores</Label>
                      <Select
                        value={formData.roomDetails.allowsMinors}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, allowsMinors: value as RoomListingDetailsForm['allowsMinors'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Ubicación y entorno</h2>
                    <p className="text-sm text-muted-foreground">Ayuda a entender qué tiene cerca la zona sin publicar una dirección exacta.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nearestTransport">Transporte cercano</Label>
                      <Input
                        id="nearestTransport"
                        placeholder="Ej: Metro Puente de Vallecas, líneas 24 y 57"
                        value={formData.roomDetails.nearestTransport}
                        onChange={(event) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, nearestTransport: event.target.value },
                        })}
                      />
                    </div>

                    <div className="space-y-4 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Tiempo andando al transporte</Label>
                        <span className="text-sm font-medium">
                          {transportWalkMinutesValue === 1 ? '1 minuto' : `${transportWalkMinutesValue} minutos`}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={TRANSPORT_WALK_MINUTES_MAX}
                        step={1}
                        value={[transportWalkMinutesValue]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, transportWalkMinutes: String(value) },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 min</span>
                        <span>{TRANSPORT_WALK_MINUTES_MAX}+ min</span>
                      </div>
                    </div>

                    <div className="space-y-3 sm:col-span-2 rounded-xl border border-border/70 p-4">
                      <div>
                        <Label>Servicios y entorno cercano</Label>
                        <p className="text-xs text-muted-foreground">Marca lo que hay cerca caminando o a pocos minutos.</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {nearbyServiceOptions.map((option) => {
                          const isSelected = formData.roomDetails.nearbyServices.includes(option.value);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:border-primary/50'
                              }`}
                              onClick={() => {
                                const nearbyServices = isSelected
                                  ? formData.roomDetails.nearbyServices.filter((item) => item !== option.value)
                                  : [...formData.roomDetails.nearbyServices, option.value];

                                setFormData({
                                  ...formData,
                                  roomDetails: { ...formData.roomDetails, nearbyServices },
                                });
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="locationNotes">Notas de ubicación</Label>
                      <Textarea
                        id="locationNotes"
                        rows={3}
                        placeholder="Ej: lavandería a 3 minutos andando, supermercado a dos calles, buen acceso nocturno..."
                        value={formData.roomDetails.locationNotes}
                        onChange={(event) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, locationNotes: event.target.value },
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h2 className="font-semibold">
                    Precio y gastos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Define el coste principal del anuncio.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Precio mensual (€)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      placeholder="450"
                      value={formData.price}
                      onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gastos incluidos</Label>
                    <Select
                      value={booleanSelectValue(formData.expensesIncluded)}
                      onValueChange={(value) => setFormData({ ...formData, expensesIncluded: parseBooleanSelectValue(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Agua, luz, internet...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Gastos estimados mensuales</Label>
                      <span className="text-sm font-medium">{expensesEstimateValue}€/mes</span>
                    </div>
                    <Slider
                      min={0}
                      max={EXPENSES_ESTIMATE_MAX}
                      step={5}
                      value={[expensesEstimateValue]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, expensesEstimateMonthly: String(value) },
                      })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0€</span>
                      <span>{EXPENSES_ESTIMATE_MAX}€</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fianza</Label>
                    <Select
                      value={formData.roomDetails.depositMonths}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, depositMonths: value },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {depositMonthsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formalización del alquiler</Label>
                    <Select
                      value={formData.roomDetails.contractAvailable}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, contractAvailable: value },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractAvailableOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Recomendamos dejar por escrito precio, duración, fianza, gastos, normas y uso de zonas comunes antes de entregar llaves o pagar señal.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Empadronamiento</Label>
                    <Select
                      value={formData.roomDetails.registrationAllowed}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, registrationAllowed: value },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {registrationAllowedOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preaviso para dejar la habitación</Label>
                    <Select
                      value={formData.roomDetails.noticePeriod}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, noticePeriod: value },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {noticePeriodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Características de la vivienda</h2>
                    <p className="text-sm text-muted-foreground">Describe el piso donde está la habitación anunciada.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-4 sm:col-span-2 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Tamaño de la vivienda</Label>
                        <span className="text-sm font-medium">{homeSizeValue} m²</span>
                      </div>
                      <Slider
                        min={HOME_SIZE_MIN}
                        max={HOME_SIZE_MAX}
                        step={5}
                        value={[homeSizeValue]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, homeSizeSqm: String(value) },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{HOME_SIZE_MIN} m²</span>
                        <span>{HOME_SIZE_MAX} m²</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Planta</Label>
                      <Select
                        value={formData.roomDetails.homeFloor}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, homeFloor: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {homeFloorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Exterior o interior</Label>
                      <Select
                        value={formData.roomDetails.homeOrientation}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, homeOrientation: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {homeOrientationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ascensor</Label>
                      <Select
                        value={formData.roomDetails.hasElevator}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, hasElevator: value as RoomListingDetailsForm['hasElevator'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Internet</Label>
                      <Select
                        value={formData.roomDetails.hasInternet}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, hasInternet: value as RoomListingDetailsForm['hasInternet'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Número de habitaciones</Label>
                        <span className="text-sm font-medium">
                          {bedroomCountValue === 1 ? '1 habitación' : `${bedroomCountValue} habitaciones`}
                        </span>
                      </div>
                      <Slider
                        min={BEDROOM_COUNT_MIN}
                        max={BEDROOM_COUNT_MAX}
                        step={1}
                        value={[bedroomCountValue]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, bedroomCount: String(value) },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{BEDROOM_COUNT_MIN}</span>
                        <span>{BEDROOM_COUNT_MAX}+</span>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Número de baños</Label>
                        <span className="text-sm font-medium">
                          {bathroomCountValue === 1 ? '1 baño' : `${bathroomCountValue} baños`}
                        </span>
                      </div>
                      <Slider
                        min={BATHROOM_COUNT_MIN}
                        max={BATHROOM_COUNT_MAX}
                        step={1}
                        value={[bathroomCountValue]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, bathroomCount: String(value) },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{BATHROOM_COUNT_MIN}</span>
                        <span>{BATHROOM_COUNT_MAX}+</span>
                      </div>
                    </div>

                    <div className="space-y-3 sm:col-span-2 rounded-xl border border-border/70 p-4">
                      <div>
                        <Label>Equipamiento de cocina</Label>
                        <p className="text-xs text-muted-foreground">Marca lo que tiene la cocina para que quede claro cómo se puede usar.</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {kitchenEquipmentOptions.map((option) => {
                          const isSelected = formData.roomDetails.kitchenEquipment.includes(option.value);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:border-primary/50'
                              }`}
                              onClick={() => {
                                const kitchenEquipment = isSelected
                                  ? formData.roomDetails.kitchenEquipment.filter((item) => item !== option.value)
                                  : [...formData.roomDetails.kitchenEquipment, option.value];

                                setFormData({
                                  ...formData,
                                  roomDetails: { ...formData.roomDetails, kitchenEquipment },
                                });
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Lavadora disponible</Label>
                      <Select
                        value={formData.roomDetails.washingMachine}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, washingMachine: value as RoomListingDetailsForm['washingMachine'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Secadora disponible</Label>
                      <Select
                        value={formData.roomDetails.dryerAvailable}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, dryerAvailable: value as RoomListingDetailsForm['dryerAvailable'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Zona para tender</Label>
                      <Select
                        value={formData.roomDetails.dryingArea}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, dryingArea: value as RoomListingDetailsForm['dryingArea'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Espacio para guardar maletas</Label>
                      <Select
                        value={formData.roomDetails.luggageStorage}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, luggageStorage: value as RoomListingDetailsForm['luggageStorage'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Trastero disponible</Label>
                      <Select
                        value={formData.roomDetails.storageRoomAvailable}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, storageRoomAvailable: value as RoomListingDetailsForm['storageRoomAvailable'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Características de la habitación</h2>
                    <p className="text-sm text-muted-foreground">Describe el espacio privado que se alquila.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-4 sm:col-span-2 rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Tamaño de la habitación</Label>
                        <span className="text-sm font-medium">{roomSizeValue} m²</span>
                      </div>
                      <Slider
                        min={ROOM_SIZE_MIN}
                        max={ROOM_SIZE_MAX}
                        step={1}
                        value={[roomSizeValue]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomSizeSqm: String(value) },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{ROOM_SIZE_MIN} m²</span>
                        <span>{ROOM_SIZE_MAX} m²</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ventana, balcón o terraza</Label>
                      <Select
                        value={formData.roomDetails.roomWindow}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomWindow: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomWindowOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Orientación de la habitación</Label>
                      <Select
                        value={formData.roomDetails.roomOrientation}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomOrientation: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomOrientationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Luz natural</Label>
                      <Select
                        value={formData.roomDetails.roomNaturalLight}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomNaturalLight: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomNaturalLightOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cerradura</Label>
                      <Select
                        value={formData.roomDetails.roomLock}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomLock: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomLockOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Baño</Label>
                      <Select
                        value={formData.roomDetails.roomBathroom}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomBathroom: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomBathroomOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado de la habitación</Label>
                      <Select
                        value={formData.roomDetails.roomFurnishingStatus}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, roomFurnishingStatus: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomFurnishingStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 sm:col-span-2 rounded-xl border border-border/70 p-4">
                      <div>
                        <Label>Mobiliario y extras</Label>
                        <p className="text-xs text-muted-foreground">Marca lo que incluye la habitación.</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {roomFurnitureOptions.map((option) => {
                          const isSelected = formData.roomDetails.roomFurniture.includes(option.value);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:border-primary/50'
                              }`}
                              onClick={() => {
                                const roomFurniture = isSelected
                                  ? formData.roomDetails.roomFurniture.filter((item) => item !== option.value)
                                  : [...formData.roomDetails.roomFurniture, option.value];

                                setFormData({
                                  ...formData,
                                  roomDetails: { ...formData.roomDetails, roomFurniture },
                                });
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Convivencia en esta vivienda</h2>
                    <p className="text-sm text-muted-foreground">
                      Estos datos describen esta vivienda, no tu perfil personal. Pueden parecer repetidos, pero ayudan si publicas varias habitaciones o si la habitación está en una casa donde no vives.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Tus compañeros/as</h3>
                      <p className="text-xs text-muted-foreground">Ayuda a entender con quién se va a convivir y cómo es el ambiente de la casa.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Género de tus compañeros/as</Label>
                        <Select
                          value={formData.roomDetails.householdGenderMix}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, householdGenderMix: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {householdGenderMixOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ocupación principal</Label>
                        <Select
                          value={formData.roomDetails.householdOccupation}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, householdOccupation: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {householdOccupationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 sm:col-span-2 rounded-xl border border-border/70 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <Label>Edad aproximada de tus compañeros/as</Label>
                          <span className="text-sm font-medium">
                            {householdAgeRange[0]} - {householdAgeRange[1]} años
                          </span>
                        </div>
                        <Slider
                          min={AGE_RANGE_MIN}
                          max={AGE_RANGE_MAX}
                          step={1}
                          value={householdAgeRange}
                          onValueChange={([min, max]) => setFormData({
                            ...formData,
                            roomDetails: {
                              ...formData.roomDetails,
                              householdAgeMin: String(min),
                              householdAgeMax: String(max),
                            },
                          })}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{AGE_RANGE_MIN} años</span>
                          <span>{AGE_RANGE_MAX} años</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ambiente del piso</Label>
                        <Select
                          value={formData.roomDetails.homeEnvironment}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, homeEnvironment: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {homeEnvironmentOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>¿Vives tú en esta vivienda?</Label>
                        <Select
                          value={formData.roomDetails.householdContext}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: {
                              ...formData.roomDetails,
                              householdContext: value,
                              ownerLivesHere: value === 'lives_here' ? 'yes' : value ? 'no' : '',
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin especificar" />
                          </SelectTrigger>
                          <SelectContent>
                            {householdContextOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Si no vives aquí, rellena solo lo que sepas de la convivencia real de esa vivienda.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Espacio LGTBIQ+ friendly</Label>
                        <Select
                          value={formData.roomDetails.lgtbiqFriendly}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, lgtbiqFriendly: value as RoomListingDetailsForm['lgtbiqFriendly'] },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin especificar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Márcalo solo si las personas de la vivienda están alineadas con una convivencia respetuosa e inclusiva.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Personas viviendo actualmente</Label>
                      <span className="text-sm font-medium">
                        {householdCountValue === 1 ? '1 persona' : `${householdCountValue} personas`}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={HOUSEHOLD_COUNT_MAX}
                      step={1}
                      value={[householdCountValue]}
                      onValueChange={([value]) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, currentHouseholdCount: String(value) },
                      })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{HOUSEHOLD_COUNT_MAX}+</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Normas de convivencia</h3>
                      <p className="text-xs text-muted-foreground">Deja claras las reglas principales antes de que alguien contacte.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Política de visitas</Label>
                        <Select
                          value={formData.roomDetails.visitsPolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, visitsPolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {visitsPolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Fiestas</Label>
                        <Select
                          value={formData.roomDetails.partyPolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, partyPolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {partyPolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Permite fumar</Label>
                        <Select
                          value={nullableBooleanSelectValue(formData.smokingAllowed)}
                          onValueChange={(value) => setFormData({ ...formData, smokingAllowed: parseNullableBooleanSelectValue(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unspecified">Sin especificar</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Permite mascotas</Label>
                        <Select
                          value={nullableBooleanSelectValue(formData.petsAllowed)}
                          onValueChange={(value) => setFormData({ ...formData, petsAllowed: parseNullableBooleanSelectValue(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unspecified">Sin especificar</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Uso de zonas comunes</h3>
                      <p className="text-xs text-muted-foreground">Aclara cómo se usan cocina, salón y baño en el día a día.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Uso de cocina</Label>
                        <Select
                          value={formData.roomDetails.kitchenUsePolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, kitchenUsePolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {kitchenUsePolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Uso de salón</Label>
                        <Select
                          value={formData.roomDetails.livingRoomUsePolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, livingRoomUsePolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {livingRoomUsePolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Uso de baño</Label>
                        <Select
                          value={formData.roomDetails.bathroomUsePolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, bathroomUsePolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {bathroomUsePolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Perfil de convivencia</h3>
                      <p className="text-xs text-muted-foreground">Cuenta cómo se organizan la limpieza, el descanso y el uso diario de la casa.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Limpieza</Label>
                        <Select
                          value={formData.roomDetails.cleaningPolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, cleaningPolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {cleaningPolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Descanso y ruido</Label>
                        <Select
                          value={formData.roomDetails.quietHoursPolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, quietHoursPolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {quietHoursPolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Teletrabajo</Label>
                        <Select
                          value={formData.roomDetails.remoteWorkPolicy}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, remoteWorkPolicy: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {remoteWorkPolicyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h2 className="font-semibold">Fotos del anuncio</h2>
                  <p className="text-sm text-muted-foreground">
                    Añade imágenes claras para que otros usuarios entiendan mejor el espacio.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotosSelected}
                />
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || photoFiles.length >= 8}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Selecciona hasta 8 fotos JPG, PNG o WebP</p>
                  <p className="mt-1 text-xs text-muted-foreground">{photoFiles.length}/8 fotos seleccionadas</p>
                </button>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {previews.map(({ file, url }, index) => (
                      <div key={`${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                        <img src={url} alt={file.name} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                            Portada
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7"
                          onClick={() => removePhoto(index)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar anuncio
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}


