import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, VolumeX, X, ChevronRight, ChevronLeft, 
  SkipForward, Play, Pause, Sparkles
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface TourStep {
  id: string;
  page: string;
  element?: string;
  title: string;
  description: string;
  highlight?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    page: "/",
    title: "Welcome to BamLead! 🎉",
    description: "I'm your AI guide. Let me show you around! BamLead is the most advanced lead generation platform with AI features no one else has. Let me walk you through the main features."
  },
  {
    id: "search-methods",
    page: "/",
    element: "[data-tour='dual-search']",
    title: "Two Powerful Search Methods",
    description: "We have TWO ways to find leads. First, Google My Business scanner finds local businesses. Second, our Platform Scanner searches Google and Bing to find businesses with outdated websites like WordPress, Wix, or Joomla. You can try both right on the homepage!"
  },
  {
    id: "agent-cards",
    page: "/",
    element: "[data-tour='agent-cards']",
    title: "Ready-to-Use Scanners",
    description: "These are your two scanning agents. The GMB Scanner finds local businesses with Google My Business listings. The Platform Scanner detects 16 plus legacy platforms. Both analyze website quality instantly."
  },
  {
    id: "ai-features",
    page: "/",
    element: "[data-tour='ai-activation']",
    title: "When AI Features Activate",
    description: "Here's the exciting part! BamLead has 10 plus AI features that work automatically. Pre-Intent Detection predicts who will convert. Emotional State AI reads customer moods. These activate at different stages of your lead journey."
  },
  {
    id: "revolutionary",
    page: "/",
    element: "[data-tour='revolutionary']",
    title: "What Makes Us Different",
    description: "This section shows all the revolutionary features that NO competitor has. We have Outcome Simulators, Psychological Profilers, Invisible Negotiators, and more. These are the secret weapons that give you an unfair advantage."
  },
  {
    id: "pricing-cta",
    page: "/pricing",
    title: "Flexible Pricing",
    description: "Check out our pricing page! We offer a free trial so you can test all features. No credit card required to start. You can search for unlimited leads and try all our AI features for 7 days."
  },
  {
    id: "dashboard-preview",
    page: "/dashboard",
    title: "Your Dashboard",
    description: "This is your command center! From here you can search for leads, verify them with AI, send email campaigns, and track everything. The sidebar gives you access to all features including AI verification and email outreach."
  },
  {
    id: "finish",
    page: "/",
    title: "You're All Set! 🚀",
    description: "That's the tour! You now know the basics of BamLead. Start by searching for leads on the homepage, or sign up for a free trial to unlock all features. If you ever need help, click the chat button in the bottom right. Happy lead hunting!"
  }
];

const STORAGE_KEY = "bamlead_tour_completed";
const TOUR_DISABLED_KEY = "bamlead_tour_disabled";

export default function AITourGuide() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tourDisabled, setTourDisabled] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Check if first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const disabled = localStorage.getItem(TOUR_DISABLED_KEY);
    
    if (disabled === "true") {
      setTourDisabled(true);
      return;
    }

    if (!completed && location.pathname === "/") {
      setIsFirstVisit(true);
      // Small delay to let the page load
      setTimeout(() => setShowTour(true), 1500);
    }
  }, []);

  // Speak the current step
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Google") || 
      v.name.includes("Samantha") || 
      v.name.includes("Alex")
    ) || voices.find(v => v.lang.startsWith("en"));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  // Navigate to step's page if needed
  const goToStep = useCallback((index: number) => {
    const step = TOUR_STEPS[index];
    if (!step) return;

    stopSpeaking();
    setCurrentStepIndex(index);

    // Navigate if needed
    if (step.page !== location.pathname) {
      navigate(step.page);
    }

    // Speak after a short delay
    setTimeout(() => {
      speak(step.description);
    }, 500);

    // Highlight element if specified
    if (step.element) {
      setTimeout(() => {
        const el = document.querySelector(step.element!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("tour-highlight");
          setTimeout(() => el.classList.remove("tour-highlight"), 3000);
        }
      }, 600);
    }
  }, [location.pathname, navigate, speak, stopSpeaking]);

  // Start tour
  const startTour = useCallback(() => {
    setShowTour(true);
    goToStep(0);
  }, [goToStep]);

  // Next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      completeTour();
    }
  }, [currentStepIndex, goToStep]);

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  // Complete tour
  const completeTour = useCallback(() => {
    stopSpeaking();
    localStorage.setItem(STORAGE_KEY, "true");
    setShowTour(false);
    setIsFirstVisit(false);
    if (location.pathname !== "/") {
      navigate("/");
    }
  }, [location.pathname, navigate, stopSpeaking]);

  // Disable tour permanently
  const disableTour = useCallback(() => {
    stopSpeaking();
    localStorage.setItem(TOUR_DISABLED_KEY, "true");
    localStorage.setItem(STORAGE_KEY, "true");
    setTourDisabled(true);
    setShowTour(false);
    setIsFirstVisit(false);
  }, [stopSpeaking]);

  // Skip tour
  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // Auto-speak on tour start
  useEffect(() => {
    if (showTour && currentStepIndex === 0 && !isSpeaking) {
      setTimeout(() => speak(currentStep.description), 800);
    }
  }, [showTour]);

  // Load voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (tourDisabled) return null;

  // First visit prompt (before tour starts)
  if (isFirstVisit && !showTour && location.pathname === "/") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card rounded-3xl border border-border shadow-elevated p-8 max-w-md mx-4 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Welcome to BamLead! 👋
          </h2>
          <p className="text-muted-foreground mb-6">
            Would you like an AI-guided tour of our features? I'll show you around and explain everything with voice narration.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={startTour} size="lg" className="w-full gap-2">
              <Volume2 className="w-5 h-5" />
              Start Voice Tour
            </Button>
            <Button onClick={skipTour} variant="outline" size="lg" className="w-full">
              Skip for Now
            </Button>
            <button 
              onClick={disableTour}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Don't show this again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showTour) return null;

  // Tour panel
  return (
    <>
      {/* Tour highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 40;
          animation: tour-pulse 2s ease-in-out;
        }
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
          50% { box-shadow: 0 0 0 8px rgba(20, 184, 166, 0.3); }
        }
      `}</style>

      {/* Tour Panel */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
        <div className="bg-card rounded-2xl border border-border shadow-elevated overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-secondary">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSpeaking 
                    ? "bg-primary/20 animate-pulse" 
                    : "bg-secondary"
                }`}>
                  {isSpeaking ? (
                    <Volume2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Badge variant="outline" className="mb-1">
                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </Badge>
                  <h3 className="font-display font-bold text-foreground">
                    {currentStep.title}
                  </h3>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={skipTour}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isSpeaking ? togglePause : () => speak(currentStep.description)}
                  className="h-8 w-8"
                >
                  {isSpeaking && !isPaused ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopSpeaking}
                  className="h-8 w-8"
                  disabled={!isSpeaking}
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-muted-foreground"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip Tour
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="gap-1"
                >
                  {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
