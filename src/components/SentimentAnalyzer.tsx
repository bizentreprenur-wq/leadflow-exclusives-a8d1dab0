import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Smile,
  Meh,
  Frown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  RefreshCw,
  MessageSquare,
  Zap,
} from "lucide-react";

interface SentimentResult {
  score: number; // 0-100
  label: "positive" | "neutral" | "negative";
  confidence: number;
  suggestions: string[];
  tone: string;
  formality: "formal" | "casual" | "neutral";
  urgency: "high" | "medium" | "low";
}

interface SentimentAnalyzerProps {
  text: string;
  onApplySuggestion?: (suggestion: string) => void;
  compact?: boolean;
}

const analyzeText = (text: string): SentimentResult => {
  if (!text || text.length < 10) {
    return {
      score: 50,
      label: "neutral",
      confidence: 0,
      suggestions: ["Add more content to analyze sentiment"],
      tone: "Unknown",
      formality: "neutral",
      urgency: "low",
    };
  }

  const lowerText = text.toLowerCase();
  
  // Positive indicators
  const positiveWords = ["amazing", "great", "excellent", "wonderful", "love", "excited", "thrilled", "happy", "pleasure", "delighted", "fantastic", "awesome", "perfect", "best", "thank", "appreciate", "opportunity", "success", "growth", "benefit"];
  const negativeWords = ["unfortunately", "sorry", "problem", "issue", "concern", "worried", "urgent", "asap", "immediately", "complaint", "disappointed", "frustrated", "angry", "terrible", "worst", "hate", "fail", "error", "mistake"];
  const formalWords = ["sincerely", "regards", "respectfully", "hereby", "pursuant", "kindly", "would like to", "please find", "attached", "enclosed"];
  const casualWords = ["hey", "hi there", "just wanted", "btw", "gonna", "wanna", "awesome", "cool", "thanks!", "cheers"];
  const urgentWords = ["urgent", "asap", "immediately", "deadline", "critical", "important", "priority", "time-sensitive", "must", "required"];

  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const formalCount = formalWords.filter(w => lowerText.includes(w)).length;
  const casualCount = casualWords.filter(w => lowerText.includes(w)).length;
  const urgentCount = urgentWords.filter(w => lowerText.includes(w)).length;

  // Calculate sentiment score
  let score = 50 + (positiveCount * 8) - (negativeCount * 10);
  score = Math.max(0, Math.min(100, score));

  const label: "positive" | "neutral" | "negative" = 
    score >= 65 ? "positive" : score <= 35 ? "negative" : "neutral";

  const confidence = Math.min(95, 40 + (positiveCount + negativeCount) * 10 + Math.min(text.length / 10, 30));

  const formality: "formal" | "casual" | "neutral" = 
    formalCount > casualCount ? "formal" : casualCount > formalCount ? "casual" : "neutral";

  const urgency: "high" | "medium" | "low" = 
    urgentCount >= 2 ? "high" : urgentCount >= 1 ? "medium" : "low";

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (negativeCount > positiveCount) {
    suggestions.push("Add positive language to balance the tone");
    suggestions.push("Consider starting with a friendly greeting");
  }
  
  if (label === "negative") {
    suggestions.push("Reframe negative statements as opportunities");
    suggestions.push("Include a clear call-to-action with benefit");
  }
  
  if (formality === "casual" && !lowerText.includes("hey")) {
    suggestions.push("Consider a more professional greeting");
  }
  
  if (urgency === "high") {
    suggestions.push("High urgency may feel pushy - consider softening");
  }
  
  if (!lowerText.includes("thank") && !lowerText.includes("appreciate")) {
    suggestions.push("Add appreciation language for better reception");
  }
  
  if (text.length < 100) {
    suggestions.push("Consider adding more detail for engagement");
  }
  
  if (!lowerText.match(/\?/)) {
    suggestions.push("Add a question to encourage response");
  }

  // Determine overall tone
  const tones = [];
  if (positiveCount > 0) tones.push("Friendly");
  if (urgentCount > 0) tones.push("Urgent");
  if (formalCount > 0) tones.push("Professional");
  if (negativeCount > 0) tones.push("Concerned");
  const tone = tones.length > 0 ? tones.slice(0, 2).join(", ") : "Neutral";

  return {
    score,
    label,
    confidence,
    suggestions: suggestions.slice(0, 4),
    tone,
    formality,
    urgency,
  };
};

export default function SentimentAnalyzer({ text, onApplySuggestion, compact = false }: SentimentAnalyzerProps) {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (text.length > 20) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setResult(analyzeText(text));
        setIsAnalyzing(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResult(null);
    }
  }, [text]);

  if (!result && !isAnalyzing) return null;

  const getSentimentIcon = () => {
    if (!result) return null;
    switch (result.label) {
      case "positive": return <Smile className="w-5 h-5 text-success" />;
      case "negative": return <Frown className="w-5 h-5 text-destructive" />;
      default: return <Meh className="w-5 h-5 text-warning" />;
    }
  };

  const getSentimentColor = () => {
    if (!result) return "bg-muted";
    switch (result.label) {
      case "positive": return "bg-success";
      case "negative": return "bg-destructive";
      default: return "bg-warning";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {isAnalyzing ? (
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            {getSentimentIcon()}
            <span className="text-muted-foreground capitalize">{result?.label}</span>
            <Badge variant="outline" className="text-xs">
              {result?.score}%
            </Badge>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm text-foreground">Sentiment Analysis</span>
          <Badge variant="outline" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            AI
          </Badge>
        </div>
        {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {result && !isAnalyzing && (
        <>
          {/* Sentiment Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getSentimentIcon()}
                <span className="capitalize font-medium text-foreground">{result.label} Tone</span>
              </div>
              <span className="text-muted-foreground">{result.score}%</span>
            </div>
            <Progress 
              value={result.score} 
              className={`h-2 ${getSentimentColor()}`} 
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Tone</p>
              <p className="text-sm font-medium text-foreground">{result.tone}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Formality</p>
              <p className="text-sm font-medium text-foreground capitalize">{result.formality}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Urgency</p>
              <Badge 
                variant={result.urgency === "high" ? "destructive" : result.urgency === "medium" ? "default" : "secondary"}
                className="text-xs capitalize"
              >
                {result.urgency}
              </Badge>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  {result.suggestions.length} Improvement Tips
                </span>
                <ArrowUp className={`w-4 h-4 transition-transform ${showSuggestions ? "" : "rotate-180"}`} />
              </Button>

              {showSuggestions && (
                <div className="space-y-1.5">
                  {result.suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground flex-1">{suggestion}</span>
                      {onApplySuggestion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onApplySuggestion(suggestion)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>Analysis confidence</span>
            <span>{Math.round(result.confidence)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
