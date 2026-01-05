import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Timer, Users, TrendingUp, Settings
} from 'lucide-react';

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

export default function SequenceBuilderModule() {
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      id: '1',
      name: 'Cold Outreach Sequence',
      description: 'Multi-touch outreach for new leads',
      steps: [
        { id: 's1', channel: 'email', delay: 0, delayUnit: 'days', subject: 'Quick question about your business', message: 'Hi {{first_name}},\n\nI noticed {{business_name}} and wanted to reach out...', isActive: true },
        { id: 's2', channel: 'linkedin', delay: 2, delayUnit: 'days', message: 'Hi {{first_name}}, I just sent you an email - would love to connect here as well!', isActive: true },
        { id: 's3', channel: 'email', delay: 3, delayUnit: 'days', subject: 'Following up', message: 'Hi {{first_name}},\n\nJust wanted to follow up on my previous message...', isActive: true },
        { id: 's4', channel: 'sms', delay: 5, delayUnit: 'days', message: 'Hi {{first_name}}, I\'ve tried reaching you via email. Would a quick call work?', isActive: true },
      ],
      status: 'draft',
      createdAt: new Date(),
      leadsEnrolled: 0,
    },
  ]);

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

  const generateId = () => Math.random().toString(36).substring(2, 9);

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
          ? { ...s, ...newSequence, steps: newSequence.steps || [] } as Sequence
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
        const newStatus = s.status === 'active' ? 'paused' : 'active';
        toast.success(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}!`);
        return { ...s, status: newStatus };
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {activeSequence ? 'Edit Sequence' : 'Create New Sequence'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Build your multi-channel outreach flow
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBuilder(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSequence} className="gap-2">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Multi-Channel Sequences
          </h2>
          <p className="text-sm text-muted-foreground">
            Automate Email → LinkedIn → SMS outreach flows
          </p>
        </div>
        <Button onClick={handleCreateSequence} className="gap-2">
          <Plus className="w-4 h-4" />
          New Sequence
        </Button>
      </div>

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
              Create your first multi-channel sequence to automate your outreach across Email, LinkedIn, and SMS.
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
