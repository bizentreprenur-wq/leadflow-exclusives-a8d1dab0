import { Search, Globe, Brain, TrendingUp, Users, Target, BarChart3, Mail, Phone, Zap, Palette, Megaphone, Code } from "lucide-react";

const searchAFeatures = [
  {
    icon: Brain,
    text: "Niche Research — Aggregate market intelligence: digital maturity scores, website quality, CMS trends, and competitive gaps",
  },
  {
    icon: BarChart3,
    text: "Competitive Analysis — Auto-generated SWOT, competitor benchmarking, and differentiation strategies",
  },
  {
    icon: Target,
    text: "Buyer Matching — AI identifies companies that need YOUR product based on capability gaps and fit scoring",
  },
  {
    icon: Search,
    text: "Smart Keyword Expansion — Search 'mechanic' and BamLead searches 15+ synonyms (auto repair, diesel technician…)",
  },
  {
    icon: Globe,
    text: "Digital Maturity Tags — Every business classified as Digitally Strong, Digitally Weak, Traditional, or Growth-oriented",
  },
];

const searchBFeatures = [
  {
    icon: Palette,
    text: "Website Design Leads — Find businesses with outdated, broken, or missing websites that need your services",
  },
  {
    icon: Megaphone,
    text: "SMMA & Marketing Leads — Discover businesses with weak social media, no ads, or poor online visibility",
  },
  {
    icon: Code,
    text: "SaaS & Tech Leads — Identify companies using outdated tech stacks ready for modern software solutions",
  },
  {
    icon: Users,
    text: "SSE Streaming — Real-time progressive delivery of leads with emails, phones, and website audits",
  },
  {
    icon: TrendingUp,
    text: "Service Gap Detection — AI spots what services each business is missing so you can pitch the perfect solution",
  },
];

const outreachFeatures = [
  {
    icon: Mail,
    text: "AI Email Outreach — Smart templates, drip sequences, A/B testing, and deliverability tracking",
  },
  {
    icon: Phone,
    text: "AI Voice Calling — Automated calling with AI scripts, call queues, and SMS follow-ups",
  },
  {
    icon: Zap,
    text: "AI Autopilot — Fully autonomous campaigns that handle outreach, follow-ups, and responses 24/7",
  },
];

const WhatSearchDoesSection = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              What BamLead Actually Does
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Intelligence First. Outreach Second.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              BamLead is not a scraping tool — it's a market intelligence engine that turns niche research into strategic opportunities, then helps you close them.
            </p>
          </div>

          {/* Search A - Market Intelligence */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              🧠 Option A: Super AI Business Search
            </h3>
            <p className="text-sm text-muted-foreground mb-4">For SaaS teams, B2B sales, investors, and market researchers selling TO niches</p>
            <div className="space-y-3">
              {searchAFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-base font-medium text-foreground">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Search B - Agency Lead Finder */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-violet-400 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5" />
              🎯 Option B: Agency Lead Finder
            </h3>
            <p className="text-sm text-muted-foreground mb-4">For website designers, SMMA owners, marketing agencies, SaaS companies, freelancers & service sellers</p>
            <div className="space-y-3">
              {searchBFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-base font-medium text-foreground">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach Features */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI-Powered Outreach
            </h3>
            <div className="space-y-3">
              {outreachFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-base font-medium text-foreground">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom taglines */}
          <div className="text-center space-y-2 p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <p className="text-xl text-muted-foreground">Not a lead scraper. Not a contact database.</p>
            <p className="text-2xl font-bold text-gradient">Market intelligence + agency lead finder + AI outreach — all in one platform.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatSearchDoesSection;
