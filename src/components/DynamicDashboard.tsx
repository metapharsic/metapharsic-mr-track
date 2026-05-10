import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, Package, Award, Target, Calendar,
  ArrowUpRight, ArrowDownRight, FileText, Download, Activity,
  BarChart3, PieChart as PieIcon, Settings
} from 'lucide-react';
import { api } from '../services/api';
import { ForecastData } from '../types';

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
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
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

    const handler = (e: StorageEvent) => {
      if (e.key === 'metapharsic_dashboard_widgets' || e.key === 'metapharsic_settings') {
        loadWidgets();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    Promise.all([
      api.dashboard.getStats(),
      api.dashboard.getCharts(),
      api.sales.getForecast()
    ]).then(([statsData, chartsData, forecastData]) => {
      setStats(statsData);
      setCharts(chartsData);
      setForecast(forecastData || []);
      setTimeout(() => setLoading(false), 300);
    }).catch(err => {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    });
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
      return true;
    });
  }

  if (loading || !stats || !charts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const enabledWidgets = widgets.filter(w => w.enabled);

  // Chart data preparations
  const trendData = [
    ...charts.monthlyTrends.map((t: any) => ({
      name: new Date(t.month + '-01').toLocaleString('default', { month: 'short' }),
      month: t.month, sales: parseFloat(t.sales), target: parseFloat(t.target), isForecast: false,
    })),
    ...forecast.map(f => ({
      name: new Date(f.month + '-01').toLocaleString('default', { month: 'short' }),
      month: f.month, forecast: f.predicted_sales, target: null,
      confidence_high: f.confidence_high, confidence_low: f.confidence_low, isForecast: true,
    }))
  ].sort((a: any, b: any) => a.month.localeCompare(b.month));

  const leaderboard = charts.leaderboard.map((mr: any) => ({
    name: mr.name.split(' ')[0], sales: parseFloat(mr.sales), score: mr.score,
  }));

  const productData = charts.productSales.map((p: any) => ({
    name: p.name?.split(' ')[0] || 'Product',
    sales: parseFloat(p.sales),
  }));

  const expenseData = charts.expenseBreakdown.map((e: any) => ({
    name: e.name || 'Other',
    amount: parseFloat(e.amount),
  }));

  const salesByType = charts.salesByType.map((s: any) => ({
    name: s.name.replace('_', ' '),
    value: parseInt(s.value),
  }));

  const leadsByStage = charts.leadsPipeline.map((l: any) => ({
    name: l.name || 'New',
    count: parseInt(l.count),
  }));

  const renderChart = (widgetId: string, chartType: string, data: any[], dataKeys: { name: string; color: string }[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[280px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <PieIcon className="text-slate-300 mb-2" size={32} />
          <p className="text-sm text-slate-400">No data available for this period</p>
        </div>
      );
    }
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
                { label: 'Total Sales', value: `₹${(stats.totalSales / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'bg-blue-500', trend: '+12.5%', isUp: true },
                { label: 'Active MRs', value: stats.activeMRs.toString(), icon: Users, color: 'bg-purple-500', trend: 'Active', isUp: true },
                { label: 'Target Achievement', value: `${stats.achievementRate.toFixed(1)}%`, icon: Target, color: 'bg-emerald-500', trend: '+5.2%', isUp: true },
                { label: 'Top Performer', value: stats.topPerformer?.name?.split(' ')[0] || 'N/A', icon: Award, color: 'bg-amber-500', trend: stats.topPerformer ? `Score: ${stats.topPerformer.performance_score}` : 'Elite', isUp: true },
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
                {renderChart('sales-trend', widget.chartType || 'area', trendData, [
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
                {leaderboard.slice(0, 8).map((mr, i) => (
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
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${(mr.sales / (leaderboard[0]?.sales || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No MR data available</p>}
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
                  [{ name: 'Achieved', sales: stats.totalSales }, { name: 'Target', target: stats.totalSales / (stats.achievementRate / 100 || 1) }],
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
                  salesByType,
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
                  leadsByStage,
                  [{ name: 'count', color: '#06b6d4' }])}
              </div>
            </W>
          </div>
        );

      case 'schedule-calendar':
        return (
          <div className={gridClass}>
            <W title="Recent Field Activity">
              <div className="space-y-3">
                {charts.recentVisits.slice(0, 5).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{v.doctor_name || v.entity_name || 'Visit'}</p>
                        <p className="text-xs text-slate-400">{new Date(v.visit_date).toLocaleDateString()} • {v.mr_name?.split(' ')[0]}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      {v.status || 'Done'}
                    </span>
                  </div>
                ))}
                {charts.recentVisits.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>}
              </div>
            </W>
          </div>
        );

      case 'monthly-activity':
        return (
          <div className={gridClass}>
            <W title="Monthly Activity Trend">
              <div className="h-[280px]">
                {renderChart('monthly-activity', widget.chartType || 'line', trendData, [
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
                {charts.recentSales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Package size={16} /></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sale.customer_name || sale.doctor_name}</p>
                        <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleDateString()} • {sale.sale_type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{parseFloat(sale.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {charts.recentSales.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No sales data available</p>}
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
                  <button onClick={() => navigate('/ai-performance')} className="text-xs text-blue-400 hover:text-blue-300">View All →</button>
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
                      <p className="text-sm font-semibold">MR Performance Nudge</p>
                      <p className="text-xs text-slate-400 mt-0.5">Automated motivational nudges and bonus incentive reminders sent to teams below target.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Activity size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold">32 New Contacts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Potential doctors added to directory for assignment via recent area analysis.</p>
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
