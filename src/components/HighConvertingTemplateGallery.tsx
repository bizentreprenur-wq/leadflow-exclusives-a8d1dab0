import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  X
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
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'web-design': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    case 'local-services': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'b2b': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'general': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'follow-up': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function HighConvertingTemplateGallery({ 
  onSelectTemplate, 
  selectedTemplateId 
}: HighConvertingTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

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
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
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

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{previewTemplate?.name}</DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">{previewTemplate?.description}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setPreviewTemplate(null)}
              >
                <X className="w-4 h-4" />
              </Button>
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
                <div className="flex items-center gap-1 text-amber-500 text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-muted-foreground">{previewTemplate.conversionTip}</span>
                </div>
              </div>

              {/* Subject Line Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Subject Line</p>
                <p className="font-medium">{previewTemplate.subject}</p>
              </div>

              {/* Email Preview */}
              <ScrollArea className="h-[400px] border rounded-lg">
                <div 
                  className="bg-[#0a0a0a] p-4"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }}
                />
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => handleCopy(previewTemplate)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy HTML
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
