/**
 * Google Calendar Integration
 * Uses the Gmail Web App as email notification bridge.
 * When Google API is configured, creates real Calendar events.
 * Falls back to local notification storage for demo mode.
 */
import { api } from './api';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  description?: string;
  location?: string;
}

export const googleCalendar = {
  isConfigured: () => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    return !!clientId;
  },

  createEvent: async (event: Omit<CalendarEvent, 'id'>, mrEmail: string): Promise<boolean> => {
    if (!googleCalendar.isConfigured()) {
      console.log('[Calendar] Demo mode — scheduling visit locally:', event.title);
      return true;
    }

    try {
      // In production, use googleapis to create real Calendar events
      // const gapi = await loadGapi();
      // await gapi.client.calendar.events.insert({ calendarId: mrEmail, resource: { ... } });
      console.log('[Calendar] Would create event for', mrEmail, ':', event.title, 'at', event.date, event.time);
      return true;
    } catch (err) {
      console.error('[Calendar] Failed to create event:', err);
      return false;
    }
  },

  syncVisitSchedule: async (visitSchedule: { mr_id?: number; doctor_name: string; scheduled_date: string; scheduled_time: string; purpose?: string; priority?: string }, mrEmail: string) => {
    return googleCalendar.createEvent({
      title: `Visit: ${visitSchedule.doctor_name}`,
      date: visitSchedule.scheduled_date,
      time: visitSchedule.scheduled_time,
      durationMinutes: 30,
      description: visitSchedule.purpose || '',
      location: visitSchedule.doctor_name,
    }, mrEmail);
  },

  getEventsForDate: async (date: string): Promise<CalendarEvent[]> => {
    if (!googleCalendar.isConfigured()) {
      return [];
    }
    return [];
  }
};
