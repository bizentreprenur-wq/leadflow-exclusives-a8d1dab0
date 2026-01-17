import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Zap, Settings, FileText, Calendar, CheckCircle2, Send,
  Users, ChevronRight, Clock, Mail, ArrowRight, Sparkles
} from 'lucide-react';
import { HIGH_CONVERTING_TEMPLATES } from '@/lib/highConvertingTemplates';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface AutoCampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onLaunch: (campaignData: any) => void;
}

type WizardStep = 'setup' | 'template' | 'schedule' | 'complete';

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'setup', label: 'Campaign Setup', icon: Settings },
  { id: 'template', label: 'Choose Template', icon: FileText },
  { id: 'schedule', label: 'Schedule & Send', icon: Calendar },
  { id: 'complete', label: 'Complete', icon: CheckCircle2 },
];

export default function AutoCampaignWizard({
  open,
  onOpenChange,
  leads,
  onLaunch,
}: AutoCampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('setup');
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [sendMode, setSendMode] = useState<'instant' | 'drip' | 'scheduled'>('drip');
  const [dripRate, setDripRate] = useState(50);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const leadsWithEmail = leads.filter(l => l.email);

  const canProceed = () => {
    switch (currentStep) {
      case 'setup':
        return campaignName.trim().length > 0;
      case 'template':
        return selectedTemplate !== null;
      case 'schedule':
        return sendMode !== 'scheduled' || scheduledDate;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    
    // Simulate campaign launch
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const campaignData = {
      name: campaignName,
      template: selectedTemplate,
      leads: leadsWithEmail,
      sendMode,
      dripRate,
      scheduledDate,
    };
    
    onLaunch(campaignData);
    setCurrentStep('complete');
    setIsLaunching(false);
    toast.success(`Campaign "${campaignName}" launched successfully!`);
  };

  const resetWizard = () => {
    setCurrentStep('setup');
    setCampaignName('');
    setSelectedTemplate(null);
    setSendMode('drip');
    setScheduledDate('');
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Campaign Setup</h2>
              <p className="text-muted-foreground">Name your campaign and select leads to target</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Campaign Details</Label>
                <div className="space-y-2">
                  <Label htmlFor="campaign-name" className="text-sm text-muted-foreground">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Q1 Outreach Campaign"
                    className="h-12 text-base bg-muted/30 border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Selected Leads ({leadsWithEmail.length})</Label>
                </div>
                <p className="text-sm text-muted-foreground">These leads will receive your campaign emails</p>
                
                <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2">
                  {leadsWithEmail.slice(0, 20).map((lead, idx) => (
                    <div
                      key={lead.id}
                      className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-sm truncate"
                    >
                      {lead.name}
                    </div>
                  ))}
                  {leadsWithEmail.length > 20 && (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                      +{leadsWithEmail.length - 20} more leads
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Template</h2>
              <p className="text-muted-foreground">Select an email template for your campaign</p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {HIGH_CONVERTING_TEMPLATES.slice(0, 12).map((template) => {
                  const categoryIcons: Record<string, string> = {
                    'web-design': '🎨',
                    'local-services': '🏠',
                    'b2b': '💼',
                    'general': '📧',
                    'follow-up': '🔄',
                    'promotional': '🎁',
                  };
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 rounded-xl text-left transition-all border-2 ${
                        selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{categoryIcons[template.category] || '📧'}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {template.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {selectedTemplate?.id === template.id && (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Schedule & Send</h2>
              <p className="text-muted-foreground">Choose when and how to send your campaign</p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'instant', label: 'Send Instantly', desc: 'Send all emails right now', icon: Send },
                { id: 'drip', label: 'Drip Campaign', desc: `Send ${dripRate} emails per hour for optimal delivery`, icon: Clock },
                { id: 'scheduled', label: 'Schedule for Later', desc: 'Pick a specific date and time', icon: Calendar },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSendMode(mode.id as any)}
                  className={`w-full p-5 rounded-xl text-left transition-all border-2 flex items-center gap-4 ${
                    sendMode === mode.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/20 hover:border-primary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    sendMode === mode.id ? 'bg-primary text-white' : 'bg-muted'
                  }`}>
                    <mode.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{mode.label}</h4>
                    <p className="text-sm text-muted-foreground">{mode.desc}</p>
                  </div>
                  {sendMode === mode.id && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                </button>
              ))}

              {sendMode === 'drip' && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <Label>Emails per hour: {dripRate}</Label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={dripRate}
                    onChange={(e) => setDripRate(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estimated completion: {Math.ceil(leadsWithEmail.length / dripRate)} hours
                  </p>
                </div>
              )}

              {sendMode === 'scheduled' && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <Label>Schedule Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Campaign Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-5">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Campaign Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Campaign:</span>
                    <p className="font-medium">{campaignName || 'Untitled'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recipients:</span>
                    <p className="font-medium">{leadsWithEmail.length} leads</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Template:</span>
                    <p className="font-medium">{selectedTemplate?.name || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Send Mode:</span>
                    <p className="font-medium capitalize">{sendMode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">Campaign Launched! 🎉</h2>
              <p className="text-muted-foreground">
                Your campaign "{campaignName}" is now active
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">{leadsWithEmail.length}</div>
                <div className="text-xs text-muted-foreground">Recipients</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-amber-500">1</div>
                <div className="text-xs text-muted-foreground">Template</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold text-green-500">Active</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>

            <Button onClick={resetWizard} size="lg" className="mt-6">
              Close
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-56 bg-muted/30 border-r border-border p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Auto</h3>
                <p className="text-xs text-muted-foreground">Campaign</p>
              </div>
            </div>

            <nav className="space-y-1 flex-1">
              {STEPS.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = idx < currentStepIndex;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    disabled={idx > currentStepIndex}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {currentStep !== 'complete' && (
              <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between">
                {currentStepIndex > 0 ? (
                  <Button variant="ghost" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep === 'schedule' ? (
                  <Button
                    onClick={handleLaunch}
                    disabled={!canProceed() || isLaunching}
                    className="gap-2 bg-gradient-to-r from-primary to-emerald-500"
                  >
                    {isLaunching ? (
                      <>Launching...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Launch Campaign
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="gap-2"
                  >
                    Next: {STEPS[currentStepIndex + 1]?.label}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
