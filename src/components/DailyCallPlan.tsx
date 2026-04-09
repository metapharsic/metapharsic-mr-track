import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { MR } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, MapPin, CheckCircle2,
  User, Phone, Navigation, X, Loader2, Plus, LogIn,
  Building2, ShoppingBag, Stethoscope, ChevronRight, ChevronDown,
  ArrowLeft, Eye, Edit3
} from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

interface VisitFormState {
  productsDetailed: string;
  doctorFeedback: string;
  samplesGiven: string;
  conversationSummary: string;
  orderValue: number;
  orderProduct: string;
  nextFollowup: string;
  speakingTime: number;
}

const emptyFormData = (): VisitFormState => ({
  productsDetailed: '',
  doctorFeedback: '',
  samplesGiven: '',
  conversationSummary: '',
  orderValue: 0,
  orderProduct: '',
  nextFollowup: '',
  speakingTime: 15,
});

export default function DailyCallPlan() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [plans, setPlans] = useState<any[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVisitFlow, setShowVisitFlow] = useState(false);
  const [attendance, setAttendance] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  // Visit flow state
  const [visitStep, setVisitStep] = useState<'checkin' | 'form' | 'submitting'>('checkin');
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [visitForm, setVisitForm] = useState<VisitFormState>(emptyFormData());
  const [checkinTime, setCheckinTime] = useState<string | null>(null);

  // Add modal state
  const [addForm, setAddForm] = useState({
    entityName: '', entityType: 'doctor' as 'doctor' | 'chemist' | 'hospital',
    clinic: '', purpose: '', plannedTime: '10:00', priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const effectiveMrId = selectedMrId ?? (user?.role === 'mr' ? (user.mr_id ?? null) : null);

  // Load MRs
  useEffect(() => {
    api.mrs.getAll().then(m => {
      setMrs(m);
      if (user?.role === 'mr') {
        setSelectedMrId(user.mr_id ?? null);
      } else if (m.length > 0) {
        setSelectedMrId(m[0].id);
      }
    }).catch(() => {});
  }, [user]);

  // Reload plans when user territory changes
  useEffect(() => {
    if (user?.role === 'mr' && user.mr_id) {
      console.log(`[DailyCallPlan] User territory changed, refreshing plans`);
      setLoading(true);
      Promise.all([
        api.dailyCallPlan.getAll(user.mr_id, selectedDate),
        api.attendance.getAll(user.mr_id),
      ]).then(([p, a]: [any, any]) => {
        setPlans(p || []);
        const todayAtt = a?.find((at: any) => at.date === selectedDate && at.mr_id === user.mr_id);
        setAttendance(todayAtt ?? null);
        setLoading(false);
      }).catch(() => { setLoading(false); setPlans([]); });
    }
  }, [user?.territory]);

  // Load plans
  useEffect(() => {
    if (!effectiveMrId) return;
    setLoading(true);
    Promise.all([
      api.dailyCallPlan.getAll(effectiveMrId, selectedDate),
      api.attendance.getAll(effectiveMrId),
    ]).then(([p, a]) => {
      setPlans(p || []);
      const todayAtt = a?.find((at: any) => at.date === selectedDate && at.mr_id === effectiveMrId);
      setAttendance(todayAtt ?? null);
      setLoading(false);
    }).catch(() => { setLoading(false); setPlans([]); });
  }, [effectiveMrId, selectedDate]);

  const mrProfile = mrs.find(m => m.id === effectiveMrId);

  // Stats
  const completed = plans.filter((p: any) => p.status === 'completed');
  const inProgress = plans.filter((p: any) => p.status === 'in_progress');
  const planned = plans.filter((p: any) => p.status === 'planned');
  const missed = plans.filter((p: any) => p.status === 'missed' || p.status === 'skipped');
  const totalSpeaking = completed.reduce((s: number, p: any) => s + (p.visit_outcome?.speaking_time || 15), 0);
  const totalOrders = completed.reduce((s: number, p: any) => s + (p.visit_outcome?.order_value || 0), 0);
  const compliance = plans.length > 0 ? Math.round((completed.length / plans.length) * 100) : 0;

  // Handlers
  const handleCheckIn = async () => {
    if (!effectiveMrId) return;
    setCheckingIn(true);
    try {
      const result = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mr_id: effectiveMrId, mr_name: user?.name }),
      }).then(r => r.json());
      setAttendance(result?.record ?? result);
      addNotification({ title: 'Attendance', message: 'Checked in successfully', type: 'success', link: '/schedule' });
    } catch {
      const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setAttendance({ check_in: t });
      addNotification({ title: 'Attendance', message: `Checked in (local) at ${t}`, type: 'info', link: '/schedule' });
    }
    setCheckingIn(false);
  };

  const startVisit = (plan: any) => {
    setActivePlan(plan);
    setCheckinTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    setVisitForm(emptyFormData());
    setVisitStep('checkin');
    setShowVisitFlow(true);
  };

  const completeVisit = async () => {
    if (!activePlan) return;
    const sentences = visitForm.conversationSummary.split(/[.!?]+/).filter((s: string) => s.trim().length > 5);
    if (sentences.length < 3) {
      addNotification({ title: 'Validation Error', message: 'Conversation summary needs at least 3 sentences', type: 'error', link: '/schedule' });
      return;
    }
    setVisitStep('submitting');
    try {
      await api.dailyCallPlan.complete(activePlan.schedule_id, {
        mr_id: effectiveMrId,
        doctor_name: activePlan.entity_name,
        scheduled_date: selectedDate,
        check_in_time: checkinTime,
        check_out_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        speaking_time: visitForm.speakingTime,
        products_detailed: visitForm.productsDetailed,
        doctor_feedback: visitForm.doctorFeedback,
        samples_given: visitForm.samplesGiven,
        order_value: visitForm.orderValue,
        order_product: visitForm.orderProduct || undefined,
        next_followup: visitForm.nextFollowup || undefined,
        conversation_summary: visitForm.conversationSummary,
      });
      const refreshed = await api.dailyCallPlan.getAll(effectiveMrId, selectedDate);
      setPlans(refreshed || []);
      addNotification({ title: 'Visit Completed', message: `Visit to ${activePlan.entity_name} completed!`, type: 'success', link: '/schedule' });
      setShowVisitFlow(false);
      setActivePlan(null);
    } catch {
      addNotification({ title: 'Visit Failed', message: 'Failed to complete visit', type: 'error', link: '/schedule' });
      setVisitStep('form');
    }
  };

  const handleAddUnscheduled = async () => {
    if (!addForm.entityName || !effectiveMrId) return;
    try {
      await api.dailyCallPlan.create({
        mr_id: effectiveMrId,
        scheduled_date: selectedDate,
        doctor_name: addForm.entityName,
        clinic: addForm.clinic,
        scheduled_time: addForm.plannedTime,
        purpose: addForm.purpose,
        priority: addForm.priority,
      });
      const refreshed = await api.dailyCallPlan.getAll(effectiveMrId, selectedDate);
      setPlans(refreshed || []);
      setShowAddModal(false);
      setAddForm({ entityName: '', entityType: 'doctor', clinic: '', purpose: '', plannedTime: '10:00', priority: 'medium' });
      addNotification({ title: 'Visit Added', message: 'Unscheduled visit added', type: 'success', link: '/schedule' });
    } catch {
      addNotification({ title: 'Visit Add Failed', message: 'Failed to add visit', type: 'error', link: '/schedule' });
    }
  };

  // Sorted plans: priority order, then time
  const sortedPlans = [...plans].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2, in_progress: -1, completed: 3 };
    const pa = pOrder[a.priority as keyof typeof pOrder] ?? 1;
    const pb = pOrder[b.priority as keyof typeof pOrder] ?? 1;
    return pa - pb || a.planned_time.localeCompare(b.planned_time);
  });

  // Entity helpers
  const entityIcon = (type: string, size = 18) => {
    switch (type) {
      case 'doctor': return <Stethoscope size={size} />;
      case 'chemist': return <ShoppingBag size={size} />;
      case 'hospital': return <Building2 size={size} />;
      default: return <User size={size} />;
    }
  };

  const entityColor = (type: string) => {
    switch (type) {
      case 'doctor': return 'bg-blue-100 text-blue-600';
      case 'chemist': return 'bg-amber-100 text-amber-600';
      case 'hospital': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-purple-100 text-purple-600';
    }
  };

  const tierBadge = (tier: string) => {
    const c = tier === 'A' ? 'bg-red-50 text-red-600 border-red-200' :
              tier === 'B' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                             'bg-green-50 text-green-600 border-green-200';
    return <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border', c)}>Tier {tier}</span>;
  };

  const daysSinceLabel = (days: number) => {
    if (days === 0) return { text: 'Today', color: 'text-green-600' };
    if (days < 7) return { text: `${days}d ago`, color: 'text-blue-600' };
    if (days < 30) return { text: `${days}d ago`, color: 'text-amber-600' };
    return { text: `${days}d ago`, color: 'text-red-600' };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // ===== VISIT FLOW MODAL =====
  if (showVisitFlow && activePlan) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        {/* Flow header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <button onClick={() => { setShowVisitFlow(false); setActivePlan(null); }}
            className="flex items-center gap-2 text-blue-200 hover:text-white mb-3 text-sm">
            <ArrowLeft size={16} /> Back to Call Plan
          </button>
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-white/20', entityColor(activePlan.entity_type))}>
              {entityIcon(activePlan.entity_type, 24)}
            </div>
            <div>
              <h2 className="text-lg font-bold">{activePlan.entity_name}</h2>
              <p className="text-blue-200 text-xs">{activePlan.clinic}{activePlan.area && ` • ${activePlan.area}`}</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-2">
          {['Check-in', 'Visit', 'Complete'].map((label, i) => {
            const stepNames = ['checkin', 'form', 'submitting'];
            const idx = stepNames.indexOf(visitStep);
            return (
              <React.Fragment key={label}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  i < idx ? 'bg-green-500 text-white' : i === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                )}>{i < idx ? <CheckCircle2 size={14} /> : i + 1}</div>
                <div className={cn('flex-1 h-0.5', i < idx ? 'bg-green-500' : 'bg-gray-200')} />
              </React.Fragment>
            );
          })}
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', visitStep === 'submitting' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')}>
            {visitStep === 'submitting' ? <CheckCircle2 size={14} /> : 3}
          </div>
        </div>

        {/* Step: Check-in */}
        {visitStep === 'checkin' && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Navigation className="text-blue-600" size={20} />Check-in</h3>
            <p className="text-sm text-gray-500">Confirm your check-in time to start visiting</p>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs uppercase font-bold">Checked in at</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{checkinTime}</p>
            </div>
            <button onClick={() => setVisitStep('form')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
              Start Visit
            </button>
          </div>
        )}

        {/* Step: Visit form */}
        {visitStep === 'form' && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Edit3 className="text-blue-600" size={20} />Log Visit Details</h3>

            <div>
              <label className="text-xs font-bold text-gray-600">Products Detailed</label>
              <textarea className="w-full mt-1 p-3 border rounded-xl text-sm resize-none" rows={2}
                placeholder="Which products did you discuss?" value={visitForm.productsDetailed}
                onChange={e => setVisitForm(f => ({ ...f, productsDetailed: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600">Doctor's Feedback</label>
              <textarea className="w-full mt-1 p-3 border rounded-xl text-sm resize-none" rows={3}
                placeholder="What was the doctor's response?" value={visitForm.doctorFeedback}
                onChange={e => setVisitForm(f => ({ ...f, doctorFeedback: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600">Samples Given</label>
              <input className="w-full mt-1 p-3 border rounded-xl text-sm"
                placeholder="e.g., 2 strips of Product A" value={visitForm.samplesGiven}
                onChange={e => setVisitForm(f => ({ ...f, samplesGiven: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600">Conversation Summary (min 3 sentences)</label>
              <textarea className="w-full mt-1 p-3 border rounded-xl text-sm resize-none" rows={4}
                placeholder="Summarize the key discussion points..." value={visitForm.conversationSummary}
                onChange={e => setVisitForm(f => ({ ...f, conversationSummary: e.target.value }))} />
              <p className="text-[10px] text-gray-400 mt-1">
                {visitForm.conversationSummary.split(/[.!?]+/).filter((s: string) => s.trim().length > 5).length} sentences captured
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Order Value (₹)</label>
                <input type="number" min={0} className="w-full mt-1 p-3 border rounded-xl text-sm"
                  value={visitForm.orderValue}
                  onChange={e => setVisitForm(f => ({ ...f, orderValue: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Order Product</label>
                <input className="w-full mt-1 p-3 border rounded-xl text-sm"
                  placeholder="Product name" value={visitForm.orderProduct}
                  onChange={e => setVisitForm(f => ({ ...f, orderProduct: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Speaking Time (min)</label>
                <input type="number" min={1} className="w-full mt-1 p-3 border rounded-xl text-sm"
                  value={visitForm.speakingTime}
                  onChange={e => setVisitForm(f => ({ ...f, speakingTime: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600">Next Follow-up</label>
              <input type="date" className="w-full mt-1 p-3 border rounded-xl text-sm"
                value={visitForm.nextFollowup}
                onChange={e => setVisitForm(f => ({ ...f, nextFollowup: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setVisitStep('checkin')}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors">
                Back
              </button>
              <button onClick={completeVisit}
                disabled={visitForm.conversationSummary.split(/[.!?]+/).filter((s: string) => s.trim().length > 5).length < 3}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                <CheckCircle2 size={18} /> Complete Visit
              </button>
            </div>
          </div>
        )}

        {/* Step: Submitting */}
        {visitStep === 'submitting' && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="font-bold text-gray-900">Completing visit...</p>
          </div>
        )}
      </div>
    );
  }

  // ===== MAIN VIEW =====
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Call Plan</h1>
          <p className="text-gray-500">Plan your visits, log outcomes — all in one flow.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-gray-400" />
              <select className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
                value={selectedMrId ?? ''} onChange={(e) => setSelectedMrId(Number(e.target.value))}>
                {mrs.map(mr => (
                  <option key={mr.id} value={mr.id}>{mr.name}</option>
                ))}
              </select>
            </div>
          )}
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {!attendance?.check_in && (
            <button onClick={handleCheckIn} disabled={checkingIn}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold',
                attendance?.check_in ? 'bg-green-600 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700')}>
              {checkingIn ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={16} />}
              {checkingIn ? 'Checking In...' : 'Check In'}
            </button>
          )}
          {attendance?.check_in && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg font-bold">
              <CheckCircle2 size={12} /> Checked in at {attendance.check_in}
            </span>
          )}
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
            <Plus size={16} /> Quick Add
          </button>
        </div>
      </div>

      {/* Profile + Stats */}
      {mrProfile && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {mrProfile.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-lg font-bold">{mrProfile.name}</h2>
              <p className="text-blue-200 text-xs flex items-center gap-1">
                <MapPin size={12} />{mrProfile.territory}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Planned', value: plans.length, color: 'text-white' },
              { label: 'Completed', value: completed.length, color: 'text-green-300' },
              { label: 'In Progress', value: inProgress.length, color: 'text-yellow-300' },
              { label: 'Compliance', value: `${compliance}%`, color: compliance >= 70 ? 'text-green-300' : compliance >= 40 ? 'text-yellow-300' : 'text-red-300' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] uppercase font-bold text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats when no profile */}
      {!mrProfile && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Planned', value: plans.length, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Completed', value: completed.length, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'In Progress', value: inProgress.length, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Compliance', value: `${compliance}%`, bg: compliance >= 70 ? 'bg-green-50' : 'bg-red-50', color: compliance >= 70 ? 'text-green-600' : 'text-red-600' },
          ].map((s, i) => (
            <div key={i} className={cn('rounded-xl p-4 text-center', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Call Plan List */}
      {sortedPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-gray-900">No plans for this date</p>
          <p className="text-sm text-gray-500 mt-1">Add a quick visit or wait for auto-generated plans.</p>
          <button onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
            <Plus size={16} /> Add Unscheduled Visit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{sortedPlans.length} visits planned</h2>
            <span className="text-xs text-gray-500">
              {completed.length} completed &bull; {inProgress.length} in progress &bull; {planned.length} planned &bull; {missed.length} missed
            </span>
          </div>

          {sortedPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const dsl = daysSinceLabel(plan.days_since_last_visit ?? 0);
            const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
              completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
              in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
              planned: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Planned' },
              missed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Missed' },
              skipped: { bg: 'bg-red-100', text: 'text-red-700', label: 'Skipped' },
            };
            const sc = statusConfig[plan.status] ?? statusConfig.planned;

            return (
              <div key={plan.id} className="bg-white rounded-2xl border overflow-hidden">
                <button
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-sm font-bold text-gray-900">{plan.planned_time?.slice(0, 5) || '--:--'}</p>
                  </div>

                  {/* Entity icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', entityColor(plan.entity_type))}>
                    {entityIcon(plan.entity_type, 18)}
                  </div>

                  {/* Entity info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{plan.entity_name}</span>
                      {tierBadge(plan.tier ?? 'C')}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {plan.clinic && <span className="text-xs text-gray-500 truncate">{plan.clinic}</span>}
                      <span className={cn('text-xs font-medium', dsl.color)}>{dsl.text}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0', sc.bg, sc.text)}>
                    {sc.label}
                  </span>

                  {/* Chevron */}
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                </button>

                {/* Expanded section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 border-t bg-gray-50/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
                          <div>
                            <span className="text-gray-500 block">Priority</span>
                            <span className={cn(
                              'font-bold capitalize',
                              plan.priority === 'high' ? 'text-red-600' : plan.priority === 'medium' ? 'text-amber-600' : 'text-gray-600'
                            )}>{plan.priority}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Purpose</span>
                            <span className="font-medium text-gray-900">{plan.purpose || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Area</span>
                            <span className="font-medium text-gray-900">{plan.area || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Last Visit</span>
                            <span className={cn('font-bold', dsl.color)}>{plan.days_since_last_visit === 0 ? 'Today' : `${plan.days_since_last_visit} days ago`}</span>
                          </div>
                        </div>

                        {/* Visit outcome for completed */}
                        {plan.status === 'completed' && plan.visit_outcome && (
                          <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                            {plan.visit_outcome.products_detailed && (
                              <div><span className="text-gray-500">Products Detailed:</span> <span className="text-gray-900">{plan.visit_outcome.products_detailed}</span></div>
                            )}
                            {plan.visit_outcome.doctor_feedback && (
                              <div><span className="text-gray-500">Feedback:</span> <span className="text-gray-900">{plan.visit_outcome.doctor_feedback}</span></div>
                            )}
                            {plan.visit_outcome.order_value > 0 && (
                              <div><span className="text-gray-500">Order:</span> <span className="font-bold text-green-600">₹{plan.visit_outcome.order_value}</span></div>
                            )}
                            {plan.visit_outcome.next_followup && (
                              <div><span className="text-gray-500">Follow-up:</span> <span className="font-medium text-blue-600">{plan.visit_outcome.next_followup}</span></div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button onClick={() => startVisit(plan)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                                <Eye size={12} /> View Full Outcome
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          {plan.status === 'planned' && (
                            <button onClick={() => startVisit(plan)}
                              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                              <Navigation size={16} /> Start Visit
                            </button>
                          )}
                          {plan.status === 'in_progress' && (
                            <button onClick={() => startVisit(plan)}
                              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2">
                              <Edit3 size={16} /> Continue Visit
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Unscheduled Visit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="text-emerald-600" size={20} /> Add Unscheduled Visit</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-gray-600">Entity Name *</label>
                  <input className="w-full mt-1 p-3 border rounded-xl text-sm"
                    placeholder="Doctor / Chemist / Hospital name"
                    value={addForm.entityName}
                    onChange={(e) => setAddForm(f => ({ ...f, entityName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Entity Type</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { value: 'doctor', label: 'Doctor', icon: <Stethoscope size={14} /> },
                      { value: 'chemist', label: 'Chemist', icon: <ShoppingBag size={14} /> },
                      { value: 'hospital', label: 'Hospital', icon: <Building2 size={14} /> },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setAddForm(f => ({ ...f, entityType: opt.value as 'doctor' | 'chemist' | 'hospital' }))}
                        className={cn('flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-colors',
                          addForm.entityType === opt.value
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 hover:bg-gray-50')}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Clinic / Location</label>
                  <input className="w-full mt-1 p-3 border rounded-xl text-sm"
                    placeholder="Clinic or location" value={addForm.clinic}
                    onChange={(e) => setAddForm(f => ({ ...f, clinic: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Purpose</label>
                  <input className="w-full mt-1 p-3 border rounded-xl text-sm"
                    placeholder="e.g., Product detailer, Follow-up" value={addForm.purpose}
                    onChange={(e) => setAddForm(f => ({ ...f, purpose: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Planned Time</label>
                    <input type="time" className="w-full mt-1 p-3 border rounded-xl text-sm"
                      value={addForm.plannedTime}
                      onChange={(e) => setAddForm(f => ({ ...f, plannedTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Priority</label>
                    <select className="w-full mt-1 p-3 border rounded-xl text-sm"
                      value={addForm.priority}
                      onChange={(e) => setAddForm(f => ({ ...f, priority: e.target.value as 'high' | 'medium' | 'low' }))}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t bg-gray-50">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Cancel
                </button>
                <button onClick={handleAddUnscheduled} disabled={!addForm.entityName.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Add Visit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}