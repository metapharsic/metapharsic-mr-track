import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Doctor, Pharmacy, Hospital, MR, Visit } from '../types';
import {
  Search, Filter, Plus, MapPin, Phone,
  Star, Clock, Building2, Stethoscope,
  Pill, ChevronRight, MoreVertical,
  Mail, ExternalLink, LayoutGrid, List as ListIcon,
  ChevronDown, ChevronUp, Table as TableIcon,
  Calendar, Zap, CheckCircle2, User, Loader2, X,
  Brain, TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import AIVisitInspector from './AIVisitInspector';

type EntityType = 'all' | 'doctor' | 'pharmacy' | 'hospital';

export default function HealthcareDirectory() {
  const [type, setType] = useState<EntityType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [selectedTerritory, setSelectedTerritory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [expandedHospitalId, setExpandedHospitalId] = useState<number | null>(null);
  const [schedulingItem, setSchedulingItem] = useState<any | null>(null);
  const [assignedMR, setAssignedMR] = useState<MR | null>(null);
  const [selectedMRId, setSelectedMRId] = useState<number | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [editableDate, setEditableDate] = useState('');
  const [editableTime, setEditableTime] = useState('10:00');
  const [editablePurpose, setEditablePurpose] = useState('AI Scheduled Visit');

  const handleSchedule = (item: any) => {
    // Find an MR for this territory to assign the visit
    const territory = item.territory || item.area;
    const mrForTerritory = mrs.find(mr => mr.territory.includes(territory)) || mrs[0];
    
    const scheduledDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    setSchedulingItem(item);
    setAssignedMR(mrForTerritory);
    setSelectedMRId(mrForTerritory.id);
    setScheduledDateTime(`${scheduledDate} at 10:00 AM`);
    setEditableDate(scheduledDate);
    setEditableTime('10:00');
    setEditablePurpose('AI Scheduled Visit');
    setShowConfirmation(true);
  };

  const confirmSchedule = async () => {
    if (!schedulingItem || !selectedMRId) return;
    
    const selectedMR = mrs.find(m => m.id === selectedMRId);
    if (!selectedMR) return;
    
    setIsScheduling(true);
    
    try {
      const scheduleData = {
        mr_id: selectedMRId,
        doctor_id: schedulingItem.entityType === 'doctor' ? schedulingItem.id : null,
        doctor_name: schedulingItem.name,
        clinic: schedulingItem.clinic || schedulingItem.name,
        scheduled_date: editableDate,
        scheduled_time: editableTime,
        purpose: editablePurpose,
      };

      const response = await fetch('/api/visit-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) throw new Error('Failed to schedule visit');

      setToastMessage(`✓ Admin Approval Confirmed\nVisit: ${schedulingItem.name}\nMR: ${selectedMR.name}\nDate: ${editableDate} at ${editableTime}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Scheduling error:', error);
      setToastMessage("Failed to schedule visit. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsScheduling(false);
      setSchedulingItem(null);
      setAssignedMR(null);
    }
  };

  const rejectSchedule = () => {
    setShowConfirmation(false);
    setSchedulingItem(null);
    setAssignedMR(null);
    setToastMessage("Scheduling cancelled by admin");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      api.doctors.getAll(),
      api.pharmacies.getAll(),
      api.hospitals.getAll(),
      api.mrs.getAll()
    ]).then(([d, p, h, m]) => {
      setDoctors(d);
      setPharmacies(p);
      setHospitals(h);
      setMrs(m);
      setLoading(false);
    });
  };

  // Refresh data when upload completes from DataManagement
  const handleDataUpdate = () => {
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
    window.addEventListener('healthcare-data-updated', handleDataUpdate);
    return () => window.removeEventListener('healthcare-data-updated', handleDataUpdate);
  }, []);

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    const filteredDoctors = doctors.filter(d => 
      d.name.toLowerCase().includes(term) || 
      d.clinic.toLowerCase().includes(term) || 
      d.specialty.toLowerCase().includes(term) ||
      (d.territory || d.area || '').toLowerCase().includes(term)
    ).map(d => ({ ...d, entityType: 'doctor' as const }));

    const filteredPharmacies = pharmacies.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.owner_name.toLowerCase().includes(term) ||
      (p.territory || p.area || '').toLowerCase().includes(term)
    ).map(p => ({ ...p, entityType: 'pharmacy' as const }));

    const filteredHospitals = hospitals.filter(h => 
      h.name.toLowerCase().includes(term) || 
      h.type.toLowerCase().includes(term) ||
      (h.territory || h.area || '').toLowerCase().includes(term)
    ).map(h => ({ ...h, entityType: 'hospital' as const }));
    
    let filtered: any[] = [];
    if (type === 'hospital') filtered = filteredHospitals;
    else if (type === 'doctor') filtered = filteredDoctors;
    else if (type === 'pharmacy') filtered = filteredPharmacies;
    else filtered = [...filteredDoctors, ...filteredHospitals, ...filteredPharmacies];

    if (selectedTerritory !== 'all') {
      filtered = filtered.filter(item => (item.territory || item.area) === selectedTerritory);
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(item => item.tier === selectedTier);
    }

    if (selectedHospitalId !== null) {
      filtered = filtered.filter(item => 
        item.entityType === 'doctor' && item.hospital_id === selectedHospitalId
      );
    }

    return filtered;
  };

  const data = getFilteredData();

  const territories = Array.from(new Set([
    ...doctors.map(d => d.territory || d.area),
    ...pharmacies.map(p => p.territory || p.area),
    ...hospitals.map(h => h.territory || h.area)
  ].filter(Boolean))).sort();

  const groupedByTerritory = data.reduce((acc: Record<string, Record<string, any[]>>, item: any) => {
    const territory = item.territory || item.area || 'Other Territories';
    const eType = item.entityType;
    
    if (!acc[territory]) acc[territory] = {};
    if (!acc[territory][eType]) acc[territory][eType] = [];
    
    acc[territory][eType].push(item);
    return acc;
  }, {});

  const sortedTerritories = Object.keys(groupedByTerritory).sort();
  const entityOrder = ['doctor', 'pharmacy', 'hospital'];

  const getDoctorCountForHospital = (hospitalId: number) => {
    return doctors.filter(d => d.hospital_id === hospitalId).length;
  };

  const getDoctorsForHospital = (hospitalId: number) => {
    return doctors.filter(d => d.hospital_id === hospitalId);
  };

  const renderTableView = (territory: string) => {
    const territoryItems = data.filter(item => (item.territory || item.area) === territory);
    const territoryDoctors = territoryItems.filter(i => i.entityType === 'doctor');
    const territoryPharmacies = territoryItems.filter(i => i.entityType === 'pharmacy');
    const territoryHospitals = territoryItems.filter(i => i.entityType === 'hospital');

    let globalIndex = 1;

    // Grouping logic
    const hospitalGroups: Record<string, { hospital?: Hospital, doctors: any[], name: string }> = {};
    
    // 1. Add all hospitals in this territory that match filters
    territoryHospitals.forEach(h => {
      const key = `h-${h.id}`;
      hospitalGroups[key] = { hospital: h, doctors: [], name: h.name };
    });

    // 2. Add doctors to groups (even if hospital itself didn't match hospital filters)
    territoryDoctors.forEach(d => {
      let key = d.clinic || 'Independent Clinics';
      if (d.hospital_id) {
        const h = hospitals.find(h => h.id === d.hospital_id);
        if (h) {
          key = `h-${h.id}`;
          if (!hospitalGroups[key]) hospitalGroups[key] = { hospital: h, doctors: [], name: h.name };
        }
      }
      
      if (!hospitalGroups[key]) {
        hospitalGroups[key] = { doctors: [], name: key };
      }
      hospitalGroups[key].doctors.push(d);
    });

    // Sort hospital groups: hospitals first, then independent clinics
    const sortedGroups = Object.entries(hospitalGroups).sort((a, b) => {
      if (a[1].hospital && !b[1].hospital) return -1;
      if (!a[1].hospital && b[1].hospital) return 1;
      return a[1].name.localeCompare(b[1].name);
    });

    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 w-12 text-center">#</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">Hospital / Clinic</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">Doctor Name</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">Qualification</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">Speciality</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">Dept / OPD</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">OPD Timing</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-r border-slate-700">MR Visit Window</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">AI Schedule</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map(([key, group], hIdx) => {
              const { hospital, doctors: groupDocs, name: hospitalName } = group;
              const headerColor = hIdx % 5 === 0 ? 'bg-blue-600' : 
                                 hIdx % 5 === 1 ? 'bg-emerald-600' :
                                 hIdx % 5 === 2 ? 'bg-rose-700' :
                                 hIdx % 5 === 3 ? 'bg-purple-700' : 'bg-amber-600';

              return (
                <React.Fragment key={key}>
                  {/* Hospital Category Header */}
                  <tr className={cn(headerColor, "text-white font-bold text-xs")}>
                    <td colSpan={9} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="uppercase tracking-widest">{hospitalName}</span>
                          {hospital && (
                            <>
                              <span className="opacity-60">|</span>
                              <span className="font-medium">{hospital.phone}</span>
                              <span className="opacity-60">|</span>
                              <span className="font-medium italic">{hospital.address}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {hospital ? `${getDoctorCountForHospital(hospital.id)} Total Doctors` : `${groupDocs.length} Doctors`}
                          </span>
                          {hospital && (
                            <button 
                              onClick={() => handleSchedule(hospital)}
                              className="bg-white text-slate-900 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                              <Zap size={10} fill="currentColor" />
                              Schedule Hospital Visit
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {groupDocs.length > 0 ? groupDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs">
                      <td className="px-4 py-3 text-center text-slate-400 font-medium border-r border-slate-100">{globalIndex++}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 border-r border-slate-100">{hospitalName}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-100">{doc.name}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{doc.qualification || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{doc.specialty}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{doc.dept_opd || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{doc.timings || 'N/A'}</td>
                      <td className="px-4 py-3 font-bold text-blue-600 border-r border-slate-100">{doc.mr_visit_window || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleSchedule(doc)}
                          disabled={isScheduling && schedulingItem?.id === doc.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-[10px] shadow-sm shadow-blue-600/20 group/btn disabled:opacity-50"
                        >
                          {isScheduling && schedulingItem?.id === doc.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Zap size={12} className="transition-transform group-hover/btn:scale-110" fill="currentColor" />
                          )}
                          {isScheduling && schedulingItem?.id === doc.id ? 'Scheduling...' : 'AI Schedule'}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-b border-slate-100 text-xs italic text-slate-400">
                      <td colSpan={9} className="px-4 py-3 text-center">No doctors matching filters in this hospital</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Pharmacies Section */}
            {territoryPharmacies.length > 0 && (
              <>
                <tr className="bg-emerald-900 text-white font-bold text-xs">
                  <td colSpan={9} className="px-4 py-2 uppercase tracking-widest text-center flex items-center justify-center gap-4">
                    <span>Pharmacies & Retail Partners ({territoryPharmacies.length})</span>
                  </td>
                </tr>
                {territoryPharmacies.map((pharmacy: Pharmacy) => (
                  <tr key={pharmacy.id} className="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors text-xs">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium border-r border-slate-100">{globalIndex++}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700 border-r border-slate-100">{pharmacy.name}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-100">{pharmacy.owner_name}</td>
                    <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{pharmacy.type || 'Pharmacy'}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold border-r border-slate-100">Tier {pharmacy.tier}</td>
                    <td className="px-4 py-3 text-slate-600 border-r border-slate-100">Retail</td>
                    <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{pharmacy.shop_hours || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 border-r border-slate-100">{pharmacy.mr_visit_window || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleSchedule(pharmacy)}
                        disabled={isScheduling && schedulingItem?.id === pharmacy.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-[10px] shadow-sm shadow-emerald-600/20 group/btn disabled:opacity-50"
                      >
                        {isScheduling && schedulingItem?.id === pharmacy.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Zap size={12} className="transition-transform group-hover/btn:scale-110" fill="currentColor" />
                        )}
                        {isScheduling && schedulingItem?.id === pharmacy.id ? 'Scheduling...' : 'AI Schedule'}
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">AI Schedule Confirmed</p>
              <p className="text-xs text-slate-400 mt-0.5">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-4 text-slate-500 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Healthcare Directory</h2>
          <p className="text-slate-500 mt-1">Comprehensive database of healthcare providers and partners.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Add New Entry
        </button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <Stethoscope className="text-blue-600" size={24} />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">Healthcare</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Total Doctors</p>
          <p className="text-4xl font-bold text-blue-900 mt-2">{doctors.length}</p>
          {loading && <div className="h-2 bg-blue-200 rounded-full mt-3 overflow-hidden"><div className="h-full bg-blue-500 animate-pulse" style={{width: '50%'}}></div></div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <Pill className="text-purple-600" size={24} />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-3 py-1 rounded-full">Retail</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Total Pharmacies</p>
          <p className="text-4xl font-bold text-purple-900 mt-2">{pharmacies.length}</p>
          {loading && <div className="h-2 bg-purple-200 rounded-full mt-3 overflow-hidden"><div className="h-full bg-purple-500 animate-pulse" style={{width: '70%'}}></div></div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <Building2 className="text-red-600" size={24} />
            <span className="text-xs font-semibold text-red-700 bg-red-200 px-3 py-1 rounded-full">Institutional</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Total Hospitals</p>
          <p className="text-4xl font-bold text-red-900 mt-2">{hospitals.length}</p>
          {loading && <div className="h-2 bg-red-200 rounded-full mt-3 overflow-hidden"><div className="h-full bg-red-500 animate-pulse" style={{width: '60%'}}></div></div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-2xl border border-cyan-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <User className="text-cyan-600" size={24} />
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-200 px-3 py-1 rounded-full">Sales</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Total MRs</p>
          <p className="text-4xl font-bold text-cyan-900 mt-2">{mrs.length}</p>
          {loading && <div className="h-2 bg-cyan-200 rounded-full mt-3 overflow-hidden"><div className="h-full bg-cyan-500 animate-pulse" style={{width: '40%'}}></div></div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <Calendar className="text-slate-600" size={24} />
            <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-3 py-1 rounded-full">Updated</span>
          </div>
          <p className="text-slate-600 text-sm font-medium">Last Updated</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">Mar 31, 2026</p>
          <p className="text-xs text-slate-500 mt-3">Real-time sync enabled</p>
        </motion.div>
      </div>

      {/* Entity Type Selector */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full">
        {[
          { id: 'all', label: 'All Entities', icon: Building2 },
          { id: 'doctor', label: 'Doctors', icon: Stethoscope },
          { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
          { id: 'hospital', label: 'Hospitals', icon: Building2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setType(item.id as EntityType)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              type === item.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="search"
            id="healthcare-search-input"
            data-search-input="healthcare"
            placeholder={`Search ${type === 'all' ? 'entities' : type + 's'} by name, location or specialty...`} 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {selectedHospitalId && (
            <button 
              onClick={() => {
                setSelectedHospitalId(null);
                setType('all');
              }}
              className="px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
            >
              Clear Hospital Filter
            </button>
          )}
          <select 
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none min-w-[160px] cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="all">All Territories</option>
            {territories.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select 
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none min-w-[120px] cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="all">All Tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>

          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
              title="List View"
            >
              <ListIcon size={20} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
              title="Table View"
            >
              <TableIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedTerritories.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No entities found matching your criteria.</p>
            </div>
          ) : (
            sortedTerritories.map((territory) => (
              <div key={territory} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
                    <MapPin size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">{territory}</h3>
                  </div>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="space-y-10 pl-4 border-l-2 border-slate-100">
                  {viewMode === 'table' ? (
                    renderTableView(territory)
                  ) : (
                    entityOrder.map((eType) => {
                      const items = groupedByTerritory[territory][eType];
                      if (!items || items.length === 0) return null;

                      return (
                        <div key={eType} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              eType === 'doctor' ? "bg-blue-500" : 
                              eType === 'pharmacy' ? "bg-emerald-500" : 
                              "bg-purple-500"
                            )} />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {eType === 'doctor' ? 'Doctors' : eType === 'pharmacy' ? 'Pharmacies' : 'Hospitals'} ({items.length})
                            </h4>
                          </div>

                          <div className={cn(
                            viewMode === 'grid' 
                              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                              : "space-y-3"
                          )}>
                            <AnimatePresence mode="popLayout">
                              {items.map((item: any) => (
                                <motion.div
                                  key={`${item.entityType}-${item.id}`}
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                  className={cn(
                                    "bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
                                    viewMode === 'grid' ? "p-6 rounded-2xl" : "p-4 rounded-xl flex items-center gap-4"
                                  )}
                                >
                                {/* Type Indicator Bar (Grid Only) */}
                                {viewMode === 'grid' && (
                                  <div className={cn(
                                    "absolute top-0 left-0 w-full h-1",
                                    item.entityType === 'doctor' ? "bg-blue-500" : 
                                    item.entityType === 'pharmacy' ? "bg-emerald-500" : 
                                    "bg-purple-500"
                                  )} />
                                )}

                                <div className={cn(
                                  "rounded-xl flex items-center justify-center text-white shadow-lg shrink-0",
                                  viewMode === 'grid' ? "w-12 h-12 mb-4" : "w-10 h-10",
                                  item.entityType === 'doctor' ? "bg-blue-500 shadow-blue-500/20" : 
                                  item.entityType === 'pharmacy' ? "bg-emerald-500 shadow-emerald-500/20" : 
                                  "bg-purple-500 shadow-purple-500/20"
                                )}>
                                  {item.entityType === 'doctor' ? <Stethoscope size={viewMode === 'grid' ? 24 : 20} /> : 
                                   item.entityType === 'pharmacy' ? <Pill size={viewMode === 'grid' ? 24 : 20} /> : 
                                   <Building2 size={viewMode === 'grid' ? 24 : 20} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <h3 className={cn(
                                        "font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate",
                                        viewMode === 'grid' ? "text-lg" : "text-base"
                                      )}>{item.name}</h3>
                                      {viewMode === 'list' && (
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
                                          item.entityType === 'doctor' ? "bg-blue-50 text-blue-600" : 
                                          item.entityType === 'pharmacy' ? "bg-emerald-50 text-emerald-600" : 
                                          "bg-purple-50 text-purple-600"
                                        )}>
                                          {item.entityType}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                        item.tier === 'A' ? "bg-amber-50 text-amber-600" : 
                                        item.tier === 'B' ? "bg-slate-100 text-slate-600" : 
                                        "bg-slate-50 text-slate-400"
                                      )}>
                                        Tier {item.tier}
                                      </span>
                                      {viewMode === 'grid' && item.rating > 0 && (
                                        <div className="flex items-center gap-1 text-amber-500">
                                          <Star size={12} fill="currentColor" />
                                          <span className="text-xs font-bold">{item.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-500 truncate">
                                      {item.entityType === 'doctor' ? item.clinic : item.entityType === 'pharmacy' ? (item.type || item.owner_name) : item.type}
                                    </p>
                                    {viewMode === 'grid' && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className={cn(
                                          "text-[10px] font-bold uppercase tracking-wider",
                                          item.entityType === 'doctor' ? "text-blue-500" : 
                                          item.entityType === 'pharmacy' ? "text-emerald-500" : 
                                          "text-purple-500"
                                        )}>
                                          {item.entityType}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {viewMode === 'grid' && item.entityType === 'doctor' && (
                                    <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mt-3 uppercase tracking-wider">
                                      {item.specialty}
                                    </p>
                                  )}

                                  {viewMode === 'grid' && item.entityType === 'pharmacy' && item.discount_notes && (
                                    <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Offers & Notes</p>
                                      <p className="text-xs text-emerald-600 line-clamp-2 italic">
                                        {item.discount_notes}
                                      </p>
                                    </div>
                                  )}

                                  {viewMode === 'grid' && item.entityType === 'hospital' && (
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                      <button 
                                        onClick={() => setExpandedHospitalId(expandedHospitalId === item.id ? null : item.id)}
                                        className="flex items-center justify-between w-full px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Stethoscope size={14} />
                                          <span>{getDoctorCountForHospital(item.id)} Affiliated Doctors</span>
                                        </div>
                                        {expandedHospitalId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </button>

                                      <AnimatePresence>
                                        {expandedHospitalId === item.id && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <ul className="mt-3 space-y-2 pl-2">
                                              {getDoctorsForHospital(item.id).map(doc => (
                                                <li key={doc.id} className="flex items-center justify-between text-[11px] text-slate-600 group/doc">
                                                  <span className="truncate pr-2">• {doc.name}</span>
                                                  <span className="text-[9px] text-slate-400 italic shrink-0">{doc.specialty}</span>
                                                </li>
                                              ))}
                                            </ul>
                                            <button 
                                              onClick={() => {
                                                setSelectedHospitalId(item.id);
                                                setType('doctor');
                                                setSearchTerm('');
                                              }}
                                              className="mt-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                              View Full Profiles <ChevronRight size={10} />
                                            </button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}

                                  {viewMode === 'grid' ? (
                                    <div className="mt-6 space-y-3">
                                      <div className="flex items-start gap-3 text-slate-600 text-sm">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{item.address}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-600 text-sm">
                                        <Phone size={16} className="text-slate-400 shrink-0" />
                                        {item.phone || 'No phone provided'}
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-600 text-sm">
                                        <Clock size={16} className="text-slate-400 shrink-0" />
                                        {item.entityType === 'pharmacy' ? (item.shop_hours || 'Contact for hours') : (item.timings || 'Contact for timings')}
                                      </div>
                                      {(item.mr_visit_window) && (
                                        <div className="flex items-center gap-3 text-blue-600 text-sm font-medium bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                          <Clock size={16} className="text-blue-500 shrink-0" />
                                          <span>MR Window: {item.mr_visit_window}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2 mt-2">
                                      <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                          <MapPin size={14} className="text-slate-400" />
                                          <span className="truncate max-w-[200px]">{item.address}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                          <Phone size={14} className="text-slate-400" />
                                          <span>{item.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                          <span className="px-1.5 py-0.5 bg-blue-50 rounded uppercase tracking-wider">Tier {item.tier}</span>
                                        </div>
                                      </div>
                                      {item.entityType === 'hospital' && (
                                        <div className="flex flex-col gap-1">
                                          <button 
                                            onClick={() => setExpandedHospitalId(expandedHospitalId === item.id ? null : item.id)}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:underline w-fit"
                                          >
                                            <Stethoscope size={12} />
                                            {getDoctorCountForHospital(item.id)} Doctors
                                            {expandedHospitalId === item.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                          </button>
                                          
                                          <AnimatePresence>
                                            {expandedHospitalId === item.id && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                  {getDoctorsForHospital(item.id).map(doc => (
                                                    <span key={doc.id} className="text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                      {doc.name}
                                                    </span>
                                                  ))}
                                                  <button 
                                                    onClick={() => {
                                                      setSelectedHospitalId(item.id);
                                                      setType('doctor');
                                                      setSearchTerm('');
                                                    }}
                                                    className="text-[9px] font-bold text-blue-600 hover:underline"
                                                  >
                                                    + View All
                                                  </button>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {viewMode === 'grid' ? (
                                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {item.entityType === 'doctor' ? 'Total Visits' : item.entityType === 'pharmacy' ? 'Purchases' : 'Beds'}
                                      </p>
                                      <p className="text-sm font-bold text-slate-900">
                                        {item.entityType === 'doctor' ? item.total_visits : item.entityType === 'pharmacy' ? item.total_purchases : item.bed_count}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                                      <p className="text-sm font-bold text-slate-900">₹{item.total_value.toLocaleString()}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</p>
                                      <p className="text-sm font-bold text-slate-900">₹{item.total_value.toLocaleString()}</p>
                                    </div>
                                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600">
                                      <ChevronRight size={20} />
                                    </button>
                                  </div>
                                )}
                                
                                {viewMode === 'grid' && (
                                  <div className="mt-4 flex justify-end">
                                    <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                      View Details
                                      <ChevronRight size={14} />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )}

      {/* Admin Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && schedulingItem && assignedMR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full space-y-4 p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={rejectSchedule}
                className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-600" />
              </button>

              <div className="space-y-1 pr-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Zap size={20} className="text-blue-600" />
                  AI Schedule - Admin Approval
                </h3>
                <p className="text-sm text-slate-600">Review and approve the AI-generated assignment</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Entity</p>
                    <p className="font-bold text-slate-900 text-sm">{schedulingItem.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {schedulingItem.clinic || schedulingItem.type || 'Multi-Specialty'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Territory/Area</p>
                    <p className="text-lg font-bold text-slate-900">{schedulingItem.territory || schedulingItem.area}</p>
                    {schedulingItem.tier && (
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="inline-block bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                          Tier {schedulingItem.tier}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <label className="text-xs text-slate-600 uppercase font-semibold block">Assign MR</label>
                <select
                  value={selectedMRId || ''}
                  onChange={(e) => setSelectedMRId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an MR...</option>
                  {mrs.map(mr => (
                    <option key={mr.id} value={mr.id}>
                      {mr.name} - {mr.territory}
                    </option>
                  ))}
                </select>

                {selectedMRId && mrs.find(m => m.id === selectedMRId) && (
                  <div className="bg-blue-50 p-2 rounded text-xs space-y-1 border-l-2 border-blue-400">
                    <p className="font-semibold text-slate-900">{mrs.find(m => m.id === selectedMRId)?.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="font-semibold">Territory:</span> {mrs.find(m => m.id === selectedMRId)?.territory}</p>
                      <p><span className="font-semibold">Score:</span> {mrs.find(m => m.id === selectedMRId)?.performance_score}%</p>
                      <p><span className="font-semibold">Phone:</span> {mrs.find(m => m.id === selectedMRId)?.phone}</p>
                      <p><span className="font-semibold">Email:</span> {mrs.find(m => m.id === selectedMRId)?.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <label className="text-xs text-slate-600 uppercase font-semibold block">Schedule Details</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={editableDate}
                      onChange={(e) => setEditableDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={editableTime}
                      onChange={(e) => setEditableTime(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={editablePurpose}
                  onChange={(e) => setEditablePurpose(e.target.value)}
                  placeholder="Visit purpose..."
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={rejectSchedule}
                  disabled={isScheduling}
                  className="px-3 py-2 bg-slate-200 text-slate-900 rounded text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSchedule}
                  disabled={isScheduling || !selectedMRId}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isScheduling ? "Processing..." : "Approve"}
                </button>
              </div>

              {!selectedMRId && (
                <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded">
                  <p className="text-xs text-amber-800">Please select an MR to proceed</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  </div>
);
}
