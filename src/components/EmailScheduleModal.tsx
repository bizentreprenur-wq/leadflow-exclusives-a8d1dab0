import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes, isAfter } from 'date-fns';
import {
  Clock, CalendarDays, Sparkles, Send, Users, Zap, Brain,
  TrendingUp, Mail, CheckCircle2, AlertCircle, Timer, Flame,
  Thermometer, Snowflake, FileText, Eye
} from 'lucide-react';
import { EMAIL_TEMPLATE_PRESETS, TEMPLATE_CATEGORIES, EmailTemplatePreset } from '@/lib/emailTemplates';

interface Lead {
  id: string;
  name: string;
  email?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  bestTimeToCall?: string;
  conversionProbability?: number;
}

interface EmailScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onSchedule: (leads: Lead[], scheduledTime: Date, mode: 'ai' | 'manual') => void;
}

interface AITimeSlot {
  time: string;
  hour: number;
  score: number;
  reason: string;
  leadsOptimal: number;
}

export default function EmailScheduleModal({
  open,
  onOpenChange,
  leads,
  onSchedule,
}: EmailScheduleModalProps) {
  const [scheduleMode, setScheduleMode] = useState<'ai' | 'manual'>('ai');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [selectedAISlot, setSelectedAISlot] = useState<number>(0);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplatePreset | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('sales');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplatePreset | null>(null);

  // Filter templates by category
  const filteredTemplates = useMemo(() => 
    EMAIL_TEMPLATE_PRESETS.filter(t => t.category === activeCategory),
    [activeCategory]
  );

  // Filter leads with valid emails
  const validLeads = useMemo(() => 
    leads.filter(lead => lead.email && lead.email.includes('@')),
    [leads]
  );

  // Group leads by classification
  const leadsByType = useMemo(() => ({
    hot: validLeads.filter(l => l.aiClassification === 'hot'),
    warm: validLeads.filter(l => l.aiClassification === 'warm'),
    cold: validLeads.filter(l => l.aiClassification === 'cold'),
  }), [validLeads]);

  // AI-optimized time slots based on lead analysis
  const aiTimeSlots: AITimeSlot[] = useMemo(() => {
    // Analyze best times from leads
    const timePreferences: Record<string, number> = {};
    validLeads.forEach(lead => {
      if (lead.bestTimeToCall) {
        const hour = parseInt(lead.bestTimeToCall.split(':')[0]) || 9;
        timePreferences[hour] = (timePreferences[hour] || 0) + 1;
      }
    });

    const slots: AITimeSlot[] = [
      {
        time: '9:00 AM',
        hour: 9,
        score: 92,
        reason: 'Peak open rates for B2B. Decision-makers checking emails after morning meetings.',
        leadsOptimal: Math.floor(validLeads.length * 0.35),
      },
      {
        time: '11:00 AM',
        hour: 11,
        score: 88,
        reason: 'Pre-lunch window. High engagement before midday break.',
        leadsOptimal: Math.floor(validLeads.length * 0.25),
      },
      {
        time: '2:00 PM',
        hour: 14,
        score: 85,
        reason: 'Afternoon productivity peak. Good for follow-up messages.',
        leadsOptimal: Math.floor(validLeads.length * 0.20),
      },
      {
        time: '4:00 PM',
        hour: 16,
        score: 78,
        reason: 'End-of-day review window. Suitable for warm/cold leads.',
        leadsOptimal: Math.floor(validLeads.length * 0.15),
      },
    ];

    // Boost scores based on actual lead preferences
    return slots.map(slot => {
      const matchingLeads = validLeads.filter(l => {
        const leadHour = parseInt(l.bestTimeToCall?.split(':')[0] || '0');
        return Math.abs(leadHour - slot.hour) <= 1;
      }).length;
      return {
        ...slot,
        leadsOptimal: matchingLeads || slot.leadsOptimal,
        score: Math.min(99, slot.score + (matchingLeads > 0 ? 5 : 0)),
      };
    }).sort((a, b) => b.score - a.score);
  }, [validLeads]);

  const handleSchedule = async () => {
    if (validLeads.length === 0) {
      toast.error('No leads with valid emails to schedule');
      return;
    }

    setIsScheduling(true);
    
    try {
      let scheduledTime: Date;
      
      if (scheduleMode === 'ai') {
        const slot = aiTimeSlots[selectedAISlot];
        const baseDate = selectedDate || new Date();
        scheduledTime = setMinutes(setHours(baseDate, slot.hour), 0);
        
        // If time has passed today, schedule for tomorrow
        if (!isAfter(scheduledTime, new Date())) {
          scheduledTime = addDays(scheduledTime, 1);
        }
      } else {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const baseDate = selectedDate || new Date();
        scheduledTime = setMinutes(setHours(baseDate, hours), minutes);
        
        if (!isAfter(scheduledTime, new Date())) {
          toast.error('Please select a future date and time');
          setIsScheduling(false);
          return;
        }
      }

      onSchedule(validLeads, scheduledTime, scheduleMode);
      toast.success(
        `Scheduled ${validLeads.length} emails for ${format(scheduledTime, 'MMM d, yyyy h:mm a')}`,
        { duration: 5000 }
      );
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to schedule emails');
    } finally {
      setIsScheduling(false);
    }
  };

  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let h = 6; h <= 20; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-5 h-5 text-primary" />
            Schedule Email Outreach
          </DialogTitle>
          <DialogDescription>
            Choose when to send emails to your selected leads
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Lead Summary */}
            <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{validLeads.length} Leads Ready</span>
                  </div>
                  {leads.length !== validLeads.length && (
                    <Badge variant="outline" className="text-amber-600 bg-amber-500/10">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {leads.length - validLeads.length} without email
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-600">{leadsByType.hot.length}</span>
                    <span className="text-muted-foreground">Hot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-orange-600">{leadsByType.warm.length}</span>
                    <span className="text-muted-foreground">Warm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-600">{leadsByType.cold.length}</span>
                    <span className="text-muted-foreground">Cold</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Mode Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Scheduling Mode</Label>
              <RadioGroup
                value={scheduleMode}
                onValueChange={(v) => setScheduleMode(v as 'ai' | 'manual')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="ai" id="ai-mode" className="peer sr-only" />
                  <Label
                    htmlFor="ai-mode"
                    className="flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all
                      peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                      hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="font-semibold">AI Optimized</span>
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI analyzes your leads and picks the best send time for maximum engagement
                    </p>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="manual" id="manual-mode" className="peer sr-only" />
                  <Label
                    htmlFor="manual-mode"
                    className="flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all
                      peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                      hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      <span className="font-semibold">Manual Schedule</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose your own specific date and time for sending
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* AI Time Slots */}
            {scheduleMode === 'ai' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">AI-Recommended Send Times</Label>
                </div>
                
                <div className="space-y-3">
                  {aiTimeSlots.map((slot, index) => (
                    <div
                      key={slot.time}
                      onClick={() => setSelectedAISlot(index)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAISlot === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            slot.score >= 90 ? 'bg-emerald-500/20 text-emerald-600' :
                            slot.score >= 80 ? 'bg-blue-500/20 text-blue-600' :
                            'bg-gray-500/20 text-gray-600'
                          }`}>
                            {slot.score}%
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              <Timer className="w-4 h-4" />
                              {slot.time}
                              {index === 0 && (
                                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                                  Best
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{slot.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{slot.leadsOptimal} leads</div>
                          <div className="text-xs text-muted-foreground">optimal match</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Date picker for AI mode */}
                <div className="flex items-center gap-4 pt-2">
                  <Label className="text-sm text-muted-foreground">Send on:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Manual Schedule */}
            {scheduleMode === 'manual' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Date & Time</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {format(setMinutes(setHours(new Date(), parseInt(time.split(':')[0])), parseInt(time.split(':')[1])), 'h:mm a')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* AI Hint */}
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">AI Suggestion</p>
                        <p className="text-sm text-amber-700">
                          Based on your leads' data, {aiTimeSlots[0]?.time} would be optimal with a {aiTimeSlots[0]?.score}% engagement score.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Email Template Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Select Email Template</Label>
                {selectedTemplate && (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>

              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full justify-start bg-muted/50 overflow-x-auto">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id} className="text-xs px-3">
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeCategory} className="mt-3">
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{template.name}</span>
                              {template.industry && (
                                <Badge variant="outline" className="text-xs">
                                  {template.industry}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            <div className="flex gap-1 mt-2">
                              {template.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Selected Template Preview */}
              {selectedTemplate && (
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-sm text-emerald-700">Selected: {selectedTemplate.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Subject: {selectedTemplate.subject}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Template Preview Modal */}
            {previewTemplate && (
              <Card className="border-2 border-primary/20 bg-card">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Preview: {previewTemplate.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(null)}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject:</Label>
                      <p className="text-sm font-medium">{previewTemplate.subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Body:</Label>
                      <div 
                        className="text-sm prose prose-sm max-w-none mt-1"
                        dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Drip Rate Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Smart Drip Sending</p>
                    <p className="text-sm text-muted-foreground">
                      Emails will be sent at 50/hour to maximize deliverability and avoid spam filters.
                      {validLeads.length > 50 && (
                        <span className="block mt-1">
                          Estimated completion: ~{Math.ceil(validLeads.length / 50)} hour{validLeads.length > 50 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{validLeads.length} emails will be queued</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isScheduling || validLeads.length === 0 || !selectedTemplate}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isScheduling ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Schedule {validLeads.length} Emails
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}