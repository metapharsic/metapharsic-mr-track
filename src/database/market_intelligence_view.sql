-- Market War Room Intelligence View
-- Aggregates field sentiment and competitor mentions by territory
-- Senior Fix: Using MR_ID for joins since visit_record_id is not in competitor_mentions

CREATE OR REPLACE VIEW v_market_intelligence AS
WITH territory_sentiment AS (
    SELECT 
        m.territory,
        AVG(CASE 
            WHEN v.sentiment = 'positive' THEN 100
            WHEN v.sentiment = 'neutral' THEN 50
            WHEN v.sentiment = 'negative' THEN 0
            ELSE 50 END
        ) as avg_sentiment_score,
        COUNT(v.id) as total_analyzed_visits
    FROM visit_records v
    JOIN mrs m ON v.mr_id = m.id
    WHERE v.created_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory
),
territory_competitors AS (
    SELECT 
        m.territory,
        c.competitor_product as competitor_name,
        COUNT(*) as mention_count
    FROM competitor_mentions c
    JOIN mrs m ON c.mr_id = m.id
    WHERE c.detected_at > (NOW() - INTERVAL '30 days')
    GROUP BY m.territory, c.competitor_product
),
top_competitor AS (
    SELECT DISTINCT ON (territory)
        territory,
        competitor_name,
        mention_count
    FROM territory_competitors
    ORDER BY territory, mention_count DESC
)
SELECT 
    ts.territory,
    ROUND(COALESCE(ts.avg_sentiment_score, 50)) as sentiment_score,
    COALESCE(ts.total_analyzed_visits, 0) as total_analyzed_visits,
    COALESCE(tc.competitor_name, 'None Detected') as main_competitor,
    COALESCE(tc.mention_count, 0) as competitor_mentions,
    CASE 
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 70 THEN 'Dominant'
        WHEN COALESCE(ts.avg_sentiment_score, 50) >= 40 THEN 'Competitive'
        ELSE 'Under Pressure'
    END as market_status,
    CASE 
        WHEN COALESCE(tc.mention_count, 0) > 5 THEN 'High Alert'
        WHEN COALESCE(tc.mention_count, 0) > 2 THEN 'Monitoring'
        ELSE 'Stable'
    END as competitor_threat_level
FROM 
    territory_sentiment ts
LEFT JOIN 
    top_competitor tc ON ts.territory = tc.territory;
