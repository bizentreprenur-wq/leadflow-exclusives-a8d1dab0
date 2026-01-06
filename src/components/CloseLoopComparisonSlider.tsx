import { useState, useRef, useEffect } from "react";
import { 
  X, Check, TrendingUp, TrendingDown, 
  Phone, Mail, Calendar, DollarSign,
  AlertTriangle, CheckCircle2
} from "lucide-react";

interface MetricProps {
  label: string;
  withoutValue: string;
  withValue: string;
  icon: React.ReactNode;
  isPositive?: boolean;
}

const Metric = ({ label, withoutValue, withValue, icon, isPositive = true }: MetricProps) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-red-400 line-through text-sm">{withoutValue}</span>
        <TrendingUp className={`w-3 h-3 ${isPositive ? 'text-emerald-500' : 'text-red-400'}`} />
        <span className="text-emerald-400 font-semibold">{withValue}</span>
      </div>
    </div>
  </div>
);

const CloseLoopComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-animate on mount
  useEffect(() => {
    const autoAnimate = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Animate slider from left to right
      for (let i = 20; i <= 80; i += 2) {
        setSliderPosition(i);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      // Return to center
      for (let i = 80; i >= 50; i -= 2) {
        setSliderPosition(i);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    };
    autoAnimate();
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setSliderPosition(percentage);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          See the <span className="closeloop-text">CloseLoop™</span> Difference
        </h3>
        <p className="text-muted-foreground">
          Drag the slider to compare conversion rates
        </p>
      </div>

      {/* Comparison Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[16/10] md:aspect-[16/8] rounded-2xl overflow-hidden border border-border select-none cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Without CloseLoop (Left Side) */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-bold text-red-400">Without CloseLoop™</h4>
                <p className="text-xs text-slate-400">Traditional lead handling</p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">30-50% leads go cold</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Phone className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Leads don't answer</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">25% no-show rate</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <DollarSign className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Lost revenue = $10k+/month</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400">15%</div>
              <div className="text-sm text-slate-400">Close Rate</div>
            </div>
          </div>
        </div>

        {/* With CloseLoop (Right Side) */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-amber-950/50 to-slate-900"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full closeloop-gradient flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold closeloop-text">With CloseLoop™</h4>
                <p className="text-xs text-slate-400">AI-powered follow-up</p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Auto-retargeting ads</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">AI behavior-based ads</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">8% no-show rate</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Recovered revenue = $25k+/month</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl closeloop-gradient">
              <div className="text-3xl font-bold text-white">42%</div>
              <div className="text-sm text-white/80">Close Rate</div>
            </div>
          </div>
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
              <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 rounded-xl bg-card border border-border">
          <div className="text-2xl font-bold closeloop-text">+180%</div>
          <div className="text-sm text-muted-foreground">Close Rate Increase</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-card border border-border">
          <div className="text-2xl font-bold closeloop-text">-68%</div>
          <div className="text-sm text-muted-foreground">No-Show Reduction</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-card border border-border">
          <div className="text-2xl font-bold closeloop-text">$25k+</div>
          <div className="text-sm text-muted-foreground">Recovered Monthly</div>
        </div>
      </div>
    </div>
  );
};

export default CloseLoopComparisonSlider;
