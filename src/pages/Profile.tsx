import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { User, Camera, MapPin, FileText, Edit2, CheckCircle, AlertCircle, Loader2, Home, Briefcase, ShieldCheck, HeartHandshake, RotateCcw, Key, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { getLanguageLabel } from '@/lib/profileOptions';
import {
  decodeLivingTraits,
  getHouseholdSizeLabel,
  getYesNoLabel,
} from '@/lib/profileTraits';

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
  trust_score: number;
  trust_badge: string;
  selfie_verified: boolean;
  // Campos legacy de test; el test principal actual es full_test_completed.
  quick_test_completed?: boolean | null;
  quick_test_completed_at?: string | null;
  full_test_completed?: boolean | null;
  full_test_completed_at?: string | null;
  full_test_requested_at?: string | null;
  full_test_requested_by?: string | null;
  intentions?: ProfileIntention[];
}

export default function Profile() {
  useSEO({ page: 'profile', noIndex: true });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authFallbackName, setAuthFallbackName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('errors.auth'));
        navigate('/login');
        return;
      }

      setAuthFallbackName(
        typeof user.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name
          : user.email?.split('@')[0] || null
      );

      const { data: profileData, error } = await supabase
        .from('convinter_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      let data = profileData;

      // Si no existe perfil, crearlo automáticamente
      if (!data && !error) {
        const { data: newProfile, error: insertError } = await supabase
          .from('convinter_profiles')
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || t('profile.noName')
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast.error(t('profile.errorCreating'));
          throw insertError;
        }
        
        data = newProfile;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error(t('profile.errorLoading'));
        throw error;
      }

      const { data: baseProfileData, error: baseProfileError } = await supabase
        .from('profiles')
        .select('autonomous_community, budget_min, budget_max, lifestyle_tags, move_in_date, min_stay_months, occupation, photos, province, city, bio, languages, name')
        .eq('id', user.id)
        .maybeSingle();

      if (baseProfileError) {
        console.warn('Error fetching base profile:', baseProfileError);
      }
      
      const { data: intentionsData, error: intentionsError } = await supabase.rpc('convinter_get_intentions', {
        p_profile_id: user.id,
      });

      if (intentionsError) {
        console.warn('Error loading profile intentions:', intentionsError);
      }

      const intentionsResult = intentionsData as unknown as { ok?: boolean; intentions?: ProfileIntention[] } | null;

      setProfile({
        ...(data as ProfileData),
        autonomous_community: baseProfileData?.autonomous_community ?? null,
        budget_min: baseProfileData?.budget_min ?? null,
        budget_max: baseProfileData?.budget_max ?? null,
        lifestyle_tags: baseProfileData?.lifestyle_tags ?? null,
        move_in_date: baseProfileData?.move_in_date ?? null,
        min_stay_months: baseProfileData?.min_stay_months ?? null,
        occupation: baseProfileData?.occupation ?? null,
        photos: baseProfileData?.photos ?? null,
        province_code: data?.province_code ?? baseProfileData?.province ?? null,
        city: data?.city ?? baseProfileData?.city ?? null,
        bio: data?.bio ?? baseProfileData?.bio ?? null,
        display_name: data?.display_name ?? baseProfileData?.name ?? null,
        languages: data?.languages ?? baseProfileData?.languages ?? null,
        intentions: intentionsResult?.ok ? intentionsResult.intentions ?? [] : [],
      });
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">{t('profile.notFound')}</p>
        </div>
      </Layout>
    );
  }

  const displayName = profile.display_name || profile.handle || authFallbackName || t('profile.noName');
  const lifestyleTags = profile.lifestyle_tags ?? [];
  const showInclusiveBadge = lifestyleTags.includes('inclusive_lgtbiq_friendly');
  const primaryProfilePhoto =
    profile.photos?.find((photo): photo is string => typeof photo === 'string' && photo.length > 0) ||
    profile.photo_url ||
    null;
  const locationBits = [profile.city, profile.province_code, profile.autonomous_community].filter(Boolean);
  const locationLabel = locationBits.length > 0 ? locationBits.join(' - ') : null;
  const livingTraits = decodeLivingTraits(lifestyleTags);

  const automaticCompatibilityTags = lifestyleTags
    .filter((tag) => tag.startsWith('auto_'))
    .map((tag) => tag.replace('auto_', '').replace(/_/g, ' '))
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));
  const livingTraitLabels = [
    getYesNoLabel(livingTraits.isSmoker, 'Fuma', 'No fumador'),
    getYesNoLabel(livingTraits.hasPet, 'Convive con mascota', 'Sin mascota'),
    getHouseholdSizeLabel(livingTraits.householdSize),
    getYesNoLabel(livingTraits.includesMinor, 'Convive con menor', 'Sin menores en convivencia'),
  ].filter((label): label is string => Boolean(label));
  const visibleCompatibilityTags = Array.from(new Set([...automaticCompatibilityTags, ...livingTraitLabels])).slice(0, 8);

  const hasLivingProfile = Boolean(
    profile.bio ||
      profile.occupation ||
      profile.languages?.length ||
      locationLabel ||
      visibleCompatibilityTags.length > 0
  );

  const basicInfoCards = [
    {
      key: 'occupation',
      icon: Briefcase,
      label: 'Ocupación',
      value: profile.occupation,
    },
    {
      key: 'location',
      icon: MapPin,
      label: 'Ubicación aproximada',
      value: locationLabel,
    },
  ].filter((item) => Boolean(item.value));

  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Mi perfil</h1>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/my-listings">
                  <Home className="h-4 w-4" />
                  Mis anuncios
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
                <Edit2 className="h-4 w-4" />
                {t('profile.edit')}
              </Button>
            </div>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden mb-6"
          >
            {/* Photo Section */}
            {primaryProfilePhoto ? (
              <div className="relative aspect-video bg-muted">
                <img 
                  src={primaryProfilePhoto} 
                  alt={profile.display_name || 'Profile'}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background border-2 border-dashed border-border mb-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                    <Camera className="h-4 w-4" />
                    {t('profile.addPhoto')}
                  </Button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {displayName}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profile.selfie_verified && (
                    <Badge variant="secondary" className="rounded-full">
                      {t('profile.verified')}
                    </Badge>
                  )}
                  {profile.trust_badge && profile.trust_badge !== 'none' && (
                    <Badge variant="outline" className="rounded-full">
                      {profile.trust_badge === 'gold' && t('profile.trustBadges.gold')}
                      {profile.trust_badge === 'silver' && t('profile.trustBadges.silver')}
                      {profile.trust_badge === 'bronze' && t('profile.trustBadges.bronze')}
                    </Badge>
                  )}
                  {showInclusiveBadge && (
                    <Badge variant="outline" className="rounded-full">
                      <HeartHandshake className="mr-1 h-3 w-3" />
                      LGTBIQ+ friendly
                    </Badge>
                  )}
                </div>
              </div>

              {visibleCompatibilityTags.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                    <ShieldCheck className="h-4 w-4" />
                    Convivencia opcional
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleCompatibilityTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Estos rasgos solo se usan para orientar compatibilidad si quieres convivir o conocer personas afines.
                  </p>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Sobre mí</h3>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              {basicInfoCards.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Datos básicos</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {basicInfoCards.map(({ key, icon: Icon, label, value }) => (
                      <div key={key} className="rounded-xl border border-border/60 bg-background/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                        <p className="text-sm font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.languagesLabel')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((l, i) => (
                      <Badge key={i} variant="outline" className="rounded-full">
                        {getLanguageLabel(l)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* Compatibility profile and test status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card rounded-2xl p-6 mb-6 border-2 ${
              profile.full_test_completed ? 'border-success/30' : hasLivingProfile ? 'border-primary/30' : 'border-accent/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                profile.full_test_completed ? 'bg-success/10 text-success' : hasLivingProfile ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
              }`}>
                {profile.full_test_completed || hasLivingProfile ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('profile.testStatus')}</h3>
                
                {/* Living profile status */}
                <div className="mt-2">
                  {hasLivingProfile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{t('profile.livingProfileCompleted')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('profile.livingProfilePending')}</span>
                    </div>
                  )}
                </div>

                {/* Compatibility test status */}
                <div className="mt-2">
                  {profile.full_test_completed ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{t('profile.testFullCompleted')}</span>
                      {profile.full_test_completed_at && (
                        <span className="text-muted-foreground text-xs">
                          ({new Date(profile.full_test_completed_at).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('profile.testFullPending')}</span>
                    </div>
                  )}
                </div>

                {/* Full Test Request Notification */}
                {profile.full_test_requested_at && !profile.full_test_completed && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-primary font-medium">
                      {t('profile.testFullRequested')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('profile.testFullRequestedDate')} {new Date(profile.full_test_requested_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {profile.full_test_completed ? (
                    <Link to="/test">
                      <Button variant="outline" size="sm" className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Repetir test
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/test">
                      <Button variant="hero" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('profile.completeFullTest')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Home className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold">Anuncios</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tus anuncios van separados del perfil personal. Puedes ofrecer una habitación, preparar una búsqueda o gestionar lo que ya tienes publicado.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/my-listings">Ver mis anuncios</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/create-listing?type=offer_room">
                      <Key className="h-4 w-4" />
                      Ofrezco habitación
                    </Link>
                  </Button>
                  <Button asChild variant="hero" size="sm" className="gap-2">
                    <Link to="/create-listing?type=seek_room">
                      <Search className="h-4 w-4" />
                      Busco habitación
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Edit Sheet */}
      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onProfileUpdated={fetchProfile}
      />
    </Layout>
  );
}
