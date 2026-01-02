import { Search, MapPin, RefreshCw, Shield, Check } from "lucide-react";

const features = [
  { icon: Search, text: "Limited searches per day" },
  { icon: MapPin, text: "Location-based access" },
  { icon: RefreshCw, text: "New leads refreshed regularly" },
  { icon: Shield, text: "Exclusive territories (optional)" },
];

const HowAccessWorksSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Subscription Model
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              How access works
            </h2>
          </div>

          {/* Features */}
          <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-card mb-12">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-lg text-foreground font-medium">{feature.text}</p>
                  <Check className="w-5 h-5 text-primary ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Taglines */}
          <div className="text-center space-y-2">
            <p className="text-xl text-muted-foreground">No contracts.</p>
            <p className="text-2xl font-bold text-gradient">Cancel anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowAccessWorksSection;
