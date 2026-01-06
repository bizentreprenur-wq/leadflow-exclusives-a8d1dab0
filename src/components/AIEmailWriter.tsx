import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Wand2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AIEmailWriterProps {
  onInsert: (text: string) => void;
  context?: {
    businessName?: string;
    industry?: string;
  };
}

type ToneOption = "professional" | "friendly" | "persuasive" | "casual";
type ContentType = "subject" | "opening" | "full" | "cta";

export default function AIEmailWriter({ onInsert, context }: AIEmailWriterProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<ToneOption>("professional");
  const [contentType, setContentType] = useState<ContentType>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to write");
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");

    try {
      // Build the AI prompt based on settings
      const systemPrompt = buildSystemPrompt(tone, contentType, context);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      setGeneratedText(content);
      toast.success("Content generated!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const buildSystemPrompt = (
    tone: ToneOption,
    type: ContentType,
    ctx?: { businessName?: string; industry?: string }
  ): string => {
    const toneDescriptions: Record<ToneOption, string> = {
      professional: "formal, business-appropriate, and credible",
      friendly: "warm, approachable, and conversational",
      persuasive: "compelling, benefit-focused, and action-oriented",
      casual: "relaxed, informal, and personable",
    };

    const typeInstructions: Record<ContentType, string> = {
      subject: "Write a compelling email subject line (under 50 characters). Just the subject, no quotes.",
      opening: "Write an engaging email opening paragraph (2-3 sentences). Hook the reader immediately.",
      full: "Write a complete cold outreach email (3-4 paragraphs). Include greeting, value proposition, and call to action.",
      cta: "Write a strong call-to-action closing paragraph. Create urgency and make it easy to respond.",
    };

    let contextInfo = "";
    if (ctx?.businessName) {
      contextInfo += `The recipient's business is: ${ctx.businessName}. `;
    }
    if (ctx?.industry) {
      contextInfo += `Their industry is: ${ctx.industry}. `;
    }

    return `You are an expert email copywriter for B2B outreach. 
Write in a ${toneDescriptions[tone]} tone.
${typeInstructions[type]}
${contextInfo}
Keep it concise and impactful. No fluff. Be specific about value.
Do not include placeholder brackets like [Name] - write as if ready to send.`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleInsert = () => {
    onInsert(generatedText);
    toast.success("Inserted into email!");
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">AI Email Writer</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tone</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as ToneOption)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="persuasive">Persuasive</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Generate</Label>
          <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subject">Subject Line</SelectItem>
              <SelectItem value="opening">Opening Hook</SelectItem>
              <SelectItem value="full">Full Email</SelectItem>
              <SelectItem value="cta">Call to Action</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Describe what you're selling or offering
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., We help restaurants increase online orders by 40% with our delivery optimization platform..."
          className="min-h-[80px] text-sm resize-none"
        />
      </div>

      <Button
        onClick={generateContent}
        disabled={isGenerating || !prompt.trim()}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate with AI
          </>
        )}
      </Button>

      {generatedText && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3 rounded-lg bg-background border border-border">
            <p className="text-sm text-foreground whitespace-pre-wrap">{generatedText}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" className="flex-1 gap-2" onClick={handleInsert}>
              <Sparkles className="w-4 h-4" />
              Insert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
