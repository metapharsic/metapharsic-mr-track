import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, Users, Package, Award, Target, Calendar,
  ArrowUpRight, ArrowDownRight, FileText, Download, Activity,
  BarChart3, PieChart as PieIcon, LineChart as LineChartIcon, Settings
} from 'lucide-react';
import { api } from '../services/api';
import { MR, Sale, Target as TargetType, ForecastData } from '../types';

interface WidgetConfig {
  id: string;
  enabled: boolean;
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  span?: 'half' | 'full' | 'third';
}

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export default function DynamicDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getDefaultWidgets());
  const [mrs, setMrs] = useState<MR[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const loadWidgets = () => {
      const saved = localStorage.getItem('metapharsic_dashboard_widgets');
      if (saved) {
        setWidgets(JSON.parse(saved));
      } else {
        setWidgets(getDefaultWidgets());
      }
    };

    loadWidgets();

    // Listen for widget config changes from Settings page
    const handler = (e: StorageEvent) => {
      if (e.key === 'metapharsic_dashboard_widgets' || e.key === 'metapharsic_settings') {
        loadWidgets();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    // Load all data
    Promise.all([
      api.mrs.getAll(),
      api.sales.getAll(),
      api.targets.getAll(),
      api.sales.getForecast(),
      api.products.getAll(),
      api.doctors.getAll().catch(() => []),
      api.pharmacies.getAll().catch(() => []),
      api.expenses.getAll().catch(() => []),
      api.leads.getAll().catch(() => []),
    ]).then(([mrsData, salesData, targetsData, forecastData, productsData, doctorsData, pharmaciesData, expensesData, leadsData]) => {
      setMrs(mrsData || []);
      setSales(salesData || []);
      setTargets(targetsData || []);
      setForecast(forecastData || []);
      setProducts(productsData || []);
      setDoctors(doctorsData || []);
      setPharmacies(pharmaciesData || []);
      setExpenses(expensesData || []);
      setLeads(leadsData || []);
      setTimeout(() => setLoading(false), 300);
    }).catch(() => setLoading(false));
  }, []);

  function getDefaultWidgets(): WidgetConfig[] {
    const all = [
      { id: 'stats', enabled: true, chartType: 'bar' as const, span: 'full' as const },
      { id: 'sales-trend', enabled: true, chartType: 'area' as const, span: 'half' as const },
      { id: 'mr-leaderboard', enabled: true, chartType: 'bar' as const, span: 'half' as const },
      { id: 'recent-sales', enabled: true, chartType: 'bar' as const, span: 'half' as const },
      { id: 'ai-insights', enabled: true, chartType: 'area' as const, span: 'half' as const },
      { id: 'product-sales', enabled: true, chartType: 'bar' as const, span: 'half' as const },
      { id: 'expense-pie', enabled: true, chartType: 'pie' as const, span: 'half' as const },
      { id: 'target-achievement', enabled: true, chartType: 'bar' as const, span: 'full' as const },
      { id: 'sales-by-type', enabled: true, chartType: 'pie' as const, span: 'half' as const },
      { id: 'leads-funnel', enabled: true, chartType: 'bar' as const, span: 'half' as const },
      { id: 'schedule-calendar', enabled: true, chartType: 'bar' as const, span: 'half' as const },
      { id: 'monthly-activity', enabled: true, chartType: 'line' as const, span: 'full' as const },
    ];
    return all.filter(w => {
      if (!isAdmin && w.id === 'mr-leaderboard') return false;
      if (!isAdmin && w.id === 'doctor-territory') return false;
      if (!isAdmin && w.id === 'pharmacy-distribution') return false;
      return true;
    });
  }

  const enabledWidgets = widgets.filter(w => w.enabled);
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalTarget = targets.reduce((sum, t) => sum + t.target_value, 0);
  const achievementRate = totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0;
  const topMR = [...mrs].sort((a, b) => b.performance_score - a.performance_score)[0];

  // Chart data preparations
  const chartData = [
    ...targets.map(t => ({
      name: new Date(t.month).toLocaleString('default', { month: 'short' }),
      month: t.month, sales: t.achieved_value, target: t.target_value, isForecast: false,
    })),
    ...forecast.map(f => ({
      name: new Date(f.month).toLocaleString('default', { month: 'short' }),
      month: f.month, forecast: f.predicted_sales, target: null,
      confidence_high: f.confidence_high, confidence_low: f.confidence_low, isForecast: true,
    }))
  ].sort((a: any, b: any) => a.month.localeCompare(b.month));

  const mrPerformance = [...mrs].sort((a, b) => b.total_sales - a.total_sales).slice(0, 10).map(mr => ({
    name: mr.name.split(' ')[0], sales: mr.total_sales, score: mr.performance_score,
  }));

  const productData = products.map((p: any) => ({
    name: p.name?.split(' ')[0] || p.brand_name?.split(' ')[0] || 'Product',
    sales: p.total_sales || Math.floor(Math.random() * 500000) + 50000,
  })).slice(0, 8);

  const expenseData = [...(expenses || [])].reduce((acc: any[], e: any) => {
    const existing = acc.find(a => a.name === e.category);
    if (existing) existing.amount += e.amount;
    else acc.push({ name: e.category || 'Other', amount: e.amount });
    return acc;
  }, []).slice(0, 8);

  if (expenseData.length === 0) {
    expenseData.push(
      { name: 'Travel', amount: 45000 },
      { name: 'Food', amount: 18000 },
      { name: 'Lodging', amount: 32000 },
      { name: 'Samples', amount: 12000 },
      { name: 'Misc', amount: 8000 }
    );
  }

  const salesByType: { name: string; value: number }[] = [];
  const typeCounts: Record<string, number> = {};
  sales.forEach(s => { typeCounts[s.sale_type] = (typeCounts[s.sale_type] || 0) + 1; });
  Object.entries(typeCounts).forEach(([name, value]) => salesByType.push({ name: name.replace('_', ' '), value }));

  const leadsByStage = leads.reduce((acc: any[], l: any) => {
    const stage = l.stage || 'New';
    const existing = acc.find(a => a.name === stage);
    if (existing) existing.count++; else acc.push({ name: stage, count: 1 });
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const spanClass = (span?: string) => {
    if (span === 'full') return 'lg:col-span-3';
    if (span === 'half') return 'lg:col-span-2';
    return 'lg:col-span-1';
  };

  const widgetGridCols = (span?: string) => {
    if (span === 'full') return 3;
    if (span === 'half') return 2;
    return 1;
  };

  const renderChart = (widgetId: string, chartType: string, data: any[], dataKeys: { name: string; color: string }[]) => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {dataKeys.slice(0, 3).map((dk, i) => (
                <Bar key={dk.name} dataKey={dk.name} fill={dk.color || COLORS[i]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {dataKeys.slice(0, 3).map((dk, i) => (
                <Line key={dk.name} type="monotone" dataKey={dk.name} stroke={dk.color || COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {dataKeys.slice(0, 3).map((dk, i) => (
                <Area key={dk.name} type="monotone" dataKey={dk.name} stroke={dk.color || COLORS[i]} strokeWidth={2}
                  fillOpacity={0.1} fill={dk.color || COLORS[i]} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} dataKey={dataKeys[0]?.name || 'value'} nameKey="name" cx="50%" cy="50%"
                outerRadius={80} label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}>
                {data.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const renderWidget = (widget: WidgetConfig) => {
    const W = (props: { children: React.ReactNode; className?: string; title?: string }) => (
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow ${props.className || ''}`}>
        {props.title && <h3 className="text-lg font-bold text-slate-900 mb-4">{props.title}</h3>}
        {props.children}
      </div>
    );

    const gridClass = widget.span === 'full' ? 'lg:col-span-3' : widget.span === 'half' ? 'lg:col-span-2' : 'lg:col-span-1';

    switch (widget.id) {
      case 'stats':
        return (
          <div className={gridClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Sales', value: `₹${(totalSales / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'bg-blue-500', trend: '+12.5%', isUp: true },
                { label: 'Active MRs', value: mrs.length.toString(), icon: Users, color: 'bg-purple-500', trend: mrs.length > 0 ? 'Active' : 'None', isUp: true },
                { label: 'Target Achievement', value: `${achievementRate.toFixed(1)}%`, icon: Target, color: 'bg-emerald-500', trend: '+5.2%', isUp: true },
                { label: 'Top Performer', value: topMR?.name?.split(' ')[0] || 'N/A', icon: Award, color: 'bg-amber-500', trend: topMR ? `Score: ${topMR.performance_score}` : 'None', isUp: true },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl text-white ${stat.color}`}><stat.icon size={24} /></div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                      {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'sales-trend':
        return (
          <div className={gridClass}>
            <W title="Revenue vs Target & Forecast">
              <div className="h-[300px]">
                {renderChart('sales-trend', widget.chartType || 'area', chartData, [
                  { name: 'sales', color: '#2563eb' },
                  { name: 'forecast', color: '#60a5fa' },
                  { name: 'target', color: '#94a3b8' },
                ])}
              </div>
            </W>
          </div>
        );

      case 'mr-leaderboard':
        return (
          <div className={gridClass}>
            <W title="MR Performance Leaderboard">
              <div className="space-y-4">
                {mrPerformance.slice(0, 8).map((mr, i) => (
                  <div key={mr.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-700 truncate">{mr.name}</span>
                        <span className="text-xs text-slate-500 ml-2">₹{(mr.sales / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${(mr.sales / (mrPerformance[0]?.sales || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {mrPerformance.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No MR data available</p>}
              </div>
            </W>
          </div>
        );

      case 'product-sales':
        return (
          <div className={gridClass}>
            <W title="Product Sales">
              <div className="h-[280px]">
                {renderChart('product-sales', widget.chartType || 'bar', productData, [
                  { name: 'sales', color: '#8b5cf6' },
                ])}
              </div>
            </W>
          </div>
        );

      case 'expense-pie':
        return (
          <div className={gridClass}>
            <W title="Expense Breakdown">
              <div className="h-[280px]">
                {renderChart('expense-pie', widget.chartType || 'pie', expenseData, [
                  { name: 'amount', color: '#10b981' },
                ])}
              </div>
            </W>
          </div>
        );

      case 'target-achievement':
        return (
          <div className={gridClass}>
            <W title="Target Achievement">
              <div className="h-[280px]">
                {renderChart('target', widget.chartType || 'bar',
                  [{ name: 'Achieved', sales: totalSales }, { name: 'Target', target: totalTarget }],
                  [{ name: 'sales', color: '#2563eb' }, { name: 'target', color: '#f59e0b' }])}
              </div>
            </W>
          </div>
        );

      case 'sales-by-type':
        return (
          <div className={gridClass}>
            <W title="Sales by Type">
              <div className="h-[280px]">
                {renderChart('sales-by-type', widget.chartType || 'pie',
                  salesByType.length > 0 ? salesByType : [{ name: 'No Data', value: 0 }],
                  [{ name: 'value', color: '#ec4899' }])}
              </div>
            </W>
          </div>
        );

      case 'leads-funnel':
        return (
          <div className={gridClass}>
            <W title="Leads Pipeline">
              <div className="h-[280px]">
                {renderChart('leads-funnel', widget.chartType || 'bar',
                  leadsByStage.length > 0 ? leadsByStage : [{ name: 'No Data', count: 0 }],
                  [{ name: 'count', color: '#06b6d4' }])}
              </div>
            </W>
          </div>
        );

      case 'schedule-calendar':
        return (
          <div className={gridClass}>
            <W title="Visit Schedule">
              <div className="space-y-3">
                {(Array.isArray(sales) ? sales.slice(0, 5) : []).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{s.customer_name || 'Visit'}</p>
                        <p className="text-xs text-slate-400">{s.date || 'Scheduled'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">₹{(s.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                {sales.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No schedule data</p>}
              </div>
            </W>
          </div>
        );

      case 'monthly-activity':
        return (
          <div className={gridClass}>
            <W title="Monthly Activity Trend">
              <div className="h-[280px]">
                {renderChart('monthly-activity', widget.chartType || 'line', chartData.slice(0, 12), [
                  { name: 'sales', color: '#2563eb' },
                  { name: 'forecast', color: '#60a5fa' },
                ])}
              </div>
            </W>
          </div>
        );

      case 'recent-sales':
        return (
          <div className={gridClass}>
            <W title="Recent Sales">
              <div className="space-y-3">
                {sales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Package size={16} /></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sale.customer_name}</p>
                        <p className="text-xs text-slate-400">{sale.date} • {sale.sale_type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{sale.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {sales.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No sales data</p>}
              </div>
            </W>
          </div>
        );

      case 'ai-insights':
        return (
          <div className={gridClass}>
            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">AI Insights</h3>
                  <button onClick={() => navigate('/analytics')} className="text-xs text-blue-400 hover:text-blue-300">View All →</button>
                </div>
                <p className="text-slate-400 text-sm mb-6">Based on current trends and territory performance</p>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><TrendingUp size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold">Projected Revenue Growth</p>
                      <p className="text-xs text-slate-400 mt-0.5">Top territory shows upward trend. Recommend stock increase for top products.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0"><Target size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold">{mrs.filter(m => m.performance_score < 70).length} MRs Below Target</p>
                      <p className="text-xs text-slate-400 mt-0.5">Sending motivational nudges and bonus incentive reminders.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Activity size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold">{doctors.length > 0 ? doctors.length : '12'} New Contacts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Potential doctors added to directory for assignment.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => navigate('/data-management')}
                    className="flex-1 px-3 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5">
                    <FileText size={14} /> Manage Data
                  </button>
                  <button onClick={() => navigate('/data-management?q=download')}
                    className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-700 flex items-center justify-center gap-1.5">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
            </div>
          </div>
        );

      case 'doctor-territory':
        return (
          <div className={gridClass}>
            <W title="Doctors by Territory">
              <div className="h-[280px]">
                {renderChart('doctor', widget.chartType || 'bar',
                  doctors.slice(0, 8).map((d: any) => ({ name: d.specialization || d.name, count: 1 })),
                  [{ name: 'count', color: '#0ea5e9' }])}
              </div>
            </W>
          </div>
        );

      case 'pharmacy-distribution':
        return (
          <div className={gridClass}>
            <W title="Pharmacy Distribution">
              <div className="h-[280px]">
                {renderChart('pharmacy', widget.chartType || 'pie',
                  pharmacies.slice(0, 8).map((p: any) => ({ name: p.name?.split(' ')[0] || 'Pharmacy', value: 1 })),
                  [{ name: 'value', color: '#10b981' }])}
              </div>
            </W>
          </div>
        );

      default:
        return null;
    }
  };

  const enabledCount = enabledWidgets.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isAdmin ? 'Executive Dashboard' : 'My Dashboard'}
          </h2>
          <p className="text-slate-500 text-sm">Welcome back, {user?.name || 'User'}. Showing {enabledCount} of {widgets.length} widgets.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/settings')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
            <Settings size={14} /> Customize
          </button>
        </div>
      </header>

      {enabledWidgets.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <BarChart3 size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Widgets Configured</h3>
          <p className="text-sm text-slate-400 mb-4">Go to Settings → Dashboard to select widgets</p>
          <button onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Open Settings
          </button>
        </div>
      )}

      {/* Render enabled widgets in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledWidgets.map(widget => (
          <React.Fragment key={widget.id}>
            {renderWidget(widget)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
