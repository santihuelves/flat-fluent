import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, Heart, Loader2, MapPin, MessageCircle, Shield, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SafetyActions } from '@/components/SafetyActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

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

type CompatibilityMismatch = {
  question_id?: string;
  a?: string;
  b?: string;
  sim?: number;
};

type CompatibilityData = {
  ok: boolean;
  score?: number | null;
  can_show_score?: boolean;
  common_questions?: number;
  breakdown?: {
    reasons?: string[];
    friction?: string;
    common_questions?: number;
    mismatches?: CompatibilityMismatch[];
  };
  code?: string;
  message?: string;
  cached?: boolean;
  detail_level?: number;
  computed_at?: string;
};

type RpcInvoker = (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>;

type ConsentStateValue = 'none' | 'outgoing_pending' | 'incoming_pending' | 'active' | 'rejected';

type ConsentStateData = {
  ok: boolean;
  code?: string;
  state?: ConsentStateValue;
  request_id?: number | null;
  consent_level?: number | null;
  requested_level?: number | null;
};

type RequestState = 'idle' | 'sending' | 'sent';

const rpc = supabase.rpc.bind(supabase) as unknown as RpcInvoker;

const getName = (profile: PublicProfileData) => profile.display_name || profile.handle || 'Usuario';

const getCompatibilityDetailLevel = (consentLevel?: number | null) => (
  Number(consentLevel ?? 0) >= 2 ? 2 : 1
);

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
  const [isLoadingConsentState, setIsLoadingConsentState] = useState(false);
  const [consentRequestState, setConsentRequestState] = useState<RequestState>('idle');
  const [consentState, setConsentState] = useState<ConsentStateData | null>(null);
  const [isRespondingConsent, setIsRespondingConsent] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const profileStructuredData = useMemo(() => {
    if (!profile) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: getName(profile),
      description: profile.bio || 'Perfil publico en Convinter',
      image: profile.photo_url || undefined,
      address: profile.city ? {
        '@type': 'PostalAddress',
        addressLocality: profile.city,
        addressRegion: profile.province_code || undefined,
        addressCountry: 'ES',
      } : undefined,
    };
  }, [profile]);

  useSEO({
    page: 'profile',
    fallbackTitle: profile ? `${getName(profile)} en Convinter` : undefined,
    fallbackDescription: profile?.bio || (profile?.city ? `Perfil publico de Convinter en ${profile.city}.` : undefined),
    image: profile?.photo_url,
    type: 'profile',
    structuredData: profileStructuredData,
  });

  const loadBlockState = useCallback(async (targetUserId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;
    if (!currentUserId || currentUserId === targetUserId) return false;

    const { data, error: blockError } = await supabase.rpc('convinter_is_blocked', {
      p_user_a: currentUserId,
      p_user_b: targetUserId,
    });

    if (blockError) {
      console.warn('Error loading block state:', blockError);
      return false;
    }

    const blocked = Boolean(data);
    setIsBlocked(blocked);
    return blocked;
  }, []);

  const loadCompatibility = useCallback(async (userId: string, detailLevel = 1) => {
    setIsLoadingCompatibility(true);
    const { data, error: rpcError } = await supabase.rpc('convinter_compute_and_cache_guarded', {
      p_other_user: userId,
      p_detail_level: detailLevel,
    });

    if (rpcError) {
      console.warn('Error computing compatibility:', rpcError);
      setCompatibility({ ok: false, code: rpcError.code });
      setIsLoadingCompatibility(false);
      return;
    }

    const result = data as unknown as CompatibilityData;
    if (!result.ok) {
      console.warn('Compatibility calculation returned non-ok result:', result);
    }

    setCompatibility(result);
    setIsLoadingCompatibility(false);
  }, []);

  const loadConsentState = useCallback(async (userId: string) => {
    setIsLoadingConsentState(true);

    const { data, error: rpcError } = await rpc('convinter_get_consent_state', {
      p_other_user: userId,
    });

    if (rpcError) {
      console.warn('Error loading consent state:', rpcError);
      const fallback: ConsentStateData = { ok: false, code: rpcError.code };
      setConsentState(fallback);
      setConsentRequestState('idle');
      setCompatibility(null);
      setIsLoadingConsentState(false);
      return fallback;
    }

    const result = data as ConsentStateData;
    setConsentState(result);
    setConsentRequestState(result.state === 'outgoing_pending' ? 'sent' : 'idle');
    if (result.state !== 'active') {
      setCompatibility(null);
    }
    setIsLoadingConsentState(false);
    return result;
  }, []);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setError('Perfil no encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompatibility(null);
    setConsentState(null);
    setConsentRequestState('idle');

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
    const blocked = await loadBlockState(result.user.user_id);
    if (blocked) {
      setCompatibility({ ok: false, code: 'BLOCKED' });
      return;
    }

    const state = await loadConsentState(result.user.user_id);
    if (state.state === 'active') {
      void loadCompatibility(result.user.user_id, getCompatibilityDetailLevel(state.consent_level));
    }
  }, [id, loadBlockState, loadCompatibility, loadConsentState]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMessage = async () => {
    if (!profile) return;
    if (isBlocked) {
      toast.info('Has bloqueado a este usuario.');
      return;
    }
    setIsOpeningChat(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('convinter_create_chat', {
        p_other: profile.user_id,
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as { ok: boolean; code?: string };
      if (!result.ok) {
        toast.error(result.code === 'INVALID_TARGET' ? 'No puedes abrir chat contigo mismo' : 'No se pudo abrir el chat');
        return;
      }

      navigate(`/chat/${profile.user_id}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('No se pudo abrir el chat');
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleRequestConsent = async () => {
    if (!profile) return;
    if (consentRequestState !== 'idle') return;
    if (isBlocked) {
      toast.info('Has bloqueado a este usuario.');
      return;
    }

    setConsentRequestState('sending');

    try {
      const { data, error: rpcError } = await rpc('convinter_request_consent', {
        p_to_user: profile.user_id,
        p_requested_level: 1,
      });

      if (rpcError) throw rpcError;

      const result = data as ConsentStateData;
      if (result.ok) {
        const nextState = result.state ?? (
          result.code === 'ALREADY_CONNECTED' ? 'active' :
          result.code === 'PENDING_INCOMING' ? 'incoming_pending' :
          result.code === 'PREVIOUSLY_REJECTED' ? 'rejected' :
          'outgoing_pending'
        );

        setConsentState({ ...result, state: nextState });

        if (nextState === 'active') {
          setConsentRequestState('idle');
          toast.info('Ya teneis compatibilidad activa');
          await loadCompatibility(profile.user_id, getCompatibilityDetailLevel(result.consent_level));
          return;
        }

        if (nextState === 'incoming_pending') {
          setConsentRequestState('idle');
          setCompatibility(null);
          toast.info('Ya tienes una solicitud recibida de este usuario');
          return;
        }

        if (nextState === 'rejected') {
          setConsentRequestState('idle');
          setCompatibility(null);
          toast.info('La solicitud fue rechazada anteriormente');
          return;
        }

        setConsentRequestState('sent');
        setCompatibility(null);
        toast.success(result.code === 'PENDING_OUTGOING' ? 'Ya habias enviado esta solicitud' : 'Solicitud de compatibilidad enviada');
        return;
      }

      if (result.code === 'ALREADY_REQUESTED' || result.code === 'PENDING_OUTGOING') {
        setConsentRequestState('sent');
        setConsentState({ ok: true, state: 'outgoing_pending', code: result.code });
        toast.info('Ya habias enviado esta solicitud');
        return;
      }

      throw new Error(result.code || 'REQUEST_FAILED');
    } catch (error) {
      console.error('Error requesting consent:', error);
      toast.error('No se pudo enviar la solicitud');
      setConsentRequestState('idle');
    }
  };

  const handleRespondConsent = async (accept: boolean) => {
    if (!profile || !consentState?.request_id) return;
    setIsRespondingConsent(true);

    const { data, error: rpcError } = await supabase.rpc('convinter_respond_consent_request', {
      p_request_id: consentState.request_id,
      p_accept: accept,
    });

    if (rpcError) {
      console.error('Error responding consent request:', rpcError);
      toast.error('No se pudo responder la solicitud');
      setIsRespondingConsent(false);
      return;
    }

    const result = data as unknown as { ok: boolean; code?: string; consent_level?: number };
    if (!result.ok) {
      toast.error(result.code === 'REQUEST_NOT_FOUND' ? 'La solicitud ya no existe' : 'No se pudo responder la solicitud');
      setIsRespondingConsent(false);
      return;
    }

    if (accept) {
      setConsentState({
        ok: true,
        state: 'active',
        request_id: consentState.request_id,
        consent_level: result.consent_level ?? consentState.requested_level ?? 1,
      });
      toast.success('Solicitud aceptada');
      await loadCompatibility(profile.user_id, getCompatibilityDetailLevel(result.consent_level ?? consentState.requested_level ?? 1));
    } else {
      setConsentState({
        ok: true,
        state: 'rejected',
        request_id: consentState.request_id,
        consent_level: 0,
      });
      setCompatibility(null);
      toast.success('Solicitud rechazada');
    }

    setIsRespondingConsent(false);
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
  const consentStatus = consentState?.state ?? 'none';
  const hasActiveConsent = consentStatus === 'active';
  const commonQuestions = typeof compatibility?.common_questions === 'number'
    ? compatibility.common_questions
    : typeof compatibility?.breakdown?.common_questions === 'number'
    ? compatibility.breakdown.common_questions
    : null;
  const hasEnoughCommonQuestions = typeof commonQuestions === 'number' && commonQuestions >= 8;
  const hasDetailedCompatibilityScore =
    compatibility?.ok === true &&
    compatibility.can_show_score !== false &&
    hasEnoughCommonQuestions &&
    typeof compatibility.score === 'number' &&
    Number.isFinite(compatibility.score);
  const hasCompatibilityResult = hasActiveConsent && hasDetailedCompatibilityScore;
  const hasCompatibilityError = hasActiveConsent && compatibility?.ok === false;
  const hasInsufficientCommonAnswers =
    (hasCompatibilityError && compatibility?.code === 'INSUFFICIENT_COMMON_ANSWERS') ||
    (hasActiveConsent && compatibility?.ok === true && commonQuestions !== null && !hasEnoughCommonQuestions);
  const compatibilityScore = typeof compatibility?.score === 'number' && Number.isFinite(compatibility.score)
    ? Math.round(compatibility.score)
    : null;
  const mismatches = compatibility?.breakdown?.mismatches ?? [];
  const isIncomingRequest = consentStatus === 'incoming_pending';
  const canRequestConsent = !isBlocked && !isLoadingConsentState && consentStatus === 'none' && consentRequestState === 'idle';
  const consentMessage = (() => {
    if (isBlocked) return 'Usuario bloqueado';
    if (isLoadingConsentState) return 'Comprobando consentimiento...';
    if (hasCompatibilityResult) return 'Compatibilidad visible';
    if (hasInsufficientCommonAnswers) return 'No hay suficientes respuestas comunes para calcular la compatibilidad detallada.';
    if (hasCompatibilityError) return 'Compatibilidad activa, pero todavia no se ha podido calcular el porcentaje.';
    if (hasActiveConsent) return 'Calculando compatibilidad...';
    if (consentStatus === 'outgoing_pending') return 'Solicitud enviada';
    if (isIncomingRequest) return 'Solicitud de compatibilidad recibida';
    if (consentStatus === 'rejected') return 'Compatibilidad no disponible por ahora';
    return 'Pide compatibilidad para comparar vuestros habitos de convivencia';
  })();
  const requestButtonLabel = (() => {
    if (isBlocked) return 'Usuario bloqueado';
    if (isLoadingConsentState) return 'Comprobando...';
    if (hasActiveConsent) return 'Compatibilidad visible';
    if (consentStatus === 'outgoing_pending' || consentRequestState === 'sent') return 'Solicitud enviada';
    if (consentStatus === 'rejected') return 'Solicitud rechazada';
    if (consentRequestState === 'sending') return 'Enviando...';
    return 'Pedir compatibilidad';
  })();

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
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{name}</h1>
                        {profile.selfie_verified && <Shield className="h-5 w-5 text-primary" />}
                      </div>
                      <SafetyActions
                        targetType="user"
                        targetId={profile.user_id}
                        targetUserId={profile.user_id}
                        targetName={name}
                        compact
                        onBlocked={() => setIsBlocked(true)}
                      />
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
                    {isLoadingConsentState || (hasActiveConsent && isLoadingCompatibility && !compatibility) ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : hasCompatibilityResult && compatibilityScore !== null ? (
                      <>
                        <div className="text-3xl font-bold text-primary">{compatibilityScore}%</div>
                        <div className="text-sm text-muted-foreground">compatibilidad</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        {consentMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isIncomingRequest ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => void handleRespondConsent(false)}
                          disabled={isRespondingConsent}
                        >
                          {isRespondingConsent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                          Rechazar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => void handleRespondConsent(true)}
                          disabled={isRespondingConsent}
                        >
                          {isRespondingConsent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          Aceptar
                        </Button>
                      </>
                    ) : (
                      <Button className="flex-1" onClick={handleRequestConsent} disabled={!canRequestConsent}>
                        {consentRequestState === 'sending' || isLoadingConsentState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                        {requestButtonLabel}
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1" onClick={handleMessage} disabled={isBlocked || isOpeningChat}>
                      {isOpeningChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
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
              {hasCompatibilityResult ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {compatibilityScore !== null && (
                      <Badge className="rounded-full">{compatibilityScore}% compatibilidad</Badge>
                    )}
                    {commonQuestions !== null && (
                      <Badge variant="outline" className="rounded-full">
                        {commonQuestions} respuestas comparadas
                      </Badge>
                    )}
                    {compatibility?.cached && (
                      <Badge variant="secondary" className="rounded-full">Calculado previamente</Badge>
                    )}
                  </div>

                  {reasons.length > 0 && (
                    <div className="space-y-2">
                      {reasons.slice(0, 4).map((reason, index) => (
                        <div key={`${reason}-${index}`} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {compatibility.breakdown?.friction && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>{compatibility.breakdown.friction}</span>
                    </div>
                  )}

                  {mismatches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Puntos a hablar</p>
                      {mismatches.slice(0, 4).map((item, index) => (
                        <div key={`${item.question_id ?? 'mismatch'}-${index}`} className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{item.question_id ?? 'Diferencia detectada'}</p>
                          <p>
                            Respuestas: {item.a ?? 'No indicado'} / {item.b ?? 'No indicado'}
                            {typeof item.sim === 'number' ? ` · similitud ${Math.round(item.sim * 100)}%` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {reasons.length === 0 && !compatibility.breakdown?.friction && mismatches.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Compatibilidad calculada. Aun no hay desglose disponible para este nivel de detalle.
                    </p>
                  )}
                </div>
              ) : hasCompatibilityError ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {hasInsufficientCommonAnswers
                      ? compatibility.message || 'No hay suficientes respuestas comunes para calcular la compatibilidad detallada.'
                      : 'Compatibilidad activa, pero todavia no se ha podido calcular el porcentaje.'}
                  </p>
                  {hasInsufficientCommonAnswers && commonQuestions !== null && (
                    <p className="text-xs text-muted-foreground">
                      {commonQuestions} respuestas comunes encontradas.
                    </p>
                  )}
                  {compatibility?.code && (
                    <p className="text-xs text-muted-foreground">Codigo: {compatibility.code}</p>
                  )}
                </div>
              ) : hasActiveConsent && (isLoadingCompatibility || compatibility === null) ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando compatibilidad...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{consentMessage}</p>
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
