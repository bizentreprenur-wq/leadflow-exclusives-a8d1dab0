/**
 * AI Script Preview Panel
 * Displays AI-generated call scripts based on search context and strategy
 * 
 * INTEGRATION:
 * - Uses aiCallingScriptGenerator for intelligent script generation
 * - Pulls context from search type, AI strategy, email sequences
 * - All sections are editable by customers with paid plans
 * 
 * RULES:
 * - Free: Read-only preview
 * - Basic + Add-on: Full script generation, editable
 * - Pro + Add-on: Full editing + context integration
 * - Autopilot: Advanced generation with auto-context
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  FileText, 
  Sparkles, 
  RefreshCw,
  Lock,
  Edit3,
  Save,
  Copy,
  MessageSquare,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  Lightbulb,
  Brain,
  Mail,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAICalling, AI_CALLING_ADDON_PRICE } from '@/hooks/useAICalling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { 
  generateCallScript, 
  buildCallScriptContext, 
  saveEditedScript, 
  getSavedScript,
  GeneratedCallScript,
  CallScriptContext,
  ScriptTone
} from '@/lib/aiCallingScriptGenerator';

interface AIScriptPreviewPanelProps {
  searchQuery?: string;
  searchLocation?: string;
  selectedStrategy?: string;
  businessType?: string;
  leadName?: string;
  businessName?: string;
  onScriptChange?: (script: GeneratedCallScript) => void;
}

const SCRIPT_TONES: { value: ScriptTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'direct', label: 'Direct', description: 'Clear and to-the-point' },
  { value: 'conversational', label: 'Conversational', description: 'Natural and relaxed' },
];

export default function AIScriptPreviewPanel({
  searchQuery = '',
  searchLocation = '',
  selectedStrategy = '',
  businessType = '',
  leadName = '',
  businessName = '',
  onScriptChange
}: AIScriptPreviewPanelProps) {
  const { capabilities, addon, needsAddon } = useAICalling();
  const { tier, isAutopilot } = usePlanFeatures();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ScriptTone>('professional');
  const [showContext, setShowContext] = useState(false);
  const [script, setScript] = useState<GeneratedCallScript | null>(null);
  const [context, setContext] = useState<CallScriptContext | null>(null);

  // Determine if user can edit
  const canEdit = capabilities.canEditScripts && (addon.status === 'active' || capabilities.addonIncluded);
  const canGenerate = capabilities.canGenerateScripts && (addon.status === 'active' || capabilities.addonIncluded);
  const isPreviewOnly = !canEdit;

  // Build context from session data
  useEffect(() => {
    const ctx = buildCallScriptContext();
    // Merge with props
    ctx.searchQuery = searchQuery || ctx.searchQuery;
    ctx.searchLocation = searchLocation || ctx.searchLocation;
    ctx.leadName = leadName || ctx.leadName;
    ctx.businessName = businessName || ctx.businessName;
    ctx.businessType = businessType || ctx.businessType;
    setContext(ctx);
    
    // Load saved script if exists
    const saved = getSavedScript();
    if (saved) {
      setScript(saved);
    }
  }, [searchQuery, searchLocation, leadName, businessName, businessType]);

  // Generate script based on context
  const handleGenerateScript = async () => {
    if (!canGenerate && tier !== 'free') {
      toast.error('AI Calling add-on required for script generation');
      return;
    }

    setIsGenerating(true);
    
    // Build full context
    const fullContext: CallScriptContext = {
      ...context,
      searchQuery: searchQuery || context?.searchQuery,
      searchLocation: searchLocation || context?.searchLocation,
      leadName: leadName || context?.leadName,
      businessName: businessName || context?.businessName,
      businessType: businessType || context?.businessType,
      searchType: context?.searchType || null,
    };

    // Simulate AI generation delay
    setTimeout(() => {
      const generatedScript = generateCallScript(fullContext, selectedTone);
      setScript(generatedScript);
      onScriptChange?.(generatedScript);
      setIsGenerating(false);
      toast.success('Script generated from your search context!');
    }, 1500);
  };

  const handleSave = () => {
    if (script) {
      saveEditedScript(script);
      onScriptChange?.(script);
      setIsEditing(false);
      toast.success('Script saved!');
    }
  };

  const handleCopy = () => {
    if (!script) return;
    
    const fullScript = `
GREETING:
${script.greeting}

INTRODUCTION:
${script.introduction}

VALUE PROPOSITION:
${script.valueProposition}

QUALIFYING QUESTIONS:
${script.qualifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

OBJECTION HANDLERS:
${script.objectionHandlers.map(o => `• "${o.objection}"\n  → ${o.response}`).join('\n\n')}

CLOSING:
${script.closingStatement}

FALLBACK:
${script.fallbackMessage}
    `.trim();
    
    navigator.clipboard.writeText(fullScript);
    toast.success('Script copied to clipboard!');
  };

  // Add new question
  const addQuestion = () => {
    if (script) {
      setScript({
        ...script,
        qualifyingQuestions: [...script.qualifyingQuestions, 'New question...']
      });
    }
  };

  // Remove question
  const removeQuestion = (index: number) => {
    if (script) {
      setScript({
        ...script,
        qualifyingQuestions: script.qualifyingQuestions.filter((_, i) => i !== index)
      });
    }
  };

  // Update question
  const updateQuestion = (index: number, value: string) => {
    if (script) {
      const updated = [...script.qualifyingQuestions];
      updated[index] = value;
      setScript({ ...script, qualifyingQuestions: updated });
    }
  };

  // Add new objection handler
  const addObjectionHandler = () => {
    if (script) {
      setScript({
        ...script,
        objectionHandlers: [...script.objectionHandlers, { objection: 'New objection', response: 'Your response...' }]
      });
    }
  };

  // Remove objection handler
  const removeObjectionHandler = (index: number) => {
    if (script) {
      setScript({
        ...script,
        objectionHandlers: script.objectionHandlers.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Call Script
                {isPreviewOnly && (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <Lock className="w-3 h-3" />
                    Preview Only
                  </Badge>
                )}
                {capabilities.scriptGeneration === 'advanced' && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
                    <Sparkles className="w-3 h-3" />
                    Advanced
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPreviewOnly 
                  ? `Add AI Calling ($${AI_CALLING_ADDON_PRICE}/mo) to edit and customize scripts`
                  : 'AI-generated script based on your search, strategy, and email sequences'
                }
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {script ? 'Regenerate' : 'Generate'}
            </Button>
            {script && (
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tone Selector */}
        <div className="flex gap-2 flex-wrap">
          {SCRIPT_TONES.map((tone) => (
            <button
              key={tone.value}
              onClick={() => {
                setSelectedTone(tone.value);
                if (script) handleGenerateScript();
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedTone === tone.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>

        {/* Context Summary */}
        {context && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowContext(!showContext)}
              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                <span className="font-medium">Script Generation Context</span>
                {context.breadcrumbs && context.breadcrumbs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {context.breadcrumbs.length} sources
                  </Badge>
                )}
              </div>
              {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showContext && (
              <div className="p-3 space-y-3 text-sm">
                {context.searchType && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Search Type:</span>
                    <span className="text-foreground font-medium">
                      {context.searchType === 'gmb' ? 'Super AI Business Search' : 'Agency Lead Finder'}
                    </span>
                  </div>
                )}
                {context.searchQuery && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Query:</span>
                    <span className="text-foreground">{context.searchQuery}</span>
                  </div>
                )}
                {context.selectedStrategy && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="text-foreground">{context.selectedStrategy.name}</span>
                  </div>
                )}
                {context.emailSequenceName && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email Sequence:</span>
                    <span className="text-foreground">{context.emailSequenceName}</span>
                  </div>
                )}
                {context.painPoints && context.painPoints.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                    <span className="text-muted-foreground">Pain Points:</span>
                    <span className="text-foreground">{context.painPoints.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Script Content */}
        {script ? (
          <Tabs defaultValue="script" className="space-y-4">
            <TabsList>
              <TabsTrigger value="script">Full Script</TabsTrigger>
              <TabsTrigger value="objections">Objection Handlers</TabsTrigger>
              <TabsTrigger value="tips">AI Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              <ScrollArea className="max-h-[400px] pr-4">
                {/* Greeting */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Greeting</Label>
                  {canEdit && isEditing ? (
                    <Textarea
                      value={script.greeting}
                      onChange={(e) => setScript({ ...script, greeting: e.target.value })}
                      className="min-h-[60px]"
                    />
                  ) : (
                    <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.greeting}</p>
                  )}
                </div>

                {/* Introduction */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Introduction</Label>
                  {canEdit && isEditing ? (
                    <Textarea
                      value={script.introduction}
                      onChange={(e) => setScript({ ...script, introduction: e.target.value })}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.introduction}</p>
                  )}
                </div>

                {/* Value Proposition */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Value Proposition</Label>
                  {canEdit && isEditing ? (
                    <Textarea
                      value={script.valueProposition}
                      onChange={(e) => setScript({ ...script, valueProposition: e.target.value })}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-foreground text-sm">
                      {script.valueProposition}
                    </p>
                  )}
                </div>

                {/* Qualifying Questions */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qualifying Questions</Label>
                    {canEdit && isEditing && (
                      <Button variant="ghost" size="sm" onClick={addQuestion} className="gap-1 h-7 text-xs">
                        <Plus className="w-3 h-3" />
                        Add Question
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {script.qualifyingQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary font-medium mt-2.5">{i + 1}.</span>
                        {canEdit && isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={q}
                              onChange={(e) => updateQuestion(i, e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeQuestion(i)}
                              className="h-9 w-9 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="flex-1 p-2 rounded bg-muted/30 text-sm text-foreground">{q}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Closing */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Closing Statement</Label>
                  {canEdit && isEditing ? (
                    <Textarea
                      value={script.closingStatement}
                      onChange={(e) => setScript({ ...script, closingStatement: e.target.value })}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.closingStatement}</p>
                  )}
                </div>

                {/* Fallback */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fallback Message</Label>
                  {canEdit && isEditing ? (
                    <Textarea
                      value={script.fallbackMessage}
                      onChange={(e) => setScript({ ...script, fallbackMessage: e.target.value })}
                      className="min-h-[60px]"
                    />
                  ) : (
                    <p className="p-3 rounded-lg bg-muted/50 text-foreground text-sm">{script.fallbackMessage}</p>
                  )}
                </div>
              </ScrollArea>

              {/* Edit/Save Buttons */}
              {canEdit && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit Script
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="objections" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Handle common objections with AI-suggested responses
                </p>
                {canEdit && isEditing && (
                  <Button variant="outline" size="sm" onClick={addObjectionHandler} className="gap-1">
                    <Plus className="w-3 h-3" />
                    Add Handler
                  </Button>
                )}
              </div>
              
              {script.objectionHandlers.map((handler, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  {canEdit && isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={handler.objection}
                          onChange={(e) => {
                            const updated = [...script.objectionHandlers];
                            updated[i] = { ...handler, objection: e.target.value };
                            setScript({ ...script, objectionHandlers: updated });
                          }}
                          placeholder="Objection..."
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeObjectionHandler(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={handler.response}
                        onChange={(e) => {
                          const updated = [...script.objectionHandlers];
                          updated[i] = { ...handler, response: e.target.value };
                          setScript({ ...script, objectionHandlers: updated });
                        }}
                        placeholder="Your response..."
                        className="min-h-[80px]"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 mb-3">
                        <MessageSquare className="w-4 h-4 text-destructive mt-1" />
                        <span className="font-medium text-foreground">"{handler.objection}"</span>
                      </div>
                      <div className="flex items-start gap-3 ml-7">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                        <span className="text-sm text-muted-foreground">{handler.response}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {canEdit && !isEditing && (
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit Handlers
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">AI Recommendations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Best time to call: <span className="text-foreground">Tuesday-Thursday, 10-11am</span></li>
                      <li>• Optimal call duration: <span className="text-foreground">3-5 minutes</span></li>
                      <li>• Key talking point: <span className="text-foreground">Lead with value, not features</span></li>
                      <li>• Watch for: <span className="text-foreground">Mentions of current solutions or pain points</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Script Metadata */}
              {script && (
                <div className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium text-foreground mb-3">Script Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Generated For:</span>
                      <p className="text-foreground">{script.generatedFor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Search Type:</span>
                      <p className="text-foreground">{script.searchTypeContext}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Strategy:</span>
                      <p className="text-foreground">{script.strategyUsed}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tone:</span>
                      <p className="text-foreground capitalize">{script.toneStyle}</p>
                    </div>
                    {script.emailSequenceReference && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Email Sequence:</span>
                        <p className="text-foreground">{script.emailSequenceReference}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No script generated yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              AI will use your search context, strategy, and email sequences to generate a personalized script
            </p>
            <Button onClick={handleGenerateScript} disabled={isGenerating || (!canGenerate && tier !== 'free')} className="gap-2">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {tier === 'free' ? 'Preview Script' : 'Generate Script'}
            </Button>
            {!canGenerate && tier !== 'free' && needsAddon && (
              <p className="text-xs text-amber-500 mt-2">
                Add AI Calling (${AI_CALLING_ADDON_PRICE}/mo) to generate full scripts
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
