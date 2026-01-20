import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Sparkles, Zap, TrendingUp, Target, Building2, Globe, 
  Wrench, Briefcase, ArrowRight, Check, Brain, Lightbulb
} from 'lucide-react';
import { HIGH_CONVERTING_TEMPLATES, EmailTemplate, getTemplatePerformance } from '@/lib/highConvertingTemplates';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  websiteAnalysis?: {
    platform?: string;
    isMobile?: boolean;
    loadTime?: number;
    hasSeo?: boolean;
    status?: string;
  };
}

interface AITemplateSuggestionsProps {
  leads: Lead[];
  onSelectTemplate: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
}

// Industry detection patterns
const INDUSTRY_PATTERNS: Record<string, { keywords: string[]; category: string; icon: React.ReactNode }> = {
  'restaurant': { keywords: ['restaurant', 'cafe', 'bar', 'food', 'pizza', 'grill', 'diner', 'bistro', 'catering'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'medical': { keywords: ['dental', 'dentist', 'doctor', 'clinic', 'medical', 'health', 'chiropractic', 'therapy', 'wellness'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'automotive': { keywords: ['auto', 'car', 'mechanic', 'repair', 'tire', 'body shop', 'detailing', 'garage'], category: 'local-services', icon: <Wrench className="w-4 h-4" /> },
  'legal': { keywords: ['law', 'lawyer', 'attorney', 'legal', 'firm', 'paralegal'], category: 'b2b', icon: <Briefcase className="w-4 h-4" /> },
  'real-estate': { keywords: ['real estate', 'realtor', 'realty', 'property', 'homes', 'mortgage'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'construction': { keywords: ['construction', 'contractor', 'builder', 'roofing', 'plumbing', 'hvac', 'electric'], category: 'local-services', icon: <Wrench className="w-4 h-4" /> },
  'beauty': { keywords: ['salon', 'spa', 'beauty', 'hair', 'nails', 'barber', 'cosmetic'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'fitness': { keywords: ['gym', 'fitness', 'yoga', 'training', 'crossfit', 'studio', 'athletic'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'professional': { keywords: ['consulting', 'agency', 'marketing', 'accounting', 'finance', 'insurance'], category: 'b2b', icon: <Briefcase className="w-4 h-4" /> },
  'retail': { keywords: ['store', 'shop', 'boutique', 'retail', 'outlet', 'market'], category: 'local-services', icon: <Building2 className="w-4 h-4" /> },
  'technology': { keywords: ['tech', 'software', 'saas', 'app', 'digital', 'it services', 'web'], category: 'web-design', icon: <Globe className="w-4 h-4" /> },
};

// Detect primary industry from leads
function detectIndustry(leads: Lead[]): { industry: string; confidence: number; matchedLeads: number } {
  const industryScores: Record<string, number> = {};
  
  leads.forEach(lead => {
    const searchText = `${lead.name} ${lead.address || ''}`.toLowerCase();
    
    Object.entries(INDUSTRY_PATTERNS).forEach(([industry, { keywords }]) => {
      keywords.forEach(keyword => {
        if (searchText.includes(keyword)) {
          industryScores[industry] = (industryScores[industry] || 0) + 1;
        }
      });
    });
  });

  const topIndustry = Object.entries(industryScores)
    .sort(([, a], [, b]) => b - a)[0];

  if (topIndustry) {
    return {
      industry: topIndustry[0],
      confidence: Math.min(100, Math.round((topIndustry[1] / leads.length) * 100)),
      matchedLeads: topIndustry[1]
    };
  }

  return { industry: 'general', confidence: 50, matchedLeads: 0 };
}

// Detect website issues from leads
function detectWebsiteIssues(leads: Lead[]): string[] {
  const issues: string[] = [];
  let noWebsite = 0, slowSites = 0, noMobile = 0, noSeo = 0;

  leads.forEach(lead => {
    if (!lead.website) noWebsite++;
    if (lead.websiteAnalysis) {
      if (lead.websiteAnalysis.loadTime && lead.websiteAnalysis.loadTime > 3) slowSites++;
      if (lead.websiteAnalysis.isMobile === false) noMobile++;
      if (lead.websiteAnalysis.hasSeo === false) noSeo++;
    }
  });

  if (noWebsite > leads.length * 0.3) issues.push('no-website');
  if (slowSites > leads.length * 0.3) issues.push('slow-loading');
  if (noMobile > leads.length * 0.3) issues.push('not-mobile-friendly');
  if (noSeo > leads.length * 0.3) issues.push('poor-seo');

  return issues;
}

// Get recommended templates based on analysis
function getRecommendedTemplates(
  industry: string, 
  issues: string[], 
  allTemplates: EmailTemplate[]
): { template: EmailTemplate; reason: string; score: number }[] {
  const recommendations: { template: EmailTemplate; reason: string; score: number }[] = [];
  const industryCategory = INDUSTRY_PATTERNS[industry]?.category || 'general';

  allTemplates.forEach(template => {
    let score = 0;
    let reason = '';

    // Category match
    if (template.category === industryCategory) {
      score += 30;
      reason = `Perfect for ${industry.replace('-', ' ')} businesses`;
    }

    // Industry keyword match
    const templateText = `${template.name} ${template.description} ${template.industry}`.toLowerCase();
    if (templateText.includes(industry)) {
      score += 25;
      reason = `Specifically designed for ${industry}`;
    }

    // Issue-based matching
    if (issues.includes('no-website') && templateText.includes('website')) {
      score += 20;
      reason = 'Targets businesses needing websites';
    }
    if (issues.includes('slow-loading') && (templateText.includes('speed') || templateText.includes('fast'))) {
      score += 15;
      reason = 'Addresses slow website concerns';
    }
    if (issues.includes('not-mobile-friendly') && templateText.includes('mobile')) {
      score += 15;
      reason = 'Highlights mobile optimization';
    }
    if (issues.includes('poor-seo') && templateText.includes('seo')) {
      score += 15;
      reason = 'Focuses on SEO improvements';
    }

    // Performance bonus
    const perf = getTemplatePerformance(template.id);
    if (perf.openRate > 45) score += 10;
    if (perf.replyRate > 4) score += 10;

    if (score > 20) {
      recommendations.push({ template, reason, score });
    }
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}

export default function AITemplateSuggestions({ 
  leads, 
  onSelectTemplate,
  selectedTemplateId 
}: AITemplateSuggestionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<{
    industry: string;
    confidence: number;
    issues: string[];
    recommendations: { template: EmailTemplate; reason: string; score: number }[];
  } | null>(null);

  useEffect(() => {
    if (leads.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const { industry, confidence } = detectIndustry(leads);
      const issues = detectWebsiteIssues(leads);
      const recommendations = getRecommendedTemplates(industry, issues, HIGH_CONVERTING_TEMPLATES);

      setAnalysis({ industry, confidence, issues, recommendations });
      setIsAnalyzing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [leads]);

  if (leads.length === 0) return null;

  return (
    <Card className="border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-pink-500/10">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              AI Template Recommendations
              <Badge className="bg-violet-500 text-white text-xs">Smart Match</Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Based on your {leads.length} leads' industry and website analysis
            </p>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your leads for best template match...</p>
          </div>
        ) : analysis && analysis.recommendations.length > 0 ? (
          <div className="space-y-4">
            {/* Analysis Summary */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="gap-1 border-violet-500/50 text-violet-400">
                <Target className="w-3 h-3" />
                Industry: {analysis.industry.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {analysis.confidence}% confidence
              </Badge>
              {analysis.issues.map(issue => (
                <Badge key={issue} variant="outline" className="gap-1 border-amber-500/50 text-amber-400">
                  <Lightbulb className="w-3 h-3" />
                  {issue.replace('-', ' ')}
                </Badge>
              ))}
            </div>

            {/* Recommended Templates */}
            <div className="grid gap-3">
              {analysis.recommendations.map(({ template, reason, score }, idx) => {
                const perf = getTemplatePerformance(template.id);
                const isSelected = selectedTemplateId === template.id;
                
                return (
                  <div 
                    key={template.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-border bg-card hover:border-violet-500/50'
                      }`}
                  >
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${idx === 0 ? 'bg-amber-500 text-white' : 
                        idx === 1 ? 'bg-gray-400 text-white' : 
                        'bg-amber-700 text-white'}`}
                    >
                      #{idx + 1}
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{template.name}</h4>
                        {idx === 0 && (
                          <Badge className="bg-amber-500 text-white text-[10px]">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Best Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{reason}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-emerald-500">{perf.openRate}% open rate</span>
                        <span className="text-xs text-blue-500">{perf.replyRate}% reply rate</span>
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                      disabled={isSelected}
                      className={isSelected 
                        ? 'bg-emerald-500 text-white gap-2' 
                        : 'bg-violet-500 hover:bg-violet-600 text-white gap-2'
                      }
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          Selected
                        </>
                      ) : (
                        <>
                          Use Template
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
              <Zap className="w-3 h-3 inline mr-1" />
              AI analyzed business names, addresses, and website data to find the best matches
            </p>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No specific industry detected. Browse all templates below.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
