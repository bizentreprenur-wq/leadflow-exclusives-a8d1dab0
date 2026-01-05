// Pre-built email templates for various industries and use cases

export interface EmailTemplatePreset {
  id: string;
  name: string;
  category: 'sales' | 'marketing' | 'recruiting' | 'networking' | 'follow-up' | 'introduction';
  industry?: string;
  subject: string;
  body_html: string;
  body_text: string;
  description: string;
  tags: string[];
}

export const EMAIL_TEMPLATE_PRESETS: EmailTemplatePreset[] = [
  // Sales Templates
  {
    id: 'sales-intro-1',
    name: 'Cold Outreach - Value Proposition',
    category: 'sales',
    subject: 'Quick question about {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I came across {{business_name}} and was impressed by what you're building. I noticed you might benefit from [specific value proposition].</p>

<p>We've helped similar companies in your space achieve [specific result] - would you be open to a quick 15-minute call to see if we could help {{business_name}} too?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I came across {{business_name}} and was impressed by what you're building. I noticed you might benefit from [specific value proposition].

We've helped similar companies in your space achieve [specific result] - would you be open to a quick 15-minute call to see if we could help {{business_name}} too?

Best,
{{sender_name}}`,
    description: 'A warm cold email that leads with value',
    tags: ['cold-outreach', 'b2b', 'saas'],
  },
  {
    id: 'sales-pain-point',
    name: 'Pain Point Focused',
    category: 'sales',
    subject: 'Solving [problem] for {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>Most [industry] companies struggle with [specific pain point]. It costs them [time/money] every [week/month].</p>

<p>We built a solution that eliminates this problem entirely. Companies like [similar company] saw [specific improvement] within [timeframe].</p>

<p>Worth a quick chat to see if this could work for {{business_name}}?</p>

<p>{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

Most [industry] companies struggle with [specific pain point]. It costs them [time/money] every [week/month].

We built a solution that eliminates this problem entirely. Companies like [similar company] saw [specific improvement] within [timeframe].

Worth a quick chat to see if this could work for {{business_name}}?

{{sender_name}}`,
    description: 'Lead with the pain point they experience',
    tags: ['pain-point', 'solution-selling'],
  },
  {
    id: 'sales-social-proof',
    name: 'Social Proof Lead',
    category: 'sales',
    subject: 'How [competitor/peer] achieved [result]',
    body_html: `<p>Hi {{first_name}},</p>

<p>I wanted to share how [similar company in their space] recently achieved [impressive result] using our platform.</p>

<p>Given {{business_name}}'s focus on [their focus area], I thought you might find their approach interesting - especially since they faced similar challenges before.</p>

<p>Would you like me to send over the case study? Or we could jump on a quick call where I walk you through exactly what they did.</p>

<p>Cheers,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I wanted to share how [similar company in their space] recently achieved [impressive result] using our platform.

Given {{business_name}}'s focus on [their focus area], I thought you might find their approach interesting - especially since they faced similar challenges before.

Would you like me to send over the case study? Or we could jump on a quick call where I walk you through exactly what they did.

Cheers,
{{sender_name}}`,
    description: 'Lead with credible social proof',
    tags: ['social-proof', 'case-study'],
  },

  // Marketing Templates
  {
    id: 'marketing-partnership',
    name: 'Partnership Inquiry',
    category: 'marketing',
    subject: 'Partnership opportunity with {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I've been following {{business_name}} for a while and love what you're doing with [specific thing they do well].</p>

<p>We work with companies in the [industry] space and think there could be a great synergy between our audiences. Some ideas:</p>

<ul>
<li>Co-hosted webinar on [topic]</li>
<li>Guest post exchange</li>
<li>Joint case study</li>
</ul>

<p>Would you be open to exploring a collaboration?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I've been following {{business_name}} for a while and love what you're doing with [specific thing they do well].

We work with companies in the [industry] space and think there could be a great synergy between our audiences. Some ideas:
- Co-hosted webinar on [topic]
- Guest post exchange
- Joint case study

Would you be open to exploring a collaboration?

Best,
{{sender_name}}`,
    description: 'Propose a marketing partnership',
    tags: ['partnership', 'collaboration', 'co-marketing'],
  },
  {
    id: 'marketing-content-collab',
    name: 'Content Collaboration',
    category: 'marketing',
    subject: 'Featured in our upcoming [content type]?',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm putting together a [blog post/guide/report] about [topic] and would love to feature insights from {{business_name}}.</p>

<p>Your work on [specific area] would be perfect for our audience of [audience description]. It would include a backlink to your site and full credit.</p>

<p>Interested? Just takes a quick 15-min interview or you can send over 2-3 quotes.</p>

<p>Thanks,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I'm putting together a [blog post/guide/report] about [topic] and would love to feature insights from {{business_name}}.

Your work on [specific area] would be perfect for our audience of [audience description]. It would include a backlink to your site and full credit.

Interested? Just takes a quick 15-min interview or you can send over 2-3 quotes.

Thanks,
{{sender_name}}`,
    description: 'Request for content collaboration',
    tags: ['content', 'backlinks', 'pr'],
  },

  // Recruiting Templates
  {
    id: 'recruiting-talent',
    name: 'Talent Outreach',
    category: 'recruiting',
    subject: '{{first_name}}, opportunity at [Company Name]',
    body_html: `<p>Hi {{first_name}},</p>

<p>Your background in [their expertise] caught my attention. We're building something exciting at [Company Name] and looking for people like you.</p>

<p>The role: [Brief role description]</p>

<p>Why it might interest you:</p>
<ul>
<li>[Compelling reason 1]</li>
<li>[Compelling reason 2]</li>
<li>[Compensation/benefits highlight]</li>
</ul>

<p>Worth a conversation? Even if the timing isn't right, I'd love to connect.</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

Your background in [their expertise] caught my attention. We're building something exciting at [Company Name] and looking for people like you.

The role: [Brief role description]

Why it might interest you:
- [Compelling reason 1]
- [Compelling reason 2]
- [Compensation/benefits highlight]

Worth a conversation? Even if the timing isn't right, I'd love to connect.

Best,
{{sender_name}}`,
    description: 'Recruit top talent with personalized outreach',
    tags: ['recruiting', 'hiring', 'talent'],
  },

  // Follow-up Templates
  {
    id: 'followup-gentle',
    name: 'Gentle Follow-up',
    category: 'follow-up',
    subject: 'Re: Quick question about {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>Just floating this back to the top of your inbox in case it got buried.</p>

<p>I know you're busy - would a different time work better? Or if this isn't a priority right now, just let me know and I'll follow up in a few months.</p>

<p>Either way, no hard feelings!</p>

<p>{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

Just floating this back to the top of your inbox in case it got buried.

I know you're busy - would a different time work better? Or if this isn't a priority right now, just let me know and I'll follow up in a few months.

Either way, no hard feelings!

{{sender_name}}`,
    description: 'A non-pushy follow-up email',
    tags: ['follow-up', 'soft-touch'],
  },
  {
    id: 'followup-value-add',
    name: 'Value-Add Follow-up',
    category: 'follow-up',
    subject: 'Thought you might find this useful',
    body_html: `<p>Hi {{first_name}},</p>

<p>I came across this [article/resource/insight] and immediately thought of {{business_name}}:</p>

<p>[Brief summary or link]</p>

<p>Hope it's helpful! And if you ever want to chat about [original topic], I'm here.</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I came across this [article/resource/insight] and immediately thought of {{business_name}}:

[Brief summary or link]

Hope it's helpful! And if you ever want to chat about [original topic], I'm here.

Best,
{{sender_name}}`,
    description: 'Follow up with genuine value',
    tags: ['follow-up', 'value-add', 'nurture'],
  },
  {
    id: 'followup-breakup',
    name: 'Breakup Email',
    category: 'follow-up',
    subject: 'Should I close your file?',
    body_html: `<p>Hi {{first_name}},</p>

<p>I've reached out a few times and haven't heard back, so I'll assume the timing isn't right.</p>

<p>I'm closing your file for now, but if things change and you'd like to explore how we can help {{business_name}}, just reply to this email.</p>

<p>Wishing you success,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I've reached out a few times and haven't heard back, so I'll assume the timing isn't right.

I'm closing your file for now, but if things change and you'd like to explore how we can help {{business_name}}, just reply to this email.

Wishing you success,
{{sender_name}}`,
    description: 'Final follow-up before moving on',
    tags: ['follow-up', 'breakup', 'final'],
  },

  // Introduction Templates
  {
    id: 'intro-warm',
    name: 'Warm Introduction',
    category: 'introduction',
    subject: 'Intro: {{first_name}} <> [Your Contact Name]',
    body_html: `<p>Hi {{first_name}},</p>

<p>I wanted to connect you with [Contact Name] from [Their Company]. They're doing some impressive work in [area] and I thought you two would hit it off.</p>

<p>[Contact Name] - {{first_name}} is the [title] at {{business_name}}. They're focused on [their focus].</p>

<p>{{first_name}} - [Contact Name] has been [relevant achievement].</p>

<p>I'll leave you two to connect. Coffee's on me if you end up meeting!</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I wanted to connect you with [Contact Name] from [Their Company]. They're doing some impressive work in [area] and I thought you two would hit it off.

[Contact Name] - {{first_name}} is the [title] at {{business_name}}. They're focused on [their focus].

{{first_name}} - [Contact Name] has been [relevant achievement].

I'll leave you two to connect. Coffee's on me if you end up meeting!

Best,
{{sender_name}}`,
    description: 'Make a professional introduction',
    tags: ['introduction', 'networking', 'warm-intro'],
  },
  {
    id: 'intro-networking',
    name: 'Networking Request',
    category: 'networking',
    subject: 'Fellow [industry] professional - quick hello',
    body_html: `<p>Hi {{first_name}},</p>

<p>I've been following your work at {{business_name}} and really admire [specific thing]. As someone also in the [industry] space, I'd love to connect.</p>

<p>I'm currently working on [brief description] and thought your perspective on [topic] could be valuable.</p>

<p>Would you be open to a 15-minute virtual coffee? No pitch, just genuinely interested in learning from your experience.</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I've been following your work at {{business_name}} and really admire [specific thing]. As someone also in the [industry] space, I'd love to connect.

I'm currently working on [brief description] and thought your perspective on [topic] could be valuable.

Would you be open to a 15-minute virtual coffee? No pitch, just genuinely interested in learning from your experience.

Best,
{{sender_name}}`,
    description: 'Request a networking conversation',
    tags: ['networking', 'relationship-building'],
  },

  // Industry-Specific Templates
  {
    id: 'industry-saas',
    name: 'SaaS Sales Outreach',
    category: 'sales',
    industry: 'Technology Services',
    subject: 'Scaling {{business_name}}\'s [area]',
    body_html: `<p>Hi {{first_name}},</p>

<p>I noticed {{business_name}} is growing quickly - congrats! With that growth often comes [common scaling pain point].</p>

<p>We specialize in helping SaaS companies like yours [specific benefit]. Our clients typically see [metric improvement] within [timeframe].</p>

<p>Would you be interested in seeing how this could work for {{business_name}}? Happy to share a quick demo or case study.</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I noticed {{business_name}} is growing quickly - congrats! With that growth often comes [common scaling pain point].

We specialize in helping SaaS companies like yours [specific benefit]. Our clients typically see [metric improvement] within [timeframe].

Would you be interested in seeing how this could work for {{business_name}}? Happy to share a quick demo or case study.

Best,
{{sender_name}}`,
    description: 'Targeted outreach for SaaS companies',
    tags: ['saas', 'technology', 'b2b'],
  },
  {
    id: 'industry-healthcare',
    name: 'Healthcare Compliant Outreach',
    category: 'sales',
    industry: 'Healthcare',
    subject: 'HIPAA-compliant solution for {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>Working in healthcare means [specific challenge] - I understand how critical compliance and patient experience are.</p>

<p>We've developed a HIPAA-compliant solution that helps healthcare organizations like {{business_name}} [specific benefit] without compromising security.</p>

<p>Organizations like [similar healthcare company] have [specific result].</p>

<p>Would you have 15 minutes to explore if this could help {{business_name}}?</p>

<p>Best regards,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

Working in healthcare means [specific challenge] - I understand how critical compliance and patient experience are.

We've developed a HIPAA-compliant solution that helps healthcare organizations like {{business_name}} [specific benefit] without compromising security.

Organizations like [similar healthcare company] have [specific result].

Would you have 15 minutes to explore if this could help {{business_name}}?

Best regards,
{{sender_name}}`,
    description: 'HIPAA-ready outreach for healthcare',
    tags: ['healthcare', 'hipaa', 'compliant'],
  },
  {
    id: 'industry-financial',
    name: 'Financial Services Outreach',
    category: 'sales',
    industry: 'Financial Services',
    subject: 'Compliance-ready solution for {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>Financial services companies like {{business_name}} face unique challenges around [specific regulation/compliance area].</p>

<p>Our platform is built with compliance in mind - SOC 2 certified, [other certifications]. We help firms [specific benefit] while maintaining full regulatory compliance.</p>

<p>Would you be open to a brief conversation about how we've helped similar firms?</p>

<p>Best regards,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

Financial services companies like {{business_name}} face unique challenges around [specific regulation/compliance area].

Our platform is built with compliance in mind - SOC 2 certified, [other certifications]. We help firms [specific benefit] while maintaining full regulatory compliance.

Would you be open to a brief conversation about how we've helped similar firms?

Best regards,
{{sender_name}}`,
    description: 'Compliant outreach for financial services',
    tags: ['financial', 'fintech', 'compliance'],
  },
  {
    id: 'industry-retail',
    name: 'Retail & E-commerce Outreach',
    category: 'sales',
    industry: 'Retail & goods',
    subject: 'Boost {{business_name}}\'s [conversions/sales/retention]',
    body_html: `<p>Hi {{first_name}},</p>

<p>I've been looking at {{business_name}} and love your [product/brand/approach]. In today's competitive retail landscape, [specific challenge] can make or break growth.</p>

<p>We help retail and e-commerce brands like yours [specific benefit]. Recent clients have seen [specific improvement].</p>

<p>Interested in a quick 10-minute demo? I can show you exactly how it would work for {{business_name}}.</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I've been looking at {{business_name}} and love your [product/brand/approach]. In today's competitive retail landscape, [specific challenge] can make or break growth.

We help retail and e-commerce brands like yours [specific benefit]. Recent clients have seen [specific improvement].

Interested in a quick 10-minute demo? I can show you exactly how it would work for {{business_name}}.

Best,
{{sender_name}}`,
    description: 'Targeted outreach for retail businesses',
    tags: ['retail', 'ecommerce', 'b2c'],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'sales', name: 'Sales', icon: 'TrendingUp' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone' },
  { id: 'recruiting', name: 'Recruiting', icon: 'Users' },
  { id: 'networking', name: 'Networking', icon: 'Network' },
  { id: 'follow-up', name: 'Follow-up', icon: 'RotateCcw' },
  { id: 'introduction', name: 'Introduction', icon: 'Handshake' },
] as const;

export const getTemplatesByCategory = (category: string): EmailTemplatePreset[] => {
  return EMAIL_TEMPLATE_PRESETS.filter(t => t.category === category);
};

export const getTemplatesByIndustry = (industry: string): EmailTemplatePreset[] => {
  return EMAIL_TEMPLATE_PRESETS.filter(t => t.industry === industry);
};

export const searchTemplates = (query: string): EmailTemplatePreset[] => {
  const q = query.toLowerCase();
  return EMAIL_TEMPLATE_PRESETS.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
  );
};
