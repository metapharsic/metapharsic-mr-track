-- AI Growth Features Schema & Analytics Views

-- 1. AI Adoption Leaderboard View (Gamification)
-- Calculates how responsive and effective each MR is with AI recommendations
CREATE OR REPLACE VIEW v_ai_adoption_leaderboard AS
SELECT 
    m.id AS mr_id,
    m.name AS mr_name,
    COUNT(r.id) AS total_recommendations,
    COUNT(CASE WHEN r.mr_action_taken = true THEN 1 END) AS acted_recommendations,
    ROUND((COUNT(CASE WHEN r.mr_action_taken = true THEN 1 END)::numeric / NULLIF(COUNT(r.id), 0)) * 100, 2) AS adoption_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (r.action_taken_at - r.made_at))/3600), 2) AS avg_action_time_hours,
    COUNT(CASE WHEN r.outcome IN ('positive', 'converted') THEN 1 END) AS successful_outcomes
FROM 
    mrs m
LEFT JOIN 
    ai_recommendations r ON m.id = r.mr_id
GROUP BY 
    m.id, m.name
ORDER BY 
    adoption_rate DESC NULLS LAST, successful_outcomes DESC;


-- 2. At-Risk Entities View (Churn Alerts Analytics)
-- Identifies entities that have shown low satisfaction or competitor threats
CREATE OR REPLACE VIEW v_at_risk_entities AS
SELECT 
    sa.entity_name,
    sa.mr_id,
    m.name AS mr_name,
    sa.visit_date AS last_signal_date,
    'Low Satisfaction' AS risk_reason,
    sa.doctor_satisfaction AS risk_score,
    sa.key_phrases AS context
FROM 
    sentiment_analysis sa
JOIN 
    mrs m ON sa.mr_id = m.id
WHERE 
    sa.doctor_satisfaction < 50

UNION ALL

SELECT 
    cm.entity_name,
    cm.mr_id,
    m.name AS mr_name,
    cm.visit_date AS last_signal_date,
    'Competitor Threat' AS risk_reason,
    100 AS risk_score, -- High risk inherently
    ARRAY[cm.mention_context] AS context
FROM 
    competitor_mentions cm
JOIN 
    mrs m ON cm.mr_id = m.id
WHERE 
    cm.sentiment = 'threat';

-- 3. Extend Leads Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='ai_generated') THEN
        ALTER TABLE leads ADD COLUMN ai_generated BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='source_insight_id') THEN
        ALTER TABLE leads ADD COLUMN source_insight_id INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='source_insight_type') THEN
        ALTER TABLE leads ADD COLUMN source_insight_type VARCHAR(50); -- 'sentiment' or 'competitor'
    END IF;
END $$;
