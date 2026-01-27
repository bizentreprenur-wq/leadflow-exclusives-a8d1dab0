import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Eye, 
  Zap,
  Target,
  Radar,
  Handshake,
  Wand2,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Lightbulb,
  Shield,
  Mail,
  Search,
  BarChart3,
  Users,
  Clock,
  MessageSquare,
  Mic,
  Command,
  Image,
  Award
} from "lucide-react";
import { Link } from "react-router-dom";

const RevolutionaryFeaturesSection = () => {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const secretAIFeatures = [
    {
      id: "pre-intent",
      name: "Pre-Intent Detection",
      icon: <Brain className="h-6 w-6" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      tagline: "Knows they want to buy before THEY know",
      whatItDoes: "AI monitors mouse movements, scroll speed, pricing page dwell time, and hesitation patterns to predict conversion probability.",
      whyRevolutionary: "No one else tracks behavioral micro-signals to predict intent. You can trigger personalized offers the moment someone shows buying intent — before they even fill out a form.",
      stats: "72% accuracy predicting conversions"
    },
    {
      id: "emotional",
      name: "Emotional State Detection",
      icon: <Heart className="h-6 w-6" />,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      tagline: "Reads emotions from typing patterns",
      whatItDoes: "Detects frustration, confidence, curiosity, and anxiety by analyzing typing speed, deletions, pauses, and corrections in real-time.",
      whyRevolutionary: "Competitors guess at sentiment. We MEASURE it. Automatically adjust your messaging tone based on how the lead is feeling right now.",
      stats: "5 emotional states detected"
    },
    {
      id: "reverse-discovery",
      name: "Reverse Lead Discovery",
      icon: <Radar className="h-6 w-6" />,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      tagline: "Finds companies who ALMOST visited you",
      whatItDoes: "Analyzes browsing patterns across the web to identify companies with similar intent to your converters who haven't found you yet.",
      whyRevolutionary: "Instead of waiting for leads to find you, discover the ones who are actively looking but went to competitors instead. Like mind-reading for sales.",
      stats: "12,000+ patterns analyzed"
    },
    {
      id: "outcome-simulator",
      name: "Outcome Simulator",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      tagline: "Time travel for sales decisions",
      whatItDoes: "Simulates what happens if you contact a lead today vs. in 3 days, via email vs. phone, with different messaging approaches.",
      whyRevolutionary: "Stop guessing the best time and channel. AI predicts outcomes using historical patterns from thousands of similar deals.",
      stats: "40% better timing accuracy"
    },
    {
      id: "psychological",
      name: "Psychological Profiler",
      icon: <Target className="h-6 w-6" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      tagline: "Not demographics. Psychology.",
      whatItDoes: "Builds profiles of risk tolerance, decision speed, price sensitivity, authority level, and trust threshold for each lead.",
      whyRevolutionary: "Real persuasion science, not marketing gimmicks. Know exactly how to frame pricing, what proof to show, and when to follow up based on psychological traits.",
      stats: "5 psychological dimensions"
    },
    {
      id: "invisible-negotiator",
      name: "Invisible Negotiator",
      icon: <Handshake className="h-6 w-6" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      tagline: "Closes deals while you sleep",
      whatItDoes: "Automatically adjusts pricing display, offers micro-concessions (payment plans, guarantees, bonuses), and reframes ROI based on detected psychology.",
      whyRevolutionary: "No human intervention needed. AI negotiates in real-time, offering the perfect incentive to each lead based on their specific resistance points.",
      stats: "+34% close rate improvement"
    },
    {
      id: "live-mutation",
      name: "Live Page Mutation",
      icon: <Wand2 className="h-6 w-6" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      tagline: "Two people never see the same page",
      whatItDoes: "Rewrites headlines, CTAs, value props, social proof, and urgency triggers in real-time based on visitor persona and funnel stage.",
      whyRevolutionary: "Not A/B testing. Full content shapeshifting. A SaaS founder sees different messaging than an agency owner — automatically.",
      stats: "6 content elements mutated"
    },
    {
      id: "founder-mirror",
      name: "AI Founder Mirror",
      icon: <Eye className="h-6 w-6" />,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      tagline: "Brutally honest about your funnel",
      whatItDoes: "Audits your funnel flow, messaging clarity, pricing psychology, and UX. Tells you exactly what is causing leads to drop off.",
      whyRevolutionary: "Most founders guess why they lose deals. This AI tells you the truth: 'Your value prop takes 8 seconds to understand. That is 6 seconds too long.'",
      stats: "4 audit categories scored"
    }
  ];

  const coreFeatures = [
    {
      icon: <Zap className="h-5 w-5" />,
      name: "Real-Time Website Analysis",
      description: "Live scraping for CMS, speed, SEO, tech stack, and conversion elements"
    },
    {
      icon: <Target className="h-5 w-5" />,
      name: "Full Report Export",
      description: "Export complete intelligence as PDF, Excel, or Google Drive"
    },
    {
      icon: <Search className="h-5 w-5" />,
      name: "10 AI Research Categories",
      description: "Website health, reputation, tech stack, competitors, buying signals & more"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      name: "100+ Data Points",
      description: "Comprehensive intelligence on every lead for maximum conversion"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      name: "Email Outreach System",
      description: "12+ templates, drag-and-drop sequence builder, automated follow-ups"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      name: "AI Email Writer",
      description: "Generate personalized cold emails in seconds based on lead data"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      name: "Sentiment Analyzer",
      description: "Analyze email tone, formality, and urgency before sending"
    },
    {
      icon: <Mic className="h-5 w-5" />,
      name: "Voice Search",
      description: "Speak your search query instead of typing — hands-free discovery"
    },
    {
      icon: <Award className="h-5 w-5" />,
      name: "AI Sales Mentor",
      description: "Practice your pitch with AI, get feedback scores, improve skills"
    },
    {
      icon: <Users className="h-5 w-5" />,
      name: "Referral & Affiliate Program",
      description: "Earn 20-35% commission with gamified leaderboards and rewards"
    }
  ];

  return (
    <section data-tour="revolutionary" className="py-12 md:py-16 bg-gradient-to-b from-muted/50 via-background to-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5">
            <Sparkles className="h-4 w-4 mr-2" />
            WHAT MAKES BAMLEAD DIFFERENT
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">AI Features</span>{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-amber-500 bg-clip-text text-transparent">
              No One Else Has
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We built 8 AI agents plus real-time website analysis, 10 research categories, 100+ data points, and full report exports. 
            These are not just features — they are unfair advantages that make you unstoppable.
          </p>
        </div>

        {/* Revolutionary AI Section */}
        <div className="mb-20">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/50" />
            <Badge variant="outline" className="text-amber-500 border-amber-500/50 px-4">
              <Zap className="h-3 w-3 mr-1" />
              8 REVOLUTIONARY AI AGENTS
            </Badge>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {secretAIFeatures.map((feature) => (
              <Card 
                key={feature.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${feature.borderColor} border-2`}
                onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${feature.bgColor} ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{feature.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">
                          EXCLUSIVE
                        </Badge>
                      </div>
                      <p className={`text-sm font-medium ${feature.color}`}>
                        {feature.tagline}
                      </p>
                    </div>
                  </div>

                  {/* What It Does */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      What It Does
                    </p>
                    <p className="text-sm text-foreground">
                      {feature.whatItDoes}
                    </p>
                  </div>

                  {/* Why Revolutionary */}
                  <div className={`p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Why This Is Revolutionary
                    </p>
                    <p className="text-sm">
                      {feature.whyRevolutionary}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${feature.color} ${feature.borderColor}`}>
                      {feature.stats}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Try It Live <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${feature.bgColor} blur-2xl opacity-50`} />
              </Card>
            ))}
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/50" />
            <Badge variant="outline" className="text-primary border-primary/50 px-4">
              <Star className="h-3 w-3 mr-1" />
              PLUS 10+ CORE FEATURES
            </Badge>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {coreFeatures.map((feature, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-3">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-sm mb-1">{feature.name}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">BamLead vs. Everyone Else</h3>
                <p className="text-muted-foreground">See why teams are switching to BamLead</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* BamLead Column */}
                <div className="space-y-3">
                  <div className="font-bold text-lg text-primary flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5" />
                    BamLead
                  </div>
                  {[
                    "Pre-Intent Detection (knows before they do)",
                    "Emotional State AI (reads typing patterns)",
                    "Reverse Lead Discovery (finds hidden leads)",
                    "Outcome Simulator (time travel for sales)",
                    "Psychological Profiler (real persuasion science)",
                    "Invisible Negotiator (auto-closes deals)",
                    "Live Page Mutation (shapeshifting content)",
                    "AI Founder Mirror (brutal funnel feedback)"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Competitors Column */}
                <div className="space-y-3">
                  <div className="font-bold text-lg text-muted-foreground flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5" />
                    Other Tools
                  </div>
                  {[
                    "Basic lead scoring",
                    "Standard email templates",
                    "Simple contact database",
                    "Manual follow-up reminders",
                    "Basic analytics dashboard",
                    "Generic A/B testing",
                    "Static landing pages",
                    "Self-service help docs"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to use AI features that actually give you an unfair advantage?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8">
                <Zap className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="px-8">
                See All Features
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevolutionaryFeaturesSection;
