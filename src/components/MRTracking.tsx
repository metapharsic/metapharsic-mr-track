import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MR, Visit, VisitSchedule as VSchedule, Attendance } from '../types';
import {
  MapPin, Clock, User, Phone, Mail, Activity,
  CheckCircle2, AlertCircle, Loader2, Search,
  Zap, Calendar, TrendingUp, Eye, Download,
  ChevronRight, Circle, CircleDashed
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Location {
  mr_id: number;
  mr_name: string;
  lat: number;
  lng: number;
  timestamp: string;
  activity_type: string;
  speed: number;
}

interface VisitRecording {
  id: number;
  mr_id: number;
  mr_name: string;
  entity_type: string;
  entity_name: string;
  transcript: string;
  language: string;
  is_lead: boolean;
  lead_confidence: number;
  lead_reasoning: string;
  is_sale: boolean;
  sale_amount: number;
  sale_details: string;
  follow_up_needed: boolean;
  follow_up_purpose: string;
  visit_date: string;
  visit_time: string;
  status: string;
  created_at: string;
}

export default function MRTracking() {
  const { user } = useAuth();
  const [mrs, setMrs] = useState<MR[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recordings, setRecordings] = useState<VisitRecording[]>([]);
  const [schedules, setSchedules] = useState<VSchedule[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.mrs.getAll(),
      api.locations.getAll(),
      api.recordings.getAll(),
      api.visits.getSchedules(),
      api.attendance.getAll()
    ]).then(([m, l, r, s, a]) => {
      setMrs(m);
      setLocations(l);
      setRecordings(r);
      setSchedules(s);
      setAttendances(a);
      if (m.length > 0 && selectedMrId === null) setSelectedMrId(m[0].id);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    // Real-time polling every 10 seconds for field tracking
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const selectedMr = mrs.find(mr => mr.id === selectedMrId);
  const selectedLocation = locations.find(l => l.mr_id === selectedMrId);
  const mrRecordings = recordings.filter(r => r.mr_id === selectedMrId);
  const mrSchedules = schedules.filter(s => s.mr_id === selectedMrId);
  const mrVisitsToday = mrRecordings.filter(r => r.visit_date === new Date().toISOString().split('T')[0]);
  const leadsDetected = mrRecordings.filter(r => r.is_lead);
  const salesDetected = mrRecordings.filter(r => r.is_sale);

  // Check alerts
  const todayDate = new Date().toISOString().split('T')[0];
  const hasCheckedIn = attendances.some(a => a.mr_id === selectedMrId && a.date === todayDate);
  const now = new Date();
  
  let checkInAlert = '';
  if (!hasCheckedIn && now.getHours() >= 10) {
    checkInAlert = "Missed Check-in: MR hasn't checked in by 10:00 AM";
  }

  let locationStaleAlert = '';
  if (selectedLocation) {
    const locTime = new Date(selectedLocation.timestamp);
    const diffHours = (now.getTime() - locTime.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 2) {
      locationStaleAlert = `Location data stale: Last updated ${Math.floor(diffHours)} hours ago`;
    }
  }

  const exportReport = () => {
    if (!selectedMr) return;
    
    // Create CSV content
    const header = "Date,Time,Entity,Type,Transcript,Is Lead,Sale Amount\n";
    const rows = mrRecordings.map(r => 
      `${r.visit_date},${r.visit_time},"${r.entity_name}",${r.entity_type},"${r.transcript?.replace(/"/g, '""') || ''}",${r.is_lead ? 'Yes' : 'No'},${r.sale_amount}`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMr.name}_activity_report_${todayDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Field Monitor</h1>
          <p className="text-gray-500">Real-time oversight of all Medical Representatives</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Updates Active
          </div>
        </div>
      </div>

      {/* Global Map View */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-blue-600" size={18} />
            Real-Time Territorial Map
          </h2>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full" /> Active Visit</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full" /> Traveling</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded-full" /> Idle</div>
          </div>
        </div>
        
        <div className="relative w-full h-80 bg-slate-100 overflow-hidden">
          {/* Simulated map background */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#94A3B8 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
          
          {/* Map Pins */}
          {locations.map(loc => {
            // Rough bounding box for Hyderabad coords
            const minLng = 78.30; const maxLng = 78.60;
            const minLat = 17.35; const maxLat = 17.50;
            
            const x = ((loc.lng - minLng) / (maxLng - minLng)) * 100;
            const y = ((maxLat - loc.lat) / (maxLat - minLat)) * 100;
            
            const isSelected = selectedMrId === loc.mr_id;
            
            return (
              <div 
                key={loc.mr_id} 
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 hover:z-20",
                  isSelected ? "z-10 scale-125" : "z-0"
                )}
                style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                onClick={() => setSelectedMrId(loc.mr_id)}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 shadow-md flex items-center justify-center animate-bounce",
                    loc.activity_type === 'visit' ? 'bg-green-500 border-white' : 
                    loc.activity_type === 'travel' ? 'bg-yellow-500 border-white' : 
                    'bg-gray-400 border-white',
                    isSelected && "ring-4 ring-blue-300"
                  )}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 mt-1 rounded shadow-sm whitespace-nowrap",
                    isSelected ? "bg-blue-600 text-white" : "bg-white text-gray-800"
                  )}>
                    {loc.mr_name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedMr && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MR Drill Down Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {selectedMr.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedMr.name}</h2>
                    <p className="text-sm text-gray-500">{selectedMr.territory}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  selectedMr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {selectedMr.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Status & Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-bold mb-1">Check-in Status</div>
                  <div className={cn("text-sm font-semibold flex items-center gap-1", hasCheckedIn ? "text-green-600" : "text-amber-600")}>
                    {hasCheckedIn ? <><CheckCircle2 size={14}/> Completed</> : <><AlertCircle size={14}/> Pending</>}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-bold mb-1">Visits Today</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {mrVisitsToday.length} / {mrSchedules.length}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {(checkInAlert || locationStaleAlert) && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg space-y-2 mb-4">
                  <div className="font-bold text-red-800 text-xs flex items-center gap-1">
                    <AlertCircle size={14} /> ACTIVE ALERTS
                  </div>
                  {checkInAlert && <p className="text-xs text-red-700 leading-tight">{checkInAlert}</p>}
                  {locationStaleAlert && <p className="text-xs text-red-700 leading-tight">{locationStaleAlert}</p>}
                </div>
              )}

              <button 
                onClick={exportReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition"
              >
                <Download size={16} /> Export Activity Report
              </button>
            </div>

            {/* Current Status Box */}
            {selectedLocation && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                  Latest Telemetry
                  <Clock size={14} className="text-gray-400" />
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Activity:</span>
                  <span className={cn(
                    "font-bold uppercase",
                    selectedLocation.activity_type === 'visit' ? "text-green-600" :
                    selectedLocation.activity_type === 'travel' ? "text-yellow-600" :
                    "text-gray-500"
                  )}>{selectedLocation.activity_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Speed:</span>
                  <span className="font-semibold text-slate-800">{selectedLocation.speed} km/h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last Ping:</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedLocation.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Coordinates:</span>
                  <span className="font-mono text-xs text-slate-600">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline and Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live Activity Timeline
              </h3>
              
              {mrRecordings.length === 0 && mrSchedules.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CircleDashed className="w-12 h-12 mx-auto mb-3 opacity-30 animate-spin-slow" />
                  <p className="text-sm font-medium">No schedule or activity recorded yet</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 space-y-8 pb-4">
                  {/* Scheduled but not visited */}
                  {mrSchedules.filter(s => s.status === 'pending').map(sched => (
                    <div key={`sched-${sched.id}`} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white border-2 border-blue-400 rounded-full" />
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 transition hover:shadow-md">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-800 shrink-0">{sched.scheduled_time}</p>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Scheduled</span>
                        </div>
                        <p className="font-bold text-blue-600">{sched.doctor_name}</p>
                        <p className="text-xs text-slate-500">{sched.clinic} • {sched.purpose}</p>
                      </div>
                    </div>
                  ))}

                  {/* Completed Visits / Recordings */}
                  {mrRecordings.map((rec, idx) => (
                    <div key={`rec-${rec.id}`} className="relative pl-6">
                      <div className="absolute -left-2 top-1.5 w-4 h-4 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold text-slate-800">{rec.visit_time}</p>
                          <div className="flex gap-2">
                            {rec.is_lead && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">🔥 Lead</span>}
                            {rec.is_sale && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">💰 Sale</span>}
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Completed</span>
                          </div>
                        </div>
                        
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {rec.entity_name} 
                          <span className="text-xs font-normal text-slate-500">({rec.entity_type})</span>
                        </p>
                        
                        {rec.sale_amount > 0 && (
                          <div className="mt-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-100">
                            Sale Value: ₹{rec.sale_amount.toLocaleString()}
                          </div>
                        )}
                        
                        {rec.transcript && (
                          <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                              <User size={10}/> AI Transcription & Insights
                            </p>
                            <p className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-2">"{rec.transcript}"</p>
                            
                            {rec.lead_reasoning && (
                              <p className="mt-2 text-xs font-semibold text-purple-700 flex items-start gap-1">
                                <Zap size={12} className="shrink-0 mt-0.5"/> 
                                {rec.lead_reasoning}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
