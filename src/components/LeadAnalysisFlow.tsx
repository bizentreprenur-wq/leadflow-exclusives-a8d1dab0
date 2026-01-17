import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Target,
  Users,
  BarChart3,
  Zap,
  Eye,
  FileText,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  rating?: number;
  score?: number;
  status?: "hot" | "warm" | "cold";
  industry?: string;
  verified?: boolean;
}

interface LeadAnalysisFlowProps {
  leads: Lead[];
  onComplete?: (selectedLeads: Lead[]) => void;
}

type Step = "overview" | "filter" | "score" | "select" | "export";

export default function LeadAnalysisFlow({ leads, onComplete }: LeadAnalysisFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("overview");
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasWebsite: false,
    minRating: 0,
  });

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "filter", label: "Filter", icon: <Filter className="w-4 h-4" /> },
    { key: "score", label: "Score", icon: <Target className="w-4 h-4" /> },
    { key: "select", label: "Select", icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const applyFilters = () => {
    let result = [...leads];
    if (filters.hasEmail) result = result.filter(l => l.email);
    if (filters.hasPhone) result = result.filter(l => l.phone);
    if (filters.hasWebsite) result = result.filter(l => l.website);
    if (filters.minRating > 0) result = result.filter(l => (l.rating || 0) >= filters.minRating);
    setFilteredLeads(result);
    setCurrentStep("score");
  };

  const getLeadStatus = (lead: Lead): "hot" | "warm" | "cold" => {
    const score = lead.score || Math.random() * 100;
    if (score >= 80) return "hot";
    if (score >= 50) return "warm";
    return "cold";
  };

  const toggleSelect = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleExport = () => {
    const selected = filteredLeads.filter(l => selectedLeads.has(l.id));
    onComplete?.(selected);
  };

  const stats = {
    total: leads.length,
    withEmail: leads.filter(l => l.email).length,
    withPhone: leads.filter(l => l.phone).length,
    withWebsite: leads.filter(l => l.website).length,
    highRated: leads.filter(l => (l.rating || 0) >= 4).length,
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 py-4 px-2 bg-muted/30 rounded-xl">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer hover:scale-105 ${
                currentStep === step.key
                  ? "bg-primary text-primary-foreground"
                  : index < currentStepIndex
                  ? "bg-success/10 text-success hover:bg-success/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step.icon
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`w-4 md:w-8 h-0.5 mx-1 ${
                index < currentStepIndex ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* OVERVIEW STEP */}
      {currentStep === "overview" && (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Lead Analysis Overview
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Here's a summary of your {leads.length} leads. Let's analyze and filter them for best results.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Mail className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">{stats.withEmail}</p>
              <p className="text-xs text-muted-foreground">With Email</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Phone className="w-6 h-6 text-violet-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-violet-500">{stats.withPhone}</p>
              <p className="text-xs text-muted-foreground">With Phone</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Globe className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-500">{stats.withWebsite}</p>
              <p className="text-xs text-muted-foreground">With Website</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-500">{stats.highRated}</p>
              <p className="text-xs text-muted-foreground">4+ Rating</p>
            </div>
          </div>

          <Button className="w-full gap-2" size="lg" onClick={() => setCurrentStep("filter")}>
            Continue to Filtering
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* FILTER STEP */}
      {currentStep === "filter" && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              🎯 Filter Your Leads
            </h3>
            <p className="text-muted-foreground">
              Select criteria to narrow down your leads
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFilters({ ...filters, hasEmail: !filters.hasEmail })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                filters.hasEmail 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Mail className={`w-6 h-6 mb-2 ${filters.hasEmail ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-foreground">Has Email</p>
              <p className="text-sm text-muted-foreground">{stats.withEmail} leads</p>
            </button>
            <button
              onClick={() => setFilters({ ...filters, hasPhone: !filters.hasPhone })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                filters.hasPhone 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Phone className={`w-6 h-6 mb-2 ${filters.hasPhone ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-foreground">Has Phone</p>
              <p className="text-sm text-muted-foreground">{stats.withPhone} leads</p>
            </button>
            <button
              onClick={() => setFilters({ ...filters, hasWebsite: !filters.hasWebsite })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                filters.hasWebsite 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Globe className={`w-6 h-6 mb-2 ${filters.hasWebsite ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-foreground">Has Website</p>
              <p className="text-sm text-muted-foreground">{stats.withWebsite} leads</p>
            </button>
            <button
              onClick={() => setFilters({ ...filters, minRating: filters.minRating === 4 ? 0 : 4 })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                filters.minRating >= 4 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Star className={`w-6 h-6 mb-2 ${filters.minRating >= 4 ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-foreground">4+ Stars</p>
              <p className="text-sm text-muted-foreground">{stats.highRated} leads</p>
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep("overview")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button className="flex-1 gap-2" onClick={applyFilters}>
              Apply Filters
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* SCORE STEP */}
      {currentStep === "score" && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              ⭐ Lead Scoring Results
            </h3>
            <p className="text-muted-foreground">
              {filteredLeads.length} leads match your criteria
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <TrendingUp className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">
                {filteredLeads.filter(l => getLeadStatus(l) === "hot").length}
              </p>
              <p className="text-xs text-muted-foreground">🔥 Hot Leads</p>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
              <TrendingUp className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">
                {filteredLeads.filter(l => getLeadStatus(l) === "warm").length}
              </p>
              <p className="text-xs text-muted-foreground">🌡️ Warm Leads</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-500">
                {filteredLeads.filter(l => getLeadStatus(l) === "cold").length}
              </p>
              <p className="text-xs text-muted-foreground">❄️ Cold Leads</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep("filter")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button className="flex-1 gap-2" onClick={() => setCurrentStep("select")}>
              Select Leads
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* SELECT STEP */}
      {currentStep === "select" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Select Leads</h3>
              <p className="text-sm text-muted-foreground">
                {selectedLeads.size} of {filteredLeads.length} selected
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedLeads.size === filteredLeads.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-xl border border-border">
            <div className="p-2 space-y-2">
              {filteredLeads.slice(0, 50).map((lead) => {
                const status = getLeadStatus(lead);
                return (
                  <button
                    key={lead.id}
                    onClick={() => toggleSelect(lead.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedLeads.has(lead.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedLeads.has(lead.id) ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {selectedLeads.has(lead.id) ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">{lead.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lead.email && <span>📧 Email</span>}
                            {lead.phone && <span>📞 Phone</span>}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={status === "hot" ? "destructive" : status === "warm" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep("score")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              className="flex-1 gap-2" 
              onClick={() => setCurrentStep("export")}
              disabled={selectedLeads.size === 0}
            >
              Continue ({selectedLeads.size})
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* EXPORT STEP */}
      {currentStep === "export" && (
        <div className="space-y-6 text-center py-6">
          <div className="inline-flex p-4 rounded-2xl bg-success/10 border border-success/20 mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            🎉 {selectedLeads.size} Leads Ready!
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your leads have been analyzed and scored. What would you like to do next?
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button className="gap-2" onClick={handleExport}>
              <Mail className="w-4 h-4" />
              Email Leads
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep("overview")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
