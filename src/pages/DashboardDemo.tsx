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
  { id: 2, label: "See All Leads", icon: Building2 },
  { id: 3, label: "AI Verification", icon: Sparkles },
  { id: 4, label: "Send Emails", icon: Mail },
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

  // Simulate verification progress
  useEffect(() => {
    if (currentStep === 3 && selectedLeads.length > 0 && !isVerifying && verificationProgress === 0) {
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
  }, [currentStep, selectedLeads.length, isVerifying, verificationProgress]);

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
                Verify {selectedLeads.length} Leads →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Verification */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center py-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border-2 border-amber-500/30">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold">STEP 3: AI Verification</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Our AI verifies {selectedLeads.length} leads, finds missing emails, and scores each for quality.
              </p>
            </div>
            
            {selectedLeads.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-xl font-semibold">No leads selected</p>
                  <p className="text-muted-foreground mt-2">Go back to Step 2 and select leads first.</p>
                  <Button onClick={() => setCurrentStep(2)} className="mt-4">← Go to Step 2</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      {verificationProgress < 100 ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>← Back</Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                className="bg-primary" 
                disabled={selectedLeads.length === 0 || verificationProgress < 100}
              >
                Continue to Email →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Send Emails - Full Template Gallery + Email Composer */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold">STEP 4: Send Your Emails!</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                {selectedTemplate 
                  ? `Template selected! Customize and send to ${leadsWithEmailCount} leads with emails.`
                  : `Pick a template, customize your message, and start your outreach campaign!`}
              </p>
            </div>

            {!selectedTemplate ? (
              <>
                <Button variant="outline" onClick={() => setCurrentStep(3)}>← Back to Verification</Button>
                {/* Full Template Gallery */}
                <HighConvertingTemplateGallery onSelectTemplate={handleTemplateSelect} />
              </>
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <EmailHelpOverlay variant="floating" />
    </div>
  );
}
