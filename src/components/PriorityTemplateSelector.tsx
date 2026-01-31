import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Flame, Thermometer, Snowflake, Sparkles, Check, FileText } from 'lucide-react';
import { 
  PRIORITY_TEMPLATES, 
  PriorityTemplate, 
  getTemplatesByPriority,
  getSuggestedTemplate,
  personalizeTemplate,
} from '@/lib/priorityEmailTemplates';

interface PriorityTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: { subject: string; body: string }) => void;
  currentLead?: {
    business_name?: string;
    first_name?: string;
    email?: string;
    website?: string;
    industry?: string;
    aiClassification?: 'hot' | 'warm' | 'cold';
    priority?: 'hot' | 'warm' | 'cold';
    leadScore?: number;
    hasWebsite?: boolean;
    websiteIssues?: string[];
  };
  senderName?: string;
}

export default function PriorityTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  currentLead,
  senderName = 'Your Name',
}: PriorityTemplateSelectorProps) {
  const [selectedPriority, setSelectedPriority] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [selectedTemplate, setSelectedTemplate] = useState<PriorityTemplate | null>(null);
  const [suggestedId, setSuggestedId] = useState<string | null>(null);

  // Auto-detect priority from current lead
  useEffect(() => {
    if (currentLead) {
      const suggested = getSuggestedTemplate(currentLead);
      setSelectedPriority(suggested.priority);
      setSuggestedId(suggested.id);
      setSelectedTemplate(suggested);
    }
  }, [currentLead]);

  const priorityTabs = [
    { value: 'hot' as const, label: 'Hot', icon: Flame, color: 'text-red-400', bgActive: 'bg-red-500/20 border-red-500/40' },
    { value: 'warm' as const, label: 'Warm', icon: Thermometer, color: 'text-amber-400', bgActive: 'bg-amber-500/20 border-amber-500/40' },
    { value: 'cold' as const, label: 'Cold', icon: Snowflake, color: 'text-blue-400', bgActive: 'bg-blue-500/20 border-blue-500/40' },
  ];

  const templates = getTemplatesByPriority(selectedPriority);

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const personalized = personalizeTemplate(
      selectedTemplate,
      currentLead || {},
      senderName
    );

    onSelectTemplate(personalized);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent elevated className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Priority-Based Templates
          </DialogTitle>
          <DialogDescription>
            Templates auto-selected based on lead classification
          </DialogDescription>
        </DialogHeader>

        {/* Priority Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {priorityTabs.map(tab => (
            <Button
              key={tab.value}
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedPriority(tab.value);
                const newTemplates = getTemplatesByPriority(tab.value);
                setSelectedTemplate(newTemplates[0] || null);
              }}
              className={cn(
                "gap-2 transition-all",
                selectedPriority === tab.value
                  ? cn(tab.bgActive, tab.color)
                  : "border-border text-muted-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <Badge variant="secondary" className="text-[10px] ml-1">
                {getTemplatesByPriority(tab.value).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Current Lead Info */}
        {currentLead && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Lead:</span>
                <span className="text-sm font-medium text-foreground">
                  {currentLead.business_name || currentLead.email || 'Unknown'}
                </span>
              </div>
              {suggestedId && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-suggested
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 max-h-[400px]">
          {/* Template List */}
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedTemplate?.id === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {template.name}
                    </h4>
                    {template.id === suggestedId && (
                      <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Best for: {template.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Preview */}
          <div className="bg-muted/20 rounded-lg border border-border p-4">
            {selectedTemplate ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</label>
                  <p className="text-sm text-foreground font-medium mt-0.5">
                    {personalizeTemplate(selectedTemplate, currentLead || {}, senderName).subject}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Body</label>
                  <ScrollArea className="h-[220px] mt-1">
                    <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">
                      {personalizeTemplate(selectedTemplate, currentLead || {}, senderName).body}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a template to preview
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUseTemplate}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
