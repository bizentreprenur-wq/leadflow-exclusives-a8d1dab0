import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Code, ArrowRight } from "lucide-react";
import mascotLogo from "@/assets/bamlead-mascot.png";

const AgentCardsSection = () => {
  return (
    <section data-tour="agent-cards" className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Ready-to-use lead scanners
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Quick to implement and built for impactful results, our scanners are the quintessential team addition for finding high-intent leads.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* GMB Scanner Card */}
          <div className="group relative bg-card rounded-3xl border border-border p-8 shadow-card hover:shadow-elevated transition-all duration-300">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <img src={mascotLogo} alt="GMB Scanner" className="w-20 h-20 object-contain" />
            </div>

            {/* Title & Type */}
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              GMB Scanner
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
              <MapPin className="w-3 h-3" />
              Google My Business
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Scans Google My Business listings to find businesses with outdated websites, 24/7
            </p>

            {/* Features */}
            <div className="space-y-2 mb-8">
              <p className="font-semibold text-foreground text-sm">Highlighted Features</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Captures local business leads
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Analyzes website quality instantly
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Filters by industry & location
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Link to="/pricing">
              <Button variant="outline" className="rounded-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Agency Lead Finder Card */}
          <div className="group relative bg-card rounded-3xl border border-border p-8 shadow-card hover:shadow-elevated transition-all duration-300">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6">
              <img src={mascotLogo} alt="Agency Lead Finder" className="w-20 h-20 object-contain" />
            </div>

            {/* Title & Type */}
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Agency Lead Finder
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide mb-4">
              <Code className="w-3 h-3" />
              Built for Digital Pros
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Find high-value clients who need website design, social media management, or digital marketing services
            </p>

            {/* Features */}
            <div className="space-y-2 mb-8">
              <p className="font-semibold text-foreground text-sm">Highlighted Features</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Broken or outdated websites ready for redesign
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Missing or inactive social media profiles
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  No reviews, weak GMB & missing tracking pixels
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Link to="/pricing">
              <Button variant="outline" className="rounded-full gap-2 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-all">
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentCardsSection;
