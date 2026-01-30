import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Home, Brain, ChevronDown, ChevronUp, Flame, Snowflake, ThermometerSun, Globe, AlertTriangle, Sparkles, TrendingUp, Target, Lightbulb, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import HighConvertingTemplateGallery from "@/components/HighConvertingTemplateGallery";
import EmailHelpOverlay from "@/components/EmailHelpOverlay";
import { EmailTemplate } from "@/lib/highConvertingTemplates";
import { toast } from "sonner";
import { getStoredLeadContext, LeadAnalysisContext } from "@/lib/leadContext";
import { cn } from "@/lib/utils";

export default function TemplateGallery() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showIntelligence, setShowIntelligence] = useState(true);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    toast.success(`Template "${template.name}" selected! In the full dashboard, this would be loaded into the email composer.`);
  };

  // Get lead analysis from storage
  const leadAnalysis = useMemo(() => getStoredLeadContext(), []);

  // Calculate insights from lead analysis
  const insights = useMemo(() => {
    const total = leadAnalysis.length;
    if (total === 0) return null;
    
    const noWebsite = leadAnalysis.filter(l => !l.websiteAnalysis?.hasWebsite);
    const needsUpgrade = leadAnalysis.filter(l => l.websiteAnalysis?.needsUpgrade);
    const poorMobile = leadAnalysis.filter(l => 
      l.websiteAnalysis?.mobileScore !== undefined && 
      l.websiteAnalysis.mobileScore < 50
    );
    const hotLeads = leadAnalysis.filter(l => l.aiClassification === 'hot');
    const warmLeads = leadAnalysis.filter(l => l.aiClassification === 'warm');
    const coldLeads = leadAnalysis.filter(l => l.aiClassification === 'cold' || !l.aiClassification);
    const withPainPoints = leadAnalysis.filter(l => l.painPoints && l.painPoints.length > 0);
    const withPhone = leadAnalysis.filter(l => l.phone);
    const withEmail = leadAnalysis.filter(l => l.email);
    
    // Top pain points across all leads
    const painPointCounts: Record<string, number> = {};
    leadAnalysis.forEach(l => {
      l.painPoints?.forEach(pp => {
        painPointCounts[pp] = (painPointCounts[pp] || 0) + 1;
      });
    });
    const topPainPoints = Object.entries(painPointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([point, count]) => ({ point, count }));
    
    // Website issues
    const issueCounts: Record<string, number> = {};
    leadAnalysis.forEach(l => {
      l.websiteAnalysis?.issues?.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
    
    return {
      total,
      noWebsite,
      needsUpgrade,
      poorMobile,
      hotLeads,
      warmLeads,
      coldLeads,
      withPainPoints,
      withPhone,
      withEmail,
      topPainPoints,
      topIssues,
    };
  }, [leadAnalysis]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard-demo">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold">📧 Email Template Gallery</h1>
          </div>
          <div className="flex items-center gap-3">
            <EmailHelpOverlay variant="inline" />
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Email Template Gallery - TOP */}
        <HighConvertingTemplateGallery 
          onSelectTemplate={handleSelectTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />

        {/* Lead Intelligence Section - BELOW TEMPLATES */}
        {insights && insights.total > 0 && (
          <Collapsible open={showIntelligence} onOpenChange={setShowIntelligence}>
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          🧠 Lead Intelligence Report
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                            {insights.total} leads analyzed
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          AI-powered insights from your Step 1 & 2 lead analysis
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      {showIntelligence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showIntelligence ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-2">
                  {/* Lead Classification Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      "border-red-500/40 bg-red-500/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-500">{insights.hotLeads.length}</p>
                          <p className="text-sm text-muted-foreground">Hot Leads</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">High-intent, ready to buy</p>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      "border-amber-500/40 bg-amber-500/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <ThermometerSun className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-500">{insights.warmLeads.length}</p>
                          <p className="text-sm text-muted-foreground">Warm Leads</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Interested, needs nurturing</p>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      "border-blue-500/40 bg-blue-500/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Snowflake className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-500">{insights.coldLeads.length}</p>
                          <p className="text-sm text-muted-foreground">Cold Leads</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Requires re-engagement</p>
                    </div>
                  </div>

                  {/* Opportunity Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-sm">No Website</span>
                      </div>
                      <p className="text-xl font-bold">{insights.noWebsite.length}</p>
                      <p className="text-xs text-muted-foreground">High opportunity for web services</p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">Needs Upgrade</span>
                      </div>
                      <p className="text-xl font-bold">{insights.needsUpgrade.length}</p>
                      <p className="text-xs text-muted-foreground">Outdated websites detected</p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium text-sm">Poor Mobile</span>
                      </div>
                      <p className="text-xl font-bold">{insights.poorMobile.length}</p>
                      <p className="text-xs text-muted-foreground">Mobile optimization needed</p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-sm">Pain Points</span>
                      </div>
                      <p className="text-xl font-bold">{insights.withPainPoints.length}</p>
                      <p className="text-xs text-muted-foreground">Leads with identified issues</p>
                    </div>
                  </div>

                  {/* Top Pain Points */}
                  {insights.topPainPoints.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Top Pain Points Across Leads
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.topPainPoints.map(({ point, count }, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1.5">
                            {point} <span className="ml-1 opacity-60">({count})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Website Issues */}
                  {insights.topIssues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Common Website Issues
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.topIssues.map(({ issue, count }, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1.5 bg-orange-500/10 border-orange-500/30 text-orange-600">
                            {issue} <span className="ml-1 opacity-60">({count})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Recommendation */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/10 border border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">AI Recommendation</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on your lead analysis: {insights.hotLeads.length > 0 
                            ? `Start with your ${insights.hotLeads.length} hot leads using a direct, high-urgency template.` 
                            : insights.noWebsite.length > 0 
                              ? `Focus on the ${insights.noWebsite.length} businesses without websites - they have the highest conversion potential.`
                              : `Use the pain point-focused templates to address the ${insights.withPainPoints.length} leads with identified issues.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* No Lead Data Message */}
        {(!insights || insights.total === 0) && (
          <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/10">
            <CardContent className="py-8 text-center">
              <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No lead analysis data available</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Run a search in the dashboard to generate intelligence insights</p>
              <Link to="/dashboard-demo">
                <Button variant="outline" className="mt-4 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Help Button */}
      <EmailHelpOverlay variant="floating" />

      {/* Selected Template Banner */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-4 px-6 shadow-lg animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">Selected: {selectedTemplate.name}</p>
              <p className="text-sm opacity-80">{selectedTemplate.industry} • {selectedTemplate.category}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setSelectedTemplate(null)}
              >
                Clear Selection
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 hover:bg-white/20"
                onClick={() => toast.info("In the full dashboard, this would open the email composer with this template loaded.")}
              >
                Continue to Email Composer →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
