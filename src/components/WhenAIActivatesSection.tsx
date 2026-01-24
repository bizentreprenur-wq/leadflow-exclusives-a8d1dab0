import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Eye, Brain, Heart, Target, Zap, Mail, 
  TrendingUp, Users, Globe, Search, CheckCircle2,
  ArrowRight
} from "lucide-react";

const WhenAIActivatesSection = () => {
  const stages = [
    {
      stage: "1",
      title: "Lead Discovery",
      when: "When you search for leads",
      aiFeatures: [
        { name: "GMB Scanner", desc: "Scans Google My Business for local leads", icon: Search },
        { name: "Agency Lead Finder", desc: "Finds clients for website designers, marketers & agencies", icon: Globe },
        { name: "Reverse Lead Discovery", desc: "Finds who's searching for YOUR services", icon: TrendingUp },
      ],
      color: "primary"
    },
    {
      stage: "2",
      title: "Lead Verification",
      when: "When AI analyzes your leads",
      aiFeatures: [
        { name: "AI Lead Verification", desc: "Validates contact info and scores leads", icon: CheckCircle2 },
        { name: "Pre-Intent Detection", desc: "Predicts which leads will convert", icon: Brain },
        { name: "Psychological Profiler", desc: "Identifies lead personality types", icon: Target },
      ],
      color: "accent"
    },
    {
      stage: "3",
      title: "Email Outreach",
      when: "When you contact leads",
      aiFeatures: [
        { name: "AI Email Writer", desc: "Generates personalized email copy", icon: Mail },
        { name: "Emotional State AI", desc: "Detects and responds to lead emotions", icon: Heart },
        { name: "Founder Mirror", desc: "Shows relevant success stories", icon: Users },
      ],
      color: "success"
    },
    {
      stage: "4",
      title: "Conversion",
      when: "When leads visit your site",
      aiFeatures: [
        { name: "Live Page Mutation", desc: "Personalizes your website in real-time", icon: Eye },
        { name: "Outcome Simulator", desc: "Shows leads their potential results", icon: TrendingUp },
        { name: "Invisible Negotiator", desc: "Optimizes pricing and offers", icon: Zap },
      ],
      color: "warning"
    },
  ];

  const colorClasses = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
    accent: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
    success: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
    warning: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
  };

  return (
    <section data-tour="ai-activation" className="py-20 md:py-28 bg-gradient-to-b from-secondary/20 via-background to-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            WHEN AI FEATURES ACTIVATE
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            AI Works <span className="text-primary">Automatically</span> at Every Stage
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            You don't need to do anything special - our AI features activate automatically 
            throughout your lead generation journey. Here's when each feature kicks in:
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connector Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-amber-500 hidden lg:block -translate-x-1/2" />
          
          <div className="space-y-8 lg:space-y-0">
            {stages.map((stage, index) => {
              const colors = colorClasses[stage.color as keyof typeof colorClasses];
              const isLeft = index % 2 === 0;
              
              return (
                <div key={stage.stage} className={`relative lg:flex items-center ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Stage Number - Center */}
                  <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center w-14 h-14 rounded-full bg-card border-4 border-primary z-10">
                    <span className="text-xl font-bold text-primary">{stage.stage}</span>
                  </div>
                  
                  {/* Content Card */}
                  <div className={`lg:w-1/2 ${isLeft ? 'lg:pr-16' : 'lg:pl-16'}`}>
                    <div className={`bg-card rounded-3xl border ${colors.border} p-6 md:p-8 shadow-card hover:shadow-elevated transition-shadow`}>
                      {/* Mobile Stage Number */}
                      <div className={`lg:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} mb-4`}>
                        <span className={`font-bold ${colors.text}`}>Stage {stage.stage}</span>
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                        {stage.title}
                      </h3>
                      <p className={`text-sm ${colors.text} font-semibold mb-6`}>
                        {stage.when}
                      </p>
                      
                      <div className="space-y-3">
                        {stage.aiFeatures.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                              <feature.icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{feature.name}</p>
                              <p className="text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Spacer for opposite side */}
                  <div className="hidden lg:block lg:w-1/2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-4 p-6 bg-card rounded-2xl border border-border">
            <p className="text-lg font-semibold text-foreground">
              <Sparkles className="w-5 h-5 inline mr-2 text-primary" />
              All 10+ AI features work <span className="text-primary">without any setup</span>
            </p>
            <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <p className="text-muted-foreground">
              Just use BamLead normally and AI does the rest
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhenAIActivatesSection;
