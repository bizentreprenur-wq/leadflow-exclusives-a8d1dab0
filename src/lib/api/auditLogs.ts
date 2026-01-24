/**
 * Audit Logs API Client
 * Frontend functions for accessing audit logs (admin only)
 */

import { API_BASE_URL, apiRequest, ADMIN_ENDPOINTS } from './config';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_email?: string;
  user_name?: string;
  action: string;
  category: 'auth' | 'search' | 'leads' | 'email' | 'crm' | 'calendar' | 'settings' | 'admin' | 'payment' | 'export' | 'system';
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string;
  user_agent: string | null;
  request_method: string | null;
  request_path: string | null;
  request_data: Record<string, any> | null;
  response_status: number | null;
  metadata: Record<string, any> | null;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AuditLogFilters {
  user_id?: number;
  action_filter?: string;
  category?: string;
  ip?: string;
  status?: string;
  entity_type?: string;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditStats {
  totals: {
    total_actions: number;
    total_users: number;
    total_ips: number;
    success_count: number;
    failure_count: number;
  };
  by_category: Array<{
    category: string;
    count: number;
    success_count: number;
    failure_count: number;
  }>;
  top_actions: Array<{
    action: string;
    category: string;
    count: number;
  }>;
  daily_activity: Array<{
    date: string;
    count: number;
    unique_users: number;
    unique_ips: number;
  }>;
  top_ips: Array<{
    ip_address: string;
    count: number;
    unique_users: number;
    failure_count: number;
  }>;
  failed_actions: Array<{
    action: string;
    category: string;
    ip_address: string;
    error_message: string;
    created_at: string;
  }>;
}

export interface SecurityAlerts {
  failed_logins: Array<{
    ip_address: string;
    attempts: number;
    last_attempt: string;
    user_ids: string;
  }>;
  suspicious_ips: Array<{
    ip_address: string;
    failure_count: number;
    failed_actions: string;
  }>;
  recent_failures: AuditLog[];
  rate_limit_violations: Array<{
    ip_address: string;
    count: number;
    last_attempt: string;
  }>;
}

const AUDIT_ENDPOINTS = {
  list: `${API_BASE_URL}/audit-logs.php?action=list`,
  stats: `${API_BASE_URL}/audit-logs.php?action=stats`,
  export: `${API_BASE_URL}/audit-logs.php?action=export`,
  userActivity: `${API_BASE_URL}/audit-logs.php?action=user-activity`,
  securityAlerts: `${API_BASE_URL}/audit-logs.php?action=security-alerts`,
};

/**
 * Fetch audit logs with optional filters
 */
export async function fetchAuditLogs(
  filters: AuditLogFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  
  const url = `${AUDIT_ENDPOINTS.list}&${params.toString()}`;
  return apiRequest<AuditLogsResponse>(url);
}

/**
 * Fetch audit statistics
 */
export async function fetchAuditStats(days: number = 30, userId?: number): Promise<{ success: boolean; data: AuditStats }> {
  const params = new URLSearchParams();
  params.set('days', String(days));
  if (userId) {
    params.set('user_id', String(userId));
  }
  
  const url = `${AUDIT_ENDPOINTS.stats}&${params.toString()}`;
  return apiRequest(url);
}

/**
 * Fetch user-specific activity
 */
export async function fetchUserActivity(
  userId: number,
  page: number = 1,
  limit: number = 50
): Promise<AuditLogsResponse & { user: { id: number; email: string; name: string; role: string; created_at: string; last_login_at: string } }> {
  const params = new URLSearchParams();
  params.set('user_id', String(userId));
  params.set('page', String(page));
  params.set('limit', String(limit));
  
  const url = `${AUDIT_ENDPOINTS.userActivity}&${params.toString()}`;
  return apiRequest(url);
}

/**
 * Fetch security alerts
 */
export async function fetchSecurityAlerts(days: number = 7): Promise<{ success: boolean; data: SecurityAlerts }> {
  const params = new URLSearchParams();
  params.set('days', String(days));
  
  const url = `${AUDIT_ENDPOINTS.securityAlerts}&${params.toString()}`;
  return apiRequest(url);
}

/**
 * Get export URL for audit logs
 */
export function getAuditExportUrl(days: number = 30, category?: string): string {
  const token = localStorage.getItem('auth_token');
  const params = new URLSearchParams();
  params.set('days', String(days));
  if (category) {
    params.set('category', category);
  }
  
  return `${AUDIT_ENDPOINTS.export}&${params.toString()}`;
}

/**
 * Category display configuration
 */
export const AUDIT_CATEGORIES = {
  auth: { label: 'Authentication', color: 'bg-blue-100 text-blue-800' },
  search: { label: 'Search', color: 'bg-green-100 text-green-800' },
  leads: { label: 'Leads', color: 'bg-yellow-100 text-yellow-800' },
  email: { label: 'Email', color: 'bg-purple-100 text-purple-800' },
  crm: { label: 'CRM', color: 'bg-pink-100 text-pink-800' },
  calendar: { label: 'Calendar', color: 'bg-indigo-100 text-indigo-800' },
  settings: { label: 'Settings', color: 'bg-gray-100 text-gray-800' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
  payment: { label: 'Payment', color: 'bg-emerald-100 text-emerald-800' },
  export: { label: 'Export', color: 'bg-orange-100 text-orange-800' },
  system: { label: 'System', color: 'bg-slate-100 text-slate-800' },
} as const;

/**
 * Status display configuration
 */
export const AUDIT_STATUSES = {
  success: { label: 'Success', color: 'bg-green-100 text-green-800' },
  failure: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
} as const;
