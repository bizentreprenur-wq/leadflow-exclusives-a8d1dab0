import { Globe, TrendingUp, Settings, MapPin, CreditCard, Check } from "lucide-react";

const features = [
  {
    icon: Globe,
    text: "A professionally built website",
  },
  {
    icon: TrendingUp,
    text: "Search engine optimization already in place",
  },
  {
    icon: Settings,
    text: "Ongoing improvements and optimization",
  },
  {
    icon: MapPin,
    text: "Exclusive leads in your service area",
  },
  {
    icon: CreditCard,
    text: "Simple monthly subscription",
  },
];

const WhatYouGetSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              What You Get
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Everything you need, nothing you don't
            </h2>
          </div>

          {/* Features list */}
          <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-card mb-12">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-lg text-foreground font-medium">
                    {feature.text}
                  </p>
                  <Check className="w-5 h-5 text-primary ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Key differentiators */}
          <div className="text-center space-y-3">
            <p className="text-xl text-muted-foreground">
              You don't pay for clicks.
            </p>
            <p className="text-xl text-muted-foreground">
              You don't compete with other businesses on the site.
            </p>
            <p className="text-2xl font-bold text-gradient">
              You just receive customers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatYouGetSection;
