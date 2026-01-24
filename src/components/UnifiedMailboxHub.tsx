import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail, Send, FileText, Workflow, Bot, Zap, Shield, CheckCircle,
  Inbox, Clock, Settings, Plus, Play, Pause, Edit, Trash2,
  ArrowRight, Flame, Eye, MousePointer, RefreshCw, MoreHorizontal,
  BarChart3, Sparkles, MessageSquare, Linkedin, Phone, ChevronRight,
  Calendar, Users, TrendingUp, Target, Rocket, Brain, Star
} from 'lucide-react';

// Tab types
type MailboxTab = 'inbox' | 'sent' | 'templates' | 'sequences';

interface SequenceStep {
  id: string;
  type: 'email' | 'linkedin' | 'sms' | 'wait' | 'call';
  content?: string;
  subject?: string;
  waitDays?: number;
}

interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  status: 'active' | 'paused' | 'draft';
  leadsEnrolled: number;
  stats: {
    sent: number;
    opened: number;
    replied: number;
  };
}

// Demo sequences matching the reference image
const DEMO_SEQUENCES: Sequence[] = [
  {
    id: '1',
    name: 'LinkedIn Outreach',
    steps: [
      { id: '1a', type: 'linkedin', content: 'Connection request' },
      { id: '1b', type: 'email', subject: 'Follow-up' },
      { id: '1c', type: 'wait', waitDays: 2 },
      { id: '1d', type: 'email', subject: 'Final Email' },
    ],
    status: 'active',
    leadsEnrolled: 47,
    stats: { sent: 188, opened: 142, replied: 23 },
  },
  {
    id: '2',
    name: 'Email Nurture Sequence',
    steps: [
      { id: '2a', type: 'email', subject: 'Initial Email' },
      { id: '2b', type: 'wait', waitDays: 3 },
      { id: '2c', type: 'email', subject: 'Follow-Up Email' },
      { id: '2d', type: 'call', content: 'Final Message' },
    ],
    status: 'active',
    leadsEnrolled: 156,
    stats: { sent: 624, opened: 498, replied: 67 },
  },
  {
    id: '3',
    name: 'SMS Follow-Up',
    steps: [
      { id: '3a', type: 'sms', content: 'Send SMS' },
      { id: '3b', type: 'wait', waitDays: 1 },
      { id: '3c', type: 'email', subject: 'Send Email' },
    ],
    status: 'active',
    leadsEnrolled: 89,
    stats: { sent: 267, opened: 201, replied: 45 },
  },
  {
    id: '4',
    name: 'Cold Email Campaign',
    steps: [
      { id: '4a', type: 'email', subject: 'Intro Email' },
      { id: '4b', type: 'wait', waitDays: 4 },
      { id: '4c', type: 'email', subject: 'Follow-Up' },
      { id: '4d', type: 'email', subject: 'Final Email' },
    ],
    status: 'active',
    leadsEnrolled: 234,
    stats: { sent: 936, opened: 655, replied: 89 },
  },
];

interface UnifiedMailboxHubProps {
  defaultTab?: MailboxTab;
  onSendResponse?: (replyId: string, response: string) => Promise<void>;
}

export default function UnifiedMailboxHub({ defaultTab = 'inbox', onSendResponse }: UnifiedMailboxHubProps) {
  const [activeTab, setActiveTab] = useState<MailboxTab>(defaultTab);
  const [sequences, setSequences] = useState<Sequence[]>(DEMO_SEQUENCES);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [showCreateSequence, setShowCreateSequence] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);

  // Get step icon
  const getStepIcon = (type: SequenceStep['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'wait': return <Clock className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
    }
  };

  // Get step color
  const getStepColor = (type: SequenceStep['type']) => {
    switch (type) {
      case 'email': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'linkedin': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'sms': return 'bg-violet-500/20 text-violet-600 border-violet-500/30';
      case 'wait': return 'bg-slate-500/20 text-slate-600 border-slate-500/30';
      case 'call': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    }
  };

  // Toggle sequence status
  const toggleSequence = (id: string) => {
    setSequences(prev => prev.map(seq => 
      seq.id === id 
        ? { ...seq, status: seq.status === 'active' ? 'paused' : 'active' }
        : seq
    ));
    toast.success(sequences.find(s => s.id === id)?.status === 'active' ? 'Sequence paused' : 'Sequence activated');
  };

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'sequences':
        return renderSequencesTab();
      case 'inbox':
      case 'sent':
      case 'templates':
      default:
        return (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {activeTab === 'inbox' && 'Inbox'}
                {activeTab === 'sent' && 'Sent Emails'}
                {activeTab === 'templates' && 'Email Templates'}
              </p>
              <p className="text-sm">This content is displayed in the main panel</p>
            </div>
          </div>
        );
    }
  };

  // Sequences & Follow-Up Tab Content
  const renderSequencesTab = () => (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
          Sequences & Follow-Up
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Automate your outreach with multi-channel sequences and intelligent follow-ups powered by AI
        </p>
      </div>

      {/* Create + Automation Toggle Row */}
      <div className="flex items-center justify-between">
        <Button 
          onClick={() => setShowCreateSequence(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Sequence
        </Button>

        <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 border">
          <span className="text-sm text-muted-foreground">Automation:</span>
          <div className={`relative transition-all duration-300 ${automationEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            {automationEnabled ? (
              <Badge className="bg-emerald-500 text-white font-semibold gap-1.5 px-3 py-1 text-sm">
                <Zap className="w-3.5 h-3.5" />
                ON
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground font-medium gap-1.5 px-3 py-1 text-sm">
                OFF
              </Badge>
            )}
          </div>
          <Switch 
            checked={automationEnabled}
            onCheckedChange={(v) => {
              setAutomationEnabled(v);
              toast.success(v ? '🤖 AI automation enabled' : 'Automation paused');
            }}
          />
        </div>
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        {sequences.map((sequence, index) => (
          <motion.div
            key={sequence.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-2 transition-all hover:shadow-lg ${
              sequence.status === 'active' 
                ? 'border-border hover:border-primary/30' 
                : 'border-border/50 bg-muted/30'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Sequence Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg">{sequence.name}</h3>
                      <Badge variant="outline" className="text-xs font-normal">
                        {sequence.steps.length} Steps
                      </Badge>
                      <Badge className={`text-xs ${
                        sequence.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-500 border-slate-500/30'
                      }`}>
                        {sequence.status === 'active' ? 'Active' : 'Paused'}
                      </Badge>
                    </div>

                    {/* Steps Flow */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sequence.steps.map((step, stepIndex) => (
                        <div key={step.id} className="flex items-center">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${getStepColor(step.type)}`}>
                            {getStepIcon(step.type)}
                            <span>
                              {step.type === 'wait' && step.waitDays 
                                ? `Wait ${step.waitDays} Day${step.waitDays > 1 ? 's' : ''}`
                                : step.type === 'email' && step.subject
                                ? step.subject
                                : step.type === 'linkedin'
                                ? 'LinkedIn Message'
                                : step.type === 'sms'
                                ? 'Send SMS'
                                : step.type === 'call'
                                ? 'Final Message'
                                : step.content || step.type
                              }
                            </span>
                          </div>
                          {stepIndex < sequence.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => setSelectedSequence(sequence)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => toggleSequence(sequence.id)}
                    >
                      {sequence.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                    >
                      Stats
                    </Button>
                    <Switch 
                      checked={sequence.status === 'active'}
                      onCheckedChange={() => toggleSequence(sequence.id)}
                      className="ml-2"
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium">{sequence.leadsEnrolled}</span> leads enrolled
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Send className="w-3.5 h-3.5" />
                    <span className="font-medium">{sequence.stats.sent}</span> sent
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-medium">{sequence.stats.opened}</span> opened
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="font-medium">{sequence.stats.replied}</span> replied
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Automation Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-violet-500/5 to-amber-500/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                AI-Powered Automation
                <Badge className="bg-primary/20 text-primary text-[10px]">SMART</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                When automation is ON, AI intelligently manages your sequences:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium">Smart Timing</p>
                    <p className="text-muted-foreground">Sends at optimal engagement times</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium">Auto-Responses</p>
                    <p className="text-muted-foreground">Instantly reply to hot leads</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium">Sentiment Analysis</p>
                    <p className="text-muted-foreground">Pauses for negative signals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Mode Toggle Card */}
      <Card className="border-2 border-dashed border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                automationEnabled 
                  ? 'bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/20'
                  : 'bg-muted'
              }`}>
                {automationEnabled ? (
                  <Zap className="w-7 h-7 text-white" />
                ) : (
                  <Shield className="w-7 h-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {automationEnabled ? 'Fully Automatic' : 'Manual Control'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {automationEnabled 
                    ? 'AI sends follow-ups and responses on schedule without intervention'
                    : 'You review and approve all messages before sending'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={!automationEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutomationEnabled(false)}
                className={!automationEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Manual
              </Button>
              <Button
                variant={automationEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutomationEnabled(true)}
                className={automationEnabled ? 'bg-primary' : ''}
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Automatic
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full">
      {/* Top Navigation Bar - Matching Reference Image */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">BamLead.com</span>
            </div>

            {/* Center: Navigation Tabs */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
              {[
                { id: 'inbox' as MailboxTab, label: 'Inbox', icon: Inbox },
                { id: 'sent' as MailboxTab, label: 'Sent', icon: Send },
                { id: 'templates' as MailboxTab, label: 'Templates', icon: FileText },
                { id: 'sequences' as MailboxTab, label: 'Sequences & Follow-Up', icon: Workflow },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Mail className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                JS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
