-- Seed AI Performance Data from Mock Dataset

-- 1. AI Recommendations
INSERT INTO ai_recommendations (mr_id, lead_id, recommendation_type, recommendation, made_at, mr_action_taken, action_taken_at, outcome, outcome_details)
VALUES 
(1, 1, 'send_clinical_data', 'Send clinical data and samples for IVF products', '2026-04-09 10:30:00', true, '2026-04-09 14:00:00', 'positive', 'Doctor responded positively, scheduled follow-up'),
(2, 2, 'close_order', 'Confirm order delivery and schedule follow-up', '2026-04-09 11:15:00', true, '2026-04-09 11:20:00', 'converted', 'Order confirmed for ₹85,000')
ON CONFLICT DO NOTHING;

-- 2. Competitor Mentions
INSERT INTO competitor_mentions (mr_id, entity_name, competitor_product, mention_context, sentiment, visit_date, detected_at)
VALUES
(1, 'Dr. K. Suma Prasad', 'Cipla IVF Range', 'Doctor mentioned currently using Cipla''s IVF products but interested in switching', 'opportunity', '2026-04-09', '2026-04-09 10:30:00'),
(2, 'Dr. Sandeep Reddy', 'Sun Pharma CardiCare', 'Doctor compared our pricing with Sun Pharma''s offering', 'price_sensitive', '2026-04-09', '2026-04-09 11:15:00')
ON CONFLICT DO NOTHING;

-- 3. Sentiment Analysis
INSERT INTO sentiment_analysis (mr_id, entity_name, visit_date, overall_sentiment, sentiment_score, tone, urgency_level, emotion_detected, key_phrases, doctor_satisfaction, mr_confidence, analyzed_at)
VALUES
(1, 'Dr. K. Suma Prasad', '2026-04-09', 'positive', 78, 'professional', 'medium', 'interested', ARRAY['impressed with formulation', 'would like to try', 'send me samples'], 82, 85, '2026-04-09 10:35:00'),
(2, 'Dr. Sandeep Reddy', '2026-04-09', 'very_positive', 92, 'decisive', 'high', 'ready_to_buy', ARRAY['I''ll place an order', 'process it by next week'], 90, 95, '2026-04-09 11:20:00')
ON CONFLICT DO NOTHING;
