import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Key, Users, MapPin, Calendar, Languages, Briefcase, ArrowLeft, ArrowRight, Check, Camera, X, Loader2, Sparkles, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { ImageCropperDialog } from '@/components/profile/ImageCropperDialog';

type IntentionType = 'seek_room' | 'offer_room' | 'seek_flatmate';
type MoveInPreference = 'asap' | 'weeks' | 'month' | 'specific' | 'flexible' | '';

interface OnboardingData {
  intentions: IntentionType[];
  primaryIntention: IntentionType | null;
  autonomousCommunity: string;
  province: string;
  city: string;
  moveInDate: string;
  moveInPreference: MoveInPreference;
  languages: string[];
  occupation: string;
  inclusiveProfile: boolean;
  bio: string;
  photos: string[];
  urgency: 'urgent' | 'soon' | 'flexible' | 'exploring';
  homeVibe: string;
}

const AUTONOMOUS_COMMUNITIES = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
  'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 'Ceuta', 'Extremadura',
  'Galicia', 'La Rioja', 'Madrid', 'Melilla', 'Murcia', 'Navarra', 'País Vasco', 'Valencia'
];

const PROVINCES: Record<string, string[]> = {
  'Andalucía': ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'],
  'Aragón': ['Huesca', 'Teruel', 'Zaragoza'],
  'Asturias': ['Asturias'],
  'Baleares': ['Baleares'],
  'Canarias': ['Las Palmas', 'Santa Cruz de Tenerife'],
  'Cantabria': ['Cantabria'],
  'Castilla-La Mancha': ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'],
  'Castilla y León': ['Ávila', 'Burgos', 'León', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora'],
  'Cataluña': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
  'Ceuta': ['Ceuta'],
  'Extremadura': ['Badajoz', 'Cáceres'],
  'Galicia': ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra'],
  'La Rioja': ['La Rioja'],
  'Madrid': ['Madrid'],
  'Melilla': ['Melilla'],
  'Murcia': ['Murcia'],
  'Navarra': ['Navarra'],
  'País Vasco': ['Álava', 'Guipúzcoa', 'Vizcaya'],
  'Valencia': ['Alicante', 'Castellón', 'Valencia']
};

const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Português' },
  { id: 'zh', label: '中文' },
  { id: 'ar', label: 'العربية' },
];

const MAX_CITY_LENGTH = 80;
const MAX_OCCUPATION_LENGTH = 100;
const MIN_BIO_LENGTH = 20;
const MAX_BIO_LENGTH = 500;
const PROFILE_PHOTO_LIMIT = 1;
const todayIso = () => new Date().toISOString().split('T')[0];

const homeVibeOptions = [
  { value: 'quiet', label: 'Tranquilo/a', description: 'Valoro descanso, calma y rutinas claras.' },
  { value: 'social', label: 'Sociable', description: 'Me gusta conversar y hacer algo de vida común.' },
  { value: 'independent', label: 'Independiente', description: 'Comparto casa, pero necesito mi espacio.' },
  { value: 'mixed', label: 'Equilibrado/a', description: 'Depende del día: puedo socializar o ir a mi aire.' },
];

const moveInPreferenceOptions = [
  { value: 'asap', label: 'Quiero avanzar cuanto antes' },
  { value: 'weeks', label: 'En las próximas semanas' },
  { value: 'month', label: 'Durante este mes' },
  { value: 'specific', label: 'Tengo una fecha aproximada' },
  { value: 'flexible', label: 'Estoy explorando / flexible' },
] as const;

const Onboarding = () => {
  useSEO({ page: 'signup', noIndex: true });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    intentions: [],
    primaryIntention: null,
    autonomousCommunity: '',
    province: '',
    city: '',
    moveInDate: '',
    moveInPreference: '',
    languages: [],
    occupation: '',
    inclusiveProfile: false,
    bio: '',
    photos: [],
    urgency: 'flexible',
    homeVibe: '',
  });

  const hasOfferRoomIntention = data.intentions.includes('offer_room');
  const hasSeekerIntention = data.intentions.some((intention) => intention !== 'offer_room');
  const isOfferRoomFlow = data.primaryIntention === 'offer_room';
  const isOfferRoomOnlyFlow = isOfferRoomFlow && !hasSeekerIntention;
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleIntentionToggle = (type: IntentionType) => {
    setData(prev => {
      const isSelected = prev.intentions.includes(type);
      const newIntentions = isSelected
        ? prev.intentions.filter(t => t !== type)
        : [...prev.intentions, type];
      
      // Si deseleccionamos la intención primaria, asignar otra como primaria
      let newPrimaryIntention = prev.primaryIntention;
      if (isSelected && prev.primaryIntention === type) {
        newPrimaryIntention = newIntentions[0] || null;
      }
      // Si es la primera intención, hacerla primaria automáticamente
      else if (!prev.primaryIntention && newIntentions.length === 1) {
        newPrimaryIntention = newIntentions[0];
      }
      
      return {
        ...prev,
        intentions: newIntentions,
        primaryIntention: newPrimaryIntention
      };
    });
  };

  const handlePrimaryIntentionSelect = (type: IntentionType) => {
    setData(prev => ({ ...prev, primaryIntention: type }));
  };

  const handleLanguageToggle = (langId: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter(l => l !== langId)
        : [...prev.languages, langId]
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (data.photos.length >= PROFILE_PHOTO_LIMIT) {
      toast.error('Solo puedes tener una foto de perfil.');
      e.target.value = '';
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);
    e.target.value = '';
  };

  const handlePhotoCropComplete = async (croppedBlob: Blob) => {
    setUploadingPhoto(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('NOT_AUTHENTICATED');
      }

      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setData((prev) => ({
        ...prev,
        photos: [publicUrl],
      }));

      toast.success('Foto añadida al perfil.');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('No se pudo subir la foto del perfil.');
    } finally {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const canProceed = (step = currentStep) => {
    switch (step) {
      case 1:
        return (
          data.languages.length > 0 &&
          data.occupation.trim().length <= MAX_OCCUPATION_LENGTH &&
          data.bio.trim().length >= MIN_BIO_LENGTH &&
          data.bio.trim().length <= MAX_BIO_LENGTH
        );
      case 2:
        return Boolean(data.homeVibe);
      case 3:
        {
          const dateIsValid = data.moveInPreference !== 'specific' || Boolean(data.moveInDate && data.moveInDate >= todayIso());

          return data.autonomousCommunity !== '' &&
            data.province !== '' &&
            data.city.trim().length >= 2 &&
            data.city.trim().length <= MAX_CITY_LENGTH &&
            data.moveInPreference !== '' &&
            dateIsValid;
        }
      case 4:
        return data.intentions.length > 0 && data.primaryIntention !== null;
      default:
        return true;
    }
  };

  const getStepValidationMessage = (step = currentStep) => {
    switch (step) {
      case 1:
        return 'Selecciona al menos un idioma, revisa la ocupación y completa "Sobre ti" con al menos 20 caracteres.';
      case 2:
        return 'Elige la energía que mejor describe cómo eres en casa.';
      case 3:
        return 'Completa ubicación, zonas de interés y momento actual.';
      case 4:
        return 'Selecciona al menos una intención y marca una como principal.';
      default:
        return 'Revisa los datos antes de continuar.';
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error(getStepValidationMessage());
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const lifestyleTags = [
    data.homeVibe ? `onboarding_home_${data.homeVibe}` : null,
    data.inclusiveProfile ? 'inclusive_lgtbiq_friendly' : null,
  ].filter((tag): tag is string => Boolean(tag));

  const handleComplete = async (
    goToTest: boolean,
    offerDestination?: 'discover' | 'create-listing' | 'profile'
  ) => {
    const invalidStep = Array.from({ length: totalSteps }, (_, index) => index + 1)
      .find(step => !canProceed(step));

    if (invalidStep) {
      setCurrentStep(invalidStep);
      toast.error(getStepValidationMessage(invalidStep));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.auth'));
        return;
      }

      const displayName =
        typeof session.user.user_metadata?.display_name === 'string'
          ? session.user.user_metadata.display_name
          : typeof session.user.user_metadata?.name === 'string'
            ? session.user.user_metadata.name
            : session.user.email?.split('@')[0] || null;

      // 1. Actualizar perfil básico (convinter_profiles o profiles según tu esquema)
      const { error: profileError } = await supabase
        .from('convinter_profiles')
        .upsert({
          user_id: session.user.id,
          display_name: displayName,
          bio: data.bio.trim() || null,
          city: data.city || null,
          province_code: data.province || null,
          languages: data.languages,
          photo_url: data.photos[0] || null,
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // 2. También actualizar la tabla profiles con datos adicionales
      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: displayName,
          bio: data.bio.trim() || null,
          autonomous_community: data.autonomousCommunity || null,
          province: data.province || null,
          city: data.city || null,
          move_in_date: data.moveInDate || null,
          occupation: data.occupation || null,
          languages: data.languages,
          photos: data.photos,
          lifestyle_tags: lifestyleTags,
          // Mapear intención primaria a user_type
          user_type: data.primaryIntention === 'seek_room' ? 'seeking_room' 
            : data.primaryIntention === 'offer_room' ? 'offering_room'
            : data.primaryIntention === 'seek_flatmate' ? 'seeking_roommate'
            : null,
          onboarding_completed: true,
        });

      if (profilesError) {
        console.error('Error updating profiles:', profilesError);
        // No lanzar error, continuar con el flujo
      }

      // 3. Guardar intenciones activas en el backend de Convinter
      for (const [index, intention] of data.intentions.entries()) {
        const { data: intentionResult, error: intentionError } = await supabase.rpc('convinter_set_intention', {
          p_intention_type: intention,
          p_is_primary: data.primaryIntention === intention,
          p_urgency: data.urgency,
          p_details: {
            move_in_date: data.moveInDate || null,
            move_in_preference: data.moveInPreference || null,
            city: data.city || null,
            province: data.province || null,
            home_vibe: data.homeVibe || null,
            inclusive_profile: data.inclusiveProfile,
            priority: index + 1,
          },
        });

        const parsedResult = intentionResult as unknown as { ok?: boolean; code?: string } | null;
        if (intentionError || parsedResult?.ok === false) {
          console.error('Error saving intention:', intentionError || parsedResult?.code);
          toast.warning('Perfil guardado, pero no se pudieron sincronizar todas las intenciones.');
        }
      }

      toast.success(t('onboarding.success'));
      if (isOfferRoomOnlyFlow) {
        if (offerDestination === 'profile') {
          navigate('/profile');
        } else if (offerDestination === 'create-listing') {
          navigate('/create-listing');
        } else {
          navigate('/discover');
        }
      } else {
        navigate(goToTest ? '/test' : '/discover');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Crea tu perfil personal</h2>
              <p className="text-muted-foreground">Empieza por quién eres. La confianza llega antes que el anuncio.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Languages className="h-4 w-4" />
                  Idiomas que hablas
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(lang => (
                    <label
                      key={lang.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        data.languages.includes(lang.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={data.languages.includes(lang.id)}
                        onCheckedChange={() => handleLanguageToggle(lang.id)}
                      />
                      <span>{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4" />
                  Ocupación o situación
                </Label>
                <Input
                  placeholder="Ej: Estudiante, Diseñadora UX, Enfermero..."
                  value={data.occupation}
                  maxLength={MAX_OCCUPATION_LENGTH}
                  onChange={(e) => setData(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>

              <div>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    data.inclusiveProfile ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={data.inclusiveProfile}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, inclusiveProfile: Boolean(checked) }))}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium">
                      <HeartHandshake className="h-4 w-4" />
                      LGTBIQ+ friendly
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Mostrar en mi perfil que valoro un entorno respetuoso e inclusivo.
                    </span>
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Fotos del perfil</Label>
                  <span className="text-xs text-muted-foreground">
                    {data.photos.length}/{PROFILE_PHOTO_LIMIT}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {data.photos.map((photo, index) => (
                    <div key={photo} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-2 top-2 rounded-full bg-background/85 p-1 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-1 text-xs">
                          Portada
                        </span>
                      )}
                    </div>
                  ))}

                  {data.photos.length < PROFILE_PHOTO_LIMIT && (
                    <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary">
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handlePhotoSelect}
                        disabled={uploadingPhoto}
                      />
                      {uploadingPhoto ? (
                        <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Camera className="mb-2 h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">Hacer selfie o subir foto</span>
                    </label>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Una foto clara es suficiente para generar confianza. En móvil podrás hacer una selfie.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label htmlFor="bio">Sobre ti</Label>
                  <span className="text-xs text-muted-foreground">
                    {data.bio.trim().length}/{MAX_BIO_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="bio"
                  rows={5}
                  maxLength={MAX_BIO_LENGTH}
                  placeholder="Cuenta brevemente cómo eres conviviendo, qué valoras en casa y qué te ayuda a sentirte cómodo/a."
                  value={data.bio}
                  onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Mínimo {MIN_BIO_LENGTH} caracteres.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Cómo convives</h2>
              <p className="text-muted-foreground">Unas señales rápidas ayudan más que una ficha fría.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  ¿Qué energía tienes en casa?
                </Label>
                <div className="grid gap-3">
                  {homeVibeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setData(prev => ({ ...prev, homeVibe: option.value }))}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        data.homeVibe === option.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">El test se encarga del detalle.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Limpieza, horarios, visitas, ruido y tabaco se preguntan en el test para calcular compatibilidad sin repetirte preguntas en el perfil.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Zona y momento</h2>
              <p className="text-muted-foreground">Dinos qué zona te interesa y en qué momento estás. Puedes ajustarlo después.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Comunidad autónoma
                </Label>
                <Select
                  value={data.autonomousCommunity}
                  onValueChange={(value) => setData(prev => ({ ...prev, autonomousCommunity: value, province: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comunidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTONOMOUS_COMMUNITIES.map(community => (
                      <SelectItem key={community} value={community}>{community}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.autonomousCommunity && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Label className="mb-2 block">Provincia</Label>
                  <Select
                    value={data.province}
                    onValueChange={(value) => setData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES[data.autonomousCommunity]?.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              <div>
                <Label className="mb-2 block">Ciudad o zonas preferidas</Label>
                <Input
                  placeholder="Ej: Malasaña, Chamberí, Lavapiés..."
                  value={data.city}
                  maxLength={MAX_CITY_LENGTH}
                  onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Momento actual
                </Label>
                <Select
                  value={data.moveInPreference}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    moveInPreference: value as MoveInPreference,
                    moveInDate: value === 'specific' ? prev.moveInDate : '',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {moveInPreferenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.moveInPreference === 'specific' && (
                <Input
                  type="date"
                  min={todayIso()}
                  value={data.moveInDate}
                  onChange={(e) => setData(prev => ({ ...prev, moveInDate: e.target.value }))}
                />
              )}

            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">¿Qué quieres hacer ahora?</h2>
              <p className="text-muted-foreground">Puedes seleccionar varias opciones y marcar una como principal.</p>
            </div>
            <div className="grid gap-4">
              {[
                { type: 'seek_room' as IntentionType, icon: Home, label: t('onboarding.step1.seekingRoom'), desc: t('onboarding.step1.seekingRoomDesc') },
                { type: 'offer_room' as IntentionType, icon: Key, label: t('onboarding.step1.offeringRoom'), desc: t('onboarding.step1.offeringRoomDesc') },
                { type: 'seek_flatmate' as IntentionType, icon: Users, label: t('onboarding.step1.seekingRoommate'), desc: t('onboarding.step1.seekingRoommateDesc') },
              ].map(({ type, icon: Icon, label, desc }) => {
                const isSelected = data.intentions.includes(type);
                const isPrimary = data.primaryIntention === type;

                return (
                  <button
                    key={type}
                    onClick={() => handleIntentionToggle(type)}
                    className={`flex flex-col gap-3 p-5 rounded-xl border-2 transition-all text-left relative ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full flex-shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium">{label}</span>
                          {isSelected && <Check className="h-5 w-5 text-primary" />}
                          {isPrimary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                              {t('common.primary')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>

                    {isSelected && !isPrimary && data.intentions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrimaryIntentionSelect(type);
                        }}
                        className="text-xs text-primary hover:underline self-start ml-16"
                      >
                        {t('onboarding.step1.makePrimary')}
                      </button>
                    )}
                  </button>
                );
              })}

              {hasOfferRoomIntention && hasSeekerIntention && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Puedes combinar estas opciones.</p>
                  <p className="mt-1">
                    Guardaremos todas tus intenciones en el perfil, pero cada anuncio se publicará por separado: una habitación disponible o una búsqueda para alquilar juntos.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {t('onboarding.step')} {currentStep} {t('onboarding.of')} {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('onboarding.back')}
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
              {t('onboarding.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleComplete(false, isOfferRoomOnlyFlow ? 'discover' : undefined)}
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                  {isOfferRoomOnlyFlow ? 'Ver personas' : t('onboarding.skipTest')}
              </Button>
              <Button
                onClick={() => handleComplete(true, isOfferRoomOnlyFlow ? 'create-listing' : undefined)}
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                {isOfferRoomOnlyFlow ? 'Crear anuncio ahora' : t('onboarding.doTest')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImage || ''}
        onCropComplete={handlePhotoCropComplete}
      />
    </div>
  );
};

export default Onboarding;
