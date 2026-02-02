import { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail, Linkedin, MessageSquare, Plus, Trash2, GripVertical,
  Clock, Play, Pause, Save, ArrowRight, Sparkles, Zap, 
  ChevronDown, ChevronUp, Eye, Edit, Copy, CheckCircle,
  Timer, Users, TrendingUp, Settings, Flame, Snowflake, 
  Globe, XCircle, Brain, Target
} from 'lucide-react';

// Lead type for detection
interface LeadData {
  id: string;
  name: string;
  website?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
  rating?: number;
}

interface LeadTypeAnalysis {
  hot: number;
  warm: number;
  cold: number;
  noWebsite: number;
  total: number;
  primaryType: 'hot' | 'warm' | 'cold' | 'no-website' | 'mixed';
  recommendedSequences: string[];
}

interface SequenceBuilderModuleProps {
  leads?: LeadData[];
}

const STORAGE_KEY = 'bamlead_sequences';

// Classify a single lead
function classifyLead(lead: LeadData): 'hot' | 'warm' | 'cold' | 'no-website' {
  // No website = high-value prospect
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    return 'no-website';
  }

  let score = 50;

  // Needs upgrade = hot
  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
  }

  // Has issues = warm/hot
  const issueCount = lead.websiteAnalysis?.issues?.length || 0;
  if (issueCount >= 3) {
    score += 25;
  } else if (issueCount > 0) {
    score += 10;
  }

  // Low mobile score = hot
  const mobileScore = lead.websiteAnalysis?.mobileScore;
  if (mobileScore !== null && mobileScore !== undefined) {
    if (mobileScore < 50) {
      score += 20;
    } else if (mobileScore < 70) {
      score += 10;
    }
  }

  // High rating = established business
  if (lead.rating && lead.rating >= 4.5) {
    score += 10;
  }

  if (score >= 80) return 'hot';
  if (score >= 55) return 'warm';
  return 'cold';
}

// Analyze all leads and recommend sequences
function analyzeLeadTypes(leads: LeadData[]): LeadTypeAnalysis {
  const analysis: LeadTypeAnalysis = {
    hot: 0,
    warm: 0,
    cold: 0,
    noWebsite: 0,
    total: leads.length,
    primaryType: 'mixed',
    recommendedSequences: [],
  };

  leads.forEach(lead => {
    const type = classifyLead(lead);
    switch (type) {
      case 'hot': analysis.hot++; break;
      case 'warm': analysis.warm++; break;
      case 'cold': analysis.cold++; break;
      case 'no-website': analysis.noWebsite++; break;
    }
  });

  // Determine primary type
  const counts = [
    { type: 'hot' as const, count: analysis.hot },
    { type: 'warm' as const, count: analysis.warm },
    { type: 'cold' as const, count: analysis.cold },
    { type: 'no-website' as const, count: analysis.noWebsite },
  ];
  counts.sort((a, b) => b.count - a.count);

  if (counts[0].count > analysis.total * 0.4) {
    analysis.primaryType = counts[0].type;
  }

  // Recommend sequences based on lead types
  if (analysis.noWebsite > 0) {
    analysis.recommendedSequences.push('no-website');
  }
  if (analysis.hot > 0) {
    analysis.recommendedSequences.push('hot-leads');
  }
  if (analysis.warm > 0) {
    analysis.recommendedSequences.push('warm-nurture');
  }
  if (analysis.cold > 0) {
    analysis.recommendedSequences.push('cold-outreach', 'reengagement');
  }

  return analysis;
}

// Types
interface SequenceStep {
  id: string;
  channel: 'email' | 'linkedin' | 'sms';
  delay: number;
  delayUnit: 'hours' | 'days';
  subject?: string;
  message: string;
  isActive: boolean;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused';
  createdAt: Date;
  leadsEnrolled: number;
}

const CHANNEL_CONFIG = {
  email: {
    icon: Mail,
    label: 'Email',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    bgColor: 'from-blue-500/20 to-blue-500/5',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    bgColor: 'from-sky-500/20 to-sky-500/5',
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    bgColor: 'from-emerald-500/20 to-emerald-500/5',
  },
};

const DEFAULT_TEMPLATES = {
  email: {
    subject: 'Quick follow-up on my previous message',
    message: 'Hi {{first_name}},\n\nI wanted to follow up on my previous email. I understand you\'re busy, but I thought you might find value in what we offer.\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n{{sender_name}}',
  },
  linkedin: {
    message: 'Hi {{first_name}}, I noticed we haven\'t connected yet. I\'d love to learn more about {{business_name}} and see if there\'s a way we can help. Would you be open to connecting?',
  },
  sms: {
    message: 'Hi {{first_name}}, this is {{sender_name}}. I sent you an email about helping {{business_name}}. Would a quick call work for you this week?',
  },
};

// Pre-built sequence templates with AI recommendations
const SEQUENCE_TEMPLATES = [
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Sequence',
    description: 'Multi-touch outreach for new leads',
    aiRecommendedFor: ['new-leads', 'no-website', 'cold-prospects'],
    steps: [
      { id: 's1', channel: 'email' as const, delay: 0, delayUnit: 'days' as const, subject: 'Quick question about your business', message: 'Hi {{first_name}},\n\nI noticed {{business_name}} and wanted to reach out...', isActive: true },
      { id: 's2', channel: 'linkedin' as const, delay: 2, delayUnit: 'days' as const, message: 'Hi {{first_name}}, I just sent you an email - would love to connect here as well!', isActive: true },
      { id: 's3', channel: 'email' as const, delay: 3, delayUnit: 'days' as const, subject: 'Following up', message: 'Hi {{first_name}},\n\nJust wanted to follow up on my previous message...', isActive: true },
      { id: 's4', channel: 'sms' as const, delay: 5, delayUnit: 'days' as const, message: 'Hi {{first_name}}, I\'ve tried reaching you via email. Would a quick call work?', isActive: true },
    ],
  },
  {
    id: 'warm-nurture',
    name: 'Warm Lead Nurture',
    description: 'For leads who\'ve shown interest but haven\'t converted',
    aiRecommendedFor: ['warm-leads', 'website-visitors', 'opened-emails'],
    steps: [
      { id: 'w1', channel: 'email' as const, delay: 0, delayUnit: 'days' as const, subject: 'Resources for {{business_name}}', message: 'Hi {{first_name}},\n\nI put together some resources specifically for businesses like yours...', isActive: true },
      { id: 'w2', channel: 'email' as const, delay: 3, delayUnit: 'days' as const, subject: 'Case study you might find interesting', message: 'Hi {{first_name}},\n\nThought you\'d appreciate this success story from a similar business...', isActive: true },
      { id: 'w3', channel: 'linkedin' as const, delay: 5, delayUnit: 'days' as const, message: 'Hi {{first_name}}, hope the resources I sent were helpful! Happy to discuss any questions.', isActive: true },
    ],
  },
  {
    id: 'hot-leads',
    name: 'Hot Lead Fast Close',
    description: 'Quick, high-touch sequence for ready-to-buy leads',
    aiRecommendedFor: ['hot-leads', 'requested-info', 'high-intent'],
    steps: [
      { id: 'h1', channel: 'email' as const, delay: 0, delayUnit: 'hours' as const, subject: 'Here\'s what you asked for, {{first_name}}', message: 'Hi {{first_name}},\n\nThank you for your interest! Here\'s the information you requested...', isActive: true },
      { id: 'h2', channel: 'sms' as const, delay: 4, delayUnit: 'hours' as const, message: 'Hi {{first_name}}, just sent over the info you requested. Any questions?', isActive: true },
      { id: 'h3', channel: 'email' as const, delay: 1, delayUnit: 'days' as const, subject: 'Quick follow-up', message: 'Hi {{first_name}},\n\nWanted to make sure you received my previous email...', isActive: true },
    ],
  },
  {
    id: 'no-website',
    name: 'No Website Specialist',
    description: 'Targeted sequence for businesses without websites',
    aiRecommendedFor: ['no-website', 'web-design-prospects'],
    steps: [
      { id: 'n1', channel: 'email' as const, delay: 0, delayUnit: 'days' as const, subject: '{{business_name}} could benefit from this', message: 'Hi {{first_name}},\n\nI noticed {{business_name}} doesn\'t have a website yet. In 2024, 97% of consumers search online before visiting a local business...', isActive: true },
      { id: 'n2', channel: 'email' as const, delay: 3, delayUnit: 'days' as const, subject: 'Free mockup for {{business_name}}', message: 'Hi {{first_name}},\n\nI created a quick mockup of what {{business_name}}\'s website could look like...', isActive: true },
      { id: 'n3', channel: 'linkedin' as const, delay: 5, delayUnit: 'days' as const, message: 'Hi {{first_name}}, I\'ve been reaching out about a website for {{business_name}}. Would love to connect!', isActive: true },
      { id: 'n4', channel: 'email' as const, delay: 7, delayUnit: 'days' as const, subject: 'Last chance for the free mockup', message: 'Hi {{first_name}},\n\nJust checking one more time about that free website mockup...', isActive: true },
    ],
  },
  {
    id: 'reengagement',
    name: 'Re-engagement Campaign',
    description: 'Win back leads who went cold',
    aiRecommendedFor: ['cold-leads', 'no-reply', 'dormant'],
    steps: [
      { id: 'r1', channel: 'email' as const, delay: 0, delayUnit: 'days' as const, subject: 'It\'s been a while, {{first_name}}', message: 'Hi {{first_name}},\n\nWe connected a while back about {{business_name}}. Things have changed since then...', isActive: true },
      { id: 'r2', channel: 'email' as const, delay: 5, delayUnit: 'days' as const, subject: 'New offer for {{business_name}}', message: 'Hi {{first_name}},\n\nWanted to share a special offer we\'re running this month...', isActive: true },
    ],
  },
];

const createDefaultSequence = (): Sequence => ({
  ...SEQUENCE_TEMPLATES[0],
  id: generateId(),
  status: 'draft',
  createdAt: new Date(),
  leadsEnrolled: 0,
  steps: SEQUENCE_TEMPLATES[0].steps.map(step => ({ ...step, id: generateId() })),
});

const normalizeStoredSequence = (stored: Partial<Sequence>): Sequence | null => {
  if (!stored || !stored.id || !stored.name || !Array.isArray(stored.steps)) return null;

  const steps: SequenceStep[] = stored.steps
    .filter((step): step is SequenceStep => Boolean(step && step.id && step.channel && step.message))
    .map(step => ({
      ...step,
      delay: Number.isFinite(step.delay) ? step.delay : 0,
      delayUnit: step.delayUnit === 'hours' ? 'hours' : 'days',
      isActive: step.isActive !== false,
    }));

  if (!steps.length) return null;

  return {
    id: stored.id,
    name: stored.name,
    description: stored.description || '',
    status: stored.status === 'active' || stored.status === 'paused' ? stored.status : 'draft',
    createdAt: stored.createdAt ? new Date(stored.createdAt) : new Date(),
    leadsEnrolled: Number.isFinite(stored.leadsEnrolled) ? Number(stored.leadsEnrolled) : 0,
    steps,
  };
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function SequenceBuilderModule({ leads = [] }: SequenceBuilderModuleProps) {
  const [sequences, setSequences] = useState<Sequence[]>(() => {
    if (typeof window === 'undefined') {
      return [createDefaultSequence()];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [createDefaultSequence()];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [createDefaultSequence()];
      const normalized = parsed
        .map((item: Partial<Sequence>) => normalizeStoredSequence(item))
        .filter((item): item is Sequence => Boolean(item));
      return normalized.length ? normalized : [createDefaultSequence()];
    } catch {
      return [createDefaultSequence()];
    }
  });

  // Analyze leads to detect types and recommend sequences
  const leadAnalysis = useMemo(() => analyzeLeadTypes(leads), [leads]);

  const [activeSequence, setActiveSequence] = useState<Sequence | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  
  // New sequence form state
  const [newSequence, setNewSequence] = useState<Partial<Sequence>>({
    name: '',
    description: '',
    steps: [],
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sequences));
    } catch {
      // ignore storage failures
    }
  }, [sequences]);

  const getRecommendedEnrollment = useCallback((sequence: Sequence) => {
    const templateId = sequence.id.includes('hot-leads') || sequence.name.toLowerCase().includes('hot')
      ? 'hot-leads'
      : sequence.id.includes('warm-nurture') || sequence.name.toLowerCase().includes('warm')
        ? 'warm-nurture'
        : sequence.id.includes('no-website') || sequence.name.toLowerCase().includes('no website')
          ? 'no-website'
          : sequence.id.includes('reengagement') || sequence.name.toLowerCase().includes('re-engagement')
            ? 'reengagement'
            : sequence.id.includes('cold-outreach') || sequence.name.toLowerCase().includes('cold')
              ? 'cold-outreach'
              : 'custom';

    switch (templateId) {
      case 'hot-leads':
        return leadAnalysis.hot;
      case 'warm-nurture':
        return leadAnalysis.warm;
      case 'no-website':
        return leadAnalysis.noWebsite;
      case 'reengagement':
      case 'cold-outreach':
        return leadAnalysis.cold;
      default:
        return leadAnalysis.total;
    }
  }, [leadAnalysis.cold, leadAnalysis.hot, leadAnalysis.noWebsite, leadAnalysis.total, leadAnalysis.warm]);

  useEffect(() => {
    if (leadAnalysis.total === 0) return;
    setSequences(prev => prev.map(sequence => {
      if (sequence.status !== 'active') return sequence;
      const nextCount = getRecommendedEnrollment(sequence);
      if (sequence.leadsEnrolled === nextCount) return sequence;
      return { ...sequence, leadsEnrolled: nextCount };
    }));
  }, [getRecommendedEnrollment, leadAnalysis.total]);

  const handleCreateSequence = () => {
    setNewSequence({
      name: '',
      description: '',
      steps: [],
    });
    setActiveSequence(null);
    setShowBuilder(true);
    setIsEditing(true);
  };

  const handleEditSequence = (sequence: Sequence) => {
    setActiveSequence(sequence);
    setNewSequence(sequence);
    setShowBuilder(true);
    setIsEditing(true);
  };

  const handleAddStep = (channel: 'email' | 'linkedin' | 'sms') => {
    const template = DEFAULT_TEMPLATES[channel];
    const newStep: SequenceStep = {
      id: generateId(),
      channel,
      delay: (newSequence.steps?.length || 0) === 0 ? 0 : 2,
      delayUnit: 'days',
      subject: 'subject' in template ? template.subject : undefined,
      message: template.message,
      isActive: true,
    };

    setNewSequence(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));
  };

  const handleRemoveStep = (stepId: string) => {
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps?.filter(s => s.id !== stepId) || [],
    }));
  };

  const handleEditStep = (step: SequenceStep) => {
    setEditingStep({ ...step });
    setStepDialogOpen(true);
  };

  const handleSaveStep = () => {
    if (!editingStep) return;
    
    setNewSequence(prev => ({
      ...prev,
      steps: prev.steps?.map(s => s.id === editingStep.id ? editingStep : s) || [],
    }));
    setStepDialogOpen(false);
    setEditingStep(null);
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const steps = [...(newSequence.steps || [])];
    const index = steps.findIndex(s => s.id === stepId);
    if (direction === 'up' && index > 0) {
      [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
    } else if (direction === 'down' && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    }
    setNewSequence(prev => ({ ...prev, steps }));
  };

  const handleSaveSequence = () => {
    if (!newSequence.name) {
      toast.error('Please enter a sequence name');
      return;
    }
    if (!newSequence.steps || newSequence.steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    if (activeSequence) {
      // Update existing
      setSequences(prev => prev.map(s => 
        s.id === activeSequence.id 
          ? {
              ...s,
              name: newSequence.name || s.name,
              description: newSequence.description || '',
              steps: newSequence.steps || s.steps,
            }
          : s
      ));
      toast.success('Sequence updated!');
    } else {
      // Create new
      const sequence: Sequence = {
        id: generateId(),
        name: newSequence.name || 'Untitled Sequence',
        description: newSequence.description || '',
        steps: newSequence.steps || [],
        status: 'draft',
        createdAt: new Date(),
        leadsEnrolled: 0,
      };
      setSequences(prev => [...prev, sequence]);
      toast.success('Sequence created!');
    }

    setShowBuilder(false);
    setIsEditing(false);
    setActiveSequence(null);
  };

  const handleDuplicateSequence = (sequence: Sequence) => {
    const duplicate: Sequence = {
      ...sequence,
      id: generateId(),
      name: `${sequence.name} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      leadsEnrolled: 0,
      steps: sequence.steps.map(s => ({ ...s, id: generateId() })),
    };
    setSequences(prev => [...prev, duplicate]);
    toast.success('Sequence duplicated!');
  };

  const handleToggleStatus = (sequenceId: string) => {
    setSequences(prev => prev.map(s => {
      if (s.id === sequenceId) {
        if (s.status !== 'active' && leadAnalysis.total === 0) {
          toast.error('No leads available. Add leads before starting a sequence.');
          return s;
        }

        const newStatus = s.status === 'active' ? 'paused' : 'active';
        const leadsEnrolled = newStatus === 'active'
          ? Math.max(0, getRecommendedEnrollment(s))
          : s.leadsEnrolled;

        toast.success(
          newStatus === 'active'
            ? `Sequence activated for ${leadsEnrolled} lead${leadsEnrolled === 1 ? '' : 's'}`
            : 'Sequence paused'
        );

        return { ...s, status: newStatus, leadsEnrolled };
      }
      return s;
    }));
  };

  const getTotalDuration = (steps: SequenceStep[]) => {
    let totalDays = 0;
    steps.forEach(step => {
      totalDays += step.delayUnit === 'hours' ? step.delay / 24 : step.delay;
    });
    return Math.ceil(totalDays);
  };

  // Sequence Builder View
  if (showBuilder) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeSequence ? 'Edit Sequence' : 'Create New Sequence'}
            </h2>
            <p className="text-sm text-slate-400">
              Build your multi-channel outreach flow
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBuilder(false)} className="border-slate-700 text-slate-300 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSaveSequence} className="gap-2 bg-emerald-500 hover:bg-emerald-600">
              <Save className="w-4 h-4" />
              Save Sequence
            </Button>
          </div>
        </div>

        {/* Sequence Info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  value={newSequence.name || ''}
                  onChange={e => setNewSequence(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cold Outreach Sequence"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newSequence.description || ''}
                  onChange={e => setNewSequence(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this sequence for?"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Channel Buttons */}
        <div className="flex flex-wrap gap-3">
          <p className="w-full text-sm font-medium text-muted-foreground mb-1">Add a step:</p>
          {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={key}
                variant="outline"
                className={`gap-2 ${config.color}`}
                onClick={() => handleAddStep(key as 'email' | 'linkedin' | 'sms')}
              >
                <Icon className="w-4 h-4" />
                Add {config.label}
              </Button>
            );
          })}
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {newSequence.steps && newSequence.steps.length > 0 ? (
            <div className="space-y-4">
              {newSequence.steps.map((step, index) => {
                const config = CHANNEL_CONFIG[step.channel];
                const Icon = config.icon;
                
                return (
                  <div key={step.id} className="relative">
                    {/* Connector Line */}
                    {index > 0 && (
                      <div className="absolute -top-4 left-6 w-0.5 h-4 bg-border" />
                    )}
                    
                    {/* Step Card */}
                    <Card className={`border-2 transition-all ${config.color.replace('text-', 'border-').replace('/10', '/30')}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-4">
                          {/* Step Number & Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${config.bgColor}`}>
                            <Icon className="w-6 h-6" />
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={config.color}>
                                Step {index + 1}
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {step.delay === 0 ? 'Immediately' : `After ${step.delay} ${step.delayUnit}`}
                              </Badge>
                            </div>
                            
                            {step.subject && (
                              <p className="font-medium text-sm mb-1">Subject: {step.subject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {step.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMoveStep(step.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMoveStep(step.id, 'down')}
                              disabled={index === newSequence.steps!.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditStep(step)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveStep(step.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

              {/* Summary */}
              <Card className="border-dashed">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{newSequence.steps.length}</strong> steps total
                      </span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{getTotalDuration(newSequence.steps)}</strong> days duration
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {['email', 'linkedin', 'sms'].map(channel => {
                        const count = newSequence.steps.filter(s => s.channel === channel).length;
                        if (count === 0) return null;
                        const config = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG];
                        const Icon = config.icon;
                        return (
                          <Badge key={channel} variant="secondary" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {count}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No steps yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first outreach step to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step Editor Dialog */}
        <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingStep && (
                  <>
                    {(() => {
                      const Icon = CHANNEL_CONFIG[editingStep.channel].icon;
                      return <Icon className="w-5 h-5" />;
                    })()}
                    Edit {CHANNEL_CONFIG[editingStep.channel].label} Step
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Customize this step's timing and message
              </DialogDescription>
            </DialogHeader>

            {editingStep && (
              <div className="space-y-4">
                {/* Delay */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Wait Time</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingStep.delay}
                      onChange={e => setEditingStep(prev => prev ? { ...prev, delay: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={editingStep.delayUnit}
                      onValueChange={(v: 'hours' | 'days') => setEditingStep(prev => prev ? { ...prev, delayUnit: v } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject (email only) */}
                {editingStep.channel === 'email' && (
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={editingStep.subject || ''}
                      onChange={e => setEditingStep(prev => prev ? { ...prev, subject: e.target.value } : null)}
                      placeholder="Enter email subject"
                    />
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={editingStep.message}
                    onChange={e => setEditingStep(prev => prev ? { ...prev, message: e.target.value } : null)}
                    placeholder="Enter your message"
                    className="min-h-[150px]"
                  />
                </div>

                {/* Personalization tokens */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Available tokens:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['{{first_name}}', '{{business_name}}', '{{sender_name}}'].map(token => (
                      <Badge key={token} variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                        onClick={() => setEditingStep(prev => prev ? { ...prev, message: prev.message + ' ' + token } : null)}
                      >
                        {token}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStepDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStep}>
                Save Step
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Sequences List View
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-emerald-400" />
            Multi-Channel Sequences
          </h2>
          <p className="text-sm text-slate-400">
            Automate Email → LinkedIn → SMS outreach flows
          </p>
        </div>
        <Button onClick={handleCreateSequence} className="gap-2 bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4" />
          New Sequence
        </Button>
      </div>

      {/* Lead Type Detection Panel */}
      {leads.length > 0 && (
        <Card className="border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              AI Lead Analysis - {leadAnalysis.total} Leads Detected
            </CardTitle>
            <CardDescription>
              Based on your current search results, here's what we recommend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lead Type Breakdown */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border-2 border-red-500/30 bg-red-500/5 text-center">
                <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-600">{leadAnalysis.hot}</p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
              <div className="p-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5 text-center">
                <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-600">{leadAnalysis.warm}</p>
                <p className="text-xs text-muted-foreground">Warm Leads</p>
              </div>
              <div className="p-3 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 text-center">
                <Snowflake className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-600">{leadAnalysis.cold}</p>
                <p className="text-xs text-muted-foreground">Cold Leads</p>
              </div>
              <div className="p-3 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 text-center">
                <XCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-600">{leadAnalysis.noWebsite}</p>
                <p className="text-xs text-muted-foreground">No Website 🔥</p>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lead Distribution</span>
                <span className="font-medium">
                  Primary: {
                    leadAnalysis.primaryType === 'hot' ? '🔥 Hot Leads' :
                    leadAnalysis.primaryType === 'warm' ? '⚡ Warm Leads' :
                    leadAnalysis.primaryType === 'cold' ? '❄️ Cold Leads' :
                    leadAnalysis.primaryType === 'no-website' ? '🌐 No Website' :
                    '📊 Mixed'
                  }
                </span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {leadAnalysis.hot > 0 && (
                  <div 
                    className="bg-red-500 transition-all" 
                    style={{ width: `${(leadAnalysis.hot / leadAnalysis.total) * 100}%` }}
                  />
                )}
                {leadAnalysis.warm > 0 && (
                  <div 
                    className="bg-amber-500 transition-all" 
                    style={{ width: `${(leadAnalysis.warm / leadAnalysis.total) * 100}%` }}
                  />
                )}
                {leadAnalysis.cold > 0 && (
                  <div 
                    className="bg-blue-500 transition-all" 
                    style={{ width: `${(leadAnalysis.cold / leadAnalysis.total) * 100}%` }}
                  />
                )}
                {leadAnalysis.noWebsite > 0 && (
                  <div 
                    className="bg-emerald-500 transition-all" 
                    style={{ width: `${(leadAnalysis.noWebsite / leadAnalysis.total) * 100}%` }}
                  />
                )}
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-600 mb-1">AI Recommendation</p>
                  <p className="text-sm text-muted-foreground">
                    {leadAnalysis.primaryType === 'hot' && 'Use the "Hot Lead Fast Close" sequence for quick conversions. These leads are ready to buy!'}
                    {leadAnalysis.primaryType === 'warm' && 'The "Warm Lead Nurture" sequence is perfect. Send value-packed content to build trust.'}
                    {leadAnalysis.primaryType === 'cold' && 'Start with "Cold Outreach" or "Re-engagement Campaign" for gradual warming.'}
                    {leadAnalysis.primaryType === 'no-website' && 'Your best bet: "No Website Specialist" sequence. These leads NEED your services!'}
                    {leadAnalysis.primaryType === 'mixed' && 'Create separate sequences for each lead type, or start with "Cold Outreach" as a general approach.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommended Sequences */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI-Recommended Sequences
          </CardTitle>
          <CardDescription>
            {leads.length > 0 
              ? `Based on your ${leadAnalysis.total} leads, we recommend these sequences` 
              : 'Choose a proven sequence template based on your lead types'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SEQUENCE_TEMPLATES
              .sort((a, b) => {
                // Prioritize recommended sequences when we have leads
                if (leads.length === 0) return 0;
                const aRecommended = leadAnalysis.recommendedSequences.includes(a.id);
                const bRecommended = leadAnalysis.recommendedSequences.includes(b.id);
                if (aRecommended && !bRecommended) return -1;
                if (!aRecommended && bRecommended) return 1;
                return 0;
              })
              .map((template) => {
                const isRecommended = leads.length > 0 && leadAnalysis.recommendedSequences.includes(template.id);
                const isPrimaryMatch = 
                  (leadAnalysis.primaryType === 'hot' && template.id === 'hot-leads') ||
                  (leadAnalysis.primaryType === 'warm' && template.id === 'warm-nurture') ||
                  (leadAnalysis.primaryType === 'cold' && template.id === 'cold-outreach') ||
                  (leadAnalysis.primaryType === 'no-website' && template.id === 'no-website');

                return (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all ${
                      isPrimaryMatch 
                        ? 'border-2 border-violet-500 ring-2 ring-violet-500/20 bg-violet-500/5' 
                        : isRecommended 
                          ? 'border-2 border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                          : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      const newSeq: Sequence = {
                        ...template,
                        id: generateId(),
                        status: 'draft',
                        createdAt: new Date(),
                        leadsEnrolled: 0,
                        steps: template.steps.map(s => ({ ...s, id: generateId() })),
                      };
                      setSequences(prev => [...prev, newSeq]);
                      toast.success(`"${template.name}" sequence added!`);
                    }}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <div className="flex gap-1">
                          {isPrimaryMatch && (
                            <Badge className="text-[10px] bg-violet-500 text-white border-0">
                              Best Match
                            </Badge>
                          )}
                          {isRecommended && !isPrimaryMatch && (
                            <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-600 border-0">
                              Recommended
                            </Badge>
                          )}
                          {!isRecommended && (
                            <Badge variant="secondary" className="text-[10px]">
                              AI Pick
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{template.steps.length} steps</span>
                        <span>•</span>
                        <span>{template.steps.filter(s => s.channel === 'email').length} emails</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Channel Overview */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key} className={`border ${config.color.replace('text-', 'border-').replace('/10', '/20')}`}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${config.bgColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {key === 'email' ? 'Automated' : key === 'linkedin' ? 'Semi-auto' : 'Automated'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No sequences yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first multi-channel sequence or choose an AI-recommended template above.
            </p>
            <Button onClick={handleCreateSequence} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map(sequence => (
            <Card key={sequence.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{sequence.name}</h3>
                      <Badge variant={
                        sequence.status === 'active' ? 'default' : 
                        sequence.status === 'paused' ? 'secondary' : 'outline'
                      }>
                        {sequence.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                        {sequence.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                        {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
                      </Badge>
                    </div>
                    {sequence.description && (
                      <p className="text-sm text-muted-foreground mb-3">{sequence.description}</p>
                    )}
                    
                    {/* Steps Preview */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sequence.steps.map((step, index) => {
                        const config = CHANNEL_CONFIG[step.channel];
                        const Icon = config.icon;
                        return (
                          <div key={step.id} className="flex items-center gap-1">
                            <Badge variant="outline" className={`gap-1 ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                            {index < sequence.steps.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {getTotalDuration(sequence.steps)} day sequence
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {sequence.leadsEnrolled} leads enrolled
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicateSequence(sequence)}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditSequence(sequence)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={sequence.status === 'active' ? 'secondary' : 'default'}
                      className="gap-2"
                      onClick={() => handleToggleStatus(sequence.id)}
                    >
                      {sequence.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">How Multi-Channel Sequences Work</h4>
              <p className="text-sm text-muted-foreground">
                Enroll leads into sequences to automatically send emails, LinkedIn connection requests, 
                and SMS messages at optimal intervals. Leads are automatically removed when they reply.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
