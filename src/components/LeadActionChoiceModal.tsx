import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Mail, 
  Sparkles, 
  ArrowRight,
  Building2,
  User,
  MapPin,
  Globe,
  Star,
  Clock,
  Hash,
  FileText,
  Settings2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
}

interface LeadActionChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: Lead[];
  onCallSelected: () => void;
  onEmailSelected: () => void;
  onAIVerifySelected: () => void;
}

const FIELD_OPTIONS = [
  { id: 'business_name', label: 'Business Name', icon: Building2, category: 'basic' },
  { id: 'owner_name', label: 'Owner Name', icon: User, category: 'basic' },
  { id: 'category', label: 'Business Category', icon: Hash, category: 'basic' },
  { id: 'phone', label: 'Phone Number', icon: Phone, category: 'contact' },
  { id: 'email', label: 'Email Address', icon: Mail, category: 'contact' },
  { id: 'website', label: 'Website URL', icon: Globe, category: 'contact' },
  { id: 'address', label: 'Full Address', icon: MapPin, category: 'details' },
  { id: 'business_hours', label: 'Business Hours', icon: Clock, category: 'details' },
  { id: 'rating', label: 'Google Rating', icon: Star, category: 'analysis' },
  { id: 'reviews_count', label: 'Review Count', icon: FileText, category: 'analysis' },
  { id: 'website_platform', label: 'Website Platform', icon: Globe, category: 'analysis' },
  { id: 'website_issues', label: 'Website Issues', icon: Settings2, category: 'analysis' },
];

const DEFAULT_FIELDS = ['business_name', 'phone', 'email', 'website', 'address', 'rating'];

export default function LeadActionChoiceModal({
  open,
  onOpenChange,
  selectedLeads,
  onCallSelected,
  onEmailSelected,
  onAIVerifySelected,
}: LeadActionChoiceModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(FIELD_OPTIONS.map(f => f.id));
  };

  const clearFields = () => {
    setSelectedFields([]);
  };

  const hotLeads = selectedLeads.filter(l => l.aiClassification === 'hot').length;
  const warmLeads = selectedLeads.filter(l => l.aiClassification === 'warm').length;
  const coldLeads = selectedLeads.filter(l => l.aiClassification === 'cold').length;
  const leadsWithPhone = selectedLeads.filter(l => l.phone).length;
  const leadsWithEmail = selectedLeads.filter(l => l.email).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            🎯 What would you like to do?
          </DialogTitle>
          <DialogDescription>
            You have <span className="font-bold text-foreground">{selectedLeads.length} leads</span> selected. Choose your next action.
          </DialogDescription>
        </DialogHeader>

        {/* Lead Summary */}
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          {hotLeads > 0 && (
            <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
              🔥 {hotLeads} Hot
            </Badge>
          )}
          {warmLeads > 0 && (
            <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
              🌡️ {warmLeads} Warm
            </Badge>
          )}
          {coldLeads > 0 && (
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
              ❄️ {coldLeads} Cold
            </Badge>
          )}
          <div className="w-px h-5 bg-border mx-1" />
          <Badge variant="outline" className="gap-1">
            <Phone className="w-3 h-3" /> {leadsWithPhone} with phone
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Mail className="w-3 h-3" /> {leadsWithEmail} with email
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Call Option */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              onOpenChange(false);
              onCallSelected();
            }}
            className="w-full p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Phone className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg flex items-center gap-2">
                  📞 Call Leads
                  <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">No AI needed</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Start calling immediately with your AI voice agent
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.button>

          {/* Email Option */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              onOpenChange(false);
              onEmailSelected();
            }}
            className="w-full p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg flex items-center gap-2">
                  ✉️ Email Leads
                  <Badge className="bg-blue-500/20 text-blue-600 text-xs">No AI needed</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Send emails now using your templates
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.button>

          {/* AI Verify Option */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              onOpenChange(false);
              onAIVerifySelected();
            }}
            className="w-full p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg flex items-center gap-2">
                  ✨ AI Verify First
                  <Badge className="bg-amber-500/20 text-amber-600 text-xs">Uses credits</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Get verified data, lead scores & personalized messages
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.button>
        </div>

        {/* Field Selector Toggle */}
        <div className="pt-2 border-t">
          <button
            onClick={() => setShowFieldSelector(!showFieldSelector)}
            className="w-full flex items-center justify-between p-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Customize which fields you want ({selectedFields.length} selected)
            </span>
            <span className="text-xs">{showFieldSelector ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showFieldSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 p-3 rounded-lg bg-muted/30 border"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Select the data you need:</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllFields} className="text-xs h-7">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFields} className="text-xs h-7">
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[180px]">
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_OPTIONS.map((field) => {
                    const Icon = field.icon;
                    const isSelected = selectedFields.includes(field.id);
                    return (
                      <label
                        key={field.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleField(field.id)}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{field.label}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </div>

        {/* Quick Tip */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-medium">Pro tip:</span> AI Verification gives you better conversion rates, 
            but you can call or email right away if you prefer speed!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
