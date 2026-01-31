/**
 * Autopilot Onboarding Wizard
 * Premium onboarding experience for $249/mo Autopilot tier customers
 * Guides them through: Company Info → SMTP Setup → AI Template Approval
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Sparkles, Check, ArrowRight, ArrowLeft, 
  Upload, Server, Eye, EyeOff, Loader2, CheckCircle2, 
  Rocket, Crown, Palette, Globe, Phone, MapPin,
  FileText, Zap, Bot, Shield, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSMTPConfig } from '@/hooks/useSMTPConfig';
import { cn } from '@/lib/utils';

interface AutopilotOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface CompanyInfo {
  companyName: string;
  tagline: string;
  website: string;
  phone: string;
  address: string;
  logo: string | null;
  primaryColor: string;
  senderName: string;
  senderEmail: string;
}

interface AITemplateRecommendation {
  id: string;
  name: string;
  category: string;
  reason: string;
  approved: boolean;
}

const STEPS = [
  { id: 'company', title: 'Company Info', icon: Building2 },
  { id: 'smtp', title: 'Email Setup', icon: Mail },
  { id: 'templates', title: 'AI Recommendations', icon: Sparkles },
  { id: 'launch', title: 'Launch', icon: Rocket },
];

const ONBOARDING_KEY = 'bamlead_autopilot_onboarding';

export default function AutopilotOnboardingWizard({ 
  open, 
  onOpenChange, 
  onComplete 
}: AutopilotOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    tagline: '',
    website: '',
    phone: '',
    address: '',
    logo: null,
    primaryColor: '#f59e0b',
    senderName: '',
    senderEmail: '',
  });

  // SMTP Config
  const { 
    config: smtpConfig, 
    updateConfig: updateSmtpConfig,
    testConnection,
    isTesting,
    status: smtpStatus 
  } = useSMTPConfig();

  // AI Template Recommendations
  const [recommendations, setRecommendations] = useState<AITemplateRecommendation[]>([
    { id: '1', name: 'Professional Introduction', category: 'First Contact', reason: 'Best for initial outreach to new leads', approved: true },
    { id: '2', name: 'Value Proposition', category: 'Follow-up', reason: 'Highlights your unique selling points', approved: true },
    { id: '3', name: 'Case Study Share', category: 'Nurture', reason: 'Builds credibility with success stories', approved: true },
    { id: '4', name: 'Soft Close', category: 'Conversion', reason: 'Gentle push towards scheduling a call', approved: true },
    { id: '5', name: 'Re-engagement', category: 'Resurrection', reason: 'Brings cold leads back to life', approved: true },
  ]);

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.companyInfo) setCompanyInfo(data.companyInfo);
        if (data.currentStep) setCurrentStep(data.currentStep);
      }
    } catch {}
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
      companyInfo,
      currentStep,
    }));
  }, [companyInfo, currentStep]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyInfo(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestSMTP = async () => {
    const result = await testConnection();
    if (result.success) {
      toast.success('SMTP connection verified!', {
        description: 'Your email server is ready to send.',
      });
    } else {
      toast.error('Connection failed', {
        description: result.error || 'Please check your credentials.',
      });
    }
  };

  const toggleTemplateApproval = (id: string) => {
    setRecommendations(prev => 
      prev.map(r => r.id === id ? { ...r, approved: !r.approved } : r)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Company Info
        return companyInfo.companyName && companyInfo.senderName && companyInfo.senderEmail;
      case 1: // SMTP
        return smtpConfig.host && smtpConfig.username && smtpConfig.password;
      case 2: // Templates
        return recommendations.some(r => r.approved);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    
    try {
      // Save all settings
      localStorage.setItem('bamlead_branding_info', JSON.stringify({
        companyName: companyInfo.companyName,
        tagline: companyInfo.tagline,
        website: companyInfo.website,
        phone: companyInfo.phone,
        address: companyInfo.address,
        logo: companyInfo.logo,
        primaryColor: companyInfo.primaryColor,
      }));
      
      localStorage.setItem('email_branding', JSON.stringify({
        fromName: companyInfo.senderName,
        fromEmail: companyInfo.senderEmail,
      }));

      // Mark onboarding as complete
      localStorage.setItem('bamlead_autopilot_onboarding_complete', 'true');
      
      // Simulate AI activation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('🚀 Autopilot Activated!', {
        description: 'AI is now managing your outreach. Sit back and watch the magic happen.',
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to Autopilot</h2>
              <p className="text-white/80 text-sm">Let's set up your AI-powered outreach in minutes</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  idx === currentStep 
                    ? "bg-white text-amber-600" 
                    : idx < currentStep 
                    ? "bg-white/30 text-white" 
                    : "bg-white/10 text-white/60"
                )}>
                  {idx < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2",
                    idx < currentStep ? "bg-white/50" : "bg-white/20"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Company Info */}
            {currentStep === 0 && (
              <motion.div
                key="company"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Tell us about your business</h3>
                  <p className="text-muted-foreground text-sm">This information will personalize your outreach</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Logo Upload */}
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                        {companyInfo.logo ? (
                          <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="max-w-[200px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Acme Corporation"
                      className="mt-1"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={companyInfo.tagline}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Your success, our mission"
                      className="mt-1"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourcompany.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Sender Name */}
                  <div>
                    <Label htmlFor="senderName">Sender Name *</Label>
                    <Input
                      id="senderName"
                      value={companyInfo.senderName}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="John from Acme"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">How your emails will be signed</p>
                  </div>

                  {/* Sender Email */}
                  <div>
                    <Label htmlFor="senderEmail">Sender Email *</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      value={companyInfo.senderEmail}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="john@acme.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Replies will go here</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: SMTP Setup */}
            {currentStep === 1 && (
              <motion.div
                key="smtp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Connect Your Email Server</h3>
                  <p className="text-muted-foreground text-sm">This allows AI to send emails on your behalf</p>
                </div>

                {/* Status Banner */}
                <div className={cn(
                  "p-4 rounded-xl flex items-center gap-3",
                  smtpStatus.isVerified 
                    ? "bg-emerald-500/10 border border-emerald-500/30" 
                    : "bg-amber-500/10 border border-amber-500/30"
                )}>
                  {smtpStatus.isVerified ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        SMTP Connected & Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Configure your SMTP to enable email sending
                      </span>
                    </>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* SMTP Host */}
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host *</Label>
                    <Input
                      id="smtpHost"
                      value={smtpConfig.host}
                      onChange={(e) => updateSmtpConfig({ host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="mt-1"
                    />
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <Label htmlFor="smtpPort">Port *</Label>
                    <Input
                      id="smtpPort"
                      value={smtpConfig.port}
                      onChange={(e) => updateSmtpConfig({ port: e.target.value })}
                      placeholder="465"
                      className="mt-1"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <Label htmlFor="smtpUser">Username *</Label>
                    <Input
                      id="smtpUser"
                      value={smtpConfig.username}
                      onChange={(e) => updateSmtpConfig({ username: e.target.value })}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="smtpPass">Password *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="smtpPass"
                        type={showPassword ? 'text' : 'password'}
                        value={smtpConfig.password}
                        onChange={(e) => updateSmtpConfig({ password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* SSL Toggle */}
                  <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label>Use SSL/TLS</Label>
                      <p className="text-xs text-muted-foreground">Recommended for secure connections</p>
                    </div>
                    <Switch
                      checked={smtpConfig.secure}
                      onCheckedChange={(checked) => updateSmtpConfig({ secure: checked })}
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <Button
                  onClick={handleTestSMTP}
                  disabled={isTesting || !smtpConfig.host || !smtpConfig.username || !smtpConfig.password}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Server className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {/* Quick Setup Guides */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Popular SMTP Settings:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => updateSmtpConfig({ host: 'smtp.gmail.com', port: '465', secure: true })}
                      className="p-2 rounded-lg bg-background hover:bg-primary/5 border border-border text-left"
                    >
                      <span className="font-medium">Gmail</span>
                      <span className="text-muted-foreground block">smtp.gmail.com:465</span>
                    </button>
                    <button
                      onClick={() => updateSmtpConfig({ host: 'smtp.office365.com', port: '587', secure: true })}
                      className="p-2 rounded-lg bg-background hover:bg-primary/5 border border-border text-left"
                    >
                      <span className="font-medium">Outlook</span>
                      <span className="text-muted-foreground block">smtp.office365.com:587</span>
                    </button>
                    <button
                      onClick={() => updateSmtpConfig({ host: 'smtp.hostinger.com', port: '465', secure: true })}
                      className="p-2 rounded-lg bg-background hover:bg-primary/5 border border-border text-left"
                    >
                      <span className="font-medium">Hostinger</span>
                      <span className="text-muted-foreground block">smtp.hostinger.com:465</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: AI Template Recommendations */}
            {currentStep === 2 && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium mb-3">
                    <Bot className="w-4 h-4" />
                    AI Recommendations
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Approve Your Email Sequence</h3>
                  <p className="text-muted-foreground text-sm">AI has selected the best templates for your business</p>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <Card 
                      key={rec.id}
                      className={cn(
                        "transition-all cursor-pointer",
                        rec.approved 
                          ? "border-amber-500/50 bg-amber-500/5" 
                          : "border-border hover:border-muted-foreground/30"
                      )}
                      onClick={() => toggleTemplateApproval(rec.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
                            rec.approved 
                              ? "bg-amber-500 text-white" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{rec.name}</span>
                              <Badge variant="secondary" className="text-xs">{rec.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                            rec.approved 
                              ? "bg-amber-500 text-white" 
                              : "bg-muted"
                          )}>
                            {rec.approved && <Check className="w-4 h-4" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">AI will personalize each template</p>
                      <p className="text-xs text-muted-foreground">
                        Using lead intelligence data, AI will customize subject lines, opening hooks, 
                        and calls-to-action for maximum engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Launch */}
            {currentStep === 3 && (
              <motion.div
                key="launch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Ready for Liftoff!</h3>
                  <p className="text-muted-foreground">Review your settings and launch AI Autopilot</p>
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{companyInfo.companyName || 'Company'}</p>
                      <p className="text-xs text-muted-foreground">Company</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{companyInfo.senderEmail || 'Email'}</p>
                      <p className="text-xs text-muted-foreground">Sender</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{recommendations.filter(r => r.approved).length} Templates</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </CardContent>
                  </Card>
                </div>

                {/* What happens next */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    What happens when you launch:
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" />
                      <span>AI will analyze your leads and prioritize by intent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" />
                      <span>Personalized emails sent automatically on optimal schedule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" />
                      <span>Follow-ups triggered based on engagement signals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" />
                      <span>Proposals delivered when leads show buying intent</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>You can pause or adjust AI settings anytime from the dashboard</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunch}
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch Autopilot
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
