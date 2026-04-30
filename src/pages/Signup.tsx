import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';

export default function Signup() {
  useSEO({ page: 'signup' });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          }
        }
      });

      if (error) throw error;

      toast({
        title: '¡Cuenta creada!',
        description: 'Te hemos enviado un email de confirmación.',
      });
      
      navigate('/onboarding');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      let message = 'No se pudo crear la cuenta';
      if (errorMessage.includes('already registered')) {
        message = 'Este email ya está registrado';
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showFooter={false} showMobileNav={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-2xl p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4">
                <Home className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t('auth.signup.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('auth.signup.subtitle')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.signup.name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.signup.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.signup.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('auth.signup.button')}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('auth.signup.hasAccount')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('auth.signup.loginLink')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
