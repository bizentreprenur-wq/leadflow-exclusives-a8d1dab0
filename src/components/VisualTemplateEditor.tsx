import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, Type, Hash, Image, Save, Eye, Edit3, 
  RotateCcw, Check, X, Sparkles, Wand2, Copy,
  Plus, Trash2, Star, Upload, ImageOff, Link, MousePointerClick
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeEmailHTML } from '@/lib/sanitize';
import { EmailTemplate, getHeroImageChoices } from '@/lib/highConvertingTemplates';
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
  const [activeTab, setActiveTab] = useState<'edit' | 'colors' | 'stats' | 'features'>('edit');
  
  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState(template.previewImage);
  const [heroImageChoices, setHeroImageChoices] = useState<string[]>([]);
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

  // Parse stats from HTML template
  const parseStatsFromHTML = (html: string): StatItem[] => {
    const stats: StatItem[] = [];
    const simplePattern = /(\d+[%x+]?|[\d.]+[xX]?)[\s\S]*?<(?:br|\/span|span)[^>]*>[\s\S]*?([A-Za-z][^<]{2,25})/gi;
    let match;
    let id = 1;
    while ((match = simplePattern.exec(html)) !== null) {
      const value = match[1].trim();
      const label = match[2].trim();
      if (/^\d+[%xX+]?$|^\d+\.\d+[xX]?$/.test(value) && label.length > 2 && label.length < 30) {
        stats.push({ id: `stat-${id++}`, value, label, color: '#14b8a6' });
      }
    }
    return stats;
  };

  // Initialize from template
  useEffect(() => {
    if (template) {
      setEditedSubject(template.subject);
      setHeroImageUrl(template.previewImage);
      setHeroImageChoices(template.heroImages || getHeroImageChoices(template.industry));
      setShowHeroImage(true);
      
      // Extract headline
      const h1Match = template.body_html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) setEditedHeadline(h1Match[1].replace(/\{\{[^}]+\}\}/g, '{{placeholder}}'));
      else setEditedHeadline('Your Business Deserves Better');
      
      // Extract paragraphs
      const paragraphs = template.body_html.match(/<p[^>]*>([^<]{20,})<\/p>/gi);
      if (paragraphs) {
        setEditedBody(paragraphs.slice(0, 3).map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 20).join('\n\n'));
      } else {
        setEditedBody('I noticed {{business_name}} could benefit from our professional services.');
      }
      
      // Extract CTA
      const ctaMatch = template.body_html.match(/<a[^>]*>([^<]{3,30})<\/a>/i);
      if (ctaMatch) setEditedCTA(ctaMatch[1].trim());
      
      // Extract stats
      const stats = parseStatsFromHTML(template.body_html);
      if (stats.length > 0) {
        setEditedStats(stats);
      } else {
        setEditedStats([
          { id: '1', value: '97%', label: 'Score improvement', color: '#14b8a6' },
          { id: '2', value: '3x', label: 'More conversions', color: '#14b8a6' },
          { id: '3', value: '24h', label: 'Fast delivery', color: '#14b8a6' },
          { id: '4', value: '10+', label: 'Years experience', color: '#14b8a6' },
        ]);
      }

      // Extract features
      const featureMatches = template.body_html.match(/[✓▸●—]\s*([^<\n]+)/g);
      if (featureMatches) {
        setEditedFeatures(featureMatches.map(f => f.replace(/^[✓▸●—]\s*/, '').trim()));
      } else {
        setEditedFeatures(['Mobile-responsive design', 'SEO optimization included', 'Fast loading speeds', '24/7 support']);
      }

      // Extract colors
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
    const statsHTML = editedStats.map(stat => `
      <td style="padding:15px;text-align:center;background:${backgroundColor};border-radius:8px;">
        <span style="color:${stat.color || statColor};font-size:28px;font-weight:bold;display:block;">${stat.value}</span>
        <span style="color:#888888;font-size:12px;">${stat.label}</span>
      </td>
    `).join('<td style="width:10px;"></td>');

    const featuresHTML = editedFeatures.map(f => 
      `<tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ ${f}</td></tr>`
    ).join('');

    const bodyParagraphs = editedBody.split('\n').filter(p => p.trim().length > 0);

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:${backgroundColor};">
    ${showHeroImage && heroImageUrl ? `
    <tr>
      <td>
        <img src="${heroImageUrl}" alt="Header" style="width:100%;height:auto;display:block;"/>
      </td>
    </tr>` : ''}
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
    <tr>
      <td style="padding:40px 30px;">
        <h1 style="color:${headlineColor};font-size:28px;margin:0 0 20px;line-height:1.3;">
          ${editedHeadline || '{{first_name}}, Your Business Deserves Better'}
        </h1>
        ${bodyParagraphs.map(p => 
          `<p style="color:${bodyTextColor};font-size:16px;line-height:1.6;margin:0 0 20px;">${p}</p>`
        ).join('')}
        
        ${editedStats.length > 0 ? `
        <table width="100%" style="margin:25px 0;" cellpadding="0" cellspacing="0">
          <tr>${statsHTML}</tr>
        </table>` : ''}
        
        ${editedFeatures.length > 0 ? `
        <table width="100%" style="background:#262626;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <p style="color:${primaryColor};font-size:14px;font-weight:600;margin:0 0 10px;text-transform:uppercase;">What You Get</p>
              <table width="100%">${featuresHTML}</table>
            </td>
          </tr>
        </table>` : ''}
        
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
    setEditedStats(prev => [...prev, { id: `stat-${Date.now()}`, value: '99%', label: 'New metric', color: statColor }]);
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
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Edit3 className="w-5 h-5 text-primary" />
                Edit Template
              </DialogTitle>
              <DialogDescription className="text-xs">
                Edit every field on the left. Live preview updates on the right.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="gap-1.5 text-xs bg-primary/10 border-primary/30 text-primary">
              <Edit3 className="w-3.5 h-3.5" />
              Full Edit Mode
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT: All Editable Fields */}
          <div className="w-[400px] border-r flex flex-col min-h-0 shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-3 mt-3 grid grid-cols-4 shrink-0">
                <TabsTrigger value="edit" className="gap-1 text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-1 text-xs">
                  <Hash className="w-3.5 h-3.5" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1 text-xs">
                  <Palette className="w-3.5 h-3.5" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-1 text-xs">
                  <Type className="w-3.5 h-3.5" />
                  Features
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {/* Content Tab - Subject, Headline, Body, CTA */}
                {activeTab === 'edit' && (
                  <div className="space-y-4">
                    {/* Subject Line */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Line</Label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Email subject line..."
                        className="mt-1 text-sm"
                      />
                    </div>

                    {/* Hero Image */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hero Image</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHeroImage(!showHeroImage)}
                          className="gap-1.5 text-xs h-8"
                        >
                          {showHeroImage ? <ImageOff className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                          {showHeroImage ? 'Remove' : 'Add'}
                        </Button>
                        {showHeroImage && (
                          <label className="cursor-pointer">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 pointer-events-none" asChild>
                              <span><Upload className="w-3.5 h-3.5" /> Upload</span>
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
                        )}
                      </div>
                      {showHeroImage && (
                        <>
                          <div className="relative mt-2">
                            <Link className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                              value={heroImageUrl}
                              onChange={(e) => setHeroImageUrl(e.target.value)}
                              placeholder="Paste image URL..."
                              className="pl-7 text-xs h-8"
                            />
                          </div>
                          {heroImageChoices.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-[10px] text-muted-foreground mb-1 block">Choose a hero image:</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {heroImageChoices.map((imgUrl, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setHeroImageUrl(imgUrl);
                                      toast.success(`Image ${idx + 1} selected!`);
                                    }}
                                    className={`relative rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                                      heroImageUrl === imgUrl 
                                        ? 'border-primary ring-2 ring-primary/30' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Hero option ${idx + 1}`}
                                      className="w-full h-16 object-cover"
                                      loading="lazy"
                                    />
                                    {heroImageUrl === imgUrl && (
                                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-primary-foreground drop-shadow-md" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <Separator />

                    {/* Headline */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Headline</Label>
                      <Input
                        value={editedHeadline}
                        onChange={(e) => setEditedHeadline(e.target.value)}
                        placeholder="Main headline..."
                        className="mt-1 text-sm font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Use {'{{first_name}}'}, {'{{business_name}}'} for personalization</p>
                    </div>

                    {/* Body Text */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Body Text</Label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        placeholder="Write your email body here. Use multiple lines for separate paragraphs..."
                        className="mt-1 text-sm min-h-[180px] resize-y"
                        rows={8}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Each line becomes a new paragraph. Use {'{{business_name}}'}, {'{{first_name}}'} tokens.</p>
                    </div>

                    <Separator />

                    {/* CTA Button */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call-to-Action Button</Label>
                      <Input
                        value={editedCTA}
                        onChange={(e) => setEditedCTA(e.target.value)}
                        placeholder="CTA button text..."
                        className="mt-1 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Statistics</h3>
                      <Button size="sm" onClick={handleAddStat} className="gap-1 h-7 text-xs">
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                    {editedStats.map((stat) => (
                      <div key={stat.id} className="p-2.5 rounded-lg border bg-muted/30 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Value</Label>
                            <Input
                              value={stat.value}
                              onChange={(e) => handleStatChange(stat.id, 'value', e.target.value)}
                              placeholder="97%"
                              className="h-7 text-sm font-bold"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Label</Label>
                            <Input
                              value={stat.label}
                              onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)}
                              placeholder="Score"
                              className="h-7 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={stat.color}
                              onChange={(e) => handleStatChange(stat.id, 'color', e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border"
                            />
                            <span className="text-[10px] text-muted-foreground">{stat.color}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveStat(stat.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {editedStats.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No stats yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Quick Presets</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => handleApplyColorToAll(preset.value)}
                            className="w-7 h-7 rounded-full border-2 border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                    <Separator />
                    {[
                      { label: 'Primary', value: primaryColor, set: setPrimaryColor },
                      { label: 'CTA Button', value: ctaColor, set: setCtaColor },
                      { label: 'Stats', value: statColor, set: (v: string) => { setStatColor(v); setEditedStats(prev => prev.map(s => ({ ...s, color: v }))); } },
                      { label: 'Headline', value: headlineColor, set: setHeadlineColor },
                      { label: 'Body Text', value: bodyTextColor, set: setBodyTextColor },
                      { label: 'Background', value: backgroundColor, set: setBackgroundColor },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className="h-6 text-[10px] font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Features List</h3>
                      <Button size="sm" onClick={handleAddFeature} className="gap-1 h-7 text-xs">
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                    {editedFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 shrink-0">✓</span>
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder="Feature benefit..."
                          className="flex-1 h-7 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b shrink-0 flex items-center gap-2 bg-muted/20">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">Colors:</span>
              <div className="flex gap-1">
                {COLOR_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyColorToAll(preset.value)}
                    className="w-5 h-5 rounded-full border border-border hover:scale-125 transition-transform"
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-neutral-900">
              <div 
                className="bg-background rounded-lg border shadow-lg overflow-hidden mx-auto max-w-[620px]"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(generateUpdatedHTML) }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name to save..."
                className="w-56 h-9"
              />
              <Button
                onClick={handleSaveAsNew}
                disabled={!newTemplateName.trim()}
                size="sm"
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Star className="w-4 h-4" />
                Save to Library
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUseNow}
                size="sm"
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
