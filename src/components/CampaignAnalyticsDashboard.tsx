import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  Mail, MousePointer, Reply, TrendingUp, Eye, Clock,
  CheckCircle2, AlertCircle, Calendar, Target, Zap,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';

interface CampaignStats {
  id: string;
  name: string;
  sentDate: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
}

interface CampaignAnalyticsDashboardProps {
  campaigns?: CampaignStats[];
}

// Mock campaign data for demo
const MOCK_CAMPAIGNS: CampaignStats[] = [
  { id: '1', name: 'Q1 Web Design Outreach', sentDate: '2025-01-15', totalSent: 250, delivered: 242, opened: 98, clicked: 34, replied: 12, bounced: 8 },
  { id: '2', name: 'Local Business Follow-up', sentDate: '2025-01-10', totalSent: 180, delivered: 175, opened: 72, clicked: 28, replied: 8, bounced: 5 },
  { id: '3', name: 'Restaurant Redesign Promo', sentDate: '2025-01-05', totalSent: 120, delivered: 118, opened: 54, clicked: 18, replied: 6, bounced: 2 },
];

export default function CampaignAnalyticsDashboard({ campaigns = MOCK_CAMPAIGNS }: CampaignAnalyticsDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignStats | null>(campaigns[0] || null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate totals
  const totals = campaigns.reduce((acc, c) => ({
    sent: acc.sent + c.totalSent,
    delivered: acc.delivered + c.delivered,
    opened: acc.opened + c.opened,
    clicked: acc.clicked + c.clicked,
    replied: acc.replied + c.replied,
    bounced: acc.bounced + c.bounced,
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 });

  const rates = {
    delivery: totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : '0',
    open: totals.delivered > 0 ? ((totals.opened / totals.delivered) * 100).toFixed(1) : '0',
    click: totals.opened > 0 ? ((totals.clicked / totals.opened) * 100).toFixed(1) : '0',
    reply: totals.sent > 0 ? ((totals.replied / totals.sent) * 100).toFixed(1) : '0',
  };

  // Chart data
  const overviewData = campaigns.map(c => ({
    name: c.name.slice(0, 15) + '...',
    opened: ((c.opened / c.delivered) * 100).toFixed(1),
    clicked: ((c.clicked / c.opened) * 100).toFixed(1),
    replied: ((c.replied / c.totalSent) * 100).toFixed(1),
  }));

  const pieData = [
    { name: 'Opened', value: totals.opened, color: '#22c55e' },
    { name: 'Clicked', value: totals.clicked, color: '#3b82f6' },
    { name: 'Replied', value: totals.replied, color: '#8b5cf6' },
    { name: 'Unopened', value: totals.delivered - totals.opened, color: '#6b7280' },
  ];

  const getTrend = (value: number, benchmark: number) => {
    if (value > benchmark) return { icon: ArrowUp, color: 'text-green-500', label: 'Above avg' };
    if (value < benchmark) return { icon: ArrowDown, color: 'text-red-500', label: 'Below avg' };
    return { icon: Minus, color: 'text-muted-foreground', label: 'Average' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
            <BarChart className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Campaign Analytics</h2>
            <p className="text-muted-foreground">Track open rates, clicks, and replies</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={timeRange === '7d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === '90d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Open Rate
                </p>
                <p className="text-3xl font-bold mt-1">{rates.open}%</p>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +2.3% vs last period
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Click Rate
                </p>
                <p className="text-3xl font-bold mt-1">{rates.click}%</p>
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +1.8% vs last period
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  Reply Rate
                </p>
                <p className="text-3xl font-bold mt-1">{rates.reply}%</p>
                <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +0.5% vs last period
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Reply className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Delivery Rate
                </p>
                <p className="text-3xl font-bold mt-1">{rates.delivery}%</p>
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  Stable
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
            <CardDescription>Open, click, and reply rates by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="opened" fill="#22c55e" name="Open %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="#3b82f6" name="Click %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="replied" fill="#8b5cf6" name="Reply %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Distribution</CardTitle>
            <CardDescription>How recipients interacted with your emails</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <CardDescription>Click on a campaign to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <motion.button
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                whileHover={{ scale: 1.01 }}
                className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between border ${
                  selectedCampaign?.id === campaign.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.sentDate).toLocaleDateString()}
                      <span>•</span>
                      {campaign.totalSent} sent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-emerald-500">{((campaign.opened / campaign.delivered) * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Opens</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-500">{((campaign.clicked / campaign.opened) * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-purple-500">{campaign.replied}</p>
                    <p className="text-xs text-muted-foreground">Replies</p>
                  </div>
                  {selectedCampaign?.id === campaign.id && (
                    <Badge variant="outline" className="text-primary border-primary">
                      Selected
                    </Badge>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
