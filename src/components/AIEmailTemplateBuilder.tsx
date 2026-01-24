import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Upload, Image, Wand2, Loader2, Trash2, 
  CheckCircle2, Eye, RefreshCw, Palette, Layout, Type
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AIEmailTemplateBuilderProps {
  onSaveTemplate: (template: { subject: string; body: string; heroImage?: string }) => void;
  currentSubject?: string;
  currentBody?: string;
}

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export default function AIEmailTemplateBuilder({
  onSaveTemplate,
  currentSubject = '',
  currentBody = ''
}: AIEmailTemplateBuilderProps) {
  const [subject, setSubject] = useState(currentSubject);
  const [body, setBody] = useState(currentBody);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isGeneratingBody, setIsGeneratingBody] = useState(false);
  const [isGeneratingHeroImage, setIsGeneratingHeroImage] = useState(false);
  const [heroImagePrompt, setHeroImagePrompt] = useState('');
  const [emailTone, setEmailTone] = useState<'professional' | 'friendly' | 'urgent' | 'casual'>('professional');

  // AI subject line suggestions
  const aiSubjectSuggestions = [
    "Quick question about your business growth",
    "{{business_name}}, I noticed something important",
    "A personalized solution for {{business_name}}",
    "Let's boost your results this week",
    "Important update for local businesses like yours"
  ];

  // AI body suggestions based on tone
  const aiBodySuggestions: Record<string, string[]> = {
    professional: [
      "I hope this email finds you well. I recently came across {{business_name}} and was impressed by your work in the industry.",
      "Our data-driven approach has helped businesses like yours achieve a 40% increase in customer engagement.",
      "I'd love to schedule a brief call to discuss how we can support your growth objectives."
    ],
    friendly: [
      "Hey there! 👋 I stumbled upon {{business_name}} and just had to reach out.",
      "We've been helping businesses in your area grow like crazy, and I think you'd be a perfect fit!",
      "Would love to chat about some exciting opportunities - no pressure, just a friendly conversation!"
    ],
    urgent: [
      "IMPORTANT: I've identified a critical opportunity for {{business_name}} that expires soon.",
      "Your competitors are already taking advantage of this - don't miss out!",
      "Reply within 48 hours to lock in your exclusive spot."
    ],
    casual: [
      "Just a quick note to introduce myself and share something cool I think you'll like.",
      "Been working with a few businesses around {{business_name}}'s area and thought of you.",
      "Shoot me a reply if you're curious - no strings attached!"
    ]
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          url: reader.result as string,
          name: file.name
        };
        setUploadedImages(prev => [...prev, newImage]);
        toast.success(`Uploaded ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    if (heroImage && uploadedImages.find(img => img.id === imageId)?.url === heroImage) {
      setHeroImage(null);
    }
    toast.info('Image removed');
  };

  const handleSetAsHero = (imageUrl: string) => {
    setHeroImage(imageUrl);
    toast.success('Set as hero image!');
  };

  const handleGenerateAISubject = async () => {
    setIsGeneratingSubject(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    const randomSubject = aiSubjectSuggestions[Math.floor(Math.random() * aiSubjectSuggestions.length)];
    setSubject(randomSubject);
    setIsGeneratingSubject(false);
    toast.success('AI generated a subject line!');
  };

  const handleGenerateAIBody = async () => {
    setIsGeneratingBody(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const suggestions = aiBodySuggestions[emailTone] || aiBodySuggestions.professional;
    const generatedBody = suggestions.join('\n\n');
    setBody(generatedBody);
    setIsGeneratingBody(false);
    toast.success('AI generated email body!');
  };

  const handleGenerateAIHeroImage = async () => {
    if (!heroImagePrompt.trim()) {
      toast.error('Please describe the hero image you want');
      return;
    }

    setIsGeneratingHeroImage(true);
    
    // Simulate AI image generation (in production, this would call an AI image API)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo, use a placeholder gradient image
    const placeholderColors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600'
    ];
    const randomColor = placeholderColors[Math.floor(Math.random() * placeholderColors.length)];
    
    // Create a canvas-generated placeholder (in production, use actual AI API)
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 600, 300);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 300);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AI Generated Hero Image', 300, 140);
      ctx.font = '16px Arial';
      ctx.fillText(heroImagePrompt.slice(0, 40) + (heroImagePrompt.length > 40 ? '...' : ''), 300, 175);
    }
    
    const generatedUrl = canvas.toDataURL('image/png');
    setHeroImage(generatedUrl);
    setIsGeneratingHeroImage(false);
    toast.success('AI generated your hero image!');
  };

  const handleSaveTemplate = () => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }
    if (!body.trim()) {
      toast.error('Please add email content');
      return;
    }
    
    onSaveTemplate({
      subject,
      body,
      heroImage: heroImage || undefined
    });
    toast.success('Template saved!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl">Build your own Email Template with AI</h3>
          <p className="text-sm text-muted-foreground">Create stunning email templates with AI-powered content and images</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Builder */}
        <div className="space-y-6">
          {/* Tone Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Email Tone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(['professional', 'friendly', 'urgent', 'casual'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setEmailTone(tone)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                      ${emailTone === tone
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Line */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-400" />
                Subject Line
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateAISubject}
                  disabled={isGeneratingSubject}
                  className="ml-auto gap-1.5 text-xs"
                >
                  {isGeneratingSubject ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject line or let AI create one..."
                className="bg-background"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Tokens:</span>
                {['{{business_name}}', '{{first_name}}'].map(token => (
                  <button
                    key={token}
                    onClick={() => setSubject(prev => prev + ' ' + token)}
                    className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Body */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layout className="w-4 h-4 text-green-400" />
                Email Body
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateAIBody}
                  disabled={isGeneratingBody}
                  className="ml-auto gap-1.5 text-xs"
                >
                  {isGeneratingBody ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI Generate ({emailTone})
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email content or let AI generate it..."
                className="w-full h-48 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Tokens:</span>
                {['{{business_name}}', '{{first_name}}', '{{website}}', '{{phone}}'].map(token => (
                  <button
                    key={token}
                    onClick={() => setBody(prev => prev + ' ' + token)}
                    className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hero Image - AI Generation */}
          <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-violet-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Hero Image Generator
                <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/40 text-xs">AI Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={heroImagePrompt}
                  onChange={(e) => setHeroImagePrompt(e.target.value)}
                  placeholder="Describe your hero image... (e.g., modern business growth chart)"
                  className="bg-background flex-1"
                />
                <Button
                  onClick={handleGenerateAIHeroImage}
                  disabled={isGeneratingHeroImage || !heroImagePrompt.trim()}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {isGeneratingHeroImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate
                </Button>
              </div>

              {heroImage && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={heroImage} alt="Hero" className="w-full h-40 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-success text-white text-xs">Hero Image</Badge>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={() => setHeroImage(null)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Custom Images */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-400" />
                Upload Your Own Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload images (max 5MB each)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={img.url} alt={img.name} className="w-full h-20 object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={() => handleSetAsHero(img.url)}
                        >
                          <Image className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => handleRemoveImage(img.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-white text-black overflow-hidden">
                {/* Email Header */}
                <div className="p-4 border-b bg-gray-50">
                  <p className="text-xs text-gray-500">Subject:</p>
                  <p className="font-semibold text-gray-900">
                    {subject || 'Your subject line here...'}
                  </p>
                </div>
                
                {/* Hero Image */}
                {heroImage && (
                  <img src={heroImage} alt="Hero" className="w-full h-48 object-cover" />
                )}
                
                {/* Email Body */}
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {body || 'Your email content will appear here...'}
                  </p>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 text-center">
                  <p className="text-xs text-gray-400">Powered by BamLead AI</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleSaveTemplate}
                  className="flex-1 gap-2 bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-700"
                  disabled={!subject.trim() || !body.trim()}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubject('');
                    setBody('');
                    setHeroImage(null);
                    setUploadedImages([]);
                    toast.info('Template cleared');
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
