import { Check, X, Zap, Building, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Basic",
    price: 49,
    description: "Perfect for freelancers getting started",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    features: [
      { text: "25 GMB searches per day", included: true },
      { text: "10 Platform searches per day", included: true },
      { text: "Basic lead info (name, phone, website)", included: true },
      { text: "WordPress detection", included: true },
      { text: "Email support", included: true },
      { text: "Priority platform detection", included: false },
      { text: "Exclusive territories", included: false },
      { text: "API access", included: false },
      { text: "White-label exports", included: false },
    ],
  },
  {
    name: "Pro",
    price: 99,
    description: "For professionals who want more leads",
    icon: Building,
    color: "text-primary",
    bgColor: "bg-primary/10",
    popular: true,
    features: [
      { text: "100 GMB searches per day", included: true },
      { text: "50 Platform searches per day", included: true },
      { text: "Full lead info + emails", included: true },
      { text: "All 16 platform detections", included: true },
      { text: "Priority support", included: true },
      { text: "Website quality scoring", included: true },
      { text: "Mobile performance flags", included: true },
      { text: "Exclusive territories", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Agency",
    price: 249,
    description: "For teams and agencies at scale",
    icon: Rocket,
    color: "text-accent",
    bgColor: "bg-accent/10",
    features: [
      { text: "Unlimited GMB searches", included: true },
      { text: "Unlimited Platform searches", included: true },
      { text: "Full lead info + verified emails", included: true },
      { text: "All 16 platform detections", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Advanced quality scoring", included: true },
      { text: "SEO health analysis", included: true },
      { text: "Exclusive territories (3 included)", included: true },
      { text: "API access + webhooks", included: true },
    ],
  },
];

const Pricing = () => {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-xl text-foreground">
            LeadDetect
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Simple Pricing
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Choose Your Plan
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            No contracts. No hidden fees. Cancel anytime. Start finding qualified leads today.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border ${
                  tier.popular
                    ? "border-primary bg-card shadow-glow"
                    : "border-border bg-card/50"
                } p-8 flex flex-col`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon and name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {tier.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6">{tier.description}</p>

                {/* CTA */}
                <Button
                  variant={tier.popular ? "hero" : "outline"}
                  className="w-full mb-8"
                  size="lg"
                >
                  Get Started
                </Button>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                        }
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 rounded-2xl border border-border bg-card/30">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Not sure which plan is right for you? Start with a free search and see the quality of leads for yourself.
            </p>
            <Link to="/">
              <Button variant="hero">Try a Free Search</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          Stop guessing. Find businesses that need your service — now.
        </div>
      </footer>
    </main>
  );
};

export default Pricing;
