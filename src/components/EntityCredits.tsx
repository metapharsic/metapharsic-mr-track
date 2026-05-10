import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  CreditCard, Loader2, TrendingUp, AlertCircle,
  CheckCircle2, X, User, Calculator, MapPin, Brain, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function EntityCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showAIIntelligence, setShowAIIntelligence] = useState(false);
  const [aiScript, setAiScript] = useState<string>('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [paymentData, setPaymentData] = useState<any>({
    amount: '',
    payment_method: 'upi',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    Promise.all([
      api.credits.getAll(),
      api.recordings.getAll()
    ]).then(([c, r]) => {
      setCredits(c);
      setRecordings(r);
      // Augment credit data with recording totals
      const augmented = c.map(credit => {
        const entityRecordings = r.filter(
          rec => rec.entity_name === credit.entity_name
        );
        const totalSales = entityRecordings
          .filter(rec => rec.is_sale)
          .reduce((sum, rec) => sum + (rec.sale_amount || 0), 0);
        return { ...credit, total_recorded_sales: totalSales };
      });
      setCredits(augmented);
      setLoading(false);
    });
  }, []);

  const fetchPayments = async (creditId: number) => {
    const data = await api.payments.getByEntity(creditId);
    setPayments(data);
  };

  const handleSelectEntity = (credit: any) => {
    setSelectedEntity(credit);
    setEditMode(false);
    setShowPaymentForm(false);
    fetchPayments(credit.id);
  };

  const handleUpdate = async (id: number) => {
    const updated = await api.credits.update(id, editData);
    setCredits(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    setEditMode(false);
    setSelectedEntity(updated);
  };

  const handleLogPayment = async () => {
    if (!selectedEntity || !paymentData.amount) return;
    
    const payload = {
      ...paymentData,
      entity_credit_id: selectedEntity.id,
      entity_name: selectedEntity.entity_name,
      amount: parseFloat(paymentData.amount)
    };

    const newPayment = await api.payments.create(payload);
    setPayments(prev => [newPayment, ...prev]);
    
    // Update local credit state (outstanding was updated by DB trigger)
    setCredits(prev => prev.map(c => 
      c.id === selectedEntity.id 
        ? { ...c, outstanding: c.outstanding - payload.amount, last_payment_date: payload.payment_date }
        : c
    ));
    
    if (selectedEntity.id === payload.entity_credit_id) {
      setSelectedEntity((prev: any) => ({
        ...prev,
        outstanding: prev.outstanding - payload.amount,
        last_payment_date: payload.payment_date
      }));
    }

    setShowPaymentForm(false);
    setPaymentData({
      amount: '',
      payment_method: 'upi',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const generateAIScript = async () => {
    if (!selectedEntity) return;
    setGeneratingAI(true);
    setShowAIIntelligence(true);
    try {
      const { script } = await api.intelligence.getCollectionScript(selectedEntity.entity_name);
      setAiScript(script);
    } catch (e: any) {
      console.warn("Backend intelligence not available, using local fallback.");
      // Local Generation Fallback
      const utilization = Math.round((selectedEntity.outstanding / selectedEntity.credit_limit) * 100);
      const isHighRisk = selectedEntity.status === 'blocked' || selectedEntity.status === 'overdue' || utilization > 80;
      
      let localScript = `## AI Intelligence Script for ${selectedEntity.entity_name}\n\n`;
      localScript += `**Status:** ${selectedEntity.status.toUpperCase()} • **Utilization:** ${utilization}%\n\n`;
      
      if (isHighRisk) {
        localScript += `### Opening (Action-Oriented)\n`;
        localScript += `"Good morning. I'm Rajesh from Metapharsic. I'm reviewing the current credit status for ${selectedEntity.entity_name}. We've noticed the utilization is at ${utilization}%, which is quite high."\n\n`;
        localScript += `### Key Negotiation Points\n`;
        localScript += `1. **Urgency:** Explain that current outstanding of ₹${selectedEntity.outstanding.toLocaleString()} needs immediate partial clearance to maintain supply chain priority.\n`;
        localScript += `2. **Commitment:** Ask for a specific payment date for at least ₹${Math.round(selectedEntity.outstanding * 0.4).toLocaleString()}.\n`;
        localScript += `3. **Support:** Offer to help with immediate UPI or Check collection right now.\n\n`;
      } else {
        localScript += `### Opening (Relationship Maintenance)\n`;
        localScript += `"Hi, hope everything is going well. I just wanted to touch base on our billing cycle for this month. You have a healthy balance, but there's ₹${selectedEntity.outstanding.toLocaleString()} that we can clear today."\n\n`;
        localScript += `### Key Negotiation Points\n`;
        localScript += `1. **Efficiency:** Frame it as keeping the account clean for faster order processing next week.\n`;
        localScript += `2. **Digital First:** Suggest using the new UPI collection feature for instant confirmation.\n`;
      }
      
      localScript += `### Closing\n`;
      localScript += `"Can we process a payment of ₹${Math.round(selectedEntity.outstanding * 0.25).toLocaleString()} today to keep everything running smoothly?"`;
      
      setAiScript(localScript);
    } finally {
      setGeneratingAI(false);
    }
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
            onClick={() => handleSelectEntity(credit)}
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
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  credit.status === 'current' ? "bg-green-100 text-green-700" :
                  credit.status === 'overdue' ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-700"
                )}>{credit.status}</span>
                {credit.risk_level && (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                    credit.risk_level === 'Critical' ? "bg-red-600 text-white" :
                    credit.risk_level === 'High' ? "bg-orange-100 text-orange-700" :
                    credit.risk_level === 'Elevated' ? "bg-amber-100 text-amber-700" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {credit.risk_level} Risk ({credit.risk_score})
                  </span>
                )}
              </div>
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectEntity(credit);
                  setTimeout(() => {
                    const el = document.getElementById('ai-intelligence-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                    generateAIScript();
                  }, 100);
                }}
                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded"
              >
                <Sparkles className="w-3 h-3" /> Get Script
              </button>
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
            {([
              { label: 'Credit Limit', key: 'credit_limit', value: selectedEntity.credit_limit, format: (v: number | string) => `₹${Number(v).toLocaleString()}` },
              { label: 'Outstanding', key: 'outstanding', value: selectedEntity.outstanding, format: (v: number | string) => `₹${Number(v).toLocaleString()}` },
              { label: 'Payment Terms', key: 'payment_terms', value: selectedEntity.payment_terms, format: (v: string) => v },
              { label: 'Status', key: 'status', value: selectedEntity.status, format: (v: string) => v },
            ] as const).map(field => (
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

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-900">Payment Ledger</h4>
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showPaymentForm ? 'Cancel' : '+ Log New Payment'}
              </button>
            </div>

            {showPaymentForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Amount</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter amount"
                    value={paymentData.amount}
                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Method</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    value={paymentData.payment_method}
                    onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Reference #</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    placeholder="Check / Trans ID"
                    value={paymentData.reference_number}
                    onChange={e => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Notes</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                    placeholder="Optional notes"
                    value={paymentData.notes}
                    onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLogPayment}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                  >
                    Confirm Payment
                  </button>
                </div>
              </motion.div>
            )}

            <div className="overflow-hidden border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Method</th>
                    <th className="px-3 py-2 font-bold">Reference</th>
                    <th className="px-3 py-2 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{payment.payment_date}</td>
                        <td className="px-3 py-2 text-gray-600 font-medium capitalize">{payment.payment_method}</td>
                        <td className="px-3 py-2 text-gray-500">{payment.reference_number || 'N/A'}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-600">₹{payment.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No payment history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="ai-intelligence-section" className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Collection Intelligence
              </h4>
              <button
                onClick={generateAIScript}
                disabled={generatingAI}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-200 flex items-center gap-1 transition-colors"
              >
                {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiScript ? 'Regenerate Script' : 'Generate Negotiation Script'}
              </button>
            </div>

            <AnimatePresence>
              {showAIIntelligence && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-2"
                >
                  {generatingAI ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                           <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                           <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-bounce" />
                        </div>
                        <p className="text-xs font-medium text-purple-700">AI is analyzing payment history and risk factors...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-purple-900 text-xs leading-relaxed">
                      <ReactMarkdown>
                        {aiScript}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
