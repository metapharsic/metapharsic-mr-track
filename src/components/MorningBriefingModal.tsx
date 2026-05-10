import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { X, MapPin, Clock, TrendingUp, Navigation, Zap, Calendar, Sparkles, Target, ChevronRight, Activity, Battery, User } from 'lucide-react';

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
  is_ai_injected?: boolean;
  ai_reason?: string;
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
  onStartVisit?: (item: BriefingItem) => void;
}

export default function MorningBriefingModal({
  briefing,
  isOpen,
  onClose,
  onStartNavigation,
  onStartVisit
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
      case 'A': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'B': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'C': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-slate-400';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Navigation Bar (Glass effect) */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Sparkles size={20} className="text-white" fill="white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Intelligence Briefing</h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{formatDate(briefing.date)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Main Bento Grid Header */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Large Welcome Tile */}
                <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-200">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
                        Ready for Field
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight mb-4">
                      Good Morning,<br />
                      <span className="text-indigo-200">You have {briefing.schedule.length} high-impact visits today.</span>
                    </h2>
                    <p className="text-indigo-100/80 text-sm max-w-xs mb-8">
                      We've optimized your route to maximize revenue potential while saving {briefing.total_travel_km}km of travel.
                    </p>
                    
                    <button 
                      onClick={() => onStartVisit && briefing.schedule[0] && onStartVisit(briefing.schedule[0])}
                      className="group/btn flex items-center gap-3 bg-white text-indigo-700 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg"
                    >
                      <Zap size={18} fill="currentColor" />
                      Start First Visit
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                  <Sparkles className="absolute top-8 right-8 text-white/20 animate-pulse" size={120} />
                </div>

                {/* KPI Tiles */}
                <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 group hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Target size={24} />
                    </div>
                    <TrendingUp className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Target Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(briefing.total_expected_value)}</p>
                </div>

                <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 group hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                      <Navigation size={24} />
                    </div>
                    <Activity className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Travel Load</p>
                  <p className="text-2xl font-bold text-slate-900">{briefing.total_travel_km} <span className="text-sm font-medium text-slate-400">km</span></p>
                </div>

                {/* Secondary Info Tiles */}
                <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100 md:col-span-1 group hover:border-indigo-300 transition-all">
                   <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <Activity size={20} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Route Efficiency</p>
                  <p className="text-xl font-bold text-slate-900">+{briefing.optimized_route_percentage}% <span className="text-[10px] text-slate-400 font-medium">VS BASE</span></p>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 group hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                      <Battery size={20} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Battery</p>
                  <p className="text-xl font-bold text-slate-900">92% <span className="text-[10px] text-emerald-500 font-bold">STABLE</span></p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="px-8 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Strategic Visit Sequence</h3>
                    <p className="text-sm text-slate-500">Ordered by AI potential and location proximity</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 flex items-center gap-2">
                    <Clock size={14} />
                    09:00 AM START
                  </div>
                </div>

                <div className="space-y-4">
                  {briefing.schedule.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative"
                    >
                      {/* Connection Line */}
                      {index < briefing.schedule.length - 1 && (
                        <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-dashed border-l-2 border-dashed border-slate-200 z-0 h-[calc(100%+1rem)]" />
                      )}

                      <div className="relative z-10 bg-white rounded-3xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col md:flex-row gap-6">
                        {/* Order Bubble */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                          <span className="text-lg font-black">{item.rank}</span>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.doctor_name}</h4>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getTierColor(item.tier)}`}>
                                  Tier {item.tier}
                                </span>
                                {item.is_ai_injected && (
                                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm shadow-amber-200">
                                    <Sparkles size={8} fill="white" /> AI RE-INJECTED
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="font-semibold text-indigo-500">{item.clinic}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{item.specialty}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected</p>
                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.expected_order)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Arrival</p>
                                <p className="text-sm font-bold text-slate-900">{item.scheduled_time}</p>
                              </div>
                            </div>
                          </div>

                          {/* AI Insight Box */}
                          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 mb-4 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={14} className="text-indigo-500" />
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI Intelligence</span>
                              <div className="ml-auto flex items-center gap-1">
                                <span className={`text-xs font-bold ${getScoreColor(item.ai_score)}`}>{item.ai_score}</span>
                                <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              {item.is_ai_injected ? item.ai_reason : item.ai_reasoning}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onStartNavigation(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                              <Navigation size={14} />
                              Open Maps
                            </button>
                            <button
                              onClick={() => onStartVisit && onStartVisit(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all"
                            >
                              <Zap size={14} fill="white" />
                              Begin Visit
                            </button>
                            <Link
                              to={`/directory?type=doctor&search=${encodeURIComponent(item.doctor_name)}`}
                              className="ml-auto w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                            >
                              <User size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Sticky Action */}
            <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 font-medium">
                  <span className="text-slate-900 font-bold">3 other MRs</span> are active in nearby territories
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all active:scale-95"
              >
                Let's Go!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

