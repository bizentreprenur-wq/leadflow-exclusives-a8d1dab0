import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Trophy, 
  TrendingUp, 
  Mail, 
  MousePointer, 
  Eye,
  BarChart3,
  Sparkles,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface ABVariant {
  id: string;
  name: string;
  subject: string;
  templateId?: string;
  sends: number;
  opens: number;
  clicks: number;
  replies: number;
}

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  variants: ABVariant[];
  winner?: string;
  startedAt?: string;
  completedAt?: string;
  splitPercentage: number;
}

// Sample tests for demo
const sampleTests: ABTest[] = [
  {
    id: '1',
    name: 'Subject Line Test - Web Design',
    status: 'running',
    splitPercentage: 50,
    startedAt: '2024-01-15',
    variants: [
      { id: 'a', name: 'Variant A', subject: 'Is your website losing customers?', sends: 245, opens: 89, clicks: 34, replies: 12 },
      { id: 'b', name: 'Variant B', subject: 'Quick question about your online presence', sends: 248, opens: 112, clicks: 45, replies: 18 }
    ]
  },
  {
    id: '2',
    name: 'Template Test - Cold Outreach',
    status: 'completed',
    splitPercentage: 50,
    startedAt: '2024-01-10',
    completedAt: '2024-01-14',
    winner: 'b',
    variants: [
      { id: 'a', name: 'Professional', subject: 'Partnership Opportunity', sends: 500, opens: 145, clicks: 42, replies: 15 },
      { id: 'b', name: 'Casual', subject: 'Quick idea for your business', sends: 500, opens: 198, clicks: 78, replies: 32 }
    ]
  }
];

export default function ABTestingPanel() {
  const [tests, setTests] = useState<ABTest[]>(sampleTests);
  const [showCreate, setShowCreate] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    variantASubject: '',
    variantBSubject: '',
    splitPercentage: 50
  });

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
  };

  const getWinningVariant = (test: ABTest) => {
    if (test.variants.length < 2) return null;
    const [a, b] = test.variants;
    const aScore = calculateRate(a.replies, a.sends);
    const bScore = calculateRate(b.replies, b.sends);
    if (aScore > bScore) return 'a';
    if (bScore > aScore) return 'b';
    return null;
  };

  const handleCreateTest = () => {
    if (!newTest.name || !newTest.variantASubject || !newTest.variantBSubject) {
      toast.error('Please fill in all fields');
      return;
    }

    const test: ABTest = {
      id: Date.now().toString(),
      name: newTest.name,
      status: 'draft',
      splitPercentage: newTest.splitPercentage,
      variants: [
        { id: 'a', name: 'Variant A', subject: newTest.variantASubject, sends: 0, opens: 0, clicks: 0, replies: 0 },
        { id: 'b', name: 'Variant B', subject: newTest.variantBSubject, sends: 0, opens: 0, clicks: 0, replies: 0 }
      ]
    };

    setTests([test, ...tests]);
    setNewTest({ name: '', variantASubject: '', variantBSubject: '', splitPercentage: 50 });
    setShowCreate(false);
    toast.success('A/B test created! Ready to launch.');
  };

  const handleStartTest = (testId: string) => {
    setTests(tests.map(t => 
      t.id === testId ? { ...t, status: 'running' as const, startedAt: new Date().toISOString().split('T')[0] } : t
    ));
    toast.success('Test started! We\'ll split your sends 50/50.');
  };

  const handleStopTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    
    const winner = getWinningVariant(test);
    setTests(tests.map(t => 
      t.id === testId ? { 
        ...t, 
        status: 'completed' as const, 
        completedAt: new Date().toISOString().split('T')[0],
        winner: winner || undefined
      } : t
    ));
    toast.success('Test completed! Check the results.');
  };

  const handleDeleteTest = (testId: string) => {
    setTests(tests.filter(t => t.id !== testId));
    toast.success('Test deleted');
  };

  const handleCopyWinner = (test: ABTest) => {
    const winner = test.variants.find(v => v.id === test.winner);
    if (winner) {
      navigator.clipboard.writeText(winner.subject);
      toast.success('Winning subject line copied!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <FlaskConical className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">A/B Testing</h2>
            <p className="text-sm text-muted-foreground">Test subject lines & templates to maximize opens</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Test
        </Button>
      </div>

      {/* Create New Test */}
      {showCreate && (
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Create A/B Test
            </CardTitle>
            <CardDescription>
              Split your audience and find what converts best
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <Input 
                placeholder="e.g., Subject Line Test - January Campaign"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">A</Badge>
                  Variant A Subject
                </Label>
                <Input 
                  placeholder="Your first subject line..."
                  value={newTest.variantASubject}
                  onChange={(e) => setNewTest({ ...newTest, variantASubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">B</Badge>
                  Variant B Subject
                </Label>
                <Input 
                  placeholder="Your second subject line..."
                  value={newTest.variantBSubject}
                  onChange={(e) => setNewTest({ ...newTest, variantBSubject: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Audience will be split 50/50 between variants
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreateTest} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Create Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
          <TabsTrigger value="running">Running ({tests.filter(t => t.status === 'running').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tests.filter(t => t.status === 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tests.length === 0 ? (
            <Card className="p-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first test to start optimizing your emails</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Test
              </Button>
            </Card>
          ) : (
            tests.map(test => (
              <TestCard 
                key={test.id} 
                test={test}
                onStart={handleStartTest}
                onStop={handleStopTest}
                onDelete={handleDeleteTest}
                onCopyWinner={handleCopyWinner}
                calculateRate={calculateRate}
                getWinningVariant={getWinningVariant}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          {tests.filter(t => t.status === 'running').map(test => (
            <TestCard 
              key={test.id} 
              test={test}
              onStart={handleStartTest}
              onStop={handleStopTest}
              onDelete={handleDeleteTest}
              onCopyWinner={handleCopyWinner}
              calculateRate={calculateRate}
              getWinningVariant={getWinningVariant}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests.filter(t => t.status === 'completed').map(test => (
            <TestCard 
              key={test.id} 
              test={test}
              onStart={handleStartTest}
              onStop={handleStopTest}
              onDelete={handleDeleteTest}
              onCopyWinner={handleCopyWinner}
              calculateRate={calculateRate}
              getWinningVariant={getWinningVariant}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TestCardProps {
  test: ABTest;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyWinner: (test: ABTest) => void;
  calculateRate: (num: number, denom: number) => number;
  getWinningVariant: (test: ABTest) => string | null;
}

function TestCard({ test, onStart, onStop, onDelete, onCopyWinner, calculateRate, getWinningVariant }: TestCardProps) {
  const currentWinner = getWinningVariant(test);

  return (
    <Card className={test.status === 'completed' && test.winner ? 'border-emerald-500/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{test.name}</CardTitle>
            <Badge 
              variant="outline" 
              className={
                test.status === 'running' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                  : test.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-muted'
              }
            >
              {test.status === 'running' && <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />}
              {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {test.status === 'draft' && (
              <Button size="sm" onClick={() => onStart(test.id)} className="gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            )}
            {test.status === 'running' && (
              <Button size="sm" variant="outline" onClick={() => onStop(test.id)} className="gap-2">
                <Pause className="w-4 h-4" />
                End Test
              </Button>
            )}
            {test.status === 'completed' && test.winner && (
              <Button size="sm" variant="outline" onClick={() => onCopyWinner(test)} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy Winner
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDelete(test.id)}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {test.startedAt && (
          <CardDescription>
            Started {test.startedAt}
            {test.completedAt && ` • Completed ${test.completedAt}`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {test.variants.map((variant, idx) => {
            const isWinner = test.winner === variant.id || (test.status === 'running' && currentWinner === variant.id);
            const openRate = calculateRate(variant.opens, variant.sends);
            const clickRate = calculateRate(variant.clicks, variant.sends);
            const replyRate = calculateRate(variant.replies, variant.sends);

            return (
              <div 
                key={variant.id}
                className={`p-4 rounded-xl border ${
                  isWinner 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-border/50 bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={idx === 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}
                    >
                      {variant.name}
                    </Badge>
                    {isWinner && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                        <Trophy className="w-3 h-3" />
                        {test.status === 'completed' ? 'Winner' : 'Leading'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{variant.sends} sent</span>
                </div>

                <p className="text-sm font-medium mb-4 line-clamp-2">"{variant.subject}"</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">Opens</span>
                    </div>
                    <p className="text-lg font-bold">{openRate}%</p>
                    <Progress value={openRate} className="h-1 mt-1" />
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <MousePointer className="w-3 h-3" />
                      <span className="text-xs">Clicks</span>
                    </div>
                    <p className="text-lg font-bold">{clickRate}%</p>
                    <Progress value={clickRate} className="h-1 mt-1" />
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Mail className="w-3 h-3" />
                      <span className="text-xs">Replies</span>
                    </div>
                    <p className="text-lg font-bold">{replyRate}%</p>
                    <Progress value={replyRate} className="h-1 mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
