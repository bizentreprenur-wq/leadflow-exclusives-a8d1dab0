import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  Mail, 
  Download,
  Star,
  Phone,
  Building2,
  Sparkles,
  Loader2,
  Send,
  ArrowLeft,
  Home,
  Server,
  ExternalLink,
  HelpCircle,
  Inbox
} from "lucide-react";
import { SocialFinderButton } from "@/components/SocialProfileFinder";
import Step4AICallingHub from "@/components/Step4AICallingHub";
import EmailHelpOverlay from "@/components/EmailHelpOverlay";
import HighConvertingTemplateGallery from "@/components/HighConvertingTemplateGallery";
import LeadSpreadsheetViewer from "@/components/LeadSpreadsheetViewer";
import AIResponseInbox from "@/components/AIResponseInbox";
import LiveDripMailbox from "@/components/LiveDripMailbox";
import WebsitePreviewIcon from "@/components/WebsitePreviewIcon";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import WorkflowOnboardingTour, { startWorkflowTour } from "@/components/WorkflowOnboardingTour";

// Generate 100 sample leads
const businessTypes = ["Auto Repair", "Dental Clinic", "Law Firm", "Restaurant", "Plumber", "Electrician", "Real Estate", "Accounting", "Marketing Agency", "Fitness Studio"];
const cities = ["Houston", "Dallas", "Austin", "San Antonio", "Phoenix", "Denver", "Miami", "Atlanta", "Chicago", "Seattle"];
const streetNames = ["Main St", "Oak Ave", "Pine Rd", "Elm St", "Cedar Ln", "Maple Dr", "First Ave", "Second St", "Commerce Blvd", "Business Park"];
const businessPrefixes = ["Elite", "Pro", "Quick", "Premier", "Best", "Top", "Quality", "Express", "Master", "Golden", "Silver", "Trusted", "Reliable", "Expert", "Local", "City", "Metro", "Family", "Advanced", "Modern"];
const businessSuffixes = ["Services", "Solutions", "Center", "Hub", "Group", "Co", "LLC", "Inc", "Partners", "Team"];

const generateSampleLeads = () => {
  const leads = [];
  for (let i = 1; i <= 100; i++) {
    const type = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const prefix = businessPrefixes[Math.floor(Math.random() * businessPrefixes.length)];
    const suffix = businessSuffixes[Math.floor(Math.random() * businessSuffixes.length)];
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    const streetNum = Math.floor(Math.random() * 9000) + 100;
    
    leads.push({
      id: i,
      name: `${prefix} ${type.split(' ')[0]} ${suffix}`,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 300) + 10,
      category: type,
      address: `${streetNum} ${street}, ${city}`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      website: `${prefix.toLowerCase()}${type.split(' ')[0].toLowerCase()}.com`,
      hasEmail: Math.random() > 0.3,
      email: Math.random() > 0.3 ? `contact@${prefix.toLowerCase()}${type.split(' ')[0].toLowerCase()}.com` : null,
    });
  }
  return leads;
};

const sampleLeads = generateSampleLeads();

const WORKFLOW_STEPS = [
  { id: 1, label: "Search", icon: Search },
  { id: 2, label: "Leads", icon: Building2 },
  { id: 3, label: "Email", icon: Mail },
  { id: 4, label: "Call", icon: Phone },
  { id: 5, label: "Mailbox", icon: Inbox },
];

export default function DashboardDemo() {
  const [currentStep, setCurrentStep] = useState(1); // Start at step 1
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [outreachMode, setOutreachMode] = useState<'email' | 'verify'>('email');
  const [showSpreadsheetViewer, setShowSpreadsheetViewer] = useState(false);
  const [mailboxView, setMailboxView] = useState<'drip' | 'full'>('drip');

  // Convert leads to SearchResult format for LeadSpreadsheetViewer
  const leadsAsSearchResults = leads.map(lead => ({
    id: String(lead.id),
    name: lead.name,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    email: lead.email || undefined,
    rating: parseFloat(lead.rating),
    source: 'gmb' as const,
  }));

  // Auto-complete verification for demo when on Step 3 with verify mode
  useEffect(() => {
    if (currentStep === 3 && outreachMode === 'verify' && selectedLeads.length > 0 && !isVerifying && verificationProgress === 0) {
      setIsVerifying(true);
      const interval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsVerifying(false);
            setVerifiedCount(selectedLeads.length);
            toast.success(`✅ ${selectedLeads.length} leads verified!`);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [currentStep, selectedLeads.length, isVerifying, verificationProgress, outreachMode]);

  // Auto-select a sample template when entering Step 3 email mode
  useEffect(() => {
    if (currentStep === 3 && !selectedTemplate) {
      const sampleTemplate = {
        id: 'demo-template',
        name: 'Professional Web Design Pitch',
        category: 'web-design',
        subject: 'Your website could be bringing in more customers, {{business_name}}',
        body: `Hi {{business_name}} team,

I came across your business while researching local companies in your area, and I noticed your website has a lot of potential to drive even more customers to your door.

Here are 3 quick wins I spotted:
• Mobile optimization - 60% of your customers are browsing on phones
• Page speed improvements - faster sites = more conversions
• Updated design - a modern look builds instant trust

I'd love to show you a quick mockup of what a refreshed website could look like for your business. No cost, no obligation - just a friendly conversation.

Would you be open to a 15-minute call this week?

Best regards,
[Your Name]`,
        previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
      };
      setSelectedTemplate(sampleTemplate);
      setEmailSubject(sampleTemplate.subject);
      setEmailBody(sampleTemplate.body);
      // Mark verification as complete for demo
      setVerificationProgress(100);
      setVerifiedCount(selectedLeads.length);
    }
  }, [currentStep, selectedTemplate, selectedLeads.length]);

  const handleSearch = () => {
    if (!searchQuery.trim() || !searchLocation.trim()) {
      toast.error('Please enter a service and location');
      return;
    }
    // Generate sample leads based on search
    const newLeads = generateSampleLeads();
    setLeads(newLeads);
    setSelectedLeads([]);
    setCurrentStep(2);
    toast.success(`Found ${newLeads.length} leads for "${searchQuery}" in ${searchLocation}!`);
  };

  const toggleLeadSelection = (id: number) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setEmailSubject(template.subject || `Let's Improve Your Online Presence`);
    setEmailBody(template.body || `Hi {{business_name}},\n\nI noticed your business could benefit from a modern website refresh...\n\nBest regards`);
    toast.success(`Template "${template.name}" selected!`);
  };

  const handleSendEmails = () => {
    const leadsWithEmail = selectedLeads.filter(id => {
      const lead = leads.find(l => l.id === id);
      return lead?.hasEmail;
    });

    if (leadsWithEmail.length === 0) {
      toast.error("No leads with emails selected!");
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSending(false);
          toast.success(`🎉 Demo: ${leadsWithEmail.length} emails would be sent! (This is a demo, no actual emails sent)`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const leadsWithEmailCount = selectedLeads.filter(id => {
    const lead = leads.find(l => l.id === id);
    return lead?.hasEmail;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">🎯 BamLead Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startWorkflowTour}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Workflow Tour</span>
            </Button>
            <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-600 border-amber-500">DEMO MODE</Badge>
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Sign In for Full Access
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${
                    currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step.id 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                  onClick={() => {
                    if (step.id === 3) {
                      setVerificationProgress(0);
                      setIsVerifying(false);
                    }
                    setCurrentStep(step.id);
                  }}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="font-medium">Step {step.id}: {step.label}</span>
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / WORKFLOW_STEPS.length) * 100} className="h-2" />
        </div>

        {/* Step 1: Search */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center mb-8">Choose Your Search Method</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* GMB Search - Teal */}
              <Card className="border-2 border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50 transition-all cursor-pointer">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-teal-500" />
                  </div>
                  <CardTitle className="text-teal-600">🗺️ Local Business Search</CardTitle>
                  <p className="text-sm text-muted-foreground">Find businesses on Google Maps</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="e.g., Mechanics, Dentists, Restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-teal-500/30 focus:border-teal-500"
                  />
                  <Input 
                    placeholder="City or Location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="border-teal-500/30 focus:border-teal-500"
                  />
                  <Button 
                    onClick={handleSearch}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Local Businesses
                  </Button>
                </CardContent>
              </Card>

              {/* Agency Lead Finder - VIOLET color */}
              <Card className="border-2 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 transition-all cursor-pointer">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-violet-500" />
                  </div>
                  <CardTitle className="text-violet-400">🔍 Agency Lead Finder</CardTitle>
                  <p className="text-sm text-muted-foreground">Built for digital professionals</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="e.g., plumbers, dentists, restaurants..."
                    className="border-violet-500/30 focus:border-violet-500"
                  />
                  <Input 
                    placeholder="City, State or ZIP"
                    className="border-violet-500/30 focus:border-violet-500"
                  />
                  <Button 
                    onClick={handleSearch}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Find Clients
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: See All Leads */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Full Screen Spreadsheet CTA - PROMINENT */}
            <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl">
                      📊
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        {leads.length.toLocaleString()} Leads Found!
                      </p>
                      <p className="text-muted-foreground">
                        Open the full-screen spreadsheet to see ALL leads at once
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowSpreadsheetViewer(true)} 
                    size="lg" 
                    className="gap-3 text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Full-Screen View
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">📋 Your Leads ({leads.length} found)</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedLeads.length} selected • {leadsWithEmailCount} with emails
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={() => setShowSpreadsheetViewer(true)} className="gap-2">
                  📊 Spreadsheet View
                </Button>
                <Button variant="outline" size="sm" onClick={selectAllLeads}>
                  {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Leads Table with Zebra Striping */}
            <div className="rounded-lg border overflow-hidden max-h-[500px] overflow-y-auto">
              {leads.map((lead, index) => (
                <div 
                  key={lead.id} 
                  className={`p-4 flex items-center gap-4 transition-all border-b last:border-b-0 ${
                    selectedLeads.includes(lead.id) 
                      ? 'ring-2 ring-inset ring-primary bg-primary/10' 
                      : index % 2 === 0 
                        ? 'bg-muted/30' 
                        : 'bg-muted/10'
                  }`}
                >
                  <Checkbox 
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                  />
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.category}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{lead.rating}</span>
                      <span className="text-muted-foreground text-sm">({lead.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {lead.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{lead.website}</span>
                      <WebsitePreviewIcon website={lead.website} businessName={lead.name} />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lead.hasEmail ? "default" : "secondary"}>
                        {lead.hasEmail ? "📧 Email Found" : "No Email"}
                      </Badge>
                      <SocialFinderButton lead={lead} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Back to Search
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={selectedLeads.length === 0}
                className="bg-primary"
              >
                Send Outreach ({selectedLeads.length} Leads) →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Send Outreach (with optional AI Verify) */}
        {currentStep === 3 && (() => {
          // Check SMTP configuration
          const smtpConfig = JSON.parse(localStorage.getItem('smtp_config') || '{}');
          const isSmtpConfigured = smtpConfig.username && smtpConfig.password;

          return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold">STEP 3: Send Your Outreach!</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                {selectedLeads.length} leads ready! Send emails now or use AI to verify first.
              </p>
            </div>

            {/* Back Button */}
            <Button variant="outline" onClick={() => setCurrentStep(2)}>← Back to Leads</Button>

            {/* SMTP Configuration Check */}
            <Card className={`border-2 ${isSmtpConfigured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${isSmtpConfigured ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      {isSmtpConfigured ? '✅' : '⚠️'}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {isSmtpConfigured ? 'SMTP Configured!' : 'Configure SMTP First'}
                      </p>
                      <p className="text-muted-foreground">
                        {isSmtpConfigured 
                          ? `Sending via ${smtpConfig.host || 'your SMTP server'}` 
                          : 'You need to set up your email server before sending outreach'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => toast.info('Sign in to access full Settings panel')}
                    variant={isSmtpConfigured ? 'outline' : 'default'}
                    className={`gap-2 ${!isSmtpConfigured ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  >
                    <Server className="w-4 h-4" />
                    {isSmtpConfigured ? 'View Settings' : 'Configure SMTP →'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Send Emails Card */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  outreachMode === 'email' 
                    ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20' 
                    : 'border-border hover:border-blue-500/50'
                }`}
                onClick={() => setOutreachMode('email')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                    📧
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Send Emails Now</h3>
                  <p className="text-muted-foreground mb-4">
                    Pick a template and send outreach immediately to your {leadsWithEmailCount} leads with emails
                  </p>
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                    Quick & Direct
                  </Badge>
                </CardContent>
              </Card>

              {/* AI Verify First Card */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  outreachMode === 'verify' 
                    ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20' 
                    : 'border-border hover:border-amber-500/50'
                }`}
                onClick={() => {
                  setOutreachMode('verify');
                  setVerificationProgress(0);
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                    ✅
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Verify First</h3>
                  <p className="text-muted-foreground mb-4">
                    Find missing emails, score leads, and analyze websites before sending
                  </p>
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Uses Credits
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Content based on mode */}
            {outreachMode === 'email' ? (
              // Email Mode - Template Gallery + Composer
              !selectedTemplate ? (
                <HighConvertingTemplateGallery onSelectTemplate={handleTemplateSelect} />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      ← Change Template
                    </Button>
                    <Badge className="bg-green-500/20 text-green-600 border-green-500">
                      Template: {selectedTemplate.name}
                    </Badge>
                  </div>

                  {/* Email Composer */}
                  <Card className="border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Compose Your Email
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Subject Line</label>
                        <Input 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Enter email subject..."
                          className="border-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email Body</label>
                        <Textarea 
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Write your email..."
                          className="min-h-[200px] border-primary/30"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use {"{{business_name}}"} to personalize each email
                        </p>
                      </div>

                      {/* Send Progress */}
                      {isSending && (
                        <div className="p-4 bg-blue-500/10 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            <span className="font-medium">Sending emails...</span>
                          </div>
                          <Progress value={sendProgress} className="h-2" />
                        </div>
                      )}

                      {/* Summary & Send Button */}
                      <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{leadsWithEmailCount} leads will receive this email</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedLeads.length - leadsWithEmailCount} leads don't have emails
                          </p>
                        </div>
                        <Button 
                          onClick={handleSendEmails}
                          disabled={isSending || leadsWithEmailCount === 0}
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSending ? 'Sending...' : `Send to ${leadsWithEmailCount} Leads`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Continue to Calls - Big & Always Visible */}
                  <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">
                            📞
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">
                              Ready to follow up with calls?
                            </p>
                            <p className="text-muted-foreground">
                              {selectedLeads.length} leads have phone numbers ready for AI voice calls
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setCurrentStep(4)}
                          size="lg"
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
                        >
                          <Phone className="w-5 h-5" />
                          Call Leads →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            ) : (
              // Verify Mode - AI Verification Progress
              <Card className="border-amber-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                      {verificationProgress < 100 ? (
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {verificationProgress < 100 
                          ? `Verifying ${selectedLeads.length} leads...` 
                          : `✅ ${verifiedCount} leads verified!`}
                      </p>
                      <p className="text-muted-foreground">
                        {verificationProgress < 100 
                          ? "Finding emails, checking websites, scoring quality" 
                          : "All leads verified and ready for outreach!"}
                      </p>
                    </div>
                  </div>
                  <Progress value={verificationProgress} className="h-3 mb-4" />
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">{leadsWithEmailCount}</p>
                      <p className="text-xs text-muted-foreground">Emails Found</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">{selectedLeads.length - leadsWithEmailCount}</p>
                      <p className="text-xs text-muted-foreground">No Email</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-amber-500">{Math.round(verificationProgress)}%</p>
                      <p className="text-xs text-muted-foreground">Progress</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-blue-500">{Math.floor(Math.random() * 10 + 80)}%</p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                  
                  {verificationProgress >= 100 && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        onClick={() => setOutreachMode('email')}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Now Send Emails →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          );
        })()}

        {/* Step 4: Voice Calling Hub */}
        {currentStep === 4 && (
          <Step4AICallingHub
            leads={leads.filter(l => selectedLeads.includes(l.id)).map(l => ({
              id: String(l.id),
              email: l.email || undefined,
              business_name: l.name,
              name: l.name,
              phone: l.phone,
              website: l.website,
            }))}
            onBack={() => setCurrentStep(3)}
            onOpenSettings={() => toast.info('Settings would open here')}
            onOpenCRMModal={() => toast.info('CRM modal would open here')}
            searchType="gmb"
            searchQuery={searchQuery}
            searchLocation={searchLocation}
          />
        )}

        {/* Step 5: AI Mailbox - Full Experience */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Toggle Header */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(4)} className="gap-2">
                ← Back to Voice Calls
              </Button>
              
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setMailboxView('drip')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mailboxView === 'drip' 
                      ? 'bg-emerald-500 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📤 Live Sending
                </button>
                <button
                  onClick={() => setMailboxView('full')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mailboxView === 'full' 
                      ? 'bg-emerald-500 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📬 Full Mailbox
                </button>
              </div>
            </div>

            {/* Conditional Render: Live Drip or Full Mailbox */}
            {mailboxView === 'drip' ? (
              <LiveDripMailbox 
                onSwitchToFullMailbox={() => setMailboxView('full')} 
                leads={leads}
                verifiedLeads={leads.filter((_, idx) => selectedLeads.includes(idx))}
                selectedTemplate={selectedTemplate}
              />
            ) : (
              <>
                {/* Big Header */}
                <div className="text-center py-6 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl border-2 border-primary/30">
                  <div className="text-5xl mb-3">📬</div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    STEP 5: AI Mailbox
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Manage replies, sequences, and follow-ups with AI automation
                  </p>
                </div>

                {/* AI Response Inbox */}
                <AIResponseInbox />
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <EmailHelpOverlay variant="floating" />

      {/* Lead Spreadsheet Viewer */}
      <LeadSpreadsheetViewer
        open={showSpreadsheetViewer}
        onOpenChange={setShowSpreadsheetViewer}
        leads={leadsAsSearchResults}
        onProceedToVerify={(selectedLeadsFromViewer) => {
          setShowSpreadsheetViewer(false);
          setSelectedLeads(selectedLeadsFromViewer.map(l => parseInt(l.id)));
          setCurrentStep(3);
          setOutreachMode('verify');
          toast.success(`${selectedLeadsFromViewer.length} leads selected for verification`);
        }}
        onSendToEmail={(selectedLeadsFromViewer) => {
          setShowSpreadsheetViewer(false);
          setSelectedLeads(selectedLeadsFromViewer.map(l => parseInt(l.id)));
          setCurrentStep(3);
          setOutreachMode('email');
          toast.success(`${selectedLeadsFromViewer.length} leads selected for email outreach`);
        }}
      />

      {/* Workflow Onboarding Tour */}
      <WorkflowOnboardingTour 
        currentStep={currentStep}
        onStepChange={(step) => setCurrentStep(step)}
      />
    </div>
  );
}
