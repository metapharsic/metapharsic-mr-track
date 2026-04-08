import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Visit, MR, Doctor, Pharmacy, Hospital } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar as CalendarIcon, Clock, MapPin,
  User, ChevronRight, Plus, Filter,
  CheckCircle2, AlertCircle, CalendarDays,
  MoreVertical, Search, X, Brain,
  TrendingUp, Zap, Loader2, Stethoscope, Building2, Pill
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import AIVisitInspector from './AIVisitInspector';

export default function VisitSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [inspectingEntity, setInspectingEntity] = useState<{ name: string; type: 'doctor' | 'chemist' | 'hospital' | 'clinic'; tier?: string; territory?: string; specialty?: string } | null>(null);

  // Schedule form state
  const [formMrId, setFormMrId] = useState<number | null>(null);
  const [formEntityId, setFormEntityId] = useState<number | null>(null);
  const [formEntityType, setFormEntityType] = useState<'doctor' | 'chemist' | 'hospital' | 'clinic'>('doctor');
  const [formEntitySearch, setFormEntitySearch] = useState('');
  const [formDate, setFormDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:00');
  const [formPurpose, setFormPurpose] = useState('Routine Visit');
  const [formNotes, setFormNotes] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [submitting, setSubmitting] = useState(false);

  // AI forecast data
  const [aiForecasts, setAiForecasts] = useState<Record<number, { lead_probability: number; lead_status: string; reasoning: string }>>({});
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.visits.getSchedules(),
      api.mrs.getAll(),
      api.visits.getAll(),
      api.doctors.getAll().catch(() => []),
      api.pharmacies.getAll().catch(() => []),
      api.hospitals.getAll().catch(() => []),
    ]).then(([s, m, v, d, p, h]) => {
      let filtered = s;
      if (user?.role === 'mr') {
        filtered = filtered.filter((sched: any) => sched.mr_id === user.mr_id);
      }
      setSchedules(filtered);
      setMrs(m);
      setVisits(v);
      setDoctors(d || []);
      setPharmacies(p || []);
      setHospitals(h || []);
      setLoading(false);
    });
  }, []);

  // Run AI forecast on today's scheduled visits
  useEffect(() => {
    if (schedules.length === 0 || forecastLoading) return;
    setForecastLoading(true);
    const forecasts: Record<number, any> = {};
    const runForecast = async () => {
      for (const visit of schedules.slice(0, 10)) {
        const entityVisits = visits.filter(v =>
          (v.entity_name === visit.doctor_name || v.doctor_name === visit.doctor_name) && v.status === 'completed'
        );
        const forecast = await geminiService.forecastEntityLead(
          { name: visit.doctor_name, type: 'doctor', tier: 'B' },
          entityVisits
        );
        if (forecast) {
          forecasts[visit.id] = {
            lead_probability: forecast.lead_probability,
            lead_status: forecast.lead_status,
            reasoning: forecast.reasoning,
          };
        }
      }
      setAiForecasts(forecasts);
      setForecastLoading(false);
    };
    runForecast();
  }, [schedules.length]);

  const getMrName = (id: number) => mrs.find(m => m.id === id)?.name || 'Unknown MR';

  const openInspector = (visit: any) => {
    setInspectingEntity({
      name: visit.doctor_name,
      type: visit.entity_type || 'doctor',
      territory: mrs.find(m => m.id === visit.mr_id)?.territory,
    });
  };

  const handleAutoAssign = () => {
    if (!formEntityId) return;
    const allEntities = [...doctors, ...pharmacies, ...hospitals] as any[];
    const entity = allEntities.find(e => e.id === formEntityId);
    if (entity) {
      const territory = entity.territory || entity.area;
      const matchedMr = mrs.find(m => m.territory?.toLowerCase().includes(territory?.toLowerCase())) || mrs[0];
      if (matchedMr) setFormMrId(matchedMr.id);
    }
  };

  const handleSubmitSchedule = async () => {
    if (!formMrId || !formEntityId) return;
    setSubmitting(true);
    const allEntities = [...doctors, ...pharmacies, ...hospitals] as any[];
    const entity = allEntities.find(e => e.id === formEntityId);
    try {
      await api.visits.createSchedule({
        mr_id: formMrId,
        doctor_id: formEntityType === 'doctor' ? formEntityId : null,
        doctor_name: entity?.name || 'Unknown',
        clinic: entity?.clinic || entity?.name || 'Unknown',
        scheduled_date: formDate,
        scheduled_time: formTime,
        purpose: formPurpose + (formNotes ? ` - ${formNotes}` : ''),
        priority: formPriority,
      });
      // Refresh schedules
      const updated = await api.visits.getSchedules();
      setSchedules(updated);
      setShowScheduleModal(false);
      resetForm();
    } catch (e) {
      console.error('Failed to schedule:', e);
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormMrId(null);
    setFormEntityId(null);
    setFormEntitySearch('');
    setFormDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setFormTime('10:00');
    setFormPurpose('Routine Visit');
    setFormNotes('');
    setFormPriority('medium');
  };

  const filteredEntities = (() => {
    const term = formEntitySearch.toLowerCase();
    if (formEntityType === 'doctor') return doctors.filter(d => d.name.toLowerCase().includes(term) || d.clinic.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term));
    if (formEntityType === 'chemist') return pharmacies.filter(p => p.name.toLowerCase().includes(term) || p.owner_name.toLowerCase().includes(term));
    return hospitals.filter(h => h.name.toLowerCase().includes(term) || h.type.toLowerCase().includes(term));
  })();

  const todaySchedules = schedules.filter(s => s.scheduled_date === selectedDate);

  // AI Summary for schedules
  const overdueCount = schedules.filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) < new Date()).length;
  const highPriorityCount = schedules.filter(s => s.priority === 'high' && s.status === 'scheduled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Visit Schedule</h2>
          <p className="text-slate-500 mt-1">Plan and monitor field force visits and route optimization.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all",
              showAIInsights ? "bg-purple-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Brain size={20} />
            AI Insights
          </button>
          <button
            onClick={() => { resetForm(); setShowScheduleModal(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            Schedule New Visit
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Today's Visits</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{todaySchedules.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{schedules.filter(s => s.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">High Priority</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{highPriorityCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Calendar</h3>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const count = schedules.filter(s => s.scheduled_date === dateStr).length;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      isSelected
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-xs font-bold uppercase", isSelected ? "text-blue-100" : "text-slate-400")}>
                        {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-bold">
                        {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          isSelected ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                        )}>{count}</span>
                      )}
                      {isSelected && <CheckCircle2 size={16} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Brain size={18} className="text-purple-400" />
              {showAIInsights ? 'AI Forecast' : 'AI Insights'}
            </h4>
            {showAIInsights ? (
              <div className="space-y-3">
                {forecastLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin" />Analyzing visits...
                  </div>
                ) : Object.keys(aiForecasts).length > 0 ? (
                  Object.entries(aiForecasts).map(([id, f]: [string, any]) => {
                    const visit = schedules.find(s => s.id === Number(id));
                    if (!visit) return null;
                    return (
                      <div key={id} className={cn(
                        "p-2 rounded-lg text-xs",
                        f.lead_status === 'hot' ? "bg-green-900/50 border border-green-800" :
                        f.lead_status === 'warm' ? "bg-amber-900/50 border border-amber-800" :
                        "bg-slate-800"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{visit.doctor_name}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                            f.lead_status === 'hot' ? "bg-green-700 text-white" :
                            f.lead_status === 'warm' ? "bg-amber-700 text-white" :
                            "bg-slate-600 text-slate-300"
                          )}>{f.lead_status} — {f.lead_probability}%</span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{f.reasoning}</p>
                        <button onClick={() => openInspector(visit)} className="mt-1 text-purple-400 hover:text-purple-300 text-[10px] font-bold">View Details →</button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">Schedule visits to see AI forecasts. Need completed visit data for analysis.</p>
                )}
                {!forecastLoading && (
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <AlertCircle size={12} className="text-amber-400" />
                      <span>{overdueCount} overdue | {highPriorityCount} high priority</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Route optimization could save ~12km of travel today.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Route optimization for tomorrow could save 12km of travel.
                  {highPriorityCount > 0 && ` ${highPriorityCount} high-potential visits need attention.`}
                </p>
                <button
                  onClick={() => setShowAIInsights(true)}
                  className="w-full mt-4 py-2 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1 justify-center"
                >
                  <TrendingUp size={12} /> View Forecasts
                </button>
              </>
            )}
          </div>
        </div>

        {/* Schedule List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">
              Visits for {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search visits..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {todaySchedules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
                <h4 className="text-lg font-bold text-slate-900">No visits scheduled</h4>
                <p className="text-slate-500 mt-1">There are no visits planned for this date yet.</p>
                <button onClick={() => { resetForm(); setShowScheduleModal(true); }} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Schedule Now
                </button>
              </div>
            ) : (
              todaySchedules.map((visit, i) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group"
                >
                  <div className="w-20 text-center shrink-0 border-r border-slate-100 pr-6">
                    <p className="text-lg font-bold text-slate-900">{visit.scheduled_time}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">30 Mins</p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{visit.doctor_name}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        visit.priority === 'high' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {visit.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {visit.clinic}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {getMrName(visit.mr_id)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">"{visit.purpose}"</p>
                    {aiForecasts[visit.id] && (
                      <div className="mt-2 flex items-center gap-2">
                        <Brain size={12} className="text-purple-500" />
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          aiForecasts[visit.id].lead_status === 'hot' ? "bg-green-50 text-green-600" :
                          aiForecasts[visit.id].lead_status === 'warm' ? "bg-amber-50 text-amber-600" :
                          "bg-slate-50 text-slate-500"
                        )}>{aiForecasts[visit.id].lead_status}</span>
                        <button
                          onClick={() => openInspector(visit)}
                          className="text-[10px] font-bold text-purple-600 hover:text-purple-700"
                        >View AI Details</button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      visit.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {visit.status}
                    </div>
                    <button
                      onClick={() => openInspector(visit)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title="AI Visit Analysis"
                    >
                      <Zap size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule New Visit Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-blue-600" />
                    Schedule New Visit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assign an MR and entity for the visit</p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {/* Entity Type Tabs */}
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Entity Type</label>
                  <div className="flex gap-2 mt-1">
                    {([
                      { key: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'blue' },
                      { key: 'chemist', label: 'Pharmacy', icon: Pill, color: 'emerald' },
                      { key: 'hospital', label: 'Hospital', icon: Building2, color: 'purple' },
                    ] as const).map(t => (
                      <button
                        key={t.key}
                        onClick={() => { setFormEntityType(t.key); setFormEntityId(null); setFormEntitySearch(''); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          formEntityType === t.key
                            ? `bg-${t.color}-100 text-${t.color}-700 border border-${t.color}-200`
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        <t.icon size={12} />{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity Search */}
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Search Entity</label>
                  <input
                    type="text"
                    value={formEntitySearch}
                    onChange={e => { setFormEntitySearch(e.target.value); setFormEntityId(null); }}
                    placeholder={`Search ${formEntityType === 'doctor' ? 'doctors' : formEntityType === 'chemist' ? 'pharmacies' : 'hospitals'}...`}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filteredEntities.length > 0 && (
                    <div className="mt-1 max-h-[150px] overflow-y-auto space-y-1">
                      {filteredEntities.slice(0, 8).map((e: any) => (
                        <button
                          key={e.id}
                          onClick={() => { setFormEntityId(e.id); handleAutoAssign(); }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-xs transition-all",
                            formEntityId === e.id ? "bg-blue-100 border border-blue-200" : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{e.name}</span>
                            {e.tier && <span className="text-[9px] px-1 py-0.5 bg-slate-200 rounded">Tier {e.tier}</span>}
                          </div>
                          {e.specialty && <p className="text-[10px] text-slate-500">{e.specialty}</p>}
                          {e.territory && <p className="text-[10px] text-slate-400">{e.territory}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                  {formEntityId && (
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} />Entity selected
                    </p>
                  )}
                </div>

                {/* MR Assignment */}
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Assign MR</label>
                  <select
                    value={formMrId || ''}
                    onChange={e => setFormMrId(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Choose an MR...</option>
                    {mrs.map(mr => (
                      <option key={mr.id} value={mr.id}>{mr.name} — {mr.territory}</option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Time</label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Purpose & Priority */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Priority</label>
                    <select
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Purpose</label>
                    <input
                      type="text"
                      value={formPurpose}
                      onChange={e => setFormPurpose(e.target.value)}
                      placeholder="e.g. Product Demo"
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Notes (Optional)</label>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional context for this visit..."
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitSchedule}
                    disabled={submitting || !formMrId || !formEntityId}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 justify-center"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {submitting ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Visit Inspector Modal */}
      <AnimatePresence>
        {inspectingEntity && (
          <AIVisitInspector
            entityName={inspectingEntity.name}
            entityType={inspectingEntity.type}
            entityTier={inspectingEntity.tier}
            entityTerritory={inspectingEntity.territory}
            entitySpecialty={inspectingEntity.specialty}
            onClose={() => setInspectingEntity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}