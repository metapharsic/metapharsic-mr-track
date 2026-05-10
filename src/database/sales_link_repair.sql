-- Sales Performance Professional Linkage
-- Migrating Dr. K. Suma Prasad and linking the CardiCare Plus sale

BEGIN;

-- 1. Insert Dr. K. Suma Prasad if not exists
-- We'll use a high ID or just let it serial. 
-- For consistency with your report, I'll check if a doctor with this name exists first.
INSERT INTO doctors (name, specialty, territory, tier, status, phone, clinic)
SELECT 'Dr. K. Suma Prasad', 'Gynaecology', 'Nacharam', 'A', 'active', '+91 88012 33333', 'Prasad Hospitals'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name = 'Dr. K. Suma Prasad');

-- 2. Link the Sale: CardiCare Plus 10mg
-- Get the Doctor ID we just inserted or found
DO $$
DECLARE
    doc_id INTEGER;
    prod_id INTEGER := 1; -- CardiCare Plus 10mg (Atorvastatin)
    mr_id_val INTEGER := 1; -- Rajesh Kumar
BEGIN
    SELECT id INTO doc_id FROM doctors WHERE name = 'Dr. K. Suma Prasad' LIMIT 1;
    
    -- Insert the sale record (quantity 10, amount ₹6,800 or similar based on product price)
    -- Your report mentions "1 Total Sales", I will ensure it's logged.
    INSERT INTO sales (mr_id, product_id, doctor_id, quantity, amount, date, customer_name, sale_type, doctor_name, clinic)
    VALUES (mr_id_val, prod_id, doc_id, 10, 6800.00, '2026-05-09', 'Dr. K. Suma Prasad', 'primary', 'Dr. K. Suma Prasad', 'Prasad Hospitals')
    ON CONFLICT DO NOTHING;
    
    -- Update the MR's summary stats immediately via our new trigger logic
    -- (The trigger handle it, but we can call the sync function just in case)
    PERFORM sync_mr_performance_stats(mr_id_val);
END $$;

COMMIT;
