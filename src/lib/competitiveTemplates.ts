// Competitive Analysis Email Templates
// Used when researchMode === 'competitive' in Super AI Business Search
// Supports: Benchmarking, Market Entry Research, Partnership Discovery, Product Pitching

export interface CompetitiveEmailTemplate {
  id: string;
  name: string;
  category: 'partnership' | 'market-research' | 'product-pitch' | 'networking' | 'vendor-inquiry';
  purpose: string;
  subject: string;
  body_html: string;
  body_text: string;
  description: string;
  tags: string[];
  useCase: 'benchmark' | 'market-entry' | 'partnership' | 'product-sell' | 'all';
}

export const COMPETITIVE_EMAIL_TEMPLATES: CompetitiveEmailTemplate[] = [
  // ============================================================================
  // PARTNERSHIP TEMPLATES - For collaboration, referrals, joint ventures
  // ============================================================================
  {
    id: 'comp-partnership-intro',
    name: 'Partnership Introduction',
    category: 'partnership',
    purpose: 'Initiate a partnership conversation with a company in your niche',
    subject: 'Potential collaboration opportunity - {{business_name}} + {{my_company}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm reaching out from {{my_company}}. We operate in the {{industry}} space and have been impressed by what {{business_name}} has built.</p>

<p>I noticed we serve complementary markets and wanted to explore potential synergies. Specifically, I'm thinking:</p>

<ul>
<li>Referral partnership for non-competing services</li>
<li>Co-marketing opportunities</li>
<li>Knowledge sharing in our shared niche</li>
</ul>

<p>Would you be open to a 15-minute call to explore if there's a fit?</p>

<p>Best,<br/>
{{sender_name}}<br/>
{{my_company}}</p>`,
    body_text: `Hi {{first_name}},

I'm reaching out from {{my_company}}. We operate in the {{industry}} space and have been impressed by what {{business_name}} has built.

I noticed we serve complementary markets and wanted to explore potential synergies. Specifically, I'm thinking:
- Referral partnership for non-competing services
- Co-marketing opportunities
- Knowledge sharing in our shared niche

Would you be open to a 15-minute call to explore if there's a fit?

Best,
{{sender_name}}
{{my_company}}`,
    description: 'Open a partnership conversation with a complementary business',
    tags: ['partnership', 'collaboration', 'referral', 'joint-venture'],
    useCase: 'partnership'
  },
  {
    id: 'comp-partnership-referral',
    name: 'Referral Network Proposal',
    category: 'partnership',
    purpose: 'Propose a referral exchange with a non-competing business',
    subject: 'Referral partnership idea for {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm {{sender_name}} from {{my_company}}. We work with {{my_audience}} and I've noticed {{business_name}} serves a similar market but with different services.</p>

<p>Here's my thought: our customers sometimes need {{their_service_type}} services that we don't offer. I'd love to send them your way—and perhaps you have customers who need {{my_service_type}}?</p>

<p>No formal arrangement needed, just a mutual understanding that we refer qualified leads to each other.</p>

<p>Interested in exploring this?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I'm {{sender_name}} from {{my_company}}. We work with {{my_audience}} and I've noticed {{business_name}} serves a similar market but with different services.

Here's my thought: our customers sometimes need {{their_service_type}} services that we don't offer. I'd love to send them your way—and perhaps you have customers who need {{my_service_type}}?

No formal arrangement needed, just a mutual understanding that we refer qualified leads to each other.

Interested in exploring this?

Best,
{{sender_name}}`,
    description: 'Propose informal referral exchange with complementary business',
    tags: ['referral', 'partnership', 'mutual-benefit'],
    useCase: 'partnership'
  },

  // ============================================================================
  // MARKET RESEARCH TEMPLATES - For industry insights and intelligence
  // ============================================================================
  {
    id: 'comp-research-interview',
    name: 'Industry Interview Request',
    category: 'market-research',
    purpose: 'Request an industry insight interview for market research',
    subject: '15-min interview request - {{industry}} research',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm conducting research on the {{industry}} market in {{location}} and {{business_name}} came up as a notable player in the space.</p>

<p>I'd love to get your perspective on:</p>
<ul>
<li>What trends you're seeing in the market</li>
<li>Challenges facing businesses like yours</li>
<li>Where you see the industry heading</li>
</ul>

<p>I'm not selling anything—this is purely for research purposes. Happy to share the findings with you once complete.</p>

<p>Would you have 15 minutes for a quick chat?</p>

<p>Thanks,<br/>
{{sender_name}}<br/>
{{my_company}}</p>`,
    body_text: `Hi {{first_name}},

I'm conducting research on the {{industry}} market in {{location}} and {{business_name}} came up as a notable player in the space.

I'd love to get your perspective on:
- What trends you're seeing in the market
- Challenges facing businesses like yours
- Where you see the industry heading

I'm not selling anything—this is purely for research purposes. Happy to share the findings with you once complete.

Would you have 15 minutes for a quick chat?

Thanks,
{{sender_name}}
{{my_company}}`,
    description: 'Request an interview for market research purposes',
    tags: ['research', 'interview', 'market-analysis', 'no-sell'],
    useCase: 'market-entry'
  },
  {
    id: 'comp-research-survey',
    name: 'Quick Survey Request',
    category: 'market-research',
    purpose: 'Request participation in a brief industry survey',
    subject: '2-minute survey: {{industry}} market insights',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm gathering insights from {{industry}} professionals to understand current market dynamics. Your input would be invaluable.</p>

<p>It's a 2-minute survey covering:</p>
<ul>
<li>Top challenges in your business</li>
<li>Tools/services you find most valuable</li>
<li>Market trends you're watching</li>
</ul>

<p>As a thank you, I'll share the aggregated results showing how {{business_name}} compares to industry averages.</p>

<p>Here's the link: [Survey Link]</p>

<p>Thanks for your time,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I'm gathering insights from {{industry}} professionals to understand current market dynamics. Your input would be invaluable.

It's a 2-minute survey covering:
- Top challenges in your business
- Tools/services you find most valuable
- Market trends you're watching

As a thank you, I'll share the aggregated results showing how {{business_name}} compares to industry averages.

Here's the link: [Survey Link]

Thanks for your time,
{{sender_name}}`,
    description: 'Request participation in a market research survey',
    tags: ['survey', 'research', 'benchmarking'],
    useCase: 'benchmark'
  },

  // ============================================================================
  // PRODUCT/SERVICE PITCH TEMPLATES - Selling to your niche
  // ============================================================================
  {
    id: 'comp-product-niche-intro',
    name: 'Niche-Specific Product Introduction',
    category: 'product-pitch',
    purpose: 'Introduce your product/service to businesses in your target niche',
    subject: 'Solution built specifically for {{industry}} businesses like {{business_name}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm reaching out because we built {{my_product}} specifically for {{industry}} businesses—and based on my research, {{business_name}} matches our ideal customer profile perfectly.</p>

<p>Here's what caught my attention:</p>
<ul>
<li>{{insight_1}}</li>
<li>{{insight_2}}</li>
</ul>

<p>We help companies like yours {{main_benefit}}. Our clients typically see {{result_metric}} within {{timeframe}}.</p>

<p>Would you be interested in seeing how this could work for {{business_name}}?</p>

<p>Best,<br/>
{{sender_name}}<br/>
{{my_company}}</p>`,
    body_text: `Hi {{first_name}},

I'm reaching out because we built {{my_product}} specifically for {{industry}} businesses—and based on my research, {{business_name}} matches our ideal customer profile perfectly.

Here's what caught my attention:
- {{insight_1}}
- {{insight_2}}

We help companies like yours {{main_benefit}}. Our clients typically see {{result_metric}} within {{timeframe}}.

Would you be interested in seeing how this could work for {{business_name}}?

Best,
{{sender_name}}
{{my_company}}`,
    description: 'Pitch your product/service to niche businesses using research insights',
    tags: ['product-pitch', 'sales', 'niche-selling', 'b2b'],
    useCase: 'product-sell'
  },
  {
    id: 'comp-product-competitive-edge',
    name: 'Competitive Edge Pitch',
    category: 'product-pitch',
    purpose: 'Show how your product helps them beat competitors',
    subject: 'How to outperform {{competitor}} in {{industry}}',
    body_html: `<p>Hi {{first_name}},</p>

<p>I've been researching the {{industry}} market in {{location}} and noticed something interesting about the competitive landscape.</p>

<p>{{business_name}}'s top competitors are:</p>
<ul>
<li>{{competitor_1}} - {{competitor_1_strength}}</li>
<li>{{competitor_2}} - {{competitor_2_strength}}</li>
</ul>

<p>We help {{industry}} businesses gain a competitive edge by {{main_benefit}}. Companies using our solution have:</p>
<ul>
<li>{{result_1}}</li>
<li>{{result_2}}</li>
</ul>

<p>Want to see how {{business_name}} could pull ahead of the competition?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I've been researching the {{industry}} market in {{location}} and noticed something interesting about the competitive landscape.

{{business_name}}'s top competitors are:
- {{competitor_1}} - {{competitor_1_strength}}
- {{competitor_2}} - {{competitor_2_strength}}

We help {{industry}} businesses gain a competitive edge by {{main_benefit}}. Companies using our solution have:
- {{result_1}}
- {{result_2}}

Want to see how {{business_name}} could pull ahead of the competition?

Best,
{{sender_name}}`,
    description: 'Use competitive intelligence to pitch your product',
    tags: ['competitive-pitch', 'sales', 'differentiation'],
    useCase: 'product-sell'
  },
  {
    id: 'comp-product-market-entry',
    name: 'New Market Entry Pitch',
    category: 'product-pitch',
    purpose: 'Pitch to businesses when entering a new market segment',
    subject: 'Introducing {{my_product}} to {{industry}} professionals',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm {{sender_name}} from {{my_company}}. We've been successfully helping [original industry] businesses with {{my_product}}, and we're now expanding to serve the {{industry}} market.</p>

<p>After researching companies like {{business_name}}, I've found that {{industry}} businesses face similar challenges:</p>
<ul>
<li>{{pain_point_1}}</li>
<li>{{pain_point_2}}</li>
</ul>

<p>We're offering early adopters in the {{industry}} space special onboarding and pricing as we build out our expertise in this market.</p>

<p>Would you be interested in being one of our founding {{industry}} customers?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I'm {{sender_name}} from {{my_company}}. We've been successfully helping [original industry] businesses with {{my_product}}, and we're now expanding to serve the {{industry}} market.

After researching companies like {{business_name}}, I've found that {{industry}} businesses face similar challenges:
- {{pain_point_1}}
- {{pain_point_2}}

We're offering early adopters in the {{industry}} space special onboarding and pricing as we build out our expertise in this market.

Would you be interested in being one of our founding {{industry}} customers?

Best,
{{sender_name}}`,
    description: 'Pitch when entering a new market segment',
    tags: ['market-entry', 'sales', 'early-adopter', 'expansion'],
    useCase: 'market-entry'
  },

  // ============================================================================
  // VENDOR INQUIRY TEMPLATES - Finding suppliers/vendors in your niche
  // ============================================================================
  {
    id: 'comp-vendor-inquiry',
    name: 'Vendor/Supplier Inquiry',
    category: 'vendor-inquiry',
    purpose: 'Inquire about becoming a customer or finding suppliers',
    subject: 'Inquiry about {{business_name}}\'s services',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm {{sender_name}} from {{my_company}}. We're currently researching {{industry}} providers for a potential partnership or vendor relationship.</p>

<p>{{business_name}} came up in our research as a reputable provider. I'd love to learn more about:</p>
<ul>
<li>Your service offerings and pricing structure</li>
<li>Typical client profile you work with</li>
<li>Current capacity and lead times</li>
</ul>

<p>Would you have time for a brief call this week?</p>

<p>Thanks,<br/>
{{sender_name}}<br/>
{{my_company}}</p>`,
    body_text: `Hi {{first_name}},

I'm {{sender_name}} from {{my_company}}. We're currently researching {{industry}} providers for a potential partnership or vendor relationship.

{{business_name}} came up in our research as a reputable provider. I'd love to learn more about:
- Your service offerings and pricing structure
- Typical client profile you work with
- Current capacity and lead times

Would you have time for a brief call this week?

Thanks,
{{sender_name}}
{{my_company}}`,
    description: 'Inquire about services from potential vendors/suppliers',
    tags: ['vendor', 'supplier', 'procurement', 'inquiry'],
    useCase: 'all'
  },

  // ============================================================================
  // NETWORKING TEMPLATES - Industry connections
  // ============================================================================
  {
    id: 'comp-networking-peer',
    name: 'Peer Networking Request',
    category: 'networking',
    purpose: 'Connect with a peer in your industry for knowledge sharing',
    subject: 'Fellow {{industry}} professional - quick hello',
    body_html: `<p>Hi {{first_name}},</p>

<p>I run {{my_company}} in the {{industry}} space and came across {{business_name}} while researching our market.</p>

<p>I'm always looking to connect with other professionals in our industry. Not to sell anything—just genuinely interested in:</p>
<ul>
<li>Sharing notes on what's working</li>
<li>Discussing industry trends</li>
<li>Building a peer network in {{industry}}</li>
</ul>

<p>Would you be open to a 15-minute virtual coffee sometime?</p>

<p>Best,<br/>
{{sender_name}}</p>`,
    body_text: `Hi {{first_name}},

I run {{my_company}} in the {{industry}} space and came across {{business_name}} while researching our market.

I'm always looking to connect with other professionals in our industry. Not to sell anything—just genuinely interested in:
- Sharing notes on what's working
- Discussing industry trends
- Building a peer network in {{industry}}

Would you be open to a 15-minute virtual coffee sometime?

Best,
{{sender_name}}`,
    description: 'Request a peer networking conversation',
    tags: ['networking', 'peer', 'industry-connection'],
    useCase: 'benchmark'
  },
  {
    id: 'comp-networking-mastermind',
    name: 'Mastermind Group Invitation',
    category: 'networking',
    purpose: 'Invite peers to join a mastermind or industry group',
    subject: 'Invitation: {{industry}} Founders Group',
    body_html: `<p>Hi {{first_name}},</p>

<p>I'm putting together a small mastermind group for {{industry}} business owners in {{location}}. The idea is simple:</p>

<ul>
<li>Monthly virtual meetups (1 hour max)</li>
<li>Share wins, challenges, and strategies</li>
<li>No selling, no pitching—just peer support</li>
</ul>

<p>Based on what I've seen from {{business_name}}, you'd be a great fit for this group.</p>

<p>Interested in joining? Just reply and I'll send over the details.</p>

<p>Best,<br/>
{{sender_name}}<br/>
{{my_company}}</p>`,
    body_text: `Hi {{first_name}},

I'm putting together a small mastermind group for {{industry}} business owners in {{location}}. The idea is simple:

- Monthly virtual meetups (1 hour max)
- Share wins, challenges, and strategies
- No selling, no pitching—just peer support

Based on what I've seen from {{business_name}}, you'd be a great fit for this group.

Interested in joining? Just reply and I'll send over the details.

Best,
{{sender_name}}
{{my_company}}`,
    description: 'Invite industry peers to a mastermind group',
    tags: ['mastermind', 'networking', 'peer-group', 'community'],
    useCase: 'all'
  },
];

export const COMPETITIVE_TEMPLATE_CATEGORIES = [
  { id: 'partnership', name: 'Partnership', icon: 'Handshake', description: 'Collaboration & referral opportunities' },
  { id: 'market-research', name: 'Market Research', icon: 'Search', description: 'Industry insights & intelligence' },
  { id: 'product-pitch', name: 'Product/Service Pitch', icon: 'Package', description: 'Sell to your target niche' },
  { id: 'vendor-inquiry', name: 'Vendor Inquiry', icon: 'Store', description: 'Find suppliers & providers' },
  { id: 'networking', name: 'Networking', icon: 'Users', description: 'Industry connections' },
] as const;

export const getCompetitiveTemplatesByCategory = (category: string): CompetitiveEmailTemplate[] => {
  return COMPETITIVE_EMAIL_TEMPLATES.filter(t => t.category === category);
};

export const getCompetitiveTemplatesByUseCase = (useCase: 'benchmark' | 'market-entry' | 'partnership' | 'product-sell' | 'all'): CompetitiveEmailTemplate[] => {
  return COMPETITIVE_EMAIL_TEMPLATES.filter(t => t.useCase === useCase || t.useCase === 'all');
};

export const searchCompetitiveTemplates = (query: string): CompetitiveEmailTemplate[] => {
  const q = query.toLowerCase();
  return COMPETITIVE_EMAIL_TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
  );
};
