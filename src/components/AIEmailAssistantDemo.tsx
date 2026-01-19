import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Wand2, 
  Brain, 
  Target, 
  Mail, 
  MessageSquare, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Copy,
  RotateCcw,
  User,
  Building2,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

const AIEmailAssistantDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Demo lead data
  const demoLead = {
    name: "Joe's Auto Repair",
    industry: "Automotive",
    website: "joesauto.com",
    issues: ["Slow loading", "No mobile version"]
  };

  // AI suggestions that will be "generated"
  const aiSuggestions = {
    subjects: [
      "Quick fix for Joe's Auto Repair website",
      "Joe, your customers can't find you on mobile",
      "3 issues hurting Joe's Auto Repair online"
    ],
    openers: [
      "Hi Joe, I noticed your website takes 8+ seconds to load...",
      "As a fellow car enthusiast, I checked out Joe's Auto Repair...",
      "Joe, 60% of your customers search on mobile, but..."
    ],
    ctas: [
      "Want me to send a free audit?",
      "Can I show you how we fixed this for another shop?",
      "15 minutes could change your online presence - interested?"
    ]
  };

  const steps = [
    { label: "Lead Detected", icon: User, color: "text-blue-500" },
    { label: "Industry Analyzed", icon: Building2, color: "text-purple-500" },
    { label: "Issues Found", icon: Globe, color: "text-amber-500" },
    { label: "AI Generating", icon: Brain, color: "text-primary" },
    { label: "Ready!", icon: CheckCircle2, color: "text-success" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) {
          return prev + 1;
        } else {
          setShowSuggestions(true);
          return prev;
        }
      });
    }, 1200);

    // Reset animation every 12 seconds
    const resetInterval = setInterval(() => {
      setCurrentStep(0);
      setShowSuggestions(false);
      setAppliedSuggestion(null);
    }, 12000);

    return () => {
      clearInterval(interval);
      clearInterval(resetInterval);
    };
  }, []);

  const handleApply = (text: string) => {
    setIsTyping(true);
    setAppliedSuggestion(text);
    setTimeout(() => setIsTyping(false), 1500);
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 gap-1 bg-gradient-to-r from-primary to-accent text-white border-0">
              <Wand2 className="w-3 h-3" />
              Live Demo
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Watch AI Write Your Emails
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how our AI analyzes leads and generates personalized email content in seconds
            </p>
          </motion.div>
        </div>

        {/* Demo Container */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl border border-border shadow-2xl shadow-primary/10 overflow-hidden"
          >
            {/* Browser Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-warning/60" />
                <span className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="px-4 py-1.5 rounded-lg bg-background/50 text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Email Assistant
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left - Lead Info & Progress */}
              <div className="p-6 md:p-8 border-r border-border bg-background/50">
                {/* Lead Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card rounded-2xl border border-border p-5 mb-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{demoLead.name}</h4>
                      <p className="text-sm text-muted-foreground">{demoLead.website}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {demoLead.industry}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Issues */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Detected Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {demoLead.issues.map((issue, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: currentStep >= 2 ? 1 : 0.3, scale: 1 }}
                          transition={{ delay: i * 0.2 }}
                          className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-xs"
                        >
                          {issue}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* AI Processing Steps */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground mb-4">AI Processing...</p>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0.5 }}
                      animate={{ 
                        opacity: currentStep >= index ? 1 : 0.5,
                        x: currentStep >= index ? 0 : -10
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        currentStep >= index 
                          ? 'bg-primary/5 border border-primary/20' 
                          : 'bg-secondary/30 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentStep >= index ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                        {currentStep > index ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : currentStep === index ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <step.icon className={`w-4 h-4 ${step.color}`} />
                          </motion.div>
                        ) : (
                          <step.icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        currentStep >= index ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                      {currentStep === index && (
                        <motion.div
                          className="ml-auto flex gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {[0, 1, 2].map((dot) => (
                            <motion.span
                              key={dot}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 0.8, delay: dot * 0.2, repeat: Infinity }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right - AI Suggestions */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
                <AnimatePresence mode="wait">
                  {!showSuggestions ? (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-12"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
                      >
                        <Brain className="w-8 h-8 text-primary" />
                      </motion.div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">AI is analyzing...</h4>
                      <p className="text-sm text-muted-foreground">
                        Generating personalized suggestions
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="suggestions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Subject Lines */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Subject Lines</span>
                          <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>
                        </div>
                        <div className="space-y-2">
                          {aiSuggestions.subjects.map((subject, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className={`group flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                                appliedSuggestion === subject
                                  ? 'bg-success/10 border-success/30'
                                  : 'bg-background border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleApply(subject)}
                            >
                              <span className="flex-1 text-sm text-foreground">{subject}</span>
                              {appliedSuggestion === subject ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Zap className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Opening Hooks */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium text-foreground">Opening Hooks</span>
                        </div>
                        <div className="space-y-2">
                          {aiSuggestions.openers.slice(0, 2).map((opener, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.15 }}
                              className="group flex items-center gap-2 p-3 rounded-xl border border-border bg-background hover:border-accent/50 transition-all cursor-pointer"
                            >
                              <span className="flex-1 text-sm text-muted-foreground truncate">{opener}</span>
                              <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* CTA Suggestions */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-foreground">Call-to-Action</span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          className="flex flex-wrap gap-2"
                        >
                          {aiSuggestions.ctas.slice(0, 2).map((cta, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium cursor-pointer hover:bg-amber-500/20 transition-colors"
                            >
                              {cta}
                            </span>
                          ))}
                        </motion.div>
                      </div>

                      {/* Regenerate Button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="pt-4 border-t border-border"
                      >
                        <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
                          <RotateCcw className="w-4 h-4" />
                          Regenerate Suggestions
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Stats Bar */}
            <div className="px-6 py-4 border-t border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-muted-foreground">AI Active</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">2.3s</strong> avg generation time
                </span>
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">47%</strong> higher open rates
                </span>
              </div>
              <Link to="/dashboard">
                <Button size="sm" className="gap-2">
                  Try It Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mt-12"
        >
          {[
            { icon: Sparkles, text: "Smart Personalization" },
            { icon: Brain, text: "Industry Detection" },
            { icon: Target, text: "Pain Point Analysis" },
            { icon: Zap, text: "One-Click Apply" }
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AIEmailAssistantDemo;