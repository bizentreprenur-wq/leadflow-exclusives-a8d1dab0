import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Moon, Sun, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveEmailPreviewProps {
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
}

export default function LiveEmailPreview({
  subject,
  body,
  senderName = "Your Name",
  senderEmail = "you@company.com",
}: LiveEmailPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isDark, setIsDark] = useState(false);

  const formatBody = (html: string) => {
    // Convert HTML to display nicely
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
            <TabsList className="h-8">
              <TabsTrigger value="desktop" className="h-7 px-2">
                <Monitor className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="mobile" className="h-7 px-2">
                <Smartphone className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark(!isDark)}
            className="h-8 w-8 p-0"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div
        className={cn(
          "transition-all duration-300 mx-auto",
          device === "mobile" ? "max-w-[375px]" : "w-full",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        <ScrollArea className="h-[400px]">
          {/* Email Client UI */}
          <div className={cn("p-4", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {/* Email Header */}
            <div className={cn(
              "border-b pb-4 mb-4",
              isDark ? "border-zinc-700" : "border-zinc-200"
            )}>
              {/* Subject */}
              <h2 className={cn(
                "font-semibold mb-3",
                device === "mobile" ? "text-lg" : "text-xl"
              )}>
                {subject || "No subject"}
              </h2>

              {/* Sender Info */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                  isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                )}>
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{senderName}</p>
                  <p className={cn(
                    "text-xs",
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    {senderEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className={cn(
              "whitespace-pre-wrap",
              device === "mobile" ? "text-sm leading-relaxed" : "text-base leading-relaxed"
            )}>
              {formatBody(body) || (
                <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>
                  Your email content will appear here...
                </span>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Preview Info */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 text-xs border-t",
        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-muted/30 text-muted-foreground border-border"
      )}>
        <span>
          {device === "mobile" ? "iPhone 14 Pro" : "Desktop"} • {isDark ? "Dark" : "Light"} Mode
        </span>
        <span>
          {body.length} characters
        </span>
      </div>
    </div>
  );
}
