import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Brain, Mail, Phone, BarChart3, Users, Zap, Target, TrendingUp, Clock, Shield, Sparkles, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration, startCounting]);

  return count;
};

const StatCard = ({ stat, index, isVisible }: { stat: any; index: number; isVisible: boolean }) => {
  const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ""));
  const animatedValue = useCountUp(numericValue, 2000, isVisible);
  const suffix = stat.value.includes("%") ? "%" : "";
  const prefix = stat.value.includes(",") ? "" : "";

  const formatValue = () => {
    if (stat.value.includes(",")) {
      return animatedValue.toLocaleString();
    }
    if (stat.value.includes(".")) {
      const decimals = stat.value.split(".")[1]?.replace(/[^0-9]/g, "").length || 0;
      return (animatedValue / Math.pow(10, decimals)).toFixed(decimals);
    }
    return animatedValue.toString();
  };

  // Re-derive animated display properly
  const displayValue = isVisible ? `${prefix}${formatValue()}${suffix}` : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`rounded-xl border ${stat.borderColor} ${stat.bg} p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] cursor-default`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-muted-foreground">{stat.label}</span>
        <stat.icon className={`w-5 h-5 ${stat.iconColor} opacity-60`} />
      </div>
      <span className="text-3xl font-bold text-foreground font-display tabular-nums">{displayValue}</span>
      <span className="text-xs font-medium text-emerald-400">↑ {stat.change}</span>
    </motion.div>
  );
};

const PipelineStep = ({ step, index, isVisible }: { step: any; index: number; isVisible: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
      className="relative group"
    >
      {/* Connector line */}
      {index < 3 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isVisible ? { scaleX: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
          className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-muted-foreground/40 to-transparent z-20 origin-left"
        />
      )}

      <div
        onClick={() => setExpanded(!expanded)}
        className={`rounded-2xl border border-border bg-card p-6 flex flex-col transition-all duration-300 cursor-pointer
          hover:border-primary/40 ${step.glowColor} hover:shadow-lg
          ${expanded ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
      >
        {/* Step badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-xs font-bold text-white w-fit`}>
            <step.icon className="w-3.5 h-3.5" />
            {step.step}
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>

        <h4 className="text-lg font-bold font-display text-foreground mb-2">{step.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {step.details.map((detail: string) => (
            <span key={detail} className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground font-medium">
              {detail}
            </span>
          ))}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                {step.expandedContent.map((item: { label: string; desc: string }, i: number) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${step.checkColor}`} />
                    <div>
                      <span className="text-sm font-semibold text-foreground">{item.label}</span>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
                {index < 3 && (
                  <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                    <span>Feeds into next step</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const IntelligenceJourneySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const topStats = [
    { label: "LEADS DISCOVERED", value: "2,847", change: "+24% from last month", icon: Users, bg: "bg-primary/10", iconColor: "text-primary", borderColor: "border-primary/20" },
    { label: "AI INTELLIGENCE SCORE", value: "94.2", change: "+8% accuracy improvement", icon: Brain, bg: "bg-amber-500/10", iconColor: "text-amber-400", borderColor: "border-amber-500/20" },
    { label: "EMAILS DELIVERED", value: "1,203", change: "+18% from previous period", icon: Mail, bg: "bg-emerald-500/10", iconColor: "text-emerald-400", borderColor: "border-emerald-500/20" },
    { label: "AI CALLS MADE", value: "436", change: "+32% conversion rate", icon: Phone, bg: "bg-violet-500/10", iconColor: "text-violet-400", borderColor: "border-violet-500/20" },
  ];

  const bottomStats = [
    { label: "APPOINTMENTS SET", value: "89", change: "+12% from previous period", icon: Clock, bg: "bg-orange-500/10", iconColor: "text-orange-400", borderColor: "border-orange-500/20" },
    { label: "RESPONSE RATE", value: "34.7", change: "+5% from previous period", icon: TrendingUp, bg: "bg-sky-500/10", iconColor: "text-sky-400", borderColor: "border-sky-500/20" },
    { label: "SUCCESS RATE", value: "28.3", change: "Above industry average", icon: Target, bg: "bg-rose-500/10", iconColor: "text-rose-400", borderColor: "border-rose-500/20" },
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
      checkColor: "text-primary",
      expandedContent: [
        { label: "Mode A: Super AI Business Search", desc: "Deep 12-category intelligence with digital maturity scoring, SWOT analysis, and buyer matching across 500-2,000+ businesses." },
        { label: "Mode B: Agency Lead Finder", desc: "High-volume contact discovery optimized for SaaS, SMMA, marketing agencies — finds emails and phone numbers at scale." },
        { label: "Synonym AI Expansion", desc: "Multiplies lead volume by intelligently expanding your search query with industry-specific synonyms." },
        { label: "Search Context Sets the Entire Pipeline", desc: "Your mode selection determines templates, sequences, PreDone documents, and AI calling scripts downstream." },
      ],
    },
    {
      step: "Step 1 → Step 2",
      title: "Search & Intelligence Review",
      description: "AI discovers leads via parallel streaming, then generates a comprehensive intelligence report with digital maturity scores.",
      details: ["Parallel SSE Streaming", "12-Category Deep Analysis", "Hot/Warm/Cold Scoring", "Digital Maturity Tags"],
      icon: Search,
      color: "from-amber-500 to-orange-500",
      glowColor: "shadow-[0_0_30px_hsl(38_92%_50%_/_0.3)]",
      checkColor: "text-amber-400",
      expandedContent: [
        { label: "Real-Time Parallel Streaming", desc: "Results appear instantly via Server-Sent Events while enrichment runs asynchronously in the background." },
        { label: "12-Category Business Intelligence", desc: "From Business Identity to Communication Intelligence — every lead gets a comprehensive profile." },
        { label: "AI Lead Scoring", desc: "Hot, Warm, Cold classification based on email availability (+35 boost), website health, reviews, and engagement signals." },
        { label: "Intelligence Report Auto-Pop", desc: "Appears once after a unique search — never on login or session restore. Accessible anytime via the orange button." },
      ],
    },
    {
      step: "Step 3",
      title: "AI Strategy & Email Outreach",
      description: "The AI 'Brain' maps lead intelligence to personalized strategies, then auto-configures 7-step autonomous drip sequences.",
      details: ["AI Strategy Engine", "Template Gallery", "7-Step Sequences", "Sentiment Detection"],
      icon: Mail,
      color: "from-emerald-500 to-teal-500",
      glowColor: "shadow-[0_0_30px_hsl(158_64%_50%_/_0.3)]",
      checkColor: "text-emerald-400",
      expandedContent: [
        { label: "AI Strategy Engine (The Brain)", desc: "Generates campaign purpose statements, match scores, expected response rates, and personalized openers for each lead group." },
        { label: "6 Specialized Scenarios", desc: "No Website Rescue, Review Booster, Visibility Booster, Hot Lead Accelerator, Outdated Site Modernization, Market Presence Audit." },
        { label: "7-Step Autonomous Sequences", desc: "Auto-pause when positive sentiment or inquisitive responses are detected — preventing over-communication." },
        { label: "PreDone Documents", desc: "Search-type-exclusive proposals and contracts auto-attached to outreach — niche-selling or service-selling, never mixed." },
      ],
    },
    {
      step: "Step 4",
      title: "AI Calling Hub",
      description: "Context-aware AI voice agents call leads using intelligence from every prior step — scripts, pain points, and strategies.",
      details: ["Telnyx Voice AI", "Dynamic Script Gen", "Call Queue & Analytics", "SMS Follow-Up"],
      icon: Phone,
      color: "from-violet-500 to-purple-500",
      glowColor: "shadow-[0_0_30px_hsl(270_60%_50%_/_0.3)]",
      checkColor: "text-violet-400",
      expandedContent: [
        { label: "Contextual Script Generation", desc: "Scripts synthesize search context, intelligence reports, AI strategies, email sequences, and PreDone documents into personalized talking points." },
        { label: "Dual-Mode Communication", desc: "Automated AI-driven conversations with eventual handoff to manual human calling when needed." },
        { label: "Phone Number Provisioning", desc: "One unique local number per user — provision by area code (with city labels like 212 NYC), port, or release." },
        { label: "SMS + Call Analytics", desc: "Bi-directional SMS chat, call recordings, outcome tracking, and hot lead identification from call results." },
      ],
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
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
        </motion.div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {topStats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} isVisible={isVisible} />
          ))}
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {bottomStats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i + 4} isVisible={isVisible} />
          ))}
        </div>

        {/* Intelligence Pipeline Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl md:text-3xl font-bold font-display text-foreground">
            The Intelligence Pipeline
          </h3>
          <p className="text-muted-foreground mt-2">Click any step to explore — every step feeds the next with deeper context</p>
        </motion.div>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {journeySteps.map((step, index) => (
            <PipelineStep key={step.step} step={step} index={index} isVisible={isVisible} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 text-sm font-semibold text-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Full pipeline runs autonomously on <span className="text-amber-400">Autopilot ($249/mo)</span></span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntelligenceJourneySection;
