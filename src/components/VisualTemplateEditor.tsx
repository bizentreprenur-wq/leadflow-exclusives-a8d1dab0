import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, Type, Hash, Image, Save, Eye, Edit3, 
  RotateCcw, Check, X, Sparkles, Wand2, Copy,
  ChevronDown, ChevronUp, Plus, Trash2, Star,
  Upload, ImageOff, Link
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeEmailHTML } from '@/lib/sanitize';
import { EmailTemplate } from '@/lib/highConvertingTemplates';
import { saveCustomTemplate, getCustomTemplates, CustomTemplate } from '@/lib/customTemplates';

interface VisualTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onSelect?: (template: EmailTemplate) => void;
}

interface StatItem {
  id: string;
  value: string;
  label: string;
  color: string;
}

interface EditableSection {
  id: string;
  type: 'headline' | 'subheadline' | 'paragraph' | 'cta' | 'stats' | 'features';
  content: string;
  color?: string;
  backgroundColor?: string;
}

// Parse stats from HTML template (like 97%, 3x, 24h, 10+)
const parseStatsFromHTML = (html: string): StatItem[] => {
  const stats: StatItem[] = [];
  
  // Match stat patterns - looking for numbers with labels below them
  const statPatterns = [
    // Pattern: <span style="...">97%</span>...Score improvement
    /<span[^>]*style="[^"]*color[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi,
    // Pattern: <td style="...">97%<br/>Score improvement
    /<td[^>]*>[\s\S]*?<span[^>]*style="[^"]*color[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<br[^>]*\/>[\s\S]*?([^<]+)<\/td>/gi,
  ];

  // Simple extraction - find pairs of large numbers and labels
  const simplePattern = /(\d+[%x+]?|[\d.]+[xX]?)[\s\S]*?<(?:br|\/span|span)[^>]*>[\s\S]*?([A-Za-z][^<]{2,25})/gi;
  let match;
  let id = 1;
  
  while ((match = simplePattern.exec(html)) !== null) {
    const value = match[1].trim();
    const label = match[2].trim();
    
    // Only add if it looks like a stat (number with optional suffix)
    if (/^\d+[%xX+]?$|^\d+\.\d+[xX]?$/.test(value) && label.length > 2 && label.length < 30) {
      stats.push({
        id: `stat-${id++}`,
        value,
        label,
        color: '#14b8a6' // Default teal color
      });
    }
  }

  // If no stats found, check for common stat box patterns
  if (stats.length === 0) {
    // Try to find stats in table cells
    const cellPattern = /<td[^>]*>[\s\S]*?<(?:p|div|span)[^>]*[^>]*>(\d+[%x+]?)[\s\S]*?<\/(?:p|div|span)>[\s\S]*?<(?:p|div|span)[^>]*>([^<]+)<\/(?:p|div|span)>/gi;
    while ((match = cellPattern.exec(html)) !== null) {
      stats.push({
        id: `stat-${id++}`,
        value: match[1].trim(),
        label: match[2].trim(),
        color: '#14b8a6'
      });
    }
  }

  return stats;
};

// Extract editable text sections from HTML
const extractEditableSections = (html: string): EditableSection[] => {
  const sections: EditableSection[] = [];
  
  // Extract main headline (h1)
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    sections.push({
      id: 'headline',
      type: 'headline',
      content: h1Match[1].replace(/\{\{[^}]+\}\}/g, '{{placeholder}}'),
      color: '#ffffff'
    });
  }

  // Extract paragraphs
  const paragraphs = html.match(/<p[^>]*>([^<]{20,})<\/p>/gi);
  if (paragraphs) {
    paragraphs.slice(0, 3).forEach((p, i) => {
      const content = p.replace(/<[^>]+>/g, '').trim();
      if (content.length > 20) {
        sections.push({
          id: `paragraph-${i}`,
          type: 'paragraph',
          content,
          color: '#a0a0a0'
        });
      }
    });
  }

  // Extract CTA button text
  const ctaMatch = html.match(/<a[^>]*>([^<]{3,30})<\/a>/i);
  if (ctaMatch) {
    sections.push({
      id: 'cta',
      type: 'cta',
      content: ctaMatch[1].trim(),
      backgroundColor: '#14b8a6'
    });
  }

  return sections;
};

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

export default function VisualTemplateEditor({
  open,
  onOpenChange,
  template,
  onSave,
  onSelect,
}: VisualTemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'content' | 'colors' | 'stats'>('visual');
  const [showPreview, setShowPreview] = useState(true);
  
  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState(template.previewImage);
  const [showHeroImage, setShowHeroImage] = useState(true);
  
  // Editable content
  const [editedSubject, setEditedSubject] = useState(template.subject);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedCTA, setEditedCTA] = useState('Schedule a Call →');
  const [editedStats, setEditedStats] = useState<StatItem[]>([]);
  const [editedFeatures, setEditedFeatures] = useState<string[]>([]);
  
  // Color settings
  const [primaryColor, setPrimaryColor] = useState('#14b8a6');
  const [accentColor, setAccentColor] = useState('#14b8a6');
  const [headlineColor, setHeadlineColor] = useState('#ffffff');
  const [bodyTextColor, setBodyTextColor] = useState('#a0a0a0');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [ctaColor, setCtaColor] = useState('#14b8a6');
  const [statColor, setStatColor] = useState('#14b8a6');
  
  // Template name for saving
  const [newTemplateName, setNewTemplateName] = useState('');

  // Initialize from template
  useEffect(() => {
    if (template) {
      setEditedSubject(template.subject);
      setHeroImageUrl(template.previewImage);
      setShowHeroImage(true);
      // Extract sections from HTML
      const sections = extractEditableSections(template.body_html);
      const headline = sections.find(s => s.type === 'headline');
      const paragraphs = sections.filter(s => s.type === 'paragraph');
      const cta = sections.find(s => s.type === 'cta');
      
      if (headline) setEditedHeadline(headline.content);
      if (paragraphs.length) setEditedBody(paragraphs.map(p => p.content).join('\n\n'));
      if (cta) setEditedCTA(cta.content);
      
      // Extract stats
      const stats = parseStatsFromHTML(template.body_html);
      if (stats.length > 0) {
        setEditedStats(stats);
      } else {
        // Default stats if none found
        setEditedStats([
          { id: '1', value: '97%', label: 'Score improvement', color: '#14b8a6' },
          { id: '2', value: '3x', label: 'More conversions', color: '#14b8a6' },
          { id: '3', value: '24h', label: 'Fast delivery', color: '#14b8a6' },
          { id: '4', value: '10+', label: 'Years experience', color: '#14b8a6' },
        ]);
      }

      // Extract features
      const featureMatches = template.body_html.match(/✓\s*([^<\n]+)/g);
      if (featureMatches) {
        setEditedFeatures(featureMatches.map(f => f.replace('✓', '').trim()));
      } else {
        setEditedFeatures([
          'Mobile-responsive design',
          'SEO optimization included',
          'Fast loading speeds',
          '24/7 support'
        ]);
      }

      // Extract colors from template
      const colorMatch = template.body_html.match(/background:\s*(?:linear-gradient\([^)]*,\s*)?#([a-f0-9]{6})/i);
      if (colorMatch) {
        setPrimaryColor(`#${colorMatch[1]}`);
        setAccentColor(`#${colorMatch[1]}`);
        setCtaColor(`#${colorMatch[1]}`);
        setStatColor(`#${colorMatch[1]}`);
      }
    }
  }, [template]);

  // Generate updated HTML with edits
  const generateUpdatedHTML = useMemo(() => {
    // Build stats HTML
    const statsHTML = editedStats.map(stat => `
      <td style="padding:15px;text-align:center;background:${backgroundColor};border-radius:8px;">
        <span style="color:${stat.color || statColor};font-size:28px;font-weight:bold;display:block;">${stat.value}</span>
        <span style="color:#888888;font-size:12px;">${stat.label}</span>
      </td>
    `).join('<td style="width:10px;"></td>');

    // Build features HTML
    const featuresHTML = editedFeatures.map(f => 
      `<tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ ${f}</td></tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:${backgroundColor};">
    ${showHeroImage && heroImageUrl ? `
    <!-- Hero Image -->
    <tr>
      <td>
        <img src="${heroImageUrl}" alt="Header" style="width:100%;height:auto;display:block;"/>
      </td>
    </tr>` : ''}
    <!-- Logo Strip -->
    <tr>
      <td style="background:linear-gradient(135deg,${primaryColor} 0%,${accentColor} 100%);padding:15px 30px;">
        <table width="100%">
          <tr>
            <td style="color:white;font-size:24px;font-weight:bold;">{{company_name}}</td>
            <td style="text-align:right;color:rgba(255,255,255,0.8);font-size:14px;">Your Solutions Partner</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:40px 30px;">
        <h1 style="color:${headlineColor};font-size:28px;margin:0 0 20px;line-height:1.3;">
          ${editedHeadline || '{{first_name}}, Your Business Deserves Better'}
        </h1>
        <p style="color:${bodyTextColor};font-size:16px;line-height:1.6;margin:0 0 20px;">
          ${editedBody.split('\n')[0] || 'I noticed {{business_name}} could benefit from our professional services. Our team specializes in helping businesses like yours succeed.'}
        </p>
        
        ${editedStats.length > 0 ? `
        <!-- Stats Section -->
        <table width="100%" style="margin:25px 0;" cellpadding="0" cellspacing="0">
          <tr>
            ${statsHTML}
          </tr>
        </table>
        ` : ''}
        
        ${editedFeatures.length > 0 ? `
        <!-- Features Box -->
        <table width="100%" style="background:#262626;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <p style="color:${primaryColor};font-size:14px;font-weight:600;margin:0 0 10px;text-transform:uppercase;">What You Get</p>
              <table width="100%">
                ${featuresHTML}
              </table>
            </td>
          </tr>
        </table>
        ` : ''}
        
        ${editedBody.split('\n').slice(1).map(p => 
          `<p style="color:${bodyTextColor};font-size:16px;line-height:1.6;margin:0 0 20px;">${p}</p>`
        ).join('')}
        
        <!-- CTA Button -->
        <table width="100%">
          <tr>
            <td>
              <a href="#" style="display:inline-block;background:linear-gradient(135deg,${ctaColor} 0%,${ctaColor}dd 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                ${editedCTA}
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#666666;font-size:14px;margin:30px 0 0;">
          Best regards,<br/><span style="color:#ffffff;">{{sender_name}}</span>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#0f0f0f;padding:20px 30px;border-top:1px solid #262626;">
        <p style="color:#666666;font-size:12px;margin:0;text-align:center;">
          Sent with BamLead | <a href="#" style="color:${primaryColor};">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [editedHeadline, editedBody, editedCTA, editedStats, editedFeatures, primaryColor, accentColor, ctaColor, statColor, headlineColor, bodyTextColor, backgroundColor, heroImageUrl, showHeroImage]);

  const handleStatChange = (id: string, field: 'value' | 'label' | 'color', newValue: string) => {
    setEditedStats(prev => prev.map(stat => 
      stat.id === id ? { ...stat, [field]: newValue } : stat
    ));
  };

  const handleAddStat = () => {
    setEditedStats(prev => [...prev, {
      id: `stat-${Date.now()}`,
      value: '99%',
      label: 'New metric',
      color: statColor
    }]);
  };

  const handleRemoveStat = (id: string) => {
    setEditedStats(prev => prev.filter(stat => stat.id !== id));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setEditedFeatures(prev => prev.map((f, i) => i === index ? value : f));
  };

  const handleAddFeature = () => {
    setEditedFeatures(prev => [...prev, 'New feature']);
  };

  const handleRemoveFeature = (index: number) => {
    setEditedFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyColorToAll = (color: string) => {
    setPrimaryColor(color);
    setAccentColor(color);
    setCtaColor(color);
    setStatColor(color);
    setEditedStats(prev => prev.map(s => ({ ...s, color })));
    toast.success('Color applied to all elements!');
  };

  const handleSaveTemplate = () => {
    const updatedTemplate: EmailTemplate = {
      ...template,
      subject: editedSubject,
      body_html: generateUpdatedHTML,
      previewImage: showHeroImage ? heroImageUrl : template.previewImage,
    };
    onSave?.(updatedTemplate);
    toast.success('Template updated!');
  };

  const handleSaveAsNew = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a name for your template');
      return;
    }

    const newTemplate = saveCustomTemplate({
      id: '',
      name: newTemplateName,
      category: template.category,
      industry: template.industry,
      subject: editedSubject,
      body_html: generateUpdatedHTML,
      description: `Custom version of ${template.name}`,
      previewImage: showHeroImage ? heroImageUrl : template.previewImage,
      conversionTip: template.conversionTip,
      openRate: 0,
      replyRate: 0,
      folderId: undefined,
    });

    toast.success('🎉 Template saved to your library!');
    onSelect?.(newTemplate);
    onOpenChange(false);
  };

  const handleUseNow = () => {
    const updatedTemplate: EmailTemplate = {
      ...template,
      subject: editedSubject,
      body_html: generateUpdatedHTML,
    };
    onSelect?.(updatedTemplate);
    toast.success('Template customized and selected!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Visual Template Editor
              </DialogTitle>
              <DialogDescription>
                Customize every aspect of your email template - colors, text, stats, and more
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Editor Panel */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r flex flex-col min-h-0`}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-4 grid grid-cols-4 shrink-0">
                <TabsTrigger value="visual" className="gap-1.5 text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-1.5 text-xs">
                  <Hash className="w-3.5 h-3.5" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1.5 text-xs">
                  <Palette className="w-3.5 h-3.5" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-1.5 text-xs">
                  <Type className="w-3.5 h-3.5" />
                  Features
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {/* Content Tab */}
                <TabsContent value="visual" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{{first_name}}'}, {'{{business_name}}'}, {'{{website}}'}
                    </p>
                  </div>

                  <Separator />

                  {/* Hero Image - compact */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-xs">
                        <Image className="w-3.5 h-3.5" />
                        Hero Image
                      </Label>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHeroImage(!showHeroImage)}
                          className="gap-1 text-[10px] h-7 px-2"
                        >
                          {showHeroImage ? <ImageOff className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                          {showHeroImage ? 'Remove' : 'Show'}
                        </Button>
                      </div>
                    </div>
                    
                    {showHeroImage && (
                      <div className="relative rounded-lg overflow-hidden border bg-muted/30 group">
                        <img 
                          src={heroImageUrl} 
                          alt="Hero preview" 
                          className="w-full h-20 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer">
                            <Button size="sm" variant="secondary" className="gap-1 pointer-events-none" asChild>
                              <span>
                                <Upload className="w-3.5 h-3.5" />
                                Upload
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setHeroImageUrl(ev.target?.result as string);
                                    toast.success('Image uploaded!');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setHeroImageUrl(template.previewImage);
                              toast.success('Reset to original');
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                          </Button>
                        </div>
                        <div className="flex gap-1 mt-1">
                          <div className="relative flex-1">
                            <Link className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                              value={heroImageUrl}
                              onChange={(e) => setHeroImageUrl(e.target.value)}
                              placeholder="Paste image URL..."
                              className="pl-7 text-[11px] h-7"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Headline */}
                  <div className="space-y-1">
                    <Label className="text-xs">Headline</Label>
                    <Input
                      value={editedHeadline}
                      onChange={(e) => setEditedHeadline(e.target.value)}
                      placeholder="Main headline text..."
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Body Text - immediately visible */}
                  <div className="space-y-1">
                    <Label className="text-xs">Body Text</Label>
                    <Textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      placeholder="Main email content..."
                      className="min-h-[120px] text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Call-to-Action Button</Label>
                    <Input
                      value={editedCTA}
                      onChange={(e) => setEditedCTA(e.target.value)}
                      placeholder="Button text..."
                    />
                  </div>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Statistics Section</h3>
                      <p className="text-sm text-muted-foreground">Edit the numbers and labels shown in your template</p>
                    </div>
                    <Button size="sm" onClick={handleAddStat} className="gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Add Stat
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {editedStats.map((stat, index) => (
                      <Card key={stat.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Value</Label>
                              <Input
                                value={stat.value}
                                onChange={(e) => handleStatChange(stat.id, 'value', e.target.value)}
                                placeholder="97%"
                                className="font-bold text-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={stat.label}
                                onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)}
                                placeholder="Score improvement"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={stat.color}
                                onChange={(e) => handleStatChange(stat.id, 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveStat(stat.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {editedStats.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hash className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No stats added yet</p>
                      <Button size="sm" variant="outline" onClick={handleAddStat} className="mt-2">
                        Add Your First Stat
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Quick Color Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleApplyColorToAll(preset.value)}
                          className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Click to apply to all elements</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#14b8a6"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>CTA Button Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={ctaColor}
                          onChange={(e) => setCtaColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={ctaColor}
                          onChange={(e) => setCtaColor(e.target.value)}
                          placeholder="#14b8a6"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Stats Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={statColor}
                          onChange={(e) => {
                            setStatColor(e.target.value);
                            setEditedStats(prev => prev.map(s => ({ ...s, color: e.target.value })));
                          }}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={statColor}
                          onChange={(e) => {
                            setStatColor(e.target.value);
                            setEditedStats(prev => prev.map(s => ({ ...s, color: e.target.value })));
                          }}
                          placeholder="#14b8a6"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Headline Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={headlineColor}
                          onChange={(e) => setHeadlineColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={headlineColor}
                          onChange={(e) => setHeadlineColor(e.target.value)}
                          placeholder="#ffffff"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Body Text Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bodyTextColor}
                          onChange={(e) => setBodyTextColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={bodyTextColor}
                          onChange={(e) => setBodyTextColor(e.target.value)}
                          placeholder="#a0a0a0"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#1a1a1a"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="content" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Feature List</h3>
                      <p className="text-sm text-muted-foreground">Edit the bullet points in your template</p>
                    </div>
                    <Button size="sm" onClick={handleAddFeature} className="gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Add Feature
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {editedFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder="Feature benefit..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 flex flex-col bg-muted/30">
              <div className="p-3 border-b bg-background/50 shrink-0">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Eye className="w-3 h-3" />
                    Live Preview
                  </Badge>
                  <Badge variant="secondary">{template.name}</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="bg-background rounded-lg border shadow-lg overflow-hidden">
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(generateUpdatedHTML) }}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name to save..."
                className="w-64"
              />
              <Button
                onClick={handleSaveAsNew}
                disabled={!newTemplateName.trim()}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Star className="w-4 h-4" />
                Save to Library
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUseNow}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                <Check className="w-4 h-4" />
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
