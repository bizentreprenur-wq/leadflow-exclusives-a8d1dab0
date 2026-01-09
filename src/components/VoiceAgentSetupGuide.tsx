import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Phone, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  MessageSquare,
  Settings,
  Volume2,
  User,
  Target,
  DollarSign,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_SYSTEM_PROMPT = `You are a friendly sales qualification assistant for a lead generation company. Your goal is to qualify leads by understanding their business needs.

CONVERSATION FLOW:
1. Greet warmly and ask their name
2. Ask what industry they're in
3. Ask how many leads they currently generate monthly
4. Ask what their biggest challenge is with lead generation
5. Ask their budget range for lead generation tools
6. Thank them and confirm someone will follow up

RULES:
- Keep responses under 2 sentences
- Be conversational, not robotic
- If they seem uninterested, politely end the call
- Collect: name, industry, current lead volume, main challenge, budget`;

const SAMPLE_FIRST_MESSAGE = `Hi there! Thanks for your interest. I'm here to learn a bit about your business so we can see how we might help. What's your name?`;

interface StepProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Step({ number, title, description, children }: StepProps) {
  return (
    <div className="relative pl-12 pb-8 last:pb-0">
      {/* Connector line */}
      <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-border last:hidden" />
      
      {/* Step number */}
      <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function VoiceAgentSetupGuide() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Voice Agent Setup Guide</h1>
          <p className="text-muted-foreground">Create your AI sales agent in under 10 minutes</p>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-700 dark:text-violet-300">What you'll build</h3>
              <p className="text-sm text-violet-600 dark:text-violet-400 mt-1">
                An AI voice agent that qualifies leads by asking about their business, 
                challenges, and budget - all automatically. The AI handles the entire 
                conversation while you focus on closing deals.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <User className="w-3 h-3" />
                  Collects contact info
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Target className="w-3 h-3" />
                  Qualifies leads
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="w-3 h-3" />
                  Asks about budget
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Step-by-Step Setup
          </CardTitle>
          <CardDescription>
            Follow these steps to create your ElevenLabs voice agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Step
            number={1}
            title="Create ElevenLabs Account"
            description="Sign up for a free account to get started"
          >
            <div className="flex items-center gap-3">
              <Button asChild className="gap-2">
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Go to ElevenLabs
                </a>
              </Button>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                Free: 10,000 chars/month
              </Badge>
            </div>
          </Step>

          <Step
            number={2}
            title="Create Conversational AI Agent"
            description="Navigate to the Conversational AI section"
          >
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">1. Click <strong>"Conversational AI"</strong> in the left sidebar</p>
              <p className="text-sm">2. Click <strong>"Create Agent"</strong> button</p>
              <p className="text-sm">3. Choose <strong>"Blank template"</strong></p>
            </div>
          </Step>

          <Step
            number={3}
            title="Configure Your Agent"
            description="Set up the agent name, voice, and behavior"
          >
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prompt" className="gap-1">
                  <MessageSquare className="w-3 h-3" />
                  System Prompt
                </TabsTrigger>
                <TabsTrigger value="greeting" className="gap-1">
                  <Volume2 className="w-3 h-3" />
                  First Message
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-1">
                  <User className="w-3 h-3" />
                  Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">System Prompt (paste this)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(SAMPLE_SYSTEM_PROMPT, 'prompt')}
                      className="gap-1"
                    >
                      {copiedField === 'prompt' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {SAMPLE_SYSTEM_PROMPT}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="greeting" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">First Message (paste this)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(SAMPLE_FIRST_MESSAGE, 'greeting')}
                      className="gap-1"
                    >
                      {copiedField === 'greeting' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    {SAMPLE_FIRST_MESSAGE}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="mt-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Recommended Voices</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Rachel', desc: 'Professional, warm' },
                      { name: 'Josh', desc: 'Friendly, casual' },
                      { name: 'Elli', desc: 'Energetic, young' },
                      { name: 'Sam', desc: 'Authoritative, calm' },
                    ].map((voice) => (
                      <div key={voice.name} className="p-3 rounded-lg border bg-card">
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Step>

          <Step
            number={4}
            title="Make Agent Public"
            description="Enable public access so BamLead can connect"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Important</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Go to your agent's <strong>Settings</strong> tab and toggle <strong>"Public"</strong> to ON. 
                    This allows BamLead to connect without requiring authentication.
                  </p>
                </div>
              </div>
            </div>
          </Step>

          <Step
            number={5}
            title="Copy Your Agent ID"
            description="Get the unique ID to connect with BamLead"
          >
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">1. Go to your agent's <strong>Overview</strong> page</p>
              <p className="text-sm">2. Find the <strong>Agent ID</strong> (looks like: <code className="bg-muted px-1 rounded">abc123xyz...</code>)</p>
              <p className="text-sm">3. Copy it and paste in BamLead's Voice Agent Settings</p>
            </div>
          </Step>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cost">
              <AccordionTrigger>How much does ElevenLabs cost?</AccordionTrigger>
              <AccordionContent>
                ElevenLabs offers a free tier with 10,000 characters per month - enough for 
                several test calls. Paid plans start at $5/month for 30,000 characters. 
                You only pay for what you use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customize">
              <AccordionTrigger>Can I customize the sales script?</AccordionTrigger>
              <AccordionContent>
                Absolutely! The system prompt we provided is just a starting point. You can 
                modify it to match your product, ask different questions, or change the 
                conversation flow entirely. Edit it directly in ElevenLabs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phone">
              <AccordionTrigger>Does this make actual phone calls?</AccordionTrigger>
              <AccordionContent>
                This feature enables browser-based voice conversations using WebRTC. 
                It's like a voice chat that happens in your browser. For actual phone 
                calls to cell phones, you'd need to integrate a service like Twilio 
                (which requires additional setup and costs).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data">
              <AccordionTrigger>Where is conversation data stored?</AccordionTrigger>
              <AccordionContent>
                All voice processing happens through ElevenLabs' servers. They handle 
                the AI conversation, and you can view transcripts in your ElevenLabs 
                dashboard. BamLead doesn't store your conversation audio.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="languages">
              <AccordionTrigger>What languages are supported?</AccordionTrigger>
              <AccordionContent>
                ElevenLabs supports 29+ languages including English, Spanish, French, 
                German, Italian, Portuguese, Polish, and many more. You can configure 
                your agent to speak in any supported language.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Ready to get started?</h3>
              <p className="text-violet-100 text-sm">
                Create your agent and paste your Agent ID in Settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" asChild className="gap-2">
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Create Agent
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}
