import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Clock, TrendingUp, Navigation, Zap, Calendar } from 'lucide-react';

export interface BriefingItem {
  rank: number;
  id: number;
  doctor_name: string;
  clinic: string;
  specialty: string;
  tier: 'A' | 'B' | 'C';
  territory: string;
  scheduled_time: string;
  scheduled_date: string;
  lat?: number;
  lng?: number;
  ai_score: number;
  ai_reasoning: string;
  expected_order: number;
  distance_from_previous: number;
  visit_window_match: boolean;
}

export interface DailyBriefing {
  date: string;
  mr_id: number;
  schedule: BriefingItem[];
  total_expected_value: number;
  total_travel_km: number;
  optimized_route_percentage: number;
  generated_at: string;
  message?: string;
}

interface MorningBriefingModalProps {
  briefing: DailyBriefing | null;
  isOpen: boolean;
  onClose: () => void;
  onStartNavigation: (item: BriefingItem) => void;
}

export default function MorningBriefingModal({
  briefing,
  isOpen,
  onClose,
  onStartNavigation
}: MorningBriefingModalProps) {
  if (!briefing) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-slate-500';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="text-yellow-300" size={28} fill="currentColor" />
                    Your AI-Optimized Day
                  </h2>
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(briefing.date)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-8 py-6 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="text-blue-600" size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Visits Scheduled</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{briefing.schedule.length}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Expected Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(briefing.total_expected_value)}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <MapPin className="text-amber-600" size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Travel Distance</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{briefing.total_travel_km} km</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="text-purple-600" size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Route Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">+{briefing.optimized_route_percentage}%</p>
                  <p className="text-xs text-slate-500">vs chronological</p>
                </div>
              </div>
            </div>

            {/* Schedule List */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {briefing.schedule.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="mx-auto mb-4 opacity-50" size={48} />
                  <p className="text-lg font-semibold">No visits scheduled for today</p>
                  <p className="text-sm">Enjoy your day or add new visits from the schedule page.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Optimized Visit Order</h3>

                  {briefing.schedule.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {item.rank}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-slate-900">{item.doctor_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getTierColor(item.tier)}`}>
                              Tier {item.tier}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin size={12} />
                              {item.territory}
                            </span>
                          </div>

                          <p className="text-blue-600 font-medium mb-1">{item.clinic}</p>
                          <p className="text-sm text-slate-500 mb-3">{item.specialty}</p>

                          {/* AI Score & Reasoning */}
                          <div className="bg-slate-50 rounded-xl p-4 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-slate-700">AI Recommendation Score</span>
                              <span className={`text-lg font-bold ${getScoreColor(item.ai_score)}`}>
                                {item.ai_score}/100
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 italic">"{item.ai_reasoning}"</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500 block">Time</span>
                              <span className="font-semibold text-slate-900 flex items-center gap-1">
                                <Clock size={14} />
                                {item.scheduled_time}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Expected Order</span>
                              <span className="font-semibold text-green-700">{formatCurrency(item.expected_order)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">From Previous</span>
                              <span className="font-semibold text-slate-900">
                                {item.distance_from_previous > 0 ? `${item.distance_from_previous} km` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Time Window</span>
                              <span className={`font-semibold ${item.visit_window_match ? 'text-green-600' : 'text-amber-600'}`}>
                                {item.visit_window_match ? '✓ Matched' : '⚠ Off-window'}
                              </span>
                            </div>
                          </div>

                          {/* Navigation Button */}
                          <div className="mt-4">
                            <button
                              onClick={() => onStartNavigation(item)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                              <Navigation size={18} />
                              Start Navigation
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                💡 <strong>Tip:</strong> Follow the optimized order to minimize travel time and maximize productivity.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
