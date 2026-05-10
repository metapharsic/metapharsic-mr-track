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
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [aiForecasts, setAiForecasts] = useState<Record<number, { lead_probability: number; lead_status: string; reasoning: string }>>({});
  const [forecastLoading, setForecastLoading] = useState(false);

  const [aiAssigning, setAiAssigning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 5000);

    Promise.all([
      api.visits.getSchedules().catch(() => []),
      api.mrs.getAll().catch(() => []),
      api.visits.getAll().catch(() => []),
      api.doctors.getAll().catch(() => []),
      api.pharmacies.getAll().catch(() => []),
      api.hospitals.getAll().catch(() => []),
    ]).then(([s, m, v, d, p, h]) => {
      clearTimeout(timer);
      
      let filtered = s || [];
      const currentUserStr = localStorage.getItem('metapharsic_current_user');
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser?.role === 'mr' && currentUser.mr_id) {
            filtered = filtered.filter((sched: any) => sched.mr_id === currentUser.mr_id);
          }
        } catch (e) {}
      }

      setSchedules(filtered);
      setMrs(m || []);
      setVisits(v || []);
      setDoctors(d || []);
      setPharmacies(p || []);
      setHospitals(h || []);
      setLoading(false);
    }).catch(err => {
      console.error('VisitSchedule loading error:', err);
      setLoading(false);
    });
    
    return () => clearTimeout(timer);
  }, []);

  // Run AI forecast on today's scheduled visits
  useEffect(() => {
    if (schedules.length === 0 || forecastLoading) return;
    
    const runForecast = async () => {
      setForecastLoading(true);
      const forecasts: Record<number, any> = {};
      try {
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
      } catch (err) {
        console.error('AI Forecast error:', err);
      }
      setForecastLoading(false);
    };
    runForecast();
  }, [schedules.length, visits]);

  const getMrName = (id: number) => mrs.find(m => m.id === id)?.name || 'Unknown MR';

  const openInspector = (visit: any) => {
    setInspectingEntity({
      name: visit.doctor_name,
      type: visit.entity_type || 'doctor',
      territory: mrs.find(m => m.id === visit.mr_id)?.territory,
    });
  };

  const handleSmartAutoAssign = async (entityOverride?: any) => {
    const entityId = entityOverride?.id || formEntityId;
    if (!entityId) return;
    const allEntities = [...doctors, ...pharmacies, ...hospitals] as any[];
    const entity = entityOverride || allEntities.find(e => e.id === entityId);
    
    if (!entity) return;

    setAiAssigning(true);
    setAiSuggestions(null);

    try {
      const response = await fetch('/api/ai/auto-assign-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entity.id,
          entity_type: formEntityType,
          lat: entity.lat || 17.3850,
          lng: entity.lng || 78.4867,
          territory: entity.territory || entity.area
        })
      });

      const result = await response.json();
      if (result.success) {
        setAiSuggestions(result);
        setFormMrId(result.best_mr.id);
      }
    } catch (e) {
      console.error('AI Auto-assign failed:', e);
      const territory = entity.territory || entity.area;
      const matchedMr = mrs.find(m => m.territory?.toLowerCase().includes(territory?.toLowerCase()));
      if (matchedMr) setFormMrId(matchedMr.id);
    } finally {
      setAiAssigning(false);
    }
  };

  const handleSubmitSchedule = async () => {
    if (!formMrId || !formEntityId) return;
    setSubmitting(true);
    setConflictError(null);

    const allEntities = [...doctors, ...pharmacies, ...hospitals] as any[];
    const entity = allEntities.find(e => e.id === formEntityId);
    try {
      const response = await fetch('/api/visit-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mr_id: formMrId,
          doctor_id: formEntityType === 'doctor' ? formEntityId : null,
          doctor_name: entity?.name || 'Unknown',
          clinic: entity?.clinic || entity?.name || 'Unknown',
          scheduled_date: formDate,
          scheduled_time: formTime,
          purpose: formPurpose + (formNotes ? ` - ${formNotes}` : ''),
          priority: formPriority,
        })
      });

      if (response.status === 409) {
        const errData = await response.json();
        setConflictError(errData.message);
        setSubmitting(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to schedule');

      const updated = await api.visits.getSchedules();
      setSchedules(updated);
      setShowScheduleModal(false);
      resetForm();
    } catch (e: any) {
      console.error('Failed to schedule:', e);
      setConflictError(e.message || 'An unexpected error occurred');
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
    setConflictError(null);
    setAiSuggestions(null);
  };

  const filteredEntities = (() => {
    const term = formEntitySearch.toLowerCase();
    if (formEntityType === 'doctor') return doctors.filter(d => (d.name || '').toLowerCase().includes(term) || (d.clinic || '').toLowerCase().includes(term) || (d.specialty || '').toLowerCase().includes(term));
    if (formEntityType === 'chemist') return pharmacies.filter(p => (p.name || '').toLowerCase().includes(term) || (p.owner_name || '').toLowerCase().includes(term));
    return hospitals.filter(h => (h.name || '').toLowerCase().includes(term) || (h.type || '').toLowerCase().includes(term));
  })();

  const todaySchedules = schedules.filter(s => s.scheduled_date === selectedDate);
  const overdueCount = schedules.filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) < new Date()).length;
  const highPriorityCount = schedules.filter(s => s.priority === 'high' && s.status === 'scheduled').length;

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

          <div className="bg-slate-900 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Brain size={18} className="text-purple-400" />
              AI Insights
            </h4>
            <div className="space-y-3">
              {showAIInsights ? (
                forecastLoading ? (
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
                          )}>{f.lead_status}</span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{f.reasoning}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">Schedule visits to see AI forecasts.</p>
                )
              ) : (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AI optimized route planning can save 12km travel distance today.
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
        </div>

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
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {todaySchedules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                No visits scheduled for this date.
              </div>
            ) : (
              todaySchedules.map((visit, i) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6"
                >
                  <div className="w-20 text-center shrink-0 border-r border-slate-100 pr-6">
                    <p className="text-lg font-bold text-slate-900">{visit.scheduled_time}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">30 Mins</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{visit.doctor_name}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        visit.priority === 'high' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>{visit.priority}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1"><MapPin size={14} />{visit.clinic}</div>
                      <div className="flex items-center gap-1"><User size={14} />{getMrName(visit.mr_id)}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    visit.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>{visit.status}</div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-2xl z-10">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-blue-600" /> Schedule New Visit
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {conflictError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-red-800">Scheduling Conflict</p>
                      <p className="text-[10px] text-red-600 mt-0.5">{conflictError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Entity Type</label>
                  <div className="flex gap-2 mt-1">
                    {(['doctor', 'chemist', 'hospital'] as const).map(t => (
                      <button
                        key={t} onClick={() => { setFormEntityType(t); setFormEntityId(null); setFormEntitySearch(''); }}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold capitalize", formEntityType === t ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Search Entity</label>
                  <input
                    type="text" value={formEntitySearch}
                    onChange={e => { setFormEntitySearch(e.target.value); setFormEntityId(null); }}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  {filteredEntities.length > 0 && (
                    <div className="mt-1 max-h-[150px] overflow-y-auto space-y-1">
                      {filteredEntities.slice(0, 8).map((e: any) => (
                        <button
                          key={e.id} onClick={() => { setFormEntityId(e.id); handleSmartAutoAssign(e); }}
                          className={cn("w-full text-left px-3 py-2 rounded-lg text-xs", formEntityId === e.id ? "bg-blue-100" : "bg-slate-50")}
                        >{e.name}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-500 uppercase font-bold">Assign MR</label>
                    <button 
                      onClick={() => handleSmartAutoAssign()} disabled={aiAssigning || !formEntityId}
                      className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1"
                    >
                      {aiAssigning ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />} AI Smart Assign
                    </button>
                  </div>
                  <select
                    value={formMrId || ''} onChange={e => { setFormMrId(Number(e.target.value)); setAiSuggestions(null); }}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Choose an MR...</option>
                    {mrs.map(mr => <option key={mr.id} value={mr.id}>{mr.name} — {mr.territory}</option>)}
                  </select>
                  {aiSuggestions && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{aiSuggestions.best_mr.name}</span>
                        <span className="text-blue-600">{aiSuggestions.best_mr.score}% Match</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                  <button
                    onClick={handleSubmitSchedule} disabled={submitting || !formMrId || !formEntityId}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 justify-center"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {submitting ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
