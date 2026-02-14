import { useCallback, useEffect, useState } from 'react';
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
  Mail,
  MousePointer,
  Eye,
  Sparkles,
  Copy,
  CheckCircle2,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getSentEmails } from '@/lib/emailService';

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

interface EmailActivityRecord {
  subject?: string;
  status?: string;
  sent_at?: string;
  created_at?: string;
}

const AB_TESTS_STORAGE_KEY = 'bamlead_ab_tests';

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

const inWindow = (activity: EmailActivityRecord, test: ABTest) => {
  const timestamp = activity.sent_at || activity.created_at;
  if (!timestamp) return false;

  const eventDate = new Date(timestamp);
  if (Number.isNaN(eventDate.getTime())) return false;

  if (test.startedAt) {
    const start = new Date(test.startedAt);
    if (!Number.isNaN(start.getTime()) && eventDate < start) return false;
  }

  if (test.completedAt) {
    const end = new Date(test.completedAt);
    if (!Number.isNaN(end.getTime()) && eventDate > end) return false;
  }

  return true;
};

const recomputeMetrics = (tests: ABTest[], activities: EmailActivityRecord[]): ABTest[] => {
  return tests.map((test) => {
    if (test.status === 'draft') return test;

    const nextVariants = test.variants.map((variant) => {
      const normalizedSubject = variant.subject.trim().toLowerCase();
      const matching = activities.filter((activity) => {
        const subject = String(activity.subject || '').trim().toLowerCase();
        return subject === normalizedSubject && inWindow(activity, test);
      });

      const counted = matching.filter((activity) => !['scheduled', 'pending', 'cancelled'].includes(String(activity.status || '').toLowerCase()));
      const opens = matching.filter((activity) => ['opened', 'clicked', 'replied'].includes(String(activity.status || '').toLowerCase())).length;
      const clicks = matching.filter((activity) => ['clicked', 'replied'].includes(String(activity.status || '').toLowerCase())).length;
      const replies = matching.filter((activity) => String(activity.status || '').toLowerCase() === 'replied').length;

      return {
        ...variant,
        sends: counted.length,
        opens,
        clicks,
        replies,
      };
    });

    const nextTest: ABTest = {
      ...test,
      variants: nextVariants,
    };

    if (test.status === 'completed') {
      const winner = getWinningVariant(nextTest);
      nextTest.winner = winner || undefined;
    }

    return nextTest;
  });
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
};

export default function ABTestingPanel() {
  const [tests, setTests] = useState<ABTest[]>(() => {
    try {
      const raw = localStorage.getItem(AB_TESTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showCreate, setShowCreate] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [isSyncingMetrics, setIsSyncingMetrics] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    variantASubject: '',
    variantBSubject: '',
    splitPercentage: 50,
  });

  useEffect(() => {
    localStorage.setItem(AB_TESTS_STORAGE_KEY, JSON.stringify(tests));
  }, [tests]);

  const syncPerformanceMetrics = useCallback(async (showToast = false) => {
    if (tests.length === 0) {
      if (showToast) {
        toast.info('No A/B tests available yet.');
      }
      return;
    }

    setIsSyncingMetrics(true);
    try {
      const records = (await getSentEmails(500, 0)) as EmailActivityRecord[];
      const normalized = Array.isArray(records) ? records : [];

      setTests((prev) => recomputeMetrics(prev, normalized));

      if (showToast) {
        toast.success('A/B metrics refreshed from real sends');
      }
    } catch {
      if (showToast) {
        toast.error('Failed to refresh A/B metrics');
      }
    } finally {
      setIsSyncingMetrics(false);
    }
  }, [tests.length]);

  useEffect(() => {
    void syncPerformanceMetrics(false);

    const timer = window.setInterval(() => {
      void syncPerformanceMetrics(false);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [syncPerformanceMetrics]);

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
        { id: 'b', name: 'Variant B', subject: newTest.variantBSubject, sends: 0, opens: 0, clicks: 0, replies: 0 },
      ],
    };

    setTests((prev) => [test, ...prev]);
    setNewTest({ name: '', variantASubject: '', variantBSubject: '', splitPercentage: 50 });
    setShowCreate(false);
    toast.success('A/B test created! Ready to launch.');
  };

  const handleStartTest = (testId: string) => {
    setTests((prev) => prev.map((test) => (
      test.id === testId
        ? {
            ...test,
            status: 'running',
            startedAt: new Date().toISOString(),
            completedAt: undefined,
            winner: undefined,
          }
        : test
    )));
    toast.success('Test started. Metrics update from real email sends.');
  };

  const handleStopTest = (testId: string) => {
    setTests((prev) => prev.map((test) => {
      if (test.id !== testId) return test;
      const winner = getWinningVariant(test);
      return {
        ...test,
        status: 'completed',
        completedAt: new Date().toISOString(),
        winner: winner || undefined,
      };
    }));
    toast.success('Test completed. Winner locked from current metrics.');
  };

  const handleDeleteTest = (testId: string) => {
    setTests((prev) => prev.filter((test) => test.id !== testId));
    toast.success('Test deleted');
  };

  const handleEditTest = (test: ABTest) => {
    setEditingTest(test);
  };

  const handleSaveEdit = () => {
    if (!editingTest) return;
    setTests((prev) => prev.map((test) => (test.id === editingTest.id ? editingTest : test)));
    setEditingTest(null);
    toast.success('Test updated successfully');
  };

  const handleCopyWinner = (test: ABTest) => {
    const winner = test.variants.find((variant) => variant.id === test.winner);
    if (winner) {
      navigator.clipboard.writeText(winner.subject);
      toast.success('Winning subject line copied');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <FlaskConical className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">A/B Testing</h2>
            <p className="text-sm text-muted-foreground">Metrics are derived from real sent emails by matching subject lines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void syncPerformanceMetrics(true)}
            disabled={isSyncingMetrics}
            className="gap-2"
          >
            {isSyncingMetrics ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Metrics
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Test
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Create A/B Test
            </CardTitle>
            <CardDescription>
              Split your audience and compare real performance
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
                Audience split: {newTest.splitPercentage}% / {100 - newTest.splitPercentage}%
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

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
          <TabsTrigger value="running">Running ({tests.filter((t) => t.status === 'running').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tests.filter((t) => t.status === 'completed').length})</TabsTrigger>
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
            tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onStart={handleStartTest}
                onStop={handleStopTest}
                onDelete={handleDeleteTest}
                onEdit={handleEditTest}
                onCopyWinner={handleCopyWinner}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          {tests.filter((t) => t.status === 'running').map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onStart={handleStartTest}
              onStop={handleStopTest}
              onDelete={handleDeleteTest}
              onEdit={handleEditTest}
              onCopyWinner={handleCopyWinner}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests.filter((t) => t.status === 'completed').map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onStart={handleStartTest}
              onStop={handleStopTest}
              onDelete={handleDeleteTest}
              onEdit={handleEditTest}
              onCopyWinner={handleCopyWinner}
            />
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTest} onOpenChange={(open) => !open && setEditingTest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-purple-400" />
              Edit A/B Test
            </DialogTitle>
            <DialogDescription>
              Update your test name and subject lines
            </DialogDescription>
          </DialogHeader>
          {editingTest && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  value={editingTest.name}
                  onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">A</Badge>
                    Variant A Subject
                  </Label>
                  <Input
                    value={editingTest.variants[0]?.subject || ''}
                    onChange={(e) => setEditingTest({
                      ...editingTest,
                      variants: editingTest.variants.map((variant, index) => (
                        index === 0 ? { ...variant, subject: e.target.value } : variant
                      )),
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">B</Badge>
                    Variant B Subject
                  </Label>
                  <Input
                    value={editingTest.variants[1]?.subject || ''}
                    onChange={(e) => setEditingTest({
                      ...editingTest,
                      variants: editingTest.variants.map((variant, index) => (
                        index === 1 ? { ...variant, subject: e.target.value } : variant
                      )),
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditingTest(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TestCardProps {
  test: ABTest;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (test: ABTest) => void;
  onCopyWinner: (test: ABTest) => void;
}

function TestCard({ test, onStart, onStop, onDelete, onEdit, onCopyWinner }: TestCardProps) {
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
            <Button size="sm" variant="ghost" onClick={() => onEdit(test)} title="Edit Test">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(test.id)} title="Delete Test">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {(test.startedAt || test.completedAt) && (
          <CardDescription>
            {test.startedAt ? `Started ${formatTimestamp(test.startedAt)}` : ''}
            {test.completedAt ? ` • Completed ${formatTimestamp(test.completedAt)}` : ''}
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
