-- Metapharsic CRM Database Schema
-- PostgreSQL Database Setup

-- Core Tables
CREATE TABLE IF NOT EXISTS mrs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  territory VARCHAR(255),
  base_salary DECIMAL(10,2),
  daily_allowance DECIMAL(10,2),
  joining_date DATE,
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  performance_score INTEGER DEFAULT 75,
  total_sales DECIMAL(12,2) DEFAULT 0,
  targets_achieved INTEGER DEFAULT 0,
  targets_missed INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  clinic VARCHAR(255),
  specialty VARCHAR(255),
  territory VARCHAR(255),
  tier VARCHAR(10) DEFAULT 'B',
  potential VARCHAR(50) DEFAULT 'medium',
  total_visits INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  area VARCHAR(255),
  rating DECIMAL(3,2),
  timings VARCHAR(255),
  qualification TEXT,
  mr_visit_window VARCHAR(255),
  notes TEXT,
  visit_frequency INTEGER DEFAULT 14,
  preferred_products INTEGER[],
  last_visit DATE,
  entity_type VARCHAR(100),
  hospital_id INTEGER,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  business_type VARCHAR(100),
  territory VARCHAR(255),
  tier VARCHAR(10),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 100000,
  credit_days INTEGER DEFAULT 30,
  avg_monthly_purchase DECIMAL(12,2),
  payment_history VARCHAR(100),
  total_purchases DECIMAL(12,2) DEFAULT 0,
  last_purchase_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  territory VARCHAR(255),
  tier VARCHAR(10),
  bed_count INTEGER,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  contact_person VARCHAR(255),
  credit_limit DECIMAL(12,2) DEFAULT 500000,
  credit_days INTEGER DEFAULT 45,
  key_departments TEXT[],
  total_purchases DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  billing_contact VARCHAR(255),
  medical_director VARCHAR(255),
  notes TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  cogs DECIMAL(10,2),
  mrp DECIMAL(10,2),
  pts DECIMAL(10,2),
  category VARCHAR(100),
  stock INTEGER,
  department VARCHAR(100),
  reorder_level INTEGER,
  composition TEXT,
  indication TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visit Management
CREATE TABLE IF NOT EXISTS visit_schedules (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  doctor_name VARCHAR(255),
  clinic VARCHAR(255),
  scheduled_date DATE,
  scheduled_time VARCHAR(50),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  estimated_duration INTEGER,
  notes TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_entities (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_data JSONB,
  territory VARCHAR(255),
  tier VARCHAR(10),
  source VARCHAR(100) DEFAULT 'excel_upload',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  assigned_mr_id INTEGER REFERENCES mrs(id),
  assigned_date TIMESTAMP,
  ai_confidence DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_role VARCHAR(50),
  type VARCHAR(100),
  title VARCHAR(500),
  message TEXT,
  action_url VARCHAR(500),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales & Expenses
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  product_id INTEGER REFERENCES products(id),
  doctor_id INTEGER REFERENCES doctors(id),
  quantity INTEGER,
  amount DECIMAL(12,2),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  category VARCHAR(100),
  amount DECIMAL(10,2),
  description TEXT,
  date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50),
  mr_id INTEGER REFERENCES mrs(id),
  territory VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_territory ON doctors(territory);
CREATE INDEX IF NOT EXISTS idx_doctors_tier ON doctors(tier);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_mr_id ON visit_schedules(mr_id);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_date ON visit_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pending_entities_status ON pending_entities(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_mr_id ON sales(mr_id);
CREATE INDEX IF NOT EXISTS idx_expenses_mr_id ON expenses(mr_id);
