import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, HeartHandshake, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ImageCropperDialog } from './ImageCropperDialog';
import {
  AUTONOMOUS_COMMUNITIES,
  PROVINCES,
  LANGUAGE_OPTIONS,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MIN_BIO_LENGTH,
  MAX_CITY_LENGTH,
  MAX_PROVINCE_LENGTH,
  MAX_OCCUPATION_LENGTH,
  MAX_BUDGET,
  MIN_STAY_OPTIONS,
  normalizeLanguage,
  todayIso,
} from '@/lib/profileOptions';
import {
  PROFILE_INTEREST_CATEGORIES,
  PROFILE_INTEREST_TAG_LIMIT,
  decodeLivingTraits,
  decodeOfferDetails,
  decodeSeekRoomDetails,
  decodeProfileInterestTags,
  encodeLivingTraits,
  encodeOfferDetails,
  encodeProfileInterestTags,
  encodeSeekRoomDetails,
  HOUSEHOLD_SIZE_OPTIONS,
  OCCUPANCY_POLICY_OPTIONS,
  PROPERTY_CONTEXT_OPTIONS,
  SEEK_ROOM_GOAL_OPTIONS,
  YES_NO_OPTIONS,
} from '@/lib/profileTraits';

const PROFILE_PRIMARY_PHOTO_LIMIT = 1;
const INCLUSIVE_PROFILE_TAG = 'inclusive_lgtbiq_friendly';
const PRONOUNS_PREFIX = 'pronouns_';
const AUTO_TAG_PREFIX = 'auto_';

const styleQuestions = [
  {
    key: 'style_cleaning',
    title: 'Limpieza',
    options: [
      { value: 'relaxed', label: 'Relajada', tag: 'Limpieza flexible' },
      { value: 'balanced', label: 'Normal', tag: 'Limpieza equilibrada' },
      { value: 'organized', label: 'Ordenada', tag: 'Persona ordenada' },
    ],
  },
  {
    key: 'style_noise',
    title: 'Ruido',
    options: [
      { value: 'quiet', label: 'Silencioso', tag: 'Prefiere tranquilidad' },
      { value: 'balanced', label: 'Normal', tag: 'Ambiente normal' },
      { value: 'lively', label: 'Animado', tag: 'Tolera ambiente animado' },
    ],
  },
  {
    key: 'style_schedule',
    title: 'Horarios',
    options: [
      { value: 'early', label: 'Madrugador', tag: 'Persona madrugadora' },
      { value: 'regular', label: 'Regular', tag: 'Horario regular' },
      { value: 'night', label: 'Nocturno', tag: 'Persona nocturna' },
    ],
  },
  {
    key: 'style_visits',
    title: 'Visitas',
    options: [
      { value: 'rare', label: 'Pocas', tag: 'Pocas visitas' },
      { value: 'planned', label: 'Avisando', tag: 'Visitas avisando' },
      { value: 'frequent', label: 'Frecuentes', tag: 'Visitas frecuentes' },
    ],
  },
  {
    key: 'style_pets',
    title: 'Mascotas',
    options: [
      { value: 'no', label: 'Prefiero sin', tag: 'Prefiere sin mascotas' },
      { value: 'flexible', label: 'Me adapto', tag: 'Flexible con mascotas' },
      { value: 'yes', label: 'Pet friendly', tag: 'Pet friendly' },
    ],
  },
  {
    key: 'style_smoking',
    title: 'Tabaco',
    options: [
      { value: 'no', label: 'No fumador', tag: 'No fumador' },
      { value: 'outside', label: 'Fumador solo exterior', tag: 'Fuma solo fuera' },
      { value: 'inside', label: 'Flexible con fumadores', tag: 'Flexible con fumadores' },
    ],
  },
  {
    key: 'style_cooking',
    title: 'Uso cocina',
    options: [
      { value: 'light', label: 'Cocina ligera', tag: 'Cocina ligera' },
      { value: 'normal', label: 'Cocina habitual', tag: 'Cocina habitual' },
      { value: 'often', label: 'Cocina intensiva', tag: 'Cocina frecuente' },
    ],
  },
  {
    key: 'style_social',
    title: 'Relación en casa',
    options: [
      { value: 'independent', label: 'A mi aire', tag: 'Va a su aire' },
      { value: 'balanced', label: 'Algo de vida común', tag: 'Vida común equilibrada' },
      { value: 'social', label: 'Casa sociable', tag: 'Casa sociable' },
    ],
  },
  {
    key: 'style_remote_work',
    title: 'Teletrabajo',
    options: [
      { value: 'no', label: 'No', tag: 'Sin teletrabajo' },
      { value: 'some', label: 'Algunos días', tag: 'Teletrabajo ocasional' },
      { value: 'often', label: 'Frecuente', tag: 'Teletrabajo frecuente' },
    ],
  },
] as const;

type StyleQuestionKey = typeof styleQuestions[number]['key'];

const toAutoTag = (label: string) => `${AUTO_TAG_PREFIX}${label.toLowerCase().replace(/\s+/g, '_')}`;

const decodeStyleValue = (tags: string[] | null | undefined, key: StyleQuestionKey) => {
  const safeTags = tags ?? [];
  const question = styleQuestions.find((item) => item.key === key);
  if (!question) return '';

  return question.options.find((option) => safeTags.includes(toAutoTag(option.tag)))?.value ?? '';
};

const encodeStyleTags = (existingTags: string[] | null | undefined, formData: Pick<FormState, StyleQuestionKey>) => {
  const preservedTags = (existingTags ?? []).filter((tag) => !tag.startsWith(AUTO_TAG_PREFIX));
  const styleTags = styleQuestions
    .map((question) => {
      const value = formData[question.key];
      const selectedOption = question.options.find((option) => option.value === value);
      return selectedOption ? toAutoTag(selectedOption.tag) : null;
    })
    .filter((tag): tag is string => Boolean(tag));

  return Array.from(new Set([...preservedTags, ...styleTags]));
};

const getSelectedStyleLabels = (formData: Pick<FormState, StyleQuestionKey>) =>
  styleQuestions.reduce<string[]>((labels, question) => {
    const selectedOption = question.options.find((option) => option.value === formData[question.key]);
    if (selectedOption) {
      labels.push(selectedOption.tag);
    }
    return labels;
  }, []);

const buildCompatibilityStyle = (formData: Pick<FormState, StyleQuestionKey>) => ({
  cleaning: formData.style_cleaning || null,
  noise: formData.style_noise || null,
  schedule: formData.style_schedule || null,
  visits: formData.style_visits || null,
  pets: formData.style_pets || null,
  smoking: formData.style_smoking || null,
  cooking: formData.style_cooking || null,
  social: formData.style_social || null,
  remote_work: formData.style_remote_work || null,
});

type ProfileIntention = {
  intention_type: 'seek_room' | 'offer_room' | 'seek_flatmate';
  is_primary: boolean;
  urgency?: string;
  details?: Record<string, unknown> | null;
};

interface ProfileData {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  photo_url: string | null;
  photos?: string[] | null;
  languages: string[] | null;
  city: string | null;
  province_code: string | null;
  autonomous_community?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  lifestyle_tags?: string[] | null;
  move_in_date?: string | null;
  min_stay_months?: number | null;
  occupation?: string | null;
  test_completed: boolean | null;
  quick_test_completed?: boolean | null;
  quick_test_completed_at?: string | null;
  full_test_completed?: boolean | null;
  full_test_completed_at?: string | null;
  full_test_requested_at?: string | null;
  full_test_requested_by?: string | null;
  trust_score: number;
  trust_badge: string;
  selfie_verified: boolean;
  intentions?: ProfileIntention[];
}

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onProfileUpdated: () => void;
}

type FormState = {
  display_name: string;
  bio: string;
  autonomous_community: string;
  city: string;
  province_code: string;
  budget_min: string;
  budget_max: string;
  move_in_date: string;
  min_stay_months: string;
  occupation: string;
  inclusive_profile: boolean;
  languages: string[];
  photos: string[];
  interest_tags: string[];
  is_smoker: '' | 'yes' | 'no';
  has_pet: '' | 'yes' | 'no';
  household_size: '' | 'solo' | 'pair' | 'group_3_plus';
  includes_minor: '' | 'yes' | 'no';
  style_cleaning: string;
  style_noise: string;
  style_schedule: string;
  style_visits: string;
  style_pets: string;
  style_smoking: string;
  style_cooking: string;
  style_social: string;
  style_remote_work: string;
  seek_room_goal: '' | 'need_room_now' | 'want_flatmate_then_home' | 'open_to_both';
  seek_room_accepts_smoking_home: '' | 'yes' | 'no';
  seek_room_accepts_pets_home: '' | 'yes' | 'no';
  seek_room_accepts_couples_home: '' | 'yes' | 'no';
  property_context: '' | 'shared_flat' | 'family_home' | 'owner_occupied_flat';
  current_household_count: string;
  occupancy_policy: '' | 'single_only' | 'couple' | 'two_people' | 'to_agree';
  allows_couples: '' | 'yes' | 'no';
  allows_two_people: '' | 'yes' | 'no';
  allows_minors: '' | 'yes' | 'no';
  allows_pets: '' | 'yes' | 'no';
  allows_smoking: '' | 'yes' | 'no';
};

const getIntention = (
  intentions: ProfileIntention[] | undefined,
  intentionType: ProfileIntention['intention_type']
) => intentions?.find((intention) => intention.intention_type === intentionType) ?? null;

const encodeInclusiveProfileTags = (
  existingTags: string[],
  inclusiveProfile: boolean
) => {
  const preservedTags = existingTags.filter((tag) => {
    return !tag.startsWith(PRONOUNS_PREFIX) && tag !== INCLUSIVE_PROFILE_TAG;
  });

  return [
    ...preservedTags,
    inclusiveProfile ? INCLUSIVE_PROFILE_TAG : null,
  ].filter((tag): tag is string => Boolean(tag));
};

const buildInitialFormData = (profile: ProfileData): FormState => {
  const livingTraits = decodeLivingTraits(profile.lifestyle_tags);
  const seekRoomDetails = decodeSeekRoomDetails(getIntention(profile.intentions, 'seek_room')?.details);
  const offerDetails = decodeOfferDetails(getIntention(profile.intentions, 'offer_room')?.details);

  return {
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    autonomous_community: profile.autonomous_community || '',
    city: profile.city || '',
    province_code: profile.province_code || '',
    budget_min: profile.budget_min?.toString() || '',
    budget_max: profile.budget_max?.toString() || '',
    move_in_date: profile.move_in_date || '',
    min_stay_months: profile.min_stay_months?.toString() || '',
    occupation: profile.occupation || '',
    inclusive_profile: Boolean(profile.lifestyle_tags?.includes(INCLUSIVE_PROFILE_TAG)),
    languages: (profile.languages || []).map(normalizeLanguage),
    interest_tags: decodeProfileInterestTags(profile.lifestyle_tags),
    photos: (() => {
      const firstValidPhoto = profile.photos?.find((photo): photo is string => typeof photo === 'string' && photo.length > 0);
      const primaryPhoto = firstValidPhoto || profile.photo_url || null;
      return primaryPhoto ? [primaryPhoto] : [];
    })(),
    is_smoker: livingTraits.isSmoker,
    has_pet: livingTraits.hasPet,
    household_size: livingTraits.householdSize,
    includes_minor: livingTraits.includesMinor,
    style_cleaning: decodeStyleValue(profile.lifestyle_tags, 'style_cleaning'),
    style_noise: decodeStyleValue(profile.lifestyle_tags, 'style_noise'),
    style_schedule: decodeStyleValue(profile.lifestyle_tags, 'style_schedule'),
    style_visits: decodeStyleValue(profile.lifestyle_tags, 'style_visits'),
    style_pets: decodeStyleValue(profile.lifestyle_tags, 'style_pets'),
    style_smoking: decodeStyleValue(profile.lifestyle_tags, 'style_smoking'),
    style_cooking: decodeStyleValue(profile.lifestyle_tags, 'style_cooking'),
    style_social: decodeStyleValue(profile.lifestyle_tags, 'style_social'),
    style_remote_work: decodeStyleValue(profile.lifestyle_tags, 'style_remote_work'),
    seek_room_goal: seekRoomDetails.seekerGoal,
    seek_room_accepts_smoking_home: seekRoomDetails.acceptsSmokingHome,
    seek_room_accepts_pets_home: seekRoomDetails.acceptsPetsHome,
    seek_room_accepts_couples_home: seekRoomDetails.acceptsCouplesHome,
    property_context: offerDetails.propertyContext,
    current_household_count: offerDetails.currentHouseholdCount,
    occupancy_policy: offerDetails.occupancyPolicy,
    allows_couples: offerDetails.allowsCouples,
    allows_two_people: offerDetails.allowsTwoPeople,
    allows_minors: offerDetails.allowsMinors,
    allows_pets: offerDetails.allowsPets,
    allows_smoking: offerDetails.allowsSmoking,
  };
};

export function EditProfileSheet({ open, onOpenChange, profile, onProfileUpdated }: EditProfileSheetProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(() => buildInitialFormData(profile));

  useEffect(() => {
    if (open) {
      setFormData(buildInitialFormData(profile));
    }
  }, [open, profile]);

  const hasSeekRoomIntention = Boolean(
    profile.intentions?.some((intention) => intention.intention_type === 'seek_room')
  );
  const hasOfferRoomIntention = Boolean(
    profile.intentions?.some((intention) => intention.intention_type === 'offer_room')
  );
  const isOfferOnlyProfile = hasOfferRoomIntention && !hasSeekRoomIntention;
  const isSeekRoomProfile = hasSeekRoomIntention && !hasOfferRoomIntention;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.photos.length >= PROFILE_PRIMARY_PHOTO_LIMIT) {
      toast({
        title: 'Límite alcanzado',
        description: 'Solo puedes tener una foto de perfil principal.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);

    try {
      const fileName = `${profile.user_id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        photos: [publicUrl],
      }));

      toast({
        title: t('profile.photoUploaded'),
        description: t('profile.photoUploadedDesc'),
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: t('profile.photoUploadError'),
        variant: 'destructive',
      });
    } finally {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const toggleLanguage = (languageId: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(languageId)
        ? prev.languages.filter((lang) => lang !== languageId)
        : [...prev.languages, languageId],
    }));
  };

  const toggleInterestTag = (tag: string) => {
    setFormData((prev) => {
      const selected = prev.interest_tags.includes(tag);
      if (!selected && prev.interest_tags.length >= PROFILE_INTEREST_TAG_LIMIT) {
        return prev;
      }

      return {
        ...prev,
        interest_tags: selected
          ? prev.interest_tags.filter((item) => item !== tag)
          : [...prev.interest_tags, tag],
      };
    });
  };

  const getValidationError = () => {
    const displayName = formData.display_name.trim();
    const bio = formData.bio.trim();
    const city = formData.city.trim();
    const province = formData.province_code.trim();
    const occupation = formData.occupation.trim();
    const hasBudgetMin = false;
    const hasBudgetMax = false;
    const budgetMin: number | null = null;
    const budgetMax: number | null = null;
    const dateIsValid = true;

    if (displayName.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return `El nombre no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres.`;
    }

    if (bio.length < MIN_BIO_LENGTH || bio.length > MAX_BIO_LENGTH) {
      return `La sección "Sobre mí" debe tener entre ${MIN_BIO_LENGTH} y ${MAX_BIO_LENGTH} caracteres.`;
    }

    if (!formData.autonomous_community) {
      return 'Selecciona una comunidad autónoma.';
    }

    if (city.length < 2 || city.length > MAX_CITY_LENGTH) {
      return 'El municipio o ciudad debe tener entre 2 y 80 caracteres.';
    }

    if (province.length < 2 || province.length > MAX_PROVINCE_LENGTH) {
      return 'La provincia debe tener entre 2 y 80 caracteres.';
    }

    if (hasBudgetMin !== hasBudgetMax) {
      return isOfferOnlyProfile
        ? 'Completa el precio mensual de la habitación o déjalo vacío.'
        : 'Completa ambos importes o deja el presupuesto vacío.';
    }

    if (budgetMin !== null && budgetMax !== null) {
      if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin <= 0 || budgetMax <= 0) {
        return isOfferOnlyProfile
          ? 'Completa un precio mensual válido.'
          : 'Completa un presupuesto mínimo y máximo válidos.';
      }

      if (budgetMin > budgetMax || budgetMax > MAX_BUDGET) {
        return isOfferOnlyProfile
          ? `El precio mensual no puede superar ${MAX_BUDGET} EUR.`
          : 'Revisa el presupuesto: el mínimo no puede superar al máximo.';
      }
    }

    if (!dateIsValid) {
      return 'La fecha de entrada no puede estar en el pasado.';
    }

    if (occupation.length > MAX_OCCUPATION_LENGTH) {
      return `La ocupación no puede superar ${MAX_OCCUPATION_LENGTH} caracteres.`;
    }

    if (formData.languages.length === 0) {
      return 'Selecciona al menos un idioma.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = getValidationError();
    if (validationError) {
      toast({
        title: 'Revisa tu perfil',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    const cleanDisplayName = formData.display_name.trim();
    const cleanBio = formData.bio.trim();
    const cleanCity = formData.city.trim();
    const cleanProvince = formData.province_code.trim();
    const cleanOccupation = formData.occupation.trim();
    const cleanLanguages = formData.languages.map(normalizeLanguage);
    const cleanPrimaryPhoto = formData.photos.find((photo) => typeof photo === 'string' && photo.length > 0) || null;
    const cleanPhotos = cleanPrimaryPhoto ? [cleanPrimaryPhoto] : [];
    const cleanBudgetMin = formData.budget_min.trim() ? Number(formData.budget_min) : null;
    const cleanBudgetMax = formData.budget_max.trim() ? Number(formData.budget_max) : null;
    const encodedInterestTags = encodeProfileInterestTags(profile.lifestyle_tags, formData.interest_tags);
    const encodedStyleTags = encodeStyleTags(encodedInterestTags, formData);
    const encodedLivingTags = encodeLivingTraits(encodedStyleTags, {
      isSmoker: formData.is_smoker,
      hasPet: formData.has_pet,
      householdSize: formData.household_size,
      includesMinor: formData.includes_minor,
    });
    const encodedLifestyleTags = encodeInclusiveProfileTags(
      encodedLivingTags,
      formData.inclusive_profile
    );

    setSaving(true);
    try {
      const { error: convinterError } = await supabase
        .from('convinter_profiles')
        .update({
          display_name: cleanDisplayName,
          bio: cleanBio,
          city: cleanCity,
          province_code: cleanProvince,
          languages: cleanLanguages,
          photo_url: cleanPhotos[0] || null,
        })
        .eq('user_id', profile.user_id);

      if (convinterError) throw convinterError;

      const { error: profilesError } = await supabase
        .from('profiles')
        .update({
          name: cleanDisplayName,
          bio: cleanBio,
          autonomous_community: formData.autonomous_community,
          province: cleanProvince,
          city: cleanCity,
          budget_min: cleanBudgetMin,
          budget_max: cleanBudgetMax,
          lifestyle_tags: encodedLifestyleTags,
          move_in_date: formData.move_in_date || null,
          min_stay_months: formData.min_stay_months ? Number(formData.min_stay_months) : null,
          occupation: cleanOccupation || null,
          languages: cleanLanguages,
          photos: cleanPhotos,
        })
        .eq('id', profile.user_id);

      if (profilesError) throw profilesError;

      for (const intention of profile.intentions ?? []) {
        let detailsPayload: Json = (intention.details ?? {}) as Json;

        if (intention.intention_type === 'offer_room') {
          detailsPayload = encodeOfferDetails(intention.details, {
            propertyContext: formData.property_context,
            currentHouseholdCount: formData.current_household_count,
            allowsCouples: formData.allows_couples,
            allowsTwoPeople: formData.allows_two_people,
            occupancyPolicy: formData.occupancy_policy,
            allowsMinors: formData.allows_minors,
            allowsPets: formData.allows_pets,
            allowsSmoking: formData.allows_smoking,
          });
        } else if (intention.intention_type === 'seek_room') {
          detailsPayload = encodeSeekRoomDetails(intention.details, {
            seekerGoal: formData.seek_room_goal,
            acceptsSmokingHome: formData.seek_room_accepts_smoking_home,
            acceptsPetsHome: formData.seek_room_accepts_pets_home,
            acceptsCouplesHome: formData.seek_room_accepts_couples_home,
          });
        } else {
          continue;
        }

        const baseDetails = detailsPayload && typeof detailsPayload === 'object' && !Array.isArray(detailsPayload)
          ? (detailsPayload as Record<string, Json>)
          : {};
        detailsPayload = {
          ...baseDetails,
          compatibility_style: buildCompatibilityStyle(formData) as unknown as Json,
          automatic_tags: getSelectedStyleLabels(formData) as unknown as Json,
          inclusive_profile: formData.inclusive_profile,
        } as Json;

        const { data: intentionResult, error: intentionError } = await supabase.rpc('convinter_set_intention', {
          p_intention_type: intention.intention_type,
          p_is_primary: intention.is_primary,
          p_urgency: intention.urgency || 'flexible',
          p_details: detailsPayload,
        });

        const parsedResult = intentionResult as unknown as { ok?: boolean } | null;
        if (intentionError || parsedResult?.ok === false) {
          throw intentionError ?? new Error(`No se pudo actualizar la intención ${intention.intention_type}`);
        }
      }

      toast({
        title: t('profile.saved'),
        description: t('profile.savedDesc'),
      });

      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: t('profile.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('profile.editTitle')}</SheetTitle>
          <SheetDescription>{t('profile.editDescription')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-6">
          <section className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Perfil personal</h3>
              <p className="mt-1 text-sm text-muted-foreground">Foto, nombre, descripción, ocupación e idiomas. Esta parte no depende de si buscas u ofreces habitación.</p>
            </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Foto de perfil</Label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {formData.photos.map((photo, index) => (
                <div key={photo} className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                  <img src={photo} alt="" className="h-full w-full object-cover" />
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

              {formData.photos.length < PROFILE_PRIMARY_PHOTO_LIMIT && (
                <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="mb-2 h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">Hacer selfie o subir foto</span>
                </label>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="display_name">{t('profile.name')}</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder={t('profile.namePlaceholder')}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 p-4">
            <div>
              <Label className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4" />
                Perfil inclusivo
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Opcional. Se mostrará solo si decides hacerlo visible en tu perfil.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={formData.inclusive_profile}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, inclusive_profile: Boolean(checked) }))}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium">Mostrar LGTBIQ+ friendly</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Indica que valoras una convivencia respetuosa e inclusiva.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="bio">Sobre ti</Label>
              <span className="text-xs text-muted-foreground">
                {formData.bio.trim().length}/{MAX_BIO_LENGTH}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Cuéntanos cómo eres conviviendo."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Cuéntanos sobre tu manera de convivir y detalles que quieras que otros sepan de ti.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="occupation">Ocupación o situación</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              maxLength={MAX_OCCUPATION_LENGTH}
              onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
              placeholder={t('onboarding.step4.occupationPlaceholder')}
            />
          </div>

          <div className="space-y-3">
            <Label>{t('profile.languages')}</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Badge
                  key={lang.id}
                  variant={formData.languages.includes(lang.id) ? 'default' : 'outline'}
                  className="cursor-pointer rounded-full transition-colors"
                  onClick={() => toggleLanguage(lang.id)}
                >
                  {lang.label}
                </Badge>
              ))}
            </div>
          </div>
          </section>

          <section className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Rasgos e intereses</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige hasta 25 detalles que ayuden a otras personas a conocerte mejor: personalidad, planes, música o estilo de vida.
              </p>
            </div>

            <div className="sticky top-0 z-20 rounded-xl border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {formData.interest_tags.length}/{PROFILE_INTEREST_TAG_LIMIT} seleccionados
                </span>
                <span className="text-muted-foreground">
                  {PROFILE_INTEREST_TAG_LIMIT - formData.interest_tags.length > 0
                    ? `Te quedan ${PROFILE_INTEREST_TAG_LIMIT - formData.interest_tags.length}`
                    : 'Límite alcanzado'}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (formData.interest_tags.length / PROFILE_INTEREST_TAG_LIMIT) * 100)}%` }}
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
                      const selected = formData.interest_tags.includes(option);
                      const disabled = !selected && formData.interest_tags.length >= PROFILE_INTEREST_TAG_LIMIT;

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
          </section>

          <section className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Tus hábitos y tu manera de convivir</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Opcional. Estos datos cuentan cómo sueles convivir y se muestran como rasgos públicos para orientar compatibilidad.
              </p>
            </div>

            <div className="space-y-4">
              {styleQuestions.map((question) => (
                <div key={question.key} className="space-y-2">
                  <Label>{question.title}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {question.options.map((option) => {
                      const selected = formData[question.key] === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            [question.key]: selected ? '' : option.value,
                          }))}
                          className={`min-h-11 rounded-xl border px-2 text-sm font-medium transition-all ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:border-primary/50'
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

            <div className="border-t border-border/70 pt-5">
              <h4 className="text-sm font-medium text-foreground">Situación de convivencia</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Puedes indicar si convives solo/a, en pareja, con familia o con menores. Es opcional y ayuda a entender mejor tu contexto personal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Unidad de convivencia</Label>
                <Select
                  value={formData.household_size}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, household_size: value as FormState['household_size'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUSEHOLD_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Menores en convivencia</Label>
                <Select
                  value={formData.includes_minor}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, includes_minor: value as FormState['includes_minor'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="hidden space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Datos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Información práctica según tu objetivo de vivienda.</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Datos prácticos, no compatibilidad.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isOfferOnlyProfile
                  ? 'Aquí solo van zona, precio y disponibilidad. Limpieza, horarios, visitas, ruido y tabaco se actualizan desde el test.'
                  : 'Aquí solo van zona, presupuesto y fechas. Limpieza, horarios, visitas, ruido y tabaco se actualizan desde el test.'}
              </p>
            </div>

          <div className="space-y-3">
            <Label>Ubicación</Label>
            <Select
              value={formData.autonomous_community}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, autonomous_community: value, province_code: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona comunidad autónoma" />
              </SelectTrigger>
              <SelectContent>
                {AUTONOMOUS_COMMUNITIES.map((community) => (
                  <SelectItem key={community} value={community}>
                    {community}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('profile.city')}</Label>
                <Input
                  value={formData.city}
                  maxLength={MAX_CITY_LENGTH}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Ej: Madrid, Móstoles, Pinto..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.province')}</Label>
                <Select
                  value={formData.province_code}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, province_code: value }))}
                  disabled={!formData.autonomous_community}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.province')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(PROVINCES[formData.autonomous_community] || []).map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isOfferOnlyProfile ? (
            <div className="space-y-2">
              <Label>Precio mensual de la habitación</Label>
              <Input
                type="number"
                min={1}
                max={MAX_BUDGET}
                value={formData.budget_min || formData.budget_max}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, budget_min: value, budget_max: value }));
                }}
                placeholder="650"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  {isSeekRoomProfile
                    ? 'Presupuesto mínimo para habitación'
                    : 'Presupuesto mínimo'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX_BUDGET}
                  value={formData.budget_min}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget_min: e.target.value }))}
                  placeholder="300"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {isSeekRoomProfile
                    ? 'Presupuesto máximo para habitación'
                    : 'Presupuesto máximo'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX_BUDGET}
                  value={formData.budget_max}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget_max: e.target.value }))}
                  placeholder="700"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                {isOfferOnlyProfile
                  ? 'Disponible desde'
                  : isSeekRoomProfile
                    ? 'Entrada deseada'
                    : 'Fecha de entrada'}
              </Label>
              <Input
                type="date"
                min={todayIso()}
                value={formData.move_in_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, move_in_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{isOfferOnlyProfile ? 'Estancia mínima' : 'Duración prevista'}</Label>
              <Select
                value={formData.min_stay_months}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, min_stay_months: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estancia mínima" />
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

          </section>

          <section className="hidden space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Intenciones</h3>
              <p className="mt-1 text-sm text-muted-foreground">Condiciones específicas de lo que buscas u ofreces.</p>
            </div>

            {!hasSeekRoomIntention && !hasOfferRoomIntention && (
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm font-medium text-foreground">Aún no has definido qué buscas.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completa el onboarding para activar tus intenciones y poder editarlas aquí.
                </p>
              </div>
            )}

          {hasSeekRoomIntention && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <Label>Lo que busco</Label>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select
                  value={formData.seek_room_goal}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_room_goal: value as FormState['seek_room_goal'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEEK_ROOM_GOAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Me encaja piso con fumadores</Label>
                  <Select
                    value={formData.seek_room_accepts_smoking_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_room_accepts_smoking_home: value as FormState['seek_room_accepts_smoking_home'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Me encaja piso con mascotas</Label>
                  <Select
                    value={formData.seek_room_accepts_pets_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_room_accepts_pets_home: value as FormState['seek_room_accepts_pets_home'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Me encaja convivir con parejas</Label>
                  <Select
                    value={formData.seek_room_accepts_couples_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_room_accepts_couples_home: value as FormState['seek_room_accepts_couples_home'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {hasOfferRoomIntention && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <Label>Lo que ofrezco</Label>
              <div className="space-y-2">
                <Label>Tipo de vivienda</Label>
                <Select
                  value={formData.property_context}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, property_context: value as FormState['property_context'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona contexto" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_CONTEXT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personas viviendo ya en casa</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.current_household_count}
                  onChange={(e) => setFormData((prev) => ({ ...prev, current_household_count: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium">Condiciones de convivencia</p>
                <p className="text-sm text-muted-foreground">
                  Define las normas y el tipo de convivencia de la vivienda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Disponible para</Label>
                  <Select
                    value={formData.occupancy_policy}
                    onValueChange={(value) => {
                      const occupancyPolicy = value as FormState['occupancy_policy'];
                      setFormData((prev) => ({
                        ...prev,
                        occupancy_policy: occupancyPolicy,
                        allows_couples: occupancyPolicy === 'couple' || occupancyPolicy === 'to_agree' ? 'yes' : 'no',
                        allows_two_people: occupancyPolicy === 'two_people' || occupancyPolicy === 'to_agree' ? 'yes' : 'no',
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPANCY_POLICY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admite menores</Label>
                  <Select
                    value={formData.allows_minors}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, allows_minors: value as FormState['allows_minors'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admite mascotas</Label>
                  <Select
                    value={formData.allows_pets}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, allows_pets: value as FormState['allows_pets'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Se puede fumar</Label>
                  <Select
                    value={formData.allows_smoking}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, allows_smoking: value as FormState['allows_smoking'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          </section>
        </div>

        <div className="border-t border-border/60 bg-background py-4">
          <Button onClick={handleSave} disabled={saving} className="w-full" variant="hero">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('profile.saving')}
              </>
            ) : (
              t('profile.saveChanges')
            )}
          </Button>
        </div>

        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={selectedImage || ''}
          onCropComplete={handleCropComplete}
        />
      </SheetContent>
    </Sheet>
  );
}
