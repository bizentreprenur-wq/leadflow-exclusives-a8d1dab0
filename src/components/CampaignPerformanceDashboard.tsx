import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Send, Eye, MousePointer,
  Reply, Flame, ThermometerSun, Snowflake, Calendar, ArrowUp, ArrowDown,
  Target, Zap, Clock, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface CampaignPerformanceDashboardProps {
  className?: string;
}

// Demo historical data
const generateHistoricalData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    sent: Math.floor(Math.random() * 50) + 20,
    opened: Math.floor(Math.random() * 30) + 10,
    clicked: Math.floor(Math.random() * 15) + 5,
    replied: Math.floor(Math.random() * 8) + 2,
  }));
};

const prioritySegmentData = [
  { name: 'Hot', value: 35, color: '#ef4444', openRate: 68, clickRate: 42, replyRate: 28 },
  { name: 'Warm', value: 45, color: '#f59e0b', openRate: 45, clickRate: 22, replyRate: 12 },
  { name: 'Cold', value: 20, color: '#3b82f6', openRate: 28, clickRate: 8, replyRate: 4 },
];

const weeklyTrends = [
  { week: 'Week 1', hot: 45, warm: 32, cold: 18 },
  { week: 'Week 2', hot: 52, warm: 38, cold: 22 },
  { week: 'Week 3', hot: 48, warm: 42, cold: 28 },
  { week: 'Week 4', hot: 65, warm: 48, cold: 32 },
];

export default function CampaignPerformanceDashboard({ className }: CampaignPerformanceDashboardProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [historicalData, setHistoricalData] = useState(generateHistoricalData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real analytics from localStorage if available
  const analytics = useMemo(() => {
    try {
      const stored = localStorage.getItem('bamlead_campaign_analytics');
      return stored ? JSON.parse(stored) : {
        sent: 142, delivered: 135, opened: 58, clicked: 24, replied: 12
      };
    } catch {
      return { sent: 142, delivered: 135, opened: 58, clicked: 24, replied: 12 };
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHistoricalData(generateHistoricalData());
      setIsRefreshing(false);
    }, 800);
  };

  // Calculate trends
  const openRate = analytics.sent > 0 ? Math.round((analytics.opened / analytics.sent) * 100) : 0;
  const clickRate = analytics.sent > 0 ? Math.round((analytics.clicked / analytics.sent) * 100) : 0;
  const replyRate = analytics.sent > 0 ? Math.round((analytics.replied / analytics.sent) * 100) : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Campaign Performance
          </h2>
          <p className="text-sm text-muted-foreground">Historical metrics, trends, and priority comparisons</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 rounded-lg p-1 border border-border">
            {(['7d', '30d', '90d'] as const).map(t => (
              <Button
                key={t}
                size="sm"
                variant={timeframe === t ? 'default' : 'ghost'}
                onClick={() => setTimeframe(t)}
                className={cn("text-xs h-7 px-3", timeframe === t && "bg-primary text-primary-foreground")}
              >
                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: analytics.sent, change: +12, icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Open Rate', value: `${openRate}%`, change: +8, icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Click Rate', value: `${clickRate}%`, change: +5, icon: MousePointer, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Reply Rate', value: `${replyRate}%`, change: +15, icon: Reply, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(kpi => (
          <Card key={kpi.label} className={cn("border-border", kpi.bg)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-1.5",
                    kpi.change > 0 ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
                  )}
                >
                  {kpi.change > 0 ? <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDown className="w-2.5 h-2.5 mr-0.5" />}
                  {Math.abs(kpi.change)}%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Engagement Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area type="monotone" dataKey="opened" stroke="#10b981" fillOpacity={1} fill="url(#colorOpened)" />
                <Area type="monotone" dataKey="clicked" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorClicked)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Opened</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Clicked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Segment Comparison */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Priority Segment Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={prioritySegmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {prioritySegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {prioritySegmentData.map((segment) => (
                  <div key={segment.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-16">
                      {segment.name === 'Hot' && <Flame className="w-3.5 h-3.5 text-red-400" />}
                      {segment.name === 'Warm' && <ThermometerSun className="w-3.5 h-3.5 text-amber-400" />}
                      {segment.name === 'Cold' && <Snowflake className="w-3.5 h-3.5 text-blue-400" />}
                      <span className="text-xs font-medium text-foreground">{segment.name}</span>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Open {segment.openRate}%
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Click {segment.clickRate}%
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Reply {segment.replyRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends by Priority */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Weekly Engagement Trends by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconSize={8}
              />
              <Bar dataKey="hot" name="🔥 Hot" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="warm" name="🌡️ Warm" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cold" name="❄️ Cold" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Best Performing</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hot leads have <span className="text-emerald-400 font-medium">3x higher</span> reply rates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Optimal Send Time</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-amber-400 font-medium">Tuesday 10 AM</span> has highest open rates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-purple-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Focus more on <span className="text-purple-400 font-medium">Warm leads</span> this week
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
