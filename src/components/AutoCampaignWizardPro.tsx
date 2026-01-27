import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Crown, Bot, Zap, Sparkles, Rocket, Play, Pause, CheckCircle2,
  Clock, Calendar, Mail, Target, ArrowRight, CreditCard, Shield,
  Globe, Store, Flame, ThermometerSun, Snowflake, Brain, TrendingUp,
  FileText, Send, Users, Settings2, Lock
} from 'lucide-react';
import AIFollowUpSequenceGenerator from './AIFollowUpSequenceGenerator';
import SmartSchedulingEngine from './SmartSchedulingEngine';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
}

interface AutoCampaignWizardProProps {
  leads: Lead[];
  searchType: 'gmb' | 'platform' | null;
  onActivate: () => void;
  onClose: () => void;
  isEmbedded?: boolean;
}

export default function AutoCampaignWizardPro({
  leads,
  searchType,
  onActivate,
  onClose,
  isEmbedded = false,
}: AutoCampaignWizardProProps) {
  // Subscription state
  const [subscriptionState, setSubscriptionState] = useState<{
    hasSubscription: boolean;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    isPaid: boolean;
  }>(() => {
    try {
      const stored = localStorage.getItem('bamlead_autopilot_trial');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.isPaid) {
          return { hasSubscription: true, isTrialActive: false, trialDaysRemaining: 0, isPaid: true };
        }
        if (data.trialStartDate) {
          const startDate = new Date(data.trialStartDate);
          const now = new Date();
          const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const remaining = Math.max(0, 14 - diffDays);
          return { 
            hasSubscription: remaining > 0, 
            isTrialActive: remaining > 0, 
            trialDaysRemaining: remaining,
            isPaid: false,
          };
        }
      }
      return { hasSubscription: false, isTrialActive: false, trialDaysRemaining: 0, isPaid: false };
    } catch { 
      return { hasSubscription: false, isTrialActive: false, trialDaysRemaining: 0, isPaid: false }; 
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'sequences' | 'scheduling'>('overview');
  const [isActivating, setIsActivating] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<any>(null);
  const [smartSchedule, setSmartSchedule] = useState<{ hour: number; day: string }[]>([]);

  const hasSubscription = subscriptionState.hasSubscription;

  const startFreeTrial = () => {
    const trialData = {
      isTrialActive: true,
      trialDaysRemaining: 14,
      trialStartDate: new Date().toISOString(),
      isPaid: false,
    };
    localStorage.setItem('bamlead_autopilot_trial', JSON.stringify(trialData));
    setSubscriptionState({
      hasSubscription: true,
      isTrialActive: true,
      trialDaysRemaining: 14,
      isPaid: false,
    });
    toast.success('🎉 14-day free trial started! AI Autopilot is now available.');
  };

  const handleSubscribe = () => {
    // In production, this would open Stripe checkout
    toast.info('Redirecting to payment... (Demo: Trial activated instead)');
    startFreeTrial();
  };

  const handleActivateAutopilot = async () => {
    if (!hasSubscription) {
      toast.error('Please subscribe first');
      return;
    }

    setIsActivating(true);
    
    // Simulate activation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store autopilot state
    localStorage.setItem('bamlead_drip_active', JSON.stringify({
      active: true,
      leads: leads.map(l => l?.id ?? '').filter(Boolean),
      searchType,
      sequence: selectedSequence,
      schedule: smartSchedule,
      startedAt: new Date().toISOString(),
    }));
    
    setIsActivating(false);
    onActivate();
    toast.success('🤖 AI Autopilot activated! AI will manage your outreach automatically.');
  };

  const leadStats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter(l => l.aiClassification === 'hot').length,
    warm: leads.filter(l => l.aiClassification === 'warm').length,
    cold: leads.filter(l => l.aiClassification === 'cold').length,
  }), [leads]);

  const containerClass = isEmbedded 
    ? "h-full overflow-auto p-6" 
    : "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto";

  const innerClass = isEmbedded
    ? "max-w-4xl mx-auto space-y-6"
    : "max-w-4xl mx-auto p-6";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {/* HERO HEADER - Bold and Prominent */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 mb-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    AI Autopilot Campaign
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      PRO
                    </Badge>
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    AI-powered outreach that works while you sleep
                  </p>
                </div>
              </div>
              
              {/* Subscription Status */}
              {hasSubscription ? (
                <Badge className="bg-white/20 text-white border-white/30 gap-1.5 py-1.5 px-3">
                  <CheckCircle2 className="w-4 h-4" />
                  {subscriptionState.isTrialActive 
                    ? `Trial: ${subscriptionState.trialDaysRemaining} days left`
                    : 'Active Subscription'
                  }
                </Badge>
              ) : (
                <Button 
                  onClick={handleSubscribe}
                  className="bg-white text-orange-600 hover:bg-white/90 gap-2 font-semibold"
                >
                  <CreditCard className="w-4 h-4" />
                  Start Free Trial
                </Button>
              )}
            </div>

            {/* What's Included */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              {[
                { icon: Bot, label: 'AI Autopilot', desc: 'Fully automated' },
                { icon: Zap, label: 'Smart Sequences', desc: 'Intent-based drips' },
                { icon: Brain, label: 'Smart Scheduling', desc: 'Optimal timing' },
                { icon: FileText, label: 'PreDone Docs', desc: 'Contracts ready' },
              ].map((feature) => (
                <div key={feature.label} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <feature.icon className="w-5 h-5 text-white mb-2" />
                  <p className="text-sm font-semibold text-white">{feature.label}</p>
                  <p className="text-[10px] text-white/70">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Subscription</p>
                <p className="text-2xl font-bold text-white">$39<span className="text-base font-normal text-white/70">/month</span></p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Free Trial</p>
                <p className="text-xl font-bold text-white">14 days</p>
              </div>
              {!hasSubscription && (
                <Button 
                  onClick={startFreeTrial}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 gap-2 font-bold"
                >
                  <Rocket className="w-5 h-5" />
                  Start 14-Day Trial
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search Type Indicator */}
        <div className="flex items-center gap-3 mb-4">
          <Badge 
            variant="outline" 
            className={cn(
              "text-sm py-1.5 px-3 gap-2",
              searchType === 'gmb' 
                ? "border-purple-500/50 text-purple-400 bg-purple-500/10" 
                : "border-orange-500/50 text-orange-400 bg-orange-500/10"
            )}
          >
            {searchType === 'gmb' ? (
              <><Globe className="w-4 h-4" /> Search A: Super AI (Niche Selling)</>
            ) : (
              <><Store className="w-4 h-4" /> Search B: Agency Lead Finder (Services)</>
            )}
          </Badge>
          <Badge variant="secondary" className="text-sm py-1.5 px-3 gap-2">
            <Users className="w-4 h-4" />
            {leadStats.total} Leads
          </Badge>
          <div className="flex gap-1">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
              <Flame className="w-3 h-3 mr-1" />
              {leadStats.hot}
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <ThermometerSun className="w-3 h-3 mr-1" />
              {leadStats.warm}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              <Snowflake className="w-3 h-3 mr-1" />
              {leadStats.cold}
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'sequences', label: 'AI Sequences', icon: Zap },
            { id: 'scheduling', label: 'Smart Scheduling', icon: Clock },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "gap-2",
                activeTab === tab.id 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" 
                  : ""
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* How It Works */}
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      How AI Autopilot Campaign Works
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { step: 1, title: 'AI Analyzes Leads', desc: 'Detects intent & priority from your search results', icon: Brain },
                        { step: 2, title: 'Selects Sequence', desc: 'Recommends optimal follow-up pattern', icon: Target },
                        { step: 3, title: 'Smart Scheduling', desc: 'Times emails for maximum opens', icon: Clock },
                        { step: 4, title: 'Auto Follow-ups', desc: 'Continues until lead responds', icon: Bot },
                      ].map((item) => (
                        <div key={item.step} className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
                            <item.icon className="w-6 h-6 text-amber-400" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">Step {item.step}</p>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription-Gated Activation */}
                <Card className={cn(
                  "border-2",
                  hasSubscription 
                    ? "bg-emerald-500/5 border-emerald-500/30" 
                    : "bg-muted/30 border-dashed border-muted-foreground/30"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center",
                          hasSubscription 
                            ? "bg-emerald-500/20" 
                            : "bg-muted"
                        )}>
                          {hasSubscription ? (
                            <Bot className="w-7 h-7 text-emerald-400" />
                          ) : (
                            <Lock className="w-7 h-7 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">
                            {hasSubscription ? 'Ready to Activate' : 'Subscribe to Activate'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {hasSubscription 
                              ? `AI will manage ${leads.length} leads with automated follow-ups`
                              : 'Start your 14-day free trial to unlock AI automation'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={hasSubscription ? handleActivateAutopilot : startFreeTrial}
                        disabled={isActivating}
                        size="lg"
                        className={cn(
                          "gap-2 font-bold",
                          hasSubscription
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        )}
                      >
                        {isActivating ? (
                          <>Activating...</>
                        ) : hasSubscription ? (
                          <><Play className="w-5 h-5" /> Activate AI Autopilot</>
                        ) : (
                          <><Rocket className="w-5 h-5" /> Start Free Trial</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className={cn(
                    "border-border",
                    !hasSubscription && "opacity-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-foreground">Drip Campaigns</span>
                        {!hasSubscription && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automated email sequences that nurture leads over time with perfect timing
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border-border",
                    !hasSubscription && "opacity-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-foreground">Response Detection</span>
                        {!hasSubscription && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI detects replies and stops sequences automatically when leads engage
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border-border",
                    !hasSubscription && "opacity-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-foreground">PreDone Documents</span>
                        {!hasSubscription && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contracts & proposals ready to send when leads show purchase intent
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border-border",
                    !hasSubscription && "opacity-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-5 h-5 text-amber-400" />
                        <span className="font-semibold text-foreground">Smart Unsubscribe</span>
                        {!hasSubscription && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automatically respects opt-outs and maintains sender reputation
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Sequences Tab */}
            {activeTab === 'sequences' && (
              <AIFollowUpSequenceGenerator
                leads={leads}
                searchType={searchType}
                hasSubscription={hasSubscription}
                onStartTrial={startFreeTrial}
                onApplySequence={(sequence, leads) => {
                  setSelectedSequence(sequence);
                  toast.success(`Sequence "${sequence.name}" applied to ${leads.length} leads`);
                }}
              />
            )}

            {/* Scheduling Tab */}
            {activeTab === 'scheduling' && (
              <SmartSchedulingEngine
                hasSubscription={hasSubscription}
                onScheduleApply={(schedule) => {
                  setSmartSchedule(schedule);
                  toast.success('Smart schedule configured!');
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Close button for non-embedded mode */}
        {!isEmbedded && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
