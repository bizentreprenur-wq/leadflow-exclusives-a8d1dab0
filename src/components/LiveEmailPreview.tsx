import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Moon, Sun, Mail, Star, Trash2, Reply, MoreHorizontal, Paperclip, Archive } from "lucide-react";
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
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="rounded-xl border-2 border-border overflow-hidden bg-background shadow-lg">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">Email Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
            <TabsList className="h-8 bg-background/50">
              <TabsTrigger value="desktop" className="h-7 px-2.5 gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="h-7 px-2.5 gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDark(!isDark)}
            className="h-8 w-8 p-0"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Email Client Container */}
      <div
        className={cn(
          "transition-all duration-300 mx-auto",
          device === "mobile" ? "max-w-[375px] border-x" : "w-full",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        {/* Email App Header Bar */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-b",
          isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-center gap-2">
            <button className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark ? "hover:bg-zinc-700" : "hover:bg-gray-200"
            )}>
              <Archive className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-gray-500")} />
            </button>
            <button className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark ? "hover:bg-zinc-700" : "hover:bg-gray-200"
            )}>
              <Trash2 className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-gray-500")} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark ? "hover:bg-zinc-700" : "hover:bg-gray-200"
            )}>
              <Reply className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-gray-500")} />
            </button>
            <button className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark ? "hover:bg-zinc-700" : "hover:bg-gray-200"
            )}>
              <MoreHorizontal className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-gray-500")} />
            </button>
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          <div className={cn("p-5", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {/* Subject Line */}
            <h2 className={cn(
              "font-bold mb-4 leading-tight",
              device === "mobile" ? "text-xl" : "text-2xl"
            )}>
              {subject || "Enter your subject line..."}
            </h2>

            {/* Sender Card */}
            <div className={cn(
              "flex items-start gap-3 pb-4 mb-4 border-b",
              isDark ? "border-zinc-700" : "border-gray-100"
            )}>
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                isDark 
                  ? "bg-gradient-to-br from-primary/30 to-primary/20 text-primary" 
                  : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
              )}>
                {senderName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{senderName}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className={cn(
                      "w-4 h-4 cursor-pointer transition-colors",
                      isDark ? "text-zinc-600 hover:text-amber-400" : "text-gray-300 hover:text-amber-400"
                    )} />
                  </div>
                </div>
                <p className={cn(
                  "text-sm truncate",
                  isDark ? "text-zinc-400" : "text-gray-500"
                )}>
                  {senderEmail}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  isDark ? "text-zinc-500" : "text-gray-400"
                )}>
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Email Body */}
            <div className={cn(
              "whitespace-pre-wrap leading-relaxed",
              device === "mobile" ? "text-[15px]" : "text-base"
            )}>
              {formatBody(body) || (
                <div className={cn(
                  "text-center py-8",
                  isDark ? "text-zinc-500" : "text-gray-400"
                )}>
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Your email preview</p>
                  <p className="text-sm">Start typing to see your email come to life...</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer Info Bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5 text-xs border-t",
        isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-50 text-gray-500 border-gray-200"
      )}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            {device === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            {device === "mobile" ? "iPhone 14" : "Desktop"}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full",
            isDark ? "bg-zinc-700" : "bg-gray-200"
          )}>
            {isDark ? "Dark" : "Light"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>{body.length} chars</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full",
            body.length > 0 && body.length < 500 
              ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
              : body.length >= 500 
              ? isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"
              : ""
          )}>
            {body.length === 0 ? "Empty" : body.length < 500 ? "Optimal" : "Long"}
          </span>
        </div>
      </div>
    </div>
  );
}
