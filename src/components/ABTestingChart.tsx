import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, Trophy, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TemplateVariant {
  id: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  isWinner: boolean;
}

interface ABTestingChartProps {
  campaignId?: string;
}

export default function ABTestingChart({ campaignId }: ABTestingChartProps) {
  const [variants, setVariants] = useState<TemplateVariant[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'openRate' | 'clickRate' | 'replyRate'>('openRate');

  useEffect(() => {
    // Load from localStorage or use demo data
    const stored = localStorage.getItem('bamlead_ab_tests');
    if (stored) {
      setVariants(JSON.parse(stored));
    } else {
      // Demo data
      const variantA: TemplateVariant = {
        id: 'a',
        name: 'Template A - Professional',
        sent: 150,
        opened: 68,
        clicked: 28,
        replied: 12,
        openRate: 45.3,
        clickRate: 18.7,
        replyRate: 8.0,
        isWinner: false,
      };
      const variantB: TemplateVariant = {
        id: 'b',
        name: 'Template B - Casual',
        sent: 150,
        opened: 82,
        clicked: 35,
        replied: 18,
        openRate: 54.7,
        clickRate: 23.3,
        replyRate: 12.0,
        isWinner: true,
      };
      setVariants([variantA, variantB]);
    }
  }, [campaignId]);

  const metrics = [
    { key: 'openRate', label: 'Open Rate', color: 'bg-amber-500' },
    { key: 'clickRate', label: 'Click Rate', color: 'bg-purple-500' },
    { key: 'replyRate', label: 'Reply Rate', color: 'bg-pink-500' },
  ];

  const winner = variants.find(v => v.isWinner);
  const loser = variants.find(v => !v.isWinner);
  const improvement = winner && loser 
    ? Math.round(((winner[selectedMetric] - loser[selectedMetric]) / loser[selectedMetric]) * 100)
    : 0;

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">A/B Test Results</h3>
        </div>
        {winner && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
            <Trophy className="w-3 h-3" />
            Winner: {winner.name.split(' - ')[1]}
          </Badge>
        )}
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 mb-4">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m.key as any)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              selectedMetric === m.key
                ? `${m.color} text-white`
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Comparison bars */}
      <div className="space-y-4">
        {variants.map((variant, idx) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-4 rounded-xl border transition-all",
              variant.isWinner 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-muted/30 border-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  variant.isWinner ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {variant.id.toUpperCase()}
                </div>
                <span className="font-medium text-foreground">{variant.name}</span>
                {variant.isWinner && (
                  <Trophy className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <span className="text-lg font-bold text-foreground">
                {variant[selectedMetric].toFixed(1)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${variant[selectedMetric]}%` }}
                transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                className={cn(
                  "h-full rounded-full",
                  variant.isWinner 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                    : "bg-gradient-to-r from-slate-400 to-slate-500"
                )}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                { label: 'Sent', value: variant.sent },
                { label: 'Opened', value: variant.opened },
                { label: 'Clicked', value: variant.clicked },
                { label: 'Replied', value: variant.replied },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-sm font-semibold text-foreground">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Improvement indicator */}
      {improvement > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-muted-foreground">
            Template B outperforms by <span className="font-bold text-emerald-400">+{improvement}%</span>
          </span>
        </div>
      )}
    </div>
  );
}
