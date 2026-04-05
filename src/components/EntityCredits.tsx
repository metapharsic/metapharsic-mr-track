import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  CreditCard, Loader2, TrendingUp, AlertCircle,
  CheckCircle2, X, User, Calculator, MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function EntityCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    Promise.all([
      api.credits.getAll(),
      api.recordings.getAll()
    ]).then(([c, r]) => {
      setCredits(c);
      // Augment credit data with recording totals
      const augmented = c.map(credit => {
        const entityRecordings = recordings.filter(
          rec => rec.entity_name === credit.entity_name
        );
        const totalSales = entityRecordings
          .filter(r => r.is_sale)
          .reduce((sum, r) => sum + (r.sale_amount || 0), 0);
        return { ...credit, total_recorded_sales: totalSales };
      });
      setCredits(augmented);
      setLoading(false);
    });
  }, []);

  const handleUpdate = async (id: number) => {
    const updated = await api.credits.update(id, editData);
    setCredits(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    setEditMode(false);
    setSelectedEntity(updated);
  };

  const filtered = filterStatus === 'all' ? credits : credits.filter(c => c.status === filterStatus);
  const totalOutstanding = credits.reduce((s, c) => s + c.outstanding, 0);
  const overdue = credits.filter(c => c.status === 'overdue');

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
        <h1 className="text-2xl font-bold text-gray-900">Entity Credits & Collections</h1>
        <p className="text-gray-500">Track credit limits, outstanding payments, and collection status per entity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">&#8377;{totalOutstanding.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Outstanding</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{credits.filter(c => c.status === 'current').length}</p>
              <p className="text-xs text-gray-500">Current</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdue.length}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {['all', 'current', 'overdue', 'blocked'].map(status => (
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

      {/* Credit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(credit => (
          <motion.div
            key={credit.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-white border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer",
              selectedEntity?.id === credit.id ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
            )}
            onClick={() => { setSelectedEntity(credit); setEditMode(false); }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  credit.entity_type === 'chemist' ? "bg-amber-100 text-amber-600" :
                  credit.entity_type === 'hospital' ? "bg-emerald-100 text-emerald-600" :
                  "bg-blue-100 text-blue-600"
                )}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{credit.entity_name}</h3>
                  <p className="text-xs text-gray-500">{credit.entity_type} • {credit.mr_name}</p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                credit.status === 'current' ? "bg-green-100 text-green-700" :
                credit.status === 'overdue' ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              )}>{credit.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-400">Credit Limit</p>
                <p className="text-sm font-bold text-gray-900">&#8377;{credit.credit_limit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Outstanding</p>
                <p className={cn(
                  "text-sm font-bold",
                  credit.outstanding / credit.credit_limit > 0.8 ? "text-red-600" : "text-gray-900"
                )}>
                  &#8377;{credit.outstanding.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Utilization</p>
                <p className="text-sm font-bold">{Math.round((credit.outstanding / credit.credit_limit) * 100)}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  credit.outstanding / credit.credit_limit > 0.8 ? "bg-red-500" :
                  credit.outstanding / credit.credit_limit > 0.5 ? "bg-amber-500" :
                  "bg-green-500"
                )}
                style={{ width: `${Math.min((credit.outstanding / credit.credit_limit) * 100, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Terms: {credit.payment_terms}</span>
              {credit.last_payment_date && <span>Last payment: {credit.last_payment_date}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Entity Detail Panel */}
      {selectedEntity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Detail: {selectedEntity.entity_name}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => editMode ? handleUpdate(selectedEntity.id) : setEditMode(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                {editMode ? 'Save Changes' : 'Edit Credit Terms'}
              </button>
              <button
                onClick={() => { setSelectedEntity(null); setEditMode(false); }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Credit Limit', key: 'credit_limit', value: selectedEntity.credit_limit, format: (v: number) => `₹${v.toLocaleString()}` },
              { label: 'Outstanding', key: 'outstanding', value: selectedEntity.outstanding, format: (v: number) => `₹${v.toLocaleString()}` },
              { label: 'Payment Terms', key: 'payment_terms', value: selectedEntity.payment_terms, format: (v: string) => v },
              { label: 'Status', key: 'status', value: selectedEntity.status, format: (v: string) => v },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-gray-500 font-medium block mb-1">{field.label}</label>
                {editMode && (field.key === 'credit_limit' || field.key === 'outstanding' || field.key === 'payment_terms' || field.key === 'status') ? (
                  <input
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editData[field.key] ?? selectedEntity[field.key]}
                    onChange={e => setEditData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : (
                  <p className={cn(
                    "text-sm font-bold",
                    field.key === 'status' && selectedEntity.status === 'overdue' ? "text-red-600" : "text-gray-900"
                  )}>
                    {field.format(field.value)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {selectedEntity.total_recorded_sales > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">
                  Detected Sales from Recordings: ₹{selectedEntity.total_recorded_sales.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
