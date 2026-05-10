-- Professional Data Linkage for Rajesh Kumar (MR ID: 1)
-- Syncing 14 detailed logs and sales data as per senior management requirement

BEGIN;

-- 1. Ensure Sales are linked (₹5,000 and ₹15,000)
INSERT INTO sales (mr_id, product_id, doctor_id, quantity, amount, date, customer_name, sale_type, doctor_name, clinic)
VALUES (1, 1, 10, 50, 5000.00, '2026-05-08', 'Dr. V. Prasad', 'primary', 'Dr. V. Prasad', 'Whitus Hospitals')
ON CONFLICT DO NOTHING;

INSERT INTO sales (mr_id, product_id, customer_name, quantity, amount, date, sale_type)
VALUES (1, 1, 'Sri Vasavi Medical Hall', 150, 15000.00, '2026-03-28', 'pharmacy_order')
ON CONFLICT DO NOTHING;

-- 2. Professionalize Visit Records
-- Match by entity_name and created_at::date

-- Record 1: Dr. V. Prasad (5/8/2026)
UPDATE visit_records SET order_value = 5000, conversation_summary = 'Discussed CardiCare efficacy and stock requirements. Order for 50 units placed.', purpose = 'Clinical Discussion'
WHERE mr_id = 1 AND entity_name = 'Dr. V. Prasad' AND created_at::date = '2026-05-08';

-- Record 2: Dr. Vikram Singh (5/8/2026)
UPDATE visit_records SET conversation_summary = 'Discussed CardiCare efficacy and stock requirements. Order for 50 units placed.', purpose = 'Clinical Discussion'
WHERE mr_id = 1 AND entity_name = 'Dr. Vikram Singh' AND created_at::date = '2026-05-08';

-- Record 3: Sri Vasavi Medical Hall (5/8/2026)
UPDATE visit_records SET conversation_summary = 'Stock for CardiCare is low. They need a fresh supply by Monday.', purpose = 'Stock check and order collection'
WHERE mr_id = 1 AND entity_name = 'Sri Vasavi Medical Hall' AND created_at::date = '2026-05-08';

-- Insert Missing Historical Logs (March 2026)
INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'pharmacy', 'Sri Vasavi Medical Hall', '2026-03-30 11:30:00', 'Stock check and order collection', 'Stock for CardiCare is low. They need a fresh supply by Monday.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'Sri Vasavi Medical Hall' AND created_at::date = '2026-03-30');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'pharmacy', 'City Pharmacy', '2026-03-29 11:30:00', 'Stock check and order collection', 'Stock for CardiCare is low. They need a fresh supply by Monday.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'City Pharmacy' AND created_at::date = '2026-03-29');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'clinic', 'LifeSpring Hospital (OPD)', '2026-03-29 10:30:00', 'Follow up on Gynaecology range', 'Dr. Lakshmi requested more samples of OrthoFlex for her elderly patients.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'LifeSpring Hospital (OPD)' AND created_at::date = '2026-03-29');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'hospital', 'Metro General Hospital', '2026-03-29 14:00:00', 'New formulary introduction', 'Discussed Glynase-MF inclusion in the hospital formulary.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'Metro General Hospital' AND created_at::date = '2026-03-29');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'hospital', 'Prasad Hospitals', '2026-03-28 14:00:00', 'Meeting with Purchase Manager', 'Discussed bulk procurement for the cardiology department.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'Prasad Hospitals' AND created_at::date = '2026-03-28');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'chemist', 'Sri Vasavi Medical Hall', '2026-03-28 11:30:00', 'Stock check and order collection', 'Stock for CardiCare is low. They need a fresh supply by Monday.', 'completed', 15000
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'Sri Vasavi Medical Hall' AND created_at::date = '2026-03-28');

INSERT INTO visit_records (mr_id, entity_type, entity_name, created_at, purpose, conversation_summary, status, order_value)
SELECT 1, 'doctor', 'Dr. Ramesh Sharma', '2026-03-28 10:00:00', 'Product presentation', 'Dr. Ramesh was impressed with the clinical data.', 'completed', 0
WHERE NOT EXISTS (SELECT 1 FROM visit_records WHERE mr_id = 1 AND entity_name = 'Dr. Ramesh Sharma' AND created_at::date = '2026-03-28');

COMMIT;
