-- Healthcare Directory Professionalization & Integrity Migration

-- 1. Soft Delete Support (Main Logic Protection)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 2. Performance Indexes (Entity Linking)
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors (hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors (specialty);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies (status);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals (type);

-- 3. Data Integrity Constraints
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS chk_doctor_status;
ALTER TABLE doctors ADD CONSTRAINT chk_doctor_status CHECK (status IN ('active', 'inactive', 'on_hold', 'blocked'));

ALTER TABLE pharmacies DROP CONSTRAINT IF EXISTS chk_pharmacy_status;
ALTER TABLE pharmacies ADD CONSTRAINT chk_pharmacy_status CHECK (status IN ('active', 'inactive', 'on_hold', 'blocked'));

ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS chk_hospital_status;
ALTER TABLE hospitals ADD CONSTRAINT chk_hospital_status CHECK (status IN ('active', 'inactive', 'on_hold', 'blocked'));

-- 4. Unified Directory View (Logic Center)
-- This view allows the app to query all partners through a single professional interface
CREATE OR REPLACE VIEW v_healthcare_directory_unified AS
SELECT 
    'doctor' as entity_type,
    id,
    name,
    specialty as sub_type,
    territory,
    tier,
    phone,
    email,
    clinic as location_name,
    address,
    status,
    lat,
    lng,
    created_at
FROM doctors WHERE deleted_at IS NULL

UNION ALL

SELECT 
    'pharmacy' as entity_type,
    id,
    name,
    business_type as sub_type,
    territory,
    tier,
    phone,
    email,
    name as location_name, -- Pharmacies usually are their own location
    address,
    status,
    lat,
    lng,
    created_at
FROM pharmacies WHERE deleted_at IS NULL

UNION ALL

SELECT 
    'hospital' as entity_type,
    id,
    name,
    type as sub_type,
    territory,
    tier,
    phone,
    email,
    name as location_name,
    address,
    status,
    lat,
    lng,
    created_at
FROM hospitals WHERE deleted_at IS NULL;

-- 5. Directory Audit Log (Security & Oversight)
CREATE TABLE IF NOT EXISTS directory_audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'doctor', 'pharmacy', 'hospital'
    entity_id INTEGER,
    action VARCHAR(20), -- 'create', 'update', 'delete'
    changed_by_user_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dir_audit_entity ON directory_audit_logs (entity_type, entity_id);
