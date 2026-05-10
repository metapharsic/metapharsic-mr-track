-- Full Autonomy AI Assignment Schema
-- Tracks and audits every automated decision made by the AI engine

-- 1. Extend Visit Schedules for AI Tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visit_schedules' AND column_name='auto_assigned') THEN
        ALTER TABLE visit_schedules ADD COLUMN auto_assigned BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visit_schedules' AND column_name='ai_reasoning') THEN
        ALTER TABLE visit_schedules ADD COLUMN ai_reasoning TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visit_schedules' AND column_name='assignment_score') THEN
        ALTER TABLE visit_schedules ADD COLUMN assignment_score INTEGER;
    END IF;
END $$;

-- 2. Create AI Assignment Logs for Audit
CREATE TABLE IF NOT EXISTS ai_assignment_logs (
    id SERIAL PRIMARY KEY,
    visit_schedule_id INTEGER REFERENCES visit_schedules(id),
    previous_mr_id INTEGER REFERENCES mrs(id),
    assigned_mr_id INTEGER REFERENCES mrs(id),
    match_score INTEGER,
    reasoning TEXT,
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'success' -- 'success', 'failed', 'skipped'
);

-- Index for management reports
CREATE INDEX IF NOT EXISTS idx_ai_logs_execution ON ai_assignment_logs (execution_time);
CREATE INDEX IF NOT EXISTS idx_ai_logs_mr ON ai_assignment_logs (assigned_mr_id);

-- 3. Optimization View: Currently Available MRs
-- Shows real-time candidate pool for the automation engine
CREATE OR REPLACE VIEW v_available_mr_pool AS
SELECT 
    m.id,
    m.name,
    m.territory,
    l.lat,
    l.lng,
    l.activity_type,
    l.battery_level,
    l.recorded_at as last_seen
FROM 
    mrs m
JOIN 
    attendance a ON m.id = a.mr_id
JOIN 
    mr_locations l ON m.id = l.mr_id
WHERE 
    a.date = CURRENT_DATE 
    AND a.check_out IS NULL
    AND l.recorded_at > (NOW() - INTERVAL '30 minutes')
    AND m.status = 'active';
