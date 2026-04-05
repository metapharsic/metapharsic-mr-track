import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Lead, MR, Visit } from '../types';
import {
  UserPlus, MessageSquare, Calendar,
  CheckCircle2, Zap, Loader2, User, MapPin,
  TrendingUp, FileText, Check, X, Search
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastingId, setForecastingId] = useState<number | null>(null);
  const [batchForecasting, setBatchForecasting] = useState(false);
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api.leads.getAll(),
      api.mrs.getAll(),
      api.visits.getAll()
    ]).then(([l, m, v]) => {
      setLeads(l);
      setMrs(m);
      setVisits(v);
      setLoading(false);
    });
  }, []);

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

  const handleForecastAll = () => {
    setBatchForecasting(true);
    setBatchResults([]);

    const completedVisits = visits.filter(v =>
      v.status === 'completed' &&
      (v.conversation_summary || v.notes)
    );

    const results: AnalysisResult[] = [];

    // 1) Assign unassigned existing leads
    const unassignedLeads = leads.filter(l => l.status !== 'assigned');
    for (const lead of unassignedLeads) {
      const matchedMr = mrs.find(mr => mr.territory === lead.territory) || mrs[0];
      if (matchedMr) {
        const updatedLead = {
          ...lead,
          assigned_mr_id: matchedMr.id,
          assigned_mr_name: matchedMr.name,
          status: 'assigned' as const
        };
        api.leads.update(lead.id, {
          assigned_mr_id: matchedMr.id,
          assigned_mr_name: matchedMr.name,
          status: 'assigned'
        }).then(updated => {
          setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
        });
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
        if (matchedMr) {
          results.push({
            is_lead: true,
            doctor_name: doctorName,
            specialty: specialty,
            territory: mr?.territory || 'Unknown',
            priority: positiveCount >= 3 ? 'high' : 'medium',
            confidence,
            reasoning: `Visit: ${visit.purpose}. ${text.trim()}`,
            mr_id: matchedMr.id || 0,
            mr_name: matchedMr.name || 'Unknown'
          });
        }
      } else if (positiveCount === 0) {
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
    }

    setBatchResults(results);
    setBatchForecasting(false);
  };

  const confirmedLeads = batchResults.filter(r => r.is_lead);
  const nonLeads = batchResults.filter(r => !r.is_lead);

  const filteredLeads = leads.filter(l =>
    l.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.comments.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onClick={handleForecastAll}
            disabled={batchForecasting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {batchForecasting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>Forecast All</span>
          </button>
        </div>
      </div>

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
                        lead.status === 'assigned' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {lead.status}
                      </span>
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
                  <div className="text-right">
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

                  <button
                    onClick={() => handleAIForecast(lead)}
                    disabled={forecastingId === lead.id}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all w-full md:w-auto justify-center",
                      lead.status === 'assigned'
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02]"
                    )}
                  >
                    {forecastingId === lead.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Forecasting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>{lead.status === 'assigned' ? 'Re-Forecast' : 'Forecast & Assign'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
