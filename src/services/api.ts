import { MR, Product, Doctor, Pharmacy, Hospital, Target, Expense, Sale, Visit, ForecastData, Lead, Attendance, Activity } from '../types';
import { VisitRecordingData } from '../components/VoiceRecorder';

const API_BASE = '/api';

// Helper to get auth headers from localStorage
function getAuthHeaders(): HeadersInit {
  const userStr = localStorage.getItem('metapharsic_current_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.email) {
        return { 'x-user-email': user.email };
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  return {};
}

export const authApi = {
  verifyGoogleToken: (credential: string) =>
    fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    }).then(res => res.json()) as Promise<{
      email: string;
      name: string;
      picture?: string;
      email_verified: boolean;
      sub: string;
    }>,
};

export const api = {
  mrs: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/mrs`, { headers }).then(res => res.json() as Promise<MR[]>);
    },
    create: (mr: Omit<MR, 'id'>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mrs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mr)
      }).then(res => res.json() as Promise<MR>);
    },
    update: (id: number, mr: Partial<MR>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mrs/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(mr)
      }).then(res => res.json() as Promise<MR>);
    },
  },
  products: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/products`, { headers }).then(res => res.json() as Promise<Product[]>);
    },
  },
  doctors: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/doctors`, { headers }).then(res => res.json() as Promise<Doctor[]>);
    },
    create: (doctor: Partial<Doctor>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(doctor)
      }).then(res => res.json() as Promise<Doctor>);
    },
  },
  pharmacies: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/pharmacies`, { headers }).then(res => res.json() as Promise<Pharmacy[]>);
    },
    create: (pharmacy: Partial<Pharmacy>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/pharmacies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pharmacy)
      }).then(res => res.json() as Promise<Pharmacy>);
    },
  },
  hospitals: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/hospitals`, { headers }).then(res => res.json() as Promise<Hospital[]>);
    },
    create: (hospital: Partial<Hospital>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/hospitals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(hospital)
      }).then(res => res.json() as Promise<Hospital>);
    },
  },
  targets: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/targets`, { headers }).then(res => res.json() as Promise<Target[]>);
    },
  },
  expenses: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/expenses`, { headers }).then(res => res.json() as Promise<Expense[]>);
    },
    create: (expense: Partial<Expense>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(expense)
      }).then(res => res.json());
    },
  },
  sales: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/sales`, { headers }).then(res => res.json() as Promise<Sale[]>);
    },
    create: (sale: Partial<Sale>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sale)
      }).then(res => res.json());
    },
    getForecast: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/sales-forecast`, { headers }).then(res => res.json() as Promise<ForecastData[]>);
    },
  },
  visits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/doctor-visits`, { headers }).then(res => res.json() as Promise<Visit[]>);
    },
    getSchedules: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    getSchedulesByMr: (mrId: number) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules?mr_id=${mrId}`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    createSchedule: (schedule: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(schedule)
      }).then(res => res.json());
    },
    deleteSchedule: (id: number) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules/${id}`, { method: 'DELETE', headers }).then(res => res.json());
    },
  },
  leads: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/leads`, { headers }).then(res => res.json() as Promise<Lead[]>);
    },
    create: (lead: Partial<Lead>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(lead)
      }).then(res => res.json() as Promise<Lead>);
    },
    update: (id: number, lead: Partial<Lead>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/leads/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(lead)
      }).then(res => res.json() as Promise<Lead>);
    },
  },
  attendance: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/attendance?mr_id=${mrId}` : `${API_BASE}/attendance`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<Attendance[]>);
    }
  },
  activities: {
    getAll: (mrId?: number, date?: string) => {
      let url = `${API_BASE}/activities`;
      const params = new URLSearchParams();
      if (mrId) params.append('mr_id', mrId.toString());
      if (date) params.append('date', date);
      if (params.toString()) url += `?${params.toString()}`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<Activity[]>);
    }
  },
  recordings: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/visit-recordings?mr_id=${mrId}` : `${API_BASE}/visit-recordings`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<any[]>);
    },
    getByEntity: (entityName: string) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-recordings?entity=${encodeURIComponent(entityName)}`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    create: (recording: Partial<VisitRecordingData>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-recordings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(recording)
      }).then(res => res.json());
    },
  },
  approvals: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/approval-requests`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    create: (request: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/approval-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      }).then(res => res.json());
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/approval-requests/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(res => res.json());
    },
  },
  credits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/entity-credits`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/entity-credits/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(res => res.json());
    },
  },
  locations: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/mr-locations`, { headers }).then(res => res.json() as Promise<any[]>);
    },
    update: (loc: { mr_id: number; lat: number; lng: number; activity_type?: string }) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mr-locations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(loc)
      }).then(res => res.json());
    },
  },
  notifications: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/notifications?mr_id=${mrId}` : `${API_BASE}/notifications`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<any[]>);
    },
    sendEmail: (to: string, subject: string, body: string, mrId?: number) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/send-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to, subject, body, mr_id: mrId })
      }).then(res => res.json());
    },
  },
  visitRecords: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/visit-records?mr_id=${mrId}` : `${API_BASE}/visit-records`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<any[]>);
    },
    create: (record: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(record)
      }).then(res => res.json());
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-records/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(res => res.json());
    },
  },
  missedVisits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/missed-visits`, { headers }).then(res => res.json() as Promise<any[]>);
    },
  },
  dailySummaries: {
    get: (mrId: number, date?: string) => {
      const url = date
        ? `${API_BASE}/daily-summaries?mr_id=${mrId}&date=${date}`
        : `${API_BASE}/daily-summaries?mr_id=${mrId}`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<any>);
    },
  },
  dailyCallPlan: {
    getAll: (mrId?: number, date?: string) => {
      let url = `${API_BASE}/daily-call-plan`;
      const params = new URLSearchParams();
      if (mrId) params.append('mr_id', mrId.toString());
      if (date) params.append('date', date);
      if (params.toString()) url += `?${params.toString()}`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(res => res.json() as Promise<any[]>);
    },
    complete: (id: number, outcome: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/daily-call-plan/${id}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(outcome),
      }).then(res => res.json());
    },
    create: (plan: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/daily-call-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify(plan),
      }).then(res => res.json());
    },
  },
};
