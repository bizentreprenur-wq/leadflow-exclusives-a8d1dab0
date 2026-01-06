// Visual Email Templates with Images
// These templates have beautiful designs with placeholder images

export interface VisualEmailTemplate {
  id: string;
  name: string;
  category: 'sales' | 'marketing' | 'recruiting' | 'networking' | 'follow-up' | 'introduction';
  industry?: string;
  subject: string;
  body_html: string;
  description: string;
  tags: string[];
  previewImage: string;
}

// Placeholder image URLs from placeholder services
const PLACEHOLDER_IMAGES = {
  hero: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=300&fit=crop",
  business: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
  office: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=300&fit=crop",
  handshake: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=300&fit=crop",
  growth: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop",
  celebration: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&h=300&fit=crop",
  technology: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=300&fit=crop",
};

export const VISUAL_EMAIL_TEMPLATES: VisualEmailTemplate[] = [
  {
    id: 'visual-hero-intro',
    name: 'Hero Banner Introduction',
    category: 'sales',
    subject: '🚀 Transform {{business_name}} with Modern Web Solutions',
    body_html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <!-- Hero Image -->
    <tr>
      <td>
        <img src="${PLACEHOLDER_IMAGES.hero}" alt="Professional Business" style="width:100%;height:auto;display:block;"/>
      </td>
    </tr>
    <!-- Logo Strip -->
    <tr>
      <td style="background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);padding:15px 30px;">
        <table width="100%">
          <tr>
            <td style="color:white;font-size:24px;font-weight:bold;">BamLead</td>
            <td style="text-align:right;color:rgba(255,255,255,0.8);font-size:14px;">Web Solutions Partner</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:40px 30px;">
        <h1 style="color:#ffffff;font-size:28px;margin:0 0 20px;line-height:1.3;">
          Hi {{first_name}},
        </h1>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 20px;">
          I noticed {{business_name}} could benefit from a modern website upgrade. Our team specializes in creating stunning, high-converting websites that help businesses like yours stand out.
        </p>
        <table width="100%" style="background:#262626;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <p style="color:#14b8a6;font-size:14px;font-weight:600;margin:0 0 10px;text-transform:uppercase;">What We Offer</p>
              <table width="100%">
                <tr>
                  <td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ Mobile-responsive design</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ SEO optimization included</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ Fast loading speeds</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#ffffff;font-size:15px;">✓ 24/7 support</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 25px;">
          Would you be open to a quick 15-minute call to discuss how we can help {{business_name}} grow online?
        </p>
        <!-- CTA Button -->
        <table width="100%">
          <tr>
            <td>
              <a href="#" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Schedule a Call →
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#666666;font-size:14px;margin:30px 0 0;">
          Best regards,<br/>
          <span style="color:#ffffff;">{{sender_name}}</span>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#0f0f0f;padding:20px 30px;border-top:1px solid #262626;">
        <p style="color:#666666;font-size:12px;margin:0;text-align:center;">
          Sent with ❤️ from BamLead | <a href="#" style="color:#14b8a6;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    description: 'Eye-catching hero banner with feature list',
    tags: ['visual', 'hero', 'professional', 'web-design'],
    previewImage: PLACEHOLDER_IMAGES.hero,
  },
  {
    id: 'visual-split-layout',
    name: 'Split Image Layout',
    category: 'sales',
    subject: '💼 Let\'s Partner to Grow {{business_name}}',
    body_html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <!-- Header -->
    <tr>
      <td style="padding:20px 30px;border-bottom:1px solid #262626;">
        <span style="color:#14b8a6;font-size:22px;font-weight:bold;">BamLead</span>
      </td>
    </tr>
    <!-- Split Section -->
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="vertical-align:top;">
              <img src="${PLACEHOLDER_IMAGES.handshake}" alt="Partnership" style="width:100%;height:250px;object-fit:cover;display:block;"/>
            </td>
            <td width="50%" style="vertical-align:middle;padding:30px;background:#262626;">
              <p style="color:#14b8a6;font-size:12px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">Partnership</p>
              <h2 style="color:#ffffff;font-size:22px;margin:0 0 15px;line-height:1.3;">Let's Build Something Amazing Together</h2>
              <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin:0;">
                We help businesses like {{business_name}} achieve their digital goals.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:40px 30px;">
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Hi {{first_name}},</h1>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 25px;">
          I've been researching companies in your industry and {{business_name}} really stood out. I believe there's a great opportunity for us to work together.
        </p>
        <!-- Stats Row -->
        <table width="100%" style="margin:25px 0;">
          <tr>
            <td width="33%" style="text-align:center;padding:20px;background:#262626;border-radius:8px 0 0 8px;">
              <p style="color:#14b8a6;font-size:28px;font-weight:bold;margin:0;">95%</p>
              <p style="color:#666666;font-size:12px;margin:5px 0 0;">Client Satisfaction</p>
            </td>
            <td width="33%" style="text-align:center;padding:20px;background:#262626;border-left:1px solid #333;border-right:1px solid #333;">
              <p style="color:#14b8a6;font-size:28px;font-weight:bold;margin:0;">500+</p>
              <p style="color:#666666;font-size:12px;margin:5px 0 0;">Projects Delivered</p>
            </td>
            <td width="33%" style="text-align:center;padding:20px;background:#262626;border-radius:0 8px 8px 0;">
              <p style="color:#14b8a6;font-size:28px;font-weight:bold;margin:0;">24/7</p>
              <p style="color:#666666;font-size:12px;margin:5px 0 0;">Support Available</p>
            </td>
          </tr>
        </table>
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Let's Connect →
        </a>
        <p style="color:#666666;font-size:14px;margin:25px 0 0;">
          — {{sender_name}}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    description: 'Professional split layout with statistics',
    tags: ['visual', 'split', 'stats', 'partnership'],
    previewImage: PLACEHOLDER_IMAGES.handshake,
  },
  {
    id: 'visual-newsletter',
    name: 'Newsletter Style',
    category: 'marketing',
    subject: '📰 This Week: Industry Insights for {{business_name}}',
    body_html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);padding:25px 30px;">
        <table width="100%">
          <tr>
            <td style="color:white;font-size:26px;font-weight:bold;">📰 Weekly Digest</td>
            <td style="text-align:right;color:rgba(255,255,255,0.8);font-size:13px;">Issue #47</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Intro -->
    <tr>
      <td style="padding:30px;">
        <p style="color:#ffffff;font-size:18px;margin:0 0 10px;">Hey {{first_name}}! 👋</p>
        <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0;">
          Here's what's happening this week in web design and lead generation.
        </p>
      </td>
    </tr>
    <!-- Featured Article -->
    <tr>
      <td style="padding:0 30px 30px;">
        <table width="100%" style="background:#262626;border-radius:12px;overflow:hidden;">
          <tr>
            <td>
              <img src="${PLACEHOLDER_IMAGES.growth}" alt="Growth" style="width:100%;height:180px;object-fit:cover;display:block;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:25px;">
              <p style="color:#14b8a6;font-size:12px;font-weight:600;margin:0 0 10px;text-transform:uppercase;">Featured Article</p>
              <h3 style="color:#ffffff;font-size:20px;margin:0 0 12px;line-height:1.3;">5 Ways to Double Your Website Conversions in 2024</h3>
              <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin:0 0 15px;">
                Discover the proven strategies that top businesses use to convert more visitors into customers.
              </p>
              <a href="#" style="color:#14b8a6;font-weight:600;text-decoration:none;font-size:14px;">Read More →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Two Column Articles -->
    <tr>
      <td style="padding:0 30px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="vertical-align:top;">
              <table width="100%" style="background:#262626;border-radius:8px;overflow:hidden;">
                <tr>
                  <td>
                    <img src="${PLACEHOLDER_IMAGES.technology}" alt="Tech" style="width:100%;height:100px;object-fit:cover;display:block;"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px;">
                    <h4 style="color:#ffffff;font-size:14px;margin:0 0 8px;">AI in Web Design</h4>
                    <p style="color:#666666;font-size:12px;line-height:1.5;margin:0;">How AI is changing the way we build websites.</p>
                  </td>
                </tr>
              </table>
            </td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align:top;">
              <table width="100%" style="background:#262626;border-radius:8px;overflow:hidden;">
                <tr>
                  <td>
                    <img src="${PLACEHOLDER_IMAGES.team}" alt="Team" style="width:100%;height:100px;object-fit:cover;display:block;"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px;">
                    <h4 style="color:#ffffff;font-size:14px;margin:0 0 8px;">Remote Team Tips</h4>
                    <p style="color:#666666;font-size:12px;line-height:1.5;margin:0;">Best practices for distributed teams.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding:0 30px 30px;text-align:center;">
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
          View All Articles
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#0f0f0f;padding:25px 30px;border-top:1px solid #262626;">
        <p style="color:#666666;font-size:12px;margin:0;text-align:center;">
          You're receiving this because you subscribed to BamLead updates.<br/>
          <a href="#" style="color:#14b8a6;">Unsubscribe</a> | <a href="#" style="color:#14b8a6;">Preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    description: 'Beautiful newsletter with multiple articles',
    tags: ['visual', 'newsletter', 'articles', 'digest'],
    previewImage: PLACEHOLDER_IMAGES.growth,
  },
  {
    id: 'visual-promo',
    name: 'Special Offer Promo',
    category: 'marketing',
    subject: '🎉 Exclusive Offer for {{business_name}} - 30% Off!',
    body_html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <!-- Confetti Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 30px;text-align:center;">
        <p style="font-size:40px;margin:0 0 10px;">🎉</p>
        <h1 style="color:white;font-size:32px;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;">Special Offer</h1>
        <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;">Exclusively for {{business_name}}</p>
      </td>
    </tr>
    <!-- Discount Badge -->
    <tr>
      <td style="padding:30px;text-align:center;">
        <table style="margin:0 auto;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);border-radius:50%;width:150px;height:150px;">
          <tr>
            <td style="text-align:center;vertical-align:middle;">
              <p style="color:white;font-size:48px;font-weight:bold;margin:0;">30%</p>
              <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:5px 0 0;text-transform:uppercase;">Off</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 15px;text-align:center;">Your Website Upgrade Awaits!</h2>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 25px;text-align:center;">
          Hi {{first_name}}, we're offering an exclusive 30% discount on our premium website design package. This offer expires in 48 hours!
        </p>
        <!-- What's Included -->
        <table width="100%" style="background:#262626;border-radius:12px;margin:0 0 25px;">
          <tr>
            <td style="padding:25px;">
              <p style="color:#f59e0b;font-size:14px;font-weight:600;margin:0 0 15px;text-transform:uppercase;">What's Included</p>
              <table width="100%">
                <tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✨ Custom responsive design</td></tr>
                <tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✨ SEO optimization</td></tr>
                <tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✨ 1 year free hosting</td></tr>
                <tr><td style="padding:8px 0;color:#ffffff;font-size:15px;">✨ Priority support</td></tr>
              </table>
            </td>
          </tr>
        </table>
        <!-- CTA -->
        <table width="100%">
          <tr>
            <td style="text-align:center;">
              <a href="#" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;padding:18px 40px;border-radius:8px;font-weight:bold;font-size:18px;text-transform:uppercase;letter-spacing:1px;">
                Claim Your 30% Off
              </a>
              <p style="color:#666666;font-size:13px;margin:15px 0 0;">⏰ Offer expires in 48 hours</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#0f0f0f;padding:20px 30px;border-top:1px solid #262626;">
        <p style="color:#666666;font-size:12px;margin:0;text-align:center;">
          Questions? Reply to this email or contact support@bamlead.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    description: 'Eye-catching promotional offer email',
    tags: ['visual', 'promo', 'discount', 'offer'],
    previewImage: PLACEHOLDER_IMAGES.celebration,
  },
  {
    id: 'visual-testimonial',
    name: 'Testimonial Feature',
    category: 'sales',
    subject: '⭐ See How Companies Like {{business_name}} Succeeded',
    body_html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <!-- Header -->
    <tr>
      <td style="padding:25px 30px;border-bottom:1px solid #262626;">
        <span style="color:#14b8a6;font-size:22px;font-weight:bold;">BamLead</span>
      </td>
    </tr>
    <!-- Testimonial Card -->
    <tr>
      <td style="padding:30px;">
        <table width="100%" style="background:#262626;border-radius:12px;overflow:hidden;">
          <tr>
            <td>
              <img src="${PLACEHOLDER_IMAGES.business}" alt="Success Story" style="width:100%;height:200px;object-fit:cover;display:block;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <p style="color:#f59e0b;font-size:30px;margin:0 0 20px;">⭐⭐⭐⭐⭐</p>
              <p style="color:#ffffff;font-size:18px;font-style:italic;line-height:1.6;margin:0 0 20px;">
                "Working with BamLead transformed our online presence. We saw a 150% increase in leads within the first month!"
              </p>
              <table>
                <tr>
                  <td style="width:50px;">
                    <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);text-align:center;line-height:50px;color:white;font-weight:bold;font-size:20px;">J</div>
                  </td>
                  <td style="padding-left:15px;">
                    <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0;">John Smith</p>
                    <p style="color:#666666;font-size:13px;margin:5px 0 0;">CEO, TechStart Inc.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:22px;margin:0 0 15px;">Hi {{first_name}},</h2>
        <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Companies like {{business_name}} are seeing incredible results with our website solutions. Want to be our next success story?
        </p>
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Get Started Today →
        </a>
        <p style="color:#666666;font-size:14px;margin:25px 0 0;">Best,<br/><span style="color:#ffffff;">{{sender_name}}</span></p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    description: 'Social proof with customer testimonial',
    tags: ['visual', 'testimonial', 'social-proof', 'review'],
    previewImage: PLACEHOLDER_IMAGES.business,
  },
];

export default VISUAL_EMAIL_TEMPLATES;
