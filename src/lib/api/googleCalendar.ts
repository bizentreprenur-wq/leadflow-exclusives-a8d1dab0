import { API_BASE_URL, getAuthHeaders } from './config';
import { toast } from 'sonner';

interface GoogleCalendarAuthResponse {
  success: boolean;
  auth_url?: string;
  error?: string;
  message?: string;
}

interface GoogleCalendarStatusResponse {
  success: boolean;
  connected: boolean;
  error?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  htmlLink?: string;
  hangoutLink?: string;
  attendees?: { email: string }[];
}

interface CalendarEventsResponse {
  success: boolean;
  events?: CalendarEvent[];
  error?: string;
  needs_auth?: boolean;
}

interface CreateEventRequest {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
  attendees?: string[];
  addMeet?: boolean;
}

interface CreateEventResponse {
  success: boolean;
  event?: CalendarEvent;
  htmlLink?: string;
  meetLink?: string;
  error?: string;
  needs_auth?: boolean;
}

/**
 * Get Google Calendar OAuth authorization URL
 */
export async function getGoogleCalendarAuthUrl(): Promise<GoogleCalendarAuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-auth.php?action=auth`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 503) {
        return { 
          success: false, 
          error: 'Google Calendar integration is being configured. Please try again later.' 
        };
      }
      return { success: false, error: errorData.error || 'Failed to get auth URL' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Google Calendar auth error:', error);
    return { success: false, error: 'Network error - please check your connection' };
  }
}

/**
 * Check if user has Google Calendar connected
 */
export async function checkGoogleCalendarStatus(): Promise<GoogleCalendarStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-auth.php?action=status`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      return { success: false, connected: false, error: 'Could not check status' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Google Calendar status error:', error);
    return { success: false, connected: false, error: 'Network error' };
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-auth.php?action=disconnect`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  } catch (error) {
    console.error('Google Calendar disconnect error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Initialize Google Calendar connection flow
 */
export async function connectGoogleCalendar(): Promise<boolean> {
  const authResponse = await getGoogleCalendarAuthUrl();
  
  if (!authResponse.success || !authResponse.auth_url) {
    toast.error(authResponse.error || 'Could not start Google Calendar connection');
    return false;
  }
  
  // Open auth URL in new window
  window.open(authResponse.auth_url, '_blank', 'width=600,height=700');
  toast.info('Complete the authorization in the new window');
  return true;
}

/**
 * List upcoming calendar events
 */
export async function listCalendarEvents(): Promise<CalendarEventsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-events.php?action=list`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403 && errorData.needs_auth) {
        return { success: false, error: 'Please connect Google Calendar first', needs_auth: true };
      }
      return { success: false, error: errorData.error || 'Failed to fetch events' };
    }
    
    return response.json();
  } catch (error) {
    console.error('List events error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(event: CreateEventRequest): Promise<CreateEventResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-events.php?action=create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403 && errorData.needs_auth) {
        return { success: false, error: 'Please connect Google Calendar first', needs_auth: true };
      }
      return { success: false, error: errorData.error || 'Failed to create event' };
    }
    
    return response.json();
  } catch (error) {
    console.error('Create event error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/google-calendar-events.php?action=delete&eventId=${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  } catch (error) {
    console.error('Delete event error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Schedule a meeting with a lead
 */
export async function scheduleMeetingWithLead(
  leadName: string,
  leadEmail: string | undefined,
  date: Date,
  durationMinutes: number = 30,
  addMeetLink: boolean = true
): Promise<CreateEventResponse> {
  const start = date.toISOString();
  const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000);
  const end = endDate.toISOString();
  
  const event: CreateEventRequest = {
    summary: `Call with ${leadName}`,
    description: `Follow-up call scheduled via BamLead`,
    start,
    end,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    addMeet: addMeetLink,
  };
  
  if (leadEmail) {
    event.attendees = [leadEmail];
  }
  
  const result = await createCalendarEvent(event);
  
  if (result.success) {
    toast.success(`Meeting scheduled with ${leadName}!`);
    if (result.meetLink) {
      toast.info('Google Meet link created', { description: result.meetLink });
    }
  } else {
    toast.error(result.error || 'Failed to schedule meeting');
  }
  
  return result;
}
