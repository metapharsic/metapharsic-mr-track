import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CompetitorMention, SentimentAnalysis, AIRecommendation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Target, Zap, Clock, AlertTriangle,
  MessageSquare, BarChart3, Loader2, CheckCircle2,
  XCircle, Minus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AIPerformanceMetrics {
  total_recommendations: number;
  adoption_rate: number;
  success_rate: number;
  conversion_rate: number;
  avg_time_to_action: number;
}

export default function AIPerformanceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AIPerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [competitorMentions, setCompetitorMentions] = useState<CompetitorMention[]>([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/ai-performance', { headers: { 'x-user-email': user?.email || '' } }).then(r => r.json()),
      fetch('/api/ai-recommendations', { headers: { 'x-user-email': user?.email || '' } }).then(r => r.json()),
      fetch('/api/competitor-mentions', { headers: { 'x-user-email': user?.email || '' } }).then(r => r.json()),
      fetch('/api/sentiment-analysis', { headers: { 'x-user-email': user?.email || '' } }).then(r => r.json())
    ]).then(([m, r, c, s]) => {
      setMetrics(m);
      setRecommendations(r);
      setCompetitorMentions(c);
      setSentimentAnalysis(s);
      setLoading(false);
    }).catch(err => {
      console.error('[AI Performance] Error loading data:', err);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Performance Dashboard</h1>
        <p className="text-gray-500">Track AI recommendation effectiveness and continuous improvement</p>
      </div>

      {/* AI Performance Metrics */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Adoption Rate */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 opacity-80" />
              <ArrowUpRight className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{metrics.adoption_rate}%</div>
            <div className="text-sm opacity-90">MR Adoption Rate</div>
            <div className="text-xs opacity-75 mt-1">
              {metrics.total_recommendations} recommendations made
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <TrendingUp className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{metrics.success_rate}%</div>
            <div className="text-sm opacity-90">Success Rate</div>
            <div className="text-xs opacity-75 mt-1">
              Positive outcomes achieved
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-8 h-8 opacity-80" />
              <ArrowUpRight className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{metrics.conversion_rate}%</div>
            <div className="text-sm opacity-90">Conversion Rate</div>
            <div className="text-xs opacity-75 mt-1">
              Leads converted to sales
            </div>
          </div>

          {/* Avg Time to Action */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 opacity-80" />
              <BarChart3 className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{metrics.avg_time_to_action}h</div>
            <div className="text-sm opacity-90">Avg Response Time</div>
            <div className="text-xs opacity-75 mt-1">
              Time to act on recommendations
            </div>
          </div>
        </motion.div>
      )}

      {/* Competitor Intelligence */}
      {competitorMentions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Competitor Intelligence ({competitorMentions.length})
          </h2>
          <div className="space-y-3">
            {competitorMentions.map((mention) => (
              <div key={mention.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{mention.competitor_product}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      mention.sentiment === 'opportunity' ? "bg-green-100 text-green-700" :
                      mention.sentiment === 'price_sensitive' ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {mention.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{mention.entity_name}</p>
                  <p className="text-xs text-gray-500">{mention.mention_context}</p>
                  <p className="text-xs text-gray-400 mt-1">{mention.visit_date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sentiment Analysis */}
      {sentimentAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Visit Sentiment Analysis ({sentimentAnalysis.length})
          </h2>
          <div className="space-y-3">
            {sentimentAnalysis.map((analysis) => (
              <div key={analysis.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{analysis.entity_name}</h3>
                    <p className="text-xs text-gray-500">{analysis.visit_date}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-2xl font-bold",
                      analysis.sentiment_score >= 80 ? "text-green-600" :
                      analysis.sentiment_score >= 60 ? "text-blue-600" :
                      "text-orange-600"
                    )}>
                      {analysis.sentiment_score}%
                    </div>
                    <p className="text-xs text-gray-500">Sentiment Score</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <div className="bg-white rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase">Tone</p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{analysis.tone}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase">Urgency</p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{analysis.urgency_level}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase">Emotion</p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{analysis.emotion_detected.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-[10px] text-gray-400 uppercase">Satisfaction</p>
                    <p className="text-sm font-semibold text-gray-700">{analysis.doctor_satisfaction}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {analysis.key_phrases.map((phrase, idx) => (
                    <span key={idx} className="bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Recommendations History */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            AI Recommendations History ({recommendations.length})
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                {rec.outcome === 'converted' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : rec.outcome === 'positive' ? (
                  <ArrowUpRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                ) : rec.mr_action_taken ? (
                  <Minus className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{rec.recommendation}</h3>
                    {rec.mr_action_taken && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                        Action Taken
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Type: {rec.recommendation_type.replace('_', ' ')}</p>
                  {rec.outcome_details && (
                    <p className="text-xs text-gray-500">{rec.outcome_details}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(rec.made_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
