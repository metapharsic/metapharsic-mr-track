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
