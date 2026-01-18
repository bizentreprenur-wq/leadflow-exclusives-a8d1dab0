import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, FileText, Loader2, Lock, Crown, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface UserManualDownloadProps {
  isPaidUser: boolean;
  planName?: string;
  onUpgrade?: () => void;
}

export default function UserManualDownload({ isPaidUser, planName, onUpgrade }: UserManualDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!isPaidUser) {
      toast.error('Manual download requires a paid subscription');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating your manual...');

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        
        lines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += fontSize * 0.5;
        });
        yPos += 5;
      };

      const addSection = (title: string) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        yPos += 10;
        doc.setDrawColor(20, 184, 166);
        doc.setFillColor(20, 184, 166);
        doc.rect(margin, yPos - 6, 4, 10, 'F');
        addText(title, 16, true);
        yPos += 5;
      };

      // Cover Page
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, 297, 'F');
      
      doc.setTextColor(20, 184, 166);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text('BamLead', pageWidth / 2, 80, { align: 'center' });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('User Manual', pageWidth / 2, 100, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Lead Generation & Outreach Platform', pageWidth / 2, 120, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 250, { align: 'center' });
      doc.text(`Plan: ${planName || 'Pro'}`, pageWidth / 2, 260, { align: 'center' });

      // Page 2 - Table of Contents
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      yPos = 20;
      
      addText('Table of Contents', 20, true);
      yPos += 10;
      
      const toc = [
        '1. Getting Started',
        '2. Lead Generation',
        '3. AI Lead Scoring',
        '4. Email Outreach',
        '5. Email Template Editor',
        '6. CRM Integrations',
        '7. Voice Calling',
        '8. Settings & SMTP',
        '9. Best Practices',
        '10. Troubleshooting',
      ];
      
      toc.forEach(item => addText(item, 12));

      // Page 3 - Getting Started
      doc.addPage();
      yPos = 20;
      
      addSection('1. Getting Started');
      addText('Welcome to BamLead! This platform helps you find, verify, and contact potential leads for your business.');
      addText('');
      addText('Dashboard Overview:', 14, true);
      addText('• Step 1: Search for leads using Google Maps or Platform Scanner');
      addText('• Step 2: Review and verify leads with AI scoring');
      addText('• Step 3: Send personalized email campaigns');
      addText('• Step 4: Track calls and manage your CRM');

      // Page 4 - Lead Generation
      addSection('2. Lead Generation');
      addText('Two Powerful Search Methods:', 14, true);
      addText('');
      addText('Option A: Local Business Search', 12, true);
      addText('Search Google Maps for businesses by location and industry. Perfect for local service providers.');
      addText('');
      addText('Option B: Website Scanner', 12, true);
      addText('Find businesses with outdated websites that need your services. Great for web designers and agencies.');

      // Page 5 - AI Lead Scoring
      doc.addPage();
      yPos = 20;
      
      addSection('3. AI Lead Scoring');
      addText('Our AI analyzes each lead and provides:', 14, true);
      addText('• Conversion Score (0-100): Higher scores = higher conversion probability');
      addText('• Priority Level: Hot, Warm, or Nurture');
      addText('• Pain Points: Identified issues you can help solve');
      addText('• Recommended Approach: Best outreach strategy for each lead');
      addText('');
      addText('Using AI Verify:', 14, true);
      addText('Click the "AI VERIFY LEADS" button to analyze all your leads at once. This uses 0 credits!');

      // Page 6 - Email Outreach
      addSection('4. Email Outreach');
      addText('Email sending works through YOUR own SMTP server:', 14, true);
      addText('');
      addText('Important: Emails are sent from your configured email address, not from BamLead servers.');
      addText('This ensures better deliverability and your brand stays consistent.');
      addText('');
      addText('Setup Steps:', 12, true);
      addText('1. Go to Settings > Email Configuration');
      addText('2. Enter your SMTP credentials (host, port, email, password)');
      addText('3. Test your connection');
      addText('4. Start sending personalized emails!');

      // Page 7 - Template Editor
      doc.addPage();
      yPos = 20;
      
      addSection('5. Email Template Editor');
      addText('You can fully customize any email template:', 14, true);
      addText('');
      addText('1. Select a template from the gallery');
      addText('2. Click "Edit & Customize" to open the editor');
      addText('3. Modify subject line and email body');
      addText('4. Preview your changes in real-time');
      addText('5. Save as a new template or use directly');
      addText('');
      addText('Available Placeholders:', 12, true);
      addText('{{first_name}} - Lead\'s first name');
      addText('{{business_name}} - Business name');
      addText('{{website}} - Lead\'s website URL');

      // Page 8 - CRM Integrations
      addSection('6. CRM Integrations');
      addText('Connect your favorite CRM platforms:', 14, true);
      addText('');
      addText('Supported Platforms:', 12, true);
      addText('• HubSpot - Full OAuth integration');
      addText('• Salesforce - Full OAuth integration');
      addText('• Pipedrive - Full OAuth integration');
      addText('• Google Sheets - Export via Google Drive');
      addText('• Excel/CSV - Direct download');

      // Page 9 - Voice Calling
      doc.addPage();
      yPos = 20;
      
      addSection('7. Voice Calling');
      addText('Make calls directly from the dashboard:', 14, true);
      addText('');
      addText('1. Click the phone icon next to any lead');
      addText('2. Use our AI call script suggestions');
      addText('3. Log call outcomes for tracking');
      addText('4. Schedule follow-up reminders');

      // Page 10 - Settings & SMTP
      addSection('8. Settings & SMTP Configuration');
      addText('SMTP Setup for Email Sending:', 14, true);
      addText('');
      addText('Your emails are sent through YOUR email server. Common settings:');
      addText('');
      addText('For Gmail:', 12, true);
      addText('• Host: smtp.gmail.com');
      addText('• Port: 587 (TLS) or 465 (SSL)');
      addText('• Use App Password (not your regular password)');
      addText('');
      addText('For Custom Domain (Hostinger/cPanel):', 12, true);
      addText('• Host: mail.yourdomain.com or smtp.hostinger.com');
      addText('• Port: 465 (SSL)');
      addText('• Use your email credentials');

      // Page 11 - Best Practices
      doc.addPage();
      yPos = 20;
      
      addSection('9. Best Practices');
      addText('Email Deliverability Tips:', 14, true);
      addText('• Use drip sending (50-100 emails/hour max)');
      addText('• Personalize each email with placeholders');
      addText('• Avoid spam trigger words');
      addText('• Warm up new email accounts slowly');
      addText('• Keep unsubscribe links visible');
      addText('');
      addText('Lead Conversion Tips:', 14, true);
      addText('• Focus on Hot leads first');
      addText('• Follow up within 24 hours');
      addText('• Use AI-suggested pain points in your pitch');
      addText('• Track and learn from successful conversions');

      // Page 12 - Troubleshooting
      addSection('10. Troubleshooting');
      addText('Common Issues & Solutions:', 14, true);
      addText('');
      addText('Emails not sending?', 12, true);
      addText('→ Verify SMTP credentials in Settings');
      addText('→ Check firewall/port access');
      addText('→ Test connection with "Send Test Email"');
      addText('');
      addText('Search not returning results?', 12, true);
      addText('→ Try broader search terms');
      addText('→ Check your internet connection');
      addText('→ Contact support if issue persists');
      addText('');
      addText('Need more help?', 12, true);
      addText('Email: support@bamlead.com');
      addText('Dashboard: Click "Contact us now" in sidebar');

      // Save the PDF
      doc.save('BamLead-User-Manual.pdf');
      toast.success('Manual downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate manual. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={`border-2 ${isPaidUser ? 'border-primary/30 bg-primary/5' : 'border-muted'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPaidUser ? 'bg-primary/20' : 'bg-muted'}`}>
              <FileText className={`w-5 h-5 ${isPaidUser ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                User Manual
                {isPaidUser ? (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Included
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Pro Feature
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Complete guide to using BamLead
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a comprehensive PDF manual covering lead generation, email setup, 
            AI scoring, CRM integrations, and best practices.
          </p>
          
          {isPaidUser ? (
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Manual
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={onUpgrade}
              variant="outline"
              className="w-full gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
