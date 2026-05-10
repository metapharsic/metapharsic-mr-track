-- Auto-Pilot Visit Generation Migration
-- Proactively creates visits based on frequency and history

BEGIN;

-- 1. Add missing columns to Pharmacies and Hospitals
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS visit_frequency INTEGER DEFAULT 14;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS last_visit DATE;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS visit_frequency INTEGER DEFAULT 7;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS last_visit DATE;

-- 2. Create Procedure for Auto-Pilot Generation
CREATE OR REPLACE FUNCTION proc_generate_auto_pilot_visits_v2()
RETURNS INTEGER AS $$
DECLARE
    entity_row RECORD;
    new_visits_count INTEGER := 0;
    assigned_mr_id INTEGER;
    target_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
    -- Loop through all entities in the unified directory
    FOR entity_row IN 
        SELECT entity_type, id, name, territory, tier, status, last_visit, visit_frequency
        FROM v_healthcare_directory_unified
        WHERE status = 'active'
    LOOP
        -- Logic: If (Today - last_visit) >= frequency OR last_visit is NULL
        IF entity_row.last_visit IS NULL OR (CURRENT_DATE - entity_row.last_visit) >= entity_row.visit_frequency THEN

            -- Check if a pending visit already exists for this entity to avoid duplicates
            IF NOT EXISTS (
                SELECT 1 FROM visit_schedules
                WHERE status = 'pending'
                AND (
                    (entity_type = 'doctor' AND doctor_id = entity_row.id) OR
                    (entity_type = 'pharmacy' AND pharmacy_id = entity_row.id) OR
                    (entity_type = 'hospital' AND hospital_id = entity_row.id)
                )
            ) THEN

                -- Find the primary MR for this territory (matching territory string)
                SELECT id INTO assigned_mr_id FROM mrs
                WHERE territory ILIKE '%' || entity_row.territory || '%'
                LIMIT 1;

                assigned_mr_id := COALESCE(assigned_mr_id, 1);

                -- Determine next available time slot for this MR on the target date
                DECLARE
                    next_slot_time TIME := '09:00:00'::TIME;
                    slot_found BOOLEAN := false;
                BEGIN
                    -- Find the first available 1-hour slot starting from 09:00 AM
                    -- Limit to 10 slots per day (up to 19:00)
                    FOR i IN 0..10 LOOP
                        IF NOT EXISTS (
                            SELECT 1 FROM visit_schedules 
                            WHERE mr_id = assigned_mr_id 
                            AND scheduled_date = target_date 
                            AND scheduled_time::TIME = next_slot_time
                        ) THEN
                            slot_found := true;
                            EXIT;
                        END IF;
                        next_slot_time := next_slot_time + INTERVAL '1 hour';
                    END LOOP;

                    -- If day is full, push to the next day (optional, but for now let's just use the last slot if full)
                    -- Insert new auto-generated visit
                    INSERT INTO visit_schedules (
                        mr_id, doctor_name, clinic, scheduled_date, scheduled_time,
                        purpose, priority, notes, ai_generated,
                        doctor_id, pharmacy_id, hospital_id, entity_type,
                        tier, territory, auto_assigned
                    )
                    VALUES (
                        assigned_mr_id,
                        entity_row.name,
                        entity_row.name,
                        target_date,
                        TO_CHAR(next_slot_time, 'HH24:MI'),
                        'Auto-Pilot: Frequency-based Routine Visit',
                        CASE WHEN entity_row.tier = 'A' THEN 'high' ELSE 'medium' END,
                        'System generated based on ' || entity_row.visit_frequency || ' day cycle.',
                        true,
                        CASE WHEN entity_row.entity_type = 'doctor' THEN entity_row.id ELSE NULL END,
                        CASE WHEN entity_row.entity_type = 'pharmacy' THEN entity_row.id ELSE NULL END,
                        CASE WHEN entity_row.entity_type = 'hospital' THEN entity_row.id ELSE NULL END,
                        entity_row.entity_type,
                        entity_row.tier,
                        entity_row.territory,
                        true
                    );
                    
                    new_visits_count := new_visits_count + 1;
                END;
            END IF;
        END IF;
    END LOOP;

    RETURN new_visits_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Update Unified View to include the new columns
CREATE OR REPLACE VIEW v_healthcare_directory_unified AS
SELECT 
    'doctor' as entity_type, id, name, specialty as sub_type, territory, tier, phone, email, clinic as location_name, address, status, lat, lng, created_at, last_visit, visit_frequency
FROM doctors WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'pharmacy' as entity_type, id, name, business_type as sub_type, territory, tier, phone, email, name as location_name, address, status, lat, lng, created_at, last_visit, visit_frequency
FROM pharmacies WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'hospital' as entity_type, id, name, type as sub_type, territory, tier, phone, email, name as location_name, address, status, lat, lng, created_at, last_visit, visit_frequency
FROM hospitals WHERE deleted_at IS NULL;

COMMIT;
