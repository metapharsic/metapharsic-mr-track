import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MR, Visit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { locationService } from '../services/locationService';
import {
  Calendar, MapPin, Clock,
  CheckCircle2, AlertCircle,
  ChevronRight, ChevronDown, User, Phone,
  ExternalLink, Loader2,
  LayoutGrid, List as ListIcon,
  ShoppingBag, Building2, Stethoscope, LogIn,
  X as XIcon, Check, Eye, Navigation, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import MorningBriefingModal, { DailyBriefing, BriefingItem } from './MorningBriefingModal';

const today = new Date().toISOString().split('T')[0];

export default function MRDashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [mrs, setMrs] = useState<MR[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Attendance state
  const [attendance, setAttendance] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Schedule expansion / visit tracking
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [startedVisits, setStartedVisits] = useState<Set<number>>(new Set());
  const [startingVisit, setStartingVisit] = useState<number | null>(null);

  // Expanded recent visit
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);

  // Morning briefing state
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingLoaded, setBriefingLoaded] = useState(false);

  // Determine effective MR ID based on role
  const effectiveMrId = selectedMrId ?? (user?.role === 'mr' ? (user.mr_id ?? null) : null);

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
      setRecentVisits(mrVisits.slice(0, 10));

      // Check if attendance already exists for today
      const todayAttendance = attendanceData.find(a => a.date === today && a.mr_id === effectiveMrId);
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

  const selectedMr = mrs.find(m => m.id === selectedMrId);

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
      setAttendance(result ?? { check_in: checkInTime });
      addNotification({ title: 'Attendance', message: `Checked in successfully at ${checkInTime}`, type: 'success', link: '/mr-dashboard' });
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
    addNotification({ title: 'Contact', message: `Contact info — ${schedule.doctor_name} at ${schedule.clinic}`, type: 'info', link: '/directory' });
  }, [addNotification]);

  const handleViewVisit = useCallback((visitId: number) => {
    window.location.hash = `/visit-records?id=${visitId}`;
  }, []);

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

      {/* Profile Card */}
      {selectedMr && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30">
                  {selectedMr.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedMr.name}</h2>
                  <p className="text-blue-100 flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" />
                    {selectedMr.territory}
                  </p>
                  {user?.role === 'mr' && (
                    <p className="text-blue-200 text-xs mt-0.5">MR ID: {user.mr_id ?? '—'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Today&apos;s Visits</p>
                  <p className="text-xl sm:text-2xl font-bold">{schedules.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {schedules.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {schedules.filter(s => s.status === 'in_progress' || startedVisits.has(s.id)).length}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Performance</p>
                  <p className="text-xl sm:text-2xl font-bold">{selectedMr.performance_score}%</p>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="flex flex-col justify-center items-end gap-2">
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md',
                  attendance?.check_in
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                )}
              >
                {checkingIn
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : attendance?.check_in
                    ? <><CheckCircle2 className="w-5 h-5" /></>
                    : <><LogIn className="w-5 h-5" /></>
                }
                <span>
                  {checkingIn ? 'Checking in...' : attendance?.check_in
                    ? 'Checked In' : 'Mark Attendance'}
                </span>
              </button>
              {attendance?.check_in ? (
                <p className="text-xs text-blue-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Checked in at {attendance.check_in}
                </p>
              ) : (
                <p className="text-xs text-blue-200">No check-in today</p>
              )}
            </div>
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
                      {/* Index / status icon */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg',
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : isStarted
                            ? 'bg-sky-50 text-sky-600 animate-pulse'
                            : 'bg-blue-50 text-blue-600'
                      )}>
                        {isCompleted
                          ? <CheckCircle2 className="w-6 h-6" />
                          : isStarted
                            ? <Zap className="w-6 h-6" />
                            : index + 1
                        }
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {schedule.doctor_name}
                          </h4>
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
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.scheduled_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {schedule.clinic}
                          </span>
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

      {/* Recent Visit Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Recent Visit Logs
          </h3>
          <span className="text-sm text-gray-500">{recentVisits.length} logs found</span>
        </div>

        {recentVisits.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No recent visit logs for this MR.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentVisits.slice(0, 8).map((visit) => {
              const isVisitExpanded = expandedVisit === visit.id;
              return (
                <motion.div
                  key={visit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden',
                    isVisitExpanded ? 'border-blue-200' : 'border-gray-100'
                  )}
                  onClick={() => setExpandedVisit(isVisitExpanded ? null : visit.id)}
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
                          <h4 className="font-bold text-gray-900">{visit.entity_name}</h4>
                          <p className="text-xs text-gray-500">
                            {visit.entity_type} • {visit.visit_date} {visit.visit_time && `at ${visit.visit_time}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
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
                      &ldquo;{visit.notes || visit.purpose || 'No notes recorded'}&rdquo;
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
                          {visit.clinic && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{visit.clinic}</span>
                            </div>
                          )}
                          {visit.purpose && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Purpose</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{visit.purpose}</p>
                            </div>
                          )}
                          {visit.notes && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Notes</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{visit.notes}</p>
                            </div>
                          )}
                          {visit.conversation_summary && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Conversation Summary</p>
                              <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                {visit.conversation_summary}
                              </p>
                            </div>
                          )}
                          {visit.order_value > 0 && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                              <ShoppingBag className="w-4 h-4" />
                              <span>Order Value: ₹{visit.order_value.toLocaleString()}</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewVisit(visit.id);
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
      />
    </div>
  );
}
