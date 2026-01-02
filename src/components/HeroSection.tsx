import { Link } from "react-router-dom";
import SearchModule from "@/components/SearchModule";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-glow pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto">
          {/* Content */}
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
              <span className="text-sm text-muted-foreground font-medium">
                Live data from Google My Business + Search Results
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Find Businesses That Actually Need
              <span className="block text-gradient">a New Website — Instantly</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Search Google My Business and live Google/Bing results to uncover businesses with outdated or WordPress-based websites that are losing customers.
            </p>
          </div>

          {/* Search Module */}
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <SearchModule />
          </div>

          {/* Pricing link */}
          <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/pricing">
              <Button variant="link" className="text-muted-foreground hover:text-primary">
                View Pricing Plans →
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
