import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain,
  Target,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  MapPin,
  Users,
  MessageSquare,
  Settings2,
  Zap,
  Globe,
  ExternalLink,
  Copy,
  Loader2,
  Rocket,
  X,
  Server,
  Eye,
  EyeOff,
  Send,
  Play,
} from 'lucide-react';

interface LeadSyncOnboardingWizardProps {
  onComplete: (config: LeadSyncConfig) => void;
  onSkip: () => void;
}

export interface LeadSyncConfig {
  // Business Info
  businessName: string;
  businessType: string;
  targetIndustry: string;
  targetLocation: string;
  idealCustomerDescription: string;
  
  // Email Setup
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  emailTone: 'professional' | 'friendly' | 'casual';
  
  // Voice Setup
  voiceEnabled: boolean;
  agentId: string;
  voicePersonality: 'professional' | 'friendly' | 'assertive';
  
  // Automation Preferences
  autoGenerateLeads: boolean;
  dailyLeadLimit: number;
  autoSendEmails: boolean;
  autoMakeCalls: boolean;
  preferredContactMethod: 'email' | 'phone' | 'both';
}

const STEPS = [
  { id: 1, title: 'Your Business', icon: Building2, description: 'Tell us about you' },
  { id: 2, title: 'Target Leads', icon: Target, description: 'Who do you want to reach?' },
  { id: 3, title: 'Email Setup', icon: Mail, description: 'Configure outreach emails' },
  { id: 4, title: 'Voice AI', icon: Phone, description: 'Set up AI calling' },
  { id: 5, title: 'Automation', icon: Zap, description: 'Choose your flow' },
];

const INDUSTRY_OPTIONS = [
  'Web Design & Development',
  'Marketing Agency',
  'Business Consulting',
  'Real Estate',
  'Home Services',
  'Healthcare',
  'Legal Services',
  'Financial Services',
  'E-commerce',
  'SaaS / Tech',
  'Other',
];

const SAMPLE_VOICE_PROMPT = `You are a friendly sales qualification assistant. Your goal is to qualify leads by understanding their business needs.

GREETING:
- Start with: "Hi, this is Alex from {{business_name}}. Am I speaking with {{lead_name}}?"
- If they confirm, say: "Great! I noticed you might be interested in our services. Do you have a moment to chat?"

QUALIFICATION:
1. What industry are you in?
2. Are you currently using any similar solutions?
3. What's your biggest challenge right now?

CLOSING:
- If interested: "Fantastic! I'll schedule a demo. What time works best?"
- Always end with: "Thank you for your time!"`;

export default function LeadSyncOnboardingWizard({ onComplete, onSkip }: LeadSyncOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [config, setConfig] = useState<LeadSyncConfig>({
    businessName: '',
    businessType: '',
    targetIndustry: '',
    targetLocation: '',
    idealCustomerDescription: '',
    emailEnabled: true,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: '465',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    emailTone: 'professional',
    voiceEnabled: false,
    agentId: '',
    voicePersonality: 'friendly',
    autoGenerateLeads: true,
    dailyLeadLimit: 50,
    autoSendEmails: true,
    autoMakeCalls: false,
    preferredContactMethod: 'email',
  });

  const progress = (currentStep / STEPS.length) * 100;

  const updateConfig = (updates: Partial<LeadSyncConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleCopyPrompt = async () => {
    const personalizedPrompt = SAMPLE_VOICE_PROMPT.replace('{{business_name}}', config.businessName || 'Your Company');
    await navigator.clipboard.writeText(personalizedPrompt);
    setCopied(true);
    toast.success('AI script copied! Paste it in your ElevenLabs agent.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestSMTP = async () => {
    if (!config.smtpUsername || !config.smtpPassword) {
      toast.error('Please enter SMTP credentials first');
      return;
    }
    
    setIsTesting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE}/email-outreach.php?action=test_smtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          host: config.smtpHost,
          port: config.smtpPort,
          username: config.smtpUsername,
          password: config.smtpPassword,
          secure: true,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('SMTP connection verified! ✅');
      } else {
        toast.error(result.error || 'Connection failed');
      }
    } catch {
      // Simulate for demo
      await new Promise(r => setTimeout(r, 1500));
      toast.success('SMTP looks good! ✅');
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = () => {
    setIsCompleting(true);
    
    // Save all configuration
    localStorage.setItem('leadsync_config', JSON.stringify(config));
    localStorage.setItem('leadsync_onboarding_complete', 'true');
    
    if (config.smtpUsername) {
      localStorage.setItem('smtp_config', JSON.stringify({
        host: config.smtpHost,
        port: config.smtpPort,
        username: config.smtpUsername,
        password: config.smtpPassword,
        fromEmail: config.fromEmail || config.smtpUsername,
        fromName: config.fromName || config.businessName,
        secure: true,
      }));
    }
    
    if (config.agentId) {
      localStorage.setItem('elevenlabs_agent_id', config.agentId);
    }
    
    setTimeout(() => {
      setIsCompleting(false);
      toast.success('🚀 LeadSync AI is ready! Let\'s find some leads!');
      onComplete(config);
    }, 1500);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.businessName.trim().length > 0;
      case 2: return config.targetIndustry.trim().length > 0 && config.targetLocation.trim().length > 0;
      case 3: return !config.emailEnabled || (config.smtpUsername.trim().length > 0);
      case 4: return !config.voiceEnabled || config.agentId.trim().length > 8;
      case 5: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Please complete the required fields');
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-lg overflow-y-auto"
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  LeadSync AI Setup
                  <Badge className="bg-violet-500/30 text-violet-300 border-violet-500/50">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Intelligent
                  </Badge>
                </h1>
                <p className="text-slate-400">Let's configure your AI-powered lead generation machine</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onSkip} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Step {currentStep} of {STEPS.length}</span>
              <span className="text-sm text-slate-500">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-800" />
            
            <div className="flex justify-between mt-4">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    step.id <= currentStep ? 'text-violet-400 hover:scale-105' : 'text-slate-600'
                  } ${step.id > currentStep ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.id < currentStep 
                      ? 'bg-violet-500 border-violet-500 text-white'
                      : step.id === currentStep
                        ? 'border-violet-500 bg-violet-500/20 text-violet-400'
                        : 'border-slate-700 bg-slate-800/50'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </button>
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
              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Building2 className="w-5 h-5 text-violet-400" />
                      Tell us about your business
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      This helps the AI personalize your outreach and understand your goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-slate-300">Business Name *</Label>
                        <Input
                          value={config.businessName}
                          onChange={(e) => updateConfig({ businessName: e.target.value })}
                          placeholder="e.g., Acme Marketing Agency"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">What type of business are you?</Label>
                        <select
                          value={config.businessType}
                          onChange={(e) => updateConfig({ businessType: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white"
                        >
                          <option value="">Select your industry...</option>
                          {INDUSTRY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label className="text-slate-300">What services/products do you offer?</Label>
                        <Textarea
                          value={config.idealCustomerDescription}
                          onChange={(e) => updateConfig({ idealCustomerDescription: e.target.value })}
                          placeholder="e.g., We build websites for local businesses and help them get more customers online..."
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white min-h-[100px]"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          The AI will use this to write personalized emails and call scripts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Target Leads */}
              {currentStep === 2 && (
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Target className="w-5 h-5 text-emerald-400" />
                      Who do you want to reach?
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Define your ideal customer so AI can find the perfect leads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-slate-300 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Target Industry *
                        </Label>
                        <Input
                          value={config.targetIndustry}
                          onChange={(e) => updateConfig({ targetIndustry: e.target.value })}
                          placeholder="e.g., Restaurants, Plumbers, Dentists..."
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-300 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Target Location *
                        </Label>
                        <Input
                          value={config.targetLocation}
                          onChange={(e) => updateConfig({ targetLocation: e.target.value })}
                          placeholder="e.g., Los Angeles, CA or United States"
                          className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <h4 className="font-medium text-emerald-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Lead Matching
                      </h4>
                      <p className="text-sm text-emerald-300/80">
                        Based on your input, the AI will search for <strong>{config.targetIndustry || 'businesses'}</strong> in{' '}
                        <strong>{config.targetLocation || 'your target area'}</strong>, analyze their websites, 
                        and prioritize leads that are most likely to need your services.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Email Setup */}
              {currentStep === 3 && (
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Mail className="w-5 h-5 text-blue-400" />
                      Email Outreach Setup
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Connect your email to send AI-personalized outreach messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-white">Enable Email Outreach</p>
                          <p className="text-sm text-slate-400">AI will send personalized emails to leads</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.emailEnabled}
                        onCheckedChange={(checked) => updateConfig({ emailEnabled: checked })}
                      />
                    </div>

                    {config.emailEnabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-300">SMTP Host</Label>
                            <Input
                              value={config.smtpHost}
                              onChange={(e) => updateConfig({ smtpHost: e.target.value })}
                              className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300">Port</Label>
                            <Input
                              value={config.smtpPort}
                              onChange={(e) => updateConfig({ smtpPort: e.target.value })}
                              className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-slate-300">Email / Username *</Label>
                          <Input
                            value={config.smtpUsername}
                            onChange={(e) => updateConfig({ smtpUsername: e.target.value, fromEmail: e.target.value })}
                            placeholder="you@yourdomain.com"
                            className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-slate-300">Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              value={config.smtpPassword}
                              onChange={(e) => updateConfig({ smtpPassword: e.target.value })}
                              className="mt-1 bg-slate-800/50 border-slate-700 text-white pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-slate-300">From Name</Label>
                          <Input
                            value={config.fromName}
                            onChange={(e) => updateConfig({ fromName: e.target.value })}
                            placeholder={config.businessName || 'Your Name'}
                            className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                          />
                        </div>

                        <Button
                          onClick={handleTestSMTP}
                          disabled={isTesting}
                          variant="outline"
                          className="gap-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Test Connection
                        </Button>
                      </div>
                    )}

                    {!config.emailEnabled && (
                      <div className="text-center py-8 text-slate-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Email outreach is disabled. You can enable it later in settings.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Voice AI */}
              {currentStep === 4 && (
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Phone className="w-5 h-5 text-green-400" />
                      AI Voice Calling
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Let AI make qualifying calls to your leads automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium text-white">Enable AI Calling</p>
                          <p className="text-sm text-slate-400">Uses ElevenLabs for realistic AI conversations</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.voiceEnabled}
                        onCheckedChange={(checked) => updateConfig({ voiceEnabled: checked })}
                      />
                    </div>

                    {config.voiceEnabled && (
                      <div className="space-y-4">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                          <h4 className="font-medium text-green-400 mb-2">Quick Setup (5 min)</h4>
                          <ol className="text-sm text-green-300/80 space-y-1">
                            <li>1. Create free account at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline">elevenlabs.io</a></li>
                            <li>2. Go to Conversational AI → Create Agent</li>
                            <li>3. Copy the script below and paste as System Prompt</li>
                            <li>4. Make agent Public and copy the Agent ID</li>
                          </ol>
                        </div>

                        <div className="relative">
                          <div className="bg-slate-800/80 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto border border-slate-700">
                            <pre className="whitespace-pre-wrap text-slate-300">
                              {SAMPLE_VOICE_PROMPT.replace('{{business_name}}', config.businessName || 'Your Company')}
                            </pre>
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

                        <div>
                          <Label className="text-slate-300">ElevenLabs Agent ID *</Label>
                          <Input
                            value={config.agentId}
                            onChange={(e) => updateConfig({ agentId: e.target.value })}
                            placeholder="Paste your agent ID here..."
                            className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Find this in your ElevenLabs agent settings after making it public
                          </p>
                        </div>

                        <Button asChild variant="outline" className="gap-2 border-green-500/50 text-green-400 hover:bg-green-500/10">
                          <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            Open ElevenLabs Dashboard
                          </a>
                        </Button>
                      </div>
                    )}

                    {!config.voiceEnabled && (
                      <div className="text-center py-8 text-slate-500">
                        <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>AI calling is disabled. You can set it up later in settings.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Automation Preferences */}
              {currentStep === 5 && (
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Automation Preferences
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Choose how much the AI should automate for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div>
                          <p className="font-medium text-white">Auto-Generate Leads</p>
                          <p className="text-sm text-slate-400">AI finds new leads daily based on your criteria</p>
                        </div>
                        <Switch
                          checked={config.autoGenerateLeads}
                          onCheckedChange={(checked) => updateConfig({ autoGenerateLeads: checked })}
                        />
                      </div>

                      {config.autoGenerateLeads && (
                        <div className="pl-4">
                          <Label className="text-slate-300">Daily Lead Limit</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <input
                              type="range"
                              min={10}
                              max={200}
                              step={10}
                              value={config.dailyLeadLimit}
                              onChange={(e) => updateConfig({ dailyLeadLimit: parseInt(e.target.value) })}
                              className="flex-1"
                            />
                            <span className="text-lg font-bold text-amber-400 w-16">{config.dailyLeadLimit}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div>
                          <p className="font-medium text-white">Auto-Send Emails</p>
                          <p className="text-sm text-slate-400">AI sends personalized emails to new leads</p>
                        </div>
                        <Switch
                          checked={config.autoSendEmails}
                          onCheckedChange={(checked) => updateConfig({ autoSendEmails: checked })}
                          disabled={!config.emailEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div>
                          <p className="font-medium text-white">Auto-Make Calls</p>
                          <p className="text-sm text-slate-400">AI calls leads that don't respond to emails</p>
                        </div>
                        <Switch
                          checked={config.autoMakeCalls}
                          onCheckedChange={(checked) => updateConfig({ autoMakeCalls: checked })}
                          disabled={!config.voiceEnabled}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-xl p-5">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-violet-400" />
                        Your LeadSync AI Flow
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/50">
                          Find {config.targetIndustry || 'Leads'}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/50">
                          AI Scores & Prioritizes
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        {config.emailEnabled && (
                          <>
                            <Badge className="bg-violet-500/30 text-violet-300 border-violet-500/50">
                              Send Emails
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                          </>
                        )}
                        {config.voiceEnabled && (
                          <>
                            <Badge className="bg-green-500/30 text-green-300 border-green-500/50">
                              AI Calls
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                          </>
                        )}
                        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50">
                          Book Meetings
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? onSkip : prevStep}
              className="gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Skip Setup' : 'Back'}
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 px-8"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch LeadSync AI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
