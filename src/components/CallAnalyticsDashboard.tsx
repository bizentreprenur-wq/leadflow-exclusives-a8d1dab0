import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Users,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { 
  getCallStats,
  listCallLogs,
  type CallStats,
  type CallLog,
  type CallOutcome 
} from '@/lib/api/callLogs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

const OUTCOME_CONFIG: Record<CallOutcome, { label: string; color: string; icon: typeof Phone }> = {
  interested: { label: 'Interested', color: '#10b981', icon: CheckCircle2 },
  callback_requested: { label: 'Callback', color: '#f59e0b', icon: RotateCcw },
  completed: { label: 'Completed', color: '#3b82f6', icon: Phone },
  no_answer: { label: 'No Answer', color: '#6b7280', icon: PhoneMissed },
  not_interested: { label: 'Not Interested', color: '#ef4444', icon: XCircle },
  wrong_number: { label: 'Wrong Number', color: '#f97316', icon: PhoneOff },
  other: { label: 'Other', color: '#8b5cf6', icon: Phone },
};

interface CallAnalyticsDashboardProps {
  refreshSignal?: number;
}

export default function CallAnalyticsDashboard({ refreshSignal = 0 }: CallAnalyticsDashboardProps) {
  const [stats, setStats] = useState<CallStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [refreshSignal]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsResult, logsResult] = await Promise.all([
        getCallStats(),
        listCallLogs({ limit: 50 }),
      ]);
      
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
      
      if (logsResult.success && logsResult.logs) {
        setRecentLogs(logsResult.logs);
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare pie chart data
  const pieData = stats?.outcomes 
    ? Object.entries(stats.outcomes)
        .filter(([_, count]) => count > 0)
        .map(([outcome, count]) => ({
          name: OUTCOME_CONFIG[outcome as CallOutcome]?.label || outcome,
          value: count,
          color: OUTCOME_CONFIG[outcome as CallOutcome]?.color || '#6b7280',
        }))
    : [];

  // Prepare bar chart data for outcomes
  const barData = stats?.outcomes
    ? Object.entries(stats.outcomes).map(([outcome, count]) => ({
        name: OUTCOME_CONFIG[outcome as CallOutcome]?.label || outcome,
        calls: count,
        fill: OUTCOME_CONFIG[outcome as CallOutcome]?.color || '#6b7280',
      }))
    : [];

  // Calculate conversion metrics
  const totalCalls = stats?.total_calls || 0;
  const interestedCalls = stats?.outcomes?.interested || 0;
  const callbackCalls = stats?.outcomes?.callback_requested || 0;
  const notInterestedCalls = stats?.outcomes?.not_interested || 0;
  const noAnswerCalls = stats?.outcomes?.no_answer || 0;
  
  const positiveOutcomes = interestedCalls + callbackCalls;
  const conversionRate = totalCalls > 0 ? ((positiveOutcomes / totalCalls) * 100).toFixed(1) : '0';
  const answerRate = totalCalls > 0 ? (((totalCalls - noAnswerCalls) / totalCalls) * 100).toFixed(1) : '0';
  const rejectionRate = totalCalls > 0 ? ((notInterestedCalls / totalCalls) * 100).toFixed(1) : '0';

  // Group calls by day for trend chart
  const dailyTrend = recentLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(d => d.day === date);
    if (existing) {
      existing.calls++;
      existing.duration += log.duration_seconds;
    } else {
      acc.push({ day: date, calls: 1, duration: log.duration_seconds });
    }
    return acc;
  }, [] as { day: string; calls: number; duration: number }[]).slice(-7);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardContent className="pt-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Analytics Available</p>
          <p className="text-muted-foreground mb-4">Start making calls to see your analytics here</p>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Call Analytics
          </h2>
          <p className="text-muted-foreground">Track your AI voice calling performance</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Calls */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total_calls}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={parseFloat(conversionRate)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Average Duration */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatDuration(stats.average_duration_seconds)}</p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.calls_this_week}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Answer Rate</p>
                <p className="text-2xl font-bold">{answerRate}%</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${parseFloat(answerRate) >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {parseFloat(answerRate) >= 70 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {parseFloat(answerRate) >= 70 ? 'Good' : 'Needs work'}
              </div>
            </div>
            <Progress value={parseFloat(answerRate)} className="h-1.5 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Interested Rate</p>
                <p className="text-2xl font-bold">{stats.interested_rate}%</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                {interestedCalls} leads
              </Badge>
            </div>
            <Progress value={stats.interested_rate} className="h-1.5 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejection Rate</p>
                <p className="text-2xl font-bold">{rejectionRate}%</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${parseFloat(rejectionRate) <= 30 ? 'text-emerald-500' : 'text-red-500'}`}>
                {parseFloat(rejectionRate) <= 30 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                {parseFloat(rejectionRate) <= 30 ? 'Low' : 'High'}
              </div>
            </div>
            <Progress value={parseFloat(rejectionRate)} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outcome Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Outcome Distribution
            </CardTitle>
            <CardDescription>How your calls are ending</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                No outcome data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outcome Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Calls by Outcome
            </CardTitle>
            <CardDescription>Breakdown of all call results</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} calls`, 'Count']}
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="calls" 
                    radius={[0, 4, 4, 0]}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                No call data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Time & Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-emerald-500">{interestedCalls}</p>
                <p className="text-sm text-muted-foreground">Interested</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-amber-500">{callbackCalls}</p>
                <p className="text-sm text-muted-foreground">Callbacks</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-gray-500">{noAnswerCalls}</p>
                <p className="text-sm text-muted-foreground">No Answer</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-red-500">{notInterestedCalls}</p>
                <p className="text-sm text-muted-foreground">Not Interested</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Total Talk Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">
                {Math.floor(stats.total_duration_seconds / 3600)}h {Math.floor((stats.total_duration_seconds % 3600) / 60)}m
              </p>
              <p className="text-muted-foreground mt-2">
                {stats.total_duration_seconds > 0 
                  ? `Across ${stats.total_calls} calls`
                  : 'Start calling to track time'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">💡 Performance Insights</p>
              <p className="text-sm text-muted-foreground">
                {stats.interested_rate >= 20 
                  ? `Great job! Your ${stats.interested_rate}% interest rate is above average. Keep targeting hot leads!`
                  : stats.interested_rate >= 10
                  ? `Your ${stats.interested_rate}% interest rate is good. Try calling during optimal hours to improve.`
                  : `Focus on improving your pitch. Consider calling hot leads first and reviewing transcripts for improvement areas.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
