import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MR, Visit, VisitSchedule as VSchedule } from '../types';
import {
  MapPin, Clock, User, Phone, Mail, Activity,
  CheckCircle2, AlertCircle, Loader2, Search,
  Zap, Calendar, TrendingUp, Eye,
  ChevronRight, Circle, CircleDashed
} from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [mrs, setMrs] = useState<MR[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recordings, setRecordings] = useState<VisitRecording[]>([]);
  const [schedules, setSchedules] = useState<VSchedule[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.mrs.getAll(),
      api.locations.getAll(),
      api.recordings.getAll(),
      api.visits.getSchedules()
    ]).then(([m, l, r, s]) => {
      setMrs(m);
      setLocations(l);
      setRecordings(r);
      setSchedules(s);
      if (m.length > 0) setSelectedMrId(m[0].id);
      setLoading(false);
    });
  }, []);

  const selectedMr = mrs.find(mr => mr.id === selectedMrId);
  const selectedLocation = locations.find(l => l.mr_id === selectedMrId);
  const mrRecordings = recordings.filter(r => r.mr_id === selectedMrId);
  const mrSchedules = schedules.filter(s => s.mr_id === selectedMrId);
  const mrVisitsToday = mrRecordings.filter(r => r.visit_date === new Date().toISOString().split('T')[0]);
  const leadsDetected = mrRecordings.filter(r => r.is_lead);
  const salesDetected = mrRecordings.filter(r => r.is_sale);

  // Territory coordinate simulation
  const getTerritoryCoords = (territory: string): [number, number] => {
    const coords: Record<string, [number, number]> = {
      'west': [17.4435, 78.3772],
      'central': [17.4239, 78.4738],
      'east': [17.4065, 78.5225],
      'north': [17.4326, 78.4482],
      'south': [17.3850, 78.4867],
    };
    const lower = territory.toLowerCase();
    if (lower.includes('west')) return coords.west;
    if (lower.includes('central')) return coords.central;
    if (lower.includes('east')) return coords.east;
    if (lower.includes('north')) return coords.north;
    if (lower.includes('south')) return coords.south;
    return [17.4050, 78.4500];
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
          <h1 className="text-2xl font-bold text-gray-900">MR Tracking</h1>
          <p className="text-gray-500">Monitor field activity and visit progress</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="pl-10 pr-6 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            value={selectedMrId || ''}
            onChange={e => setSelectedMrId(Number(e.target.value))}
          >
            {mrs.map(mr => (
              <option key={mr.id} value={mr.id}>{mr.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedMr && (
        <>
          {/* MR Overview */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {selectedMr.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedMr.name}</h2>
                <p className="text-blue-200 text-sm">{selectedMr.territory}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <p className="text-xs text-blue-200 font-bold">Status</p>
                <p className="text-lg font-bold">{selectedMr.status === 'active' ? 'On Field' : 'Inactive'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <p className="text-xs text-blue-200 font-bold">Today's Visits</p>
                <p className="text-lg font-bold">{mrVisitsToday.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <p className="text-xs text-blue-200 font-bold">Leads Found</p>
                <p className="text-lg font-bold">{leadsDetected.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <p className="text-xs text-blue-200 font-bold">Sales Detect</p>
                <p className="text-lg font-bold">₹{salesDetected.reduce((s, r) => s + r.sale_amount, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Location Map + Activity Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulated Map View */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Current Location
              </h3>
              {selectedLocation ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Circle className={cn(
                        "w-3 h-3",
                        selectedLocation.activity_type === 'visit' ? "text-green-600 fill-green-600" :
                        selectedLocation.activity_type === 'travel' ? "text-yellow-600 fill-yellow-600" :
                        "text-gray-400 fill-gray-400"
                      )} />
                      <span className="text-xs font-bold text-gray-700 uppercase">
                        {selectedLocation.activity_type}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(selectedLocation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">
                      Lat: {selectedLocation.lat.toFixed(4)} | Lng: {selectedLocation.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500">Speed: {selectedLocation.speed} km/h</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No location data available</p>
              )}

              {/* All MR locations overview */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 font-bold mb-2">All MR Locations</p>
                <div className="space-y-2">
                  {locations.map(loc => (
                    <div key={loc.mr_id} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Circle className={cn(
                          "w-2 h-2",
                          loc.activity_type === 'visit' ? "text-green-600 fill-green-600" :
                          loc.activity_type === 'travel' ? "text-yellow-600 fill-yellow-600" :
                          "text-gray-400 fill-gray-400"
                        )} />
                        <span className="font-medium text-gray-700">{loc.mr_name}</span>
                      </div>
                      <span className="text-gray-500">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Activity Timeline
              </h3>

              {/* Scheduled visits */}
              {mrSchedules.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-2">SCHEDULED VISITS</p>
                  <div className="space-y-2">
                    {mrSchedules.map(sched => (
                      <div key={sched.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{sched.doctor_name}</p>
                          <p className="text-xs text-gray-500">{sched.scheduled_date} at {sched.scheduled_time}</p>
                          <p className="text-xs text-gray-400 truncate">{sched.purpose}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          sched.status === 'completed' ? "bg-green-100 text-green-700" :
                          sched.status === 'pending' ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        )}>{sched.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visit Recordings */}
              {mrRecordings.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-2 mt-4">VISIT RECORDINGS</p>
                  <div className="space-y-2">
                    {mrRecordings.map(rec => (
                      <div key={rec.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Zap className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          rec.is_lead ? "text-green-600" : rec.is_sale ? "text-emerald-600" : "text-gray-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{rec.entity_name}</p>
                            {rec.is_lead && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">LEAD</span>}
                            {rec.is_sale && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">SALE</span>}
                          </div>
                          <p className="text-xs text-gray-500">{rec.visit_date} at {rec.visit_time}</p>
                          <p className="text-xs text-gray-400 truncate">{rec.transcript?.substring(0, 100)}...</p>
                          {rec.sale_amount > 0 && (
                            <p className="text-xs text-emerald-600 font-bold mt-1">₹{rec.sale_amount.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mrRecordings.length === 0 && mrSchedules.length === 0 && (
                <p className="text-sm text-gray-400 italic">No activity recorded yet</p>
              )}
            </div>
          </div>

          {/* Visit Details Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Visit Detail Analysis
            </h3>
            {mrRecordings.length > 0 ? (
              <div className="space-y-3">
                {mrRecordings.map(rec => (
                  <div key={rec.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          rec.entity_type === 'doctor' ? "bg-blue-100 text-blue-600" :
                          rec.entity_type === 'chemist' ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rec.entity_name}</p>
                          <p className="text-xs text-gray-500">{rec.entity_type} • {rec.visit_date} {rec.visit_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {rec.is_lead && (
                          <div className="text-right">
                            <p className="text-xs text-green-600 font-bold">LEAD</p>
                            <p className="text-[10px] text-green-500">{rec.lead_confidence}%</p>
                          </div>
                        )}
                        {rec.is_sale && (
                          <div className="text-right">
                            <p className="text-xs text-emerald-600 font-bold">SALE</p>
                            <p className="text-sm text-emerald-700 font-bold">₹{rec.sale_amount.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {rec.transcript && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-bold mb-1">TRANSCRIPT ({rec.language === 'en' ? 'English' : rec.language === 'hi' ? 'Hindi' : 'Telugu'})</p>
                        <p className="text-sm text-gray-800 italic">"{rec.transcript}"</p>
                      </div>
                    )}
                    {rec.lead_reasoning && rec.is_lead && (
                      <p className="text-xs text-green-600">{rec.lead_reasoning}</p>
                    )}
                    {rec.follow_up_needed && (
                      <p className="text-xs text-blue-600 flex items-center gap-1"><Calendar className="w-3 h-3" />Follow-up: {rec.follow_up_purpose}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No visit recordings for this MR</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
