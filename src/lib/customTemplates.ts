// Custom Templates - User-created templates saved to localStorage
import { EmailTemplate } from './highConvertingTemplates';

const CUSTOM_TEMPLATES_KEY = 'bamlead_custom_templates';

export interface CustomTemplate extends EmailTemplate {
  isCustom: true;
  createdAt: string;
  updatedAt: string;
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
