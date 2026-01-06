import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { User, Camera, MapPin, Euro, Calendar, FileText, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { t } = useTranslation();

  // Mock profile data
  const profile = {
    name: 'Tu Nombre',
    photo: null,
    city: 'Madrid',
    neighborhoods: ['Malasaña', 'Lavapiés'],
    budget: { min: 350, max: 500 },
    moveInDate: '2025-02-01',
    languages: ['Español', 'Inglés'],
    bio: 'Busco habitación en Madrid. Trabajo en tecnología y me gusta la vida tranquila.',
    testCompleted: false,
    preferences: {
      cleaning: 4,
      schedule: 'morning',
      social: 'moderate',
      noise: 2,
      smoking: false,
      pets: false,
    },
  };

  const PreferenceItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
            <Button variant="outline" className="gap-2">
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
            <div className="relative h-48 bg-muted flex items-center justify-center">
              {profile.photo ? (
                <img 
                  src={profile.photo} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background border-2 border-dashed border-border mb-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Añadir foto
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {profile.budget.min}-{profile.budget.max}€/mes
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Desde {new Date(profile.moveInDate).toLocaleDateString('es')}
                  </div>
                </div>
              </div>

              {/* Neighborhoods */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Barrios preferidos</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.neighborhoods.map((n, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full">
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Idiomas</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((l, i) => (
                    <Badge key={i} variant="outline" className="rounded-full">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('profile.about')}</h3>
                <p className="text-sm">{profile.bio}</p>
              </div>
            </div>
          </motion.div>

          {/* Test Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card rounded-2xl p-6 mb-6 border-2 ${
              profile.testCompleted ? 'border-success/30' : 'border-accent/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                profile.testCompleted ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
              }`}>
                {profile.testCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('profile.testStatus')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {profile.testCompleted ? t('profile.testDone') : t('profile.testNotDone')}
                </p>
                {!profile.testCompleted && (
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

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4">{t('profile.preferences')}</h3>
            <div className="space-y-1">
              <PreferenceItem label="Limpieza" value={`${profile.preferences.cleaning}/5`} />
              <PreferenceItem label="Horario" value={profile.preferences.schedule === 'morning' ? 'Madrugador/a' : 'Nocturno/a'} />
              <PreferenceItem label="Social" value={profile.preferences.social === 'moderate' ? 'Moderado' : 'Muy social'} />
              <PreferenceItem label="Tolerancia al ruido" value={`${profile.preferences.noise}/5`} />
              <PreferenceItem label="Fumador/a" value={profile.preferences.smoking ? 'Sí' : 'No'} />
              <PreferenceItem label="Mascotas" value={profile.preferences.pets ? 'Sí' : 'No'} />
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
