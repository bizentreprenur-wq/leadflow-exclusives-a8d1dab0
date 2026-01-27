import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Layers, Flame, ThermometerSun, Snowflake, ChevronRight,
  CheckCircle2, Clock, Target, Sparkles, Eye, Globe, Store,
  ArrowRight, Play
} from 'lucide-react';
import {
  EmailSequence,
  EmailStep,
  getSequencesBySearchType,
  getSequencesByPriority,
  getSuggestedSequence,
  personalizeSequenceStep,
  getSequenceStats,
  SearchType,
  LeadPriority
} from '@/lib/emailSequences';

interface Lead {
  business_name?: string;
  first_name?: string;
  name?: string;
  contact_name?: string;
  email?: string;
  website?: string;
  industry?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  priority?: string;
  leadScore?: number;
  hasWebsite?: boolean;
  websiteIssues?: string[];
}

interface EmailSequenceSelectorProps {
  searchType: SearchType | null;
  currentLead?: Lead | null;
  onSelectSequence: (sequence: EmailSequence) => void;
  onApplyStep: (step: EmailStep, personalized: { subject: string; body: string }) => void;
  senderName?: string;
  compact?: boolean;
}

export default function EmailSequenceSelector({
  searchType,
  currentLead,
  onSelectSequence,
  onApplyStep,
  senderName = 'Your Name',
  compact = false
}: EmailSequenceSelectorProps) {
  const [selectedPriority, setSelectedPriority] = useState<LeadPriority>('hot');
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [previewStep, setPreviewStep] = useState<number>(0);

  const effectiveSearchType: SearchType = searchType || 'gmb';
  const isSearchA = effectiveSearchType === 'gmb';

  // Get sequences for current search type
  const allSequences = useMemo(() => 
    getSequencesBySearchType(effectiveSearchType),
    [effectiveSearchType]
  );

  // Get sequences filtered by priority
  const filteredSequences = useMemo(() => 
    getSequencesByPriority(effectiveSearchType, selectedPriority),
    [effectiveSearchType, selectedPriority]
  );

  // Get AI suggested sequence based on lead
  const suggestedSequence = useMemo(() => {
    if (!currentLead) return null;
    return getSuggestedSequence(effectiveSearchType, {
      aiClassification: currentLead.aiClassification,
      priority: currentLead.priority as LeadPriority,
      leadScore: currentLead.leadScore,
      hasWebsite: !!currentLead.website,
      websiteIssues: currentLead.websiteIssues,
    });
  }, [effectiveSearchType, currentLead]);

  // Get stats
  const stats = useMemo(() => 
    getSequenceStats(effectiveSearchType),
    [effectiveSearchType]
  );

  const handleSelectSequence = (sequence: EmailSequence) => {
    setSelectedSequence(sequence);
    setPreviewStep(0);
    onSelectSequence(sequence);
  };

  const handleApplyStep = (step: EmailStep) => {
    const leadData = {
      business_name: currentLead?.business_name || currentLead?.name,
      first_name: currentLead?.first_name || currentLead?.contact_name,
      email: currentLead?.email,
      website: currentLead?.website,
      industry: currentLead?.industry,
      websiteIssues: currentLead?.websiteIssues,
    };
    const personalized = personalizeSequenceStep(step, leadData, senderName);
    onApplyStep(step, personalized);
  };

  const getPriorityIcon = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot': return <Flame className="w-4 h-4 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-4 h-4 text-amber-400" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warm': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'cold': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Search Type Badge */}
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "text-[10px] gap-1",
            isSearchA 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-violet-500/20 text-violet-400 border-violet-500/30"
          )}>
            {isSearchA ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
            {isSearchA ? 'Option A Sequences' : 'Option B Sequences'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {allSequences.length} sequences available
          </span>
        </div>

        {/* Priority Quick Filter */}
        <div className="flex gap-2">
          {stats.map(stat => (
            <button
              key={stat.priority}
              onClick={() => setSelectedPriority(stat.priority)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                selectedPriority === stat.priority
                  ? getPriorityColor(stat.priority)
                  : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"
              )}
            >
              {getPriorityIcon(stat.priority)}
              {stat.label} ({stat.count})
            </button>
          ))}
        </div>

        {/* AI Suggestion */}
        {suggestedSequence && (
          <button
            onClick={() => handleSelectSequence(suggestedSequence)}
            className="w-full p-3 rounded-lg bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30 text-left hover:from-primary/20 hover:to-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI Recommended</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{suggestedSequence.name}</p>
            <p className="text-xs text-muted-foreground">{suggestedSequence.description}</p>
          </button>
        )}

        {/* Sequence List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {filteredSequences.map(sequence => (
              <button
                key={sequence.id}
                onClick={() => handleSelectSequence(sequence)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  selectedSequence?.id === sequence.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span>{sequence.emoji}</span>
                    {sequence.name}
                  </span>
                  <Badge className="text-[9px] bg-muted text-muted-foreground">
                    {sequence.steps.length} steps
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sequence.description}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Email Sequences
              <Badge className={cn(
                "text-[10px] gap-1",
                isSearchA 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-violet-500/20 text-violet-400 border-violet-500/30"
              )}>
                {isSearchA ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {isSearchA ? 'Option A' : 'Option B'}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isSearchA 
                ? 'Insight-driven sequences for B2B & local businesses'
                : 'Revenue-focused sequences for agency client acquisition'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Priority Tabs */}
      <Tabs value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as LeadPriority)}>
        <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/30">
          {stats.map(stat => (
            <TabsTrigger 
              key={stat.priority}
              value={stat.priority}
              className={cn(
                "gap-2 data-[state=active]:shadow-none",
                stat.priority === 'hot' && "data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400",
                stat.priority === 'warm' && "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400",
                stat.priority === 'cold' && "data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              )}
            >
              {getPriorityIcon(stat.priority)}
              <span>{stat.label}</span>
              <Badge variant="outline" className="text-[10px] ml-1">
                {stat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AI Suggestion Banner */}
        {suggestedSequence && suggestedSequence.priority === selectedPriority && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">AI Recommended for This Lead</span>
                </div>
                <h4 className="font-bold text-foreground">{suggestedSequence.emoji} {suggestedSequence.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{suggestedSequence.goal}</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleSelectSequence(suggestedSequence)}
                className="bg-primary hover:bg-primary/90 gap-1"
              >
                Use This <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Sequence Cards */}
        {(['hot', 'warm', 'cold'] as LeadPriority[]).map(priority => (
          <TabsContent key={priority} value={priority} className="mt-4">
            <div className="grid gap-3">
              {getSequencesByPriority(effectiveSearchType, priority).map(sequence => (
                <div
                  key={sequence.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer",
                    selectedSequence?.id === sequence.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/50"
                  )}
                  onClick={() => handleSelectSequence(sequence)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="text-lg">{sequence.emoji}</span>
                        {sequence.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{sequence.description}</p>
                    </div>
                    <Badge className={cn("text-[10px]", getPriorityColor(sequence.priority))}>
                      {sequence.steps.length} emails
                    </Badge>
                  </div>

                  {/* Goal & Best For */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Goal</p>
                      <p className="text-xs text-foreground">{sequence.goal}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Best For</p>
                      <p className="text-xs text-foreground">{sequence.bestFor}</p>
                    </div>
                  </div>

                  {/* Steps Preview */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {sequence.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 flex-shrink-0"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          D{step.day}
                        </div>
                        {idx < sequence.steps.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Expanded View when selected */}
                  {selectedSequence?.id === sequence.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Sequence Steps</span>
                        <div className="flex gap-1">
                          {sequence.steps.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setPreviewStep(idx); }}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                previewStep === idx
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step Preview */}
                      <div className="p-4 rounded-lg bg-background border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Day {sequence.steps[previewStep].day}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {sequence.steps[previewStep].action}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          {sequence.steps[previewStep].subject}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                          {sequence.steps[previewStep].body.substring(0, 200)}...
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setPreviewStep(prev => Math.min(prev + 1, sequence.steps.length - 1)); }}
                            disabled={previewStep >= sequence.steps.length - 1}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview Next
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleApplyStep(sequence.steps[previewStep]); }}
                            className="bg-primary hover:bg-primary/90 text-xs gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Use This Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
