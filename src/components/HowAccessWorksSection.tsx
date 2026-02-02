import { Zap, Building, Rocket, Check, Sparkles, X, Clock, Brain, Mail, Send, MessageSquare, FileText, Search, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TierFeature {
  name: string;
  basic: string | boolean;
  pro: string | boolean;
  autopilot: string | boolean;
  highlight?: 'basic' | 'pro' | 'autopilot';
}

const keyFeatures: TierFeature[] = [
  { name: "Searches per Day", basic: "50", pro: "200", autopilot: "Unlimited", highlight: 'autopilot' },
  { name: "AI Verification Credits", basic: "100", pro: "500", autopilot: "2,000", highlight: 'autopilot' },
  { name: "Initial Email Sending", basic: "Manual", pro: "AI drafts → You send", autopilot: "Fully automatic", highlight: 'autopilot' },
  { name: "Follow-up Emails", basic: "Manual", pro: "Auto after 1st approval", autopilot: "7-step autonomous", highlight: 'autopilot' },
  { name: "Strategy Selection", basic: "You choose", pro: "AI recommends", autopilot: "AI auto-selects", highlight: 'autopilot' },
  { name: "Sequence Selection", basic: "You choose", pro: "You choose", autopilot: "AI assigns per lead", highlight: 'autopilot' },
  { name: "Response Handling", basic: "Manual", pro: "AI notifies", autopilot: "AI auto-responds", highlight: 'autopilot' },
  { name: "Proposal Delivery", basic: false, pro: "AI prepares", autopilot: "AI auto-sends", highlight: 'autopilot' },
  { name: "White-label Reports", basic: false, pro: false, autopilot: true, highlight: 'autopilot' },
  { name: "Time Savings", basic: "~20%", pro: "~50%", autopilot: "~90%", highlight: 'autopilot' },
];

const tiers = [
  { 
    icon: Zap, 
    name: "Basic", 
    price: "$49/mo",
    aiMode: "Manual Mode",
    description: "AI assists with writing — you click 'Send'",
    tagline: "You do everything, AI helps write",
    color: "cyan",
    highlights: [
      "AI helps write emails",
      "You choose strategy & sequences",
      "50 searches/day",
      "100 verification credits",
    ]
  },
  { 
    icon: Building, 
    name: "Pro", 
    price: "$99/mo",
    aiMode: "Co-Pilot Mode",
    description: "AI manages sequences — you jump in to close",
    tagline: "AI is your GPS, you still drive",
    popular: true,
    color: "primary",
    highlights: [
      "AI drafts → You approve & send",
      "Auto follow-ups after first email",
      "You choose sequences",
      "Smart response detection",
      "200 searches/day",
      "500 verification credits",
    ]
  },
  { 
    icon: Rocket, 
    name: "Autopilot", 
    price: "$249/mo",
    aiMode: "Agentic Mode",
    description: "AI handles everything — Discovery → Nurture → Proposal",
    tagline: "AI drives, you handle closings",
    featured: true,
    color: "amber",
    highlights: [
      "Fully autonomous sending",
      "AI selects strategy intelligently",
      "AI assigns sequences per lead",
      "AI reads & responds to replies",
      "Auto-pause on positive response",
      "Auto proposal delivery",
      "White-label reports",
      "Unlimited searches",
      "2,000 verification credits",
    ]
  },
];

const HowAccessWorksSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
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

          {/* Tiers with Feature Highlights */}
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
                
                <p className="text-muted-foreground text-sm mb-2">{tier.description}</p>
                <p className="text-xs font-medium text-foreground mb-4">"{tier.tagline}"</p>
                
                {/* Feature highlights */}
                <div className="space-y-2 border-t border-border pt-4">
                  {tier.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className={`w-4 h-4 shrink-0 ${tier.featured ? 'text-amber-500' : 'text-primary'}`} />
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Comparison Table (collapsed by default on mobile) */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground text-lg text-center">Detailed Feature Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="p-3 text-center font-medium text-primary">
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>Basic</span>
                        <span className="text-xs font-normal">$49/mo</span>
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-primary">
                      <div className="flex flex-col items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span>Pro</span>
                        <span className="text-xs font-normal">$99/mo</span>
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-amber-500">
                      <div className="flex flex-col items-center gap-1">
                        <Rocket className="w-4 h-4" />
                        <span>Autopilot</span>
                        <span className="text-xs font-normal">$249/mo</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keyFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{feature.name}</td>
                      <td className="p-3 text-center">
                        <FeatureValue value={feature.basic} highlight={feature.highlight === 'basic'} />
                      </td>
                      <td className="p-3 text-center">
                        <FeatureValue value={feature.pro} highlight={feature.highlight === 'pro'} />
                      </td>
                      <td className="p-3 text-center">
                        <FeatureValue value={feature.autopilot} highlight={feature.highlight === 'autopilot'} isAutopilot />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Taglines */}
          <div className="text-center space-y-2 mt-12">
            <p className="text-xl text-muted-foreground">No contracts. Cancel anytime.</p>
            <p className="text-2xl font-bold text-gradient">Let AI buy back your time.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper component to render feature values
function FeatureValue({ value, highlight, isAutopilot }: { value: string | boolean; highlight?: boolean; isAutopilot?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={`w-5 h-5 mx-auto ${isAutopilot ? 'text-amber-500' : 'text-primary'}`} />
    ) : (
      <X className="w-5 h-5 mx-auto text-muted-foreground/50" />
    );
  }
  
  return (
    <span className={`text-xs ${
      highlight 
        ? isAutopilot 
          ? 'text-amber-500 font-medium' 
          : 'text-primary font-medium'
        : 'text-muted-foreground'
    }`}>
      {value}
    </span>
  );
}

export default HowAccessWorksSection;
