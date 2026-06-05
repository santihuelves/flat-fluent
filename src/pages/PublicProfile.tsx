import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, Eye, Heart, HeartHandshake, Loader2, MapPin, MessageCircle, Shield, ShieldCheck, User, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SafetyActions } from '@/components/SafetyActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { getLanguageLabel } from '@/lib/profileOptions';
import { decodeLivingTraits, decodeProfileInterestTags, getHouseholdSizeLabel, getYesNoLabel } from '@/lib/profileTraits';

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
  occupation?: string | null;
  lifestyle_tags?: string[] | null;
  autonomous_community?: string | null;
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
    source?: 'profile_only' | 'profile+test' | 'test_only';
    profile_score?: number | null;
    test_score?: number | null;
    test_available?: boolean;
    profile_signals_used?: number;
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

const getTrustBadgeLabel = (badge?: string | null) => {
  if (badge === 'verified') return 'Perfil verificado';
  if (badge === 'gold') return 'Confianza alta';
  if (badge === 'silver') return 'Confianza media';
  if (badge === 'bronze') return 'Confianza básica';
  return null;
};

const getCompatibilityDetailLevel = (consentLevel?: number | null) => (
  Number(consentLevel ?? 0) >= 2 ? 2 : 1
);

const compatibilityQuestionLabels: Record<string, string> = {
  scenario_late_call: 'Ruido tarde por la noche',
  scenario_unplanned_visit: 'Visitas sin avisar',
  scenario_pet_in_common_area: 'Mascotas y zonas comunes',
  scenario_smoking_balcony: 'Tabaco y olores',
  scenario_kitchen_mess: 'Cocina sin recoger',
  scenario_social_energy: 'Planes sociales en casa',
  scenario_cleaning_turn: 'Turnos de limpieza',
  scenario_shared_order: 'Orden en zonas comunes',
  scenario_remote_study: 'Ruido durante reuniones o estudio',
  scenario_expenses_delay: 'Retrasos con gastos comunes',
  scenario_conflict_message: 'Como hablar temas incomodos',
  scenario_boundaries: 'Cambios en normas acordadas',
  scenario_bathroom_peak: 'Uso del bano en horas punta',
  scenario_partner_sleepover: 'Parejas o invitados a dormir',
  scenario_food_without_permission: 'Uso de comida o productos personales',
  scenario_room_privacy: 'Privacidad de habitacion y pertenencias',
};

const compatibilityAnswerLabels: Record<string, string> = {
  clear_limit: 'prefiere limites claros',
  system: 'prefiere acordar una norma',
  occasional_flex: 'puede ser flexible si es puntual',
  high_tolerance: 'tiene alta tolerancia',
};

const compatibilityScenarioAnswerLabels: Record<string, Record<string, string>> = {
  scenario_late_call: {
    clear_limit: 'Le pide que baje el volumen y acordar una hora limite.',
    system: 'Propone usar auriculares o reservar llamadas tarde en habitaciones.',
    occasional_flex: 'Lo deja pasar si es puntual y lo comenta al dia siguiente.',
    high_tolerance: 'No le molesta mientras pueda dormir razonablemente.',
  },
  scenario_unplanned_visit: {
    clear_limit: 'Dice que necesita usar el salon y que las visitas deben avisarse.',
    system: 'Propone una norma simple para avisar y reservar espacios comunes.',
    occasional_flex: 'Lo acepta hoy si no se alarga y pide aviso para la proxima.',
    high_tolerance: 'No le importa si son respetuosas y no bloquean la casa.',
  },
  scenario_pet_in_common_area: {
    clear_limit: 'Pide que la persona responsable lo gestione de forma constante.',
    system: 'Propone una rutina de limpieza y horarios de descanso claros.',
    occasional_flex: 'Se adapta si se corrige rapido y no pasa cada dia.',
    high_tolerance: 'No le supone un problema si la convivencia general va bien.',
  },
  scenario_smoking_balcony: {
    clear_limit: 'Pide que cambie de lugar porque afecta a su espacio.',
    system: 'Acordaria una zona y una forma de ventilar para evitar molestias.',
    occasional_flex: 'Lo hablaria solo si se repite o llega a su habitacion.',
    high_tolerance: 'No le molesta especialmente si se fuma fuera.',
  },
  scenario_kitchen_mess: {
    clear_limit: 'Pide que la cocina quede utilizable el mismo dia.',
    system: 'Propone una regla de recoger despues de cocinar o antes de dormir.',
    occasional_flex: 'Si es puntual no dice nada, pero si se repite lo hablaria.',
    high_tolerance: 'No le da mucha importancia si no impide cocinar.',
  },
  scenario_social_energy: {
    clear_limit: 'Le parece demasiado fijo y pondria limites de frecuencia.',
    system: 'Acordaria horarios, volumen y que viernes se puede hacer.',
    occasional_flex: 'Algunos viernes se apunta y otros necesita su espacio.',
    high_tolerance: 'Le encanta que la casa tenga vida social.',
  },
  scenario_cleaning_turn: {
    clear_limit: 'Lo recuerda directamente y pide que se compense.',
    system: 'Propone calendario visible o recordatorios compartidos.',
    occasional_flex: 'Pregunta si necesita cambiar el turno antes de molestarse.',
    high_tolerance: 'Lo hace esta vez para evitar tension.',
  },
  scenario_shared_order: {
    clear_limit: 'Pediria que las zonas comunes queden despejadas.',
    system: 'Propondria una cesta o zona concreta para dejar cosas.',
    occasional_flex: 'Le da igual si no bloquea el uso del espacio.',
    high_tolerance: 'Es bastante flexible con ese tipo de desorden.',
  },
  scenario_remote_study: {
    clear_limit: 'Pide silencio en ese momento porque la reunion es importante.',
    system: 'Avisa antes y propone franjas tranquilas para llamadas clave.',
    occasional_flex: 'Intenta moverse y lo habla despues si le afecto.',
    high_tolerance: 'Asume que en una casa compartida habra ruido.',
  },
  scenario_expenses_delay: {
    clear_limit: 'Pregunta ese mismo dia y pide claridad.',
    system: 'Propone llevar gastos y fechas por app u hoja compartida.',
    occasional_flex: 'Da margen si avisan y se comprometen a una fecha.',
    high_tolerance: 'Si es poco dinero y es puntual, no le estresa.',
  },
  scenario_conflict_message: {
    clear_limit: 'Lo hablaria cara a cara cuanto antes y con respeto.',
    system: 'Mandaria un mensaje tranquilo para abrir conversacion.',
    occasional_flex: 'Esperaria un buen momento para hablarlo sin tension.',
    high_tolerance: 'Solo lo sacaria si se vuelve importante.',
  },
  scenario_boundaries: {
    clear_limit: 'Prefiere mantener lo acordado salvo causa clara.',
    system: 'Revisaria la norma en conjunto y dejaria el acuerdo por escrito.',
    occasional_flex: 'Probaria un cambio durante unas semanas.',
    high_tolerance: 'Lo gestionaria caso por caso si hay buena comunicacion.',
  },
  scenario_bathroom_peak: {
    clear_limit: 'Pide turnos o tiempos maximos en horas clave.',
    system: 'Propone coordinar horarios de ducha entre semana.',
    occasional_flex: 'Se adapta si es puntual y avisan cuando tardan.',
    high_tolerance: 'No le importa reorganizar su rutina si hace falta.',
  },
  scenario_partner_sleepover: {
    clear_limit: 'Pediria limitarlo si cambia el uso de la casa.',
    system: 'Acordaria frecuencia, aviso previo y participacion en gastos si aplica.',
    occasional_flex: 'Le parece bien si no afecta al descanso ni a espacios comunes.',
    high_tolerance: 'No le molesta si la convivencia sigue siendo comoda.',
  },
  scenario_food_without_permission: {
    clear_limit: 'Dice claramente que sus cosas no se usan sin permiso.',
    system: 'Propone separar productos personales y comunes.',
    occasional_flex: 'Si fue una urgencia puntual, pide que se reponga y se avise.',
    high_tolerance: 'No le importa compartir algunas cosas si hay confianza.',
  },
  scenario_room_privacy: {
    clear_limit: 'Marca un limite claro: su habitacion y sus cosas son privadas.',
    system: 'Acordaria normas explicitas sobre habitaciones y pertenencias.',
    occasional_flex: 'Si fue por necesidad, lo acepta, pero pide que se avise.',
    high_tolerance: 'No le molesta si hay mucha confianza y respeto.',
  },
};

const formatCompatibilityQuestion = (questionId?: string) => (
  questionId ? compatibilityQuestionLabels[questionId] ?? 'Tema de convivencia' : 'Tema de convivencia'
);

const formatCompatibilityAnswer = (answer?: string, questionId?: string) => (
  answer
    ? compatibilityScenarioAnswerLabels[questionId ?? '']?.[answer] ?? compatibilityAnswerLabels[answer] ?? answer
    : 'No indicado'
);

const getSimilarityLabel = (similarity?: number) => {
  if (typeof similarity !== 'number') return null;

  const percent = Math.round(similarity * 100);
  if (percent >= 80) return `${percent}% de encaje`;
  if (percent >= 50) return `${percent}% de encaje, conviene hablarlo`;
  return `${percent}% de encaje, posible punto de friccion`;
};

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    setIsBlocked(false);

    const { data: userData } = await supabase.auth.getUser();
    const authUserId = userData.user?.id ?? null;
    setCurrentUserId(authUserId);

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

    const { data: extendedProfile, error: extendedProfileError } = await supabase
      .from('profiles')
      .select('occupation, lifestyle_tags, autonomous_community, province, city, bio, languages, name')
      .eq('id', result.user.user_id)
      .maybeSingle();

    if (!extendedProfileError && extendedProfile) {
      setProfile({
        ...result.user,
        display_name: result.user.display_name ?? extendedProfile.name ?? null,
        bio: result.user.bio ?? extendedProfile.bio ?? null,
        languages: result.user.languages?.length ? result.user.languages : extendedProfile.languages ?? null,
        city: result.user.city ?? extendedProfile.city ?? null,
        province_code: result.user.province_code ?? extendedProfile.province ?? null,
        occupation: extendedProfile.occupation ?? null,
        lifestyle_tags: extendedProfile.lifestyle_tags ?? null,
        autonomous_community: extendedProfile.autonomous_community ?? null,
      });
    } else if (extendedProfileError) {
      console.warn('Error loading extended public profile fields:', extendedProfileError);
    }

    setIsLoading(false);

    if (authUserId === result.user.user_id) {
      return;
    }

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
        if (result.code === 'INVALID_TARGET') toast.error('No puedes abrir chat contigo mismo');
        else if (result.code === 'NO_MATCH') toast.error('Aún no tenéis match. Dale al corazón en Descubrir o pide compatibilidad primero.');
        else toast.error('No se pudo abrir el chat');
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
  const isOwnProfile = currentUserId === profile.user_id;
  const lifestyleTags = profile.lifestyle_tags ?? [];
  const showInclusiveBadge = lifestyleTags.includes('inclusive_lgtbiq_friendly');
  const livingTraits = decodeLivingTraits(lifestyleTags);
  const visibleInterestTags = decodeProfileInterestTags(lifestyleTags).slice(0, 25);
  const automaticCompatibilityTags = lifestyleTags
    .filter((tag) => tag.startsWith('auto_'))
    .map((tag) => tag.replace('auto_', '').replace(/_/g, ' '))
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));
  const personalSituationLabels = [
    getHouseholdSizeLabel(livingTraits.householdSize),
    getYesNoLabel(livingTraits.includesMinor, 'Convive con menor', 'Sin menores en convivencia'),
  ].filter((label): label is string => Boolean(label));
  const visibleCompatibilityTags = Array.from(new Set(automaticCompatibilityTags)).slice(0, 10);
  const trustBadgeLabel = getTrustBadgeLabel(profile.trust_badge);
  const locationLabel = [profile.city, profile.province_code, profile.autonomous_community].filter(Boolean).join(' - ');
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
      value: locationLabel || null,
    },
  ].filter((item) => Boolean(item.value));
  const reasons = compatibility?.breakdown?.reasons ?? [];
  const consentStatus = consentState?.state ?? 'none';
  const hasActiveConsent = consentStatus === 'active';
  const commonQuestions = typeof compatibility?.common_questions === 'number'
    ? compatibility.common_questions
    : typeof compatibility?.breakdown?.common_questions === 'number'
    ? compatibility.breakdown.common_questions
    : null;
  const compatibilitySource = compatibility?.breakdown?.source ?? null;
  const isProfileOnly = compatibilitySource === 'profile_only';
  const hasCompatibilityScore =
    compatibility?.ok === true &&
    compatibility.can_show_score !== false &&
    typeof compatibility.score === 'number' &&
    Number.isFinite(compatibility.score);
  const hasCompatibilityResult = hasActiveConsent && hasCompatibilityScore;
  const hasCompatibilityError = hasActiveConsent && compatibility?.ok === false;
  const hasInsufficientProfileData =
    hasCompatibilityError && compatibility?.code === 'INSUFFICIENT_PROFILE_DATA';
  const compatibilityScore = typeof compatibility?.score === 'number' && Number.isFinite(compatibility.score)
    ? Math.round(compatibility.score)
    : null;
  const mismatches = compatibility?.breakdown?.mismatches ?? [];
  const isIncomingRequest = consentStatus === 'incoming_pending';
  const canRequestConsent = !isOwnProfile && !isBlocked && !isLoadingConsentState && consentStatus === 'none' && consentRequestState === 'idle';
  const compatibilitySourceLabel = (() => {
    if (compatibilitySource === 'profile+test') return 'Perfil + test exhaustivo';
    if (compatibilitySource === 'test_only') return 'Test exhaustivo';
    if (compatibilitySource === 'profile_only') return 'Basado en perfil';
    return null;
  })();
  const consentMessage = (() => {
    if (isBlocked) return 'Usuario bloqueado';
    if (isLoadingConsentState) return 'Comprobando consentimiento...';
    if (hasCompatibilityResult) return 'Compatibilidad visible';
    if (hasInsufficientProfileData) return 'Aún no hay datos suficientes en los perfiles para calcular la compatibilidad.';
    if (hasCompatibilityError) return 'Compatibilidad activa, pero todavía no se ha podido calcular el porcentaje.';
    if (hasActiveConsent) return 'Calculando compatibilidad...';
    if (consentStatus === 'outgoing_pending') return 'Solicitud enviada';
    if (isIncomingRequest) return 'Solicitud de compatibilidad recibida';
    if (consentStatus === 'rejected') return 'Compatibilidad no disponible por ahora';
    return 'Pide compatibilidad para comparar vuestros hábitos de convivencia';
  })();
  const requestButtonLabel = (() => {
    if (isOwnProfile) return 'Vista pública';
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
        <Link to={isOwnProfile ? '/profile' : '/discover'}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isOwnProfile ? 'Volver a mi perfil' : 'Volver'}
          </Button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {isOwnProfile && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                Vista pública
              </div>
              <p className="mt-1">
                Solo tú ves este aviso. La ficha pública para otras personas empieza debajo; ellas verán sus propios botones de mensaje y compatibilidad contigo.
              </p>
            </div>
          )}

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
                      {!isOwnProfile && (
                        <SafetyActions
                          targetType="user"
                          targetId={profile.user_id}
                          targetUserId={profile.user_id}
                          targetName={name}
                          compact
                          onBlocked={() => setIsBlocked(true)}
                        />
                      )}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {trustBadgeLabel && (
                        <Badge variant="outline" className="rounded-full">
                          {trustBadgeLabel}
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

                  {!isOwnProfile && (
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
                  )}

                  {!isOwnProfile && (
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
                        hasActiveConsent ? (
                          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                            <CheckCircle className="h-4 w-4" />
                            {requestButtonLabel}
                          </div>
                        ) : (
                          <Button className="flex-1" onClick={handleRequestConsent} disabled={!canRequestConsent}>
                            {consentRequestState === 'sending' || isLoadingConsentState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                            {requestButtonLabel}
                          </Button>
                        )
                      )}
                      <Button variant="outline" className="flex-1" onClick={handleMessage} disabled={isBlocked || isOpeningChat}>
                        {isOpeningChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                        Mensaje
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {visibleCompatibilityTags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Hábitos y forma de convivir
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleCompatibilityTags.map((tag) => (
                    <Badge key={tag} className="rounded-full bg-primary/90">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Rasgos orientativos para saber si vuestra forma de vivir puede encajar, tanto para compartir casa como para conocer personas afines.
                </p>
              </CardContent>
            </Card>
          )}

          {visibleInterestTags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <User className="h-4 w-4" />
                  Rasgos e intereses
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleInterestTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Detalles para conocer mejor a esta persona y encontrar puntos en común.
                </p>
              </CardContent>
            </Card>
          )}

          {personalSituationLabels.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Situación de convivencia
                </div>
                <div className="flex flex-wrap gap-2">
                  {personalSituationLabels.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Sobre mí</h2>
              <p className="text-muted-foreground">{profile.bio || 'Este perfil todavía no tiene bio.'}</p>
            </CardContent>
          </Card>

          {basicInfoCards.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Datos básicos</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {basicInfoCards.map(({ key, icon: Icon, label, value }) => (
                    <div key={key} className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!isOwnProfile && (
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
                          <p className="font-medium text-foreground">{formatCompatibilityQuestion(item.question_id)}</p>
                          <p>
                            Tu respuesta: {formatCompatibilityAnswer(item.a, item.question_id)}. La otra persona: {formatCompatibilityAnswer(item.b, item.question_id)}.
                          </p>
                          {getSimilarityLabel(item.sim) && (
                            <p className="mt-1 text-xs">{getSimilarityLabel(item.sim)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {reasons.length === 0 && !compatibility.breakdown?.friction && mismatches.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Compatibilidad calculada con {commonQuestions ?? 'las'} respuestas comunes. El desglose se actualizara al recalcular la compatibilidad.
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
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">Idiomas</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.languages?.length ? profile.languages : ['No indicado']).map((language) => (
                    <Badge key={language} variant="outline">{language === 'No indicado' ? language : getLanguageLabel(language)}</Badge>
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
                    <Badge variant="outline">
                      {profile.trust_badge === 'gold' && 'Confianza alta'}
                      {profile.trust_badge === 'silver' && 'Confianza media'}
                      {profile.trust_badge === 'bronze' && 'Confianza básica'}
                      {profile.trust_badge === 'verified' && 'Perfil verificado'}
                    </Badge>
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
