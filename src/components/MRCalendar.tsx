import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, X, Activity, Receipt, User, Building2, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface MRCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MRCalendar({ isOpen, onClose }: MRCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [visitSchedules, setVisitSchedules] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthData = async (date: Date) => {
    setLoading(true);
    try {
      const mrId = user?.mr_id || 1;
      const [attRes, visRes, expRes] = await Promise.all([
        fetch(`/api/attendance?mr_id=${mrId}`),
        fetch(`/api/visit-schedules?mr_id=${mrId}`),
        fetch(`/api/expenses?mr_id=${mrId}`)
      ]);
      const attData = await attRes.json();
      const visData = await visRes.json();
      const expData = await expRes.json();

      setAttendanceRecords(attData || []);
      setVisitSchedules(visData || []);
      setExpenses(expData || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthData(currentDate);
  }, [currentDate, user?.mr_id]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatMins = (mins: number) => `${Math.floor((mins || 0)/60)}h ${(mins || 0)%60}m`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 border border-slate-100">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Activity Calendar
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track daily productive time and visits</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg">&lt;</button>
          <span className="font-bold text-slate-700 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg">&gt;</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-slate-400 text-sm">{day}</div>
          ))}
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-xl bg-slate-50/50 border border-slate-100/50" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = attendanceRecords.find(a => a.date === dateStr);
              
              const totalVisits = record ? ((record.visit_counts.doctor || 0) + (record.visit_counts.clinic || 0) + (record.visit_counts.chemist || 0) + (record.visit_counts.hospital || 0)) : 0;
                
              // Heatmap logic
              let heatmapClass = "bg-white border-blue-200 cursor-pointer hover:border-blue-400 hover:shadow-md";
              if (record) {
                if (totalVisits === 0) heatmapClass = "bg-slate-50 border-slate-200 cursor-pointer hover:border-slate-400";
                else if (totalVisits <= 2) heatmapClass = "bg-emerald-50 border-emerald-200 cursor-pointer hover:border-emerald-400";
                else if (totalVisits <= 5) heatmapClass = "bg-emerald-100 border-emerald-300 cursor-pointer hover:border-emerald-500";
                else if (totalVisits <= 8) heatmapClass = "bg-emerald-200 border-emerald-400 cursor-pointer hover:border-emerald-600";
                else heatmapClass = "bg-emerald-300 border-emerald-500 cursor-pointer hover:border-emerald-700";
              }

              return (
                <div 
                  key={`day-${day}`}
                  onClick={() => record ? setSelectedDay({ ...record, date: dateStr }) : null}
                  className={cn(
                    "h-20 border rounded-xl p-2 flex flex-col relative transition-all duration-200",
                    record 
                      ? heatmapClass
                      : "bg-slate-50 border-slate-100"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                    new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-600"
                  )}>
                    {day}
                  </span>
                  
                  {record && (
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md flex justify-between">
                        <span>Visits:</span>
                        <span>{totalVisits}</span>
                      </div>
                      <div className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md flex justify-between">
                        <span>Prod:</span>
                        <span>{formatMins(record.productive_time_mins)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="font-bold text-lg">Activity Summary</h3>
                <p className="text-blue-100 text-sm">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Timeline */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="block text-xs text-slate-500 font-bold uppercase tracking-wide">Check In</span>
                  <span className="text-lg font-bold text-slate-800">{selectedDay.check_in || '--:--'}</span>
                </div>
                <div className="text-slate-300">→</div>
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="block text-xs text-slate-500 font-bold uppercase tracking-wide">Check Out</span>
                  <span className="text-lg font-bold text-slate-800">{selectedDay.check_out || 'Active'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Productive</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatMins(selectedDay.productive_time_mins)}</p>
                </div>
                
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Travel Time</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatMins(selectedDay.travel_time_mins)}</p>
                </div>
                
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Visit Time</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatMins(selectedDay.visit_time_mins)}</p>
                </div>

                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Total Visits</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {(selectedDay.visit_counts?.doctor || 0) + (selectedDay.visit_counts?.chemist || 0) + (selectedDay.visit_counts?.hospital || 0)}
                  </p>
                </div>
              </div>

              {/* Detailed Lists Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Visits List */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Visits Log
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {visitSchedules.filter(v => v.scheduled_date === selectedDay.date).length > 0 ? (
                      visitSchedules.filter(v => v.scheduled_date === selectedDay.date).map(v => (
                        <div key={v.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-800">{v.clinic}</p>
                            <p className="text-xs text-slate-500 capitalize">{v.entity_type} • {v.status}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                            {v.scheduled_time}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">No visits scheduled for this date.</p>
                    )}
                  </div>
                </div>

                {/* Expenses List */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Expenses Filed
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {expenses.filter(e => e.date === selectedDay.date).length > 0 ? (
                      expenses.filter(e => e.date === selectedDay.date).map(e => (
                        <div key={e.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-800 capitalize">{e.category}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[140px]">{e.description}</p>
                          </div>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            ₹{e.amount}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">No expenses filed for this date.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
