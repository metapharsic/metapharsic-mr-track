import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Expense, MR } from '../types';
import { 
  Search, Filter, Plus, Receipt, 
  DollarSign, Calendar, User, 
  CheckCircle2, Clock, AlertCircle,
  MoreVertical, Download, Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mr_id: 1,
    status: 'pending'
  });

  useEffect(() => {
    Promise.all([
      api.expenses.getAll(),
      api.mrs.getAll()
    ]).then(([e, m]) => {
      setExpenses(e);
      setMrs(m);
      setLoading(false);
    });
  }, []);

  const getMrName = (id: number | null) => mrs.find(m => m.id === id)?.name || 'Admin';

  const handleAddExpense = () => {
    if (!formData.description || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const newExpense: any = {
      id: expenses.length + 1,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      mr_id: formData.mr_id,
      status: 'pending'
    };

    setExpenses([newExpense, ...expenses]);
    setFormData({
      description: '',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      mr_id: 1,
      status: 'pending'
    });
    setShowAddForm(false);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getMrName(e.mr_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Expense Manager</h2>
          <p className="text-slate-500 mt-1">Track field expenses, reimbursements and sample costs.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={20} />
            Export Report
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pending</p>
              <h3 className="text-2xl font-bold text-slate-900">₹42,500</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved (MTD)</p>
              <h3 className="text-2xl font-bold text-slate-900">₹1,28,400</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Processing Time</p>
              <h3 className="text-2xl font-bold text-slate-900">2.4 Days</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search expenses by description, category or MR..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Expense List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExpenses.map((expense, i) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Receipt size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{expense.description}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {expense.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={12} />
                    {expense.date}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User size={12} />
                    {getMrName(expense.mr_id)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8">
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">₹{expense.amount.toLocaleString()}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  {expense.status === 'approved' ? (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Approved</span>
                    </>
                  ) : expense.status === 'rejected' ? (
                    <>
                      <AlertCircle size={12} className="text-rose-500" />
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Rejected</span>
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <ImageIcon size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Add New Expense</h3>
              <p className="text-slate-500 text-sm mt-1">Record a new field expense or reimbursement</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                <input
                  type="text"
                  name="description"
                  id="expense-description"
                  placeholder="e.g., Sample delivery, Travel cost"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                <select
                  name="category"
                  id="expense-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Samples">Samples</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  id="expense-amount"
                  placeholder="e.g., 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  id="expense-date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">MR *</label>
                <select
                  name="mr_id"
                  id="expense-mr"
                  value={formData.mr_id}
                  onChange={(e) => setFormData({ ...formData, mr_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select MR</option>
                  {mrs.map(mr => (
                    <option key={mr.id} value={mr.id}>{mr.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
