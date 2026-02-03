import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Sparkles,
  MessageSquare,
  Send,
  Target,
  TrendingUp,
  Lightbulb,
  Shield,
  Mic,
  MicOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  Brain,
  Play,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "mentor";
  content: string;
  timestamp: Date;
  type?: "tip" | "objection" | "praise" | "challenge";
}

interface PracticeScenario {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "cold-call" | "objection" | "closing" | "discovery";
  icon: React.ElementType;
}

interface PitchAnalysis {
  score: number;
  strengths: string[];
  feedback: string[];
}

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const SALES_MENTOR_STATS_KEY = "bamlead_sales_mentor_stats";

const scenarios: PracticeScenario[] = [
  {
    id: "cold-intro",
    title: "Cold Email Intro",
    description: "Practice your opening pitch for cold outreach",
    difficulty: "beginner",
    category: "cold-call",
    icon: MessageSquare,
  },
  {
    id: "price-objection",
    title: "Price Objection",
    description: "Handle 'It's too expensive' gracefully",
    difficulty: "intermediate",
    category: "objection",
    icon: Shield,
  },
  {
    id: "competitor-compare",
    title: "Competitor Comparison",
    description: "Respond to 'We're using [competitor]'",
    difficulty: "intermediate",
    category: "objection",
    icon: Target,
  },
  {
    id: "close-deal",
    title: "Closing the Deal",
    description: "Practice asking for the sale confidently",
    difficulty: "advanced",
    category: "closing",
    icon: TrendingUp,
  },
  {
    id: "discovery-call",
    title: "Discovery Questions",
    description: "Learn to uncover pain points effectively",
    difficulty: "beginner",
    category: "discovery",
    icon: Lightbulb,
  },
  {
    id: "no-budget",
    title: "No Budget Response",
    description: "Handle 'We don't have budget right now'",
    difficulty: "advanced",
    category: "objection",
    icon: Shield,
  },
];

const mentorResponses = {
  greeting: [
    "Hey there! 👋 I'm your AI Sales Mentor. Ready to sharpen your sales skills today?",
    "Welcome back! Let's work on making you an even better closer. What would you like to practice?",
    "Great to see you! Remember: every practice session gets you closer to your next big deal.",
  ],
  objections: {
    "too expensive": {
      response: "I hear that a lot! Here's a reframe: 'I understand budget is a concern. Let me ask - what's the cost of NOT solving this problem for another 6 months?'",
      tip: "Always shift from cost to value. Help them see the ROI, not just the price tag.",
      score: 75,
    },
    "using competitor": {
      response: "Great objection to handle! Try: 'That's great you have a solution in place. Out of curiosity, if you could wave a magic wand, what would you improve about it?'",
      tip: "Don't bash competitors. Instead, find gaps in their current solution.",
      score: 80,
    },
    "not interested": {
      response: "This is where most give up! Try: 'I totally get it - you weren't expecting my call. Quick question though - are you the right person to talk to about [specific pain point]?'",
      tip: "Pivot from selling to curiosity. Ask a question they can't resist answering.",
      score: 70,
    },
    "no budget": {
      response: "Budget objections often mean timing, not rejection. Try: 'I understand. When does your fiscal year reset? I'd love to be on your radar for planning.'",
      tip: "Plant seeds for future. Today's 'no' can be next quarter's 'yes'.",
      score: 85,
    },
  },
  praise: [
    "Excellent response! You really showed empathy there. 🌟",
    "Great job handling that objection! Your confidence is growing.",
    "Now THAT'S how you close! Keep that energy! 🔥",
    "You're getting better with every practice. Real improvement!",
  ],
  tips: [
    "💡 Tip: Silence is powerful. After asking for the sale, wait for them to respond first.",
    "💡 Tip: Mirror their words back to them. It builds rapport subconsciously.",
    "💡 Tip: Always have 3 customer success stories ready to share.",
    "💡 Tip: Ask 'What would need to be true for you to move forward?'",
    "💡 Tip: The best closers talk less than 40% of the call. Listen more!",
  ],
};

export default function AISalesMentor() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);
  const [practiceScore, setPracticeScore] = useState(0);
  const [practiceStreak, setPracticeStreak] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      const greeting = mentorResponses.greeting[Math.floor(Math.random() * mentorResponses.greeting.length)];
      return [{
        id: "greeting",
        role: "mentor",
        content: greeting,
        timestamp: new Date(),
      }];
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SALES_MENTOR_STATS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ practiceScore: number; practiceStreak: number }>;
      if (typeof parsed.practiceScore === "number") {
        setPracticeScore(Math.max(0, Math.min(100, parsed.practiceScore)));
      }
      if (typeof parsed.practiceStreak === "number") {
        setPracticeStreak(Math.max(0, parsed.practiceStreak));
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SALES_MENTOR_STATS_KEY,
      JSON.stringify({ practiceScore, practiceStreak })
    );
  }, [practiceScore, practiceStreak]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
    if (typeof window === "undefined") return null;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const chunks: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const chunk = event.results[i]?.[0]?.transcript?.trim();
        if (chunk) chunks.push(chunk);
      }
      const transcript = chunks.join(" ").trim();
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onerror = (event) => {
      toast.error(`Voice input error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const evaluateScenarioReply = (text: string, scenario: PracticeScenario) => {
    const hasEmpathy = /(understand|fair point|totally get|makes sense|appreciate)/i.test(text);
    const hasQuestion = text.includes("?");
    const hasValue = /(value|roi|results|impact|save|revenue|growth|efficiency)/i.test(text);
    const hasNextStep = /(call|meeting|demo|schedule|calendar|next step|tomorrow|this week)/i.test(text);

    let quality = 0;
    const strengths: string[] = [];
    const fixes: string[] = [];

    if (hasEmpathy) {
      quality += 1;
      strengths.push("You acknowledged their concern first.");
    } else {
      fixes.push("Start with empathy before pitching.");
    }

    if (hasQuestion) {
      quality += 1;
      strengths.push("You asked a question to keep control of the conversation.");
    } else {
      fixes.push("Add a question to re-open dialogue.");
    }

    if (hasValue) {
      quality += 1;
      strengths.push("You focused on value, not just features.");
    } else {
      fixes.push("Tie your response to business value or ROI.");
    }

    if (hasNextStep) {
      quality += 1;
      strengths.push("You ended with a concrete next step.");
    } else {
      fixes.push("End with a clear next action (demo, call, or schedule).");
    }

    const scoreDelta = quality >= 3 ? 7 : quality >= 2 ? 5 : 3;
    const praise = mentorResponses.praise[Math.floor(Math.random() * mentorResponses.praise.length)];
    const scenarioLabel = `${scenario.title} (${scenario.difficulty})`;

    const response = quality >= 3
      ? `${praise}\n\nScenario: ${scenarioLabel}\n\nWhat you did well:\n- ${strengths.join("\n- ")}`
      : `Good start. Let's sharpen it for "${scenario.title}".\n\nImprove these points:\n- ${fixes.join("\n- ")}\n\nTry one more version and keep it concise.`;

    return {
      response,
      type: (quality >= 3 ? "praise" : "challenge") as Message["type"],
      scoreDelta,
    };
  };

  const handleSend = async () => {
    const userInput = input.trim();
    if (!userInput) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    let response = "";
    let type: Message["type"] = undefined;

    const lowerInput = userInput.toLowerCase();

    if (selectedScenario) {
      const scenarioResult = evaluateScenarioReply(userInput, selectedScenario);
      response = scenarioResult.response;
      type = scenarioResult.type;
      setPracticeScore(prev => Math.min(100, prev + scenarioResult.scoreDelta));
    } else if (lowerInput.includes("expensive") || lowerInput.includes("cost") || lowerInput.includes("price")) {
      // Check for objection keywords
      const obj = mentorResponses.objections["too expensive"];
      response = `${obj.response}\n\n${obj.tip}`;
      type = "objection";
      setPracticeScore(prev => Math.min(100, prev + 5));
    } else if (lowerInput.includes("competitor") || lowerInput.includes("already using")) {
      const obj = mentorResponses.objections["using competitor"];
      response = `${obj.response}\n\n${obj.tip}`;
      type = "objection";
      setPracticeScore(prev => Math.min(100, prev + 5));
    } else if (lowerInput.includes("not interested") || lowerInput.includes("no thanks")) {
      const obj = mentorResponses.objections["not interested"];
      response = `${obj.response}\n\n${obj.tip}`;
      type = "objection";
      setPracticeScore(prev => Math.min(100, prev + 5));
    } else if (lowerInput.includes("budget") || lowerInput.includes("afford")) {
      const obj = mentorResponses.objections["no budget"];
      response = `${obj.response}\n\n${obj.tip}`;
      type = "objection";
      setPracticeScore(prev => Math.min(100, prev + 5));
    } else if (lowerInput.includes("help") || lowerInput.includes("practice") || lowerInput.includes("tip")) {
      response = mentorResponses.tips[Math.floor(Math.random() * mentorResponses.tips.length)];
      type = "tip";
    } else {
      response = `That's a good approach! Here's how you could make it even stronger:\n\n1. Start with a specific pain point\n2. Use social proof (e.g., "Companies like yours...")\n3. End with a clear next step\n\nWant to try again? I'll give you feedback!`;
      type = "challenge";
      setPracticeScore(prev => Math.min(100, prev + 3));
    }

    setPracticeStreak(prev => prev + 1);

    const mentorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "mentor",
      content: response,
      timestamp: new Date(),
      type,
    };

    setMessages(prev => [...prev, mentorMessage]);
    setIsTyping(false);
  };

  const startScenario = (scenario: PracticeScenario) => {
    setSelectedScenario(scenario);
    setActiveTab("chat");
    
    const scenarioMessage: Message = {
      id: Date.now().toString(),
      role: "mentor",
      content: `Great choice! Let's practice "${scenario.title}".\n\nScenario:\n"${getScenarioPrompt(scenario)}"\n\nHow would you respond? Type your best reply and I'll coach you.`,
      timestamp: new Date(),
      type: "challenge",
    };

    setMessages(prev => [...prev, scenarioMessage]);
  };

  const getScenarioPrompt = (scenario: PracticeScenario): string => {
    switch (scenario.id) {
      case "cold-intro": return "I wasn't expecting your call. What is this about?";
      case "price-objection": return "That sounds nice, but it's way too expensive for us right now.";
      case "competitor-compare": return "We're already using [competitor] and it works fine.";
      case "close-deal": return "This all sounds good, but I need to think about it.";
      case "discovery-call": return "Sure, I have a few minutes. What do you want to know?";
      case "no-budget": return "We've already allocated our budget for this year.";
      default: return "Tell me more about what you're offering.";
    }
  };

  const analyzePitch = async () => {
    if (pitchText.length < 50) {
      toast.error("Please write at least 50 characters to analyze");
      return;
    }

    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));

    const wordCount = pitchText.split(" ").length;
    const hasQuestion = pitchText.includes("?");
    const hasNumbers = /\d/.test(pitchText);
    const hasSocialProof = /companies|clients|customers|users/i.test(pitchText);
    const hasCTA = /call|meeting|demo|schedule|chat/i.test(pitchText);
    const hasPainPoint = /problem|challenge|struggle|issue|pain/i.test(pitchText);

    let score = 50;
    const feedback: string[] = [];
    const strengths: string[] = [];

    if (hasQuestion) { score += 10; strengths.push("Great use of questions to engage!"); }
    else { feedback.push("Add a question to encourage dialogue"); }

    if (hasNumbers) { score += 10; strengths.push("Good use of specific numbers/data"); }
    else { feedback.push("Include specific numbers or stats for credibility"); }

    if (hasSocialProof) { score += 10; strengths.push("Nice social proof reference"); }
    else { feedback.push("Add social proof (e.g., 'Companies like...')"); }

    if (hasCTA) { score += 10; strengths.push("Clear call-to-action"); }
    else { feedback.push("End with a clear next step"); }

    if (hasPainPoint) { score += 10; strengths.push("Good focus on pain points"); }
    else { feedback.push("Lead with their pain point, not your solution"); }

    if (wordCount > 30 && wordCount < 100) { score += 5; }
    else if (wordCount >= 100) { feedback.push("Consider being more concise"); }

    const boundedScore = Math.min(score, 100);
    setPitchAnalysis({ score: boundedScore, strengths, feedback });
    setPracticeScore((prev) => Math.max(prev, boundedScore));
    setPracticeStreak((prev) => prev + 1);
    setIsAnalyzing(false);
    toast.success("Analysis complete!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-success border-2 border-background">
              <Sparkles className="w-3 h-3 text-success-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              AI Sales Mentor
              <Badge className="gap-1">
                <Zap className="w-3 h-3" />
                Exclusive
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">Your personal coach for closing more deals</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Practice Score</p>
            <p className="text-lg font-bold text-primary">{practiceScore}/100</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Streak</p>
            <p className="text-lg font-bold text-warning">🔥 {practiceStreak}</p>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Mentor Progress</span>
          <span>{practiceScore}%</span>
        </div>
        <Progress value={practiceScore} className="h-1.5" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <Target className="w-4 h-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="gap-2">
            <Brain className="w-4 h-4" />
            Analyzer
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              {selectedScenario && (
                <div className="mx-4 mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Active Scenario
                  </Badge>
                  <span className="text-sm font-medium">{selectedScenario.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-xs"
                    onClick={() => setSelectedScenario(null)}
                  >
                    End Scenario
                  </Button>
                </div>
              )}
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : message.type === "tip"
                          ? "bg-warning/10 border border-warning/30 rounded-bl-md"
                          : message.type === "objection"
                          ? "bg-primary/10 border border-primary/30 rounded-bl-md"
                          : message.type === "praise"
                          ? "bg-success/10 border border-success/30 rounded-bl-md"
                          : "bg-secondary rounded-bl-md"
                      }`}>
                        {message.role === "mentor" && (
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-primary">Sales Mentor</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary p-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.1s]" />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your sales pitch or ask for tips..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={toggleRecording} aria-label="Toggle voice input">
                    {isRecording ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "How do I handle price objections?",
                    "Give me a better closing line",
                    "Review my discovery call opener",
                  ].map((quickPrompt) => (
                    <Button
                      key={quickPrompt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setInput(quickPrompt)}
                    >
                      {quickPrompt}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Try: "How do I handle price objections?" or switch to Practice scenarios
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`border-border hover:border-primary/50 transition-all cursor-pointer ${
                  selectedScenario?.id === scenario.id ? "border-primary/60 bg-primary/5" : ""
                }`}
                onClick={() => startScenario(scenario)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      scenario.difficulty === "beginner" ? "bg-success/10" :
                      scenario.difficulty === "intermediate" ? "bg-warning/10" :
                      "bg-destructive/10"
                    }`}>
                      <scenario.icon className={`w-5 h-5 ${
                        scenario.difficulty === "beginner" ? "text-success" :
                        scenario.difficulty === "intermediate" ? "text-warning" :
                        "text-destructive"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{scenario.title}</h3>
                        <Badge variant="outline" className={`text-xs capitalize ${
                          scenario.difficulty === "beginner" ? "border-success/50 text-success" :
                          scenario.difficulty === "intermediate" ? "border-warning/50 text-warning" :
                          "border-destructive/50 text-destructive"
                        }`}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startScenario(scenario);
                    }}
                  >
                    <Play className="w-4 h-4" />
                    {selectedScenario?.id === scenario.id ? "Practicing" : "Start Practice"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analyzer Tab */}
        <TabsContent value="analyzer" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Pitch Analyzer
              </CardTitle>
              <CardDescription>
                Paste your email or pitch and get instant AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Paste your cold email, pitch, or sales message here..."
                className="min-h-[150px]"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pitchText.length} characters • {pitchText.split(" ").filter(Boolean).length} words
                </p>
                <Button onClick={analyzePitch} disabled={isAnalyzing || pitchText.length < 50} className="gap-2">
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Pitch
                    </>
                  )}
                </Button>
              </div>

              {pitchAnalysis && (
                <div className="space-y-4 pt-4 border-t border-border">
                  {/* Score */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Pitch Score</p>
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30">
                      <span className="text-3xl font-bold text-primary">{pitchAnalysis.score}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {pitchAnalysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <Star className="w-3 h-3 text-success mt-1 shrink-0" />
                            {s}
                          </li>
                        ))}
                        {pitchAnalysis.strengths.length === 0 && (
                          <li className="text-sm text-muted-foreground">Keep practicing!</li>
                        )}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                      <h4 className="font-medium text-warning mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        To Improve
                      </h4>
                      <ul className="space-y-1.5">
                        {pitchAnalysis.feedback.map((f: string, i: number) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 text-warning mt-1 shrink-0" />
                            {f}
                          </li>
                        ))}
                        {pitchAnalysis.feedback.length === 0 && (
                          <li className="text-sm text-success">Perfect pitch! 🎯</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2" onClick={() => {
                    setPitchAnalysis(null);
                    setPitchText("");
                  }}>
                    <RotateCcw className="w-4 h-4" />
                    Analyze Another
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
