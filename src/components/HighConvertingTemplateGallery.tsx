import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wand2
} from "lucide-react";
import { HIGH_CONVERTING_TEMPLATES, TEMPLATE_CATEGORIES, EmailTemplate } from "@/lib/highConvertingTemplates";
import { toast } from "sonner";

interface HighConvertingTemplateGalleryProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
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
  // Use semantic design tokens (no hard-coded palette colors)
  switch (category) {
    case 'web-design':
      return 'bg-primary/15 text-primary border-primary/30';
    case 'local-services':
      return 'bg-accent/15 text-accent border-accent/30';
    case 'b2b':
      return 'bg-secondary/60 text-secondary-foreground border-border';
    case 'general':
      return 'bg-muted/60 text-muted-foreground border-border';
    case 'follow-up':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'promotional':
      return 'bg-success/15 text-success border-success/30';
    default:
      return 'bg-muted/60 text-muted-foreground border-border';
  }
};

export default function HighConvertingTemplateGallery({ 
  onSelectTemplate, 
  selectedTemplateId 
}: HighConvertingTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const filteredTemplates = HIGH_CONVERTING_TEMPLATES.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
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
    setIsEditing(true);
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

  const openPreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setEditedSubject(template.subject);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template.body_html;
    setEditedBody(tempDiv.textContent || tempDiv.innerText || '');
    setIsEditing(false);
  };

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
              {HIGH_CONVERTING_TEMPLATES.length} high-converting templates across {TEMPLATE_CATEGORIES.length - 1} categories
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

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
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

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${
              selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setPreviewTemplate(template)}
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
                {template.industry}
              </Badge>

              {/* Selected Indicator */}
              {selectedTemplateId === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1 text-xs h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                {onSelectTemplate && (
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(template);
                    }}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="p-3">
              <h3 className="font-medium text-sm truncate">{template.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {template.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No templates found matching your search.</p>
        </div>
      )}

      {/* Preview/Edit Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => { setPreviewTemplate(null); setIsEditing(false); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {isEditing ? <Edit3 className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5" />}
                  {isEditing ? 'Edit Template' : previewTemplate?.name}
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {isEditing ? 'Customize the subject and body to match your needs' : previewTemplate?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Preview' : 'Edit & Customize'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => { setPreviewTemplate(null); setIsEditing(false); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="p-6 pt-4 space-y-4">
              {/* Template Info */}
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={getCategoryColor(previewTemplate.category)}>
                  {getCategoryIcon(previewTemplate.category)}
                  <span className="ml-1">{previewTemplate.category}</span>
                </Badge>
                <Badge variant="outline">{previewTemplate.industry}</Badge>
                {!isEditing && (
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
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
                      Use placeholders: {'{{first_name}}'}, {'{{business_name}}'}, {'{{website}}'}
                    </p>
                  </div>

                  {/* Editable Body */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Body</Label>
                    <Textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      placeholder="Write your email content..."
                      className="min-h-[350px] font-mono text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Subject Line Preview */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                    <p className="font-medium">{editedSubject || previewTemplate.subject}</p>
                  </div>

                  {/* Email Preview */}
                  <ScrollArea className="h-[400px] border rounded-lg">
                    <div 
                      className="bg-background p-4"
                      dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }}
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
                    <Button onClick={handleSaveCustomTemplate} className="gap-2 bg-gradient-to-r from-primary to-purple-600">
                      <Save className="w-4 h-4" />
                      Save & Use Custom Template
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
                      <Button onClick={() => {
                        handleSelect(previewTemplate);
                        setPreviewTemplate(null);
                      }}>
                        <Check className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
