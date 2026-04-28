import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Search, MapPin, Euro, Filter, Heart, X, Star, ChevronDown, RotateCcw, Lock, Loader2, FileText, Home, Key, Users, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { IntentionBadges } from '@/components/IntentionBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  photo_url: string | null;
  city: string | null;
  province_code: string | null;
  trust_score: number;
  trust_badge: string;
  selfie_verified: boolean;
  bio: string | null;
  languages: string[];
  quick_test_completed?: boolean;
  full_test_completed?: boolean;
  intentions?: Array<{
    intention_type: 'seek_room' | 'offer_room' | 'seek_flatmate';
    is_primary: boolean;
    urgency: string;
  }>;
}

interface CompatibilityData {
  score: number;
  breakdown: {
    reasons?: string[];
    friction?: string;
  };
  hasConsent: boolean;
}

type IntentionType = NonNullable<ProfileData['intentions']>[number]['intention_type'];
type RequestState = 'idle' | 'sending' | 'sent';

// Spanish cities for filter
const spanishCities = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante',
  'A Coruña', 'Granada', 'San Sebastián', 'Valladolid', 'Vitoria'
];

export default function Discover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  // Data states
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [compatibilityCache, setCompatibilityCache] = useState<Record<string, CompatibilityData>>({});
  const [requestStates, setRequestStates] = useState<Record<string, RequestState>>({});
  const [fullTestRequests, setFullTestRequests] = useState<Record<string, RequestState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompatibility, setIsLoadingCompatibility] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([200, 800]);
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [selectedIntentions, setSelectedIntentions] = useState<IntentionType[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [intentionOpen, setIntentionOpen] = useState(false);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('convinter_search_profiles', {
        p_city: selectedCity,
        p_trust_min: minTrustScore > 0 ? minTrustScore : null,
        p_limit: 50
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; items: ProfileData[] };
      if (result.ok && result.items) {
        setProfiles(result.items);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Error al cargar perfiles');
    } finally {
      setIsLoading(false);
    }
  }, [minTrustScore, selectedCity]);

  // Load profiles from backend
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Load compatibility for current profile
  const loadCompatibility = useCallback(async (userId: string) => {
    if (compatibilityCache[userId]) return;
    
    setIsLoadingCompatibility(true);
    try {
      const { data, error } = await supabase.rpc('convinter_compute_and_cache_guarded', {
        p_other_user: userId,
        p_detail_level: 1
      });

      if (error) {
        // If no consent, show locked state
        if (error.message.includes('consent') || error.code === 'P0001') {
          setCompatibilityCache(prev => ({
            ...prev,
            [userId]: { score: 0, breakdown: {}, hasConsent: false }
          }));
        } else {
          throw error;
        }
      } else {
        const result = data as unknown as { ok: boolean; score: number; breakdown: Record<string, unknown> };
        if (result.ok) {
          setCompatibilityCache(prev => ({
            ...prev,
            [userId]: { 
              score: result.score, 
              breakdown: result.breakdown as CompatibilityData['breakdown'],
              hasConsent: true 
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading compatibility:', error);
    } finally {
      setIsLoadingCompatibility(false);
    }
  }, [compatibilityCache]);

  // Filter profiles by search term and intentions
  const filteredProfiles = useMemo(() => profiles.filter(profile => {
    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = profile.display_name?.toLowerCase().includes(search) ||
                           profile.handle?.toLowerCase().includes(search) ||
                           profile.city?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    // Intentions filter
    if (selectedIntentions.length > 0) {
      const profileIntentionTypes = profile.intentions?.map(i => i.intention_type) || [];
      const hasMatchingIntention = selectedIntentions.some(selected => 
        profileIntentionTypes.includes(selected)
      );
      if (!hasMatchingIntention) return false;
    }
    
    return true;
  }), [profiles, searchTerm, selectedIntentions]);

  // Load compatibility when current profile changes
  useEffect(() => {
    const currentProfile = filteredProfiles[currentIndex];
    if (currentProfile) {
      loadCompatibility(currentProfile.user_id);
    }
  }, [currentIndex, filteredProfiles, loadCompatibility]);

  const currentProfile = filteredProfiles[currentIndex];
  const currentCompatibility = currentProfile ? compatibilityCache[currentProfile.user_id] : null;
  const currentRequestState = currentProfile ? requestStates[currentProfile.user_id] ?? 'idle' : 'idle';
  const currentFullTestRequestState = currentProfile ? fullTestRequests[currentProfile.user_id] ?? 'idle' : 'idle';

  const handleRequestConsent = async () => {
    if (!currentProfile) return;
    if ((requestStates[currentProfile.user_id] ?? 'idle') !== 'idle') return;

    setRequestStates(prev => ({ ...prev, [currentProfile.user_id]: 'sending' }));
    
    try {
      const { data, error } = await supabase.rpc('convinter_request_consent', {
        p_to_user: currentProfile.user_id,
        p_requested_level: 1
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; code?: string };
      if (result.ok) {
        setRequestStates(prev => ({ ...prev, [currentProfile.user_id]: 'sent' }));
        toast.success('Solicitud de compatibilidad enviada');
        return;
      }

      if (result.code === 'ALREADY_REQUESTED') {
        setRequestStates(prev => ({ ...prev, [currentProfile.user_id]: 'sent' }));
        toast.info('Ya habias enviado esta solicitud');
        return;
      }

      throw new Error(result.code || 'REQUEST_FAILED');
    } catch (error) {
      console.error('Error requesting consent:', error);
      toast.error('Error al enviar solicitud');
      setRequestStates(prev => ({ ...prev, [currentProfile.user_id]: 'idle' }));
    }
  };

  const handleRequestFullTest = async () => {
    if (!currentProfile) return;
    if ((fullTestRequests[currentProfile.user_id] ?? 'idle') !== 'idle') return;

    setFullTestRequests(prev => ({ ...prev, [currentProfile.user_id]: 'sending' }));
    
    try {
      const { data, error } = await supabase.rpc('convinter_request_full_test', {
        p_target: currentProfile.user_id,
      });

      if (error) throw error;

      const result = data as unknown as { ok: boolean; code?: string };
      if (!result.ok) throw new Error(result.code || 'REQUEST_FAILED');

      setFullTestRequests(prev => ({ ...prev, [currentProfile.user_id]: 'sent' }));
      toast.success('Solicitud de test exhaustivo enviada');
    } catch (error) {
      console.error('Error requesting full test:', error);
      toast.error('Error al solicitar test exhaustivo');
      setFullTestRequests(prev => ({ ...prev, [currentProfile.user_id]: 'idle' }));
    }
  };

  const handleLike = () => {
    if (filteredProfiles.length === 0) return;
    setDirection('right');
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % filteredProfiles.length);
    }, 300);
  };

  const handlePass = () => {
    if (filteredProfiles.length === 0) return;
    setDirection('left');
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % filteredProfiles.length);
    }, 300);
  };

  const handleIntentionToggle = (intentionType: IntentionType) => {
    setSelectedIntentions(prev => 
      prev.includes(intentionType)
        ? prev.filter(i => i !== intentionType)
        : [...prev, intentionType]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity(null);
    setPriceRange([200, 800]);
    setMinTrustScore(0);
    setSelectedIntentions([]);
  };

  const hasActiveFilters = searchTerm || selectedCity || priceRange[0] !== 200 || priceRange[1] !== 800 || minTrustScore > 0 || selectedIntentions.length > 0;

  const getTrustBadgeColor = (badge: string) => {
    switch (badge) {
      case 'gold': return 'bg-yellow-500/20 text-yellow-600';
      case 'silver': return 'bg-gray-400/20 text-gray-600';
      case 'bronze': return 'bg-orange-500/20 text-orange-600';
      case 'verified': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('common.search') + '...'} 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* City Selector */}
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[120px] justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedCity || 'Toda España'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-popover z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar ciudad..." />
                  <CommandList>
                    <CommandEmpty>No encontrada</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedCity(null);
                          setCityOpen(false);
                        }}
                      >
                        Toda España
                      </CommandItem>
                      {spanishCities.map((city) => (
                        <CommandItem
                          key={city}
                          onSelect={() => {
                            setSelectedCity(city);
                            setCityOpen(false);
                          }}
                        >
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Intention Type Filter */}
            <Popover open={intentionOpen} onOpenChange={setIntentionOpen}>
              <PopoverTrigger asChild>
                <Button variant={selectedIntentions.length > 0 ? "default" : "outline"} className="gap-2 min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {selectedIntentions.length === 0 
                        ? t('discover.filters.allIntentions')
                        : selectedIntentions.length === 1
                          ? t(`discover.filters.intentions.${selectedIntentions[0]}`)
                          : `${selectedIntentions.length} ${t('discover.filters.selected')}`
                      }
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] bg-popover z-50" align="start">
                <div className="space-y-3">
                  <div className="font-semibold text-sm">{t('discover.filters.intentionTitle')}</div>
                  {([
                    { type: 'seek_room', icon: Home, label: t('discover.filters.intentions.seek_room') },
                    { type: 'offer_room', icon: Key, label: t('discover.filters.intentions.offer_room') },
                    { type: 'seek_flatmate', icon: Users, label: t('discover.filters.intentions.seek_flatmate') },
                  ] satisfies Array<{ type: IntentionType; icon: LucideIcon; label: string }>).map(({ type, icon: Icon, label }) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedIntentions.includes(type)}
                        onCheckedChange={() => handleIntentionToggle(type)}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Price Range Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    <span>{priceRange[0]}-{priceRange[1]}€</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] bg-popover z-50" align="start">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Rango de presupuesto</span>
                    <span className="font-medium">{priceRange[0]}€ - {priceRange[1]}€</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={100}
                    max={1000}
                    step={50}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100€</span>
                    <span>1000€</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Trust Score Filter */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant={minTrustScore > 0 ? "default" : "outline"} size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {minTrustScore > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                      ✓
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] bg-popover z-50" align="end">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Confianza mínima</span>
                    <span className="font-medium">{minTrustScore}</span>
                  </div>
                  <Slider
                    value={[minTrustScore]}
                    onValueChange={(value) => setMinTrustScore(value[0])}
                    min={0}
                    max={100}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Todos</span>
                    <span>100</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6 text-sm text-muted-foreground text-center">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando perfiles...
            </span>
          ) : hasActiveFilters 
            ? `Mostrando ${currentIndex + 1} de ${filteredProfiles.length} perfiles`
            : `${profiles.length} perfiles disponibles`
          }
        </div>

        {/* Profile Card */}
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Buscando perfiles compatibles...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No hay perfiles</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron perfiles con estos filtros. Prueba a ajustar los criterios de búsqueda.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
          ) : currentProfile && (
            <motion.div
              key={currentProfile.user_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
                rotate: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Photo */}
              <div className="relative h-80">
                {currentProfile.photo_url ? (
                  <img 
                    src={currentProfile.photo_url} 
                    alt={currentProfile.display_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-8xl">👤</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Score Badge */}
                <div className="absolute top-4 right-4">
                  {isLoadingCompatibility ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : currentCompatibility?.hasConsent ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-success text-success-foreground font-semibold">
                      <Star className="h-4 w-4" />
                      {currentCompatibility.score}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-semibold">
                      <Lock className="h-4 w-4" />
                      Oculto
                    </div>
                  )}
                </div>

                {/* Trust Badge */}
                {currentProfile.trust_badge !== 'none' && (
                  <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium ${getTrustBadgeColor(currentProfile.trust_badge)}`}>
                    {currentProfile.trust_badge === 'verified' && '✓ Verificado'}
                    {currentProfile.trust_badge === 'gold' && '🏆 Gold'}
                    {currentProfile.trust_badge === 'silver' && '🥈 Silver'}
                    {currentProfile.trust_badge === 'bronze' && '🥉 Bronze'}
                  </div>
                )}

                {/* Name & Info */}
                <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                  <h2 className="text-2xl font-bold">
                    {currentProfile.display_name || currentProfile.handle || 'Usuario'}
                  </h2>
                  {currentProfile.city && (
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <MapPin className="h-4 w-4" />
                      {currentProfile.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Intentions */}
                {currentProfile.intentions && currentProfile.intentions.length > 0 && (
                  <div>
                    <IntentionBadges intentions={currentProfile.intentions} variant="compact" />
                  </div>
                )}

                {/* Trust & Verification Tags */}
                <div className="flex flex-wrap gap-2">
                  {currentProfile.selfie_verified && (
                    <Badge variant="secondary" className="rounded-full">
                      ✓ Selfie verificado
                    </Badge>
                  )}
                  {currentProfile.full_test_completed ? (
                    <Badge variant="default" className="rounded-full bg-success/20 text-success border-success/30">
                      ✓ Test exhaustivo
                    </Badge>
                  ) : currentProfile.quick_test_completed ? (
                    <Badge variant="default" className="rounded-full bg-primary/20 text-primary border-primary/30">
                      ✓ Test rápido
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full text-muted-foreground">
                      Sin test
                    </Badge>
                  )}
                  {currentProfile.languages?.map((lang, i) => (
                    <Badge key={i} variant="outline" className="rounded-full">
                      {lang}
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                {currentProfile.bio && (
                  <p className="text-sm text-muted-foreground">
                    {currentProfile.bio}
                  </p>
                )}

                {/* Compatibility Details or Request */}
                {currentCompatibility?.hasConsent ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {t('matches.reasons')}
                    </h3>
                    {currentCompatibility.breakdown.reasons?.length ? (
                      <ul className="space-y-1">
                        {currentCompatibility.breakdown.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-success">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Compatibilidad calculada basada en vuestras respuestas del test.
                      </p>
                    )}

                    {/* Friction Warning */}
                    {currentCompatibility.breakdown.friction && (
                      <div className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                        <h3 className="font-semibold text-sm text-accent-foreground mb-1">
                          {t('matches.friction')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCompatibility.breakdown.friction}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Solicita ver la compatibilidad detallada
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestConsent}
                      disabled={currentRequestState !== 'idle'}
                      className="gap-2"
                    >
                      {currentRequestState === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {currentRequestState === 'sent' ? 'Solicitud enviada' : currentRequestState === 'sending' ? 'Enviando...' : 'Solicitar compatibilidad'}
                    </Button>
                  </div>
                )}

                {/* Request Full Test */}
                {currentProfile.quick_test_completed && !currentProfile.full_test_completed && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Este usuario solo ha completado el test rápido. Puedes pedirle que complete el exhaustivo para mayor precisión.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestFullTest}
                      disabled={currentFullTestRequestState !== 'idle'}
                      className="gap-2"
                    >
                      {currentFullTestRequestState === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {currentFullTestRequestState === 'sent' ? 'Solicitud enviada' : currentFullTestRequestState === 'sending' ? 'Enviando...' : 'Solicitar test exhaustivo'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-6 p-6 pt-0">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-16 w-16 rounded-full border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                  onClick={handlePass}
                >
                  <X className="h-8 w-8 text-destructive" />
                </Button>
                <Button 
                  variant="hero" 
                  size="icon" 
                  className="h-20 w-20 rounded-full"
                  onClick={handleLike}
                >
                  <Heart className="h-10 w-10" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
