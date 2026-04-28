import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { User, Camera, MapPin, FileText, Edit2, CheckCircle, AlertCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { toast } from 'sonner';

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
  trust_score: number;
  trust_badge: string;
  selfie_verified: boolean;
  // Campos opcionales para test exhaustivo (pueden no existir en la DB aún)
  quick_test_completed?: boolean | null;
  quick_test_completed_at?: string | null;
  full_test_completed?: boolean | null;
  full_test_completed_at?: string | null;
  full_test_requested_at?: string | null;
  full_test_requested_by?: string | null;
}

export default function Profile() {
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
      
      setProfile(data as ProfileData);
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

  

  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
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
            {profile.photo_url ? (
              <div className="relative aspect-video bg-muted">
                <img 
                  src={profile.photo_url} 
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
                  {profile.display_name || profile.handle || authFallbackName || t('profile.noName')}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profile.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.city}
                    </div>
                  )}
                  {profile.selfie_verified && (
                    <Badge variant="secondary" className="rounded-full">
                      ✓ {t('profile.verified')}
                    </Badge>
                  )}
                  {profile.trust_badge && profile.trust_badge !== 'none' && (
                    <Badge variant="outline" className="rounded-full">
                      {profile.trust_badge === 'gold' && `🏆 ${t('profile.trustBadges.gold')}`}
                      {profile.trust_badge === 'silver' && `🥈 ${t('profile.trustBadges.silver')}`}
                      {profile.trust_badge === 'bronze' && `🥉 ${t('profile.trustBadges.bronze')}`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.languagesLabel')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((l, i) => (
                      <Badge key={i} variant="outline" className="rounded-full">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.about')}</h3>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              {/* Trust Score */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.trustScore')}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${profile.trust_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{profile.trust_score}/100</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Test Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card rounded-2xl p-6 mb-6 border-2 ${
              profile.full_test_completed ? 'border-success/30' : profile.quick_test_completed ? 'border-primary/30' : 'border-accent/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                profile.full_test_completed ? 'bg-success/10 text-success' : profile.quick_test_completed ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
              }`}>
                {profile.full_test_completed || profile.quick_test_completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('profile.testStatus')}</h3>
                
                {/* Quick Test Status */}
                <div className="mt-2">
                  {profile.quick_test_completed ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{t('profile.testQuickCompleted')}</span>
                      {profile.quick_test_completed_at && (
                        <span className="text-muted-foreground text-xs">
                          ({new Date(profile.quick_test_completed_at).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('profile.testQuickPending')}</span>
                    </div>
                  )}
                </div>

                {/* Full Test Status */}
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
                      💬 {t('profile.testFullRequested')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('profile.testFullRequestedDate')} {new Date(profile.full_test_requested_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {!profile.quick_test_completed && (
                    <Link to="/test">
                      <Button variant="hero" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('profile.completeQuickTest')}
                      </Button>
                    </Link>
                  )}
                  {profile.quick_test_completed && !profile.full_test_completed && (
                    <Link to="/test">
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('profile.completeFullTest')}
                      </Button>
                    </Link>
                  )}
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
