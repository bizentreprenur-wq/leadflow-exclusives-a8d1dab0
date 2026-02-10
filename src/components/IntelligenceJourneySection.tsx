import { Search, Brain, Mail, Phone, BarChart3, Users, Zap, Target, TrendingUp, Clock, Shield, Sparkles } from "lucide-react";

const IntelligenceJourneySection = () => {
  const topStats = [
    {
      label: "LEADS DISCOVERED",
      value: "2,847",
      change: "+24% from last month",
      positive: true,
      icon: Users,
      bg: "bg-primary/10",
      iconColor: "text-primary",
      borderColor: "border-primary/20",
    },
    {
      label: "AI INTELLIGENCE SCORE",
      value: "94.2%",
      change: "+8% accuracy improvement",
      positive: true,
      icon: Brain,
      bg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      label: "EMAILS DELIVERED",
      value: "1,203",
      change: "+18% from previous period",
      positive: true,
      icon: Mail,
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "AI CALLS MADE",
      value: "436",
      change: "+32% conversion rate",
      positive: true,
      icon: Phone,
      bg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
    },
  ];

  const bottomStats = [
    {
      label: "APPOINTMENTS SET",
      value: "89",
      change: "+12% from previous period",
      positive: true,
      icon: Clock,
      bg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      borderColor: "border-orange-500/20",
    },
    {
      label: "RESPONSE RATE",
      value: "34.7%",
      change: "+5% from previous period",
      positive: true,
      icon: TrendingUp,
      bg: "bg-sky-500/10",
      iconColor: "text-sky-400",
      borderColor: "border-sky-500/20",
    },
    {
      label: "SUCCESS RATE",
      value: "28.3%",
      change: "Above industry average",
      positive: true,
      icon: Target,
      bg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
    },
  ];

  const journeySteps = [
    {
      step: "Choose Your Mode",
      title: "Mode A or Mode B",
      description: "Select Super AI Business Search for 12-category market intelligence, or Agency Lead Finder for high-volume contact discovery.",
      details: ["Niche Research & SWOT", "Competitive Analysis", "Buyer Matching", "Agency Lead Finder"],
      icon: Sparkles,
      color: "from-primary to-accent",
      glowColor: "shadow-[0_0_30px_hsl(173_80%_50%_/_0.3)]",
    },
    {
      step: "Step 1 → Step 2",
      title: "Search & Intelligence Review",
      description: "AI discovers leads via parallel streaming, then generates a comprehensive intelligence report with digital maturity scores.",
      details: ["Parallel SSE Streaming", "12-Category Deep Analysis", "Hot/Warm/Cold Scoring", "Digital Maturity Tags"],
      icon: Search,
      color: "from-amber-500 to-orange-500",
      glowColor: "shadow-[0_0_30px_hsl(38_92%_50%_/_0.3)]",
    },
    {
      step: "Step 3",
      title: "AI Strategy & Email Outreach",
      description: "The AI 'Brain' maps lead intelligence to personalized strategies, then auto-configures 7-step autonomous drip sequences.",
      details: ["AI Strategy Engine", "Template Gallery", "7-Step Sequences", "Sentiment Detection"],
      icon: Mail,
      color: "from-emerald-500 to-teal-500",
      glowColor: "shadow-[0_0_30px_hsl(158_64%_50%_/_0.3)]",
    },
    {
      step: "Step 4",
      title: "AI Calling Hub",
      description: "Context-aware AI voice agents call leads using intelligence from every prior step — scripts, pain points, and strategies.",
      details: ["Telnyx Voice AI", "Dynamic Script Gen", "Call Queue & Analytics", "SMS Follow-Up"],
      icon: Phone,
      color: "from-violet-500 to-purple-500",
      glowColor: "shadow-[0_0_30px_hsl(270_60%_50%_/_0.3)]",
    },
  ];

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-4">
            <BarChart3 className="w-4 h-4" />
            Live Intelligence Dashboard
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
            From Discovery to{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-amber-400 bg-clip-text text-transparent">
              Closed Deal
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how BamLead's AI pipeline transforms a simple search into booked appointments — fully autonomous.
          </p>
        </div>

        {/* Top Stats Row — Callin.io style cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {topStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.borderColor} ${stat.bg} p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.iconColor} opacity-60`} />
              </div>
              <span className="text-3xl font-bold text-foreground font-display">{stat.value}</span>
              <span className={`text-xs font-medium ${stat.positive ? "text-emerald-400" : "text-rose-400"}`}>
                ↑ {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {bottomStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.borderColor} ${stat.bg} p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.iconColor} opacity-60`} />
              </div>
              <span className="text-3xl font-bold text-foreground font-display">{stat.value}</span>
              <span className={`text-xs font-medium ${stat.positive ? "text-emerald-400" : "text-rose-400"}`}>
                ↑ {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Intelligence Journey Flow */}
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold font-display text-foreground">
            The Intelligence Pipeline
          </h3>
          <p className="text-muted-foreground mt-2">Every step feeds the next with deeper context</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {journeySteps.map((step, index) => (
            <div key={step.step} className="relative group">
              {/* Connector line */}
              {index < journeySteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-muted-foreground/30 to-transparent z-20" />
              )}

              <div
                className={`rounded-2xl border border-border bg-card p-6 h-full flex flex-col transition-all duration-300 hover:border-primary/40 ${step.glowColor} hover:shadow-lg`}
              >
                {/* Step badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-xs font-bold text-white mb-4 w-fit`}>
                  <step.icon className="w-3.5 h-3.5" />
                  {step.step}
                </div>

                <h4 className="text-lg font-bold font-display text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{step.description}</p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5">
                  {step.details.map((detail) => (
                    <span
                      key={detail}
                      className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground font-medium"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 text-sm font-semibold text-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Full pipeline runs autonomously on <span className="text-amber-400">Autopilot ($249/mo)</span></span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntelligenceJourneySection;
