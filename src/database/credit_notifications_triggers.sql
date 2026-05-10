-- Trigger to increase outstanding balance when a sale is recorded
CREATE OR REPLACE FUNCTION increase_outstanding_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_found INTEGER;
BEGIN
    -- Try to find the matching entity credit record
    SELECT id INTO entity_id_found FROM entity_credits WHERE entity_name ILIKE NEW.customer_name LIMIT 1;
    
    IF FOUND THEN
        UPDATE entity_credits 
        SET outstanding = outstanding + NEW.amount,
            updated_at = NOW()
        WHERE id = entity_id_found;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increase_outstanding_on_sale ON sales;
CREATE TRIGGER trg_increase_outstanding_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION increase_outstanding_on_sale();

-- Trigger to create notifications when credit limit is breached or risk is critical
CREATE OR REPLACE FUNCTION check_credit_breach_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    risk_lvl VARCHAR(20);
    utilization_pct INTEGER;
BEGIN
    utilization_pct := ROUND((NEW.outstanding / NULLIF(NEW.credit_limit, 0)) * 100);
    
    -- Check for Limit Breach
    IF NEW.outstanding > NEW.credit_limit AND (OLD.outstanding <= OLD.credit_limit OR OLD.outstanding IS NULL) THEN
        -- Notify MR
        INSERT INTO notifications (user_id, user_role, type, title, message, action_url)
        VALUES (
            NEW.mr_id, 
            'mr', 
            'credit_breach', 
            '🚨 Credit Limit Breached: ' || NEW.entity_name,
            'Entity has exceeded its credit limit of ₹' || NEW.credit_limit || '. Current outstanding: ₹' || NEW.outstanding || '. Sales are now restricted.',
            '/credits'
        );
        
        -- Notify Admin (assuming user_id 1 is admin, or we can broadcast)
        -- For simplicity, let's insert one for 'admin' role users if we had a better link.
        -- In this system, notifications are fetched by role too.
        INSERT INTO notifications (user_role, type, title, message, action_url)
        VALUES (
            'admin', 
            'credit_breach', 
            '🚨 High Risk Breach: ' || NEW.entity_name,
            NEW.mr_name || '''s customer ' || NEW.entity_name || ' has breached their credit limit. Outstanding: ₹' || NEW.outstanding,
            '/credits'
        );
    END IF;
    
    -- Check for Critical Risk (e.g. 90% utilization)
    IF utilization_pct >= 90 AND utilization_pct < 100 AND (utilization_pct > (ROUND((OLD.outstanding / NULLIF(OLD.credit_limit, 0)) * 100)) OR OLD.outstanding IS NULL) THEN
        INSERT INTO notifications (user_id, user_role, type, title, message, action_url)
        VALUES (
            NEW.mr_id, 
            'mr', 
            'credit_warning', 
            '⚠️ High Utilization Warning: ' || NEW.entity_name,
            'Entity has reached ' || utilization_pct || '% of its credit limit. Advise collection soon to avoid blocking.',
            '/credits'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_credit_breach ON entity_credits;
CREATE TRIGGER trg_check_credit_breach
AFTER UPDATE OF outstanding ON entity_credits
FOR EACH ROW
EXECUTE FUNCTION check_credit_breach_and_notify();
