-- Premium Upgrades for Metapharsic CRM
-- Adding support for real-time tracking, offline sync, and user preferences

-- 1. Location History (For Phase 3 Admin Monitoring & Heatmaps)
CREATE TABLE IF NOT EXISTS mr_locations (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  activity_type VARCHAR(50) DEFAULT 'idle', -- traveling, visiting, idle
  battery_level INTEGER,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Preferences (For Phase 1 Dark Mode & Haptics)
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'light';
ALTER TABLE users ADD COLUMN IF NOT EXISTS haptic_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;

-- 3. Offline Sync Queue (For Phase 2 Resilience)
CREATE TABLE IF NOT EXISTS sync_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  operation_type VARCHAR(50) NOT NULL, -- create_visit, check_in, expense_log
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP
);

-- 4. Geofence Events (For Phase 3 Smart Notifications)
CREATE TABLE IF NOT EXISTS geofence_events (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER REFERENCES mrs(id),
  entity_type VARCHAR(50), -- doctor, pharmacy, hospital
  entity_id INTEGER,
  event_type VARCHAR(20), -- enter, exit
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for real-time performance
CREATE INDEX IF NOT EXISTS idx_mr_locations_mr_id_time ON mr_locations(mr_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
