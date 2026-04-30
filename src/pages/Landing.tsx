import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { 
import { useSEO } from '@/hooks/useSEO';
  Users, 
  Heart, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Shield,
  FileText,
  Search
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  useSEO({ page: 'landing' });

  const { t } = useTranslation();

  return (
    <Layout showMobileNav={false}>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-16">
        {/* Video de fondo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-top -z-20"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/50 -z-10" />

        <div className="container relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center space-y-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Test de compatibilidad real</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance text-white"
            >
              {t('landing.hero.title').split(' ').map((word, i, arr) => 
                i >= arr.length - 2 ? (
                  <span key={i} className="gradient-text"> {word}</span>
                ) : (
                  <span key={i}> {word}</span>
                )
              )}
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-balance"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl" className="gap-2 group">
                  {t('landing.hero.cta')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="hero-outline" size="xl" className="border-white/30 text-white hover:bg-white/10">
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {[
              { value: '10K+', label: t('landing.stats.users'), icon: Users },
              { value: '8K+', label: t('landing.stats.matches'), icon: Heart },
              { value: '50+', label: t('landing.stats.cities'), icon: MapPin },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 text-white mb-3 backdrop-blur-sm">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.features.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('landing.features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: CheckCircle, 
                title: t('landing.features.compatibility.title'), 
                desc: t('landing.features.compatibility.description'),
                color: 'text-primary bg-primary/10' 
              },
              { 
                icon: Search, 
                title: t('landing.features.explanation.title'), 
                desc: t('landing.features.explanation.description'),
                color: 'text-secondary bg-secondary/10' 
              },
              { 
                icon: FileText, 
                title: t('landing.features.contract.title'), 
                desc: t('landing.features.contract.description'),
                color: 'text-accent bg-accent/10' 
              },
              { 
                icon: Shield, 
                title: t('landing.features.security.title'), 
                desc: t('landing.features.security.description'),
                color: 'text-success bg-success/10' 
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 card-hover"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.howItWorks.title')}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            
            {[
              { step: '1', ...JSON.parse(JSON.stringify({ title: t('landing.howItWorks.step1.title'), desc: t('landing.howItWorks.step1.description') })) },
              { step: '2', ...JSON.parse(JSON.stringify({ title: t('landing.howItWorks.step2.title'), desc: t('landing.howItWorks.step2.description') })) },
              { step: '3', ...JSON.parse(JSON.stringify({ title: t('landing.howItWorks.step3.title'), desc: t('landing.howItWorks.step3.description') })) },
              { step: '4', ...JSON.parse(JSON.stringify({ title: t('landing.howItWorks.step4.title'), desc: t('landing.howItWorks.step4.description') })) },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-bg text-primary-foreground font-bold text-lg mb-4 relative z-10">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="container relative">
          <motion.div 
            className="max-w-3xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold">{t('landing.cta.title')}</h2>
            <p className="text-lg text-muted-foreground">{t('landing.cta.subtitle')}</p>
            <Link to="/signup">
              <Button variant="hero" size="xl" className="gap-2">
                {t('landing.cta.button')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
