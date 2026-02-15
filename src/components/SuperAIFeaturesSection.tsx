import { 
  Building2, Globe, Phone, MapPin, Star, TrendingUp, Shield, Users,
  Search, BarChart3, Target, Zap, CheckCircle2, Brain, Eye, 
  FileText, Share2, DollarSign, Settings, Briefcase, Award,
  Cpu, Lock, MessageSquare, Activity, AlertTriangle, Lightbulb,
  ShoppingCart, Heart, Factory, LineChart
} from "lucide-react";
import { motion } from "framer-motion";

const SuperAIFeaturesSection = () => {
  // 10 AI Research Categories matching the Super AI Business Search
  const aiResearchCategories = [
    {
      emoji: "🌐",
      title: "Website & Digital Health",
      icon: Globe,
      color: "emerald",
      features: [
        "CMS Detection (WordPress, Webflow, Wix)",
        "SSL Status & Domain Age",
        "Mobile Responsiveness Score",
        "Page Speed & Core Web Vitals",
        "Broken Links & UX Issues",
        "Conversion Elements (Forms, CTAs, Chat)",
        "Analytics & Tracking Pixels"
      ]
    },
    {
      emoji: "📈",
      title: "Online Presence & Visibility",
      icon: Eye,
      color: "blue",
      features: [
        "Google Business Profile Status",
        "Listing Completeness Score",
        "Local SEO Strength",
        "Citation Consistency",
        "Backlink Profile Indicators",
        "Brand Mentions & PR",
        "Knowledge Panel Presence"
      ]
    },
    {
      emoji: "⭐",
      title: "Reviews & Reputation",
      icon: Star,
      color: "amber",
      features: [
        "Multi-Platform Review Aggregation",
        "Average Rating Trends",
        "Review Velocity (New/Month)",
        "Sentiment Analysis",
        "Recurring Complaint Themes",
        "Response Rate to Reviews",
        "Competitor Rating Comparison"
      ]
    },
    {
      emoji: "🧠",
      title: "AI Opportunity & Gap Analysis",
      icon: Lightbulb,
      color: "primary",
      features: [
        "Missed Conversion Opportunities",
        "Website Improvement Suggestions",
        "SEO Gap Identification",
        "Paid Ads Readiness Score",
        "Automation Potential",
        "AI-Recommended Services to Pitch",
        "Estimated Monthly Revenue Lift"
      ]
    },
    {
      emoji: "🛠",
      title: "Technology Stack",
      icon: Cpu,
      color: "violet",
      features: [
        "Analytics Tools (GA4, GTM)",
        "Ad Platforms (Google, Meta, TikTok)",
        "CRM Detection",
        "Email Marketing Platforms",
        "Chatbots & Live Chat Tools",
        "Booking & Payment Gateways",
        "Hosting Provider & CDN"
      ]
    },
    {
      emoji: "🎯",
      title: "Lead Intent & Buying Signals",
      icon: Target,
      color: "accent",
      features: [
        "Hiring Activity Signals",
        "Funding Events Detection",
        "Recent Website Changes",
        "Ad Spend Signals",
        "Marketing Activity Spikes",
        "Traffic Growth Indicators",
        "AI Intent Score"
      ]
    },
    {
      emoji: "🥊",
      title: "Competitor & Market Intel",
      icon: BarChart3,
      color: "orange",
      features: [
        "Direct Competitors Identified",
        "Market Share Indicators",
        "Competitive Gap Analysis",
        "Pricing Signal Detection",
        "Competitor Tech Comparison",
        "Ranking Comparison",
        "Differentiation Opportunities"
      ]
    },
    {
      emoji: "📊",
      title: "Sales & Outreach Readiness",
      icon: MessageSquare,
      color: "pink",
      features: [
        "Decision-Maker Estimation",
        "Contact Channels Available",
        "Response Likelihood Score",
        "Preferred Outreach Channel",
        "Personalization Hooks",
        "Suggested Pitch Angle",
        "Closing Probability Score"
      ]
    },
    {
      emoji: "🧩",
      title: "Compliance & Trust Signals",
      icon: Shield,
      color: "slate",
      features: [
        "Privacy Policy Status",
        "Cookie Compliance Check",
        "ADA Risk Indicators",
        "Security Headers Analysis",
        "Data Handling Indicators",
        "Domain Trust Score",
        "Spam Risk Assessment"
      ]
    },
    {
      emoji: "🧪",
      title: "AI Smart Actions",
      icon: Brain,
      color: "teal",
      features: [
        "AI Business Health Summary",
        "AI-Generated Talking Points",
        "Recommended First Message",
        "Suggested Follow-up Cadence",
        "Auto-Generated Proposal Ideas",
        "'Why Now' Insight",
        "Competitor-Aware Messaging"
      ]
    }
  ];

  // Industry-specific data layers
  const industryLayers = [
    { icon: Cpu, name: "SaaS", features: "ARR signals, churn risk, API presence, product-led growth" },
    { icon: MapPin, name: "Local Services", features: "Service radius, booking friction, seasonal demand" },
    { icon: ShoppingCart, name: "E-commerce", features: "Cart tech, checkout friction, ad pixel usage" },
    { icon: Heart, name: "Healthcare", features: "Compliance readiness, patient review signals" },
    { icon: Building2, name: "Real Estate", features: "Listing velocity, site freshness, IDX usage" },
    { icon: Briefcase, name: "Agencies", features: "Client acquisition strength, portfolio signals" },
  ];

  const targetAudiences = [
    { icon: Briefcase, title: "Digital Agencies", desc: "Find clients with visible problems" },
    { icon: Users, title: "Sales Teams & SDRs", desc: "Get prioritized warm outbound lists" },
    { icon: Globe, title: "SaaS Companies", desc: "ICP-matched businesses for outbound" },
    { icon: DollarSign, title: "Investors & Brokers", desc: "Identify acquisition targets" },
    { icon: Award, title: "Freelancers", desc: "Fast, qualified prospects without ad spend" },
    { icon: Settings, title: "Technology Vendors", desc: "Target businesses with outdated systems" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
      violet: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/30" },
      accent: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
      orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
      pink: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/30" },
      slate: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
      teal: { bg: "bg-teal-500/10", text: "text-teal-500", border: "border-teal-500/30" },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section data-tour="super-ai" className="py-20 md:py-28 bg-gradient-to-b from-background via-card to-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container px-4 relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">🧠 SUPER AI BUSINESS SEARCH</span>
          </motion.div>
          
          <motion.p variants={itemVariants} className="text-primary font-semibold text-lg mb-3">
            Market Intelligence · SWOT Analysis · Buyer Matching · AI Outreach
          </motion.p>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            10 AI Research Categories
            <br />
            <span className="text-primary">2,000+ Leads Per Search</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            BamLead doesn't just find businesses — it builds <span className="text-primary font-semibold">complete market intelligence reports</span> with digital maturity scoring, competitive SWOT analysis, and AI-powered buyer matching. Then it lets you <span className="text-amber-400 font-semibold">reach them via email, voice, or fully autonomous AI campaigns</span>.
          </motion.p>

          <motion.p variants={itemVariants} className="text-base text-foreground/80 max-w-2xl mx-auto">
            Search any keyword and BamLead <span className="text-accent font-semibold">auto-expands across 25+ industry synonym maps</span> to deliver maximum coverage — turning "mechanic" into 15+ targeted searches.
          </motion.p>
        </motion.div>

        {/* 10 AI Research Categories Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {aiResearchCategories.map((category, index) => {
            const colors = getColorClass(category.color);
            return (
              <motion.div 
                key={index}
                variants={itemVariants}
                className={`bg-card rounded-2xl border ${colors.border} p-5 hover:border-primary/50 transition-all duration-300 group`}
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{category.emoji}</span>
                  <h3 className="text-sm font-display font-bold text-foreground leading-tight">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {category.features.slice(0, 5).map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {category.features.length > 5 && (
                    <li className="text-xs text-primary font-medium pl-4">
                      +{category.features.length - 5} more...
                    </li>
                  )}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Industry-Specific Data Layers */}
        <motion.div 
          className="bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5 rounded-3xl border border-amber-500/20 p-6 md:p-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold mb-3">
              <Factory className="w-3 h-3" />
              INDUSTRY-SPECIFIC INTELLIGENCE
            </div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
              🏭 Dynamic Industry Data Layers
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Bamlead adapts per niche with specialized metrics for each industry
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {industryLayers.map((industry, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-amber-500/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <industry.icon className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{industry.name}</p>
                  <p className="text-xs text-muted-foreground">{industry.features}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Who This Is For */}
        <motion.div 
          className="bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-3xl border border-border p-8 md:p-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
              <Target className="w-3 h-3" />
              HIGH-CONVERSION BUYERS
            </div>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Built for Serious Professionals
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sales reps, agencies, investors, SaaS companies — anyone who needs comprehensive business intelligence.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetAudiences.map((audience, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <audience.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{audience.title}</p>
                  <p className="text-xs text-muted-foreground">{audience.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SuperAIFeaturesSection;