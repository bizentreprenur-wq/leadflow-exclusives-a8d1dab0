import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, VolumeX, X, ChevronRight, ChevronLeft, 
  SkipForward, Play, Pause, Sparkles
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import mascotImage from "@/assets/bamlead-mascot.png";

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
    description: "Well hello there, friend! I'm Bam, and I'll be your guide today. Allow me to walk you through BamLead, the most advanced lead generation platform on the market. Shall we get started?"
  },
  {
    id: "search-methods",
    page: "/",
    element: "[data-tour='dual-search']",
    title: "Two Powerful Search Methods",
    description: "Now, right over here, we have two excellent ways to find leads. First, our Google My Business scanner locates local businesses. Second, our Platform Scanner searches Google and Bing to find businesses running outdated websites. Quite impressive, wouldn't you say?"
  },
  {
    id: "agent-cards",
    page: "/",
    element: "[data-tour='agent-cards']",
    title: "Ready-to-Use Scanners",
    description: "Walk with me over here to meet your scanning agents. The GMB Scanner tracks down local businesses with Google My Business listings. And the Platform Scanner, well, it detects over 16 legacy platforms and analyzes website quality in an instant."
  },
  {
    id: "ai-features",
    page: "/",
    element: "[data-tour='ai-activation']",
    title: "When AI Features Activate",
    description: "Now this, my friend, is where things get truly exciting. BamLead has over 10 AI features that work automatically. Pre-Intent Detection predicts who will convert. Emotional State AI reads customer moods. These powerful tools activate at different stages of your lead journey."
  },
  {
    id: "revolutionary",
    page: "/",
    element: "[data-tour='revolutionary']",
    title: "What Makes Us Different",
    description: "Allow me to show you the crown jewels. This section showcases all the revolutionary features that no competitor has. We're talking about Outcome Simulators, Psychological Profilers, and Invisible Negotiators. These are your secret weapons, my friend."
  },
  {
    id: "pricing-cta",
    page: "/pricing",
    title: "Flexible Pricing",
    description: "Now, let's head on over to the pricing page. We offer a free trial so you can test all features before committing. No credit card required to get started. You can search for unlimited leads and try all our AI features for seven days. A fine deal, if I do say so myself."
  },
  {
    id: "dashboard-preview",
    page: "/dashboard",
    title: "Your Dashboard",
    description: "And here we are at your command center. From this dashboard, you can search for leads, verify them with AI, send email campaigns, and track everything. The sidebar gives you access to all features, including AI verification and email outreach."
  },
  {
    id: "finish",
    page: "/",
    title: "You're All Set! 🚀",
    description: "Well, that concludes our tour! You now know the fundamentals of BamLead. Start by searching for leads on the homepage, or sign up for a free trial to unlock all features. If you ever need assistance, just click the chat button. Best of luck with your lead hunting, my friend!"
  }
];

const STORAGE_KEY = "bamlead_tour_completed";
const TOUR_DISABLED_KEY = "bamlead_tour_disabled";

// Export function to start tour from anywhere
export const startTourManually = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('start-tour'));
};

export default function AITourGuide() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tourDisabled, setTourDisabled] = useState(false);
  const [mascotPosition, setMascotPosition] = useState({ x: 0, y: 0 });
  const [isWalking, setIsWalking] = useState(false);
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
      setTimeout(() => setShowTour(true), 1500);
    }
  }, []);

  // Listen for manual tour start
  useEffect(() => {
    const handleStartTour = () => {
      setTourDisabled(false);
      setIsFirstVisit(true);
      setShowTour(false);
      setCurrentStepIndex(0);
      if (location.pathname !== "/") {
        navigate("/");
      }
      setTimeout(() => setShowTour(true), 500);
    };

    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, [location.pathname, navigate]);

  // Find American English MALE voice (older gentleman style)
  const getAmericanMaleVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return null;
    
    const voices = window.speechSynthesis.getVoices();
    
    // Priority order for American MALE voices
    const americanMaleVoice = voices.find(v => 
      v.lang === "en-US" && v.name.includes("Google US English Male")
    ) || voices.find(v => 
      v.lang === "en-US" && v.name.includes("Alex")
    ) || voices.find(v => 
      v.lang === "en-US" && v.name.includes("Daniel")
    ) || voices.find(v => 
      v.lang === "en-US" && v.name.includes("Fred")
    ) || voices.find(v => 
      v.lang === "en-US" && v.name.includes("Tom")
    ) || voices.find(v => 
      v.lang === "en-US" && v.name.toLowerCase().includes("male")
    ) || voices.find(v => 
      v.lang === "en-US" && !v.name.includes("Samantha") && !v.name.includes("Victoria") && !v.name.includes("Karen")
    ) || voices.find(v => 
      v.lang === "en-US"
    );
    
    return americanMaleVoice || null;
  }, []);

  // Speak the current step with natural American male voice
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Natural speaking rate
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1;
    
    const americanMaleVoice = getAmericanMaleVoice();
    if (americanMaleVoice) {
      utterance.voice = americanMaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getAmericanMaleVoice]);

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

  // Move Bam to element
  const moveMascotToElement = useCallback((elementSelector?: string) => {
    setIsWalking(true);
    
    if (elementSelector) {
      const el = document.querySelector(elementSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY;
        
        // Position Bam next to the element (left side)
        setMascotPosition({
          x: Math.max(20, rect.left - 100),
          y: rect.top + scrollY + (rect.height / 2) - 60
        });
      }
    } else {
      // Default position for welcome/finish steps (center top)
      setMascotPosition({
        x: window.innerWidth / 2 - 60,
        y: window.scrollY + 200
      });
    }

    setTimeout(() => setIsWalking(false), 800);
  }, []);

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

    // Speak and move Bam after a short delay
    setTimeout(() => {
      speak(step.description);
      moveMascotToElement(step.element);
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
  }, [location.pathname, navigate, speak, stopSpeaking, moveMascotToElement]);

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
      setTimeout(() => {
        speak(currentStep.description);
        moveMascotToElement(currentStep.element);
      }, 800);
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
          <img 
            src={mascotImage} 
            alt="Bam the mascot" 
            className="w-24 h-24 mx-auto mb-4 object-contain animate-bounce"
          />
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Hey there! I'm Bam! 👋
          </h2>
          <p className="text-muted-foreground mb-6">
            Welcome to BamLead! Want me to walk you through our features? I'll guide you around and explain everything!
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={startTour} size="lg" className="w-full gap-2">
              <Volume2 className="w-5 h-5" />
              Let's Go, Bam!
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

  // Tour panel with Bam mascot walking
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
        @keyframes bam-walk {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes bam-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Bam Mascot - Walking to each section */}
      <div 
        className="fixed z-[60] pointer-events-none transition-all duration-1000 ease-out"
        style={{
          left: `${mascotPosition.x}px`,
          top: `${mascotPosition.y}px`,
        }}
      >
        <div className={`relative ${isWalking ? 'animate-[bam-walk_0.4s_ease-in-out_infinite]' : isSpeaking ? 'animate-[bam-bounce_0.6s_ease-in-out_infinite]' : ''}`}>
          <img 
            src={mascotImage} 
            alt="Bam" 
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
          {/* Speech indicator */}
          {isSpeaking && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Volume2 className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

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
                <img 
                  src={mascotImage} 
                  alt="Bam" 
                  className={`w-12 h-12 object-contain ${isSpeaking ? 'animate-pulse' : ''}`}
                />
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
