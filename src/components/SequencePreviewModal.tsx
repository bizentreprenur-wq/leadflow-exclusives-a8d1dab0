import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail, Eye, Clock, CheckCircle2, Flame, ThermometerSun, Snowflake,
  ChevronLeft, ChevronRight, Sparkles, User, Building2, Globe,
  Monitor, Smartphone, Moon, Sun, Copy, Play, ArrowRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EmailSequence,
  EmailStep,
  personalizeSequenceStep,
} from '@/lib/emailSequences';
import { getStoredLeadContext, generatePersonalizationFromContext, LeadAnalysisContext } from '@/lib/leadContext';

interface SequencePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: EmailSequence | null;
  onSelectSequence?: (sequence: EmailSequence) => void;
  onApplyStep?: (step: EmailStep, personalized: { subject: string; body: string }) => void;
  senderName?: string;
}

export default function SequencePreviewModal({
  isOpen,
  onClose,
  sequence,
  onSelectSequence,
  onApplyStep,
  senderName = 'Your Name',
}: SequencePreviewModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isDark, setIsDark] = useState(false);

  // Get sample leads
  const sampleLeads = useMemo(() => {
    const stored = getStoredLeadContext();
    if (stored.length > 0) return stored.slice(0, 5);
    
    // Demo leads if none available
    return [
      {
        id: '1',
        businessName: 'Acme Plumbing Co',
        email: 'john@acmeplumbing.com',
        website: 'acmeplumbing.com',
        aiClassification: 'hot' as const,
        websiteAnalysis: {
          hasWebsite: true,
          needsUpgrade: true,
          mobileScore: 45,
          issues: ['Slow loading', 'Not mobile-friendly'],
          opportunities: [],
        },
        painPoints: ['Low online visibility', 'Losing customers to competitors'],
      },
      {
        id: '2',
        businessName: 'Best Auto Repair',
        email: 'mike@bestauto.com',
        aiClassification: 'hot' as const,
        websiteAnalysis: {
          hasWebsite: false,
          needsUpgrade: false,
          issues: [],
          opportunities: [],
        },
        painPoints: ['No online presence', 'Missing local customers'],
      },
      {
        id: '3',
        businessName: 'City Dental Clinic',
        email: 'info@citydental.com',
        website: 'citydental.com',
        aiClassification: 'warm' as const,
        websiteAnalysis: {
          hasWebsite: true,
          needsUpgrade: false,
          mobileScore: 82,
          issues: [],
          opportunities: ['Add online booking'],
        },
        painPoints: ['Need more patients'],
      },
    ];
  }, []);

  const currentLead = sampleLeads[selectedLeadIndex];
  const currentStep = sequence?.steps[currentStepIndex];

  // Personalize content for selected lead
  const personalizedContent = useMemo(() => {
    if (!currentStep || !currentLead) return { subject: '', body: '' };

    const vars = generatePersonalizationFromContext(currentLead);
    
    let subject = currentStep.subject;
    let body = currentStep.body;

    // Replace all tokens
    const replacements: Record<string, string> = {
      '{{business_name}}': currentLead.businessName,
      '{{first_name}}': currentLead.businessName.split(' ')[0],
      '{{website}}': currentLead.website || 'your website',
      '{{industry}}': 'local business',
      '{{sender_name}}': senderName,
      '{{primary_issue}}': currentLead.websiteAnalysis?.issues?.[0] || 'outdated design',
      '{{secondary_issue}}': currentLead.websiteAnalysis?.issues?.[1] || 'slow loading speed',
      '{{website_issues}}': currentLead.websiteAnalysis?.issues?.join(', ') || 'various issues',
      '{{mobile_score}}': currentLead.websiteAnalysis?.mobileScore ? `${currentLead.websiteAnalysis.mobileScore}%` : '45%',
      '{{new_insight_1}}': 'Your competitors are outranking you in local search',
      '{{new_insight_2}}': 'Mobile traffic to your site has dropped 20%',
      '{{service_type}}': 'web design and SEO',
    };

    Object.entries(replacements).forEach(([token, value]) => {
      const regex = new RegExp(token.replace(/[{}]/g, '\\$&'), 'gi');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    // Also replace from vars
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    // Clean up any remaining Mustache-style conditionals
    body = body.replace(/\{\{#[\w_]+\}\}[\s\S]*?\{\{\/[\w_]+\}\}/g, '');

    return { subject, body };
  }, [currentStep, currentLead, senderName]);

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'hot': return <Flame className="w-4 h-4 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-4 h-4 text-amber-400" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const handleApplyStep = () => {
    if (currentStep && onApplyStep) {
      onApplyStep(currentStep, personalizedContent);
      onClose();
    }
  };

  const handleSelectSequence = () => {
    if (sequence && onSelectSequence) {
      onSelectSequence(sequence);
      onClose();
    }
  };

  if (!sequence) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-emerald-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">
                  {sequence.emoji}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    {sequence.name}
                    <Badge className={cn(
                      "text-[10px]",
                      sequence.priority === 'hot' && "bg-red-500/20 text-red-400 border-red-500/30",
                      sequence.priority === 'warm' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                      sequence.priority === 'cold' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    )}>
                      {sequence.priority.toUpperCase()}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {sequence.description} • {sequence.steps.length} emails in sequence
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Step Selector */}
            <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
              {/* Lead Selector */}
              <div className="p-3 border-b border-border">
                <label className="text-xs text-muted-foreground mb-2 block">Preview for lead:</label>
                <Select
                  value={selectedLeadIndex.toString()}
                  onValueChange={(v) => setSelectedLeadIndex(parseInt(v))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleLeads.map((lead, i) => (
                      <SelectItem key={i} value={i.toString()} className="text-xs">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(lead.aiClassification)}
                          <span className="truncate">{lead.businessName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Current Lead Info */}
                <div className="mt-2 p-2 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium truncate">{currentLead?.businessName}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    {currentLead?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {currentLead.website}
                      </div>
                    )}
                    {currentLead?.websiteAnalysis && !currentLead.websiteAnalysis.hasWebsite && (
                      <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-500/30">
                        No Website
                      </Badge>
                    )}
                    {currentLead?.painPoints?.[0] && (
                      <div className="text-red-400 truncate">
                        ⚠️ {currentLead.painPoints[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sequence.steps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        currentStepIndex === idx
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] h-5">
                          Day {step.day}
                        </Badge>
                        {currentStepIndex === idx && (
                          <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {step.action}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Email Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Preview Controls */}
              <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="w-3 h-3" />
                    Day {currentStep?.day}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Step {currentStepIndex + 1} of {sequence.steps.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs value={device} onValueChange={(v) => setDevice(v as 'desktop' | 'mobile')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="desktop" className="h-7 px-2 text-xs gap-1">
                        <Monitor className="w-3 h-3" />
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="h-7 px-2 text-xs gap-1">
                        <Smartphone className="w-3 h-3" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDark(!isDark)}
                    className="h-8 w-8 p-0"
                  >
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Email Preview */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className={cn(
                    "mx-auto rounded-xl border-2 overflow-hidden transition-all",
                    device === 'mobile' ? "max-w-[375px]" : "max-w-full",
                    isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
                  )}>
                    {/* Email Header */}
                    <div className={cn(
                      "px-4 py-3 border-b",
                      isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className={isDark ? "text-zinc-400" : "text-gray-500"}>To:</span>
                        <span className={isDark ? "text-zinc-200" : "text-gray-700"}>
                          {currentLead?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] gap-1">
                          <Sparkles className="w-3 h-3" />
                          Personalized
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {currentStep?.action}
                        </Badge>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className={cn("p-5", isDark ? "text-zinc-100" : "text-zinc-900")}>
                      {/* Subject */}
                      <h2 className={cn(
                        "font-bold mb-4 leading-tight",
                        device === 'mobile' ? "text-lg" : "text-xl"
                      )}>
                        {personalizedContent.subject}
                      </h2>

                      {/* Sender */}
                      <div className={cn(
                        "flex items-start gap-3 pb-4 mb-4 border-b",
                        isDark ? "border-zinc-700" : "border-gray-100"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                          "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                        )}>
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{senderName}</p>
                          <p className={cn(
                            "text-sm",
                            isDark ? "text-zinc-400" : "text-gray-500"
                          )}>
                            you@company.com
                          </p>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className={cn(
                        "whitespace-pre-wrap leading-relaxed",
                        device === 'mobile' ? "text-[14px]" : "text-[15px]"
                      )}>
                        {personalizedContent.body}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Navigation & Actions */}
              <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentStepIndex >= sequence.steps.length - 1}
                    onClick={() => setCurrentStepIndex(i => Math.min(sequence.steps.length - 1, i + 1))}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {onApplyStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyStep}
                      className="gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Use This Email
                    </Button>
                  )}
                  {onSelectSequence && (
                    <Button
                      size="sm"
                      onClick={handleSelectSequence}
                      className="gap-1 bg-primary hover:bg-primary/90"
                    >
                      <Play className="w-4 h-4" />
                      Use Entire Sequence
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
