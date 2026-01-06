import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Star,
  PartyPopper,
} from "lucide-react";
import AIVerificationExperience from "./AIVerificationExperience";

interface Lead {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  industry?: string;
  source?: string;
}

interface LeadActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  leads?: Lead[];
  onVerifyWithAI: () => void;
  onDownload: () => void;
  onSendToGoogleDrive: () => void;
}

export default function LeadActionModal({
  open,
  onOpenChange,
  leadCount,
  leads = [],
  onVerifyWithAI,
  onDownload,
  onSendToGoogleDrive,
}: LeadActionModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showAIVerification, setShowAIVerification] = useState(false);
  const previewLeads = leads.slice(0, 50);

  const handleClose = () => {
    setShowPreview(false);
    onOpenChange(false);
  };

  const handleStartVerification = () => {
    handleClose();
    setShowAIVerification(true);
  };

  const handleVerificationComplete = (verifiedLeads: any[]) => {
    // Store verified leads for email outreach
    sessionStorage.setItem('verifiedLeads', JSON.stringify(verifiedLeads));
    onVerifyWithAI();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {!showPreview ? (
          <>
            {/* Main Wizard View */}
            <DialogHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-success/10 border-2 border-success/20 animate-bounce">
                  <PartyPopper className="w-10 h-10 text-success" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">
                🎉 Woohoo! Found {leadCount.toLocaleString()} leads!
              </DialogTitle>
              <DialogDescription className="text-lg mt-2">
                That's a lot of potential customers! What would you like to do?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Primary: Email Them (Verify First) */}
              <Button
                onClick={handleStartVerification}
                className="w-full h-auto p-5 justify-start gap-4 text-left"
                variant="default"
                size="lg"
              >
                <div className="p-3 rounded-xl bg-background/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">📧 Email These Leads</p>
                  <p className="text-sm opacity-90 font-normal mt-0.5">
                    AI will verify contacts first, then you can send emails
                  </p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </Button>

              {/* Download CSV */}
              <Button
                onClick={() => {
                  handleClose();
                  onDownload();
                }}
                className="w-full h-auto p-5 justify-start gap-4 text-left"
                variant="outline"
                size="lg"
              >
                <div className="p-3 rounded-xl bg-muted">
                  <Download className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-foreground">📥 Download to My Computer</p>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">
                    Get a spreadsheet file you can open in Excel
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </Button>

              {/* Send to Google Drive - Coming Soon */}
              <div className="relative">
                <Button
                  disabled
                  className="w-full h-auto p-5 justify-start gap-4 text-left opacity-60 cursor-not-allowed"
                  variant="outline"
                  size="lg"
                >
                  <div className="p-3 rounded-xl bg-muted">
                    <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-muted-foreground">☁️ Save to Google Drive</p>
                    <p className="text-sm text-muted-foreground font-normal mt-0.5">
                      Creates a Google Sheet you can access anywhere
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Coming Soon</Badge>
                </Button>
              </div>

              {/* Preview Option */}
              {leads.length > 0 && (
                <div className="pt-2">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-4 h-4" />
                    👀 Peek at the first 50 leads
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
              💡 <strong>Pro tip:</strong> Verified leads are 3x more likely to respond to your emails!
            </p>
          </>
        ) : (
          <>
            {/* Preview View */}
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <DialogTitle className="text-xl">
                    👀 Sneak Peek
                  </DialogTitle>
                  <DialogDescription>
                    Showing {previewLeads.length} of {leadCount.toLocaleString()} leads
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6" style={{ maxHeight: "400px" }}>
              <div className="space-y-2 py-2">
                {previewLeads.map((lead, index) => (
                  <Card key={lead.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground truncate">
                              {lead.name}
                            </h4>
                            {lead.rating && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {lead.rating}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            {lead.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[150px]">{lead.address}</span>
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 shrink-0" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center gap-1 text-success">
                                <Mail className="w-3 h-3 shrink-0" />
                                Has email ✓
                              </span>
                            )}
                            {lead.website && (
                              <span className="flex items-center gap-1 text-primary">
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                Has website ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={() => {
                  handleClose();
                  onVerifyWithAI();
                }}
                className="w-full"
                size="lg"
              >
                <ShieldCheck className="w-5 h-5 mr-2" />
                📧 Email All {leadCount.toLocaleString()} Leads
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleClose();
                    onDownload();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  disabled
                  variant="outline"
                  className="flex-1 opacity-60 cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

      {/* AI Verification Experience */}
      <AIVerificationExperience
        open={showAIVerification}
        onOpenChange={setShowAIVerification}
        leads={leads}
        onComplete={handleVerificationComplete}
      />
    </>
  );
}
