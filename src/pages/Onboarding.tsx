import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  Camera,
  Check,
  HeartHandshake,
  Home,
  Key,
  Languages,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PROFILE_INTEREST_CATEGORIES,
  PROFILE_INTEREST_TAG_LIMIT,
  encodeProfileInterestTags,
} from '@/lib/profileTraits';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { ImageCropperDialog } from '@/components/profile/ImageCropperDialog';
import {
  AUTONOMOUS_COMMUNITIES,
  LANGUAGE_OPTIONS,
  MAX_BIO_LENGTH,
  MAX_BUDGET,
  MAX_CITY_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_OCCUPATION_LENGTH,
  MIN_BIO_LENGTH,
  MIN_STAY_OPTIONS,
  PROVINCES,
  normalizeLanguage,
  todayIso,
} from '@/lib/profileOptions';

type BackendIntentionType = 'seek_room' | 'offer_room';
type GoalType = BackendIntentionType;
type MoveInPreference = 'asap' | 'weeks' | 'month' | 'specific' | 'flexible' | '';

type OnboardingData = {
  goal: GoalType | '';
  displayName: string;
  age: string;
  autonomousCommunity: string;
  province: string;
  city: string;
  budgetMin: string;
  budgetMax: string;
  moveInDate: string;
  moveInPreference: MoveInPreference;
  minStayMonths: string;
  cleaning: string;
  noise: string;
  schedule: string;
  visits: string;
  pets: string;
  smoking: string;
  cooking: string;
  social: string;
  remoteWork: string;
  languages: string[];
  occupation: string;
  inclusiveProfile: boolean;
  bio: string;
  photos: string[];
  interestTags: string[];
};

const PROFILE_PHOTO_LIMIT = 1;
const totalSteps = 5;

const goalOptions: Array<{
  value: GoalType;
  title: string;
  description: string;
  icon: typeof Home;
  backendType?: BackendIntentionType;
}> = [
  {
    value: 'seek_room',
    title: 'Busco habitación',
    description: 'Quiero alquilar una habitación en un piso compartido.',
    icon: Home,
    backendType: 'seek_room',
  },
  {
    value: 'offer_room',
    title: 'Ofrezco habitación',
    description: 'Tengo una habitación disponible para alquilar.',
    icon: Key,
    backendType: 'offer_room',
  },
];

const moveInPreferenceOptions = [
  { value: 'asap', label: 'Cuanto antes' },
  { value: 'weeks', label: 'Próximas semanas' },
  { value: 'month', label: 'Este mes' },
  { value: 'specific', label: 'Tengo fecha aproximada' },
  { value: 'flexible', label: 'Flexible' },
] as const;

const styleQuestions = [
  {
    key: 'cleaning',
    title: 'Limpieza',
    options: [
      { value: 'relaxed', label: 'Relajada' },
      { value: 'balanced', label: 'Normal' },
      { value: 'organized', label: 'Ordenada' },
    ],
  },
  {
    key: 'noise',
    title: 'Ruido',
    options: [
      { value: 'quiet', label: 'Silencioso' },
      { value: 'balanced', label: 'Normal' },
      { value: 'lively', label: 'Animado' },
    ],
  },
  {
    key: 'schedule',
    title: 'Horarios',
    options: [
      { value: 'early', label: 'Madrugador' },
      { value: 'regular', label: 'Regular' },
      { value: 'night', label: 'Nocturno' },
    ],
  },
  {
    key: 'visits',
    title: 'Visitas',
    options: [
      { value: 'rare', label: 'Pocas' },
      { value: 'planned', label: 'Avisando' },
      { value: 'frequent', label: 'Frecuentes' },
    ],
  },
  {
    key: 'pets',
    title: 'Mascotas',
    options: [
      { value: 'no', label: 'Prefiero sin' },
      { value: 'flexible', label: 'Me adapto' },
      { value: 'yes', label: 'Pet friendly' },
    ],
  },
  {
    key: 'smoking',
    title: 'Tabaco',
    options: [
      { value: 'no', label: 'No fumador' },
      { value: 'outside', label: 'Fumador solo exterior' },
      { value: 'inside', label: 'Flexible con fumadores' },
    ],
  },
  {
    key: 'cooking',
    title: 'Uso cocina',
    options: [
      { value: 'light', label: 'Cocina ligera' },
      { value: 'normal', label: 'Cocina habitual' },
      { value: 'often', label: 'Cocina intensiva' },
    ],
  },
  {
    key: 'social',
    title: 'Relación en casa',
    options: [
      { value: 'independent', label: 'A mi aire' },
      { value: 'balanced', label: 'Algo de vida común' },
      { value: 'social', label: 'Casa sociable' },
    ],
  },
  {
    key: 'remoteWork',
    title: 'Teletrabajo',
    options: [
      { value: 'no', label: 'No' },
      { value: 'some', label: 'Algunos días' },
      { value: 'often', label: 'Frecuente' },
    ],
  },
] as const;

const emptyData: OnboardingData = {
  goal: '',
  displayName: '',
  age: '',
  autonomousCommunity: '',
  province: '',
  city: '',
  budgetMin: '',
  budgetMax: '',
  moveInDate: '',
  moveInPreference: '',
  minStayMonths: '',
  cleaning: '',
  noise: '',
  schedule: '',
  visits: '',
  pets: '',
  smoking: '',
  cooking: '',
  social: '',
  remoteWork: '',
  languages: [],
  occupation: '',
  inclusiveProfile: false,
  bio: '',
  photos: [],
  interestTags: [],
};

const toNumberOrNull = (value: string) => (value.trim() ? Number(value) : null);

const Onboarding = () => {
  useSEO({ page: 'signup', noIndex: true });

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>(emptyData);

  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const metadataName =
        typeof session.user.user_metadata?.display_name === 'string'
          ? session.user.user_metadata.display_name
          : typeof session.user.user_metadata?.name === 'string'
            ? session.user.user_metadata.name
            : session.user.email?.split('@')[0] || '';

      setData((prev) => ({ ...prev, displayName: prev.displayName || metadataName }));
    };

    checkAuth();
  }, [navigate]);

  const automaticTags = useMemo(() => {
    const tags = [
      {
        relaxed: 'Limpieza flexible',
        balanced: 'Limpieza equilibrada',
        organized: 'Persona ordenada',
      }[data.cleaning],
      {
        quiet: 'Prefiere tranquilidad',
        balanced: 'Ambiente normal',
        lively: 'Tolera ambiente animado',
      }[data.noise],
      {
        early: 'Persona madrugadora',
        regular: 'Horario regular',
        night: 'Persona nocturna',
      }[data.schedule],
      {
        rare: 'Pocas visitas',
        planned: 'Visitas avisando',
        frequent: 'Visitas frecuentes',
      }[data.visits],
      {
        no: 'Prefiere sin mascotas',
        flexible: 'Flexible con mascotas',
        yes: 'Pet friendly',
      }[data.pets],
      {
        no: 'No fumador',
        outside: 'Fuma solo fuera',
        inside: 'Flexible con fumadores',
      }[data.smoking],
      {
        light: 'Cocina ligera',
        normal: 'Cocina habitual',
        often: 'Cocina frecuente',
      }[data.cooking],
      {
        independent: 'Va a su aire',
        balanced: 'Vida común equilibrada',
        social: 'Casa sociable',
      }[data.social],
      {
        no: 'Sin teletrabajo',
        some: 'Teletrabajo ocasional',
        often: 'Teletrabajo frecuente',
      }[data.remoteWork],
    ].filter((tag): tag is string => Boolean(tag));

    return Array.from(new Set(tags));
  }, [data.cleaning, data.cooking, data.noise, data.pets, data.remoteWork, data.schedule, data.smoking, data.social, data.visits]);
  const visibleAutomaticTags = automaticTags.slice(0, 6);

  const completionPercent = useMemo(() => {
    const fields = [
      data.displayName,
      data.age,
      data.autonomousCommunity,
      data.province,
      data.city,
      data.languages.length > 0 ? 'ok' : '',
      data.occupation,
      data.bio,
      data.photos.length > 0 ? 'ok' : '',
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [data]);

  const handleLanguageToggle = (languageId: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.includes(languageId)
        ? prev.languages.filter((language) => language !== languageId)
        : [...prev.languages, languageId],
    }));
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (data.photos.length >= PROFILE_PHOTO_LIMIT) {
      toast.error('Solo puedes tener una foto de perfil.');
      event.target.value = '';
      return;
    }

    setSelectedImage(URL.createObjectURL(file));
    setCropperOpen(true);
    event.target.value = '';
  };

  const handlePhotoCropComplete = async (croppedBlob: Blob) => {
    setUploadingPhoto(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) throw new Error('NOT_AUTHENTICATED');

      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setData((prev) => ({ ...prev, photos: [publicUrl] }));
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
    const age = Number(data.age);

    switch (step) {
      case 1:
        return (
          data.displayName.trim().length >= 2 &&
          data.displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH &&
          Number.isFinite(age) &&
          age >= 18 &&
          age <= 99 &&
          data.autonomousCommunity !== '' &&
          data.province !== '' &&
          data.city.trim().length >= 2 &&
          data.city.trim().length <= MAX_CITY_LENGTH
        );
      case 2:
        return true;
      case 3:
        return (
          data.languages.length > 0 &&
          data.occupation.trim().length <= MAX_OCCUPATION_LENGTH &&
          data.bio.trim().length >= MIN_BIO_LENGTH &&
          data.bio.trim().length <= MAX_BIO_LENGTH
        );
      default:
        return true;
    }
  };

  const getStepValidationMessage = () => {
    if (currentStep === 1) return 'Completa nombre, edad y ubicacion aproximada.';
    if (currentStep === 2) return 'Puedes completar o saltar el estilo de convivencia.';
    if (currentStep === 3) return 'Añade idiomas y una descripcion corta de al menos 20 caracteres.';

    switch (currentStep) {
      case 1:
        return 'Elige qué quieres hacer ahora.';
      case 2:
        return data.goal === 'offer_room'
          ? 'Completa nombre, edad, zona, precio y disponibilidad.'
          : 'Completa nombre, edad, zona, presupuesto y disponibilidad.';
      case 3:
        return 'Elige tu estilo de convivencia para crear tus primeras compatibilidades.';
      case 4:
        return 'Añade idiomas y una descripción corta de al menos 20 caracteres.';
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
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const toggleInterestTag = (tag: string) => {
    setData((prev) => {
      const selected = prev.interestTags.includes(tag);
      if (!selected && prev.interestTags.length >= PROFILE_INTEREST_TAG_LIMIT) {
        toast.info(`Has llegado al máximo de ${PROFILE_INTEREST_TAG_LIMIT} etiquetas.`);
        return prev;
      }
      return {
        ...prev,
        interestTags: selected
          ? prev.interestTags.filter((item) => item !== tag)
          : [...prev.interestTags, tag],
      };
    });
  };

  const baseLifestyleTags = [
    ...automaticTags.map((tag) => `auto_${tag.toLowerCase().replace(/\s+/g, '_')}`),
    data.age ? `profile_age_${data.age}` : null,
    data.inclusiveProfile ? 'inclusive_lgtbiq_friendly' : null,
  ].filter((tag): tag is string => Boolean(tag));

  const lifestyleTags = encodeProfileInterestTags(baseLifestyleTags, data.interestTags);

  const getCreateListingPath = (listingType: BackendIntentionType) => `/create-listing?type=${listingType}`;

  const handleComplete = async (destination: 'discover' | 'offer_room' | 'seek_room') => {
    const selectedBackend: BackendIntentionType | null =
      destination === 'offer_room' || destination === 'seek_room' ? destination : null;
    const invalidStep = Array.from({ length: totalSteps - 1 }, (_, index) => index + 1)
      .find((step) => !canProceed(step));

    if (invalidStep) {
      setCurrentStep(invalidStep);
      toast.error(getStepValidationMessage());
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const cleanLanguages = data.languages.map(normalizeLanguage);
      const budgetMin = toNumberOrNull(data.budgetMin);
      const budgetMax = toNumberOrNull(data.budgetMax);
      const minStayMonths = data.minStayMonths ? Number(data.minStayMonths) : null;
      const profileUserType = selectedBackend === 'seek_room'
        ? 'seeking_room'
        : selectedBackend === 'offer_room'
          ? 'offering_room'
          : undefined;

      const { error: convinterError } = await supabase
        .from('convinter_profiles')
        .upsert({
          user_id: session.user.id,
          display_name: data.displayName.trim(),
          bio: data.bio.trim() || null,
          city: data.city.trim() || null,
          province_code: data.province || null,
          languages: cleanLanguages,
          photo_url: data.photos[0] || null,
        });

      if (convinterError) throw convinterError;

      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: data.displayName.trim(),
          bio: data.bio.trim() || null,
          autonomous_community: data.autonomousCommunity || null,
          province: data.province || null,
          city: data.city.trim() || null,
          budget_min: budgetMin,
          budget_max: budgetMax,
          move_in_date: data.moveInDate || null,
          min_stay_months: minStayMonths,
          occupation: data.occupation.trim() || null,
          languages: cleanLanguages,
          photos: data.photos,
          lifestyle_tags: lifestyleTags,
          user_type: profileUserType,
          onboarding_completed: true,
        });

      if (profilesError) {
        console.warn('Error updating base profile:', profilesError);
      }

      if (selectedBackend) {
        const { data: intentionResult, error: intentionError } = await supabase.rpc('convinter_set_intention', {
          p_intention_type: selectedBackend,
          p_is_primary: true,
          p_urgency: data.moveInPreference === 'asap' ? 'urgent' : 'flexible',
          p_details: {
            selected_goal: selectedBackend,
            age: Number(data.age),
            city: data.city.trim() || null,
            province: data.province || null,
            budget_min: budgetMin,
            budget_max: budgetMax,
            move_in_date: data.moveInDate || null,
            move_in_preference: data.moveInPreference || null,
            min_stay_months: minStayMonths,
            compatibility_style: {
              cleaning: data.cleaning,
              noise: data.noise,
              schedule: data.schedule,
              visits: data.visits,
              pets: data.pets,
              smoking: data.smoking,
              cooking: data.cooking,
              social: data.social,
              remote_work: data.remoteWork,
            },
            automatic_tags: automaticTags,
            inclusive_profile: data.inclusiveProfile,
          },
        });

        const parsedResult = intentionResult as unknown as { ok?: boolean; code?: string } | null;
        if (intentionError || parsedResult?.ok === false) {
          console.warn('Error saving intention:', intentionError || parsedResult?.code);
          toast.warning('Perfil guardado, pero no se pudo sincronizar la intención.');
        }
      }

      toast.success('Perfil actualizado.');

      if (selectedBackend) {
        navigate(getCreateListingPath(selectedBackend));
      } else {
        navigate('/discover');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('No se pudo guardar el perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGoalStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">¿Qué quieres hacer en Convinter?</h2>
        <p className="mt-2 text-muted-foreground">Elige una opción. Podrás cambiarla más adelante.</p>
      </div>

      <div className="grid gap-3">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const selected = data.goal === goal.value;

          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, goal: goal.value }))}
              className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="rounded-full bg-muted p-3 text-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-foreground">{goal.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{goal.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderBasicStep = () => {
    const isOfferRoom = data.goal === 'offer_room';
    const showListingFields = false;

    return (
      <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Datos básicos</h2>
        <p className="mt-2 text-muted-foreground">Lo justo para buscar coincidencias útiles sin pedir documentación.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre visible</Label>
          <Input
            value={data.displayName}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(event) => setData((prev) => ({ ...prev, displayName: event.target.value }))}
            placeholder="Ej: Lucía"
          />
        </div>
        <div className="space-y-2">
          <Label>Edad</Label>
          <Input
            type="number"
            min={18}
            max={99}
            value={data.age}
            onChange={(event) => setData((prev) => ({ ...prev, age: event.target.value }))}
            placeholder="Ej: 29"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {isOfferRoom
            ? 'Ubicación de la habitación'
            : data.goal === 'seek_room'
              ? 'Zona donde buscas'
              : 'Ubicación'}
        </Label>
        <Select
          value={data.autonomousCommunity}
          onValueChange={(value) => setData((prev) => ({ ...prev, autonomousCommunity: value, province: '' }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Comunidad autónoma" />
          </SelectTrigger>
          <SelectContent>
            {AUTONOMOUS_COMMUNITIES.map((community) => (
              <SelectItem key={community} value={community}>
                {community}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provincia</Label>
            <Select
              value={data.province}
              onValueChange={(value) => setData((prev) => ({ ...prev, province: value }))}
              disabled={!data.autonomousCommunity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Provincia" />
              </SelectTrigger>
              <SelectContent>
                {(PROVINCES[data.autonomousCommunity] || []).map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Municipio o ciudad</Label>
            <Input
              value={data.city}
              maxLength={MAX_CITY_LENGTH}
              onChange={(event) => setData((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Ej: Madrid, Móstoles, Pinto, Cullera, Telde, Santa Lucía de Tirajana..."
            />
          </div>
        </div>
      </div>

      {showListingFields && (isOfferRoom ? (
        <div className="space-y-2">
          <Label>Precio mensual de la habitación</Label>
          <Input
            type="number"
            min={1}
            max={MAX_BUDGET}
            value={data.budgetMin}
            onChange={(event) => {
              const value = event.target.value;
              setData((prev) => ({ ...prev, budgetMin: value, budgetMax: value }));
            }}
            placeholder="Ej: 650"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {data.goal === 'seek_room'
                ? 'Presupuesto mínimo para habitación'
                : 'Presupuesto mínimo'}
            </Label>
            <Input
              type="number"
              min={1}
              max={MAX_BUDGET}
              value={data.budgetMin}
              onChange={(event) => setData((prev) => ({ ...prev, budgetMin: event.target.value }))}
              placeholder="Ej: 450"
            />
          </div>
          <div className="space-y-2">
            <Label>
              {data.goal === 'seek_room'
                ? 'Presupuesto máximo para habitación'
                : 'Presupuesto máximo'}
            </Label>
            <Input
              type="number"
              min={1}
              max={MAX_BUDGET}
              value={data.budgetMax}
              onChange={(event) => setData((prev) => ({ ...prev, budgetMax: event.target.value }))}
              placeholder="Ej: 850"
            />
          </div>
        </div>
      ))}

      {showListingFields && (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isOfferRoom
              ? 'Disponibilidad de la habitación'
              : data.goal === 'seek_room'
                ? 'Entrada deseada'
                : 'Fecha de entrada'}
          </Label>
          <Select
            value={data.moveInPreference}
            onValueChange={(value) => setData((prev) => ({
              ...prev,
              moveInPreference: value as MoveInPreference,
              moveInDate: value === 'specific' ? prev.moveInDate : '',
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Disponibilidad" />
            </SelectTrigger>
            <SelectContent>
              {moveInPreferenceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {data.moveInPreference === 'specific' && (
            <Input
              type="date"
              min={todayIso()}
              value={data.moveInDate}
              onChange={(event) => setData((prev) => ({ ...prev, moveInDate: event.target.value }))}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>{isOfferRoom ? 'Estancia mínima' : 'Duración prevista'}</Label>
          <Select
            value={data.minStayMonths}
            onValueChange={(value) => setData((prev) => ({ ...prev, minStayMonths: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona duración" />
            </SelectTrigger>
            <SelectContent>
              {MIN_STAY_OPTIONS.map((months) => (
                <SelectItem key={months} value={months.toString()}>
                  {months} {months === 1 ? 'mes' : 'meses'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      )}
      </div>
    );
  };

  const renderStyleStep = () => (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Estilo de convivencia</h2>
        <p className="mt-2 text-muted-foreground">
          Opcional. Si vas a convivir, estos datos ayudan a calcular compatibilidad. Si solo gestionas una vivienda o no vas a vivir alli, puedes dejarlos sin responder.
        </p>
      </div>

      <div className="grid gap-4">
        {styleQuestions.map((question) => (
          <div key={question.key} className="space-y-2">
            <Label>{question.title}</Label>
            <div className="grid grid-cols-3 gap-2">
              {question.options.map((option) => {
                const selected = data[question.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, [question.key]: option.value }))}
                    className={`min-h-12 rounded-xl border px-2 text-sm font-medium transition-all ${
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPublicProfileStep = () => (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Perfil público</h2>
        <p className="mt-2 text-muted-foreground">Esto ayuda a que otros perfiles sepan quién hay detrás.</p>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Idiomas
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((language) => (
            <label
              key={language.id}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-all ${
                data.languages.includes(language.id) ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Checkbox
                checked={data.languages.includes(language.id)}
                onCheckedChange={() => handleLanguageToggle(language.id)}
              />
              <span className="text-sm">{language.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Ocupación o situación
        </Label>
        <Input
          value={data.occupation}
          maxLength={MAX_OCCUPATION_LENGTH}
          onChange={(event) => setData((prev) => ({ ...prev, occupation: event.target.value }))}
          placeholder="Ej: Estudiante, Diseñadora UX, Enfermero..."
        />
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
          data.inclusiveProfile ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
        }`}
      >
        <Checkbox
          checked={data.inclusiveProfile}
          onCheckedChange={(checked) => setData((prev) => ({ ...prev, inclusiveProfile: Boolean(checked) }))}
          className="mt-0.5"
        />
        <span>
          <span className="flex items-center gap-2 font-medium">
            <HeartHandshake className="h-4 w-4" />
            LGTBIQ+ friendly
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Mostrar que valoras una convivencia respetuosa e inclusiva.
          </span>
        </span>
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Foto de perfil</Label>
          <span className="text-xs text-muted-foreground">{data.photos.length}/{PROFILE_PHOTO_LIMIT}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.photos.map((photo, index) => (
            <div key={photo} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
              <img src={photo} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-2 top-2 rounded-full bg-background/85 p-1 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="bio">Descripción corta</Label>
          <span className="text-xs text-muted-foreground">{data.bio.trim().length}/{MAX_BIO_LENGTH}</span>
        </div>
        <Textarea
          id="bio"
          rows={5}
          maxLength={MAX_BIO_LENGTH}
          value={data.bio}
          onChange={(event) => setData((prev) => ({ ...prev, bio: event.target.value }))}
          placeholder="Cuenta brevemente cómo eres conviviendo y qué valoras en casa."
        />
        <p className="text-xs text-muted-foreground">Mínimo {MIN_BIO_LENGTH} caracteres.</p>
      </div>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Perfil completado al {completionPercent}%</h2>
        <p className="mt-2 text-muted-foreground">
          Ya tenemos una base para recomendarte perfiles compatibles. Puedes mejorar la precisión con el test avanzado.
        </p>
      </div>

      {visibleAutomaticTags.length > 0 && (
        <div className="rounded-xl border border-border/70 p-4 text-left">
          <p className="mb-3 text-sm font-medium text-foreground">Resumen de convivencia</p>
          <div className="flex flex-wrap gap-2">
            {visibleAutomaticTags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <Button variant="hero" onClick={() => handleComplete('discover')} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Conoce personas afines
        </Button>
        <Button variant="outline" onClick={() => handleComplete('offer_room')} disabled={isLoading}>
          <Key className="mr-2 h-4 w-4" />
          Ofrezco habitación
        </Button>
        <Button variant="outline" onClick={() => handleComplete('seek_room')} disabled={isLoading}>
          <Home className="mr-2 h-4 w-4" />
          Busco habitación
        </Button>
      </div>

      <div className="hidden">
        <Button variant="hero" onClick={() => handleComplete('discover')} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Hacer test ahora
        </Button>
        {data.goal === 'offer_room' && (
          <Button variant="outline" onClick={() => handleComplete('offer_room')} disabled={isLoading}>
            Crear anuncio
          </Button>
        )}
        <Button variant="outline" onClick={() => handleComplete('discover')} disabled={isLoading}>
          Completar más tarde
        </Button>
      </div>
    </div>
  );

  const renderInterestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Rasgos e intereses</h2>
        <p className="mt-2 text-muted-foreground">
          Elige hasta {PROFILE_INTEREST_TAG_LIMIT} detalles que ayuden a otras personas a conocerte mejor: personalidad, planes, música o estilo de vida. Es opcional.
        </p>
      </div>

      <div className="sticky top-20 z-10 rounded-xl border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">
            {data.interestTags.length}/{PROFILE_INTEREST_TAG_LIMIT} seleccionados
          </span>
          <span className="text-muted-foreground">
            {PROFILE_INTEREST_TAG_LIMIT - data.interestTags.length > 0
              ? `Te quedan ${PROFILE_INTEREST_TAG_LIMIT - data.interestTags.length}`
              : 'Límite alcanzado'}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (data.interestTags.length / PROFILE_INTEREST_TAG_LIMIT) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {PROFILE_INTEREST_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-3 rounded-xl border border-border/60 p-4">
            <div>
              <Label className="text-sm font-semibold">{category.title}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{category.helper}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.options.map((option) => {
                const selected = data.interestTags.includes(option);
                const disabled = !selected && data.interestTags.length >= PROFILE_INTEREST_TAG_LIMIT;
                return (
                  <Badge
                    key={option}
                    variant={selected ? 'default' : 'outline'}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                    onClick={() => {
                      if (!disabled) toggleInterestTag(option);
                    }}
                  >
                    {option}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderGoalStep();
      case 1:
        return renderBasicStep();
      case 2:
        return renderStyleStep();
      case 3:
        return renderPublicProfileStep();
      case 4:
        return renderInterestStep();
      case 5:
        return renderProgressStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Paso {currentStep} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {currentStep < totalSteps && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-3">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
            <Button variant="hero" onClick={handleNext} className="flex-1">
              {currentStep === totalSteps - 1 ? 'Ver progreso' : 'Siguiente'}
              {currentStep === totalSteps - 1 ? <Check className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

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
