import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ImageCropperDialog } from './ImageCropperDialog';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  photo_url: string | null;
  languages: string[] | null;
  city: string | null;
  province_code: string | null;
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

const AVAILABLE_LANGUAGES = ['Español', 'English', 'Français', 'Deutsch', 'Italiano', 'Português', '中文', 'العربية'];
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_BIO_LENGTH = 500;
const MAX_CITY_LENGTH = 80;
const MAX_PROVINCE_LENGTH = 80;

export function EditProfileSheet({ open, onOpenChange, profile, onProfileUpdated }: EditProfileSheetProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    city: profile.city || '',
    province_code: profile.province_code || '',
    languages: profile.languages || [],
    photo_url: profile.photo_url || '',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      setFormData(prev => ({
        ...prev,
        photo_url: publicUrl
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

  const removePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo_url: ''
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const getValidationError = () => {
    const displayName = formData.display_name.trim();
    const bio = formData.bio.trim();
    const city = formData.city.trim();
    const province = formData.province_code.trim();

    if (displayName.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return `El nombre no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres.`;
    }

    if (bio.length > MAX_BIO_LENGTH) {
      return `La bio no puede superar ${MAX_BIO_LENGTH} caracteres.`;
    }

    if ((city && !province) || (!city && province)) {
      return 'Completa ciudad y provincia, o deja ambas vacias.';
    }

    if (city.length > MAX_CITY_LENGTH || province.length > MAX_PROVINCE_LENGTH) {
      return 'Ciudad y provincia no pueden superar 80 caracteres.';
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

    setSaving(true);
    try {
      const { error } = await supabase
        .from('convinter_profiles')
        .update({
          display_name: cleanDisplayName,
          bio: cleanBio || null,
          city: cleanCity || null,
          province_code: cleanProvince || null,
          languages: formData.languages.length > 0 ? formData.languages : null,
          photo_url: formData.photo_url || null,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

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
          {/* Photo */}
          <div className="space-y-3">
            <Label>{t('profile.photo')}</Label>
            
            <div className="flex items-center gap-4">
              {formData.photo_url ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                  <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={removePhoto}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex w-24 h-24 items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-3">
            <Label htmlFor="display_name">{t('profile.name')}</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder={t('profile.namePlaceholder')}
            />
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <Label htmlFor="bio">{t('profile.bioLabel')}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label>{t('profile.location')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.city}
                maxLength={MAX_CITY_LENGTH}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder={t('profile.city')}
              />
              <Input
                value={formData.province_code}
                maxLength={MAX_PROVINCE_LENGTH}
                onChange={(e) => setFormData(prev => ({ ...prev, province_code: e.target.value }))}
                placeholder={t('profile.province')}
              />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <Label>{t('profile.languages')}</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <Badge
                  key={lang}
                  variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                  className="rounded-full cursor-pointer transition-colors"
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full"
            variant="hero"
          >
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
