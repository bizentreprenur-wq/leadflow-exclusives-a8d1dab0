/**
 * AI Calling Module - Complete 4-Tab Interface
 * 
 * TABS:
 * 1. Overview - Tier capability cards, live stats
 * 2. Call Queue - Visual list with status indicators, progress bar
 * 3. AI Script - Embedded script preview panel with tone selection
 * 4. Results - Success rate, interest rate, hot leads list
 * 
 * PRICING (2026):
 * - Free: Script preview only
 * - Basic ($49/mo): AI generates scripts, you dial (+$8/mo for phone)
 * - Pro ($99/mo): AI calls, you supervise (+$8/mo for phone)
 * - Autopilot ($249/mo): Fully autonomous, phone INCLUDED
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneCall,
  PhoneMissed,
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Settings,
  FileText,
  Users,
  Clock,
  BarChart3,
  Target,
  Zap,
  Loader2,
  ChevronRight,
  AlertCircle,
  Bot,
  Eye,
  Edit3,
  Volume2,
  TrendingUp,
  Flame,
  Info
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import AIScriptPreviewPanel from '@/components/AIScriptPreviewPanel';
import { Link } from 'react-router-dom';

interface AICallingModuleProps {
  leads?: Array<{
    id: string | number;
    name: string;
    phone?: string;
    business?: string;
    status?: string;
    email?: string;
  }>;
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
}

interface CallQueueItem {
  id: string | number;
  name: string;
  phone: string;
  business?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
  outcome?: string;
  duration?: number;
}

export default function AICallingModule({
  leads = [],
  searchQuery = '',
  searchLocation = '',
  selectedStrategy = ''
}: AICallingModuleProps) {
  const { 
    status, 
    statusMessage, 
    callingModeDescription,
    capabilities, 
    phoneSetup, 
    isLoading, 
    needsUpgrade,
    needsAddon,
    addonMessage,
    purchaseAddon,
    isReady,
    addon
  } = useAICalling();
  const { tier, tierInfo, isAutopilot, isPro } = usePlanFeatures();
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [callStats, setCallStats] = useState({
    total: 0,
    completed: 0,
    answered: 0,
    noAnswer: 0,
    interested: 0,
    avgDuration: 0
  });

  // Filter leads with phone numbers
  const callableLeads = useMemo(() => {
    return leads.filter(lead => lead.phone && lead.phone.length >= 10);
  }, [leads]);

  // Leads without phone (email only)
  const emailOnlyLeads = useMemo(() => {
    return leads.filter(lead => !lead.phone && lead.email);
  }, [leads]);

  // Initialize call queue from leads
  useEffect(() => {
    if (callableLeads.length > 0 && callQueue.length === 0) {
      setCallQueue(callableLeads.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone!,
        business: lead.business,
        status: 'pending' as const
      })));
    }
  }, [callableLeads]);

  const handleStartCalling = () => {
    if (!isReady) {
      if (needsUpgrade) {
        toast.error('Upgrade your plan to enable AI calling');
      } else if (needsAddon) {
        toast.error('Purchase AI Calling add-on first');
      } else if (status === 'phone_needed') {
        setShowPhoneModal(true);
      }
      return;
    }

    if (callQueue.filter(c => c.status === 'pending').length === 0) {
      toast.error('No leads in queue to call');
      return;
    }

    setIsCallingActive(true);
    simulateCall();
    toast.success('AI calling started');
  };

  const handleStopCalling = () => {
    setIsCallingActive(false);
    toast.info('AI calling paused');
  };

  // Simulate a call (in production, uses calling.io API)
  const simulateCall = () => {
    const pendingCalls = callQueue.filter(c => c.status === 'pending');
    if (pendingCalls.length === 0 || !isCallingActive) {
      setIsCallingActive(false);
      return;
    }

    const currentCall = pendingCalls[0];
    
    setCallQueue(prev => prev.map(c => 
      c.id === currentCall.id ? { ...c, status: 'calling' as const } : c
    ));

    const duration = Math.floor(Math.random() * 12000) + 3000;
    
    setTimeout(() => {
      const outcomes = ['completed', 'no_answer', 'completed', 'completed', 'failed'] as const;
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const interested = outcome === 'completed' && Math.random() > 0.6;
      
      setCallQueue(prev => prev.map(c => 
        c.id === currentCall.id ? { 
          ...c, 
          status: outcome,
          outcome: interested ? 'Interested' : outcome === 'completed' ? 'Callback' : undefined,
          duration: Math.floor(duration / 1000)
        } : c
      ));

      setCallStats(prev => ({
        total: prev.total + 1,
        completed: prev.completed + (outcome === 'completed' ? 1 : 0),
        answered: prev.answered + (outcome === 'completed' ? 1 : 0),
        noAnswer: prev.noAnswer + (outcome === 'no_answer' ? 1 : 0),
        interested: prev.interested + (interested ? 1 : 0),
        avgDuration: Math.floor((prev.avgDuration * prev.total + duration / 1000) / (prev.total + 1))
      }));

      if (isCallingActive) {
        setTimeout(simulateCall, 1500);
      }
    }, duration);
  };

  const getCallStatusIcon = (callStatus: CallQueueItem['status']) => {
    switch (callStatus) {
      case 'calling':
        return <PhoneCall className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'no_answer':
        return <PhoneMissed className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Tier capability config for display
  const tierCapabilities = useMemo(() => [
    {
      tier: 'free',
      name: 'Free',
      icon: Eye,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-border',
      features: [
        'AI call script preview only',
        'See what AI would say',
        'Read-only mode'
      ],
      limitation: 'Upgrade to unlock'
    },
    {
      tier: 'basic',
      name: 'Basic',
      icon: Edit3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      features: [
        'AI generates call scripts',
        'Edit & customize scripts',
        'You dial manually'
      ],
      addon: `+$${AI_CALLING_ADDON_PRICE}/mo for phone`
    },
    {
      tier: 'pro',
      name: 'Pro',
      icon: Bot,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      features: [
        'AI calls your leads',
        'You supervise calls',
        'Real-time transcripts'
      ],
      addon: `+$${AI_CALLING_ADDON_PRICE}/mo for phone`
    },
    {
      tier: 'autopilot',
      name: 'Autopilot',
      icon: Sparkles,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      features: [
        'Fully autonomous calling',
        'AI books meetings',
        'Phone number included'
      ],
      included: 'AI phone included!'
    }
  ], []);

  const currentTierInfo = tierCapabilities.find(t => t.tier === tier);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Leads Summary Card */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Your Leads Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-500">{callableLeads.length}</div>
                <div className="text-sm text-muted-foreground">Ready to Call</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="text-3xl font-bold text-foreground">{emailOnlyLeads.length}</div>
                <div className="text-sm text-muted-foreground">Have Email</div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
                  <ol className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-xs">1.</span>
                      <Phone className="w-3 h-3" />
                      Call leads using AI voice agent
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xs">2.</span>
                      <Clock className="w-3 h-3" />
                      Schedule follow-up meetings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xs">3.</span>
                      <Target className="w-3 h-3" />
                      Save everything to your CRM
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main AI Calling Card with Tabs */}
        <Card className="border-2 border-border overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  status === 'ready' 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                    : status === 'addon_needed'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-muted to-muted-foreground/20'
                }`}>
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    AI Calling
                    <Badge className={`${tierInfo.bgColor} ${tierInfo.color} border-0`}>
                      {tierInfo.name}
                    </Badge>
                    {isCallingActive && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {callingModeDescription}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {tier !== 'free' && needsAddon && (
                  <Button onClick={purchaseAddon} className="gap-2 bg-amber-500 hover:bg-amber-600">
                    <Zap className="w-4 h-4" />
                    Add AI Calling - ${AI_CALLING_ADDON_PRICE}/mo
                  </Button>
                )}
                {addon.status === 'active' && !phoneSetup.hasPhone && (
                  <Button onClick={() => setShowPhoneModal(true)} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Setup Phone
                  </Button>
                )}
                {isReady && !isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                  <Button onClick={handleStartCalling} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Play className="w-4 h-4" />
                    Start Calling
                  </Button>
                )}
                {isCallingActive && (
                  <Button onClick={handleStopCalling} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                {tier === 'free' && (
                  <Link to="/pricing">
                    <Button variant="outline" className="gap-2">
                      Upgrade
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6">
                <TabsList className="h-12 bg-transparent gap-2">
                  <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10 px-4">
                    <BarChart3 className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-primary/10 px-4">
                    <Users className="w-4 h-4" />
                    Call Queue
                    {callQueue.filter(c => c.status === 'pending').length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {callQueue.filter(c => c.status === 'pending').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="script" className="gap-2 data-[state=active]:bg-primary/10 px-4">
                    <FileText className="w-4 h-4" />
                    AI Script
                  </TabsTrigger>
                  <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-primary/10 px-4">
                    <Target className="w-4 h-4" />
                    Results
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ===== OVERVIEW TAB ===== */}
              <TabsContent value="overview" className="p-6 space-y-6">
                {/* Tier Capability Cards */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    AI Calling by Tier
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {tierCapabilities.map((tierCap) => {
                      const isCurrentTier = tier === tierCap.tier;
                      const TierIcon = tierCap.icon;
                      
                      return (
                        <div 
                          key={tierCap.tier}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isCurrentTier 
                              ? `${tierCap.bgColor} ${tierCap.borderColor} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
                              : 'bg-card border-border opacity-60'
                          }`}
                        >
                          {isCurrentTier && (
                            <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                              Your Plan
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <TierIcon className={`w-5 h-5 ${tierCap.color}`} />
                            <span className={`font-semibold ${isCurrentTier ? tierCap.color : 'text-foreground'}`}>
                              {tierCap.name}
                            </span>
                          </div>
                          <ul className="space-y-2 text-xs">
                            {tierCap.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className={`w-3 h-3 mt-0.5 ${isCurrentTier ? tierCap.color : 'text-muted-foreground'}`} />
                                <span className={isCurrentTier ? 'text-foreground' : 'text-muted-foreground'}>
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {tierCap.addon && (
                            <Badge variant="outline" className="mt-3 text-xs w-full justify-center">
                              {tierCap.addon}
                            </Badge>
                          )}
                          {tierCap.included && (
                            <Badge className="mt-3 bg-emerald-500/20 text-emerald-600 text-xs w-full justify-center">
                              {tierCap.included}
                            </Badge>
                          )}
                          {tierCap.limitation && (
                            <Badge variant="secondary" className="mt-3 text-xs w-full justify-center">
                              {tierCap.limitation}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Stats - Only show for Pro/Autopilot with activity */}
                {(isPro || isAutopilot) && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Live Call Stats
                    </h3>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="p-4 rounded-xl bg-card border text-center">
                        <div className="text-2xl font-bold text-foreground">{callStats.total}</div>
                        <div className="text-xs text-muted-foreground">Total Calls</div>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <div className="text-2xl font-bold text-emerald-500">{callStats.answered}</div>
                        <div className="text-xs text-muted-foreground">Answered</div>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-2xl font-bold text-amber-500">{callStats.noAnswer}</div>
                        <div className="text-xs text-muted-foreground">No Answer</div>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <div className="text-2xl font-bold text-primary">{callStats.interested}</div>
                        <div className="text-xs text-muted-foreground">Interested</div>
                      </div>
                      <div className="p-4 rounded-xl bg-card border text-center">
                        <div className="text-2xl font-bold text-foreground">{callStats.avgDuration}s</div>
                        <div className="text-xs text-muted-foreground">Avg Duration</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Card */}
                <div className={`p-6 rounded-2xl border-2 ${
                  status === 'ready' 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : status === 'addon_needed'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-dashed border-primary/30 bg-primary/5'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      status === 'ready' 
                        ? 'bg-emerald-500/10' 
                        : status === 'addon_needed'
                        ? 'bg-amber-500/10'
                        : 'bg-primary/10'
                    }`}>
                      {status === 'ready' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : status === 'addon_needed' ? (
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                      ) : (
                        <Zap className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">
                        {status === 'ready' ? 'AI Calling Ready!' : 
                         status === 'addon_needed' ? `Add AI Calling for $${AI_CALLING_ADDON_PRICE}/mo` :
                         status === 'phone_needed' ? 'Phone Number Pending' :
                         status === 'phone_provisioning' ? 'Setting Up Your AI Phone...' :
                         'Get Started with AI Calling'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">{addonMessage}</p>
                      
                      {status === 'addon_needed' && tier !== 'free' && (
                        <Button onClick={purchaseAddon} className="gap-2 bg-amber-500 hover:bg-amber-600">
                          <Zap className="w-4 h-4" />
                          Subscribe to AI Calling
                        </Button>
                      )}
                      
                      {tier === 'free' && (
                        <Link to="/pricing">
                          <Button className="gap-2">
                            View Plans
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      
                      {status === 'phone_needed' && addon.status === 'active' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          BamLead is configuring your AI phone number...
                        </div>
                      )}
                      
                      {phoneSetup.hasPhone && phoneSetup.phoneNumber && (
                        <Badge className="bg-emerald-500/20 text-emerald-600 gap-1">
                          <Phone className="w-3 h-3" />
                          {phoneSetup.phoneNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== CALL QUEUE TAB ===== */}
              <TabsContent value="queue" className="p-6">
                {callQueue.length > 0 ? (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    {isCallingActive && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm font-medium text-foreground">AI Calling in Progress</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {callQueue.filter(c => c.status !== 'pending').length} / {callQueue.length}
                          </span>
                        </div>
                        <Progress 
                          value={(callQueue.filter(c => c.status !== 'pending').length / callQueue.length) * 100} 
                          className="h-3"
                        />
                      </div>
                    )}

                    {/* Status Summary */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 border text-center">
                        <div className="text-lg font-bold text-foreground">{callQueue.filter(c => c.status === 'pending').length}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <div className="text-lg font-bold text-primary">{callQueue.filter(c => c.status === 'calling').length}</div>
                        <div className="text-xs text-muted-foreground">Calling</div>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <div className="text-lg font-bold text-emerald-500">{callQueue.filter(c => c.status === 'completed').length}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-lg font-bold text-amber-500">{callQueue.filter(c => c.status === 'no_answer' || c.status === 'failed').length}</div>
                        <div className="text-xs text-muted-foreground">No Answer</div>
                      </div>
                    </div>

                    {/* Queue List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {callQueue.map((call) => (
                        <div 
                          key={call.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            call.status === 'calling' 
                              ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20' 
                              : call.status === 'completed'
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : call.status === 'no_answer'
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : call.status === 'failed'
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              call.status === 'calling' ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              {getCallStatusIcon(call.status)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{call.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{call.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {call.outcome && (
                              <Badge className={
                                call.outcome === 'Interested' 
                                  ? 'bg-emerald-500/20 text-emerald-600' 
                                  : 'bg-muted text-muted-foreground'
                              }>
                                {call.outcome}
                              </Badge>
                            )}
                            {call.duration && (
                              <span className="text-xs text-muted-foreground">{call.duration}s</span>
                            )}
                            {call.status === 'calling' && (
                              <div className="flex items-center gap-1 text-sm text-primary">
                                <Volume2 className="w-4 h-4 animate-pulse" />
                                Calling...
                              </div>
                            )}
                            {call.status === 'pending' && (
                              <span className="text-xs text-muted-foreground">Waiting</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Start/Stop Buttons */}
                    {isReady && (
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {!isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                          <Button onClick={handleStartCalling} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                            <Play className="w-4 h-4" />
                            Start AI Calling
                          </Button>
                        )}
                        {isCallingActive && (
                          <>
                            <Button onClick={() => setIsCallingActive(false)} variant="outline" className="gap-2">
                              <Pause className="w-4 h-4" />
                              Pause
                            </Button>
                            <Button onClick={handleStopCalling} variant="destructive" className="gap-2">
                              <Square className="w-4 h-4" />
                              Stop
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">No leads with phone numbers</p>
                    <p className="text-sm text-muted-foreground">Search for leads with phone numbers to add them to your call queue</p>
                  </div>
                )}
              </TabsContent>

              {/* ===== AI SCRIPT TAB ===== */}
              <TabsContent value="script" className="p-6">
                <AIScriptPreviewPanel
                  searchQuery={searchQuery}
                  searchLocation={searchLocation}
                  selectedStrategy={selectedStrategy}
                />
              </TabsContent>

              {/* ===== RESULTS TAB ===== */}
              <TabsContent value="results" className="p-6">
                {callStats.total > 0 ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-6 rounded-xl border bg-card">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <span className="font-medium text-foreground">Success Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-emerald-500">
                          {callStats.total > 0 ? Math.round((callStats.answered / callStats.total) * 100) : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {callStats.answered} answered / {callStats.total} total calls
                        </p>
                      </div>

                      <div className="p-6 rounded-xl border bg-card">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Target className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">Interest Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-primary">
                          {callStats.answered > 0 ? Math.round((callStats.interested / callStats.answered) * 100) : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {callStats.interested} interested / {callStats.answered} answered
                        </p>
                      </div>

                      <div className="p-6 rounded-xl border bg-card">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-amber-500/10">
                            <Clock className="w-5 h-5 text-amber-500" />
                          </div>
                          <span className="font-medium text-foreground">Avg Duration</span>
                        </div>
                        <div className="text-4xl font-bold text-foreground">
                          {callStats.avgDuration}s
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Average call length
                        </p>
                      </div>
                    </div>

                    {/* Hot Leads List */}
                    {callQueue.filter(c => c.outcome === 'Interested').length > 0 && (
                      <div className="rounded-xl border bg-card overflow-hidden">
                        <div className="p-4 border-b bg-emerald-500/5">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            Hot Leads - Ready to Close
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            These leads showed strong interest during the call
                          </p>
                        </div>
                        <div className="divide-y">
                          {callQueue.filter(c => c.outcome === 'Interested').map(lead => (
                            <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <Flame className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{lead.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{lead.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/20 text-emerald-600">Interested</Badge>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Phone className="w-3 h-3" />
                                  Call Back
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">No call results yet</p>
                    <p className="text-sm text-muted-foreground">Start calling to see your results here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <PhoneNumberSetupModal 
        open={showPhoneModal} 
        onOpenChange={setShowPhoneModal}
      />
    </>
  );
}
