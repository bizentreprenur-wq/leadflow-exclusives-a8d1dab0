import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, LayoutDashboard, Play, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import mascotLogo from "@/assets/bamlead-mascot.png";
import { startTourManually } from "./AITourGuide";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  const navLinks = [
    { href: "/what-is-bamlead", labelKey: "nav.whatIs" },
    { href: "/features", labelKey: "nav.features" },
    { href: "/use-cases", labelKey: "nav.useCases" },
    { href: "/closeloop", labelKey: "nav.closeloop", isSpecial: true },
    { href: "/pricing", labelKey: "nav.pricing" },
    { href: "/comparisons", labelKey: "nav.comparisons" },
    { href: "/presignup", labelKey: "nav.presignup" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Mascot */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <img 
              src={mascotLogo} 
              alt="BamLead Mascot" 
              className="h-12 w-auto object-contain animate-mascot-bounce group-hover:scale-110 transition-transform"
            />
            <span className="font-display font-bold text-xl text-foreground">
              Bam<span className="text-primary">Lead</span>
            </span>
          </Link>

          {/* Desktop Nav - Center */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-4 font-medium ${
                    link.isSpecial 
                      ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" 
                      : isActive(link.href) 
                        ? "text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.isSpecial && <Zap className="w-3.5 h-3.5 mr-1" />}
                  {t(link.labelKey)}
                </Button>
              </Link>
            ))}
          </div>

          {/* CTA Button - Right */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Tour Demo Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startTourManually}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Play className="w-3.5 h-3.5" />
              {t('nav.demoTour')}
            </Button>
            
            {!isLoading && (
              isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="gap-2 rounded-full px-5 font-semibold">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                      {t('nav.signin')}
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button className="rounded-full px-5 font-semibold">
                      {t('nav.startHere')}
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    className={`w-full justify-start ${
                      link.isSpecial 
                        ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" 
                        : ""
                    }`}
                  >
                    {link.isSpecial && <Zap className="w-3.5 h-3.5 mr-1" />}
                    {t(link.labelKey)}
                  </Button>
                </Link>
              ))}
              
              {/* Language Switcher in Mobile */}
              <div className="px-2 py-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Language</span>
                <LanguageSwitcher />
              </div>
              
              {!isLoading && (
                isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full mt-2 gap-2 rounded-full">
                      <LayoutDashboard className="w-4 h-4" />
                      {t('nav.dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full mt-2 gap-2">
                        <LogIn className="w-4 h-4" />
                        {t('nav.signin')}
                      </Button>
                    </Link>
                    <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full mt-2 rounded-full">{t('nav.startHere')}</Button>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
