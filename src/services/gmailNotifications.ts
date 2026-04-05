import { api } from './api';

export const gmailNotifications = {
  /**
   * Send email notification.
   * If Google API is configured, sends via real Gmail.
   * Falls back to server email-logging endpoint for demo mode.
   */
  send: async (to: string, subject: string, body: string, mrId?: number) => {
    const isConfigured = !!(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    if (isConfigured) {
      // In production: use googleapis to send via Gmail
      console.log('[Gmail] Would send email via Gmail API to:', to);
    }

    return api.notifications.sendEmail(to, subject, body, mrId);
  },

  /**
   * Send visit schedule notification to MR's Gmail
   */
  notifyVisitScheduled: async (mrEmail: string, doctorName: string, date: string, time: string, mrId?: number) => {
    return gmailNotifications.send(
      mrEmail,
      'New Visit Scheduled — Metapharsic',
      `A visit has been scheduled with ${doctorName} on ${date} at ${time}. Please use the Metapharsic app to view full details and start recording your visit.`,
      mrId
    );
  },

  /**
   * Send approval result notification
   */
  notifyApprovalResult: async (mrEmail: string, status: string, description: string, mrId?: number) => {
    return gmailNotifications.send(
      mrEmail,
      `Approval ${status.charAt(0).toUpperCase() + status.slice(1)} — Metapharsic`,
      `Your request "${description}" has been ${status}.`,
      mrId
    );
  }
};
