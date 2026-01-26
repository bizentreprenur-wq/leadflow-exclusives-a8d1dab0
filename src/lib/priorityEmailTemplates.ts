// Priority-based email templates that auto-select based on lead classification
// Hot leads get direct, action-oriented messaging
// Warm leads get value-driven content
// Cold leads get educational/awareness content

export interface PriorityTemplate {
  id: string;
  priority: 'hot' | 'warm' | 'cold';
  name: string;
  subject: string;
  body: string;
  description: string;
  bestFor: string;
}

export const PRIORITY_TEMPLATES: PriorityTemplate[] = [
  // HOT LEADS - Direct, action-oriented, urgency-focused
  {
    id: 'hot-1',
    priority: 'hot',
    name: 'Immediate Opportunity',
    subject: "Quick question about {{business_name}}",
    body: `Hi {{first_name}},

I noticed {{business_name}} is actively looking to improve your online presence. I have a few specific ideas that could help you get more customers this month.

Do you have 15 minutes for a quick call this week? I'd love to share what's working for businesses like yours right now.

Best,
{{sender_name}}`,
    description: 'Direct approach for leads showing high buying intent',
    bestFor: 'Leads with website issues, missing online presence, or urgent needs',
  },
  {
    id: 'hot-2',
    priority: 'hot',
    name: 'Competitor Insight',
    subject: "Noticed something about {{business_name}}'s competitors",
    body: `Hi {{first_name}},

While researching local {{industry}} businesses, I noticed your competitors are doing something that's bringing them a lot of new customers.

I'd love to show you what they're doing and how {{business_name}} could do it even better.

Are you free for a 10-minute call tomorrow?

Best,
{{sender_name}}`,
    description: 'Creates urgency through competitive analysis',
    bestFor: 'Market leaders or businesses in competitive niches',
  },
  {
    id: 'hot-3',
    priority: 'hot',
    name: 'Ready-to-Book',
    subject: "Let's get {{business_name}} more customers",
    body: `Hi {{first_name}},

I help businesses like {{business_name}} get 20-30% more customers through targeted online marketing.

Based on what I've seen about your business, I think we could see results within the first 30 days.

Would you like to see a quick demo of how this works? I have openings this Thursday or Friday.

Best,
{{sender_name}}`,
    description: 'Assumes high intent, offers immediate next step',
    bestFor: 'Leads who have engaged with content or shown interest',
  },

  // WARM LEADS - Value-focused, relationship-building
  {
    id: 'warm-1',
    priority: 'warm',
    name: 'Value-First Intro',
    subject: "A free idea for {{business_name}}",
    body: `Hi {{first_name}},

I was looking at {{business_name}}'s website and noticed a few quick wins that could help you get more leads.

I put together a brief list of suggestions - no strings attached. Would you like me to send it over?

If any of the ideas resonate, we can chat about implementing them.

Best,
{{sender_name}}`,
    description: 'Leads with value before asking for anything',
    bestFor: 'Leads who need nurturing before conversion',
  },
  {
    id: 'warm-2',
    priority: 'warm',
    name: 'Case Study Share',
    subject: "How a {{industry}} business doubled their leads",
    body: `Hi {{first_name}},

I recently helped a {{industry}} business similar to {{business_name}} increase their online leads by 112% in just 3 months.

I thought you might find their story interesting - it's a quick 2-minute read.

Would you like me to send it over?

Best,
{{sender_name}}`,
    description: 'Social proof approach with relevant case study',
    bestFor: 'Leads who respond to evidence and success stories',
  },
  {
    id: 'warm-3',
    priority: 'warm',
    name: 'Resource Offer',
    subject: "Free guide: 5 ways to grow {{business_name}}",
    body: `Hi {{first_name}},

I put together a quick guide on the 5 most effective ways local businesses are attracting new customers in 2024.

It's based on what's actually working for businesses like {{business_name}} right now.

Would you like a copy? It's free - just reply "yes" and I'll send it right over.

Best,
{{sender_name}}`,
    description: 'Lead magnet approach to build relationship',
    bestFor: 'Educational-focused leads who research before buying',
  },

  // COLD LEADS - Educational, awareness-building, low-pressure
  {
    id: 'cold-1',
    priority: 'cold',
    name: 'Gentle Introduction',
    subject: "Quick question for {{first_name}}",
    body: `Hi {{first_name}},

I came across {{business_name}} and was impressed by what you've built.

I work with local businesses to help them get more customers online. I'm not sure if it's a fit, but I'd love to learn more about your goals for this year.

Is online marketing something you're exploring?

Best,
{{sender_name}}`,
    description: 'Low-pressure intro that opens dialogue',
    bestFor: 'New leads with unknown intent or interest level',
  },
  {
    id: 'cold-2',
    priority: 'cold',
    name: 'Industry Insight',
    subject: "Interesting trend in {{industry}}",
    body: `Hi {{first_name}},

I've been researching trends in the {{industry}} space and found something interesting that might affect businesses like {{business_name}}.

Would you be open to a quick email exchange about what I've found? No sales pitch - just thought you'd find it valuable.

Best,
{{sender_name}}`,
    description: 'Provides industry value without selling',
    bestFor: 'Cold leads who need awareness-building first',
  },
  {
    id: 'cold-3',
    priority: 'cold',
    name: 'Simple Check-In',
    subject: "Is {{business_name}} looking to grow?",
    body: `Hi {{first_name}},

I help local businesses attract more customers through digital marketing.

I'm reaching out to see if growing your customer base is something on your radar this year.

If so, I'd love to share a few ideas. If not, no worries at all - just let me know and I won't follow up.

Best,
{{sender_name}}`,
    description: 'Respectful, low-pressure initial outreach',
    bestFor: 'Cold outreach to unknown contacts',
  },
];

// Get templates by priority
export function getTemplatesByPriority(priority: 'hot' | 'warm' | 'cold'): PriorityTemplate[] {
  return PRIORITY_TEMPLATES.filter(t => t.priority === priority);
}

// Get suggested template based on lead data
export function getSuggestedTemplate(lead: {
  aiClassification?: 'hot' | 'warm' | 'cold';
  priority?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  hasWebsite?: boolean;
  websiteIssues?: string[];
}): PriorityTemplate {
  // Determine priority from lead data
  let priority: 'hot' | 'warm' | 'cold' = 'cold';
  
  if (lead.aiClassification) {
    priority = lead.aiClassification;
  } else if (lead.priority) {
    priority = lead.priority;
  } else if (lead.leadScore !== undefined) {
    if (lead.leadScore >= 70) priority = 'hot';
    else if (lead.leadScore >= 40) priority = 'warm';
    else priority = 'cold';
  }

  // Get templates for this priority
  const templates = getTemplatesByPriority(priority);
  
  // Select based on specific lead characteristics
  if (priority === 'hot') {
    // If no website or major issues, use immediate opportunity
    if (!lead.hasWebsite || (lead.websiteIssues && lead.websiteIssues.length > 2)) {
      return templates.find(t => t.id === 'hot-1') || templates[0];
    }
    return templates[2]; // Ready-to-book for engaged leads
  }
  
  if (priority === 'warm') {
    // Default to value-first for warm leads
    return templates[0];
  }
  
  // Cold leads get gentle introduction
  return templates[0];
}

// Personalize template with lead data
export function personalizeTemplate(template: PriorityTemplate, lead: {
  business_name?: string;
  first_name?: string;
  email?: string;
  website?: string;
  industry?: string;
}, senderName = 'Your Name'): { subject: string; body: string } {
  const tokens: Record<string, string> = {
    '{{business_name}}': lead.business_name || 'your business',
    '{{first_name}}': lead.first_name || 'there',
    '{{email}}': lead.email || '',
    '{{website}}': lead.website || '',
    '{{industry}}': lead.industry || 'your industry',
    '{{sender_name}}': senderName,
  };

  let subject = template.subject;
  let body = template.body;

  for (const [token, value] of Object.entries(tokens)) {
    const regex = new RegExp(token.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

// Get all priorities with template counts
export function getPriorityStats(): { priority: 'hot' | 'warm' | 'cold'; count: number; label: string; emoji: string }[] {
  return [
    { priority: 'hot', count: getTemplatesByPriority('hot').length, label: 'Hot', emoji: '🔥' },
    { priority: 'warm', count: getTemplatesByPriority('warm').length, label: 'Warm', emoji: '🌡️' },
    { priority: 'cold', count: getTemplatesByPriority('cold').length, label: 'Cold', emoji: '❄️' },
  ];
}
