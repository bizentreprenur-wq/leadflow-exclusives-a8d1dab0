import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Brain, Target, Lightbulb, CheckCircle2, ArrowRight, 
  Sparkles, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Zap, Clock, Award, Users, Edit3
} from 'lucide-react';
import { 
  AIStrategy, 
  generateStrategies, 
  buildStrategyContext,
  getRecommendedStrategy,
  StrategyContext 
} from '@/lib/aiStrategyEngine';

interface AIStrategySelectorProps {
  mode: 'basic' | 'copilot' | 'autopilot';
  searchType: 'gmb' | 'platform' | null;
  leads: any[];
  selectedTemplate?: { id?: string; name?: string };
  onSelectStrategy: (strategy: AIStrategy) => void;
  onApproveStrategy?: (strategy: AIStrategy) => void;
  selectedStrategy?: AIStrategy | null;
  compact?: boolean;
}

const approachIcons: Record<string, React.ReactNode> = {
  'direct-pitch': <Target className="w-4 h-4" />,
  'problem-agitate': <AlertCircle className="w-4 h-4" />,
  'value-first': <Lightbulb className="w-4 h-4" />,
  'social-proof': <Award className="w-4 h-4" />,
  'educational': <Brain className="w-4 h-4" />,
  'urgency': <Clock className="w-4 h-4" />,
  'personalized-audit': <Zap className="w-4 h-4" />,
};

const urgencyColors = {
  high: 'text-red-400 bg-red-500/20 border-red-500/30',
  medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  low: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
};

export default function AIStrategySelector({
  mode,
  searchType,
  leads,
  selectedTemplate,
  onSelectStrategy,
  onApproveStrategy,
  selectedStrategy,
  compact = false,
}: AIStrategySelectorProps) {
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

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

  const displayStrategies = showAllStrategies ? strategies : strategies.slice(0, 3);

  // For Autopilot mode, just show what AI selected
  if (mode === 'autopilot') {
    const autoStrategy = selectedStrategy || recommendedStrategy;
    if (!autoStrategy) return null;

    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">
            {autoStrategy.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{autoStrategy.name}</h4>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                <Brain className="w-3 h-3 mr-1" />
                AI Auto-Selected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{autoStrategy.description}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-muted-foreground">Expected response rate:</span>
            <span className="font-medium text-emerald-400">{autoStrategy.expectedResponseRate}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {autoStrategy.keyTalkingPoints.slice(0, 3).map((point, idx) => (
              <Badge key={idx} variant="outline" className="text-[9px]">
                {point}
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <Brain className="w-3 h-3" /> AI Reasoning
          </p>
          <ul className="text-[10px] text-muted-foreground space-y-0.5">
            {autoStrategy.aiReasoning.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // For Co-Pilot mode, show recommendation with approval
  if (mode === 'copilot' && recommendedStrategy && !selectedStrategy) {
    return (
      <div className="space-y-4">
        {/* AI Recommendation Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                AI Strategy Recommendation
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                  {recommendedStrategy.matchScore}% match
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground">
                Based on your search context and lead analysis
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background border border-border mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{recommendedStrategy.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{recommendedStrategy.name}</p>
                <p className="text-xs text-muted-foreground">{recommendedStrategy.description}</p>
              </div>
              <Badge className={cn("text-[10px]", urgencyColors[recommendedStrategy.urgencyLevel])}>
                {recommendedStrategy.urgencyLevel.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="p-3 rounded-lg bg-muted/30 mb-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Why this strategy?</p>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              {recommendedStrategy.aiReasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllStrategies(true)}
              className="flex-1 gap-1 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Choose Different
            </Button>
            <Button
              size="sm"
              onClick={() => onApproveStrategy?.(recommendedStrategy)}
              className="flex-1 bg-primary hover:bg-primary/90 gap-1 text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Strategy
            </Button>
          </div>
        </div>

        {/* Show all strategies if expanded */}
        {showAllStrategies && (
          <StrategyGrid
            strategies={strategies}
            selectedStrategy={selectedStrategy}
            expandedStrategy={expandedStrategy}
            onSelectStrategy={onSelectStrategy}
            onExpandStrategy={setExpandedStrategy}
            recommendedId={recommendedStrategy?.id}
            compact={compact}
          />
        )}
      </div>
    );
  }

  // For Basic mode or after approval in Co-Pilot, show full selection grid
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h4 className="font-semibold text-foreground">
            {mode === 'basic' ? 'Choose Your Strategy' : 'Strategy Selection'}
          </h4>
        </div>
        {mode === 'basic' && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Users className="w-3 h-3" />
            {context.leadCount} leads
          </Badge>
        )}
      </div>

      {/* Context Summary */}
      {!compact && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-sm font-bold text-red-400">{context.hotLeadCount}</div>
            <div className="text-[9px] text-muted-foreground">Hot</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-sm font-bold text-amber-400">{context.warmLeadCount}</div>
            <div className="text-[9px] text-muted-foreground">Warm</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-sm font-bold text-blue-400">{context.coldLeadCount}</div>
            <div className="text-[9px] text-muted-foreground">Cold</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-sm font-bold text-purple-400">{context.hasPainPoints}</div>
            <div className="text-[9px] text-muted-foreground">Pain Points</div>
          </div>
        </div>
      )}

      <StrategyGrid
        strategies={displayStrategies}
        selectedStrategy={selectedStrategy}
        expandedStrategy={expandedStrategy}
        onSelectStrategy={onSelectStrategy}
        onExpandStrategy={setExpandedStrategy}
        recommendedId={recommendedStrategy?.id}
        compact={compact}
      />

      {!showAllStrategies && strategies.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllStrategies(true)}
          className="w-full text-xs gap-1"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {strategies.length - 3} more strategies
        </Button>
      )}

      {showAllStrategies && strategies.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllStrategies(false)}
          className="w-full text-xs gap-1"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          Show less
        </Button>
      )}
    </div>
  );
}

// Strategy Grid Component
function StrategyGrid({
  strategies,
  selectedStrategy,
  expandedStrategy,
  onSelectStrategy,
  onExpandStrategy,
  recommendedId,
  compact,
}: {
  strategies: AIStrategy[];
  selectedStrategy?: AIStrategy | null;
  expandedStrategy: string | null;
  onSelectStrategy: (strategy: AIStrategy) => void;
  onExpandStrategy: (id: string | null) => void;
  recommendedId?: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {strategies.map((strategy) => (
        <div
          key={strategy.id}
          className={cn(
            "rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
            selectedStrategy?.id === strategy.id
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 bg-muted/30"
          )}
        >
          <div 
            className="p-3 flex items-center gap-3"
            onClick={() => onSelectStrategy(strategy)}
          >
            <div className="text-xl">{strategy.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{strategy.name}</p>
                {strategy.id === recommendedId && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{strategy.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[9px]", urgencyColors[strategy.urgencyLevel])}>
                {strategy.urgencyLevel}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                {strategy.matchScore}%
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandStrategy(expandedStrategy === strategy.id ? null : strategy.id);
                }}
              >
                {expandedStrategy === strategy.id ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedStrategy === strategy.id && (
            <div className="px-3 pb-3 border-t border-border mt-1 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Expected Response</p>
                  <p className="text-sm font-medium text-emerald-400">{strategy.expectedResponseRate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Best For</p>
                  <div className="flex flex-wrap gap-1">
                    {strategy.recommendedFor.slice(0, 2).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-[8px]">{item}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Key Talking Points</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.keyTalkingPoints.map((point, idx) => (
                    <Badge key={idx} className="text-[8px] bg-primary/10 text-primary border-primary/20">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">AI Reasoning</p>
                <ul className="text-[10px] text-muted-foreground space-y-0.5">
                  {strategy.aiReasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2 rounded-lg bg-background border border-border">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Sample Opener</p>
                <p className="text-[10px] text-foreground italic">{strategy.personalizedOpener}</p>
              </div>

              <Button
                size="sm"
                onClick={() => onSelectStrategy(strategy)}
                className="w-full bg-primary hover:bg-primary/90 gap-1 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Use This Strategy
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
