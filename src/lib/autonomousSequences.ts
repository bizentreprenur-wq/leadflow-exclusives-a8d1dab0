// Autonomous 7-Step Email Sequences for AI Autopilot
// Each scenario has a complete 7-email drip sequence that runs fully autonomously
// Designed for the $249/mo Autopilot tier - AI sends without human approval

export interface AutonomousStep {
  day: number;
  subject: string;
  body: string;
  aiAction: string;
  pauseTriggers?: string[]; // Sentiment keywords that trigger auto-pause
}

export interface AutonomousSequence {
  id: string;
  scenarioId: string;
  name: string;
  description: string;
  trigger: string; // What lead characteristic triggers this sequence
  searchType: 'gmb' | 'platform' | 'both';
  steps: AutonomousStep[];
  expectedResponseDay: number; // When AI typically sees responses
  icon: string;
}

// ============================================================================
// SCENARIO 1: NO WEBSITE
// Lead has no website - high conversion potential for web design services
// ============================================================================
const NO_WEBSITE_SEQUENCE: AutonomousSequence = {
  id: 'auto-no-website',
  scenarioId: 'no-website',
  name: 'No Website Rescue',
  description: 'For leads with no online presence - converts at 18-25%',
  trigger: 'Lead has no website detected',
  searchType: 'both',
  icon: '🌐',
  expectedResponseDay: 3,
  steps: [
    {
      day: 1,
      aiAction: 'Introduce problem gently, create awareness',
      subject: "Quick question about {{business_name}}'s online presence",
      body: `Hi {{first_name}},

I came across {{business_name}} while researching {{industry}} businesses in {{location}}.

I noticed you don't have a website yet. In 2024, 97% of customers search online before making a purchase decision — which means potential customers are finding your competitors instead of you.

I help {{industry}} businesses like yours get online quickly and affordably.

Would you be interested in a quick chat about your options?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'tell me more', 'how much', 'call me']
    },
    {
      day: 3,
      aiAction: 'Quantify the cost of not having a website',
      subject: "What's no website costing {{business_name}}?",
      body: `Hi {{first_name}},

Following up on my last note. Here's what businesses without websites typically miss:

📉 **87% of customers** won't consider a business they can't find online
📉 **60% of searches** are "near me" searches - invisible without a site
📉 **Your competitors** are showing up where you're not

The good news? Getting online is faster and more affordable than most people think.

I've helped businesses like yours go from invisible to fully booked in 30 days.

Worth a quick conversation?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'okay', 'sure', 'price', 'cost']
    },
    {
      day: 5,
      aiAction: 'Share a relevant case study',
      subject: 'How a {{industry}} business went from zero to hero online',
      body: `Hi {{first_name}},

Quick story I thought you'd appreciate:

A {{industry}} business owner came to me 6 months ago — no website, struggling to compete with bigger players.

**Within 60 days:**
✅ Professional website launched
✅ Showing up in Google searches
✅ 47% increase in customer inquiries
✅ Competing with businesses 10x their size

The investment paid for itself in the first month.

I'd love to share how we could do the same for {{business_name}}.

15 minutes. No pressure.

Best,
{{sender_name}}`,
      pauseTriggers: ['sounds good', 'interested', 'when', 'schedule', 'calendar']
    },
    {
      day: 8,
      aiAction: 'Offer a free mockup or preview',
      subject: "I made something for {{business_name}} (no strings attached)",
      body: `Hi {{first_name}},

I was thinking about {{business_name}} and put together a quick preview of what your website could look like.

It's just a concept — but it shows the potential.

Want me to send it over? No cost, no commitment. Just a 30-second preview of what's possible.

If you like it, we can talk. If not, you'll have some ideas for whenever you're ready.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'send it', 'sure', 'love to see', 'show me']
    },
    {
      day: 11,
      aiAction: 'Create urgency with limited availability',
      subject: "Quick heads up from {{sender_name}}",
      body: `Hi {{first_name}},

I wanted to give you a heads up — I'm opening 3 spots this month for new website projects, and I thought of {{business_name}}.

Given your industry and location, I think you'd be a great fit for what I do.

No pressure if the timing isn't right. But if you've been thinking about finally getting online, now might be the time.

Let me know either way?

Best,
{{sender_name}}`,
      pauseTriggers: ['available', 'open', 'interested', 'let\'s talk', 'book']
    },
    {
      day: 15,
      aiAction: 'Add social proof and reduce risk',
      subject: 'What other {{industry}} owners are saying',
      body: `Hi {{first_name}},

Here's what some of my recent clients have said:

> "I wish I'd done this years ago. The website paid for itself in the first month." — Mike, Plumber

> "I was nervous about the tech stuff, but everything was handled for me." — Sarah, Salon Owner

> "My competitors are now asking ME how I'm getting so many online leads." — Tom, Contractor

If {{business_name}} is ready to join them, I'd love to help.

Worth a quick call this week?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'call', 'schedule', 'yes', 'okay']
    },
    {
      day: 20,
      aiAction: 'Graceful close with door open',
      subject: 'Last note from me ({{business_name}})',
      body: `Hi {{first_name}},

I've reached out a few times about helping {{business_name}} get online.

I don't want to be a nuisance, so this will be my last email for now.

If you ever decide it's time to take {{business_name}} online, I'll be here. Just reply to this email and we can pick up the conversation.

Wishing you all the best!

Best,
{{sender_name}}

P.S. — Keep this email handy. When you're ready, it's as easy as hitting reply.`,
      pauseTriggers: ['interested', 'ready', 'now', 'let\'s do it', 'call']
    }
  ]
};

// ============================================================================
// SCENARIO 2: OUTDATED WEBSITE
// Lead has a website but it needs modernization
// ============================================================================
const OUTDATED_WEBSITE_SEQUENCE: AutonomousSequence = {
  id: 'auto-outdated-website',
  scenarioId: 'outdated-website',
  name: 'Website Modernization',
  description: 'For leads with outdated, slow, or non-mobile websites - converts at 15-22%',
  trigger: 'Website needs upgrade (outdated design, slow, not mobile-friendly)',
  searchType: 'both',
  icon: '🔧',
  expectedResponseDay: 4,
  steps: [
    {
      day: 1,
      aiAction: 'Identify specific issues without being negative',
      subject: 'Something I noticed about {{business_name}}.com',
      body: `Hi {{first_name}},

I was researching {{industry}} businesses and came across {{business_name}}'s website.

I noticed a few things that might be holding you back from getting more customers:

{{#website_issues}}
• {{issue}}
{{/website_issues}}

These are common issues that many business owners don't know exist — but they can significantly impact how many customers find and trust you online.

Would you like me to share a quick breakdown of what I found and how to fix it?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'interested', 'what issues', 'tell me more', 'send it']
    },
    {
      day: 3,
      aiAction: 'Explain the business impact of these issues',
      subject: "Why this matters for {{business_name}}'s bottom line",
      body: `Hi {{first_name}},

Quick follow-up on the issues I mentioned.

Here's why they matter for {{business_name}}:

📱 **Mobile visitors** (60%+ of traffic) likely leave within seconds
🐌 **Slow load times** cost you 7% in conversions for every second of delay
🔍 **Google rankings** suffer when sites aren't mobile-optimized
💰 **Customers** choose competitors with better-looking, faster sites

The good news? Modern websites load in under 2 seconds and convert 2-3x better.

I can show you exactly what needs to change — want me to put together a quick analysis?

Best,
{{sender_name}}`,
      pauseTriggers: ['sure', 'yes', 'okay', 'analysis', 'show me']
    },
    {
      day: 6,
      aiAction: 'Share a before/after transformation',
      subject: 'Before & after: A {{industry}} business like yours',
      body: `Hi {{first_name}},

Want to see what's possible?

I recently helped a {{industry}} business update their outdated website:

**BEFORE:**
❌ 8-second load time
❌ Not mobile-friendly
❌ 70% bounce rate
❌ 2-3 leads per week

**AFTER:**
✅ 1.5-second load time
✅ Perfect mobile experience
✅ 35% bounce rate
✅ 12-15 leads per week

Same business. Same location. Just a modern website.

Interested in seeing what this could look like for {{business_name}}?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'show me', 'sounds good', 'schedule']
    },
    {
      day: 9,
      aiAction: 'Offer a free audit or preview',
      subject: 'Free website analysis for {{business_name}}',
      body: `Hi {{first_name}},

I put together a quick analysis of {{business_name}}'s website — at no cost to you.

It covers:
• Current performance score (mobile + desktop)
• Specific issues I found
• Exactly what I'd prioritize fixing
• Expected improvement from each fix

Want me to send it over? Takes 2 minutes to review and you'll know exactly where you stand.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'send it', 'sure', 'please', 'okay']
    },
    {
      day: 12,
      aiAction: 'Create urgency with competitor context',
      subject: "Your competitors are pulling ahead ({{industry}})",
      body: `Hi {{first_name}},

I took a look at some of {{business_name}}'s competitors in {{location}}.

Here's what they're doing differently:
✅ Fast-loading mobile sites
✅ Modern designs that build trust
✅ Clear calls-to-action
✅ Optimized for local search

They're not necessarily better at what you do — they just show up better online.

If you want to level the playing field, I'm here to help.

Quick 15-minute call this week?

Best,
{{sender_name}}`,
      pauseTriggers: ['available', 'yes', 'let\'s talk', 'schedule', 'calendar']
    },
    {
      day: 16,
      aiAction: 'Remove risk with guarantee',
      subject: 'Zero risk offer for {{business_name}}',
      body: `Hi {{first_name}},

I know updating a website feels like a big decision.

Here's what I can offer to make it easier:

✅ **Free mockup** — See the design before committing
✅ **No upfront payment** — Pay only when you're 100% happy
✅ **30-day guarantee** — If you don't love it, full refund

I want you to feel confident, not pressured.

Interested in exploring this for {{business_name}}?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'sounds good', 'tell me more', 'let\'s talk']
    },
    {
      day: 21,
      aiAction: 'Graceful close with future door open',
      subject: 'Closing the loop ({{business_name}})',
      body: `Hi {{first_name}},

This is my last email for now — I don't want to keep cluttering your inbox.

If {{business_name}} ever needs help with your website, I'm here. Just reply to this email and we'll pick up where we left off.

In the meantime, here's a quick tip: Even small improvements (like speeding up your site or adding a clear phone number) can make a real difference.

Best of luck!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'wait', 'interested', 'reconsider', 'let\'s talk']
    }
  ]
};

// ============================================================================
// SCENARIO 3: LOW/NO REVIEWS
// Lead has few Google reviews - opportunity for reputation services
// ============================================================================
const LOW_REVIEWS_SEQUENCE: AutonomousSequence = {
  id: 'auto-low-reviews',
  scenarioId: 'low-reviews',
  name: 'Review Booster',
  description: 'For leads with few or no reviews - converts at 12-18%',
  trigger: 'Lead has fewer than 10 Google reviews',
  searchType: 'gmb',
  icon: '⭐',
  expectedResponseDay: 4,
  steps: [
    {
      day: 1,
      aiAction: 'Introduce the review problem gently',
      subject: 'Quick thought about {{business_name}} reviews',
      body: `Hi {{first_name}},

I was researching {{industry}} businesses and came across {{business_name}}.

I noticed you have {{review_count}} reviews on Google. For a business of your caliber, I'd expect to see more!

Here's the thing: 93% of customers read reviews before choosing a local business. More reviews = more trust = more customers.

I help {{industry}} businesses build their review count authentically — without fake reviews or shady tactics.

Would you be interested in learning how?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'how', 'tell me more', 'what do you mean']
    },
    {
      day: 3,
      aiAction: 'Share the business case for reviews',
      subject: 'The math behind reviews ({{business_name}})',
      body: `Hi {{first_name}},

Quick numbers that might surprise you:

📊 Businesses with 50+ reviews get **270% more clicks** than those with <10
📊 Each 0.1 star increase in rating = **9% more revenue** on average
📊 **88% of customers** trust online reviews as much as personal recommendations

For {{business_name}}, going from {{review_count}} to 50+ reviews could mean dozens of extra customers per month.

And the best part? Your existing happy customers can do most of the work — they just need a nudge.

Want me to show you how?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'show me', 'interested', 'how does it work', 'sounds good']
    },
    {
      day: 6,
      aiAction: 'Share a success story',
      subject: 'How a {{industry}} business went from 8 to 87 reviews',
      body: `Hi {{first_name}},

Quick success story:

A {{industry}} business came to me with 8 Google reviews — good ratings, but not enough to stand out.

**What we did:**
1. Set up an automated review request system
2. Made it dead-simple for happy customers to leave reviews
3. Implemented a review response strategy

**Results after 90 days:**
✅ 87 total reviews (from 8!)
✅ 4.9 average rating
✅ First page for "{{industry}} near me"
✅ 40% increase in phone calls

All from customers who were already happy — they just needed to be asked.

Want to see how this could work for {{business_name}}?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'show me', 'let\'s talk', 'sounds great']
    },
    {
      day: 9,
      aiAction: 'Offer a free review audit',
      subject: 'Free review audit for {{business_name}}',
      body: `Hi {{first_name}},

I put together a quick review audit for {{business_name}} — completely free.

It shows:
• Your current review score vs. top competitors
• How many reviews you need to rank higher
• Estimated timeline to reach 50+ reviews
• Exactly what strategy I'd recommend

Want me to send it over?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'send it', 'sure', 'please', 'sounds good']
    },
    {
      day: 12,
      aiAction: 'Show competitor gap',
      subject: 'Your competitors have more reviews (but you can catch up)',
      body: `Hi {{first_name}},

I looked at the top {{industry}} businesses in {{location}}.

Here's what I found:

| Business | Reviews | Rating |
|----------|---------|--------|
| Competitor A | 127 | 4.8 |
| Competitor B | 89 | 4.6 |
| Competitor C | 64 | 4.7 |
| {{business_name}} | {{review_count}} | {{rating}} |

Good news: Your rating is competitive! You just need more reviews.

The businesses above aren't necessarily better — they just asked their customers to leave reviews more consistently.

Ready to catch up?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'ready', 'let\'s do it', 'interested', 'how do we start']
    },
    {
      day: 16,
      aiAction: 'Make it easy with a trial offer',
      subject: 'Try it risk-free for 30 days',
      body: `Hi {{first_name}},

Here's what I'm proposing for {{business_name}}:

✅ 30-day trial of our review building system
✅ No upfront cost
✅ Cancel anytime if you're not seeing results
✅ You keep all the reviews even if you cancel

Worst case: You get some extra reviews for free.
Best case: You build a review engine that runs on autopilot.

Sound fair?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'interested', 'sounds good', 'let\'s try', 'okay']
    },
    {
      day: 21,
      aiAction: 'Graceful close',
      subject: 'Last note on reviews ({{business_name}})',
      body: `Hi {{first_name}},

This is my last email about reviews for now.

Here's a quick tip you can use right away: After every happy customer interaction, ask "Would you mind leaving us a quick Google review?" Most people say yes when asked directly.

If you ever want help systematizing this, I'm here. Just reply and we'll chat.

Best of luck with {{business_name}}!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'let\'s talk', 'interested', 'changed my mind', 'ready']
    }
  ]
};

// ============================================================================
// SCENARIO 4: GOOD WEBSITE, LOW VISIBILITY
// Lead has a decent website but poor SEO/rankings
// ============================================================================
const LOW_VISIBILITY_SEQUENCE: AutonomousSequence = {
  id: 'auto-low-visibility',
  scenarioId: 'low-visibility',
  name: 'Visibility Booster',
  description: 'For leads with good websites but poor search rankings - converts at 10-16%',
  trigger: 'Website exists but not ranking for local keywords',
  searchType: 'both',
  icon: '🔍',
  expectedResponseDay: 5,
  steps: [
    {
      day: 1,
      aiAction: 'Highlight the visibility gap',
      subject: "{{business_name}}'s website is invisible to searchers",
      body: `Hi {{first_name}},

I came across {{business_name}}'s website while researching {{industry}} businesses.

The site looks professional — nice work! But here's the challenge:

When I searched "{{industry}} in {{location}}", {{business_name}} didn't show up on the first 3 pages.

That means customers actively looking for {{industry}} services are finding your competitors instead.

Would you be interested in understanding why and how to fix it?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'why', 'tell me more', 'show me']
    },
    {
      day: 4,
      aiAction: 'Explain the SEO basics simply',
      subject: 'Why Google hides great businesses like {{business_name}}',
      body: `Hi {{first_name}},

Quick explanation of what's happening:

Google uses 200+ factors to decide which businesses to show. When your site is missing key elements, Google simply doesn't know to show you.

Common issues I see with {{industry}} websites:
• Missing location keywords on key pages
• No Google Business Profile optimization
• Missing or broken technical elements
• Weak content that doesn't match what customers search for

The good news? These are all fixable — and usually faster than you'd think.

Want me to share what specific elements I spotted on {{business_name}}'s site?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'share', 'show me', 'interested', 'what elements']
    },
    {
      day: 7,
      aiAction: 'Share a visibility success story',
      subject: 'How a {{industry}} business went from invisible to #1',
      body: `Hi {{first_name}},

Real story:

A {{industry}} business came to me frustrated. Great website, zero leads from Google.

**What we fixed:**
1. Optimized their Google Business Profile
2. Added location keywords to key pages
3. Fixed technical SEO issues
4. Built a few quality local links

**Results after 90 days:**
✅ #1 for "{{industry}} {{location}}"
✅ 340% increase in organic traffic
✅ 67% of new leads now come from Google
✅ Stopped paying for most advertising

Same website. Just properly optimized.

Interested in a similar result for {{business_name}}?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'sounds good', 'let\'s talk', 'how']
    },
    {
      day: 10,
      aiAction: 'Offer a free SEO audit',
      subject: 'Free visibility report for {{business_name}}',
      body: `Hi {{first_name}},

I put together a quick visibility analysis for {{business_name}}.

It includes:
• Current rankings for 10 key search terms
• Where your top competitors rank
• Technical issues hurting your visibility
• Prioritized recommendations

Want me to send it over? It's free and takes 2 minutes to review.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'send', 'please', 'sure', 'okay']
    },
    {
      day: 13,
      aiAction: 'Create urgency with market timing',
      subject: 'Your competitors are investing in visibility',
      body: `Hi {{first_name}},

I've been monitoring {{industry}} businesses in {{location}}.

In the past 30 days, I've noticed several of your competitors actively improving their SEO — new content, better Google profiles, faster sites.

The search results are going to shift. The question is whether {{business_name}} will be rising or falling.

Still a good time to act. Want to chat?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'let\'s talk', 'interested', 'schedule', 'when']
    },
    {
      day: 17,
      aiAction: 'Offer a quick-start option',
      subject: 'Start small: 30-day visibility sprint for {{business_name}}',
      body: `Hi {{first_name}},

I know SEO can feel overwhelming. Here's a simpler option:

**30-Day Visibility Sprint:**
✅ Google Business Profile optimization
✅ Key page improvements
✅ Technical fixes
✅ First page rankings for 2-3 terms

No long-term commitment. Just 30 days to see real improvement.

If you like the results, we can talk about more. If not, you keep all the improvements.

Interested?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'sounds good', 'tell me more', 'price']
    },
    {
      day: 22,
      aiAction: 'Graceful close',
      subject: 'Signing off for now ({{business_name}})',
      body: `Hi {{first_name}},

This is my last email for now.

Quick tip: Even just claiming and optimizing your Google Business Profile can significantly improve local visibility. It's free and takes about 30 minutes.

If you ever want professional help with {{business_name}}'s visibility, just reply and we'll pick up the conversation.

Best of luck!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'wait', 'interested', 'help', 'let\'s talk']
    }
  ]
};

// ============================================================================
// SCENARIO 5: SERVICE-SELLING (Option B - Agency Lead Finder)
// For agencies selling services to businesses
// ============================================================================
const AGENCY_SERVICES_SEQUENCE: AutonomousSequence = {
  id: 'auto-agency-services',
  scenarioId: 'agency-services',
  name: 'Agency Service Pitch',
  description: 'For agencies selling marketing/web services - converts at 8-14%',
  trigger: 'Option B search - service-selling context',
  searchType: 'platform',
  icon: '💼',
  expectedResponseDay: 4,
  steps: [
    {
      day: 1,
      aiAction: 'Position as solution to their growth challenge',
      subject: 'Quick question about growing {{business_name}}',
      body: `Hi {{first_name}},

I help {{industry}} businesses like {{business_name}} get more customers through {{service_type}}.

I'm not going to pitch you right away. Instead, I want to understand:

What's your biggest challenge right now when it comes to getting new customers?

Just curious — I might have some insights even if we never work together.

Best,
{{sender_name}}`,
      pauseTriggers: ['challenge is', 'biggest problem', 'struggling with', 'interested', 'looking for']
    },
    {
      day: 3,
      aiAction: 'Share relevant industry insight',
      subject: 'Insight for {{industry}} businesses like {{business_name}}',
      body: `Hi {{first_name}},

I've been working with {{industry}} businesses for a while now, and here's something interesting:

The #1 reason most struggle to grow isn't bad products or services — it's visibility.

Your potential customers are actively searching for {{industry}} services, but if you're not showing up where they're looking, they're going to your competitors.

I help solve that problem.

Worth a quick conversation?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'tell me more', 'how', 'let\'s talk']
    },
    {
      day: 6,
      aiAction: 'Share a relevant case study',
      subject: 'How we grew a {{industry}} business by 340%',
      body: `Hi {{first_name}},

Quick case study:

A {{industry}} business came to us struggling to compete with bigger players.

**The Challenge:**
• Limited marketing budget
• Inconsistent lead flow
• Dependent on word-of-mouth

**What We Did:**
• Built a targeted online presence
• Implemented systematic outreach
• Created a referral engine

**Results in 6 Months:**
✅ 340% increase in qualified leads
✅ 67% reduction in customer acquisition cost
✅ Predictable revenue growth

I'd love to explore how we could do something similar for {{business_name}}.

15 minutes?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'sounds good', 'schedule', 'calendar']
    },
    {
      day: 9,
      aiAction: 'Offer a free strategy session',
      subject: 'Free growth strategy for {{business_name}}',
      body: `Hi {{first_name}},

I'd like to offer you a free 20-minute growth strategy session.

On the call, I'll:
• Analyze your current customer acquisition approach
• Identify 2-3 quick wins you can implement immediately
• Share what's working for other {{industry}} businesses

No pitch, no pressure. Just useful insights.

If you see value in working together after that, great. If not, you'll still walk away with actionable ideas.

Sound fair?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'interested', 'book', 'schedule', 'when']
    },
    {
      day: 12,
      aiAction: 'Add social proof',
      subject: 'What {{industry}} business owners are saying',
      body: `Hi {{first_name}},

Here's what some of my clients have shared:

> "We went from feast-or-famine to consistent leads every week." — Mike, {{industry}}

> "Finally found a partner who actually understands our business." — Sarah, {{industry}}

> "ROI was clear within the first 60 days." — James, {{industry}}

I'd love to add {{business_name}} to this list.

Worth a quick chat?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'interested', 'let\'s talk', 'schedule', 'call me']
    },
    {
      day: 16,
      aiAction: 'Create urgency with capacity limits',
      subject: 'Only taking 2 more {{industry}} clients this quarter',
      body: `Hi {{first_name}},

Quick heads up — I'm only taking on 2 more {{industry}} clients this quarter.

I keep my client list small so I can deliver real results (not just collect retainers).

Given what I know about {{business_name}}, I think you'd be a great fit for one of those spots.

But I understand if the timing isn't right. No pressure either way.

Interested in learning more?

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'tell me more', 'let\'s talk', 'available']
    },
    {
      day: 21,
      aiAction: 'Graceful close with door open',
      subject: 'Last note from me ({{business_name}})',
      body: `Hi {{first_name}},

I've reached out a few times and haven't heard back — totally understand if the timing isn't right.

This will be my last email for now.

If {{business_name}} ever needs help with growth, marketing, or customer acquisition, I'll be here. Just reply to this email.

In the meantime, keep doing great work!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'interested', 'changed mind', 'let\'s talk', 'ready now']
    }
  ]
};

// ============================================================================
// SCENARIO 6: HIGH-INTENT HOT LEADS
// For leads showing clear buying signals
// ============================================================================
const HOT_LEAD_SEQUENCE: AutonomousSequence = {
  id: 'auto-hot-lead',
  scenarioId: 'hot-lead',
  name: 'Hot Lead Accelerator',
  description: 'For high-intent leads ready to buy - converts at 20-30%',
  trigger: 'Lead scored as HOT with buying signals',
  searchType: 'both',
  icon: '🔥',
  expectedResponseDay: 2,
  steps: [
    {
      day: 1,
      aiAction: 'Direct value proposition',
      subject: 'Can I help {{business_name}} with {{primary_need}}?',
      body: `Hi {{first_name}},

I noticed {{business_name}} is actively looking for solutions to improve your {{primary_need}}.

I help {{industry}} businesses solve exactly this problem — typically within 30 days.

Quick question: Would you be open to a brief call this week to discuss your specific situation?

I have time on {{available_days}}. What works for you?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'available', 'works', 'interested', 'call me']
    },
    {
      day: 2,
      aiAction: 'Share immediate value',
      subject: 'Quick win for {{business_name}} (no strings)',
      body: `Hi {{first_name}},

Following up quickly. I analyzed {{business_name}} and found something you can fix today:

**Quick Win:** {{immediate_opportunity}}

This alone could improve your results by {{estimated_improvement}}.

I have 2 more ideas that are even more impactful — worth a 10-minute call?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'call', 'interested', 'tell me more', 'what ideas']
    },
    {
      day: 4,
      aiAction: 'Create urgency with time-sensitive offer',
      subject: 'Special offer expires Friday ({{business_name}})',
      body: `Hi {{first_name}},

I want to make this easy for you.

If we connect before Friday, I'll include:
✅ Free comprehensive audit (normally $500)
✅ Priority implementation timeline
✅ 30-day money-back guarantee

No risk. Just results.

Reply "Yes" and I'll send over my calendar link.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'interested', 'send', 'book', 'let\'s do it']
    },
    {
      day: 6,
      aiAction: 'Show competitive urgency',
      subject: 'Your competitors are moving fast',
      body: `Hi {{first_name}},

I want to be transparent: I've been in contact with 2 other {{industry}} businesses in {{location}}.

I can only take on 1 new client right now, and I'd prefer it to be {{business_name}} based on what I've seen.

But I can't hold the spot indefinitely.

If you're interested, let's connect this week.

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'available', 'let\'s talk', 'hold the spot']
    },
    {
      day: 8,
      aiAction: 'Final direct ask',
      subject: 'Last chance: Reserved spot for {{business_name}}',
      body: `Hi {{first_name}},

I'm reaching out one more time because I genuinely think {{business_name}} would benefit from what I offer.

Here's my direct ask: Can we have a 15-minute call this week?

If after talking you don't see value, I'll respect that and move on. But I think you'll be glad we connected.

What do you say?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'okay', 'fine', 'let\'s talk', 'schedule']
    },
    {
      day: 11,
      aiAction: 'Soften with value recap',
      subject: "What {{business_name}} is missing out on",
      body: `Hi {{first_name}},

I've reached out a few times, so I wanted to summarize what I can offer {{business_name}}:

✅ {{benefit_1}}
✅ {{benefit_2}}
✅ {{benefit_3}}
✅ Results typically within 30 days
✅ No risk — money-back guarantee

If any of this sounds valuable, I'm here. Just reply.

Best,
{{sender_name}}`,
      pauseTriggers: ['interested', 'yes', 'tell me more', 'sounds good', 'let\'s talk']
    },
    {
      day: 15,
      aiAction: 'Respectful close',
      subject: 'Respecting your time ({{business_name}})',
      body: `Hi {{first_name}},

I've been pretty persistent, and I want to respect your time.

This is my last email. If you ever want to discuss how I can help {{business_name}}, just reply — even months from now.

Wishing you continued success!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'changed mind', 'interested', 'let\'s talk', 'ready']
    }
  ]
};

// ============================================================================
// SCENARIO 7: WARM NURTURE
// For leads needing more trust-building
// ============================================================================
const WARM_NURTURE_SEQUENCE: AutonomousSequence = {
  id: 'auto-warm-nurture',
  scenarioId: 'warm-nurture',
  name: 'Trust Builder',
  description: 'For warm leads needing relationship building - converts at 8-12%',
  trigger: 'Lead scored as WARM with moderate engagement potential',
  searchType: 'both',
  icon: '🤝',
  expectedResponseDay: 6,
  steps: [
    {
      day: 1,
      aiAction: 'Friendly introduction without pitch',
      subject: 'Came across {{business_name}} today',
      body: `Hi {{first_name}},

I was researching {{industry}} businesses and came across {{business_name}}. Really like what you've built!

I work with local businesses to help them grow their online presence. Not sure if it's something you need, but I'd love to learn more about your goals.

Is online growth something you're thinking about?

No pressure — just curious.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'thinking about', 'interested', 'actually', 'tell me more']
    },
    {
      day: 4,
      aiAction: 'Share a helpful tip with no ask',
      subject: 'Quick tip for {{industry}} businesses like {{business_name}}',
      body: `Hi {{first_name}},

Here's something I've learned working with {{industry}} businesses that might be useful:

**Tip:** {{industry_tip}}

Most business owners don't think about this, but it can make a real difference.

If you want, I can share 2 more tips specific to {{business_name}}. Just let me know.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'sure', 'interested', 'share more', 'tell me']
    },
    {
      day: 8,
      aiAction: 'Share social proof casually',
      subject: 'What other {{industry}} owners are doing',
      body: `Hi {{first_name}},

I've been helping a few {{industry}} businesses lately, and I thought you might find this interesting:

The common thread among the ones growing fastest? They're investing in their online presence consistently — not just when things are slow.

One owner told me: "I wish I'd started 6 months earlier. Every month I waited was money left on the table."

Food for thought!

Best,
{{sender_name}}`,
      pauseTriggers: ['interesting', 'tell me more', 'how', 'interested', 'want to know more']
    },
    {
      day: 12,
      aiAction: 'Offer a free resource',
      subject: 'Free resource for {{business_name}}',
      body: `Hi {{first_name}},

I put together a guide specifically for {{industry}} businesses on growing online. It covers:

• The 3 biggest mistakes {{industry}} owners make online
• How to stand out in a crowded market
• Quick wins you can implement this week

Would you like me to send it over? It's completely free — no catch.

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'please', 'send it', 'sure', 'interested']
    },
    {
      day: 16,
      aiAction: 'Check in with a soft ask',
      subject: 'Checking in on {{business_name}}',
      body: `Hi {{first_name}},

Just wanted to check in and see how things are going with {{business_name}}.

I've been thinking about your situation and have a few ideas that might help — if you're open to hearing them.

No pitch, no commitment. Just a friendly conversation.

Would that be useful?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'sure', 'useful', 'let\'s talk', 'open to it']
    },
    {
      day: 20,
      aiAction: 'Make a low-commitment offer',
      subject: 'Quick offer for {{business_name}} (no strings)',
      body: `Hi {{first_name}},

I'd like to do something for {{business_name}} — no strings attached.

I'll put together a quick analysis of your online presence: what's working, what could be better, and 1-2 things I'd prioritize.

Takes me 15 minutes to create. Could save you hours of guesswork.

Want me to put it together?

Best,
{{sender_name}}`,
      pauseTriggers: ['yes', 'please', 'sure', 'sounds good', 'do it']
    },
    {
      day: 25,
      aiAction: 'Graceful long-term close',
      subject: 'Staying in touch ({{business_name}})',
      body: `Hi {{first_name}},

I've reached out a few times and I don't want to be a pest.

I'll stop emailing for now, but I'd love to stay connected. If you ever have questions about growing {{business_name}} online, just reply to this email.

In the meantime, keep up the great work!

Best,
{{sender_name}}`,
      pauseTriggers: ['actually', 'questions', 'interested', 'let\'s talk', 'changed mind']
    }
  ]
};

// Export all sequences
export const AUTONOMOUS_SEQUENCES: AutonomousSequence[] = [
  NO_WEBSITE_SEQUENCE,
  OUTDATED_WEBSITE_SEQUENCE,
  LOW_REVIEWS_SEQUENCE,
  LOW_VISIBILITY_SEQUENCE,
  AGENCY_SERVICES_SEQUENCE,
  HOT_LEAD_SEQUENCE,
  WARM_NURTURE_SEQUENCE
];

// Get sequence by scenario ID
export function getAutonomousSequence(scenarioId: string): AutonomousSequence | undefined {
  return AUTONOMOUS_SEQUENCES.find(s => s.scenarioId === scenarioId);
}

// Get sequences for a search type
export function getSequencesForSearchType(searchType: 'gmb' | 'platform'): AutonomousSequence[] {
  return AUTONOMOUS_SEQUENCES.filter(
    s => s.searchType === searchType || s.searchType === 'both'
  );
}

// Determine which sequence to use based on lead analysis
export function determineSequence(
  lead: any,
  searchType: 'gmb' | 'platform'
): AutonomousSequence {
  // Hot lead takes priority
  if (lead.aiClassification === 'hot' || lead.leadScore >= 75) {
    return HOT_LEAD_SEQUENCE;
  }

  // No website is a clear signal
  if (!lead.websiteAnalysis?.hasWebsite || !lead.website) {
    return NO_WEBSITE_SEQUENCE;
  }

  // Website needs upgrade
  if (lead.websiteAnalysis?.needsUpgrade) {
    return OUTDATED_WEBSITE_SEQUENCE;
  }

  // Low reviews (GMB only)
  if (searchType === 'gmb' && (lead.review_count < 10 || lead.reviews < 10)) {
    return LOW_REVIEWS_SEQUENCE;
  }

  // Low visibility (has website but not ranking)
  if (lead.websiteAnalysis?.hasWebsite && lead.aiClassification !== 'hot') {
    return LOW_VISIBILITY_SEQUENCE;
  }

  // Agency services for platform search
  if (searchType === 'platform') {
    return AGENCY_SERVICES_SEQUENCE;
  }

  // Default to warm nurture
  return WARM_NURTURE_SEQUENCE;
}

// Get all pause triggers for a sequence
export function getAllPauseTriggers(sequence: AutonomousSequence): string[] {
  const triggers = new Set<string>();
  sequence.steps.forEach(step => {
    step.pauseTriggers?.forEach(t => triggers.add(t.toLowerCase()));
  });
  return Array.from(triggers);
}
