import { Search, Filter, MapPin, Globe, Code, Zap, CheckCircle2, AlertTriangle, Share2, Star } from "lucide-react";

const LeadGenSection = () => {
  const features = [
    {
      icon: MapPin,
      title: "GMB Scanner",
      description: "Find local businesses with outdated websites and weak online presence",
      color: "primary"
    },
    {
      icon: Globe,
      title: "Agency Lead Finder",
      description: "Discover clients who need website design, social media & marketing help",
      color: "accent"
    },
    {
      icon: AlertTriangle,
      title: "Issue Detection",
      description: "Detect broken websites, missing reviews, inactive social profiles & more",
      color: "warning"
    },
    {
      icon: Filter,
      title: "Smart Filters",
      description: "Filter by industry, location, and specific issues to find your ideal clients",
      color: "success"
    }
  ];

  const capabilities = [
    "Find businesses with broken or outdated websites",
    "Detect missing tracking pixels & retargeting",
    "Identify weak or inactive social media profiles",
    "Find businesses with low or no reviews",
    "Discover clients leaking leads online",
    "AI-powered lead scoring & prioritization"
  ];

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      
      <div className="container px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Lead Generation</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Find clients who need
            <br />
            <span className="text-primary">your expertise</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for website designers, social media marketers & digital agencies. Our AI finds businesses with gaps you can fill.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Capabilities List */}
        <div className="bg-card rounded-3xl border border-border p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-4">
                <Zap className="w-3 h-3" />
                Powered by AI
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Everything you need to find your next client
              </h3>
              <p className="text-muted-foreground">
                Stop cold calling and start reaching out to businesses that actually need your help.
              </p>
            </div>
            <div className="grid gap-3">
              {capabilities.map((cap, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadGenSection;
