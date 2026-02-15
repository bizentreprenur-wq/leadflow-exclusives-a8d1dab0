import { Phone, Bot, MessageSquare, CheckCircle2, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Bot,
    title: "AI Does the Talking",
    description: "Your AI assistant calls leads for you. It sounds natural and handles objections like a pro.",
  },
  {
    icon: MessageSquare,
    title: "Smart Conversations",
    description: "AI asks the right questions to qualify leads - budget, timeline, decision makers.",
  },
  {
    icon: CheckCircle2,
    title: "Call Logs & Transcripts",
    description: "Every call is logged with full transcripts. Know exactly what was said and follow up smart.",
  },
];

const VoiceCallingSection = () => {
  return (
    <section data-tour="voice-calling" className="py-20 md:py-28 bg-gradient-to-b from-background to-card overflow-hidden">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 gap-1">
            <Phone className="w-3 h-3" />
            NEW FEATURE
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            📞 AI Voice Calling
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Don't just email leads - <span className="text-foreground font-semibold">CALL them</span>! 
            Our AI makes phone calls that sound 100% human. <span className="text-green-500 font-semibold">Included in all paid plans</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left: Visual Demo */}
          <div className="relative">
            <div className="relative bg-card rounded-3xl border-2 border-green-500/30 shadow-elevated p-8">
              {/* Call Interface Preview */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
                  <Phone className="w-12 h-12 text-white" />
                </div>
                <Badge className="bg-green-500 text-white animate-pulse">
                  🔴 Live Call in Progress
                </Badge>
              </div>

              {/* Sample Transcript */}
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">AI</Badge>
                  <p className="text-foreground">"Hi! I noticed your business might need help with marketing. Do you have 2 minutes?"</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <p className="text-muted-foreground text-right">"Sure, tell me more..."</p>
                  <Badge variant="secondary" className="shrink-0">Lead</Badge>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">AI</Badge>
                  <p className="text-foreground">"Great! What's your biggest challenge with getting new customers right now?"</p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-xl font-bold text-green-600">3:42</p>
                  <p className="text-xs text-muted-foreground">Call Duration</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xl font-bold text-primary">Hot</p>
                  <p className="text-xs text-muted-foreground">Lead Status</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <p className="text-xl font-bold text-amber-600">✓</p>
                  <p className="text-xs text-muted-foreground">Logged</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 p-3 bg-card rounded-xl border shadow-lg">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="absolute -bottom-3 -left-3 p-3 bg-card rounded-xl border shadow-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Right: Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How it Works - Simple */}
            <div className="bg-muted/50 rounded-2xl p-6 border">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                How Voice Calling Works
              </h4>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <span><strong>Subscribe to Any Plan</strong> - AI Calling is included in Basic, Pro & Autopilot</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <span><strong>Get Your AI Phone Number</strong> - BamLead provisions your dedicated number</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <span><strong>Start Calling</strong> - Click "Call" on any lead with a phone number</span>
                </li>
              </ol>
            </div>

            <Link to="/pricing">
              <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Phone className="w-5 h-5" />
                Get Started — AI Calling Included
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceCallingSection;