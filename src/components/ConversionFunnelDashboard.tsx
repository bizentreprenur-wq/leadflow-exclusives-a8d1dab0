import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Send, MailOpen, MousePointer, Reply, Calendar, CheckCircle2,
  TrendingUp, TrendingDown, ArrowRight, BarChart3, Target,
  Flame, ThermometerSun, Snowflake, RefreshCw, Download,
  Globe, Store
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';

interface FunnelStage {
  name: string;
  value: number;
  fill: string;
  icon: React.ElementType;
  rate?: number;
}

interface ConversionFunnelDashboardProps {
  searchType?: 'gmb' | 'platform' | null;
}

export default function ConversionFunnelDashboard({ searchType }: ConversionFunnelDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock analytics data - in production, fetch from backend
  const [analytics, setAnalytics] = useState(() => {
    try {
      const stored = localStorage.getItem('bamlead_campaign_analytics');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      sent: 1247,
      delivered: 1198,
      opened: 523,
      clicked: 187,
      replied: 89,
      meetingsBooked: 34,
      dealsClosed: 12,
    };
  });

  // Calculate conversion rates
  const funnelData: FunnelStage[] = useMemo(() => [
    { 
      name: 'Emails Sent', 
      value: analytics.sent, 
      fill: 'hsl(var(--primary))',
      icon: Send,
      rate: 100
    },
    { 
      name: 'Opened', 
      value: analytics.opened, 
      fill: 'hsl(210, 100%, 50%)',
      icon: MailOpen,
      rate: Math.round((analytics.opened / analytics.sent) * 100)
    },
    { 
      name: 'Clicked', 
      value: analytics.clicked, 
      fill: 'hsl(280, 100%, 60%)',
      icon: MousePointer,
      rate: Math.round((analytics.clicked / analytics.opened) * 100)
    },
    { 
      name: 'Replied', 
      value: analytics.replied, 
      fill: 'hsl(45, 100%, 50%)',
      icon: Reply,
      rate: Math.round((analytics.replied / analytics.clicked) * 100)
    },
    { 
      name: 'Meeting Booked', 
      value: analytics.meetingsBooked, 
      fill: 'hsl(160, 100%, 40%)',
      icon: Calendar,
      rate: Math.round((analytics.meetingsBooked / analytics.replied) * 100)
    },
    { 
      name: 'Deal Closed', 
      value: analytics.dealsClosed, 
      fill: 'hsl(142, 76%, 36%)',
      icon: CheckCircle2,
      rate: Math.round((analytics.dealsClosed / analytics.meetingsBooked) * 100)
    },
  ], [analytics]);

  // Historical trend data
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: Math.floor(30 + Math.random() * 50),
        opened: Math.floor(15 + Math.random() * 25),
        clicked: Math.floor(5 + Math.random() * 15),
        replied: Math.floor(2 + Math.random() * 8),
      };
    });
  }, [timeRange]);

  // Priority breakdown
  const priorityBreakdown = useMemo(() => [
    { name: 'Hot Leads', value: Math.floor(analytics.replied * 0.45), fill: 'hsl(0, 100%, 60%)' },
    { name: 'Warm Leads', value: Math.floor(analytics.replied * 0.35), fill: 'hsl(45, 100%, 50%)' },
    { name: 'Cold Leads', value: Math.floor(analytics.replied * 0.20), fill: 'hsl(210, 100%, 60%)' },
  ], [analytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simulate updated data
    setAnalytics(prev => ({
      ...prev,
      opened: prev.opened + Math.floor(Math.random() * 10),
      clicked: prev.clicked + Math.floor(Math.random() * 5),
      replied: prev.replied + Math.floor(Math.random() * 3),
    }));
    setIsRefreshing(false);
  };

  const overallConversion = useMemo(() => {
    return ((analytics.dealsClosed / analytics.sent) * 100).toFixed(2);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Conversion Funnel</h2>
            <p className="text-sm text-muted-foreground">Track your outreach performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={cn(
              "text-sm py-1.5 px-3 gap-2",
              searchType === 'gmb' 
                ? "border-purple-500/50 text-purple-400 bg-purple-500/10" 
                : "border-orange-500/50 text-orange-400 bg-orange-500/10"
            )}
          >
            {searchType === 'gmb' ? (
              <><Globe className="w-4 h-4" /> Option A</>
            ) : (
              <><Store className="w-4 h-4" /> Option B</>
            )}
          </Badge>
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-3">
        {funnelData.map((stage, idx) => (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stage.fill}20` }}
                  >
                    <stage.icon className="w-4 h-4" style={{ color: stage.fill }} />
                  </div>
                  {idx < funnelData.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{stage.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground truncate">{stage.name}</p>
                {idx > 0 && (
                  <Badge 
                    className="mt-2 text-[9px]"
                    style={{ 
                      backgroundColor: `${stage.fill}20`,
                      color: stage.fill,
                      borderColor: `${stage.fill}40`
                    }}
                  >
                    {stage.rate}% rate
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Overall Conversion Banner */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
              <p className="text-3xl font-bold text-emerald-400">{overallConversion}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Revenue Potential</p>
            <p className="text-2xl font-bold text-foreground">
              ${(analytics.dealsClosed * 2500).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Based on $2,500 avg deal</p>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Funnel Visualization */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList 
                    position="center" 
                    fill="#fff" 
                    fontSize={12}
                    dataKey="name"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="opened" 
                  stackId="2"
                  stroke="hsl(210, 100%, 50%)" 
                  fill="hsl(210, 100%, 50%)" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="replied" 
                  stackId="3"
                  stroke="hsl(45, 100%, 50%)" 
                  fill="hsl(45, 100%, 50%)" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            Responses by Lead Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {priorityBreakdown.map((priority, idx) => (
              <div 
                key={priority.name}
                className="p-4 rounded-xl border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  {idx === 0 && <Flame className="w-5 h-5 text-red-400" />}
                  {idx === 1 && <ThermometerSun className="w-5 h-5 text-amber-400" />}
                  {idx === 2 && <Snowflake className="w-5 h-5 text-blue-400" />}
                  <span className="font-medium text-foreground">{priority.name}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{priority.value}</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(priority.value / analytics.replied) * 100}%`,
                      backgroundColor: priority.fill
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((priority.value / analytics.replied) * 100)}% of total replies
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
