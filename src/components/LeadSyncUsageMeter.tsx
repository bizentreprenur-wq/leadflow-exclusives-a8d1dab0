import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare, Users, Zap, Crown, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LEADSYNC_PLANS, LeadSyncTier, formatLimit } from '@/lib/leadsyncPricing';

interface UsageData {
  leadsUsed: number;
  emailsSent: number;
  smsSent: number;
  callMinutesUsed: number;
  sequencesActive: number;
}

interface LeadSyncUsageMeterProps {
  tier: LeadSyncTier;
  usage: UsageData;
  onUpgrade: () => void;
}

export default function LeadSyncUsageMeter({
  tier,
  usage,
  onUpgrade,
}: LeadSyncUsageMeterProps) {
  const plan = LEADSYNC_PLANS[tier];
  const { features } = plan;

  const getUsagePercent = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getStatusColor = (percent: number): string => {
    if (percent >= 90) return 'text-red-400';
    if (percent >= 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getProgressColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const metrics = [
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      used: usage.leadsUsed,
      limit: features.leadsPerMonth,
      color: 'text-blue-400',
    },
    {
      id: 'emails',
      label: 'Emails',
      icon: Mail,
      used: usage.emailsSent,
      limit: features.emailsPerMonth,
      color: 'text-emerald-400',
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: MessageSquare,
      used: usage.smsSent,
      limit: features.smsPerMonth,
      color: 'text-amber-400',
    },
    {
      id: 'calls',
      label: 'AI Calls',
      icon: Phone,
      used: usage.callMinutesUsed,
      limit: features.aiCallMinutes,
      color: 'text-violet-400',
      suffix: 'min',
    },
    {
      id: 'sequences',
      label: 'Sequences',
      icon: Zap,
      used: usage.sequencesActive,
      limit: features.sequences,
      color: 'text-cyan-400',
    },
  ];

  const tierBadgeColors = {
    starter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pro: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    agency: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const isNearLimit = metrics.some(m => {
    if (m.limit === -1) return false;
    return getUsagePercent(m.used, m.limit) >= 80;
  });

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg text-white">Usage This Month</CardTitle>
            <Badge className={tierBadgeColors[tier]}>
              <Crown className="w-3 h-3 mr-1" />
              {plan.name}
            </Badge>
          </div>
          {tier !== 'agency' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUpgrade}
              className="gap-1.5 border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
            >
              Upgrade
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => {
          const percent = getUsagePercent(metric.used, metric.limit);
          const isUnlimited = metric.limit === -1;
          const Icon = metric.icon;

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-slate-300">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={isUnlimited ? 'text-emerald-400' : getStatusColor(percent)}>
                    {metric.used.toLocaleString()}
                    {metric.suffix ? ` ${metric.suffix}` : ''}
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400">
                    {isUnlimited ? '∞' : `${formatLimit(metric.limit)}${metric.suffix ? ` ${metric.suffix}` : ''}`}
                  </span>
                </div>
              </div>
              
              {!isUnlimited ? (
                <div className="relative">
                  <Progress 
                    value={percent} 
                    className="h-2 bg-slate-800"
                  />
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(percent)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : (
                <div className="h-2 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-emerald-400/70 font-medium">UNLIMITED</span>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Upgrade Prompt */}
        {isNearLimit && tier !== 'agency' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Zap className="w-4 h-4" />
              <span>You're approaching your limits!</span>
            </div>
            <p className="text-xs text-amber-400/70 mt-1">
              Upgrade to {tier === 'starter' ? 'Pro' : 'Agency'} for more capacity and features.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
