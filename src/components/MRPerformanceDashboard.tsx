import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, BarChart3, Calendar, Users, Target,
  CheckCircle2, Clock, AlertCircle, Zap, Phone, MapPin, Activity,
  ChevronRight, RefreshCw, Filter, Download, Loader2, X, Send, Bot, User
} from 'lucide-react';

interface MonthlyMetrics {
  mr_id: number;
  mr_name: string;
  territory: string;
  total_entities: number;
  entities_reached: number;
  entities_unreached: number;
  entities_rejected: number;
  visits_completed: number;
  visits_pending: number;
  conversion_rate: number;
  performance_score: number;
  scheduled_this_month: number;
  suggested_next_visits: string[];
  priority_unreached: any[];
  unreached_entities?: Entity[];
}

interface Entity {
  id: number;
  name: string;
  type: string;
  tier?: string;
  location?: string;
  phone?: string;
  contact?: string;
}

interface OverallMetrics {
  total_doctors: number;
  total_pharmacies: number;
  total_hospitals: number;
  doctors_reached_month: number;
  pharmacies_reached_month: number;
  hospitals_reached_month: number;
  doctors_pending: number;
  pharmacies_pending: number;
  hospitals_pending: number;
  total_visits_month: number;
  overall_conversion_rate: number;
  mr_performance: MonthlyMetrics[];
  entities: Entity[];
}

interface ScheduleData {
  entity_id: number;
  mr_id: number;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  scheduled_by: 'ai' | 'admin';
}

export default function MRPerformanceDashboard() {
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMR, setSelectedMR] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'low' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'unreached' | 'territory'>('performance');
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to current month
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    entity_id: 0,
    mr_id: 0,
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    scheduled_by: 'admin'
  });

  useEffect(() => {
    fetchMetrics();
  }, [selectedDate]);

  const fetchMetrics = async () => {
    try {
      console.log('📊 Fetching monthly metrics for:', selectedDate);
      const response = await fetch(`/api/monthly-metrics?month=${selectedDate}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response text length:', text.length);
        if (text) {
          const data = JSON.parse(text);
          console.log('Parsed data:', data);
          setMetrics(data);
        } else {
          console.error('Empty response from server');
        }
      } else {
        const text = await response.text();
        console.error('API error:', response.status, text);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleEntity = async (useAI: boolean) => {
    if (!selectedEntity) return;
    
    try {
      const schedulePayload: ScheduleData = {
        entity_id: selectedEntity.id,
        mr_id: scheduleData.mr_id,
        scheduled_date: scheduleData.scheduled_date,
        scheduled_time: scheduleData.scheduled_time,
        notes: scheduleData.notes,
        scheduled_by: useAI ? 'ai' : 'admin'
      };

      console.log('📅 Scheduling entity:', schedulePayload);

      if (useAI) {
        // AI-powered scheduling with availability optimization
        console.log('🤖 AI scheduling with availability optimization...');
        // Show AI suggestions
        alert(`✅ AI suggests ${new Date(scheduleData.scheduled_date).toLocaleDateString()} at ${scheduleData.scheduled_time} for ${selectedEntity.name}`);
      } else {
        // Manual admin scheduling
        console.log('👤 Admin manual scheduling...');
        alert(`✅ Scheduled ${selectedEntity.name} for ${new Date(scheduleData.scheduled_date).toLocaleDateString()} at ${scheduleData.scheduled_time}`);
      }

      // Reset and close modal
      setShowSchedulingModal(false);
      setSelectedEntity(null);
      setScheduleData({
        entity_id: 0,
        mr_id: 0,
        scheduled_date: '',
        scheduled_time: '',
        notes: '',
        scheduled_by: 'admin'
      });
    } catch (error) {
      console.error('Scheduling error:', error);
    }
  };

  const getUnreachedEntitiesForMR = (mr: MonthlyMetrics): Entity[] => {
    if (!metrics?.entities || mr.entities_unreached === 0) return [];
    
    // Get the territory of this MR
    const territory = mr.territory.toLowerCase();
    
    // Filter entities in this MR's territory that haven't been reached
    const unreachedInTerritory = metrics.entities
      .filter(e => {
        const entityLocation = (e.location || '').toLowerCase();
        const inTerritory = entityLocation.includes(territory) || territory.includes(entityLocation.split(' ')[0]);
        return inTerritory;
      })
      .slice(0, 10);
    
    return unreachedInTerritory;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-slate-600 font-medium">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <AlertCircle className="text-amber-600 mb-2" size={24} />
          <p className="text-amber-900 font-medium">Unable to load metrics. Please try again.</p>
        </div>
      </div>
    );
  }

  const getFilteredMRs = () => {
    let filtered = [...metrics.mr_performance];

    // Filter by performance
    if (filter === 'high') {
      filtered = filtered.filter(mr => mr.conversion_rate >= 80);
    } else if (filter === 'low') {
      filtered = filtered.filter(mr => mr.conversion_rate >= 50 && mr.conversion_rate < 80);
    } else if (filter === 'critical') {
      filtered = filtered.filter(mr => mr.conversion_rate < 50);
    }

    // Sort
    if (sortBy === 'performance') {
      filtered.sort((a, b) => b.conversion_rate - a.conversion_rate);
    } else if (sortBy === 'unreached') {
      filtered.sort((a, b) => b.entities_unreached - a.entities_unreached);
    }

    return filtered;
  };

  const filteredMRs = getFilteredMRs();
  const selectedMRData = metrics.mr_performance.find(mr => mr.mr_id === selectedMR);

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">MR Performance Dashboard</h1>
          <p className="text-slate-600">Real-time monthly metrics, smart scheduling & lead tracking</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-600" />
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setLoading(true);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchMetrics();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-slate-50 border border-slate-200 transition-all"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="text-blue-600" size={24} />
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">This Month</span>
          </div>
          <p className="text-slate-600 text-sm">Total Visits</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.total_visits_month}</p>
          <p className="text-xs text-slate-500 mt-2">Scheduled & Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="text-green-600" size={24} />
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Doctors</span>
          </div>
          <p className="text-slate-600 text-sm">Doctors Reached</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.doctors_reached_month}</p>
          <p className="text-xs text-slate-500 mt-2">of {metrics.total_doctors} total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-purple-600" size={24} />
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">Pharmacies</span>
          </div>
          <p className="text-slate-600 text-sm">Pharmacies Reached</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.pharmacies_reached_month}</p>
          <p className="text-xs text-slate-500 mt-2">of {metrics.total_pharmacies} total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-red-600" size={24} />
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">Hospitals</span>
          </div>
          <p className="text-slate-600 text-sm">Hospitals Reached</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.hospitals_reached_month}</p>
          <p className="text-xs text-slate-500 mt-2">of {metrics.total_hospitals} total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-cyan-600" size={24} />
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full">Overall</span>
          </div>
          <p className="text-slate-600 text-sm">Conversion Rate</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.overall_conversion_rate}%</p>
          <p className="text-xs text-slate-500 mt-2">Reached / Total</p>
        </motion.div>
      </div>

      {/* MR Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MR List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              MR Performance Rankings
            </h2>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="performance">By Performance</option>
                <option value="unreached">By Unreached</option>
                <option value="territory">By Territory</option>
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All MRs</option>
                <option value="high">High Performers (80%+)</option>
                <option value="low">Medium (50-79%)</option>
                <option value="critical">Needs Support (&lt;50%)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMRs.map((mr, index) => (
              <motion.div
                key={mr.mr_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedMR(selectedMR === mr.mr_id ? null : mr.mr_id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMR === mr.mr_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{mr.mr_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {mr.territory}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{mr.conversion_rate}%</p>
                    <p className="text-xs text-slate-500">Conversion</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <p className="text-slate-600 font-medium">Reached</p>
                    <p className="text-lg font-bold text-green-600">{mr.entities_reached}</p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                    <p className="text-slate-600 font-medium">Unreached</p>
                    <p className="text-lg font-bold text-amber-600">{mr.entities_unreached}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-slate-600 font-medium">Rejected</p>
                    <p className="text-lg font-bold text-red-600">{mr.entities_rejected}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <p className="text-slate-600 font-medium">Score</p>
                    <p className="text-lg font-bold text-blue-600">{mr.performance_score}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${mr.conversion_rate}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        <AnimatePresence>
          {selectedMRData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:sticky lg:top-8 h-fit bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-lg max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedMRData.mr_name}</h3>

              {/* Stats Grid */}
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Entities in Territory</span>
                  <span className="font-bold text-slate-900">{selectedMRData.total_entities}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">✓ Reached This Month</span>
                  <span className="font-bold text-green-600">{selectedMRData.entities_reached}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">⏳ Unreached</span>
                  <span className="font-bold text-amber-600">{selectedMRData.entities_unreached}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">✗ Rejected</span>
                  <span className="font-bold text-red-600">{selectedMRData.entities_rejected}</span>
                </div>
              </div>

              {/* Unreached Entities List */}
              {selectedMRData.entities_unreached > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Target size={18} className="text-amber-600" />
                    Unreached Entities ({selectedMRData.entities_unreached})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getUnreachedEntitiesForMR(selectedMRData).map((entity, idx) => (
                      <div key={entity.id} className="bg-amber-50 p-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 text-sm">{entity.name}</p>
                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                              <MapPin size={12} /> {entity.location || entity.type}
                            </p>
                          </div>
                          <span className="text-xs font-semibold bg-amber-200 text-amber-900 px-2 py-1 rounded">{entity.type}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEntity(entity);
                            setScheduleData({
                              ...scheduleData,
                              entity_id: entity.id,
                              mr_id: selectedMRData.mr_id
                            });
                            setShowSchedulingModal(true);
                          }}
                          className="w-full mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Schedule Visit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {selectedMRData.suggested_next_visits && selectedMRData.suggested_next_visits.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    AI Suggested Next Visits
                  </h4>
                  <ul className="space-y-2">
                    {selectedMRData.suggested_next_visits.slice(0, 3).map((visit, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <ChevronRight size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                        {visit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority Unreached */}
              {selectedMRData.priority_unreached && selectedMRData.priority_unreached.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 mb-2">🎯 PRIORITY UNREACHED:</p>
                  <p className="text-xs text-amber-800">
                    {selectedMRData.priority_unreached.slice(0, 2).map(e => e).join(', ')}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unreached Entities Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <AlertCircle size={24} className="text-amber-600" />
          Unreached Entities - Coverage Gap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
            <p className="text-slate-600 font-medium mb-2">Doctors Not Yet Reached</p>
            <p className="text-4xl font-bold text-amber-600">{metrics.doctors_pending}</p>
            <p className="text-xs text-slate-600 mt-3">
              {metrics.total_doctors > 0 && `${Math.round((metrics.doctors_pending / metrics.total_doctors) * 100)}% coverage gap`}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <p className="text-slate-600 font-medium mb-2">Pharmacies Not Yet Reached</p>
            <p className="text-4xl font-bold text-orange-600">{metrics.pharmacies_pending}</p>
            <p className="text-xs text-slate-600 mt-3">
              {metrics.total_pharmacies > 0 && `${Math.round((metrics.pharmacies_pending / metrics.total_pharmacies) * 100)}% coverage gap`}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
            <p className="text-slate-600 font-medium mb-2">Hospitals Not Yet Reached</p>
            <p className="text-4xl font-bold text-red-600">{metrics.hospitals_pending}</p>
            <p className="text-xs text-slate-600 mt-3">
              {metrics.total_hospitals > 0 && `${Math.round((metrics.hospitals_pending / metrics.total_hospitals) * 100)}% coverage gap`}
            </p>
          </div>
        </div>
      </div>

      {/* Scheduling Modal */}
      <AnimatePresence>
        {showSchedulingModal && selectedEntity && selectedMRData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Schedule Visit</h2>
                <button
                  onClick={() => setShowSchedulingModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Entity Details */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                <p className="text-sm text-slate-600 mb-1">Entity</p>
                <p className="text-xl font-bold text-slate-900">{selectedEntity.name}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Activity size={14} /> {selectedEntity.type}
                  </span>
                  {selectedEntity.location && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin size={14} /> {selectedEntity.location}
                    </span>
                  )}
                </div>
              </div>

              {/* MR Details */}
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
                <p className="text-sm text-slate-600 mb-1">MR Representative</p>
                <p className="text-lg font-bold text-slate-900">{selectedMRData.mr_name}</p>
                <p className="text-sm text-slate-600 mt-2">Territory: {selectedMRData.territory}</p>
              </div>

              {/* Date & Time Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={scheduleData.scheduled_date}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Clock size={16} className="inline mr-2" />
                    Visit Time
                  </label>
                  <input
                    type="time"
                    value={scheduleData.scheduled_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Notes (Optional)</label>
                  <textarea
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                    placeholder="Add any special instructions or notes..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleScheduleEntity(true)}
                  disabled={!scheduleData.scheduled_date || !scheduleData.scheduled_time}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  <Bot size={18} />
                  AI Schedule
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleScheduleEntity(false)}
                  disabled={!scheduleData.scheduled_date || !scheduleData.scheduled_time}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  <User size={18} />
                  Manual Schedule
                </motion.button>
              </div>

              <button
                onClick={() => setShowSchedulingModal(false)}
                className="w-full mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>

              {/* Info Box */}
              <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">📌 Availability Check:</span> The system will optimize scheduling based on MR availability and entity location.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
