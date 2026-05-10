-- AI Performance Dashboard Schema
-- Professional tracking for AI recommendations, competitor intelligence, and sentiment

-- 1. Competitor Mentions/Intelligence
CREATE TABLE IF NOT EXISTS competitor_mentions (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    entity_name VARCHAR(255),
    competitor_product VARCHAR(255),
    mention_context TEXT,
    sentiment VARCHAR(50), -- opportunity, threat, price_sensitive
    visit_date DATE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Detailed Sentiment Analysis (Extended from visit_records)
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    visit_record_id INTEGER REFERENCES visit_records(id),
    entity_name VARCHAR(255),
    visit_date DATE,
    overall_sentiment VARCHAR(50),
    sentiment_score INTEGER, -- 0-100
    tone VARCHAR(100), -- professional, aggressive, casual
    urgency_level VARCHAR(50), -- low, medium, high
    emotion_detected VARCHAR(100), -- interested, skeptical, frustrated
    key_phrases TEXT[], -- array of key snippets
    doctor_satisfaction INTEGER, -- 0-100
    mr_confidence INTEGER, -- 0-100
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI Recommendations Tracking
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    lead_id INTEGER REFERENCES leads(id),
    recommendation_type VARCHAR(100),
    recommendation TEXT,
    made_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mr_action_taken BOOLEAN DEFAULT false,
    action_taken_at TIMESTAMP,
    outcome VARCHAR(100), -- positive, negative, converted, pending
    outcome_details TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_mr_id ON competitor_mentions(mr_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_mr_id ON ai_recommendations(mr_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_visit_record ON sentiment_analysis(visit_record_id);
