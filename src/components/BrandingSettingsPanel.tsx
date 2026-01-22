import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Palette, Upload, Trash2, Loader2, CheckCircle2, 
  Building2, Image, Cloud, HardDrive 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBranding, saveUserBranding, type UserBranding } from '@/lib/api/branding';

export default function BrandingSettingsPanel() {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState<UserBranding>({
    logo_url: null,
    company_name: null,
    primary_color: '#0ea5e9',
    email_signature: null,
    footer_text: null,
  });

  // Load branding on mount
  useEffect(() => {
    loadBranding();
  }, [isAuthenticated]);

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      // Try backend first for authenticated users
      if (isAuthenticated) {
        const remoteBranding = await getUserBranding();
        if (remoteBranding) {
          setBranding(remoteBranding);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('email_branding');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBranding(prev => ({
            ...prev,
            logo_url: parsed.logo || null,
            company_name: parsed.companyName || null,
            primary_color: parsed.primaryColor || '#0ea5e9',
            email_signature: parsed.signature || null,
            footer_text: parsed.footerText || null,
          }));
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBranding(prev => ({ ...prev, logo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBranding(prev => ({ ...prev, logo_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for immediate use
      const localBranding = {
        logo: branding.logo_url,
        companyName: branding.company_name,
        primaryColor: branding.primary_color,
        signature: branding.email_signature,
        footerText: branding.footer_text,
        enabled: true,
      };
      localStorage.setItem('email_branding', JSON.stringify(localBranding));
      
      // Also save to bamlead_branding_info for compatibility
      if (branding.logo_url || branding.company_name) {
        localStorage.setItem('bamlead_branding_info', JSON.stringify({
          logo: branding.logo_url,
          companyName: branding.company_name,
        }));
      }

      // Sync to backend for authenticated users
      if (isAuthenticated) {
        const success = await saveUserBranding(branding);
        if (success) {
          toast.success('Branding saved to your account!', {
            description: 'Your branding will persist across all devices.',
          });
        } else {
          toast.success('Branding saved locally', {
            description: 'Log in to sync across devices.',
          });
        }
      } else {
        toast.success('Branding saved locally', {
          description: 'Log in to sync across devices.',
        });
      }
    } catch (error) {
      console.error('Failed to save branding:', error);
      toast.error('Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Company Branding
          </CardTitle>
          <CardDescription>
            Customize your brand identity across all emails and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
                <Cloud className="w-3 h-3" />
                Synced to Account
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <HardDrive className="w-3 h-3" />
                Stored Locally
              </Badge>
            )}
            {!isAuthenticated && (
              <span className="text-xs text-muted-foreground">
                Log in to sync across devices
              </span>
            )}
          </div>

          <Separator />

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Company Logo
            </Label>
            <div className="flex items-start gap-4">
              {branding.logo_url ? (
                <div className="relative group">
                  <div className="w-32 h-20 border rounded-lg bg-muted/50 flex items-center justify-center p-2 overflow-hidden">
                    <img 
                      src={branding.logo_url} 
                      alt="Company logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="w-32 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {branding.logo_url ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or SVG. Max 2MB. Recommended: 400x100px
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Name
            </Label>
            <Input
              id="company-name"
              placeholder="Your Company Name"
              value={branding.company_name || ''}
              onChange={(e) => setBranding(prev => ({ ...prev, company_name: e.target.value }))}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Displayed in email headers and document footers
            </p>
          </div>

          <Separator />

          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Brand Color
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg cursor-pointer border-2 border-muted"
                />
              </div>
              <Input
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-28 font-mono text-sm"
                placeholder="#0ea5e9"
              />
              <div className="flex gap-2">
                {['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      branding.primary_color === color 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBranding(prev => ({ ...prev, primary_color: color }))}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for buttons, links, and accent elements in emails
            </p>
          </div>

          <Separator />

          {/* Email Signature */}
          <div className="space-y-2">
            <Label htmlFor="email-signature">Email Signature</Label>
            <Textarea
              id="email-signature"
              placeholder="Your name&#10;Title | Company&#10;Phone: (555) 123-4567"
              value={branding.email_signature || ''}
              onChange={(e) => setBranding(prev => ({ ...prev, email_signature: e.target.value }))}
              className="max-w-lg min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Appended to the bottom of all outgoing emails
            </p>
          </div>

          <Separator />

          {/* Footer Text */}
          <div className="space-y-2">
            <Label htmlFor="footer-text">Email Footer Text</Label>
            <Textarea
              id="footer-text"
              placeholder="© 2024 Your Company. All rights reserved.&#10;123 Business St, City, State 12345"
              value={branding.footer_text || ''}
              onChange={(e) => setBranding(prev => ({ ...prev, footer_text: e.target.value }))}
              className="max-w-lg min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Displayed at the bottom of email templates and documents
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Branding
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              Changes will apply to all email previews and templates
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
          <CardDescription>See how your branding looks in emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg overflow-hidden bg-white"
            style={{ maxWidth: '500px' }}
          >
            {/* Email Header */}
            <div 
              className="p-4 text-center"
              style={{ backgroundColor: branding.primary_color + '10' }}
            >
              {branding.logo_url ? (
                <img 
                  src={branding.logo_url} 
                  alt="Logo" 
                  className="h-10 max-w-[180px] object-contain mx-auto"
                />
              ) : branding.company_name ? (
                <h2 
                  className="text-xl font-bold"
                  style={{ color: branding.primary_color }}
                >
                  {branding.company_name}
                </h2>
              ) : (
                <div className="h-10 flex items-center justify-center text-gray-400 text-sm">
                  Your logo or company name here
                </div>
              )}
            </div>
            
            {/* Email Body */}
            <div className="p-4 text-gray-700 text-sm">
              <p className="mb-3">Hi [First Name],</p>
              <p className="mb-3">This is a preview of how your branded emails will look to recipients.</p>
              <p className="mb-4">
                <a 
                  href="#" 
                  style={{ color: branding.primary_color }}
                  className="underline"
                >
                  Links will appear in your brand color
                </a>
              </p>
              
              {branding.email_signature && (
                <div className="border-t pt-3 mt-4 whitespace-pre-line text-gray-600">
                  {branding.email_signature}
                </div>
              )}
            </div>

            {/* Email Footer */}
            <div 
              className="p-3 text-center text-xs text-gray-500"
              style={{ backgroundColor: '#f9fafb' }}
            >
              {branding.footer_text || (
                <span className="italic">Your footer text here</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
