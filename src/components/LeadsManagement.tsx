import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Lead, MR, Visit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  UserPlus, MessageSquare, Calendar,
  CheckCircle2, Zap, Loader2, User, MapPin,
  TrendingUp, FileText, Check, X, Search,
  Target, DollarSign, Clock, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AnalysisResult {
  is_lead: boolean;
  doctor_name: string;
  specialty: string;
  territory: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
  mr_id: number;
  mr_name: string;
}

export default function LeadsManagement() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastingId, setForecastingId] = useState<number | null>(null);
  const [batchForecasting, setBatchForecasting] = useState(false);
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [forecastProgress, setForecastProgress] = useState(0);
  const [conversionChecking, setConversionChecking] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      api.leads.getAll(),
      api.mrs.getAll(),
      api.visits.getAll()
    ]).then(([l, m, v]) => {
      let filtered = l;
      if (user?.role === 'mr') {
        filtered = l.filter((lead: Lead) => lead.mr_id === user.mr_id || lead.assigned_mr_id === user.mr_id || !lead.assigned_mr_id);
      }
      setLeads(filtered);
      setMrs(m);
      setVisits(v);
      setLoading(false);
    });
  }, []);

  // Reload leads when user territory changes
  useEffect(() => {
    if (user?.role === 'mr') {
      console.log(`[LeadsManagement] User territory changed, refreshing leads`);
      Promise.all([
        api.leads.getAll(),
        api.mrs.getAll(),
      ]).then(([l, m]: [any, any]) => {
        let filtered = l;
        if (user?.territory) {
          filtered = l.filter((lead: Lead) => 
            lead.territory === user.territory || 
            lead.assigned_mr_id === user.mr_id || 
            !lead.assigned_mr_id
          );
        }
        setLeads(filtered);
        setMrs(m);
      });
    }
  }, [user?.territory]);

  const forecastLead = async (lead: Lead) => {
    const matchedMr = mrs.find(mr => mr.territory === lead.territory) || mrs[0];
    if (!matchedMr) return;
    const updatedLead = await api.leads.update(lead.id, {
      assigned_mr_id: matchedMr.id,
      assigned_mr_name: matchedMr.name,
      priority: lead.priority || 'medium',
      status: 'assigned'
    });
    setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
  };

  const handleConvertLead = async (leadId: number) => {
    try {
      const updatedLead = await api.leads.update(leadId, { status: 'converted' });
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
    } catch (e) {
      console.error('Conversion error:', e);
    }
  };

  const handleConversionCheck = async () => {
    setConversionChecking(true);
    setConversionProgress(0);

    try {
      const [allSales] = await Promise.all([
        api.sales?.getAll ? api.sales.getAll() : Promise.resolve([])
      ]);
      const activeLeads = leads.filter(l => l.status === 'assigned');
      let completed = 0;
      
      const salesList = (allSales as any[]) || [];

      for (const lead of activeLeads) {
        // Find matching sale
        const docName = lead.doctor_name.toLowerCase().replace('dr.', '').trim();
        const hasSale = salesList.some((s: any) => {
           const custName = (s.customer_name || '').toLowerCase();
           return custName.includes(docName) || docName.includes(custName);
        });

        if (hasSale) {
          const updatedLead = await api.leads.update(lead.id, { status: 'converted' });
          setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
        }

        await new Promise(r => setTimeout(r, 150));
        completed++;
        setConversionProgress(Math.round((completed / activeLeads.length) * 100));
      }
    } catch (error) {
      console.error('Auto-conversion error:', error);
    } finally {
      setConversionChecking(false);
    }
  };

  const handleAIForecast = async (lead: Lead) => {
    setForecastingId(lead.id);
    try {
      const matchedMr = mrs.find(mr => mr.territory === lead.territory) || mrs[0];
      if (!matchedMr) {
        setForecastingId(null);
        return;
      }
      const updatedLead = await api.leads.update(lead.id, {
        assigned_mr_id: matchedMr.id,
        assigned_mr_name: matchedMr.name,
        priority: lead.priority || 'medium',
        status: 'assigned'
      });
      setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      await fetch('/api/visit-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mr_id: matchedMr.id,
          doctor_name: lead.doctor_name,
          clinic: lead.doctor_name,
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduled_time: "11:00",
          purpose: `Lead Follow-up: ${lead.comments}`,
          priority: lead.priority
        })
      });
    } catch (error) {
      console.error('Forecasting error:', error);
    } finally {
      setForecastingId(null);
    }
  };

  const handleForecastAll = async () => {
    setBatchForecasting(true);
    setBatchResults([]);
    setForecastProgress(0);

    const completedVisits = visits.filter(v =>
      v.status === 'completed' &&
      (v.conversation_summary || v.notes)
    );

    const results: AnalysisResult[] = [];
    const unassignedLeads = leads.filter(l => l.status !== 'assigned');
    const totalTasks = unassignedLeads.length + completedVisits.length;
    let completedTasks = 0;

    const updateProgress = () => {
      completedTasks++;
      setForecastProgress(Math.round((completedTasks / totalTasks) * 100));
    };

    // 1) Assign unassigned existing leads
    for (const lead of unassignedLeads) {
      const matchedMr = mrs.find(mr => mr.territory === lead.territory) || mrs[0];
      if (matchedMr) {
        const updatedLead = {
          ...lead,
          assigned_mr_id: matchedMr.id,
          assigned_mr_name: matchedMr.name,
          status: 'assigned' as const
        };
        await api.leads.update(lead.id, {
          assigned_mr_id: matchedMr.id,
          assigned_mr_name: matchedMr.name,
          status: 'assigned'
        });
        setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
        
        results.push({
          is_lead: true,
          doctor_name: lead.doctor_name,
          specialty: lead.specialty,
          territory: lead.territory,
          priority: lead.priority,
          confidence: 100,
          reasoning: lead.comments,
          mr_id: matchedMr.id,
          mr_name: matchedMr.name
        });
      }
      // simulate network/ai delay for visual progress
      await new Promise(r => setTimeout(r, 100));
      updateProgress();
    }

    // 2) Analyze visit transcripts for potential new leads
    for (const visit of completedVisits) {
      const mr = mrs.find(m => m.id === visit.mr_id);
      const combined = `${visit.conversation_summary || ''} ${visit.notes || ''}`.toLowerCase();
      const leadSignals = [
        'interested', 'send me', 'proposal', 'samples', 'follow up',
        'presentation', 'request', 'need', 'would like', 'looking for',
        'asked about', 'asked', 'bring me', 'discussed', 'bulk',
        'discount', 'credit', 'order'
      ];
      const positiveCount = leadSignals.filter(s => combined.includes(s)).length;
      const hasOrder = visit.order_value > 0;

      if (positiveCount >= 1) {
        const confidence = Math.min(positiveCount * 20, 95);
        const text = `${visit.conversation_summary || ''} ${visit.notes || ''}`;
        // Extract doctor/entity name from the conversation
        let doctorName = visit.entity_name || 'Unknown';
        let specialty = 'Unknown';
        // Try to pull a name from conversation_summary patterns like "Dr. Ramesh"
        const nameMatch = combined.match(/dr\.\s*([a-z][a-z\s]+)/i);
        if (nameMatch) {
          doctorName = `Dr. ${nameMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase())}`;
        }
        const specialtyMatch = combined.match(/(cardiolog|gynae|surg|orth|derma|pediatr|general|ent|ophthal|diabet|endoc|gastro|urolog|neuro)/i);
        if (specialtyMatch) {
          specialty = specialtyMatch[1];
        }
        const visitMr = mrs.find(m => m.territory === mr?.territory) || mrs[0];
        if (visitMr) {
          results.push({
            is_lead: true,
            doctor_name: doctorName,
            specialty: specialty,
            territory: mr?.territory || 'Unknown',
            priority: positiveCount >= 3 ? 'high' : 'medium',
            confidence,
            reasoning: `Visit: ${visit.purpose}. ${text.trim()}`,
            mr_id: visitMr.id || 0,
            mr_name: visitMr.name || 'Unknown'
          });
        }
      } else {
        results.push({
          is_lead: false,
          doctor_name: visit.entity_name || 'Unknown',
          specialty: 'N/A',
          territory: mr?.territory || 'Unknown',
          priority: 'low' as const,
          confidence: 0,
          reasoning: visit.notes || 'No lead signals detected in this visit.',
          mr_id: mr?.id || 0,
          mr_name: mr?.name || 'Unknown'
        });
      }
      
      // simulate AI processing delay
      await new Promise(r => setTimeout(r, 200));
      updateProgress();
    }

    setBatchResults(results);
    setBatchForecasting(false);
  };

  const confirmedLeads = batchResults.filter(r => r.is_lead);
  const nonLeads = batchResults.filter(r => !r.is_lead);

  const filteredLeads = leads
    .filter(l =>
      l.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.comments || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    });

  // Phase 4: Calculate lead metrics
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted');
  const activeLeadsList = leads.filter(l => ['new', 'assigned', 'contacted'].includes(l.status));
  const activeLeads = activeLeadsList.length;
  const totalExpectedRevenue = leads.filter(l => l.status !== 'converted').reduce((sum, l) => sum + (l.expected_revenue || 0), 0);
  const totalActualRevenue = convertedLeads.reduce((sum, l) => sum + (l.actual_revenue || 0), 0);
  const avgConversionProbability = activeLeads > 0 
    ? Math.round(activeLeadsList.reduce((sum, l) => sum + (l.conversion_probability || 0), 0) / activeLeads)
    : 0;
  const convertedLeadsWithDays = convertedLeads.filter(l => l.time_to_conversion_days);
  const avgTimeToConversion = convertedLeadsWithDays.length > 0
    ? Math.round(convertedLeadsWithDays.reduce((sum, l) => sum + (l.time_to_conversion_days || 0), 0) / convertedLeadsWithDays.length)
    : 0;

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-500">AI analysis of MR visit transcripts for lead detection and follow-up scheduling</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleConversionCheck}
            disabled={conversionChecking}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {conversionChecking ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking ({conversionProgress}%)</span>
              </div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-Convert</span>
              </>
            )}
          </button>
          <button
            onClick={handleForecastAll}
            disabled={batchForecasting || conversionChecking}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {batchForecasting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing ({forecastProgress}%)</span>
              </div>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Forecast All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Phase 4: AI Lead Conversion Insights Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 opacity-80" />
            <ArrowUpRight className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {totalLeads > 0 ? Math.round((convertedLeads.length / totalLeads) * 100) : 0}%
          </div>
          <div className="text-sm opacity-90">Conversion Rate</div>
          <div className="text-xs opacity-75 mt-1">
            {convertedLeads.length} of {totalLeads} leads
          </div>
        </div>

        {/* Expected Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">
            ₹{(totalExpectedRevenue / 1000).toFixed(0)}K
          </div>
          <div className="text-sm opacity-90">Expected Pipeline</div>
          <div className="text-xs opacity-75 mt-1">
            {activeLeads} active leads
          </div>
        </div>

        {/* Avg Conversion Probability */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 opacity-80" />
            <ArrowUpRight className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{avgConversionProbability}%</div>
          <div className="text-sm opacity-90">Avg AI Score</div>
          <div className="text-xs opacity-75 mt-1">
            {avgConversionProbability >= 70 ? '🔥 High Intent' : avgConversionProbability >= 50 ? '🟡 Moderate' : '⚪ Low'}
          </div>
        </div>

        {/* Avg Time to Convert */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 opacity-80" />
            <Calendar className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {avgTimeToConversion > 0 ? `${avgTimeToConversion}d` : 'N/A'}
          </div>
          <div className="text-sm opacity-90">Avg Conversion Time</div>
          <div className="text-xs opacity-75 mt-1">
            ₹{(totalActualRevenue / 1000).toFixed(0)}K closed
          </div>
        </div>
      </motion.div>

      {/* Forecast All Results */}
      {batchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Forecast All Results
            </h2>

            {/* Confirmed leads */}
            {confirmedLeads.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Leads Detected ({confirmedLeads.length})
                </h3>
                <div className="space-y-2">
                  {confirmedLeads.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{result.doctor_name}</p>
                          <p className="text-xs text-gray-600">{result.specialty} • {result.territory}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          <User className="w-3 h-3 inline" /> {result.mr_name}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          result.priority === 'high' ? "bg-red-100 text-red-700" :
                          result.priority === 'medium' ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {result.priority}
                        </span>
                        <span className="text-xs text-green-600 font-medium">{result.confidence}%</span>
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-leads */}
            {nonLeads.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  No Leads Detected ({nonLeads.length})
                </h3>
                <div className="space-y-2">
                  {nonLeads.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{result.doctor_name}</p>
                        <p className="text-xs text-gray-500">{result.reasoning}</p>
                      </div>
                      <X className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Existing leads */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    lead.priority === 'high' ? "bg-red-100 text-red-600" :
                    lead.priority === 'medium' ? "bg-orange-100 text-orange-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    <UserPlus className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{lead.doctor_name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        lead.status === 'assigned' ? "bg-green-100 text-green-700" :
                        lead.status === 'converted' ? "bg-purple-100 text-purple-700" :
                        lead.status === 'contacted' ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {lead.status}
                      </span>
                      {/* Phase 4: AI Conversion Probability Badge */}
                      {lead.conversion_probability && lead.status !== 'converted' && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          lead.conversion_probability >= 80 ? "bg-red-100 text-red-700" :
                          lead.conversion_probability >= 60 ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          AI: {lead.conversion_probability}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {lead.specialty}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.territory}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                      "{lead.comments}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                  <div className="text-right space-y-2">
                    {/* Phase 4: Expected Revenue */}
                    {lead.expected_revenue && lead.status !== 'converted' && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Expected Revenue</p>
                        <p className="text-lg font-bold text-green-600">₹{(lead.expected_revenue / 1000).toFixed(0)}K</p>
                      </div>
                    )}
                    
                    {/* Phase 4: Recommended Action */}
                    {lead.recommended_action && lead.status !== 'converted' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-[10px] text-blue-600 font-semibold mb-1">AI Recommendation:</p>
                        <p className="text-xs text-blue-800">{lead.recommended_action}</p>
                      </div>
                    )}
                    
                    {lead.assigned_mr_name ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Assigned MR</p>
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <User className="w-4 h-4" />
                          {lead.assigned_mr_name}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Unassigned</p>
                    )}
                  </div>

                  {lead.status !== 'converted' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleAIForecast(lead)}
                        disabled={forecastingId === lead.id}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all flex-1 md:flex-none justify-center",
                          lead.status === 'assigned'
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        {forecastingId === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        {lead.status === 'assigned' ? 'Update AI' : 'Assign'}
                      </button>

                      {lead.status === 'assigned' && (
                        <>
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-medium"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Schedule
                          </button>
                          
                          <button
                            onClick={() => handleConvertLead(lead.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Convert
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {lead.status === 'converted' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                        <CheckCircle2 className="w-5 h-5" /> Successfully Converted
                      </div>
                      {/* Phase 4: Conversion Metrics */}
                      {lead.actual_revenue && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Actual Revenue</p>
                          <p className="text-lg font-bold text-green-600">₹{(lead.actual_revenue / 1000).toFixed(0)}K</p>
                        </div>
                      )}
                      {lead.time_to_conversion_days !== null && lead.time_to_conversion_days !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Time to Convert</p>
                          <p className="text-sm font-semibold text-gray-700">{lead.time_to_conversion_days} days</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
