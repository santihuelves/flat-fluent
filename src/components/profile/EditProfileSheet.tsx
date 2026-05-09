import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  decodeLivingTraits,
  decodeOfferDetails,
  decodeSeekFlatmateDetails,
  decodeSeekRoomDetails,
  encodeLivingTraits,
  encodeOfferDetails,
  encodeSeekFlatmateDetails,
  encodeSeekRoomDetails,
  PROPERTY_CONTEXT_OPTIONS,
  SEEKER_GOAL_OPTIONS,
  YES_NO_OPTIONS,
} from '@/lib/profileTraits';

const PROFILE_PRIMARY_PHOTO_LIMIT = 1;

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
  languages: string[];
  photos: string[];
  is_smoker: '' | 'yes' | 'no';
  has_pet: '' | 'yes' | 'no';
  household_size: '' | 'solo' | 'pair' | 'group_3_plus';
  includes_minor: '' | 'yes' | 'no';
  seek_room_goal: '' | 'need_room_now' | 'want_flatmate_then_home' | 'open_to_both';
  seek_room_accepts_smoking_home: '' | 'yes' | 'no';
  seek_room_accepts_pets_home: '' | 'yes' | 'no';
  seek_room_accepts_couples_home: '' | 'yes' | 'no';
  seek_flatmate_goal: '' | 'need_room_now' | 'want_flatmate_then_home' | 'open_to_both';
  seek_flatmate_accepts_smoking_home: '' | 'yes' | 'no';
  seek_flatmate_accepts_pets_home: '' | 'yes' | 'no';
  seek_flatmate_accepts_couples_home: '' | 'yes' | 'no';
  property_context: '' | 'shared_flat' | 'family_home' | 'owner_occupied_flat';
  current_household_count: string;
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

const buildInitialFormData = (profile: ProfileData): FormState => {
  const seekRoomDetails = decodeSeekRoomDetails(getIntention(profile.intentions, 'seek_room')?.details);
  const seekFlatmateDetails = decodeSeekFlatmateDetails(getIntention(profile.intentions, 'seek_flatmate')?.details);
  const offerDetails = decodeOfferDetails(getIntention(profile.intentions, 'offer_room')?.details);

  return {
    ...decodeLivingTraits(profile.lifestyle_tags),
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
    languages: (profile.languages || []).map(normalizeLanguage),
    photos: (() => {
      const firstValidPhoto = profile.photos?.find((photo): photo is string => typeof photo === 'string' && photo.length > 0);
      const primaryPhoto = firstValidPhoto || profile.photo_url || null;
      return primaryPhoto ? [primaryPhoto] : [];
    })(),
    seek_room_goal: seekRoomDetails.seekerGoal,
    seek_room_accepts_smoking_home: seekRoomDetails.acceptsSmokingHome,
    seek_room_accepts_pets_home: seekRoomDetails.acceptsPetsHome,
    seek_room_accepts_couples_home: seekRoomDetails.acceptsCouplesHome,
    seek_flatmate_goal: seekFlatmateDetails.seekerGoal,
    seek_flatmate_accepts_smoking_home: seekFlatmateDetails.acceptsSmokingHome,
    seek_flatmate_accepts_pets_home: seekFlatmateDetails.acceptsPetsHome,
    seek_flatmate_accepts_couples_home: seekFlatmateDetails.acceptsCouplesHome,
    ...offerDetails,
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
  const hasSeekFlatmateIntention = Boolean(
    profile.intentions?.some((intention) => intention.intention_type === 'seek_flatmate')
  );
  const hasOfferRoomIntention = Boolean(
    profile.intentions?.some((intention) => intention.intention_type === 'offer_room')
  );

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

  const getValidationError = () => {
    const displayName = formData.display_name.trim();
    const bio = formData.bio.trim();
    const city = formData.city.trim();
    const province = formData.province_code.trim();
    const occupation = formData.occupation.trim();
    const budgetMin = Number(formData.budget_min);
    const budgetMax = Number(formData.budget_max);
    const dateIsValid = !formData.move_in_date || formData.move_in_date >= todayIso();

    if (displayName.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return `El nombre no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres.`;
    }

    if (bio.length < MIN_BIO_LENGTH || bio.length > MAX_BIO_LENGTH) {
      return `La sección "Sobre ti y convivencia" debe tener entre ${MIN_BIO_LENGTH} y ${MAX_BIO_LENGTH} caracteres.`;
    }

    if (!formData.autonomous_community) {
      return 'Selecciona una comunidad autónoma.';
    }

    if (city.length < 2 || city.length > MAX_CITY_LENGTH) {
      return 'La ciudad debe tener entre 2 y 80 caracteres.';
    }

    if (province.length < 2 || province.length > MAX_PROVINCE_LENGTH) {
      return 'La provincia debe tener entre 2 y 80 caracteres.';
    }

    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin <= 0 || budgetMax <= 0) {
      return 'Completa un presupuesto mínimo y máximo válidos.';
    }

    if (budgetMin > budgetMax || budgetMax > MAX_BUDGET) {
      return 'Revisa el presupuesto: el mínimo no puede superar al máximo.';
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

    if (!formData.min_stay_months) {
      return 'Selecciona una estancia mínima.';
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
    const encodedLifestyleTags = encodeLivingTraits(profile.lifestyle_tags, {
      isSmoker: formData.is_smoker,
      hasPet: formData.has_pet,
      householdSize: formData.household_size,
      includesMinor: formData.includes_minor,
    });

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
          budget_min: Number(formData.budget_min),
          budget_max: Number(formData.budget_max),
          lifestyle_tags: encodedLifestyleTags,
          move_in_date: formData.move_in_date || null,
          min_stay_months: Number(formData.min_stay_months),
          occupation: cleanOccupation || null,
          languages: cleanLanguages,
          photos: cleanPhotos,
        })
        .eq('id', profile.user_id);

      if (profilesError) throw profilesError;

      for (const intention of profile.intentions ?? []) {
        let detailsPayload = intention.details ?? {};

        if (intention.intention_type === 'offer_room') {
          detailsPayload = encodeOfferDetails(intention.details, {
            propertyContext: formData.property_context,
            currentHouseholdCount: formData.current_household_count,
            allowsCouples: formData.allows_couples,
            allowsTwoPeople: formData.allows_two_people,
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
        } else if (intention.intention_type === 'seek_flatmate') {
          detailsPayload = encodeSeekFlatmateDetails(intention.details, {
            seekerGoal: formData.seek_flatmate_goal,
            acceptsSmokingHome: formData.seek_flatmate_accepts_smoking_home,
            acceptsPetsHome: formData.seek_flatmate_accepts_pets_home,
            acceptsCouplesHome: formData.seek_flatmate_accepts_couples_home,
          });
        } else {
          continue;
        }

        const { data: intentionResult, error: intentionError } = await supabase.rpc('convinter_set_intention', {
          p_intention_type: intention.intention_type,
          p_is_primary: intention.is_primary,
          p_urgency: intention.urgency || 'flexible',
          p_details: detailsPayload,
        });

        const parsedResult = intentionResult as unknown as { ok?: boolean } | null;
        if (intentionError || parsedResult?.ok === false) {
          throw intentionError ?? new Error(`No se pudo actualizar la intencion ${intention.intention_type}`);
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

        <div className="space-y-6 py-6">
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
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="mb-2 h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">Añadir foto</span>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="bio">Sobre ti y convivencia</Label>
              <span className="text-xs text-muted-foreground">
                {formData.bio.trim().length}/{MAX_BIO_LENGTH}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Cuéntanos quién eres, cómo convives y qué valoras en casa."
              rows={5}
            />
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

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.city}
                maxLength={MAX_CITY_LENGTH}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder={t('profile.city')}
              />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Presupuesto mínimo</Label>
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
              <Label>Presupuesto máximo</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha de entrada</Label>
              <Input
                type="date"
                min={todayIso()}
                value={formData.move_in_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, move_in_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Estancia mínima</Label>
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

          <div className="space-y-3">
            <Label htmlFor="occupation">Ocupación</Label>
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

          {hasSeekRoomIntention && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <Label>Busco habitación</Label>
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
                    {SEEKER_GOAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Acepta fumadores</Label>
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
                  <Label>Acepta mascotas</Label>
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
                  <Label>Acepta parejas</Label>
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

          {hasSeekFlatmateIntention && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <Label>Busco compañero/a para alquilar juntos</Label>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select
                  value={formData.seek_flatmate_goal}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_flatmate_goal: value as FormState['seek_flatmate_goal'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEEKER_GOAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Acepta fumadores</Label>
                  <Select
                    value={formData.seek_flatmate_accepts_smoking_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_flatmate_accepts_smoking_home: value as FormState['seek_flatmate_accepts_smoking_home'] }))}
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
                  <Label>Acepta mascotas</Label>
                  <Select
                    value={formData.seek_flatmate_accepts_pets_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_flatmate_accepts_pets_home: value as FormState['seek_flatmate_accepts_pets_home'] }))}
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
                  <Label>Acepta parejas</Label>
                  <Select
                    value={formData.seek_flatmate_accepts_couples_home}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, seek_flatmate_accepts_couples_home: value as FormState['seek_flatmate_accepts_couples_home'] }))}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Admite parejas</Label>
                  <Select
                    value={formData.allows_couples}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, allows_couples: value as FormState['allows_couples'] }))}
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
                  <Label>Admite dos personas</Label>
                  <Select
                    value={formData.allows_two_people}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, allows_two_people: value as FormState['allows_two_people'] }))}
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
