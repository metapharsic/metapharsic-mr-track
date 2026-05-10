-- AI Payment Risk Analytics View
-- Calculates risk scores based on utilization, payment recency, and status

CREATE OR REPLACE VIEW v_entity_credit_risk AS
WITH payment_stats AS (
    SELECT 
        entity_credit_id,
        COUNT(*) as total_payments,
        MAX(payment_date) as last_actual_payment,
        AVG(amount) as avg_payment_amount,
        -- Calculate avg days between payments if more than 1 payment exists
        CASE 
            WHEN COUNT(*) > 1 THEN 
                (MAX(payment_date) - MIN(payment_date))::numeric / (COUNT(*) - 1)
            ELSE NULL 
        END as avg_payment_gap_days
    FROM payments
    GROUP BY entity_credit_id
)
SELECT 
    ec.id,
    ec.entity_name,
    ec.entity_type,
    ec.mr_name,
    ec.credit_limit,
    ec.outstanding,
    ec.status,
    ec.last_payment_date,
    ec.payment_terms,
    ps.total_payments,
    ps.avg_payment_gap_days,
    -- Risk Score Calculation (0-100)
    ROUND(
        LEAST(100,
            -- Component 1: Utilization (Up to 40 points)
            (CASE WHEN ec.credit_limit > 0 THEN (ec.outstanding / ec.credit_limit) * 40 ELSE 0 END) +
            
            -- Component 2: Status (Up to 30 points)
            (CASE 
                WHEN ec.status = 'blocked' THEN 30
                WHEN ec.status = 'overdue' THEN 20
                ELSE 0 
            END) +
            
            -- Component 3: Payment Recency (Up to 30 points)
            (CASE 
                WHEN ec.last_payment_date IS NULL THEN 30
                WHEN (CURRENT_DATE - ec.last_payment_date) > 90 THEN 30
                WHEN (CURRENT_DATE - ec.last_payment_date) > 60 THEN 20
                WHEN (CURRENT_DATE - ec.last_payment_date) > 30 THEN 10
                ELSE 0 
            END)
        )
    ) as risk_score,
    -- Risk Level categorization
    CASE 
        WHEN ec.status = 'blocked' THEN 'Critical'
        WHEN (CASE WHEN ec.credit_limit > 0 THEN (ec.outstanding / ec.credit_limit) ELSE 0 END) > 0.9 THEN 'High'
        WHEN ec.status = 'overdue' THEN 'Elevated'
        ELSE 'Normal'
    END as risk_level
FROM 
    entity_credits ec
LEFT JOIN 
    payment_stats ps ON ec.id = ps.entity_credit_id;
