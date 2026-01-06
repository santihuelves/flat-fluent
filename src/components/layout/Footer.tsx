import { Link } from 'react-router-dom';
import { Home, Instagram, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="gradient-bg rounded-xl p-2">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Convinder</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Encuentra tu compañero de piso ideal con compatibilidad real.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/discover" className="hover:text-foreground transition-colors">Descubrir</Link></li>
              <li><Link to="/listings" className="hover:text-foreground transition-colors">Anuncios</Link></li>
              <li><Link to="/test" className="hover:text-foreground transition-colors">Test de compatibilidad</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/#how-it-works" className="hover:text-foreground transition-colors">Cómo funciona</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link></li>
              <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            © 2025 Convinder. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
