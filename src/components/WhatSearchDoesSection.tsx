import { Search, Globe, Code, Filter, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Search,
    text: "Pulls active Google My Business listings",
  },
  {
    icon: Globe,
    text: "Scans businesses ranking on Google and Bing",
  },
  {
    icon: Code,
    text: "Detects WordPress websites",
  },
  {
    icon: Filter,
    text: "Flags outdated, slow, or poorly structured sites",
  },
  {
    icon: CheckCircle,
    text: "Curates only businesses likely to need website design",
  },
];

const WhatSearchDoesSection = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              What This Search Does
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Automated lead qualification
            </h2>
            <p className="text-lg text-muted-foreground">
              This search automatically finds and filters high-intent prospects
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom taglines */}
          <div className="text-center space-y-2 p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <p className="text-xl text-muted-foreground">No scraping junk. No random lists.</p>
            <p className="text-2xl font-bold text-gradient">Only high-intent prospects.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatSearchDoesSection;
