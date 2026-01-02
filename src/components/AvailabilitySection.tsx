import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

const AvailabilitySection = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Urgency card */}
          <div className="relative p-8 md:p-12 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent shadow-glow overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 text-center">
              {/* Lock icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-8">
                <Lock className="w-8 h-8 text-primary" />
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Limited Availability
              </h2>

              {/* Description */}
              <p className="text-lg text-muted-foreground mb-4">
                To protect lead quality, only <span className="text-foreground font-semibold">one business per service area</span> can subscribe.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Once the spot is taken, it's no longer available.
              </p>

              {/* CTA */}
              <Button variant="hero" size="xl" className="group">
                Check Availability in My Area
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AvailabilitySection;
