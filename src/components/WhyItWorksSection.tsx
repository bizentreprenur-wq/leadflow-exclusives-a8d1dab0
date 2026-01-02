import { Shield, TrendingUp, Target, Ban } from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "Trust",
    description: "Customers trust organic search results",
  },
  {
    icon: TrendingUp,
    title: "Compound Growth",
    description: "SEO traffic compounds over time",
  },
  {
    icon: Target,
    title: "Quality",
    description: "One business per area means higher lead quality",
  },
  {
    icon: Ban,
    title: "No Waste",
    description: "No agency retainers or ad spend",
  },
];

const WhyItWorksSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Why This Model Works
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Proven, not theoretical
            </h2>
          </div>

          {/* Reasons grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {reasons.map((reason, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6 shadow-card">
                  <reason.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom statement */}
          <div className="text-center">
            <p className="text-xl text-muted-foreground">
              This isn't marketing theory — <span className="text-foreground font-semibold">it's a proven model.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItWorksSection;
