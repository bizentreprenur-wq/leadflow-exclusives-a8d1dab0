import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Mail, Monitor, Smartphone, Moon, Sun, Globe,
  AlertTriangle, CheckCircle2, Flame, ThermometerSun, Snowflake,
  ChevronLeft, ChevronRight, Eye, Sparkles, Zap, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeadAnalysisContext,
  getStoredLeadContext,
  generatePersonalizationFromContext
} from '@/lib/leadContext';
import { getUserLogoFromStorage } from '@/hooks/useUserBranding';

interface PersonalizedLeadPreviewProps {
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  className?: string;
}

export default function PersonalizedLeadPreview({
  subject,
  body,
  senderName = "Your Name",
  senderEmail = "you@company.com",
  className,
}: PersonalizedLeadPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isDark, setIsDark] = useState(false);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);

  // Get all leads with analysis data
  const leads = useMemo(() => getStoredLeadContext(), []);
  const currentLead = leads[selectedLeadIndex] || null;

  // Generate personalized content for selected lead
  const personalizedContent = useMemo(() => {
    if (!currentLead) {
      return { subject, body };
    }

    const vars = generatePersonalizationFromContext(currentLead);
    
    let personalizedSubject = subject;
    let personalizedBody = body;

    // Replace all tokens
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      personalizedSubject = personalizedSubject.replace(regex, value);
      personalizedBody = personalizedBody.replace(regex, value);
    });

    // Also handle common variations
    personalizedSubject = personalizedSubject
      .replace(/\{\{first_name\}\}/gi, vars.first_name || currentLead.businessName)
      .replace(/\{\{business_name\}\}/gi, currentLead.businessName)
      .replace(/\{\{company_name\}\}/gi, currentLead.businessName);
    
    personalizedBody = personalizedBody
      .replace(/\{\{first_name\}\}/gi, vars.first_name || currentLead.businessName)
      .replace(/\{\{business_name\}\}/gi, currentLead.businessName)
      .replace(/\{\{company_name\}\}/gi, currentLead.businessName)
      .replace(/\{\{sender_name\}\}/gi, senderName)
      .replace(/\{\{website\}\}/gi, currentLead.website || 'your website')
      .replace(/\{\{phone\}\}/gi, currentLead.phone || '(555) 123-4567');

    return { subject: personalizedSubject, body: personalizedBody };
  }, [currentLead, subject, body, senderName]);

  // Format plain text body for display
  const formatPlainTextBody = (text: string) => {
    return text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  const getPriorityBadge = (classification?: string) => {
    switch (classification) {
      case 'hot':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><Flame className="w-3 h-3" />Hot</Badge>;
      case 'warm':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><ThermometerSun className="w-3 h-3" />Warm</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1"><Snowflake className="w-3 h-3" />Cold</Badge>;
      default:
        return null;
    }
  };

  if (leads.length === 0) {
    return (
      <Card className={cn("border-2 border-dashed border-muted-foreground/30", className)}>
        <CardContent className="py-8 text-center">
          <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No leads available</p>
          <p className="text-sm text-muted-foreground/70">Run a search in Step 1 to preview personalized emails</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-2 border-primary/30 overflow-hidden", className)}>
      {/* Lead Selector Header */}
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 to-emerald-500/10 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Real-Time Preview
                <Badge variant="outline" className="text-[10px] font-normal">
                  Lead {selectedLeadIndex + 1} of {leads.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">See exactly how your email looks for each lead</p>
            </div>
          </div>

          {/* Lead Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={selectedLeadIndex === 0}
              onClick={() => setSelectedLeadIndex(i => Math.max(0, i - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Select
              value={selectedLeadIndex.toString()}
              onValueChange={(v) => setSelectedLeadIndex(parseInt(v))}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {leads.map((lead, i) => (
                  <SelectItem key={i} value={i.toString()} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{lead.businessName}</span>
                      {lead.aiClassification === 'hot' && <Flame className="w-3 h-3 text-red-400" />}
                      {lead.aiClassification === 'warm' && <ThermometerSun className="w-3 h-3 text-amber-400" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={selectedLeadIndex >= leads.length - 1}
              onClick={() => setSelectedLeadIndex(i => Math.min(leads.length - 1, i + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Lead Info Bar */}
      {currentLead && (
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {currentLead.businessName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{currentLead.businessName}</p>
                <p className="text-xs text-muted-foreground">{currentLead.email || 'No email'}</p>
              </div>
              {getPriorityBadge(currentLead.aiClassification)}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Website Status */}
              {currentLead.websiteAnalysis && (
                <Badge variant="outline" className={cn(
                  "text-[10px] gap-1",
                  !currentLead.websiteAnalysis.hasWebsite && "border-orange-500/30 text-orange-400",
                  currentLead.websiteAnalysis.needsUpgrade && "border-amber-500/30 text-amber-400"
                )}>
                  <Globe className="w-3 h-3" />
                  {!currentLead.websiteAnalysis.hasWebsite ? 'No Website' : 
                   currentLead.websiteAnalysis.needsUpgrade ? 'Needs Upgrade' : 'Has Website'}
                </Badge>
              )}

              {/* Pain Point */}
              {currentLead.painPoints?.[0] && (
                <Badge variant="outline" className="text-[10px] gap-1 max-w-[150px] truncate border-red-500/30 text-red-400">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{currentLead.painPoints[0]}</span>
                </Badge>
              )}

              {/* Device Toggle */}
              <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
                <TabsList className="h-7 bg-background/50">
                  <TabsTrigger value="desktop" className="h-6 px-2 text-[10px] gap-1">
                    <Monitor className="w-3 h-3" />
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="h-6 px-2 text-[10px] gap-1">
                    <Smartphone className="w-3 h-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDark(!isDark)}
                className="h-7 w-7 p-0"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Personalization Tokens Used */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Tokens replaced for this lead:
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(generatePersonalizationFromContext(currentLead)).slice(0, 6).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-[9px] gap-1 font-mono">
                  <span className="text-primary">{`{{${key}}}`}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="truncate max-w-[80px]">{value}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email Preview */}
      <div className={cn(
        "transition-all duration-300 mx-auto",
        device === "mobile" ? "max-w-[375px]" : "w-full"
      )}>
        <div className={cn(isDark ? "bg-zinc-900" : "bg-white")}>
          {/* Email App Header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-2 border-b",
            isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-2 text-xs">
              <span className={isDark ? "text-zinc-400" : "text-gray-500"}>To:</span>
              <span className={isDark ? "text-zinc-200" : "text-gray-700"}>
                {currentLead?.email || 'recipient@example.com'}
              </span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </div>

          <ScrollArea className="h-[350px]">
            <div className={cn("p-5", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {/* User Logo */}
              {(() => {
                const logoUrl = getUserLogoFromStorage();
                return logoUrl ? (
                  <div className="flex justify-center mb-4">
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      className="max-h-10 max-w-[150px] object-contain"
                    />
                  </div>
                ) : null;
              })()}

              {/* Subject Line */}
              <h2 className={cn(
                "font-bold mb-4 leading-tight",
                device === "mobile" ? "text-lg" : "text-xl"
              )}>
                {personalizedContent.subject || "Enter your subject line..."}
              </h2>

              {/* Sender Info */}
              <div className={cn(
                "flex items-start gap-3 pb-4 mb-4 border-b",
                isDark ? "border-zinc-700" : "border-gray-100"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isDark 
                    ? "bg-gradient-to-br from-primary/30 to-primary/20 text-primary" 
                    : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                )}>
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{senderName}</p>
                  <p className={cn(
                    "text-sm truncate",
                    isDark ? "text-zinc-400" : "text-gray-500"
                  )}>
                    {senderEmail}
                  </p>
                </div>
              </div>

              {/* Email Body - Personalized */}
              <div className={cn(
                "whitespace-pre-wrap leading-relaxed",
                device === "mobile" ? "text-[14px]" : "text-[15px]"
              )}>
                {formatPlainTextBody(personalizedContent.body) || (
                  <div className={cn(
                    "text-center py-6",
                    isDark ? "text-zinc-500" : "text-gray-400"
                  )}>
                    <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to see your personalized email...</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* AI Insight Footer */}
      {currentLead?.aiInsights?.[0] && (
        <div className="px-4 py-2 border-t border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">AI Insight:</span>
            <span className="text-foreground truncate">{currentLead.aiInsights[0]}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
