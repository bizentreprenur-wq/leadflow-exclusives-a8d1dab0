import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Mail,
  Shield,
  Server,
  XCircle,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Send,
  BarChart3,
  AlertCircle,
  FileWarning,
  Gauge,
  Eye,
  MousePointer,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { getEmailStats, type EmailStats } from '@/lib/api/email';
import { motion } from 'framer-motion';

interface DeliverabilityTip {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: typeof Mail;
  actionLabel?: string;
  onAction?: () => void;
}

interface SpamIndicator {
  name: string;
  status: 'good' | 'warning' | 'bad';
  description: string;
  weight: number;
}

interface EmailDeliverabilityTrackerProps {
  onConfigureSMTP?: () => void;
  smtpConfigured?: boolean;
  compact?: boolean;
}

export default function EmailDeliverabilityTracker({ 
  onConfigureSMTP,
  smtpConfigured = false,
  compact = false,
}: EmailDeliverabilityTrackerProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('score');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const result = await getEmailStats(30);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to load email stats:', error);
    }
    setIsLoading(false);
  };

  // Calculate deliverability metrics
  const totalSent = stats?.total_sent || 0;
  const totalBounced = stats?.total_bounced || 0;
  const totalDelivered = totalSent - totalBounced;
  const totalOpened = stats?.total_opened || 0;
  const totalClicked = stats?.total_clicked || 0;
  const totalReplied = stats?.total_replied || 0;

  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100) : 100;
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100) : 0;
  const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100) : 0;
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;
  const replyRate = totalDelivered > 0 ? ((totalReplied / totalDelivered) * 100) : 0;

  // Spam Score Analysis
  const analyzeSpamIndicators = (): SpamIndicator[] => {
    const indicators: SpamIndicator[] = [];

    // SMTP Authentication
    indicators.push({
      name: 'SMTP Authentication',
      status: smtpConfigured ? 'good' : 'bad',
      description: smtpConfigured 
        ? 'Sending from your own authenticated server' 
        : 'Not using authenticated SMTP - high spam risk',
      weight: 25,
    });

    // Bounce Rate
    indicators.push({
      name: 'Bounce Rate',
      status: bounceRate < 2 ? 'good' : bounceRate < 5 ? 'warning' : 'bad',
      description: bounceRate < 2 
        ? `Excellent bounce rate (${bounceRate.toFixed(1)}%)` 
        : bounceRate < 5 
          ? `Moderate bounce rate (${bounceRate.toFixed(1)}%)` 
          : `High bounce rate (${bounceRate.toFixed(1)}%) - clean your list`,
      weight: 20,
    });

    // Open Rate (engagement signal)
    indicators.push({
      name: 'Engagement Rate',
      status: openRate > 20 ? 'good' : openRate > 10 ? 'warning' : totalSent < 10 ? 'warning' : 'bad',
      description: openRate > 20 
        ? `Strong engagement (${openRate.toFixed(0)}% opens)` 
        : openRate > 10 
          ? `Moderate engagement (${openRate.toFixed(0)}% opens)` 
          : totalSent < 10 
            ? 'Not enough data yet'
            : `Low engagement (${openRate.toFixed(0)}% opens) - improve subject lines`,
      weight: 15,
    });

    // Reply Rate
    indicators.push({
      name: 'Reply Rate',
      status: replyRate > 5 ? 'good' : replyRate > 2 ? 'warning' : totalSent < 10 ? 'warning' : 'bad',
      description: replyRate > 5 
        ? `Excellent reply rate (${replyRate.toFixed(1)}%)` 
        : replyRate > 2 
          ? `Moderate replies (${replyRate.toFixed(1)}%)`
          : totalSent < 10 
            ? 'Send more emails to track'
            : 'Low replies - personalize your messages',
      weight: 15,
    });

    // Sending Consistency
    const consistencyScore = totalSent > 0 ? 'good' : 'warning';
    indicators.push({
      name: 'Sending History',
      status: consistencyScore,
      description: totalSent > 50 
        ? `Established sender (${totalSent} emails sent)` 
        : totalSent > 10 
          ? `Building reputation (${totalSent} emails sent)`
          : 'New sender - warm up gradually',
      weight: 10,
    });

    // Domain Reputation (simulated)
    indicators.push({
      name: 'Domain Reputation',
      status: smtpConfigured && bounceRate < 5 ? 'good' : smtpConfigured ? 'warning' : 'bad',
      description: smtpConfigured && bounceRate < 5 
        ? 'Good domain reputation signals' 
        : smtpConfigured 
          ? 'Monitor your domain reputation'
          : 'Configure SMTP to establish domain reputation',
      weight: 15,
    });

    return indicators;
  };

  const spamIndicators = analyzeSpamIndicators();

  // Calculate spam score (0-100 where 100 = definitely not spam)
  const calculateSpamScore = (): number => {
    let score = 0;
    let totalWeight = 0;

    spamIndicators.forEach(indicator => {
      totalWeight += indicator.weight;
      if (indicator.status === 'good') {
        score += indicator.weight;
      } else if (indicator.status === 'warning') {
        score += indicator.weight * 0.5;
      }
    });

    return Math.round((score / totalWeight) * 100);
  };

  const spamScore = calculateSpamScore();

  // Calculate overall deliverability score (0-100)
  const calculateScore = () => {
    if (totalSent === 0) return smtpConfigured ? 85 : 50;
    
    let score = 100;
    score -= bounceRate * 2;
    if (openRate > 20) score += 5;
    if (openRate > 30) score += 5;
    if (clickRate > 5) score += 3;
    if (replyRate > 2) score += 5;
    if (smtpConfigured) score += 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const score = calculateScore();

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500';
    if (s >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'from-emerald-500/20 to-emerald-500/5';
    if (s >= 70) return 'from-amber-500/20 to-amber-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 80) return 'Good';
    if (s >= 70) return 'Fair';
    if (s >= 50) return 'Needs Work';
    return 'Poor';
  };

  const getSpamRisk = (s: number) => {
    if (s >= 80) return { label: 'Low Risk', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    if (s >= 60) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500' };
    return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const spamRisk = getSpamRisk(spamScore);

  // Generate smart tips
  const generateTips = (): DeliverabilityTip[] => {
    const tips: DeliverabilityTip[] = [];

    if (!smtpConfigured) {
      tips.push({
        id: 'smtp',
        title: 'Configure Your SMTP Server',
        description: 'Set up your own email server for better deliverability.',
        impact: 'high',
        icon: Server,
        actionLabel: 'Configure SMTP',
        onAction: onConfigureSMTP,
      });
    }

    if (bounceRate > 5) {
      tips.push({
        id: 'bounces',
        title: 'Reduce Bounce Rate',
        description: `Your bounce rate is ${bounceRate.toFixed(1)}%. Verify email addresses before sending.`,
        impact: 'high',
        icon: XCircle,
      });
    }

    if (totalSent > 10 && openRate < 15) {
      tips.push({
        id: 'opens',
        title: 'Improve Subject Lines',
        description: 'Your open rate is below average. Try more compelling subject lines.',
        impact: 'medium',
        icon: Mail,
      });
    }

    if (bounceRate <= 2 && totalSent > 0) {
      tips.push({
        id: 'clean-list',
        title: 'Great List Hygiene!',
        description: 'Your low bounce rate shows excellent email list quality.',
        impact: 'low',
        icon: CheckCircle2,
      });
    }

    if (totalSent === 0) {
      tips.push({
        id: 'start-sending',
        title: 'Start Your First Campaign',
        description: 'Send your first emails to start tracking metrics.',
        impact: 'medium',
        icon: Send,
      });
    }

    tips.push({
      id: 'warmup',
      title: 'Warm Up New Domains',
      description: 'Gradually increase sending volume over 2-4 weeks.',
      impact: 'medium',
      icon: TrendingUp,
    });

    tips.push({
      id: 'auth',
      title: 'Set Up Email Authentication',
      description: 'Configure SPF, DKIM, and DMARC records for your domain.',
      impact: 'high',
      icon: Shield,
    });

    return tips.slice(0, 4);
  };

  const tips = generateTips();

  const impactColors = {
    high: 'bg-red-500/10 text-red-600 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  const statusColors = {
    good: { bg: 'bg-emerald-500', text: 'text-emerald-600', icon: CheckCircle2 },
    warning: { bg: 'bg-amber-500', text: 'text-amber-600', icon: AlertTriangle },
    bad: { bg: 'bg-red-500', text: 'text-red-600', icon: XCircle },
  };

  // Compact version for embedding
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Score Row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${getScoreBg(score)} flex items-center justify-center`}>
              <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Deliverability</p>
              <Badge className={`text-xs ${score >= 70 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                {getScoreLabel(score)}
              </Badge>
            </div>
          </div>

          <Separator orientation="vertical" className="h-12" />

          <div className="flex items-center gap-3">
            <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${getScoreBg(spamScore)} flex items-center justify-center`}>
              <Shield className={`w-6 h-6 ${getScoreColor(spamScore)}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Spam Score</p>
              <Badge className={`text-xs ${spamScore >= 70 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                {spamRisk.label}
              </Badge>
            </div>
          </div>

          <Separator orientation="vertical" className="h-12" />

          <div className="flex items-center gap-3">
            <div className={`relative w-14 h-14 rounded-full ${bounceRate < 5 ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
              <span className={`text-xl font-bold ${bounceRate < 5 ? 'text-emerald-500' : 'text-red-500'}`}>
                {bounceRate.toFixed(1)}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">Bounce Rate</p>
              <Badge className={`text-xs ${bounceRate < 5 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'}`}>
                {bounceRate < 2 ? 'Excellent' : bounceRate < 5 ? 'Good' : 'High'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Send className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{totalSent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-500/5">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-600">{deliveryRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/5">
            <Eye className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-blue-600">{openRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Opened</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/5">
            <MousePointer className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold text-purple-600">{clickRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Clicked</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${bounceRate > 5 ? 'bg-red-500/5' : 'bg-muted/50'}`}>
            <XCircle className={`w-4 h-4 mx-auto mb-1 ${bounceRate > 5 ? 'text-red-500' : 'text-muted-foreground'}`} />
            <p className={`text-lg font-bold ${bounceRate > 5 ? 'text-red-600' : ''}`}>{totalBounced}</p>
            <p className="text-xs text-muted-foreground">Bounced</p>
          </div>
        </div>

        {/* Top Tip */}
        {tips.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">
              <strong className="text-foreground">{tips[0].title}:</strong> {tips[0].description}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Email Deliverability</CardTitle>
              <CardDescription>Monitor your email health and spam score</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadStats} className="gap-1">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score" className="gap-1">
              <Gauge className="w-4 h-4" />
              Score
            </TabsTrigger>
            <TabsTrigger value="spam" className="gap-1">
              <Shield className="w-4 h-4" />
              Spam Analysis
            </TabsTrigger>
            <TabsTrigger value="tips" className="gap-1">
              <Lightbulb className="w-4 h-4" />
              Tips
            </TabsTrigger>
          </TabsList>

          {/* Score Tab */}
          <TabsContent value="score" className="space-y-4 mt-4">
            <div className={`p-6 rounded-xl bg-gradient-to-br ${getScoreBg(score)} border`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Deliverability Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Badge className={`mt-2 ${score >= 70 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                    {getScoreLabel(score)}
                  </Badge>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                    <motion.circle
                      cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                      className={getScoreColor(score)}
                      initial={{ strokeDasharray: '0 251.2' }}
                      animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {score >= 70 ? <CheckCircle2 className={`w-8 h-8 ${getScoreColor(score)}`} /> : <AlertTriangle className={`w-8 h-8 ${getScoreColor(score)}`} />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalSent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{deliveryRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${bounceRate > 5 ? 'text-red-500' : 'text-muted-foreground'}`}>{bounceRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Bounced</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{openRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${smtpConfigured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${smtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    <Server className={`w-5 h-5 ${smtpConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Your SMTP Server</p>
                    <p className="text-sm text-muted-foreground">
                      {smtpConfigured ? 'Emails sent from YOUR server' : 'Configure SMTP to send from your domain'}
                    </p>
                  </div>
                </div>
                {smtpConfigured ? (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Button size="sm" onClick={onConfigureSMTP} className="gap-1">
                    Configure <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Spam Analysis Tab */}
          <TabsContent value="spam" className="space-y-4 mt-4">
            <div className={`p-6 rounded-xl bg-gradient-to-br ${getScoreBg(spamScore)} border`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Spam Risk Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(spamScore)}`}>{spamScore}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Badge className={`mt-2 ${spamScore >= 70 ? 'bg-emerald-500/20 text-emerald-600' : spamScore >= 50 ? 'bg-amber-500/20 text-amber-600' : 'bg-red-500/20 text-red-600'}`}>
                    {spamRisk.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {spamScore >= 70 ? <ThumbsUp className="w-8 h-8 text-emerald-500" /> : spamScore >= 50 ? <AlertCircle className="w-8 h-8 text-amber-500" /> : <ThumbsDown className="w-8 h-8 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {spamScore >= 70 ? 'Likely to land in inbox' : spamScore >= 50 ? 'May land in spam' : 'High spam risk'}
                  </p>
                </div>
              </div>

              <Progress value={spamScore} className="h-3" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>High Spam Risk</span>
                <span>Low Spam Risk</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                Spam Indicators
              </h4>
              {spamIndicators.map((indicator, index) => {
                const statusStyle = statusColors[indicator.status];
                const StatusIcon = statusStyle.icon;
                return (
                  <motion.div
                    key={indicator.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                        <span className="font-medium text-sm">{indicator.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        indicator.status === 'good' ? 'border-emerald-500/30 text-emerald-600' :
                        indicator.status === 'warning' ? 'border-amber-500/30 text-amber-600' :
                        'border-red-500/30 text-red-600'
                      }`}>
                        {indicator.status === 'good' ? 'Pass' : indicator.status === 'warning' ? 'Warning' : 'Fail'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{indicator.description}</p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Progress value={indicator.status === 'good' ? 100 : indicator.status === 'warning' ? 50 : 0} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{indicator.weight}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4 mt-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <tip.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{tip.title}</p>
                          <Badge variant="outline" className={`text-xs ${impactColors[tip.impact]}`}>
                            {tip.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                        {tip.actionLabel && tip.onAction && (
                          <Button variant="link" size="sm" onClick={tip.onAction} className="h-auto p-0 mt-1 text-xs">
                            {tip.actionLabel} →
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}