import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Chrome,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  RefreshCw,
  XCircle,
} from "lucide-react";

type FileCheck = {
  name: string;
  available: boolean;
};

const REQUIRED_FILES = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "popup.css",
  "background.js",
  "content.js",
  "content.css",
  "icon16.png",
  "icon32.png",
  "icon48.png",
  "icon128.png",
];

const EXTENSION_BASES = [
  '/chrome-extension',
  'https://bamlead.com/chrome-extension',
];
const ZIP_CANDIDATES = ["/chrome-extension.zip", "/chrome-extension/bamlead-extension.zip", "https://bamlead.com/chrome-extension.zip"];

const INSTALL_STEPS = [
  "1) Open chrome://extensions (or edge://extensions / brave://extensions).",
  "2) Enable Developer mode.",
  "3) Click Load unpacked.",
  "4) Select the project folder: chrome-extension.",
  "5) Confirm BamLead appears in your extensions list.",
].join("\n");

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to textarea fallback
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export default function ChromeExtensionPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileChecks, setFileChecks] = useState<FileCheck[]>([]);
  const [manifestVersion, setManifestVersion] = useState<string | null>(null);

  const availableCount = useMemo(
    () => fileChecks.filter((item) => item.available).length,
    [fileChecks]
  );
  const allAvailable = fileChecks.length > 0 && availableCount === REQUIRED_FILES.length;

  const checkFiles = async () => {
    setIsChecking(true);
    try {
      const checks = await Promise.all(
        REQUIRED_FILES.map(async (filename): Promise<FileCheck> => {
          for (const base of EXTENSION_BASES) {
            try {
              const response = await fetch(
                `${base}/${filename}?v=${Date.now()}`,
                { method: "GET", cache: "no-store" }
              );
              if (response.ok) {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('text/html') && !filename.endsWith('.html')) continue;
                return { name: filename, available: true };
              }
            } catch { /* try next */ }
          }
          return { name: filename, available: false };
        })
      );
      setFileChecks(checks);

      const manifest = checks.find((item) => item.name === "manifest.json");
      if (manifest?.available) {
        for (const base of EXTENSION_BASES) {
          try {
            const response = await fetch(
              `${base}/manifest.json?v=${Date.now()}`,
              { method: "GET", cache: "no-store" }
            );
            if (response.ok) {
              const data = (await response.json()) as { version?: string };
              setManifestVersion(data.version ?? null);
              break;
            }
          } catch { /* try next */ }
        }
      } else {
        setManifestVersion(null);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      for (const candidate of ZIP_CANDIDATES) {
        try {
          const response = await fetch(`${candidate}?v=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
          });
          if (response.ok) {
            const link = document.createElement("a");
            link.href = candidate;
            link.download = "";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Extension download started.");
            return;
          }
        } catch {
          // continue trying next candidate
        }
      }

      toast.info(
        "No packaged ZIP found in web assets. Use Load unpacked and select the local chrome-extension folder."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySteps = async () => {
    const copied = await copyToClipboard(INSTALL_STEPS);
    if (copied) {
      toast.success("Installation steps copied.");
      return;
    }
    toast.error("Failed to copy steps.");
  };

  const handleCopyFolder = async () => {
    const copied = await copyToClipboard("chrome-extension");
    if (copied) {
      toast.success("Folder name copied: chrome-extension");
      return;
    }
    toast.error("Failed to copy folder name.");
  };

  const openGuide = () => {
    const popup = window.open(
      `${EXTENSION_BASES[0]}/INSTALLATION.md`,
      "_blank",
      "noopener,noreferrer"
    );
    if (!popup) {
      toast.error("Popup blocked. Allow popups and try again.");
      return;
    }
    popup.opener = null;
  };

  useEffect(() => {
    void checkFiles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-6">
        <div className="mx-auto max-w-2xl text-center">
          <Chrome className="mx-auto mb-4 h-14 w-14 text-blue-500" />
          <h3 className="mb-2 text-3xl font-semibold">BamLead Chrome Extension</h3>
          <p className="mb-6 text-muted-foreground">
            Extract contact info, analyze websites, and save leads directly from any webpage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => void handleDownload()} className="gap-2" disabled={isDownloading}>
              {isDownloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Extension
            </Button>
            <Button variant="outline" onClick={openGuide} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Install Guide
            </Button>
            <Button variant="outline" onClick={() => void checkFiles()} className="gap-2" disabled={isChecking}>
              {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Check Files
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-primary" />
              Extension Files Status
            </CardTitle>
            <CardDescription>
              {availableCount}/{REQUIRED_FILES.length} required files available from web path{" "}
              <code className="text-xs">{EXTENSION_BASES[0]}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px] pr-3">
              <div className="space-y-2">
                {REQUIRED_FILES.map((filename) => {
                  const status = fileChecks.find((item) => item.name === filename);
                  const available = Boolean(status?.available);
                  return (
                    <div
                      key={filename}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-foreground">{filename}</span>
                      {available ? (
                        <Badge variant="outline" className="gap-1 border-green-500/40 text-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                          <XCircle className="h-3 w-3" />
                          Missing
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            {!allAvailable && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Some files are not served from the app URL. You can still install via{" "}
                    <strong>Load unpacked</strong> using the local <code>chrome-extension</code> folder.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>Fast actions for manual installation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-card/50 p-3">
              <p className="text-xs text-muted-foreground">Manifest version</p>
              <p className="font-semibold">{manifestVersion ?? "Not detected"}</p>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => void handleCopyFolder()}>
              <Copy className="h-4 w-4" />
              Copy folder name
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => void handleCopySteps()}>
              <Copy className="h-4 w-4" />
              Copy install steps
            </Button>
            <p className="text-xs text-muted-foreground">
              Open browser extensions page, enable Developer mode, then load the <code>chrome-extension</code> folder.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
