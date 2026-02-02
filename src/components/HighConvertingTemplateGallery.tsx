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
  Image as ImageIcon,
  Bot,
  Type,
  Palette
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
import TemplateAIAssistant from "./TemplateAIAssistant";
import AIEmailTemplateBuilder from "./AIEmailTemplateBuilder";
import VisualTemplateEditor from "./VisualTemplateEditor";

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
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [uploadTemplateName, setUploadTemplateName] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadBody, setUploadBody] = useState('');
  const [uploadIndustry, setUploadIndustry] = useState('');
  const [uploadLogoLocal, setUploadLogoLocal] = useState<string | null>(null);
  const uploadLogoRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const uploadBodyRef = useRef<HTMLTextAreaElement>(null);
  const htmlFileRef = useRef<HTMLInputElement>(null);
  
  // Content mode: 'text' (plain text), 'html' (full HTML upload), 'visual' (rich editor)
  const [contentMode, setContentMode] = useState<'text' | 'html'>('text');
  const [uploadedHtml, setUploadedHtml] = useState('');
  
  // Inline images storage - maps placeholder to base64
  const [inlineImages, setInlineImages] = useState<Record<string, string>>({});
  const [inlineImageCounter, setInlineImageCounter] = useState(1);
  
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
  const [selectedFolderId, setSelectedFolderId] = useState<string>("none");
  
  // Visual template editor state
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [visualEditorTemplate, setVisualEditorTemplate] = useState<EmailTemplate | null>(null);

  // Handle inline image upload - inserts at cursor position
  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const base64 = reader.result as string;
      const placeholder = `[IMAGE_${inlineImageCounter}]`;
      
      // Store the image
      setInlineImages(prev => ({ ...prev, [placeholder]: base64 }));
      setInlineImageCounter(prev => prev + 1);
      
      // Insert placeholder at cursor position
      const textarea = uploadBodyRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const newBody = uploadBody.slice(0, start) + `\n${placeholder}\n` + uploadBody.slice(end);
        setUploadBody(newBody);
        
        // Set cursor after placeholder
        setTimeout(() => {
          textarea.focus();
          const newPos = start + placeholder.length + 2;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        // Append to end if no cursor position
        setUploadBody(prev => prev + `\n${placeholder}\n`);
      }
      
      toast.success(`Image added! Placeholder: ${placeholder}`);
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Remove an inline image
  const handleRemoveInlineImage = (placeholder: string) => {
    setInlineImages(prev => {
      const updated = { ...prev };
      delete updated[placeholder];
      return updated;
    });
    setUploadBody(prev => prev.replace(placeholder, '').replace(/\n\n+/g, '\n\n').trim());
    toast.success('Image removed');
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

  // Handle HTML file upload
  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Accept .html, .htm, or text files
    if (!file.name.match(/\.(html?|txt)$/i) && !file.type.match(/^text\//)) {
      toast.error('Please upload an HTML or text file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setUploadedHtml(content);
      setContentMode('html');
      toast.success(`📄 HTML template loaded: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle saving uploaded template - now with inline images AND full HTML support
  const handleSaveUploadedTemplate = () => {
    if (!uploadTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!uploadSubject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }
    
    let htmlBody = '';
    
    if (contentMode === 'html' && uploadedHtml.trim()) {
      // Use the uploaded HTML directly
      htmlBody = uploadedHtml.trim();
    } else if (uploadBody.trim()) {
      // Build HTML body from text with inline images
      htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">`;
      
      // Process body text and replace image placeholders with actual images
      const bodyParts = uploadBody.split('\n');
      for (const part of bodyParts) {
        const trimmed = part.trim();
        if (trimmed.match(/^\[IMAGE_\d+\]$/)) {
          // This is an image placeholder
          const imgSrc = inlineImages[trimmed];
          if (imgSrc) {
            htmlBody += `<div style="text-align: center; margin: 15px 0;">
              <img src="${imgSrc}" alt="Email image" style="max-width: 100%; height: auto; border-radius: 8px;" />
            </div>`;
          }
        } else if (trimmed) {
          htmlBody += `<p style="margin: 0 0 15px 0; line-height: 1.6;">${trimmed}</p>`;
        }
      }
      
      htmlBody += `</div>`;
    } else {
      toast.error('Please enter email body content or upload an HTML template');
      return;
    }
    
    // Get first image for preview, or use default
    const firstImageKey = Object.keys(inlineImages)[0];
    const previewImage = firstImageKey ? inlineImages[firstImageKey] : 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&h=300&fit=crop';
    
    const newTemplate = saveCustomTemplate({
      id: '',
      name: uploadTemplateName.trim(),
      category: 'general',
      industry: uploadIndustry.trim() || 'General',
      subject: uploadSubject.trim(),
      body_html: htmlBody,
      description: contentMode === 'html' ? 'Uploaded HTML template' : 'Custom template',
      previewImage: previewImage,
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
    setUploadedHtml('');
    setContentMode('text');
    setInlineImages({});
    setInlineImageCounter(1);
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
    const normalizedSearch = searchQuery.toLowerCase().trim();
    const tags = Array.isArray((template as { tags?: string[] }).tags)
      ? (template as { tags?: string[] }).tags
      : [];
    const name = (template.name ?? '').toLowerCase();
    const subject = (template.subject ?? '').toLowerCase();
    const industry = (template.industry ?? '').toLowerCase();
    const description = (template.description ?? '').toLowerCase();
    const matchesSearch = 
      name.includes(normalizedSearch) ||
      subject.includes(normalizedSearch) ||
      industry.includes(normalizedSearch) ||
      description.includes(normalizedSearch) ||
      tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
    
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

  const getNormalizedFolderId = (folderId: string) =>
    folderId === "none" || !folderId.trim() ? undefined : folderId;

  const handleCopy = async (template: EmailTemplate) => {
    try {
      await navigator.clipboard.writeText(template.body_html);
      toast.success("Template HTML copied!");
    } catch {
      toast.error("Clipboard access failed. Please copy manually from preview.");
    }
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
    const folderId = 'isCustom' in template ? (template as CustomTemplate).folderId : undefined;
    setSelectedFolderId(folderId ? folderId : 'none');
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
      folderId: getNormalizedFolderId(selectedFolderId),
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
      folderId: getNormalizedFolderId(selectedFolderId),
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
    setNewTemplateName(`My ${template.name}`);
    const folderId = 'isCustom' in template ? (template as CustomTemplate).folderId : undefined;
    setSelectedFolderId(folderId ? folderId : 'none');
    setIsEditing(false);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setIsEditing(false);
    setSelectedFolderId('none');
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

      {/* ═══════════════ CUSTOM TEMPLATES SECTION DIVIDER ═══════════════ */}
      <div className="relative my-10">
        {/* Decorative line */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-primary/30"></div>
        </div>
        
        {/* Big Custom Templates Headline */}
        <div className="relative flex justify-center">
          <div className="bg-background px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Custom Templates
                </h2>
                <p className="text-xs text-muted-foreground">Create your own or let AI build one for you</p>
              </div>
              <Badge variant="outline" className="ml-2 border-primary/50 text-primary bg-primary/10">
                <Plus className="w-3 h-3 mr-1" />
                Build Your Own
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* AI Template Builder Section - UNDER the Email Template Gallery */}
      <Card className="border-2 border-dashed border-violet-500/40 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <CardContent className="p-4">
          {!showAIBuilder ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    Build your own Email Template with AI
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/40 text-xs">AI Powered</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create stunning email templates with AI-generated content and hero images
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAIBuilder(true)}
                className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Wand2 className="w-4 h-4" />
                Start Building
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Build your own Email Template with AI
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAIBuilder(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <AIEmailTemplateBuilder
                onSaveTemplate={(template) => {
                  const paragraphHtml = template.body
                    .split('\n')
                    .map((p) => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`)
                    .join('');

                  const newTemplate = saveCustomTemplate({
                    id: '',
                    name: 'AI-Built Template',
                    category: 'general',
                    industry: 'AI Generated',
                    subject: template.subject,
                    body_html: template.heroImage
                      ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><img src="${template.heroImage}" alt="Hero" style="width:100%;max-width:600px;height:auto;margin-bottom:20px;border-radius:8px;" />${paragraphHtml}</div>`
                      : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${paragraphHtml}</div>`,
                    description: 'AI-generated custom template',
                    previewImage:
                      template.heroImage ||
                      'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&h=300&fit=crop',
                    conversionTip: 'Personalize with recipient details for better engagement',
                    openRate: 0,
                    replyRate: 0,
                    folderId: undefined,
                  });

                  setCustomTemplates(getCustomTemplates());
                  onSelectTemplate?.(newTemplate);
                  setHighlightedTemplate(newTemplate);
                  setShowAIBuilder(false);
                  toast.success('🎉 AI Template created and selected!');
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Your Own Template Section - BELOW the AI Builder */}
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
              <Button onClick={() => setShowUploadSection(true)} className="gap-2">
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
                <Button variant="ghost" size="sm" onClick={() => setShowUploadSection(false)}>
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

              {/* Content Mode Tabs */}
              <div className="space-y-3">
                <Label>Email Content *</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={contentMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentMode('text')}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Write Text
                  </Button>
                  <Button
                    type="button"
                    variant={contentMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => htmlFileRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload HTML File
                  </Button>
                  <input
                    ref={htmlFileRef}
                    type="file"
                    accept=".html,.htm,.txt,text/html,text/plain"
                    className="hidden"
                    onChange={handleHtmlFileUpload}
                  />
                </div>

                {/* Text Mode - Write with inline images */}
                {contentMode === 'text' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column - Text Editor */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Write your email and insert images anywhere</p>
                        <div className="flex items-center gap-2">
                          <input
                            ref={inlineImageRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleInlineImageUpload}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inlineImageRef.current?.click()}
                            className="gap-1.5 text-xs"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Insert Image
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        ref={uploadBodyRef}
                        id="upload-body"
                        value={uploadBody}
                        onChange={(e) => setUploadBody(e.target.value)}
                        placeholder={`Hi {{first_name}},

I noticed your business {{business_name}} and wanted to reach out...

[Click "Insert Image" to add images anywhere in your email]

Looking forward to connecting!

Best regards,
[Your Name]`}
                        className="min-h-[280px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use placeholders: {"{{first_name}}"}, {"{{business_name}}"}, {"{{website}}"}
                      </p>

                      {/* Inline Images Preview */}
                      {Object.keys(inlineImages).length > 0 && (
                        <div className="space-y-2">
                          <Label>Inserted Images</Label>
                          <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/30 border">
                            {Object.entries(inlineImages).map(([placeholder, src]) => (
                              <div key={placeholder} className="relative group">
                                <img
                                  src={src}
                                  alt={placeholder}
                                  className="h-16 w-24 object-cover rounded-lg border shadow-sm"
                                />
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="w-6 h-6"
                                    onClick={() => handleRemoveInlineImage(placeholder)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-background/70 text-foreground py-0.5 rounded-b-lg">
                                  {placeholder}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - AI Assistant */}
                    <div>
                      <TemplateAIAssistant
                        industry={uploadIndustry || 'local business'}
                        onApplySubject={(subject) => setUploadSubject(subject)}
                        onApplyBody={(body) => setUploadBody(body)}
                        currentSubject={uploadSubject}
                      />
                    </div>
                  </div>
                )}

                {/* HTML Mode - Show uploaded HTML preview */}
                {contentMode === 'html' && (
                  <div className="space-y-3">
                    {uploadedHtml ? (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                          <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-success" />
                            <div>
                              <p className="text-sm font-medium text-success">✓ HTML Template Loaded</p>
                              <p className="text-xs text-muted-foreground">{uploadedHtml.length.toLocaleString()} characters</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedHtml('');
                              setContentMode('text');
                            }}
                            className="gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        </div>

                        {/* HTML Preview */}
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="max-h-[300px] overflow-auto rounded-lg border bg-background p-4">
                            <div
                              dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(uploadedHtml) }}
                              className="prose prose-sm max-w-none"
                            />
                          </div>
                        </div>

                        {/* Raw HTML Editor */}
                        <div className="space-y-2">
                          <Label>Edit HTML (optional)</Label>
                          <Textarea
                            value={uploadedHtml}
                            onChange={(e) => setUploadedHtml(e.target.value)}
                            className="min-h-[150px] font-mono text-xs"
                            placeholder="Your HTML content..."
                          />
                        </div>
                      </>
                    ) : (
                      <div
                        className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        onClick={() => htmlFileRef.current?.click()}
                      >
                        <Upload className="w-12 h-12 mx-auto text-primary/60 mb-3" />
                        <p className="font-medium">Click to upload an HTML template</p>
                        <p className="text-sm text-muted-foreground mt-1">Supports .html, .htm, or .txt files up to 5MB</p>
                      </div>
                    )}
                  </div>
                )}
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
                    setUploadedHtml('');
                    setContentMode('text');
                    setInlineImages({});
                    setInlineImageCounter(1);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUploadedTemplate}
                  className="gap-2"
                  disabled={
                    !uploadTemplateName.trim() ||
                    !uploadSubject.trim() ||
                    (contentMode === 'text' && !uploadBody.trim()) ||
                    (contentMode === 'html' && !uploadedHtml.trim())
                  }
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                    {/* Quick Edit toggle for basic editing */}
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      className="gap-2"
                    >
                      {isEditing ? <Eye className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                      {isEditing ? "Preview" : "Quick Edit"}
                    </Button>
                    {/* Visual Editor for full customization */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setVisualEditorTemplate(previewTemplate);
                        setShowVisualEditor(true);
                        closePreview();
                      }}
                      className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                    >
                      <Palette className="w-4 h-4" />
                      Visual Editor
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
                        <Type className="w-4 h-4" />
                        Quick Edit
                      </Button>
                      <Button 
                        onClick={() => {
                          setVisualEditorTemplate(previewTemplate);
                          setShowVisualEditor(true);
                          closePreview();
                        }} 
                        className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                      >
                        <Palette className="w-4 h-4" />
                        Visual Editor
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

      {/* Visual Template Editor Modal */}
      {visualEditorTemplate && (
        <VisualTemplateEditor
          open={showVisualEditor}
          onOpenChange={(open) => {
            setShowVisualEditor(open);
            if (!open) setVisualEditorTemplate(null);
          }}
          template={visualEditorTemplate}
          onSave={(updated) => {
            // Update highlighted template with edits
            setHighlightedTemplate(updated);
          }}
          onSelect={(updated) => {
            handleSelect(updated);
            setHighlightedTemplate(updated);
            setShowVisualEditor(false);
            setVisualEditorTemplate(null);
          }}
        />
      )}
    </div>
  );
}
