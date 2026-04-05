import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MR, Visit } from '../types';
import { 
  Calendar, MapPin, Clock, 
  CheckCircle2, AlertCircle, 
  ChevronRight, User, Phone,
  Mail, ExternalLink, Loader2,
  LayoutGrid, List as ListIcon,
  Filter, Search, Zap, ShoppingBag,
  Building2, Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function MRDashboard() {
  const [mrs, setMrs] = useState<MR[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    api.mrs.getAll().then(data => {
      setMrs(data);
      if (data.length > 0) {
        setSelectedMrId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedMrId) {
      setLoading(true);
      Promise.all([
        api.visits.getSchedules(),
        api.visits.getAll()
      ]).then(([schedulesData, visitsData]) => {
        const mrSchedules = schedulesData.filter(s => s.mr_id === selectedMrId);
        const mrVisits = visitsData.filter(v => v.mr_id === selectedMrId);
        setSchedules(mrSchedules);
        setRecentVisits(mrVisits);
        setLoading(false);
      });
    }
  }, [selectedMrId]);

  const selectedMr = mrs.find(m => m.id === selectedMrId);

  if (loading && mrs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MR Market Dashboard</h1>
          <p className="text-gray-500">Daily visit assignments and territory schedule</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <User className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
              value={selectedMrId || ''}
              onChange={(e) => setSelectedMrId(Number(e.target.value))}
            >
              {mrs.map(mr => (
                <option key={mr.id} value={mr.id}>{mr.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

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
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Today's Visits</p>
                  <p className="text-2xl font-bold">{schedules.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Performance</p>
                  <p className="text-2xl font-bold">{selectedMr.performance_score}%</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center items-end gap-2">
              <button className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md">
                <CheckCircle2 className="w-5 h-5" />
                <span>Mark Attendance</span>
              </button>
              <p className="text-xs text-blue-200">Last check-in: 09:15 AM</p>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-gray-500 max-w-xs mx-auto">You don't have any visits scheduled for today. Check back later or contact your manager.</p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            <AnimatePresence mode="popLayout">
              {schedules.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group",
                    viewMode === 'list' ? "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" : "p-0"
                  )}
                >
                  {viewMode === 'grid' && (
                    <div className="h-2 bg-blue-600 w-full" />
                  )}
                  
                  <div className={cn(
                    "flex gap-4",
                    viewMode === 'grid' ? "p-5" : ""
                  )}>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg">
                      {index + 1}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{schedule.doctor_name}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          schedule.priority === 'high' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {schedule.priority || 'medium'}
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
                      </div>
                      {schedule.purpose && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 line-clamp-2">
                          {schedule.purpose}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2",
                    viewMode === 'grid' ? "p-5 pt-0" : ""
                  )}>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>Start Visit</span>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      {/* Recent Visit Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
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
            {recentVisits.slice(0, 4).map((visit) => (
              <div key={visit.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      visit.entity_type === 'doctor' ? "bg-blue-50 text-blue-600" :
                      visit.entity_type === 'chemist' ? "bg-amber-50 text-amber-600" :
                      visit.entity_type === 'hospital' ? "bg-emerald-50 text-emerald-600" :
                      "bg-purple-50 text-purple-600"
                    )}>
                      {visit.entity_type === 'doctor' ? <User size={20} /> :
                       visit.entity_type === 'chemist' ? <ShoppingBag size={20} /> :
                       visit.entity_type === 'hospital' ? <Building2 size={20} /> :
                       <Stethoscope size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{visit.entity_name}</h4>
                      <p className="text-xs text-gray-500">{visit.entity_type} • {visit.visit_date}</p>
                    </div>
                  </div>
                  {visit.order_value > 0 && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      ₹{visit.order_value.toLocaleString()}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 italic">"{visit.notes}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
