import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Brain, Heart, Eye, Target, Sparkles, TrendingUp, Users, Timer } from "lucide-react";
import mascotLogo from "@/assets/bamlead-mascot.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroSection = () => {
  const { t } = useLanguage();

  const secretFeatures = [
    { icon: Brain, label: "10 AI Research Categories", color: "text-primary" },
    { icon: Eye, label: "100+ Data Points", color: "text-accent" },
    { icon: Heart, label: "Competitor Intel", color: "text-blue-400" },
    { icon: Target, label: "Buying Signals", color: "text-purple-400" },
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
    <section className="relative bg-gradient-to-b from-background via-card to-background overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-16 md:py-24 lg:py-32">
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <div className="space-y-8">
            {/* Secret Badge */}
            <motion.div variants={itemVariants}>
              <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 mr-2 animate-pulse" />
                <span className="font-semibold tracking-wide">🤖 SUPER AI BUSINESS INTELLIGENCE</span>
              </Badge>
            </motion.div>

            {/* Headline with gradient text */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.05] tracking-tight"
            >
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Find any business.
              </span>
              <br />
              <span className="text-foreground">
                Know everything.
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                Close the deal.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              The most advanced AI-powered business search with <span className="text-primary font-medium">10 research categories</span> and <span className="text-accent font-medium">100+ data points</span> — website health, competitor intel, buying signals, tech stack, reputation analysis & AI-powered actions. Built for <span className="text-violet-400 font-medium">agencies</span>, <span className="text-emerald-400 font-medium">sales teams</span>, and <span className="text-blue-400 font-medium">serious professionals</span>.
            </motion.p>

            {/* Secret Features Pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
              {secretFeatures.map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 text-sm font-medium hover:border-primary/50 transition-colors cursor-default"
                >
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  <span className="text-foreground/90">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Link to="/pricing">
                <Button 
                  variant="hero"
                  size="lg" 
                  className="rounded-full px-8 py-6 text-base font-semibold gap-2 group"
                >
                  <Zap className="w-5 h-5 group-hover:animate-pulse" />
                  🚀 Try Super AI Search Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/features">
                <Button 
                  variant="heroOutline"
                  size="lg" 
                  className="rounded-full px-8 py-6 text-base font-medium gap-2"
                >
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center">
                    <Users className="w-3 h-3 text-primary/70" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">2,847+</span> sales teams & agencies using Super AI Business Search
              </p>
            </motion.div>
          </div>

          {/* Right Visual - Enhanced AI Dashboard Card */}
          <motion.div 
            variants={itemVariants}
            className="relative"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-3xl blur-2xl scale-110" />
            
            {/* Main Card with Glassmorphism */}
            <motion.div 
              className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-6 md:p-8"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Header */}
              <div className="text-center mb-6">
                <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  🤖 SUPER AI ACTIVE
                </Badge>
                <p className="text-sm text-foreground font-semibold">10 AI Research Categories</p>
                <p className="text-xs text-muted-foreground mt-1">Website • Reputation • Tech Stack • Competitors • Buying Signals</p>
              </div>

              {/* Mascot Ring with Enhanced Animation */}
              <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56">
                {/* Outer rotating ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Gradient ring */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-accent/10 via-transparent to-primary/10" />
                
                {/* Mascot */}
                <motion.div 
                  className="absolute inset-6 flex items-center justify-center"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img 
                    src={mascotLogo} 
                    alt="BamLead AI Mascot" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </motion.div>
              </div>

              {/* Live Stats with Better Design */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <motion.div 
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-2xl font-bold text-primary">95</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Health Score</p>
                </motion.div>
                <motion.div 
                  className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-lg font-bold text-accent">4.8★</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Avg Rating</p>
                </motion.div>
                <motion.div 
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Timer className="w-4 h-4 text-emerald-400" />
                    <p className="text-lg font-bold text-emerald-400">Hot</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Lead Priority</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Floating Elements with Better Animation */}
            <motion.div 
              className="absolute -top-4 -right-4 p-3 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-6 h-6 text-primary" />
            </motion.div>
            <motion.div 
              className="absolute -bottom-4 -left-4 p-3 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg"
              animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Heart className="w-6 h-6 text-accent" />
            </motion.div>
            <motion.div 
              className="absolute top-1/2 -right-6 p-3 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg"
              animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
