import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Send,
  Clock,
  Zap,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Users,
  FileText,
  CheckCircle2,
  PartyPopper,
  Timer,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  AlertTriangle,
  ImagePlus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EmailTemplatePreset } from "@/lib/emailTemplates";
import { 
  sendBulkEmails, 
  createTemplate,
  LeadForEmail,
  BulkSendParams,
} from "@/lib/api/email";
import EmailTemplateGallery from "./EmailTemplateGallery";

interface VerifiedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  leadScore?: number;
  emailValid?: boolean;
}

interface EmailComposerFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verifiedLeads: VerifiedLead[];
  onComplete: (config: EmailSendConfig) => void;
}

interface EmailSendConfig {
  template: EmailTemplatePreset;
  subject: string;
  body: string;
  leads: VerifiedLead[];
  sendMode: "instant" | "drip" | "scheduled";
  dripConfig?: {
    emailsPerHour: number;
    delayMinutes: number;
  };
  scheduledTime?: string;
  result?: {
    sent: number;
    failed: number;
    scheduled?: number;
  };
}

type Step = "template" | "customize" | "delivery" | "review" | "sending" | "success";

export default function EmailComposerFlow({
  open,
  onOpenChange,
  verifiedLeads,
  onComplete,
}: EmailComposerFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplatePreset | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customImages, setCustomImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [sendMode, setSendMode] = useState<"instant" | "drip" | "scheduled">("drip");
  const [emailsPerHour, setEmailsPerHour] = useState(20);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; scheduled?: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const validLeads = verifiedLeads.filter(l => l.emailValid !== false && l.email);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep("template");
      setSelectedTemplate(null);
      setCustomSubject("");
      setCustomBody("");
      setCustomImages([]);
      setSendMode("drip");
      setEmailsPerHour(20);
      setSendProgress(0);
      setSendResult(null);
      setSendError(null);
      setIsUploadingImage(false);
    }
  }, [open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);

    try {
      const newImages: Array<{ id: string; url: string; name: string }> = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 5MB`);
          continue;
        }

        // Convert to base64 data URL for embedding in email
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: dataUrl,
          name: file.name,
        });
      }

      setCustomImages(prev => [...prev, ...newImages]);
      
      if (newImages.length > 0) {
        toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleInsertImage = (imageUrl: string) => {
    const imageHtml = `<br/><img src="${imageUrl}" alt="Email image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" /><br/>`;
    setCustomBody(prev => prev + imageHtml);
    toast.success('Image inserted into email body');
  };

  const handleSelectTemplate = (template: EmailTemplatePreset) => {
    setSelectedTemplate(template);
    setCustomSubject(template.subject);
    setCustomBody(template.body_html);
    setShowTemplateGallery(false);
    setCurrentStep("customize");
  };

  const handleSend = async () => {
    if (!selectedTemplate && !customSubject) return;

    setCurrentStep("sending");
    setIsSending(true);
    setSendError(null);
    setSendProgress(10);

    try {
      // First, create a custom template if the user modified it
      let templateId: number | undefined;
      
      if (customSubject !== selectedTemplate?.subject || customBody !== selectedTemplate?.body_html) {
        setSendProgress(20);
        const templateResult = await createTemplate({
          name: `Campaign - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          subject: customSubject,
          body_html: customBody,
          is_default: false,
        });
        
        if (templateResult.success && templateResult.id) {
          templateId = templateResult.id;
        } else {
          throw new Error(templateResult.error || 'Failed to save template');
        }
      }

      setSendProgress(40);

      // Convert verified leads to LeadForEmail format
      const leadsForEmail: LeadForEmail[] = validLeads.map(lead => ({
        id: parseInt(lead.id) || undefined,
        email: lead.email || '',
        business_name: lead.name,
        contact_name: lead.name,
        website: lead.website,
        phone: lead.phone,
        leadScore: lead.leadScore,
        emailValid: lead.emailValid,
      }));

      // Prepare send params
      const sendParams: BulkSendParams = {
        leads: leadsForEmail,
        template_id: templateId,
        custom_subject: customSubject,
        custom_body: customBody,
        send_mode: sendMode,
        scheduled_for: sendMode === "scheduled" ? `${scheduledDate}T${scheduledTime}` : undefined,
        drip_config: sendMode === "drip" ? {
          emailsPerHour,
          delayMinutes: Math.floor(60 / emailsPerHour),
        } : undefined,
      };

      setSendProgress(60);

      // Send the emails
      const result = await sendBulkEmails(sendParams);

      setSendProgress(100);

      if (result.success && result.results) {
        setSendResult({
          sent: result.results.sent,
          failed: result.results.failed,
          scheduled: result.results.scheduled,
        });

        const config: EmailSendConfig = {
          template: selectedTemplate!,
          subject: customSubject,
          body: customBody,
          leads: validLeads,
          sendMode,
          dripConfig: sendMode === "drip" ? { emailsPerHour, delayMinutes: Math.floor(60 / emailsPerHour) } : undefined,
          scheduledTime: sendMode === "scheduled" ? `${scheduledDate}T${scheduledTime}` : undefined,
          result: {
            sent: result.results.sent,
            failed: result.results.failed,
            scheduled: result.results.scheduled,
          },
        };

        setCurrentStep("success");
        onComplete(config);
        toast.success(`Successfully queued ${result.results.sent} emails!`);
      } else {
        throw new Error(result.error || 'Failed to send emails');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      setSendError(error.message || 'An error occurred while sending emails');
      setCurrentStep("review");
      toast.error(error.message || 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "template", label: "Template", icon: <FileText className="w-4 h-4" /> },
    { key: "customize", label: "Customize", icon: <Sparkles className="w-4 h-4" /> },
    { key: "delivery", label: "Delivery", icon: <Clock className="w-4 h-4" /> },
    { key: "review", label: "Review", icon: <Eye className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4 border-b border-border">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              currentStep === step.key
                ? "bg-primary text-primary-foreground"
                : index < currentStepIndex
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {index < currentStepIndex ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              step.icon
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${
              index < currentStepIndex ? "bg-success" : "bg-border"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={open && !showTemplateGallery} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Send Email Campaign
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {validLeads.length} verified leads ready to receive your message
            </p>
          </DialogHeader>

          {/* Step Indicator */}
          {currentStep !== "success" && currentStep !== "sending" && renderStepIndicator()}

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* TEMPLATE STEP */}
              {currentStep === "template" && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Choose Your Email Template
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Start with one of our professionally crafted templates, then customize it for your needs.
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowTemplateGallery(true)}
                    className="w-full h-16 text-lg gap-3"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Browse Template Gallery
                    <ArrowRight className="w-5 h-5 ml-auto" />
                  </Button>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border">
                      <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{validLeads.length}</p>
                      <p className="text-xs text-muted-foreground">Verified Leads</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                      <Mail className="w-5 h-5 text-success mx-auto mb-2" />
                      <p className="text-2xl font-bold text-success">
                        {validLeads.filter(l => l.email).length}
                      </p>
                      <p className="text-xs text-muted-foreground">With Email</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(validLeads.reduce((acc, l) => acc + (l.leadScore || 75), 0) / validLeads.length || 0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOMIZE STEP */}
              {currentStep === "customize" && selectedTemplate && (
                <div className="space-y-6">
                  {/* Selected Template Badge */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{selectedTemplate.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{selectedTemplate.category}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowTemplateGallery(true)}>
                      Change
                    </Button>
                  </div>

                  {/* Subject Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Email Subject
                    </Label>
                    <Input
                      id="subject"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="text-lg"
                      placeholder="Enter subject line..."
                    />
                  </div>

                  {/* Body Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="body" className="text-sm font-medium">
                      Email Body
                    </Label>
                    <Textarea
                      id="body"
                      value={customBody.replace(/<[^>]*>/g, '')}
                      onChange={(e) => setCustomBody(`<p>${e.target.value.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`)}
                      className="min-h-[200px] text-sm"
                      placeholder="Write your email content..."
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Custom Images</span>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={isUploadingImage}
                          asChild
                        >
                          <span>
                            {isUploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ImagePlus className="w-4 h-4" />
                            )}
                            {isUploadingImage ? 'Uploading...' : 'Add Image'}
                          </span>
                        </Button>
                      </label>
                    </div>

                    {/* Uploaded Images Grid */}
                    {customImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {customImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <div className="aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleInsertImage(image.url)}
                              >
                                Insert
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleRemoveImage(image.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-1 px-1">
                              {image.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 border-2 border-dashed border-border rounded-lg mb-3">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Upload images to personalize your email
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Click "Insert" on any image to add it to your email. Max 5MB per image.
                    </p>
                  </div>

                  {/* Personalization Tokens */}
                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-foreground">Personalization Tokens</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["{{business_name}}", "{{first_name}}", "{{email}}", "{{website}}"].map((token) => (
                        <Badge
                          key={token}
                          variant="outline"
                          className="cursor-pointer hover:bg-warning/10 transition-colors"
                          onClick={() => setCustomBody(prev => prev + ` ${token}`)}
                        >
                          {token}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click to insert at cursor position
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep("template")} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep("delivery")} className="flex-1">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* DELIVERY STEP */}
              {currentStep === "delivery" && (
                <div className="space-y-6">
                  <div className="text-center pb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      How should we deliver your emails?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose the best sending strategy for your campaign
                    </p>
                  </div>

                  {/* Delivery Options */}
                  <div className="space-y-3">
                    {/* Drip Option - Recommended */}
                    <button
                      onClick={() => setSendMode("drip")}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        sendMode === "drip"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${sendMode === "drip" ? "bg-primary/10" : "bg-muted"}`}>
                          <Timer className={`w-5 h-5 ${sendMode === "drip" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">Drip Send</span>
                            <Badge className="bg-success text-success-foreground text-xs">Recommended</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Gradually send emails over time to avoid spam filters and maximize deliverability
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          sendMode === "drip" ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {sendMode === "drip" && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>

                    {/* Scheduled Option */}
                    <button
                      onClick={() => setSendMode("scheduled")}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        sendMode === "scheduled"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${sendMode === "scheduled" ? "bg-primary/10" : "bg-muted"}`}>
                          <Calendar className={`w-5 h-5 ${sendMode === "scheduled" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">Schedule for Later</span>
                          <p className="text-sm text-muted-foreground">
                            Pick a specific date and time to send all emails
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          sendMode === "scheduled" ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {sendMode === "scheduled" && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>

                    {/* Instant Option */}
                    <button
                      onClick={() => setSendMode("instant")}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        sendMode === "instant"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${sendMode === "instant" ? "bg-primary/10" : "bg-muted"}`}>
                          <Zap className={`w-5 h-5 ${sendMode === "instant" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">Send Instantly</span>
                          <p className="text-sm text-muted-foreground">
                            Send all emails immediately (not recommended for large lists)
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          sendMode === "instant" ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {sendMode === "instant" && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Drip Configuration */}
                  {sendMode === "drip" && (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Emails per hour</Label>
                        <span className="text-lg font-bold text-primary">{emailsPerHour}</span>
                      </div>
                      <Slider
                        value={[emailsPerHour]}
                        onValueChange={(v) => setEmailsPerHour(v[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span>
                          Estimated delivery time: ~{Math.ceil(validLeads.length / emailsPerHour)} hours
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Schedule Configuration */}
                  {sendMode === "scheduled" && (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instant Warning */}
                  {sendMode === "instant" && validLeads.length > 50 && (
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Large list warning</p>
                        <p className="text-sm text-muted-foreground">
                          Sending {validLeads.length} emails at once may trigger spam filters. Consider using Drip Send instead.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep("customize")} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep("review")} className="flex-1">
                      Review Campaign
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* REVIEW STEP */}
              {currentStep === "review" && selectedTemplate && (
                <div className="space-y-6">
                  <div className="text-center pb-2">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Review Your Campaign
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Make sure everything looks good before sending
                    </p>
                  </div>

                  {/* Error Display */}
                  {sendError && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Error sending emails</p>
                        <p className="text-sm text-muted-foreground">{sendError}</p>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">RECIPIENTS</p>
                      <p className="text-2xl font-bold text-foreground">{validLeads.length}</p>
                      <p className="text-xs text-muted-foreground">verified leads</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">DELIVERY</p>
                      <p className="text-lg font-bold text-foreground capitalize">{sendMode}</p>
                      {sendMode === "drip" && (
                        <p className="text-xs text-muted-foreground">{emailsPerHour} emails/hour</p>
                      )}
                      {sendMode === "scheduled" && scheduledDate && (
                        <p className="text-xs text-muted-foreground">{scheduledDate} {scheduledTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">TEMPLATE</p>
                    <p className="font-medium text-foreground mb-1">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">Subject: {customSubject}</p>
                  </div>

                  {/* Email Preview */}
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-3">EMAIL PREVIEW</p>
                    <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none line-clamp-4"
                        dangerouslySetInnerHTML={{ __html: customBody }}
                      />
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("delivery")}
                      disabled={isSending}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={isSending}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Campaign
                    </Button>
                  </div>
                </div>
              )}

              {/* SENDING STEP */}
              {currentStep === "sending" && (
                <div className="space-y-6 py-8">
                  <div className="text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Sending Your Campaign...
                    </h3>
                    <p className="text-muted-foreground">
                      Please wait while we process your emails
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(sendProgress)}%</span>
                    </div>
                    <Progress value={sendProgress} className="h-3" />
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    {sendProgress < 30 && "Preparing template..."}
                    {sendProgress >= 30 && sendProgress < 60 && "Processing leads..."}
                    {sendProgress >= 60 && sendProgress < 100 && "Sending emails..."}
                    {sendProgress >= 100 && "Finalizing..."}
                  </div>
                </div>
              )}

              {/* SUCCESS STEP */}
              {currentStep === "success" && (
                <div className="text-center py-8 space-y-6">
                  <div className="inline-flex p-5 rounded-full bg-success/10 border border-success/20">
                    <PartyPopper className="w-12 h-12 text-success" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Campaign Launched! 🎉
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your emails are {sendMode === "drip" ? "being sent gradually" : sendMode === "scheduled" ? "scheduled" : "being sent"} to {validLeads.length} leads.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <Send className="w-5 h-5 text-success mx-auto mb-2" />
                      <p className="text-xl font-bold text-success">{sendResult?.sent || validLeads.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {sendMode === "drip" || sendMode === "scheduled" ? "Queued" : "Sent"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-xl font-bold text-primary">
                        {sendResult ? Math.round((sendResult.sent / (sendResult.sent + sendResult.failed)) * 100) : 100}%
                      </p>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                      <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
                      <p className="text-xl font-bold text-warning">
                        {sendMode === "drip" ? `~${Math.ceil(validLeads.length / emailsPerHour)}h` : "Now"}
                      </p>
                      <p className="text-xs text-muted-foreground">Est. Time</p>
                    </div>
                  </div>

                  {sendResult?.failed && sendResult.failed > 0 && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 max-w-md mx-auto">
                      <p className="text-sm text-destructive">
                        {sendResult.failed} emails failed to send
                      </p>
                    </div>
                  )}

                  <Button onClick={() => onOpenChange(false)} className="mt-4">
                    Done
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Template Gallery */}
      <EmailTemplateGallery
        open={showTemplateGallery}
        onOpenChange={setShowTemplateGallery}
        onSelectTemplate={handleSelectTemplate}
        onBack={() => setShowTemplateGallery(false)}
      />
    </>
  );
}
