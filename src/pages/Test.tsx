import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QuestionOption = { value: string; labelKey: string };
type Question = {
  id: string;
  category: string;
  type: 'scale' | 'choice';
  questionKey: string;
  options: QuestionOption[];
};

const dealbreakers = [
  'no_smokers',
  'no_pets',
  'no_parties',
  'no_overnight_guests',
  'silence_after_23',
  'no_drugs',
  'single_gender_only',
  'no_couples_staying',
  'strict_cleaning',
  'strict_50_50',
  'no_remote_calls',
  'veg_only_kitchen',
];

const quickQuestionIds = [
  'cleaning_level',
  'dishes_time',
  'cleaning_responsibility',
  'wake_time',
  'sleep_time',
  'social_visits',
  'parties',
  'noise_tolerance_general',
  'expenses_split',
  'lifestyle_smoking',
];

const allQuestions: Question[] = [
  // Limpieza y orden
  {
    id: 'cleaning_level',
    category: 'cleaning',
    type: 'scale',
    questionKey: 'cleaning_level.question',
    options: [
      { value: '1', labelKey: 'common.scale.very_relaxed' },
      { value: '2', labelKey: 'common.scale.relaxed' },
      { value: '3', labelKey: 'common.scale.neutral' },
      { value: '4', labelKey: 'common.scale.organized' },
      { value: '5', labelKey: 'common.scale.very_organized' },
    ],
  },
  {
    id: 'dishes_time',
    category: 'cleaning',
    type: 'choice',
    questionKey: 'dishes_time.question',
    options: [
      { value: 'immediate', labelKey: 'dishes_time.options.immediate' },
      { value: 'same_day', labelKey: 'dishes_time.options.same_day' },
      { value: 'next_day', labelKey: 'dishes_time.options.next_day' },
      { value: 'whenever', labelKey: 'dishes_time.options.whenever' },
    ],
  },
  {
    id: 'cleaning_common_frequency',
    category: 'cleaning',
    type: 'choice',
    questionKey: 'cleaning_common_frequency.question',
    options: [
      { value: 'daily', labelKey: 'common.frequency.daily' },
      { value: 'twice_week', labelKey: 'common.frequency.twice_week' },
      { value: 'weekly', labelKey: 'common.frequency.weekly' },
      { value: 'biweekly', labelKey: 'common.frequency.biweekly' },
    ],
  },
  {
    id: 'cleaning_tolerance_mess',
    category: 'cleaning',
    type: 'scale',
    questionKey: 'cleaning_tolerance_mess.question',
    options: [
      { value: '1', labelKey: 'common.tolerance.low' },
      { value: '2', labelKey: 'common.tolerance.mid_low' },
      { value: '3', labelKey: 'common.tolerance.medium' },
      { value: '4', labelKey: 'common.tolerance.mid_high' },
      { value: '5', labelKey: 'common.tolerance.high' },
    ],
  },
  {
    id: 'cleaning_responsibility',
    category: 'cleaning',
    type: 'choice',
    questionKey: 'cleaning_responsibility.question',
    options: [
      { value: 'schedule', labelKey: 'cleaning_responsibility.options.schedule' },
      { value: 'split', labelKey: 'cleaning_responsibility.options.split' },
      { value: 'spontaneous', labelKey: 'cleaning_responsibility.options.spontaneous' },
      { value: 'service', labelKey: 'cleaning_responsibility.options.service' },
    ],
  },
  // Horarios
  {
    id: 'wake_time',
    category: 'schedule',
    type: 'choice',
    questionKey: 'wake_time.question',
    options: [
      { value: 'early', labelKey: 'common.time.before_7' },
      { value: 'normal', labelKey: 'common.time.between_7_9' },
      { value: 'late', labelKey: 'common.time.between_9_11' },
      { value: 'very_late', labelKey: 'common.time.after_11' },
    ],
  },
  {
    id: 'sleep_time',
    category: 'schedule',
    type: 'choice',
    questionKey: 'sleep_time.question',
    options: [
      { value: 'early', labelKey: 'common.time.before_22' },
      { value: 'normal', labelKey: 'common.time.between_22_24' },
      { value: 'late', labelKey: 'common.time.between_24_2' },
      { value: 'very_late', labelKey: 'common.time.after_2' },
    ],
  },
  {
    id: 'weekend_change',
    category: 'schedule',
    type: 'choice',
    questionKey: 'weekend_change.question',
    options: [
      { value: 'same', labelKey: 'weekend_change.options.same' },
      { value: 'later', labelKey: 'weekend_change.options.later' },
      { value: 'much_later', labelKey: 'weekend_change.options.much_later' },
      { value: 'depends', labelKey: 'weekend_change.options.depends' },
    ],
  },
  {
    id: 'noise_sensitivity',
    category: 'schedule',
    type: 'scale',
    questionKey: 'noise_sensitivity.question',
    options: [
      { value: '1', labelKey: 'common.tolerance.low' },
      { value: '2', labelKey: 'common.tolerance.mid_low' },
      { value: '3', labelKey: 'common.tolerance.medium' },
      { value: '4', labelKey: 'common.tolerance.mid_high' },
      { value: '5', labelKey: 'common.tolerance.high' },
    ],
  },
  // Social
  {
    id: 'social_visits',
    category: 'social',
    type: 'choice',
    questionKey: 'social_visits.question',
    options: [
      { value: 'never', labelKey: 'social_visits.options.never' },
      { value: 'rarely', labelKey: 'social_visits.options.rarely' },
      { value: 'sometimes', labelKey: 'social_visits.options.sometimes' },
      { value: 'often', labelKey: 'social_visits.options.often' },
    ],
  },
  {
    id: 'parties',
    category: 'social',
    type: 'choice',
    questionKey: 'parties.question',
    options: [
      { value: 'never', labelKey: 'parties.options.never' },
      { value: 'rarely', labelKey: 'parties.options.rarely' },
      { value: 'sometimes', labelKey: 'parties.options.sometimes' },
      { value: 'often', labelKey: 'parties.options.often' },
    ],
  },
  {
    id: 'sleepover_guests',
    category: 'social',
    type: 'choice',
    questionKey: 'sleepover_guests.question',
    options: [
      { value: 'never', labelKey: 'sleepover_guests.options.never' },
      { value: 'monthly', labelKey: 'sleepover_guests.options.monthly' },
      { value: 'weekly', labelKey: 'sleepover_guests.options.weekly' },
      { value: 'often', labelKey: 'sleepover_guests.options.often' },
    ],
  },
  {
    id: 'social_common_areas',
    category: 'social',
    type: 'choice',
    questionKey: 'social_common_areas.question',
    options: [
      { value: 'rarely', labelKey: 'common.frequency.rarely' },
      { value: 'sometimes', labelKey: 'common.frequency.sometimes' },
      { value: 'often', labelKey: 'common.frequency.often' },
      { value: 'mostly', labelKey: 'common.frequency.mostly' },
    ],
  },
  {
    id: 'social_preference',
    category: 'social',
    type: 'choice',
    questionKey: 'social_preference.question',
    options: [
      { value: 'independent', labelKey: 'social_preference.options.independent' },
      { value: 'balanced', labelKey: 'social_preference.options.balanced' },
      { value: 'together', labelKey: 'social_preference.options.together' },
    ],
  },
  // Ruido
  {
    id: 'noise_tolerance_general',
    category: 'noise',
    type: 'scale',
    questionKey: 'noise_tolerance_general.question',
    options: [
      { value: '1', labelKey: 'common.tolerance.low' },
      { value: '2', labelKey: 'common.tolerance.mid_low' },
      { value: '3', labelKey: 'common.tolerance.medium' },
      { value: '4', labelKey: 'common.tolerance.mid_high' },
      { value: '5', labelKey: 'common.tolerance.high' },
    ],
  },
  {
    id: 'noise_music_tv',
    category: 'noise',
    type: 'choice',
    questionKey: 'noise_music_tv.question',
    options: [
      { value: 'headphones', labelKey: 'noise_music_tv.options.headphones' },
      { value: 'low_volume', labelKey: 'noise_music_tv.options.low_volume' },
      { value: 'normal', labelKey: 'noise_music_tv.options.normal' },
      { value: 'loud_ok', labelKey: 'noise_music_tv.options.loud_ok' },
    ],
  },
  {
    id: 'noise_calls_common',
    category: 'noise',
    type: 'choice',
    questionKey: 'noise_calls_common.question',
    options: [
      { value: 'avoid', labelKey: 'noise_calls_common.options.avoid' },
      { value: 'short', labelKey: 'noise_calls_common.options.short' },
      { value: 'ok', labelKey: 'noise_calls_common.options.ok' },
      { value: 'long', labelKey: 'noise_calls_common.options.long' },
    ],
  },
  {
    id: 'noise_remote_work',
    category: 'noise',
    type: 'choice',
    questionKey: 'noise_remote_work.question',
    options: [
      { value: 'rare', labelKey: 'noise_remote_work.options.rare' },
      { value: 'sometimes', labelKey: 'noise_remote_work.options.sometimes' },
      { value: 'often', labelKey: 'noise_remote_work.options.often' },
      { value: 'daily_calls', labelKey: 'noise_remote_work.options.daily_calls' },
    ],
  },
  // Gastos
  {
    id: 'expenses_split',
    category: 'expenses',
    type: 'choice',
    questionKey: 'expenses_split.question',
    options: [
      { value: 'equal', labelKey: 'expenses_split.options.equal' },
      { value: 'proportional', labelKey: 'expenses_split.options.proportional' },
      { value: 'per_use', labelKey: 'expenses_split.options.per_use' },
      { value: 'other', labelKey: 'expenses_split.options.other' },
    ],
  },
  {
    id: 'expenses_shared_purchases',
    category: 'expenses',
    type: 'choice',
    questionKey: 'expenses_shared_purchases.question',
    options: [
      { value: 'separate', labelKey: 'expenses_shared_purchases.options.separate' },
      { value: 'basics', labelKey: 'expenses_shared_purchases.options.basics' },
      { value: 'most', labelKey: 'expenses_shared_purchases.options.most' },
      { value: 'all', labelKey: 'expenses_shared_purchases.options.all' },
    ],
  },
  {
    id: 'expenses_punctuality',
    category: 'expenses',
    type: 'choice',
    questionKey: 'expenses_punctuality.question',
    options: [
      { value: 'strict', labelKey: 'expenses_punctuality.options.strict' },
      { value: 'flexible_days', labelKey: 'expenses_punctuality.options.flexible_days' },
      { value: 'flexible_week', labelKey: 'expenses_punctuality.options.flexible_week' },
      { value: 'very_flexible', labelKey: 'expenses_punctuality.options.very_flexible' },
    ],
  },
  {
    id: 'expenses_tracking',
    category: 'expenses',
    type: 'choice',
    questionKey: 'expenses_tracking.question',
    options: [
      { value: 'app', labelKey: 'expenses_tracking.options.app' },
      { value: 'sheet', labelKey: 'expenses_tracking.options.sheet' },
      { value: 'trust', labelKey: 'expenses_tracking.options.trust' },
      { value: 'cash', labelKey: 'expenses_tracking.options.cash' },
    ],
  },
  // Cocina
  {
    id: 'cooking_shared',
    category: 'cooking',
    type: 'choice',
    questionKey: 'cooking_shared.question',
    options: [
      { value: 'separate', labelKey: 'cooking_shared.options.separate' },
      { value: 'sometimes', labelKey: 'cooking_shared.options.sometimes' },
      { value: 'weekly', labelKey: 'cooking_shared.options.weekly' },
      { value: 'often', labelKey: 'cooking_shared.options.often' },
    ],
  },
  {
    id: 'cooking_frequency',
    category: 'cooking',
    type: 'choice',
    questionKey: 'cooking_frequency.question',
    options: [
      { value: 'rare', labelKey: 'common.frequency.rarely' },
      { value: 'few_week', labelKey: 'cooking_frequency.options.few_week' },
      { value: 'daily', labelKey: 'common.frequency.daily' },
      { value: 'twice_daily', labelKey: 'cooking_frequency.options.twice_daily' },
    ],
  },
  {
    id: 'cooking_order',
    category: 'cooking',
    type: 'scale',
    questionKey: 'cooking_order.question',
    options: [
      { value: '1', labelKey: 'common.scale.very_relaxed' },
      { value: '2', labelKey: 'common.scale.relaxed' },
      { value: '3', labelKey: 'common.scale.neutral' },
      { value: '4', labelKey: 'common.scale.organized' },
      { value: '5', labelKey: 'common.scale.very_organized' },
    ],
  },
  {
    id: 'cooking_diet',
    category: 'cooking',
    type: 'choice',
    questionKey: 'cooking_diet.question',
    options: [
      { value: 'none', labelKey: 'cooking_diet.options.none' },
      { value: 'preferences', labelKey: 'cooking_diet.options.preferences' },
      { value: 'vegetarian', labelKey: 'cooking_diet.options.vegetarian' },
      { value: 'vegan', labelKey: 'cooking_diet.options.vegan' },
      { value: 'allergies', labelKey: 'cooking_diet.options.allergies' },
    ],
  },
  // Estilo de vida
  {
    id: 'lifestyle_smoking',
    category: 'lifestyle',
    type: 'choice',
    questionKey: 'lifestyle_smoking.question',
    options: [
      { value: 'no', labelKey: 'common.binary.no' },
      { value: 'outdoor', labelKey: 'lifestyle_smoking.options.outdoor' },
      { value: 'indoor', labelKey: 'lifestyle_smoking.options.indoor' },
      { value: 'cannabis', labelKey: 'lifestyle_smoking.options.cannabis' },
    ],
  },
  {
    id: 'lifestyle_pets',
    category: 'lifestyle',
    type: 'choice',
    questionKey: 'lifestyle_pets.question',
    options: [
      { value: 'none', labelKey: 'lifestyle_pets.options.none' },
      { value: 'have', labelKey: 'lifestyle_pets.options.have' },
      { value: 'want', labelKey: 'lifestyle_pets.options.want' },
      { value: 'allergic', labelKey: 'lifestyle_pets.options.allergic' },
    ],
  },
  {
    id: 'lifestyle_home_workout',
    category: 'lifestyle',
    type: 'choice',
    questionKey: 'lifestyle_home_workout.question',
    options: [
      { value: 'never', labelKey: 'common.frequency.rarely' },
      { value: 'sometimes', labelKey: 'common.frequency.sometimes' },
      { value: 'weekly', labelKey: 'common.frequency.weekly' },
      { value: 'intense', labelKey: 'lifestyle_home_workout.options.intense' },
    ],
  },
  {
    id: 'remote_work_freq',
    category: 'lifestyle',
    type: 'choice',
    questionKey: 'remote_work_freq.question',
    options: [
      { value: 'never', labelKey: 'common.frequency.rarely' },
      { value: 'few_week', labelKey: 'cooking_frequency.options.few_week' },
      { value: 'most_week', labelKey: 'remote_work_freq.options.most_week' },
      { value: 'full_remote', labelKey: 'remote_work_freq.options.full_remote' },
    ],
  },
  // Personalidad
  {
    id: 'personality_intro_extro',
    category: 'personality',
    type: 'choice',
    questionKey: 'personality_intro_extro.question',
    options: [
      { value: 'introvert', labelKey: 'personality_intro_extro.options.introvert' },
      { value: 'balanced', labelKey: 'personality_intro_extro.options.balanced' },
      { value: 'extrovert', labelKey: 'personality_intro_extro.options.extrovert' },
    ],
  },
  {
    id: 'personality_conflict',
    category: 'personality',
    type: 'choice',
    questionKey: 'personality_conflict.question',
    options: [
      { value: 'direct', labelKey: 'personality_conflict.options.direct' },
      { value: 'talk', labelKey: 'personality_conflict.options.talk' },
      { value: 'message', labelKey: 'personality_conflict.options.message' },
      { value: 'avoid', labelKey: 'personality_conflict.options.avoid' },
    ],
  },
  {
    id: 'personality_flexibility',
    category: 'personality',
    type: 'scale',
    questionKey: 'personality_flexibility.question',
    options: [
      { value: '1', labelKey: 'common.tolerance.low' },
      { value: '2', labelKey: 'common.tolerance.mid_low' },
      { value: '3', labelKey: 'common.tolerance.medium' },
      { value: '4', labelKey: 'common.tolerance.mid_high' },
      { value: '5', labelKey: 'common.tolerance.high' },
    ],
  },
];

export default function Test() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useMemo(() => {
    if (mode === 'quick') {
      return allQuestions.filter(q => quickQuestionIds.includes(q.id));
    }
    return allQuestions;
  }, [mode]);

  const totalSteps = questions.length + 1; // +1 for dealbreakers
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const isDealbreakerStep = currentStep === questions.length;
  const currentQuestion = !isDealbreakerStep ? questions[currentStep] : null;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleDealbreaker = (id: string) => {
    setSelectedDealbreakers((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (isDealbreakerStep) return true;
    return !!currentQuestion && !!answers[currentQuestion.id];
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const testId = mode === 'quick' ? 'convinter_quick' : 'convinter_full';
    const completedField =
      mode === 'quick'
        ? { quick_test_completed: true, quick_test_completed_at: new Date().toISOString() }
        : { full_test_completed: true, full_test_completed_at: new Date().toISOString() };

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error(t('test.errors.auth'));
        navigate('/login');
        return;
      }

      for (const [questionId, value] of Object.entries(answers)) {
        const { error } = await supabase.rpc('convinter_save_answer', {
          p_test_id: testId,
          p_question_id: questionId,
          p_answer_value: { value }
        });

        if (error) {
          console.error('Error saving answer:', questionId, error);
          throw error;
        }
      }

      const updateProfile = async (fields: Record<string, unknown>) => {
        return supabase
          .from('convinter_profiles')
          .update(fields)
          .eq('user_id', session.user.id);
      };

      // Intento con flags nuevas
      let { error: profileError } = await updateProfile({
        dealbreakers: selectedDealbreakers,
        test_completed: true,
        ...completedField,
      });

      // Si falla (p.ej. columnas no existen), reintenta sin las flags nuevas para no bloquear al usuario
      if (profileError) {
        console.warn('Fallo con flags de test, reintentando sin columnas nuevas', profileError);
        const retry = await updateProfile({
          dealbreakers: selectedDealbreakers,
          test_completed: true,
        });
        profileError = retry.error ?? null;
        if (profileError) throw profileError;
        toast.warning(t('test.success') + ' (sin marcar modo quick/full: aplicar migración)');
      }

      toast.success(t('test.success'));
      navigate('/discover');
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error(t('test.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Layout showMobileNav={false}>
      <div className="container py-8 max-w-3xl">
        {/* Mode selector */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('test.modeSubtitle')}</p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
            <Button
              variant={mode === 'quick' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setMode('quick'); setCurrentStep(0); }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t('test.modes.quick')}
            </Button>
            <Button
              variant={mode === 'full' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setMode('full'); setCurrentStep(0); }}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('test.modes.full')}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{t('test.title')}</span>
            <span>{currentStep + 1} / {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20 mb-8"
        >
          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {mode === 'quick' ? t('test.tipQuick') : t('test.tipFull')}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card rounded-2xl p-6"
        >
          {isDealbreakerStep ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">{t('test.dealbreakers.title')}</h2>
                <p className="text-muted-foreground">{t('test.dealbreakers.subtitle')}</p>
              </div>

              <div className="grid gap-3">
                {dealbreakers.map((db) => (
                  <div
                    key={db}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <Checkbox
                      id={db}
                      checked={selectedDealbreakers.includes(db)}
                      onCheckedChange={() => toggleDealbreaker(db)}
                    />
                    <Label htmlFor={db} className="font-medium">{t(`test.dealbreakers.items.${db}`)}</Label>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t(`test.categories.${currentQuestion?.category}`)}</span>
                </div>
                <h2 className="text-xl font-bold">
                  {t(`test.questions.${currentQuestion?.questionKey}`)}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentQuestion?.options.map((option) => {
                      const key = option.labelKey.startsWith('common.')
                        ? `test.${option.labelKey}`
                        : option.labelKey.startsWith('questions.')
                          ? `test.${option.labelKey}`
                          : `test.questions.${option.labelKey}`;
                      const selected = answers[currentQuestion.id] === option.value;
                      return (
                        <Button
                          key={option.value}
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => handleAnswer(currentQuestion.id, option.value)}
                          className="justify-start"
                          aria-pressed={selected}
                        >
                          {t(key)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('test.prev')}
          </Button>
          <Button
            variant="hero"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('test.saving')}
              </>
            ) : currentStep === totalSteps - 1 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                {t('test.complete')}
              </>
            ) : (
              <>
                {t('test.next')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
