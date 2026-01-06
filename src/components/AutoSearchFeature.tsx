import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  Mail,
  Calendar,
  Zap,
  FileSpreadsheet,
  Clock,
  MapPin,
  Crown,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface AutoSearchConfig {
  searchQuery: string;
  location: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  emailFormat: 'csv' | 'excel' | 'both';
  maxLeads: number;
  includeVerification: boolean;
  sendTime: string;
}

export default function AutoSearchFeature() {
  const { t } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  const [config, setConfig] = useState<AutoSearchConfig>({
    searchQuery: '',
    location: '',
    frequency: 'weekly',
    emailFormat: 'csv',
    maxLeads: 100,
    includeVerification: true,
    sendTime: '09:00',
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '📆' },
    { value: 'biweekly', label: 'Every 2 Weeks', icon: '🗓️' },
    { value: 'monthly', label: 'Monthly', icon: '📋' },
  ];

  const benefits = [
    { icon: Bot, text: 'AI runs searches while you sleep' },
    { icon: FileSpreadsheet, text: 'Fresh leads delivered as CSV/Excel' },
    { icon: Mail, text: 'Direct to your inbox on schedule' },
    { icon: Zap, text: 'Optional AI verification included' },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-4">
            <Crown className="w-3 h-3 mr-1" />
            {t('autoSearch.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t('autoSearch.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('autoSearch.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Configuration Card */}
          <Card className="p-6 border-2 border-amber-500/30 bg-gradient-to-br from-card to-amber-500/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Auto-Search Setup</h3>
                  <p className="text-xs text-muted-foreground">Configure your autopilot</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-enable" className="text-xs text-muted-foreground">
                  {isEnabled ? 'Active' : 'Paused'}
                </Label>
                <Switch
                  id="auto-enable"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Search Query */}
              <div className="space-y-2">
                <Label className="text-sm">Search Query</Label>
                <Input
                  placeholder="e.g., restaurants, dentists, plumbers..."
                  value={config.searchQuery}
                  onChange={(e) => setConfig({ ...config, searchQuery: e.target.value })}
                  className="bg-background"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location
                </Label>
                <Input
                  placeholder="e.g., Austin, TX or New York, NY"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  className="bg-background"
                />
              </div>

              {/* Frequency & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Frequency
                  </Label>
                  <Select
                    value={config.frequency}
                    onValueChange={(v) => setConfig({ ...config, frequency: v as any })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <span>{opt.icon}</span>
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Delivery Time
                  </Label>
                  <Input
                    type="time"
                    value={config.sendTime}
                    onChange={(e) => setConfig({ ...config, sendTime: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Format & Max Leads */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Email Format</Label>
                  <Select
                    value={config.emailFormat}
                    onValueChange={(v) => setConfig({ ...config, emailFormat: v as any })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">📄 CSV Only</SelectItem>
                      <SelectItem value="excel">📊 Excel Only</SelectItem>
                      <SelectItem value="both">📁 Both Formats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Max Leads/Batch</Label>
                  <Select
                    value={config.maxLeads.toString()}
                    onValueChange={(v) => setConfig({ ...config, maxLeads: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 leads</SelectItem>
                      <SelectItem value="100">100 leads</SelectItem>
                      <SelectItem value="250">250 leads</SelectItem>
                      <SelectItem value="500">500 leads ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Verification Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Include AI Verification</p>
                    <p className="text-xs text-muted-foreground">Pre-verify leads before delivery</p>
                  </div>
                </div>
                <Switch
                  checked={config.includeVerification}
                  onCheckedChange={(v) => setConfig({ ...config, includeVerification: v })}
                />
              </div>
            </div>
          </Card>

          {/* Benefits & CTA Card */}
          <div className="space-y-6">
            {/* Benefits List */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Why Autopilot?
              </h3>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pricing Preview */}
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Add-On Pricing</p>
                  <p className="text-2xl font-bold text-foreground">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  Save 10+ hours/week
                </Badge>
              </div>
              
              <ul className="space-y-2 mb-6">
                {[
                  'Unlimited auto-searches',
                  'CSV & Excel delivery',
                  'Custom scheduling',
                  'AI verification included',
                  'Priority support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link to="/pricing">
                <Button className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  {t('common.upgrade')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
