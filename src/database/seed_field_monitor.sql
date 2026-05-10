-- Add MR Location Tracking Table
CREATE TABLE IF NOT EXISTS mr_locations (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    activity_type VARCHAR(50) DEFAULT 'idle', -- 'idle', 'traveling', 'visiting'
    battery_level INTEGER DEFAULT 100,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for real-time lookups
CREATE INDEX IF NOT EXISTS idx_mr_locations_recorded_at ON mr_locations (recorded_at);
CREATE INDEX IF NOT EXISTS idx_mr_locations_mr_id ON mr_locations (mr_id);

-- Seed Today's Activity for Admin Field Monitor (May 9, 2026)

-- 1. Check in 5 MRs for today
INSERT INTO attendance (mr_id, date, check_in, status, lat, lng)
VALUES 
(1, '2026-05-09', '09:00 AM', 'present', 17.4483, 78.3915),
(2, '2026-05-09', '09:15 AM', 'present', 17.3850, 78.4867),
(3, '2026-05-09', '08:45 AM', 'present', 17.4065, 78.4691),
(4, '2026-05-09', '09:30 AM', 'present', 17.4399, 78.4983),
(5, '2026-05-09', '09:05 AM', 'present', 17.3616, 78.4747)
ON CONFLICT DO NOTHING;

-- 2. Add some live GPS points
INSERT INTO mr_locations (mr_id, lat, lng, activity_type, battery_level, recorded_at)
VALUES 
(1, 17.4500, 78.3900, 'visiting', 85, CURRENT_TIMESTAMP),
(2, 17.3900, 78.4900, 'traveling', 92, CURRENT_TIMESTAMP),
(3, 17.4100, 78.4700, 'idle', 78, CURRENT_TIMESTAMP),
(4, 17.4400, 78.5000, 'visiting', 65, CURRENT_TIMESTAMP),
(5, 17.3700, 78.4800, 'traveling', 88, CURRENT_TIMESTAMP);

-- 3. Log 3 completed visits for today
INSERT INTO visit_records (mr_id, entity_type, entity_name, purpose, conversation_summary, status, order_value, created_at)
VALUES 
(1, 'doctor', 'Dr. Suma Prasad', 'Product Presentation', 'Highly interested in new IVF range.', 'completed', 0, CURRENT_TIMESTAMP),
(4, 'pharmacy', 'Sri Vasavi Medical Hall', 'Stock Check', 'Low on stock for CardiCare.', 'completed', 15000, CURRENT_TIMESTAMP),
(2, 'hospital', 'Care Hospitals', 'Formulary Discussion', 'Discussed inclusion of Glynase-MF.', 'completed', 0, CURRENT_TIMESTAMP);

-- 4. Log 1 new Lead from today's visit
INSERT INTO leads (doctor_name, specialty, territory, priority, status, comments, assigned_mr_id, ai_generated, created_at)
VALUES 
('Dr. Suma Prasad', 'Gynaecology', 'Nacharam', 'high', 'new', 'AI Generated: High interest detected during today''s visit.', 1, true, CURRENT_TIMESTAMP);

-- 5. Sync MR summary stats (using the function we created earlier)
SELECT sync_mr_performance_stats(id) FROM mrs WHERE id IN (1, 2, 3, 4, 5);
