// Competitive Analysis Email Sequences
// Used when researchMode === 'competitive' in Super AI Business Search
// Supports follow-up cadences for: Partnership, Market Research, Product Pitch

export interface CompetitiveEmailStep {
  day: number;
  subject: string;
  body: string;
  action: string;
}

export interface CompetitiveSequence {
  id: string;
  category: 'partnership' | 'market-research' | 'product-pitch';
  name: string;
  description: string;
  goal: string;
  bestFor: string;
  steps: CompetitiveEmailStep[];
  emoji: string;
}

export const COMPETITIVE_SEQUENCES: CompetitiveSequence[] = [
  // ============================================================================
  // PARTNERSHIP SEQUENCES
  // ============================================================================
  {
    id: 'comp-seq-partnership-1',
    category: 'partnership',
    name: 'Partnership Development Sequence',
    description: 'Build relationship and explore collaboration opportunities',
    goal: 'Establish a referral or co-marketing partnership',
    bestFor: 'Non-competing businesses in your niche that serve similar customers',
    emoji: '🤝',
    steps: [
      {
        day: 1,
        action: 'Initial partnership outreach',
        subject: 'Partnership idea - {{business_name}} + {{my_company}}',
        body: `Hi {{first_name}},

I run {{my_company}} and we serve {{my_audience}} in the {{industry}} space. I have been impressed by what {{business_name}} has built.

I noticed we serve overlapping audiences but offer different solutions. I wanted to reach out about a potential partnership:

- Mutual referrals for customers who need services we do not offer
- Co-marketing opportunities
- Knowledge sharing

Would you be open to a quick call to explore if there is a fit?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Value-add follow-up',
        subject: 'Re: Quick thought on {{business_name}}',
        body: `Hi {{first_name}},

Following up on my note about partnership possibilities.

I was looking at {{business_name}} online presence and thought I would share something useful - regardless of whether we work together:

[Genuine insight or compliment about their business]

I would still love to explore how we might help each other. Even an informal referral arrangement could benefit both our businesses.

Worth a chat?

Best,
{{sender_name}}`
      },
      {
        day: 8,
        action: 'Specific partnership proposal',
        subject: 'Specific idea for {{business_name}}',
        body: `Hi {{first_name}},

I have been thinking more about how {{my_company}} and {{business_name}} could collaborate. Here is a specific idea:

[Specific, actionable partnership proposal tailored to their business]

This would be low-lift for both of us but could add real value for our respective customers.

Interested in discussing?

Best,
{{sender_name}}`
      },
      {
        day: 14,
        action: 'Soft close or defer',
        subject: 'Should I check back later?',
        body: `Hi {{first_name}},

I have reached out a few times about exploring a partnership between {{my_company}} and {{business_name}}.

I do not want to be a nuisance - if now is not the right time, I completely understand. Just let me know if you would prefer I:

1. Check back in a few months
2. Connect on LinkedIn for future opportunities
3. Remove you from my list entirely

Either way, wishing you continued success with {{business_name}}!

Best,
{{sender_name}}`
      }
    ]
  },

  // ============================================================================
  // MARKET RESEARCH SEQUENCES
  // ============================================================================
  {
    id: 'comp-seq-research-1',
    category: 'market-research',
    name: 'Industry Research Outreach',
    description: 'Gather insights from industry players for market research',
    goal: 'Complete market research interviews or surveys',
    bestFor: 'Entering a new market or understanding competitive landscape',
    emoji: '🔬',
    steps: [
      {
        day: 1,
        action: 'Initial research request',
        subject: '15-min interview request - {{industry}} research',
        body: `Hi {{first_name}},

I am conducting research on the {{industry}} market and {{business_name}} came up as a notable player.

I would love to get your perspective on industry trends and challenges. This is purely for research - I am not selling anything.

Would you have 15 minutes for a quick chat? Happy to share the findings with you once complete.

Thanks,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Offer value in exchange',
        subject: 'Re: I will share the benchmarks with you',
        body: `Hi {{first_name}},

Quick follow-up on my research request. To sweeten the deal:

Once I complete this research, I will send you a summary showing:
- How {{business_name}} compares to industry averages
- Trends your competitors are watching
- Insights from other {{industry}} leaders

It is 15 minutes of your time for a custom competitive analysis. Fair trade?

Let me know what works for your schedule.

Best,
{{sender_name}}`
      },
      {
        day: 9,
        action: 'Alternative format offer',
        subject: 'Alternative: 5 questions via email?',
        body: `Hi {{first_name}},

I know calls can be hard to schedule. Would you prefer to share your insights via email instead?

Here are 5 quick questions - feel free to answer in bullet points:

1. What is the biggest challenge {{industry}} businesses face right now?
2. What trends are you watching most closely?
3. Where do you see the industry heading in the next 2-3 years?
4. What tools/services have been most valuable for {{business_name}}?
5. What advice would you give someone entering this market?

Any insights you can share would be incredibly valuable.

Thanks,
{{sender_name}}`
      },
      {
        day: 14,
        action: 'Final thank you and close',
        subject: 'Thanks anyway - final note',
        body: `Hi {{first_name}},

I have been trying to connect for my {{industry}} research, but I understand you are busy.

This will be my last email. If you ever want to participate or just connect as fellow professionals in the space, feel free to reach out.

Wishing {{business_name}} continued success!

Best,
{{sender_name}}`
      }
    ]
  },

  // ============================================================================
  // PRODUCT/SERVICE PITCH SEQUENCES
  // ============================================================================
  {
    id: 'comp-seq-product-1',
    category: 'product-pitch',
    name: 'Niche-Targeted Sales Sequence',
    description: 'Sell your product/service to businesses in your target niche',
    goal: 'Book demos or sales conversations',
    bestFor: 'Companies selling products/services to specific industries',
    emoji: '🎯',
    steps: [
      {
        day: 1,
        action: 'Research-based intro',
        subject: 'Built for {{industry}} businesses like {{business_name}}',
        body: `Hi {{first_name}},

I am reaching out because we built {{my_product}} specifically for {{industry}} businesses.

After researching {{business_name}}, I noticed:
{{insight_based_on_research}}

We help companies like yours {{main_benefit}}. Our clients typically see {{result_metric}} within {{timeframe}}.

Would you be interested in seeing how this could work for {{business_name}}?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Competitive angle',
        subject: 'Re: What your competitors are doing',
        body: `Hi {{first_name}},

Following up on my note about {{my_product}}.

I have been researching the {{industry}} market in {{location}}, and here is what I am seeing:

Your competitors are investing in [area your product addresses]. The businesses winning market share right now are the ones who [key differentiator].

I would love to show you how {{business_name}} could get an edge. 15 minutes - if it is not valuable, I will send you a $20 gift card for your time.

Worth a shot?

Best,
{{sender_name}}`
      },
      {
        day: 6,
        action: 'Social proof from niche',
        subject: 'How we helped another {{industry}} business',
        body: `Hi {{first_name}},

Quick case study I thought you would find relevant:

[Similar company] came to us with [challenge]. Within [timeframe], they achieved:
- {{result_1}}
- {{result_2}}
- {{result_3}}

The best part? Most of this was automated after the initial setup.

I think {{business_name}} could see similar results. Can I show you how?

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'Value-add breakup',
        subject: 'Free resource + final note',
        body: `Hi {{first_name}},

I have reached out a few times about how {{my_product}} could help {{business_name}}. I will take the hint that now is not the right time.

Before I go, here is a free resource I think you will find valuable:
[Relevant guide, checklist, or tool for their industry]

No strings attached. If things change and you want to explore how we help {{industry}} businesses, I am just an email away.

Best of luck with {{business_name}}!

{{sender_name}}`
      }
    ]
  },
  {
    id: 'comp-seq-product-2',
    category: 'product-pitch',
    name: 'Market Entry Product Sequence',
    description: 'Introduce your product when entering a new market segment',
    goal: 'Acquire early adopters in a new niche',
    bestFor: 'Expanding to serve a new industry or market segment',
    emoji: '🚀',
    steps: [
      {
        day: 1,
        action: 'Market expansion announcement',
        subject: 'Introducing {{my_product}} to {{industry}}',
        body: `Hi {{first_name}},

I am {{sender_name}} from {{my_company}}. We have been successfully helping businesses with {{my_product}}, and we are now expanding to serve the {{industry}} market.

Why {{industry}}? After researching companies like {{business_name}}, I found you face similar challenges to our existing customers - particularly around [shared pain point].

We are offering founding {{industry}} customers special onboarding and pricing as we build our expertise in this space.

Interested in being an early adopter?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Early adopter benefits',
        subject: 'Re: Early adopter perks for {{business_name}}',
        body: `Hi {{first_name}},

Following up on my note about bringing {{my_product}} to {{industry}}.

As an early adopter, you would get:
- [Discount or special pricing]
- Priority feature requests - help us build for {{industry}}
- Dedicated onboarding support
- Locked-in pricing as we grow

We are limiting this to the first [X] {{industry}} businesses. {{business_name}} would be a great fit.

Worth a conversation?

Best,
{{sender_name}}`
      },
      {
        day: 8,
        action: 'Peer validation',
        subject: 'Other {{industry}} businesses joining',
        body: `Hi {{first_name}},

Quick update: since I first reached out, we have had [X] other {{industry}} businesses sign up for our early adopter program.

They are excited about [key benefit] and are already seeing [early results].

I would hate for {{business_name}} to miss out on the founding member benefits. These will not be available once we officially launch in this market.

Can we find 15 minutes this week?

Best,
{{sender_name}}`
      },
      {
        day: 14,
        action: 'Deadline-based close',
        subject: 'Last chance: founding member pricing',
        body: `Hi {{first_name}},

This is my final reach-out about our early adopter program for {{industry}} businesses.

We are closing founding member enrollment on [date]. After that, {{my_product}} will be available at standard pricing without the extra perks.

If you are still considering this for {{business_name}}, now is the time. Even a quick call could help you decide.

Either way, wishing you success!

Best,
{{sender_name}}`
      }
    ]
  },
];

export const COMPETITIVE_SEQUENCE_CATEGORIES = [
  { id: 'partnership', name: 'Partnership Sequences', emoji: '🤝', description: 'Build referral and collaboration relationships' },
  { id: 'market-research', name: 'Research Sequences', emoji: '🔬', description: 'Gather industry insights and intelligence' },
  { id: 'product-pitch', name: 'Sales Sequences', emoji: '🎯', description: 'Sell to businesses in your target niche' },
] as const;

export const getCompetitiveSequencesByCategory = (category: string): CompetitiveSequence[] => {
  return COMPETITIVE_SEQUENCES.filter(s => s.category === category);
};

export const getAllCompetitiveSequences = (): CompetitiveSequence[] => {
  return COMPETITIVE_SEQUENCES;
};
