-- AI Visit Prioritization Engine View
-- Calculates dynamic priority scores for every entity in a territory

CREATE OR REPLACE VIEW v_visit_priority AS
WITH last_visits AS (
    SELECT 
        entity_name,
        MAX(created_at) as last_visit_date,
        COUNT(*) as total_visits_30d
    FROM visit_records
    WHERE created_at > (NOW() - INTERVAL '30 days')
    GROUP BY entity_name
),
entity_sales AS (
    SELECT 
        customer_name as entity_name,
        SUM(amount) as sales_30d,
        COUNT(*) as orders_30d
    FROM sales
    WHERE date > (CURRENT_DATE - INTERVAL '30 days')
    GROUP BY customer_name
),
unified_entities AS (
    SELECT name as entity_name, territory, entity_type, tier FROM doctors
    UNION ALL
    SELECT name as entity_name, territory, 'pharmacy' as entity_type, tier FROM pharmacies
    UNION ALL
    SELECT name as entity_name, territory, 'hospital' as entity_type, tier FROM hospitals
)
SELECT 
    ue.entity_name,
    ue.territory,
    ue.entity_type,
    ue.tier,
    lv.last_visit_date,
    COALESCE(EXTRACT(DAY FROM (NOW() - lv.last_visit_date)), 30) as days_since_visit,
    COALESCE(es.sales_30d, 0) as sales_30d,
    COALESCE(cr.risk_score, 0) as credit_risk_score,
    -- Priority Score Calculation (0-100)
    ROUND(
        LEAST(100,
            -- Component 1: Visit Gap (Up to 40 pts)
            -- Higher points if not visited for a long time
            (CASE 
                WHEN lv.last_visit_date IS NULL THEN 40
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 21 THEN 40
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 14 THEN 30
                WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 7 THEN 15
                ELSE 0 
            END) +
            
            -- Component 2: Sales Velocity (Up to 30 pts)
            -- High value customers need more frequent maintenance
            (CASE 
                WHEN es.sales_30d > 100000 THEN 30
                WHEN es.sales_30d > 50000 THEN 20
                WHEN es.sales_30d > 10000 THEN 10
                ELSE 5 
            END) +
            
            -- Component 3: Credit Risk (Up to 30 pts)
            -- High risk or overdue entities need collection visits
            (cr.risk_score * 0.3)
        )
    ) as priority_score,
    -- Recommendation Logic
    CASE 
        WHEN cr.risk_score > 70 THEN 'Immediate Collection Required'
        WHEN es.sales_30d > 50000 AND COALESCE(EXTRACT(DAY FROM (NOW() - lv.last_visit_date)), 30) > 10 THEN 'High Value Retention'
        WHEN lv.last_visit_date IS NULL THEN 'New Entity Onboarding'
        WHEN EXTRACT(DAY FROM (NOW() - lv.last_visit_date)) > 20 THEN 'Lapsed Customer Recovery'
        ELSE 'Routine Relationship Maintenance'
    END as ai_recommendation
FROM 
    unified_entities ue
LEFT JOIN 
    last_visits lv ON ue.entity_name = lv.entity_name
LEFT JOIN 
    entity_sales es ON ue.entity_name = es.entity_name
LEFT JOIN 
    v_entity_credit_risk cr ON ue.entity_name = cr.entity_name;
