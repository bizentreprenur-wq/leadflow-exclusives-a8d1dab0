// Email sequences organized by Search Type (A vs B) and Lead Priority (Hot/Warm/Cold)
// Option A: Super AI Business Search - Insight-driven, diagnostic, educational
// Option B: Agency Lead Finder - Revenue-driven, ROI-focused, agency language

export type SearchType = 'gmb' | 'platform';
export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface EmailStep {
  day: number;
  subject: string;
  body: string;
  action: string;
}

export interface EmailSequence {
  id: string;
  searchType: SearchType;
  priority: LeadPriority;
  name: string;
  description: string;
  goal: string;
  bestFor: string;
  steps: EmailStep[];
  emoji: string;
}

// ============================================================================
// OPTION A: Super AI Business Search Sequences
// Broad B2B, local businesses, SaaS, investors, sales teams
// These leads are problem-aware but not solution-locked - education + insight works best
// ============================================================================

const OPTION_A_SEQUENCES: EmailSequence[] = [
  // HOT LEADS - Direct action, urgency-focused
  {
    id: 'a-hot-1',
    searchType: 'gmb',
    priority: 'hot',
    name: 'Cold Intro → Value Proof',
    description: 'Start conversations with credibility, not a hard sell',
    goal: 'Quick intro + why you reached out with proof',
    bestFor: 'Hot leads showing high buying intent with website issues',
    emoji: '🔥',
    steps: [
      {
        day: 1,
        action: 'Quick intro + why you reached out',
        subject: 'Quick question about {{business_name}}',
        body: `Hi {{first_name}},

I noticed {{business_name}} while researching {{industry}} businesses in your area. Something stood out to me about your online presence that I think you'd want to know about.

I help businesses like yours fix visibility issues that are costing them customers every day.

Would you be open to a quick 5-minute call this week? I can share exactly what I found and how to fix it.

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Insight from their data',
        subject: 'Re: What I found about {{business_name}}',
        body: `Hi {{first_name}},

Following up on my last note. I ran a quick analysis on {{business_name}}'s online presence:

{{#website_issues}}
⚠️ {{issue}}
{{/website_issues}}

These issues are likely costing you 15-30% of potential customers who search for {{industry}} services online.

Want me to show you how other businesses in your space fixed these same problems?

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'Case study or result snapshot',
        subject: 'How a {{industry}} business fixed this (real results)',
        body: `Hi {{first_name}},

Last week, a {{industry}} business similar to {{business_name}} came to me with the same issues I noticed on your site.

Within 30 days:
✅ 47% increase in website visitors
✅ 23% more calls from Google
✅ First page rankings for 3 key terms

I can share exactly what we did. It's simpler than you might think.

Worth a quick chat?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Soft CTA - reply / audit / demo',
        subject: 'Free audit for {{business_name}} (no strings)',
        body: `Hi {{first_name}},

I know you're busy, so I'll keep this brief.

I'd like to send you a free audit of {{business_name}}'s online presence - no catch, no sales pitch. It takes me 10 minutes to put together and could save you hours of guesswork.

Just reply "Yes" and I'll send it over.

If you're not interested, no worries at all. I won't follow up again.

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'a-hot-2',
    searchType: 'gmb',
    priority: 'hot',
    name: '"We Found This" Audit Sequence',
    description: 'Trigger curiosity using personalized findings',
    goal: 'Highlight specific issues and explain impact',
    bestFor: 'Leads with clear website problems or digital gaps',
    emoji: '🔍',
    steps: [
      {
        day: 1,
        action: 'Highlight 1-2 specific issues/opportunities',
        subject: 'Something I noticed about {{business_name}}',
        body: `Hi {{first_name}},

While researching {{industry}} businesses, I found something interesting about {{business_name}}.

Your Google listing shows great reviews (nice work!), but I noticed a few things that might be holding you back:

1. {{primary_issue}}
2. {{secondary_issue}}

Most business owners don't even know these issues exist - but they can seriously impact how many customers find you online.

Would you like me to explain what's happening and how to fix it?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Explain why it matters (lost leads, visibility, trust)',
        subject: 'Re: Why this matters for {{business_name}}',
        body: `Hi {{first_name}},

Quick follow-up on the issues I mentioned about {{business_name}}.

Here's why these matter:

📉 Lost Visibility: Customers searching for "{{industry}} near me" might not see you
📉 Trust Signals: Modern consumers check websites before calling - if yours looks outdated, they move on
📉 Mobile Users: 60%+ of local searches happen on phones - if your site isn't mobile-friendly, you're losing them

The good news? These are all fixable. And faster than you might think.

Want me to walk you through what I'd prioritize?

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'Expanded breakdown or Loom-style explanation',
        subject: 'I made something for {{business_name}}',
        body: `Hi {{first_name}},

I put together a quick breakdown for {{business_name}} - it shows exactly what's happening with your online presence and what I'd fix first.

It's a 2-minute read. No sales pitch, just data.

Want me to send it over?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'CTA to review full report or talk',
        subject: 'Last note - free report ready for {{business_name}}',
        body: `Hi {{first_name}},

Just wanted to circle back one more time.

I've got a full analysis ready for {{business_name}} that covers:
• What's working well
• What's costing you customers
• Quick wins you could implement this week

It's sitting here ready to go. Just say the word and I'll send it.

Either way, best of luck with {{business_name}}!

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'a-hot-3',
    searchType: 'gmb',
    priority: 'hot',
    name: 'Pain-Focused Problem Agitation',
    description: 'Make the cost of inaction obvious',
    goal: 'Show what inaction is costing them',
    bestFor: 'Leads in competitive markets who need urgency',
    emoji: '⚡',
    steps: [
      {
        day: 1,
        action: 'Common mistakes businesses like theirs make',
        subject: 'The #1 mistake {{industry}} businesses make online',
        body: `Hi {{first_name}},

After analyzing hundreds of {{industry}} businesses, I've noticed a pattern that costs owners thousands in missed opportunities.

The mistake? Assuming their online presence is "good enough."

Most business owners are so focused on operations that they don't realize their website and Google listing are actively turning customers away.

Is this something you've thought about for {{business_name}}?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'What it is costing them (leads, rankings, trust)',
        subject: 'Re: What this is costing {{business_name}}',
        body: `Hi {{first_name}},

Let me put some numbers to this.

Businesses with outdated websites or weak Google presence typically see:
• 40% fewer calls than optimized competitors
• Higher bounce rates (people leave in seconds)
• Lower search rankings (buried under competitors)

For a {{industry}} business like {{business_name}}, that could mean losing 5-10 potential customers per week to competitors who've invested in their online presence.

The math adds up fast.

Worth a conversation?

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'How competitors are fixing it',
        subject: 'What your competitors are doing ({{industry}})',
        body: `Hi {{first_name}},

I looked at some of {{business_name}}'s top competitors in your area.

Here's what they're doing differently:
✅ Mobile-optimized websites
✅ Active Google Business profiles with weekly updates
✅ Fast-loading pages with clear calls-to-action
✅ Review management strategies

They're not necessarily better at what you do - they just show up better online.

Want to level the playing field?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Offer solution/demo',
        subject: 'Let me help {{business_name}} compete',
        body: `Hi {{first_name}},

I've shared a lot about what might be holding {{business_name}} back. Now I'd like to help fix it.

I have 2 spots open this week for a free 15-minute strategy call. I'll share:
• Exactly what to prioritize first
• Quick wins you can implement today
• A realistic timeline for results

No pressure, no hard sell. Just useful advice.

Interested?

Best,
{{sender_name}}`
      }
    ]
  },

  // WARM LEADS - Value-focused, relationship-building
  {
    id: 'a-warm-1',
    searchType: 'gmb',
    priority: 'warm',
    name: 'Social Proof & Authority',
    description: 'Reduce skepticism with credibility',
    goal: 'Build trust before asking for anything',
    bestFor: 'Leads who need more trust-building before engagement',
    emoji: '⭐',
    steps: [
      {
        day: 1,
        action: 'Who you help + quick credibility',
        subject: 'Helping {{industry}} businesses grow online',
        body: `Hi {{first_name}},

I help {{industry}} businesses like {{business_name}} get more customers through better online visibility.

Over the past year, I've worked with 40+ local businesses to:
• Improve Google rankings
• Fix website issues that lose customers
• Build review strategies that attract new clients

I came across {{business_name}} and saw some opportunities that might interest you.

Would you be open to hearing what I found?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Mini case study',
        subject: 'How we helped a {{industry}} business like yours',
        body: `Hi {{first_name}},

Quick story I thought you'd find relevant:

A {{industry}} business owner came to me frustrated. Great service, loyal customers, but struggling to attract new ones online.

Within 60 days:
📈 200% increase in Google views
📈 35% more website inquiries
📈 First page for 5 local keywords

The best part? Most of the work was simple fixes they didn't know needed fixing.

Sound like something {{business_name}} could benefit from?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Aggregated results or testimonials',
        subject: 'What business owners are saying',
        body: `Hi {{first_name}},

Here's what some of my clients have said:

"I didn't realize how much business I was losing online until we fixed these issues." - Mike, Plumbing Company

"The changes were simple but the results were immediate. More calls within the first week." - Sarah, Dental Practice

"Finally, someone who explained this in plain English." - Tom, Auto Shop

I'd love to help {{business_name}} get similar results.

Worth a quick chat?

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'Invite to try / see it applied to them',
        subject: 'Free preview for {{business_name}}',
        body: `Hi {{first_name}},

I'd like to show you exactly what I'd do for {{business_name}} - before you commit to anything.

No charge, no obligation. Just a clear picture of:
• Where you stand now
• What's holding you back
• What results you could expect

If it makes sense to work together after that, great. If not, you'll still walk away with useful insights.

Want me to put this together for you?

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'a-warm-2',
    searchType: 'gmb',
    priority: 'warm',
    name: 'Re-Engagement "Still Open?"',
    description: 'Revive cold leads with fresh approach',
    goal: 'Restart conversation with new value',
    bestFor: 'Leads who went silent or need a nudge',
    emoji: '🔄',
    steps: [
      {
        day: 1,
        action: 'Polite follow-up',
        subject: 'Circling back on {{business_name}}',
        body: `Hi {{first_name}},

A while back I reached out about helping {{business_name}} improve your online presence.

I know things get busy, so I wanted to check in and see if this is still on your radar.

Is now a better time to chat?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'New insight or updated data',
        subject: 'Something changed for {{business_name}}',
        body: `Hi {{first_name}},

I took another look at {{business_name}}'s online presence and noticed some changes since we last spoke.

A few things that caught my eye:
• {{new_insight_1}}
• {{new_insight_2}}

These could be quick wins if addressed soon.

Want me to share more details?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Scarcity or time-based angle',
        subject: 'Quick window for {{business_name}}',
        body: `Hi {{first_name}},

I'm opening up a few spots for local {{industry}} businesses who want to improve their online presence before the busy season.

Given what I've seen about {{business_name}}, I think you'd be a great fit.

But I can only take on 3 new clients this month.

Any interest in being one of them?

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'Close the loop CTA',
        subject: 'Should I close your file?',
        body: `Hi {{first_name}},

I've reached out a few times about helping {{business_name}} grow online, but I haven't heard back.

I don't want to keep bothering you if this isn't the right fit or right time.

Could you let me know either way? A simple "not now" works perfectly.

Thanks for your time!

Best,
{{sender_name}}`
      }
    ]
  },

  // COLD LEADS - Educational, awareness-building, low-pressure
  {
    id: 'a-cold-1',
    searchType: 'gmb',
    priority: 'cold',
    name: 'Gentle Introduction',
    description: 'Low-pressure intro that opens dialogue',
    goal: 'Start a conversation without selling',
    bestFor: 'New leads with unknown intent or interest level',
    emoji: '👋',
    steps: [
      {
        day: 1,
        action: 'Soft intro + genuine compliment',
        subject: 'Came across {{business_name}} today',
        body: `Hi {{first_name}},

I was researching {{industry}} businesses and came across {{business_name}}. Love what you've built!

I work with local businesses to help them get more visibility online. I'm not sure if it's something you need, but I'd be curious to learn more about your goals.

Is online marketing something you're thinking about?

No pressure either way - just wanted to say hello.

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Share free resource',
        subject: 'Free resource for {{industry}} businesses',
        body: `Hi {{first_name}},

Following up with something I thought might be useful.

I put together a quick checklist of the 7 things every {{industry}} business should have in place online. It takes about 5 minutes to go through.

Would you like a copy? It's free - just reply "yes" and I'll send it over.

Best,
{{sender_name}}`
      },
      {
        day: 8,
        action: 'Industry trend/insight',
        subject: 'Interesting trend in {{industry}}',
        body: `Hi {{first_name}},

I've been tracking trends in the {{industry}} space and noticed something interesting that might affect businesses like {{business_name}}.

More customers than ever are researching local businesses online before calling. The businesses that show up well are winning most of the new business.

Have you seen this shift affect your business?

Best,
{{sender_name}}`
      },
      {
        day: 12,
        action: 'Respectful close',
        subject: 'Last note from me',
        body: `Hi {{first_name}},

I've sent a few notes but haven't heard back - totally understand, you're busy running {{business_name}}!

If you ever want to chat about improving your online presence, my door is always open. Just reply to this email.

Wishing you continued success!

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'a-cold-2',
    searchType: 'gmb',
    priority: 'cold',
    name: 'Investor/SaaS Data Intelligence',
    description: 'Position as research & intelligence tool',
    goal: 'Speak to data-driven decision makers',
    bestFor: 'SaaS companies, investors, market researchers',
    emoji: '📊',
    steps: [
      {
        day: 1,
        action: 'Market or competitor insight',
        subject: 'Competitive intelligence for {{business_name}}',
        body: `Hi {{first_name}},

I specialize in providing competitive intelligence for businesses like {{business_name}}.

Using AI-powered analysis, I can give you insights into:
• How your competitors are positioning themselves
• Gaps in the market you could exploit
• Customer sentiment trends in your space

Would competitive intelligence be valuable for your strategy?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'How this data gives an edge',
        subject: 'Re: Data that gives you an edge',
        body: `Hi {{first_name}},

Quick follow-up on competitive intelligence.

Companies using this data are able to:
📈 Identify market opportunities before competitors
📈 Understand customer pain points at scale
📈 Track competitor moves in real-time

For {{business_name}}, this could mean staying ahead of market shifts instead of reacting to them.

Worth a brief call to explore?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Demo of workflow or analysis',
        subject: 'Sample analysis for {{industry}} market',
        body: `Hi {{first_name}},

I put together a sample competitive analysis for the {{industry}} market that I thought might interest you.

It includes:
• Top player positioning
• Market gap analysis
• Customer sentiment breakdown

Would you like me to send it over? It might give you ideas for {{business_name}}'s strategy.

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'CTA to explore use case',
        subject: 'Custom intelligence for {{business_name}}',
        body: `Hi {{first_name}},

I'd like to offer you a custom competitive intelligence report for {{business_name}} - on the house.

It would include:
• Your top 5 competitors analyzed
• Market positioning gaps
• Actionable recommendations

If the insights prove valuable, we can talk about ongoing intelligence. If not, you keep the report.

Interested?

Best,
{{sender_name}}`
      }
    ]
  }
];

// ============================================================================
// OPTION B: Agency Lead Finder Sequences  
// Web devs, SMMA agencies, freelancers
// These leads are solution-aware and revenue-driven - ROI & client acquisition is king
// ============================================================================

const OPTION_B_SEQUENCES: EmailSequence[] = [
  // HOT LEADS - Direct offer, ROI-focused
  {
    id: 'b-hot-1',
    searchType: 'platform',
    priority: 'hot',
    name: '"Get More Clients" Direct Offer',
    description: 'Straightforward acquisition pitch for agencies',
    goal: 'Show how to find ready-to-buy clients',
    bestFor: 'Agencies actively looking for new clients',
    emoji: '🚀',
    steps: [
      {
        day: 1,
        action: 'How agencies struggle with consistent leads',
        subject: 'Struggling to find agency clients?',
        body: `Hi {{first_name}},

If you're like most web designers and SMMA owners, you know the feast-or-famine cycle too well.

One month you're slammed with projects. The next, you're scrambling to find clients.

What if you could find businesses actively needing your services - before your competitors reach them?

I built a tool that does exactly that. It finds businesses with:
• Outdated or broken websites
• No mobile optimization
• Weak social media presence
• Poor Google visibility

These are your perfect clients. And they're out there right now.

Want to see it in action?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'How the tool finds ready-to-buy clients',
        subject: 'Re: Clients who NEED your services (today)',
        body: `Hi {{first_name}},

Quick follow-up on finding agency clients.

Here's how it works:
1. Search any niche + location (e.g., "dentists in Chicago")
2. Get a list of businesses with digital problems
3. See exactly what's wrong with each one
4. Reach out with a personalized pitch

Instead of cold calling businesses who might need help, you're reaching out to businesses who definitely need help.

The difference in response rates is massive.

Worth a quick demo?

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'Example lead / niche',
        subject: 'Example: 47 {{industry}} businesses needing websites',
        body: `Hi {{first_name}},

I just ran a quick search for "{{industry}} businesses with website issues" in a mid-sized city.

Found 47 businesses in 2 minutes. Here's what they look like:
• 12 with no website at all
• 18 with non-mobile-friendly sites
• 9 with broken contact forms
• 8 with outdated designs (5+ years old)

Each one is a potential $2,000-$10,000 client for you.

Want me to show you how to find them in your target market?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'CTA to demo or trial',
        subject: 'Free trial - find clients today',
        body: `Hi {{first_name}},

I'd like to offer you a free 14-day trial to find agency clients.

No credit card needed. Just pick a niche, run a search, and see what comes up.

If it doesn't help you land at least one new client, no harm done.

But most agencies find their first prospect within hours.

Ready to try it?

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'b-hot-2',
    searchType: 'platform',
    priority: 'hot',
    name: 'Client Pain Matching',
    description: 'Show alignment with their services',
    goal: 'Match client problems to agency services',
    bestFor: 'Agencies with specific service offerings',
    emoji: '🎯',
    steps: [
      {
        day: 1,
        action: 'Clients actively needing web/SEO/ads',
        subject: 'Clients who need {{service_type}} right now',
        body: `Hi {{first_name}},

If you offer {{service_type}} services, I have something that'll interest you.

I can show you a list of local businesses that:
✅ Have problems your service solves
✅ Have the budget to pay for solutions
✅ Are actively being searched by customers (so they feel the pain)

These aren't cold leads. They're businesses with visible problems that you can fix.

Want to see what I mean?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Breakdown of service demand',
        subject: 'Re: The demand for {{service_type}} is huge',
        body: `Hi {{first_name}},

Quick data point for you:

In the average city, I find:
• 300+ businesses with no website
• 500+ with outdated websites
• 400+ not showing up in local search
• 200+ with broken mobile experiences

Each category is a potential client for a {{service_type}} agency like yours.

The best part? Your competitors aren't reaching out to most of them.

First mover advantage is real.

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'How agencies convert these faster',
        subject: 'Why these leads close 3x faster',
        body: `Hi {{first_name}},

Here's why leads from this system close so much faster than traditional cold outreach:

1. You know their problem before you call
2. You can show them exactly what's wrong
3. You position yourself as an expert, not a cold caller
4. They've already felt the pain (lost customers, missed calls)

One agency owner told me his close rate went from 10% to 40% using this approach.

Same skills. Better leads.

Want to see how it works?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'CTA to see leads in their niche',
        subject: 'Your niche, your leads, free',
        body: `Hi {{first_name}},

Tell me your target niche and location, and I'll send you a free sample of 10 businesses that need your services.

No catch. I just want to show you what's possible.

What niche are you targeting?

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'b-hot-3',
    searchType: 'platform',
    priority: 'hot',
    name: 'Agency Growth Case Study',
    description: 'Speak their language (MRR, retainers, close rates)',
    goal: 'Show real agency growth results',
    bestFor: 'Agencies focused on scaling revenue',
    emoji: '📈',
    steps: [
      {
        day: 1,
        action: 'Agency before using the system',
        subject: 'How a freelancer went from $3K to $15K/month',
        body: `Hi {{first_name}},

6 months ago, Jake was a freelance web designer making $3,000/month.

He was good at his craft, but terrible at finding clients. Sound familiar?

Then he started using a system to find businesses with website problems in his area.

Now he runs a 3-person agency doing $15K/month.

The difference? He stopped waiting for referrals and started reaching out to businesses who actually needed him.

Want to know exactly what he did?

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Leads booked / deals closed',
        subject: 'Re: The numbers behind the growth',
        body: `Hi {{first_name}},

Here are Jake's actual numbers over 6 months:

Month 1: 50 leads found, 15 emails sent, 2 clients ($4K)
Month 2: 100 leads found, 30 emails sent, 4 clients ($8K)
Month 3: Refined approach, 5 clients ($11K)
Month 4-6: Hired help, scaled to $15K/month

Total cost? About 2 hours per week finding and contacting leads.

The math works because the leads are pre-qualified. They actually need help.

Best,
{{sender_name}}`
      },
      {
        day: 5,
        action: 'Time saved vs cold outreach',
        subject: 'Cold outreach is dead. This works.',
        body: `Hi {{first_name}},

The old way: Buy a list, blast emails, hope someone responds.
Response rate: 0.5% if you're lucky.

The new way: Find businesses with visible problems, personalize your pitch.
Response rate: 15-30%.

Same effort. 30x better results.

The difference is targeting businesses who already know they have a problem.

Want to see this in action for your agency?

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'CTA to replicate results',
        subject: 'Replicate these results - free trial',
        body: `Hi {{first_name}},

I'd like to help you grow your agency the same way Jake did.

Start with a 14-day free trial:
✅ Find unlimited leads in any niche
✅ See exactly what's wrong with their online presence
✅ Use proven templates to reach out
✅ Track responses and close deals

If you don't land at least one new prospect, I'll extend your trial.

Ready to grow?

Best,
{{sender_name}}`
      }
    ]
  },

  // WARM LEADS - Value-driven, proof-focused
  {
    id: 'b-warm-1',
    searchType: 'platform',
    priority: 'warm',
    name: 'Niche-Specific Sequence',
    description: 'Hyper-relevance for specific industries',
    goal: 'Speak directly to niche opportunities',
    bestFor: 'Agencies specializing in specific verticals',
    emoji: '🏢',
    steps: [
      {
        day: 1,
        action: 'Demand in that niche',
        subject: '{{niche}} businesses desperately need websites',
        body: `Hi {{first_name}},

Did you know that {{niche}} is one of the most underserved markets for web services?

I just ran a search and found hundreds of {{niche}} businesses with:
• No website at all
• Outdated WordPress themes
• Broken contact forms
• Zero mobile optimization

These businesses have money. They just haven't found the right agency yet.

Want to be that agency?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Common gaps agencies can exploit',
        subject: 'Re: Why {{niche}} is perfect for agencies',
        body: `Hi {{first_name}},

Here's why {{niche}} is a goldmine for web agencies:

1. High ticket services = they can afford $3K-$10K websites
2. Local competition = they need to stand out online
3. Referral networks = one client leads to 3-5 more
4. Recurring revenue = they need ongoing SEO/ads management

Plus, most {{niche}} business owners are too busy to fix their website themselves.

They just need someone to show them the problem.

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Example client scenario',
        subject: 'Scenario: How to land a {{niche}} client',
        body: `Hi {{first_name}},

Here's exactly how I'd land a {{niche}} client this week:

1. Search "{{niche}} in [city]" with website filters
2. Find 20 businesses with outdated/no websites
3. Send each one a personalized email highlighting their specific issue
4. Offer a free website audit as the hook
5. Close 2-4 deals at $3K-$5K each

Total time: 3-4 hours
Potential revenue: $6K-$20K

Want me to show you how to run this exact search?

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'CTA to unlock that niche',
        subject: 'Unlock {{niche}} leads today',
        body: `Hi {{first_name}},

I'd like to give you access to find {{niche}} leads in any city.

For the next 14 days, completely free:
• Search any location
• Filter by website issues
• Export contact details
• Use AI-powered outreach templates

No credit card. Just results.

Ready to start?

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'b-warm-2',
    searchType: 'platform',
    priority: 'warm',
    name: 'Comparison - "Why This Beats Cold Outreach"',
    description: 'Kill objections about traditional methods',
    goal: 'Show superiority over old methods',
    bestFor: 'Agencies frustrated with current lead gen',
    emoji: '⚔️',
    steps: [
      {
        day: 1,
        action: 'Why cold scraping & spam fail',
        subject: 'Why your cold emails aren\'t working',
        body: `Hi {{first_name}},

If you've tried cold email for your agency, you've probably noticed:
• 0.5-1% response rates
• Lots of "unsubscribe" replies
• Wasted time on unqualified leads
• Feeling like a spammer

The problem isn't your email copy. It's your list.

You're reaching out to businesses who might need help. What if you could reach businesses who definitely need help?

That changes everything.

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'Warm intent vs cold lists',
        subject: 'Re: Cold leads vs. warm leads',
        body: `Hi {{first_name}},

Here's the difference:

Cold lead: Random business, unknown needs, no urgency
Result: Ignored, deleted, or annoyed

Warm lead: Business with visible problems, likely feeling pain
Result: Interested, engaged, ready to talk

When you can see their broken website before you reach out, you're not cold calling anymore.

You're offering a solution to a problem they already know they have.

Best,
{{sender_name}}`
      },
      {
        day: 7,
        action: 'Platform differentiation',
        subject: 'What makes this different',
        body: `Hi {{first_name}},

Most lead gen tools give you contact info. That's it.

This platform gives you:
✅ Businesses with verified website problems
✅ AI analysis of what's wrong
✅ Mobile score, speed score, SEO score
✅ Suggested pitch angle for each lead
✅ Prioritized by likelihood to close

It's not just a list. It's a client acquisition system.

Want to see the difference?

Best,
{{sender_name}}`
      },
      {
        day: 10,
        action: 'CTA to try it',
        subject: 'Try it free - 14 days',
        body: `Hi {{first_name}},

Actions speak louder than words.

Try the platform free for 14 days. Find leads, reach out, see what happens.

If you don't get better results than cold outreach, you've lost nothing.

But most agencies are surprised by how quickly they book calls.

Ready?

Best,
{{sender_name}}`
      }
    ]
  },

  // COLD LEADS - Educational, low-friction entry
  {
    id: 'b-cold-1',
    searchType: 'platform',
    priority: 'cold',
    name: 'Free Value → Upsell',
    description: 'Lower friction entry with free value',
    goal: 'Build trust with free resources first',
    bestFor: 'Cold leads who need warming up',
    emoji: '🎁',
    steps: [
      {
        day: 1,
        action: 'Free lead sample or insight',
        subject: 'Free: 10 businesses in your area that need websites',
        body: `Hi {{first_name}},

I'd like to send you a free list of 10 businesses in your area that need website help.

Each one includes:
• Business name and contact info
• What's wrong with their current site
• Suggested pitch angle

No strings attached. I just want to show you what's possible.

What area should I search?

Best,
{{sender_name}}`
      },
      {
        day: 4,
        action: 'How to close that type of lead',
        subject: 'Re: How to turn these leads into clients',
        body: `Hi {{first_name}},

If you got my last email, you might be wondering: "How do I actually close these leads?"

Here's the simple formula:

1. Send a personalized email highlighting their specific issue
2. Offer a free 10-minute audit call
3. On the call, show them what's wrong (they can see it themselves)
4. Offer to fix it for a fair price

Close rate with this approach: 20-40%

Compare that to cold calling. Night and day.

Best,
{{sender_name}}`
      },
      {
        day: 8,
        action: 'Show system at scale',
        subject: 'What if you had 100 leads like this?',
        body: `Hi {{first_name}},

Imagine having 100 businesses every month who need your services.

That's what the full platform gives you:
• Unlimited searches in any niche/location
• AI prioritization of best prospects
• Automated outreach sequences
• Response tracking

Most agencies land 3-5 new clients per month with this system.

At $3K average per client, that's $9K-$15K in new monthly revenue.

Worth exploring?

Best,
{{sender_name}}`
      },
      {
        day: 12,
        action: 'CTA to upgrade/book call',
        subject: 'Quick call about growing your agency?',
        body: `Hi {{first_name}},

I've sent a few resources your way. Hope they've been helpful!

If you're serious about growing your agency, I'd love to hop on a quick 15-minute call.

I'll show you:
• How to find clients in your target niche
• The exact templates that get responses
• How other agencies are scaling

No pressure. Just useful stuff.

Got 15 minutes this week?

Best,
{{sender_name}}`
      }
    ]
  },
  {
    id: 'b-cold-2',
    searchType: 'platform',
    priority: 'cold',
    name: 'Trial Expiry / Demo Follow-Up',
    description: 'Convert active trial users',
    goal: 'Re-engage users who tried but didn\'t convert',
    bestFor: 'Leads who started trial but haven\'t converted',
    emoji: '⏰',
    steps: [
      {
        day: 1,
        action: 'Usage recap',
        subject: 'You found {{lead_count}} leads - here\'s what\'s next',
        body: `Hi {{first_name}},

I noticed you've been exploring the platform and found {{lead_count}} potential clients.

Nice work! 🎉

But I also noticed you haven't reached out to any of them yet.

Want me to help you craft the perfect first email? It takes 2 minutes and could land you your next client.

Best,
{{sender_name}}`
      },
      {
        day: 3,
        action: 'Missed opportunities',
        subject: 'These leads won\'t wait forever',
        body: `Hi {{first_name}},

Just a heads up - the {{lead_count}} leads you found are still out there.

But they won't wait forever. Your competitors might find them first.

Even reaching out to 10 of them could land you 1-2 new clients.

At $3K per project, that's real money.

Need help getting started?

Best,
{{sender_name}}`
      },
      {
        day: 6,
        action: 'Bonus or incentive',
        subject: 'Bonus: Free outreach templates inside',
        body: `Hi {{first_name}},

I added something to your account: 5 proven outreach templates used by top agencies.

These aren't generic templates. They're specifically designed for reaching out to businesses with website problems.

Average response rate: 25%+

Log in and check them out. They might be the push you need to land your next client.

Best,
{{sender_name}}`
      },
      {
        day: 9,
        action: 'Final CTA',
        subject: 'Your trial ends in 5 days',
        body: `Hi {{first_name}},

Quick reminder: Your free trial ends in 5 days.

Before it does, I'd love for you to land at least one client using the platform.

Here's my challenge: Pick 10 leads and send them a personalized email today.

Track your responses. I bet you'll be surprised.

And if you want to keep access after the trial? It's just $49/month.

That's less than one small project pays.

Best,
{{sender_name}}`
      }
    ]
  }
];

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Get all sequences for a specific search type
 */
export function getSequencesBySearchType(searchType: SearchType): EmailSequence[] {
  return searchType === 'gmb' ? OPTION_A_SEQUENCES : OPTION_B_SEQUENCES;
}

/**
 * Get sequences filtered by search type and priority
 */
export function getSequencesByPriority(
  searchType: SearchType,
  priority: LeadPriority
): EmailSequence[] {
  const sequences = getSequencesBySearchType(searchType);
  return sequences.filter(s => s.priority === priority);
}

/**
 * Get a specific sequence by ID
 */
export function getSequenceById(id: string): EmailSequence | undefined {
  return [...OPTION_A_SEQUENCES, ...OPTION_B_SEQUENCES].find(s => s.id === id);
}

/**
 * Get suggested sequence based on lead data and search type
 */
export function getSuggestedSequence(
  searchType: SearchType,
  lead: {
    aiClassification?: LeadPriority;
    priority?: LeadPriority;
    leadScore?: number;
    hasWebsite?: boolean;
    websiteIssues?: string[];
  }
): EmailSequence {
  // Determine priority
  let priority: LeadPriority = 'cold';
  
  if (lead.aiClassification) {
    priority = lead.aiClassification;
  } else if (lead.priority) {
    priority = lead.priority as LeadPriority;
  } else if (lead.leadScore !== undefined) {
    if (lead.leadScore >= 70) priority = 'hot';
    else if (lead.leadScore >= 40) priority = 'warm';
  }

  // Get sequences for this search type and priority
  const sequences = getSequencesByPriority(searchType, priority);
  
  // For hot leads with no website, use audit sequence for Option A
  if (searchType === 'gmb' && priority === 'hot' && !lead.hasWebsite) {
    const auditSequence = sequences.find(s => s.id === 'a-hot-2');
    if (auditSequence) return auditSequence;
  }
  
  // For hot leads with website issues, use pain-focused for Option A
  if (searchType === 'gmb' && priority === 'hot' && lead.websiteIssues?.length) {
    const painSequence = sequences.find(s => s.id === 'a-hot-3');
    if (painSequence) return painSequence;
  }

  // Default to first sequence for that priority
  return sequences[0] || getSequencesBySearchType(searchType)[0];
}

/**
 * Personalize a sequence step with lead data
 */
export function personalizeSequenceStep(
  step: EmailStep,
  lead: {
    business_name?: string;
    first_name?: string;
    email?: string;
    website?: string;
    industry?: string;
    websiteIssues?: string[];
  },
  senderName = 'Your Name'
): { subject: string; body: string } {
  const tokens: Record<string, string> = {
    '{{business_name}}': lead.business_name || 'your business',
    '{{first_name}}': lead.first_name || 'there',
    '{{email}}': lead.email || '',
    '{{website}}': lead.website || '',
    '{{industry}}': lead.industry || 'your industry',
    '{{sender_name}}': senderName,
    '{{service_type}}': 'web design',
    '{{niche}}': lead.industry || 'local business',
    '{{primary_issue}}': lead.websiteIssues?.[0] || 'website visibility issues',
    '{{secondary_issue}}': lead.websiteIssues?.[1] || 'mobile optimization gaps',
    '{{lead_count}}': '25',
    '{{new_insight_1}}': 'Your Google listing has been updated',
    '{{new_insight_2}}': 'Competitor activity in your area increased',
  };

  let subject = step.subject;
  let body = step.body;

  // Handle conditional sections (simple version)
  body = body.replace(/\{\{#website_issues\}\}[\s\S]*?\{\{\/website_issues\}\}/g, () => {
    if (lead.websiteIssues?.length) {
      return lead.websiteIssues.map(issue => `⚠️ ${issue}`).join('\n');
    }
    return '⚠️ Online visibility could be improved';
  });

  for (const [token, value] of Object.entries(tokens)) {
    const regex = new RegExp(token.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

/**
 * Get priority stats for a search type
 */
export function getSequenceStats(searchType: SearchType): {
  priority: LeadPriority;
  count: number;
  label: string;
  emoji: string;
}[] {
  return [
    { 
      priority: 'hot', 
      count: getSequencesByPriority(searchType, 'hot').length, 
      label: 'Hot', 
      emoji: '🔥' 
    },
    { 
      priority: 'warm', 
      count: getSequencesByPriority(searchType, 'warm').length, 
      label: 'Warm', 
      emoji: '🌡️' 
    },
    { 
      priority: 'cold', 
      count: getSequencesByPriority(searchType, 'cold').length, 
      label: 'Cold', 
      emoji: '❄️' 
    },
  ];
}

// Export all sequences for reference
export const ALL_SEQUENCES = [...OPTION_A_SEQUENCES, ...OPTION_B_SEQUENCES];
export { OPTION_A_SEQUENCES, OPTION_B_SEQUENCES };
