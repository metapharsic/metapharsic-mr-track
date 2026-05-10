-- Net Territory Profitability Analytics View
-- Correlates Sales Revenue with Total Direct Costs (Salary + Allowance + Expenses)

CREATE OR REPLACE VIEW v_mr_profitability AS
WITH monthly_sales AS (
    SELECT 
        mr_id,
        SUM(amount) as revenue
    FROM sales
    WHERE date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
),
monthly_expenses AS (
    SELECT 
        mr_id,
        SUM(amount) as total_expenses
    FROM expenses
    WHERE status = 'approved' 
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
),
monthly_attendance AS (
    SELECT 
        mr_id,
        COUNT(DISTINCT date) as days_worked
    FROM attendance
    WHERE status = 'present'
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    GROUP BY mr_id
)
SELECT 
    m.id as mr_id,
    m.name as mr_name,
    m.territory,
    COALESCE(s.revenue, 0) as monthly_revenue,
    -- Total Costs = Base Salary + (Days Worked * Daily Allowance) + Field Expenses
    (
        m.base_salary + 
        (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
        COALESCE(e.total_expenses, 0)
    ) as total_costs,
    -- Breakdown
    m.base_salary,
    (COALESCE(a.days_worked, 0) * m.daily_allowance) as total_allowance,
    COALESCE(e.total_expenses, 0) as field_expenses,
    -- Net Profit
    (COALESCE(s.revenue, 0) - (
        m.base_salary + 
        (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
        COALESCE(e.total_expenses, 0)
    )) as net_profit,
    -- Profit Margin %
    CASE 
        WHEN COALESCE(s.revenue, 0) > 0 THEN 
            ROUND(((COALESCE(s.revenue, 0) - (
                m.base_salary + 
                (COALESCE(a.days_worked, 0) * m.daily_allowance) + 
                COALESCE(e.total_expenses, 0)
            )) / s.revenue) * 100, 1)
        ELSE -100 
    END as profit_margin_pct
FROM 
    mrs m
LEFT JOIN 
    monthly_sales s ON m.id = s.mr_id
LEFT JOIN 
    monthly_expenses e ON m.id = e.mr_id
LEFT JOIN 
    monthly_attendance a ON m.id = a.mr_id
WHERE 
    m.status = 'active';
