import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Globe, TrendingUp } from "lucide-react";
import mascotLogo from "@/assets/bamlead-mascot.png";

const HeroSection = () => {
  return (
    <section className="relative bg-card overflow-hidden">
      <div className="container px-4 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Headline with gradient text */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
              <span className="text-primary">Find businesses</span>
              <br />
              <span className="text-primary">that need a website</span>
              <br />
              <span className="text-foreground">instantly — every day</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Search Google My Business and live search results to uncover businesses with outdated or WordPress-based websites — fully automated and ready to prospect.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pricing">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 py-6 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  Start finding leads
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual - Stylized Card Interface */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-card rounded-3xl border border-border shadow-elevated p-6 md:p-8">
              {/* Card Header */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground font-medium">Scanning for leads</p>
                <p className="text-xs text-muted-foreground/70">Find your next client</p>
              </div>

              {/* Mascot Ring */}
              <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56">
                {/* Gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent animate-pulse-slow" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/20 via-transparent to-accent/20" />
                
                {/* Mascot */}
                <div className="absolute inset-4 flex items-center justify-center">
                  <img 
                    src={mascotLogo} 
                    alt="BamLead Mascot" 
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Find leads now</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 p-3 bg-card rounded-xl border border-border shadow-card animate-float">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 p-3 bg-card rounded-xl border border-border shadow-card animate-float" style={{ animationDelay: '1s' }}>
              <Globe className="w-5 h-5 text-accent" />
            </div>
            <div className="absolute top-1/2 -right-6 p-3 bg-card rounded-xl border border-border shadow-card animate-float" style={{ animationDelay: '2s' }}>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
