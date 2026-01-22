// Done For You Sample Proposals
// Outcome-based professional proposals ready to customize and send

export interface ProposalTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  scope: string[];
  timeline: string;
  deliverables: string[];
  investmentRange: string;
  defaultPrice: string;
  callToAction: string;
  colorAccent: string;
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'website-design',
    name: 'Website Design Proposal',
    category: 'Web Development',
    icon: '🎨',
    description: 'A complete custom website designed to convert visitors into customers. Mobile-responsive, fast-loading, and optimized for your target audience.',
    scope: [
      'Discovery call to understand your business goals and target audience',
      'Custom website design with up to 5 unique pages',
      'Mobile-responsive layout that works on all devices',
      'Contact form integration with email notifications',
      'Basic SEO setup (meta tags, sitemap, analytics)',
      'Content management system training',
      '30-day post-launch support'
    ],
    timeline: '2-4 weeks from project kickoff',
    deliverables: [
      'Fully functional custom website',
      'Mobile-responsive design',
      'Contact form with lead capture',
      'Google Analytics integration',
      'SSL certificate setup',
      'Training documentation'
    ],
    investmentRange: '$1,500 - $5,000',
    defaultPrice: '$2,500',
    callToAction: 'Ready to get started? Sign below to begin your website project.',
    colorAccent: 'blue'
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign / Fix Proposal',
    category: 'Web Development',
    icon: '🔧',
    description: 'Transform your outdated or underperforming website into a modern, conversion-focused digital presence.',
    scope: [
      'Comprehensive website audit and performance analysis',
      'User experience (UX) review and recommendations',
      'Complete visual redesign with modern aesthetics',
      'Speed optimization and performance improvements',
      'Mobile responsiveness fixes',
      'Content reorganization for better flow',
      'Conversion rate optimization elements'
    ],
    timeline: '2-3 weeks from approval',
    deliverables: [
      'Redesigned website with improved UX',
      'Performance optimization report',
      'Before/after comparison metrics',
      'Updated mobile experience',
      'Speed test documentation',
      'Ongoing maintenance recommendations'
    ],
    investmentRange: '$1,000 - $4,000',
    defaultPrice: '$2,000',
    callToAction: 'Approve this proposal to start transforming your website.',
    colorAccent: 'orange'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation Proposal',
    category: 'Marketing',
    icon: '🎯',
    description: 'A complete lead generation system designed to fill your pipeline with qualified prospects ready to buy.',
    scope: [
      'Target audience research and ideal customer profiling',
      'Lead magnet creation (eBook, checklist, or guide)',
      'Landing page design and development',
      'Email capture and automation setup',
      'Lead scoring system implementation',
      'Follow-up email sequence (5-7 emails)',
      'Monthly performance reporting'
    ],
    timeline: '3-4 weeks for full implementation',
    deliverables: [
      'Custom lead magnet asset',
      'High-converting landing page',
      'Email automation sequences',
      'Lead tracking dashboard',
      'Monthly lead reports',
      'Strategy documentation'
    ],
    investmentRange: '$2,000 - $6,000',
    defaultPrice: '$3,500',
    callToAction: 'Start generating qualified leads today. Approve to begin.',
    colorAccent: 'green'
  },
  {
    id: 'google-ads',
    name: 'Google Ads Management Proposal',
    category: 'Advertising',
    icon: '📊',
    description: 'Professional Google Ads management to drive targeted traffic and maximize your advertising ROI.',
    scope: [
      'Account audit and competitive analysis',
      'Keyword research and strategy development',
      'Campaign structure and ad group setup',
      'Ad copywriting (multiple variations for testing)',
      'Landing page recommendations',
      'Conversion tracking implementation',
      'Bi-weekly optimization and reporting',
      'Monthly strategy calls'
    ],
    timeline: 'Ongoing monthly management',
    deliverables: [
      'Complete Google Ads setup',
      'Keyword strategy document',
      'Ad copy variations',
      'Conversion tracking setup',
      'Bi-weekly performance reports',
      'Monthly strategy recommendations'
    ],
    investmentRange: '$800 - $2,500/month + ad spend',
    defaultPrice: '$1,200/month',
    callToAction: 'Ready to scale with Google Ads? Approve to start.',
    colorAccent: 'red'
  },
  {
    id: 'social-media',
    name: 'Social Media Management Proposal',
    category: 'Marketing',
    icon: '📱',
    description: 'Complete social media management to build your brand presence and engage your target audience.',
    scope: [
      'Social media audit and competitor analysis',
      'Content calendar creation (30 days)',
      'Custom graphics and visual content',
      '12-16 posts per month across platforms',
      'Community management and engagement',
      'Hashtag research and optimization',
      'Monthly analytics and insights report'
    ],
    timeline: 'Ongoing monthly management',
    deliverables: [
      'Content calendar (monthly)',
      'Custom branded graphics',
      'Scheduled posts across platforms',
      'Community engagement',
      'Monthly performance report',
      'Quarterly strategy review'
    ],
    investmentRange: '$600 - $2,000/month',
    defaultPrice: '$1,000/month',
    callToAction: 'Build your social presence. Approve to get started.',
    colorAccent: 'purple'
  },
  {
    id: 'seo-services',
    name: 'SEO Services Proposal',
    category: 'Marketing',
    icon: '🔍',
    description: 'Comprehensive SEO strategy to improve your search rankings and drive organic traffic.',
    scope: [
      'Technical SEO audit and fixes',
      'Keyword research and mapping',
      'On-page optimization (titles, meta, headers)',
      'Content optimization recommendations',
      'Local SEO setup (Google Business Profile)',
      'Link building outreach (5-10 quality links/month)',
      'Monthly ranking and traffic reports'
    ],
    timeline: '3-6 months for significant results',
    deliverables: [
      'Technical SEO audit report',
      'Keyword strategy document',
      'On-page optimization implementation',
      'Google Business Profile setup',
      'Monthly ranking reports',
      'Quarterly strategy reviews'
    ],
    investmentRange: '$800 - $3,000/month',
    defaultPrice: '$1,500/month',
    callToAction: 'Improve your search visibility. Approve to begin SEO work.',
    colorAccent: 'teal'
  },
  {
    id: 'local-business-growth',
    name: 'Local Business Growth Proposal',
    category: 'Strategy',
    icon: '🏪',
    description: 'A complete local marketing package designed to dominate your local market and attract nearby customers.',
    scope: [
      'Google Business Profile optimization',
      'Local SEO setup and citations',
      'Review generation strategy',
      'Local directory submissions (20+ directories)',
      'Geo-targeted ad campaigns',
      'Local content creation',
      'Community partnership outreach'
    ],
    timeline: '4-6 weeks initial setup + ongoing',
    deliverables: [
      'Optimized Google Business Profile',
      'Local citation report',
      'Review collection system',
      'Directory submission log',
      'Local ad campaign setup',
      'Monthly local ranking report'
    ],
    investmentRange: '$1,500 - $4,000',
    defaultPrice: '$2,500',
    callToAction: 'Dominate your local market. Approve to start.',
    colorAccent: 'amber'
  },
  {
    id: 'emergency-fast',
    name: 'Emergency / Fast-Turnaround Proposal',
    category: 'Rush Services',
    icon: '⚡',
    description: 'Expedited services when you need results fast. Priority handling with dedicated resources.',
    scope: [
      'Priority project scheduling',
      'Dedicated team resources',
      'Daily progress updates',
      'Weekend/after-hours work as needed',
      'Expedited review and approval process',
      'Direct communication channel',
      'Rush delivery guarantee'
    ],
    timeline: '24-72 hours depending on scope',
    deliverables: [
      'Expedited project completion',
      'Daily progress reports',
      'Priority support access',
      'Rapid revisions',
      'Emergency hotline access',
      'Post-project review'
    ],
    investmentRange: '1.5x - 2x standard pricing',
    defaultPrice: 'Based on standard rate + 50% rush fee',
    callToAction: 'Need it fast? Approve now for priority handling.',
    colorAccent: 'rose'
  },
  {
    id: 'monthly-retainer',
    name: 'Monthly Retainer Proposal',
    category: 'Ongoing Services',
    icon: '🤝',
    description: 'Predictable monthly support with priority access and discounted hourly rates.',
    scope: [
      'Dedicated monthly hours (10-40 hours)',
      'Priority scheduling and support',
      'Discounted hourly rate (15-25% off)',
      'Monthly strategy calls',
      'Rollover of unused hours (up to 25%)',
      'Quarterly business reviews',
      'Access to premium tools and resources'
    ],
    timeline: 'Ongoing monthly engagement',
    deliverables: [
      'Monthly hour allocation',
      'Priority support access',
      'Monthly strategy session',
      'Time tracking reports',
      'Quarterly performance review',
      'Dedicated account manager'
    ],
    investmentRange: '$1,000 - $5,000/month',
    defaultPrice: '$2,000/month (15 hours)',
    callToAction: 'Lock in your retainer rate. Approve to start.',
    colorAccent: 'indigo'
  },
  {
    id: 'custom-flexible',
    name: 'Custom / Flexible Scope Proposal',
    category: 'Custom',
    icon: '✨',
    description: 'A tailored solution designed specifically for your unique business needs and goals.',
    scope: [
      'Discovery and requirements gathering',
      'Custom solution architecture',
      'Flexible milestone-based delivery',
      'Regular check-ins and adjustments',
      'Scope modification as needed',
      'Dedicated project management',
      'Post-project support period'
    ],
    timeline: 'Based on agreed milestones',
    deliverables: [
      'Custom deliverables per scope',
      'Milestone completion reports',
      'Regular progress updates',
      'Flexible scope documentation',
      'Training and handoff',
      'Post-project support'
    ],
    investmentRange: 'Custom quote based on scope',
    defaultPrice: 'To be determined after discovery',
    callToAction: 'Ready to discuss your custom project? Approve to schedule discovery.',
    colorAccent: 'slate'
  }
];

export function generateProposalHTML(
  proposal: ProposalTemplate,
  businessInfo: {
    businessName: string;
    contactName: string;
    email: string;
    logoUrl?: string;
    customPrice?: string;
    customTimeline?: string;
    additionalNotes?: string;
  },
  senderInfo: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    logoUrl?: string;
  }
): string {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.name} - ${businessInfo.businessName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
    .logo { max-height: 60px; margin-bottom: 15px; }
    h1 { color: #1e40af; margin: 0; font-size: 28px; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { color: #1e40af; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
    .scope-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; }
    .scope-item:before { content: "✓"; color: #22c55e; margin-right: 10px; font-weight: bold; }
    .deliverable { background: #f8fafc; padding: 10px 15px; border-radius: 6px; margin: 8px 0; border-left: 3px solid #3b82f6; }
    .investment-box { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
    .price { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .cta-section { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0; }
    .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    .disclaimer { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-top: 30px; font-size: 11px; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    ${senderInfo.logoUrl ? `<img src="${senderInfo.logoUrl}" alt="${senderInfo.companyName}" class="logo">` : ''}
    <h1>${proposal.icon} ${proposal.name}</h1>
    <div class="subtitle">Prepared for ${businessInfo.businessName} | ${today}</div>
  </div>

  <div class="section">
    <p>Dear ${businessInfo.contactName},</p>
    <p>${proposal.description}</p>
    <p>This proposal outlines how we can help ${businessInfo.businessName} achieve measurable results.</p>
  </div>

  <div class="section">
    <div class="section-title">📋 Project Scope</div>
    ${proposal.scope.map(item => `<div class="scope-item">${item}</div>`).join('')}
  </div>

  <div class="section">
    <div class="section-title">📦 Deliverables</div>
    ${proposal.deliverables.map(item => `<div class="deliverable">${item}</div>`).join('')}
  </div>

  <div class="section">
    <div class="section-title">⏱️ Timeline</div>
    <p><strong>${businessInfo.customTimeline || proposal.timeline}</strong></p>
  </div>

  <div class="investment-box">
    <div>Your Investment</div>
    <div class="price">${businessInfo.customPrice || proposal.defaultPrice}</div>
    <div style="font-size: 14px; opacity: 0.9;">Valid until ${validUntil}</div>
  </div>

  ${businessInfo.additionalNotes ? `
  <div class="section">
    <div class="section-title">📝 Additional Notes</div>
    <p>${businessInfo.additionalNotes}</p>
  </div>
  ` : ''}

  <div class="cta-section">
    <strong>🚀 ${proposal.callToAction}</strong>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <strong>Client Approval</strong>
      <div class="signature-line">
        <div>${businessInfo.contactName}</div>
        <div>${businessInfo.businessName}</div>
        <div>Date: _______________</div>
      </div>
    </div>
    <div class="signature-box">
      <strong>Service Provider</strong>
      <div class="signature-line">
        <div>${senderInfo.contactName}</div>
        <div>${senderInfo.companyName}</div>
        <div>Date: ${today}</div>
      </div>
    </div>
  </div>

  <div class="disclaimer">
    ⚠️ <strong>Disclaimer:</strong> This proposal is provided for informational purposes and constitutes a commercial offer. Final terms are subject to mutual agreement. This document does not constitute legal advice. Please review with your attorney before signing.
  </div>

  <div class="footer">
    <p>${senderInfo.companyName} | ${senderInfo.email}${senderInfo.phone ? ` | ${senderInfo.phone}` : ''}</p>
    <p>Thank you for considering our services!</p>
  </div>
</body>
</html>
  `;
}
