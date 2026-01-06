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

interface ProfileData {
  id: string;
  name: string | null;
  bio: string | null;
  occupation: string | null;
  autonomous_community: string | null;
  province: string | null;
  city: string | null;
  neighborhoods: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  move_in_date: string | null;
  min_stay_months: number | null;
  languages: string[] | null;
  photos: string[] | null;
}

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onProfileUpdated: () => void;
}

const AVAILABLE_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Chino', 'Árabe'];

const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  'Madrid': ['Malasaña', 'Chueca', 'Lavapiés', 'Salamanca', 'Chamberí', 'Retiro', 'Tetuán', 'Usera', 'Vallecas', 'Moncloa', 'Arganzuela', 'Chamartín', 'La Latina'],
  'Barcelona': ['Gràcia', 'El Born', 'Raval', 'Eixample', 'Poble Sec', 'Sant Antoni', 'Sants', 'Barceloneta', 'Les Corts', 'Sarrià', 'Horta', 'Poblenou'],
  'Valencia': ['Ruzafa', 'El Carmen', 'Benimaclet', 'Patraix', 'Campanar', 'Ciutat Vella', 'Extramurs', 'La Saïdia', 'Poblats Marítims'],
  'Sevilla': ['Triana', 'Macarena', 'Nervión', 'Santa Cruz', 'Los Remedios', 'San Pablo', 'Alameda', 'Centro'],
  'Bilbao': ['Casco Viejo', 'Deusto', 'Abando', 'Indautxu', 'San Ignacio', 'Santutxu', 'Rekalde'],
  'Zaragoza': ['Centro', 'Delicias', 'La Almozara', 'San José', 'Las Fuentes', 'Actur', 'El Rabal'],
  'Málaga': ['Centro', 'La Malagueta', 'El Palo', 'Teatinos', 'Carretera de Cádiz', 'Cruz de Humilladero'],
};

export function EditProfileSheet({ open, onOpenChange, profile, onProfileUpdated }: EditProfileSheetProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    occupation: profile.occupation || '',
    autonomous_community: profile.autonomous_community || '',
    province: profile.province || '',
    city: profile.city || '',
    neighborhoods: profile.neighborhoods || [],
    budget_min: profile.budget_min || 0,
    budget_max: profile.budget_max || 0,
    move_in_date: profile.move_in_date || '',
    min_stay_months: profile.min_stay_months || 1,
    languages: profile.languages || [],
    photos: profile.photos || [],
  });

  const [neighborhoodInput, setNeighborhoodInput] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, publicUrl]
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
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addNeighborhood = () => {
    if (neighborhoodInput.trim() && !formData.neighborhoods.includes(neighborhoodInput.trim())) {
      setFormData(prev => ({
        ...prev,
        neighborhoods: [...prev.neighborhoods, neighborhoodInput.trim()]
      }));
      setNeighborhoodInput('');
    }
  };

  const removeNeighborhood = (neighborhood: string) => {
    setFormData(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.filter(n => n !== neighborhood)
    }));
  };

  const toggleNeighborhood = (neighborhood: string) => {
    setFormData(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(neighborhood)
        ? prev.neighborhoods.filter(n => n !== neighborhood)
        : [...prev.neighborhoods, neighborhood]
    }));
  };

  const availableNeighborhoods = NEIGHBORHOODS_BY_CITY[formData.city] || [];

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name || null,
          bio: formData.bio || null,
          occupation: formData.occupation || null,
          autonomous_community: formData.autonomous_community || null,
          province: formData.province || null,
          city: formData.city || null,
          neighborhoods: formData.neighborhoods.length > 0 ? formData.neighborhoods : null,
          budget_min: formData.budget_min || null,
          budget_max: formData.budget_max || null,
          move_in_date: formData.move_in_date || null,
          min_stay_months: formData.min_stay_months || null,
          languages: formData.languages.length > 0 ? formData.languages : null,
          photos: formData.photos.length > 0 ? formData.photos : null,
        })
        .eq('id', profile.id);

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
          {/* Photos */}
          <div className="space-y-3">
            <Label>{t('profile.photos')}</Label>
            <div className="flex flex-wrap gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <Label htmlFor="name">{t('profile.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('profile.namePlaceholder')}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="occupation">{t('profile.occupation')}</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder={t('profile.occupationPlaceholder')}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="bio">{t('profile.bioLabel')}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
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
                value={formData.autonomous_community}
                onChange={(e) => setFormData(prev => ({ ...prev, autonomous_community: e.target.value }))}
                placeholder={t('profile.autonomousCommunity')}
              />
              <Input
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                placeholder={t('profile.province')}
              />
            </div>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder={t('profile.city')}
            />
          </div>

          {/* Neighborhoods */}
          <div className="space-y-3">
            <Label>{t('profile.neighborhoods')}</Label>
            
            {/* Predefined neighborhoods for selected city */}
            {availableNeighborhoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableNeighborhoods.map((neighborhood) => (
                  <Badge
                    key={neighborhood}
                    variant={formData.neighborhoods.includes(neighborhood) ? 'default' : 'outline'}
                    className="rounded-full cursor-pointer transition-colors"
                    onClick={() => toggleNeighborhood(neighborhood)}
                  >
                    {neighborhood}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Manual input for custom neighborhoods */}
            <div className="flex gap-2">
              <Input
                value={neighborhoodInput}
                onChange={(e) => setNeighborhoodInput(e.target.value)}
                placeholder={availableNeighborhoods.length > 0 ? t('profile.otherNeighborhood') : t('profile.neighborhoodPlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNeighborhood())}
              />
              <Button type="button" variant="outline" onClick={addNeighborhood}>
                +
              </Button>
            </div>
            
            {/* Selected neighborhoods (custom ones not in predefined list) */}
            {formData.neighborhoods.filter(n => !availableNeighborhoods.includes(n)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.neighborhoods
                  .filter(n => !availableNeighborhoods.includes(n))
                  .map((n, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full gap-1">
                      {n}
                      <button onClick={() => removeNeighborhood(n)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label>{t('profile.budget')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))}
                  placeholder={t('profile.budgetMin')}
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 0 }))}
                  placeholder={t('profile.budgetMax')}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <Label htmlFor="move_in_date">{t('profile.moveInDate')}</Label>
            <Input
              id="move_in_date"
              type="date"
              value={formData.move_in_date}
              onChange={(e) => setFormData(prev => ({ ...prev, move_in_date: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="min_stay">{t('profile.minStay')}</Label>
            <Input
              id="min_stay"
              type="number"
              min="1"
              value={formData.min_stay_months || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, min_stay_months: parseInt(e.target.value) || 1 }))}
              placeholder={t('profile.minStayPlaceholder')}
            />
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <Label>{t('profile.languages')}</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <Badge
                  key={lang}
                  variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                  className="rounded-full cursor-pointer"
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
      </SheetContent>
    </Sheet>
  );
}
