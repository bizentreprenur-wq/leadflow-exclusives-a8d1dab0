import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Clock, Calendar, TrendingUp, Zap, Brain, BarChart3,
  CheckCircle2, Settings2, Sun, Moon, Coffee
} from 'lucide-react';

interface OpenRateData {
  hour: number;
  day: string;
  openRate: number;
  clickRate: number;
  sends: number;
}

interface SmartScheduleRecommendation {
  bestHour: number;
  bestDay: string;
  expectedOpenRate: number;
  expectedClickRate: number;
  reasoning: string;
}

interface SmartSchedulingEngineProps {
  hasSubscription: boolean;
  onScheduleApply: (schedule: { hour: number; day: string }[]) => void;
}

// Mock historical data - in production this would come from your email analytics
const generateMockOpenRateData = (): OpenRateData[] => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const data: OpenRateData[] = [];
  
  days.forEach(day => {
    for (let hour = 6; hour <= 21; hour++) {
      // Higher open rates during business hours
      let baseOpenRate = 15;
      let baseClickRate = 3;
      
      // Peak hours: 9-11 AM and 2-4 PM
      if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
        baseOpenRate += 15 + Math.random() * 10;
        baseClickRate += 3 + Math.random() * 2;
      } else if (hour >= 7 && hour <= 18) {
        baseOpenRate += 8 + Math.random() * 8;
        baseClickRate += 1.5 + Math.random() * 1.5;
      }
      
      // Tuesday-Thursday have best rates
      if (['Tuesday', 'Wednesday', 'Thursday'].includes(day)) {
        baseOpenRate += 5;
        baseClickRate += 1;
      }
      
      // Weekend drops
      if (['Saturday', 'Sunday'].includes(day)) {
        baseOpenRate *= 0.6;
        baseClickRate *= 0.5;
      }
      
      data.push({
        hour,
        day,
        openRate: Math.min(55, baseOpenRate),
        clickRate: Math.min(12, baseClickRate),
        sends: Math.floor(50 + Math.random() * 100),
      });
    }
  });
  
  return data;
};

export default function SmartSchedulingEngine({
  hasSubscription,
  onScheduleApply,
}: SmartSchedulingEngineProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [historicalData] = useState<OpenRateData[]>(generateMockOpenRateData);
  const [recommendation, setRecommendation] = useState<SmartScheduleRecommendation | null>(null);

  // Calculate best times from historical data
  const topTimeSlots = useMemo(() => {
    return [...historicalData]
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 6);
  }, [historicalData]);

  // Generate AI recommendation
  const analyzeAndRecommend = async () => {
    if (!hasSubscription) {
      toast.error('Smart Scheduling requires AI Autopilot Campaign subscription');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bestSlot = topTimeSlots[0];
    setRecommendation({
      bestHour: bestSlot.hour,
      bestDay: bestSlot.day,
      expectedOpenRate: bestSlot.openRate,
      expectedClickRate: bestSlot.clickRate,
      reasoning: `Based on ${historicalData.reduce((sum, d) => sum + d.sends, 0)} historical sends, ${bestSlot.day} at ${formatHour(bestSlot.hour)} shows ${bestSlot.openRate.toFixed(1)}% open rate - ${((bestSlot.openRate / 22) * 100 - 100).toFixed(0)}% above average.`,
    });
    
    setIsAnalyzing(false);
    toast.success('AI analyzed your historical data!');
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
    if (hour >= 12 && hour < 18) return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
    return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const handleApplySchedule = () => {
    if (!recommendation) return;
    
    // Create a week-long schedule based on top slots
    const schedule = topTimeSlots.slice(0, 5).map(slot => ({
      hour: slot.hour,
      day: slot.day,
    }));
    
    onScheduleApply(schedule);
    toast.success('Smart schedule applied to your campaign!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Smart Scheduling
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[9px]">
                AI
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Optimize delivery times for maximum opens
            </p>
          </div>
        </div>

        {/* Auto-schedule toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Auto-schedule</span>
          <Switch
            checked={autoScheduleEnabled}
            onCheckedChange={(v) => {
              if (!hasSubscription) {
                toast.error('Requires AI Autopilot Campaign subscription');
                return;
              }
              setAutoScheduleEnabled(v);
              if (v) toast.success('Auto-scheduling enabled for all campaigns');
            }}
            disabled={!hasSubscription}
            className={cn(
              "data-[state=checked]:bg-blue-500",
              !hasSubscription && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {/* Analyze Button */}
      <Button
        onClick={analyzeAndRecommend}
        disabled={!hasSubscription || isAnalyzing}
        className={cn(
          "w-full gap-2",
          hasSubscription
            ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isAnalyzing ? (
          <>
            <Clock className="w-4 h-4 animate-spin" />
            Analyzing historical data...
          </>
        ) : (
          <>
            <BarChart3 className="w-4 h-4" />
            Analyze Best Send Times
          </>
        )}
      </Button>

      {/* AI Recommendation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-foreground">AI Recommendation</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleApplySchedule}
                  className="gap-1.5 bg-blue-500 hover:bg-blue-600"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{recommendation.bestDay}</p>
                  <p className="text-[10px] text-muted-foreground">Best Day</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{formatHour(recommendation.bestHour)}</p>
                  <p className="text-[10px] text-muted-foreground">Best Time</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-emerald-400">{recommendation.expectedOpenRate.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">Open Rate</p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded-lg">
                💡 {recommendation.reasoning}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Time Slots */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Top Performing Time Slots
        </p>
        <div className="grid grid-cols-2 gap-2">
          {topTimeSlots.map((slot, idx) => (
            <div
              key={`${slot.day}-${slot.hour}`}
              className={cn(
                "p-3 rounded-lg border transition-all",
                idx === 0 
                  ? "bg-blue-500/10 border-blue-500/30" 
                  : "bg-muted/30 border-border",
                !hasSubscription && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getTimeIcon(slot.hour)}
                  <span className="text-sm font-medium text-foreground">{slot.day}</span>
                </div>
                {idx === 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 text-[9px]">Best</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatHour(slot.hour)}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-emerald-400">{slot.openRate.toFixed(1)}% open</span>
                <span className="text-[10px] text-blue-400">{slot.clickRate.toFixed(1)}% click</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Preview */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Weekly Open Rate Heatmap
        </p>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center">
              <p className="text-[9px] text-muted-foreground mb-1">{day}</p>
              <div className="space-y-0.5">
                {[9, 11, 14, 16].map((hour) => {
                  const data = historicalData.find(
                    d => d.day.startsWith(day === 'Thu' ? 'Thursday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Mon' ? 'Monday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday') && d.hour === hour
                  );
                  const intensity = data ? data.openRate / 50 : 0.2;
                  return (
                    <div
                      key={hour}
                      className="h-4 rounded-sm"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${Math.min(1, intensity)})`,
                      }}
                      title={data ? `${data.openRate.toFixed(1)}% open rate` : ''}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500/20" /> Low
          </span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" /> Medium
          </span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500" /> High
          </span>
        </div>
      </div>
    </div>
  );
}
