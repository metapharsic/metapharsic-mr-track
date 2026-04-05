import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Visit, MR } from '../types';
import { 
  Calendar as CalendarIcon, Clock, MapPin, 
  User, ChevronRight, Plus, Filter,
  CheckCircle2, AlertCircle, CalendarDays,
  MoreVertical, Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function VisitSchedule() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      api.visits.getSchedules(),
      api.mrs.getAll()
    ]).then(([s, m]) => {
      setSchedules(s);
      setMrs(m);
      setLoading(false);
    });
  }, []);

  const getMrName = (id: number) => mrs.find(m => m.id === id)?.name || 'Unknown MR';

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
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Schedule New Visit
        </button>
      </header>

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
                    {isSelected && <CheckCircle2 size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" />
              AI Insights
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Route optimization for tomorrow could save 12km of travel for Rajesh Kumar. 
              3 high-potential doctors in Uppal are overdue for a visit.
            </p>
            <button className="w-full mt-4 py-2 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
              Optimize All Routes
            </button>
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
            {schedules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
                <h4 className="text-lg font-bold text-slate-900">No visits scheduled</h4>
                <p className="text-slate-500 mt-1">There are no visits planned for this date yet.</p>
                <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Schedule Now
                </button>
              </div>
            ) : (
              schedules.map((visit, i) => (
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
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      visit.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {visit.status}
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
