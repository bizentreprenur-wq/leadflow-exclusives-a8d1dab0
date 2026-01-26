import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MousePointer, Link2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LinkClick {
  url: string;
  label: string;
  clicks: number;
  percentage: number;
}

interface ClickHeatmapChartProps {
  campaignId?: string;
}

export default function ClickHeatmapChart({ campaignId }: ClickHeatmapChartProps) {
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);

  useEffect(() => {
    // Load from localStorage or use demo data
    const stored = localStorage.getItem('bamlead_click_heatmap');
    if (stored) {
      setLinkClicks(JSON.parse(stored));
    } else {
      // Demo data
      setLinkClicks([
        { url: 'https://example.com/book-call', label: 'Book a Call CTA', clicks: 47, percentage: 42 },
        { url: 'https://example.com/pricing', label: 'View Pricing', clicks: 28, percentage: 25 },
        { url: 'https://example.com/portfolio', label: 'Portfolio Link', clicks: 18, percentage: 16 },
        { url: 'https://example.com/case-study', label: 'Case Study', clicks: 12, percentage: 11 },
        { url: 'https://example.com/unsubscribe', label: 'Unsubscribe', clicks: 7, percentage: 6 },
      ]);
    }
  }, [campaignId]);

  const getHeatColor = (percentage: number) => {
    if (percentage >= 40) return 'from-red-500 to-orange-500';
    if (percentage >= 25) return 'from-orange-500 to-amber-500';
    if (percentage >= 15) return 'from-amber-500 to-yellow-500';
    if (percentage >= 10) return 'from-yellow-500 to-lime-500';
    return 'from-lime-500 to-green-500';
  };

  const totalClicks = linkClicks.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Click Heatmap</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {totalClicks} total clicks
        </Badge>
      </div>

      <div className="space-y-3">
        {linkClicks.map((link, idx) => (
          <motion.div
            key={link.url}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br",
                getHeatColor(link.percentage)
              )}>
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">{link.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{link.clicks}</span>
                    <span className="text-xs text-muted-foreground">({link.percentage}%)</span>
                  </div>
                </div>
                
                {/* Heatmap bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${link.percentage}%` }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                    className={cn("h-full rounded-full bg-gradient-to-r", getHeatColor(link.percentage))}
                  />
                </div>
              </div>
              
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Heat legend */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-4">
        <span className="text-xs text-muted-foreground">Engagement:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded bg-gradient-to-r from-green-500 to-lime-500" />
          <span className="text-[10px] text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded bg-gradient-to-r from-amber-500 to-yellow-500" />
          <span className="text-[10px] text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 rounded bg-gradient-to-r from-red-500 to-orange-500" />
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
