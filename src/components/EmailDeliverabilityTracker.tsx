import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Mail,
  Shield,
  Server,
  Zap,
  Target,
  XCircle,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Send,
  BarChart3,
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

interface EmailDeliverabilityTrackerProps {
  onConfigureSMTP?: () => void;
  smtpConfigured?: boolean;
}

export default function EmailDeliverabilityTracker({ 
  onConfigureSMTP,
  smtpConfigured = false 
}: EmailDeliverabilityTrackerProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100) : 100;
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100) : 0;
  const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100) : 0;
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;

  // Calculate overall deliverability score (0-100)
  const calculateScore = () => {
    if (totalSent === 0) return 100; // No data yet, assume good
    
    let score = 100;
    
    // Deduct for bounces (major impact)
    score -= bounceRate * 2;
    
    // Bonus for good open rates
    if (openRate > 20) score += 5;
    if (openRate > 30) score += 5;
    
    // Bonus for clicks
    if (clickRate > 5) score += 3;
    
    // Bonus for SMTP being configured
    if (smtpConfigured) score += 5;
    
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

  // Generate smart tips based on current stats
  const generateTips = (): DeliverabilityTip[] => {
    const tips: DeliverabilityTip[] = [];

    // SMTP Configuration check
    if (!smtpConfigured) {
      tips.push({
        id: 'smtp',
        title: 'Configure Your SMTP Server',
        description: 'Set up your own email server for better deliverability. Emails from your domain are more trusted.',
        impact: 'high',
        icon: Server,
        actionLabel: 'Configure SMTP',
        onAction: onConfigureSMTP,
      });
    }

    // High bounce rate
    if (bounceRate > 5) {
      tips.push({
        id: 'bounces',
        title: 'Reduce Bounce Rate',
        description: `Your bounce rate is ${bounceRate.toFixed(1)}%. Verify email addresses before sending and remove invalid ones.`,
        impact: 'high',
        icon: XCircle,
      });
    }

    // Low open rate
    if (totalSent > 10 && openRate < 15) {
      tips.push({
        id: 'opens',
        title: 'Improve Subject Lines',
        description: 'Your open rate is below average. Try more compelling, personalized subject lines.',
        impact: 'medium',
        icon: Mail,
      });
    }

    // Good practices
    if (bounceRate <= 2 && totalSent > 0) {
      tips.push({
        id: 'clean-list',
        title: 'Great List Hygiene!',
        description: 'Your low bounce rate shows excellent email list quality. Keep it up!',
        impact: 'low',
        icon: CheckCircle2,
      });
    }

    // Send volume tips
    if (totalSent === 0) {
      tips.push({
        id: 'start-sending',
        title: 'Start Your First Campaign',
        description: 'Send your first emails to start tracking deliverability metrics.',
        impact: 'medium',
        icon: Send,
      });
    }

    // Domain reputation
    tips.push({
      id: 'warmup',
      title: 'Warm Up New Domains',
      description: 'If using a new domain, gradually increase sending volume over 2-4 weeks.',
      impact: 'medium',
      icon: TrendingUp,
    });

    // Authentication
    tips.push({
      id: 'auth',
      title: 'Set Up Email Authentication',
      description: 'Configure SPF, DKIM, and DMARC records for your domain to improve trust.',
      impact: 'high',
      icon: Shield,
    });

    return tips.slice(0, 4); // Show max 4 tips
  };

  const tips = generateTips();

  const impactColors = {
    high: 'bg-red-500/10 text-red-600 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

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
              <CardDescription>Monitor your email health and improve delivery</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadStats} className="gap-1">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Deliverability Score */}
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
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={getScoreColor(score)}
                  initial={{ strokeDasharray: '0 251.2' }}
                  animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {score >= 70 ? (
                  <CheckCircle2 className={`w-8 h-8 ${getScoreColor(score)}`} />
                ) : (
                  <AlertTriangle className={`w-8 h-8 ${getScoreColor(score)}`} />
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
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
              <p className={`text-2xl font-bold ${bounceRate > 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {bounceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Bounced</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{openRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Opened</p>
            </div>
          </div>
        </div>

        {/* SMTP Status */}
        <div className={`p-4 rounded-lg border-2 ${smtpConfigured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${smtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                <Server className={`w-5 h-5 ${smtpConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="font-medium">Your SMTP Server</p>
                <p className="text-sm text-muted-foreground">
                  {smtpConfigured 
                    ? 'Emails are sent from YOUR server for better deliverability' 
                    : 'Configure SMTP to send from your domain'}
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

        <Separator />

        {/* Tips Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Improvement Tips</h3>
          </div>

          <ScrollArea className="h-[200px]">
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
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={tip.onAction}
                          className="h-auto p-0 mt-1 text-xs"
                        >
                          {tip.actionLabel} →
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
