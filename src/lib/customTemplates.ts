// Custom Templates - User-created templates saved to localStorage
import { EmailTemplate } from './highConvertingTemplates';

const CUSTOM_TEMPLATES_KEY = 'bamlead_custom_templates';
const TEMPLATE_FOLDERS_KEY = 'bamlead_template_folders';
const CRM_LEADS_KEY = 'bamlead_crm_leads';
const PENDING_EMAILS_KEY = 'bamlead_pending_emails';

// Default folders for organization
export const DEFAULT_FOLDERS = [
  { id: 'cold-outreach', name: 'Cold Outreach', icon: '🎯', color: 'blue' },
  { id: 'follow-ups', name: 'Follow-ups', icon: '🔄', color: 'amber' },
  { id: 'seasonal', name: 'Seasonal', icon: '🎄', color: 'green' },
  { id: 'promotional', name: 'Promotional', icon: '🔥', color: 'red' },
  { id: 'nurture', name: 'Nurture', icon: '💝', color: 'pink' },
] as const;

export interface TemplateFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface CustomTemplate extends EmailTemplate {
  isCustom: true;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

export interface CRMLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'new' | 'queued' | 'sent' | 'replied' | 'converted';
  templateId?: string;
  templateSubject?: string;
  scheduledAt?: string;
  sentAt?: string;
  addedAt: string;
}

export interface PendingEmail {
  id: string;
  leadId: string;
  leadName: string;
  email: string;
  templateId: string;
  templateName: string;
  subject: string;
  body: string;
  status: 'pending' | 'scheduled' | 'sent' | 'failed';
  scheduledAt?: string;
  createdAt: string;
}

// Get all custom templates from localStorage
export const getCustomTemplates = (): CustomTemplate[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load custom templates:', e);
    return [];
  }
};

// Save a new custom template
export const saveCustomTemplate = (template: Omit<CustomTemplate, 'isCustom' | 'createdAt' | 'updatedAt'>): CustomTemplate => {
  const templates = getCustomTemplates();
  
  const newTemplate: CustomTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  templates.unshift(newTemplate);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  
  return newTemplate;
};

// Update an existing custom template
export const updateCustomTemplate = (id: string, updates: Partial<CustomTemplate>): CustomTemplate | null => {
  const templates = getCustomTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  return templates[index];
};

// Delete a custom template
export const deleteCustomTemplate = (id: string): boolean => {
  const templates = getCustomTemplates();
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length === templates.length) return false;
  
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
  return true;
};

// Check if a template is custom
export const isCustomTemplate = (id: string): boolean => {
  return id.startsWith('custom-');
};

// ============ FOLDER MANAGEMENT ============

// Get all template folders
export const getTemplateFolders = (): TemplateFolder[] => {
  try {
    const saved = localStorage.getItem(TEMPLATE_FOLDERS_KEY);
    const userFolders = saved ? JSON.parse(saved) : [];
    return [
      ...DEFAULT_FOLDERS.map(f => ({ ...f, isDefault: true })),
      ...userFolders
    ];
  } catch (e) {
    console.error('Failed to load template folders:', e);
    return DEFAULT_FOLDERS.map(f => ({ ...f, isDefault: true }));
  }
};

// Create a new folder
export const createTemplateFolder = (name: string, icon: string = '📁', color: string = 'slate'): TemplateFolder => {
  try {
    const saved = localStorage.getItem(TEMPLATE_FOLDERS_KEY);
    const folders: TemplateFolder[] = saved ? JSON.parse(saved) : [];
    const newFolder: TemplateFolder = {
      id: `folder-${Date.now()}`,
      name,
      icon,
      color,
    };
    folders.push(newFolder);
    localStorage.setItem(TEMPLATE_FOLDERS_KEY, JSON.stringify(folders));
    return newFolder;
  } catch (e) {
    console.error('Failed to create folder:', e);
    throw e;
  }
};

// Move template to folder
export const moveTemplateToFolder = (templateId: string, folderId: string | null): CustomTemplate | null => {
  const templates = getCustomTemplates();
  const index = templates.findIndex(t => t.id === templateId);
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    folderId: folderId || undefined,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  return templates[index];
};

// Get templates by folder
export const getTemplatesByFolder = (folderId: string | null): CustomTemplate[] => {
  const templates = getCustomTemplates();
  if (folderId === null) {
    return templates.filter(t => !t.folderId);
  }
  return templates.filter(t => t.folderId === folderId);
};

// ============ CRM LEAD PERSISTENCE ============

// Get all CRM leads
export const getCRMLeads = (): CRMLead[] => {
  try {
    const saved = localStorage.getItem(CRM_LEADS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load CRM leads:', e);
    return [];
  }
};

// Add leads to CRM (for email queue)
export const addLeadsToCRM = (leads: Array<{ id: string; name: string; email?: string; phone?: string; website?: string; address?: string }>): CRMLead[] => {
  const existing = getCRMLeads();
  const existingIds = new Set(existing.map(l => l.id));
  
  const newLeads: CRMLead[] = leads
    .filter(l => !existingIds.has(l.id))
    .map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      website: l.website,
      address: l.address,
      status: 'new' as const,
      addedAt: new Date().toISOString(),
    }));
  
  const updated = [...newLeads, ...existing];
  localStorage.setItem(CRM_LEADS_KEY, JSON.stringify(updated));
  return updated;
};

// Update CRM lead status
export const updateCRMLeadStatus = (leadId: string, status: CRMLead['status'], templateInfo?: { templateId: string; templateSubject: string }): CRMLead | null => {
  const leads = getCRMLeads();
  const index = leads.findIndex(l => l.id === leadId);
  if (index === -1) return null;
  
  leads[index] = {
    ...leads[index],
    status,
    ...(templateInfo && {
      templateId: templateInfo.templateId,
      templateSubject: templateInfo.templateSubject,
    }),
    ...(status === 'sent' && { sentAt: new Date().toISOString() }),
  };
  
  localStorage.setItem(CRM_LEADS_KEY, JSON.stringify(leads));
  return leads[index];
};

// Queue leads for email sending
export const queueLeadsForEmail = (leadIds: string[], templateId: string, templateSubject: string): CRMLead[] => {
  const leads = getCRMLeads();
  const updated = leads.map(l => {
    if (leadIds.includes(l.id)) {
      return {
        ...l,
        status: 'queued' as const,
        templateId,
        templateSubject,
      };
    }
    return l;
  });
  
  localStorage.setItem(CRM_LEADS_KEY, JSON.stringify(updated));
  return updated;
};

// Get leads ready for sending
export const getQueuedLeads = (): CRMLead[] => {
  return getCRMLeads().filter(l => l.status === 'queued');
};

// ============ PENDING EMAILS ============

// Get pending emails
export const getPendingEmails = (): PendingEmail[] => {
  try {
    const saved = localStorage.getItem(PENDING_EMAILS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load pending emails:', e);
    return [];
  }
};

// Save pending email
export const savePendingEmail = (email: Omit<PendingEmail, 'id' | 'createdAt'>): PendingEmail => {
  const emails = getPendingEmails();
  const newEmail: PendingEmail = {
    ...email,
    id: `email-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  emails.unshift(newEmail);
  localStorage.setItem(PENDING_EMAILS_KEY, JSON.stringify(emails));
  return newEmail;
};

// Update pending email status
export const updatePendingEmailStatus = (emailId: string, status: PendingEmail['status']): PendingEmail | null => {
  const emails = getPendingEmails();
  const index = emails.findIndex(e => e.id === emailId);
  if (index === -1) return null;
  
  emails[index] = { ...emails[index], status };
  localStorage.setItem(PENDING_EMAILS_KEY, JSON.stringify(emails));
  return emails[index];
};

// Clear sent emails from pending
export const clearSentEmails = (): void => {
  const emails = getPendingEmails().filter(e => e.status !== 'sent');
  localStorage.setItem(PENDING_EMAILS_KEY, JSON.stringify(emails));
};
