import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const benefits = [
  "Manual, Co-Pilot, or Autopilot modes",
  "12-category AI intelligence reports",
  "From $49/mo — no hidden fees",
];

const CTASection = () => {
  return (
    <section className="py-12 md:py-16 bg-foreground text-primary-foreground">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            Ready to let AI close your
            <span className="text-amber-500"> next 10 deals?</span>
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of agencies and sales teams who are saving 10+ hours per week with BamLead's AI-powered lead generation — from discovery to proposal delivery.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button 
                size="lg" 
                className="rounded-full px-8 py-6 text-base font-semibold gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Sparkles className="w-5 h-5" />
                Go Autopilot
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full px-8 py-6 text-base font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Compare all plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
