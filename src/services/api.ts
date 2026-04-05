import { MR, Product, Doctor, Pharmacy, Hospital, Target, Expense, Sale, Visit, ForecastData, Lead, Attendance, Activity } from '../types';
import { VisitRecordingData } from '../components/VoiceRecorder';

const API_BASE = '/api';

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
    getAll: () => fetch(`${API_BASE}/mrs`).then(res => res.json() as Promise<MR[]>),
    update: (id: number, mr: Partial<MR>) => fetch(`${API_BASE}/mrs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mr)
    }).then(res => res.json() as Promise<MR>),
  },
  products: {
    getAll: () => fetch(`${API_BASE}/products`).then(res => res.json() as Promise<Product[]>),
  },
  doctors: {
    getAll: () => fetch(`${API_BASE}/doctors`).then(res => res.json() as Promise<Doctor[]>),
  },
  pharmacies: {
    getAll: () => fetch(`${API_BASE}/pharmacies`).then(res => res.json() as Promise<Pharmacy[]>),
  },
  hospitals: {
    getAll: () => fetch(`${API_BASE}/hospitals`).then(res => res.json() as Promise<Hospital[]>),
  },
  targets: {
    getAll: () => fetch(`${API_BASE}/targets`).then(res => res.json() as Promise<Target[]>),
  },
  expenses: {
    getAll: () => fetch(`${API_BASE}/expenses`).then(res => res.json() as Promise<Expense[]>),
    create: (expense: Partial<Expense>) => fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    }).then(res => res.json()),
  },
  sales: {
    getAll: () => fetch(`${API_BASE}/sales`).then(res => res.json() as Promise<Sale[]>),
    create: (sale: Partial<Sale>) => fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    }).then(res => res.json()),
    getForecast: () => fetch(`${API_BASE}/sales-forecast`).then(res => res.json() as Promise<ForecastData[]>),
  },
  visits: {
    getAll: () => fetch(`${API_BASE}/doctor-visits`).then(res => res.json() as Promise<Visit[]>),
    getSchedules: () => fetch(`${API_BASE}/visit-schedules`).then(res => res.json() as Promise<any[]>),
  },
  leads: {
    getAll: () => fetch(`${API_BASE}/leads`).then(res => res.json() as Promise<Lead[]>),
    create: (lead: Partial<Lead>) => fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(res => res.json() as Promise<Lead>),
    update: (id: number, lead: Partial<Lead>) => fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(res => res.json() as Promise<Lead>),
  },
  attendance: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/attendance?mr_id=${mrId}` : `${API_BASE}/attendance`;
      return fetch(url).then(res => res.json() as Promise<Attendance[]>);
    }
  },
  activities: {
    getAll: (mrId?: number, date?: string) => {
      let url = `${API_BASE}/activities`;
      const params = new URLSearchParams();
      if (mrId) params.append('mr_id', mrId.toString());
      if (date) params.append('date', date);
      if (params.toString()) url += `?${params.toString()}`;
      return fetch(url).then(res => res.json() as Promise<Activity[]>);
    }
  },
  recordings: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/visit-recordings?mr_id=${mrId}` : `${API_BASE}/visit-recordings`;
      return fetch(url).then(res => res.json() as Promise<any[]>);
    },
    create: (recording: Partial<VisitRecordingData>) => fetch(`${API_BASE}/visit-recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recording)
    }).then(res => res.json()),
  },
  approvals: {
    getAll: () => fetch(`${API_BASE}/approval-requests`).then(res => res.json() as Promise<any[]>),
    create: (request: any) => fetch(`${API_BASE}/approval-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }).then(res => res.json()),
    update: (id: number, updates: any) => fetch(`${API_BASE}/approval-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json()),
  },
  credits: {
    getAll: () => fetch(`${API_BASE}/entity-credits`).then(res => res.json() as Promise<any[]>),
    update: (id: number, updates: any) => fetch(`${API_BASE}/entity-credits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json()),
  },
  locations: {
    getAll: () => fetch(`${API_BASE}/mr-locations`).then(res => res.json() as Promise<any[]>),
    update: (loc: { mr_id: number; lat: number; lng: number; activity_type?: string }) => fetch(`${API_BASE}/mr-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc)
    }).then(res => res.json()),
  },
  notifications: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/notifications?mr_id=${mrId}` : `${API_BASE}/notifications`;
      return fetch(url).then(res => res.json() as Promise<any[]>);
    },
    sendEmail: (to: string, subject: string, body: string, mrId?: number) => fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, mr_id: mrId })
    }).then(res => res.json()),
  }
};
