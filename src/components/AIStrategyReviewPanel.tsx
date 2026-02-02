import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Target, Lightbulb, CheckCircle2, ArrowRight,
  Sparkles, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Zap, Clock, Award, Users, Edit3, Save, X, Send,
  Mail, FileText, MessageSquare, Calendar, BarChart3, Rocket
} from 'lucide-react';
import {
  AIStrategy,
  generateStrategies,
  buildStrategyContext,
  getRecommendedStrategy,
  StrategyContext
} from '@/lib/aiStrategyEngine';

interface AIStrategyReviewPanelProps {
  searchType: 'gmb' | 'platform' | null;
  leads: any[];
  selectedTemplate?: { id?: string; name?: string };
  onSendToComposer: (strategy: AIStrategy) => void;
}

const urgencyColors = {
  high: 'text-red-400 bg-red-500/20 border-red-500/30',
  medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  low: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
};

const strategyIcons: Record<string, React.ReactNode> = {
  'direct-pitch': <Target className="w-5 h-5" />,
  'problem-agitate': <AlertCircle className="w-5 h-5" />,
  'value-first': <Lightbulb className="w-5 h-5" />,
  'social-proof': <Award className="w-5 h-5" />,
  'educational': <Brain className="w-5 h-5" />,
  'urgency': <Clock className="w-5 h-5" />,
  'personalized-audit': <Zap className="w-5 h-5" />,
};

export default function AIStrategyReviewPanel({
  searchType,
  leads,
  selectedTemplate,
  onSendToComposer,
}: AIStrategyReviewPanelProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null);
  const [editedStrategies, setEditedStrategies] = useState<Record<string, Partial<AIStrategy>>>({});

  // Build context and generate strategies
  const context = useMemo(() =>
    buildStrategyContext(searchType, leads, selectedTemplate),
    [searchType, leads, selectedTemplate]
  );

  const strategies = useMemo(() =>
    generateStrategies(context),
    [context]
  );

  const recommendedStrategy = useMemo(() =>
    getRecommendedStrategy(context),
    [context]
  );

  // Get search context for purpose statement
  const searchQuery = typeof window !== 'undefined' ? sessionStorage.getItem('bamlead_search_query') : null;
  const searchLocation = typeof window !== 'undefined' ? sessionStorage.getItem('bamlead_search_location') : null;

  const campaignPurpose = useMemo(() => {
    if (searchType === 'gmb') {
      return searchQuery && searchLocation
        ? `You are targeting ${searchQuery} businesses in ${searchLocation} to offer your services`
        : 'You are targeting local businesses to offer digital services';
    } else {
      return searchQuery
        ? `You are finding agencies and businesses searching for "${searchQuery}" to offer your expertise`
        : 'You are targeting agencies looking for service providers';
    }
  }, [searchType, searchQuery, searchLocation]);

  const handleExpandStrategy = (strategyId: string) => {
    setExpandedStrategy(expandedStrategy === strategyId ? null : strategyId);
    setEditingStrategy(null);
  };

  const handleEditStrategy = (strategyId: string) => {
    setEditingStrategy(strategyId);
  };

  const handleSaveEdit = (strategyId: string) => {
    setEditingStrategy(null);
    toast.success('Strategy updated successfully!');
  };

  const handleCancelEdit = (strategyId: string) => {
    setEditingStrategy(null);
    setEditedStrategies(prev => {
      const copy = { ...prev };
      delete copy[strategyId];
      return copy;
    });
  };

  const updateStrategyField = (strategyId: string, field: string, value: any) => {
    setEditedStrategies(prev => ({
      ...prev,
      [strategyId]: {
        ...prev[strategyId],
        [field]: value,
      }
    }));
  };

  const getStrategyWithEdits = (strategy: AIStrategy): AIStrategy => {
    const edits = editedStrategies[strategy.id];
    if (!edits) return strategy;
    return { ...strategy, ...edits };
  };

  const handleSendToComposer = (strategy: AIStrategy) => {
    const finalStrategy = getStrategyWithEdits(strategy);
    onSendToComposer(finalStrategy);
    toast.success(`Strategy "${finalStrategy.name}" loaded into Email Composer!`);
  };

  return (
    <div className="space-y-6">
      {/* AI Purpose Statement */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">Our AI has determined your Campaign Purpose</h2>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analyzed
                </Badge>
              </div>
              <p className="text-lg text-foreground font-medium mb-3">
                {campaignPurpose}
              </p>
              <p className="text-sm text-muted-foreground">
                Please review the AI-generated strategies below. Each strategy is tailored to achieve this purpose. 
                Click any strategy to see the full details and edit as needed before sending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Context Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
          <div className="text-2xl font-bold text-foreground">{context.leadCount}</div>
          <div className="text-xs text-muted-foreground">Total Leads</div>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-2xl font-bold text-red-400">{context.hotLeadCount}</div>
          <div className="text-xs text-muted-foreground">Hot Leads</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-2xl font-bold text-amber-400">{context.warmLeadCount}</div>
          <div className="text-xs text-muted-foreground">Warm Leads</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="text-2xl font-bold text-blue-400">{context.coldLeadCount}</div>
          <div className="text-xs text-muted-foreground">Cold Leads</div>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
          <div className="text-2xl font-bold text-purple-400">{context.hasPainPoints}</div>
          <div className="text-xs text-muted-foreground">Pain Points Found</div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI-Generated Strategies</h3>
            <p className="text-sm text-muted-foreground">Click a strategy to review the full details and edit</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Brain className="w-3 h-3" />
          {strategies.length} strategies available
        </Badge>
      </div>

      {/* Strategy Cards Grid */}
      <div className="space-y-4">
        {strategies.map((strategy, index) => {
          const isExpanded = expandedStrategy === strategy.id;
          const isEditing = editingStrategy === strategy.id;
          const isRecommended = recommendedStrategy?.id === strategy.id;
          const finalStrategy = getStrategyWithEdits(strategy);

          return (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "border-2 transition-all cursor-pointer overflow-hidden",
                isExpanded ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/50",
                isRecommended && !isExpanded ? "ring-2 ring-emerald-500/30" : ""
              )}>
                {/* Strategy Header - Always Visible */}
                <div
                  className="p-4 flex items-center gap-4"
                  onClick={() => handleExpandStrategy(strategy.id)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    isRecommended ? "bg-gradient-to-br from-emerald-500/20 to-primary/20" : "bg-muted/50"
                  )}>
                    {strategy.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{finalStrategy.name}</h4>
                      {isRecommended && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Recommended
                        </Badge>
                      )}
                      <Badge className={cn("text-[10px]", urgencyColors[strategy.urgencyLevel])}>
                        {strategy.urgencyLevel.toUpperCase()} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {finalStrategy.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-medium text-emerald-400">{strategy.expectedResponseRate}</div>
                      <div className="text-[10px] text-muted-foreground">Expected Response</div>
                    </div>
                    <Badge variant="outline" className="text-sm font-bold">
                      {strategy.matchScore}%
                    </Badge>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isExpanded ? "bg-primary text-white rotate-180" : "bg-muted/50 text-muted-foreground"
                    )}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 pb-6 border-t border-border">
                        <div className="pt-6 space-y-6">
                          {/* AI Reasoning Section */}
                          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-emerald-500/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4 text-primary" />
                              <h5 className="font-semibold text-foreground">Why AI Selected This Strategy</h5>
                            </div>
                            <ul className="space-y-2">
                              {finalStrategy.aiReasoning.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Strategy Details Grid */}
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Best For */}
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Best For
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {finalStrategy.recommendedFor.map((item, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Key Talking Points */}
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Key Talking Points
                                </h5>
                                {isEditing ? (
                                  <Textarea
                                    value={(finalStrategy.keyTalkingPoints || []).join('\n')}
                                    onChange={(e) => updateStrategyField(strategy.id, 'keyTalkingPoints', e.target.value.split('\n'))}
                                    className="min-h-[100px] text-sm"
                                    placeholder="Enter each talking point on a new line"
                                  />
                                ) : (
                                  <ul className="space-y-1">
                                    {finalStrategy.keyTalkingPoints.map((point, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                                        <span className="text-foreground">{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                              {/* Stats */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-muted-foreground">Response Rate</span>
                                  </div>
                                  <p className="text-lg font-bold text-emerald-400">{strategy.expectedResponseRate}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                  <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">Match Score</span>
                                  </div>
                                  <p className="text-lg font-bold text-primary">{strategy.matchScore}%</p>
                                </div>
                              </div>

                              {/* Email Sequence Info */}
                              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">Email Sequence</span>
                                </div>
                                <p className="text-sm text-foreground">
                                  Follow-ups: Day 1, 3, 7, 14
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  AI will automatically space out your drip emails
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Personalized Opener */}
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4 text-amber-400" />
                                Sample Email Opener
                              </h5>
                              {!isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStrategy(strategy.id);
                                  }}
                                  className="gap-1 text-xs h-7"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </Button>
                              )}
                            </div>
                            {isEditing ? (
                              <Textarea
                                value={finalStrategy.personalizedOpener}
                                onChange={(e) => updateStrategyField(strategy.id, 'personalizedOpener', e.target.value)}
                                className="min-h-[80px] text-sm"
                                placeholder="Enter your personalized opener..."
                              />
                            ) : (
                              <p className="text-sm text-foreground italic bg-background/50 p-3 rounded-lg border border-border">
                                "{finalStrategy.personalizedOpener}"
                              </p>
                            )}
                          </div>

                          {/* Description - Editable */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Full Strategy Description
                              </h5>
                            </div>
                            {isEditing ? (
                              <Textarea
                                value={finalStrategy.description}
                                onChange={(e) => updateStrategyField(strategy.id, 'description', e.target.value)}
                                className="min-h-[80px] text-sm"
                                placeholder="Describe the strategy..."
                              />
                            ) : (
                              <p className="text-sm text-foreground leading-relaxed">
                                {finalStrategy.description}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit(strategy.id);
                                  }}
                                  className="gap-1"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(strategy.id);
                                  }}
                                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Save className="w-4 h-4" />
                                  Save Changes
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStrategy(strategy.id);
                                }}
                                className="gap-1"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit Strategy
                              </Button>
                            )}

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToComposer(strategy);
                              }}
                              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6"
                            >
                              <Send className="w-4 h-4" />
                              Send to Email Composer
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {recommendedStrategy && (
        <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">
                  {recommendedStrategy.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI's Top Recommendation</p>
                  <h4 className="font-bold text-foreground">{recommendedStrategy.name}</h4>
                </div>
              </div>
              <Button
                onClick={() => handleSendToComposer(recommendedStrategy)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8"
              >
                <Rocket className="w-5 h-5" />
                Send to Email Composer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
