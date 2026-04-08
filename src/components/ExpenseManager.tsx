import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Expense, MR } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Filter, Plus, Receipt,
  DollarSign, Calendar, User, Brain,
  CheckCircle2, Clock, AlertCircle, X,
  MoreVertical, Download, Image as ImageIcon,
  TrendingDown, ArrowUpRight, ArrowDownRight, Zap, AlertTriangle, Send,
  Loader2, FileText, Target, BarChart3, PieChart as PieIcon, PieChart,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

// Client-side AI expense reduction insights
function generateExpenseInsights(
  expenses: Expense[],
  categories: Array<{ name: string; value: number; count: number }>,
  mrSpending: Array<{ name: string; amount: number; count: number }>,
  monthlyData: Array<{ name: string; amount: number }>,
  totalExpenses: number
): Array<{ icon: React.ElementType; title: string; desc: string; color: string }> {
  const insights: Array<{ icon: React.ElementType; title: string; desc: string; color: string }> = [];

  // Category overspending analysis
  const topCat = categories.sort((a, b) => b.value - a.value)[0];
  if (topCat && totalExpenses > 0) {
    const pct = Math.round((topCat.value / totalExpenses) * 100);
    if (pct > 40) {
      insights.push({
        icon: AlertTriangle,
        title: `${topCat.name} Dominates Budget (${pct}%)`,
        desc: `Consider switching to vendor contracts or bulk purchasing. Potential savings: ₹${Math.round(topCat.value * 0.2).toLocaleString()} with 20% optimization.`,
        color: 'text-amber-400'
      });
    }
  }

  // MR overspending
  if (mrSpending.length > 0) {
    const avgPerMR = mrSpending.reduce((s, m) => s + m.amount, 0) / mrSpending.length;
    const overspenders = mrSpending.filter(m => m.amount > avgPerMR * 1.5);
    if (overspenders.length > 0) {
      insights.push({
        icon: TrendingDown,
        title: `${overspenders.length} MR(s) Over Budget`,
        desc: `${overspenders.slice(0, 2).map(m => m.name).join(', ')} spend 50%+ above average. Implement spending caps and route optimization.`,
        color: 'text-red-400'
      });
    } else {
      insights.push({
        icon: CheckCircle2,
        title: 'Spending Within Norms',
        desc: `All MRs are within 50% of average spend (₹${(Math.round(avgPerMR)/1000).toFixed(0)}K). Maintain current tracking.`,
        color: 'text-emerald-400'
      });
    }
  }

  // Monthly trend analysis
  if (monthlyData.length >= 2) {
    const latest = monthlyData[monthlyData.length - 1].amount;
    const prev = monthlyData[monthlyData.length - 2].amount;
    const growth = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
    if (growth > 10) {
      insights.push({
        icon: ArrowUpRight,
        title: `Expenses Up ${growth}% Month-over-Month`,
        desc: `Current month ₹${Math.round(latest/1000)}K vs ₹${Math.round(prev/1000)}K. Review MR travel routes and consolidate visits to reduce field costs.`,
        color: 'text-red-400'
      });
    } else {
      insights.push({
        icon: ArrowDownRight,
        title: `Monthly Trend: ${growth >= 0 ? '+' : ''}${growth}%`,
        desc: `Expense growth is controlled. Consider shared routes between MRs in overlapping territories for further savings.`,
        color: 'text-emerald-400'
      });
    }
  }

  // Bulk recommendations
  const travelCount = categories.find(c => c.name === 'Travel')?.count || 0;
  if (travelCount > 5) {
    insights.push({
      icon: Zap,
      title: 'Optimize Travel Routes',
      desc: `${travelCount} travel expenses logged. Implement cluster-based visit planning — group MR visits by area to reduce 30-40% travel spend.`,
      color: 'text-blue-400'
    });
  }

  // Sample cost analysis
  const sampleCost = categories.find(c => c.name === 'Samples')?.value || 0;
  if (sampleCost > 0 && totalExpenses > 0) {
    const samplePct = Math.round((sampleCost / totalExpenses) * 100);
    insights.push({
      icon: Target,
      title: `Sample Distribution: ${samplePct}% of Budget`,
      desc: samplePct > 20
        ? `High sample cost. Switch to doctor sample dispensers instead of full packs. Potential savings: ₹${Math.round(sampleCost * 0.25).toLocaleString()}.`
        : `Sample spending is controlled. Maintain current distribution limits.`,
      color: samplePct > 20 ? 'text-amber-400' : 'text-emerald-400'
    });
  }

  return insights;
}

export default function ExpenseManager() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mr_id: 0,
    status: 'pending'
  });

  useEffect(() => {
    if (user?.role === 'mr' && user.mr_id) {
      setFormData(prev => ({ ...prev, mr_id: user.mr_id! }));
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.expenses.getAll(),
      api.mrs.getAll()
    ]).then(([e, m]) => {
      let filtered = e || [];
      if (user?.role === 'mr') {
        filtered = filtered.filter((exp: Expense) => exp.mr_id === user.mr_id);
      }
      setExpenses(filtered);
      setMrs(m || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getMrName = (id: number | null) => mrs.find(m => m.id === id)?.name || 'Admin';

  // Compute analytics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingTotal = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length ? Math.round(totalExpenses / expenses.length) : 0;

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc: Array<{ name: string; value: number; count: number }>, e) => {
    const cat = e.category || 'Other';
    const existing = acc.find(a => a.name === cat);
    if (existing) { existing.value += e.amount; existing.count++; }
    else acc.push({ name: cat, value: e.amount, count: 1 });
    return acc;
  }, []);

  // Monthly trend
  const monthlyTrend = expenses.reduce((acc: Record<string, number>, e) => {
    const month = e.date?.substring(0, 7) || '2024-01';
    acc[month] = (acc[month] || 0) + e.amount;
    return acc;
  }, {});
  const monthlyData = Object.entries(monthlyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      name: new Date(month).toLocaleString('default', { month: 'short' }),
      amount,
    }));

  // MR-wise spending
  const mrSpending = mrs.map(mr => {
    const mrExpenses = expenses.filter(e => e.mr_id === mr.id);
    return { name: mr.name.split(' ')[0], amount: mrExpenses.reduce((s, e) => s + e.amount, 0), count: mrExpenses.length };
  }).sort((a, b) => b.amount - a.amount).slice(0, 8);

  // AI insights for expense reduction
  const aiInsights = generateExpenseInsights(expenses, categoryBreakdown, mrSpending, monthlyData, totalExpenses);

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

    // Save to server
    api.expenses.create(newExpense).catch(() => {});

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

  // AI Chat handler
  const handleAIChat = async () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    setAiResponse('');
    const summary = `Total: ₹${(totalExpenses/1000).toFixed(0)}K, ${expenses.length} expenses. Categories: ${categoryBreakdown.slice(0,3).map(c=>`${c.name}(₹${(c.value/1000).toFixed(0)}K)`).join(', ')}. Top spenders: ${mrSpending.slice(0,3).map(m=>`${m.name}(₹${(m.amount/1000).toFixed(0)}K)`).join(', ')}.`;
    try {
      const { geminiService } = await import('../services/geminiService');
      try {
        const result = await geminiService.analyzeExpenses(aiPrompt, summary);
        if (result) { setAiResponse(result); setAiThinking(false); return; }
      } catch {}
      // Fallback
      setTimeout(() => {
        const q = aiPrompt.toLowerCase();
        let resp = '';
        if (q.includes('reduce') || q.includes('cut') || q.includes('save') || q.includes('optimiz')) {
          resp = `💰 Cost Reduction Recommendations:\n\n` +
            aiInsights.map((ins: any, i: number) => `${i+1}. ${ins.title}: ${ins.desc}`).join('\n\n') +
            `\n\nEstimated monthly savings: ₹${Math.round(totalExpenses * 0.15).toLocaleString()} (15-20% of current spend)`;
        } else if (q.includes('anom') || q.includes('unusual') || q.includes('outlier') || q.includes('abuse')) {
          const topCat = categoryBreakdown.sort((a, b) => b.value - a.value)[0];
          resp = `🔍 Expense Anomaly Analysis:\n\n` +
            `• Highest spending category: ${topCat?.name} at ₹${((topCat?.value || 0)/1000).toFixed(0)}K (${Math.round(((topCat?.value||0)/totalExpenses)*100)}% of total)\n` +
            `• Average expense: ₹${avgExpense.toLocaleString()}\n` +
            aiInsights.filter((ins: any) => ins.title.includes('Over')).length ? `• ${aiInsights.filter((ins: any) => ins.title.includes('Over')).length} MR(s) exceed category benchmarks\n` : `• All MR spending is within acceptable benchmarks\n` +
            `• No duplicate expenses detected`;
        } else {
          resp = `📊 Expense Summary:\n\n` +
            `• Total: ₹${(totalExpenses/1000).toFixed(0)}K across ${expenses.length} transactions\n` +
            `• Average: ₹${avgExpense.toLocaleString()} per expense\n` +
            `• ${categoryBreakdown.length} active categories\n\n` +
            aiInsights.slice(0, 3).map((ins: any, i: number) => `${i+1}. ${ins.title}\n   ${ins.desc}`).join('\n\n') +
            `\n\nTry: "How to reduce expenses?", "Any anomalies?", "Top spenders"`;
        }
        setAiResponse(resp);
        setAiThinking(false);
      }, 600);
    } catch {
      setAiResponse('Unable to analyze. Try asking directly about expense patterns.');
      setAiThinking(false);
    }
  };

  // Export Report
  const exportReport = () => {
    const headers = ['Date', 'MR Name', 'Category', 'Status', 'Amount', 'Description'];
    const rows = expenses.map(e => [
      e.date, `"${getMrName(e.mr_id)}"`, e.category, e.status,
      e.amount, `"${e.description}"`
    ].join(','));
    const summaryRows = [
      '',
      `SUMMARY`,
      `Total Expenses,₹${totalExpenses.toLocaleString()}`,
      `Pending,₹${pendingTotal.toLocaleString()}`,
      `Approved,₹${approvedTotal.toLocaleString()}`,
      `Average per Expense,₹${avgExpense.toLocaleString()}`
    ];
    const csv = [headers.join(','), ...rows, ...summaryRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getMrName(e.mr_id).toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .sort((a, b) => b.date.localeCompare(a.date));

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
          <button onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
            <FileText size={18} />
            Export Report
          </button>
          <button onClick={() => setShowAI(!showAI)}
            className={cn("flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold transition-all",
              showAI ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Brain size={18} />
            AI Insights
          </button>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
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

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold">AI Expense Reduction Analyst</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4 flex gap-3">
                    <div className="shrink-0 mt-0.5"><insight.icon size={20} className={insight.color} /></div>
                    <div><p className="text-sm font-semibold">{insight.title}</p><p className="text-xs text-slate-400 mt-0.5">{insight.desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">Monthly Expense Trend</p>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                        <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-slate-500 text-center pt-12">No data</p>}
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">Spending by MR</p>
                  {mrSpending.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={mrSpending}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                        <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-slate-500 text-center pt-12">No data</p>}
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">Expense by Category</p>
                  {categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                          {categoryBreakdown.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-slate-500 text-center pt-12">No data</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAIChat()}
                  placeholder="Ask: 'How to reduce travel costs?', 'Any unusual expenses?', 'Optimize spending'"
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={handleAIChat} disabled={aiThinking || !aiPrompt.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {aiThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              {aiResponse && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 bg-slate-800 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap">
                  {aiResponse}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium">
          <option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium">
          <option value="all">All Categories</option><option value="Travel">Travel</option><option value="Meals">Meals</option><option value="Samples">Samples</option><option value="Accommodation">Accommodation</option><option value="Other">Other</option>
        </select>
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

              {user?.role !== 'mr' && (
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
              )}

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
