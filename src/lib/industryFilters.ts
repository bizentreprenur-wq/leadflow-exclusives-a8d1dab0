// Industry and role filters for general-purpose lead generation

export interface IndustryFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
}

export interface RoleFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface CompanyTypeFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ROLE_FILTERS: RoleFilter[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Faster deal cycles',
    icon: 'TrendingUp',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Smarter campaigns',
    icon: 'Megaphone',
  },
  {
    id: 'revops',
    name: 'RevOps',
    description: 'Cleaner funnels',
    icon: 'Settings',
  },
  {
    id: 'founders',
    name: 'Founders',
    description: 'Scale with ease',
    icon: 'Rocket',
  },
  {
    id: 'recruiting',
    name: 'Recruiting',
    description: 'Find top talent',
    icon: 'Users',
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    description: 'Reduce churn',
    icon: 'Heart',
  },
];

export const INDUSTRY_FILTERS: IndustryFilter[] = [
  {
    id: 'technology',
    name: 'Technology Services',
    description: 'Built for SaaS teams',
    icon: 'Code',
    keywords: ['saas', 'software', 'tech', 'cloud', 'ai', 'startup'],
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Compliant outreach',
    icon: 'DollarSign',
    keywords: ['finance', 'banking', 'insurance', 'fintech', 'investment'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'HIPAA-ready',
    icon: 'Heart',
    keywords: ['health', 'medical', 'hospital', 'clinic', 'pharma'],
  },
  {
    id: 'retail',
    name: 'Retail & Goods',
    description: 'For B2C & wholesale',
    icon: 'ShoppingBag',
    keywords: ['retail', 'ecommerce', 'store', 'shop', 'consumer'],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Industrial leads',
    icon: 'Factory',
    keywords: ['manufacturing', 'industrial', 'production', 'factory'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property professionals',
    icon: 'Building',
    keywords: ['real estate', 'property', 'realty', 'mortgage', 'housing'],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Consultants & agencies',
    icon: 'Briefcase',
    keywords: ['consulting', 'agency', 'law', 'accounting', 'legal'],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'EdTech & institutions',
    icon: 'GraduationCap',
    keywords: ['education', 'school', 'university', 'training', 'edtech'],
  },
];

export const COMPANY_TYPE_FILTERS: CompanyTypeFilter[] = [
  {
    id: 'startup',
    name: 'Startup',
    description: 'Accelerate sales growth',
    icon: 'Rocket',
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    description: 'Driving sales success',
    icon: 'Building2',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Master complex operation',
    icon: 'Castle',
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Multi-client management',
    icon: 'Users',
  },
];

export const getFilterKeywords = (filterId: string): string[] => {
  const industry = INDUSTRY_FILTERS.find(f => f.id === filterId);
  return industry?.keywords || [];
};

export const getAllIndustryKeywords = (): string[] => {
  return INDUSTRY_FILTERS.flatMap(f => f.keywords);
};
