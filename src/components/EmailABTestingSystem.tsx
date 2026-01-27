import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Beaker, BarChart3, TrendingUp, TrendingDown, Trophy, Play, Pause,
  Plus, Copy, CheckCircle2, ArrowRight, Sparkles, Target, Percent,
  Mail, Eye, MousePointer, Reply, Clock, Zap
} from 'lucide-react';

interface TemplateVariant {
  id: string;
  name: string;
  subjectLine: string;
  bodyPreview: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
  };
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'draft';
  splitRatio: number; // A gets this %, B gets 100 - this %
  variantA: TemplateVariant;
  variantB: TemplateVariant;
  winner?: 'A' | 'B' | null;
  createdAt: string;
  targetSampleSize: number;
  confidenceLevel: number;
}

const DEMO_TESTS: ABTest[] = [
  {
    id: '1',
    name: 'Subject Line Test - Urgency vs Value',
    status: 'running',
    splitRatio: 50,
    variantA: {
      id: 'a1',
      name: 'Variant A (Urgency)',
      subjectLine: '🔥 Limited Time: Free Website Audit for {{business_name}}',
      bodyPreview: 'Hi {{first_name}}, I noticed your business...',
      stats: { sent: 156, opened: 67, clicked: 23, replied: 8 }
    },
    variantB: {
      id: 'b1',
      name: 'Variant B (Value)',
      subjectLine: '{{business_name}} - 3 Quick Wins to Boost Your Online Presence',
      bodyPreview: 'Hi {{first_name}}, After reviewing your website...',
      stats: { sent: 152, opened: 58, clicked: 19, replied: 5 }
    },
    createdAt: '2024-01-20',
    targetSampleSize: 500,
    confidenceLevel: 95
  },
  {
    id: '2',
    name: 'CTA Button Test',
    status: 'completed',
    splitRatio: 50,
    variantA: {
      id: 'a2',
      name: 'Variant A (Schedule Call)',
      subjectLine: 'Quick Question About {{business_name}}',
      bodyPreview: 'Book a 15-minute call to discuss...',
      stats: { sent: 500, opened: 245, clicked: 78, replied: 32 }
    },
    variantB: {
      id: 'b2',
      name: 'Variant B (Reply for Info)',
      subjectLine: 'Quick Question About {{business_name}}',
      bodyPreview: 'Just reply "interested" to get...',
      stats: { sent: 500, opened: 231, clicked: 112, replied: 67 }
    },
    winner: 'B',
    createdAt: '2024-01-15',
    targetSampleSize: 1000,
    confidenceLevel: 95
  }
];

interface EmailABTestingSystemProps {
  onApplyWinner?: (variant: TemplateVariant) => void;
  leads?: any[];
}

export default function EmailABTestingSystem({ onApplyWinner, leads = [] }: EmailABTestingSystemProps) {
  const [tests, setTests] = useState<ABTest[]>(DEMO_TESTS);
  const [activeTab, setActiveTab] = useState<'tests' | 'create'>('tests');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New test form state
  const [newTest, setNewTest] = useState({
    name: '',
    splitRatio: 50,
    variantA: { subjectLine: '', body: '' },
    variantB: { subjectLine: '', body: '' },
    targetSampleSize: 500,
    autoSelectWinner: true
  });

  const calculateMetrics = (variant: TemplateVariant) => {
    const openRate = variant.stats.sent > 0 ? (variant.stats.opened / variant.stats.sent) * 100 : 0;
    const clickRate = variant.stats.opened > 0 ? (variant.stats.clicked / variant.stats.opened) * 100 : 0;
    const replyRate = variant.stats.sent > 0 ? (variant.stats.replied / variant.stats.sent) * 100 : 0;
    return { openRate, clickRate, replyRate };
  };

  const getWinnerStats = (test: ABTest) => {
    const metricsA = calculateMetrics(test.variantA);
    const metricsB = calculateMetrics(test.variantB);
    
    // Calculate weighted score (reply rate matters most)
    const scoreA = metricsA.openRate * 0.2 + metricsA.clickRate * 0.3 + metricsA.replyRate * 0.5;
    const scoreB = metricsB.openRate * 0.2 + metricsB.clickRate * 0.3 + metricsB.replyRate * 0.5;
    
    const improvement = scoreA > scoreB 
      ? ((scoreA - scoreB) / scoreB) * 100 
      : ((scoreB - scoreA) / scoreA) * 100;
    
    return {
      winner: scoreA > scoreB ? 'A' : 'B',
      winnerScore: Math.max(scoreA, scoreB),
      loserScore: Math.min(scoreA, scoreB),
      improvement: improvement.toFixed(1),
      isSignificant: Math.abs(scoreA - scoreB) > 5
    };
  };

  const toggleTest = (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId 
        ? { ...t, status: t.status === 'running' ? 'paused' : 'running' }
        : t
    ));
    toast.success('Test status updated');
  };

  const applyWinner = (test: ABTest) => {
    const winnerVariant = test.winner === 'A' ? test.variantA : test.variantB;
    onApplyWinner?.(winnerVariant);
    toast.success(`Applied ${test.winner === 'A' ? 'Variant A' : 'Variant B'} as main template`);
  };

  const createNewTest = () => {
    if (!newTest.name || !newTest.variantA.subjectLine || !newTest.variantB.subjectLine) {
      toast.error('Please fill in all required fields');
      return;
    }

    const test: ABTest = {
      id: Date.now().toString(),
      name: newTest.name,
      status: 'draft',
      splitRatio: newTest.splitRatio,
      variantA: {
        id: `a-${Date.now()}`,
        name: 'Variant A',
        subjectLine: newTest.variantA.subjectLine,
        bodyPreview: newTest.variantA.body.slice(0, 100),
        stats: { sent: 0, opened: 0, clicked: 0, replied: 0 }
      },
      variantB: {
        id: `b-${Date.now()}`,
        name: 'Variant B',
        subjectLine: newTest.variantB.subjectLine,
        bodyPreview: newTest.variantB.body.slice(0, 100),
        stats: { sent: 0, opened: 0, clicked: 0, replied: 0 }
      },
      createdAt: new Date().toISOString().split('T')[0],
      targetSampleSize: newTest.targetSampleSize,
      confidenceLevel: 95
    };

    setTests(prev => [test, ...prev]);
    setShowCreateForm(false);
    setNewTest({
      name: '',
      splitRatio: 50,
      variantA: { subjectLine: '', body: '' },
      variantB: { subjectLine: '', body: '' },
      targetSampleSize: 500,
      autoSelectWinner: true
    });
    toast.success('A/B Test created! Start it when ready.');
  };

  const VariantCard = ({ variant, label, isWinner }: { variant: TemplateVariant; label: 'A' | 'B'; isWinner?: boolean }) => {
    const metrics = calculateMetrics(variant);
    
    return (
      <div className={cn(
        "p-4 rounded-xl border transition-all",
        isWinner 
          ? "bg-emerald-500/10 border-emerald-500/50" 
          : "bg-card border-border"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              label === 'A' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
            )}>
              {label}
            </div>
            <span className="font-medium text-foreground">{variant.name}</span>
          </div>
          {isWinner && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
              <Trophy className="w-3 h-3" />
              Winner
            </Badge>
          )}
        </div>

        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
          <p className="text-sm font-medium text-foreground">{variant.subjectLine}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Mail className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{variant.stats.sent}</p>
            <p className="text-[10px] text-muted-foreground">Sent</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Eye className="w-3.5 h-3.5 mx-auto text-blue-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{metrics.openRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Opens</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <MousePointer className="w-3.5 h-3.5 mx-auto text-amber-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{metrics.clickRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Clicks</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Reply className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{metrics.replyRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Replies</p>
          </div>
        </div>
      </div>
    );
  };

  const TestCard = ({ test }: { test: ABTest }) => {
    const winnerStats = getWinnerStats(test);
    const progress = ((test.variantA.stats.sent + test.variantB.stats.sent) / (test.targetSampleSize * 2)) * 100;

    return (
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                test.status === 'running' ? "bg-emerald-500/20" :
                test.status === 'completed' ? "bg-blue-500/20" :
                test.status === 'paused' ? "bg-amber-500/20" : "bg-muted"
              )}>
                <Beaker className={cn(
                  "w-5 h-5",
                  test.status === 'running' ? "text-emerald-400" :
                  test.status === 'completed' ? "text-blue-400" :
                  test.status === 'paused' ? "text-amber-400" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">{test.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Split: {test.splitRatio}% / {100 - test.splitRatio}% • Created {test.createdAt}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className={cn(
                  "capitalize",
                  test.status === 'running' && "border-emerald-500/50 text-emerald-400",
                  test.status === 'completed' && "border-blue-500/50 text-blue-400",
                  test.status === 'paused' && "border-amber-500/50 text-amber-400"
                )}
              >
                {test.status === 'running' && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />}
                {test.status}
              </Badge>
              {test.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleTest(test.id)}
                  className="h-8 w-8 p-0"
                >
                  {test.status === 'running' ? (
                    <Pause className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-400" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sample Progress</span>
              <span>{test.variantA.stats.sent + test.variantB.stats.sent} / {test.targetSampleSize * 2}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>

          {/* Variants Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <VariantCard 
              variant={test.variantA} 
              label="A" 
              isWinner={test.winner === 'A' || (!test.winner && winnerStats.winner === 'A' && winnerStats.isSignificant)}
            />
            <VariantCard 
              variant={test.variantB} 
              label="B"
              isWinner={test.winner === 'B' || (!test.winner && winnerStats.winner === 'B' && winnerStats.isSignificant)}
            />
          </div>

          {/* Winner Summary */}
          {(test.status === 'completed' || winnerStats.isSignificant) && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Variant {test.winner || winnerStats.winner} is performing better
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{winnerStats.improvement}% improvement in engagement
                    </p>
                  </div>
                </div>
                {test.status === 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => applyWinner(test)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Apply Winner
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Beaker className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Email A/B Testing</h3>
            <p className="text-xs text-muted-foreground">Automatically split sends and track which template performs better</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New A/B Test
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Tests', value: tests.filter(t => t.status === 'running').length, icon: Beaker, color: 'text-emerald-400' },
          { label: 'Completed', value: tests.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'text-blue-400' },
          { label: 'Avg. Improvement', value: '23%', icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Total Emails Tested', value: tests.reduce((acc, t) => acc + t.variantA.stats.sent + t.variantB.stats.sent, 0), icon: Mail, color: 'text-amber-400' }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {tests.map(test => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>

      {/* Create Test Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Create A/B Test</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>✕</Button>
            </div>

            <div className="space-y-6">
              {/* Test Name */}
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Subject Line Test - Urgency vs Value"
                  className="bg-background border-border"
                />
              </div>

              {/* Split Ratio */}
              <div className="space-y-2">
                <Label>Traffic Split</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">A</Badge>
                    <span className="text-sm font-medium">{newTest.splitRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={newTest.splitRatio}
                    onChange={(e) => setNewTest(prev => ({ ...prev, splitRatio: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <div className="flex-1 flex items-center gap-2 justify-end">
                    <span className="text-sm font-medium">{100 - newTest.splitRatio}%</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">B</Badge>
                  </div>
                </div>
              </div>

              {/* Variant A */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Variant A</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Subject Line</Label>
                  <Input
                    value={newTest.variantA.subjectLine}
                    onChange={(e) => setNewTest(prev => ({ 
                      ...prev, 
                      variantA: { ...prev.variantA, subjectLine: e.target.value }
                    }))}
                    placeholder="🔥 Limited Time: Free Audit for {{business_name}}"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email Body</Label>
                  <Textarea
                    value={newTest.variantA.body}
                    onChange={(e) => setNewTest(prev => ({ 
                      ...prev, 
                      variantA: { ...prev.variantA, body: e.target.value }
                    }))}
                    placeholder="Hi {{first_name}}, I noticed your business..."
                    className="bg-background border-border min-h-[100px]"
                  />
                </div>
              </div>

              {/* Variant B */}
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Variant B</Badge>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-auto gap-1">
                    <Copy className="w-3 h-3" />
                    Duplicate from A
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Subject Line</Label>
                  <Input
                    value={newTest.variantB.subjectLine}
                    onChange={(e) => setNewTest(prev => ({ 
                      ...prev, 
                      variantB: { ...prev.variantB, subjectLine: e.target.value }
                    }))}
                    placeholder="3 Quick Wins for {{business_name}}"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email Body</Label>
                  <Textarea
                    value={newTest.variantB.body}
                    onChange={(e) => setNewTest(prev => ({ 
                      ...prev, 
                      variantB: { ...prev.variantB, body: e.target.value }
                    }))}
                    placeholder="Hi {{first_name}}, After reviewing your website..."
                    className="bg-background border-border min-h-[100px]"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-select winner</p>
                  <p className="text-xs text-muted-foreground">Automatically apply the winning variant when statistically significant</p>
                </div>
                <Switch
                  checked={newTest.autoSelectWinner}
                  onCheckedChange={(v) => setNewTest(prev => ({ ...prev, autoSelectWinner: v }))}
                />
              </div>

              {/* Sample Size */}
              <div className="space-y-2">
                <Label>Target Sample Size (per variant)</Label>
                <Input
                  type="number"
                  value={newTest.targetSampleSize}
                  onChange={(e) => setNewTest(prev => ({ ...prev, targetSampleSize: Number(e.target.value) }))}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Total emails: {newTest.targetSampleSize * 2} ({leads.length} leads available)
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewTest} className="bg-primary hover:bg-primary/90 gap-2">
                  <Beaker className="w-4 h-4" />
                  Create Test
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
