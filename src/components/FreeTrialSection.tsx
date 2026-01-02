import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FreeTrialSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* CTA card */}
          <div className="relative p-8 md:p-12 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent shadow-glow overflow-hidden text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Try a Free Search
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                No credit card required
              </p>

              <Button variant="hero" size="xl" className="group">
                Start Free Search
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeTrialSection;
