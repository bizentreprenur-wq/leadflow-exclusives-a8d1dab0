import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  User, 
  Building2, 
  Briefcase,
  ShoppingCart,
  Code,
  Stethoscope,
  RefreshCw,
  ArrowRight,
  Eye,
  Sparkles,
  Type,
  MousePointer,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  industry: string;
  painPoint: string;
  buyingStage: string;
}

interface PageVariant {
  headline: string;
  subheadline: string;
  cta: string;
  valueProp: string;
  socialProof: string;
  urgency: string;
}

const LivePageMutation = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<PageVariant | null>(null);
  const [mutationCount, setMutationCount] = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  const personas: Persona[] = [
    {
      id: "saas-founder",
      name: "SaaS Founder",
      icon: <Code className="h-4 w-4" />,
      industry: "Software/Tech",
      painPoint: "Scaling sales without hiring",
      buyingStage: "Evaluation"
    },
    {
      id: "agency-owner",
      name: "Agency Owner",
      icon: <Briefcase className="h-4 w-4" />,
      industry: "Marketing Agency",
      painPoint: "Finding new clients consistently",
      buyingStage: "Awareness"
    },
    {
      id: "ecommerce-manager",
      name: "E-commerce Manager",
      icon: <ShoppingCart className="h-4 w-4" />,
      industry: "Retail/E-commerce",
      painPoint: "Customer acquisition costs",
      buyingStage: "Consideration"
    },
    {
      id: "healthcare-admin",
      name: "Healthcare Admin",
      icon: <Stethoscope className="h-4 w-4" />,
      industry: "Healthcare",
      painPoint: "Patient outreach compliance",
      buyingStage: "Research"
    },
    {
      id: "enterprise-sales",
      name: "Enterprise Sales",
      icon: <Building2 className="h-4 w-4" />,
      industry: "Enterprise B2B",
      painPoint: "Long sales cycles",
      buyingStage: "Decision"
    }
  ];

  const defaultVariant: PageVariant = {
    headline: "Find Your Next High-Value Leads",
    subheadline: "AI-powered lead generation for modern businesses",
    cta: "Start Free Trial",
    valueProp: "Generate qualified leads automatically",
    socialProof: "Trusted by 2,000+ companies",
    urgency: "Limited spots available"
  };

  const personaVariants: Record<string, PageVariant> = {
    "saas-founder": {
      headline: "Scale Your SaaS Pipeline Without Hiring SDRs",
      subheadline: "AI finds and qualifies leads while you focus on product. Perfect for bootstrapped founders.",
      cta: "Start Scaling Free",
      valueProp: "10x your demo bookings without expanding headcount",
      socialProof: "847 SaaS founders grew ARR by 43% avg",
      urgency: "Only 12 onboarding slots left this month"
    },
    "agency-owner": {
      headline: "Never Run Out of Client Leads Again",
      subheadline: "Automatically find businesses that need your agency services. White-label ready.",
      cta: "Get Client Leads Now",
      valueProp: "Fill your pipeline with retainer-ready prospects",
      socialProof: "1,200+ agencies signed 3+ new clients/month",
      urgency: "Agency-exclusive pricing ends Friday"
    },
    "ecommerce-manager": {
      headline: "Cut Customer Acquisition Costs by 67%",
      subheadline: "AI identifies high-intent shoppers before they find your competitors.",
      cta: "Lower My CAC Today",
      valueProp: "Find customers ready to buy, not just browse",
      socialProof: "E-commerce brands saved $2.3M in ad spend",
      urgency: "Q4 prep discount: Save 40%"
    },
    "healthcare-admin": {
      headline: "HIPAA-Compliant Patient Outreach at Scale",
      subheadline: "Reach more patients while staying 100% compliant. Built for healthcare.",
      cta: "See Compliance Features",
      valueProp: "Automated outreach that meets regulatory requirements",
      socialProof: "340 healthcare orgs improved patient engagement 52%",
      urgency: "Free compliance audit included"
    },
    "enterprise-sales": {
      headline: "Shorten Enterprise Sales Cycles by 40%",
      subheadline: "AI identifies decision-makers and buying signals across target accounts.",
      cta: "Book Enterprise Demo",
      valueProp: "Multi-threading and stakeholder mapping built-in",
      socialProof: "Fortune 500 teams closed $47M faster",
      urgency: "Priority implementation for Q1 contracts"
    }
  };

  const transformPage = (persona: Persona) => {
    setSelectedPersona(persona);
    setIsTransforming(true);
    setShowComparison(false);

    setTimeout(() => {
      setCurrentVariant(personaVariants[persona.id]);
      setMutationCount(prev => prev + 1);
      setIsTransforming(false);
      setShowComparison(true);
    }, 1500);
  };

  const resetDemo = () => {
    setSelectedPersona(null);
    setCurrentVariant(null);
    setShowComparison(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-pink-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Wand2 className="h-5 w-5 text-pink-500" />
          </div>
          Live Page Mutation
          <Badge variant="outline" className="ml-auto bg-pink-500/10 text-pink-500 border-pink-500/30">
            ✨ SHAPESHIFTER
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Two people <span className="font-semibold text-pink-500">never see the same page</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showComparison && !isTransforming && (
          <>
            {/* Intro */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 text-center">
              <Wand2 className="h-10 w-10 text-pink-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Real-Time Content Personalization</h3>
              <p className="text-sm text-muted-foreground mb-2">
                AI rewrites headlines, CTAs, and value props based on who is visiting.
                Select a persona to see your page transform.
              </p>
              {mutationCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {mutationCount} mutations performed
                </Badge>
              )}
            </div>

            {/* Persona Selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Select Visitor Persona
              </p>
              <div className="grid gap-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all hover:border-pink-500/50 hover:bg-pink-500/5",
                      "bg-muted/30 border-muted"
                    )}
                    onClick={() => transformPage(persona)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                        {persona.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">{persona.industry}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px]">
                          {persona.buyingStage}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {isTransforming && (
          <div className="py-12 text-center space-y-4">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 animate-pulse" />
              <div className="absolute inset-8 rounded-full bg-background flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-pink-500 animate-bounce" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-pink-500">Mutating page content...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Rewriting for: {selectedPersona?.name}
              </p>
            </div>
          </div>
        )}

        {showComparison && currentVariant && selectedPersona && (
          <>
            {/* Persona Badge */}
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20 text-pink-500">
                {selectedPersona.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedPersona.name}</p>
                <p className="text-xs text-muted-foreground">
                  Pain: {selectedPersona.painPoint}
                </p>
              </div>
              <Badge className="bg-pink-500 text-white text-[10px]">
                <Eye className="h-3 w-3 mr-1" />
                VIEWING
              </Badge>
            </div>

            {/* Before/After Comparison */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Content Mutations Applied
              </p>

              {/* Headline */}
              <div className="p-3 rounded-lg bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="h-3 w-3 text-pink-500" />
                  <span className="text-xs font-medium text-pink-500">HEADLINE</span>
                </div>
                <p className="text-xs text-muted-foreground line-through mb-1">
                  {defaultVariant.headline}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {currentVariant.headline}
                </p>
              </div>

              {/* Subheadline */}
              <div className="p-3 rounded-lg bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-500">SUBHEADLINE</span>
                </div>
                <p className="text-xs text-muted-foreground line-through mb-1">
                  {defaultVariant.subheadline}
                </p>
                <p className="text-sm text-foreground">
                  {currentVariant.subheadline}
                </p>
              </div>

              {/* CTA */}
              <div className="p-3 rounded-lg bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-medium text-green-500">CTA BUTTON</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs opacity-50 line-through" disabled>
                    {defaultVariant.cta}
                  </Button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
                  <Button size="sm" className="text-xs bg-pink-500 hover:bg-pink-600">
                    {currentVariant.cta}
                  </Button>
                </div>
              </div>

              {/* Value Prop */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs font-medium text-green-500 mb-1">VALUE PROPOSITION</p>
                <p className="text-sm">{currentVariant.valueProp}</p>
              </div>

              {/* Social Proof */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs font-medium text-blue-500 mb-1">SOCIAL PROOF</p>
                <p className="text-sm">{currentVariant.socialProof}</p>
              </div>

              {/* Urgency */}
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-xs font-medium text-orange-500 mb-1">URGENCY TRIGGER</p>
                <p className="text-sm">{currentVariant.urgency}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <p className="text-lg font-bold text-pink-500">6</p>
                <p className="text-[10px] text-muted-foreground">Elements Changed</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <p className="text-lg font-bold text-green-500">+34%</p>
                <p className="text-[10px] text-muted-foreground">Conv. Lift</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <p className="text-lg font-bold text-blue-500">0.1s</p>
                <p className="text-[10px] text-muted-foreground">Mutation Time</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetDemo}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Another
              </Button>
              <Button className="flex-1 bg-pink-500 hover:bg-pink-600">
                Enable Live Mutation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LivePageMutation;
