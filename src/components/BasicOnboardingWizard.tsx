/**
 * Basic Onboarding Wizard
 * Onboarding experience for $49/mo Basic tier customers
 * Steps: Company Info → SMTP Setup → CRM Selection → Complete
 * Manual mode - SMTP/CRM pre-configured, user has full control
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Check, ArrowRight, ArrowLeft, 
  Upload, Server, Eye, EyeOff, Loader2, CheckCircle2, 
  Palette, Globe, Phone, Shield, AlertCircle,
  Database, Zap, Users, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSMTPConfig } from '@/hooks/useSMTPConfig';
import { cn } from '@/lib/utils';

interface BasicOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface CompanyInfo {
  companyName: string;
  website: string;
  phone: string;
  logo: string | null;
  senderName: string;
  senderEmail: string;
}

const STEPS = [
  { id: 'company', title: 'Company Info', icon: Building2 },
  { id: 'smtp', title: 'Email Setup', icon: Mail },
  { id: 'crm', title: 'CRM Selection', icon: Database },
  { id: 'complete', title: 'Ready', icon: Check },
];

const CRM_OPTIONS = [
  { 
    id: 'bamlead', 
    name: 'Bamlead CRM', 
    description: 'Built-in CRM with lead tracking & pipeline management',
    badge: 'Free 7 Days',
    recommended: true 
  },
  { 
    id: 'hubspot', 
    name: 'HubSpot', 
    description: 'Connect your existing HubSpot account',
    badge: 'Integration',
    recommended: false 
  },
  { 
    id: 'salesforce', 
    name: 'Salesforce', 
    description: 'Sync leads with Salesforce CRM',
    badge: 'Integration',
    recommended: false 
  },
  { 
    id: 'pipedrive', 
    name: 'Pipedrive', 
    description: 'Export leads directly to Pipedrive',
    badge: 'Integration',
    recommended: false 
  },
];

const ONBOARDING_KEY = 'bamlead_basic_onboarding';

export default function BasicOnboardingWizard({ 
  open, 
  onOpenChange, 
  onComplete 
}: BasicOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCRM, setSelectedCRM] = useState('bamlead');
  
  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    website: '',
    phone: '',
    logo: null,
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

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.companyInfo) setCompanyInfo(data.companyInfo);
        if (data.selectedCRM) setSelectedCRM(data.selectedCRM);
        if (data.currentStep) setCurrentStep(data.currentStep);
      }
    } catch {}
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
      companyInfo,
      selectedCRM,
      currentStep,
    }));
  }, [companyInfo, selectedCRM, currentStep]);

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

  const isSenderEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyInfo.senderEmail.trim());

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Company Info
        return Boolean(
          companyInfo.companyName.trim() &&
            companyInfo.senderName.trim() &&
            isSenderEmailValid,
        );
      case 1: // SMTP
        return Boolean(
          smtpConfig.host.trim() &&
            smtpConfig.username.trim() &&
            smtpConfig.password.trim() &&
            smtpStatus.isVerified,
        );
      case 2: // CRM
        return selectedCRM;
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

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save all settings
      localStorage.setItem('bamlead_branding_info', JSON.stringify({
        companyName: companyInfo.companyName,
        website: companyInfo.website,
        phone: companyInfo.phone,
        logo: companyInfo.logo,
      }));
      
      localStorage.setItem('email_branding', JSON.stringify({
        fromName: companyInfo.senderName,
        fromEmail: companyInfo.senderEmail,
      }));

      localStorage.setItem('bamlead_selected_crm', selectedCRM);
      localStorage.setItem('bamlead_basic_onboarding_complete', 'true');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('🎉 Setup Complete!', {
        description: 'Your SMTP and CRM are configured. Start finding leads!',
      });
      
      onComplete();
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
          {/* Welcome Banner with Logo */}
          <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-white/20">
            <img 
              src="/favicon.png" 
              alt="Bamlead" 
              className="w-10 h-10 rounded-lg bg-white/20 p-1"
            />
            <h1 className="text-2xl font-bold">Welcome to Bamlead</h1>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Basic Plan Setup</h2>
              <p className="text-white/80 text-sm">Configure your tools and start generating leads</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  idx === currentStep 
                    ? "bg-white text-blue-600" 
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
                  <p className="text-muted-foreground text-sm">This information will personalize your emails</p>
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
                  <p className="text-muted-foreground text-sm">Set up SMTP to send emails from your domain</p>
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
                {!smtpStatus.isVerified && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Please run SMTP test successfully before continuing.
                  </p>
                )}

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

            {/* Step 3: CRM Selection */}
            {currentStep === 2 && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Choose Your CRM</h3>
                  <p className="text-muted-foreground text-sm">Where should we send your leads?</p>
                </div>

                <RadioGroup value={selectedCRM} onValueChange={setSelectedCRM} className="space-y-3">
                  {CRM_OPTIONS.map((crm) => (
                    <label
                      key={crm.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedCRM === crm.id 
                          ? "border-blue-500 bg-blue-500/5" 
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <RadioGroupItem value={crm.id} id={crm.id} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{crm.name}</span>
                          {crm.recommended && (
                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                              Recommended
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{crm.badge}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{crm.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {selectedCRM === 'bamlead' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Bamlead CRM - Free for 7 Days</p>
                        <p className="text-xs text-muted-foreground">
                          Full access to pipeline management, lead scoring, and activity tracking. 
                          No credit card required to start.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">You're All Set!</h3>
                  <p className="text-muted-foreground">Your tools are configured and ready to go</p>
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{companyInfo.companyName || 'Company'}</p>
                      <p className="text-xs text-muted-foreground">Company</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Mail className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground truncate">{smtpConfig.host || 'SMTP'}</p>
                      <p className="text-xs text-muted-foreground">Email Server</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Database className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {CRM_OPTIONS.find(c => c.id === selectedCRM)?.name || 'CRM'}
                      </p>
                      <p className="text-xs text-muted-foreground">CRM</p>
                    </CardContent>
                  </Card>
                </div>

                {/* What's included */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Your Basic Plan includes:
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      <span>Unlimited lead searches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      <span>Manual email sending with your templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      <span>Lead export to your CRM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      <span>Basic lead intelligence reports</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>You can update these settings anytime from the dashboard</span>
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
                className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Finding Leads
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
