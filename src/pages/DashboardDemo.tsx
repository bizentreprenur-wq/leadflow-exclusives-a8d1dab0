import { useState, useEffect } from "react";
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
  Send
} from "lucide-react";
import { SocialFinderButton } from "@/components/SocialProfileFinder";
import EmailHelpOverlay from "@/components/EmailHelpOverlay";
import HighConvertingTemplateGallery from "@/components/HighConvertingTemplateGallery";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

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
  { id: 2, label: "Review Leads", icon: Building2 },
  { id: 3, label: "Email", icon: Mail },
  { id: 4, label: "Call", icon: Phone },
];

export default function DashboardDemo() {
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2 to show leads
  const [searchQuery, setSearchQuery] = useState("Mechanics");
  const [searchLocation, setSearchLocation] = useState("Houston");
  const [leads] = useState(sampleLeads);
  const [selectedLeads, setSelectedLeads] = useState<number[]>(sampleLeads.slice(0, 25).map(l => l.id)); // Pre-select first 25
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [outreachMode, setOutreachMode] = useState<'email' | 'verify'>('email');

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
    setCurrentStep(2);
    toast.success(`Found ${leads.length} leads for "${searchQuery}" in ${searchLocation}!`);
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
          <h1 className="text-2xl font-bold text-foreground">🎯 BamLead Dashboard</h1>
          <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-600 border-amber-500">DEMO MODE - 100 Sample Leads</Badge>
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

              {/* Platform Search - VIOLET color */}
              <Card className="border-2 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50 transition-all cursor-pointer">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-violet-500" />
                  </div>
                  <CardTitle className="text-violet-400">🔍 Outdated Website Scanner</CardTitle>
                  <p className="text-sm text-muted-foreground">Find sites using old technology</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="e.g., Wix, WordPress, Joomla..."
                    className="border-violet-500/30 focus:border-violet-500"
                  />
                  <Input 
                    placeholder="Industry (optional)"
                    className="border-violet-500/30 focus:border-violet-500"
                  />
                  <Button 
                    onClick={handleSearch}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Scan for Outdated Sites
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: See All Leads */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">📋 Your Leads ({leads.length} found)</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedLeads.length} selected • {leadsWithEmailCount} with emails
                </p>
              </div>
              <div className="flex gap-2">
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
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
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
        {currentStep === 3 && (
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

            {/* Mode Selection Cards */}
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
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={handleSendEmails}
                            disabled={isSending || leadsWithEmailCount === 0}
                            className="bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isSending ? 'Sending...' : `Send to ${leadsWithEmailCount} Leads`}
                          </Button>
                          <Button 
                            onClick={() => setCurrentStep(4)}
                            variant="outline"
                            size="lg"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Leads →
                          </Button>
                        </div>
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
        )}

        {/* Step 4: Voice Calling - FULL EXPERIENCE */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Big Header */}
            <div className="text-center py-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border-2 border-green-500/30">
              <div className="text-7xl mb-4">📞</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                STEP 4: AI Voice Calls
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Call {selectedLeads.length} leads with AI that sounds 100% human!
              </p>
            </div>

            {/* Back Button */}
            <Button variant="outline" onClick={() => setCurrentStep(3)} className="gap-2">
              ← Back to Emails
            </Button>

            {/* HOW IT WORKS - Step by Step */}
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-center text-2xl">🎯 How Voice Calling Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Step 1 */}
                  <div className="text-center p-4 bg-background rounded-xl border">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3 text-3xl">
                      1️⃣
                    </div>
                    <h3 className="font-bold text-lg mb-2">Create ElevenLabs Agent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Go to ElevenLabs.io, create a FREE account, then create a "Conversational AI Agent"
                    </p>
                    <a 
                      href="https://elevenlabs.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      → Go to ElevenLabs
                    </a>
                  </div>

                  {/* Step 2 */}
                  <div className="text-center p-4 bg-background rounded-xl border">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3 text-3xl">
                      2️⃣
                    </div>
                    <h3 className="font-bold text-lg mb-2">Make Agent Public</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      In your agent settings, toggle "Public" to ON. Then copy the "Agent ID"
                    </p>
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                      Important Step!
                    </Badge>
                  </div>

                  {/* Step 3 */}
                  <div className="text-center p-4 bg-background rounded-xl border">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3 text-3xl">
                      3️⃣
                    </div>
                    <h3 className="font-bold text-lg mb-2">Paste in Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Go to BamLead Settings → Voice Agent, paste your Agent ID, save, and start calling!
                    </p>
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                      ✅ Ready to Call!
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Queue */}
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="w-6 h-6 text-green-500" />
                  Your Call Queue ({selectedLeads.length} leads with phone numbers)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads.filter(l => selectedLeads.includes(l.id)).slice(0, 8).map((lead, index) => (
                    <div 
                      key={lead.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-green-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{lead.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                            <span className="mx-2">•</span>
                            📍 {lead.address.split(',')[1]}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        className="bg-green-600 hover:bg-green-700 gap-2 opacity-90 group-hover:opacity-100"
                        onClick={() => toast.info('💡 In the real dashboard, this connects to your ElevenLabs AI agent!')}
                      >
                        <Phone className="w-5 h-5" />
                        Call Now
                      </Button>
                    </div>
                  ))}
                  {selectedLeads.length > 8 && (
                    <div className="text-center py-4 border-2 border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground">+ {selectedLeads.length - 8} more leads ready to call</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* What AI Says */}
            <Card className="border-violet-500/30 bg-violet-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎙️ What Your AI Agent Will Say (Example)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3 items-start">
                    <Badge className="shrink-0 bg-violet-500">AI</Badge>
                    <p className="bg-violet-500/10 p-3 rounded-lg rounded-tl-none">
                      "Hi! I'm calling from [Your Business]. I noticed your company might benefit from our services. Do you have 2 minutes to chat?"
                    </p>
                  </div>
                  <div className="flex gap-3 items-start justify-end">
                    <p className="bg-muted p-3 rounded-lg rounded-tr-none text-right">
                      "Sure, what's this about?"
                    </p>
                    <Badge variant="secondary" className="shrink-0">Lead</Badge>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Badge className="shrink-0 bg-violet-500">AI</Badge>
                    <p className="bg-violet-500/10 p-3 rounded-lg rounded-tl-none">
                      "Great! I'm reaching out to help businesses like yours get more customers. What's your biggest challenge with marketing right now?"
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  💡 You customize the script in your ElevenLabs agent settings
                </p>
              </CardContent>
            </Card>

            {/* Demo CTA */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              <CardContent className="py-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Ready to Start Calling?</h3>
                <p className="text-green-100 mb-6">
                  Sign in to access the full voice calling features
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="secondary" size="lg" asChild>
                    <a href="/auth">Sign In to Dashboard</a>
                  </Button>
                  <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10" asChild>
                    <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
                      Create ElevenLabs Agent
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <EmailHelpOverlay variant="floating" />
    </div>
  );
}
