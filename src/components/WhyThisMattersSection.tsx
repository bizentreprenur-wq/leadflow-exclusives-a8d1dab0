import { Globe, Lock, ListX, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

const badLeads = [
  { icon: Globe, text: "Businesses with modern websites" },
  { icon: Lock, text: "Companies already locked into agencies" },
  { icon: ListX, text: "Low-quality or inactive listings" },
];

const goodLeads = [
  { icon: TrendingUp, text: "Are already visible online" },
  { icon: Globe, text: "Rely on Google for customers" },
  { icon: AlertTriangle, text: "Have websites holding them back" },
];

const WhyThisMattersSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Why This Matters
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Stop wasting time on dead-end leads
            </h2>
          </div>

          {/* Comparison grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Bad leads */}
            <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/5">
              <h3 className="text-xl font-bold mb-6 text-destructive">
                Most lead lists fail because they include:
              </h3>
              <div className="space-y-4">
                {badLeads.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <p className="text-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Good leads */}
            <div className="p-8 rounded-2xl border border-primary/30 bg-primary/5">
              <h3 className="text-xl font-bold mb-6 text-primary">
                This system finds businesses that:
              </h3>
              <div className="space-y-4">
                {goodLeads.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom statement */}
          <div className="text-center mt-12">
            <p className="text-2xl font-display font-bold text-foreground">
              These are the businesses most likely to <span className="text-gradient">say yes.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyThisMattersSection;
