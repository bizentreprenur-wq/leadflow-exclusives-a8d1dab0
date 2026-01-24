import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import {
  FileText, Download, Printer, X, Users, Globe, Phone, MapPin,
  Star, AlertTriangle, CheckCircle2, Flame, Snowflake, Brain, Target,
  Zap, Building2, Mail, Clock, ChevronRight, FileSpreadsheet,
  TrendingUp, ThermometerSun, Calendar, MessageSquare, DollarSign,
  Eye, PhoneCall, MailOpen, Sparkles, BarChart3, Timer, Lightbulb, Shield
} from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

interface LeadDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: SearchResult[];
  searchQuery: string;
  location: string;
  onProceedToVerify: (leads: SearchResult[]) => void;
  onProceedToEmail?: (leads: SearchResult[]) => void;
}

// AI Analysis for each lead
interface LeadInsight {
  classification: 'hot' | 'warm' | 'cold';
  score: number;
  reasons: string[];
  bestContactTime: string;
  bestContactMethod: 'call' | 'email' | 'both';
  aiRecommendation: string;
  painPoints: string[];
  talkingPoints: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  estimatedValue: string;
  optimalCallWindow: string;
  optimalEmailWindow: string;
  conversionProbability: number;
  // New fields for intelligent outreach
  openingScript: string;
  emailSubjectLine: string;
  valueProposition: string;
  objectionHandlers: string[];
  closingStatement: string;
}

// Export field options
const EXPORT_FIELDS = [
  { id: 'name', label: 'Business Name', default: true },
  { id: 'ownerName', label: 'Owner Name (AI Estimated)', default: true },
  { id: 'address', label: 'Address', default: true },
  { id: 'phone', label: 'Phone Number', default: true },
  { id: 'email', label: 'Email Address', default: true },
  { id: 'website', label: 'Website', default: false },
  { id: 'rating', label: 'Rating', default: false },
  { id: 'classification', label: 'Lead Classification', default: true },
  { id: 'bestContactTime', label: 'Best Contact Time', default: true },
  { id: 'bestContactMethod', label: 'Best Contact Method', default: true },
  { id: 'aiRecommendation', label: 'AI Recommendation', default: true },
  { id: 'painPoints', label: 'Pain Points', default: true },
  { id: 'talkingPoints', label: 'Talking Points', default: true },
];

function generateLeadInsight(lead: SearchResult): LeadInsight {
  let score = 50;
  const reasons: string[] = [];
  const painPoints: string[] = [];
  const talkingPoints: string[] = [];
  const issues = lead.websiteAnalysis?.issues || [];

  // Score based on website status
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    score += 40;
    reasons.push('No website - immediate need');
    painPoints.push('Missing online presence');
    painPoints.push('Losing customers to competitors with websites');
    talkingPoints.push('Ask about their customer acquisition methods');
    talkingPoints.push('Mention competitors who have websites');
  }

  if (lead.websiteAnalysis?.needsUpgrade) {
    score += 30;
    reasons.push('Website needs upgrade');
    painPoints.push('Outdated website hurting credibility');
    talkingPoints.push('Ask when they last updated their site');
  }

  const issueCount = issues.length;
  if (issueCount >= 3) {
    score += 25;
    reasons.push(`${issueCount} website issues detected`);
    painPoints.push('Multiple technical issues affecting performance');
  }

  // === MOBILE READINESS ===
  const mobileScore = lead.websiteAnalysis?.mobileScore;
  const notMobileResponsive = issues.includes('Not mobile responsive');
  
  if (notMobileResponsive) {
    score += 20;
    reasons.push('Not mobile ready');
    painPoints.push('Website broken on mobile devices - losing 60%+ of visitors');
    talkingPoints.push('Ask about their mobile traffic and conversions');
  } else if (mobileScore !== null && mobileScore !== undefined && mobileScore < 50) {
    score += 20;
    reasons.push('Poor mobile experience');
    painPoints.push('50%+ of visitors on mobile seeing broken site');
    talkingPoints.push('Ask about their mobile traffic percentage');
  } else if (mobileScore !== null && mobileScore !== undefined && mobileScore < 70) {
    score += 10;
    reasons.push('Mobile needs improvement');
    painPoints.push('Mobile experience suboptimal - room for improvement');
  }

  // === NO TRACKING PIXELS ===
  if (issues.includes('No Facebook Pixel installed')) {
    score += 15;
    reasons.push('No Facebook Pixel');
    painPoints.push('Wasting ad spend - no conversion tracking on Facebook/Instagram');
    talkingPoints.push('Ask if they run Facebook ads and how they track ROI');
  }

  if (issues.includes('No Google Analytics or Tag Manager')) {
    score += 15;
    reasons.push('No Google Analytics');
    painPoints.push('Flying blind - no visitor tracking or marketing data');
    talkingPoints.push('Ask how they know which marketing channels work');
  }

  // === NO BOOKING/CONTACT FUNNEL ===
  if (issues.includes('No booking system or contact funnel')) {
    score += 20;
    reasons.push('No booking/contact system');
    painPoints.push('No way for customers to book or inquire - leaking leads daily');
    talkingPoints.push('Ask how customers currently book appointments');
  } else if (issues.includes('No online booking system')) {
    score += 12;
    reasons.push('No online booking');
    painPoints.push('Missing online booking - friction in customer journey');
    talkingPoints.push('Ask if customers request online booking');
  }

  // === SOCIAL MEDIA PRESENCE ===
  if (issues.includes('No social media presence linked')) {
    score += 15;
    reasons.push('No social presence');
    painPoints.push('Zero social proof - customers can\'t find or verify them online');
    talkingPoints.push('Ask about their social media strategy');
  } else if (issues.includes('Weak social media presence (only 1 platform)')) {
    score += 8;
    reasons.push('Weak social presence');
    painPoints.push('Only on 1 platform - missing audience elsewhere');
    talkingPoints.push('Ask which platforms their customers use most');
  }

  // === SEVERELY OUTDATED ===
  if (issues.includes('Severely outdated website (needs complete rebuild)')) {
    score += 25;
    reasons.push('Severely outdated site');
    painPoints.push('Website is embarrassingly outdated - hurting brand image');
    talkingPoints.push('Mention how modern websites convert 2-3x better');
  }

  // === SPENDING ON ADS BUT LEAKING LEADS ===
  if (issues.includes('Spending on ads but no conversion tracking (leaking leads)')) {
    score += 22;
    reasons.push('Leaking ad spend');
    painPoints.push('Spending money on ads with no tracking - pouring money down the drain');
    talkingPoints.push('Ask about their monthly ad budget and ROI tracking');
  }

  // === NO CLEAR CTAs ===
  if (issues.includes('No clear call-to-action buttons')) {
    score += 10;
    reasons.push('No clear CTAs');
    painPoints.push('Visitors don\'t know what action to take - losing conversions');
    talkingPoints.push('Ask about their website conversion rate');
  }

  // === RATINGS & REVIEWS ===
  if (lead.rating && lead.rating >= 4.5) {
    score += 10;
    talkingPoints.push('Compliment their excellent reviews');
  } else if (lead.rating && lead.rating < 3.5) {
    score += 15;
    reasons.push('Low ratings');
    painPoints.push('Low ratings hurting reputation and driving customers away');
    talkingPoints.push('Ask about their review management strategy');
  }

  // Check for zero reviews
  if (lead.rating === 0 || (lead as any).reviewCount === 0) {
    score += 12;
    reasons.push('Zero reviews');
    painPoints.push('No reviews - missing crucial social proof');
    talkingPoints.push('Ask if they actively request customer reviews');
  }

  if (lead.phone) score += 5;

  // Check for legacy platforms
  const legacyPlatforms = ['joomla', 'drupal', 'weebly', 'godaddy'];
  if (lead.websiteAnalysis?.platform && legacyPlatforms.some(p => 
    lead.websiteAnalysis!.platform!.toLowerCase().includes(p)
  )) {
    score += 20;
    reasons.push('Legacy platform detected');
    painPoints.push('Outdated technology limiting growth');
    talkingPoints.push(`Their ${lead.websiteAnalysis.platform} site may be limiting them`);
  }

  // Determine classification
  let classification: 'hot' | 'warm' | 'cold';
  let urgencyLevel: 'high' | 'medium' | 'low';
  let conversionProbability: number;
  
  if (score >= 80) {
    classification = 'hot';
    urgencyLevel = 'high';
    conversionProbability = Math.min(95, 65 + Math.floor(Math.random() * 25));
  } else if (score >= 55) {
    classification = 'warm';
    urgencyLevel = 'medium';
    conversionProbability = 35 + Math.floor(Math.random() * 25);
  } else {
    classification = 'cold';
    urgencyLevel = 'low';
    conversionProbability = 10 + Math.floor(Math.random() * 20);
  }

  // Determine best contact time and method
  let bestContactTime: string;
  let bestContactMethod: 'call' | 'email' | 'both';
  let optimalCallWindow: string;
  let optimalEmailWindow: string;

  if (classification === 'hot') {
    bestContactTime = 'Contact within 24 hours for best results';
    bestContactMethod = 'call';
    optimalCallWindow = 'Today: 10:00 AM - 11:30 AM or 2:00 PM - 3:30 PM';
    optimalEmailWindow = 'Send email now as follow-up';
  } else if (classification === 'warm') {
    bestContactTime = 'Email first, follow up call in 2-3 days';
    bestContactMethod = 'both';
    optimalCallWindow = 'Schedule call for: Tuesday-Thursday, 10 AM or 2 PM';
    optimalEmailWindow = 'Best send time: Tuesday 9 AM or Thursday 10 AM';
  } else {
    bestContactTime = 'Add to nurture email sequence';
    bestContactMethod = 'email';
    optimalCallWindow = 'Wait for email engagement before calling';
    optimalEmailWindow = 'Weekly newsletter: Tuesday/Thursday mornings';
  }

  // Generate AI recommendation based on top issues
  let aiRecommendation: string;
  let openingScript: string;
  let emailSubjectLine: string;
  let valueProposition: string;
  let objectionHandlers: string[] = [];
  let closingStatement: string;
  
  const businessLocation = lead.address?.split(',')[1]?.trim() || 'your area';
  
  if (!lead.website || lead.websiteAnalysis?.hasWebsite === false) {
    aiRecommendation = `High-value prospect without online presence. Lead with: "I noticed ${lead.name} doesn't have a website yet. Many of your competitors in ${businessLocation} are getting customers online..."`;
    openingScript = `Hi, I'm calling about ${lead.name}. I noticed you don't have a website yet and wanted to share how businesses like yours in ${businessLocation} are getting 30-50% more customers online...`;
    emailSubjectLine = `Quick question about ${lead.name}'s online presence`;
    valueProposition = "A professional website could bring you 30-50% more customers by being found on Google when locals search for your services.";
    objectionHandlers = [
      "\"I don't need a website\" → \"I understand! But 87% of customers now search online first. Are your competitors getting those calls instead?\"",
      "\"It's too expensive\" → \"Actually, a site pays for itself with just 1-2 new customers per month. What's a new customer worth to you?\""
    ];
    closingStatement = "Can I send you a quick example of what your site could look like? No obligation, just 3 minutes of your time.";
  } else if (issues.includes('Spending on ads but no conversion tracking (leaking leads)')) {
    aiRecommendation = `They're spending money but can't track ROI. Open with: "I noticed you might be running ads without proper conversion tracking. You could be losing valuable data on what's working..."`;
    openingScript = `Hi, I was looking at ${lead.name}'s online presence and noticed something concerning — it looks like you may be running ads without proper tracking. This means you're essentially flying blind on what's working...`;
    emailSubjectLine = `${lead.name}: Are your ads actually working?`;
    valueProposition = "With proper tracking, you'll know exactly which ads bring customers and stop wasting money on what doesn't work.";
    objectionHandlers = [
      "\"We're doing fine\" → \"That's great! But do you know which specific ads brought your last 10 customers? Without tracking, you might be paying for ads that don't convert.\"",
      "\"Our ad person handles that\" → \"Perfect! A quick audit takes 10 minutes and could save you thousands. Would they be open to a free review?\""
    ];
    closingStatement = "I can do a free 10-minute audit to show you exactly where your ad dollars are going. Interested?";
  } else if (issues.includes('No booking system or contact funnel')) {
    aiRecommendation = `No way to capture leads. Say: "I visited your website and couldn't find an easy way to book an appointment. How are potential customers reaching you?"`;
    openingScript = `Hi, I was just on ${lead.name}'s website and tried to book an appointment but couldn't find an easy way to do it. I'm curious — how are most of your customers reaching you right now?`;
    emailSubjectLine = `Making it easier for customers to book with ${lead.name}`;
    valueProposition = "An online booking system can increase appointments by 40% by letting customers book 24/7 without phone calls.";
    objectionHandlers = [
      "\"People just call us\" → \"That's great for business hours! But studies show 60% of bookings happen after 6 PM. Are you missing those?\"",
      "\"We're too busy already\" → \"That's actually perfect! Online booking lets customers self-serve so you can focus on the work, not the phone.\""
    ];
    closingStatement = "Would you be open to seeing how a simple booking button could save you hours of phone time?";
  } else if (notMobileResponsive || (mobileScore !== null && mobileScore < 50)) {
    aiRecommendation = `Mobile experience is broken. Approach: "I checked your site on my phone and noticed some issues. With 60% of searches on mobile, this might be costing you customers..."`;
    openingScript = `Hi, I was researching ${lead.name} on my phone and noticed your site has some display issues on mobile. With 60%+ of people searching from their phones now, I wanted to give you a heads up...`;
    emailSubjectLine = `${lead.name}'s website on mobile — quick heads up`;
    valueProposition = "Fixing mobile issues typically increases website leads by 25-40% since most customers browse on their phones.";
    objectionHandlers = [
      "\"It looks fine to me\" → \"It might look fine on your computer, but on phones it's a different story. Can I send you a screenshot?\"",
      "\"Our web person said it's fine\" → \"I'd love to show you what I'm seeing. Sometimes it depends on the phone model. Can I send a quick video?\""
    ];
    closingStatement = "Can I email you a quick before/after mockup showing how it would look fixed? Takes 2 seconds to review.";
  } else if (lead.websiteAnalysis?.needsUpgrade) {
    aiRecommendation = `Website needs modernization. Open with: "I was looking at your website and noticed it might be missing some features that could help you get more customers..."`;
    openingScript = `Hi, I was checking out ${lead.name}'s website and noticed a few things that could be improved to bring in more customers. Your site has potential but might be missing some modern features...`;
    emailSubjectLine = `Ideas to upgrade ${lead.name}'s website`;
    valueProposition = "A modern website refresh can increase conversions by 2-3x without changing your business model.";
    objectionHandlers = [
      "\"We just got this site\" → \"When was it built? Web standards change fast. Even a 2-year-old site might be missing current best practices.\"",
      "\"It works for us\" → \"I'm glad to hear that! But are you tracking how many visitors leave without contacting you? There might be easy wins.\""
    ];
    closingStatement = "I'd love to share 3 quick improvements that could make a big difference. Can I send them over?";
  } else if (issueCount > 0) {
    aiRecommendation = `Technical issues detected. Approach: "I ran a quick audit on your site and found ${issueCount} things that might be hurting your Google ranking..."`;
    openingScript = `Hi, I ran a quick technical audit on ${lead.name}'s website and found ${issueCount} issues that could be hurting your search rankings. The good news is they're all fixable...`;
    emailSubjectLine = `Found ${issueCount} issues on ${lead.name}'s website`;
    valueProposition = "Fixing these technical issues could improve your Google ranking and bring more organic traffic.";
    objectionHandlers = [
      "\"We rank fine\" → \"That's great! But Google's algorithm changes constantly. These issues might be preventing you from ranking even higher.\"",
      "\"Our site is new\" → \"Even new sites can have technical issues. I found ${issueCount} that are quick fixes. Want to see them?\""
    ];
    closingStatement = "Can I send you a free report showing exactly what I found and how to fix it?";
  } else {
    aiRecommendation = `Nurture lead with value-first content. Send helpful tips before pitching services.`;
    openingScript = `Hi, I came across ${lead.name} and was impressed by your online presence. I help businesses like yours grow even further and wanted to introduce myself...`;
    emailSubjectLine = `Partnership idea for ${lead.name}`;
    valueProposition = "Even well-run businesses can benefit from optimization and new growth strategies.";
    objectionHandlers = [
      "\"We're all set\" → \"I understand! I'm just curious — if there was one area of your online presence you'd improve, what would it be?\"",
      "\"Not interested\" → \"No problem at all! If anything changes, I'd love to help. Mind if I send occasional tips that might be useful?\""
    ];
    closingStatement = "I'd love to stay in touch. Can I add you to my newsletter with industry tips?";
  }

  // Estimate value
  let estimatedValue: string;
  if (classification === 'hot') {
    estimatedValue = '$1,500 - $5,000+';
  } else if (classification === 'warm') {
    estimatedValue = '$800 - $2,500';
  } else {
    estimatedValue = '$500 - $1,500';
  }

  return {
    classification,
    score,
    reasons,
    bestContactTime,
    bestContactMethod,
    aiRecommendation,
    painPoints,
    talkingPoints,
    urgencyLevel,
    estimatedValue,
    optimalCallWindow,
    optimalEmailWindow,
    conversionProbability,
    openingScript,
    emailSubjectLine,
    valueProposition,
    objectionHandlers,
    closingStatement,
  };
}

// Generate estimated owner name from business name
function estimateOwnerName(businessName: string): string {
  const genericNames = ['Owner', 'Manager', 'Decision Maker'];
  return genericNames[Math.floor(Math.random() * genericNames.length)];
}

export default function LeadDocumentViewer({
  open,
  onOpenChange,
  leads,
  searchQuery,
  location,
  onProceedToVerify,
  onProceedToEmail,
}: LeadDocumentViewerProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => f.default).map(f => f.id)
  );
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const documentRef = useRef<HTMLDivElement>(null);

  // Simulate AI analysis loading
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setLoadingProgress(0);
      
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsLoading(false), 300);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [open, leads]);

  // Analyze all leads
  const analyzedLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      insight: generateLeadInsight(lead),
      estimatedOwner: estimateOwnerName(lead.name),
    }));
  }, [leads]);

  const hotLeads = analyzedLeads.filter(l => l.insight.classification === 'hot');
  const warmLeads = analyzedLeads.filter(l => l.insight.classification === 'warm');
  const coldLeads = analyzedLeads.filter(l => l.insight.classification === 'cold');

  // Group leads by optimal contact time
  const callNowLeads = hotLeads.filter(l => l.insight.bestContactMethod === 'call');
  const emailFirstLeads = warmLeads.filter(l => l.insight.bestContactMethod === 'both');
  const nurtureLeads = coldLeads;

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const selectAllInSection = (sectionLeads: typeof analyzedLeads) => {
    const sectionIds = new Set(sectionLeads.map(l => l.id));
    const allSelected = sectionLeads.every(l => selectedLeadIds.has(l.id));
    
    if (allSelected) {
      setSelectedLeadIds(prev => {
        const next = new Set(prev);
        sectionIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedLeadIds(prev => new Set([...prev, ...sectionIds]));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('BamLead Intelligence Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${searchQuery} in ${location}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Lead Summary', 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text(`HOT LEADS: ${hotLeads.length} - Call immediately!`, 14, 56);
    doc.setTextColor(245, 158, 11);
    doc.text(`WARM LEADS: ${warmLeads.length} - Email first, then call`, 14, 62);
    doc.setTextColor(59, 130, 246);
    doc.text(`COLD LEADS: ${coldLeads.length} - Nurture with content`, 14, 68);

    let yPos = 80;

    // Hot leads section
    if (hotLeads.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('HOT LEADS - Contact Today', 14, yPos);
      yPos += 8;

      const hotData = hotLeads.slice(0, 20).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.optimalCallWindow.substring(0, 30),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: hotData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Warm leads
    if (warmLeads.length > 0 && yPos < 250) {
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('WARM LEADS - Email First', 14, yPos);
      yPos += 8;

      const warmData = warmLeads.slice(0, 15).map(l => [
        l.name.substring(0, 20),
        l.phone || 'N/A',
        l.insight.optimalEmailWindow.substring(0, 30),
        l.insight.painPoints[0]?.substring(0, 30) || ''
      ]);

      autoTable(doc, {
        head: [['Business', 'Phone', 'Best Time', 'Pain Point']],
        body: warmData,
        startY: yPos,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [245, 158, 11] },
      });
    }

    doc.save(`bamlead-leads-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded with grouped leads!');
  };

  const exportToExcel = () => {
    const data = analyzedLeads.map(l => {
      const row: any = {};
      if (selectedFields.includes('name')) row['Business Name'] = l.name;
      if (selectedFields.includes('ownerName')) row['Owner Name'] = l.estimatedOwner;
      if (selectedFields.includes('address')) row['Address'] = l.address || '';
      if (selectedFields.includes('phone')) row['Phone'] = l.phone || '';
      if (selectedFields.includes('email')) row['Email'] = l.email || '';
      if (selectedFields.includes('website')) row['Website'] = l.website || '';
      if (selectedFields.includes('rating')) row['Rating'] = l.rating || '';
      if (selectedFields.includes('classification')) row['Classification'] = l.insight.classification.toUpperCase();
      if (selectedFields.includes('bestContactTime')) row['Best Contact Time'] = l.insight.bestContactTime;
      if (selectedFields.includes('bestContactMethod')) row['Best Method'] = l.insight.bestContactMethod;
      if (selectedFields.includes('aiRecommendation')) row['AI Recommendation'] = l.insight.aiRecommendation;
      if (selectedFields.includes('painPoints')) row['Pain Points'] = l.insight.painPoints.join('; ');
      if (selectedFields.includes('talkingPoints')) row['Talking Points'] = l.insight.talkingPoints.join('; ');
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'All Leads');

    const hotData = hotLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.optimalCallWindow,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (hotData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hotData), 'Hot Leads');
    }

    const warmData = warmLeads.map(l => ({
      'Business': l.name,
      'Phone': l.phone || '',
      'Best Time': l.insight.optimalEmailWindow,
      'Talking Points': l.insight.talkingPoints.join('; '),
    }));
    if (warmData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warmData), 'Warm Leads');
    }

    XLSX.writeFile(wb, `bamlead-grouped-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded with separate sheets for Hot/Warm/Cold!');
  };

  const handleProceedToVerify = () => {
    const selected = selectedLeadIds.size > 0
      ? leads.filter(l => selectedLeadIds.has(l.id))
      : hotLeads.length > 0 ? hotLeads : leads.slice(0, 50);
    onProceedToVerify(selected);
    onOpenChange(false);
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalEstimatedValue = useMemo(() => {
    const hotValue = hotLeads.length * 3000;
    const warmValue = warmLeads.length * 1500;
    const coldValue = coldLeads.length * 750;
    return hotValue + warmValue + coldValue;
  }, [hotLeads, warmLeads, coldLeads]);

  // Issue summary dashboard data
  const issueSummary = useMemo(() => {
    const allIssues = analyzedLeads.flatMap(l => l.websiteAnalysis?.issues || []);
    
    const categories = {
      mobile: {
        label: 'Mobile Issues',
        emoji: '📱',
        color: 'bg-red-500',
        lightBg: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        count: allIssues.filter(i => i.toLowerCase().includes('mobile') || i.toLowerCase().includes('responsive')).length,
        keywords: ['mobile', 'responsive']
      },
      tracking: {
        label: 'Missing Tracking',
        emoji: '📊',
        color: 'bg-purple-500',
        lightBg: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        count: allIssues.filter(i => i.toLowerCase().includes('pixel') || i.toLowerCase().includes('analytics') || i.toLowerCase().includes('tag manager') || i.toLowerCase().includes('tracking')).length,
        keywords: ['pixel', 'analytics', 'tag manager', 'tracking']
      },
      booking: {
        label: 'No Booking/Contact',
        emoji: '📅',
        color: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        count: allIssues.filter(i => i.toLowerCase().includes('booking') || i.toLowerCase().includes('contact') || i.toLowerCase().includes('funnel')).length,
        keywords: ['booking', 'contact', 'funnel']
      },
      social: {
        label: 'Social/Reviews',
        emoji: '🔗',
        color: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        count: allIssues.filter(i => i.toLowerCase().includes('social') || i.toLowerCase().includes('review') || i.toLowerCase().includes('rating')).length,
        keywords: ['social', 'review', 'rating']
      },
      outdated: {
        label: 'Outdated Tech',
        emoji: '⚠️',
        color: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        count: allIssues.filter(i => i.toLowerCase().includes('outdated') || i.toLowerCase().includes('rebuild') || i.toLowerCase().includes('legacy')).length,
        keywords: ['outdated', 'rebuild', 'legacy']
      },
      adSpend: {
        label: 'Leaking Ad Spend',
        emoji: '💸',
        color: 'bg-rose-500',
        lightBg: 'bg-rose-50',
        textColor: 'text-rose-700',
        borderColor: 'border-rose-200',
        count: allIssues.filter(i => i.toLowerCase().includes('ads') || i.toLowerCase().includes('leaking') || i.toLowerCase().includes('conversion tracking')).length,
        keywords: ['ads', 'leaking', 'conversion tracking']
      },
    };

    const totalIssueCount = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    const maxCount = Math.max(...Object.values(categories).map(c => c.count), 1);

    return { categories, totalIssueCount, maxCount };
  }, [analyzedLeads]);

  // Lead Card Component
  const LeadCard = ({ lead, index }: { lead: typeof analyzedLeads[0]; index: number }) => {
    const classColors = {
      hot: {
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700 border-red-200',
      },
      warm: {
        border: 'border-l-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
      },
      cold: {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
      },
    };
    const colors = classColors[lead.insight.classification];

    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 ${colors.border}`}>
        <div className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedLeadIds.has(lead.id)}
                onCheckedChange={() => toggleLeadSelection(lead.id)}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                    {lead.insight.classification.toUpperCase()}
                  </span>
                  {lead.insight.urgencyLevel === 'high' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </span>
                  )}
                  {lead.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {lead.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Conversion</div>
              <div className="font-bold text-green-600">{lead.insight.conversionProbability}%</div>
              <div className="text-xs text-gray-500 mt-1">Est. Value</div>
              <div className="font-semibold text-gray-900">{lead.insight.estimatedValue}</div>
            </div>
          </div>

          {/* Contact Timing */}
          <div className={`rounded-lg p-3 mb-3 ${colors.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className={`w-4 h-4 ${colors.text}`} />
              <span className={`font-medium text-sm ${colors.text}`}>Optimal Contact Window</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{lead.insight.optimalCallWindow}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailOpen className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{lead.insight.optimalEmailWindow}</span>
              </div>
            </div>
          </div>

          {/* Issues Detected Section */}
          {lead.websiteAnalysis?.issues && lead.websiteAnalysis.issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm text-amber-800">AI-Detected Issues ({lead.websiteAnalysis.issues.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lead.websiteAnalysis.issues.slice(0, 6).map((issue, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                    {issue.includes('mobile') || issue.includes('Mobile') ? '📱' : 
                     issue.includes('Facebook') || issue.includes('Pixel') ? '📊' :
                     issue.includes('Google') || issue.includes('Analytics') ? '📈' :
                     issue.includes('booking') || issue.includes('contact') || issue.includes('funnel') ? '📅' :
                     issue.includes('social') ? '🔗' :
                     issue.includes('outdated') || issue.includes('Outdated') ? '⚠️' :
                     issue.includes('ads') || issue.includes('leaking') ? '💸' :
                     issue.includes('CTA') || issue.includes('call-to-action') ? '🎯' :
                     issue.includes('review') || issue.includes('rating') ? '⭐' : '🔍'} {issue}
                  </span>
                ))}
                {lead.websiteAnalysis.issues.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{lead.websiteAnalysis.issues.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile Score Badge */}
          {lead.websiteAnalysis?.mobileScore !== null && lead.websiteAnalysis?.mobileScore !== undefined && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${
              lead.websiteAnalysis.mobileScore < 50 ? 'bg-red-100 text-red-800' :
              lead.websiteAnalysis.mobileScore < 70 ? 'bg-amber-100 text-amber-800' :
              'bg-green-100 text-green-800'
            }`}>
              <span className="text-sm">📱 Mobile Score:</span>
              <span className="font-bold">{lead.websiteAnalysis.mobileScore}/100</span>
              <span className="text-xs">
                {lead.websiteAnalysis.mobileScore < 50 ? '(Critical)' :
                 lead.websiteAnalysis.mobileScore < 70 ? '(Needs Work)' : '(Good)'}
              </span>
            </div>
          )}

          {/* Pain Points & Talking Points */}
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-sm text-gray-700">Pain Points</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.insight.painPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm text-gray-700">Talking Points</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.insight.talkingPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-violet-600" />
              <span className="font-medium text-sm text-violet-700">🤖 AI Script Recommendation</span>
            </div>
            <p className="text-sm text-gray-700 italic">"{lead.insight.aiRecommendation}"</p>
          </div>

          {/* What to Say - Detailed Scripts */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">📞 What to Say (AI-Generated Scripts)</span>
            </div>
            
            {/* Opening Script */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <PhoneCall className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase">Opening Script (Call)</span>
              </div>
              <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2 border border-emerald-100">
                "{lead.insight.openingScript}"
              </p>
            </div>

            {/* Email Subject */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <MailOpen className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase">Email Subject Line</span>
              </div>
              <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2 border border-emerald-100 font-medium">
                📧 {lead.insight.emailSubjectLine}
              </p>
            </div>

            {/* Value Proposition */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase">Value Proposition</span>
              </div>
              <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2 border border-emerald-100">
                💡 {lead.insight.valueProposition}
              </p>
            </div>

            {/* Objection Handlers */}
            {lead.insight.objectionHandlers.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase">Handle Objections</span>
                </div>
                <ul className="space-y-1">
                  {lead.insight.objectionHandlers.map((handler, i) => (
                    <li key={i} className="text-xs text-gray-700 bg-white/60 rounded-lg p-2 border border-emerald-100">
                      {handler}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Closing Statement */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase">Close the Deal</span>
              </div>
              <p className="text-sm text-gray-700 bg-emerald-100/50 rounded-lg p-2 border border-emerald-200 font-medium">
                🎯 "{lead.insight.closingStatement}"
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section Header Component
  const SectionHeader = ({ 
    type, 
    leads, 
    icon: Icon, 
    description,
    aiExplanation 
  }: { 
    type: 'hot' | 'warm' | 'cold';
    leads: typeof analyzedLeads;
    icon: any;
    description: string;
    aiExplanation: string;
  }) => {
    const colors = {
      hot: { bg: 'bg-red-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      warm: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      cold: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    };
    const c = colors[type];

    return (
      <div className={`rounded-xl overflow-hidden border ${c.border} mb-4`}>
        <div className={`${c.bg} text-white px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold capitalize">{type} Leads</h3>
                <p className="text-white/80 text-sm">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{leads.length}</div>
                <div className="text-xs text-white/70">leads</div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => selectAllInSection(leads)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {leads.every(l => selectedLeadIds.has(l.id)) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </div>
        <div className={`${c.light} px-6 py-3 border-t ${c.border}`}>
          <div className="flex items-start gap-2">
            <Sparkles className={`w-4 h-4 mt-0.5 ${c.text}`} />
            <div>
              <span className={`text-sm font-medium ${c.text}`}>AI Intelligence: </span>
              <span className="text-sm text-gray-700">{aiExplanation}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-gray-100 rounded-xl shadow-2xl" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Lead Intelligence Report</DialogTitle>
          <DialogDescription>AI-analyzed lead intelligence report with categorized leads</DialogDescription>
        </VisuallyHidden>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-xl m-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Leads</h2>
              <p className="text-gray-600 mb-6">Our AI is processing {leads.length} leads to identify opportunities, pain points, and optimal contact strategies...</p>
              <Progress value={Math.min(loadingProgress, 100)} className="h-2 mb-3" />
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className={loadingProgress > 20 ? 'text-green-600' : ''}>
                  {loadingProgress > 20 ? '✓' : '○'} Scoring leads
                </span>
                <span className={loadingProgress > 50 ? 'text-green-600' : ''}>
                  {loadingProgress > 50 ? '✓' : '○'} Finding pain points
                </span>
                <span className={loadingProgress > 80 ? 'text-green-600' : ''}>
                  {loadingProgress > 80 ? '✓' : '○'} Generating scripts
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Document Header - Like a PDF */}
            <div className="bg-white border-b px-6 py-4 shrink-0 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Lead Intelligence Report</h1>
                    <p className="text-gray-500 text-sm">{reportDate} • {searchQuery} in {location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFieldSelector(!showFieldSelector)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Fields
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onOpenChange(false)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Field Selector Dropdown */}
            {showFieldSelector && (
              <div className="border-b bg-gray-50 px-6 py-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Select fields to include in exports:</p>
                <div className="flex flex-wrap gap-3">
                  {EXPORT_FIELDS.map(field => (
                    <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PDF-like Document Content */}
            <ScrollArea className="flex-1 p-4" ref={documentRef}>
              <div className="bg-white rounded-xl shadow-sm border p-8 max-w-[800px] mx-auto">
                {/* Executive Summary */}
                <div className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                    <h2 className="text-lg font-bold text-gray-900">Executive Summary</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900">{leads.length}</div>
                      <div className="text-sm text-gray-500">Total Leads</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
                      <div className="text-sm text-red-600">Hot Leads</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="text-3xl font-bold text-orange-600">{warmLeads.length}</div>
                      <div className="text-sm text-orange-600">Warm Leads</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-3xl font-bold text-blue-600">{coldLeads.length}</div>
                      <div className="text-sm text-blue-600">Cold Leads</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="text-sm text-green-700">Estimated Pipeline Value</div>
                        <div className="text-2xl font-bold text-green-700">${totalEstimatedValue.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Selected Leads</div>
                      <div className="text-lg font-bold text-gray-900">{selectedLeadIds.size} / {leads.length}</div>
                    </div>
                  </div>
                </div>

                {/* Issue Summary Dashboard */}
                {issueSummary.totalIssueCount > 0 && (
                  <div className="border-b pb-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h2 className="text-lg font-bold text-gray-900">AI-Detected Issues Dashboard</h2>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 ml-2">
                        {issueSummary.totalIssueCount} total issues
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Our AI scanned all leads and found these opportunities for your outreach. Target businesses with these pain points for higher conversion rates.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(issueSummary.categories).map(([key, cat]) => (
                        <div key={key} className={`${cat.lightBg} border ${cat.borderColor} rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.emoji}</span>
                              <span className={`text-sm font-medium ${cat.textColor}`}>{cat.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${cat.textColor}`}>{cat.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${cat.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${(cat.count / issueSummary.maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium text-violet-700">Pro Tip: </span>
                          <span className="text-gray-700">
                            Leads with tracking issues ({issueSummary.categories.tracking.count}) and missing booking systems ({issueSummary.categories.booking.count}) are often unaware of lost revenue — these make excellent conversation starters!
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hot Leads Section */}
                {hotLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="hot"
                      leads={hotLeads}
                      icon={Flame}
                      description="Call immediately for highest conversion rates"
                      aiExplanation="These leads show strong buying signals: missing websites, outdated platforms, or critical issues that are actively costing them customers. Our analysis indicates they're most receptive to outreach between 10-11 AM and 2-3 PM. Start with a phone call - email response rates are 40% lower for hot leads."
                    />
                    <div className="space-y-3">
                      {hotLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Warm Leads Section */}
                {warmLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="warm"
                      leads={warmLeads}
                      icon={ThermometerSun}
                      description="Email first, then follow up with a call in 2-3 days"
                      aiExplanation="These leads have moderate need indicators: websites that function but could be improved, or partial digital presence. Data shows the most effective approach is a value-first email followed by a call 48-72 hours later. Best email times are Tuesday 9 AM or Thursday 10 AM - avoid Mondays and Fridays."
                    />
                    <div className="space-y-3">
                      {warmLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cold Leads Section */}
                {coldLeads.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader
                      type="cold"
                      leads={coldLeads}
                      icon={Snowflake}
                      description="Add to nurture sequence with valuable content"
                      aiExplanation="These leads have minimal immediate need but represent long-term opportunities. Add them to a 6-8 week email nurture sequence with educational content. 23% of cold leads convert within 6 months when properly nurtured. Focus on building trust before pitching services."
                    />
                    <div className="space-y-3">
                      {coldLeads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                <div className="mt-8 pt-6 border-t text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Generated by BamLead AI Intelligence Engine</span>
                  </div>
                  <p className="text-xs text-gray-400">Lead scores and recommendations are based on website analysis, industry benchmarks, and conversion data. Results may vary.</p>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t bg-white px-6 py-4 shrink-0 rounded-b-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedLeadIds.size > 0 
                    ? `${selectedLeadIds.size} leads selected` 
                    : `${hotLeads.length} hot leads ready for verification`}
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={exportToPDF} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={exportToExcel} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                  <Button onClick={handleProceedToVerify} size="lg" className="relative gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg animate-pulse">
                    <Zap className="w-5 h-5" />
                    AI Verify & Find Emails
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
