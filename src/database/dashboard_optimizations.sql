-- Optimization Migration for MR Performance Dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Ensure Indexes for Performance (Recommendation #2)
CREATE INDEX IF NOT EXISTS idx_doctors_territory_trgm ON doctors USING gin (territory gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pharmacies_territory_trgm ON pharmacies USING gin (territory gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hospitals_territory_trgm ON hospitals USING gin (territory gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_date_only ON visit_schedules (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visit_records_gps ON visit_records USING gin (check_in_gps);

-- 2. Materialized View for Monthly Metrics (Recommendation #1)
-- This view pre-calculates the core metrics per MR and per Month
CREATE MATERIALIZED VIEW IF NOT EXISTS mr_monthly_performance AS
WITH monthly_stats AS (
    SELECT 
        m.id as mr_id,
        m.name as mr_name,
        m.territory,
        date_trunc('month', s.scheduled_date) as metric_month,
        COUNT(s.id) as total_scheduled,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_status_count,
        -- Geo-fenced Reach: Completed + GPS match (within ~200m)
        COUNT(DISTINCT CASE 
            WHEN s.status = 'completed' AND r.id IS NOT NULL 
            AND (
                -- Haversine formula approximation in SQL
                6371000 * acos(
                    cos(radians(COALESCE((d.lat)::float, (p.lat)::float, (h.lat)::float))) * 
                    cos(radians((r.check_in_gps->>'lat')::float)) * 
                    cos(radians((r.check_in_gps->>'lng')::float) - radians(COALESCE((d.lng)::float, (p.lng)::float, (h.lng)::float))) + 
                    sin(radians(COALESCE((d.lat)::float, (p.lat)::float, (h.lat)::float))) * 
                    sin(radians((r.check_in_gps->>'lat')::float))
                ) <= 200 -- 200 meters threshold
            ) THEN s.id END
        ) as geofenced_reach
    FROM 
        mrs m
    LEFT JOIN visit_schedules s ON m.id = s.mr_id
    LEFT JOIN visit_records r ON s.id = r.scheduled_visit_id
    LEFT JOIN doctors d ON s.doctor_id = d.id AND s.entity_type = 'doctor'
    LEFT JOIN pharmacies p ON s.pharmacy_id = p.id AND s.entity_type = 'pharmacy'
    LEFT JOIN hospitals h ON s.hospital_id = h.id AND s.entity_type = 'hospital'
    GROUP BY 
        m.id, m.name, m.territory, date_trunc('month', s.scheduled_date)
)
SELECT 
    *,
    CASE 
        WHEN total_scheduled > 0 THEN ROUND((geofenced_reach::float / total_scheduled::float) * 100)
        ELSE 0 
    END as conversion_rate
FROM monthly_stats;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mr_monthly_perf_unique ON mr_monthly_performance (mr_id, metric_month);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION refresh_mr_monthly_performance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mr_monthly_performance;
END;
$$ LANGUAGE plpgsql;
