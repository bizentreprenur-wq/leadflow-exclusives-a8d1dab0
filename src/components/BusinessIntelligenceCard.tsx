/**
 * Business Intelligence Card Component
 * Displays comprehensive 11-category intelligence for each lead
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, Globe, Star, TrendingUp, Zap, Target, Users,
  Shield, Brain, ChevronDown, ChevronRight, Phone, Mail,
  MapPin, ExternalLink, AlertTriangle, CheckCircle2, XCircle,
  Flame, Snowflake, BarChart3, Lightbulb, MessageSquare,
  DollarSign, Clock, Award, Code, Search, Eye, Lock,
  Briefcase, LineChart, Smartphone
} from 'lucide-react';
import { BusinessIntelligenceLead, BusinessScorecards } from '@/lib/types/businessIntelligence';

interface BusinessIntelligenceCardProps {
  lead: BusinessIntelligenceLead;
  isSelected?: boolean;
  onSelect?: () => void;
  onEmail?: () => void;
  onCall?: () => void;
  compact?: boolean;
}

export default function BusinessIntelligenceCard({
  lead,
  isSelected = false,
  onSelect,
  onEmail,
  onCall,
  compact = false,
}: BusinessIntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const priorityColors = {
    hot: 'bg-red-500/20 text-red-700 border-red-500',
    warm: 'bg-amber-500/20 text-amber-700 border-amber-500',
    cold: 'bg-blue-500/20 text-blue-700 border-blue-500',
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const ScoreCard = ({ label, score, icon: Icon }: { label: string; score: number; icon: any }) => (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <div className="flex-1">
          <Progress value={score} className={`h-1.5 ${getScoreBarColor(score)}`} />
        </div>
      </div>
    </div>
  );

  return (
    <Card 
      className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${!compact ? 'hover:shadow-lg' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{lead.name}</CardTitle>
              <Badge 
                variant="outline" 
                className={`${priorityColors[lead.aiSummary.classificationLabel]} text-xs`}
              >
                {lead.aiSummary.classificationLabel === 'hot' && <Flame className="w-3 h-3 mr-1" />}
                {lead.aiSummary.classificationLabel.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Score: {lead.scorecards.overallScore}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {lead.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {lead.address}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {lead.email}
                </span>
              )}
              {lead.website && (
                <a 
                  href={lead.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {lead.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {lead.rating} ({lead.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onCall && lead.phone && (
              <Button size="sm" variant="outline" onClick={onCall}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            )}
            {onEmail && (
              <Button size="sm" onClick={onEmail}>
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
            )}
            {onSelect && (
              <Button size="sm" variant={isSelected ? 'default' : 'outline'} onClick={onSelect}>
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* AI Summary */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 mb-4">
          <div className="flex items-start gap-2">
            <Brain className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">AI Insight</p>
              <p className="text-sm">{lead.aiSummary.insightSummary || 'Analysis in progress...'}</p>
              {lead.aiSummary.suggestedPitchAngle && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Pitch Angle:</strong> {lead.aiSummary.suggestedPitchAngle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scorecards Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          <ScoreCard label="Opportunity" score={lead.scorecards.opportunityScore} icon={Target} />
          <ScoreCard label="Visibility" score={lead.scorecards.visibilityScore} icon={Eye} />
          <ScoreCard label="Reputation" score={lead.scorecards.reputationScore} icon={Star} />
          <ScoreCard label="Intent" score={lead.scorecards.intentScore} icon={Zap} />
          <ScoreCard label="Competitive" score={lead.scorecards.competitiveIndex} icon={BarChart3} />
          <ScoreCard label="Overall" score={lead.scorecards.overallScore} icon={Award} />
        </div>

        {/* Expandable Deep Intelligence */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Full Intelligence Report
                <Badge variant="secondary" className="ml-2">11 Categories</Badge>
              </span>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 lg:grid-cols-11 h-auto gap-1">
                <TabsTrigger value="identity" className="text-xs p-2">
                  <Building2 className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Identity</span>
                </TabsTrigger>
                <TabsTrigger value="website" className="text-xs p-2">
                  <Globe className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Website</span>
                </TabsTrigger>
                <TabsTrigger value="visibility" className="text-xs p-2">
                  <Search className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Visibility</span>
                </TabsTrigger>
                <TabsTrigger value="reputation" className="text-xs p-2">
                  <Star className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Reviews</span>
                </TabsTrigger>
                <TabsTrigger value="opportunity" className="text-xs p-2">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Opportunity</span>
                </TabsTrigger>
                <TabsTrigger value="tech" className="text-xs p-2">
                  <Code className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Tech</span>
                </TabsTrigger>
                <TabsTrigger value="intent" className="text-xs p-2">
                  <Zap className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Intent</span>
                </TabsTrigger>
                <TabsTrigger value="competitors" className="text-xs p-2">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Compete</span>
                </TabsTrigger>
                <TabsTrigger value="outreach" className="text-xs p-2">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Outreach</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs p-2">
                  <Shield className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">Trust</span>
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-xs p-2">
                  <Brain className="w-3 h-3 mr-1" />
                  <span className="hidden lg:inline">SWOT</span>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                {/* 1. Business Identity */}
                <TabsContent value="identity" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Business Identity & Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Legal Name" value={lead.businessIdentity.legalName} />
                    <InfoRow label="DBA" value={lead.businessIdentity.dba} />
                    <InfoRow label="Entity Status" value={lead.businessIdentity.entityStatus} badge />
                    <InfoRow label="Year Established" value={lead.businessIdentity.yearEstablished?.toString()} />
                    <InfoRow label="Employee Range" value={lead.businessIdentity.employeeRange} />
                    <InfoRow label="Revenue Estimate" value={lead.businessIdentity.revenueRange} />
                    <InfoRow label="Ownership" value={lead.businessIdentity.ownershipType} />
                    <InfoRow label="Is Franchise" value={lead.businessIdentity.isFranchise ? 'Yes' : 'No'} />
                    <InfoRow label="NAICS" value={lead.businessIdentity.naicsDescription} />
                    <InfoRow label="SIC" value={lead.businessIdentity.sicDescription} />
                  </div>
                  {lead.businessIdentity.serviceAreas && lead.businessIdentity.serviceAreas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Service Areas:</p>
                      <div className="flex flex-wrap gap-1">
                        {lead.businessIdentity.serviceAreas.map((area, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* 2. Website Health */}
                <TabsContent value="website" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website Health & Digital Foundation
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <MiniScore label="Mobile Score" value={lead.websiteHealth.mobileScore} />
                    <MiniScore label="Page Speed" value={lead.websiteHealth.pageSpeedScore} />
                    <MiniScore label="SEO Quality" value={lead.websiteHealth.seoQuality.score} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Has Website" value={lead.websiteHealth.hasWebsite ? 'Yes' : 'No'} badge />
                    <InfoRow label="CMS" value={lead.websiteHealth.cms} />
                    <InfoRow label="Hosting" value={lead.websiteHealth.hostingProvider} />
                    <InfoRow label="Domain Age" value={lead.websiteHealth.domainAge ? `${Math.floor(lead.websiteHealth.domainAge / 365)} years` : undefined} />
                    <InfoRow label="Load Time" value={lead.websiteHealth.loadTime ? `${lead.websiteHealth.loadTime}ms` : undefined} />
                    <InfoRow label="Mobile Responsive" value={lead.websiteHealth.isMobileResponsive ? 'Yes' : 'No'} badge />
                  </div>

                  <IssuesList title="SEO Issues" issues={lead.websiteHealth.seoQuality.issues} />
                  <IssuesList title="Technical Issues" issues={lead.websiteHealth.technicalHealth.issues} />
                  <IssuesList title="Tracking Issues" issues={lead.websiteHealth.trackingInfrastructure.issues} />
                  <IssuesList title="Conversion Issues" issues={lead.websiteHealth.conversionReadiness.issues} />
                </TabsContent>

                {/* 3. Online Visibility */}
                <TabsContent value="visibility" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Online Visibility & Market Presence
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniScore label="Visibility Score" value={lead.onlineVisibility.visibilityScore} />
                    <MiniScore label="Citation Accuracy" value={lead.onlineVisibility.citationConsistency} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="GBP Listed" value={lead.onlineVisibility.businessListings.hasGoogleBusinessProfile ? 'Yes' : 'No'} badge />
                    <InfoRow label="GBP Optimization" value={lead.onlineVisibility.businessListings.gbpOptimizationScore?.toString()} />
                    <InfoRow label="Backlinks" value={lead.onlineVisibility.backlinkProfile.totalBacklinks?.toString()} />
                    <InfoRow label="Domain Authority" value={lead.onlineVisibility.backlinkProfile.domainAuthority?.toString()} />
                  </div>
                  {lead.onlineVisibility.businessListings.directoryListings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Directory Listings:</p>
                      <div className="flex flex-wrap gap-1">
                        {lead.onlineVisibility.businessListings.directoryListings.map((dir, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{dir}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* 4. Reputation */}
                <TabsContent value="reputation" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Reputation, Reviews & Sentiment
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <InfoRow label="Overall Rating" value={lead.reputation.overallRating?.toFixed(1)} />
                    <InfoRow label="Total Reviews" value={lead.reputation.totalReviews.toString()} />
                    <InfoRow label="Review Velocity" value={lead.reputation.reviewVelocity ? `${lead.reputation.reviewVelocity}/month` : undefined} />
                  </div>
                  
                  {lead.reputation.reviewsByPlatform.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">By Platform:</p>
                      {lead.reputation.reviewsByPlatform.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{p.platform}</span>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{p.rating?.toFixed(1)}</span>
                            <span className="text-muted-foreground">({p.reviewCount})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 rounded bg-emerald-500/10">
                      <p className="text-lg font-bold text-emerald-600">{lead.reputation.sentimentBreakdown.positive}%</p>
                      <p className="text-xs text-muted-foreground">Positive</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted">
                      <p className="text-lg font-bold">{lead.reputation.sentimentBreakdown.neutral}%</p>
                      <p className="text-xs text-muted-foreground">Neutral</p>
                    </div>
                    <div className="text-center p-2 rounded bg-red-500/10">
                      <p className="text-lg font-bold text-red-600">{lead.reputation.sentimentBreakdown.negative}%</p>
                      <p className="text-xs text-muted-foreground">Negative</p>
                    </div>
                  </div>

                  {lead.reputation.complaintPatterns.length > 0 && (
                    <IssuesList title="Common Complaints" issues={lead.reputation.complaintPatterns} />
                  )}
                </TabsContent>

                {/* 5. Opportunity Analysis */}
                <TabsContent value="opportunity" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    AI Opportunity & Growth Recommendations
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <MiniScore label="Opportunity Score" value={lead.opportunityAnalysis.opportunityScore} />
                    <MiniScore label="Urgency Score" value={lead.opportunityAnalysis.urgencyScore} />
                  </div>
                  
                  <Badge variant="outline" className={priorityColors[lead.opportunityAnalysis.priorityLevel === 'critical' ? 'hot' : lead.opportunityAnalysis.priorityLevel === 'high' ? 'hot' : lead.opportunityAnalysis.priorityLevel === 'medium' ? 'warm' : 'cold']}>
                    Priority: {lead.opportunityAnalysis.priorityLevel.toUpperCase()}
                  </Badge>

                  {lead.opportunityAnalysis.recommendedServices.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Recommended Services to Pitch:</p>
                      {lead.opportunityAnalysis.recommendedServices.map((svc, i) => (
                        <div key={i} className="p-2 bg-primary/5 border border-primary/20 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{svc.service}</span>
                            <Badge variant={svc.priority === 'high' ? 'default' : 'secondary'}>{svc.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{svc.reasoning}</p>
                          {svc.estimatedValue && (
                            <p className="text-xs text-emerald-600 mt-1">Est. Value: ${svc.estimatedValue.toLocaleString()}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <GapsList title="SEO Gaps" gaps={lead.opportunityAnalysis.gapAnalysis.seoGaps} />
                  <GapsList title="Content Gaps" gaps={lead.opportunityAnalysis.gapAnalysis.contentGaps} />
                  <GapsList title="Conversion Gaps" gaps={lead.opportunityAnalysis.gapAnalysis.conversionGaps} />
                </TabsContent>

                {/* 6. Tech Stack */}
                <TabsContent value="tech" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Technology Stack
                  </h4>
                  <TechList title="Analytics" items={lead.techStack.analytics} />
                  <TechList title="Marketing Automation" items={lead.techStack.marketingAutomation} />
                  <TechList title="CRM Tools" items={lead.techStack.crmTools} />
                  <TechList title="Ad Platforms" items={lead.techStack.adPlatforms} />
                  <TechList title="Chat Tools" items={lead.techStack.chatTools} />
                  <TechList title="E-commerce" items={lead.techStack.ecommerceplatform ? [lead.techStack.ecommerceplatform] : []} />
                  <TechList title="Detected Technologies" items={lead.techStack.detectedTechnologies} />
                </TabsContent>

                {/* 7. Intent Signals */}
                <TabsContent value="intent" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Buyer Intent & Engagement Signals
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniScore label="Intent Score" value={lead.intentSignals.intentScore} />
                    <MiniScore label="Purchase Likelihood" value={lead.intentSignals.predictedPurchaseLikelihood} />
                  </div>
                  
                  {lead.intentSignals.hiringActivity.isHiring && (
                    <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <p className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Currently Hiring
                      </p>
                      {lead.intentSignals.hiringActivity.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.intentSignals.hiringActivity.roles.map((role, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <SignalList title="Funding Signals" signals={lead.intentSignals.fundingSignals} />
                  <SignalList title="Website Activity" signals={lead.intentSignals.websiteActivitySignals} />
                  <SignalList title="Marketing Activity" signals={lead.intentSignals.marketingActivitySignals} />
                  <SignalList title="Seasonal Signals" signals={lead.intentSignals.seasonalSignals} />
                </TabsContent>

                {/* 8. Competitors */}
                <TabsContent value="competitors" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Competitor Context & Market Positioning
                  </h4>
                  
                  {lead.competitorAnalysis.marketShareIndicator && (
                    <Badge variant="outline">Market Position: {lead.competitorAnalysis.marketShareIndicator}</Badge>
                  )}

                  {lead.competitorAnalysis.directCompetitors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Direct Competitors:</p>
                      {lead.competitorAnalysis.directCompetitors.map((comp, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{comp.name}</span>
                            {comp.rating && (
                              <span className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {comp.rating}
                              </span>
                            )}
                          </div>
                          {comp.strengths.length > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">+ {comp.strengths.join(', ')}</p>
                          )}
                          {comp.weaknesses.length > 0 && (
                            <p className="text-xs text-red-600">- {comp.weaknesses.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <GapsList title="Competitive Gaps" gaps={lead.competitorAnalysis.competitiveGaps} />
                  <GapsList title="Differentiation Opportunities" gaps={lead.competitorAnalysis.differentiationOpportunities} />
                </TabsContent>

                {/* 9. Outreach */}
                <TabsContent value="outreach" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Sales Outreach Intelligence
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <MiniScore label="Contact Priority" value={lead.outreachIntelligence.contactPriorityScore} />
                    <MiniScore label="Engagement Likelihood" value={lead.outreachIntelligence.engagementLikelihood} />
                  </div>

                  <div className="p-3 bg-primary/5 rounded border border-primary/20">
                    <p className="text-sm font-medium">Recommended Approach:</p>
                    <Badge variant="secondary" className="mt-1">
                      {lead.outreachIntelligence.suggestedApproach.recommendedChannel}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tone: {lead.outreachIntelligence.suggestedApproach.toneRecommendation}
                    </p>
                  </div>

                  {lead.outreachIntelligence.decisionMakers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Decision Makers:</p>
                      {lead.outreachIntelligence.decisionMakers.map((dm, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                          <p className="font-medium">{dm.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{dm.title}</p>
                          <div className="flex gap-2 mt-1">
                            {dm.email && <Badge variant="outline" className="text-xs">{dm.email}</Badge>}
                            {dm.linkedin && <Badge variant="outline" className="text-xs">LinkedIn</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lead.outreachIntelligence.suggestedApproach.messagingHooks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Messaging Hooks:</p>
                      {lead.outreachIntelligence.suggestedApproach.messagingHooks.map((hook, i) => (
                        <p key={i} className="text-sm p-2 bg-muted/50 rounded">💡 {hook}</p>
                      ))}
                    </div>
                  )}

                  {lead.outreachIntelligence.objectionPredictions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Predicted Objections & Rebuttals:</p>
                      {lead.outreachIntelligence.objectionPredictions.map((obj, i) => (
                        <div key={i} className="p-2 bg-amber-500/10 rounded text-sm">
                          <p className="text-amber-700">❓ {obj.objection}</p>
                          <p className="text-emerald-700 mt-1">✓ {obj.rebuttal}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 10. Compliance */}
                <TabsContent value="compliance" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Compliance, Trust & Security
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Cookie Consent" value={lead.compliance.privacyCompliance.hasCookieConsent ? 'Yes' : 'No'} badge />
                    <InfoRow label="Privacy Policy" value={lead.compliance.privacyCompliance.hasPrivacyPolicy ? 'Yes' : 'No'} badge />
                    <InfoRow label="GDPR Compliant" value={lead.compliance.privacyCompliance.gdprCompliant === true ? 'Yes' : lead.compliance.privacyCompliance.gdprCompliant === false ? 'No' : 'Unknown'} />
                    <InfoRow label="SSL Valid" value={lead.compliance.securityIndicators.sslValid ? 'Yes' : 'No'} badge />
                    <InfoRow label="Security Headers" value={lead.compliance.securityIndicators.securityHeaders ? 'Yes' : 'No'} badge />
                    <InfoRow label="WCAG Level" value={lead.compliance.accessibilityCompliance.wcagLevel} />
                  </div>

                  <IssuesList title="Privacy Issues" issues={lead.compliance.privacyCompliance.issues} />
                  <IssuesList title="Security Issues" issues={lead.compliance.securityIndicators.issues} />
                  <IssuesList title="Risk Flags" issues={lead.compliance.riskFlags} />
                </TabsContent>

                {/* 11. AI Summary / SWOT */}
                <TabsContent value="summary" className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Summary & SWOT Analysis
                  </h4>

                  <div className="p-3 bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded">
                    <p className="text-sm">{lead.aiSummary.insightSummary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <p className="text-xs font-medium text-emerald-700 mb-2">💪 Strengths</p>
                      <ul className="text-xs space-y-1">
                        {lead.aiSummary.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                      <p className="text-xs font-medium text-red-700 mb-2">⚠️ Weaknesses</p>
                      <ul className="text-xs space-y-1">
                        {lead.aiSummary.weaknesses.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                      <p className="text-xs font-medium text-blue-700 mb-2">🎯 Opportunities</p>
                      <ul className="text-xs space-y-1">
                        {lead.aiSummary.opportunities.map((o, i) => (
                          <li key={i}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
                      <p className="text-xs font-medium text-amber-700 mb-2">⚡ Threats</p>
                      <ul className="text-xs space-y-1">
                        {lead.aiSummary.threats.map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {lead.aiSummary.outreachTalkingPoints.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Outreach Talking Points:</p>
                      {lead.aiSummary.outreachTalkingPoints.map((tp, i) => (
                        <p key={i} className="text-sm p-2 bg-muted/50 rounded">📌 {tp}</p>
                      ))}
                    </div>
                  )}

                  {lead.aiSummary.suggestedPitchAngle && (
                    <div className="p-3 bg-primary/10 rounded">
                      <p className="text-xs font-medium text-primary mb-1">Suggested Pitch Angle:</p>
                      <p className="text-sm">{lead.aiSummary.suggestedPitchAngle}</p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Helper components
function InfoRow({ label, value, badge = false }: { label: string; value?: string; badge?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}:</span>
      {badge ? (
        <Badge variant="outline" className="text-xs">{value}</Badge>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value?: number }) {
  const score = value ?? 0;
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="text-center p-2 bg-muted/50 rounded">
      <p className={`text-xl font-bold ${color}`}>{score}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function IssuesList({ title, issues }: { title: string; issues: string[] }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{title}:</p>
      {issues.map((issue, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-red-600 p-1 bg-red-500/5 rounded">
          <AlertTriangle className="w-3 h-3" />
          {issue}
        </div>
      ))}
    </div>
  );
}

function GapsList({ title, gaps }: { title: string; gaps: string[] }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{title}:</p>
      {gaps.map((gap, i) => (
        <div key={i} className="flex items-center gap-2 text-xs p-1 bg-amber-500/10 rounded">
          <Target className="w-3 h-3 text-amber-600" />
          {gap}
        </div>
      ))}
    </div>
  );
}

function TechList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{title}:</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function SignalList({ title, signals }: { title: string; signals: string[] }) {
  if (!signals || signals.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{title}:</p>
      {signals.map((signal, i) => (
        <div key={i} className="flex items-center gap-2 text-xs p-1 bg-emerald-500/10 rounded">
          <Zap className="w-3 h-3 text-emerald-600" />
          {signal}
        </div>
      ))}
    </div>
  );
}
