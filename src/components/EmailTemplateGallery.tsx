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
  Eye,
  CheckCircle2,
  Mail,
  Sparkles,
  ArrowLeft,
  X,
  Gift,
  Calendar,
  Star,
  Rocket,
  Heart,
  Zap,
  Award,
  PartyPopper,
  ShoppingBag,
  Building2,
  Utensils,
  Home,
  Wrench,
} from "lucide-react";
import { EMAIL_TEMPLATE_PRESETS, EmailTemplatePreset } from "@/lib/emailTemplates";

interface EmailTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: EmailTemplatePreset) => void;
  onBack?: () => void;
}

// Visual template designs - each has a unique preview layout
const templateVisuals: Record<string, {
  headerColor: string;
  headerGradient: string;
  accent: string;
  icon: React.ReactNode;
  layout: "hero" | "split" | "minimal" | "announcement" | "newsletter" | "promo";
  heroImage?: string;
}> = {
  "sales-intro": {
    headerColor: "bg-gradient-to-br from-cyan-500 to-blue-600",
    headerGradient: "from-cyan-500/20 to-blue-600/20",
    accent: "text-cyan-400",
    icon: <Rocket className="w-8 h-8" />,
    layout: "hero",
  },
  "sales-follow-up": {
    headerColor: "bg-gradient-to-br from-purple-500 to-pink-500",
    headerGradient: "from-purple-500/20 to-pink-500/20",
    accent: "text-purple-400",
    icon: <RotateCcw className="w-8 h-8" />,
    layout: "minimal",
  },
  "marketing-newsletter": {
    headerColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
    headerGradient: "from-emerald-500/20 to-teal-600/20",
    accent: "text-emerald-400",
    icon: <Mail className="w-8 h-8" />,
    layout: "newsletter",
  },
  "marketing-promo": {
    headerColor: "bg-gradient-to-br from-orange-500 to-red-500",
    headerGradient: "from-orange-500/20 to-red-500/20",
    accent: "text-orange-400",
    icon: <Gift className="w-8 h-8" />,
    layout: "promo",
  },
  "recruiting-outreach": {
    headerColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
    headerGradient: "from-blue-500/20 to-indigo-600/20",
    accent: "text-blue-400",
    icon: <Users className="w-8 h-8" />,
    layout: "split",
  },
  "networking-intro": {
    headerColor: "bg-gradient-to-br from-amber-500 to-orange-500",
    headerGradient: "from-amber-500/20 to-orange-500/20",
    accent: "text-amber-400",
    icon: <Network className="w-8 h-8" />,
    layout: "minimal",
  },
  "event-invite": {
    headerColor: "bg-gradient-to-br from-pink-500 to-rose-600",
    headerGradient: "from-pink-500/20 to-rose-600/20",
    accent: "text-pink-400",
    icon: <Calendar className="w-8 h-8" />,
    layout: "announcement",
  },
  "thank-you": {
    headerColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    headerGradient: "from-green-500/20 to-emerald-600/20",
    accent: "text-green-400",
    icon: <Heart className="w-8 h-8" />,
    layout: "minimal",
  },
};

// Industry-specific visuals
const industryVisuals: Record<string, { icon: React.ReactNode; color: string }> = {
  "restaurant": { icon: <Utensils className="w-4 h-4" />, color: "text-orange-400" },
  "real-estate": { icon: <Home className="w-4 h-4" />, color: "text-blue-400" },
  "retail": { icon: <ShoppingBag className="w-4 h-4" />, color: "text-pink-400" },
  "services": { icon: <Wrench className="w-4 h-4" />, color: "text-amber-400" },
  "corporate": { icon: <Building2 className="w-4 h-4" />, color: "text-slate-400" },
};

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

// Visual Email Template Preview Component
function TemplatePreviewCard({ template, layout, headerGradient, accent, icon }: {
  template: EmailTemplatePreset;
  layout: "hero" | "split" | "minimal" | "announcement" | "newsletter" | "promo";
  headerGradient: string;
  accent: string;
  icon: React.ReactNode;
}) {
  const renderLayout = () => {
    switch (layout) {
      case "hero":
        return (
          <div className="h-full flex flex-col">
            {/* Hero banner */}
            <div className={`h-16 bg-gradient-to-r ${headerGradient} flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
              <div className={`${accent} drop-shadow-lg`}>{icon}</div>
            </div>
            {/* Content preview */}
            <div className="flex-1 bg-white/5 p-3">
              <div className="h-2.5 w-3/4 bg-foreground/20 rounded mb-2" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1.5" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1.5" />
              <div className="h-2 w-2/3 bg-foreground/10 rounded mb-3" />
              <div className={`h-6 w-24 ${accent.replace('text-', 'bg-')}/30 rounded-md`} />
            </div>
          </div>
        );
      
      case "split":
        return (
          <div className="h-full flex">
            {/* Left image area */}
            <div className={`w-2/5 bg-gradient-to-br ${headerGradient} flex items-center justify-center`}>
              <div className={`${accent} opacity-60`}>{icon}</div>
            </div>
            {/* Right content */}
            <div className="flex-1 bg-white/5 p-3 flex flex-col justify-center">
              <div className="h-2.5 w-3/4 bg-foreground/20 rounded mb-2" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1" />
              <div className="h-2 w-1/2 bg-foreground/10 rounded" />
            </div>
          </div>
        );
      
      case "newsletter":
        return (
          <div className="h-full flex flex-col">
            {/* Header with logo */}
            <div className={`h-10 bg-gradient-to-r ${headerGradient} flex items-center px-3 gap-2`}>
              <div className={`w-5 h-5 rounded ${accent.replace('text-', 'bg-')}/40`} />
              <div className="h-2 w-16 bg-white/30 rounded" />
            </div>
            {/* Content grid */}
            <div className="flex-1 bg-white/5 p-2 grid grid-cols-2 gap-2">
              <div className="bg-foreground/5 rounded p-1.5">
                <div className={`h-8 bg-gradient-to-br ${headerGradient} rounded mb-1.5`} />
                <div className="h-1.5 w-full bg-foreground/10 rounded mb-1" />
                <div className="h-1.5 w-3/4 bg-foreground/10 rounded" />
              </div>
              <div className="bg-foreground/5 rounded p-1.5">
                <div className={`h-8 bg-gradient-to-br ${headerGradient} rounded mb-1.5`} />
                <div className="h-1.5 w-full bg-foreground/10 rounded mb-1" />
                <div className="h-1.5 w-3/4 bg-foreground/10 rounded" />
              </div>
            </div>
          </div>
        );
      
      case "promo":
        return (
          <div className="h-full flex flex-col relative overflow-hidden">
            {/* Promo banner */}
            <div className={`h-20 bg-gradient-to-r ${headerGradient} flex flex-col items-center justify-center relative`}>
              <div className="absolute top-1 right-1">
                <PartyPopper className={`w-4 h-4 ${accent}`} />
              </div>
              <div className={`${accent} mb-1`}>{icon}</div>
              <div className="text-[10px] font-bold text-foreground/60">SPECIAL OFFER</div>
              <div className="flex items-center gap-1 mt-1">
                <Star className={`w-3 h-3 ${accent}`} />
                <Star className={`w-3 h-3 ${accent}`} />
                <Star className={`w-3 h-3 ${accent}`} />
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 bg-white/5 p-3 flex flex-col items-center">
              <div className="h-2 w-3/4 bg-foreground/15 rounded mb-2" />
              <div className={`h-7 w-28 ${accent.replace('text-', 'bg-')}/30 rounded-full flex items-center justify-center`}>
                <Zap className={`w-3 h-3 ${accent}`} />
              </div>
            </div>
          </div>
        );
      
      case "announcement":
        return (
          <div className="h-full flex flex-col">
            {/* Announcement header */}
            <div className={`h-12 bg-gradient-to-r ${headerGradient} flex items-center justify-center gap-2`}>
              <Award className={`w-5 h-5 ${accent}`} />
              <div className="h-2.5 w-20 bg-white/30 rounded" />
            </div>
            {/* Main content */}
            <div className="flex-1 bg-white/5 p-3 flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${headerGradient} flex items-center justify-center mb-2`}>
                {icon}
              </div>
              <div className="h-2 w-24 bg-foreground/15 rounded mb-1.5" />
              <div className="h-1.5 w-32 bg-foreground/10 rounded mb-1" />
              <div className="h-1.5 w-28 bg-foreground/10 rounded" />
            </div>
          </div>
        );
      
      default: // minimal
        return (
          <div className="h-full flex flex-col">
            {/* Simple header */}
            <div className={`h-8 bg-gradient-to-r ${headerGradient} flex items-center px-3`}>
              <div className={`w-4 h-4 rounded ${accent.replace('text-', 'bg-')}/40 mr-2`} />
              <div className="h-1.5 w-16 bg-white/30 rounded" />
            </div>
            {/* Clean content */}
            <div className="flex-1 bg-white/5 p-3">
              <div className="h-2.5 w-1/2 bg-foreground/20 rounded mb-3" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1.5" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1.5" />
              <div className="h-2 w-full bg-foreground/10 rounded mb-1.5" />
              <div className="h-2 w-3/4 bg-foreground/10 rounded mb-3" />
              <div className="h-2 w-20 bg-foreground/15 rounded" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-36 rounded-t-lg overflow-hidden border-b border-border/50">
      {renderLayout()}
    </div>
  );
}

// Get visual config for template based on its properties
function getTemplateVisual(template: EmailTemplatePreset) {
  // Check if we have a specific visual for this template ID
  const specificVisual = templateVisuals[template.id];
  if (specificVisual) return specificVisual;

  // Generate visual based on category and tags
  const layouts: Array<"hero" | "split" | "minimal" | "announcement" | "newsletter" | "promo"> = 
    ["hero", "split", "minimal", "announcement", "newsletter", "promo"];
  
  const gradients = [
    { header: "from-cyan-500/20 to-blue-600/20", accent: "text-cyan-400" },
    { header: "from-purple-500/20 to-pink-500/20", accent: "text-purple-400" },
    { header: "from-emerald-500/20 to-teal-600/20", accent: "text-emerald-400" },
    { header: "from-orange-500/20 to-red-500/20", accent: "text-orange-400" },
    { header: "from-blue-500/20 to-indigo-600/20", accent: "text-blue-400" },
    { header: "from-amber-500/20 to-orange-500/20", accent: "text-amber-400" },
    { header: "from-pink-500/20 to-rose-600/20", accent: "text-pink-400" },
    { header: "from-green-500/20 to-emerald-600/20", accent: "text-green-400" },
  ];

  const icons = [
    <Rocket className="w-8 h-8" />,
    <Mail className="w-8 h-8" />,
    <TrendingUp className="w-8 h-8" />,
    <Gift className="w-8 h-8" />,
    <Users className="w-8 h-8" />,
    <Star className="w-8 h-8" />,
    <Zap className="w-8 h-8" />,
    <Heart className="w-8 h-8" />,
  ];

  // Use template ID to consistently pick visuals
  const hash = template.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientIndex = hash % gradients.length;
  const layoutIndex = (hash * 3) % layouts.length;
  const iconIndex = (hash * 7) % icons.length;

  return {
    headerColor: "",
    headerGradient: gradients[gradientIndex].header,
    accent: gradients[gradientIndex].accent,
    icon: icons[iconIndex],
    layout: layouts[layoutIndex],
  };
}

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
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    Email Template Gallery
                  </DialogTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    Choose from {EMAIL_TEMPLATE_PRESETS.length} professionally designed templates
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, industry, or keyword..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredTemplates.map((template) => {
              const visual = getTemplateVisual(template);
              const industryInfo = template.industry ? industryVisuals[template.industry.toLowerCase()] : null;

              return (
                <div
                  key={template.id}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Visual Template Preview */}
                  <TemplatePreviewCard
                    template={template}
                    layout={visual.layout}
                    headerGradient={visual.headerGradient}
                    accent={visual.accent}
                    icon={visual.icon}
                  />

                  {/* Industry badge overlay */}
                  {template.industry && industryInfo && (
                    <Badge
                      className={`absolute top-2 right-2 ${industryInfo.color} bg-background/90 backdrop-blur-sm border-current/20`}
                      variant="outline"
                    >
                      {industryInfo.icon}
                      <span className="ml-1 text-xs">{template.industry}</span>
                    </Badge>
                  )}

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
                      {template.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          +{template.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1 h-8 text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
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
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
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
                  {/* Visual Preview */}
                  <div className="rounded-xl overflow-hidden border border-border">
                    <div className="h-48">
                      {(() => {
                        const visual = getTemplateVisual(previewTemplate);
                        return (
                          <TemplatePreviewCard
                            template={previewTemplate}
                            layout={visual.layout}
                            headerGradient={visual.headerGradient}
                            accent={visual.accent}
                            icon={visual.icon}
                          />
                        );
                      })()}
                    </div>
                  </div>

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
                        <Badge key={token} variant="secondary" className="text-xs font-mono">
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
