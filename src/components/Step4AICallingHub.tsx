/**
 * Step 4 AI Calling Hub
 * Complete 4-tab AI Calling interface with Schedule/CRM merged into Overview
 * 
 * TABS:
 * 1. Overview - Tier capability cards, live stats, Schedule & CRM quick actions
 * 2. Call Queue - Visual list with status indicators, progress bar
 * 3. AI Script - Intelligent script generation from customer journey
 * 4. Results - Success rate, interest rate, hot leads, SMS replies
 * 
 * AI SCRIPT GENERATION CONTEXT:
 * - Step 1 search (GMB vs Platform, query, location, filters)
 * - AI Strategy (approach, purpose, talking points)
 * - Email sequences (templates, drip steps, subject lines)
 * - PreDone documents (proposal/contract type and fields)
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Info,
  Calendar as CalendarIcon,
  Database,
  ArrowLeft,
  Home,
  MessageSquare,
  Send,
  Settings2,
  Plus
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import PhoneNumberSetupModal from '@/components/PhoneNumberSetupModal';
import AIScriptPreviewPanel from '@/components/AIScriptPreviewPanel';
import CallQueueModal from '@/components/CallQueueModal';
import { Link } from 'react-router-dom';
import { 
  buildCallScriptContext,
  addBreadcrumb,
  CustomerJourneyBreadcrumb
} from '@/lib/aiCallingScriptGenerator';

interface Lead {
  id?: string;
  email?: string;
  business_name?: string;
  name?: string;
  phone?: string;
  website?: string;
}

interface Step4AICallingHubProps {
  leads: Lead[];
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenCRMModal: () => void;
  // Journey context for AI script generation
  searchType?: 'gmb' | 'platform';
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
  emailSequences?: string[];
  proposalType?: string;
}

interface CallQueueItem {
  id: string | number;
  name: string;
  phone: string;
  business?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
  outcome?: string;
  duration?: number;
  smsReplies?: { from: 'ai' | 'lead'; message: string; timestamp: string }[];
}

// All CRM options
const CRM_OPTIONS = [
  { id: 'bamlead', name: 'BAMLEAD CRM', icon: '🎯', color: 'from-emerald-500 to-teal-500' },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: 'from-orange-500 to-orange-600' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'from-blue-500 to-blue-600' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', color: 'from-green-500 to-green-600' },
];

export default function Step4AICallingHub({ 
  leads, 
  onBack, 
  onOpenSettings,
  onOpenCRMModal,
  searchType = 'gmb',
  searchQuery = '',
  searchLocation = '',
  selectedStrategy = '',
  emailSequences = [],
  proposalType = ''
}: Step4AICallingHubProps) {
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
    avgDuration: 0,
    smsReplies: 0
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetings, setMeetings] = useState<{ date: Date; leadName: string }[]>([]);

  // Filter leads with phone numbers
  const callableLeads = useMemo(() => {
    return leads.filter(lead => lead.phone && lead.phone.length >= 10);
  }, [leads]);

  // Leads with email (for reference)
  const emailableLeads = useMemo(() => {
    return leads.filter(lead => lead.email);
  }, [leads]);

  // Initialize call queue from leads
  useEffect(() => {
    if (callableLeads.length > 0 && callQueue.length === 0) {
      setCallQueue(callableLeads.map(lead => ({
        id: lead.id || `lead-${Math.random()}`,
        name: lead.business_name || lead.name || 'Unknown',
        phone: lead.phone!,
        business: lead.business_name,
        status: 'pending' as const,
        smsReplies: []
      })));
    }
  }, [callableLeads]);

  // Track breadcrumbs for AI script context
  useEffect(() => {
    addBreadcrumb({
      step: 'Step 4',
      action: 'Entered AI Calling Hub',
      timestamp: new Date().toISOString(),
      details: {
        searchType,
        leadsCount: leads.length,
        callableCount: callableLeads.length,
        strategy: selectedStrategy
      }
    });
  }, []);

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
      
      // Simulate SMS follow-up for Autopilot
      const smsReplies: CallQueueItem['smsReplies'] = [];
      if (isAutopilot && outcome === 'completed' && Math.random() > 0.5) {
        smsReplies.push({
          from: 'ai',
          message: `Hi! Following up on our call. Would you like to schedule a meeting?`,
          timestamp: new Date().toISOString()
        });
        if (Math.random() > 0.4) {
          smsReplies.push({
            from: 'lead',
            message: `Yes, that sounds good. What times work?`,
            timestamp: new Date(Date.now() + 60000).toISOString()
          });
        }
      }
      
      setCallQueue(prev => prev.map(c => 
        c.id === currentCall.id ? { 
          ...c, 
          status: outcome,
          outcome: interested ? 'Interested' : outcome === 'completed' ? 'Callback' : undefined,
          duration: Math.floor(duration / 1000),
          smsReplies
        } : c
      ));

      setCallStats(prev => ({
        total: prev.total + 1,
        completed: prev.completed + (outcome === 'completed' ? 1 : 0),
        answered: prev.answered + (outcome === 'completed' ? 1 : 0),
        noAnswer: prev.noAnswer + (outcome === 'no_answer' ? 1 : 0),
        interested: prev.interested + (interested ? 1 : 0),
        avgDuration: Math.floor((prev.avgDuration * prev.total + duration / 1000) / (prev.total + 1)),
        smsReplies: prev.smsReplies + smsReplies.filter(s => s.from === 'lead').length
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
      features: ['AI call script preview only', 'See what AI would say'],
      limitation: 'Upgrade to unlock'
    },
    {
      tier: 'basic',
      name: 'Basic',
      icon: Edit3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      features: ['AI generates call scripts', 'You dial manually'],
      addon: `+$${AI_CALLING_ADDON_PRICE}/mo`
    },
    {
      tier: 'pro',
      name: 'Pro',
      icon: Bot,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      features: ['AI calls your leads', 'You supervise calls'],
      addon: `+$${AI_CALLING_ADDON_PRICE}/mo`
    },
    {
      tier: 'autopilot',
      name: 'Autopilot',
      icon: Sparkles,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      features: ['Fully autonomous calling', 'AI texts back & forth', 'Phone included'],
      included: 'All included!'
    }
  ], []);

  const handleScheduleMeeting = (lead: Lead) => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }
    const leadName = lead.business_name || lead.name || 'Unknown';
    setMeetings(prev => [...prev, { date: selectedDate, leadName }]);
    toast.success(`Meeting scheduled with ${leadName}`);
  };

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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Email
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="gap-2 text-muted-foreground hover:text-foreground">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 py-6 px-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border border-primary/30"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">📞</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              STEP 4: AI Calling Hub
            </h1>
            <Badge className={`${tierInfo.bgColor} ${tierInfo.color} border-0`}>
              {tierInfo.name}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {callingModeDescription} • <span className="font-semibold text-foreground">{callableLeads.length} leads</span> ready to call
          </p>
        </motion.div>

        {/* Main 4-Tab Interface */}
        <Card className="border-2 border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 bg-muted/30">
              <TabsList className="h-14 bg-transparent gap-2">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10 px-5 py-3">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-primary/10 px-5 py-3">
                  <Users className="w-4 h-4" />
                  Call Queue
                  {callQueue.filter(c => c.status === 'pending').length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {callQueue.filter(c => c.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="script" className="gap-2 data-[state=active]:bg-primary/10 px-5 py-3">
                  <FileText className="w-4 h-4" />
                  AI Script
                </TabsTrigger>
                <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-primary/10 px-5 py-3">
                  <Target className="w-4 h-4" />
                  Results
                  {callStats.smsReplies > 0 && (
                    <Badge className="ml-1 text-xs bg-emerald-500/20 text-emerald-600">
                      {callStats.smsReplies} SMS
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Tier Capability Cards */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  AI Calling Capabilities by Tier
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
                            ? `${tierCap.bgColor} border-primary ring-2 ring-primary/30` 
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
                          <span className={`font-semibold ${tierCap.color}`}>{tierCap.name}</span>
                        </div>
                        <ul className="space-y-2 text-xs">
                          {tierCap.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className={`w-3 h-3 mt-0.5 ${tierCap.color}`} />
                              <span className="text-foreground">{feature}</span>
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Stats */}
              {(isPro || isAutopilot) && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Live Call Stats
                  </h3>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="p-4 rounded-xl bg-card border text-center">
                      <div className="text-2xl font-bold text-foreground">{callStats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
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
                    {isAutopilot && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <div className="text-2xl font-bold text-blue-500">{callStats.smsReplies}</div>
                        <div className="text-xs text-muted-foreground">SMS Replies</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions: Schedule & CRM */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Schedule Quick Action */}
                <Card className="border-2 border-blue-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarIcon className="w-5 h-5 text-blue-500" />
                      Quick Schedule
                    </CardTitle>
                    <CardDescription>Book follow-up meetings with leads</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
                    </div>
                    {selectedDate && (
                      <p className="text-sm text-center text-blue-600 mb-2">
                        📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    <Badge variant="outline" className="w-full justify-center">
                      {meetings.length} meetings scheduled
                    </Badge>
                  </CardContent>
                </Card>

                {/* CRM Quick Action */}
                <Card className="border-2 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="w-5 h-5 text-purple-500" />
                      Save to CRM
                    </CardTitle>
                    <CardDescription>Export leads to your favorite CRM</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {CRM_OPTIONS.map((crm) => (
                        <Button
                          key={crm.id}
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-1 hover:border-purple-500/50"
                          onClick={onOpenCRMModal}
                        >
                          <span className="text-xl">{crm.icon}</span>
                          <span className="text-xs">{crm.name}</span>
                        </Button>
                      ))}
                    </div>
                    <Badge variant="outline" className="w-full justify-center mt-4">
                      11 CRMs available
                    </Badge>
                  </CardContent>
                </Card>
              </div>

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
                    status === 'ready' ? 'bg-emerald-500/10' : 
                    status === 'addon_needed' ? 'bg-amber-500/10' : 'bg-primary/10'
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
                       'Get Started with AI Calling'}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">{addonMessage}</p>
                    
                    <div className="flex flex-wrap gap-2">
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
                      
                      {phoneSetup.hasPhone && phoneSetup.phoneNumber && (
                        <Badge className="bg-emerald-500/20 text-emerald-600 gap-1">
                          <Phone className="w-3 h-3" />
                          {phoneSetup.phoneNumber}
                        </Badge>
                      )}
                      
                      {isReady && !isCallingActive && callQueue.filter(c => c.status === 'pending').length > 0 && (
                        <Button onClick={handleStartCalling} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <Play className="w-4 h-4" />
                          Start Calling ({callQueue.filter(c => c.status === 'pending').length} leads)
                        </Button>
                      )}
                      
                      {isCallingActive && (
                        <Button onClick={handleStopCalling} variant="destructive" className="gap-2">
                          <Square className="w-4 h-4" />
                          Stop Calling
                        </Button>
                      )}
                    </div>
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
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
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
                            {call.smsReplies && call.smsReplies.length > 0 && (
                              <Badge className="bg-blue-500/20 text-blue-600 gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {call.smsReplies.length} SMS
                              </Badge>
                            )}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Action Buttons */}
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
                  <p className="text-sm text-muted-foreground">Go back to Step 1 and search with phone filter enabled</p>
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
                        {callStats.answered} answered / {callStats.total} total
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
                        {callStats.interested} interested
                      </p>
                    </div>

                    <div className="p-6 rounded-xl border bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="font-medium text-foreground">SMS Replies</span>
                      </div>
                      <div className="text-4xl font-bold text-blue-500">
                        {callStats.smsReplies}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isAutopilot ? 'Lead responses' : 'Autopilot only'}
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
                      </div>
                      <div className="divide-y">
                        {callQueue.filter(c => c.outcome === 'Interested').map(lead => (
                          <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
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
                              {lead.smsReplies && lead.smsReplies.length > 0 && (
                                <Badge className="bg-blue-500/20 text-blue-600 gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {lead.smsReplies.filter(s => s.from === 'lead').length} replies
                                </Badge>
                              )}
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

                  {/* SMS Conversations (Autopilot only) */}
                  {isAutopilot && callQueue.some(c => c.smsReplies && c.smsReplies.length > 0) && (
                    <div className="rounded-xl border bg-card overflow-hidden">
                      <div className="p-4 border-b bg-blue-500/5">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                          SMS Conversations
                        </h4>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                          {callQueue.filter(c => c.smsReplies && c.smsReplies.length > 0).map(lead => (
                            <div key={lead.id} className="p-4">
                              <p className="font-medium text-foreground mb-2">{lead.name}</p>
                              <div className="space-y-2">
                                {lead.smsReplies?.map((sms, i) => (
                                  <div 
                                    key={i} 
                                    className={`p-2 rounded-lg text-sm ${
                                      sms.from === 'ai' 
                                        ? 'bg-primary/10 ml-4' 
                                        : 'bg-muted mr-4'
                                    }`}
                                  >
                                    <span className="text-xs text-muted-foreground">
                                      {sms.from === 'ai' ? '🤖 AI' : '👤 Lead'}:
                                    </span>
                                    <p className="text-foreground">{sms.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
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
        </Card>
      </div>

      <PhoneNumberSetupModal 
        open={showPhoneModal} 
        onOpenChange={setShowPhoneModal}
      />
    </>
  );
}
