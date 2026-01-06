import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Globe, TrendingUp, Brain, Heart, Zap, Sparkles, Eye, Target } from "lucide-react";
import mascotLogo from "@/assets/bamlead-mascot.png";

const HeroSection = () => {
  const secretFeatures = [
    { icon: Brain, label: "Pre-Intent Detection", color: "text-primary" },
    { icon: Heart, label: "Emotional AI", color: "text-accent" },
    { icon: Eye, label: "Outcome Simulator", color: "text-blue-500" },
    { icon: Target, label: "Psychological Profiler", color: "text-purple-500" },
  ];

  return (
    <section className="relative bg-card overflow-hidden">
      <div className="container px-4 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Secret Badge */}
            <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1" />
              AI FEATURES NO ONE ELSE HAS
            </Badge>

            {/* Headline with gradient text */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
              <span className="text-primary">Predicts intent</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                before they're ready
              </span>
              <br />
              <span className="text-foreground">to convert</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              The only lead platform with <span className="font-semibold text-primary">Pre-Intent Detection</span>, 
              <span className="font-semibold text-accent"> Emotional State AI</span>, and 
              <span className="font-semibold text-blue-500"> Outcome Simulation</span>. 
              Know what your leads will do before they do it.
            </p>

            {/* Secret Features Pills */}
            <div className="flex flex-wrap gap-2">
              {secretFeatures.map((feature, i) => (
                <div 
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium"
                >
                  <feature.icon className={`h-3 w-3 ${feature.color}`} />
                  {feature.label}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pricing">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 py-6 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-accent"
                >
                  <Zap className="w-5 h-5" />
                  Try Secret AI Features Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">2,847 teams</span> using AI features no competitor has
            </p>
          </div>

          {/* Right Visual - Stylized Card Interface */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-card rounded-3xl border border-border shadow-elevated p-6 md:p-8">
              {/* Card Header */}
              <div className="text-center mb-6">
                <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-500 border-green-500/30">
                  <Zap className="h-3 w-3 mr-1" />
                  AI ANALYZING
                </Badge>
                <p className="text-sm text-muted-foreground font-medium">Pre-Intent Detection Active</p>
                <p className="text-xs text-muted-foreground/70">Predicting visitor behavior in real-time</p>
              </div>

              {/* Mascot Ring */}
              <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56">
                {/* Gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent animate-pulse-slow" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/20 via-transparent to-accent/20" />
                
                {/* Mascot */}
                <div className="absolute inset-4 flex items-center justify-center">
                  <img 
                    src={mascotLogo} 
                    alt="BamLead Mascot" 
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Live Stats */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold text-primary">72%</p>
                  <p className="text-[10px] text-muted-foreground">Intent Score</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <p className="text-lg font-bold text-accent">Curious</p>
                  <p className="text-[10px] text-muted-foreground">Emotional State</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-500">Now</p>
                  <p className="text-[10px] text-muted-foreground">Best Contact</p>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 p-3 bg-card rounded-xl border border-border shadow-card animate-float">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 p-3 bg-card rounded-xl border border-border shadow-card animate-float" style={{ animationDelay: '1s' }}>
              <Heart className="w-5 h-5 text-accent" />
            </div>
            <div className="absolute top-1/2 -right-6 p-3 bg-card rounded-xl border border-border shadow-card animate-float" style={{ animationDelay: '2s' }}>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
