import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const ROICalculatorSection = () => {
  const [leadsPerMonth, setLeadsPerMonth] = useState(100);
  const [avgDealValue, setAvgDealValue] = useState(2500);
  const [currentConversion, setCurrentConversion] = useState(2);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(true);

  // BamLead improves conversion by ~3x based on verified leads
  const improvedConversion = Math.min(currentConversion * 3, 15);
  
  // Current revenue calculation
  const currentMonthlyDeals = Math.floor(leadsPerMonth * (currentConversion / 100));
  const currentMonthlyRevenue = currentMonthlyDeals * avgDealValue;
  
  // With BamLead
  const improvedMonthlyDeals = Math.floor(leadsPerMonth * (improvedConversion / 100));
  const improvedMonthlyRevenue = improvedMonthlyDeals * avgDealValue;
  
  // ROI metrics
  const additionalRevenue = improvedMonthlyRevenue - currentMonthlyRevenue;
  const yearlyAdditionalRevenue = additionalRevenue * 12;
  const timeSavedPerLead = 15; // minutes
  const totalTimeSaved = leadsPerMonth * timeSavedPerLead;
  const hoursSaved = Math.floor(totalTimeSaved / 60);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [leadsPerMonth, avgDealValue, currentConversion]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <section data-tour="roi-calculator" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-30" />
      
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Calculator className="w-3 h-3 mr-1" />
            ROI Calculator
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Calculate Your <span className="text-primary">Revenue Potential</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how much more revenue you could generate with AI-verified leads and automated outreach
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Calculator Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Your Business Metrics</h3>
                    <p className="text-sm text-muted-foreground">Adjust the sliders to match your situation</p>
                  </div>
                </div>

                {/* Leads per month slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Users className="w-4 h-4 text-primary" />
                      Leads Contacted per Month
                    </label>
                    <span className="text-2xl font-bold text-primary">{formatNumber(leadsPerMonth)}</span>
                  </div>
                  <Slider
                    value={[leadsPerMonth]}
                    onValueChange={(value) => setLeadsPerMonth(value[0])}
                    min={10}
                    max={1000}
                    step={10}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>1,000</span>
                  </div>
                </div>

                {/* Average deal value slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Average Deal Value
                    </label>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(avgDealValue)}</span>
                  </div>
                  <Slider
                    value={[avgDealValue]}
                    onValueChange={(value) => setAvgDealValue(value[0])}
                    min={500}
                    max={50000}
                    step={500}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$500</span>
                    <span>$50,000</span>
                  </div>
                </div>

                {/* Current conversion rate slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Target className="w-4 h-4 text-primary" />
                      Current Conversion Rate
                    </label>
                    <span className="text-2xl font-bold text-primary">{currentConversion}%</span>
                  </div>
                  <Slider
                    value={[currentConversion]}
                    onValueChange={(value) => setCurrentConversion(value[0])}
                    min={1}
                    max={10}
                    step={0.5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-card/80 to-card/50 backdrop-blur-sm border-primary/30 h-full">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Your ROI with BamLead</h3>
                    <p className="text-sm text-muted-foreground">Projected improvement based on verified leads</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {showResults && !isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      {/* Main ROI highlight */}
                      <div className="bg-primary/20 rounded-2xl p-6 text-center border border-primary/30">
                        <p className="text-sm text-muted-foreground mb-2">Additional Annual Revenue</p>
                        <motion.div
                          key={yearlyAdditionalRevenue}
                          initial={{ scale: 1.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl md:text-5xl font-bold text-primary"
                        >
                          {formatCurrency(yearlyAdditionalRevenue)}
                        </motion.div>
                        <p className="text-xs text-muted-foreground mt-2">per year with verified leads</p>
                      </div>

                      {/* Comparison metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                            <Clock className="w-3 h-3" />
                            Time Saved
                          </div>
                          <div className="text-2xl font-bold">{hoursSaved}h</div>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                        
                        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                            <Zap className="w-3 h-3" />
                            Conversion Boost
                          </div>
                          <div className="text-2xl font-bold text-primary">+{(improvedConversion - currentConversion).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">improvement</p>
                        </div>
                      </div>

                      {/* Before/After comparison */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/30">
                          <span className="text-sm text-muted-foreground">Current Monthly Revenue</span>
                          <span className="font-medium">{formatCurrency(currentMonthlyRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30">
                          <span className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            With BamLead
                          </span>
                          <span className="font-bold text-primary">{formatCurrency(improvedMonthlyRevenue)}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button className="w-full gap-2 bg-primary hover:bg-primary/90" size="lg">
                        Start Your Free Trial
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Based on average results from BamLead users</p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { value: "3x", label: "Higher Conversion" },
              { value: "87%", label: "Lead Accuracy" },
              { value: "15min", label: "Saved per Lead" },
            ].map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="font-semibold">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;
