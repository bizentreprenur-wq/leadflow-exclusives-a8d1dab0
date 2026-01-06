import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Building2,
  Mail,
  Image as ImageIcon,
  Save,
  Eye,
  Upload,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface EmailBrandingConfig {
  enabled: boolean;
  companyName: string;
  fromName: string;
  replyToEmail: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
  signature: string;
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

const defaultBranding: EmailBrandingConfig = {
  enabled: false,
  companyName: "",
  fromName: "",
  replyToEmail: "",
  logoUrl: "",
  primaryColor: "#14b8a6",
  accentColor: "#0ea5e9",
  footerText: "",
  signature: "",
  socialLinks: {},
};

interface EmailBrandingSettingsProps {
  branding: EmailBrandingConfig;
  onBrandingChange: (branding: EmailBrandingConfig) => void;
  trigger?: React.ReactNode;
}

export default function EmailBrandingSettings({
  branding,
  onBrandingChange,
  trigger,
}: EmailBrandingSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localBranding, setLocalBranding] = useState<EmailBrandingConfig>(branding || defaultBranding);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    onBrandingChange(localBranding);
    localStorage.setItem('email_branding', JSON.stringify(localBranding));
    toast.success("Branding settings saved!");
    setOpen(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setLocalBranding(prev => ({ ...prev, logoUrl: dataUrl }));
      toast.success("Logo uploaded!");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeLogo = () => {
    setLocalBranding(prev => ({ ...prev, logoUrl: "" }));
  };

  const PreviewEmail = () => (
    <div className="border rounded-xl overflow-hidden bg-white text-slate-800">
      {/* Email Header */}
      <div 
        className="p-4 text-center"
        style={{ backgroundColor: localBranding.primaryColor + '10' }}
      >
        {localBranding.logoUrl ? (
          <img 
            src={localBranding.logoUrl} 
            alt="Logo" 
            className="h-12 mx-auto object-contain"
          />
        ) : (
          <div 
            className="text-xl font-bold"
            style={{ color: localBranding.primaryColor }}
          >
            {localBranding.companyName || "Your Company"}
          </div>
        )}
      </div>

      {/* Email Body */}
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Email Subject Line Here</h2>
        <p className="text-sm text-slate-600">
          Hi {"{{business_name}}"},
        </p>
        <p className="text-sm text-slate-600">
          This is a preview of how your branded emails will look to recipients...
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: localBranding.primaryColor }}
        >
          Call to Action
        </button>
      </div>

      {/* Email Signature */}
      {localBranding.signature && (
        <div className="px-6 py-4 border-t text-sm text-slate-600 whitespace-pre-line">
          {localBranding.signature}
        </div>
      )}

      {/* Email Footer */}
      <div 
        className="p-4 text-center text-xs text-slate-500 border-t"
        style={{ backgroundColor: localBranding.accentColor + '10' }}
      >
        {localBranding.footerText || `© ${new Date().getFullYear()} ${localBranding.companyName || "Your Company"}. All rights reserved.`}
        {localBranding.socialLinks.website && (
          <div className="mt-2">
            <a href={localBranding.socialLinks.website} className="text-blue-500 hover:underline">
              {localBranding.socialLinks.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Email Branding Settings
          </DialogTitle>
          <DialogDescription>
            Customize how your emails appear to recipients with your own branding
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Settings Panel */}
          <div className="space-y-4">
            {/* Enable Branding */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Custom Branding</p>
                  <p className="text-xs text-muted-foreground">Use your company branding</p>
                </div>
              </div>
              <Switch
                checked={localBranding.enabled}
                onCheckedChange={(checked) => 
                  setLocalBranding(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {localBranding.enabled && (
              <Accordion type="single" collapsible defaultValue="company" className="space-y-2">
                {/* Company Info */}
                <AccordionItem value="company" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Company Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={localBranding.companyName}
                        onChange={(e) => setLocalBranding(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="SthillStudios"
                      />
                    </div>
                    <div>
                      <Label>Logo</Label>
                      <div className="flex items-center gap-2 mt-2">
                        {localBranding.logoUrl ? (
                          <div className="relative">
                            <img 
                              src={localBranding.logoUrl} 
                              alt="Logo" 
                              className="h-12 rounded border"
                            />
                            <button
                              onClick={removeLogo}
                              className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Upload Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Email Settings */}
                <AccordionItem value="email" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email Settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div>
                      <Label>From Name</Label>
                      <Input
                        value={localBranding.fromName}
                        onChange={(e) => setLocalBranding(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="John from SthillStudios"
                      />
                    </div>
                    <div>
                      <Label>Reply-To Email</Label>
                      <Input
                        type="email"
                        value={localBranding.replyToEmail}
                        onChange={(e) => setLocalBranding(prev => ({ ...prev, replyToEmail: e.target.value }))}
                        placeholder="hello@sthillstudios.com"
                      />
                    </div>
                    <div>
                      <Label>Email Signature</Label>
                      <Textarea
                        value={localBranding.signature}
                        onChange={(e) => setLocalBranding(prev => ({ ...prev, signature: e.target.value }))}
                        placeholder="Best regards,&#10;John Smith&#10;CEO, SthillStudios"
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Colors */}
                <AccordionItem value="colors" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Brand Colors
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={localBranding.primaryColor}
                          onChange={(e) => setLocalBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={localBranding.primaryColor}
                          onChange={(e) => setLocalBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={localBranding.accentColor}
                          onChange={(e) => setLocalBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={localBranding.accentColor}
                          onChange={(e) => setLocalBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Footer */}
                <AccordionItem value="footer" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Footer & Links
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div>
                      <Label>Footer Text</Label>
                      <Input
                        value={localBranding.footerText}
                        onChange={(e) => setLocalBranding(prev => ({ ...prev, footerText: e.target.value }))}
                        placeholder="© 2024 SthillStudios. Premium Web Design."
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={localBranding.socialLinks.website || ""}
                        onChange={(e) => setLocalBranding(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, website: e.target.value }
                        }))}
                        placeholder="https://sthillstudios.com"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="w-4 h-4" />
              Live Preview
            </div>
            <PreviewEmail />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Branding
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to load branding from localStorage
export function useEmailBranding() {
  const [branding, setBranding] = useState<EmailBrandingConfig>(() => {
    const saved = localStorage.getItem('email_branding');
    return saved ? JSON.parse(saved) : defaultBranding;
  });

  const updateBranding = (newBranding: EmailBrandingConfig) => {
    setBranding(newBranding);
    localStorage.setItem('email_branding', JSON.stringify(newBranding));
  };

  return { branding, updateBranding };
}

// Apply branding to email HTML
export function applyBrandingToEmail(html: string, branding: EmailBrandingConfig): string {
  if (!branding.enabled) return html;

  // Create header with logo or company name
  const headerHtml = branding.logoUrl 
    ? `<div style="text-align: center; padding: 20px; background-color: ${branding.primaryColor}10;">
         <img src="${branding.logoUrl}" alt="${branding.companyName}" style="height: 48px; object-fit: contain;" />
       </div>`
    : branding.companyName 
    ? `<div style="text-align: center; padding: 20px; background-color: ${branding.primaryColor}10;">
         <div style="font-size: 24px; font-weight: bold; color: ${branding.primaryColor};">${branding.companyName}</div>
       </div>`
    : '';

  // Create signature
  const signatureHtml = branding.signature 
    ? `<div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; white-space: pre-line; color: #4b5563; font-size: 14px;">${branding.signature}</div>`
    : '';

  // Create footer
  const footerHtml = `
    <div style="text-align: center; padding: 16px; background-color: ${branding.accentColor}10; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      ${branding.footerText || `© ${new Date().getFullYear()} ${branding.companyName || ""}. All rights reserved.`}
      ${branding.socialLinks.website ? `<div style="margin-top: 8px;"><a href="${branding.socialLinks.website}" style="color: #3b82f6;">${branding.socialLinks.website}</a></div>` : ''}
    </div>
  `;

  // Wrap the email content
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${headerHtml}
        <div style="padding: 24px;">
          ${html}
        </div>
        ${signatureHtml}
        ${footerHtml}
      </div>
    </body>
    </html>
  `;
}
