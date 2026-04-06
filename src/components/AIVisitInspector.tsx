import React, { useEffect, useState } from 'react';
import {
  Brain, TrendingUp, Users, Calendar, MapPin, Clock,
  CheckCircle2, AlertCircle, Loader2, Zap, BarChart3, X, Target, MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { geminiService } from '../services/geminiService';
import { VisitFrequencyAnalysis, VisitCommentAnalysis, AIForecast } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AIVisitInspectorProps {
  entityName: string;
  entityType: 'doctor' | 'chemist' | 'hospital' | 'clinic';
  entityTier?: string;
  entityTerritory?: string;
  entitySpecialty?: string;
  onClose: () => void;
}

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AIVisitInspector({
  entityName, entityType, entityTier, entityTerritory, entitySpecialty, onClose
}: AIVisitInspectorProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freqData, setFreqData] = useState<VisitFrequencyAnalysis | null>(null);
  const [commentData, setCommentData] = useState<VisitCommentAnalysis | null>(null);
  const [forecastData, setForecastData] = useState<AIForecast | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.visits.getAll(),
      api.recordings.getAll(),
      api.mrs.getAll(),
    ]).then(([v, r, m]) => {
      const entityVisits = v.filter(visit =>
        (visit.entity_name === entityName || visit.doctor_name === entityName)
      );
      const entityRecordings = r.filter(rec =>
        (rec.entityName === entityName || rec.entity_name === entityName)
      );
      setVisits(entityVisits);
      setRecordings(entityRecordings);
      setMrs(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [entityName]);

  useEffect(() => {
    if (loading) return;
    runAIAnalysis();
  }, [loading, visits]);

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const [freq, comments, forecast] = await Promise.all([
        geminiService.analyzeVisitFrequency(visits, entityName, entityType),
        geminiService.analyzeVisitComments(visits, entityName),
        geminiService.forecastEntityLead(
          { name: entityName, type: entityType, tier: entityTier || 'B', specialty: entitySpecialty },
          visits
        ),
      ]);
      setFreqData(freq);
      setCommentData(comments);
      setForecastData(forecast);
    } catch { /* silent */ }
    setAiLoading(false);
  };

  const handleQuickSchedule = async () => {
    if (!mrs.length) return;
    const matchedMr = entityTerritory
      ? mrs.find((m: any) => m.territory?.toLowerCase().includes(entityTerritory.toLowerCase())) || mrs[0]
      : mrs[0];
    const nextDate = freqData?.next_recommended_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    await api.visits.createSchedule({
      mr_id: matchedMr?.id,
      doctor_name: entityName,
      clinic: entityName,
      scheduled_date: nextDate,
      scheduled_time: '10:00',
      purpose: `AI-scheduled visit for ${entityName}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const sentimentData = commentData ? [
    { name: 'Engagement', value: commentData.engagement_score },
    { name: 'Remaining', value: 100 - commentData.engagement_score },
  ] : [];

  const visitTrendData = visits.length > 0
    ? visits.slice(-8).map(v => ({
        name: new Date(v.visit_date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        date: v.visit_date,
        hasNotes: !!(v.conversation_summary || v.notes),
        hasOrder: v.order_value > 0,
        orderValue: v.order_value || 0,
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 p-6 flex items-start justify-between rounded-t-2xl">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
              entityType === 'doctor' ? 'bg-blue-600' :
              entityType === 'hospital' ? 'bg-red-600' : 'bg-emerald-600'
            )}>
              {entityType === 'doctor' ? <Users size={24} /> :
               entityType === 'hospital' ? <BarChart3 size={24} /> : <MapPin size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{entityName}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                {entityTier && <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-bold">Tier {entityTier}</span>}
                {entityTerritory && <span className="flex items-center gap-1"><MapPin size={12} />{entityTerritory}</span>}
                {entitySpecialty && <span>{entitySpecialty}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Forecast Card */}
          {forecastData && (
            <motion.div className={cn(
              "p-5 rounded-xl border",
              forecastData.lead_status === 'hot' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
              forecastData.lead_status === 'warm' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' :
              'bg-gradient-to-br from-slate-50 to-white border-slate-200'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain size={20} className="text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">AI Lead Forecast</h3>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  forecastData.lead_status === 'hot' ? 'bg-green-600 text-white' :
                  forecastData.lead_status === 'warm' ? 'bg-amber-500 text-white' :
                  'bg-slate-300 text-slate-700'
                )}>{forecastData.lead_status} Lead — {forecastData.lead_probability}%</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{forecastData.reasoning}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Revenue Forecast</p>
                  <p className="text-lg font-bold text-slate-900">&#8377;{forecastData.revenue_forecast.toLocaleString()}/mo</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Confidence</p>
                  <p className="text-lg font-bold text-slate-900">{forecastData.confidence}%</p>
                  {forecastData.confidence < 50 && (
                    <p className="text-[9px] text-amber-500 mt-0.5 flex items-center gap-0.5 justify-center"><AlertCircle size={8} />Low data</p>
                  )}
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Risk Level</p>
                  <p className="text-lg font-bold text-slate-900">{forecastData.risk_factors.length}</p>
                </div>
              </div>
              {forecastData.recommended_actions.length > 0 && (
                <div className="mt-3 bg-white/60 rounded-lg p-3">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Next Steps:</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {forecastData.recommended_actions.map((a, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500 shrink-0" />{a}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Visit Frequency & Trend */}
          <div className="grid grid-cols-2 gap-4">
            {freqData && (
              <div className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-blue-600" /><h4 className="text-xs font-bold">Visit Frequency</h4></div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Total Visits</span><span className="font-bold">{freqData.total_visits}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last 30 Days</span><span className="font-bold">{freqData.visits_last_30_days}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last 90 Days</span><span className="font-bold">{freqData.visits_last_90_days}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Avg Gap</span><span className="font-bold">{freqData.avg_gap_between_visits} days</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Recommended</span><span className="font-bold text-blue-600 capitalize">{freqData.recommended_frequency}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    {freqData.is_overdue ? (
                      <span className="font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10} />Overdue</span>
                    ) : (
                      <span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={10} />On track</span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Trend:</span>{' '}
                    <span className={cn(
                      "font-bold",
                      freqData.trend === 'increasing' ? 'text-green-600' :
                      freqData.trend === 'decreasing' ? 'text-red-500' : 'text-slate-600'
                    )}>{freqData.trend}</span>
                  </div>
                  <button
                    onClick={handleQuickSchedule}
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Calendar size={12} /> Schedule Next Visit ({freqData.next_recommended_date})
                  </button>
                </div>
              </div>
            )}

            {/* Comment Analysis */}
            {commentData && (
              <div className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3"><MessageSquare size={16} className="text-emerald-600" /><h4 className="text-xs font-bold">Conversation Analysis</h4></div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sentiment</span>
                    <span className={cn(
                      "font-bold",
                      commentData.overall_sentiment === 'positive' ? 'text-green-600' :
                      commentData.overall_sentiment === 'negative' ? 'text-red-500' : 'text-amber-500'
                    )}>{commentData.overall_sentiment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trend</span>
                    <span className={cn(
                      "font-bold",
                      commentData.sentiment_trend === 'improving' ? 'text-green-600' :
                      commentData.sentiment_trend === 'declining' ? 'text-red-500' : 'text-slate-600'
                    )}>{commentData.sentiment_trend}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Engagement</span>
                    <span className="font-bold">{commentData.engagement_score}%</span>
                  </div>
                </div>
                <div className="h-[80px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} dataKey="value" cx="50%" cy="50%" outerRadius={30} label={false}>
                        <Cell fill="#10b981" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {commentData.key_concerns.length > 0 && (
                  <div className="mt-2 bg-slate-50 rounded p-2">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">KEY CONCERNS:</p>
                    {commentData.key_concerns.map((c, i) => <p key={i} className="text-[10px] text-slate-600">• {c}</p>)}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-2 italic">"{commentData.summary}"</p>
              </div>
            )}
            {!freqData && !commentData && (
              <div className="col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                {aiLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <p className="text-sm font-bold text-slate-600">Running AI analysis...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Brain size={32} className="text-slate-300" />
                    <p className="text-sm font-bold text-slate-400">No data for AI analysis</p>
                    <p className="text-xs text-slate-400">Complete a few visits with notes to enable AI insights</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visit Timeline Chart */}
          {visitTrendData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-blue-600" /><h4 className="text-xs font-bold">Visit Timeline</h4></div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="orderValue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    <BarChart data={visitTrendData}>
                      <Bar dataKey="hasOrder" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Visit Log */}
          {visits.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-slate-600" /><h4 className="text-xs font-bold">Visit Log ({visits.length})</h4></div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {visits.slice().reverse().map((v, i) => (
                  <div key={v.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                      v.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                    )}>{(v.visit_date || '').slice(5)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{v.visit_date || 'Unknown date'}</span>
                        {v.order_value > 0 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded">&#8377;{v.order_value}</span>}
                        <span className={cn("px-1.5 rounded text-[9px] font-bold uppercase",
                          v.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-500'
                        )}>{v.priority || 'normal'}</span>
                      </div>
                      {v.conversation_summary && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{v.conversation_summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recordings Summary */}
          {recordings.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-amber-500" /><h4 className="text-xs font-bold">Voice Recordings ({recordings.length})</h4></div>
              <div className="space-y-2">
                {recordings.slice(-5).map((r, i) => (
                  <div key={r.id || i} className="flex items-start gap-3 p-2 bg-amber-50 rounded-lg">
                    {r.isLead ? (
                      <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                      <X size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">{r.language?.toUpperCase()}</span>
                        <span className={cn("px-1.5 rounded text-[9px] font-bold",
                          r.status === 'approved' ? 'bg-green-100 text-green-700' :
                          r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        )}>{r.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{r.transcript?.slice(0, 100)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
