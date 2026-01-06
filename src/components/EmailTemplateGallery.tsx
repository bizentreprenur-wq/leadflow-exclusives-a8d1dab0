import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  TrendingUp,
  Megaphone,
  Users,
  Network,
  RotateCcw,
  Briefcase,
  Star,
  Eye,
  CheckCircle2,
  Mail,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";
import { EMAIL_TEMPLATE_PRESETS, EmailTemplatePreset } from "@/lib/emailTemplates";

interface EmailTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: EmailTemplatePreset) => void;
  onBack?: () => void;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bgGradient: string }> = {
  sales: {
    icon: <TrendingUp className="w-5 h-5" />,
    color: "text-success",
    bgGradient: "from-success/20 to-success/5",
  },
  marketing: {
    icon: <Megaphone className="w-5 h-5" />,
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary/5",
  },
  recruiting: {
    icon: <Users className="w-5 h-5" />,
    color: "text-accent",
    bgGradient: "from-accent/20 to-accent/5",
  },
  networking: {
    icon: <Network className="w-5 h-5" />,
    color: "text-warning",
    bgGradient: "from-warning/20 to-warning/5",
  },
  "follow-up": {
    icon: <RotateCcw className="w-5 h-5" />,
    color: "text-muted-foreground",
    bgGradient: "from-muted/40 to-muted/10",
  },
  introduction: {
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary/5",
  },
};

const categories = [
  { id: "all", name: "All Templates", count: EMAIL_TEMPLATE_PRESETS.length },
  { id: "sales", name: "Sales", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "sales").length },
  { id: "marketing", name: "Marketing", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "marketing").length },
  { id: "follow-up", name: "Follow-up", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "follow-up").length },
  { id: "recruiting", name: "Recruiting", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "recruiting").length },
  { id: "networking", name: "Networking", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "networking").length },
  { id: "introduction", name: "Introduction", count: EMAIL_TEMPLATE_PRESETS.filter(t => t.category === "introduction").length },
];

export default function EmailTemplateGallery({
  open,
  onOpenChange,
  onSelectTemplate,
  onBack,
}: EmailTemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplatePreset | null>(null);

  const filteredTemplates = EMAIL_TEMPLATE_PRESETS.filter((template) => {
    const matchesSearch =
      search === "" ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = activeCategory === "all" || template.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: EmailTemplatePreset) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onBack && (
                  <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6 text-primary" />
                    Email Template Gallery
                  </DialogTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    Choose from {EMAIL_TEMPLATE_PRESETS.length} professionally crafted templates
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 text-foreground hover:bg-secondary"
                }`}
              >
                {cat.id !== "all" && categoryConfig[cat.id]?.icon}
                {cat.name}
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    activeCategory === cat.id
                      ? "border-primary-foreground/30 text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredTemplates.map((template) => {
              const config = categoryConfig[template.category] || categoryConfig.sales;

              return (
                <div
                  key={template.id}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  {/* Template Preview Header */}
                  <div className={`h-32 bg-gradient-to-br ${config.bgGradient} p-4 relative overflow-hidden`}>
                    {/* Decorative email icon */}
                    <div className="absolute right-3 top-3 opacity-20">
                      <Mail className="w-16 h-16" />
                    </div>
                    
                    {/* Category badge */}
                    <Badge
                      variant="outline"
                      className={`${config.color} border-current/30 bg-background/80 backdrop-blur-sm`}
                    >
                      {config.icon}
                      <span className="ml-1.5 capitalize">{template.category}</span>
                    </Badge>

                    {/* Template preview lines */}
                    <div className="mt-4 space-y-2">
                      <div className="h-2 w-3/4 bg-foreground/10 rounded" />
                      <div className="h-2 w-full bg-foreground/10 rounded" />
                      <div className="h-2 w-2/3 bg-foreground/10 rounded" />
                    </div>

                    {/* Industry badge */}
                    {template.industry && (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-3 right-3 text-xs"
                      >
                        {template.industry}
                      </Badge>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs text-muted-foreground border-border"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Use
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No templates found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Template Preview Modal */}
        {previewTemplate && (
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader className="shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{previewTemplate.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{previewTemplate.description}</p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {/* Subject */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">SUBJECT LINE</p>
                    <p className="font-medium text-foreground">{previewTemplate.subject}</p>
                  </div>

                  {/* Email Preview */}
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">EMAIL BODY</span>
                    </div>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }}
                    />
                  </div>

                  {/* Personalization Tokens */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Personalization Tokens</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      These will be automatically replaced with lead data
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["{{business_name}}", "{{first_name}}", "{{email}}", "{{sender_name}}"].map((token) => (
                        <Badge key={token} variant="secondary" className="text-xs">
                          {token}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-3 pt-4 shrink-0 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
