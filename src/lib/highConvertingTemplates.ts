// 60+ High-Converting Email Templates
// Organized by industry and use case for maximum conversion

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'web-design' | 'local-services' | 'b2b' | 'general' | 'follow-up' | 'promotional';
  industry: string;
  subject: string;
  body_html: string;
  description: string;
  previewImage: string;
  conversionTip: string;
}

// Industry-specific placeholder images
const IMAGES = {
  webDesign: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=300&fit=crop",
  plumber: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=300&fit=crop",
  contractor: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=300&fit=crop",
  dentist: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=300&fit=crop",
  realtor: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=300&fit=crop",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop",
  lawyer: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=300&fit=crop",
  accountant: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=300&fit=crop",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop",
  hvac: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=300&fit=crop",
  auto: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&h=300&fit=crop",
  landscaping: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&h=300&fit=crop",
  photography: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=300&fit=crop",
  marketing: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=300&fit=crop",
  ecommerce: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
  consulting: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
  tech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=300&fit=crop",
  healthcare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=300&fit=crop",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
  handshake: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=300&fit=crop",
  celebration: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&h=300&fit=crop",
  growth: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop",
};

// Helper function to create email HTML template
const createEmailHTML = (config: {
  heroImage: string;
  accentColor: string;
  headline: string;
  body: string;
  features: string[];
  cta: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <tr>
      <td>
        <img src="${config.heroImage}" alt="Header" style="width:100%;height:auto;display:block;"/>
      </td>
    </tr>
    <tr>
      <td style="background:${config.accentColor};padding:15px 30px;">
        <span style="color:white;font-size:20px;font-weight:bold;">BamLead</span>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 30px;">
        <h1 style="color:#ffffff;font-size:26px;margin:0 0 20px;line-height:1.3;">${config.headline}</h1>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 25px;">${config.body}</p>
        <table width="100%" style="background:#262626;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <p style="color:${config.accentColor};font-size:14px;font-weight:600;margin:0 0 15px;text-transform:uppercase;">What You Get</p>
              ${config.features.map(f => `<p style="padding:8px 0;color:#ffffff;font-size:15px;margin:0;">✓ ${f}</p>`).join('')}
            </td>
          </tr>
        </table>
        <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;">${config.cta}</a>
        <p style="color:#666666;font-size:14px;margin:30px 0 0;">Best regards,<br/><span style="color:#ffffff;">{{sender_name}}</span></p>
      </td>
    </tr>
    <tr>
      <td style="background:#0f0f0f;padding:20px 30px;border-top:1px solid #262626;">
        <p style="color:#666666;font-size:12px;margin:0;text-align:center;">Sent with BamLead | <a href="#" style="color:${config.accentColor};">Unsubscribe</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const HIGH_CONVERTING_TEMPLATES: EmailTemplate[] = [
  // WEB DESIGN TEMPLATES (10)
  {
    id: 'wd-hero-1',
    name: 'Modern Website Upgrade',
    category: 'web-design',
    industry: 'Web Design',
    subject: '🚀 {{business_name}} Deserves a Modern Website',
    description: 'Hero-style intro for outdated websites',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Opens with value proposition, not a pitch',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Your Website Could Be Working Harder',
      body: "I noticed {{business_name}}'s website might be missing out on potential customers. In 2024, 75% of users judge a business by its website. Let me show you how a modern redesign can boost your leads by 40%.",
      features: ['Mobile-responsive design', 'Fast loading under 3 seconds', 'SEO optimization included', 'Free 30-day support'],
      cta: 'Get a Free Website Audit →'
    }),
  },
  {
    id: 'wd-stats-2',
    name: 'Stats-Driven Pitch',
    category: 'web-design',
    industry: 'Web Design',
    subject: '📊 3 Reasons {{business_name}} Is Losing Customers Online',
    description: 'Data-backed approach with statistics',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Use shocking stats to create urgency',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Your Competitors Are Getting Ahead',
      body: "53% of visitors leave if a site takes more than 3 seconds to load. 88% won't return after a bad experience. I analyzed {{business_name}}'s site and found 3 quick wins that could double your inquiries.",
      features: ['Speed optimization (currently slow)', 'Mobile experience fixes', 'Call-to-action improvements', 'Trust signal additions'],
      cta: 'See Your Free Report →'
    }),
  },
  {
    id: 'wd-portfolio-3',
    name: 'Portfolio Showcase',
    category: 'web-design',
    industry: 'Web Design',
    subject: '✨ See What We Did for Businesses Like {{business_name}}',
    description: 'Social proof with client results',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Show similar industry success stories',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Real Results for Real Businesses',
      body: "Last month, we helped a business just like {{business_name}} increase their website leads by 156%. They went from 5 inquiries/month to 18. I'd love to show you exactly how we did it.",
      features: ['156% more leads in 60 days', 'Same industry as you', 'Affordable monthly plans', 'No long-term contracts'],
      cta: 'View Case Studies →'
    }),
  },
  {
    id: 'wd-local-seo-4',
    name: 'Local SEO Focus',
    category: 'web-design',
    industry: 'Web Design',
    subject: '📍 {{business_name}} Isn\'t Showing Up on Google Maps',
    description: 'SEO-focused for local businesses',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Address Google visibility concerns',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#ef4444',
      headline: '{{first_name}}, Are Customers Finding You Online?',
      body: "I searched for your services in your area and {{business_name}} wasn't in the top results. That means potential customers are going to your competitors. Let me help fix that.",
      features: ['Google Business Profile optimization', 'Local keyword targeting', 'Review management setup', 'Map pack ranking strategy'],
      cta: 'Check My Rankings →'
    }),
  },
  {
    id: 'wd-competitor-5',
    name: 'Competitor Comparison',
    category: 'web-design',
    industry: 'Web Design',
    subject: '👀 {{business_name}} vs Your Top Competitor',
    description: 'Competitive analysis approach',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Create urgency through competition',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Your Competitors Are Investing in Their Websites',
      body: "I noticed several businesses in your area recently upgraded their websites. {{business_name}} risks falling behind if customers compare options online. Want to see how you stack up?",
      features: ['Competitor website analysis', 'Feature gap identification', 'Action priority roadmap', 'Budget-friendly solutions'],
      cta: 'Get Competitor Report →'
    }),
  },
  {
    id: 'wd-mobile-6',
    name: 'Mobile-First Alert',
    category: 'web-design',
    industry: 'Web Design',
    subject: '📱 {{business_name}}\'s Mobile Site Needs Attention',
    description: 'Mobile optimization focus',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Target mobile experience issues',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, 70% of Your Visitors Are on Mobile',
      body: "I tested {{business_name}}'s website on my phone and noticed some issues that could be costing you customers. The good news? These are quick fixes that make a big difference.",
      features: ['Faster mobile loading', 'Easy-to-tap buttons', 'Readable text sizes', 'Click-to-call functionality'],
      cta: 'Fix My Mobile Site →'
    }),
  },
  {
    id: 'wd-refresh-7',
    name: 'Seasonal Refresh',
    category: 'web-design',
    industry: 'Web Design',
    subject: '🌟 New Year, New Website for {{business_name}}?',
    description: 'Seasonal/New Year pitch',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Leverage seasonal motivation',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#8b5cf6',
      headline: 'Hi {{first_name}}, Start 2024 with a Fresh Look',
      body: "New year, new opportunities! Many businesses in your industry are updating their websites right now. It's the perfect time to give {{business_name}} a fresh look that converts more visitors.",
      features: ['Modern 2024 design trends', 'Faster performance', 'Updated content strategy', 'New customer testimonials'],
      cta: 'Get New Year Pricing →'
    }),
  },
  {
    id: 'wd-trust-8',
    name: 'Trust Building Focus',
    category: 'web-design',
    industry: 'Web Design',
    subject: '🛡️ Is {{business_name}}\'s Website Building Trust?',
    description: 'Focus on credibility and trust signals',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Address trust factor concerns',
    body_html: createEmailHTML({
      heroImage: IMAGES.webDesign,
      accentColor: '#059669',
      headline: '{{first_name}}, First Impressions Matter Online',
      body: "Visitors decide in 3 seconds if they trust a website. I reviewed {{business_name}}'s site and have some quick recommendations to boost credibility and convert more browsers into buyers.",
      features: ['Professional design upgrade', 'Customer testimonials section', 'Trust badges & certifications', 'Clear contact information'],
      cta: 'Build More Trust →'
    }),
  },
  {
    id: 'wd-ecommerce-9',
    name: 'E-commerce Ready',
    category: 'web-design',
    industry: 'Web Design',
    subject: '💰 Ready to Sell Online, {{first_name}}?',
    description: 'For businesses ready to sell online',
    previewImage: IMAGES.ecommerce,
    conversionTip: 'Target businesses wanting online sales',
    body_html: createEmailHTML({
      heroImage: IMAGES.ecommerce,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Your Customers Want to Buy Online',
      body: "More customers than ever prefer shopping online. {{business_name}} could be open 24/7 with an e-commerce website. I can help you set up a simple online store in just 2 weeks.",
      features: ['Easy product management', 'Secure payment processing', 'Mobile shopping ready', 'Inventory tracking'],
      cta: 'Explore E-commerce →'
    }),
  },
  {
    id: 'wd-maintenance-10',
    name: 'Website Maintenance',
    category: 'web-design',
    industry: 'Web Design',
    subject: '⚠️ {{business_name}}\'s Website Security Check',
    description: 'Maintenance and security focus',
    previewImage: IMAGES.tech,
    conversionTip: 'Address security concerns',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#ef4444',
      headline: '{{first_name}}, When Did You Last Update Your Website?',
      body: "Outdated websites are vulnerable to hackers and can damage your reputation. I noticed {{business_name}}'s site might need some maintenance. Let me do a free security check.",
      features: ['Security vulnerability scan', 'Software updates', 'Backup verification', 'Performance check'],
      cta: 'Get Security Check →'
    }),
  },

  // LOCAL SERVICES TEMPLATES (15)
  {
    id: 'ls-restaurant-1',
    name: 'Restaurant Outreach',
    category: 'local-services',
    industry: 'Restaurant',
    subject: '🍽️ {{business_name}} - More Diners Are Searching Online',
    description: 'For restaurants needing online presence',
    previewImage: IMAGES.restaurant,
    conversionTip: 'Focus on reservations and foot traffic',
    body_html: createEmailHTML({
      heroImage: IMAGES.restaurant,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, Fill More Tables with a Better Website',
      body: "86% of diners check a restaurant's website before visiting. {{business_name}} could attract more customers with an updated online presence that showcases your menu and atmosphere.",
      features: ['Mouth-watering menu display', 'Online reservation system', 'Social media integration', 'Google Maps optimization'],
      cta: 'See Restaurant Examples →'
    }),
  },
  {
    id: 'ls-plumber-2',
    name: 'Plumber Outreach',
    category: 'local-services',
    industry: 'Plumbing',
    subject: '🔧 {{business_name}} - Emergency Calls Are Going to Competitors',
    description: 'For plumbing businesses',
    previewImage: IMAGES.plumber,
    conversionTip: 'Emphasize emergency call capture',
    body_html: createEmailHTML({
      heroImage: IMAGES.plumber,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Capture More Emergency Calls',
      body: "When pipes burst, customers search on their phones. If {{business_name}} isn't ranking on Google, those calls go elsewhere. I can help you become the go-to plumber in your area.",
      features: ['24/7 click-to-call button', 'Emergency service highlighting', 'Service area maps', 'Customer review showcase'],
      cta: 'Get More Service Calls →'
    }),
  },
  {
    id: 'ls-contractor-3',
    name: 'Contractor Outreach',
    category: 'local-services',
    industry: 'Construction',
    subject: '🏗️ {{business_name}} - Your Best Projects Deserve to Be Seen',
    description: 'For contractors and builders',
    previewImage: IMAGES.contractor,
    conversionTip: 'Portfolio showcase focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.contractor,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Show Off Your Best Work Online',
      body: "Homeowners want to see past projects before hiring. {{business_name}}'s website could be your best sales tool with a professional portfolio that wins more bids.",
      features: ['Before/after galleries', 'Project case studies', 'Customer testimonials', 'Easy quote requests'],
      cta: 'Build Your Portfolio →'
    }),
  },
  {
    id: 'ls-dentist-4',
    name: 'Dental Practice',
    category: 'local-services',
    industry: 'Dental',
    subject: '🦷 {{business_name}} - New Patients Are Searching for You',
    description: 'For dental practices',
    previewImage: IMAGES.dentist,
    conversionTip: 'Focus on patient acquisition',
    body_html: createEmailHTML({
      heroImage: IMAGES.dentist,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, Attract More New Patients Online',
      body: "97% of patients search online before choosing a dentist. {{business_name}} could be attracting more new patients with a modern, trust-building website.",
      features: ['Online appointment booking', 'Insurance accepted display', 'Virtual office tour', 'Patient testimonials'],
      cta: 'See Dental Examples →'
    }),
  },
  {
    id: 'ls-realtor-5',
    name: 'Real Estate Agent',
    category: 'local-services',
    industry: 'Real Estate',
    subject: '🏠 {{business_name}} - Stand Out in a Competitive Market',
    description: 'For real estate professionals',
    previewImage: IMAGES.realtor,
    conversionTip: 'Property showcase and lead capture',
    body_html: createEmailHTML({
      heroImage: IMAGES.realtor,
      accentColor: '#8b5cf6',
      headline: 'Hi {{first_name}}, Win More Listings with a Pro Website',
      body: "In real estate, your website IS your brand. {{business_name}} could attract more sellers and buyers with a professional site that showcases your expertise and listings.",
      features: ['IDX property listings', 'Neighborhood guides', 'Seller/buyer resources', 'Lead capture forms'],
      cta: 'See Realtor Websites →'
    }),
  },
  {
    id: 'ls-gym-6',
    name: 'Fitness Center',
    category: 'local-services',
    industry: 'Fitness',
    subject: '💪 {{business_name}} - More Members Are Looking Online',
    description: 'For gyms and fitness centers',
    previewImage: IMAGES.gym,
    conversionTip: 'Membership conversion focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.gym,
      accentColor: '#ef4444',
      headline: '{{first_name}}, Convert More Website Visitors to Members',
      body: "People researching gyms online are ready to join. {{business_name}} could convert more visitors with a website that shows off your facility and makes signing up easy.",
      features: ['Virtual gym tour', 'Class schedule display', 'Online membership signup', 'Trainer profiles'],
      cta: 'Grow Memberships →'
    }),
  },
  {
    id: 'ls-salon-7',
    name: 'Hair Salon/Spa',
    category: 'local-services',
    industry: 'Beauty',
    subject: '💇 {{business_name}} - Book More Appointments Online',
    description: 'For salons and spas',
    previewImage: IMAGES.salon,
    conversionTip: 'Online booking emphasis',
    body_html: createEmailHTML({
      heroImage: IMAGES.salon,
      accentColor: '#ec4899',
      headline: 'Hi {{first_name}}, Let Clients Book Anytime',
      body: "Modern clients want to book appointments at midnight if they feel like it. {{business_name}} could capture more bookings with 24/7 online scheduling.",
      features: ['Online booking system', 'Service menu & pricing', 'Staff portfolio', 'Instagram integration'],
      cta: 'See Salon Examples →'
    }),
  },
  {
    id: 'ls-lawyer-8',
    name: 'Law Firm',
    category: 'local-services',
    industry: 'Legal',
    subject: '⚖️ {{business_name}} - Clients Need to Trust You Online First',
    description: 'For law firms and attorneys',
    previewImage: IMAGES.lawyer,
    conversionTip: 'Trust and credibility focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.lawyer,
      accentColor: '#1e3a5f',
      headline: '{{first_name}}, Build Client Trust Before They Call',
      body: "Legal clients research extensively before contacting a firm. {{business_name}}'s website should establish credibility and make it easy to take the next step.",
      features: ['Attorney profiles & credentials', 'Practice area pages', 'Case results showcase', 'Free consultation forms'],
      cta: 'See Legal Websites →'
    }),
  },
  {
    id: 'ls-accountant-9',
    name: 'Accounting Firm',
    category: 'local-services',
    industry: 'Accounting',
    subject: '📊 {{business_name}} - Tax Season Traffic Opportunity',
    description: 'For accountants and CPAs',
    previewImage: IMAGES.accountant,
    conversionTip: 'Seasonal urgency for tax pros',
    body_html: createEmailHTML({
      heroImage: IMAGES.accountant,
      accentColor: '#059669',
      headline: 'Hi {{first_name}}, Capture More Clients This Tax Season',
      body: "People are already searching for accountants for next year. {{business_name}} could be attracting new clients right now with a website that builds trust and showcases your expertise.",
      features: ['Service breakdown', 'Client portal access', 'Online document upload', 'Free consultation booking'],
      cta: 'Get Tax Season Ready →'
    }),
  },
  {
    id: 'ls-cleaning-10',
    name: 'Cleaning Service',
    category: 'local-services',
    industry: 'Cleaning',
    subject: '✨ {{business_name}} - Busy Season Is Coming',
    description: 'For cleaning companies',
    previewImage: IMAGES.cleaning,
    conversionTip: 'Easy quote request focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.cleaning,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, Make Booking a Breeze',
      body: "Customers want quick quotes for cleaning services. {{business_name}} could capture more leads with a website that offers instant quotes and easy booking.",
      features: ['Instant quote calculator', 'Service area map', 'Before/after photos', 'Recurring booking options'],
      cta: 'Simplify Bookings →'
    }),
  },
  {
    id: 'ls-hvac-11',
    name: 'HVAC Company',
    category: 'local-services',
    industry: 'HVAC',
    subject: '❄️ {{business_name}} - Summer Rush Is Around the Corner',
    description: 'For HVAC contractors',
    previewImage: IMAGES.hvac,
    conversionTip: 'Seasonal service urgency',
    body_html: createEmailHTML({
      heroImage: IMAGES.hvac,
      accentColor: '#3b82f6',
      headline: 'Hi {{first_name}}, Prepare for Peak Season',
      body: "When AC units break in summer, customers need help fast. {{business_name}} should be the first company they find. Let's make sure you're ready.",
      features: ['Emergency service highlighting', '24/7 call capability', 'Service plan promotion', 'Quick appointment booking'],
      cta: 'Beat the Rush →'
    }),
  },
  {
    id: 'ls-auto-12',
    name: 'Auto Shop',
    category: 'local-services',
    industry: 'Automotive',
    subject: '🚗 {{business_name}} - Drivers Are Looking for Honest Mechanics',
    description: 'For auto repair shops',
    previewImage: IMAGES.auto,
    conversionTip: 'Trust is key for auto services',
    body_html: createEmailHTML({
      heroImage: IMAGES.auto,
      accentColor: '#f59e0b',
      headline: '{{first_name}}, Build Trust Before They Walk In',
      body: "Car owners are skeptical of mechanics. {{business_name}} can stand out by showcasing transparency, certifications, and real customer reviews on a professional website.",
      features: ['Transparent pricing', 'Certification display', 'Customer reviews', 'Online appointment scheduling'],
      cta: 'Build Customer Trust →'
    }),
  },
  {
    id: 'ls-landscaping-13',
    name: 'Landscaping Company',
    category: 'local-services',
    industry: 'Landscaping',
    subject: '🌿 {{business_name}} - Spring Projects Are Being Planned Now',
    description: 'For landscaping businesses',
    previewImage: IMAGES.landscaping,
    conversionTip: 'Visual portfolio emphasis',
    body_html: createEmailHTML({
      heroImage: IMAGES.landscaping,
      accentColor: '#22c55e',
      headline: 'Hi {{first_name}}, Show Off Your Green Thumb',
      body: "Homeowners love browsing landscaping portfolios for inspiration. {{business_name}}'s website could be full of stunning project photos that win you more jobs.",
      features: ['Project photo galleries', 'Before/after sliders', 'Service descriptions', 'Free estimate forms'],
      cta: 'Showcase Your Work →'
    }),
  },
  {
    id: 'ls-photography-14',
    name: 'Photography Studio',
    category: 'local-services',
    industry: 'Photography',
    subject: '📸 {{business_name}} - Your Portfolio Deserves Better',
    description: 'For photographers',
    previewImage: IMAGES.photography,
    conversionTip: 'Portfolio presentation focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.photography,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Let Your Work Speak for Itself',
      body: "Your photos are stunning, but is your website doing them justice? {{business_name}} deserves a portfolio site that wows potential clients and books more sessions.",
      features: ['Gallery-focused design', 'Client proofing portal', 'Package displays', 'Booking calendar'],
      cta: 'Upgrade Your Portfolio →'
    }),
  },
  {
    id: 'ls-pet-15',
    name: 'Pet Services',
    category: 'local-services',
    industry: 'Pet Care',
    subject: '🐕 {{business_name}} - Pet Parents Are Searching',
    description: 'For pet groomers, vets, pet stores',
    previewImage: IMAGES.healthcare,
    conversionTip: 'Emotional connection with pet owners',
    body_html: createEmailHTML({
      heroImage: IMAGES.healthcare,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Connect with Pet Parents',
      body: "Pet owners treat their fur babies like family. {{business_name}} can build that emotional connection with a warm, welcoming website that shows you care.",
      features: ['Happy pet galleries', 'Service descriptions', 'Online booking', 'Staff introductions'],
      cta: 'Win Pet Parents →'
    }),
  },

  // B2B TEMPLATES (15)
  {
    id: 'b2b-marketing-1',
    name: 'Marketing Agency',
    category: 'b2b',
    industry: 'Marketing',
    subject: '📈 {{business_name}} - Your Marketing Could Work Harder',
    description: 'For B2B marketing services',
    previewImage: IMAGES.marketing,
    conversionTip: 'Results and ROI focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Ready to Scale Your Marketing?',
      body: "I've been following {{business_name}} and noticed some opportunities to amplify your marketing. Our agency specializes in helping businesses like yours get better ROI.",
      features: ['Data-driven strategies', 'Multi-channel campaigns', 'Monthly performance reports', 'Dedicated account manager'],
      cta: 'Discuss Marketing Goals →'
    }),
  },
  {
    id: 'b2b-consulting-2',
    name: 'Consulting Services',
    category: 'b2b',
    industry: 'Consulting',
    subject: '💡 {{business_name}} - Fresh Perspective on Growth',
    description: 'For consulting firms',
    previewImage: IMAGES.consulting,
    conversionTip: 'Expertise and insight focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Sometimes You Need an Outside View',
      body: "Great businesses benefit from fresh perspectives. I help companies like {{business_name}} identify blind spots and unlock new growth opportunities.",
      features: ['Business assessment', 'Strategy development', 'Implementation support', 'Ongoing coaching'],
      cta: 'Get Fresh Insights →'
    }),
  },
  {
    id: 'b2b-saas-3',
    name: 'SaaS Solution',
    category: 'b2b',
    industry: 'Technology',
    subject: '⚡ {{business_name}} - Automate What\'s Slowing You Down',
    description: 'For software solutions',
    previewImage: IMAGES.tech,
    conversionTip: 'Efficiency and automation focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#3b82f6',
      headline: 'Hi {{first_name}}, Save 10 Hours a Week',
      body: "What if {{business_name}} could automate the repetitive tasks that eat up your time? Our platform helps businesses like yours work smarter, not harder.",
      features: ['Easy implementation', 'Team training included', '24/7 support', '30-day free trial'],
      cta: 'Start Free Trial →'
    }),
  },
  {
    id: 'b2b-hr-4',
    name: 'HR Services',
    category: 'b2b',
    industry: 'Human Resources',
    subject: '👥 {{business_name}} - Hiring the Right People Is Hard',
    description: 'For HR and recruiting services',
    previewImage: IMAGES.team,
    conversionTip: 'Pain point: hiring struggles',
    body_html: createEmailHTML({
      heroImage: IMAGES.team,
      accentColor: '#ec4899',
      headline: '{{first_name}}, Finding Great Talent Shouldn\'t Be This Hard',
      body: "I know {{business_name}} is growing, and finding the right people is crucial. Our HR solutions help businesses attract, hire, and retain top talent.",
      features: ['Candidate sourcing', 'Interview process design', 'Onboarding support', 'Retention strategies'],
      cta: 'Improve Your Hiring →'
    }),
  },
  {
    id: 'b2b-it-5',
    name: 'IT Services',
    category: 'b2b',
    industry: 'IT Services',
    subject: '🔒 {{business_name}} - Is Your Tech Secure?',
    description: 'For IT service providers',
    previewImage: IMAGES.tech,
    conversionTip: 'Security concern approach',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, Cyber Threats Are Rising',
      body: "With cyber attacks up 300% this year, {{business_name}}'s data security is more important than ever. Our IT team can assess your vulnerabilities and keep you protected.",
      features: ['Security assessment', '24/7 monitoring', 'Data backup solutions', 'Employee training'],
      cta: 'Get Security Audit →'
    }),
  },
  {
    id: 'b2b-finance-6',
    name: 'Financial Services',
    category: 'b2b',
    industry: 'Finance',
    subject: '💰 {{business_name}} - Optimize Your Cash Flow',
    description: 'For financial service providers',
    previewImage: IMAGES.accountant,
    conversionTip: 'Cash flow and growth focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.accountant,
      accentColor: '#059669',
      headline: '{{first_name}}, Money Shouldn\'t Be Stressful',
      body: "Managing {{business_name}}'s finances while growing is challenging. Our financial experts help businesses like yours optimize cash flow and plan for sustainable growth.",
      features: ['Cash flow optimization', 'Financial planning', 'Tax strategies', 'Growth forecasting'],
      cta: 'Discuss Finances →'
    }),
  },
  {
    id: 'b2b-logistics-7',
    name: 'Logistics/Shipping',
    category: 'b2b',
    industry: 'Logistics',
    subject: '📦 {{business_name}} - Shipping Eating Your Margins?',
    description: 'For logistics companies',
    previewImage: IMAGES.ecommerce,
    conversionTip: 'Cost savings approach',
    body_html: createEmailHTML({
      heroImage: IMAGES.ecommerce,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Cut Shipping Costs by 25%',
      body: "I noticed {{business_name}} ships products and wanted to share how we help businesses reduce shipping costs while improving delivery times. Interested in a quick audit?",
      features: ['Rate negotiations', 'Route optimization', 'Carrier management', 'Real-time tracking'],
      cta: 'Get Shipping Audit →'
    }),
  },
  {
    id: 'b2b-training-8',
    name: 'Corporate Training',
    category: 'b2b',
    industry: 'Training',
    subject: '🎓 {{business_name}} - Upskill Your Team in 2024',
    description: 'For training providers',
    previewImage: IMAGES.consulting,
    conversionTip: 'Team development focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Invest in Your Team\'s Growth',
      body: "Companies that invest in training see 24% higher profit margins. Is {{business_name}} ready to upskill your team and stay ahead of the competition?",
      features: ['Custom training programs', 'On-site or virtual options', 'Measurable outcomes', 'Certification paths'],
      cta: 'Explore Training →'
    }),
  },
  {
    id: 'b2b-insurance-9',
    name: 'Business Insurance',
    category: 'b2b',
    industry: 'Insurance',
    subject: '🛡️ {{business_name}} - Are You Properly Covered?',
    description: 'For insurance providers',
    previewImage: IMAGES.lawyer,
    conversionTip: 'Risk and protection focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.lawyer,
      accentColor: '#1e3a5f',
      headline: 'Hi {{first_name}}, Don\'t Leave Your Business Exposed',
      body: "Many businesses like {{business_name}} are underinsured without knowing it. A quick policy review could save you thousands—or protect you from a costly claim.",
      features: ['Free policy review', 'Coverage gap analysis', 'Competitive quotes', 'Claims support'],
      cta: 'Review My Coverage →'
    }),
  },
  {
    id: 'b2b-print-10',
    name: 'Printing Services',
    category: 'b2b',
    industry: 'Printing',
    subject: '🖨️ {{business_name}} - Quality Prints, Better Prices',
    description: 'For print shops',
    previewImage: IMAGES.marketing,
    conversionTip: 'Quality and value focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, Elevate Your Brand Materials',
      body: "First impressions matter. {{business_name}}'s marketing materials should look as professional as your work. We deliver premium printing at competitive prices.",
      features: ['Business cards & brochures', 'Signage & banners', 'Rush orders available', 'Design services'],
      cta: 'Get Print Quote →'
    }),
  },
  {
    id: 'b2b-wholesale-11',
    name: 'Wholesale Supplier',
    category: 'b2b',
    industry: 'Wholesale',
    subject: '📦 {{business_name}} - Better Margins Start Here',
    description: 'For wholesale/supply businesses',
    previewImage: IMAGES.ecommerce,
    conversionTip: 'Cost and margin focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.ecommerce,
      accentColor: '#059669',
      headline: 'Hi {{first_name}}, Boost Your Bottom Line',
      body: "What if {{business_name}} could get the same quality supplies at better prices? Our wholesale program helps businesses improve margins without sacrificing quality.",
      features: ['Competitive pricing', 'Reliable delivery', 'Flexible ordering', 'Volume discounts'],
      cta: 'See Wholesale Pricing →'
    }),
  },
  {
    id: 'b2b-security-12',
    name: 'Security Services',
    category: 'b2b',
    industry: 'Security',
    subject: '🔐 {{business_name}} - Protect What You\'ve Built',
    description: 'For security service providers',
    previewImage: IMAGES.tech,
    conversionTip: 'Protection and peace of mind',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#ef4444',
      headline: '{{first_name}}, Security Is an Investment, Not an Expense',
      body: "{{business_name}} has worked hard to build something great. Our security solutions protect your assets, employees, and customers so you can focus on growth.",
      features: ['24/7 monitoring', 'Access control systems', 'Video surveillance', 'Emergency response'],
      cta: 'Discuss Security Needs →'
    }),
  },
  {
    id: 'b2b-event-13',
    name: 'Event Services',
    category: 'b2b',
    industry: 'Events',
    subject: '🎉 {{business_name}} - Make Your Next Event Unforgettable',
    description: 'For event planning companies',
    previewImage: IMAGES.restaurant,
    conversionTip: 'Experience and stress reduction',
    body_html: createEmailHTML({
      heroImage: IMAGES.restaurant,
      accentColor: '#ec4899',
      headline: 'Hi {{first_name}}, We Handle the Details',
      body: "Planning company events is stressful. Let {{business_name}} focus on business while we create memorable experiences for your team or clients.",
      features: ['Full event planning', 'Venue sourcing', 'Catering coordination', 'On-site management'],
      cta: 'Plan Your Event →'
    }),
  },
  {
    id: 'b2b-translation-14',
    name: 'Translation Services',
    category: 'b2b',
    industry: 'Translation',
    subject: '🌍 {{business_name}} - Reach New Markets',
    description: 'For translation/localization services',
    previewImage: IMAGES.consulting,
    conversionTip: 'Global expansion focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Speak Your Customers\' Language',
      body: "{{business_name}} could reach millions more customers by translating your content. Our professional translators help businesses expand globally.",
      features: ['Native-speaking translators', 'Industry expertise', 'Fast turnaround', 'Website localization'],
      cta: 'Explore Translation →'
    }),
  },
  {
    id: 'b2b-data-15',
    name: 'Data Services',
    category: 'b2b',
    industry: 'Data/Analytics',
    subject: '📊 {{business_name}} - Your Data Has Stories to Tell',
    description: 'For data/analytics companies',
    previewImage: IMAGES.tech,
    conversionTip: 'Insights and decision-making',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#8b5cf6',
      headline: 'Hi {{first_name}}, Make Data-Driven Decisions',
      body: "{{business_name}} is sitting on valuable data. Our analytics team can help you uncover insights that drive better decisions and faster growth.",
      features: ['Custom dashboards', 'Predictive analytics', 'Automated reporting', 'Actionable insights'],
      cta: 'Unlock Your Data →'
    }),
  },

  // GENERAL TEMPLATES (10)
  {
    id: 'gen-intro-1',
    name: 'Friendly Introduction',
    category: 'general',
    industry: 'Any',
    subject: '👋 Quick Question for {{first_name}} at {{business_name}}',
    description: 'Casual, friendly first touch',
    previewImage: IMAGES.consulting,
    conversionTip: 'Low-pressure, curiosity-based',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Quick Question',
      body: "I came across {{business_name}} and was curious—are you currently looking for ways to grow your online presence? If timing isn't right, no worries at all!",
      features: ['No-pressure conversation', 'Quick 15-minute call', 'Honest assessment', 'No strings attached'],
      cta: 'Let\'s Chat →'
    }),
  },
  {
    id: 'gen-value-2',
    name: 'Value-First Approach',
    category: 'general',
    industry: 'Any',
    subject: '🎁 Free Resource for {{business_name}}',
    description: 'Lead with free value',
    previewImage: IMAGES.marketing,
    conversionTip: 'Give before asking',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#059669',
      headline: '{{first_name}}, I Made This for You',
      body: "I put together a free guide specifically for businesses like {{business_name}}. No strings attached—just some ideas that might help. Would you like a copy?",
      features: ['Free industry guide', 'Actionable tips', 'No sales pitch', 'Instant download'],
      cta: 'Get Free Guide →'
    }),
  },
  {
    id: 'gen-referral-3',
    name: 'Referral Mention',
    category: 'general',
    industry: 'Any',
    subject: '{{mutual_contact}} Suggested I Reach Out',
    description: 'Leverage mutual connections',
    previewImage: IMAGES.handshake,
    conversionTip: 'Social proof through referral',
    body_html: createEmailHTML({
      heroImage: IMAGES.handshake,
      accentColor: '#8b5cf6',
      headline: 'Hi {{first_name}}, We Have a Mutual Connection',
      body: "{{mutual_contact}} mentioned that {{business_name}} might be interested in improving your online presence. I'd love to share some ideas if you're open to it.",
      features: ['Recommended by {{mutual_contact}}', 'Trusted by similar businesses', 'No obligation conversation', 'Quick intro call'],
      cta: 'Schedule Quick Call →'
    }),
  },
  {
    id: 'gen-congratulations-4',
    name: 'Congratulations Opening',
    category: 'general',
    industry: 'Any',
    subject: '🎉 Congrats on the News, {{first_name}}!',
    description: 'Celebrate recent achievements',
    previewImage: IMAGES.celebration,
    conversionTip: 'Personal touch through research',
    body_html: createEmailHTML({
      heroImage: IMAGES.celebration,
      accentColor: '#f59e0b',
      headline: 'Congratulations, {{first_name}}!',
      body: "I saw the recent news about {{business_name}} and wanted to say congrats! Exciting times. As you grow, I'd love to help ensure your online presence keeps pace.",
      features: ['Timely celebration', 'Growth-focused ideas', 'Scaling strategies', 'Quick conversation'],
      cta: 'Let\'s Celebrate Together →'
    }),
  },
  {
    id: 'gen-problem-5',
    name: 'Problem Spotter',
    category: 'general',
    industry: 'Any',
    subject: '⚠️ Noticed Something on {{business_name}}\'s Website',
    description: 'Helpful problem identification',
    previewImage: IMAGES.tech,
    conversionTip: 'Be genuinely helpful',
    body_html: createEmailHTML({
      heroImage: IMAGES.tech,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, Heads Up!',
      body: "While researching {{business_name}}, I noticed a few things on your website that might be costing you customers. I put together a quick list—want me to send it over?",
      features: ['Free website audit', 'Priority issues identified', 'Quick fix recommendations', 'No obligation'],
      cta: 'Send Me the List →'
    }),
  },
  {
    id: 'gen-curiosity-6',
    name: 'Curiosity Hook',
    category: 'general',
    industry: 'Any',
    subject: 'Quick Thought About {{business_name}}',
    description: 'Short, curiosity-driven',
    previewImage: IMAGES.consulting,
    conversionTip: 'Keep it mysterious and short',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Interesting Idea',
      body: "I had a thought about how {{business_name}} could potentially double your website inquiries. Too long for email—worth a quick call?",
      features: ['5-minute conversation', 'One interesting idea', 'No sales pitch', 'Honest feedback'],
      cta: 'I\'m Curious →'
    }),
  },
  {
    id: 'gen-social-proof-7',
    name: 'Social Proof Heavy',
    category: 'general',
    industry: 'Any',
    subject: '📈 How 50+ Businesses Like {{business_name}} Grew Online',
    description: 'Numbers and testimonials focus',
    previewImage: IMAGES.growth,
    conversionTip: 'Let others do the selling',
    body_html: createEmailHTML({
      heroImage: IMAGES.growth,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, You\'re Not Alone',
      body: "50+ businesses in your industry trusted us to improve their online presence. The average saw 47% more website inquiries. {{business_name}} could be next.",
      features: ['50+ success stories', '47% average improvement', 'Industry-specific results', 'Money-back guarantee'],
      cta: 'See Success Stories →'
    }),
  },
  {
    id: 'gen-limited-8',
    name: 'Limited Availability',
    category: 'general',
    industry: 'Any',
    subject: '⏰ Only Taking 3 New Clients This Month',
    description: 'Scarcity-based approach',
    previewImage: IMAGES.consulting,
    conversionTip: 'Create urgency through scarcity',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#ef4444',
      headline: '{{first_name}}, Limited Spots Available',
      body: "We're only taking 3 new clients this month to ensure quality. I came across {{business_name}} and thought you'd be a great fit. Interested in chatting?",
      features: ['3 spots remaining', 'Priority onboarding', 'Dedicated attention', 'Quality guarantee'],
      cta: 'Claim Your Spot →'
    }),
  },
  {
    id: 'gen-direct-9',
    name: 'Direct & Confident',
    category: 'general',
    industry: 'Any',
    subject: 'I Can Help {{business_name}} Get More Customers',
    description: 'Confident, no-nonsense approach',
    previewImage: IMAGES.marketing,
    conversionTip: 'Confidence attracts',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#1e3a5f',
      headline: '{{first_name}}, Let Me Be Direct',
      body: "I help businesses like {{business_name}} get more customers from their website. If that's something you're interested in, let's talk. If not, no hard feelings.",
      features: ['Proven track record', 'Clear pricing', 'Fast results', 'Straightforward process'],
      cta: 'Let\'s Talk →'
    }),
  },
  {
    id: 'gen-personal-10',
    name: 'Personal Story',
    category: 'general',
    industry: 'Any',
    subject: 'Why I Started Helping Businesses Like {{business_name}}',
    description: 'Storytelling approach',
    previewImage: IMAGES.team,
    conversionTip: 'Build connection through story',
    body_html: createEmailHTML({
      heroImage: IMAGES.team,
      accentColor: '#8b5cf6',
      headline: 'Hi {{first_name}}, A Quick Story',
      body: "Years ago, I watched my family's business struggle because they couldn't figure out the online stuff. That's why I help businesses like {{business_name}}—because I know how much it matters.",
      features: ['Personal commitment', 'Genuine care', 'Real understanding', 'Partner, not vendor'],
      cta: 'Hear More of My Story →'
    }),
  },

  // FOLLOW-UP TEMPLATES (10)
  {
    id: 'fu-gentle-1',
    name: 'Gentle Nudge',
    category: 'follow-up',
    industry: 'Any',
    subject: '↩️ Following Up on My Note',
    description: 'Soft follow-up reminder',
    previewImage: IMAGES.consulting,
    conversionTip: 'Low-pressure check-in',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Just Checking In',
      body: "I sent a note last week about {{business_name}}'s website. Totally understand if timing isn't right—just didn't want my message to get lost in the shuffle!",
      features: ['No pressure', 'Quick response appreciated', 'Happy to wait', 'Here when you\'re ready'],
      cta: 'Let Me Know →'
    }),
  },
  {
    id: 'fu-value-add-2',
    name: 'Added Value Follow-up',
    category: 'follow-up',
    industry: 'Any',
    subject: '🎁 Forgot to Mention This',
    description: 'Add more value on follow-up',
    previewImage: IMAGES.marketing,
    conversionTip: 'Give more, ask less',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#059669',
      headline: '{{first_name}}, One More Thing',
      body: "Following up on my previous email—I also wanted to share this free checklist that businesses like {{business_name}} have found helpful. It's yours regardless of whether we work together.",
      features: ['Free checklist included', 'No strings attached', 'Immediate value', 'Just because'],
      cta: 'Get Your Checklist →'
    }),
  },
  {
    id: 'fu-busy-3',
    name: 'I Know You\'re Busy',
    category: 'follow-up',
    industry: 'Any',
    subject: 'Totally Get It If You\'re Swamped',
    description: 'Empathetic follow-up',
    previewImage: IMAGES.consulting,
    conversionTip: 'Show understanding',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Running a Business Is Busy',
      body: "I know {{business_name}} keeps you busy! Just wanted to float back to the top of your inbox. If now's not the right time, just let me know and I'll check back later.",
      features: ['Understanding of your time', 'No pressure timeline', 'Flexible scheduling', 'Patience guaranteed'],
      cta: 'Quick Reply Works →'
    }),
  },
  {
    id: 'fu-breakup-4',
    name: 'Breakup Email',
    category: 'follow-up',
    industry: 'Any',
    subject: '🤝 Last Note From Me',
    description: 'Final follow-up before stopping',
    previewImage: IMAGES.consulting,
    conversionTip: 'Scarcity of attention',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, I\'ll Stop Here',
      body: "I've reached out a few times about helping {{business_name}}. Don't want to be a pest! This will be my last note—but if things change, I'm always here.",
      features: ['Respecting your inbox', 'Door always open', 'No hard feelings', 'Best wishes regardless'],
      cta: 'Actually, Let\'s Talk →'
    }),
  },
  {
    id: 'fu-question-5',
    name: 'Quick Question Follow-up',
    category: 'follow-up',
    industry: 'Any',
    subject: '❓ Quick Question, {{first_name}}',
    description: 'Simple question to re-engage',
    previewImage: IMAGES.consulting,
    conversionTip: 'Easy to respond to',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, One Quick Question',
      body: "Is improving {{business_name}}'s website something that's on your radar for this year? A simple yes/no would help me know if I should keep you in the loop or leave you be.",
      features: ['Simple yes/no answer', 'Respect for your time', 'No pressure', 'Honest answer appreciated'],
      cta: 'Yes or No? →'
    }),
  },
  {
    id: 'fu-timing-6',
    name: 'Bad Timing Check',
    category: 'follow-up',
    industry: 'Any',
    subject: 'Did I Catch You at a Bad Time?',
    description: 'Address timing concerns',
    previewImage: IMAGES.consulting,
    conversionTip: 'Give an easy out',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Bad Timing?',
      body: "I reached out about {{business_name}}'s website but haven't heard back. Totally cool if it's not the right time! When would be better to circle back?",
      features: ['Flexible timing', 'Calendar-based follow-up', 'Your schedule matters', 'Will wait if needed'],
      cta: 'Better Time Is... →'
    }),
  },
  {
    id: 'fu-case-study-7',
    name: 'Case Study Share',
    category: 'follow-up',
    industry: 'Any',
    subject: '📈 Thought {{business_name}} Would Find This Interesting',
    description: 'Share relevant success story',
    previewImage: IMAGES.growth,
    conversionTip: 'Social proof in follow-up',
    body_html: createEmailHTML({
      heroImage: IMAGES.growth,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, This Might Interest You',
      body: "Just finished a project for a business similar to {{business_name}}—they saw 89% more website inquiries in 60 days. Thought you'd find the case study interesting.",
      features: ['89% more inquiries', 'Similar industry', 'Detailed breakdown', 'Replicable results'],
      cta: 'Read Case Study →'
    }),
  },
  {
    id: 'fu-news-8',
    name: 'News Hook Follow-up',
    category: 'follow-up',
    industry: 'Any',
    subject: 'Saw This News About {{business_name}}',
    description: 'Re-engage through current events',
    previewImage: IMAGES.marketing,
    conversionTip: 'Show you pay attention',
    body_html: createEmailHTML({
      heroImage: IMAGES.marketing,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Saw the News!',
      body: "I noticed some recent updates about {{business_name}}—exciting times! Makes my earlier suggestion about your website even more relevant. Still interested in chatting?",
      features: ['Timely outreach', 'Relevant to your growth', 'Strategic timing', 'Fresh perspective'],
      cta: 'Perfect Timing →'
    }),
  },
  {
    id: 'fu-short-9',
    name: 'Super Short Follow-up',
    category: 'follow-up',
    industry: 'Any',
    subject: '?',
    description: 'Curiosity-inducing ultra-short',
    previewImage: IMAGES.consulting,
    conversionTip: 'Brevity creates curiosity',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#14b8a6',
      headline: '{{first_name}}?',
      body: "Sent you a note last week about {{business_name}}'s website. Worth a quick look?",
      features: ['Super quick read', '15-second decision', 'Yes or no', 'Respect your time'],
      cta: 'Quick Look →'
    }),
  },
  {
    id: 'fu-wrong-person-10',
    name: 'Wrong Person Check',
    category: 'follow-up',
    industry: 'Any',
    subject: 'Am I Reaching the Right Person?',
    description: 'Request for right contact',
    previewImage: IMAGES.consulting,
    conversionTip: 'Easy forward request',
    body_html: createEmailHTML({
      heroImage: IMAGES.consulting,
      accentColor: '#3b82f6',
      headline: 'Hi {{first_name}}, Quick Question',
      body: "I've reached out a couple times about helping {{business_name}} with your website. Am I reaching the right person, or is there someone better to talk to?",
      features: ['Looking for right contact', 'Easy to forward', 'Just point me right', 'Thanks in advance'],
      cta: 'Right Person Is... →'
    }),
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', count: HIGH_CONVERTING_TEMPLATES.length },
  { id: 'web-design', label: 'Web Design', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'web-design').length },
  { id: 'local-services', label: 'Local Services', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'local-services').length },
  { id: 'b2b', label: 'B2B', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'b2b').length },
  { id: 'general', label: 'General', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'general').length },
  { id: 'follow-up', label: 'Follow-up', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'follow-up').length },
];
