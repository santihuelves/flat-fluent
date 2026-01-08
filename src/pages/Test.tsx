import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const testQuestions = [
  {
    category: 'cleaning',
    questions: [
      {
        id: 'cleaning_level',
        question: '¿Cómo describirías tu nivel de limpieza?',
        type: 'scale',
        options: [
          { value: '1', label: 'Muy relajado' },
          { value: '2', label: 'Algo relajado' },
          { value: '3', label: 'Normal' },
          { value: '4', label: 'Ordenado' },
          { value: '5', label: 'Muy ordenado' },
        ],
      },
      {
        id: 'dishes_time',
        question: 'Si hay platos en el fregadero, ¿cuánto tardas en lavarlos?',
        type: 'choice',
        options: [
          { value: 'immediate', label: 'Los lavo inmediatamente' },
          { value: 'same_day', label: 'El mismo día' },
          { value: 'next_day', label: 'Al día siguiente' },
          { value: 'whenever', label: 'Cuando me acuerde' },
        ],
      },
    ],
  },
  {
    category: 'schedule',
    questions: [
      {
        id: 'wake_time',
        question: '¿A qué hora sueles despertarte entre semana?',
        type: 'choice',
        options: [
          { value: 'early', label: 'Antes de las 7:00' },
          { value: 'normal', label: '7:00 - 9:00' },
          { value: 'late', label: '9:00 - 11:00' },
          { value: 'very_late', label: 'Después de las 11:00' },
        ],
      },
      {
        id: 'sleep_time',
        question: '¿A qué hora sueles acostarte?',
        type: 'choice',
        options: [
          { value: 'early', label: 'Antes de las 22:00' },
          { value: 'normal', label: '22:00 - 00:00' },
          { value: 'late', label: '00:00 - 02:00' },
          { value: 'very_late', label: 'Después de las 02:00' },
        ],
      },
    ],
  },
  {
    category: 'social',
    questions: [
      {
        id: 'visits_frequency',
        question: '¿Con qué frecuencia te gustaría recibir visitas en casa?',
        type: 'choice',
        options: [
          { value: 'never', label: 'Nunca o casi nunca' },
          { value: 'rarely', label: 'Ocasionalmente (1-2 veces/mes)' },
          { value: 'sometimes', label: 'A veces (1 vez/semana)' },
          { value: 'often', label: 'Frecuentemente (varias veces/semana)' },
        ],
      },
      {
        id: 'parties',
        question: '¿Qué opinas de las fiestas en casa?',
        type: 'choice',
        options: [
          { value: 'never', label: 'Prefiero que no haya fiestas' },
          { value: 'rarely', label: 'Solo en ocasiones especiales' },
          { value: 'sometimes', label: 'De vez en cuando está bien' },
          { value: 'often', label: 'Me encanta organizar fiestas' },
        ],
      },
    ],
  },
];

const dealbreakers = [
  { id: 'no_smokers', label: 'No convivo con fumadores' },
  { id: 'no_pets', label: 'No convivo con mascotas' },
  { id: 'no_parties', label: 'No acepto fiestas en casa' },
  { id: 'no_overnight_guests', label: 'No acepto visitas que se queden a dormir frecuentemente' },
];

export default function Test() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = testQuestions.length + 1; // +1 for dealbreakers
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const isDealbreakerStep = currentStep === testQuestions.length;
  const currentCategory = !isDealbreakerStep ? testQuestions[currentStep] : null;

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
    return currentCategory?.questions.every((q) => answers[q.id]);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Debes iniciar sesión para guardar el test');
        navigate('/login');
        return;
      }

      // Save each answer using the RPC
      for (const [questionId, value] of Object.entries(answers)) {
        const { error } = await supabase.rpc('convinter_save_answer', {
          p_test_id: 'convinter_v2',
          p_question_id: questionId,
          p_answer_value: { value }
        });

        if (error) {
          console.error('Error saving answer:', questionId, error);
          throw error;
        }
      }

      // Update profile with dealbreakers and test_completed
      const { error: profileError } = await supabase
        .from('convinter_profiles')
        .update({
          dealbreakers: selectedDealbreakers,
          test_completed: true
        })
        .eq('user_id', session.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      toast.success('¡Test completado! Ya puedes descubrir compañeros compatibles.');
      navigate('/discover');
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Error al guardar el test. Inténtalo de nuevo.');
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
      <div className="container py-8 max-w-2xl">
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
          <p className="text-sm text-muted-foreground">{t('test.tip')}</p>
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

              <div className="space-y-4">
                {dealbreakers.map((db) => (
                  <div
                    key={db.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      selectedDealbreakers.includes(db.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => toggleDealbreaker(db.id)}
                  >
                    <Checkbox
                      checked={selectedDealbreakers.includes(db.id)}
                      onCheckedChange={() => toggleDealbreaker(db.id)}
                    />
                    <span className="font-medium">{db.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">
                  {t(`test.categories.${currentCategory?.category}`)}
                </h2>
              </div>

              <div className="space-y-8">
                {currentCategory?.questions.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium mb-4">{q.question}</p>
                    <RadioGroup
                      value={answers[q.id] || ''}
                      onValueChange={(value) => handleAnswer(q.id, value)}
                      className="space-y-2"
                    >
                      {q.options.map((option) => (
                        <div
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                            answers[q.id] === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                          onClick={() => handleAnswer(q.id, option.value)}
                        >
                          <RadioGroupItem value={option.value} id={`${q.id}-${option.value}`} />
                          <Label htmlFor={`${q.id}-${option.value}`} className="flex-1 cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
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
                Guardando...
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
