import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import HighConvertingTemplateGallery from "@/components/HighConvertingTemplateGallery";
import { EmailTemplate } from "@/lib/highConvertingTemplates";
import { toast } from "sonner";

export default function TemplateGallery() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    toast.success(`Template "${template.name}" selected! In the full dashboard, this would be loaded into the email composer.`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard-demo">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold">📧 Email Template Gallery</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <HighConvertingTemplateGallery 
          onSelectTemplate={handleSelectTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />
      </main>

      {/* Selected Template Banner */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-4 px-6 shadow-lg animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">Selected: {selectedTemplate.name}</p>
              <p className="text-sm opacity-80">{selectedTemplate.industry} • {selectedTemplate.category}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setSelectedTemplate(null)}
              >
                Clear Selection
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 hover:bg-white/20"
                onClick={() => toast.info("In the full dashboard, this would open the email composer with this template loaded.")}
              >
                Continue to Email Composer →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
