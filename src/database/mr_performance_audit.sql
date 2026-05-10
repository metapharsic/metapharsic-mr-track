-- Senior Audit Fix: Recalculate and Sync MR Performance Metrics
-- Ensuring consistency between transactional tables and MR summary stats

-- 1. Create a function to recalculate MR summary stats
CREATE OR REPLACE FUNCTION sync_mr_performance_stats(target_mr_id INTEGER)
RETURNS VOID AS $$
DECLARE
    total_sales_val DECIMAL(15,2);
    visits_count INTEGER;
    achieved_targets INTEGER;
    missed_targets INTEGER;
    new_performance_score INTEGER;
BEGIN
    -- Calculate from Sales table
    SELECT COALESCE(SUM(amount), 0) INTO total_sales_val FROM sales WHERE mr_id = target_mr_id;
    
    -- Calculate from Visit Schedules
    SELECT COUNT(*) INTO visits_count FROM visit_schedules WHERE mr_id = target_mr_id;
    
    -- Calculate from Targets table (Historical and current)
    -- A target is achieved if status is 'completed' AND achieved >= target OR if explicitly marked as 'achieved'
    SELECT COUNT(*) FILTER (WHERE (status = 'completed' AND achieved_value >= target_value) OR status = 'achieved') 
    INTO achieved_targets FROM targets WHERE mr_id = target_mr_id;
    
    SELECT COUNT(*) FILTER (WHERE (status = 'completed' AND achieved_value < target_value) OR status = 'missed') 
    INTO missed_targets FROM targets WHERE mr_id = target_mr_id;
    
    -- Managerial Logic for Performance Score (0-100)
    -- We use achieved targets as a base (60%) and visit consistency (40%)
    new_performance_score := LEAST(100, ROUND(
        (CASE WHEN achieved_targets + missed_targets > 0 
              THEN (achieved_targets::FLOAT / (achieved_targets + missed_targets)) * 70 
              ELSE 60 END) + 
        (LEAST(visits_count, 15)::FLOAT / 15 * 30)
    ));

    -- Sync back to MRs table
    UPDATE mrs 
    SET 
        total_sales = total_sales_val,
        targets_achieved = achieved_targets,
        targets_missed = missed_targets,
        performance_score = new_performance_score,
        updated_at = NOW()
    WHERE id = target_mr_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger to ensure MR summary stays in sync automatically
CREATE OR REPLACE FUNCTION trg_refresh_mr_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM sync_mr_performance_stats(OLD.mr_id);
    ELSE
        PERFORM sync_mr_performance_stats(NEW.mr_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply Triggers to relevant tables
DROP TRIGGER IF EXISTS trg_sync_sales ON sales;
CREATE TRIGGER trg_sync_sales AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION trg_refresh_mr_stats();

DROP TRIGGER IF EXISTS trg_sync_visits ON visit_schedules;
CREATE TRIGGER trg_sync_visits AFTER INSERT OR UPDATE OR DELETE ON visit_schedules
FOR EACH ROW EXECUTE FUNCTION trg_refresh_mr_stats();

DROP TRIGGER IF EXISTS trg_sync_targets ON targets;
CREATE TRIGGER trg_sync_targets AFTER INSERT OR UPDATE OR DELETE ON targets
FOR EACH ROW EXECUTE FUNCTION trg_refresh_mr_stats();

-- 4. Initial Sync for existing data
SELECT sync_mr_performance_stats(m.id) FROM mrs m;
