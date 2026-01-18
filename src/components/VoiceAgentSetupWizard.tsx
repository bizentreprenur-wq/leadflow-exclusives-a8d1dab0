import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Phone,
  CheckCircle2,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Settings2,
  Play,
  X,
  Loader2,
  AlertTriangle,
  Zap,
  MessageSquare,
  Globe
} from 'lucide-react';

interface VoiceAgentSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  { id: 1, title: 'Create Account', icon: Globe },
  { id: 2, title: 'Create Agent', icon: MessageSquare },
  { id: 3, title: 'Configure', icon: Settings2 },
  { id: 4, title: 'Make Public', icon: Zap },
  { id: 5, title: 'Connect', icon: Phone },
];

const SAMPLE_PROMPT = `You are a friendly sales qualification assistant for a lead generation company. Your goal is to qualify leads by understanding their business needs.

GREETING:
- Start with: "Hi, this is Alex from [Company Name]. Am I speaking with [Lead Name]?"
- If they confirm, say: "Great! I noticed you might be interested in growing your business. Do you have a moment to chat?"

QUALIFICATION QUESTIONS:
1. What industry are you in and how long have you been in business?
2. Are you currently using any lead generation tools or services?
3. What's your biggest challenge when it comes to finding new customers?
4. If we could help you get 50+ qualified leads per month, would that be valuable?

OBJECTION HANDLING:
- "I'm busy": "I completely understand! When would be a better time to call back?"
- "Not interested": "No problem! May I ask what solution you're currently using?"
- "Send me info": "Absolutely! What's the best email to send that to?"

CLOSING:
- If interested: "Fantastic! I'll have our specialist schedule a demo. What time works best?"
- Always end with: "Thank you for your time. Have a great day!"

TONE:
- Be warm, professional, and conversational
- Listen actively and respond naturally
- Never be pushy or aggressive`;

export default function VoiceAgentSetupWizard({ onComplete, onSkip }: VoiceAgentSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentId, setAgentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(SAMPLE_PROMPT);
    setCopied(true);
    toast.success('Sales script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndComplete = () => {
    if (!agentId || agentId.length < 10) {
      toast.error('Please enter a valid Agent ID');
      return;
    }

    setIsSaving(true);
    localStorage.setItem('elevenlabs_agent_id', agentId);
    localStorage.setItem('bamlead_voice_wizard_completed', 'true');
    
    setTimeout(() => {
      setIsSaving(false);
      toast.success('🎉 Voice Agent configured! You can now make AI calls.');
      onComplete();
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('bamlead_voice_wizard_skipped', 'true');
    onSkip();
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Voice Agent Setup</h1>
                <p className="text-muted-foreground">Configure your AI calling assistant in 5 minutes</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    step.id <= currentStep ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.id < currentStep 
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.id === currentStep
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted bg-muted/50'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <Card className="border-2 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-500" />
                      Step 1: Create ElevenLabs Account
                    </CardTitle>
                    <CardDescription>
                      ElevenLabs provides the AI voice technology that powers your calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        Why ElevenLabs?
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>Ultra-realistic AI voices that sound human</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>Real-time conversation with intelligent responses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>10,000 free characters per month to start</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>Your billing - you control costs and usage</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        <a href="https://elevenlabs.io/app/sign-up" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Create Free Account
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="flex-1 gap-2">
                        <a href="https://elevenlabs.io/app/sign-in" target="_blank" rel="noopener noreferrer">
                          I Already Have an Account
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card className="border-2 border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Step 2: Create Conversational AI Agent
                    </CardTitle>
                    <CardDescription>
                      Create your AI sales agent in the ElevenLabs dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-blue-500/20 text-blue-600 border-blue-500/30">1</Badge>
                        <div>
                          <p className="font-medium">Go to Conversational AI</p>
                          <p className="text-sm text-muted-foreground">In ElevenLabs dashboard, click "Conversational AI" in the left sidebar</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-blue-500/20 text-blue-600 border-blue-500/30">2</Badge>
                        <div>
                          <p className="font-medium">Click "Create Agent"</p>
                          <p className="text-sm text-muted-foreground">Select "Create blank template" or choose a starter template</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-blue-500/20 text-blue-600 border-blue-500/30">3</Badge>
                        <div>
                          <p className="font-medium">Name Your Agent</p>
                          <p className="text-sm text-muted-foreground">Give it a name like "Sales Qualifier" or "Lead Outreach"</p>
                        </div>
                      </li>
                    </ol>

                    <Button asChild className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                      <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Open Conversational AI Dashboard
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card className="border-2 border-violet-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-violet-500" />
                      Step 3: Configure Your Agent's Script
                    </CardTitle>
                    <CardDescription>
                      Paste this proven sales script or customize your own
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative">
                      <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto border">
                        <pre className="whitespace-pre-wrap">{SAMPLE_PROMPT}</pre>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyPrompt}
                        className="absolute top-2 right-2 gap-1"
                      >
                        {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>

                    <div className="bg-violet-500/10 p-4 rounded-lg border border-violet-500/20">
                      <h4 className="font-medium text-violet-700 dark:text-violet-300 mb-2">📋 How to use:</h4>
                      <ol className="text-sm text-violet-600 dark:text-violet-400 space-y-1">
                        <li>1. Copy the script above</li>
                        <li>2. In ElevenLabs, go to your agent's "System Prompt"</li>
                        <li>3. Paste and customize with your company name</li>
                        <li>4. Choose a voice that fits your brand</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && (
                <Card className="border-2 border-amber-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Step 4: Make Your Agent Public
                    </CardTitle>
                    <CardDescription>
                      Enable public access so BamLead can connect to your agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-700 dark:text-amber-300">Important!</h4>
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            Go to your agent's Settings tab and toggle "Public" to ON. This allows BamLead to connect without requiring authentication.
                          </p>
                        </div>
                      </div>
                    </div>

                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-amber-500/20 text-amber-600 border-amber-500/30">1</Badge>
                        <div>
                          <p className="font-medium">Open Agent Settings</p>
                          <p className="text-sm text-muted-foreground">Click on your agent, then go to the "Settings" tab</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-amber-500/20 text-amber-600 border-amber-500/30">2</Badge>
                        <div>
                          <p className="font-medium">Enable Public Access</p>
                          <p className="text-sm text-muted-foreground">Find the "Public" toggle and turn it ON</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-0.5 bg-amber-500/20 text-amber-600 border-amber-500/30">3</Badge>
                        <div>
                          <p className="font-medium">Copy Agent ID</p>
                          <p className="text-sm text-muted-foreground">The Agent ID is shown in the URL or settings page (e.g., abc123xyz...)</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {currentStep === 5 && (
                <Card className="border-2 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-500" />
                      Step 5: Connect Your Agent
                    </CardTitle>
                    <CardDescription>
                      Paste your Agent ID to start making AI calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ElevenLabs Agent ID</label>
                      <Input
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        placeholder="Paste your Agent ID here..."
                        className="font-mono text-lg h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Find this in your agent's settings page or URL
                      </p>
                    </div>

                    {agentId && agentId.length >= 10 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 p-4 rounded-lg border border-green-500/20"
                      >
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Agent ID looks valid!</span>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleSaveAndComplete}
                      disabled={!agentId || agentId.length < 10 || isSaving}
                      className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 text-lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Complete Setup & Start Calling
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>

            {currentStep < STEPS.length && (
              <Button
                onClick={nextStep}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}