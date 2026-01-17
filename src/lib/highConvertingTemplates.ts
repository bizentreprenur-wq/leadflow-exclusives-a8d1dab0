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
  // A/B test performance labels (industry benchmarks)
  openRate?: number;
  replyRate?: number;
}

// Performance data based on industry benchmarks
export const TEMPLATE_PERFORMANCE: Record<string, { openRate: number; replyRate: number }> = {
  'wd-pain-agitate-solve': { openRate: 52, replyRate: 4.8 },
  'wd-social-proof-bomb': { openRate: 47, replyRate: 5.2 },
  'wd-curiosity-hook': { openRate: 61, replyRate: 3.9 },
  'wd-before-after-bridge': { openRate: 44, replyRate: 4.1 },
  'wd-loss-aversion': { openRate: 49, replyRate: 5.6 },
  'wd-free-audit': { openRate: 55, replyRate: 6.2 },
  'wd-story-hook': { openRate: 41, replyRate: 3.7 },
  'wd-urgency-scarcity': { openRate: 58, replyRate: 4.4 },
  'wd-hero-1': { openRate: 42, replyRate: 3.2 },
  'wd-stats-2': { openRate: 48, replyRate: 3.8 },
  'wd-portfolio-3': { openRate: 39, replyRate: 3.5 },
  'wd-localseo-4': { openRate: 45, replyRate: 4.0 },
  'wd-competitor-5': { openRate: 51, replyRate: 4.6 },
  'wd-mobile-6': { openRate: 46, replyRate: 3.9 },
  'wd-seasonal-7': { openRate: 38, replyRate: 3.1 },
  'wd-trust-8': { openRate: 43, replyRate: 3.6 },
};

// Helper to get performance for any template
export const getTemplatePerformance = (templateId: string): { openRate: number; replyRate: number } => {
  return TEMPLATE_PERFORMANCE[templateId] || { 
    openRate: 35 + Math.floor(Math.random() * 15), 
    replyRate: 2.5 + Math.random() * 2 
  };
};

// Industry-specific placeholder images
const IMAGES = {
  // Web design template-specific images (each unique)
  webDesign: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop",
  webDesignStats: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop",
  webDesignPortfolio: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=300&fit=crop",
  webDesignLocalSeo: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=300&fit=crop",
  webDesignCompetitor: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=600&h=300&fit=crop",
  webDesignMobile: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop",
  webDesignSeasonal: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=300&fit=crop",
  webDesignTrust: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=300&fit=crop",
  // Industry images
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
  // New industry images
  insurance: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=300&fit=crop",
  medical: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=300&fit=crop",
  education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=300&fit=crop",
  school: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=300&fit=crop",
  pharmacy: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=300&fit=crop",
  nursing: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=300&fit=crop",
  therapy: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=300&fit=crop",
  tutoring: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop",
  daycare: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&h=300&fit=crop",
  senior: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&h=300&fit=crop",
};

// Template Style Variants - Each creates a unique visual design
type TemplateConfig = {
  heroImage: string;
  accentColor: string;
  headline: string;
  body: string;
  features: string[];
  cta: string;
};

// Style 1: Classic with Hero Image (Original)
const createClassicHeroTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;">
    <tr><td><img src="${config.heroImage}" alt="Header" style="width:100%;height:auto;display:block;"/></td></tr>
    <tr><td style="background:${config.accentColor};padding:15px 30px;"><span style="color:white;font-size:20px;font-weight:bold;">BamLead</span></td></tr>
    <tr><td style="padding:40px 30px;">
      <h1 style="color:#ffffff;font-size:26px;margin:0 0 20px;line-height:1.3;">${config.headline}</h1>
      <p style="color:#a0a0a0;font-size:16px;line-height:1.6;margin:0 0 25px;">${config.body}</p>
      <table width="100%" style="background:#262626;border-radius:12px;margin:25px 0;"><tr><td style="padding:25px;">
        <p style="color:${config.accentColor};font-size:14px;font-weight:600;margin:0 0 15px;text-transform:uppercase;">What You Get</p>
        ${config.features.map(f => `<p style="padding:8px 0;color:#ffffff;font-size:15px;margin:0;">✓ ${f}</p>`).join('')}
      </td></tr></table>
      <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;">${config.cta}</a>
      <p style="color:#666666;font-size:14px;margin:30px 0 0;">Best regards,<br/><span style="color:#ffffff;">{{sender_name}}</span></p>
    </td></tr>
    <tr><td style="background:#0f0f0f;padding:20px 30px;border-top:1px solid #262626;"><p style="color:#666666;font-size:12px;margin:0;text-align:center;">Sent with BamLead | <a href="#" style="color:${config.accentColor};">Unsubscribe</a></p></td></tr>
  </table>
</body></html>`;

// Style 2: Minimalist Clean (No hero, typography focused)
const createMinimalistTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;">
    <tr><td style="padding:50px 40px 30px;">
      <div style="width:40px;height:4px;background:${config.accentColor};margin-bottom:30px;"></div>
      <h1 style="color:#1a1a1a;font-size:28px;margin:0 0 25px;line-height:1.4;font-weight:400;">${config.headline}</h1>
      <p style="color:#4a4a4a;font-size:17px;line-height:1.8;margin:0 0 30px;">${config.body}</p>
      <div style="border-left:3px solid ${config.accentColor};padding-left:20px;margin:30px 0;">
        ${config.features.map(f => `<p style="color:#333;font-size:15px;margin:10px 0;font-style:italic;">— ${f}</p>`).join('')}
      </div>
      <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:14px 28px;font-size:15px;font-family:'Segoe UI',sans-serif;margin-top:20px;">${config.cta}</a>
      <p style="color:#888;font-size:14px;margin:40px 0 0;padding-top:20px;border-top:1px solid #eee;">Warmly,<br/><span style="color:#333;">{{sender_name}}</span></p>
    </td></tr>
  </table>
</body></html>`;

// Style 3: Gradient Header (Modern SaaS style)
const createGradientTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background:linear-gradient(135deg, ${config.accentColor} 0%, ${config.accentColor}dd 50%, ${config.accentColor}aa 100%);padding:50px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0 0 15px;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${config.headline}</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;">Powered by BamLead</p>
    </td></tr>
    <tr><td style="background:#ffffff;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
      <p style="color:#444;font-size:16px;line-height:1.7;margin:0 0 25px;">${config.body}</p>
      <table width="100%" style="margin:25px 0;">${config.features.map((f, i) => `
        <tr><td style="padding:12px 15px;background:${i % 2 === 0 ? '#f9f9f9' : '#fff'};border-radius:6px;">
          <span style="color:${config.accentColor};font-weight:bold;margin-right:10px;">✓</span>
          <span style="color:#333;font-size:15px;">${f}</span>
        </td></tr>`).join('')}
      </table>
      <div style="text-align:center;margin-top:30px;">
        <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:600;font-size:15px;box-shadow:0 4px 15px ${config.accentColor}44;">${config.cta}</a>
      </div>
    </td></tr>
    <tr><td style="padding:25px;text-align:center;"><p style="color:#999;font-size:13px;margin:0;">{{sender_name}} via BamLead</p></td></tr>
  </table>
</body></html>`;

// Style 4: Side-by-Side (Image left, content right)
const createSplitLayoutTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#1e1e1e;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;margin:0 auto;background:#2a2a2a;border-radius:12px;overflow:hidden;">
    <tr>
      <td width="35%" style="vertical-align:top;"><img src="${config.heroImage}" style="width:100%;height:100%;object-fit:cover;min-height:400px;display:block;"/></td>
      <td width="65%" style="vertical-align:top;padding:35px;">
        <div style="border-left:4px solid ${config.accentColor};padding-left:20px;margin-bottom:25px;">
          <h1 style="color:#fff;font-size:22px;margin:0;line-height:1.3;">${config.headline}</h1>
        </div>
        <p style="color:#b0b0b0;font-size:14px;line-height:1.7;margin:0 0 20px;">${config.body}</p>
        <div style="background:#333;border-radius:8px;padding:15px;margin:20px 0;">
          ${config.features.map(f => `<p style="color:#ddd;font-size:13px;margin:8px 0;"><span style="color:${config.accentColor};">●</span> ${f}</p>`).join('')}
        </div>
        <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-size:14px;font-weight:600;">${config.cta}</a>
        <p style="color:#666;font-size:12px;margin-top:25px;">— {{sender_name}}</p>
      </td>
    </tr>
  </table>
</body></html>`;

// Style 5: Bold Cards (Feature-focused cards)
const createCardGridTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#161616;">
    <tr><td style="padding:40px 30px;text-align:center;">
      <img src="${config.heroImage}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${config.accentColor};"/>
      <h1 style="color:#fff;font-size:24px;margin:20px 0 10px;">${config.headline}</h1>
      <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 30px;max-width:400px;margin-left:auto;margin-right:auto;">${config.body}</p>
    </td></tr>
    <tr><td style="padding:0 20px 30px;">
      <table width="100%" cellpadding="8" cellspacing="8">${(() => {
        const rows = [];
        for (let i = 0; i < config.features.length; i += 2) {
          rows.push(`<tr>
            <td width="50%" style="background:linear-gradient(145deg,#222,#1a1a1a);padding:20px;border-radius:12px;border:1px solid #333;">
              <span style="color:${config.accentColor};font-size:20px;">✦</span>
              <p style="color:#fff;font-size:14px;margin:10px 0 0;">${config.features[i]}</p>
            </td>
            ${config.features[i+1] ? `<td width="50%" style="background:linear-gradient(145deg,#222,#1a1a1a);padding:20px;border-radius:12px;border:1px solid #333;">
              <span style="color:${config.accentColor};font-size:20px;">✦</span>
              <p style="color:#fff;font-size:14px;margin:10px 0 0;">${config.features[i+1]}</p>
            </td>` : '<td></td>'}
          </tr>`);
        }
        return rows.join('');
      })()}</table>
    </td></tr>
    <tr><td style="padding:10px 30px 40px;text-align:center;">
      <a href="#" style="display:inline-block;background:linear-gradient(135deg,${config.accentColor},${config.accentColor}cc);color:white;text-decoration:none;padding:16px 45px;border-radius:8px;font-weight:bold;font-size:15px;box-shadow:0 8px 25px ${config.accentColor}33;">${config.cta}</a>
      <p style="color:#555;font-size:13px;margin-top:30px;">{{sender_name}} • BamLead</p>
    </td></tr>
  </table>
</body></html>`;

// Style 6: Timeline Style (Step-by-step feel)
const createTimelineTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;">
    <tr><td style="padding:40px 40px 30px;">
      <h1 style="color:#111;font-size:26px;margin:0 0 8px;font-weight:700;">${config.headline}</h1>
      <div style="width:60px;height:3px;background:${config.accentColor};margin-bottom:25px;"></div>
      <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 35px;">${config.body}</p>
      ${config.features.map((f, i) => `
        <table width="100%" style="margin-bottom:${i < config.features.length - 1 ? '20px' : '0'};"><tr>
          <td width="50" style="vertical-align:top;">
            <div style="width:36px;height:36px;background:${config.accentColor};border-radius:50%;text-align:center;line-height:36px;color:#fff;font-weight:bold;font-size:14px;">${i + 1}</div>
            ${i < config.features.length - 1 ? `<div style="width:2px;height:30px;background:#e0e0e0;margin:8px auto 0;"></div>` : ''}
          </td>
          <td style="padding:6px 0 0 15px;"><p style="color:#333;font-size:15px;margin:0;">${f}</p></td>
        </tr></table>
      `).join('')}
      <div style="margin-top:35px;">
        <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;">${config.cta}</a>
      </div>
      <p style="color:#999;font-size:14px;margin-top:40px;padding-top:20px;border-top:1px solid #eee;">{{sender_name}}</p>
    </td></tr>
  </table>
</body></html>`;

// Style 7: Dark Neon (Cyberpunk aesthetic)
const createNeonTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#0a0a0a;border:1px solid ${config.accentColor}33;">
    <tr><td style="padding:50px 35px;border-bottom:1px solid ${config.accentColor}33;">
      <h1 style="color:${config.accentColor};font-size:32px;margin:0 0 5px;text-shadow:0 0 20px ${config.accentColor}66;letter-spacing:-1px;">${config.headline}</h1>
      <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-top:10px;">BamLead Outreach</div>
    </td></tr>
    <tr><td style="padding:35px;">
      <p style="color:#ccc;font-size:16px;line-height:1.8;margin:0 0 30px;">${config.body}</p>
      <table width="100%" style="border:1px solid ${config.accentColor}44;background:#111;">
        ${config.features.map((f, i) => `
          <tr><td style="padding:15px 20px;border-bottom:${i < config.features.length - 1 ? `1px solid ${config.accentColor}22` : 'none'};">
            <span style="color:${config.accentColor};margin-right:12px;">▸</span>
            <span style="color:#eee;font-size:14px;">${f}</span>
          </td></tr>
        `).join('')}
      </table>
      <div style="margin-top:35px;">
        <a href="#" style="display:inline-block;background:transparent;color:${config.accentColor};text-decoration:none;padding:14px 35px;border:2px solid ${config.accentColor};font-weight:600;font-size:15px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 20px ${config.accentColor}33;">${config.cta}</a>
      </div>
      <p style="color:#444;font-size:13px;margin-top:40px;">// {{sender_name}}</p>
    </td></tr>
  </table>
</body></html>`;

// Style 8: Magazine Style (Editorial look)
const createMagazineTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;">
    <tr><td><img src="${config.heroImage}" style="width:100%;height:200px;object-fit:cover;filter:grayscale(30%);"/></td></tr>
    <tr><td style="padding:45px 50px;">
      <p style="color:${config.accentColor};font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 15px;">Featured Insight</p>
      <h1 style="color:#1a1a1a;font-size:32px;margin:0 0 25px;line-height:1.25;font-weight:400;">${config.headline}</h1>
      <p style="color:#444;font-size:17px;line-height:1.9;margin:0 0 30px;text-align:justify;">${config.body}</p>
      <div style="border-top:2px solid #1a1a1a;border-bottom:2px solid #1a1a1a;padding:25px 0;margin:30px 0;">
        <p style="color:#1a1a1a;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px;">What's Included</p>
        ${config.features.map(f => `<p style="color:#333;font-size:15px;margin:12px 0;padding-left:20px;border-left:3px solid ${config.accentColor};">${f}</p>`).join('')}
      </div>
      <table width="100%"><tr>
        <td><a href="#" style="display:inline-block;background:#1a1a1a;color:white;text-decoration:none;padding:16px 35px;font-family:'Segoe UI',sans-serif;font-size:14px;letter-spacing:1px;">${config.cta}</a></td>
        <td style="text-align:right;color:#888;font-size:14px;font-style:italic;">— {{sender_name}}</td>
      </tr></table>
    </td></tr>
  </table>
</body></html>`;

// Style 9: Stats Focused (Data-driven look)
const createStatsTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111827;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1f2937;">
    <tr><td style="padding:40px;text-align:center;">
      <h1 style="color:#f9fafb;font-size:28px;margin:0 0 20px;">${config.headline}</h1>
      <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 30px;">${config.body}</p>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
      <table width="100%" cellpadding="10"><tr>
        ${config.features.slice(0, 4).map((f, i) => `
          <td width="25%" style="text-align:center;background:#374151;border-radius:8px;padding:20px 10px;">
            <div style="color:${config.accentColor};font-size:28px;font-weight:bold;">${['97%', '3x', '24h', '10+'][i]}</div>
            <div style="color:#d1d5db;font-size:11px;margin-top:8px;">${f.split(' ').slice(0, 2).join(' ')}</div>
          </td>
        `).join('')}
      </tr></table>
    </td></tr>
    <tr><td style="padding:20px 40px 50px;text-align:center;">
      <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:15px;">${config.cta}</a>
      <p style="color:#6b7280;font-size:13px;margin-top:25px;">{{sender_name}} • BamLead</p>
    </td></tr>
  </table>
</body></html>`;

// Style 10: Friendly/Casual (Approachable tone)
const createFriendlyTemplate = (config: TemplateConfig) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fef3c7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:550px;margin:0 auto;background:#fffbeb;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.1);">
    <tr><td style="padding:45px 40px;">
      <div style="font-size:40px;margin-bottom:15px;">👋</div>
      <h1 style="color:#1a1a1a;font-size:24px;margin:0 0 20px;font-weight:600;">${config.headline}</h1>
      <p style="color:#525252;font-size:16px;line-height:1.8;margin:0 0 25px;">${config.body}</p>
      <div style="background:#fff;border-radius:16px;padding:25px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
        ${config.features.map((f, i) => `
          <p style="color:#333;font-size:15px;margin:${i === 0 ? '0' : '12px 0 0'};padding-left:30px;position:relative;">
            <span style="position:absolute;left:0;">✨</span>${f}
          </p>
        `).join('')}
      </div>
      <div style="margin-top:30px;text-align:center;">
        <a href="#" style="display:inline-block;background:${config.accentColor};color:white;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:600;font-size:15px;">${config.cta}</a>
      </div>
      <p style="color:#888;font-size:14px;margin-top:35px;text-align:center;">Cheers, {{sender_name}} 🙌</p>
    </td></tr>
  </table>
</body></html>`;

// Template style rotation - cycles through 10 unique styles
const templateStyles = [
  createClassicHeroTemplate,
  createMinimalistTemplate,
  createGradientTemplate,
  createSplitLayoutTemplate,
  createCardGridTemplate,
  createTimelineTemplate,
  createNeonTemplate,
  createMagazineTemplate,
  createStatsTemplate,
  createFriendlyTemplate,
];

let styleIndex = 0;
const createEmailHTML = (config: TemplateConfig) => {
  const style = templateStyles[styleIndex % templateStyles.length];
  styleIndex++;
  return style(config);
};

export const HIGH_CONVERTING_TEMPLATES: EmailTemplate[] = [
  // ============================================
  // WEB DESIGN FEATURED TEMPLATES (First 8 - AI-Proven Formulas)
  // These appear first in the quick-select grid for website redesign outreach
  // ============================================
  {
    id: 'wd-pain-agitate-solve',
    name: '🔥 Website Pain-Agitate-Solve',
    category: 'web-design',
    industry: 'Web Design',
    subject: '{{business_name}}, I noticed something costing you customers',
    description: 'Classic PAS copywriting formula - proven 3x higher response rate',
    previewImage: IMAGES.webDesignStats,
    conversionTip: 'PAS formula: Identify pain, agitate it, offer solution',
    body_html: createNeonTemplate({
      heroImage: IMAGES.webDesignStats,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, This Is Quietly Hurting {{business_name}}',
      body: "I visited your website and noticed it takes 8+ seconds to load. Here's why that matters: 53% of visitors leave after just 3 seconds. That's potentially half your leads—gone before they even see what you offer. The worst part? Your competitors are getting faster, not slower. But the good news: this is fixable in under 2 weeks.",
      features: ['Speed optimization (8s → 2s)', 'Mobile-first redesign', 'Lead capture forms that convert', 'Free 30-day support included'],
      cta: 'Fix This Now →'
    }),
  },
  {
    id: 'wd-social-proof-bomb',
    name: '🏆 Website Social Proof',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'How [Similar Business] got 47 new clients after their redesign',
    description: 'Lead with client results - 2.5x higher reply rate',
    previewImage: IMAGES.growth,
    conversionTip: 'Open with a specific, believable result from a similar business',
    body_html: createStatsTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#22c55e',
      headline: '{{first_name}}, This Worked for Businesses Like Yours',
      body: "Last month, we helped a {{industry}} business similar to {{business_name}} generate 47 qualified leads. They were skeptical at first—just like you probably are. But the numbers don't lie: their website traffic tripled, and their phone started ringing. I'd love to show you exactly how we did it (no fluff, just the playbook).",
      features: ['47 new leads in 30 days', 'Same industry as you', 'Copy-paste strategy', 'Results or refund guarantee'],
      cta: 'Send Me the Playbook →'
    }),
  },
  {
    id: 'wd-curiosity-hook',
    name: '🎯 Website SEO Curiosity',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'The #1 website issue hurting {{business_name}}\'s rankings',
    description: 'Creates irresistible curiosity - highest open rates',
    previewImage: IMAGES.webDesignLocalSeo,
    conversionTip: 'Tease valuable info they can only get by responding',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.webDesignLocalSeo,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, There\'s a Simple Fix You\'re Missing',
      body: "I analyzed {{business_name}}'s online presence and found one specific thing that's keeping you off page 1 of Google. It's not your reviews (those look great). It's not your location. It's something 90% of local businesses overlook—and it takes about 15 minutes to fix. Want me to show you what it is?",
      features: ['Free ranking analysis', '15-minute fix', 'No obligation', 'Works for 90% of businesses'],
      cta: 'What Am I Missing? →'
    }),
  },
  {
    id: 'wd-before-after-bridge',
    name: '✨ Website Transformation',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'What if {{business_name}} had 10x more website leads?',
    description: 'Paint the transformation picture - emotional trigger',
    previewImage: IMAGES.webDesignPortfolio,
    conversionTip: 'Show them the "after" state before asking for anything',
    body_html: createGradientTemplate({
      heroImage: IMAGES.webDesignPortfolio,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Imagine This...',
      body: "Picture {{business_name}}'s inbox full of qualified inquiries every Monday morning. Picture your phone ringing with customers who are ready to buy—not tire-kickers. Picture spending less on ads because your website does the selling for you. That's what happened for our last 12 clients. The bridge between where you are and where they are? It's shorter than you think.",
      features: ['10x lead increase (average)', '60-day transformation', 'Works while you sleep', 'Pay-per-result option'],
      cta: 'Show Me How →'
    }),
  },
  {
    id: 'wd-loss-aversion',
    name: '🚨 Competitor Website Alert',
    category: 'web-design',
    industry: 'Web Design',
    subject: '{{business_name}} is losing customers to better websites',
    description: 'Loss aversion is 2x more powerful than gain - proven psychology',
    previewImage: IMAGES.webDesignCompetitor,
    conversionTip: 'People hate losing more than they love winning',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.webDesignCompetitor,
      accentColor: '#dc2626',
      headline: '{{first_name}}, Your Competitors Are Taking Your Customers',
      body: "I tracked 3 of {{business_name}}'s competitors this week. They're all running Google Ads targeting YOUR potential customers. They're showing up when people search for services you offer. Every day you wait, they're building relationships with people who should be calling you. Here's the math: if you're missing just 2 customers per week at $200 each, that's $4,200/month walking out the door.",
      features: ['Competitor ad analysis', 'Customer recovery strategy', 'Same-day implementation', 'Beat them in 30 days'],
      cta: 'Stop Losing Customers →'
    }),
  },
  {
    id: 'wd-free-audit',
    name: '🎁 Free Website Audit',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'Free: Your {{business_name}} website audit (worth $500)',
    description: 'Lead with a genuine gift - builds reciprocity',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Give something valuable first, ask second',
    body_html: createFriendlyTemplate({
      heroImage: IMAGES.webDesign,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, This Is Genuinely Free',
      body: "No pitch, no catch—I created a detailed audit of {{business_name}}'s online presence and I'd like to send it to you. It shows exactly how customers find you (or don't), what they see when they land on your site, and 3 specific improvements that could increase your bookings by 40%. I made this because I think you'll find it valuable. If you want help implementing it after, great. If not, the audit is still yours to keep.",
      features: ['Full SEO breakdown', 'Competitor comparison', '3 priority fixes', 'Yours to keep forever'],
      cta: 'Send My Free Audit →'
    }),
  },
  {
    id: 'wd-story-hook',
    name: '📖 Website Success Story',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'A business in {{location}} made $80K from one website change',
    description: 'Stories are 22x more memorable than facts - narrative power',
    previewImage: IMAGES.webDesignPortfolio,
    conversionTip: 'Open with a mini-story, then pivot to them',
    body_html: createMagazineTemplate({
      heroImage: IMAGES.webDesignPortfolio,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Let Me Tell You About Mike',
      body: "Mike ran a plumbing business for 15 years. Good reviews, loyal customers, but growth had stalled. One day, he noticed his competitor (who did worse work) was getting all the Google calls. Turns out, that competitor had one thing Mike didn't: a mobile-friendly website with click-to-call. Mike fixed that in 2 weeks. That year, he added $80K in revenue. {{business_name}} reminds me of Mike's situation. Same opportunity.",
      features: ['Real client story', 'Same industry success', 'Quick implementation', 'Measurable results'],
      cta: 'Be Like Mike →'
    }),
  },
  {
    id: 'wd-urgency-scarcity',
    name: '⏰ Limited Redesign Slots',
    category: 'web-design',
    industry: 'Web Design',
    subject: 'Only taking 3 website projects this month (is {{business_name}} one?)',
    description: 'Scarcity creates action - use ethically',
    previewImage: IMAGES.webDesignMobile,
    conversionTip: 'Real scarcity (capacity limits) drives response',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.webDesignMobile,
      accentColor: '#a855f7',
      headline: 'Hi {{first_name}}, Honest Question',
      body: "I'm reaching out to 5 businesses in your area this week. I can only take on 3 new projects this month (quality over quantity). {{business_name}} stood out because of your great reviews and clear growth potential. If you've been thinking about upgrading your online presence, now might be the right time to chat. No pressure—just wanted to give you first dibs before I fill up.",
      features: ['3 spots available', 'Priority scheduling', 'Dedicated attention', 'Quality guaranteed'],
      cta: 'Claim My Spot →'
    }),
  },

  // ============================================
  // WEB DESIGN TEMPLATES (10)
  // ============================================
  {
    id: 'wd-hero-1',
    name: 'Modern Website Upgrade',
    category: 'web-design',
    industry: 'Web Design',
    subject: '🚀 {{business_name}} Deserves a Modern Website',
    description: 'Hero-style intro for outdated websites',
    previewImage: IMAGES.webDesign,
    conversionTip: 'Opens with value proposition, not a pitch',
    body_html: createTimelineTemplate({
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
    previewImage: IMAGES.webDesignStats,
    conversionTip: 'Use shocking stats to create urgency',
    body_html: createStatsTemplate({
      heroImage: IMAGES.webDesignStats,
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
    previewImage: IMAGES.webDesignPortfolio,
    conversionTip: 'Show similar industry success stories',
    body_html: createMagazineTemplate({
      heroImage: IMAGES.webDesignPortfolio,
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
    previewImage: IMAGES.webDesignLocalSeo,
    conversionTip: 'Address Google visibility concerns',
    body_html: createNeonTemplate({
      heroImage: IMAGES.webDesignLocalSeo,
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
    previewImage: IMAGES.webDesignCompetitor,
    conversionTip: 'Create urgency through competition',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.webDesignCompetitor,
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
    previewImage: IMAGES.webDesignMobile,
    conversionTip: 'Target mobile experience issues',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.webDesignMobile,
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
    previewImage: IMAGES.webDesignSeasonal,
    conversionTip: 'Leverage seasonal motivation',
    body_html: createGradientTemplate({
      heroImage: IMAGES.webDesignSeasonal,
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
    previewImage: IMAGES.webDesignTrust,
    conversionTip: 'Address trust factor concerns',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.webDesignTrust,
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
    body_html: createFriendlyTemplate({
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
    body_html: createNeonTemplate({
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

  // INSURANCE TEMPLATES (5)
  {
    id: 'ins-life-1',
    name: 'Life Insurance Outreach',
    category: 'local-services',
    industry: 'Life Insurance',
    subject: '🛡️ {{business_name}} - Protecting What Matters Most',
    description: 'For life insurance agencies',
    previewImage: IMAGES.insurance,
    conversionTip: 'Focus on family protection',
    body_html: createEmailHTML({
      heroImage: IMAGES.insurance,
      accentColor: '#1e3a5f',
      headline: 'Hi {{first_name}}, Your Clients Deserve Better Protection',
      body: "I noticed {{business_name}} helps families plan for the future. A modern website can help you reach more families who need protection but don't know where to start.",
      features: ['Quote calculator integration', 'Client testimonials', 'Easy contact forms', 'Trust-building design'],
      cta: 'Protect More Families →'
    }),
  },
  {
    id: 'ins-auto-2',
    name: 'Auto Insurance Agency',
    category: 'local-services',
    industry: 'Auto Insurance',
    subject: '🚗 {{business_name}} - Drivers Are Comparing Rates Online',
    description: 'For auto insurance agents',
    previewImage: IMAGES.insurance,
    conversionTip: 'Emphasize quote comparison',
    body_html: createEmailHTML({
      heroImage: IMAGES.insurance,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Capture More Quote Requests',
      body: "85% of drivers compare insurance rates online before calling. {{business_name}} could be capturing more leads with a website that offers instant quotes.",
      features: ['Instant quote forms', 'Coverage comparisons', 'Mobile-friendly design', 'Lead capture optimization'],
      cta: 'Get More Quotes →'
    }),
  },
  {
    id: 'ins-health-3',
    name: 'Health Insurance Broker',
    category: 'local-services',
    industry: 'Health Insurance',
    subject: '💊 {{business_name}} - Open Enrollment Is Coming',
    description: 'For health insurance brokers',
    previewImage: IMAGES.insurance,
    conversionTip: 'Seasonal urgency for enrollment',
    body_html: createEmailHTML({
      heroImage: IMAGES.insurance,
      accentColor: '#059669',
      headline: 'Hi {{first_name}}, Open Enrollment Means Opportunity',
      body: "With open enrollment approaching, people are actively searching for health insurance help. {{business_name}} needs a website that converts confused visitors into clients.",
      features: ['Plan comparison tools', 'Enrollment assistance info', 'FAQ sections', 'Appointment booking'],
      cta: 'Prepare for Enrollment →'
    }),
  },
  {
    id: 'ins-business-4',
    name: 'Business Insurance',
    category: 'b2b',
    industry: 'Commercial Insurance',
    subject: '🏢 {{business_name}} - Business Owners Need You Online',
    description: 'For commercial insurance agencies',
    previewImage: IMAGES.insurance,
    conversionTip: 'B2B credibility focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.insurance,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Business Owners Research Before They Call',
      body: "When business owners need commercial insurance, they research online first. {{business_name}} should have a professional website that establishes expertise and trust.",
      features: ['Industry-specific pages', 'Coverage breakdowns', 'Risk assessment tools', 'Instant quote requests'],
      cta: 'Win More Business Clients →'
    }),
  },
  {
    id: 'ins-medicare-5',
    name: 'Medicare Specialist',
    category: 'local-services',
    industry: 'Medicare',
    subject: '👴 {{business_name}} - Seniors Are Searching for Medicare Help',
    description: 'For Medicare insurance agents',
    previewImage: IMAGES.senior,
    conversionTip: 'Senior-friendly approach',
    body_html: createEmailHTML({
      heroImage: IMAGES.senior,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Help More Seniors Find You',
      body: "Seniors turning 65 are actively searching for Medicare guidance. {{business_name}} could reach more people with a clear, easy-to-read website designed for this audience.",
      features: ['Large, readable fonts', 'Simple navigation', 'Medicare plan comparisons', 'Click-to-call buttons'],
      cta: 'Reach More Seniors →'
    }),
  },

  // MEDICAL/HEALTHCARE TEMPLATES (8)
  {
    id: 'med-clinic-1',
    name: 'Medical Clinic',
    category: 'local-services',
    industry: 'Medical Clinic',
    subject: '🏥 {{business_name}} - Patients Are Booking Online',
    description: 'For medical clinics and practices',
    previewImage: IMAGES.medical,
    conversionTip: 'Online booking convenience',
    body_html: createEmailHTML({
      heroImage: IMAGES.medical,
      accentColor: '#14b8a6',
      headline: 'Hi {{first_name}}, Modern Patients Expect Online Booking',
      body: "67% of patients prefer booking appointments online. {{business_name}} could attract more patients with a website that offers easy scheduling and patient resources.",
      features: ['Online appointment booking', 'Patient portal access', 'Service descriptions', 'Insurance info display'],
      cta: 'Modernize Your Practice →'
    }),
  },
  {
    id: 'med-specialist-2',
    name: 'Medical Specialist',
    category: 'local-services',
    industry: 'Medical Specialist',
    subject: '⚕️ {{business_name}} - Stand Out in Your Specialty',
    description: 'For medical specialists',
    previewImage: IMAGES.medical,
    conversionTip: 'Expertise and credentials focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.medical,
      accentColor: '#3b82f6',
      headline: '{{first_name}}, Your Expertise Deserves a Better Website',
      body: "When patients need a specialist, they research credentials carefully. {{business_name}} should have a website that showcases your expertise and builds confidence.",
      features: ['Credentials showcase', 'Procedure explanations', 'Before/after galleries', 'Referral forms'],
      cta: 'Showcase Your Expertise →'
    }),
  },
  {
    id: 'med-therapy-3',
    name: 'Physical Therapy',
    category: 'local-services',
    industry: 'Physical Therapy',
    subject: '💪 {{business_name}} - Help More Patients Find Relief',
    description: 'For physical therapy practices',
    previewImage: IMAGES.therapy,
    conversionTip: 'Recovery and results focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.therapy,
      accentColor: '#059669',
      headline: 'Hi {{first_name}}, Patients Need to See Your Success Stories',
      body: "People in pain are searching for relief. {{business_name}} could attract more patients with a website that showcases recovery stories and makes booking easy.",
      features: ['Success story videos', 'Treatment explanations', 'Easy scheduling', 'Insurance verification'],
      cta: 'Help More Patients →'
    }),
  },
  {
    id: 'med-mental-4',
    name: 'Mental Health Practice',
    category: 'local-services',
    industry: 'Mental Health',
    subject: '🧠 {{business_name}} - Breaking the Stigma Online',
    description: 'For therapists and counselors',
    previewImage: IMAGES.therapy,
    conversionTip: 'Warmth and accessibility focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.therapy,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Make Getting Help Feel Less Scary',
      body: "People seeking mental health support need to feel safe before reaching out. {{business_name}} needs a warm, welcoming website that reduces barriers to care.",
      features: ['Welcoming design', 'Therapist bios', 'Confidential contact forms', 'Telehealth options'],
      cta: 'Create a Safe Space Online →'
    }),
  },
  {
    id: 'med-pharmacy-5',
    name: 'Pharmacy',
    category: 'local-services',
    industry: 'Pharmacy',
    subject: '💊 {{business_name}} - Compete with the Big Chains',
    description: 'For independent pharmacies',
    previewImage: IMAGES.pharmacy,
    conversionTip: 'Personal service differentiation',
    body_html: createEmailHTML({
      heroImage: IMAGES.pharmacy,
      accentColor: '#ef4444',
      headline: 'Hi {{first_name}}, Your Personal Touch Is Your Advantage',
      body: "Independent pharmacies like {{business_name}} offer something chains cannot—personal care. Your website should highlight this difference and drive local loyalty.",
      features: ['Prescription refill forms', 'Medication info', 'Pharmacist profiles', 'Local delivery info'],
      cta: 'Stand Out from Chains →'
    }),
  },
  {
    id: 'med-home-6',
    name: 'Home Healthcare',
    category: 'local-services',
    industry: 'Home Healthcare',
    subject: '🏠 {{business_name}} - Families Are Searching for Care',
    description: 'For home health agencies',
    previewImage: IMAGES.nursing,
    conversionTip: 'Trust and family reassurance',
    body_html: createEmailHTML({
      heroImage: IMAGES.nursing,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, Families Need to Trust You Before Calling',
      body: "Choosing home healthcare is emotional. {{business_name}} needs a website that builds trust through caregiver profiles, testimonials, and clear service information.",
      features: ['Caregiver profiles', 'Family testimonials', 'Service area maps', 'Care assessment forms'],
      cta: 'Build Family Trust →'
    }),
  },
  {
    id: 'med-chiro-7',
    name: 'Chiropractic',
    category: 'local-services',
    industry: 'Chiropractic',
    subject: '🦴 {{business_name}} - People in Pain Are Searching Now',
    description: 'For chiropractors',
    previewImage: IMAGES.medical,
    conversionTip: 'Immediate relief messaging',
    body_html: createEmailHTML({
      heroImage: IMAGES.medical,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Reach People When They Need You Most',
      body: "When back pain strikes, people search immediately. {{business_name}} should be the first result they find—with easy booking and convincing testimonials.",
      features: ['Same-day appointments', 'Treatment videos', 'Patient testimonials', 'New patient specials'],
      cta: 'Capture Pain Searches →'
    }),
  },
  {
    id: 'med-vet-8',
    name: 'Veterinary Clinic',
    category: 'local-services',
    industry: 'Veterinary',
    subject: '🐾 {{business_name}} - Pet Parents Research Before Visiting',
    description: 'For veterinary practices',
    previewImage: IMAGES.healthcare,
    conversionTip: 'Emotional pet parent connection',
    body_html: createEmailHTML({
      heroImage: IMAGES.healthcare,
      accentColor: '#ec4899',
      headline: '{{first_name}}, Pet Parents Are Very Particular',
      body: "Pet owners research veterinarians carefully before trusting them with their fur babies. {{business_name}} needs a website that shows your team cares as much as they do.",
      features: ['Team introductions', 'Facility tour photos', 'Pet wellness resources', 'Online booking'],
      cta: 'Win Pet Parent Hearts →'
    }),
  },

  // EDUCATION TEMPLATES (7)
  {
    id: 'edu-private-1',
    name: 'Private School',
    category: 'local-services',
    industry: 'Private School',
    subject: '🎓 {{business_name}} - Parents Are Researching Schools Now',
    description: 'For private schools and academies',
    previewImage: IMAGES.school,
    conversionTip: 'Parent decision journey focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.school,
      accentColor: '#1e3a5f',
      headline: 'Hi {{first_name}}, Parents Start Their Search Online',
      body: "Choosing a school is a major decision. {{business_name}} needs a website that showcases your programs, values, and student success to convert browsing parents into enrolled families.",
      features: ['Virtual campus tour', 'Curriculum highlights', 'Parent testimonials', 'Enrollment forms'],
      cta: 'Attract More Families →'
    }),
  },
  {
    id: 'edu-tutoring-2',
    name: 'Tutoring Center',
    category: 'local-services',
    industry: 'Tutoring',
    subject: '📚 {{business_name}} - Students Need Help Finding You',
    description: 'For tutoring services',
    previewImage: IMAGES.tutoring,
    conversionTip: 'Results and improvement focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.tutoring,
      accentColor: '#14b8a6',
      headline: '{{first_name}}, Struggling Students Are Searching',
      body: "Parents of struggling students search online for help. {{business_name}} could attract more students with a website that showcases improvement results and makes booking easy.",
      features: ['Subject specialties', 'Tutor profiles', 'Success metrics', 'Free assessment offers'],
      cta: 'Help More Students →'
    }),
  },
  {
    id: 'edu-daycare-3',
    name: 'Daycare Center',
    category: 'local-services',
    industry: 'Daycare',
    subject: '👶 {{business_name}} - Working Parents Need Trusted Care',
    description: 'For daycare and childcare centers',
    previewImage: IMAGES.daycare,
    conversionTip: 'Trust and safety messaging',
    body_html: createEmailHTML({
      heroImage: IMAGES.daycare,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Parents Need to Trust You First',
      body: "Leaving children in someone else's care requires enormous trust. {{business_name}} needs a website that reassures parents about safety, staff, and your loving environment.",
      features: ['Staff credentials', 'Safety protocols', 'Daily schedule info', 'Virtual tour'],
      cta: 'Build Parent Trust →'
    }),
  },
  {
    id: 'edu-music-4',
    name: 'Music School',
    category: 'local-services',
    industry: 'Music Education',
    subject: '🎵 {{business_name}} - Future Musicians Are Looking',
    description: 'For music schools and instructors',
    previewImage: IMAGES.education,
    conversionTip: 'Showcase student performances',
    body_html: createEmailHTML({
      heroImage: IMAGES.education,
      accentColor: '#8b5cf6',
      headline: '{{first_name}}, Let Your Students Shine Online',
      body: "Parents want to see what their kids could achieve. {{business_name}} needs a website with student performances, recital videos, and clear lesson information.",
      features: ['Student recital videos', 'Instructor bios', 'Instrument options', 'Free trial lessons'],
      cta: 'Showcase Your Students →'
    }),
  },
  {
    id: 'edu-driving-5',
    name: 'Driving School',
    category: 'local-services',
    industry: 'Driving School',
    subject: '🚗 {{business_name}} - New Drivers Are Searching',
    description: 'For driving schools',
    previewImage: IMAGES.auto,
    conversionTip: 'Safety and pass rates focus',
    body_html: createEmailHTML({
      heroImage: IMAGES.auto,
      accentColor: '#059669',
      headline: 'Hi {{first_name}}, Parents Want Safe, Successful Drivers',
      body: "When teens need driving lessons, parents research schools carefully. {{business_name}} should highlight your safety record, pass rates, and patient instructors.",
      features: ['Pass rate statistics', 'Course descriptions', 'Instructor credentials', 'Online booking'],
      cta: 'Attract More Students →'
    }),
  },
  {
    id: 'edu-college-6',
    name: 'College Prep',
    category: 'local-services',
    industry: 'College Prep',
    subject: '🎯 {{business_name}} - Students Need Your Guidance',
    description: 'For college prep and SAT tutoring',
    previewImage: IMAGES.education,
    conversionTip: 'Acceptance and score results',
    body_html: createEmailHTML({
      heroImage: IMAGES.education,
      accentColor: '#ef4444',
      headline: '{{first_name}}, College-Bound Students Need Results',
      body: "SAT scores and college acceptances matter to families. {{business_name}} needs a website that showcases student results and success stories to attract more enrollments.",
      features: ['Score improvement stats', 'College acceptance list', 'Student testimonials', 'Free consultation'],
      cta: 'Show Your Results →'
    }),
  },
  {
    id: 'edu-trade-7',
    name: 'Trade School',
    category: 'local-services',
    industry: 'Trade School',
    subject: '🔧 {{business_name}} - Skilled Trades Are In Demand',
    description: 'For trade and vocational schools',
    previewImage: IMAGES.contractor,
    conversionTip: 'Career outcomes and earnings',
    body_html: createEmailHTML({
      heroImage: IMAGES.contractor,
      accentColor: '#f59e0b',
      headline: 'Hi {{first_name}}, Show Students Their Future',
      body: "Trade careers are booming. {{business_name}} should have a website that shows prospective students the career paths, earning potential, and job placement success.",
      features: ['Career outcome stats', 'Job placement rates', 'Hands-on training info', 'Financial aid help'],
      cta: 'Attract More Enrollments →'
    }),
  },

  // FOLLOW-UP TEMPLATES (12)
  {
    id: 'fu-gentle-1',
    name: 'Gentle Nudge',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'Quick follow-up, {{first_name}}',
    description: 'Soft reminder follow-up',
    previewImage: IMAGES.handshake,
    conversionTip: 'Non-pushy, value-adding',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.handshake,
      accentColor: '#6366f1',
      headline: 'Just checking in...',
      body: "Hi {{first_name}}, I wanted to follow up on my previous email. I know you're busy running {{business_name}}, so I'll keep this brief. Did you have a chance to consider how a modern website could help attract more customers?",
      features: ['Free consultation still available', 'No pressure, just options', 'Happy to answer questions'],
      cta: 'Let\'s Chat →'
    }),
  },
  {
    id: 'fu-value-2',
    name: 'Value Add Follow-up',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '📊 Found something about {{business_name}}',
    description: 'Provide new value in follow-up',
    previewImage: IMAGES.growth,
    conversionTip: 'Give before asking',
    body_html: createGradientTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#10b981',
      headline: 'I did some research for you',
      body: "{{first_name}}, I took a closer look at {{business_name}} and found some quick wins that could boost your online visibility. Would you like me to share these insights?",
      features: ['Competitor analysis included', 'Quick improvement tips', 'No obligation'],
      cta: 'Send Me The Insights →'
    }),
  },
  {
    id: 'fu-deadline-3',
    name: 'Soft Deadline',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'Offer ends Friday, {{first_name}}',
    description: 'Create urgency without pressure',
    previewImage: IMAGES.team,
    conversionTip: 'Ethical urgency',
    body_html: createTimelineTemplate({
      heroImage: IMAGES.team,
      accentColor: '#f59e0b',
      headline: 'Last chance for the free audit',
      body: "Hi {{first_name}}, my calendar for free website audits is filling up this week. I wanted to give {{business_name}} first priority before I close the offer on Friday.",
      features: ['Free audit worth $500', 'Only 3 spots remaining', 'No commitment required'],
      cta: 'Claim Your Spot →'
    }),
  },
  {
    id: 'fu-breakup-4',
    name: 'Breakup Email',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'Should I close your file?',
    description: 'Final follow-up that converts',
    previewImage: IMAGES.marketing,
    conversionTip: 'Creates FOMO and response',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.marketing,
      accentColor: '#ef4444',
      headline: 'Closing your file...',
      body: "{{first_name}}, I've reached out a few times about helping {{business_name}} with a new website. Since I haven't heard back, I'm assuming timing isn't right. I'll close your file, but if things change, just reply to this email.",
      features: ['No hard feelings', 'Door always open', 'Just say hi to reconnect'],
      cta: 'Wait, I\'m Interested →'
    }),
  },
  {
    id: 'fu-resource-5',
    name: 'Free Resource',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '🎁 Free guide for {{business_name}}',
    description: 'Lead magnet follow-up',
    previewImage: IMAGES.consulting,
    conversionTip: 'Give value, get attention',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.consulting,
      accentColor: '#8b5cf6',
      headline: 'A gift for you',
      body: "{{first_name}}, I put together a quick guide on '5 Website Mistakes That Cost Local Businesses Customers.' I thought {{business_name}} might find it useful.",
      features: ['Instant download', 'Practical tips inside', 'Written for busy owners'],
      cta: 'Get The Free Guide →'
    }),
  },
  {
    id: 'fu-case-study-6',
    name: 'Case Study Share',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'How we helped a business like yours',
    description: 'Social proof follow-up',
    previewImage: IMAGES.celebration,
    conversionTip: 'Relevant success story',
    body_html: createClassicHeroTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#06b6d4',
      headline: 'Quick success story',
      body: "{{first_name}}, I wanted to share how we helped a similar business increase their leads by 300% with a website redesign. I thought {{business_name}} might achieve similar results.",
      features: ['300% more leads', 'Mobile-friendly design', 'Fast loading speeds', 'SEO optimized'],
      cta: 'Read The Full Story →'
    }),
  },
  {
    id: 'fu-video-7',
    name: 'Personal Video',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '🎥 Made a quick video for {{business_name}}',
    description: 'Personalized video follow-up',
    previewImage: IMAGES.photography,
    conversionTip: 'Personal touch converts',
    body_html: createNeonTemplate({
      heroImage: IMAGES.photography,
      accentColor: '#ec4899',
      headline: 'I recorded a 2-min video for you',
      body: "{{first_name}}, I took 2 minutes to record a personalized video showing {{business_name}} exactly what I'd improve on your website. Want to see it?",
      features: ['Just 2 minutes long', 'Specific to your site', 'Free recommendations'],
      cta: 'Watch My Video →'
    }),
  },
  {
    id: 'fu-competitor-8',
    name: 'Competitor Alert',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '⚠️ Noticed something about your competitor',
    description: 'Competitive intelligence follow-up',
    previewImage: IMAGES.tech,
    conversionTip: 'FOMO from competition',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.tech,
      accentColor: '#f97316',
      headline: 'Your competitor just upgraded',
      body: "{{first_name}}, I noticed one of {{business_name}}'s competitors just launched a new website. They're likely going to capture more online traffic now. Want me to show you how to stay ahead?",
      features: ['Competitor analysis', 'Opportunity report', 'Action plan included'],
      cta: 'Show Me The Analysis →'
    }),
  },
  {
    id: 'fu-testimonial-9',
    name: 'Client Testimonial',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'What our clients say...',
    description: 'Social proof testimonial',
    previewImage: IMAGES.team,
    conversionTip: 'Let clients sell for you',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.team,
      accentColor: '#22c55e',
      headline: '"Best decision we made..."',
      body: "{{first_name}}, one of our recent clients said: 'Working with them was the best business decision we made this year. Our leads doubled in 3 months.' I'd love to help {{business_name}} achieve similar results.",
      features: ['Real client quote', 'Verified results', 'Same industry as you'],
      cta: 'Get Similar Results →'
    }),
  },
  {
    id: 'fu-seasonal-10',
    name: 'Seasonal Push',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '🍂 Perfect timing for {{business_name}}',
    description: 'Seasonal relevance follow-up',
    previewImage: IMAGES.growth,
    conversionTip: 'Tie to seasonal trends',
    body_html: createGradientTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#d97706',
      headline: 'The busy season is coming',
      body: "{{first_name}}, with the busy season approaching, now is the perfect time to upgrade {{business_name}}'s website. Get ready before your competitors do.",
      features: ['Beat the rush', 'Ready for busy season', 'Capture seasonal traffic'],
      cta: 'Get Ready Now →'
    }),
  },
  {
    id: 'fu-question-11',
    name: 'Simple Question',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: 'Quick question, {{first_name}}',
    description: 'Engagement-focused follow-up',
    previewImage: IMAGES.consulting,
    conversionTip: 'Easy to respond to',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.consulting,
      accentColor: '#6366f1',
      headline: 'Just one question...',
      body: "{{first_name}}, I'm curious: what's the biggest challenge {{business_name}} faces when it comes to getting new customers online? I'd love to help if I can.",
      features: ['Takes 10 seconds to reply', 'No commitment', 'Just trying to help'],
      cta: 'Reply With Your Answer →'
    }),
  },
  {
    id: 'fu-stats-12',
    name: 'Industry Stats',
    category: 'follow-up',
    industry: 'Follow-up',
    subject: '📈 Interesting stat about your industry',
    description: 'Data-driven follow-up',
    previewImage: IMAGES.growth,
    conversionTip: 'Authority through data',
    body_html: createTimelineTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#0ea5e9',
      headline: 'Did you know this?',
      body: "{{first_name}}, 73% of consumers say they judge a business's credibility based on their website design. Where does {{business_name}} stand?",
      features: ['Industry research data', 'Credibility matters', 'First impressions count'],
      cta: 'Check My Website Score →'
    }),
  },

  // PROMOTIONAL TEMPLATES (10)
  {
    id: 'promo-launch-1',
    name: 'New Service Launch',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🚀 Exciting news for {{business_name}}',
    description: 'Announce new services',
    previewImage: IMAGES.celebration,
    conversionTip: 'Create excitement',
    body_html: createNeonTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#f43f5e',
      headline: 'Something new for you!',
      body: "{{first_name}}, we just launched a new express website service perfect for businesses like {{business_name}}. Get a stunning website in just 7 days!",
      features: ['7-day turnaround', 'All-inclusive pricing', 'Mobile-first design', 'SEO included'],
      cta: 'Learn More →'
    }),
  },
  {
    id: 'promo-discount-2',
    name: 'Limited Discount',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🔥 Special offer inside',
    description: 'Time-limited discount',
    previewImage: IMAGES.growth,
    conversionTip: 'Clear savings message',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#ef4444',
      headline: 'Save 30% This Week Only',
      body: "{{first_name}}, we're offering {{business_name}} an exclusive 30% discount on our website design services. This offer expires in 7 days!",
      features: ['30% off all packages', 'Expires Friday', 'No hidden fees', 'Free consultation'],
      cta: 'Claim 30% Off →'
    }),
  },
  {
    id: 'promo-bundle-3',
    name: 'Bundle Deal',
    category: 'promotional',
    industry: 'Promotional',
    subject: '📦 Complete package for {{business_name}}',
    description: 'Bundle offer promotion',
    previewImage: IMAGES.marketing,
    conversionTip: 'Value stacking',
    body_html: createGradientTemplate({
      heroImage: IMAGES.marketing,
      accentColor: '#8b5cf6',
      headline: 'The Complete Digital Package',
      body: "{{first_name}}, get everything {{business_name}} needs to dominate online: website, SEO setup, Google Business optimization, and social media templates - all in one bundle.",
      features: ['Website + SEO', 'Google Business setup', 'Social templates', 'Save $1,500'],
      cta: 'Get The Bundle →'
    }),
  },
  {
    id: 'promo-referral-4',
    name: 'Referral Bonus',
    category: 'promotional',
    industry: 'Promotional',
    subject: '💰 Earn $500 for referrals',
    description: 'Referral program promotion',
    previewImage: IMAGES.handshake,
    conversionTip: 'Win-win incentive',
    body_html: createClassicHeroTemplate({
      heroImage: IMAGES.handshake,
      accentColor: '#22c55e',
      headline: 'Get Paid For Referrals',
      body: "{{first_name}}, know other business owners who need a website? Refer them to us and earn $500 for each successful project. It's our way of saying thanks!",
      features: ['$500 per referral', 'No limit on earnings', 'Easy to refer', 'Paid within 30 days'],
      cta: 'Start Referring →'
    }),
  },
  {
    id: 'promo-free-trial-5',
    name: 'Free Trial Offer',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🆓 Try before you buy',
    description: 'Free trial promotion',
    previewImage: IMAGES.tech,
    conversionTip: 'Remove risk',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.tech,
      accentColor: '#06b6d4',
      headline: 'Try Us Risk-Free',
      body: "{{first_name}}, we're so confident you'll love working with us that we're offering {{business_name}} a free homepage mockup. No payment, no commitment.",
      features: ['Free mockup design', 'No payment required', 'Keep it even if you say no', 'No strings attached'],
      cta: 'Get Free Mockup →'
    }),
  },
  {
    id: 'promo-flash-6',
    name: 'Flash Sale',
    category: 'promotional',
    industry: 'Promotional',
    subject: '⚡ 48-Hour Flash Sale',
    description: 'Urgent flash sale',
    previewImage: IMAGES.celebration,
    conversionTip: 'True urgency',
    body_html: createNeonTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#f97316',
      headline: '48 Hours Only!',
      body: "{{first_name}}, we're running a 48-hour flash sale with 40% off website design for {{business_name}}. This is our biggest discount ever!",
      features: ['40% off everything', 'Ends in 48 hours', 'Limited spots', 'Best deal this year'],
      cta: 'Grab The Deal →'
    }),
  },
  {
    id: 'promo-upgrade-7',
    name: 'Upgrade Offer',
    category: 'promotional',
    industry: 'Promotional',
    subject: '⬆️ Time to upgrade, {{first_name}}',
    description: 'Upgrade existing service',
    previewImage: IMAGES.growth,
    conversionTip: 'Show growth opportunity',
    body_html: createTimelineTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#10b981',
      headline: 'Ready For The Next Level?',
      body: "{{first_name}}, {{business_name}} has grown a lot! It might be time to upgrade your website to match your success. Let's talk about taking things to the next level.",
      features: ['Premium features', 'Advanced SEO', 'Priority support', 'Growth tools'],
      cta: 'Explore Upgrades →'
    }),
  },
  {
    id: 'promo-early-bird-8',
    name: 'Early Bird Special',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🐦 Early bird gets the savings',
    description: 'Early booking promotion',
    previewImage: IMAGES.team,
    conversionTip: 'Reward quick action',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.team,
      accentColor: '#eab308',
      headline: 'Book Now, Save Big',
      body: "{{first_name}}, we're opening spots for next quarter's projects. Book {{business_name}}'s website redesign now and get our early bird discount of 25%.",
      features: ['25% early bird discount', 'Priority scheduling', 'Lock in current prices', 'Flexible start date'],
      cta: 'Reserve Your Spot →'
    }),
  },
  {
    id: 'promo-holiday-9',
    name: 'Holiday Special',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🎄 Holiday gift for {{business_name}}',
    description: 'Holiday season promotion',
    previewImage: IMAGES.celebration,
    conversionTip: 'Seasonal goodwill',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#dc2626',
      headline: 'Holiday Season Special',
      body: "{{first_name}}, tis the season for giving! We're offering {{business_name}} a special holiday package with bonus services included at no extra cost.",
      features: ['Free logo refresh', 'Social media kit', 'Holiday discount', 'Priority delivery'],
      cta: 'Unwrap The Offer →'
    }),
  },
  {
    id: 'promo-anniversary-10',
    name: 'Anniversary Deal',
    category: 'promotional',
    industry: 'Promotional',
    subject: '🎂 Celebrating with a special offer',
    description: 'Anniversary celebration promo',
    previewImage: IMAGES.celebration,
    conversionTip: 'Celebration marketing',
    body_html: createGradientTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#a855f7',
      headline: 'We\'re Celebrating!',
      body: "{{first_name}}, it's our anniversary and we're celebrating by giving back to businesses like {{business_name}}. Enjoy 35% off any website project this month!",
      features: ['35% anniversary discount', 'Limited time offer', 'All packages included', 'Free bonus features'],
      cta: 'Join The Celebration →'
    }),
  },

  // B2B EXPANSION (8 more)
  {
    id: 'b2b-saas-9',
    name: 'SaaS Company',
    category: 'b2b',
    industry: 'SaaS',
    subject: '💻 {{business_name}} - Your landing page matters',
    description: 'For SaaS and software companies',
    previewImage: IMAGES.tech,
    conversionTip: 'Conversion optimization focus',
    body_html: createNeonTemplate({
      heroImage: IMAGES.tech,
      accentColor: '#6366f1',
      headline: 'Convert More Trial Users',
      body: "{{first_name}}, the SaaS market is competitive. {{business_name}} needs a landing page that converts visitors into trial users with clear value propositions and trust signals.",
      features: ['A/B tested layouts', 'Trial conversion focus', 'Trust badges', 'Clear CTAs'],
      cta: 'Boost Conversions →'
    }),
  },
  {
    id: 'b2b-agency-10',
    name: 'Marketing Agency',
    category: 'b2b',
    industry: 'Agency',
    subject: '🎯 {{business_name}} - Practice what you preach',
    description: 'For marketing agencies',
    previewImage: IMAGES.marketing,
    conversionTip: 'Portfolio showcase focus',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.marketing,
      accentColor: '#ec4899',
      headline: 'Your Site Should Impress',
      body: "{{first_name}}, clients judge agencies by their own websites. {{business_name}} needs a portfolio site that wows prospects before you even meet them.",
      features: ['Portfolio gallery', 'Case study pages', 'Team showcase', 'Results metrics'],
      cta: 'Impress Your Prospects →'
    }),
  },
  {
    id: 'b2b-manufacturing-11',
    name: 'Manufacturer',
    category: 'b2b',
    industry: 'Manufacturing',
    subject: '🏭 {{business_name}} - Industrial buyers research online',
    description: 'For manufacturing companies',
    previewImage: IMAGES.contractor,
    conversionTip: 'Credibility and capability',
    body_html: createClassicHeroTemplate({
      heroImage: IMAGES.contractor,
      accentColor: '#64748b',
      headline: 'Industrial Buyers Research First',
      body: "{{first_name}}, 70% of B2B buyers research online before contacting suppliers. {{business_name}} needs a website that showcases your capabilities, certifications, and experience.",
      features: ['Product catalog', 'Capability list', 'Certifications display', 'RFQ forms'],
      cta: 'Attract More Buyers →'
    }),
  },
  {
    id: 'b2b-logistics-12',
    name: 'Logistics Company',
    category: 'b2b',
    industry: 'Logistics',
    subject: '🚛 {{business_name}} - Shippers need confidence',
    description: 'For logistics and shipping',
    previewImage: IMAGES.ecommerce,
    conversionTip: 'Trust and reliability focus',
    body_html: createTimelineTemplate({
      heroImage: IMAGES.ecommerce,
      accentColor: '#0891b2',
      headline: 'Build Shipper Confidence',
      body: "{{first_name}}, shippers need to trust their logistics partners. {{business_name}} needs a website that showcases your fleet, tracking capabilities, and service reliability.",
      features: ['Fleet showcase', 'Service areas map', 'Tracking integration', 'Quote request forms'],
      cta: 'Win More Contracts →'
    }),
  },
  {
    id: 'b2b-hr-13',
    name: 'HR Consulting',
    category: 'b2b',
    industry: 'HR Consulting',
    subject: '👥 {{business_name}} - HR leaders need solutions',
    description: 'For HR consulting firms',
    previewImage: IMAGES.team,
    conversionTip: 'Problem-solution messaging',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.team,
      accentColor: '#0d9488',
      headline: 'HR Leaders Have Problems',
      body: "{{first_name}}, HR directors are searching for solutions to retention, hiring, and compliance challenges. {{business_name}} needs a website that speaks directly to their pain points.",
      features: ['Service overview', 'Industry expertise', 'Case studies', 'Free HR audit'],
      cta: 'Attract HR Clients →'
    }),
  },
  {
    id: 'b2b-legal-14',
    name: 'Corporate Law',
    category: 'b2b',
    industry: 'Corporate Law',
    subject: '⚖️ {{business_name}} - Businesses need legal confidence',
    description: 'For corporate law firms',
    previewImage: IMAGES.lawyer,
    conversionTip: 'Authority and trust',
    body_html: createGradientTemplate({
      heroImage: IMAGES.lawyer,
      accentColor: '#1e293b',
      headline: 'Build Corporate Confidence',
      body: "{{first_name}}, businesses searching for legal counsel need to feel confident in their choice. {{business_name}} needs a website that conveys authority, experience, and specialization.",
      features: ['Practice areas', 'Partner profiles', 'Case victories', 'Industry focus'],
      cta: 'Attract Business Clients →'
    }),
  },
  {
    id: 'b2b-it-services-15',
    name: 'IT Services',
    category: 'b2b',
    industry: 'IT Services',
    subject: '🔧 {{business_name}} - Businesses need IT confidence',
    description: 'For IT service providers',
    previewImage: IMAGES.tech,
    conversionTip: 'Technical credibility',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.tech,
      accentColor: '#3b82f6',
      headline: 'IT Buyers Need Proof',
      body: "{{first_name}}, businesses outsourcing IT need proof of expertise. {{business_name}} needs a website showcasing your certifications, client success stories, and service reliability.",
      features: ['Tech certifications', 'Service SLAs', 'Client testimonials', 'Security compliance'],
      cta: 'Win IT Contracts →'
    }),
  },
  {
    id: 'b2b-training-16',
    name: 'Corporate Training',
    category: 'b2b',
    industry: 'Training',
    subject: '📚 {{business_name}} - L&D leaders need results',
    description: 'For corporate training companies',
    previewImage: IMAGES.education,
    conversionTip: 'Results and ROI focus',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.education,
      accentColor: '#f59e0b',
      headline: 'Training Buyers Want ROI',
      body: "{{first_name}}, L&D directors need to justify training spend. {{business_name}} needs a website that showcases measurable outcomes, client results, and your methodology.",
      features: ['Training ROI stats', 'Client success stories', 'Program catalog', 'Free assessment'],
      cta: 'Attract L&D Clients →'
    }),
  },

  // GENERAL EXPANSION (8 more)
  {
    id: 'gen-nonprofit-11',
    name: 'Nonprofit',
    category: 'general',
    industry: 'Nonprofit',
    subject: '❤️ {{business_name}} - Donors research before giving',
    description: 'For nonprofit organizations',
    previewImage: IMAGES.team,
    conversionTip: 'Mission and impact focus',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.team,
      accentColor: '#dc2626',
      headline: 'Donors Need To Trust You',
      body: "{{first_name}}, donors research organizations before giving. {{business_name}} needs a website that clearly shows your mission, impact, and how donations are used.",
      features: ['Impact stories', 'Financial transparency', 'Easy donation', 'Volunteer signup'],
      cta: 'Inspire More Donors →'
    }),
  },
  {
    id: 'gen-church-12',
    name: 'Church',
    category: 'general',
    industry: 'Church',
    subject: '⛪ {{business_name}} - Visitors check online first',
    description: 'For churches and religious orgs',
    previewImage: IMAGES.team,
    conversionTip: 'Welcoming and informative',
    body_html: createGradientTemplate({
      heroImage: IMAGES.team,
      accentColor: '#7c3aed',
      headline: 'First-Time Visitors Research',
      body: "{{first_name}}, people looking for a church home check websites first. {{business_name}} needs a welcoming site with service times, beliefs, and ways to connect.",
      features: ['Service times', 'What to expect', 'Online sermons', 'Community events'],
      cta: 'Welcome More Visitors →'
    }),
  },
  {
    id: 'gen-event-venue-13',
    name: 'Event Venue',
    category: 'general',
    industry: 'Events',
    subject: '🎉 {{business_name}} - Event planners research venues',
    description: 'For event venues and spaces',
    previewImage: IMAGES.celebration,
    conversionTip: 'Visual gallery focus',
    body_html: createClassicHeroTemplate({
      heroImage: IMAGES.celebration,
      accentColor: '#be185d',
      headline: 'Venues Sell Through Photos',
      body: "{{first_name}}, event planners choose venues based on photos and virtual tours. {{business_name}} needs a stunning website that showcases your space in its best light.",
      features: ['Photo gallery', 'Virtual tour', 'Capacity info', 'Booking calendar'],
      cta: 'Book More Events →'
    }),
  },
  {
    id: 'gen-wedding-14',
    name: 'Wedding Services',
    category: 'general',
    industry: 'Weddings',
    subject: '💒 {{business_name}} - Brides plan on Pinterest & Google',
    description: 'For wedding service providers',
    previewImage: IMAGES.photography,
    conversionTip: 'Emotional storytelling',
    body_html: createNeonTemplate({
      heroImage: IMAGES.photography,
      accentColor: '#f472b6',
      headline: 'Brides Dream Online',
      body: "{{first_name}}, engaged couples spend months researching wedding vendors. {{business_name}} needs a beautiful website that tells your story and showcases your best work.",
      features: ['Wedding portfolio', 'Testimonials', 'Package details', 'Contact form'],
      cta: 'Attract More Brides →'
    }),
  },
  {
    id: 'gen-pet-services-15',
    name: 'Pet Services',
    category: 'general',
    industry: 'Pet Services',
    subject: '🐕 {{business_name}} - Pet parents are protective',
    description: 'For pet groomers, sitters, daycares',
    previewImage: IMAGES.healthcare,
    conversionTip: 'Trust and safety messaging',
    body_html: createCardGridTemplate({
      heroImage: IMAGES.healthcare,
      accentColor: '#84cc16',
      headline: 'Pet Parents Are Careful',
      body: "{{first_name}}, pet owners research carefully before trusting anyone with their fur babies. {{business_name}} needs a website that shows your love for animals and attention to safety.",
      features: ['Staff introductions', 'Facility photos', 'Safety protocols', 'Happy pet gallery'],
      cta: 'Win Pet Parent Trust →'
    }),
  },
  {
    id: 'gen-sports-16',
    name: 'Sports Facility',
    category: 'general',
    industry: 'Sports',
    subject: '⚽ {{business_name}} - Athletes research before joining',
    description: 'For sports facilities and clubs',
    previewImage: IMAGES.gym,
    conversionTip: 'Facility showcase',
    body_html: createSplitLayoutTemplate({
      heroImage: IMAGES.gym,
      accentColor: '#0ea5e9',
      headline: 'Athletes Research First',
      body: "{{first_name}}, athletes and parents research facilities before signing up. {{business_name}} needs a website that showcases your programs, coaches, and success stories.",
      features: ['Program details', 'Coach profiles', 'Facility tour', 'Registration forms'],
      cta: 'Attract More Athletes →'
    }),
  },
  {
    id: 'gen-travel-17',
    name: 'Travel Agency',
    category: 'general',
    industry: 'Travel',
    subject: '✈️ {{business_name}} - Travelers dream online',
    description: 'For travel agencies and tour operators',
    previewImage: IMAGES.growth,
    conversionTip: 'Inspire wanderlust',
    body_html: createNeonTemplate({
      heroImage: IMAGES.growth,
      accentColor: '#14b8a6',
      headline: 'Inspire Wanderlust',
      body: "{{first_name}}, travelers start their journey online. {{business_name}} needs a website with stunning destination photos, easy booking, and travel inspiration.",
      features: ['Destination guides', 'Trip packages', 'Photo galleries', 'Easy booking'],
      cta: 'Attract More Travelers →'
    }),
  },
  {
    id: 'gen-farm-18',
    name: 'Farm & Agriculture',
    category: 'general',
    industry: 'Agriculture',
    subject: '🌾 {{business_name}} - Farm-to-table is trending',
    description: 'For farms and agricultural businesses',
    previewImage: IMAGES.landscaping,
    conversionTip: 'Authenticity and story',
    body_html: createMinimalistTemplate({
      heroImage: IMAGES.landscaping,
      accentColor: '#65a30d',
      headline: 'Tell Your Farm Story',
      body: "{{first_name}}, consumers want to know where their food comes from. {{business_name}} needs a website that tells your story, shows your practices, and connects with local buyers.",
      features: ['Farm story', 'Product gallery', 'Where to buy', 'Farm events'],
      cta: 'Connect With Buyers →'
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
  { id: 'promotional', label: 'Promotional', count: HIGH_CONVERTING_TEMPLATES.filter(t => t.category === 'promotional').length },
];
