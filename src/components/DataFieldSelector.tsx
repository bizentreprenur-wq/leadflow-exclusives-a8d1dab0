import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, User, Phone, MapPin, Clock, Globe, 
  Mail, Star, Hash, FileText, ChevronDown, ChevronUp,
  Settings2
} from 'lucide-react';

export interface DataFieldOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'contact' | 'details' | 'analysis';
  default: boolean;
}

export const DATA_FIELD_OPTIONS: DataFieldOption[] = [
  // Basic Info
  { id: 'business_name', label: 'Business Name', description: 'Company/business name', icon: <Building2 className="w-4 h-4" />, category: 'basic', default: true },
  { id: 'owner_name', label: 'Owner Name', description: 'Business owner/contact name', icon: <User className="w-4 h-4" />, category: 'basic', default: true },
  { id: 'category', label: 'Business Category', description: 'Industry/category type', icon: <Hash className="w-4 h-4" />, category: 'basic', default: true },
  
  // Contact Info
  { id: 'phone', label: 'Phone Number', description: 'Business phone number', icon: <Phone className="w-4 h-4" />, category: 'contact', default: true },
  { id: 'email', label: 'Email Address', description: 'Contact email (AI enriched)', icon: <Mail className="w-4 h-4" />, category: 'contact', default: true },
  { id: 'website', label: 'Website URL', description: 'Business website address', icon: <Globe className="w-4 h-4" />, category: 'contact', default: true },
  
  // Location Details
  { id: 'address', label: 'Full Address', description: 'Street address, city, state, zip', icon: <MapPin className="w-4 h-4" />, category: 'details', default: true },
  { id: 'business_hours', label: 'Business Hours', description: 'Operating hours/schedule', icon: <Clock className="w-4 h-4" />, category: 'details', default: false },
  
  // Analysis Data
  { id: 'rating', label: 'Google Rating', description: 'Star rating from Google', icon: <Star className="w-4 h-4" />, category: 'analysis', default: true },
  { id: 'reviews_count', label: 'Review Count', description: 'Number of reviews', icon: <FileText className="w-4 h-4" />, category: 'analysis', default: false },
  { id: 'website_platform', label: 'Website Platform', description: 'WordPress, Wix, etc.', icon: <Globe className="w-4 h-4" />, category: 'analysis', default: true },
  { id: 'website_issues', label: 'Website Issues', description: 'Speed, mobile, security issues', icon: <Settings2 className="w-4 h-4" />, category: 'analysis', default: true },
];

interface DataFieldSelectorProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export default function DataFieldSelector({ selectedFields, onFieldsChange }: DataFieldSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      onFieldsChange(selectedFields.filter(f => f !== fieldId));
    } else {
      onFieldsChange([...selectedFields, fieldId]);
    }
  };

  const selectAll = () => {
    onFieldsChange(DATA_FIELD_OPTIONS.map(f => f.id));
  };

  const selectDefaults = () => {
    onFieldsChange(DATA_FIELD_OPTIONS.filter(f => f.default).map(f => f.id));
  };

  const categories = [
    { id: 'basic', label: '📋 Basic Info', color: 'primary' },
    { id: 'contact', label: '📞 Contact Info', color: 'emerald' },
    { id: 'details', label: '📍 Location', color: 'violet' },
    { id: 'analysis', label: '🔍 Analysis', color: 'amber' },
  ];

  return (
    <div className="border-2 border-border rounded-xl overflow-hidden">
      {/* Header - Always Visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-foreground">Choose Data Fields</h4>
            <p className="text-sm text-muted-foreground">
              {selectedFields.length} of {DATA_FIELD_OPTIONS.length} fields selected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {selectedFields.length} selected
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={selectAll}
            >
              ✅ Select All
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={selectDefaults}
            >
              🎯 Defaults Only
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              Click to customize what data you want for each lead
            </span>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {categories.map(category => {
              const categoryFields = DATA_FIELD_OPTIONS.filter(f => f.category === category.id);
              const selectedInCategory = categoryFields.filter(f => selectedFields.includes(f.id)).length;
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">
                      {category.label}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedInCategory}/{categoryFields.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryFields.map(field => (
                      <label
                        key={field.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedFields.includes(field.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/20 hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => toggleField(field.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{field.icon}</span>
                            <span className="font-medium text-foreground text-sm">{field.label}</span>
                            {field.default && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {field.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">📊 Your leads will include:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedFields.map(fieldId => {
                const field = DATA_FIELD_OPTIONS.find(f => f.id === fieldId);
                return field ? (
                  <Badge key={fieldId} variant="secondary" className="text-xs">
                    {field.icon}
                    <span className="ml-1">{field.label}</span>
                  </Badge>
                ) : null;
              })}
              {selectedFields.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No fields selected</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
