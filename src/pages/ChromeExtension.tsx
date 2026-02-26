import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Chrome, Globe, Shield, Zap, CheckCircle, Copy, ExternalLink, Smartphone, Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EXTENSION_FILES = [
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

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "One-Click Extract", desc: "Extract emails, phones & social links from any webpage instantly" },
  { icon: <Globe className="w-5 h-5" />, title: "Website Analysis", desc: "SEO scores, platform detection, analytics & load time insights" },
  { icon: <Monitor className="w-5 h-5" />, title: "Bulk Import", desc: "Paste up to 50 URLs and batch-extract contacts automatically" },
  { icon: <Shield className="w-5 h-5" />, title: "100% Private", desc: "All data stays in your browser — no external servers or APIs" },
];

const browsers = [
  { name: "Google Chrome", urlPrefix: "chrome://extensions", icon: "🌐" },
  { name: "Microsoft Edge", urlPrefix: "edge://extensions", icon: "🔷" },
  { name: "Brave", urlPrefix: "brave://extensions", icon: "🦁" },
  { name: "Opera", urlPrefix: "opera://extensions", icon: "🔴" },
];

const steps = [
  { num: 1, title: "Download the files", desc: "Click the button above to download all extension files as a ZIP, or clone from GitHub." },
  { num: 2, title: "Unzip the folder", desc: "Extract the downloaded ZIP file to any folder on your computer." },
  { num: 3, title: "Open extensions page", desc: "Navigate to your browser's extension page (see below) and enable Developer Mode." },
  { num: 4, title: "Load unpacked", desc: 'Click "Load unpacked" and select the extracted chrome-extension folder.' },
];

const ChromeExtension = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder("bamlead-chrome-extension");

      // Try multiple base URLs so the download works from any environment
      const bases = [
        `${window.location.origin}/chrome-extension`,
        'https://bamlead.com/chrome-extension',
      ];

      let filesLoaded = 0;
      const failedFiles: string[] = [];

      for (const fileName of EXTENSION_FILES) {
        let fetched = false;
        for (const base of bases) {
          try {
            const resp = await fetch(`${base}/${fileName}`, { cache: 'no-cache' });
            if (!resp.ok) continue;

            const ct = resp.headers.get('content-type') || '';
            // Reject HTML responses for non-HTML files (SPA fallback detection)
            if (ct.includes('text/html') && !fileName.endsWith('.html')) continue;

            if (fileName.endsWith('.png')) {
              const buf = await resp.arrayBuffer();
              // Validate PNG magic bytes (89 50 4E 47)
              const header = new Uint8Array(buf.slice(0, 4));
              if (header[0] !== 0x89 || header[1] !== 0x50) continue;
              folder!.file(fileName, buf);
            } else {
              const text = await resp.text();
              // Reject if we got HTML for a JS/CSS/JSON file
              if (!fileName.endsWith('.html') && text.trimStart().startsWith('<!')) continue;
              folder!.file(fileName, text);
            }
            filesLoaded++;
            fetched = true;
            break;
          } catch {
            // try next base
          }
        }
        if (!fetched) failedFiles.push(fileName);
      }

      if (filesLoaded < 5) {
        toast.error(`Could not fetch extension files: ${failedFiles.join(', ')}. Try again or contact support.`);
        setDownloading(false);
        return;
      }

      if (failedFiles.length > 0) {
        console.warn('Missing extension files:', failedFiles);
      }

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });

      // Use a more reliable download method
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "bamlead-chrome-extension.zip";
      document.body.appendChild(a);
      a.click();
      // Delay cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success(`Extension downloaded (${filesLoaded} files)! Follow the installation steps below.`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Please try again.");
    }
    setDownloading(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`Copied: ${url}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-2">
              <Chrome className="w-4 h-4 mr-2" />
              Browser Extension v1.4.0
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
              BamLead for<br />
              <span className="text-primary">Your Browser</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Extract leads from any website with one click. Works on Chrome, Edge, Brave, Opera & all Chromium browsers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleDownloadZip}
                disabled={downloading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl gap-3"
              >
                <Download className="w-5 h-5" />
                {downloading ? "Packaging..." : "Download Extension ZIP"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-8 py-6 text-lg rounded-xl gap-3"
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-card/50">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-border bg-card h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-4">
              Install in 4 Steps
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              No app store required — load directly from your computer.
            </p>

            <div className="space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browser URLs */}
      <section className="py-16 bg-card/50">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
              Extension Pages by Browser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {browsers.map((b) => (
                <Card key={b.name} className="border-border bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <p className="font-medium text-foreground text-sm">{b.name}</p>
                        <code className="text-xs text-primary font-mono">{b.urlPrefix}</code>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(b.urlPrefix)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6">
              Paste the URL into your browser's address bar, enable Developer Mode, then click "Load unpacked".
            </p>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8">What's Included</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Extract emails & phones",
                "Social media links",
                "SEO scoring",
                "Platform detection",
                "Save & search leads",
                "CSV & PDF export",
                "Bulk import (50 URLs)",
                "Floating page button",
                "Contact highlighter",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-left bg-card border border-border rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Ready to extract leads?</h2>
          <p className="text-muted-foreground mb-8">Download now and start prospecting in under 2 minutes.</p>
          <Button
            size="lg"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl gap-3"
          >
            <Download className="w-5 h-5" />
            {downloading ? "Packaging..." : "Download Extension"}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ChromeExtension;
