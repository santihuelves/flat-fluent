import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Key, Users, MapPin, Euro, Calendar, Languages, Briefcase, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type IntentionType = 'seek_room' | 'offer_room' | 'seek_flatmate';

interface OnboardingData {
  intentions: IntentionType[];
  primaryIntention: IntentionType | null;
  autonomousCommunity: string;
  province: string;
  city: string;
  budgetMin: string;
  budgetMax: string;
  moveInDate: string;
  minStayMonths: string;
  languages: string[];
  occupation: string;
  urgency: 'urgent' | 'soon' | 'flexible' | 'exploring';
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

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    intentions: [],
    primaryIntention: null,
    autonomousCommunity: '',
    province: '',
    city: '',
    budgetMin: '',
    budgetMax: '',
    moveInDate: '',
    minStayMonths: '',
    languages: [],
    occupation: '',
    urgency: 'flexible',
  });

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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.intentions.length > 0;
      case 2:
        return data.autonomousCommunity !== '';
      case 3:
        return data.budgetMin !== '' && data.budgetMax !== '';
      case 4:
        return data.languages.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async (goToTest: boolean) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.auth'));
        return;
      }

      // 1. Actualizar perfil básico (convinter_profiles o profiles según tu esquema)
      const { error: profileError } = await supabase
        .from('convinter_profiles')
        .upsert({
          user_id: session.user.id,
          city: data.city || null,
          province_code: data.province || null,
          languages: data.languages,
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // 2. Guardar cada intención usando el RPC
      for (const intention of data.intentions) {
        const isPrimary = intention === data.primaryIntention;
        const intentionDetails = {
          budget_min: data.budgetMin ? parseInt(data.budgetMin) : null,
          budget_max: data.budgetMax ? parseInt(data.budgetMax) : null,
          move_in_date: data.moveInDate || null,
          min_stay_months: data.minStayMonths ? parseInt(data.minStayMonths) : null,
          occupation: data.occupation || null,
          autonomous_community: data.autonomousCommunity || null,
        };

        const { data: rpcData, error: intentionError } = await supabase.rpc('convinter_set_intention', {
          p_intention_type: intention,
          p_is_primary: isPrimary,
          p_urgency: data.urgency || 'flexible',
          p_details: intentionDetails
        });

        if (intentionError) {
          console.error(`Error setting intention ${intention}:`, intentionError);
          console.error('RPC Error details:', JSON.stringify(intentionError, null, 2));
          toast.error(t('errors.operation') + ': ' + (intentionError.message || 'Unknown error'));
          throw intentionError;
        }

        console.log(`Intention ${intention} saved successfully:`, rpcData);
      }

      toast.success(t('onboarding.success'));
      navigate(goToTest ? '/test' : '/discover');
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
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.step1.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.step1.subtitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">💡 {t('onboarding.step1.multipleHint')}</p>
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
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                          {isPrimary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                              {t('common.primary')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>
                    
                    {/* Botón para marcar como primaria */}
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.step2.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.step2.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  {t('onboarding.step2.community')}
                </Label>
                <Select
                  value={data.autonomousCommunity}
                  onValueChange={(value) => setData(prev => ({ ...prev, autonomousCommunity: value, province: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.step2.selectCommunity')} />
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
                  <Label className="mb-2 block">{t('onboarding.step2.province')}</Label>
                  <Select
                    value={data.province}
                    onValueChange={(value) => setData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('onboarding.step2.selectProvince')} />
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
                <Label className="mb-2 block">{t('onboarding.step2.city')}</Label>
                <Input
                  placeholder={t('onboarding.step2.cityPlaceholder')}
                  value={data.city}
                  onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.step3.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.step3.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Euro className="h-4 w-4" />
                    {t('onboarding.step3.budgetMin')}
                  </Label>
                  <Input
                    type="number"
                    placeholder="300"
                    value={data.budgetMin}
                    onChange={(e) => setData(prev => ({ ...prev, budgetMin: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{t('onboarding.step3.budgetMax')}</Label>
                  <Input
                    type="number"
                    placeholder="600"
                    value={data.budgetMax}
                    onChange={(e) => setData(prev => ({ ...prev, budgetMax: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  {t('onboarding.step3.moveInDate')}
                </Label>
                <Input
                  type="date"
                  value={data.moveInDate}
                  onChange={(e) => setData(prev => ({ ...prev, moveInDate: e.target.value }))}
                />
              </div>

              <div>
                <Label className="mb-2 block">{t('onboarding.step3.minStay')}</Label>
                <Select
                  value={data.minStayMonths}
                  onValueChange={(value) => setData(prev => ({ ...prev, minStayMonths: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.step3.selectMinStay')} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 6, 9, 12].map(months => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} {months === 1 ? t('onboarding.step3.month') : t('onboarding.step3.months')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.step4.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.step4.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Languages className="h-4 w-4" />
                  {t('onboarding.step4.languages')}
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
                  {t('onboarding.step4.occupation')}
                </Label>
                <Input
                  placeholder={t('onboarding.step4.occupationPlaceholder')}
                  value={data.occupation}
                  onChange={(e) => setData(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>
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
                onClick={() => handleComplete(false)}
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                {t('onboarding.skipTest')}
              </Button>
              <Button
                onClick={() => handleComplete(true)}
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                {t('onboarding.doTest')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
