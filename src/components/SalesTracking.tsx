import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sale, Product, MR } from '../types';
import {
  Search, Filter, Plus, Download,
  TrendingUp, Calendar, User, Brain,
  Package, DollarSign, MoreVertical, X,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Zap, Target, AlertTriangle, Loader2, Send, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export default function SalesTracking() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showNewSale, setShowNewSale] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiThinking, setAiThinking] = useState(false);
  const [newSale, setNewSale] = useState({
    customer_name: '', product_name: '', quantity: '',
    amount: '', mr_name: '', date: new Date().toISOString().split('T')[0],
    sale_type: 'primary' as string, doctor_name: '', clinic: '', mr_id: 0, product_id: 0,
  });

  useEffect(() => {
    Promise.all([
      api.sales.getAll(),
      api.products.getAll(),
      api.mrs.getAll()
    ]).then(([s, p, m]) => {
      setSales(s);
      setProducts((p || []) as Product[]);
      setMrs(m || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
  const avgOrder = sales.length ? Math.round(totalRevenue / sales.length) : 0;

  // AI Insights: product performance analysis
  const productPerformance = products.reduce((acc: Array<{ name: string; sales: number; stock: number }>, p: Product) => {
    const pSales = sales.filter(s => s.product_name === p.name).reduce((sum, s) => sum + s.amount, 0);
    acc.push({ name: p.name, sales: pSales, stock: p.stock });
    return acc;
  }, []).sort((a, b) => b.sales - a.sales);

  // AI Insights: monthly revenue trend
  const monthlyRevenue = sales.reduce((acc: Record<string, number>, s) => {
    const month = s.date?.substring(0, 7) || '2024-01';
    acc[month] = (acc[month] || 0) + s.amount;
    return acc;
  }, {});
  const monthlyTrend = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      name: new Date(month).toLocaleString('default', { month: 'short', year: '2-digit' }),
      amount,
    }));

  // AI Insights: top performing MRs
  const mrPerformance = mrs.reduce((acc: Array<{ name: string; sales: number }>, mr: MR) => {
    const mrSales = sales.filter(s => s.mr_name === mr.name || s.mr_id === mr.id).reduce((sum, s) => sum + s.amount, 0);
    acc.push({ name: mr.name, sales: mrSales });
    return acc;
  }, []).sort((a, b) => b.sales - a.sales).slice(0, 8);

  // AI Insights: product mix pie
  const productMix = products.slice(0, 6).map(p => {
    const pSales = sales.filter(s => s.product_name === p.name).reduce((sum, s) => sum + s.quantity, 0);
    return { name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name, value: pSales };
  }).filter(p => p.value > 0);

  // AI-generated insights text (client-side, no API needed)
  const aiInsights: { icon: React.ElementType; title: string; desc: string; color: string }[] = [];
  const filteredSales = sales.filter(s =>
    s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mr_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(s => filterType === 'all' || s.sale_type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (productMix.length > 0) {
    const topProduct = productMix.sort((a, b) => b.value - a.value)[0];
    aiInsights.push({
      icon: Zap, title: `Top Seller: ${topProduct?.name || 'N/A'}`,
      desc: `This product accounts for ${productMix.length > 0 ? Math.round(((topProduct?.value || 0) / productMix.reduce((sum: number, p: { value: number }) => sum + p.value, 0)) * 100) : 0}% of total units sold. Consider increasing inventory and promotional efforts.`,
      color: 'text-emerald-400',
    });
  }

  if (mrPerformance.length > 0) {
    const topMR = mrPerformance[0];
    aiInsights.push({
      icon: Target, title: `Top Performer: ${topMR.name}`,
      desc: `Leading with ₹${(topMR.sales / 1000).toFixed(0)}K in sales. Study their territory strategy and replicate for other MRs.`,
      color: 'text-blue-400',
    });
  }

  const lowStockProducts = products.filter(p => p.stock < (p.reorder_level || 100)).map(p => p.name);
  if (lowStockProducts.length > 0) {
    aiInsights.push({
      icon: AlertTriangle, title: `Low Stock Alert: ${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''}`,
      desc: `${lowStockProducts.slice(0, 3).join(', ')}${lowStockProducts.length > 3 ? '...' : ''} — reorder recommended before next MR cycle.`,
      color: 'text-amber-400',
    });
  }

  if (monthlyTrend.length >= 2) {
    const latest = monthlyTrend[monthlyTrend.length - 1]?.amount || 0;
    const prev = monthlyTrend[monthlyTrend.length - 2]?.amount || 0;
    const growth = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
    aiInsights.push({
      icon: growth >= 0 ? TrendingUp : ArrowDownRight, title: `Monthly Trend: ${growth >= 0 ? '+' : ''}${growth}%`,
      desc: growth >= 0
        ? `Revenue is growing month-over-month. Current momentum suggests maintaining sales targets for next quarter.`
        : `Revenue declined compared to last month. Consider targeted campaigns in underperforming territories.`,
      color: growth >= 0 ? 'text-emerald-400' : 'text-red-400',
    });
  }

  // AI Chat
  const handleAIChat = async () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    setAiResponse('');

    try {
      // Construct a prompt for Gemini if available, or generate client-side insight
      const salesSummary = `Total Sales: ₹${totalRevenue.toLocaleString()}, ${sales.length} transactions, ${totalUnits} units, ${mrs.length} MRs, ${products.length} products. Top MRs: ${mrPerformance.slice(0, 3).map(m => `${m.name} (₹${(m.sales / 1000).toFixed(0)}K)`).join(', ')}. Top Products: ${productMix.slice(0, 3).map(p => `${p.name} (${p.value} units)`).join(', ')}.`;

      // Try Gemini, fallback to client-side analysis
      const { geminiService } = await import('../services/geminiService');
      try {
        const fullPrompt = `You are a pharmaceutical sales analytics AI. Based on the following data, respond to this query:
"${aiPrompt}"

Data: ${salesSummary}

Provide a concise, actionable response with specific recommendations.`;

        // Attempt Gemini call - will fail gracefully if not configured
        const result = await geminiService.analyzeSales(aiPrompt, salesSummary);
        if (result) {
          setAiResponse(result);
          setAiThinking(false);
          return;
        }
      } catch { /* Gemini not available, fallback */ }

      // Client-side AI analysis fallback
      setTimeout(() => {
        let response = '';
        const q = aiPrompt.toLowerCase();

        if (q.includes('best') || q.includes('top') || q.includes('perform')) {
          const topMR = mrPerformance[0];
          response = `Based on ${sales.length} sales records totaling ₹${(totalRevenue / 100000).toFixed(2)}L:\n\n` +
            `• Top MR: ${topMR.name} with ₹${(topMR.sales / 1000).toFixed(0)}K revenue\n` +
            `• Best product: ${productMix.length > 0 ? productMix.sort((a, b) => b.value - a.value)[0]?.name : 'N/A'}\n` +
            `• Average order value: ₹${avgOrder.toLocaleString()}\n\n` +
            `Recommendation: Cross-reference top MR territories with low-performing areas to identify growth opportunities.`;
        } else if (q.includes('trend') || q.includes('growth') || q.includes('forecast')) {
          if (monthlyTrend.length >= 2) {
            const latest = monthlyTrend[monthlyTrend.length - 1].amount;
            const prev = monthlyTrend[monthlyTrend.length - 2].amount;
            const growth = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
            response = `Sales Trend Analysis:\n\n` +
              `• Current month: ₹${(latest / 1000).toFixed(0)}K | Previous month: ₹${(prev / 1000).toFixed(0)}K\n` +
              `• Growth: ${growth >= 0 ? '+' : ''}${growth}%\n` +
              `• ${growth >= 0 ? 'Positive momentum — consider increasing targets by 5-10% next quarter.' : 'Declining trend detected — recommend focused MR campaigns in low-performing territories.'}\n\n` +
              `Based on current trajectory, projected next month: ₹${Math.round(latest * (1 + growth / 100) / 1000)}K`;
          } else {
            response = 'Insufficient historical data for trend analysis. Need at least 2 months of sales data.';
          }
        } else if (q.includes('product') || q.includes('inventory') || q.includes('stock')) {
          const topProduct = productMix.sort((a, b) => b.value - a.value)[0];
          response = `Product Analysis:\n\n` +
            `• Leading product: ${topProduct.name} with ${topProduct.value} units sold\n` +
            `• ${lowStockProducts.length > 0 ? `⚠️ Low stock alert for: ${lowStockProducts.join(', ')}. Reorder immediately.` : `✅ All products are within acceptable stock levels.`}\n` +
            `• Products tracked: ${products.length}\n\n` +
            `Recommendation: Focus MR efforts on high-margin products and ensure adequate stock for top sellers.`;
        } else {
          response = `Sales Overview Analysis:\n\n` +
            `• Total Revenue: ₹${(totalRevenue / 100000).toFixed(2)}L across ${sales.length} transactions\n` +
            `• Average Order: ₹${avgOrder.toLocaleString()}\n` +
            `• Active MRs: ${mrs.length} | Products: ${products.length}\n\n` +
            `Key Observations:\n` +
            `1. Revenue per MR averages ₹${mrs.length > 0 ? Math.round(totalRevenue / mrs.length).toLocaleString() : 'N/A'}\n` +
            `2. ${productMix.length > 0 ? `${productMix.length} products have recorded sales activity` : 'No product sales recorded yet'}\n` +
            `3. ${lowStockProducts.length > 0 ? `${lowStockProducts.length} products need reordering` : 'Inventory levels are healthy'}\n\n` +
            `Try asking: "Who's the top performer?", "What's the sales trend?", or "Analyze product performance"`;
        }
        setAiResponse(response);
        setAiThinking(false);
      }, 800);
    } catch {
      setAiResponse('Unable to analyze sales data. Please try again.');
      setAiThinking(false);
    }
  };

  // Filtered sales for table
  const displaySales = sales.filter(s =>
    s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mr_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(s => filterType === 'all' || s.sale_type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Customer', 'Product', 'Quantity', 'Amount', 'MR Name', 'Sale Type', 'Doctor', 'Clinic'];
    const rows = sales.map(s => [
      s.date, `"${s.customer_name}"`, `"${s.product_name || ''}"`,
      s.quantity, s.amount, `"${s.mr_name || ''}"`, s.sale_type,
      `"${s.doctor_name || ''}"`, `"${s.clinic || ''}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sales_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Create new sale
  const createSale = async () => {
    if (!newSale.customer_name || !newSale.product_name || !newSale.amount) return;
    try {
      const created = await api.sales.create({
        mr_id: newSale.mr_id || mrs[0]?.id || 1,
        product_id: newSale.product_id || 1,
        quantity: Number(newSale.quantity) || 1,
        amount: Number(newSale.amount),
        date: newSale.date,
        product_name: newSale.product_name,
        mr_name: newSale.mr_name || mrs[0]?.name || '',
        customer_name: newSale.customer_name,
        sale_type: newSale.sale_type,
        doctor_name: newSale.doctor_name || '',
        clinic: newSale.clinic || '',
      });
      setSales(prev => [...prev, created]);
      setShowNewSale(false);
      setNewSale({
        customer_name: '', product_name: '', quantity: '',
        amount: '', mr_name: '', date: new Date().toISOString().split('T')[0],
        sale_type: 'primary', doctor_name: '', clinic: '', mr_id: 0, product_id: 0,
      });
    } catch (e) {
      console.error('Failed to create sale:', e);
    }
  };

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
          <h2 className="text-3xl font-bold text-slate-900">Sales Tracking</h2>
          <p className="text-slate-500 mt-1">Monitor all sales transactions and prescription data.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
            <Download size={18} />
            Export CSV
          </button>
          <button onClick={() => setShowNewSale(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={20} />
            New Sale Entry
          </button>
          <button onClick={() => setShowAI(!showAI)}
            className={cn("flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold transition-all",
              showAI ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Brain size={18} />
            AI Insights
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Units Sold</p>
              <h3 className="text-2xl font-bold text-slate-900">{sales.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Order Value</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{Math.round(sales.reduce((sum, s) => sum + s.amount, 0) / sales.length).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-4">
            {/* AI Chat */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold">AI Sales Analyst</h3>
              </div>
              {/* Quick Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4 flex gap-3">
                    <div className="shrink-0 mt-0.5"><insight.icon size={20} className={insight.color} /></div>
                    <div><p className="text-sm font-semibold">{insight.title}</p><p className="text-xs text-slate-400 mt-0.5">{insight.desc}</p></div>
                  </div>
                ))}
              </div>
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Revenue Trend */}
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">Monthly Revenue Trend</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                      <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* MR Leaderboard */}
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">MR Sales Leaderboard</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={mrPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                      <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Product Distribution */}
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">Product Distribution</p>
                  {productMix.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={productMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                          {productMix.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-slate-500 text-center pt-10">No product data</p>}
                </div>
              </div>
              {/* AI Chat Input */}
              <div className="flex gap-2">
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAIChat()}
                  placeholder="Ask anything: 'Who's top performer?', 'Forecast next month', 'Analyze products'"
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
            placeholder="Search by customer, product or MR..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">All Types</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="return">Return</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Transaction Date</th>
                <th className="px-6 py-4">Customer / Doctor</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">MR Assigned</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale, i) => (
                <motion.tr 
                  key={sale.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Calendar size={16} />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{sale.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{sale.customer_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{sale.sale_type.replace('_', ' ')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{sale.product_name}</span>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">x{sale.quantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {sale.mr_name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{sale.mr_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">₹{sale.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-sm text-slate-500">Showing <span className="font-bold text-slate-900">{displaySales.length}</span> of <span className="font-bold text-slate-900">{sales.length}</span> transactions</p>
        </div>
      </div>

      {/* ==================== NEW SALE MODAL ==================== */}
      <AnimatePresence>
        {showNewSale && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowNewSale(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">New Sale Entry</h2>
                <button onClick={() => setShowNewSale(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer *</label>
                    <input type="text" value={newSale.customer_name}
                      onChange={e => setNewSale(p => ({ ...p, customer_name: e.target.value }))}
                      placeholder="Customer or Pharmacy"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Product *</label>
                    <select value={newSale.product_name}
                      onChange={e => setNewSale(p => ({ ...p, product_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select product</option>
                      {(products as Product[]).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                    <input type="number" value={newSale.quantity}
                      onChange={e => setNewSale(p => ({ ...p, quantity: e.target.value }))}
                      placeholder="1"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
                    <input type="number" value={newSale.amount}
                      onChange={e => setNewSale(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale Type</label>
                    <select value={newSale.sale_type}
                      onChange={e => setNewSale(p => ({ ...p, sale_type: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="return">Return</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                    <input type="date" value={newSale.date}
                      onChange={e => setNewSale(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">MR Assigned</label>
                  <select value={newSale.mr_name}
                    onChange={e => setNewSale(p => ({ ...p, mr_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select MR</option>
                    {mrs.map(mr => <option key={mr.id} value={mr.name}>{mr.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <button onClick={() => setShowNewSale(false)}
                  className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={createSale}
                  disabled={!newSale.customer_name || !newSale.product_name || !newSale.amount}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <CheckCircle2 size={16} /> Save Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
