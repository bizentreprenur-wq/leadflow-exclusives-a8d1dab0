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
    toast.info('Generating your comprehensive manual...');

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

      const addSubSection = (title: string) => {
        yPos += 5;
        doc.setDrawColor(147, 51, 234);
        doc.setFillColor(147, 51, 234);
        doc.rect(margin + 5, yPos - 5, 3, 8, 'F');
        addText(title, 13, true);
        yPos += 3;
      };

      // Cover Page
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, 297, 'F');
      
      doc.setTextColor(20, 184, 166);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text('BamLead', pageWidth / 2, 70, { align: 'center' });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Complete User Manual', pageWidth / 2, 95, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered B2B Lead Generation & Outreach Platform', pageWidth / 2, 115, { align: 'center' });
      
      doc.setTextColor(147, 51, 234);
      doc.setFontSize(12);
      doc.text('Including 8 Revolutionary AI Agents', pageWidth / 2, 135, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 240, { align: 'center' });
      doc.text(`Plan: ${planName || 'Pro'}`, pageWidth / 2, 250, { align: 'center' });
      doc.text('Version 2.0 - Complete AI Edition', pageWidth / 2, 260, { align: 'center' });

      // Page 2 - Table of Contents
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      yPos = 20;
      
      addText('Table of Contents', 20, true);
      yPos += 10;
      
      const toc = [
        '1. Getting Started',
        '2. Lead Generation',
        '3. AI Lead Scoring & Verification',
        '4. Email Outreach & Templates',
        '5. Drip Campaigns & Automation',
        '6. CRM Integrations',
        '7. Voice Calling',
        '8. Revolutionary AI Agents',
        '   8.1 Pre-Intent Detection',
        '   8.2 Emotional State Detection',
        '   8.3 Reverse Lead Discovery',
        '   8.4 Outcome Simulator',
        '   8.5 Psychological Profiler',
        '   8.6 Invisible Negotiator',
        '   8.7 Live Page Mutation',
        '   8.8 AI Founder Mirror',
        '9. Settings & SMTP Configuration',
        '10. Best Practices',
        '11. Troubleshooting',
      ];
      
      toc.forEach(item => addText(item, 12));

      // Page 3 - Getting Started
      doc.addPage();
      yPos = 20;
      
      addSection('1. Getting Started');
      addText('Welcome to BamLead! The AI-powered platform that helps you find, verify, and contact potential leads with unprecedented intelligence.');
      addText('');
      addText('Dashboard Overview:', 14, true);
      addText('• Step 1: Search for leads using Google Maps or Platform Scanner');
      addText('• Step 2: AI-Verify leads with intelligent scoring');
      addText('• Step 3: Send personalized email campaigns');
      addText('• Step 4: Track calls, manage CRM, and use AI Agents');
      addText('');
      addText('Key Features:', 14, true);
      addText('• Dual Search: Local business search + Website scanner');
      addText('• AI Verification: Intelligent lead scoring and insights');
      addText('• 80+ Email Templates: High-converting templates for every industry');
      addText('• 8 AI Agents: Revolutionary tools for advanced outreach');

      // Page 4 - Lead Generation
      addSection('2. Lead Generation');
      addText('Two Powerful Search Methods:', 14, true);
      addText('');
      addText('Option A: Local Business Search', 12, true);
      addText('Search Google Maps for businesses by location and industry. Perfect for local service providers, agencies, and B2B sales.');
      addText('');
      addText('Option B: Agency Lead Finder', 12, true);
      addText('Built for website designers, social media marketers & agencies. Find businesses that need professional help with their online presence.');
      addText('');
      addText('Search Best Practices:', 12, true);
      addText('• Use specific industry keywords (e.g., "dental clinic" not just "dentist")');
      addText('• Include city/region for location-based searches');
      addText('• Try multiple search variations for best results');

      // Page 5 - AI Lead Scoring
      doc.addPage();
      yPos = 20;
      
      addSection('3. AI Lead Scoring & Verification');
      addText('Our AI analyzes each lead and provides:', 14, true);
      addText('• Conversion Score (0-100): Higher scores = higher conversion probability');
      addText('• Priority Level: Hot (80+), Warm (50-79), or Nurture (<50)');
      addText('• Pain Points: Identified issues you can help solve');
      addText('• Recommended Approach: Best outreach strategy for each lead');
      addText('• Website Analysis: Technical insights about their online presence');
      addText('');
      addText('Using AI Verify:', 14, true);
      addText('1. Select your leads from the search results');
      addText('2. Click "AI VERIFY LEADS" button');
      addText('3. AI analyzes websites, social presence, and data patterns');
      addText('4. Review Hot, Warm, and Nurture categories');
      addText('5. Focus on Hot leads for immediate outreach');

      // Page 6 - Email Outreach
      addSection('4. Email Outreach & Templates');
      addText('Email sending works through YOUR own SMTP server:', 14, true);
      addText('');
      addText('Important: Emails are sent from your configured email address, not from BamLead servers. This ensures better deliverability and brand consistency.');
      addText('');
      addText('Template Gallery:', 12, true);
      addText('Access 80+ high-converting templates organized by industry:');
      addText('• Sales & Business Development');
      addText('• Marketing & Advertising');
      addText('• Recruiting & HR');
      addText('• Consulting & Professional Services');
      addText('• Web Design & Development');
      addText('• Real Estate & Property');

      // Page 7 - Drip Campaigns
      doc.addPage();
      yPos = 20;
      
      addSection('5. Drip Campaigns & Automation');
      addText('Automate your outreach with intelligent drip sequences:', 14, true);
      addText('');
      addText('Delivery Modes:', 12, true);
      addText('• Instant: Send all emails immediately');
      addText('• Drip: Stagger delivery (recommended: 20-50/hour)');
      addText('• Scheduled: Set specific send date/time');
      addText('');
      addText('Auto Campaign Wizard:', 12, true);
      addText('Let AI create optimized campaigns automatically:');
      addText('1. Select target industry and audience');
      addText('2. AI analyzes lead data and patterns');
      addText('3. Review suggested email sequences');
      addText('4. Customize timing and follow-up rules');
      addText('5. Activate with one click');

      // Page 8 - CRM Integrations
      addSection('6. CRM Integrations');
      addText('Connect your favorite CRM platforms:', 14, true);
      addText('');
      addText('Supported Platforms:', 12, true);
      addText('• HubSpot - Full OAuth integration with property mapping');
      addText('• Salesforce - Full OAuth integration with object sync');
      addText('• Pipedrive - Full OAuth integration with deal creation');
      addText('• Google Sheets - Export via Google Drive');
      addText('• Excel/CSV - Direct download for any CRM');
      addText('');
      addText('Setup Steps:', 12, true);
      addText('1. Go to Step 4: Outreach Hub → CRM Integration');
      addText('2. Select your CRM platform');
      addText('3. Complete OAuth authorization');
      addText('4. Map lead fields to CRM properties');
      addText('5. Export leads with one click');

      // Page 9 - Voice Calling
      doc.addPage();
      yPos = 20;
      
      addSection('7. Voice Calling');
      addText('Make calls directly from the dashboard:', 14, true);
      addText('');
      addText('Call Features:', 12, true);
      addText('1. Click the phone icon next to any lead');
      addText('2. View AI call script suggestions');
      addText('3. Initiate call using your phone');
      addText('4. Log call outcomes: Answered, Voicemail, No Answer');
      addText('5. Add notes for follow-up actions');
      addText('6. View call history in Call Log panel');
      addText('');
      addText('AI Call Scripts:', 12, true);
      addText('AI generates customized scripts based on:');
      addText('• Lead\'s industry and business type');
      addText('• Identified pain points');
      addText('• Previous interactions');
      addText('• Optimal talking points');

      // Pages 10-17 - Revolutionary AI Agents
      doc.addPage();
      yPos = 20;
      
      addSection('8. Revolutionary AI Agents');
      addText('BamLead features 8 exclusive AI agents that go beyond traditional lead generation. These advanced tools use behavioral analysis, psychological profiling, and predictive intelligence.', 12);
      addText('');

      // Agent 1: Pre-Intent Detection
      addSubSection('8.1 Pre-Intent Detection Agent');
      addText('Detects buying signals before prospects even know they\'re ready.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Monitors digital footprints across the web');
      addText('• Identifies behavioral micro-signals (job posts, tech stack changes)');
      addText('• Calculates intent score and buying readiness');
      addText('• Recommends optimal outreach timing');
      addText('');
      addText('Use case: Reach prospects at the perfect moment before competitors.');

      // Agent 2: Emotional State Detection
      doc.addPage();
      yPos = 20;
      
      addSubSection('8.2 Emotional State Detection Agent');
      addText('Analyzes prospect emotional state for optimal outreach timing.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Analyzes recent communications and social posts');
      addText('• Detects frustration, urgency, or satisfaction levels');
      addText('• Creates emotional timeline and patterns');
      addText('• Suggests "Best Time to Reach" windows');
      addText('• Adjusts email tone recommendations');
      addText('');
      addText('Result: 3x higher response rates by matching emotional timing.');

      // Agent 3: Reverse Lead Discovery
      addSubSection('8.3 Reverse Lead Discovery Agent');
      addText('Finds leads that are actively searching for your services.');
      addText('');
      addText('How it works:', 12, true);
      addText('• You define your service offerings and keywords');
      addText('• AI monitors search intent signals');
      addText('• Identifies companies researching your solutions');
      addText('• Shows specific terms they\'re researching');
      addText('• Prioritizes these high-intent leads');
      addText('');
      addText('Use case: Stop chasing cold leads—let warm leads come to you.');

      // Agent 4: Outcome Simulator
      addSubSection('8.4 Outcome Simulator Agent');
      addText('Predicts campaign outcomes before you send.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Create your email campaign as usual');
      addText('• Click "Simulate Outcomes"');
      addText('• AI predicts open rates, reply rates, conversions');
      addText('• View expected ROI and revenue projections');
      addText('• Compare different subject lines and content');
      addText('');
      addText('Benefit: Send with confidence knowing expected results.');

      // Agent 5: Psychological Profiler
      doc.addPage();
      yPos = 20;
      
      addSubSection('8.5 Psychological Profiler Agent');
      addText('Creates detailed buyer personas for personalized outreach.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Select a lead to analyze');
      addText('• AI builds profile from public data');
      addText('• Reveals communication style preferences');
      addText('• Identifies decision-making patterns');
      addText('• Shows persuasion triggers and pain points');
      addText('');
      addText('Result: Personalized email angles that resonate.');

      // Agent 6: Invisible Negotiator
      addSubSection('8.6 Invisible Negotiator Agent');
      addText('AI-powered negotiation assistance for closing deals.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Activate when lead shows purchase interest');
      addText('• AI analyzes negotiation leverage points');
      addText('• Get real-time response suggestions');
      addText('• View optimal pricing strategies');
      addText('• Handle objections with AI-crafted responses');
      addText('');
      addText('Use case: Close deals faster with strategic guidance.');

      // Agent 7: Live Page Mutation
      addSubSection('8.7 Live Page Mutation Agent');
      addText('Real-time content personalization for each prospect.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Share your landing page with prospects');
      addText('• AI detects visitor identity and company');
      addText('• Page content adapts in real-time');
      addText('• Headlines, images, and CTAs personalize');
      addText('• No coding required');
      addText('');
      addText('Result: Higher conversion rates through relevance.');

      // Agent 8: AI Founder Mirror
      doc.addPage();
      yPos = 20;
      
      addSubSection('8.8 AI Founder Mirror Agent');
      addText('Learns your communication style for authentic AI responses.');
      addText('');
      addText('How it works:', 12, true);
      addText('• Connect your email and calendar');
      addText('• AI learns your writing patterns and style');
      addText('• Review your "communication DNA" profile');
      addText('• Enable AI to draft responses in your voice');
      addText('• Approve or edit AI-drafted emails');
      addText('• Train the model with feedback');
      addText('');
      addText('Use case: Scale your personal touch to thousands of leads.');

      // Page - Settings & SMTP
      addSection('9. Settings & SMTP Configuration');
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

      // Page - Best Practices
      doc.addPage();
      yPos = 20;
      
      addSection('10. Best Practices');
      addText('Email Deliverability Tips:', 14, true);
      addText('• Use drip sending (50-100 emails/hour max)');
      addText('• Personalize each email with placeholders');
      addText('• Avoid spam trigger words');
      addText('• Warm up new email accounts slowly');
      addText('• Keep unsubscribe links visible');
      addText('');
      addText('AI Agent Best Practices:', 14, true);
      addText('• Start with Pre-Intent Detection for timing');
      addText('• Use Psychological Profiler for personalization');
      addText('• Simulate outcomes before large campaigns');
      addText('• Train Founder Mirror with your best emails');
      addText('');
      addText('Lead Conversion Tips:', 14, true);
      addText('• Focus on Hot leads first');
      addText('• Follow up within 24 hours');
      addText('• Use AI-suggested pain points in your pitch');
      addText('• Track and learn from successful conversions');

      // Page - Troubleshooting
      addSection('11. Troubleshooting');
      addText('Common Issues & Solutions:', 14, true);
      addText('');
      addText('Emails not sending?', 12, true);
      addText('→ Verify SMTP credentials in Settings');
      addText('→ Check firewall/port access');
      addText('→ Test connection with "Send Test Email"');
      addText('');
      addText('AI Agents not responding?', 12, true);
      addText('→ Ensure lead data is complete');
      addText('→ Wait for analysis to complete (may take 30-60s)');
      addText('→ Check internet connection');
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
      doc.save('BamLead-Complete-User-Manual.pdf');
      toast.success('Complete manual downloaded successfully!');
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
                Complete User Manual
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
                Comprehensive guide with 8 AI Agents documentation
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a comprehensive PDF manual covering lead generation, all 8 Revolutionary AI Agents, 
            email setup, CRM integrations, and best practices for maximum conversions.
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
                  Generating Complete Manual...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Complete PDF Manual
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