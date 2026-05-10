import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { MR, Visit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { locationService } from '../services/locationService';
import {
  Calendar, MapPin, Clock,
  CheckCircle2, AlertCircle,
  ChevronRight, ChevronDown, ChevronUp, User, Phone,
  ExternalLink, Loader2,
  LayoutGrid, List as ListIcon,
  ShoppingBag, Building2, Stethoscope, LogIn,
  X as XIcon, Check, Eye, Navigation, Zap,
  ClipboardList, LogOut, FileText, Gift,
  Smile, Meh, Frown, Activity, Target, TrendingUp, Sparkles, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import MorningBriefingModal, { DailyBriefing, BriefingItem } from './MorningBriefingModal';
import MRCalendar from './MRCalendar';
import FieldSyncModal from './FieldSyncModal';

const today = new Date().toISOString().split('T')[0];

export default function MRDashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [mrs, setMrs] = useState<MR[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Attendance state
  const [attendance, setAttendance] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [viewingVisitDetails, setViewingVisitDetails] = useState<{type: 'schedule' | 'visit', data: any} | null>(null);

  // Schedule expansion / visit tracking
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [startedVisits, setStartedVisits] = useState<Set<number>>(new Set());
  const [startingVisit, setStartingVisit] = useState<number | null>(null);

  // Expanded recent visit
  const [expandedVisit, setExpandedVisit] = useState<number | string | null>(null);

  // Morning briefing state
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showFieldSync, setShowFieldSync] = useState(false);
  const [briefingLoaded, setBriefingLoaded] = useState(false);
  const [aiPriorities, setAiPriorities] = useState<any[]>([]);

  // Determine effective MR ID based on role
  const effectiveMrId = selectedMrId ?? (user?.role === 'mr' ? (user.mr_id ?? null) : null);
  const selectedMr = mrs.find(m => m.id === selectedMrId);

  // Load all MRs
  useEffect(() => {
    api.mrs.getAll().then(data => {
      setMrs(data);
      if (user?.role === 'mr') {
        setSelectedMrId(user.mr_id ?? null);
      } else if (data.length > 0) {
        setSelectedMrId(data[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  // Load AI Priority Targets
  useEffect(() => {
    if (selectedMr) {
      api.intelligence.getAIPriorities(selectedMr.territory).then(setAiPriorities);
    }
  }, [selectedMr]);

  // Load schedules, visits, and attendance for the selected MR
  useEffect(() => {
    if (!effectiveMrId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.visits.getSchedules(),
      api.visits.getAll(),
      api.attendance.getAll(effectiveMrId),
    ]).then(([schedulesData, visitsData, attendanceData]) => {
      // Filter schedules for today and this MR
      const todaySchedules = schedulesData.filter(
        s => s.mr_id === effectiveMrId && s.scheduled_date === today
      );
      const mrVisits = visitsData.filter(v => v.mr_id === effectiveMrId);

      setSchedules(todaySchedules);
      setAllVisits(mrVisits);
      setRecentVisits(mrVisits.slice(0, 10));

      // Check if attendance already exists for today
      const todayAttendance = attendanceData.find(a => {
        const recordDate = a.date && typeof a.date === 'string' && a.date.includes('T') 
          ? a.date.split('T')[0] 
          : a.date;
        return recordDate === today && a.mr_id === effectiveMrId;
      });
      setAttendance(todayAttendance ?? null);

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [effectiveMrId]);

  // Load morning briefing for the selected MR from /api/daily-briefing
  useEffect(() => {
    if (!effectiveMrId) {
      setBriefing(null);
      setBriefingLoaded(true);
      return;
    }

    setBriefingLoaded(false);
    api.dailyBriefing.get(effectiveMrId, today)
      .then((briefingData: any) => {
        if (briefingData && !briefingData.error) {
          const b: DailyBriefing = {
            date: briefingData.date || today,
            mr_id: briefingData.mr_id || effectiveMrId,
            schedule: briefingData.schedule || [],
            total_expected_value: briefingData.total_expected_value || 0,
            total_travel_km: briefingData.total_travel_km || 0,
            optimized_route_percentage: briefingData.optimized_route_percentage || 0,
            generated_at: briefingData.generated_at || new Date().toISOString(),
            message: briefingData.message
          };
          setBriefing(b);

          // Auto-show briefing once per session (first login of the day)
          const seenKey = `briefing_seen_${effectiveMrId}_${today}`;
          if (!sessionStorage.getItem(seenKey) && b.schedule.length > 0) {
            sessionStorage.setItem(seenKey, '1');
            setShowBriefingModal(true);
            // Also push a notification with link to Daily Call Plan
            addNotification({
              title: '🌅 AI Morning Briefing',
              message: `${b.schedule.length} visits optimized, expected ₹${b.total_expected_value.toLocaleString('en-IN')}. View your optimized route.`,
              type: 'info',
              link: '/schedule'
            });
          }
        } else {
          setBriefing(null);
        }
        setBriefingLoaded(true);
      })
      .catch(() => {
        setBriefing(null);
        setBriefingLoaded(true);
      });
  }, [effectiveMrId]);

  // --- Handlers ---

  const handleCheckIn = useCallback(async () => {
    if (attendance && attendance.check_in) {
      addNotification({ title: 'Already Checked In', message: `Already checked in today at ${attendance.check_in}`, type: 'info', link: '/mr-dashboard' });
      return;
    }
    setCheckingIn(true);
    try {
      const loc = locationService.getLastLocation();
      const payload = {
        mr_id: effectiveMrId,
        mr_name: user?.name ?? selectedMr?.name ?? '',
        lat: loc.lat,
        lng: loc.lng,
      };
      const result = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json());

      const checkInTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const newAttendance = result?.record || { check_in: result?.checkIn || checkInTime, mr_id: effectiveMrId };
      setAttendance(newAttendance);
      addNotification({ title: 'Attendance', message: `Checked in successfully at ${newAttendance.check_in}`, type: 'success', link: '/mr-dashboard' });
    } catch (err) {
      console.error('Check-in failed:', err);
      // Fallback: record locally
      const checkInTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setAttendance({ check_in: checkInTime, mr_id: effectiveMrId });
      addNotification({ title: 'Attendance', message: `Checked in (local mode) at ${checkInTime}`, type: 'info', link: '/mr-dashboard' });
    }
    setCheckingIn(false);
  }, [attendance, effectiveMrId, user?.name, selectedMr, addNotification]);

  // Calculate productive time based on attendance and visits
  const productiveStats = useMemo(() => {
    if (!attendance?.check_in) return null;

    // Parse check_in time
    const checkInDate = new Date();
    const timeParts = attendance.check_in.match(/(\d+):(\d+)/);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      if (attendance.check_in.toLowerCase().includes('pm') && hours < 12) hours += 12;
      if (attendance.check_in.toLowerCase().includes('am') && hours === 12) hours = 0;
      checkInDate.setHours(hours, minutes, 0, 0);
    }

    // Parse check_out time or use current time
    const checkOutDate = new Date();
    if (attendance.check_out) {
      const outParts = attendance.check_out.match(/(\d+):(\d+)/);
      if (outParts) {
        let hours = parseInt(outParts[1], 10);
        const minutes = parseInt(outParts[2], 10);
        if (attendance.check_out.toLowerCase().includes('pm') && hours < 12) hours += 12;
        if (attendance.check_out.toLowerCase().includes('am') && hours === 12) hours = 0;
        checkOutDate.setHours(hours, minutes, 0, 0);
      }
    }

    // Total productive time in minutes
    let totalMinutes = Math.max(0, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
    if (totalMinutes < 0 || isNaN(totalMinutes)) totalMinutes = 0;

    // Calculate Visit Time (sum of estimated_duration for completed visits)
    let visitMinutes = 0;
    schedules.filter(s => s.status === 'completed').forEach(s => {
      visitMinutes += (s.estimated_duration || 30);
    });

    const travelMinutes = Math.max(0, totalMinutes - visitMinutes);

    return {
      total: totalMinutes,
      visit: visitMinutes,
      travel: travelMinutes
    };
  }, [attendance, schedules]);

  const handleCheckOut = useCallback(async () => {
    if (attendance?.check_out) {
      addNotification({ title: 'Already Checked Out', message: `Already checked out today at ${attendance.check_out}`, type: 'info', link: '/mr-dashboard' });
      return;
    }
    setCheckingOut(true);
    try {
      // Dynamically calculate accurate time diffs at exact moment of checkout
      let finalTotal = 0;
      let finalVisit = 0;
      let finalTravel = 0;

      if (attendance?.check_in) {
        const checkInDate = new Date();
        const timeParts = attendance.check_in.match(/(\d+):(\d+)/);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          if (attendance.check_in.toLowerCase().includes('pm') && hours < 12) hours += 12;
          if (attendance.check_in.toLowerCase().includes('am') && hours === 12) hours = 0;
          checkInDate.setHours(hours, minutes, 0, 0);
        }
        
        finalTotal = Math.max(0, Math.floor((new Date().getTime() - checkInDate.getTime()) / 60000));
        
        schedules.filter(s => s.status === 'completed').forEach(s => {
          finalVisit += (s.estimated_duration || 30);
        });
        
        finalTravel = Math.max(0, finalTotal - finalVisit);
      }
      
      const loc = locationService.getLastLocation();

      const payload = {
        mr_id: effectiveMrId,
        productive_time_mins: finalTotal,
        visit_time_mins: finalVisit,
        travel_time_mins: finalTravel,
        gps_lat: loc ? loc.lat : null,
        gps_lng: loc ? loc.lng : null
      };
      
      const checkOutTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      try {
        const result = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(res => {
          if (!res.ok) throw new Error("Offline");
          return res.json();
        });

        const newCheckOut = result?.checkOut || checkOutTime;
        setAttendance(prev => prev ? { ...prev, check_out: newCheckOut } : prev);
        addNotification({ title: 'Attendance', message: `Checked out successfully at ${newCheckOut}. Activity saved!`, type: 'success', link: '/mr-dashboard' });
      } catch (err) {
        // Offline Synchronization Queue (PWA)
        console.warn('Network offline or failed. Queuing for sync...');
        const queue = JSON.parse(localStorage.getItem('metapharsic_sync_queue') || '[]');
        queue.push({ type: 'checkout', payload, timestamp: new Date().toISOString() });
        localStorage.setItem('metapharsic_sync_queue', JSON.stringify(queue));
        
        setAttendance(prev => prev ? { ...prev, check_out: checkOutTime } : prev);
        addNotification({ title: 'Offline Mode', message: `Checked out locally at ${checkOutTime}. Will sync when online.`, type: 'warning' });
      }
    } catch (err) {
      console.error('Check-out failed:', err);
    }
    setCheckingOut(false);
  }, [attendance, effectiveMrId, schedules, addNotification]);

  const handleStartVisit = useCallback(async (schedule: any) => {
    setStartingVisit(schedule.id);
    try {
      // Try to PATCH the schedule status to in_progress
      await fetch(`/api/visit-schedules/${schedule.id}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // If PATCH fails, update local state optimistically
    }

    // Update local schedules to reflect in_progress
    setSchedules(prev =>
      prev.map(s => s.id === schedule.id ? { ...s, status: 'in_progress' } : s)
    );
    setStartedVisits(prev => new Set(prev).add(schedule.id));
    // Navigate to field tracker
    navigate(`/field-tracker?schedule_id=${schedule.id}`);
  }, [navigate]);

  const handleCall = useCallback((schedule: any) => {
    const phoneInfo = schedule.phone ? ` | Phone: ${schedule.phone}` : '';
    const clinicInfo = schedule.clinic || schedule.doctor_name;
    addNotification({ title: 'Contact Info', message: `${schedule.doctor_name} • ${clinicInfo}${phoneInfo}`, type: 'info', link: '/directory' });
  }, [addNotification]);

  const handleViewVisit = useCallback((visitId: number, isSchedule: boolean = true) => {
    if (isSchedule) {
      const s = schedules.find(x => x.id === visitId);
      if (s) setViewingVisitDetails({ type: 'schedule', data: s });
    } else {
      const v = recentVisits.find(x => x.id === visitId);
      if (v) setViewingVisitDetails({ type: 'visit', data: v });
    }
  }, [schedules, recentVisits]);



  // Entity-type icon helper
  const entityIcon = (entityType: string, size = 20) => {
    switch (entityType) {
      case 'doctor': return <User size={size} />;
      case 'chemist': return <ShoppingBag size={size} />;
      case 'hospital': return <Building2 size={size} />;
      default: return <Stethoscope size={size} />;
    }
  };

  const entityColor = (entityType: string) => {
    switch (entityType) {
      case 'doctor': return 'bg-blue-50 text-blue-600';
      case 'chemist': return 'bg-amber-50 text-amber-600';
      case 'hospital': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-purple-50 text-purple-600';
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-amber-100 text-amber-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-sky-100 text-sky-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading && mrs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MR Market Dashboard</h1>
          <p className="text-gray-500">Daily visit assignments and territory schedule</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFieldSync(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-all text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Quick Sync
          </button>
          <button
            onClick={() => setShowCalendarModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            History
          </button>
          
          {/* AI Briefing Button - shown whenever briefing is loaded */}
          {briefingLoaded && briefing && (
            <button
              onClick={() => setShowBriefingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all text-sm"
            >
              <Zap className="w-4 h-4 text-yellow-300" fill="currentColor" />
              AI Briefing
              {briefing.schedule.length > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {briefing.schedule.length}
                </span>
              )}
            </button>
          )}

          {/* MR selector — shown for admin/manager; disabled for MR role */}
          {user && user.role !== 'mr' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-gray-400" />
              <select
                className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
                value={selectedMrId ?? ''}
                onChange={(e) => setSelectedMrId(Number(e.target.value))}
              >
                {mrs.map(mr => (
                  <option key={mr.id} value={mr.id}>{mr.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'grid' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Header & Status */}
      {selectedMr && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Main User Bento Tile */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group border border-slate-800">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 backdrop-blur-xl border border-indigo-400/30 flex items-center justify-center text-3xl font-black text-indigo-200">
                    {selectedMr.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {/* Pulse indicator for active state */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse shadow-lg shadow-emerald-500/50" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{selectedMr.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                      ID: {user?.mr_id || 'DEMO-01'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                      <Activity size={10} /> Active
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1 ml-1 font-medium">
                      <MapPin size={12} className="text-indigo-400" />
                      {selectedMr.territory}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Performance</p>
                  <p className="text-2xl font-black text-white">{selectedMr.performance_score}%</p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-700">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedMr.performance_score}%` }}
                      className="bg-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Rank</p>
                  <p className="text-2xl font-black text-white">#4 <span className="text-xs text-emerald-400 font-bold">↑2</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Territory Size</p>
                  <p className="text-2xl font-black text-white">12km</p>
                </div>
              </div>
            </div>

            {/* Decorative BG elements */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-blue-500/5 rounded-full blur-[80px]" />
            <Zap className="absolute top-8 right-8 text-white/5 group-hover:text-white/10 transition-colors" size={120} />
          </div>

          {/* Attendance Bento Tile */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                   <Clock size={24} />
                </div>
                {attendance?.check_in && !attendance.check_out && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 animate-pulse">
                    On Duty
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2">Daily Attendance</h3>
              <p className="text-xs text-slate-500 font-medium">Verify your field entry and exit times.</p>
            </div>

            <div className="mt-8 space-y-4">
              {attendance?.check_in ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Time</span>
                    <span className="text-sm font-black text-slate-900">{attendance.check_in}</span>
                  </div>
                  {!attendance.check_out ? (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      {checkingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      Check Out Field
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Exit Time</span>
                      <span className="text-sm font-black text-indigo-700">{attendance.check_out}</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.75rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  {checkingIn ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
                  Mark Field Check-In
                </button>
              )}
            </div>
          </div>

          {/* Intelligence Bento Tile */}
          <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 shadow-xl shadow-indigo-500/5 flex flex-col relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6">
                <Sparkles size={24} fill="currentColor" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2">AI Insights</h3>
              <p className="text-xs text-indigo-600 font-medium mb-6">Today's high-probability targets.</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <Target size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">2 Hot Leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <TrendingUp size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">₹2.4L Forecast</span>
                </div>
              </div>

              <button 
                onClick={() => setShowBriefingModal(true)}
                className="mt-8 w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                View Intelligence Report
              </button>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-200/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>
      )}


      {/* AI Priority Targets */}
      {aiPriorities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Priority 5 - High Value Targets
            </h3>
            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase border border-purple-100">
               Real-time Prioritization
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {aiPriorities.map((target, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                      entityColor(target.entity_type)
                    )}>
                      {entityIcon(target.entity_type, 20)}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Score</p>
                      <p className="text-xl font-black text-purple-600">{target.priority_score}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-black text-slate-900 text-sm leading-tight group-hover:text-purple-600 transition-colors mb-1">
                    {target.entity_name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex items-center gap-1">
                     <MapPin size={10} /> {target.territory}
                  </p>
                  
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 mb-4">
                    <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                       <Zap size={8} /> AI RECO:
                    </p>
                    <p className="text-[10px] text-purple-900 font-medium leading-tight">
                       {target.ai_recommendation}
                    </p>
                  </div>
                </div>

                <Link 
                  to={`/directory?search=${encodeURIComponent(target.entity_name)}`}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all text-center relative z-10"
                >
                  Action Plan
                </Link>

                {/* Decorative glow */}
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Assigned Visits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Assigned Visits for Today
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">No visits assigned</h4>
            <p className="text-gray-500 max-w-xs mx-auto">
              You don&apos;t have any visits scheduled for today. Check back later or contact your manager.
            </p>
          </div>
        ) : (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}>
            <AnimatePresence mode="popLayout">
              {schedules
                .filter(s => s.status === 'pending' && !startedVisits.has(s.id))
                .map((schedule, index) => {
                const isStarted = startedVisits.has(schedule.id);
                const isCompleted = schedule.status === 'completed';
                const isExpanded = expandedCard === schedule.id;

                return (
                  <motion.div
                    key={schedule.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'bg-white border rounded-2xl overflow-hidden transition-all group',
                      isCompleted
                        ? 'border-emerald-200'
                        : isStarted
                          ? 'border-sky-200'
                          : 'border-gray-200 hover:shadow-lg'
                    )}
                  >
                    {viewMode === 'grid' && (
                      <div
                        className={cn(
                          'h-2 w-full',
                          isCompleted ? 'bg-emerald-500' : isStarted ? 'bg-sky-500' : 'bg-blue-600'
                        )}
                      />
                    )}

                    <div className={cn(
                      'flex gap-4',
                      viewMode === 'grid' ? 'p-5' : 'p-4'
                    )}>
                      {/* Entity type icon */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : isStarted
                            ? 'bg-sky-50 text-sky-600 animate-pulse'
                            : entityColor(schedule.entity_type || 'doctor')
                      )}>
                        {isCompleted
                          ? <CheckCircle2 className="w-6 h-6" />
                          : isStarted
                            ? <Zap className="w-6 h-6" />
                            : entityIcon(schedule.entity_type || 'doctor', 20)
                        }
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {schedule.doctor_name}
                          </h4>
                          {schedule.tier && (
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border',
                              schedule.tier === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              schedule.tier === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            )}>
                              Tier {schedule.tier}
                            </span>
                          )}
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            priorityBadge(schedule.priority ?? 'medium')
                          )}>
                            {schedule.priority ?? 'medium'}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            statusBadge(schedule.status ?? 'pending')
                          )}>
                            {schedule.status ?? 'pending'}
                          </span>
                          {(() => {
                            const pastCount = allVisits.filter(v => v.doctor_name === schedule.doctor_name).length;
                            return (
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 ml-auto',
                                pastCount === 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              )}>
                                <CheckCircle2 className="w-3 h-3" />
                                {pastCount === 0 ? 'First Visit' : `${pastCount} Past Visit${pastCount > 1 ? 's' : ''}`}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.scheduled_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {schedule.clinic || schedule.doctor_name}
                          </span>
                          {schedule.specialty && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Stethoscope className="w-3 h-3" />
                              {schedule.specialty}
                            </span>
                          )}
                          {schedule.status === 'completed' && schedule.completed_at && (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs">
                              <Check className="w-3 h-3" />
                              Completed at {schedule.completed_at}
                            </span>
                          )}
                        </div>
                        {schedule.purpose && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 line-clamp-2">
                            {schedule.purpose}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons — always visible */}
                    <div className={cn(
                      'flex flex-col sm:flex-row items-stretch sm:items-center gap-2',
                      viewMode === 'grid' ? 'px-5 pb-4' : 'px-4 pb-3'
                    )}>
                      {!isCompleted && (
                        <button
                          onClick={() => handleStartVisit(schedule)}
                          disabled={startingVisit === schedule.id}
                          className={cn(
                            'flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-xl font-bold transition-all shadow-sm min-h-[44px]',
                            isStarted
                              ? 'bg-sky-600 text-white hover:bg-sky-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          )}
                        >
                          {startingVisit === schedule.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isStarted ? (
                            <Navigation className="w-4 h-4" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          <span>{isStarted ? 'Continue Visit' : 'Start Visit'}</span>
                        </button>
                      )}
                      {isCompleted && (
                        <button
                          disabled
                          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-default min-h-[44px]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleCall(schedule)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View contact info"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : schedule.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded
                          ? <ChevronDown className="w-5 h-5" />
                          : <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
                            {schedule.notes && (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Doctor Notes</p>
                                <p className="text-sm text-gray-700">{schedule.notes}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {schedule.estimated_duration && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span>Est. {schedule.estimated_duration} min</span>
                                </div>
                              )}
                              {schedule.specialty && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Stethoscope className="w-4 h-4 text-gray-400" />
                                  <span>{schedule.specialty}</span>
                                </div>
                              )}
                              {schedule.tier && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span>Tier {schedule.tier}</span>
                                </div>
                              )}
                              {schedule.address && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="truncate">{schedule.address}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleViewVisit(schedule.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Visit Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Field Activity Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Field Activity Reports
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Standard Performance Log</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={() => setExpandedVisit(expandedVisit === 'all' ? null : 'all')}
              className="px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"
            >
              {expandedVisit === 'all' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expandedVisit === 'all' ? 'Collapse All' : 'Expand All'}
            </button>
            <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider">{recentVisits.length} Records</span>
          </div>
        </div>

        {recentVisits.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No recent visit logs for this MR.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentVisits.slice(0, 8).map((visit) => {
              const isVisitExpanded = expandedVisit === visit.id || expandedVisit === 'all';
              return (
                <motion.div
                  key={visit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden',
                    isVisitExpanded ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100'
                  )}
                  onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          entityColor(visit.entity_type)
                        )}>
                          {entityIcon(visit.entity_type, 20)}
                        </div>
                        <div>
                          <Link 
                            to={`/directory?type=${visit.entity_type}&search=${encodeURIComponent(visit.entity_name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {visit.entity_name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {visit.entity_type} • {visit.visit_date} {visit.visit_time && `at ${visit.visit_time}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {visit.sentiment && (
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shadow-sm border transition-transform hover:scale-110",
                            visit.sentiment === 'positive' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            visit.sentiment === 'negative' ? "bg-rose-50 border-rose-100 text-rose-600" :
                            "bg-amber-50 border-amber-100 text-amber-600"
                          )} title={`AI Detected Sentiment: ${visit.sentiment}`}>
                            {visit.sentiment === 'positive' ? <Smile className="w-4 h-4" /> :
                             visit.sentiment === 'negative' ? <Frown className="w-4 h-4" /> :
                             <Meh className="w-4 h-4" />}
                          </div>
                        )}
                        {visit.order_value > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            ₹{visit.order_value.toLocaleString()}
                          </span>
                        )}
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          visit.status === 'in_progress' ? 'bg-sky-100 text-sky-700' :
                          'bg-gray-100 text-gray-500'
                        )}>
                          {visit.status}
                        </span>
                        {isVisitExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 italic">
                      &ldquo;{visit.conversation_summary || visit.notes || visit.outcome || visit.purpose || 'Routine medical representative visit and stock review.'}&rdquo;
                      {visit.conversation_summary && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                          <Zap className="w-2.5 h-2.5 fill-blue-600/20" /> AI Summary
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Expanded visit details */}
                  <AnimatePresence>
                    {isVisitExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider",
                                visit.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                visit.status === 'in_progress' ? "bg-sky-50 text-sky-600 border border-sky-100" :
                                "bg-amber-50 text-amber-600 border border-amber-100"
                              )}>
                                {visit.status || 'COMPLETED'}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-In</p>
                                <p className="text-xs font-black text-gray-700">{visit.check_in_time || visit.visit_time || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-Out</p>
                                <p className="text-xs font-black text-gray-700">{visit.check_out_time || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visit Purpose</p>
                            <p className="text-sm text-gray-700 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 leading-relaxed font-medium">
                              {visit.purpose || 'Routine medical representative visit and stock review.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Products Detailed</p>
                              <div className="flex flex-wrap gap-1">
                                {(function() {
                                  const products = visit.products_detailed;
                                  if (!products) return [];
                                  if (Array.isArray(products)) return products;
                                  if (typeof products === 'string') {
                                    try {
                                      const parsed = JSON.parse(products);
                                      return Array.isArray(parsed) ? parsed : [parsed];
                                    } catch {
                                      return products.split(',').map(s => s.trim()).filter(Boolean);
                                    }
                                  }
                                  return [];
                                })().length > 0 ? (
                                  (function() {
                                    const products = visit.products_detailed;
                                    if (Array.isArray(products)) return products;
                                    if (typeof products === 'string') {
                                      try {
                                        const parsed = JSON.parse(products);
                                        return Array.isArray(parsed) ? parsed : [parsed];
                                      } catch {
                                        return products.split(',').map(s => s.trim()).filter(Boolean);
                                      }
                                    }
                                    return [];
                                  })().map((p, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded border border-blue-100">
                                      {p}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-gray-400 italic">None</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Samples Given</p>
                              <div className="flex flex-wrap gap-1">
                                {(function() {
                                  const samples = visit.samples_given;
                                  if (!samples) return [];
                                  if (Array.isArray(samples)) return samples;
                                  if (typeof samples === 'string') {
                                    try {
                                      const parsed = JSON.parse(samples);
                                      return Array.isArray(parsed) ? parsed : [parsed];
                                    } catch {
                                      return samples.split(',').map(s => s.trim()).filter(Boolean);
                                    }
                                  }
                                  return [];
                                })().length > 0 ? (
                                  (function() {
                                    const samples = visit.samples_given;
                                    if (Array.isArray(samples)) return samples;
                                    if (typeof samples === 'string') {
                                      try {
                                        const parsed = JSON.parse(samples);
                                        return Array.isArray(parsed) ? parsed : [parsed];
                                      } catch {
                                        return samples.split(',').map(s => s.trim()).filter(Boolean);
                                      }
                                    }
                                    return [];
                                  })().map((s, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded border border-rose-100">
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-gray-400 italic">None</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewVisit(visit.id, false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Full Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Morning Briefing Modal */}
      <MorningBriefingModal
        briefing={briefing}
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        onStartNavigation={(item) => {
          setShowBriefingModal(false);
          // Open Google Maps with the clinic location
          const query = encodeURIComponent(`${item.clinic}, ${item.territory}`);
          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        }}
        onStartVisit={(item) => {
          setShowBriefingModal(false);
          handleStartVisit({ id: item.id });
        }}
      />
      {/* Visit Details Modal */}
      <AnimatePresence>
        {viewingVisitDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      {viewingVisitDetails.type === 'schedule' ? 'Scheduled Visit Details' : 'Completed Visit Record'}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        {viewingVisitDetails.data.doctor_name || viewingVisitDetails.data.entity_name}
                      </p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {viewingVisitDetails.data.visit_date ? new Date(viewingVisitDetails.data.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '28 Mar 2026'}
                      </p>
                      {viewingVisitDetails.data.sentiment && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-tight",
                            viewingVisitDetails.data.sentiment === 'positive' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            viewingVisitDetails.data.sentiment === 'negative' ? "bg-rose-50 border-rose-100 text-rose-600" :
                            "bg-amber-50 border-amber-100 text-amber-600"
                          )}>
                            {viewingVisitDetails.data.sentiment === 'positive' ? <Smile className="w-3 h-3" /> :
                             viewingVisitDetails.data.sentiment === 'negative' ? <Frown className="w-3 h-3" /> :
                             <Meh className="w-3 h-3" />}
                            {viewingVisitDetails.data.sentiment}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingVisitDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {viewingVisitDetails.type === 'schedule' && (
                  <div className="flex items-center justify-between bg-white border rounded-xl p-4 shadow-sm mb-6">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Current Status
                    </span>
                    <span className={cn(
                      "px-4 py-1.5 text-sm font-bold rounded-full border shadow-sm",
                      viewingVisitDetails.data.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" :
                      viewingVisitDetails.data.status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {viewingVisitDetails.data.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                )}

                {viewingVisitDetails.type === 'schedule' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">Time & Duration</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                          <Clock className="w-5 h-5 text-blue-500" />
                          {viewingVisitDetails.data.scheduled_time} <span className="text-sm text-gray-400 font-normal">({viewingVisitDetails.data.estimated_duration} min)</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">Priority</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2 text-base">
                          <Zap className={cn(
                            "w-5 h-5",
                            viewingVisitDetails.data.priority === 'high' ? 'text-rose-500 fill-rose-500/20' : 'text-amber-500 fill-amber-500/20'
                          )} />
                          {viewingVisitDetails.data.priority?.toUpperCase() || 'NORMAL'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                      <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100/50">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-600" /> Visit Purpose
                        </h4>
                      </div>
                      <div className="p-5 text-gray-700 font-medium leading-relaxed">
                        {viewingVisitDetails.data.purpose || 'Routine medical representative visit and stock review.'}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                      <div className="bg-amber-50/50 px-5 py-3 border-b border-amber-100/50">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-600" /> Doctor Notes & Instructions
                        </h4>
                      </div>
                      <div className="p-5 text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {viewingVisitDetails.data.notes || 'Routine medical representative visit and stock review.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status & Timing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-[0.1em] group-hover:text-blue-500 transition-colors">Current Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2.5 py-0.5 text-[11px] font-black rounded-md uppercase tracking-wider",
                            viewingVisitDetails.data.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            viewingVisitDetails.data.status === 'in_progress' ? "bg-sky-50 text-sky-600 border border-sky-100" :
                            "bg-amber-50 text-amber-600 border border-amber-100"
                          )}>
                            {viewingVisitDetails.data.status?.toUpperCase() || 'COMPLETED'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-[0.1em] group-hover:text-blue-500 transition-colors">Check-In</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-black text-gray-900 font-mono tracking-tight">
                            {viewingVisitDetails.data.check_in_time || viewingVisitDetails.data.visit_time || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-[0.1em] group-hover:text-blue-500 transition-colors">Check-Out</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
                            <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                          <span className="text-sm font-black text-gray-900 font-mono tracking-tight">
                            {viewingVisitDetails.data.check_out_time || (viewingVisitDetails.data.visit_time ? `${viewingVisitDetails.data.visit_time} (Est.)` : 'N/A')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purpose Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Navigation className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Visit Purpose</h4>
                      </div>
                      <div className="text-sm text-gray-700 font-bold leading-relaxed pl-9 border-l-2 border-blue-100/50 italic">
                        &ldquo;{viewingVisitDetails.data.purpose || 'Routine medical representative visit and stock review.'}&rdquo;
                      </div>
                    </div>

                    {/* Products & Samples Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-indigo-500" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Products Detailed</span>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {(function() {
                              const products = viewingVisitDetails.data.products_detailed;
                              if (!products) return [];
                              if (Array.isArray(products)) return products;
                              if (typeof products === 'string') {
                                try {
                                  const parsed = JSON.parse(products);
                                  return Array.isArray(parsed) ? parsed : [parsed];
                                } catch {
                                  return products.split(',').map(s => s.trim()).filter(Boolean);
                                }
                              }
                              return [];
                            })().length > 0 ? (
                              (function() {
                                const products = viewingVisitDetails.data.products_detailed;
                                if (Array.isArray(products)) return products;
                                if (typeof products === 'string') {
                                  try {
                                    const parsed = JSON.parse(products);
                                    return Array.isArray(parsed) ? parsed : [parsed];
                                  } catch {
                                    return products.split(',').map(s => s.trim()).filter(Boolean);
                                  }
                                }
                                return [];
                              })().map((p, idx) => (
                                <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-100">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">No products recorded</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                          <Gift className="w-4 h-4 text-rose-500" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Samples Given</span>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {(function() {
                              const samples = viewingVisitDetails.data.samples_given;
                              if (!samples) return [];
                              if (Array.isArray(samples)) return samples;
                              if (typeof samples === 'string') {
                                try {
                                  const parsed = JSON.parse(samples);
                                  return Array.isArray(parsed) ? parsed : [parsed];
                                } catch {
                                  return samples.split(',').map(s => s.trim()).filter(Boolean);
                                }
                              }
                              return [];
                            })().length > 0 ? (
                              (function() {
                                const samples = viewingVisitDetails.data.samples_given;
                                if (Array.isArray(samples)) return samples;
                                if (typeof samples === 'string') {
                                  try {
                                    const parsed = JSON.parse(samples);
                                    return Array.isArray(parsed) ? parsed : [parsed];
                                  } catch {
                                    return samples.split(',').map(s => s.trim()).filter(Boolean);
                                  }
                                }
                                return [];
                              })().map((s, idx) => (
                                <span key={idx} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md border border-rose-100">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">No samples given</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full Notes / Outcome */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-emerald-50/50 px-4 py-2.5 border-b border-emerald-100/50 flex items-center gap-2">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Executive Summary & AI Insights</span>
                          </div>
                          {viewingVisitDetails.data.conversation_summary && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-tighter border border-purple-100 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 fill-purple-600/20" /> AI Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-5 text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                        {viewingVisitDetails.data.outcome || viewingVisitDetails.data.notes || 'Routine medical representative visit and stock review.'}
                      </div>
                    </div>

                    {viewingVisitDetails.data.next_steps && (
                      <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-indigo-50/80 px-5 py-3 border-b border-indigo-100/80">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-indigo-600" /> Next Steps / Follow-up
                          </h4>
                        </div>
                        <div className="p-5 text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {viewingVisitDetails.data.next_steps}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => setViewingVisitDetails(null)}
                  className="px-6 py-2.5 rounded-xl font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
                >
                  Close
                </button>
                {viewingVisitDetails.type === 'schedule' && viewingVisitDetails.data.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setViewingVisitDetails(null);
                      handleStartVisit(viewingVisitDetails.data);
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Start Visit Now
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Calendar Modal */}
      <MRCalendar isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />

      {/* Field Sync Modal */}
      <FieldSyncModal 
        isOpen={showFieldSync} 
        onClose={() => setShowFieldSync(false)} 
        mrId={effectiveMrId || 1} 
      />
    </div>
  );
}
