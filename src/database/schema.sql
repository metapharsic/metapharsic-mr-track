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
  doctor_id INTEGER,
  pharmacy_id INTEGER,
  hospital_id INTEGER,
  entity_type VARCHAR(50) DEFAULT 'doctor',
  doctor_name VARCHAR(255),
  clinic VARCHAR(255),
  specialty VARCHAR(255),
  tier VARCHAR(10),
  address TEXT,
  phone VARCHAR(100),
  territory VARCHAR(255),
  scheduled_date DATE,
  scheduled_time VARCHAR(50),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  estimated_duration INTEGER,
  notes TEXT,
  completed_at VARCHAR(50),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_visits (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  doctor_id INTEGER,
  doctor_name VARCHAR(255),
  entity_type VARCHAR(50) DEFAULT 'doctor',
  entity_name VARCHAR(255),
  clinic VARCHAR(255),
  visit_date DATE,
  visit_time VARCHAR(50),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  outcome TEXT,
  next_steps TEXT,
  products_detailed TEXT,
  samples_given TEXT,
  follow_up_date DATE,
  check_in_time VARCHAR(50),
  check_out_time VARCHAR(50),
  check_in_gps JSONB,
  check_out_gps JSONB,
  audio_recording_url TEXT,
  transcription TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visit_records (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  scheduled_visit_id INTEGER REFERENCES visit_schedules(id),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  entity_name VARCHAR(255),
  check_in_gps JSONB,
  check_out_gps JSONB,
  check_in_time VARCHAR(50),
  check_out_time VARCHAR(50),
  arrival_time VARCHAR(50),
  waiting_time INTEGER,
  speaking_time INTEGER,
  photo_url TEXT,
  photo_captured BOOLEAN,
  audio_recording_url TEXT,
  transcription TEXT,
  conversation_summary TEXT,
  sentiment VARCHAR(50),
  key_discussion TEXT,
  doctor_feedback TEXT,
  products_detailed JSONB,
  samples_given JSONB,
  promo_material JSONB,
  sale_done BOOLEAN,
  sale_amount DECIMAL(10,2),
  order_value DECIMAL(10,2),
  follow_up_required BOOLEAN,
  follow_up_date DATE,
  detected_lead JSONB,
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'completed',
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
  visit_id INTEGER REFERENCES visit_records(id),
  customer_name VARCHAR(255),
  sale_type VARCHAR(50) DEFAULT 'primary',
  doctor_name VARCHAR(255),
  clinic VARCHAR(255),
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

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  date DATE,
  check_in VARCHAR(50),
  check_out VARCHAR(50),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  check_out_lat DECIMAL(10,8),
  check_out_lng DECIMAL(11,8),
  status VARCHAR(50) DEFAULT 'present',
  visit_counts JSONB DEFAULT '{"doctor": 0, "clinic": 0, "hospital": 0, "chemist": 0}'::jsonb,
  total_order_value DECIMAL(12,2) DEFAULT 0,
  productive_time_mins INTEGER DEFAULT 0,
  visit_time_mins INTEGER DEFAULT 0,
  travel_time_mins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  target_value DECIMAL(12,2) NOT NULL,
  achieved_value DECIMAL(12,2) DEFAULT 0,
  product_type VARCHAR(100) DEFAULT 'Total',
  status VARCHAR(50) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users & Authentication
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  doctor_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  territory VARCHAR(255),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'new',
  comments TEXT,
  expected_revenue DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),
  conversion_probability INTEGER,
  time_to_conversion_days INTEGER,
  assigned_mr_id INTEGER REFERENCES mrs(id),
  assigned_mr_name VARCHAR(255),
  last_contact_date DATE,
  converted_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX IF NOT EXISTS idx_attendance_mr_id_date ON attendance(mr_id, date);
-- Entity Credits & Collections Schema
-- Tracks credit limits, outstanding payments, and collection status per entity

CREATE TABLE IF NOT EXISTS entity_credits (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'chemist', 'hospital', 'doctor', 'clinic'
    entity_id INTEGER, -- Optional link to specific table if needed
    entity_name VARCHAR(255) NOT NULL,
    mr_id INTEGER REFERENCES mrs(id),
    mr_name VARCHAR(255),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding DECIMAL(12,2) DEFAULT 0,
    last_payment_date DATE,
    payment_terms VARCHAR(100) DEFAULT '30 days',
    status VARCHAR(50) DEFAULT 'current', -- 'current', 'overdue', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and filtering
CREATE INDEX IF NOT EXISTS idx_entity_credits_mr_id ON entity_credits(mr_id);
CREATE INDEX IF NOT EXISTS idx_entity_credits_status ON entity_credits(status);
CREATE INDEX IF NOT EXISTS idx_entity_credits_entity_name ON entity_credits(entity_name);

-- Initial seed data from mock database
INSERT INTO entity_credits (entity_type, entity_name, mr_id, mr_name, credit_limit, outstanding, last_payment_date, payment_terms, status)
SELECT 'chemist', 'MedPlus Pharmacy', 1, 'Rajesh Kumar', 500000, 150000, '2026-03-20', '30 days', 'current'
WHERE NOT EXISTS (SELECT 1 FROM entity_credits WHERE entity_name = 'MedPlus Pharmacy');

INSERT INTO entity_credits (entity_type, entity_name, mr_id, mr_name, credit_limit, outstanding, last_payment_date, payment_terms, status)
SELECT 'hospital', 'KIMS Hospital', 1, 'Rajesh Kumar', 1000000, 980000, '2026-01-15', '45 days', 'overdue'
WHERE NOT EXISTS (SELECT 1 FROM entity_credits WHERE entity_name = 'KIMS Hospital');
-- Payment Ledger Schema
-- Tracks individual payment collections from entities

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    entity_credit_id INTEGER REFERENCES entity_credits(id),
    entity_name VARCHAR(255) NOT NULL,
    mr_id INTEGER REFERENCES mrs(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'upi', 'check', 'bank_transfer'
    reference_number VARCHAR(100), -- Check number, UPI Trans ID, etc.
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_payments_entity_credit ON payments(entity_credit_id);
CREATE INDEX IF NOT EXISTS idx_payments_mr_id ON payments(mr_id);

-- Trigger to automatically update outstanding balance in entity_credits when a payment is confirmed
CREATE OR REPLACE FUNCTION update_outstanding_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
        UPDATE entity_credits 
        SET outstanding = outstanding - NEW.amount,
            last_payment_date = NEW.payment_date,
            updated_at = NOW()
        WHERE id = NEW.entity_credit_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
        UPDATE entity_credits 
        SET outstanding = outstanding - NEW.amount,
            last_payment_date = NEW.payment_date,
            updated_at = NOW()
        WHERE id = NEW.entity_credit_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_outstanding_on_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_outstanding_balance();
-- AI Payment Risk Analytics View
-- Calculates risk scores based on utilization, payment recency, and status

CREATE OR REPLACE VIEW v_entity_credit_risk AS
WITH payment_stats AS (
    SELECT 
        entity_credit_id,
        COUNT(*) as total_payments,
        MAX(payment_date) as last_actual_payment,
        AVG(amount) as avg_payment_amount,
        -- Calculate avg days between payments if more than 1 payment exists
        CASE 
            WHEN COUNT(*) > 1 THEN 
                (MAX(payment_date) - MIN(payment_date))::numeric / (COUNT(*) - 1)
            ELSE NULL 
        END as avg_payment_gap_days
    FROM payments
    GROUP BY entity_credit_id
)
SELECT 
    ec.id,
    ec.entity_name,
    ec.entity_type,
    ec.mr_name,
    ec.credit_limit,
    ec.outstanding,
    ec.status,
    ec.last_payment_date,
    ec.payment_terms,
    ps.total_payments,
    ps.avg_payment_gap_days,
    -- Risk Score Calculation (0-100)
    ROUND(
        LEAST(100,
            -- Component 1: Utilization (Up to 40 points)
            (CASE WHEN ec.credit_limit > 0 THEN (ec.outstanding / ec.credit_limit) * 40 ELSE 0 END) +
            
            -- Component 2: Status (Up to 30 points)
            (CASE 
                WHEN ec.status = 'blocked' THEN 30
                WHEN ec.status = 'overdue' THEN 20
                ELSE 0 
            END) +
            
            -- Component 3: Payment Recency (Up to 30 points)
            (CASE 
                WHEN ec.last_payment_date IS NULL THEN 30
                WHEN (CURRENT_DATE - ec.last_payment_date) > 90 THEN 30
                WHEN (CURRENT_DATE - ec.last_payment_date) > 60 THEN 20
                WHEN (CURRENT_DATE - ec.last_payment_date) > 30 THEN 10
                ELSE 0 
            END)
        )
    ) as risk_score,
    -- Risk Level categorization
    CASE 
        WHEN ec.status = 'blocked' THEN 'Critical'
        WHEN (CASE WHEN ec.credit_limit > 0 THEN (ec.outstanding / ec.credit_limit) ELSE 0 END) > 0.9 THEN 'High'
        WHEN ec.status = 'overdue' THEN 'Elevated'
        ELSE 'Normal'
    END as risk_level
FROM 
    entity_credits ec
LEFT JOIN 
    payment_stats ps ON ec.id = ps.entity_credit_id;
-- Trigger to increase outstanding balance when a sale is recorded
CREATE OR REPLACE FUNCTION increase_outstanding_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_found INTEGER;
BEGIN
    -- Try to find the matching entity credit record
    SELECT id INTO entity_id_found FROM entity_credits WHERE entity_name ILIKE NEW.customer_name LIMIT 1;
    
    IF FOUND THEN
        UPDATE entity_credits 
        SET outstanding = outstanding + NEW.amount,
            updated_at = NOW()
        WHERE id = entity_id_found;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increase_outstanding_on_sale ON sales;
CREATE TRIGGER trg_increase_outstanding_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION increase_outstanding_on_sale();

-- Trigger to create notifications when credit limit is breached or risk is critical
CREATE OR REPLACE FUNCTION check_credit_breach_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    risk_lvl VARCHAR(20);
    utilization_pct INTEGER;
BEGIN
    utilization_pct := ROUND((NEW.outstanding / NULLIF(NEW.credit_limit, 0)) * 100);
    
    -- Check for Limit Breach
    IF NEW.outstanding > NEW.credit_limit AND (OLD.outstanding <= OLD.credit_limit OR OLD.outstanding IS NULL) THEN
        -- Notify MR
        INSERT INTO notifications (user_id, user_role, type, title, message, action_url)
        VALUES (
            NEW.mr_id, 
            'mr', 
            'credit_breach', 
            '🚨 Credit Limit Breached: ' || NEW.entity_name,
            'Entity has exceeded its credit limit of ₹' || NEW.credit_limit || '. Current outstanding: ₹' || NEW.outstanding || '. Sales are now restricted.',
            '/credits'
        );
        
        -- Notify Admin (assuming user_id 1 is admin, or we can broadcast)
        -- For simplicity, let's insert one for 'admin' role users if we had a better link.
        -- In this system, notifications are fetched by role too.
        INSERT INTO notifications (user_role, type, title, message, action_url)
        VALUES (
            'admin', 
            'credit_breach', 
            '🚨 High Risk Breach: ' || NEW.entity_name,
            NEW.mr_name || '''s customer ' || NEW.entity_name || ' has breached their credit limit. Outstanding: ₹' || NEW.outstanding,
            '/credits'
        );
    END IF;
    
    -- Check for Critical Risk (e.g. 90% utilization)
    IF utilization_pct >= 90 AND utilization_pct < 100 AND (utilization_pct > (ROUND((OLD.outstanding / NULLIF(OLD.credit_limit, 0)) * 100)) OR OLD.outstanding IS NULL) THEN
        INSERT INTO notifications (user_id, user_role, type, title, message, action_url)
        VALUES (
            NEW.mr_id, 
            'mr', 
            'credit_warning', 
            '⚠️ High Utilization Warning: ' || NEW.entity_name,
            'Entity has reached ' || utilization_pct || '% of its credit limit. Advise collection soon to avoid blocking.',
            '/credits'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_credit_breach ON entity_credits;
CREATE TRIGGER trg_check_credit_breach
AFTER UPDATE OF outstanding ON entity_credits
FOR EACH ROW
EXECUTE FUNCTION check_credit_breach_and_notify();
-- AI Conversion ROI Analytics View
-- Analyzes the relationship between visits and subsequent sales

CREATE OR REPLACE VIEW v_sales_roi_analytics AS
WITH visit_summary AS (
    SELECT 
        mr_id,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN sale_done = true THEN 1 END) as reported_conversions
    FROM visit_records
    GROUP BY mr_id
),
sales_summary AS (
    SELECT 
        mr_id,
        COUNT(*) as total_sales_records,
        COUNT(visit_id) as linked_sales,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN visit_id IS NOT NULL THEN amount ELSE 0 END) as visit_driven_revenue
    FROM sales
    GROUP BY mr_id
)
SELECT 
    m.id as mr_id,
    m.name as mr_name,
    m.territory,
    COALESCE(vs.total_visits, 0) as total_visits,
    COALESCE(ss.total_revenue, 0) as total_revenue,
    COALESCE(ss.visit_driven_revenue, 0) as visit_driven_revenue,
    -- ROI Metrics
    CASE 
        WHEN COALESCE(vs.total_visits, 0) > 0 THEN 
            ROUND(COALESCE(ss.visit_driven_revenue, 0) / vs.total_visits)
        ELSE 0 
    END as revenue_per_visit,
    CASE 
        WHEN COALESCE(vs.total_visits, 0) > 0 THEN 
            ROUND((COALESCE(ss.linked_sales, 0)::numeric / vs.total_visits) * 100, 1)
        ELSE 0 
    END as conversion_rate_pct,
    -- Efficiency Score (0-100)
    ROUND(
        LEAST(100,
            (CASE WHEN COALESCE(vs.total_visits, 0) > 0 THEN (COALESCE(ss.linked_sales, 0)::numeric / vs.total_visits) * 70 ELSE 0 END) +
            (CASE WHEN COALESCE(ss.total_revenue, 0) > 0 THEN (COALESCE(ss.visit_driven_revenue, 0) / ss.total_revenue) * 30 ELSE 0 END)
        )
    ) as efficiency_score
FROM 
    mrs m
LEFT JOIN 
    visit_summary vs ON m.id = vs.mr_id
LEFT JOIN 
    sales_summary ss ON m.id = ss.mr_id
WHERE 
    m.status = 'active';
-- Approval Workflow Schema
-- Tracks requests for credit extensions, expense approvals, and special discounts

CREATE TABLE IF NOT EXISTS approval_requests (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    mr_name VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- 'credit_extension', 'expense', 'discount', 'leave'
    entity_name VARCHAR(255), -- Pharmacy or Doctor name if applicable
    details TEXT,
    amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    approver_id INTEGER REFERENCES users(id),
    approver_name VARCHAR(255),
    approver_comments TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for management filtering
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_mr_id ON approval_requests(mr_id);
CREATE INDEX IF NOT EXISTS idx_approvals_type ON approval_requests(type);

-- Trigger to automatically notify Admin when a new high-priority approval is requested
CREATE OR REPLACE FUNCTION notify_admin_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.priority = 'high' THEN
        INSERT INTO notifications (user_role, type, title, message, action_url)
        VALUES (
            'admin', 
            'approval_needed', 
            '⚡ Urgent Approval: ' || NEW.type,
            'MR ' || NEW.mr_name || ' has requested an urgent ' || NEW.type || ' for ' || COALESCE(NEW.entity_name, 'N/A'),
            '/approvals'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_admin_on_approval
AFTER INSERT ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_approval();
-- Inventory & Stock Management Schema
-- Tracks every movement of product stock

CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    movement_type VARCHAR(20) NOT NULL, -- 'sale', 'restock', 'return', 'adjustment'
    quantity INTEGER NOT NULL,
    reference_id INTEGER, -- sale_id or other record ID
    user_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for stock history
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_logs(product_id);

-- Trigger to automatically update product stock when a movement is logged
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type IN ('sale', 'adjustment_down') THEN
        UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    ELSIF NEW.movement_type IN ('restock', 'return', 'adjustment_up') THEN
        UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_on_movement
AFTER INSERT ON inventory_logs
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- Trigger to log inventory movement automatically when a sale is recorded
CREATE OR REPLACE FUNCTION log_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_logs (product_id, product_name, movement_type, quantity, reference_id, notes)
    VALUES (NEW.product_id, NEW.product_name, 'sale', NEW.quantity, NEW.id, 'Automatic log from sale entry');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_inventory_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION log_inventory_on_sale();
-- Net Territory Profitability Analytics View
-- Correlates Sales Revenue with Total Direct Costs (Salary + Allowance + Expenses)

CREATE OR REPLACE VIEW v_mr_profitability AS
WITH monthly_sales AS (
    SELECT 
        mr_id,
        SUM(amount) as revenue
    FROM sales
    WHERE date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
),
monthly_expenses AS (
    SELECT 
        mr_id,
        SUM(amount) as total_expenses
    FROM expenses
    WHERE status = 'approved' 
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
),
monthly_attendance AS (
    SELECT 
        mr_id,
        COUNT(DISTINCT date) as days_worked
    FROM attendance
    WHERE status = 'present'
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
)
SELECT 
    m.id as mr_id,
    m.name as mr_name,
    m.territory,
    COALESCE(s.revenue, 0) as monthly_revenue,
    -- Total Costs = Base Salary + (Days Worked * Daily Allowance) + Field Expenses
    (
        m.base_salary + 
        (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
        COALESCE(e.total_expenses, 0)
    ) as total_costs,
    -- Breakdown
    m.base_salary,
    (COALESCE(a.days_worked, 0) * m.daily_allowance) as total_allowance,
    COALESCE(e.total_expenses, 0) as field_expenses,
    -- Net Profit
    (COALESCE(s.revenue, 0) - (
        m.base_salary + 
        (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
        COALESCE(e.total_expenses, 0)
    )) as net_profit,
    -- Profit Margin %
    CASE 
        WHEN COALESCE(s.revenue, 0) > 0 THEN 
            ROUND(((COALESCE(s.revenue, 0) - (
                m.base_salary + 
                (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
                COALESCE(e.total_expenses, 0)
            )) / s.revenue) * 100, 1)
        ELSE -100 
    END as profit_margin_pct
FROM 
    mrs m
LEFT JOIN 
    monthly_sales s ON m.id = s.mr_id
LEFT JOIN 
    monthly_expenses e ON m.id = e.mr_id
LEFT JOIN 
    monthly_attendance a ON m.id = a.mr_id
WHERE 
    m.status = 'active';
-- AI Visit Prioritization Engine View
-- Calculates dynamic priority scores for every entity in a territory

CREATE OR REPLACE VIEW v_visit_priority AS
WITH last_visits AS (
    SELECT 
        entity_name,
        MAX(created_at) as last_visit_date,
        COUNT(*) as total_visits_30d
    FROM visit_records
    WHERE created_at > (NOW() - INTERVAL '30 days')
    GROUP BY entity_name
),
entity_sales AS (
    SELECT 
        customer_name as entity_name,
        SUM(amount) as sales_30d,
        COUNT(*) as orders_30d
    FROM sales
    WHERE date > (CURRENT_DATE - INTERVAL '30 days')
    GROUP BY customer_name
),
unified_entities AS (
    SELECT name as entity_name, territory, entity_type, tier FROM doctors
    UNION ALL
    SELECT name as entity_name, territory, 'pharmacy' as entity_type, tier FROM pharmacies
    UNION ALL
    SELECT name as entity_name, territory, 'hospital' as entity_type, tier FROM hospitals
)
SELECT 
    ue.entity_name,
    ue.territory,
    ue.entity_type,
    ue.tier,
    lv.last_visit_date,
    COALESCE(EXTRACT(DAY FROM (NOW() - lv.last_visit_date)), 30) as days_since_visit,
    COALESCE(es.sales_30d, 0) as sales_30d,
    COALESCE(cr.risk_score, 0) as credit_risk_score,
    -- Priority Score Calculation (0-100)
    ROUND(
        LEAST(100,
            -- Component 1: Visit Gap (Up to 40 pts)
            -- Higher points if not visited for a long time
            (CASE 
                WHEN lv.last_visit_date IS NULL THEN 40
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 21 THEN 40
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 14 THEN 30
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 7 THEN 15
                ELSE 0 
            END) +
            
            -- Component 2: Sales Velocity (Up to 30 pts)
            -- High value customers need more frequent maintenance
            (CASE 
                WHEN es.sales_30d > 100000 THEN 30
                WHEN es.sales_30d > 50000 THEN 20
                WHEN es.sales_30d > 10000 THEN 10
                ELSE 5 
            END) +
            
            -- Component 3: Credit Risk (Up to 30 pts)
            -- High risk or overdue entities need collection visits
            (cr.risk_score * 0.3)
        )
    ) as priority_score,
    -- Recommendation Logic
    CASE 
        WHEN cr.risk_score > 70 THEN 'Immediate Collection Required'
        WHEN es.sales_30d > 50000 AND COALESCE(EXTRACT(DAY FROM (NOW() - lv.last_visit_date)), 30) > 10 THEN 'High Value Retention'
        WHEN lv.last_visit_date IS NULL THEN 'New Entity Onboarding'
        WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 20 THEN 'Lapsed Customer Recovery'
        ELSE 'Routine Relationship Maintenance'
    END as ai_recommendation
FROM 
    unified_entities ue
LEFT JOIN 
    last_visits lv ON ue.entity_name = lv.entity_name
LEFT JOIN 
    entity_sales es ON ue.entity_name = es.entity_name
LEFT JOIN 
    v_entity_credit_risk cr ON ue.entity_name = cr.entity_name;
-- Market War Room Intelligence View
-- Aggregates field sentiment and competitor mentions by territory
-- Senior Fix: Using MR_ID for joins since visit_record_id is not in competitor_mentions

CREATE OR REPLACE VIEW v_market_intelligence AS
WITH territory_sentiment AS (
    SELECT 
        m.territory,
        AVG(CASE 
            WHEN v.sentiment = 'positive' THEN 100
            WHEN v.sentiment = 'neutral' THEN 50
            WHEN v.sentiment = 'negative' THEN 0
            ELSE 50 END
        ) as avg_sentiment_score,
        COUNT(v.id) as total_analyzed_visits
    FROM visit_records v
    JOIN mrs m ON v.mr_id = m.id
    WHERE v.created_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory
),
territory_competitors AS (
    SELECT 
        m.territory,
        c.competitor_product as competitor_name,
        COUNT(*) as mention_count
    FROM competitor_mentions c
    JOIN mrs m ON c.mr_id = m.id
    WHERE c.detected_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory, c.competitor_product
),
top_competitor AS (
    SELECT DISTINCT ON (territory)
        territory,
        competitor_name,
        mention_count
    FROM territory_competitors
    ORDER BY territory, mention_count DESC
)
SELECT 
    ts.territory,
    ROUND(COALESCE(ts.avg_sentiment_score, 50)) as sentiment_score,
    COALESCE(ts.total_analyzed_visits, 0) as total_analyzed_visits,
    COALESCE(tc.competitor_name, 'None Detected') as main_competitor,
    COALESCE(tc.mention_count, 0) as competitor_mentions,
    CASE 
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 70 THEN 'Dominant'
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 40 THEN 'Competitive'
        ELSE 'Under Pressure'
    END as market_status,
    CASE 
        WHEN COALESCE(tc.mention_count, 0) > 5 THEN 'High Alert'
        WHEN COALESCE(tc.mention_count, 0) > 2 THEN 'Monitoring'
        ELSE 'Stable'
    END as competitor_threat_level
FROM 
    territory_sentiment ts
LEFT JOIN 
    top_competitor tc ON ts.territory = tc.territory;
-- Market War Room Intelligence View
-- Aggregates field sentiment and competitor mentions by territory
-- Senior Fix: Using MR_ID for joins since visit_record_id is not in competitor_mentions

CREATE OR REPLACE VIEW v_market_intelligence AS
WITH territory_sentiment AS (
    SELECT 
        m.territory,
        AVG(CASE 
            WHEN v.sentiment = 'positive' THEN 100
            WHEN v.sentiment = 'neutral' THEN 50
            WHEN v.sentiment = 'negative' THEN 0
            ELSE 50 END
        ) as avg_sentiment_score,
        COUNT(v.id) as total_analyzed_visits
    FROM visit_records v
    JOIN mrs m ON v.mr_id = m.id
    WHERE v.created_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory
),
territory_competitors AS (
    SELECT 
        m.territory,
        c.competitor_product as competitor_name,
        COUNT(*) as mention_count
    FROM competitor_mentions c
    JOIN mrs m ON c.mr_id = m.id
    WHERE c.detected_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory, c.competitor_product
),
top_competitor AS (
    SELECT DISTINCT ON (territory)
        territory,
        competitor_name,
        mention_count
    FROM territory_competitors
    ORDER BY territory, mention_count DESC
)
SELECT 
    ts.territory,
    ROUND(COALESCE(ts.avg_sentiment_score, 50)) as sentiment_score,
    COALESCE(ts.total_analyzed_visits, 0) as total_analyzed_visits,
    COALESCE(tc.competitor_name, 'None Detected') as main_competitor,
    COALESCE(tc.mention_count, 0) as competitor_mentions,
    CASE 
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 70 THEN 'Dominant'
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 40 THEN 'Competitive'
        ELSE 'Under Pressure'
    END as market_status,
    CASE 
        WHEN COALESCE(tc.mention_count, 0) > 5 THEN 'High Alert'
        WHEN COALESCE(tc.mention_count, 0) > 2 THEN 'Monitoring'
        ELSE 'Stable'
    END as competitor_threat_level
FROM 
    territory_sentiment ts
LEFT JOIN 
    top_competitor tc ON ts.territory = tc.territory;
