import { MR, Product, Doctor, Pharmacy, Hospital, Target, Expense, Sale, Visit, ForecastData, Lead, Attendance, Activity } from '../types';
import { VisitRecordingData } from '../components/VoiceRecorder';

const API_BASE = '/api';

// Helper to handle fetch responses and throw on errors
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let error;
    try {
      const body = await res.json();
      error = body.error || res.statusText;
    } catch {
      error = res.statusText;
    }
    throw new Error(error);
  }
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  } else {
    const text = await res.text();
    throw new Error(`Expected JSON but received ${contentType || 'unknown'}: ${text.substring(0, 100)}...`);
  }
}

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
    }).then(handleResponse) as Promise<{
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
      return fetch(`${API_BASE}/mrs`, { headers }).then(handleResponse<MR[]>);
    },
    create: (mr: Omit<MR, 'id'>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mrs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mr)
      }).then(handleResponse);
    },
    update: (id: number, mr: Partial<MR>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mrs/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(mr)
      }).then(handleResponse<MR>);
    },
  },
  products: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/products`, { headers }).then(handleResponse<Product[]>);
    },
  },
  doctors: {
    getAll: (params?: { territory?: string; mr_id?: number }) => {
      const headers = getAuthHeaders();
      let url = `${API_BASE}/doctors`;
      if (params) {
        const query = new URLSearchParams();
        if (params.territory) query.append('territory', params.territory);
        if (params.mr_id) query.append('mr_id', params.mr_id.toString());
        const qs = query.toString();
        if (qs) url += `?${qs}`;
      }
      return fetch(url, { headers }).then(handleResponse<Doctor[]>);
    },
    create: (doctor: Partial<Doctor>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(doctor)
      }).then(handleResponse);
    },
  },
  pharmacies: {
    getAll: (params?: { territory?: string; mr_id?: number }) => {
      const headers = getAuthHeaders();
      let url = `${API_BASE}/pharmacies`;
      if (params) {
        const query = new URLSearchParams();
        if (params.territory) query.append('territory', params.territory);
        if (params.mr_id) query.append('mr_id', params.mr_id.toString());
        const qs = query.toString();
        if (qs) url += `?${qs}`;
      }
      return fetch(url, { headers }).then(handleResponse<Pharmacy[]>);
    },
    create: (pharmacy: Partial<Pharmacy>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/pharmacies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pharmacy)
      }).then(handleResponse);
    },
  },
  hospitals: {
    getAll: (params?: { territory?: string; mr_id?: number }) => {
      const headers = getAuthHeaders();
      let url = `${API_BASE}/hospitals`;
      if (params) {
        const query = new URLSearchParams();
        if (params.territory) query.append('territory', params.territory);
        if (params.mr_id) query.append('mr_id', params.mr_id.toString());
        const qs = query.toString();
        if (qs) url += `?${qs}`;
      }
      return fetch(url, { headers }).then(handleResponse<Hospital[]>);
    },
    create: (hospital: Partial<Hospital>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/hospitals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(hospital)
      }).then(handleResponse);
    },
  },
  targets: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/targets`, { headers }).then(handleResponse<Target[]>);
    },
  },
  dashboard: {
    getStats: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/dashboard/stats`, { headers }).then(handleResponse<any>);
    },
    getCharts: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/dashboard/charts`, { headers }).then(handleResponse<any>);
    },
  },
  expenses: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/expenses`, { headers }).then(handleResponse<Expense[]>);
    },
    create: (expense: Partial<Expense>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(expense)
      }).then(handleResponse);
    },
  },
  sales: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/sales`, { headers }).then(handleResponse<Sale[]>);
    },
    create: (sale: Partial<Sale>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sale)
      }).then(handleResponse);
    },
    getForecast: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/sales-forecast`, { headers }).then(handleResponse);
    },
    getROI: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/sales-roi`, { headers }).then(handleResponse<any[]>);
    },
    getProfitability: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/profitability-analytics`, { headers }).then(handleResponse<any[]>);
    },
    getMarketIntelligence: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/market-intelligence`, { headers }).then(handleResponse<any[]>);
    },
  },
  visits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/doctor-visits`, { headers }).then(handleResponse<Visit[]>);
    },
    getSchedules: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules`, { headers }).then(handleResponse<any[]>);
    },
    getSchedulesByMr: (mrId: number) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules?mr_id=${mrId}`, { headers }).then(handleResponse<any[]>);
    },
    createSchedule: (schedule: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(schedule)
      }).then(handleResponse);
    },
    deleteSchedule: (id: number) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-schedules/${id}`, { method: 'DELETE', headers }).then(handleResponse);
    },
  },
  leads: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/leads`, { headers }).then(handleResponse<Lead[]>);
    },
    create: (lead: Partial<Lead>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(lead)
      }).then(handleResponse);
    },
    update: (id: number, lead: Partial<Lead>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/leads/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(lead)
      }).then(handleResponse<Lead>);
    },
  },
  attendance: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/attendance?mr_id=${mrId}` : `${API_BASE}/attendance`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(handleResponse<Attendance[]>);
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
      return fetch(url, { headers }).then(handleResponse<Activity[]>);
    }
  },
  recordings: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/visit-recordings?mr_id=${mrId}` : `${API_BASE}/visit-recordings`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(handleResponse<any[]>);
    },
    getByEntity: (entityName: string) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/visit-recordings?entity=${encodeURIComponent(entityName)}`, { headers }).then(handleResponse<any[]>);
    },
    create: (recording: Partial<VisitRecordingData>) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-recordings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(recording)
      }).then(handleResponse);
    },
  },
  approvals: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/approval-requests`, { headers }).then(handleResponse<any[]>);
    },
    create: (request: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/approval-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      }).then(handleResponse);
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/approval-requests/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(handleResponse);
    },
  },
  credits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/entity-credits`, { headers }).then(handleResponse<any[]>);
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/entity-credits/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(handleResponse);
    },
  },
  payments: {
    getByEntity: (entityCreditId: number) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/payments?entity_credit_id=${entityCreditId}`, { headers }).then(handleResponse<any[]>);
    },
    create: (payment: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payment)
      }).then(handleResponse);
    },
  },
  intelligence: {
    getCollectionScript: (entityName: string) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/collection-intelligence?entityName=${encodeURIComponent(entityName)}`, { headers }).then(handleResponse<{ script: string; context: any }>);
    },
    getEntityVisits: (entityName: string) => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/entity-visits/${encodeURIComponent(entityName)}`, { headers }).then(handleResponse<any[]>);
    },
    getAIPriorities: (territory?: string) => {
      const headers = getAuthHeaders();
      const url = territory ? `${API_BASE}/ai-priority-visits?territory=${encodeURIComponent(territory)}` : `${API_BASE}/ai-priority-visits`;
      return fetch(url, { headers }).then(handleResponse<any[]>);
    },
  },
  locations: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/mr-locations`, { headers }).then(handleResponse<any[]>);
    },
    update: (loc: { mr_id: number; lat: number; lng: number; activity_type?: string }) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/mr-locations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(loc)
      }).then(handleResponse);
    },
  },
  notifications: {
    getAll: (mrId?: number) => {
      const url = mrId ? `${API_BASE}/notifications?mr_id=${mrId}` : `${API_BASE}/notifications`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(handleResponse<any[]>);
    },
    sendEmail: (to: string, subject: string, body: string, mrId?: number) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/send-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to, subject, body, mr_id: mrId })
      }).then(handleResponse);
    },
  },
  visitRecords: {
    getAll: (mrId?: number, entityName?: string) => {
      const params = new URLSearchParams();
      if (mrId) params.append('mr_id', mrId.toString());
      if (entityName) params.append('entity_name', entityName);
      const url = `${API_BASE}/visit-records${params.toString() ? '?' + params.toString() : ''}`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(handleResponse<any[]>);
    },
    create: (record: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(record)
      }).then(handleResponse);
    },
    update: (id: number, updates: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/visit-records/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }).then(handleResponse);
    },
  },
  missedVisits: {
    getAll: () => {
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/missed-visits`, { headers }).then(handleResponse<any[]>);
    },
  },
  dailySummaries: {
    get: (mrId: number, date?: string) => {
      const url = date
        ? `${API_BASE}/daily-summaries?mr_id=${mrId}&date=${date}`
        : `${API_BASE}/daily-summaries?mr_id=${mrId}`;
      const headers = getAuthHeaders();
      return fetch(url, { headers }).then(handleResponse);
    },
  },
  dailyBriefing: {
    get: (mrId: number, date?: string) => {
      const params = new URLSearchParams({ mr_id: mrId.toString() });
      if (date) params.append('date', date);
      const headers = getAuthHeaders();
      return fetch(`${API_BASE}/daily-briefing?${params.toString()}`, { headers }).then(handleResponse);
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
      return fetch(url, { headers }).then(handleResponse<any[]>);
    },
    complete: (id: number, outcome: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/daily-call-plan/${id}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(outcome),
      }).then(handleResponse);
    },
    create: (plan: any) => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      return fetch(`${API_BASE}/daily-call-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify(plan),
      }).then(handleResponse);
    },
  },
};
