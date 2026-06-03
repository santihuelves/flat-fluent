import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

type ScenarioOption = {
  value: string;
  label: string;
};

type ScenarioQuestion = {
  id: string;
  category: string;
  scenario: string;
  options: ScenarioOption[];
};

const scenarioQuestions: ScenarioQuestion[] = [
  {
    id: 'scenario_late_call',
    category: 'Descanso',
    scenario: 'Son las 00:30 y tu compañero/a sigue hablando por videollamada en el salón. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Le pido que baje el volumen y acordamos una hora límite.' },
      { value: 'system', label: 'Propongo usar auriculares o reservar llamadas tarde en habitaciones.' },
      { value: 'occasional_flex', label: 'Lo dejo pasar si es algo puntual y al día siguiente lo comento.' },
      { value: 'high_tolerance', label: 'No me molesta mientras pueda dormir razonablemente.' },
    ],
  },
  {
    id: 'scenario_unplanned_visit',
    category: 'Límites personales',
    scenario: 'Llegas a casa cansado/a y hay visitas ocupando el salón sin avisar. ¿Cómo reaccionas?',
    options: [
      { value: 'clear_limit', label: 'Digo que necesito usar el salón y que las visitas deben avisarse.' },
      { value: 'system', label: 'Propongo una norma simple para avisar y reservar espacios comunes.' },
      { value: 'occasional_flex', label: 'Lo acepto hoy si no se alarga y pido aviso para la próxima.' },
      { value: 'high_tolerance', label: 'No me importa si son respetuosas y no bloquean la casa.' },
    ],
  },
  {
    id: 'scenario_pet_in_common_area',
    category: 'Responsabilidad compartida',
    scenario: 'Una mascota ensucia zonas comunes o hace ruido varias veces por semana. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Pido que la persona responsable lo gestione de forma constante.' },
      { value: 'system', label: 'Propongo una rutina de limpieza y horarios de descanso claros.' },
      { value: 'occasional_flex', label: 'Me adapto si se corrige rápido y no pasa cada día.' },
      { value: 'high_tolerance', label: 'No me supone un problema si la convivencia general va bien.' },
    ],
  },
  {
    id: 'scenario_smoking_balcony',
    category: 'Límites personales',
    scenario: 'Alguien fuma fuera, pero el olor entra a tu habitación o zonas comunes. ¿Qué harías?',
    options: [
      { value: 'clear_limit', label: 'Pido que cambie de lugar porque afecta a mi espacio.' },
      { value: 'system', label: 'Acordaría una zona y una forma de ventilar para evitar molestias.' },
      { value: 'occasional_flex', label: 'Lo hablaría solo si se repite o llega a mi habitación.' },
      { value: 'high_tolerance', label: 'No me molesta especialmente si se fuma fuera.' },
    ],
  },
  {
    id: 'scenario_kitchen_mess',
    category: 'Espacios comunes',
    scenario: 'Después de cocinar, alguien deja sartenes y encimera sucias hasta el día siguiente. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Pido que la cocina quede utilizable el mismo día.' },
      { value: 'system', label: 'Propongo una regla de recoger después de cocinar o antes de dormir.' },
      { value: 'occasional_flex', label: 'Si es puntual no digo nada, pero si se repite lo hablaría.' },
      { value: 'high_tolerance', label: 'No le doy mucha importancia si no impide cocinar.' },
    ],
  },
  {
    id: 'scenario_social_energy',
    category: 'Flexibilidad',
    scenario: 'Las personas con las que convives quieren hacer plan común en casa cada viernes. ¿Cómo encajas eso?',
    options: [
      { value: 'clear_limit', label: 'Me parece demasiado fijo y pondría límites de frecuencia.' },
      { value: 'system', label: 'Acordaría horarios, volumen y qué viernes se puede hacer.' },
      { value: 'occasional_flex', label: 'Algunos viernes me apunto y otros necesito mi espacio.' },
      { value: 'high_tolerance', label: 'Me encanta que la casa tenga vida social.' },
    ],
  },
  {
    id: 'scenario_cleaning_turn',
    category: 'Responsabilidad compartida',
    scenario: 'A alguien se le olvida su turno de limpieza dos semanas seguidas. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Se lo recuerdo directamente y pido que lo compense.' },
      { value: 'system', label: 'Propongo calendario visible o recordatorios compartidos.' },
      { value: 'occasional_flex', label: 'Pregunto si necesita cambiar el turno antes de molestarme.' },
      { value: 'high_tolerance', label: 'Lo hago yo esta vez para evitar tensión.' },
    ],
  },
  {
    id: 'scenario_shared_order',
    category: 'Espacios comunes',
    scenario: 'Las zonas comunes acumulan cosas personales durante días. ¿Cuál sería tu reacción?',
    options: [
      { value: 'clear_limit', label: 'Pediría que las zonas comunes queden despejadas.' },
      { value: 'system', label: 'Propondría una cesta o zona concreta para dejar cosas.' },
      { value: 'occasional_flex', label: 'Me da igual si no bloquea el uso del espacio.' },
      { value: 'high_tolerance', label: 'Soy bastante flexible con ese tipo de desorden.' },
    ],
  },
  {
    id: 'scenario_remote_study',
    category: 'Comunicación',
    scenario: 'Tienes una reunión importante y justo empiezan a hacer ruido en casa. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Pido silencio en ese momento porque la reunión es importante.' },
      { value: 'system', label: 'Aviso antes y propongo franjas tranquilas para llamadas clave.' },
      { value: 'occasional_flex', label: 'Intento moverme y lo hablo después si me afectó.' },
      { value: 'high_tolerance', label: 'Asumo que en una casa compartida habrá ruido.' },
    ],
  },
  {
    id: 'scenario_expenses_delay',
    category: 'Gestión económica',
    scenario: 'Una persona de la casa se retrasa con un gasto común y no avisa. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Le pregunto ese mismo día y pido claridad.' },
      { value: 'system', label: 'Propongo llevar gastos y fechas por app u hoja compartida.' },
      { value: 'occasional_flex', label: 'Le doy margen si avisa y se compromete a una fecha.' },
      { value: 'high_tolerance', label: 'Si es poco dinero y es puntual, no me estresa.' },
    ],
  },
  {
    id: 'scenario_conflict_message',
    category: 'Comunicación',
    scenario: 'Hay un tema que te molesta, pero sabes que puede incomodar. ¿Cómo lo abordarías?',
    options: [
      { value: 'clear_limit', label: 'Lo hablaría cara a cara cuanto antes y con respeto.' },
      { value: 'system', label: 'Mandaría un mensaje tranquilo para abrir conversación.' },
      { value: 'occasional_flex', label: 'Esperaría un buen momento para hablarlo sin tensión.' },
      { value: 'high_tolerance', label: 'Solo lo sacaría si se vuelve importante.' },
    ],
  },
  {
    id: 'scenario_boundaries',
    category: 'Flexibilidad',
    scenario: 'Una norma acordada deja de funcionar para alguien de la casa. ¿Qué te parece mejor?',
    options: [
      { value: 'clear_limit', label: 'Mantener lo acordado salvo causa clara.' },
      { value: 'system', label: 'Revisarla en conjunto y dejar el nuevo acuerdo por escrito.' },
      { value: 'occasional_flex', label: 'Probar un cambio durante unas semanas.' },
      { value: 'high_tolerance', label: 'Gestionarlo caso por caso si hay buena comunicación.' },
    ],
  },
  {
    id: 'scenario_bathroom_peak',
    category: 'Espacios comunes',
    scenario: 'El baño se bloquea a menudo en horas punta y te retrasa por la mañana. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Pido turnos o tiempos máximos en horas clave.' },
      { value: 'system', label: 'Propongo coordinar horarios de ducha entre semana.' },
      { value: 'occasional_flex', label: 'Me adapto si es puntual y avisan cuando tardan.' },
      { value: 'high_tolerance', label: 'No me importa reorganizar mi rutina si hace falta.' },
    ],
  },
  {
    id: 'scenario_partner_sleepover',
    category: 'Privacidad',
    scenario: 'La pareja de alguien se queda a dormir varias noches por semana. ¿Cómo lo gestionarías?',
    options: [
      { value: 'clear_limit', label: 'Pediría limitarlo si cambia el uso de la casa.' },
      { value: 'system', label: 'Acordaría frecuencia, aviso previo y participación en gastos si aplica.' },
      { value: 'occasional_flex', label: 'Me parece bien si no afecta al descanso ni a espacios comunes.' },
      { value: 'high_tolerance', label: 'No me molesta si la convivencia sigue siendo cómoda.' },
    ],
  },
  {
    id: 'scenario_food_without_permission',
    category: 'Límites personales',
    scenario: 'Alguien usa tu comida o productos sin pedir permiso. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Digo claramente que mis cosas no se usan sin permiso.' },
      { value: 'system', label: 'Propongo separar productos personales y comunes.' },
      { value: 'occasional_flex', label: 'Si fue una urgencia puntual, pido que lo reponga y avise.' },
      { value: 'high_tolerance', label: 'No me importa compartir algunas cosas si hay confianza.' },
    ],
  },
  {
    id: 'scenario_room_privacy',
    category: 'Privacidad',
    scenario: 'Alguien entra en tu habitación o toca tus pertenencias sin avisar. ¿Qué haces?',
    options: [
      { value: 'clear_limit', label: 'Marco un límite claro: mi habitación y mis cosas son privadas.' },
      { value: 'system', label: 'Acordaría normas explícitas sobre habitaciones y pertenencias.' },
      { value: 'occasional_flex', label: 'Si fue por necesidad, lo acepto, pero pido que avise.' },
      { value: 'high_tolerance', label: 'No me molesta si hay mucha confianza y respeto.' },
    ],
  },
];

const dealbreakers = [
  { id: 'no_smokers', label: 'No convivir con personas fumadoras' },
  { id: 'no_pets', label: 'No convivir con mascotas' },
  { id: 'no_parties', label: 'No fiestas en casa' },
  { id: 'no_overnight_guests', label: 'No invitados a dormir sin acuerdo previo' },
  { id: 'silence_after_23', label: 'Silencio después de las 23:00' },
  { id: 'strict_cleaning', label: 'Necesito alto nivel de limpieza' },
  { id: 'strict_50_50', label: 'Necesito acuerdos claros sobre gastos' },
  { id: 'no_remote_calls', label: 'Necesito límites para llamadas en zonas comunes' },
  { id: 'high_room_privacy', label: 'Necesito privacidad alta en mi habitación' },
  { id: 'no_frequent_unannounced_visits', label: 'No acepto visitas frecuentes sin avisar' },
  { id: 'no_food_without_permission', label: 'No acepto uso de mi comida/productos sin permiso' },
  { id: 'no_indoor_smoking', label: 'No acepto fumar dentro de casa' },
];

const getListingTypeFromParam = (value: string | null) =>
  value === 'offer_room' ? value : null;

const getSavedAnswerValue = (answerValue: unknown) => {
  if (
    answerValue &&
    typeof answerValue === 'object' &&
    'value' in answerValue &&
    typeof (answerValue as { value?: unknown }).value === 'string'
  ) {
    return (answerValue as { value: string }).value;
  }

  return typeof answerValue === 'string' ? answerValue : null;
};

export default function Test() {
  useSEO({ page: 'test', noIndex: true });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRoute = searchParams.get('next');
  const requestedListingType = getListingTypeFromParam(searchParams.get('type'));
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSavedTest, setIsLoadingSavedTest] = useState(true);
  const [hasSavedTest, setHasSavedTest] = useState(false);
  const testContentRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  const totalSteps = scenarioQuestions.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isDealbreakerStep = currentStep === scenarioQuestions.length;
  const currentQuestion = !isDealbreakerStep ? scenarioQuestions[currentStep] : null;

  useEffect(() => {
    let isMounted = true;

    const loadSavedTest = async () => {
      setIsLoadingSavedTest(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (isMounted) {
          setIsLoadingSavedTest(false);
        }
        return;
      }

      const [answersResult, profileResult] = await Promise.all([
        supabase
          .from('convinter_answers')
          .select('question_id, answer_value')
          .eq('user_id', session.user.id)
          .eq('test_id', 'convinter_full'),
        supabase
          .from('convinter_profiles')
          .select('dealbreakers, full_test_completed')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      if (answersResult.error) {
        console.warn('Error loading saved compatibility answers:', answersResult.error);
      } else {
        const savedAnswers = (answersResult.data ?? []).reduce<Record<string, string>>((acc, row) => {
          const value = getSavedAnswerValue(row.answer_value);
          if (row.question_id && value) {
            acc[row.question_id] = value;
          }
          return acc;
        }, {});

        setAnswers(savedAnswers);
        setHasSavedTest(Object.keys(savedAnswers).length > 0 || Boolean(profileResult.data?.full_test_completed));
      }

      if (profileResult.error) {
        console.warn('Error loading saved compatibility profile data:', profileResult.error);
      } else if (Array.isArray(profileResult.data?.dealbreakers)) {
        setSelectedDealbreakers(profileResult.data.dealbreakers.filter((item): item is string => typeof item === 'string'));
      }

      setIsLoadingSavedTest(false);
    };

    void loadSavedTest();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    testContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  const canProceed = () => {
    if (isDealbreakerStep) return true;
    return Boolean(currentQuestion && answers[currentQuestion.id]);
  };

  const toggleDealbreaker = (id: string) => {
    setSelectedDealbreakers((prev) =>
      prev.includes(id) ? prev.filter((dealbreaker) => dealbreaker !== id) : [...prev, id]
    );
  };

  const handleStartFresh = () => {
    setAnswers({});
    setSelectedDealbreakers([]);
    setCurrentStep(0);
    setHasSavedTest(false);
    toast.info('Puedes empezar de cero. No se cambiaran tus respuestas guardadas hasta que finalices.');
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Inicia sesión para guardar el test.');
        navigate('/login');
        return;
      }

      for (const [questionId, value] of Object.entries(answers)) {
        const { error } = await supabase.rpc('convinter_save_answer', {
          p_test_id: 'convinter_full',
          p_question_id: questionId,
          p_answer_value: { value },
        });

        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from('convinter_profiles')
        .update({
          dealbreakers: selectedDealbreakers,
          test_completed: true,
          full_test_completed: true,
          full_test_completed_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (profileError) throw profileError;

      toast.success('Test de compatibilidad guardado.');
      if (nextRoute === 'create-listing' && requestedListingType) {
        navigate(`/create-listing?type=${requestedListingType}`);
      } else {
        navigate('/discover');
      }
    } catch (error) {
      console.error('Error completing advanced test:', error);
      toast.error('No se pudo guardar el test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!canProceed() || isSubmitting || isLoadingSavedTest) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (isSubmitting) return;

    if (currentStep === 0) {
      navigate(-1);
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Layout showMobileNav={false}>
      <div className="container max-w-3xl py-8">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Test de compatibilidad</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">
            {hasSavedTest ? 'Revisar test de compatibilidad' : 'Situaciones reales de convivencia'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ahora veremos cómo reaccionarías en casos reales del día a día. No hay respuestas buenas o malas: buscamos personas compatibles contigo.
          </p>
          {hasSavedTest && (
            <p className="mt-2 text-sm font-medium text-primary">
              Tus respuestas actuales estan cargadas. Puedes cambiar solo lo que quieras y guardar al final.
            </p>
          )}
          {hasSavedTest && (
            <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={handleStartFresh}>
              <RotateCcw className="h-4 w-4" />
              Empezar de cero
            </Button>
          )}
        </div>

        {isLoadingSavedTest && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando tus respuestas guardadas...
          </div>
        )}

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentStep + 1} / {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
          <p className="text-sm text-muted-foreground">
            Tu perfil de convivencia ya recoge tus preferencias declaradas. Este test mide comunicación, límites y tolerancia en situaciones concretas.
          </p>
        </motion.div>

        <motion.div
          ref={testContentRef}
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card rounded-2xl p-6"
        >
          {isDealbreakerStep ? (
            <>
              <div className="mb-6">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Límites importantes
                </div>
                <h2 className="text-xl font-bold">¿Hay algo que quieras marcar como no negociable?</h2>
                <p className="mt-2 text-muted-foreground">
                  Es opcional. Sirve para detectar puntos a hablar antes de convivir.
                </p>
              </div>

              <div className="grid gap-3">
                {dealbreakers.map((dealbreaker) => (
                  <label
                    key={dealbreaker.id}
                    htmlFor={dealbreaker.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/50"
                  >
                    <Checkbox
                      id={dealbreaker.id}
                      checked={selectedDealbreakers.includes(dealbreaker.id)}
                      onCheckedChange={() => toggleDealbreaker(dealbreaker.id)}
                    />
                    <span className="font-medium">{dealbreaker.label}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{currentQuestion?.category}</span>
                </div>
                <h2 className="text-xl font-bold">{currentQuestion?.scenario}</h2>
              </div>

              <div className="grid gap-3">
                {currentQuestion?.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.value;

                  return (
                    <Button
                      key={option.value}
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.value }))}
                      className="h-auto min-h-14 justify-start whitespace-normal text-left leading-relaxed"
                      aria-pressed={selected}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={isSubmitting} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Volver' : 'Anterior'}
          </Button>
          <Button variant="hero" onClick={handleNext} disabled={!canProceed() || isSubmitting || isLoadingSavedTest} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : currentStep === totalSteps - 1 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
