import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, Heart, Loader2, MapPin, MessageCircle, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PublicProfileData = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  languages: string[] | null;
  province_code: string | null;
  city: string | null;
  photo_url: string | null;
  selfie_verified: boolean | null;
  trust_score: number | null;
  trust_badge: string | null;
};

type ProfileDetailResponse = {
  ok: boolean;
  code?: string;
  user?: PublicProfileData;
};

type CompatibilityData = {
  ok: boolean;
  score?: number;
  breakdown?: {
    reasons?: string[];
    friction?: string;
  };
  code?: string;
};

const getName = (profile: PublicProfileData) => profile.display_name || profile.handle || 'Usuario';

const getErrorMessage = (code?: string) => {
  if (code === 'NOT_AUTHENTICATED') return 'Inicia sesión para ver este perfil.';
  if (code === 'NOT_FOUND') return 'Este perfil no existe.';
  if (code === 'HIDDEN') return 'Este perfil está oculto.';
  return 'No se pudo cargar el perfil.';
};

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompatibility, setIsLoadingCompatibility] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompatibility = useCallback(async (userId: string) => {
    setIsLoadingCompatibility(true);
    const { data, error: rpcError } = await supabase.rpc('convinter_compute_and_cache_guarded', {
      p_other_user: userId,
      p_detail_level: 1,
    });

    if (rpcError) {
      setCompatibility({ ok: false, code: rpcError.code });
      setIsLoadingCompatibility(false);
      return;
    }

    setCompatibility(data as unknown as CompatibilityData);
    setIsLoadingCompatibility(false);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setError('Perfil no encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('convinter_get_profile_detail', {
      p_user: id,
      p_locale: 'es',
    });

    if (rpcError) {
      console.error('Error loading public profile:', rpcError);
      setError('No se pudo cargar el perfil.');
      setIsLoading(false);
      return;
    }

    const result = data as unknown as ProfileDetailResponse;
    if (!result.ok || !result.user) {
      setError(getErrorMessage(result.code));
      setIsLoading(false);
      return;
    }

    setProfile(result.user);
    setIsLoading(false);
    loadCompatibility(result.user.user_id);
  }, [id, loadCompatibility]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMessage = async () => {
    if (!profile) return;

    const { data, error: rpcError } = await supabase.rpc('convinter_create_chat', {
      p_other: profile.user_id,
    });

    if (rpcError) {
      toast.error('No se pudo abrir el chat');
      return;
    }

    const result = data as unknown as { ok: boolean; code?: string };
    if (!result.ok) {
      toast.error(result.code === 'INVALID_TARGET' ? 'No puedes abrir chat contigo mismo' : 'No se pudo abrir el chat');
      return;
    }

    navigate(`/chat/${profile.user_id}`);
  };

  const handleRequestConsent = async () => {
    if (!profile) return;

    const { data, error: rpcError } = await supabase.rpc('convinter_request_consent', {
      p_to_user: profile.user_id,
      p_requested_level: 1,
    });

    if (rpcError) {
      toast.error('No se pudo enviar la solicitud');
      return;
    }

    const result = data as unknown as { ok: boolean };
    if (result.ok) {
      toast.success('Solicitud de compatibilidad enviada');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Perfil no encontrado'}</h1>
          <Button asChild>
            <Link to="/discover">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const name = getName(profile);
  const reasons = compatibility?.breakdown?.reasons ?? [];

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Link to="/discover">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile.photo_url ?? ''} alt={name} />
                  <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold">{name}</h1>
                      {profile.selfie_verified && <Shield className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      {profile.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.city}{profile.province_code ? `, ${profile.province_code}` : ''}
                        </span>
                      )}
                      <span>Confianza {profile.trust_score ?? 0}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoadingCompatibility ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : compatibility?.ok ? (
                      <>
                        <div className="text-3xl font-bold text-primary">{compatibility.score ?? 0}%</div>
                        <div className="text-sm text-muted-foreground">compatibilidad</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Compatibilidad pendiente de consentimiento
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleRequestConsent}>
                      <Heart className="mr-2 h-4 w-4" />
                      Pedir compatibilidad
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleMessage}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mensaje
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Sobre mí</h2>
              <p className="text-muted-foreground">{profile.bio || 'Este perfil todavía no tiene bio.'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Compatibilidad</h2>
              {compatibility?.ok ? (
                <div className="space-y-2">
                  {reasons.slice(0, 4).map((reason, index) => (
                    <div key={`${reason}-${index}`} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  {compatibility.breakdown?.friction && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>{compatibility.breakdown.friction}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Pide compatibilidad para comparar vuestros hábitos de convivencia.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Idiomas</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.languages?.length ? profile.languages : ['No indicado']).map((language) => (
                    <Badge key={language} variant="outline">{language}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Verificación</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={profile.selfie_verified ? 'default' : 'secondary'}>
                    {profile.selfie_verified ? 'Selfie verificado' : 'Selfie pendiente'}
                  </Badge>
                  {profile.trust_badge && profile.trust_badge !== 'none' && (
                    <Badge variant="outline">{profile.trust_badge}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
