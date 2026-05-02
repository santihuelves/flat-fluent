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
  PROFILE_PHOTO_LIMIT,
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
};

const buildInitialFormData = (profile: ProfileData): FormState => ({
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
  photos: (profile.photos && profile.photos.length > 0
    ? profile.photos
    : profile.photo_url
      ? [profile.photo_url]
      : []
  ).slice(0, PROFILE_PHOTO_LIMIT),
});

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.photos.length >= PROFILE_PHOTO_LIMIT) {
      toast({
        title: 'Limite alcanzado',
        description: `Puedes subir un maximo de ${PROFILE_PHOTO_LIMIT} fotos al perfil.`,
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
        photos: [...prev.photos, publicUrl].slice(0, PROFILE_PHOTO_LIMIT),
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
      return `La seccion "Sobre ti" debe tener entre ${MIN_BIO_LENGTH} y ${MAX_BIO_LENGTH} caracteres.`;
    }

    if (!formData.autonomous_community) {
      return 'Selecciona una comunidad autonoma.';
    }

    if (city.length < 2 || city.length > MAX_CITY_LENGTH) {
      return 'La ciudad debe tener entre 2 y 80 caracteres.';
    }

    if (province.length < 2 || province.length > MAX_PROVINCE_LENGTH) {
      return 'La provincia debe tener entre 2 y 80 caracteres.';
    }

    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin <= 0 || budgetMax <= 0) {
      return 'Completa un presupuesto minimo y maximo validos.';
    }

    if (budgetMin > budgetMax || budgetMax > MAX_BUDGET) {
      return 'Revisa el presupuesto: el minimo no puede superar al maximo.';
    }

    if (!dateIsValid) {
      return 'La fecha de entrada no puede estar en el pasado.';
    }

    if (occupation.length > MAX_OCCUPATION_LENGTH) {
      return `La ocupacion no puede superar ${MAX_OCCUPATION_LENGTH} caracteres.`;
    }

    if (formData.languages.length === 0) {
      return 'Selecciona al menos un idioma.';
    }

    if (!formData.min_stay_months) {
      return 'Selecciona una estancia minima.';
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
    const cleanPhotos = formData.photos.slice(0, PROFILE_PHOTO_LIMIT);

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
          move_in_date: formData.move_in_date || null,
          min_stay_months: Number(formData.min_stay_months),
          occupation: cleanOccupation || null,
          languages: cleanLanguages,
          photos: cleanPhotos,
        })
        .eq('id', profile.user_id);

      if (profilesError) throw profilesError;

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
              <Label>{t('profile.photo')}</Label>
              <span className="text-xs text-muted-foreground">
                {formData.photos.length}/{PROFILE_PHOTO_LIMIT}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              {formData.photos.length < PROFILE_PHOTO_LIMIT && (
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
                  <span className="text-sm text-muted-foreground">Anadir foto</span>
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
              <Label htmlFor="bio">{t('profile.bioLabel')}</Label>
              <span className="text-xs text-muted-foreground">
                {formData.bio.trim().length}/{MAX_BIO_LENGTH}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder={t('profile.bioPlaceholder')}
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label>Ubicacion</Label>
            <Select
              value={formData.autonomous_community}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, autonomous_community: value, province_code: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona comunidad autonoma" />
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
              <Label>Presupuesto minimo</Label>
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
              <Label>Presupuesto maximo</Label>
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
              <Label>Estancia minima</Label>
              <Select
                value={formData.min_stay_months}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, min_stay_months: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estancia" />
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
            <Label htmlFor="occupation">Ocupacion</Label>
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
