import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, AlertTriangle, Smile, Frown, Meh, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmotionalState {
  primary: string;
  confidence: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface EmotionMetrics {
  frustration: number;
  confidence: number;
  curiosity: number;
  anxiety: number;
  urgency: number;
}

const EmotionalStateDetector = () => {
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [deletions, setDeletions] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());
  const [isDetecting, setIsDetecting] = useState(false);

  const [emotions, setEmotions] = useState<EmotionMetrics>({
    frustration: 15,
    confidence: 60,
    curiosity: 45,
    anxiety: 20,
    urgency: 35
  });

  const [primaryState, setPrimaryState] = useState<EmotionalState>({
    primary: "Neutral",
    confidence: 0,
    icon: <Meh className="h-6 w-6" />,
    color: "text-muted-foreground",
    description: "Start typing to detect emotional state..."
  });

  const [messagingTone, setMessagingTone] = useState({
    recommended: "Balanced",
    style: "Professional yet approachable",
    urgency: "Moderate"
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const now = Date.now();
    const timeDiff = now - lastKeyTime;
    setLastKeyTime(now);

    // Detect typing speed
    if (timeDiff < 150) {
      setTypingSpeed(prev => Math.min(100, prev + 5));
    } else if (timeDiff > 500) {
      setPauses(prev => prev + 1);
      setTypingSpeed(prev => Math.max(0, prev - 10));
    }

    // Detect deletions
    if (e.key === "Backspace" || e.key === "Delete") {
      setDeletions(prev => prev + 1);
    }

    setIsDetecting(true);
  };

  // Calculate emotional state based on typing patterns
  useEffect(() => {
    if (!isDetecting) return;

    const newEmotions: EmotionMetrics = {
      frustration: Math.min(100, deletions * 8 + (pauses > 3 ? 20 : 0)),
      confidence: Math.max(0, 80 - deletions * 5 - pauses * 3),
      curiosity: Math.min(100, inputValue.includes("?") ? 80 : 40 + typingSpeed * 0.3),
      anxiety: Math.min(100, (typingSpeed > 70 ? 40 : 20) + deletions * 3),
      urgency: Math.min(100, typingSpeed * 0.8 + (inputValue.includes("!") ? 30 : 0))
    };

    setEmotions(newEmotions);

    // Determine primary emotional state
    const states: EmotionalState[] = [
      {
        primary: "Frustrated",
        confidence: newEmotions.frustration,
        icon: <Frown className="h-6 w-6" />,
        color: "text-red-500",
        description: "User shows signs of frustration. Use calming, supportive messaging."
      },
      {
        primary: "Confident",
        confidence: newEmotions.confidence,
        icon: <Smile className="h-6 w-6" />,
        color: "text-green-500",
        description: "User appears decisive. Use direct, action-oriented messaging."
      },
      {
        primary: "Curious",
        confidence: newEmotions.curiosity,
        icon: <Activity className="h-6 w-6" />,
        color: "text-blue-500",
        description: "User is exploring. Provide detailed information and options."
      },
      {
        primary: "Anxious",
        confidence: newEmotions.anxiety,
        icon: <AlertTriangle className="h-6 w-6" />,
        color: "text-yellow-500",
        description: "User shows hesitation. Offer reassurance and social proof."
      },
      {
        primary: "Urgent",
        confidence: newEmotions.urgency,
        icon: <Zap className="h-6 w-6" />,
        color: "text-orange-500",
        description: "User wants quick action. Streamline the path to conversion."
      }
    ];

    const dominant = states.reduce((a, b) => a.confidence > b.confidence ? a : b);
    setPrimaryState(dominant);

    // Update messaging recommendations
    if (dominant.primary === "Frustrated") {
      setMessagingTone({
        recommended: "Calm & Supportive",
        style: "Empathetic, offer help proactively",
        urgency: "Low - don't pressure"
      });
    } else if (dominant.primary === "Confident") {
      setMessagingTone({
        recommended: "Direct & Decisive",
        style: "Clear CTAs, confident language",
        urgency: "High - ready to convert"
      });
    } else if (dominant.primary === "Anxious") {
      setMessagingTone({
        recommended: "Reassuring",
        style: "Testimonials, guarantees, risk reduction",
        urgency: "Low - build trust first"
      });
    } else {
      setMessagingTone({
        recommended: "Balanced",
        style: "Informative yet engaging",
        urgency: "Moderate"
      });
    }
  }, [typingSpeed, deletions, pauses, inputValue, isDetecting]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-accent/10">
            <Heart className="h-5 w-5 text-accent" />
          </div>
          Emotional State Detection
          <Badge variant="outline" className="ml-auto bg-purple-500/10 text-purple-500 border-purple-500/30">
            AI-POWERED
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time emotional analysis from typing patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Try typing something:</label>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here to see emotional detection in action..."
            className="w-full h-20 p-3 rounded-lg border border-border bg-background/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Primary State */}
        <div className={cn(
          "p-4 rounded-xl border transition-all",
          primaryState.primary === "Neutral" 
            ? "bg-muted/30 border-muted" 
            : "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-full bg-background/80", primaryState.color)}>
              {primaryState.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{primaryState.primary}</span>
                {isDetecting && (
                  <Badge variant="secondary" className="text-xs">
                    {primaryState.confidence}% confidence
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{primaryState.description}</p>
            </div>
          </div>
        </div>

        {/* Emotion Meters */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emotion Breakdown
          </p>
          
          {Object.entries(emotions).map(([emotion, value]) => (
            <div key={emotion} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{emotion}</span>
                <span className="text-muted-foreground">{Math.round(value)}%</span>
              </div>
              <Progress 
                value={value} 
                className={cn(
                  "h-2",
                  emotion === "frustration" && "bg-red-500/20",
                  emotion === "confidence" && "bg-green-500/20",
                  emotion === "curiosity" && "bg-blue-500/20",
                  emotion === "anxiety" && "bg-yellow-500/20",
                  emotion === "urgency" && "bg-orange-500/20"
                )}
              />
            </div>
          ))}
        </div>

        {/* Typing Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Speed</span>
            </div>
            <p className="font-bold text-primary">{Math.round(typingSpeed)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-xs text-muted-foreground">Deletions</span>
            </div>
            <p className="font-bold text-red-500">{deletions}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Pauses</span>
            </div>
            <p className="font-bold text-yellow-500">{pauses}</p>
          </div>
        </div>

        {/* Messaging Recommendation */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs font-medium text-green-500 mb-2">AI Messaging Recommendation</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Tone</p>
              <p className="font-medium">{messagingTone.recommended}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Style</p>
              <p className="font-medium truncate">{messagingTone.style}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Urgency</p>
              <p className="font-medium">{messagingTone.urgency}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalStateDetector;
