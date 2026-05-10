import React, { useEffect, useState } from 'react';
import { 
  MapPin, User, Navigation, Clock, 
  CheckCircle2, AlertCircle, Search, 
  Filter, Layers, Zap, Loader2,
  ChevronRight, Phone, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { MR, Visit } from '../types';
import { cn } from '../lib/utils';

interface MRLocation {
  id: number;
  mr_id: number;
  mr_name: string;
  lat: number;
  lng: number;
  activity_type: 'idle' | 'traveling' | 'visiting';
  battery_level: number;
  recorded_at: string;
}

export default function AdminMRTracking() {
  const [mrs, setMrs] = useState<MR[]>([]);
  const [locations, setLocations] = useState<MRLocation[]>([]);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState<string>('all');

  useEffect(() => {
    // Initial load of MRs and their locations
    Promise.all([
      api.mrs.getAll(),
      fetch('/api/mr-locations?date=today').then(res => res.json())
    ]).then(([mrsData, locationsData]) => {
      setMrs(mrsData);
      setLocations(locationsData || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load tracking data:', err);
      setLoading(false);
    });

    // Real-time polling every 60 seconds
    const interval = setInterval(() => {
      fetch('/api/mr-locations?date=today')
        .then(res => res.json())
        .then(data => setLocations(data || []));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const filteredMRs = mrs.filter(mr => {
    const matchesSearch = mr.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         mr.territory.toLowerCase().includes(searchTerm.toLowerCase());
    const location = locations.find(l => l.mr_id === mr.id);
    const matchesActivity = filterActivity === 'all' || (location?.activity_type === filterActivity);
    return matchesSearch && matchesActivity;
  });

  const getMRStatus = (mrId: number) => {
    const loc = locations.find(l => l.mr_id === mrId);
    if (!loc) return { type: 'offline', color: 'bg-gray-400', label: 'Offline' };
    
    switch (loc.activity_type) {
      case 'visiting': return { type: 'visiting', color: 'bg-emerald-500', label: 'In Visit' };
      case 'traveling': return { type: 'traveling', color: 'bg-blue-500', label: 'Traveling' };
      default: return { type: 'idle', color: 'bg-amber-500', label: 'Idle' };
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Field Force Command Center</h1>
          <p className="text-gray-500 font-medium">Real-time MR location tracking and activity monitoring</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
            {['all', 'visiting', 'traveling', 'idle'].map(act => (
              <button
                key={act}
                onClick={() => setFilterActivity(act)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filterActivity === act ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Panel: MR List */}
        <div className="w-full lg:w-96 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search MR or Territory..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : filteredMRs.map(mr => {
              const status = getMRStatus(mr.id);
              const loc = locations.find(l => l.mr_id === mr.id);
              
              return (
                <motion.div
                  key={mr.id}
                  layout
                  onClick={() => setSelectedMrId(mr.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group",
                    selectedMrId === mr.id 
                      ? "bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200" 
                      : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 overflow-hidden">
                        {mr.avatar_url ? (
                          <img src={mr.avatar_url} alt={mr.name} className="w-full h-full object-cover" />
                        ) : (
                          mr.name.split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                        status.color
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-900 truncate leading-tight">{mr.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{mr.territory}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-300 transition-transform",
                      selectedMrId === mr.id ? "rotate-90 text-indigo-400" : ""
                    )} />
                  </div>

                  <AnimatePresence>
                    {selectedMrId === mr.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-indigo-100 space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/50 p-2 rounded-xl">
                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Battery</p>
                            <p className="text-xs font-black text-gray-700">{loc?.battery_level || 85}%</p>
                          </div>
                          <div className="bg-white/50 p-2 rounded-xl">
                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Last Update</p>
                            <p className="text-xs font-black text-gray-700">
                              {loc ? new Date(loc.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <Navigation size={12} /> Live Route
                          </button>
                          <button className="p-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg">
                            <Phone size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Map View */}
        <div className="flex-1 bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-200 shadow-inner">
          {/* Mock Map Background */}
          <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0/1200x800?access_token=MOCK')] bg-cover bg-center opacity-50 grayscale" />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 z-10 space-y-2">
            <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Live Activity</h5>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-gray-600 uppercase">In Doctor Visit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-gray-600 uppercase">Traveling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold text-gray-600 uppercase">Idle / Stationary</span>
              </div>
            </div>
          </div>

          {/* Map Pins */}
          {locations.map(loc => {
            const mr = mrs.find(m => m.id === loc.mr_id);
            if (!mr) return null;
            const status = getMRStatus(mr.id);

            return (
              <motion.div
                key={loc.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute"
                style={{ 
                  left: `${50 + (loc.lng - 78.4) * 100}%`, 
                  top: `${50 - (loc.lat - 17.4) * 100}%` 
                }}
              >
                <div className="relative group cursor-pointer" onClick={() => setSelectedMrId(mr.id)}>
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-125 group-hover:-translate-y-2",
                    status.color
                  )}>
                    <User size={20} />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {mr.name}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active MRs</span>
              <span className="text-xl font-black text-emerald-600">{locations.filter(l => l.activity_type !== 'idle').length}</span>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Distance</span>
              <span className="text-xl font-black text-blue-600">142 km</span>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg Visit Time</span>
              <span className="text-xl font-black text-amber-600">24m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
