-- AI Conversion ROI Analytics View
-- Analyzes the relationship between visits and subsequent sales

CREATE OR REPLACE VIEW v_sales_roi_analytics AS
WITH visit_summary AS (
    SELECT 
        mr_id,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN sale_done = true THEN 1 END) as reported_conversions
    FROM visit_records
    GROUP BY mr_id
),
sales_summary AS (
    SELECT 
        mr_id,
        COUNT(*) as total_sales_records,
        COUNT(visit_id) as linked_sales,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN visit_id IS NOT NULL THEN amount ELSE 0 END) as visit_driven_revenue
    FROM sales
    GROUP BY mr_id
)
SELECT 
    m.id as mr_id,
    m.name as mr_name,
    m.territory,
    COALESCE(vs.total_visits, 0) as total_visits,
    COALESCE(ss.total_revenue, 0) as total_revenue,
    COALESCE(ss.visit_driven_revenue, 0) as visit_driven_revenue,
    -- ROI Metrics
    CASE 
        WHEN COALESCE(vs.total_visits, 0) > 0 THEN 
            ROUND(COALESCE(ss.visit_driven_revenue, 0) / vs.total_visits)
        ELSE 0 
    END as revenue_per_visit,
    CASE 
        WHEN COALESCE(vs.total_visits, 0) > 0 THEN 
            ROUND((COALESCE(ss.linked_sales, 0)::numeric / vs.total_visits) * 100, 1)
        ELSE 0 
    END as conversion_rate_pct,
    -- Efficiency Score (0-100)
    ROUND(
        LEAST(100,
            (CASE WHEN COALESCE(vs.total_visits, 0) > 0 THEN (COALESCE(ss.linked_sales, 0)::numeric / vs.total_visits) * 70 ELSE 0 END) +
            (CASE WHEN COALESCE(ss.total_revenue, 0) > 0 THEN (COALESCE(ss.visit_driven_revenue, 0) / ss.total_revenue) * 30 ELSE 0 END)
        )
    ) as efficiency_score
FROM 
    mrs m
LEFT JOIN 
    visit_summary vs ON m.id = vs.mr_id
LEFT JOIN 
    sales_summary ss ON m.id = ss.mr_id
WHERE 
    m.status = 'active';
