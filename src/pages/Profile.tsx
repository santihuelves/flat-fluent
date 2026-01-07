import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { User, Camera, MapPin, Euro, Calendar, FileText, Edit2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';

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
  test_completed: boolean | null;
  onboarding_completed: boolean | null;
}

const PreferenceItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Si no existe perfil, crearlo automáticamente
      if (!data && !error) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'Usuario'
          })
          .select()
          .single();
        
        if (!insertError) {
          data = newProfile;
        } else {
          console.error('Error creating profile:', insertError);
        }
      }

      if (error) throw error;
      setProfile(data as ProfileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

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

  const mainPhoto = profile.photos?.[0];

  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4" />
              {t('profile.edit')}
            </Button>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden mb-6"
          >
            {/* Photo Section */}
            <div className="relative h-64 bg-muted flex items-center justify-center">
              {mainPhoto ? (
                <img 
                  src={mainPhoto} 
                  alt={profile.name || ''}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background border-2 border-dashed border-border mb-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                    <Camera className="h-4 w-4" />
                    {t('profile.addPhoto')}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-2xl font-bold mb-2">{profile.name || t('profile.noName')}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profile.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.city}
                    </div>
                  )}
                  {(profile.budget_min || profile.budget_max) && (
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {profile.budget_min || 0}-{profile.budget_max || 0}€/mes
                    </div>
                  )}
                  {profile.move_in_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('profile.availableFrom')} {new Date(profile.move_in_date).toLocaleDateString('es')}
                    </div>
                  )}
                </div>
              </div>

              {/* Neighborhoods */}
              {profile.neighborhoods && profile.neighborhoods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.preferredNeighborhoods')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.neighborhoods.map((n, i) => (
                      <Badge key={i} variant="secondary" className="rounded-full">
                        {n}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Occupation */}
              {profile.occupation && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.occupationLabel')}</h3>
                  <p className="text-sm">{profile.occupation}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Test Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card rounded-2xl p-6 mb-6 border-2 ${
              profile.test_completed ? 'border-success/30' : 'border-accent/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                profile.test_completed ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
              }`}>
                {profile.test_completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('profile.testStatus')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {profile.test_completed ? t('profile.testDone') : t('profile.testNotDone')}
                </p>
                {!profile.test_completed && (
                  <Link to="/test">
                    <Button variant="hero" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" />
                      {t('profile.takeTest')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Min Stay Info */}
          {profile.min_stay_months && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4">{t('profile.stayInfo')}</h3>
              <div className="space-y-1">
                <PreferenceItem label={t('profile.minStayLabel')} value={`${profile.min_stay_months} ${t('profile.months')}`} />
              </div>
            </motion.div>
          )}
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
