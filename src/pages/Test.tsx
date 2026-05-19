import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
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
    category: 'Horarios y ruido',
    scenario: 'Son las 00:30 y tu compañero/a sigue hablando por videollamada en el salón. ¿Qué haces?',
    options: [
      { value: 'ask_lower_volume', label: 'Le pido que baje el volumen.' },
      { value: 'let_pass_if_rare', label: 'Me molesta, pero lo dejo pasar si no es habitual.' },
      { value: 'ok_not_daily', label: 'Me da igual mientras no sea todos los días.' },
      { value: 'join_if_trust', label: 'Me uno a la conversación si hay confianza.' },
    ],
  },
  {
    id: 'scenario_unplanned_visit',
    category: 'Visitas',
    scenario: 'Llegas a casa cansado/a y hay dos amistades de tu compañero/a cenando sin avisar. ¿Cómo reaccionas?',
    options: [
      { value: 'ask_notice_next_time', label: 'Lo acepto hoy, pero pido que avise la próxima vez.' },
      { value: 'need_quiet_now', label: 'Le digo que necesito tranquilidad esa noche.' },
      { value: 'fine_if_respectful', label: 'No me importa si respetan espacios y horarios.' },
      { value: 'social_join', label: 'Me parece bien y quizá me uno un rato.' },
    ],
  },
  {
    id: 'scenario_pet_in_common_area',
    category: 'Mascotas',
    scenario: 'Una mascota deja pelos en el sofá y zonas comunes varias veces por semana. ¿Qué haces?',
    options: [
      { value: 'agree_cleaning_rule', label: 'Propongo una norma clara de limpieza.' },
      { value: 'owner_responsibility', label: 'Pido que la persona responsable lo gestione siempre.' },
      { value: 'tolerate_if_cleaned', label: 'Lo tolero si se limpia con frecuencia.' },
      { value: 'no_problem', label: 'No me supone un problema.' },
    ],
  },
  {
    id: 'scenario_smoking_balcony',
    category: 'Tabaco',
    scenario: 'Alguien fuma en el balcón y el olor entra a tu habitación. ¿Qué harías?',
    options: [
      { value: 'ask_change_spot', label: 'Le pediría cambiar de lugar o cerrar mejor.' },
      { value: 'talk_if_repeated', label: 'Solo lo hablaría si se repite.' },
      { value: 'ok_if_outside', label: 'Me parece aceptable si fuma fuera.' },
      { value: 'does_not_bother', label: 'No me molesta especialmente.' },
    ],
  },
  {
    id: 'scenario_kitchen_mess',
    category: 'Cocina',
    scenario: 'Después de cocinar, alguien deja sartenes y encimera sucias hasta el día siguiente. ¿Qué haces?',
    options: [
      { value: 'ask_same_day', label: 'Pido que la cocina quede recogida el mismo día.' },
      { value: 'clean_once_then_talk', label: 'Lo recojo una vez y luego lo hablo.' },
      { value: 'depends_frequency', label: 'Depende de si es algo puntual o frecuente.' },
      { value: 'not_big_deal', label: 'No le doy mucha importancia.' },
    ],
  },
  {
    id: 'scenario_social_energy',
    category: 'Vida social',
    scenario: 'Las personas con las que convives quieren hacer plan común en casa cada viernes. ¿Cómo encajas eso?',
    options: [
      { value: 'need_limits', label: 'Me gusta, pero necesito límites de horario y ruido.' },
      { value: 'sometimes_join', label: 'Algunas veces me apunto y otras prefiero mi espacio.' },
      { value: 'mostly_independent', label: 'Prefiero una convivencia más independiente.' },
      { value: 'love_social_home', label: 'Me encanta que la casa tenga vida social.' },
    ],
  },
  {
    id: 'scenario_cleaning_turn',
    category: 'Limpieza',
    scenario: 'A alguien se le olvida su turno de limpieza dos semanas seguidas. ¿Qué haces?',
    options: [
      { value: 'direct_reminder', label: 'Se lo recuerdo directamente y propongo calendario.' },
      { value: 'group_message', label: 'Lo comento en el grupo de la casa.' },
      { value: 'ask_if_needs_swap', label: 'Pregunto si necesita cambiar el turno.' },
      { value: 'do_it_to_avoid_conflict', label: 'Lo hago yo para evitar tensión.' },
    ],
  },
  {
    id: 'scenario_shared_order',
    category: 'Orden',
    scenario: 'Las zonas comunes acumulan cosas personales durante días. ¿Cuál sería tu reacción?',
    options: [
      { value: 'clear_common_spaces', label: 'Pediría mantener libres las zonas comunes.' },
      { value: 'basket_or_area', label: 'Propondría una cesta o zona concreta para dejar cosas.' },
      { value: 'fine_if_not_blocking', label: 'Me da igual si no bloquea el uso del espacio.' },
      { value: 'very_flexible', label: 'Soy bastante flexible con ese tipo de desorden.' },
    ],
  },
  {
    id: 'scenario_remote_study',
    category: 'Teletrabajo o estudio',
    scenario: 'Tienes una reunión importante y justo empiezan a hacer ruido en casa. ¿Qué haces?',
    options: [
      { value: 'warn_beforehand', label: 'Aviso antes y pido una franja tranquila.' },
      { value: 'move_room', label: 'Intento moverme a otro sitio si puedo.' },
      { value: 'talk_after', label: 'Si me afecta, lo hablo después con calma.' },
      { value: 'accept_home_noise', label: 'Asumo que en una casa compartida habrá ruido.' },
    ],
  },
  {
    id: 'scenario_expenses_delay',
    category: 'Gastos compartidos',
    scenario: 'Una persona de la casa se retrasa con un gasto común y no avisa. ¿Qué haces?',
    options: [
      { value: 'ask_same_day', label: 'Le pregunto ese mismo día y pido claridad.' },
      { value: 'give_margin', label: 'Le doy margen, pero necesito que avise.' },
      { value: 'track_in_app', label: 'Propongo llevarlo todo por app o hoja compartida.' },
      { value: 'not_stress_small_amount', label: 'Si es poco dinero, no me estresa.' },
    ],
  },
  {
    id: 'scenario_conflict_message',
    category: 'Comunicación',
    scenario: 'Hay un tema que te molesta, pero sabes que puede incomodar. ¿Cómo lo abordarías?',
    options: [
      { value: 'face_to_face', label: 'Lo hablaría cara a cara cuanto antes.' },
      { value: 'calm_message_first', label: 'Mandaría un mensaje tranquilo para abrir conversación.' },
      { value: 'wait_right_moment', label: 'Esperaría un buen momento para hablarlo.' },
      { value: 'avoid_unless_serious', label: 'Solo lo sacaría si se vuelve importante.' },
    ],
  },
  {
    id: 'scenario_boundaries',
    category: 'Límites',
    scenario: 'Una norma acordada deja de funcionar para alguien de la casa. ¿Qué te parece mejor?',
    options: [
      { value: 'review_together', label: 'Revisarla en conjunto y ajustar si tiene sentido.' },
      { value: 'keep_agreement', label: 'Mantener lo acordado salvo causa clara.' },
      { value: 'trial_period', label: 'Probar un cambio durante unas semanas.' },
      { value: 'case_by_case', label: 'Gestionarlo caso por caso.' },
    ],
  },
];

const dealbreakers = [
  { id: 'no_smokers', label: 'No convivir con personas fumadoras' },
  { id: 'no_pets', label: 'No convivir con mascotas' },
  { id: 'no_parties', label: 'No fiestas en casa' },
  { id: 'no_overnight_guests', label: 'No personas invitadas a dormir' },
  { id: 'silence_after_23', label: 'Silencio después de las 23:00' },
  { id: 'strict_cleaning', label: 'Limpieza estricta' },
  { id: 'strict_50_50', label: 'Gastos siempre al 50%' },
  { id: 'no_remote_calls', label: 'No llamadas de trabajo en zonas comunes' },
];

export default function Test() {
  useSEO({ page: 'test', noIndex: true });

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const testContentRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  const totalSteps = scenarioQuestions.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isDealbreakerStep = currentStep === scenarioQuestions.length;
  const currentQuestion = !isDealbreakerStep ? scenarioQuestions[currentStep] : null;

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

      toast.success('Test avanzado guardado.');
      navigate('/discover');
    } catch (error) {
      console.error('Error completing advanced test:', error);
      toast.error('No se pudo guardar el test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!canProceed() || isSubmitting) return;

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
          <p className="text-sm text-muted-foreground">Test avanzado</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Situaciones reales de convivencia</h1>
          <p className="mt-3 text-muted-foreground">
            Ahora veremos cómo reaccionarías en casos reales del día a día. No hay respuestas buenas o malas: buscamos personas compatibles contigo.
          </p>
        </div>

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
            El perfil rápido ya recoge tus preferencias declaradas. Este test mide comunicación, límites y tolerancia en situaciones concretas.
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
          <Button variant="hero" onClick={handleNext} disabled={!canProceed() || isSubmitting} className="gap-2">
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
