import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useUserBranding } from "@/hooks/useUserBranding";
import { sanitizeEmailHTML } from "@/lib/sanitize";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  Check, 
  Lightbulb, 
  Globe, 
  Building2, 
  Briefcase, 
  MessageSquare,
  RotateCcw,
  Sparkles,
  Copy,
  X,
  Edit3,
  Save,
  Wand2,
  Trash2,
  Star,
  FolderOpen,
  Folder,
  Plus,
  MoveRight,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { HIGH_CONVERTING_TEMPLATES, TEMPLATE_CATEGORIES, EmailTemplate } from "@/lib/highConvertingTemplates";
import { 
  getCustomTemplates, 
  saveCustomTemplate, 
  deleteCustomTemplate, 
  CustomTemplate,
  getTemplateFolders,
  createTemplateFolder,
  moveTemplateToFolder,
  TemplateFolder,
  DEFAULT_FOLDERS,
  addLeadsToCRM,
} from "@/lib/customTemplates";
import { toast } from "sonner";
import { saveUserBranding } from "@/lib/api/branding";
import { useAuth } from "@/contexts/AuthContext";

interface HighConvertingTemplateGalleryProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
  leads?: Array<{ id: string; name: string; email?: string; phone?: string; website?: string; address?: string }>;
}

// Track the currently highlighted template for the sticky bar
interface SelectedTemplateState {
  template: EmailTemplate;
  isSelected: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'web-design': return <Globe className="w-4 h-4" />;
    case 'local-services': return <Building2 className="w-4 h-4" />;
    case 'b2b': return <Briefcase className="w-4 h-4" />;
    case 'general': return <MessageSquare className="w-4 h-4" />;
    case 'follow-up': return <RotateCcw className="w-4 h-4" />;
    case 'promotional': return <Sparkles className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  // WHITE TEXT on BLACK BACKGROUND with heavy shadow for maximum visibility
  const baseStyles = 'text-white font-bold bg-black/80 border-white/20 shadow-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]';
  switch (category) {
    case 'web-design':
      return `${baseStyles} ring-1 ring-primary/50`;
    case 'local-services':
      return `${baseStyles} ring-1 ring-accent/50`;
    case 'b2b':
      return `${baseStyles} ring-1 ring-blue-500/50`;
    case 'general':
      return `${baseStyles} ring-1 ring-slate-500/50`;
    case 'follow-up':
      return `${baseStyles} ring-1 ring-warning/50`;
    case 'promotional':
      return `${baseStyles} ring-1 ring-success/50`;
    default:
      return `${baseStyles}`;
  }
};

const getFolderColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[color] || colors.slate;
};

export default function HighConvertingTemplateGallery({ 
  onSelectTemplate, 
  selectedTemplateId,
  leads = [],
}: HighConvertingTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  
  // User branding for logo display
  const { branding, refetch: refetchBranding } = useUserBranding();
  const { isAuthenticated } = useAuth();
  
  // Custom templates and folders from localStorage
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Upload your own template state
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [uploadTemplateName, setUploadTemplateName] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadBody, setUploadBody] = useState('');
  const [uploadIndustry, setUploadIndustry] = useState('');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadLogoLocal, setUploadLogoLocal] = useState<string | null>(null);
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const uploadLogoRef = useRef<HTMLInputElement>(null);
  
  // Load custom templates and folders on mount
  useEffect(() => {
    setCustomTemplates(getCustomTemplates());
    setFolders(getTemplateFolders());
  }, []);
  
  // Add leads to CRM when they arrive
  useEffect(() => {
    if (leads.length > 0) {
      addLeadsToCRM(leads);
    }
  }, [leads]);
  
  // Track highlighted template for sticky bar (before final selection)
  const [highlightedTemplate, setHighlightedTemplate] = useState<EmailTemplate | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  // Handle image upload for custom template
  const handleTemplateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setUploadImage(reader.result as string);
      toast.success('Template image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Handle logo upload if user doesn't have one
  const handleLogoUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadLogoLocal(base64);
      
      // Sync with email_branding localStorage
      const existing = JSON.parse(localStorage.getItem('email_branding') || '{}');
      localStorage.setItem('email_branding', JSON.stringify({ ...existing, logoUrl: base64 }));
      
      // Also sync with bamlead_branding_info for proposals/contracts
      const brandingInfo = JSON.parse(localStorage.getItem('bamlead_branding_info') || '{}');
      localStorage.setItem('bamlead_branding_info', JSON.stringify({ ...brandingInfo, logo: base64 }));
      
      // Persist to backend for logged-in users
      if (isAuthenticated) {
        const saved = await saveUserBranding({ logo_url: base64 });
        if (saved) {
          toast.success('Business logo saved to your account!');
          refetchBranding();
        } else {
          toast.warning('Logo saved locally, but backend save failed.');
        }
      } else {
        toast.success('Business logo uploaded! (Log in to save permanently)');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle saving uploaded template
  const handleSaveUploadedTemplate = () => {
    if (!uploadTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!uploadSubject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }
    if (!uploadBody.trim()) {
      toast.error('Please enter email body content');
      return;
    }
    
    // Build HTML body with optional image
    let htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">`;
    
    if (uploadImage) {
      htmlBody += `<div style="text-align: center; margin-bottom: 20px;">
        <img src="${uploadImage}" alt="Template image" style="max-width: 100%; height: auto; border-radius: 8px;" />
      </div>`;
    }
    
    htmlBody += uploadBody.split('\n').map(p => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`).join('');
    htmlBody += `</div>`;
    
    const newTemplate = saveCustomTemplate({
      id: '',
      name: uploadTemplateName.trim(),
      category: 'general',
      industry: uploadIndustry.trim() || 'General',
      subject: uploadSubject.trim(),
      body_html: htmlBody,
      description: `Custom uploaded template`,
      previewImage: uploadImage || 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&h=300&fit=crop',
      conversionTip: 'Personalize this template for better engagement',
      openRate: 0,
      replyRate: 0,
      folderId: undefined,
    });
    
    setCustomTemplates(getCustomTemplates());
    
    // Reset form
    setUploadTemplateName('');
    setUploadSubject('');
    setUploadBody('');
    setUploadIndustry('');
    setUploadImage(null);
    setShowUploadSection(false);
    
    toast.success(`🎉 Template "${newTemplate.name}" saved to your library!`);
    
    // Auto-select the new template if callback exists
    if (onSelectTemplate) {
      onSelectTemplate(newTemplate);
      setHighlightedTemplate(newTemplate);
    }
  };

  // Combine custom templates with built-in templates (custom first)
  const allTemplates = [...customTemplates, ...HIGH_CONVERTING_TEMPLATES];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check folder filter for custom templates
    if (activeFolder) {
      if ('isCustom' in template) {
        return matchesSearch && (template as CustomTemplate).folderId === activeFolder;
      }
      return false; // Built-in templates don't have folders
    }
    
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory || (activeCategory === 'custom' && 'isCustom' in template);
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body_html);
    toast.success("Template HTML copied!");
  };

  const handleSelect = (template: EmailTemplate) => {
    onSelectTemplate?.(template);
    toast.success(`Selected: ${template.name}`);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setEditedSubject(template.subject);
    // Convert HTML to plain text for editing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template.body_html;
    setEditedBody(tempDiv.textContent || tempDiv.innerText || '');
    setNewTemplateName(`My ${template.name}`);
    setIsEditing(true);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    const folder = createTemplateFolder(newFolderName.trim());
    setFolders(getTemplateFolders());
    setNewFolderName('');
    setShowNewFolderInput(false);
    toast.success(`Folder "${folder.name}" created!`);
  };

  const handleMoveToFolder = (templateId: string, folderId: string | null) => {
    moveTemplateToFolder(templateId, folderId);
    setCustomTemplates(getCustomTemplates());
    toast.success(folderId ? 'Template moved to folder' : 'Template removed from folder');
  };

  const handleSaveAsNewTemplate = () => {
    if (!previewTemplate || !newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    const newTemplate = saveCustomTemplate({
      id: '', // Will be generated
      name: newTemplateName.trim(),
      category: previewTemplate.category,
      industry: previewTemplate.industry,
      subject: editedSubject,
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${editedBody.split('\n').map(p => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`).join('')}
      </div>`,
      description: `Custom template based on ${previewTemplate.name}`,
      previewImage: previewTemplate.previewImage,
      conversionTip: previewTemplate.conversionTip,
      openRate: previewTemplate.openRate,
      replyRate: previewTemplate.replyRate,
      folderId: selectedFolderId || undefined,
    });
    
    setCustomTemplates(getCustomTemplates());
    onSelectTemplate?.(newTemplate);
    setPreviewTemplate(null);
    setIsEditing(false);
    toast.success('🎉 Template saved to your library!');
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    if (deleteCustomTemplate(templateId)) {
      setCustomTemplates(getCustomTemplates());
      toast.success('Template deleted');
    }
  };

  const handleSaveCustomTemplate = () => {
    if (!previewTemplate) return;
    
    // Save to localStorage so customer can access it later
    const newTemplate = saveCustomTemplate({
      id: '', // Will be generated
      name: `Custom: ${previewTemplate.name}`,
      category: previewTemplate.category,
      industry: previewTemplate.industry,
      subject: editedSubject,
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${editedBody.split('\n').map(p => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`).join('')}
      </div>`,
      description: `Custom template based on ${previewTemplate.name}`,
      previewImage: previewTemplate.previewImage,
      conversionTip: previewTemplate.conversionTip,
      openRate: previewTemplate.openRate,
      replyRate: previewTemplate.replyRate,
      folderId: selectedFolderId || undefined,
    });
    
    // Refresh the templates list so it shows immediately
    setCustomTemplates(getCustomTemplates());
    onSelectTemplate?.(newTemplate);
    setPreviewTemplate(null);
    setIsEditing(false);
    toast.success('✅ Template saved to your library!');
  };

  // FIX: Always open preview when clicking on template
  const openPreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setEditedSubject(template.subject);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template.body_html;
    setEditedBody(tempDiv.textContent || tempDiv.innerText || '');
    setIsEditing(false);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!previewTemplate) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewTemplate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Email Template Gallery
            </h2>
            <p className="text-muted-foreground">
              {allTemplates.length} templates ({customTemplates.length} custom, {HIGH_CONVERTING_TEMPLATES.length} built-in)
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Folder Navigation (for custom templates) */}
        {customTemplates.length > 0 && activeCategory === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <span className="text-sm font-medium text-muted-foreground mr-2">📁 Folders:</span>
            
            <Button
              variant={activeFolder === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFolder(null)}
              className="h-8"
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              All
            </Button>
            
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={activeFolder === folder.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFolder(folder.id)}
                className={`h-8 ${activeFolder !== folder.id ? getFolderColor(folder.color) : ''}`}
              >
                <span className="mr-1">{folder.icon}</span>
                {folder.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {customTemplates.filter(t => t.folderId === folder.id).length}
                </Badge>
              </Button>
            ))}
            
            {/* Add New Folder */}
            {showNewFolderInput ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="h-8 w-32"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <Button size="sm" className="h-8" onClick={handleCreateFolder}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewFolderInput(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewFolderInput(true)}
                className="h-8 border-dashed border"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Folder
              </Button>
            )}
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={(val) => { setActiveCategory(val); setActiveFolder(null); }}>
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            {/* My Templates Tab - Show first if user has custom templates */}
            {customTemplates.length > 0 && (
              <TabsTrigger
                value="custom"
                className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground px-4 py-2 rounded-full border border-warning/50 bg-warning/10"
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  My Templates
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {customTemplates.length}
                  </Badge>
                </span>
              </TabsTrigger>
            )}
            {TEMPLATE_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full border border-border"
              >
                <span className="flex items-center gap-2">
                  {getCategoryIcon(cat.id)}
                  {cat.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {cat.count}
                  </Badge>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Upload Your Own Template Section */}
      <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          {!showUploadSection ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Your Own Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a custom email template with your own content and images
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowUploadSection(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Create Your Custom Template
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUploadSection(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Logo Upload Section - Show if user doesn't have a logo */}
              {!branding?.logo_url && !uploadLogoLocal && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-3 mb-3">
                    <ImageIcon className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm">No Business Logo Found</p>
                      <p className="text-xs text-muted-foreground">
                        Upload your logo to include in all email templates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={uploadLogoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUploadLocal}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => uploadLogoRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Business Logo
                    </Button>
                    <span className="text-xs text-muted-foreground">Max 2MB • PNG, JPG</span>
                  </div>
                </div>
              )}

              {/* Show uploaded logo preview */}
              {(branding?.logo_url || uploadLogoLocal) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                  <img 
                    src={branding?.logo_url || uploadLogoLocal || ''} 
                    alt="Business Logo" 
                    className="h-10 max-w-[120px] object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success">✓ Business Logo Ready</p>
                    <p className="text-xs text-muted-foreground">Will be included in your emails</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="upload-name">Template Name *</Label>
                  <Input
                    id="upload-name"
                    value={uploadTemplateName}
                    onChange={(e) => setUploadTemplateName(e.target.value)}
                    placeholder="e.g., My Follow-up Template"
                  />
                </div>

                {/* Industry/Category */}
                <div className="space-y-2">
                  <Label htmlFor="upload-industry">Industry/Category</Label>
                  <Input
                    id="upload-industry"
                    value={uploadIndustry}
                    onChange={(e) => setUploadIndustry(e.target.value)}
                    placeholder="e.g., Real Estate, HVAC, etc."
                  />
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="upload-subject">Subject Line *</Label>
                <Input
                  id="upload-subject"
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  placeholder="e.g., Quick question about {{business_name}}"
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders: {"{{first_name}}"}, {"{{business_name}}"}, {"{{website}}"}
                </p>
              </div>

              {/* Template Image Upload */}
              <div className="space-y-2">
                <Label>Template Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={uploadImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleTemplateImageUpload}
                  />
                  {uploadImage ? (
                    <div className="relative">
                      <img 
                        src={uploadImage} 
                        alt="Template preview" 
                        className="h-20 w-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={() => setUploadImage(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => uploadImageRef.current?.click()}
                      className="gap-2 h-20 w-32 flex-col"
                    >
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs">Add Image</span>
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground flex-1">
                    Add a header image to your template. This will appear at the top of your email.
                  </p>
                </div>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label htmlFor="upload-body">Email Body *</Label>
                <Textarea
                  id="upload-body"
                  value={uploadBody}
                  onChange={(e) => setUploadBody(e.target.value)}
                  placeholder={`Hi {{first_name}},

I noticed your business {{business_name}} and wanted to reach out...

Looking forward to connecting!

Best regards,
[Your Name]`}
                  className="min-h-[200px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadSection(false);
                    setUploadTemplateName('');
                    setUploadSubject('');
                    setUploadBody('');
                    setUploadIndustry('');
                    setUploadImage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUploadedTemplate}
                  className="gap-2"
                  disabled={!uploadTemplateName.trim() || !uploadSubject.trim() || !uploadBody.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Grid - CLICK OPENS PREVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-24">
        {filteredTemplates.map((template) => {
          const isHighlighted = highlightedTemplate?.id === template.id;
          const isSelected = selectedTemplateId === template.id;
          const isCustom = 'isCustom' in template;
          
          return (
            <Card 
              key={template.id}
              className={`group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${isHighlighted ? 'ring-2 ring-success' : ''}`}
              onClick={() => openPreview(template)}
            >
              {/* Preview Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={template.previewImage} 
                  alt={template.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                
                {/* Category Badge */}
                <Badge 
                  className={`absolute top-2 left-2 text-xs ${getCategoryColor(template.category)}`}
                >
                  {isCustom ? '⭐ My Template' : template.industry}
                </Badge>

                {/* Folder indicator for custom templates */}
                {isCustom && (template as CustomTemplate).folderId && (
                  <Badge className="absolute top-2 right-10 text-xs bg-muted/80">
                    {folders.find(f => f.id === (template as CustomTemplate).folderId)?.icon}
                  </Badge>
                )}

                {/* Delete button for custom templates */}
                {isCustom && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomTemplate(template.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}

                {/* Selected/Highlighted Indicator */}
                {(isSelected || isHighlighted) && !isCustom && (
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-primary' : 'bg-success'
                  }`}>
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Action Buttons on Hover - Compact side-by-side */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    className="flex-1 text-[10px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(template);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-0.5" />
                    Edit
                  </Button>
                  {onSelectTemplate && (
                    <Button 
                      size="sm" 
                      className="flex-1 text-[10px] h-7 px-2 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(template);
                        setHighlightedTemplate(template);
                      }}
                    >
                      <Check className="w-3 h-3 mr-0.5" />
                      Use
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="p-3 space-y-1">
                <h3 className="font-medium text-sm truncate">{template.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {template.description}
                </p>
                {/* Move to Folder option for custom templates */}
                {'isCustom' in template && (
                  <Select
                    value={(template as CustomTemplate).folderId || 'none'}
                    onValueChange={(value) => handleMoveToFolder(template.id, value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="h-7 text-xs mt-2">
                      <SelectValue placeholder="Move to folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="flex items-center gap-1">
                          <Folder className="w-3 h-3" /> No Folder
                        </span>
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <span className="flex items-center gap-1">
                            {folder.icon} {folder.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No templates found matching your search.</p>
        </div>
      )}

      {/* Preview/Edit Modal */}
      {previewTemplate &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 z-[1000] bg-black/80 backdrop-blur-sm"
              role="presentation"
              aria-hidden="true"
              onClick={closePreview}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-[1001] w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg bg-background text-foreground border border-primary/40 shadow-elevated ring-1 ring-primary/20"
            >
              {/* Prominent X Close Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={closePreview}
                className="absolute top-4 right-4 z-10 bg-background/90 hover:bg-destructive hover:text-destructive-foreground border-2 shadow-lg"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="p-6 pb-0 pr-16">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl flex items-center gap-2">
                      {isEditing ? <Edit3 className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5" />}
                      {isEditing ? "Edit Template" : previewTemplate.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {isEditing
                        ? "Customize the subject and body to match your needs"
                        : previewTemplate.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mr-8">
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className={`gap-2 ${isEditing ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                      variant={isEditing ? "outline" : undefined}
                    >
                      {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      {isEditing ? "Preview" : "Edit & Customize"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 space-y-4">
                {/* Template Info */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={getCategoryColor(previewTemplate.category)}>
                    {getCategoryIcon(previewTemplate.category)}
                    <span className="ml-1">{previewTemplate.category}</span>
                  </Badge>
                  <Badge variant="outline">{previewTemplate.industry}</Badge>
                  {!isEditing && (
                    <div className="flex items-center gap-1 text-warning text-sm">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-muted-foreground">{previewTemplate.conversionTip}</span>
                    </div>
                  )}
                  {isEditing && (
                    <Badge variant="secondary" className="gap-1">
                      <Wand2 className="w-3 h-3" />
                      Editing Mode
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <>
                    {/* Editable Subject Line */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Subject Line</Label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Enter your email subject..."
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use placeholders: {"{{first_name}}"}, {"{{business_name}}"}, {"{{website}}"}
                      </p>
                    </div>

                    {/* Editable Body */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email Body</Label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        placeholder="Write your email content..."
                        className="min-h-[350px] max-h-[450px] font-mono text-sm"
                      />
                    </div>

                    {/* Save as New Template */}
                    <div className="p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-medium">Save as New Template</Label>
                      </div>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Enter a name for your template..."
                        className="bg-background"
                      />

                      {/* Folder Selection */}
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Choose a folder (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="flex items-center gap-1">
                                <Folder className="w-3 h-3" /> No Folder
                              </span>
                            </SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <span className="flex items-center gap-1">
                                  {folder.icon} {folder.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Save this customized template to your library for future campaigns
                      </p>
                    </div>
                  </>
                ) : (
                <>
                    {/* User Logo - Display uploaded company logo */}
                    {branding?.logo_url && (
                      <div className="flex justify-center mb-4">
                        <img
                          src={branding.logo_url}
                          alt={branding.company_name || "Company Logo"}
                          className="max-h-16 max-w-[200px] object-contain"
                        />
                      </div>
                    )}

                    {/* Hero Image Preview - Constrained size */}
                    <div className="rounded-lg overflow-hidden border max-w-md mx-auto">
                      <img
                        src={previewTemplate.previewImage}
                        alt={previewTemplate.name}
                        className="w-full h-32 object-cover"
                      />
                    </div>

                    {/* Subject Line Preview */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                      <p className="font-medium text-sm">{editedSubject || previewTemplate.subject}</p>
                    </div>

                    {/* Email Preview - Constrained images */}
                    <ScrollArea className="h-[350px] border rounded-lg">
                      <div
                        className="bg-background p-4 [&_img]:max-w-[200px] [&_img]:h-auto [&_img]:mx-auto [&_img]:block [&_img]:rounded"
                        dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(previewTemplate.body_html || "") }}
                      />
                    </ScrollArea>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="outline" onClick={handleSaveCustomTemplate} className="gap-2">
                        <Check className="w-4 h-4" />
                        Use Now (One-time)
                      </Button>
                      <Button
                        onClick={handleSaveAsNewTemplate}
                        className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        disabled={!newTemplateName.trim()}
                      >
                        <Star className="w-4 h-4" />
                        Save to Library
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => handleCopy(previewTemplate)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy HTML
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Edit Template
                      </Button>
                      {onSelectTemplate && (
                        <Button
                          size="lg"
                          className="gap-2 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground font-semibold px-8"
                          onClick={() => {
                            handleSelect(previewTemplate);
                            closePreview();
                          }}
                        >
                          <Check className="w-5 h-5" />
                          Use This Template
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* STICKY BOTTOM BAR - Clean "Ready to Send" */}
      {highlightedTemplate && onSelectTemplate && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-success to-success/80 border-t border-success/30 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            {/* Template Info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 border-success-foreground/30">
                <img 
                  src={highlightedTemplate.previewImage} 
                  alt={highlightedTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-success-foreground/70 text-xs uppercase tracking-wide">Selected Template</p>
                <p className="text-success-foreground font-semibold truncate">{highlightedTemplate.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHighlightedTemplate(null)}
                className="text-success-foreground/80 hover:text-success-foreground hover:bg-success-foreground/10"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPreview(highlightedTemplate)}
                className="text-success-foreground/80 hover:text-success-foreground hover:bg-success-foreground/10"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  handleSelect(highlightedTemplate);
                  setHighlightedTemplate(null);
                }}
                className="bg-background text-success hover:bg-background/90 font-bold px-8 h-12 text-base shadow-lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Ready to Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
