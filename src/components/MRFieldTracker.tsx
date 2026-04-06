import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import {
  MapPin, Camera, Clock, Mic, Square, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, X, Stethoscope,
  Pill, Building2, Send, Printer, CreditCard, Phone,
  Navigation, FileText, Zap, Calendar, TrendingUp,
  User, ShoppingBag, Timer, PhoneOff, Play
} from 'lucide-react';

export default function MRFieldTracker() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [mrs, setMrs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const mrProfile = mrs.find(m => m.id === user?.id) || mrs[0];
  const mrId = user?.isMR ? user.id : (user?.role === 'admin' ? (mrs[0]?.id || 0) : 0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      api.mrs.getAll(),
      api.visits.getSchedules(),
      api.visitRecords.getAll(mrId),
      api.dailySummaries.get(mrId),
    ]).then(([m, s, recs, sum]) => {
      setMrs(m);
      setSchedules(s);
      const daySched = s.filter((v: any) => {
        const hasRecord = recs.some((r: any) => r.scheduled_visit_id === v.id || r.entity_name === v.doctor_name);
        return v.mr_id === mrId && !hasRecord;
      });
      setTodayVisits(daySched);
      setSummary(sum);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !mrId) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">{mrProfile?.name?.split(' ').map((n: string) => n[0]).join('')}</div>
          <div>
            <h2 className="text-lg font-bold">{mrProfile?.name}</h2>
            <p className="text-blue-200 text-xs">{mrProfile?.territory}</p>
          </div>
        </div>
        {summary && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Completed</p><p className="text-xl font-bold">{summary.completed_visits || 0}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Pending</p><p className="text-xl font-bold">{summary.scheduled_visits - summary.completed_visits || todayVisits.length}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Missed</p><p className="text-xl font-bold text-red-300">{summary.missed_visits || 0}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Compliance</p><p className="text-xl font-bold">{summary.schedule_compliance}%</p></div>
          </div>
        )}
      </div>

      {/* Today's Pending Visits */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" />Today's Schedule ({todayVisits.length})</h3>
        {todayVisits.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">No pending visits left for today.</div>
        ) : todayVisits.map(v => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{v.scheduled_time}</div>
              <div>
                <p className="font-medium text-gray-900">{v.doctor_name}{v.purpose && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-1 font-bold">{v.purpose}</span>}</p>
                <p className="text-xs text-gray-500">{v.clinic} <span className="text-blue-500">#{v.priority}</span></p>
              </div>
            </div>
            <a href={`/visit/${v.id}`}><ChevronRight className="w-5 h-5 text-gray-300" /></a>
          </div>
        ))}
      </div>

    if (!activeVisit && (
      <>
        {/* Add a "Start Visit" button to scheduled visits — replace the href link */}
        {todayVisits.map(v => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{v.scheduled_time}</div>
              <div>
                <p className="font-medium text-gray-900">{v.doctor_name}{v.purpose && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-1 font-bold">{v.purpose}</span>}</p>
                <p className="text-xs text-gray-500">{v.clinic} <span className="text-blue-500">#{v.priority}</span></p>
              </div>
            </div>
            <button onClick={() => setActiveVisit(v)}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">
              Start Visit
            </button>
          </div>
        ))}

        {/* Summary section with a "Start Unscheduled Visit" button */}
        {[...todayVisits.map(v => v)].length === 0 && (
          <button onClick={() => setActiveVisit({ id: 0, entityName: 'Quick Visit', entityType: 'doctor', clinic: '', scheduled_time: 'Now' })}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
            Start New Visit
          </button>
        )}
      </>
    )}

    {/* Active Visit Flow */}
    {activeVisit && (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Visit to {activeVisit?.entityName || activeVisit?.doctor_name}</h3>
          <button onClick={() => setActiveVisit(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <p className="text-xs text-gray-500">Follow the steps: GPS → Photo → Wait → Speak → Conversation → Outcome → Checkout</p>
        <button onClick={() => setActiveVisit(null)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
          Complete Visit &amp; Checkout
        </button>
      </div>
    )}
  </div>
);
}
