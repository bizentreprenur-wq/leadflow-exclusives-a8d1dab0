import { Zap, Building, Rocket, Check, Sparkles } from "lucide-react";

const tiers = [
  { 
    icon: Zap, 
    name: "Basic", 
    price: "$49/mo",
    aiMode: "Manual Mode",
    description: "AI assists with writing — you click 'Send'"
  },
  { 
    icon: Building, 
    name: "Pro", 
    price: "$99/mo",
    aiMode: "Co-Pilot Mode",
    description: "AI manages sequences — you jump in to close",
    popular: true
  },
  { 
    icon: Rocket, 
    name: "Autopilot", 
    price: "$249/mo",
    aiMode: "Agentic Mode",
    description: "AI handles everything — Discovery → Nurture → Proposal",
    featured: true
  },
];

const HowAccessWorksSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              2026 AI Outcomes Model
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Choose Your AI Level
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From AI-assisted to fully autonomous — pick the level of automation that fits your workflow.
            </p>
          </div>

          {/* Tiers */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {tiers.map((tier, index) => (
              <div 
                key={index} 
                className={`relative rounded-2xl border p-6 ${
                  tier.featured 
                    ? 'border-amber-500/50 bg-card shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]' 
                    : tier.popular 
                    ? 'border-primary bg-card' 
                    : 'border-border bg-card/80'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium whitespace-nowrap">
                      AI Does Everything
                    </span>
                  </div>
                )}
                {tier.popular && !tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`p-2.5 rounded-xl ${tier.featured ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                    <tier.icon className={`w-6 h-6 ${tier.featured ? 'text-amber-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xl">{tier.name}</h3>
                    <span className={`text-2xl font-bold ${tier.featured ? 'text-amber-500' : 'text-primary'}`}>{tier.price}</span>
                  </div>
                </div>
                
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
                  tier.featured 
                    ? 'bg-amber-500/10 text-amber-500' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  {tier.aiMode}
                </div>
                
                <p className="text-muted-foreground text-sm">{tier.description}</p>
                
                <Check className={`w-5 h-5 ${tier.featured ? 'text-amber-500' : 'text-primary'} mt-4`} />
              </div>
            ))}
          </div>

          {/* Taglines */}
          <div className="text-center space-y-2">
            <p className="text-xl text-muted-foreground">No contracts. Cancel anytime.</p>
            <p className="text-2xl font-bold text-gradient">Let AI buy back your time.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowAccessWorksSection;
