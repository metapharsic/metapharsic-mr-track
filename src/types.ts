export type UserRole = 'admin' | 'manager' | 'mr' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  mr_id?: number;
  avatar_url?: string;
  permissions: string[];
  last_login?: string;
  created_at: string;
}

export interface MR {
  id: number;
  name: string;
  territory: string;
  base_salary: number;
  daily_allowance: number;
  joining_date: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  performance_score: number;
  total_sales: number;
  targets_achieved: number;
  targets_missed: number;
  avatar_url?: string;
  user_id?: number;
  role?: UserRole;
}

export interface Product {
  id: number;
  name: string;
  type: string;
  cogs: number;
  mrp: number;
  pts: number;
  category: string;
  stock: number;
  department: string;
  reorder_level: number;
  composition: string;
  indication: string;
}

export interface Doctor {
  id: number;
  name: string;
  clinic: string;
  specialty: string;
  territory: string;
  tier: 'A' | 'B' | 'C';
  potential: 'high' | 'medium' | 'low';
  total_visits: number;
  total_orders: number;
  total_value: number;
  status: 'active' | 'inactive';
  phone: string;
  email: string;
  address: string;
  area: string;
  rating: number;
  timings: string;
  qualification?: string;
  dept_opd?: string;
  mr_visit_window?: string;
  notes?: string;
  hospital_id?: number;
  entity_type?: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  territory: string;
  tier: 'A' | 'B' | 'C';
  credit_limit: number;
  credit_days: number;
  total_purchases: number;
  total_value: number;
  status: 'active' | 'inactive';
  area: string;
  rating: number;
  notes: string;
  shop_hours?: string;
  mr_visit_window?: string;
  type?: string;
  discount_notes?: string;
}

export interface Hospital {
  id: number;
  name: string;
  type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  territory: string;
  tier: 'A' | 'B' | 'C';
  bed_count: number;
  credit_limit: number;
  credit_days: number;
  total_purchases: number;
  total_value: number;
  status: 'active' | 'inactive';
  area: string;
  rating: number;
  notes: string;
}

export interface Target {
  id: number;
  mr_id: number;
  mr_name?: string;
  month: string;
  target_value: number;
  product_type: string;
  status: 'achieved' | 'missed' | 'in_progress' | 'pending';
  achieved_value: number;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
  mr_id: number | null;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Sale {
  id: number;
  mr_id: number;
  mr_name?: string;
  product_id: number;
  product_name?: string;
  quantity: number;
  amount: number;
  date: string;
  doctor_name: string;
  clinic: string;
  sale_type: string;
  customer_name: string;
}

export interface Visit {
  id: number;
  mr_id: number;
  doctor_id?: number;
  doctor_name?: string;
  entity_type: 'doctor' | 'chemist' | 'hospital' | 'clinic';
  entity_name: string;
  clinic?: string;
  visit_date: string;
  visit_time: string;
  status: 'scheduled' | 'completed' | 'in_progress';
  purpose: string;
  notes: string;
  conversation_summary?: string;
  order_value: number;
}

export interface ForecastData {
  month: string;
  predicted_sales: number;
  confidence_high: number;
  confidence_low: number;
}

export interface Lead {
  id: number;
  doctor_name: string;
  specialty: string;
  territory: string;
  comments: string;
  status: 'new' | 'assigned' | 'contacted' | 'converted' | 'lost';
  priority: 'high' | 'medium' | 'low';
  assigned_mr_id?: number;
  assigned_mr_name?: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  mr_id: number;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'present' | 'absent' | 'leave' | 'half_day';
  total_working_hours?: number;
  total_travel_time?: number;
  total_visit_hours?: number;
  visit_counts: {
    doctor: number;
    clinic: number;
    hospital: number;
    chemist: number;
  };
  total_order_value?: number;
}

export interface Activity {
  id: number;
  mr_id: number;
  date: string;
  time: string;
  type: 'visit' | 'travel' | 'break' | 'administrative';
  location_type?: 'clinic' | 'hospital' | 'chemist' | 'office' | 'home';
  location_name?: string;
  duration: number; // in minutes
  description: string;
}

export interface VisitSchedule {
  id: number;
  mr_id: number;
  doctor_name: string;
  clinic: string;
  scheduled_date: string;
  scheduled_time: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled';
}

export interface MRLocation {
  mr_id: number;
  mr_name: string;
  lat: number;
  lng: number;
  timestamp: string;
  activity_type?: 'visit' | 'travel' | 'idle';
  speed?: number;
}

export interface VisitRecording {
  id: number;
  mr_id: number;
  entity_type: 'doctor' | 'chemist' | 'hospital' | 'clinic';
  entity_name: string;
  transcript: string;
  language: 'en' | 'hi' | 'te';
  detected_lead: boolean;
  detected_sale: boolean;
  lead_details?: {
    doctor_name?: string;
    interest_topic?: string;
    follow_up_needed: boolean;
  };
  sale_details?: {
    product?: string;
    amount: number;
  };
  timestamp: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export interface ApprovalRequest {
  id: number;
  mr_id: number;
  mr_name: string;
  type: 'reschedule' | 'sale' | 'credit_extension';
  description: string;
  details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface EntityCredit {
  id: number;
  entity_type: 'doctor' | 'chemist' | 'hospital' | 'clinic';
  entity_name: string;
  mr_id: number;
  mr_name: string;
  credit_limit: number;
  outstanding: number;
  last_payment_date?: string;
  payment_terms: string;
  status: 'current' | 'overdue' | 'blocked';
}
