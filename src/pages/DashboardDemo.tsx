import { useState } from "react";
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
  Users,
  Loader2
} from "lucide-react";
import { SocialFinderButton } from "@/components/SocialProfileFinder";
import EmailHelpOverlay from "@/components/EmailHelpOverlay";
import HighConvertingTemplateGallery from "@/components/HighConvertingTemplateGallery";
import { toast } from "sonner";

// Mock leads data
const mockLeads = [
  { id: 1, name: "Joe's Auto Repair", rating: 4.8, reviews: 156, category: "Mechanic", address: "123 Main St, Houston", phone: "(713) 555-0101", website: "joesauto.com", hasEmail: true },
  { id: 2, name: "Houston Car Care", rating: 4.5, reviews: 89, category: "Auto Shop", address: "456 Oak Ave, Houston", phone: "(713) 555-0102", website: "houstoncarcare.com", hasEmail: true },
  { id: 3, name: "Mike's Mechanics", rating: 4.9, reviews: 234, category: "Mechanic", address: "789 Pine Rd, Houston", phone: "(713) 555-0103", website: "mikesmechanics.com", hasEmail: false },
  { id: 4, name: "Elite Auto Service", rating: 4.7, reviews: 178, category: "Auto Repair", address: "321 Elm St, Houston", phone: "(713) 555-0104", website: "eliteauto.com", hasEmail: true },
  { id: 5, name: "Quick Fix Garage", rating: 4.3, reviews: 67, category: "Mechanic", address: "654 Cedar Ln, Houston", phone: "(713) 555-0105", website: "quickfixgarage.com", hasEmail: true },
  { id: 6, name: "Pro Mechanics Houston", rating: 4.6, reviews: 145, category: "Auto Shop", address: "987 Maple Dr, Houston", phone: "(713) 555-0106", website: "promechanics.com", hasEmail: false },
];

const WORKFLOW_STEPS = [
  { id: 1, label: "Search", icon: Search },
  { id: 2, label: "See All Leads", icon: Building2 },
  { id: 3, label: "AI Verification", icon: Sparkles },
  { id: 4, label: "Send Emails", icon: Mail },
];

export default function DashboardDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [searchType, setSearchType] = useState<'gmb' | 'platform' | null>(null);

  const handleSearch = (type: 'gmb' | 'platform') => {
    setSearchType(type);
    setLeads(mockLeads);
    setCurrentStep(2);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">🎯 BamLead Dashboard</h1>
          <Badge variant="outline" className="text-xs">DEMO MODE</Badge>
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
                  onClick={() => setCurrentStep(step.id)}
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
                    onClick={() => handleSearch('gmb')}
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
                    onClick={() => handleSearch('platform')}
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
                <p className="text-sm text-muted-foreground">Select leads to verify and contact</p>
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
            <div className="rounded-lg border overflow-hidden">
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
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">Verifying {selectedLeads.length} leads...</p>
                      <p className="text-muted-foreground">Finding emails, checking websites, scoring quality</p>
                    </div>
                  </div>
                  <Progress value={65} className="h-3 mb-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">4</p>
                      <p className="text-xs text-muted-foreground">Emails Found</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-amber-500">2</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-blue-500">85%</p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>← Back</Button>
              <Button onClick={() => setCurrentStep(4)} className="bg-primary" disabled={selectedLeads.length === 0}>
                Continue to Email →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Send Emails - Full Template Gallery */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold">STEP 4: Send Your Emails!</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Pick a template, customize your message, and start your outreach campaign!
              </p>
            </div>

            <Button variant="outline" onClick={() => setCurrentStep(3)}>← Back to Verification</Button>

            {/* Full Template Gallery */}
            <HighConvertingTemplateGallery 
              onSelectTemplate={(template) => toast.success(`Template "${template.name}" selected! In live mode, this opens the email composer.`)} 
            />
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <EmailHelpOverlay variant="floating" />
    </div>
  );
}
