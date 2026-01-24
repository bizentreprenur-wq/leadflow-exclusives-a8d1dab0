import { 
  Building2, Globe, Phone, MapPin, Star, TrendingUp, Shield, Users,
  Search, BarChart3, Target, Zap, CheckCircle2, Brain, Eye, 
  FileText, Share2, DollarSign, Settings, Briefcase, Award
} from "lucide-react";
import { motion } from "framer-motion";

const SuperAIFeaturesSection = () => {
  const featureCategories = [
    {
      title: "Business Identity & Validation",
      icon: Building2,
      color: "primary",
      features: [
        "Business Name & Industry",
        "Operating Status & Years",
        "Physical Address & Service Area",
        "Phone & Email Validation",
        "Business Hours"
      ]
    },
    {
      title: "Website Health & Conversion",
      icon: Globe,
      color: "emerald",
      features: [
        "SSL Status & Mobile Friendly",
        "Page Speed & Core Web Vitals",
        "CTA & Contact Form Detection",
        "Booking System & Live Chat",
        "Trust Badges & Testimonials"
      ]
    },
    {
      title: "Reviews & Reputation",
      icon: Star,
      color: "amber",
      features: [
        "Google Review Count & Rating",
        "Review Velocity & Recency",
        "Owner Response Rate",
        "Negative Review Flags",
        "BBB & Consumer Protection"
      ]
    },
    {
      title: "Social Media Presence",
      icon: Share2,
      color: "blue",
      features: [
        "Facebook, Instagram, LinkedIn",
        "TikTok & YouTube Detection",
        "Posting Frequency",
        "Last Activity Date",
        "Engagement Signals"
      ]
    },
    {
      title: "Tracking & Analytics",
      icon: BarChart3,
      color: "violet",
      features: [
        "Google Analytics (GA4)",
        "Google Tag Manager",
        "Facebook & TikTok Pixels",
        "LinkedIn Insight Tag",
        "Call Tracking Detection"
      ]
    },
    {
      title: "AI Scoring & Intelligence",
      icon: Brain,
      color: "accent",
      features: [
        "Overall Business Health Score",
        "Website & Visibility Score",
        "Conversion & Reputation Score",
        "Growth Opportunity Score",
        "Recommended Next Action"
      ]
    }
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
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-card to-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container px-4 relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">🤖 SUPER AI BUSINESS INTELLIGENCE</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            100+ Data Points on
            <br />
            <span className="text-primary">Every Business</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-3xl mx-auto">
            If your job involves <span className="text-primary font-semibold">finding, fixing, funding, selling to, or scaling businesses</span> — this is the search you need.
          </motion.p>
        </motion.div>

        {/* Feature Categories Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {featureCategories.map((category, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-${category.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <category.icon className={`w-6 h-6 text-${category.color}-500`} />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3">
                {category.title}
              </h3>
              <ul className="space-y-2">
                {category.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
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
