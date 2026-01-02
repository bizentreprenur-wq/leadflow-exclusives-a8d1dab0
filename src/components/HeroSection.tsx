import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-glow pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
            <span className="text-sm text-muted-foreground font-medium">
              Limited availability — one business per area
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Customers Are Searching for
            <span className="block text-gradient">This Service Right Now</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            This website is already built to rank on Google and generate real customer inquiries — without ads, long contracts, or setup fees.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" className="group">
              See If This Is Available in Your Area
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="heroOutline" size="xl">
              How It Works
            </Button>
          </div>

          {/* Quick explanation */}
          <div className="max-w-3xl mx-auto p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              This website is not a template.
            </p>
            <p className="text-xl md:text-2xl font-display font-semibold text-foreground mb-4">
              It's a ready-to-use customer acquisition system.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We build, rank, and optimize the site first. When it's producing leads, a single business gets exclusive access through a simple monthly subscription. <span className="text-foreground font-medium">You focus on serving customers. The website sends them to you.</span>
            </p>
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
