import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, VolumeX, X, ChevronRight, ChevronLeft, 
  SkipForward, Play, Pause, Sparkles, Settings2, Check,
  Mic2, Captions, Keyboard
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import mascotImage from "@/assets/bamlead-mascot.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
  category: 'premium' | 'natural' | 'standard';
}

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

// Voice settings storage key
const VOICE_SETTINGS_KEY = "bamlead_voice_settings";

export default function AITourGuide() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tourDisabled, setTourDisabled] = useState(false);
  const [mascotPosition, setMascotPosition] = useState({ x: 0, y: 0 });
  const [isWalking, setIsWalking] = useState(false);
  const [isDemoMinimized, setIsDemoMinimized] = useState(false);
  
  // Voice settings state
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  
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

  // Categorize and organize available voices
  const categorizeVoices = useCallback((): VoiceOption[] => {
    if (!("speechSynthesis" in window)) return [];
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith("en"));
    
    const categorized: VoiceOption[] = [];
    
    // Premium voices (Natural, Premium, Enhanced in name)
    englishVoices.forEach(voice => {
      if (voice.name.includes("Natural") || voice.name.includes("Premium") || voice.name.includes("Enhanced")) {
        categorized.push({
          voice,
          label: voice.name.replace(" (Natural)", "").replace(" (Premium)", ""),
          category: 'premium'
        });
      }
    });
    
    // Natural-sounding voices (specific known good ones)
    const naturalNames = ["Aaron", "Evan", "Daniel", "Samantha", "Karen", "Moira", "Rishi"];
    englishVoices.forEach(voice => {
      if (naturalNames.some(name => voice.name.includes(name)) && !categorized.find(v => v.voice === voice)) {
        categorized.push({
          voice,
          label: voice.name,
          category: 'natural'
        });
      }
    });
    
    // Standard voices (everything else, excluding novelty)
    englishVoices.forEach(voice => {
      if (!categorized.find(v => v.voice === voice) && 
          !voice.name.includes("Novelty") && 
          !voice.name.includes("Zarvox") &&
          !voice.name.includes("Whisper") &&
          !voice.name.includes("Trinoids")) {
        categorized.push({
          voice,
          label: voice.name,
          category: 'standard'
        });
      }
    });
    
    return categorized;
  }, []);

  // Load and set voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = categorizeVoices();
      setAvailableVoices(voices);
      
      // Load saved settings
      const savedSettings = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (savedSettings) {
        try {
          const { voiceName, rate, subtitles } = JSON.parse(savedSettings);
          const savedIndex = voices.findIndex(v => v.voice.name === voiceName);
          if (savedIndex >= 0) setSelectedVoiceIndex(savedIndex);
          if (rate) setSpeechRate(rate);
          if (subtitles !== undefined) setShowSubtitles(subtitles);
        } catch (e) {
          console.log("Could not load voice settings");
        }
      }
    };

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [categorizeVoices]);

  // Save voice settings when changed
  useEffect(() => {
    if (availableVoices.length > 0) {
      const settings = {
        voiceName: availableVoices[selectedVoiceIndex]?.voice.name,
        rate: speechRate,
        subtitles: showSubtitles
      };
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [selectedVoiceIndex, speechRate, showSubtitles, availableVoices]);

  // Get selected voice
  const getSelectedVoice = useCallback(() => {
    if (availableVoices.length === 0) return null;
    return availableVoices[selectedVoiceIndex]?.voice || availableVoices[0]?.voice || null;
  }, [availableVoices, selectedVoiceIndex]);

  // Speak the current step with selected voice
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    
    const selectedVoice = getSelectedVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getSelectedVoice, speechRate]);

  // Test voice with sample text
  const testVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    
    setIsTestingVoice(true);
    window.speechSynthesis.cancel();
    
    const testText = "Hey there! I'm Bam, your friendly guide. How does this voice sound to you?";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    
    const selectedVoice = getSelectedVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsTestingVoice(false);
    utterance.onerror = () => setIsTestingVoice(false);

    window.speechSynthesis.speak(utterance);
    toast.success("Testing voice...", { duration: 2000 });
  }, [getSelectedVoice, speechRate]);

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

  // Keyboard shortcuts
  useEffect(() => {
    if (!showTour) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'n':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'p':
          e.preventDefault();
          prevStep();
          break;
        case ' ':
          e.preventDefault();
          if (isSpeaking) {
            togglePause();
          } else {
            speak(currentStep.description);
          }
          break;
        case 'm':
          e.preventDefault();
          stopSpeaking();
          break;
        case 'Escape':
          e.preventDefault();
          skipTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTour, nextStep, prevStep, isSpeaking, togglePause, speak, currentStep, stopSpeaking, skipTour]);

  // Auto-speak on tour start
  useEffect(() => {
    if (showTour && currentStepIndex === 0 && !isSpeaking) {
      setTimeout(() => {
        speak(currentStep.description);
        moveMascotToElement(currentStep.element);
      }, 800);
    }
  }, [showTour]);

  // Floating demo button (always visible when tour not active)
  if (!showTour && !isFirstVisit) {
    // Minimized state - small icon only
    if (isDemoMinimized) {
      return (
        <button
          onClick={() => setIsDemoMinimized(false)}
          className="fixed top-20 right-4 z-50 w-10 h-10 bg-primary/80 text-primary-foreground rounded-full shadow-lg hover:scale-110 hover:bg-primary transition-all flex items-center justify-center"
          title="Show Demo Button"
        >
          <Play className="w-4 h-4" />
        </button>
      );
    }

    // Full demo button with minimize option
    return (
      <div className="fixed top-20 right-4 z-50 flex items-center gap-1">
        <button
          onClick={() => {
            setIsFirstVisit(false);
            setShowTour(true);
            setCurrentStepIndex(0);
            if (location.pathname !== "/") {
              navigate("/");
            }
            setTimeout(() => {
              speak(TOUR_STEPS[0].description);
              moveMascotToElement(TOUR_STEPS[0].element);
            }, 500);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-l-full shadow-lg hover:brightness-110 transition-all font-medium text-sm"
        >
          <Play className="w-4 h-4" />
          Live Demo
        </button>
        <button
          onClick={() => setIsDemoMinimized(true)}
          className="flex items-center justify-center w-8 h-[36px] bg-primary/80 text-primary-foreground rounded-r-full shadow-lg hover:bg-primary/60 transition-all"
          title="Minimize"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

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

            {/* Description with optional subtitles styling */}
            {showSubtitles && (
              <div className="bg-secondary/50 rounded-lg p-3 mb-4 border-l-2 border-primary">
                <p className="text-foreground text-sm leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            )}
            {!showSubtitles && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {currentStep.description}
              </p>
            )}

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

                {/* Voice Settings Popover */}
                <Popover open={showVoiceSettings} onOpenChange={setShowVoiceSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Voice Settings"
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" side="top">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Mic2 className="w-4 h-4" />
                          Voice Settings
                        </h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={testVoice}
                          disabled={isTestingVoice}
                          className="h-7 text-xs"
                        >
                          {isTestingVoice ? "Playing..." : "Test Voice"}
                        </Button>
                      </div>

                      {/* Voice Selector */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Select Voice</Label>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                          {/* Premium Voices */}
                          {availableVoices.filter(v => v.category === 'premium').length > 0 && (
                            <>
                              <p className="text-xs font-medium text-primary mt-2 mb-1">✨ Premium</p>
                              {availableVoices.map((voiceOption, idx) => 
                                voiceOption.category === 'premium' && (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedVoiceIndex(idx)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                                      selectedVoiceIndex === idx 
                                        ? 'bg-primary/20 text-primary' 
                                        : 'hover:bg-secondary'
                                    }`}
                                  >
                                    <span>{voiceOption.label}</span>
                                    {selectedVoiceIndex === idx && <Check className="w-3 h-3" />}
                                  </button>
                                )
                              )}
                            </>
                          )}
                          
                          {/* Natural Voices */}
                          {availableVoices.filter(v => v.category === 'natural').length > 0 && (
                            <>
                              <p className="text-xs font-medium text-accent mt-2 mb-1">🎯 Natural</p>
                              {availableVoices.map((voiceOption, idx) => 
                                voiceOption.category === 'natural' && (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedVoiceIndex(idx)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                                      selectedVoiceIndex === idx 
                                        ? 'bg-primary/20 text-primary' 
                                        : 'hover:bg-secondary'
                                    }`}
                                  >
                                    <span>{voiceOption.label}</span>
                                    {selectedVoiceIndex === idx && <Check className="w-3 h-3" />}
                                  </button>
                                )
                              )}
                            </>
                          )}
                          
                          {/* Standard Voices */}
                          {availableVoices.filter(v => v.category === 'standard').length > 0 && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground mt-2 mb-1">📢 Standard</p>
                              {availableVoices.map((voiceOption, idx) => 
                                voiceOption.category === 'standard' && (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedVoiceIndex(idx)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                                      selectedVoiceIndex === idx 
                                        ? 'bg-primary/20 text-primary' 
                                        : 'hover:bg-secondary'
                                    }`}
                                  >
                                    <span>{voiceOption.label}</span>
                                    {selectedVoiceIndex === idx && <Check className="w-3 h-3" />}
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Speed Control */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Speed</Label>
                          <span className="text-xs text-muted-foreground">{speechRate.toFixed(2)}x</span>
                        </div>
                        <Slider
                          value={[speechRate]}
                          onValueChange={([value]) => setSpeechRate(value)}
                          min={0.5}
                          max={1.5}
                          step={0.05}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Slow</span>
                          <span>Fast</span>
                        </div>
                      </div>

                      {/* Subtitles Toggle */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-2">
                          <Captions className="w-4 h-4" />
                          Show Subtitles
                        </Label>
                        <Switch
                          checked={showSubtitles}
                          onCheckedChange={setShowSubtitles}
                        />
                      </div>

                      {/* Keyboard Shortcuts */}
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <Keyboard className="w-3 h-3" />
                          Keyboard Shortcuts
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-muted-foreground">← → or N/P</span>
                          <span>Navigate</span>
                          <span className="text-muted-foreground">Space</span>
                          <span>Play/Pause</span>
                          <span className="text-muted-foreground">M</span>
                          <span>Mute</span>
                          <span className="text-muted-foreground">Esc</span>
                          <span>Exit Tour</span>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
