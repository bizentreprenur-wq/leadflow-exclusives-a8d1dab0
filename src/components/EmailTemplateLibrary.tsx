import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Copy,
  Eye,
  TrendingUp,
  Megaphone,
  Users,
  Network,
  RotateCcw,
  Handshake,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  EMAIL_TEMPLATE_PRESETS,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  searchTemplates,
  type EmailTemplatePreset,
} from '@/lib/emailTemplates';

interface EmailTemplateLibraryProps {
  onUseTemplate?: (template: EmailTemplatePreset) => void;
}

export default function EmailTemplateLibrary({ onUseTemplate }: EmailTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplatePreset | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales':
        return <TrendingUp className="w-4 h-4" />;
      case 'marketing':
        return <Megaphone className="w-4 h-4" />;
      case 'recruiting':
        return <Users className="w-4 h-4" />;
      case 'networking':
        return <Network className="w-4 h-4" />;
      case 'follow-up':
        return <RotateCcw className="w-4 h-4" />;
      case 'introduction':
        return <Handshake className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'marketing':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'recruiting':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'networking':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'follow-up':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'introduction':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTemplates =
    searchQuery.trim()
      ? searchTemplates(searchQuery)
      : activeCategory === 'all'
      ? EMAIL_TEMPLATE_PRESETS
      : getTemplatesByCategory(activeCategory);

  const handleCopyTemplate = (template: EmailTemplatePreset) => {
    navigator.clipboard.writeText(template.body_text);
    toast.success('Template copied to clipboard');
  };

  const handleUseTemplate = (template: EmailTemplatePreset) => {
    if (onUseTemplate) {
      onUseTemplate(template);
      toast.success('Template loaded');
    } else {
      handleCopyTemplate(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Email Templates
          </h2>
          <p className="text-muted-foreground">
            Pre-built templates for every outreach scenario
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            All
          </TabsTrigger>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
              {getCategoryIcon(cat.id)}
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group hover:shadow-card transition-shadow cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {getCategoryIcon(template.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      <span className="font-medium">Subject:</span> {template.subject}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate && getCategoryIcon(previewTemplate.category)}
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-4 p-1">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Subject Line
                </p>
                <p className="text-foreground bg-muted/50 p-3 rounded-md text-sm">
                  {previewTemplate?.subject}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Email Body
                </p>
                <div
                  className="bg-muted/50 p-4 rounded-md text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate?.body_html || '',
                  }}
                />
              </div>

              {previewTemplate?.industry && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Industry
                  </p>
                  <Badge variant="outline">{previewTemplate.industry}</Badge>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {previewTemplate?.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => previewTemplate && handleCopyTemplate(previewTemplate)}
            >
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                if (previewTemplate) {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
