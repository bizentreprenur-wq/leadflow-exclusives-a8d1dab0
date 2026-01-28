import { useEffect, useState } from 'react';
import { Download, Sparkles, Zap } from 'lucide-react';

interface StreamingLeadsIndicatorProps {
  currentCount: number;
  isStreaming: boolean;
  progress: number;
  requestedCount?: number;
}

export default function StreamingLeadsIndicator({
  currentCount,
  isStreaming,
  progress,
  requestedCount,
}: StreamingLeadsIndicatorProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate count changes with a ticker effect
  useEffect(() => {
    if (currentCount > displayCount) {
      setIsAnimating(true);
      const diff = currentCount - displayCount;
      const step = Math.ceil(diff / 10); // Animate in ~10 steps
      const timer = setInterval(() => {
        setDisplayCount(prev => {
          const next = Math.min(prev + step, currentCount);
          if (next >= currentCount) {
            clearInterval(timer);
            setTimeout(() => setIsAnimating(false), 300);
            return currentCount;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayCount(currentCount);
    }
  }, [currentCount]);

  // Track when new batch arrives
  useEffect(() => {
    if (currentCount > prevCount && prevCount > 0) {
      // New batch arrived!
      setPrevCount(currentCount);
    } else if (currentCount > prevCount) {
      setPrevCount(currentCount);
    }
  }, [currentCount, prevCount]);

  if (!isStreaming && currentCount === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10">
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
      
      <div className="relative flex items-center justify-between p-4">
        {/* Left: Animation and text */}
        <div className="flex items-center gap-4">
          {/* Animated download icon */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center ${isStreaming ? 'animate-pulse' : ''}`}>
              <Download className={`w-6 h-6 text-primary ${isStreaming ? 'animate-bounce' : ''}`} />
            </div>
            {isStreaming && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center animate-ping">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            )}
          </div>

          {/* Text content */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    Leads Arriving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    Search Complete!
                  </span>
                )}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isStreaming ? (
                'Streaming results from Google Maps API'
              ) : requestedCount && currentCount !== requestedCount ? (
                `Found ${currentCount} of ${requestedCount} requested businesses`
              ) : (
                `Found ${currentCount} businesses ready for outreach`
              )}
            </p>
          </div>
        </div>

        {/* Center: Live counter */}
        <div className="flex items-center gap-6">
          <div className={`flex flex-col items-center transition-transform duration-200 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tabular-nums transition-colors duration-200 ${isAnimating ? 'text-emerald-400' : 'text-primary'}`}>
                {displayCount}
              </span>
              {isStreaming && (
                <span className="text-lg text-emerald-400 animate-pulse font-bold">+</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {requestedCount ? `Leads Found / ${requestedCount}` : 'Leads Found'}
            </span>
          </div>
          {requestedCount && (
            <div className="text-xs text-muted-foreground">
              Target: {requestedCount}
            </div>
          )}

          {/* Progress circle */}
          {isStreaming && (
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status dots */}
        <div className="flex items-center gap-3">
          {isStreaming ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">STREAMING</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-primary">COMPLETE</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom progress bar */}
      {isStreaming && (
        <div className="h-1 bg-muted/30">
          <div 
            className="h-full bg-gradient-to-r from-primary via-emerald-500 to-primary transition-all duration-300 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      )}
    </div>
  );
}
