import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  MoveRight
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
  
  // Custom templates and folders from localStorage
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
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
    
    const customTemplate: EmailTemplate = {
      ...previewTemplate,
      id: `custom-${Date.now()}`,
      name: `Custom: ${previewTemplate.name}`,
      subject: editedSubject,
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${editedBody.split('\n').map(p => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${p}</p>`).join('')}
      </div>`,
    };
    
    onSelectTemplate?.(customTemplate);
    setPreviewTemplate(null);
    setIsEditing(false);
    toast.success('Custom template saved and selected!');
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

                {/* Action Buttons on Hover */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(template);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview & Edit
                  </Button>
                  {onSelectTemplate && (
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(template);
                        setHighlightedTemplate(template);
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
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
              className="relative z-[1001] w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg bg-background text-foreground border border-primary/40 shadow-elevated ring-1 ring-primary/20"
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
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="gap-2"
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
                        className="min-h-[250px] font-mono text-sm"
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
                    {/* Hero Image Preview - Same as card thumbnail */}
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={previewTemplate.previewImage}
                        alt={previewTemplate.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    {/* Subject Line Preview */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                      <p className="font-medium">{editedSubject || previewTemplate.subject}</p>
                    </div>

                    {/* Email Preview */}
                    <ScrollArea className="h-[350px] border rounded-lg">
                      <div
                        className="bg-background p-4"
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
