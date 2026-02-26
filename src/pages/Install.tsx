import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Monitor, Smartphone, CheckCircle, ArrowRight, Zap, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("Use your browser menu → 'Install App' or 'Add to Home Screen'");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("BamLead installed! Check your desktop or app drawer.");
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: <Zap className="w-6 h-6" />, title: "Launch Instantly", desc: "Open BamLead from your desktop or taskbar — no browser needed" },
    { icon: <Globe className="w-6 h-6" />, title: "Works Offline", desc: "Core features available even without internet" },
    { icon: <Shield className="w-6 h-6" />, title: "Auto Updates", desc: "Always get the latest version automatically" },
    { icon: <Monitor className="w-6 h-6" />, title: "Native Feel", desc: "Full-screen app experience, no browser toolbar" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Monitor className="w-4 h-4" /> Desktop App Available
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Install BamLead on Your Desktop
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Get instant access to your leads, campaigns, and AI tools — right from your desktop. No browser required.
          </p>

          {isInstalled ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 rounded-full px-6 py-3 text-lg font-semibold">
              <CheckCircle className="w-5 h-5" /> BamLead is installed!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleInstall}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-lg px-8 py-6 rounded-xl shadow-lg"
              >
                <Download className="w-5 h-5" />
                {deferredPrompt ? "Install BamLead" : "Install from Browser"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open("/dashboard", "_self")}
                className="gap-2"
              >
                Continue in Browser <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="border-border bg-card/50 h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{b.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <Card className="border-border bg-card/50 mb-12">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> How to Install
            </h2>

            {isIOS ? (
              <div className="space-y-3">
                <Step n={1} text='Open bamlead.com in Safari' />
                <Step n={2} text='Tap the Share button (box with arrow)' />
                <Step n={3} text='Scroll down and tap "Add to Home Screen"' />
                <Step n={4} text='Tap "Add" — BamLead now appears as an app!' />
              </div>
            ) : (
              <div className="space-y-3">
                <Step n={1} text='Visit bamlead.com in Chrome, Edge, or Brave' />
                <Step n={2} text='Click the install icon in the address bar (or browser menu → "Install App")' />
                <Step n={3} text='Click "Install" in the popup' />
                <Step n={4} text='BamLead opens as a standalone app — pin it to your taskbar!' />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
        {n}
      </span>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

export default Install;
