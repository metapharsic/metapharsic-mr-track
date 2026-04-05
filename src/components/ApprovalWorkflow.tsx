import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FileCheck, Clock, CheckCircle2, XCircle,
  Loader2, Search, User, Calendar,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      api.approvals.getAll(),
      api.recordings.getAll()
    ]).then(([a, r]) => {
      setApprovals(a);
      setRecordings(r);
      setLoading(false);
    });
  }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    const updated = await api.approvals.update(id, { status });
    setApprovals(prev => prev.map(a => a.id === id ? updated : a));
  };

  const filtered = filterStatus === 'all' ? approvals : approvals.filter(a => a.status === filterStatus);
  const pending = approvals.filter(a => a.status === 'pending').length;
  const approved = approvals.filter(a => a.status === 'approved').length;
  const rejected = approvals.filter(a => a.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
        <p className="text-gray-500">Review and approve MR requests for sales, reschedules, and credits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No approval requests</p>
          </div>
        ) : (
          filtered.map(req => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    req.type === 'sale' ? "bg-emerald-100 text-emerald-600" :
                    req.type === 'reschedule' ? "bg-blue-100 text-blue-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    {req.type === 'sale' ? <TrendingUp className="w-5 h-5" /> :
                     req.type === 'reschedule' ? <Calendar className="w-5 h-5" /> :
                     <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{req.description}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        req.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        req.status === 'approved' ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      )}>{req.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.mr_name}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(req.created_at).toLocaleDateString()}</span>
                      {req.approved_at && <span className="text-xs text-gray-400">Decided: {new Date(req.approved_at).toLocaleString()}</span>}
                    </div>
                    {req.details && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-1">
                        {req.details.saleAmount && (
                          <p className="text-sm font-bold text-emerald-600">
                            Amount: &#8377;{req.details.saleAmount.toLocaleString()}
                          </p>
                        )}
                        {req.details.entity && (
                          <p className="text-sm text-gray-700">Entity: {req.details.entity}</p>
                        )}
                        {req.details.reason && (
                          <p className="text-sm text-gray-600 italic">{req.details.reason}</p>
                        )}
                        {req.details.original_date && (
                          <p className="text-sm text-gray-700">Original: {req.details.original_date} → New: {req.details.new_date}</p>
                        )}
                        {req.details.transcript && (
                          <p className="text-xs text-gray-500 italic">"{req.details.transcript}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(req.id, 'approved')}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
                {req.approved_by && (
                  <p className="text-xs text-gray-400 shrink-0">By {req.approved_by}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
