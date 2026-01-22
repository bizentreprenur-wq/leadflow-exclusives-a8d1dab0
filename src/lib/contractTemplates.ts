// Done For You Sample Contracts
// Business-protecting agreements ready to customize and send

export interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  sections: ContractSection[];
  colorAccent: string;
}

export interface ContractSection {
  title: string;
  content: string;
  isEditable?: boolean;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'website-design-agreement',
    name: 'Website Design Agreement',
    category: 'Web Development',
    icon: '🎨',
    description: 'Comprehensive agreement for website design and development projects.',
    colorAccent: 'blue',
    sections: [
      {
        title: 'PARTIES',
        content: `This Website Design Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Designer")
Address: [YOUR_ADDRESS]
Email: [YOUR_EMAIL]

**Client:** [CLIENT_BUSINESS_NAME] ("Client")
Address: [CLIENT_ADDRESS]
Email: [CLIENT_EMAIL]`,
        isEditable: true
      },
      {
        title: 'SCOPE OF WORK',
        content: `The Designer agrees to provide the following services:

1. Custom website design and development
2. Responsive design for mobile devices
3. Up to [NUMBER] pages/sections
4. Contact form integration
5. Basic SEO setup
6. [NUMBER] rounds of revisions
7. Content management system training

Additional services requested by the Client will be quoted separately.`,
        isEditable: true
      },
      {
        title: 'TIMELINE',
        content: `Project timeline: [NUMBER] weeks from project kickoff

**Milestones:**
- Discovery & Planning: Week 1
- Design Mockups: Week 2
- Development: Weeks 3-4
- Testing & Launch: Week 5

Delays caused by Client feedback or content delivery may extend the timeline.`,
        isEditable: true
      },
      {
        title: 'PAYMENT TERMS',
        content: `**Total Project Investment:** $[AMOUNT]

**Payment Schedule:**
- 50% deposit upon signing: $[AMOUNT]
- 50% balance due at project completion: $[AMOUNT]

Payment is due within [NUMBER] days of invoice date. Late payments will incur a [PERCENTAGE]% monthly fee.

**Accepted Payment Methods:** [PAYMENT_METHODS]`,
        isEditable: true
      },
      {
        title: 'INTELLECTUAL PROPERTY',
        content: `Upon receipt of final payment, the Client will own all rights to the final website design and content specifically created for this project.

The Designer retains the right to:
- Display the work in their portfolio
- Use general techniques and knowledge gained
- Retain ownership of any pre-existing materials, frameworks, or code libraries used`,
        isEditable: false
      },
      {
        title: 'REVISIONS & CHANGES',
        content: `This Agreement includes [NUMBER] rounds of revisions at each milestone.

Additional revisions beyond the included rounds will be billed at $[AMOUNT] per hour.

Scope changes requested after project kickoff will require a change order with updated timeline and pricing.`,
        isEditable: true
      },
      {
        title: 'TERMINATION',
        content: `Either party may terminate this Agreement with [NUMBER] days written notice.

Upon termination:
- Client pays for all work completed to date
- Designer delivers all completed work
- Non-refundable portions of deposits are retained by Designer

Termination does not release either party from obligations incurred prior to termination.`,
        isEditable: true
      },
      {
        title: 'LIMITATION OF LIABILITY',
        content: `The Designer's total liability under this Agreement shall not exceed the total amount paid by the Client.

The Designer is not liable for:
- Lost profits or consequential damages
- Third-party claims against the Client
- Client-provided content or materials
- Website performance after handoff`,
        isEditable: false
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement shall be governed by the laws of [STATE/JURISDICTION].

Any disputes shall be resolved through:
1. Good faith negotiation
2. Mediation in [CITY, STATE]
3. Binding arbitration if mediation fails`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `By signing below, both parties agree to the terms of this Agreement.

**Service Provider:**
Signature: _________________________
Name: [YOUR_NAME]
Date: _________________________

**Client:**
Signature: _________________________
Name: [CLIENT_NAME]
Date: _________________________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'marketing-services-agreement',
    name: 'Marketing Services Agreement',
    category: 'Marketing',
    icon: '📈',
    description: 'Agreement for ongoing marketing services including digital marketing, advertising, and strategy.',
    colorAccent: 'green',
    sections: [
      {
        title: 'PARTIES',
        content: `This Marketing Services Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Agency")
Address: [YOUR_ADDRESS]
Email: [YOUR_EMAIL]

**Client:** [CLIENT_BUSINESS_NAME] ("Client")
Address: [CLIENT_ADDRESS]
Email: [CLIENT_EMAIL]`,
        isEditable: true
      },
      {
        title: 'SERVICES',
        content: `The Agency agrees to provide the following marketing services:

☐ Social Media Management
☐ Content Creation & Marketing
☐ Email Marketing Campaigns
☐ Search Engine Optimization (SEO)
☐ Pay-Per-Click Advertising (PPC)
☐ Marketing Strategy & Consulting
☐ Analytics & Reporting

Specific deliverables are outlined in the attached Service Schedule.`,
        isEditable: true
      },
      {
        title: 'TERM',
        content: `**Initial Term:** [NUMBER] months, beginning [START_DATE]

**Renewal:** This Agreement will automatically renew for successive [NUMBER]-month terms unless either party provides [NUMBER] days written notice of non-renewal.

**Minimum Commitment:** [NUMBER] months`,
        isEditable: true
      },
      {
        title: 'FEES & PAYMENT',
        content: `**Monthly Retainer:** $[AMOUNT]/month
**Ad Spend Budget:** $[AMOUNT]/month (managed by Agency)
**Performance Bonus:** [PERCENTAGE]% of revenue above $[AMOUNT] (if applicable)

**Payment Terms:**
- Monthly retainer due on the 1st of each month
- Net [NUMBER] days payment terms
- Late fee: [PERCENTAGE]% per month on overdue amounts`,
        isEditable: true
      },
      {
        title: 'REPORTING & COMMUNICATION',
        content: `The Agency will provide:
- Monthly performance reports
- Weekly status updates via email
- Monthly strategy calls
- Access to real-time analytics dashboard

Client will designate a primary point of contact for all communications.`,
        isEditable: true
      },
      {
        title: 'INTELLECTUAL PROPERTY',
        content: `**Client Owns:**
- All content created specifically for Client
- Campaign data and analytics
- Customer lists and leads generated

**Agency Retains:**
- Proprietary methodologies and frameworks
- Tools and templates used
- Right to showcase work in portfolio (with permission)`,
        isEditable: false
      },
      {
        title: 'CONFIDENTIALITY',
        content: `Both parties agree to maintain confidentiality of:
- Business strategies and plans
- Customer data and lists
- Financial information
- Proprietary processes

This obligation survives termination for [NUMBER] years.`,
        isEditable: true
      },
      {
        title: 'TERMINATION',
        content: `**For Convenience:** Either party may terminate with [NUMBER] days written notice.

**For Cause:** Immediate termination for material breach not cured within [NUMBER] days of notice.

**Upon Termination:**
- Client pays for services rendered through termination date
- Agency provides transition assistance for [NUMBER] days
- All Client materials and data returned within [NUMBER] days`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].

Disputes will be resolved through binding arbitration in [CITY, STATE] under [ARBITRATION_RULES].`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `By signing below, both parties agree to the terms of this Agreement.

**Agency:**
Signature: _________________________
Name: [YOUR_NAME]
Title: [YOUR_TITLE]
Date: _________________________

**Client:**
Signature: _________________________
Name: [CLIENT_NAME]
Title: [CLIENT_TITLE]
Date: _________________________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'monthly-retainer-agreement',
    name: 'Monthly Retainer Agreement',
    category: 'Ongoing Services',
    icon: '🤝',
    description: 'Flexible retainer agreement for ongoing professional services with dedicated hours.',
    colorAccent: 'indigo',
    sections: [
      {
        title: 'PARTIES',
        content: `This Monthly Retainer Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
Address: [YOUR_ADDRESS]
Email: [YOUR_EMAIL]

**Client:** [CLIENT_BUSINESS_NAME] ("Client")
Address: [CLIENT_ADDRESS]
Email: [CLIENT_EMAIL]`,
        isEditable: true
      },
      {
        title: 'RETAINER SERVICES',
        content: `The Provider agrees to reserve [NUMBER] hours per month for Client services.

**Included Services:**
- [SERVICE_1]
- [SERVICE_2]
- [SERVICE_3]
- Priority scheduling and support
- Monthly strategy consultation

**Excluded (billed separately):**
- Third-party software or tools
- Rush fees for urgent requests
- Out-of-scope projects`,
        isEditable: true
      },
      {
        title: 'RETAINER FEE',
        content: `**Monthly Retainer:** $[AMOUNT]
**Included Hours:** [NUMBER] hours
**Effective Hourly Rate:** $[AMOUNT]/hour
**Standard Hourly Rate:** $[AMOUNT]/hour (for additional hours)

The retainer fee is due on the [DAY] of each month. Hours do not roll over unless specified.`,
        isEditable: true
      },
      {
        title: 'HOUR TRACKING & ROLLOVER',
        content: `**Hour Tracking:**
- Provider maintains detailed time logs
- Client receives monthly hour usage report
- Time is tracked in 15-minute increments

**Rollover Policy:**
- Up to [PERCENTAGE]% of unused hours may roll over
- Rolled hours expire after [NUMBER] months
- No cash value for unused hours`,
        isEditable: true
      },
      {
        title: 'PRIORITY & RESPONSE TIMES',
        content: `Retainer clients receive priority status:

- **Email Response:** Within [NUMBER] business hours
- **Urgent Requests:** Same business day
- **Project Scheduling:** Priority over non-retainer clients
- **Strategy Calls:** [NUMBER] per month included`,
        isEditable: true
      },
      {
        title: 'TERM & RENEWAL',
        content: `**Initial Term:** [NUMBER] months minimum

**Auto-Renewal:** Continues month-to-month after initial term unless cancelled with [NUMBER] days notice.

**Rate Changes:** Provider may adjust rates with [NUMBER] days written notice.`,
        isEditable: true
      },
      {
        title: 'TERMINATION',
        content: `**Notice Required:** [NUMBER] days written notice

**Upon Termination:**
- Final invoice for current month (no proration)
- Unused hours are forfeited
- All work product delivered
- Transition support for [NUMBER] days`,
        isEditable: true
      },
      {
        title: 'CONFIDENTIALITY',
        content: `Both parties agree to keep confidential all proprietary information, trade secrets, and business strategies shared during the engagement.

This obligation continues for [NUMBER] years after termination.`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].

Any disputes shall be resolved through mediation, then binding arbitration if necessary, in [CITY, STATE].`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `By signing below, both parties agree to the terms of this Agreement.

**Provider:**
Signature: _________________________
Name: [YOUR_NAME]
Date: _________________________

**Client:**
Signature: _________________________
Name: [CLIENT_NAME]
Date: _________________________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'one-time-project-agreement',
    name: 'One-Time Project Agreement',
    category: 'Projects',
    icon: '📋',
    description: 'Simple agreement for single, defined-scope projects with clear deliverables.',
    colorAccent: 'amber',
    sections: [
      {
        title: 'PARTIES',
        content: `This Project Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
**Client:** [CLIENT_BUSINESS_NAME] ("Client")`,
        isEditable: true
      },
      {
        title: 'PROJECT DESCRIPTION',
        content: `**Project Name:** [PROJECT_NAME]

**Description:**
[DETAILED_PROJECT_DESCRIPTION]

**Objectives:**
1. [OBJECTIVE_1]
2. [OBJECTIVE_2]
3. [OBJECTIVE_3]`,
        isEditable: true
      },
      {
        title: 'DELIVERABLES',
        content: `The Provider will deliver:

1. [DELIVERABLE_1]
2. [DELIVERABLE_2]
3. [DELIVERABLE_3]
4. [DELIVERABLE_4]

All deliverables will be provided in [FORMAT] format.`,
        isEditable: true
      },
      {
        title: 'TIMELINE',
        content: `**Project Start:** [START_DATE]
**Estimated Completion:** [END_DATE]
**Total Duration:** [NUMBER] weeks

**Milestones:**
- Phase 1: [MILESTONE_1] - [DATE]
- Phase 2: [MILESTONE_2] - [DATE]
- Final Delivery: [DATE]`,
        isEditable: true
      },
      {
        title: 'PAYMENT',
        content: `**Total Project Fee:** $[AMOUNT]

**Payment Schedule:**
- [PERCENTAGE]% deposit upon signing: $[AMOUNT]
- [PERCENTAGE]% at midpoint: $[AMOUNT]
- [PERCENTAGE]% upon completion: $[AMOUNT]

**Payment Method:** [PAYMENT_METHODS]
**Payment Terms:** Net [NUMBER] days`,
        isEditable: true
      },
      {
        title: 'REVISIONS',
        content: `This project includes [NUMBER] rounds of revisions.

Additional revisions will be billed at $[AMOUNT]/hour.

Revision requests must be submitted within [NUMBER] days of receiving deliverables.`,
        isEditable: true
      },
      {
        title: 'OWNERSHIP',
        content: `Upon receipt of final payment, Client owns all project deliverables.

Provider retains the right to display work in portfolio and use for promotional purposes.`,
        isEditable: false
      },
      {
        title: 'TERMINATION',
        content: `Either party may terminate with [NUMBER] days notice.

Upon termination:
- Client pays for work completed
- Provider delivers all work-in-progress
- Deposit is non-refundable`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `**Provider:** _________________________ Date: _________
**Client:** _________________________ Date: _________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'lead-generation-agreement',
    name: 'Lead Generation Agreement',
    category: 'Marketing',
    icon: '🎯',
    description: 'Agreement for lead generation services with performance metrics and expectations.',
    colorAccent: 'green',
    sections: [
      {
        title: 'PARTIES',
        content: `This Lead Generation Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
**Client:** [CLIENT_BUSINESS_NAME] ("Client")`,
        isEditable: true
      },
      {
        title: 'SERVICES',
        content: `Provider will deliver lead generation services including:

- Target audience research and profiling
- Lead capture system setup
- [NUMBER] qualified leads per month (target)
- Lead qualification and scoring
- CRM integration and data delivery
- Monthly performance reporting`,
        isEditable: true
      },
      {
        title: 'LEAD DEFINITION',
        content: `**Qualified Lead Criteria:**
- Located in [GEOGRAPHIC_AREA]
- Industry: [INDUSTRY]
- Company size: [SIZE_RANGE]
- Decision-maker contact information
- Expressed interest in [PRODUCT/SERVICE]

Leads not meeting these criteria will not count toward monthly targets.`,
        isEditable: true
      },
      {
        title: 'PRICING MODEL',
        content: `☐ **Flat Monthly Fee:** $[AMOUNT]/month
☐ **Per Lead:** $[AMOUNT] per qualified lead
☐ **Hybrid:** $[AMOUNT]/month + $[AMOUNT] per lead over [NUMBER]

**Setup Fee:** $[AMOUNT] (one-time)
**Minimum Commitment:** [NUMBER] months`,
        isEditable: true
      },
      {
        title: 'LEAD DELIVERY',
        content: `Leads will be delivered via:
☐ Direct CRM integration
☐ Email notification
☐ Shared spreadsheet
☐ Client portal access

Delivery frequency: [DAILY/WEEKLY/REAL-TIME]`,
        isEditable: true
      },
      {
        title: 'EXCLUSIVITY',
        content: `☐ **Exclusive:** Leads are provided exclusively to Client
☐ **Non-Exclusive:** Leads may be shared with up to [NUMBER] other clients

Exclusive leads command a [PERCENTAGE]% premium.`,
        isEditable: true
      },
      {
        title: 'DATA OWNERSHIP',
        content: `Client owns all leads and data generated through this engagement.

Provider may retain anonymized data for performance analysis.

Client is responsible for compliance with data protection laws (GDPR, CCPA, etc.).`,
        isEditable: false
      },
      {
        title: 'TERM & TERMINATION',
        content: `**Term:** [NUMBER] months, auto-renewing
**Cancellation Notice:** [NUMBER] days

Upon termination, Client retains all leads generated and paid for.`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `**Provider:** _________________________ Date: _________
**Client:** _________________________ Date: _________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'nda-confidentiality',
    name: 'NDA / Confidentiality Agreement',
    category: 'Legal Protection',
    icon: '🔒',
    description: 'Mutual non-disclosure agreement to protect sensitive business information.',
    colorAccent: 'slate',
    sections: [
      {
        title: 'PARTIES',
        content: `This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between:

**Disclosing Party:** [PARTY_1_NAME] ("Discloser")
**Receiving Party:** [PARTY_2_NAME] ("Recipient")

Collectively referred to as "the Parties."`,
        isEditable: true
      },
      {
        title: 'PURPOSE',
        content: `The Parties wish to explore a potential business relationship concerning:

[DESCRIPTION_OF_PURPOSE]

In connection with this purpose, Discloser may share confidential information with Recipient.`,
        isEditable: true
      },
      {
        title: 'DEFINITION OF CONFIDENTIAL INFORMATION',
        content: `"Confidential Information" includes, but is not limited to:

- Business plans and strategies
- Financial information and projections
- Customer lists and data
- Technical specifications and designs
- Marketing plans and pricing
- Trade secrets and proprietary processes
- Any information marked "Confidential"

Confidential Information does NOT include information that:
- Is publicly available
- Was known to Recipient before disclosure
- Is independently developed by Recipient
- Is disclosed with Discloser's written consent`,
        isEditable: false
      },
      {
        title: 'OBLIGATIONS',
        content: `Recipient agrees to:

1. Maintain strict confidentiality of all Confidential Information
2. Use Confidential Information only for the stated Purpose
3. Limit disclosure to employees with a need to know
4. Protect Confidential Information with reasonable security measures
5. Not copy or reproduce without prior written consent
6. Return or destroy all Confidential Information upon request`,
        isEditable: false
      },
      {
        title: 'TERM',
        content: `This Agreement is effective from [START_DATE] and continues for [NUMBER] years.

Confidentiality obligations survive termination for [NUMBER] years.`,
        isEditable: true
      },
      {
        title: 'REMEDIES',
        content: `Recipient acknowledges that breach may cause irreparable harm.

Discloser is entitled to seek:
- Injunctive relief
- Specific performance
- Monetary damages
- Attorney's fees and costs`,
        isEditable: false
      },
      {
        title: 'MUTUAL NDA PROVISION',
        content: `☐ This is a MUTUAL NDA - both parties may disclose and receive Confidential Information. Both parties have reciprocal obligations.

☐ This is a ONE-WAY NDA - only [PARTY_NAME] is the Discloser.`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].

Venue for any disputes: [CITY, STATE]`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `**Disclosing Party:**
Signature: _________________________
Name: [NAME]
Title: [TITLE]
Date: _________________________

**Receiving Party:**
Signature: _________________________
Name: [NAME]
Title: [TITLE]
Date: _________________________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'payment-refund-policy',
    name: 'Payment & Refund Policy Agreement',
    category: 'Financial',
    icon: '💳',
    description: 'Clear payment terms and refund policies to protect your business.',
    colorAccent: 'emerald',
    sections: [
      {
        title: 'PARTIES',
        content: `This Payment & Refund Policy Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
**Client:** [CLIENT_BUSINESS_NAME] ("Client")`,
        isEditable: true
      },
      {
        title: 'PAYMENT TERMS',
        content: `**Accepted Payment Methods:**
☐ Credit/Debit Card
☐ Bank Transfer (ACH/Wire)
☐ PayPal
☐ Check
☐ Other: [SPECIFY]

**Payment Due:** Net [NUMBER] days from invoice date
**Currency:** [CURRENCY]`,
        isEditable: true
      },
      {
        title: 'DEPOSIT POLICY',
        content: `**Deposit Required:** [PERCENTAGE]% of total project value

**Deposit Terms:**
- Due before work begins
- Non-refundable once work commences
- Applied to final invoice
- Secures project scheduling`,
        isEditable: true
      },
      {
        title: 'LATE PAYMENT',
        content: `**Late Fee:** [PERCENTAGE]% per month on overdue balances
**Grace Period:** [NUMBER] days

**After [NUMBER] Days Overdue:**
- Work may be suspended
- Access to deliverables may be revoked
- Account may be sent to collections

**Collection Costs:** Client is responsible for all collection fees and legal costs.`,
        isEditable: true
      },
      {
        title: 'REFUND POLICY',
        content: `**Full Refund Available:**
- Within [NUMBER] hours of purchase
- Before any work has begun
- If Provider cannot deliver as promised

**Partial Refund Available:**
- For work not yet completed
- Prorated based on completion percentage

**No Refund Available:**
- After [NUMBER] days from start
- For completed work
- For third-party costs incurred`,
        isEditable: true
      },
      {
        title: 'CANCELLATION',
        content: `**Cancellation Notice:** [NUMBER] days required

**Cancellation Fees:**
- Before work begins: Full deposit refund minus [PERCENTAGE]% admin fee
- Work in progress: Payment for completed work + [PERCENTAGE]% of remaining value
- After 50% completion: Full payment required`,
        isEditable: true
      },
      {
        title: 'DISPUTES',
        content: `**Dispute Process:**
1. Contact Provider within [NUMBER] days of charge
2. Provide written description of dispute
3. Provider responds within [NUMBER] business days
4. Good faith negotiation to resolve

Chargebacks initiated without following this process may result in termination of services.`,
        isEditable: true
      },
      {
        title: 'PRICE CHANGES',
        content: `Provider reserves the right to change prices with [NUMBER] days notice.

Existing contracts are honored at agreed-upon rates.`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `By signing below, Client acknowledges and agrees to this Payment & Refund Policy.

**Provider:** _________________________ Date: _________
**Client:** _________________________ Date: _________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'independent-contractor',
    name: 'Independent Contractor Agreement',
    category: 'Employment',
    icon: '👤',
    description: 'Agreement establishing an independent contractor relationship with clear terms.',
    colorAccent: 'violet',
    sections: [
      {
        title: 'PARTIES',
        content: `This Independent Contractor Agreement ("Agreement") is entered into as of [DATE] by and between:

**Company:** [COMPANY_NAME] ("Company")
Address: [COMPANY_ADDRESS]

**Contractor:** [CONTRACTOR_NAME] ("Contractor")
Address: [CONTRACTOR_ADDRESS]`,
        isEditable: true
      },
      {
        title: 'ENGAGEMENT',
        content: `Company engages Contractor to perform the following services:

**Services:**
[DETAILED_DESCRIPTION_OF_SERVICES]

**Start Date:** [START_DATE]
**End Date:** [END_DATE] or ongoing until terminated`,
        isEditable: true
      },
      {
        title: 'COMPENSATION',
        content: `**Rate:** $[AMOUNT] per [HOUR/PROJECT/MONTH]
**Payment Schedule:** [WEEKLY/BIWEEKLY/MONTHLY/UPON_COMPLETION]
**Payment Method:** [PAYMENT_METHOD]

Contractor is responsible for all taxes, including self-employment tax.`,
        isEditable: true
      },
      {
        title: 'INDEPENDENT CONTRACTOR STATUS',
        content: `Contractor is an independent contractor, NOT an employee.

Contractor:
- Controls how and when work is performed
- May work for other clients
- Provides own equipment and tools
- Is not entitled to employee benefits
- Is responsible for own taxes and insurance

Company will not withhold taxes or provide benefits.`,
        isEditable: false
      },
      {
        title: 'WORK PRODUCT & IP',
        content: `**Work Made for Hire:** All work product created for Company is owned by Company.

**Pre-Existing IP:** Contractor retains ownership of pre-existing materials.

**License:** Contractor grants Company license to use any pre-existing materials incorporated into deliverables.`,
        isEditable: false
      },
      {
        title: 'CONFIDENTIALITY',
        content: `Contractor agrees to:
- Maintain confidentiality of Company information
- Not disclose proprietary information
- Return all materials upon termination

This obligation survives termination.`,
        isEditable: false
      },
      {
        title: 'NON-COMPETE / NON-SOLICIT',
        content: `During the term and for [NUMBER] months after:

☐ **Non-Compete:** Contractor will not provide similar services to Company's direct competitors in [GEOGRAPHIC_AREA]

☐ **Non-Solicit:** Contractor will not solicit Company's employees or clients`,
        isEditable: true
      },
      {
        title: 'TERMINATION',
        content: `**Notice Period:** [NUMBER] days written notice by either party

**Immediate Termination:** For material breach

**Upon Termination:**
- Payment for work completed
- Return of all Company materials
- Continued confidentiality obligations`,
        isEditable: true
      },
      {
        title: 'INSURANCE',
        content: `Contractor will maintain:
- General liability insurance: $[AMOUNT]
- Professional liability insurance: $[AMOUNT]
- Workers' compensation (if applicable)`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `**Company:**
Signature: _________________________
Name: [NAME]
Title: [TITLE]
Date: _________________________

**Contractor:**
Signature: _________________________
Name: [NAME]
Date: _________________________`,
        isEditable: true
      }
    ]
  },
  {
    id: 'rush-job-agreement',
    name: 'Fast-Track / Rush Job Agreement',
    category: 'Rush Services',
    icon: '⚡',
    description: 'Agreement for expedited services with rush fees and priority handling.',
    colorAccent: 'rose',
    sections: [
      {
        title: 'PARTIES',
        content: `This Rush Job Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
**Client:** [CLIENT_BUSINESS_NAME] ("Client")`,
        isEditable: true
      },
      {
        title: 'RUSH PROJECT SCOPE',
        content: `**Project:** [PROJECT_NAME]

**Standard Timeline:** [NUMBER] days/weeks
**Rush Timeline:** [NUMBER] days/weeks

**Deliverables:**
[LIST_DELIVERABLES]`,
        isEditable: true
      },
      {
        title: 'RUSH FEE',
        content: `**Standard Price:** $[AMOUNT]
**Rush Premium:** [PERCENTAGE]%
**Total Rush Price:** $[AMOUNT]

Rush fee compensates for:
- Rearranged schedule and priorities
- Extended working hours
- Expedited review processes
- Dedicated resources`,
        isEditable: true
      },
      {
        title: 'PAYMENT',
        content: `**Full Payment Required:** 100% upfront before work begins

**Payment Method:** [PAYMENT_METHOD]

Rush projects require full payment as schedules are cleared and resources committed immediately.`,
        isEditable: true
      },
      {
        title: 'CLIENT OBLIGATIONS',
        content: `To meet the rush timeline, Client must:

1. Provide all required materials within [NUMBER] hours
2. Be available for immediate feedback and approvals
3. Respond to communications within [NUMBER] hours
4. Make decisions promptly without extended deliberation
5. Limit revisions to [NUMBER] rounds

Delays caused by Client may extend timeline or void rush guarantee.`,
        isEditable: true
      },
      {
        title: 'RUSH GUARANTEE',
        content: `Provider guarantees delivery by [DATE/TIME] provided:
- Client meets all obligations above
- No force majeure events occur
- Scope does not change

If Provider fails to meet deadline due to Provider's fault:
☐ [PERCENTAGE]% refund of rush fee
☐ Free revision round
☐ Other: [SPECIFY]`,
        isEditable: true
      },
      {
        title: 'SCOPE CHANGES',
        content: `Any scope changes during a rush project:
- Require immediate written approval
- May extend timeline
- Will incur additional rush fees
- May void delivery guarantee`,
        isEditable: false
      },
      {
        title: 'CANCELLATION',
        content: `**Cancellation by Client:**
- Before work begins: [PERCENTAGE]% refund
- After work begins: No refund

**Cancellation by Provider:**
- Full refund of all payments
- No liability for consequential damages`,
        isEditable: true
      },
      {
        title: 'SIGNATURES',
        content: `By signing below, both parties agree to rush project terms.

**Provider:** _________________________ Date: _________
**Client:** _________________________ Date: _________

⚡ RUSH PROJECT CONFIRMED ⚡`,
        isEditable: true
      }
    ]
  },
  {
    id: 'general-services-agreement',
    name: 'General Services Agreement',
    category: 'General',
    icon: '📄',
    description: 'Versatile agreement template adaptable for various professional services.',
    colorAccent: 'gray',
    sections: [
      {
        title: 'PARTIES',
        content: `This General Services Agreement ("Agreement") is entered into as of [DATE] by and between:

**Service Provider:** [YOUR_BUSINESS_NAME] ("Provider")
Address: [YOUR_ADDRESS]
Email: [YOUR_EMAIL]
Phone: [YOUR_PHONE]

**Client:** [CLIENT_BUSINESS_NAME] ("Client")
Address: [CLIENT_ADDRESS]
Email: [CLIENT_EMAIL]
Phone: [CLIENT_PHONE]`,
        isEditable: true
      },
      {
        title: 'SERVICES',
        content: `Provider agrees to perform the following services ("Services"):

[DETAILED_DESCRIPTION_OF_SERVICES]

Services will be performed in a professional and workmanlike manner consistent with industry standards.`,
        isEditable: true
      },
      {
        title: 'TERM',
        content: `**Effective Date:** [START_DATE]
**Term Type:** ☐ Fixed-term: [END_DATE] ☐ Ongoing until terminated

**Renewal:** ☐ Auto-renews ☐ Requires written renewal agreement`,
        isEditable: true
      },
      {
        title: 'COMPENSATION',
        content: `**Service Fee:** $[AMOUNT] [per hour/per project/per month]
**Expenses:** ☐ Included ☐ Billed separately with receipts

**Payment Terms:**
- Payment due: Net [NUMBER] days
- Late fee: [PERCENTAGE]% per month
- Acceptable methods: [PAYMENT_METHODS]`,
        isEditable: true
      },
      {
        title: 'CLIENT RESPONSIBILITIES',
        content: `Client agrees to:
1. Provide necessary information and materials promptly
2. Designate a point of contact with decision-making authority
3. Review and approve deliverables in a timely manner
4. Pay invoices according to agreed terms`,
        isEditable: true
      },
      {
        title: 'INTELLECTUAL PROPERTY',
        content: `Upon full payment, Client receives ownership of:
- Custom work product created specifically for Client
- Final deliverables

Provider retains:
- Pre-existing tools, templates, and methodologies
- Right to use work in portfolio with Client permission`,
        isEditable: false
      },
      {
        title: 'CONFIDENTIALITY',
        content: `Both parties agree to maintain confidentiality of:
- Proprietary business information
- Trade secrets and processes
- Customer and financial data

This obligation survives termination for [NUMBER] years.`,
        isEditable: true
      },
      {
        title: 'WARRANTIES & LIABILITY',
        content: `Provider warrants services will be performed professionally.

**Limitation of Liability:**
Provider's total liability shall not exceed fees paid under this Agreement.

Neither party is liable for consequential, indirect, or punitive damages.`,
        isEditable: false
      },
      {
        title: 'TERMINATION',
        content: `**For Convenience:** [NUMBER] days written notice
**For Cause:** Immediate upon material breach

**Upon Termination:**
- Payment for services rendered
- Return of materials
- Transition assistance for [NUMBER] days`,
        isEditable: true
      },
      {
        title: 'DISPUTE RESOLUTION',
        content: `Disputes will be resolved through:
1. Good faith negotiation ([NUMBER] days)
2. Mediation in [CITY, STATE]
3. Binding arbitration if mediation fails

Prevailing party entitled to reasonable attorney's fees.`,
        isEditable: true
      },
      {
        title: 'GOVERNING LAW',
        content: `This Agreement is governed by the laws of [STATE/JURISDICTION].

Venue: [CITY, STATE]`,
        isEditable: true
      },
      {
        title: 'ENTIRE AGREEMENT',
        content: `This Agreement constitutes the entire agreement between the parties.

Amendments require written consent of both parties.

This Agreement supersedes all prior negotiations and agreements.`,
        isEditable: false
      },
      {
        title: 'SIGNATURES',
        content: `IN WITNESS WHEREOF, the parties have executed this Agreement.

**Provider:**
Signature: _________________________
Name: [YOUR_NAME]
Title: [YOUR_TITLE]
Date: _________________________

**Client:**
Signature: _________________________
Name: [CLIENT_NAME]
Title: [CLIENT_TITLE]
Date: _________________________`,
        isEditable: true
      }
    ]
  }
];

export interface ESignatureConfig {
  enabled: boolean;
  signingUrl?: string;
  contractId?: string;
  recipientName?: string;
  recipientEmail?: string;
}

export function generateContractHTML(
  contract: ContractTemplate,
  editedSections: Record<string, string>,
  senderInfo: {
    companyName: string;
    logoUrl?: string;
  },
  eSignature?: ESignatureConfig
): string {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sections = contract.sections.map(section => {
    const content = editedSections[section.title] || section.content;
    return `
      <div class="section">
        <div class="section-title">${section.title}</div>
        <div class="section-content">${content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/☐/g, '☐ ')}</div>
      </div>
    `;
  }).join('');

  // E-signature section
  const eSignatureSection = eSignature?.enabled ? `
    <div class="esign-section" style="margin-top: 40px; padding: 25px; border: 2px solid #3b82f6; border-radius: 12px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 32px; margin-bottom: 10px;">✍️</div>
        <h2 style="margin: 0; color: #1e40af; font-size: 20px;">Electronic Signature Required</h2>
        <p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px;">This contract requires your digital signature</p>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #6b7280;">Contract ID:</span>
          <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${eSignature.contractId || 'N/A'}</code>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #6b7280;">Signer:</span>
          <strong>${eSignature.recipientName || 'Client'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #6b7280;">Email:</span>
          <span>${eSignature.recipientEmail || ''}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${eSignature.signingUrl || '#'}" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
          ✏️ Click Here to Sign This Contract
        </a>
        <p style="margin-top: 15px; font-size: 11px; color: #6b7280;">
          By signing, you agree to the terms above and confirm this is a legally binding agreement.
        </p>
      </div>
      
      <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🔒</span>
        <span>Your signature is encrypted and protected. This e-signature is legally binding under the ESIGN Act and UETA.</span>
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contract.name}</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 50px 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
    .logo { max-height: 50px; margin-bottom: 15px; }
    h1 { font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
    .section { margin: 25px 0; page-break-inside: avoid; }
    .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .section-content { font-size: 12px; white-space: pre-line; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
    .disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 30px; font-size: 11px; }
    @media print { body { padding: 20px; } .esign-section { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    ${senderInfo.logoUrl ? `<img src="${senderInfo.logoUrl}" alt="${senderInfo.companyName}" class="logo">` : ''}
    <h1>${contract.icon} ${contract.name}</h1>
    <div class="subtitle">Prepared on ${today}</div>
  </div>

  ${sections}

  ${eSignatureSection}

  <div class="disclaimer">
    ⚠️ <strong>LEGAL DISCLAIMER:</strong> This document is provided as a template for informational purposes only and does not constitute legal advice. Every business situation is unique, and legal requirements vary by jurisdiction. We strongly recommend that you review this agreement with a qualified attorney before use. The provider of this template assumes no liability for its use or the outcomes resulting from its use.
  </div>

  <div class="footer">
    <p>Document prepared by ${senderInfo.companyName}</p>
    <p>© ${new Date().getFullYear()} All rights reserved</p>
  </div>
</body>
</html>
  `;
}
