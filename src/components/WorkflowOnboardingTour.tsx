import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Play,
  Pause,
  Search,
  Users,
  Send,
  Phone,
  Inbox,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Target,
  Zap,
  Mail,
  Bot,
  Crown,
} from "lucide-react";
import mascotImage from "@/assets/bamlead-mascot.png";

interface WorkflowStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  tips: string[];
  features: string[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "Step 1: Search",
    subtitle: "Find Your Perfect Leads",
    description:
      "Start by choosing your search method. Use Google My Business Scanner to find local businesses, or the Agency Lead Finder to discover clients needing digital services. Enter your niche and location to begin.",
    icon: Search,
    color: "text-teal-500",
    gradient: "from-teal-500 to-emerald-500",
    tips: [
      "Be specific with your search terms (e.g., 'auto mechanics' instead of 'car services')",
      "Target cities with 50k-500k population for best results",
      "Use the filter to exclude businesses with no website",
    ],
    features: [
      "GMB Scanner - Local business discovery",
      "Agency Lead Finder - Digital service prospects",
      "Platform detection - WordPress, Wix, Squarespace",
    ],
  },
  {
    id: 2,
    title: "Step 2: Leads",
    subtitle: "Review & Organize",
    description:
      "View all discovered leads in a spreadsheet format. AI automatically scores each lead and categorizes them as Hot, Warm, or Cold. Select the leads you want to pursue and proceed to outreach.",
    icon: Users,
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-500",
    tips: [
      "Focus on 'Hot' leads first - they have the highest conversion probability",
      "Check the website analysis for pain points to mention in your pitch",
      "Export leads to CSV for CRM import or backup",
    ],
    features: [
      "AI Lead Scoring - Hot/Warm/Cold classification",
      "Website Analysis - Mobile score, load time, issues",
      "Full spreadsheet view with sorting and filters",
    ],
  },
  {
    id: 3,
    title: "Step 3: Email",
    subtitle: "Personalized Outreach",
    description:
      "Configure your SMTP settings, choose from 60+ high-converting templates, and send personalized emails to your leads. AI auto-personalizes each message with the lead's business name and details.",
    icon: Send,
    color: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
    tips: [
      "Set up your SMTP first - we support Gmail, Outlook, custom servers",
      "Use templates matching your service (Web Design, SEO, Marketing)",
      "Schedule sends at optimal times (Tuesday-Thursday 9-11 AM)",
    ],
    features: [
      "60+ High-Converting Templates",
      "AI Personalization Engine",
      "Send scheduling & throttling",
    ],
  },
  {
    id: 4,
    title: "Step 4: Call",
    subtitle: "AI Voice Outreach",
    description:
      "For leads that prefer phone contact, use our AI Voice Agent to make automated calls. The AI handles introductions, qualifies leads, and schedules callbacks - all while you focus on closing deals.",
    icon: Phone,
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
    tips: [
      "AI calls work best during business hours (9 AM - 5 PM local time)",
      "Review call transcripts to improve your pitch",
      "Set up callbacks for interested leads",
    ],
    features: [
      "AI Voice Agent - Automated calls",
      "Call transcripts & analytics",
      "Bulk call queue for efficiency",
    ],
  },
  {
    id: 5,
    title: "Step 5: Mailbox",
    subtitle: "AI Autopilot Campaign",
    description:
      "Your command center for all communications. Monitor email campaigns, view AI-classified responses, and let the AI Autopilot Campaign handle follow-ups automatically. See real-time analytics and conversion funnels.",
    icon: Inbox,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    tips: [
      "Check the Inbox tab for lead replies classified by intent",
      "Enable AI Autopilot to auto-send follow-up sequences",
      "Review Analytics to track your conversion funnel",
    ],
    features: [
      "AI Autopilot Campaign - Automated sequences",
      "Response Classification - Intent & sentiment",
      "Conversion Funnel Analytics",
    ],
  },
];

const STORAGE_KEY = "bamlead_workflow_tour_completed";
const DISMISSED_KEY = "bamlead_workflow_tour_dismissed";

export const startWorkflowTour = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DISMISSED_KEY);
  window.dispatchEvent(new CustomEvent("start-workflow-tour"));
};

interface WorkflowOnboardingTourProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
  forceShow?: boolean;
}

export default function WorkflowOnboardingTour({
  currentStep: externalStep,
  onStepChange,
  forceShow = false,
}: WorkflowOnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showCompletionCard, setShowCompletionCard] = useState(false);

  // Check if tour should show
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(DISMISSED_KEY);

    if (forceShow) {
      setIsVisible(true);
      return;
    }

    if (!completed && !dismissed) {
      // Show tour after a short delay for new users
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Listen for manual tour start
  useEffect(() => {
    const handleStartTour = () => {
      setTourStep(0);
      setIsVisible(true);
      setShowCompletionCard(false);
    };

    window.addEventListener("start-workflow-tour", handleStartTour);
    return () => window.removeEventListener("start-workflow-tour", handleStartTour);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setTourStep((prev) => {
        if (prev >= WORKFLOW_STEPS.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 8000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleNext = useCallback(() => {
    if (tourStep < WORKFLOW_STEPS.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [tourStep]);

  const handlePrev = useCallback(() => {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    }
  }, [tourStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowCompletionCard(true);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsVisible(false);
  }, []);

  const handleGoToStep = useCallback(
    (stepId: number) => {
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEY, "true");
      onStepChange?.(stepId);
    },
    [onStepChange]
  );

  const currentWorkflowStep = WORKFLOW_STEPS[tourStep];
  const progress = ((tourStep + 1) / WORKFLOW_STEPS.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={handleDismiss}
      />

      {/* Tour Card - Fully visible with proper spacing */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 md:inset-auto md:right-6 md:bottom-6 md:top-auto md:left-auto z-[201] max-w-xl w-full md:w-[500px] max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {showCompletionCard ? (
          /* Completion Card */
          <Card className="border-2 border-primary/50 bg-card shadow-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                You're Ready to Go! 🚀
              </h2>
              <p className="text-muted-foreground mb-6">
                You now understand the complete BamLead workflow. Start with Step 1 to find your first leads!
              </p>

              <div className="grid grid-cols-5 gap-2 mb-6">
                {WORKFLOW_STEPS.map((step) => (
                  <Button
                    key={step.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGoToStep(step.id)}
                    className={`flex-col h-auto py-3 hover:bg-gradient-to-br hover:${step.gradient} hover:text-white hover:border-transparent transition-all`}
                  >
                    <step.icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Step {step.id}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setIsVisible(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => handleGoToStep(1)}
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                >
                  <Rocket className="w-4 h-4" />
                  Start Searching
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Tour Step Card */
          <Card className="border-2 border-primary/30 bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${currentWorkflowStep.gradient} p-6 relative overflow-hidden`}
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                >
                  {isAutoPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <currentWorkflowStep.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <Badge className="bg-white/20 text-white border-0 text-xs mb-1">
                    {tourStep + 1} of {WORKFLOW_STEPS.length}
                  </Badge>
                  <h2 className="text-2xl font-bold">{currentWorkflowStep.title}</h2>
                  <p className="text-white/80">{currentWorkflowStep.subtitle}</p>
                </div>
              </div>

              {/* Mascot */}
              <motion.img
                src={mascotImage}
                alt="Bam"
                className="absolute -right-4 -bottom-2 w-24 h-24 object-contain opacity-30"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* Progress */}
            <div className="px-6 pt-4">
              <Progress value={progress} className="h-2" />
            </div>

            {/* Content */}
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {currentWorkflowStep.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Key Features
                </p>
                <div className="grid gap-2">
                  {currentWorkflowStep.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Pro Tips
                </p>
                <ul className="space-y-1.5">
                  {currentWorkflowStep.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2">
                {WORKFLOW_STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setTourStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === tourStep
                        ? "bg-primary w-8"
                        : i < tourStep
                        ? "bg-green-500"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </CardContent>

            {/* Footer Navigation */}
            <div className="border-t px-6 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Tour
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={tourStep === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className={`gap-1 bg-gradient-to-r ${currentWorkflowStep.gradient}`}
                >
                  {tourStep === WORKFLOW_STEPS.length - 1 ? (
                    <>
                      Complete
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
