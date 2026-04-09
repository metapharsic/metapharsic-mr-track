import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { MR, Visit, Sale, Attendance, Activity } from '../types';
import { TERRITORIES } from '../constants';
import { 
  Search, Filter, Plus, MoreVertical, 
  Phone, Mail, MapPin, Calendar,
  TrendingUp, Target, Award, Clock,
  ChevronRight, X, User, Briefcase,
  TrendingDown, CheckCircle2, AlertCircle,
  Sparkles, Loader2, DollarSign, ShoppingBag,
  Edit2, Save, Camera, LayoutGrid, List,
  Building2, Stethoscope, IndianRupee,
  Download, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function MRManagement() {
  const { updateUser, users } = useAuth();
  const { addNotification } = useNotifications();
  const [mrs, setMrs] = useState<MR[]>([]);
  const [visitSchedules, setVisitSchedules] = useState<Visit[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState<string>('All Territories');
  const [selectedMr, setSelectedMr] = useState<MR | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MR>>({});
  const [forecastingId, setForecastingId] = useState<number | null>(null);
  const [forecasts, setForecasts] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'sales' | 'log'>('history');
  const [mrAttendance, setMrAttendance] = useState<Attendance[]>([]);
  const [mrActivities, setMrActivities] = useState<Activity[]>([]);
  const [selectedVisitLog, setSelectedVisitLog] = useState<Visit | null>(null);
  const [expandedAttendanceId, setExpandedAttendanceId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMr, setNewMr] = useState<{
    name: string; territory: string; base_salary: string; daily_allowance: string;
    joining_date: string; phone: string; email: string; status: 'active' | 'inactive'; user_id: string;
  }>({
    name: '', territory: TERRITORIES[0] || '', base_salary: '', daily_allowance: '',
    joining_date: new Date().toISOString().split('T')[0], phone: '', email: '',
    status: 'active', user_id: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedMr) {
      api.attendance.getAll(selectedMr.id).then(setMrAttendance);
      api.activities.getAll(selectedMr.id).then(setMrActivities);
    }
  }, [selectedMr]);

  useEffect(() => {
    fetchData();
  }, []);

  function loadLocalMrs(): MR[] {
    try {
      const saved = localStorage.getItem('metapharsic_mrs_local');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveLocalMrs(mrsArr: MR[]) {
    localStorage.setItem('metapharsic_mrs_local', JSON.stringify(mrsArr));
  }

  const handleAvatarSelect = (file: File | null, isCreateForm: boolean = false) => {
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        // Compress to 200x200 max, JPEG 0.8 quality
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (isCreateForm) {
          setAvatarPreview(dataUrl);
        } else {
          setEditForm(prev => ({ ...prev, avatar_url: dataUrl }));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerAvatarInput = () => {
    avatarInputRef.current?.click();
  };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.mrs.getAll(),
      api.visits.getAll(),
      api.sales.getAll()
    ]).then(([mrsData, visitsData, salesData]) => {
      const localMrsArr = loadLocalMrs();
      const apiMrsMap = new Map((mrsData || []).map((m: MR) => [m.id, m]));
      // Replace locally created MRs with their latest local state; keep all others
      const localIds = new Set(localMrsArr.map((m: MR) => m.id));
      const mergedMrs = (mrsData || []).filter((m: MR) => !localIds.has(m.id));
      for (const id of apiMrsMap.keys()) {
        if (localIds.has(id)) {
          const local = localMrsArr.find((x: MR) => x.id === id);
          if (local) mergedMrs.push(local);
        }
      }
      mergedMrs.push(...localMrsArr.filter((m: MR) => !apiMrsMap.has(m.id)));
      setMrs(mergedMrs);
      setVisitSchedules(visitsData || []);
      setSales(salesData || []);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching MR data:', error);
      setMrs([]);
      setVisitSchedules([]);
      setSales([]);
      setLoading(false);
    });
  };

  const getVisitCount = (mrId: number) => {
    return visitSchedules.filter(s => s.mr_id === mrId).length;
  };

  const getSalesCount = (mrId: number) => {
    return sales.filter(s => s.mr_id === mrId).length;
  };

  const getMrSales = (mrId: number) => {
    return sales.filter(s => s.mr_id === mrId);
  };

  const getMrVisits = (mrId: number) => {
    return visitSchedules.filter(s => s.mr_id === mrId);
  };

  const downloadVisitHistory = (mr: MR) => {
    const visits = getMrVisits(mr.id);
    const headers = ['ID', 'Entity Name', 'Entity Type', 'Clinic', 'Visit Date', 'Visit Time', 'Purpose', 'Notes', 'Order Value', 'Lead Forecast'];
    const csvContent = [
      headers.join(','),
      ...visits.map(v => [
        v.id,
        `"${v.entity_name}"`,
        v.entity_type,
        `"${v.clinic || ''}"`,
        v.visit_date,
        v.visit_time,
        `"${v.purpose}"`,
        `"${v.notes.replace(/"/g, '""')}"`,
        v.order_value,
        forecasts[v.id] ? (forecasts[v.id].isLead ? 'High Potential' : 'Low Potential') : 'Not Forecasted'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${mr.name.replace(/\s+/g, '_')}_Visit_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDailyLog = (mr: MR, attendance: Attendance[]) => {
    const headers = ['Date', 'Check-in', 'Check-out', 'Working Hours', 'Doctors', 'Clinics', 'Hospitals', 'Chemists', 'Travel Time (m)', 'Visit Time (m)', 'Total Order Value'];
    const csvContent = [
      headers.join(','),
      ...attendance.map(a => [
        a.date,
        a.check_in,
        a.check_out || 'Active',
        a.total_working_hours || 0,
        a.visit_counts.doctor || 0,
        a.visit_counts.clinic,
        a.visit_counts.hospital,
        a.visit_counts.chemist,
        a.total_travel_time || 0,
        a.total_visit_hours || 0,
        a.total_order_value || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${mr.name.replace(/\s+/g, '_')}_Daily_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllData = () => {
    const mrSummaryHeaders = ['MR Name', 'Territory', 'Email', 'Phone', 'Status', 'Total Sales', 'Performance Score', 'Joining Date', 'Targets Achieved', 'Targets Missed'];
    const mrSummaryRows = mrs.map(mr => [
      `"${mr.name}"`, `"${mr.territory}"`, `"${mr.email}"`, `"${mr.phone}"`,
      mr.status, mr.total_sales, mr.performance_score, mr.joining_date,
      mr.targets_achieved, mr.targets_missed
    ].join(','));
    const mrContent = [mrSummaryHeaders.join(','), ...mrSummaryRows].join('\n');

    const visitHeaders = ['MR Name', 'Territory', 'Entity Name', 'Entity Type', 'Visit Date', 'Visit Time', 'Purpose', 'Notes', 'Order Value', 'Lead Forecast'];
    const visitContent = [
      visitHeaders.join(','),
      ...visitSchedules.map(v => {
        const mr = mrs.find(m => m.id === v.mr_id);
        return [
          `"${mr?.name || 'Unknown'}"`, `"${mr?.territory || 'Unknown'}"`,
          `"${v.entity_name}"`, v.entity_type, v.visit_date, v.visit_time,
          `"${v.purpose}"`, `"${v.notes.replace(/"/g, '""')}"`,
          v.order_value,
          forecasts[v.id] ? (forecasts[v.id].isLead ? 'High Potential' : 'Low Potential') : 'Not Forecasted'
        ].join(',');
      })
    ].join('\n');

    const combined = `--- MR SUMMARY ---\n${mrContent}\n\n--- VISIT DETAILS ---\n${visitContent}`;
    const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MR_Full_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNewMr = async () => {
    if (!newMr.name || !newMr.email) return;
    setSaving(true);
    try {
      const localMrs = loadLocalMrs();
      const newId = localMrs.length > 0 ? Math.min(...localMrs.map(m => m.id)) - 1 : -1;
      const created: MR = {
        id: newId,
        name: newMr.name,
        territory: newMr.territory,
        base_salary: Number(newMr.base_salary) || 0,
        daily_allowance: Number(newMr.daily_allowance) || 0,
        joining_date: newMr.joining_date,
        phone: newMr.phone,
        email: newMr.email,
        status: newMr.status,
        user_id: newMr.user_id ? Number(newMr.user_id) : undefined,
        performance_score: 0,
        total_sales: 0,
        targets_achieved: 0,
        targets_missed: 0,
        avatar_url: avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(newMr.name)}&background=6366f1&color=fff`,
      };
      localMrs.push(created);
      saveLocalMrs(localMrs);
      setMrs(prev => [...prev, created]);
      setAvatarPreview('');
      setShowCreateModal(false);
      setNewMr({
        name: '', territory: TERRITORIES[0] || '', base_salary: '', daily_allowance: '',
        joining_date: new Date().toISOString().split('T')[0], phone: '', email: '',
        status: 'active', user_id: '',
      });
    } catch (error) {
      console.error('Failed to create MR:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleForecast = async (visit: Visit) => {
    setForecastingId(visit.id);
    const result = await geminiService.forecastLead(visit.notes, visit.entity_name, visit.purpose);
    if (result) {
      setForecasts(prev => ({ ...prev, [visit.id]: result }));
    }
    setForecastingId(null);
  };

  const handleEdit = () => {
    if (selectedMr) {
      setEditForm(selectedMr);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedMr || !editForm) return;
    setSaving(true);
    try {
      const oldTerritory = selectedMr.territory;
      const newTerritory = editForm.territory || oldTerritory;
      const territoryChanged = oldTerritory !== newTerritory;
      
      // Update in localStorage
      const localMrs = loadLocalMrs();
      const localIdx = localMrs.findIndex(m => m.id === selectedMr.id);
      if (localIdx >= 0) {
        localMrs[localIdx] = { ...localMrs[localIdx], ...editForm };
        saveLocalMrs(localMrs);
      }
      // Also try to update the server (will work on Render deployment)
      try {
        const updated = await api.mrs.update(selectedMr.id, editForm);
        setMrs(prev => prev.map(m => m.id === updated.id ? updated : m));
        
        // If territory changed, update the associated user account
        if (territoryChanged) {
          console.log(`[MRManagement] Territory changed from "${oldTerritory}" to "${newTerritory}"`);
          
          // Find user linked to this MR
          const linkedUser = users.find(u => u.mr_id === selectedMr.id);
          if (linkedUser) {
            await updateUser(linkedUser.id, { territory: newTerritory });
            console.log(`[MRManagement] Updated user ${linkedUser.email} territory`);
          }
          
          // Show notification about territory change impact
          addNotification({
            title: 'Territory Updated',
            message: `${selectedMr.name}'s territory changed. Schedules, leads, and visits will be reassigned.`,
            type: 'info',
            link: '/mrs'
          });
        }
      } catch {
        // Server update failed, use local update
        setMrs(prev => prev.map(m => m.id === selectedMr.id ? { ...m, ...editForm as Partial<MR> } : m));
        
        // Still try to update user locally if territory changed
        if (territoryChanged) {
          const linkedUser = users.find(u => u.mr_id === selectedMr.id);
          if (linkedUser) {
            await updateUser(linkedUser.id, { territory: newTerritory });
          }
        }
      }
      setSelectedMr({ ...selectedMr, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update MR:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredMrs = (mrs || []).filter(mr => {
    if (!mr) return false;
    const matchesSearch = (mr.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (mr.territory || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesTerritory = selectedTerritory === 'All Territories' || mr.territory === selectedTerritory;
    return matchesSearch && matchesTerritory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 relative overflow-hidden">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Medical Representatives</h2>
          <p className="text-slate-500 mt-1">Manage your field force and track their performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadAllData}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={20} className="text-blue-600" />
            Bulk Export (Power BI)
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Add New MR
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or territory..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
            >
              <option>All Territories</option>
              {TERRITORIES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            <Filter size={20} />
            More Filters
          </button>
        </div>
      </div>

      {/* MR Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredMrs.map((mr, i) => (
          <motion.div
            key={mr.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => {
              setSelectedMr(mr);
              setIsPanelOpen(true);
              setIsEditing(false);
            }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {mr.avatar_url ? (
                    <img 
                      src={mr.avatar_url} 
                      alt={mr.name}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                      {mr.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{mr.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                      <MapPin size={14} />
                      {mr.territory}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    mr.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {mr.status}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Award size={16} />
                    <span className="text-sm font-bold">{mr.performance_score} Score</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Sales</p>
                  <p className="text-lg font-bold text-slate-900">₹{(mr.total_sales / 100000).toFixed(2)}L</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Targets Met</p>
                  <p className="text-lg font-bold text-slate-900">{mr.targets_achieved} / {mr.targets_achieved + mr.targets_missed}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Visits</p>
                  <p className="text-lg font-bold text-blue-700">{getVisitCount(mr.id)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  {mr.phone}
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  {mr.email}
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <Calendar size={16} className="text-slate-400" />
                  Joined {new Date(mr.joining_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Clock size={14} />
                Last Visit: 2h ago
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  View Profile
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                  Performance
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Side Panel */}
      <AnimatePresence>
        {isPanelOpen && selectedMr && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPanelOpen(false);
                setIsEditing(false);
              }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <header className="flex justify-between items-start">
                  <div className="flex gap-6">
                    <div className="relative group/avatar">
                      {editForm.avatar_url || selectedMr.avatar_url ? (
                        <img
                          src={editForm.avatar_url || selectedMr.avatar_url}
                          alt={selectedMr.name}
                          className="w-24 h-24 rounded-3xl object-cover shadow-xl shadow-blue-600/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-600/20">
                          {selectedMr.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      {isEditing && (
                        <div
                          className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                          onClick={triggerAvatarInput}
                        >
                          <Camera className="text-white" size={24} />
                        </div>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleAvatarSelect(e.target.files?.[0] || null, false)}
                      />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <input 
                          type="text"
                          className="text-3xl font-bold text-slate-900 bg-slate-50 border-b-2 border-blue-600 focus:outline-none w-full"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <h2 className="text-3xl font-bold text-slate-900">{selectedMr.name}</h2>
                      )}
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <Briefcase size={18} />
                        Medical Representative
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        {isEditing ? (
                          <select 
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider focus:outline-none"
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                            selectedMr.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {selectedMr.status}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Award size={18} />
                          {selectedMr.performance_score} Score
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save
                      </button>
                    ) : (
                      <button 
                        onClick={handleEdit}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setIsPanelOpen(false);
                        setIsEditing(false);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X size={24} className="text-slate-400" />
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Demographics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone size={18} className="text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        ) : selectedMr.phone}
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail size={18} className="text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="email"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        ) : selectedMr.email}
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={18} className="text-slate-400" />
                        {isEditing ? (
                          <select 
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={editForm.territory || ''}
                            onChange={(e) => setEditForm({ ...editForm, territory: e.target.value })}
                          >
                            {TERRITORIES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        ) : selectedMr.territory}
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={18} className="text-slate-400" />
                        Joined {new Date(selectedMr.joining_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Financials</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-500 text-sm">Base Salary</span>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 text-right focus:outline-none"
                            value={editForm.base_salary || 0}
                            onChange={(e) => setEditForm({ ...editForm, base_salary: parseInt(e.target.value) })}
                          />
                        ) : (
                          <span className="font-bold text-slate-900">₹{selectedMr.base_salary.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-500 text-sm">Daily Allowance</span>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 text-right focus:outline-none"
                            value={editForm.daily_allowance || 0}
                            onChange={(e) => setEditForm({ ...editForm, daily_allowance: parseInt(e.target.value) })}
                          />
                        ) : (
                          <span className="font-bold text-slate-900">₹{selectedMr.daily_allowance}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <>
                    {/* Tabs */}
                    <div className="flex justify-between items-center border-b border-slate-100 pr-4">
                      <div className="flex">
                        <button 
                          onClick={() => setActiveTab('history')}
                          className={cn(
                            "px-6 py-3 text-sm font-bold transition-all border-b-2",
                            activeTab === 'history' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                          )}
                        >
                          Detailed Visit Logs
                        </button>
                        <button 
                          onClick={() => setActiveTab('sales')}
                          className={cn(
                            "px-6 py-3 text-sm font-bold transition-all border-b-2",
                            activeTab === 'sales' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                          )}
                        >
                          Sales
                        </button>
                        <button 
                          onClick={() => setActiveTab('log')}
                          className={cn(
                            "px-6 py-3 text-sm font-bold transition-all border-b-2",
                            activeTab === 'log' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                          )}
                        >
                          Daily Log
                        </button>
                      </div>
                      
                      {activeTab === 'history' && (
                        <button 
                          onClick={() => downloadVisitHistory(selectedMr)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                        >
                          <Download size={14} />
                          Export History
                        </button>
                      )}
                      {activeTab === 'log' && (
                        <button 
                          onClick={() => downloadDailyLog(selectedMr, mrAttendance)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                        >
                          <Download size={14} />
                          Export Log
                        </button>
                      )}
                    </div>

                    {activeTab === 'history' && (
                      <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-slate-900">Detailed Visit Logs</h3>
                          <span className="text-sm text-slate-500">{getVisitCount(selectedMr.id)} Total Logs</span>
                        </div>
                        <div className="space-y-4">
                          {getMrVisits(selectedMr.id).length > 0 ? getMrVisits(selectedMr.id).map((visit) => (
                            <div key={visit.id} className="p-5 border border-slate-100 rounded-3xl space-y-4 hover:border-blue-200 transition-all bg-white shadow-sm">
                              <div className="flex justify-between items-start">
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
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-900">{visit.entity_name}</h4>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        visit.entity_type === 'doctor' ? "bg-blue-100 text-blue-700" :
                                        visit.entity_type === 'chemist' ? "bg-amber-100 text-amber-700" :
                                        visit.entity_type === 'hospital' ? "bg-emerald-100 text-emerald-700" :
                                        "bg-purple-100 text-purple-700"
                                      )}>
                                        {visit.entity_type}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{visit.clinic || visit.entity_name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-400 font-medium block">
                                    {new Date(visit.visit_date).toLocaleDateString()}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{visit.visit_time}</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purpose & Notes</p>
                                  <div className="bg-slate-50 p-3 rounded-2xl text-sm text-slate-700">
                                    <p className="font-bold text-slate-900 mb-1">{visit.purpose}</p>
                                    <p className="italic">"{visit.notes || 'No additional notes provided'}"</p>
                                  </div>
                                </div>

                                {visit.conversation_summary && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Captured Conversation</p>
                                    <div className="bg-blue-50/50 p-3 rounded-2xl text-sm text-slate-700 border border-blue-100/50">
                                      {visit.conversation_summary.split('\n').map((line, i) => (
                                        <p key={i} className={cn(
                                          "mb-1",
                                          line.startsWith('MR:') ? "font-medium text-blue-700" : "font-medium text-slate-800"
                                        )}>
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                  <div className="flex items-center gap-2">
                                    {forecasts[visit.id] ? (
                                      <div className={cn(
                                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold",
                                        forecasts[visit.id].isLead ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                      )}>
                                        {forecasts[visit.id].isLead ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                        {forecasts[visit.id].isLead ? "Lead Predicted" : "Low Potential"}
                                        <span className="text-[10px] opacity-60 ml-1">({Math.round(forecasts[visit.id].confidence * 100)}%)</span>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => handleForecast(visit)}
                                        disabled={forecastingId === visit.id}
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                                      >
                                        {forecastingId === visit.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <Sparkles size={14} />
                                        )}
                                        AI Forecast Lead
                                      </button>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => setSelectedVisitLog(visit)}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                  >
                                    View Full Details
                                  </button>
                                  {visit.order_value > 0 && (
                                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                      Order: ₹{visit.order_value.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                            </div>
                          )) : (
                            <p className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              No visit history found for this MR.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'sales' && (
                      <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-slate-900">Sales Performance</h3>
                          <span className="text-sm text-slate-500">{getSalesCount(selectedMr.id)} Total Sales</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {getMrSales(selectedMr.id).length > 0 ? getMrSales(selectedMr.id).map((sale) => (
                            <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                  <ShoppingBag size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{sale.product_name}</h4>
                                  <p className="text-xs text-slate-500">Sold to {sale.customer_name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">₹{sale.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">{new Date(sale.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              No sales records found for this MR.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'log' && (
                      <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-slate-900">Daily Attendance & Activity</h3>
                          <span className="text-sm text-slate-500">{mrAttendance.length} Days Tracked</span>
                        </div>
                        
                        {mrAttendance.length > 0 ? (
                          <div className="space-y-8">
                            {mrAttendance.map(att => (
                              <div key={att.id} className="space-y-4">
                                <div 
                                  className={cn(
                                    "flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer transition-all hover:shadow-md",
                                    expandedAttendanceId === att.id && "ring-2 ring-blue-500 ring-offset-2"
                                  )}
                                  onClick={() => setExpandedAttendanceId(expandedAttendanceId === att.id ? null : att.id)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
                                      <Calendar size={20} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {new Date(att.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {att.check_in} - {att.check_out || 'Active'}</span>
                                        {att.total_working_hours && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">{att.total_working_hours}h total</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex gap-2">
                                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100">
                                        {att.visit_counts.doctor} Doctors
                                      </div>
                                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100">
                                        {att.visit_counts.clinic} Clinics
                                      </div>
                                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100">
                                        {att.visit_counts.hospital} Hosp.
                                      </div>
                                      <div className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100">
                                        {att.visit_counts.chemist} Chem.
                                      </div>
                                      {att.total_order_value && (
                                        <div className="px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-700 shadow-sm border border-emerald-100">
                                          ₹{att.total_order_value.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-3 mt-2 justify-end text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      <span className="flex items-center gap-1"><MapPin size={10} /> {att.total_travel_time || 0}m travel</span>
                                      <span className="flex items-center gap-1"><Clock size={10} /> {att.total_visit_hours || 0}m visits</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Visit History for this day */}
                                <AnimatePresence>
                                  {expandedAttendanceId === att.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detailed Visit History</h4>
                                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {getMrVisits(selectedMr.id).filter(v => v.visit_date === att.date).length} Total Visits
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {getMrVisits(selectedMr.id)
                                            .filter(v => v.visit_date === att.date)
                                            .map(visit => (
                                              <div 
                                                key={visit.id} 
                                                onClick={() => setSelectedVisitLog(visit)}
                                                className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                                                    visit.entity_type === 'doctor' ? "bg-blue-600" :
                                                    visit.entity_type === 'chemist' ? "bg-amber-500" :
                                                    visit.entity_type === 'hospital' ? "bg-emerald-600" :
                                                    "bg-purple-600"
                                                  )}>
                                                    {visit.entity_type === 'doctor' ? <User size={14} /> :
                                                     visit.entity_type === 'chemist' ? <ShoppingBag size={14} /> :
                                                     visit.entity_type === 'hospital' ? <Building2 size={14} /> :
                                                     <Stethoscope size={14} />}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{visit.entity_name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{visit.purpose}</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-900">{visit.visit_time}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600">₹{visit.order_value.toLocaleString()}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          {getMrVisits(selectedMr.id).filter(v => v.visit_date === att.date).length === 0 && (
                                            <div className="col-span-full py-6 text-center">
                                              <p className="text-xs text-slate-400 italic">No detailed visit logs found for this date.</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Daily AI Insights */}
                                {getMrVisits(selectedMr.id).filter(v => v.visit_date === att.date).some(v => forecasts[v.id]) && (
                                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Sparkles size={16} className="text-emerald-600" />
                                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Daily AI Lead Insights</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {getMrVisits(selectedMr.id)
                                        .filter(v => v.visit_date === att.date && forecasts[v.id])
                                        .map(v => (
                                          <div key={v.id} className={cn(
                                            "px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border",
                                            forecasts[v.id].isLead 
                                              ? "bg-white border-emerald-200 text-emerald-700" 
                                              : "bg-white border-slate-200 text-slate-500"
                                          )}>
                                            {forecasts[v.id].isLead ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {v.entity_name}: {forecasts[v.id].isLead ? 'High Potential' : 'Low Potential'}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Activities for this day */}
                                <div className="pl-6 border-l-2 border-slate-100 space-y-4 ml-6">
                                  {mrActivities.filter(act => act.date === att.date).map((act, idx) => (
                                    <div key={act.id} className="relative">
                                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                                      <div className="flex gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-12 pt-1">{act.time}</span>
                                        <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                          <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                                act.type === 'visit' ? "bg-emerald-100 text-emerald-700" :
                                                act.type === 'travel' ? "bg-blue-100 text-blue-700" :
                                                act.type === 'break' ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-200 text-slate-700"
                                              )}>
                                                {act.type}
                                              </span>
                                              <h5 className="font-bold text-slate-900 text-sm">
                                                {act.location_name || act.description}
                                              </h5>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{act.duration} mins</span>
                                          </div>
                                          {act.location_name && <p className="text-xs text-slate-500 mt-1">{act.description}</p>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No attendance or activity logs found for this MR.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detailed Visit Log Modal */}
      <AnimatePresence>
        {selectedVisitLog && (
          <div className="fixed inset-0 flex items-center justify-center z-[80] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVisitLog(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                      selectedVisitLog.entity_type === 'doctor' ? "bg-blue-600 text-white shadow-blue-200" :
                      selectedVisitLog.entity_type === 'chemist' ? "bg-amber-500 text-white shadow-amber-200" :
                      selectedVisitLog.entity_type === 'hospital' ? "bg-emerald-600 text-white shadow-emerald-200" :
                      "bg-purple-600 text-white shadow-purple-200"
                    )}>
                      {selectedVisitLog.entity_type === 'doctor' ? <User size={28} /> :
                       selectedVisitLog.entity_type === 'chemist' ? <ShoppingBag size={28} /> :
                       selectedVisitLog.entity_type === 'hospital' ? <Building2 size={28} /> :
                       <Stethoscope size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-slate-900">{selectedVisitLog.entity_name}</h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          selectedVisitLog.entity_type === 'doctor' ? "bg-blue-100 text-blue-700" :
                          selectedVisitLog.entity_type === 'chemist' ? "bg-amber-100 text-amber-700" :
                          selectedVisitLog.entity_type === 'hospital' ? "bg-emerald-100 text-emerald-700" :
                          "bg-purple-100 text-purple-700"
                        )}>
                          {selectedVisitLog.entity_type}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium mt-1">{selectedVisitLog.clinic || selectedVisitLog.entity_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedVisitLog(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visit Date & Time</p>
                    <div className="flex items-center gap-3 text-slate-900 font-bold">
                      <Calendar size={18} className="text-blue-600" />
                      {new Date(selectedVisitLog.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      <span className="text-slate-300 mx-1">|</span>
                      <Clock size={18} className="text-blue-600" />
                      {selectedVisitLog.visit_time}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Value</p>
                    <div className="flex items-center gap-3 text-emerald-600 font-bold text-lg">
                      <IndianRupee size={20} />
                      {selectedVisitLog.order_value.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Purpose of Visit</p>
                    <p className="text-slate-900 font-bold text-lg">{selectedVisitLog.purpose}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detailed Notes & Comments</p>
                    <div className="bg-slate-50 p-5 rounded-[24px] text-slate-700 italic border border-slate-100 leading-relaxed">
                      "{selectedVisitLog.notes || 'No additional notes provided'}"
                    </div>
                  </div>

                  {selectedVisitLog.conversation_summary && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Captured Conversation Transcript</p>
                      <div className="bg-blue-50/30 p-6 rounded-[24px] space-y-4 border border-blue-100/50 max-h-[200px] overflow-y-auto">
                        {selectedVisitLog.conversation_summary.split('\n').map((line, i) => (
                          <div key={i} className={cn(
                            "flex gap-3",
                            line.startsWith('MR:') ? "justify-start" : "justify-start"
                          )}>
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                              line.startsWith('MR:') ? "bg-blue-600 text-white rounded-tl-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                            )}>
                              {line}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entity History Section */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={14} className="text-blue-600" />
                      Past History with {selectedVisitLog.entity_name}
                    </p>
                    <div className="space-y-3">
                      {visitSchedules
                        .filter(v => v.entity_name === selectedVisitLog.entity_name && v.id !== selectedVisitLog.id && v.status === 'completed')
                        .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
                        .slice(0, 3)
                        .map(history => (
                          <div key={history.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{history.purpose}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(history.visit_date).toLocaleDateString()} at {history.visit_time}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">₹{history.order_value.toLocaleString()}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVisitLog(history);
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:underline mt-1"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      {visitSchedules.filter(v => v.entity_name === selectedVisitLog.entity_name && v.id !== selectedVisitLog.id && v.status === 'completed').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No previous history found for this entity.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setSelectedVisitLog(null)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Close Log
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== ADD NEW MR MODAL ==================== */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-200 gap-4">
                {/* Avatar Upload */}
                <div className="shrink-0">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleAvatarSelect(e.target.files?.[0] || null, true)}
                  />
                  <div
                    className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-colors overflow-hidden"
                    onClick={triggerAvatarInput}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <Camera size={20} className="text-blue-400" />
                        <span className="text-[8px] text-blue-400 font-medium">Upload</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-center">Add photo</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleAvatarSelect(e.target.files?.[0] || null, true)}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">Add New Medical Representative</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Data is saved locally first, then synced on deployment</p>
                </div>
                <button onClick={() => setShowCreateModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                    <input type="text" value={newMr.name}
                      onChange={e => setNewMr(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                    <input type="email" value={newMr.email}
                      onChange={e => setNewMr(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Territory */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Territory</label>
                  <select value={newMr.territory}
                    onChange={e => setNewMr(prev => ({ ...prev, territory: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Phone & Joining Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input type="text" value={newMr.phone}
                      onChange={e => setNewMr(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Joining Date</label>
                    <input type="date" value={newMr.joining_date}
                      onChange={e => setNewMr(prev => ({ ...prev, joining_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Base Salary & Daily Allowance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Salary (₹)</label>
                    <input type="number" value={newMr.base_salary}
                      onChange={e => setNewMr(prev => ({ ...prev, base_salary: e.target.value }))}
                      placeholder="30000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Daily Allowance (₹)</label>
                    <input type="number" value={newMr.daily_allowance}
                      onChange={e => setNewMr(prev => ({ ...prev, daily_allowance: e.target.value }))}
                      placeholder="500"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status & User ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select value={newMr.status}
                      onChange={e => setNewMr(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">User ID (optional)</label>
                    <input type="number" value={newMr.user_id}
                      onChange={e => setNewMr(prev => ({ ...prev, user_id: e.target.value }))}
                      placeholder="Link to system user"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <button onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateNewMr} disabled={saving || !newMr.name || !newMr.email}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add MR
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
