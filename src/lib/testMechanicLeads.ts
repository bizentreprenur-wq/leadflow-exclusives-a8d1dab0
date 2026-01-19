/**
 * Test Data Generator: 200 Mechanic Leads
 * For testing the full workflow from Step 2 → Step 3 → Step 4
 */

export interface TestLead {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  rating: number;
  source: 'gmb' | 'platform';
  platform?: string;
  websiteAnalysis: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime: number | null;
  };
}

const firstNames = [
  'Mike', 'Joe', 'Tony', 'Carlos', 'Dave', 'Steve', 'Frank', 'Bob', 'Jim', 'Tom',
  'Ray', 'Eddie', 'Luis', 'Marco', 'Pete', 'Gary', 'Rick', 'Bill', 'Dan', 'Sam',
  'Alex', 'Chris', 'Matt', 'Jake', 'Ben', 'Nick', 'Paul', 'John', 'Kevin', 'Mark',
];

const shopNames = [
  'Auto Repair', 'Automotive', 'Car Care', 'Auto Service', 'Garage', 'Motor Works',
  'Auto Shop', 'Car Clinic', 'Auto Center', 'Mechanic Shop', 'Auto Lab', 'Car Doctor',
  'Tire & Auto', 'Brake Masters', 'Transmission Pro', 'Engine Experts', 'Quick Lube',
  'Auto Pros', 'Service Center', 'Car Fix', 'Wrench Works', 'Auto Tech', 'Motor Care',
];

const prefixes = [
  'Best', 'Elite', 'Premier', 'Top', 'Pro', 'Expert', 'Quality', 'Reliable', 'Trusted',
  'Certified', 'Advanced', 'Supreme', 'Master', 'Prime', 'First', 'Royal', 'Grand',
  'Ultra', 'Alpha', 'Precision', 'Fast', 'Honest', 'Affordable', 'Family', 'Local',
];

const cities = [
  'Los Angeles', 'Houston', 'Phoenix', 'San Antonio', 'Dallas', 'Austin', 'San Diego',
  'Denver', 'Seattle', 'Portland', 'Miami', 'Atlanta', 'Chicago', 'Detroit', 'Boston',
  'Philadelphia', 'Las Vegas', 'Tampa', 'Orlando', 'Charlotte', 'Nashville', 'Memphis',
];

const streetNames = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Blvd', 'Elm St', 'Park Ave',
  'Lake Dr', 'Hill Rd', 'River Way', 'Industrial Blvd', 'Commerce Dr', 'Auto Row',
  'Highway 99', 'Route 66', 'State St', 'Broadway', 'Center St', 'Market St', 'First Ave',
];

const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Weebly', 'Joomla', 'Custom PHP', 'Shopify', null];

const issueOptions = [
  'Not mobile responsive',
  'Missing meta description',
  'Outdated jQuery version',
  'Large page size (slow loading)',
  'Outdated HTML structure',
  'No SSL certificate',
  'Missing alt tags on images',
  'Slow server response',
  'Broken links detected',
  'Missing favicon',
  'No social media integration',
  'Poor Core Web Vitals',
  'No online booking system',
  'Outdated contact form',
  'Missing service pages',
];

const areaCodes = ['213', '310', '323', '714', '818', '626', '562', '909', '951', '949', '619', '858', '702', '480', '602'];

function generatePhone(index: number): string {
  const areaCode = areaCodes[index % areaCodes.length];
  const prefix = String(Math.floor(Math.random() * 900) + 100);
  const line = String(Math.floor(Math.random() * 9000) + 1000);
  return `(${areaCode}) ${prefix}-${line}`;
}

function generateEmail(businessName: string, index: number): string {
  const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
  const domain = domains[index % domains.length];
  return `${cleanName}${index}@${domain}`;
}

function generateWebsite(businessName: string): string {
  const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  return `https://www.${cleanName}.com`;
}

function generateBusinessName(index: number): string {
  const usePersonName = index % 3 === 0;
  
  if (usePersonName) {
    const firstName = firstNames[index % firstNames.length];
    const shopName = shopNames[Math.floor(index / firstNames.length) % shopNames.length];
    return `${firstName}'s ${shopName}`;
  }
  
  const prefix = prefixes[index % prefixes.length];
  const shopName = shopNames[Math.floor(index / prefixes.length) % shopNames.length];
  const city = cities[Math.floor(index / (prefixes.length * 2)) % cities.length];
  
  return index % 2 === 0 ? `${prefix} ${shopName}` : `${city} ${prefix} ${shopName}`;
}

function generateAddress(index: number): string {
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = streetNames[index % streetNames.length];
  const city = cities[index % cities.length];
  const zip = String(90000 + (index * 7) % 10000);
  return `${streetNum} ${street}, ${city}, CA ${zip}`;
}

export function generateMechanicLeads(count: number = 200): TestLead[] {
  const leads: TestLead[] = [];
  
  for (let i = 0; i < count; i++) {
    const name = generateBusinessName(i);
    const hasWebsite = Math.random() > 0.15; // 85% have websites
    const platform = hasWebsite ? platforms[Math.floor(Math.random() * platforms.length)] : null;
    const issueCount = Math.floor(Math.random() * 5) + 1;
    const issues = hasWebsite 
      ? [...issueOptions].sort(() => Math.random() - 0.5).slice(0, issueCount)
      : ['No website found'];
    
    leads.push({
      id: `mechanic-test-${i}-${Date.now()}`,
      name,
      address: generateAddress(i),
      phone: generatePhone(i),
      website: hasWebsite ? generateWebsite(name) : '',
      email: generateEmail(name, i),
      rating: Math.floor(Math.random() * 20 + 30) / 10, // 3.0 - 5.0
      source: i % 4 === 0 ? 'platform' : 'gmb',
      platform: platform || undefined,
      websiteAnalysis: {
        hasWebsite,
        platform,
        needsUpgrade: issues.length >= 2,
        issues,
        mobileScore: hasWebsite ? Math.floor(Math.random() * 50) + 40 : null,
        loadTime: hasWebsite ? Math.floor(Math.random() * 4000) + 500 : null,
      },
    });
  }
  
  return leads;
}

/**
 * Inject test leads into sessionStorage for dashboard consumption
 */
export function injectTestLeads(count: number = 200): void {
  const leads = generateMechanicLeads(count);
  
  // Store in sessionStorage for Dashboard to pick up
  sessionStorage.setItem('bamlead_search_results', JSON.stringify(leads));
  sessionStorage.setItem('bamlead_query', 'auto mechanic');
  sessionStorage.setItem('bamlead_location', 'Los Angeles');
  sessionStorage.setItem('bamlead_search_type', 'gmb');
  sessionStorage.setItem('bamlead_current_step', '2'); // Go to Step 2
  
  // Also prepare email leads format for Step 3/4
  const emailLeads = leads.map(l => ({
    email: l.email,
    business_name: l.name,
    contact_name: '',
    website: l.website,
    phone: l.phone,
  }));
  sessionStorage.setItem('bamlead_email_leads', JSON.stringify(emailLeads));
  
  console.log(`✅ Injected ${count} mechanic test leads into session`);
}
