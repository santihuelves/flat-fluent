import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';

export default function Login() {
  useSEO({ page: 'login', noIndex: true });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: '¡Bienvenido de vuelta!',
        description: 'Has iniciado sesión correctamente.',
      });
      
      navigate('/discover');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión';
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
              <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('auth.login.subtitle')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.login.email')}</Label>
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
                <Label htmlFor="password">{t('auth.login.password')}</Label>
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

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('auth.login.button')}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('auth.login.noAccount')}{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                {t('auth.login.signupLink')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
