import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Bell, User, Shield, Database, Palette, Globe,
  Save, Check, Moon, Sun, Mail, Smartphone,
  Trash2, Download, Upload, LayoutGrid, BarChart3,
  LineChart, PieChart, TrendingUp, Users, Package,
  Stethoscope, Receipt, Calendar, Target as TargetIcon,
  UserPlus, Eye, GripVertical, X
} from 'lucide-react';

const WIDGET_ICONS: Record<string, React.ElementType> = {
  'stats': BarChart3, 'sales-trend': LineChart, 'mr-leaderboard': Users,
  'product-sales': Package, 'expense-pie': Receipt, 'target-achievement': TargetIcon,
  'doctor-territory': Stethoscope, 'pharmacy-distribution': Users, 'sales-by-type': PieChart,
  'leads-funnel': UserPlus, 'schedule-calendar': Calendar, 'monthly-activity': LineChart,
  'recent-sales': TrendingUp, 'ai-insights': LayoutGrid,
};

const WIDGET_CATALOG = [
  { id: 'stats' as const, label: 'KPI Stat Cards', desc: 'Total Sales, Active MRs, Target Achievement, Top Performer', admin: true, mr: true },
  { id: 'sales-trend' as const, label: 'Revenue vs Target & Forecast', desc: 'Area chart with AI prediction and confidence bands', admin: true, mr: true },
  { id: 'mr-leaderboard' as const, label: 'MR Performance Leaderboard', desc: 'Ranked list of MRs with progress bars', admin: true, mr: false },
  { id: 'product-sales' as const, label: 'Product Sales Distribution', desc: 'Bar chart showing sales by product name', admin: true, mr: true },
  { id: 'expense-pie' as const, label: 'Expense Breakdown', desc: 'Pie chart of expenses by category', admin: true, mr: true },
  { id: 'target-achievement' as const, label: 'Target Achievement Rate', desc: 'Gauge/bar showing target vs achieved', admin: true, mr: true },
  { id: 'doctor-territory' as const, label: 'Doctor Territory Heatmap', desc: 'Bar chart of doctors by territory', admin: true, mr: false },
  { id: 'pharmacy-distribution' as const, label: 'Pharmacy Distribution', desc: 'Pie chart of pharmacies by area', admin: true, mr: false },
  { id: 'sales-by-type' as const, label: 'Sales by Type', desc: 'Pie/bar chart showing new, recurring, cross-sell', admin: true, mr: true },
  { id: 'leads-funnel' as const, label: 'Leads Funnel', desc: 'Bar chart of leads by stage', admin: true, mr: true },
  { id: 'schedule-calendar' as const, label: 'Visit Schedule Overview', desc: 'Upcoming visits grouped by date', admin: true, mr: true },
  { id: 'monthly-activity' as const, label: 'Monthly Activity Trend', desc: 'Line chart of activities over months', admin: true, mr: true },
  { id: 'recent-sales' as const, label: 'Recent Sales Activity', desc: 'List of latest 5 sales', admin: true, mr: true },
  { id: 'ai-insights' as const, label: 'AI Insights Panel', desc: 'Projected growth, target alerts, route optimization', admin: true, mr: true },
];

const CHART_OPTIONS = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'area', label: 'Area Chart', icon: TrendingUp },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
];

function detectDefaultChart(widgetId: string): 'bar' | 'line' | 'area' | 'pie' {
  const map: Record<string, 'bar' | 'line' | 'area' | 'pie'> = {
    'sales-trend': 'area', 'mr-leaderboard': 'bar', 'product-sales': 'bar',
    'expense-pie': 'pie', 'target-achievement': 'bar', 'doctor-territory': 'bar',
    'pharmacy-distribution': 'pie', 'sales-by-type': 'pie', 'leads-funnel': 'bar',
    'schedule-calendar': 'bar', 'monthly-activity': 'line', 'recent-sales': 'bar',
    'ai-insights': 'area', 'stats': 'bar',
  };
  return map[widgetId] || 'bar';
}

interface WidgetConfig {
  id: string;
  enabled: boolean;
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  span?: 'half' | 'full' | 'third';
}

type SettingsTab = 'general' | 'notifications' | 'privacy' | 'data' | 'dashboard';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  dataRetention: number;
  autoLogout: number;
  dashboardWidgets: WidgetConfig[];
}

export default function Settings() {
  const { user, hasPermission } = useAuth();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('dashboard');
  const [searchWidget, setSearchWidget] = useState('');
  const [settings, setSettings] = useState<SettingsState>(() => {
    const defaults: WidgetConfig[] = WIDGET_CATALOG.map(w => ({
      id: w.id,
      enabled: w.admin,
      chartType: detectDefaultChart(w.id),
      span: w.id === 'stats' ? 'full' : 'half',
    }));
    const defaultsMap = new Map(defaults.map(w => [w.id, w]));

    try {
      const savedSettings = localStorage.getItem('metapharsic_settings');
      const savedWidgets = localStorage.getItem('metapharsic_dashboard_widgets');

      // Try to load saved widget config separately (the canonical source)
      if (savedWidgets) {
        const parsedWidgets = JSON.parse(savedWidgets) as WidgetConfig[];
        if (Array.isArray(parsedWidgets) && parsedWidgets.length > 0) {
          // Merge: ensure every catalog widget exists, keeping saved config for known ones
          const merged: WidgetConfig[] = WIDGET_CATALOG.map(w => {
            const saved = parsedWidgets.find(sw => sw.id === w.id);
            if (saved) return { id: w.id, enabled: saved.enabled, chartType: saved.chartType || detectDefaultChart(w.id), span: saved.span || 'half' };
            return { id: w.id, enabled: w.admin, chartType: detectDefaultChart(w.id), span: w.id === 'stats' ? 'full' : 'half' };
          });
          const base = savedSettings ? JSON.parse(savedSettings) : {};
          return { theme: 'light', language: 'en', emailNotifications: true, pushNotifications: true, smsNotifications: false, dailyDigest: true, weeklyReport: true, dataRetention: 12, autoLogout: 30, ...base, dashboardWidgets: merged };
        }
      }

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.dashboardWidgets && Array.isArray(parsed.dashboardWidgets) && parsed.dashboardWidgets.length > 0) {
          const merged: WidgetConfig[] = WIDGET_CATALOG.map(w => {
            const saved = parsed.dashboardWidgets.find(sw => sw.id === w.id);
            if (saved) return { id: w.id, enabled: saved.enabled, chartType: saved.chartType || detectDefaultChart(w.id), span: saved.span || 'half' };
            return { id: w.id, enabled: w.admin, chartType: detectDefaultChart(w.id), span: w.id === 'stats' ? 'full' : 'half' };
          });
          return { theme: 'light', language: 'en', emailNotifications: true, pushNotifications: true, smsNotifications: false, dailyDigest: true, weeklyReport: true, dataRetention: 12, autoLogout: 30, ...parsed, dashboardWidgets: merged };
        }
      }
    } catch { /* ignore corrupted data */ }

    return {
      theme: 'light', language: 'en',
      emailNotifications: true, pushNotifications: true, smsNotifications: false,
      dailyDigest: true, weeklyReport: true, dataRetention: 12, autoLogout: 30,
      dashboardWidgets: defaults,
    };
  });

  const handleSave = () => {
    localStorage.setItem('metapharsic_settings', JSON.stringify(settings));
    localStorage.setItem('metapharsic_dashboard_widgets', JSON.stringify(settings.dashboardWidgets));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleWidget = (id: string) => {
    setSettings(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map(w =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  };

  const setWidgetChartType = (id: string, chartType: 'bar' | 'line' | 'area' | 'pie') => {
    setSettings(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map(w =>
        w.id === id ? { ...w, chartType } : w
      ),
    }));
  };

  const setWidgetSpan = (id: string, span: 'half' | 'full' | 'third') => {
    setSettings(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map(w =>
        w.id === id ? { ...w, span } : w
      ),
    }));
  };

  const handleExportData = () => {
    const data = { settings, notifications: localStorage.getItem('metapharsic_notifications'), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metapharsic-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.settings) {
            setSettings(data.settings);
            localStorage.setItem('metapharsic_settings', JSON.stringify(data.settings));
            alert('Settings imported successfully!');
          }
        } catch {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const filteredWidgets = settings.dashboardWidgets.filter(w => {
    const catalog = WIDGET_CATALOG.find(c => c.id === w.id);
    if (!catalog) return false;
    if (isAdmin && !catalog.admin) return false;
    if (!isAdmin && !catalog.mr) return false;
    if (searchWidget && !catalog.label.toLowerCase().includes(searchWidget.toLowerCase())) return false;
    return true;
  });

  const enabledCount = filteredWidgets.filter(w => w.enabled).length;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 mt-1 ml-[52px]">Manage preferences, dashboard layout, and application settings</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-blue-600" />
                  Dashboard Layout
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select which modules appear on your dashboard. Changes apply after save & page refresh.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-blue-600">{enabledCount}</span> / {filteredWidgets.length} widgets active
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input type="text" placeholder="Search widgets..." value={searchWidget}
                onChange={e => setSearchWidget(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            {/* Widget List */}
            <div className="space-y-3">
              {filteredWidgets.map(w => {
                const catalog = WIDGET_CATALOG.find(c => c.id === w.id)!;
                const Icon = WIDGET_ICONS[catalog.id] || LayoutGrid;
                return (
                  <div key={w.id} className={`border rounded-xl transition-all ${w.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.enabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{catalog.label}</h3>
                          {!catalog.admin && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">MR</span>}
                          {!catalog.mr && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Admin</span>}
                        </div>
                        <p className="text-xs text-slate-500">{catalog.desc}</p>
                      </div>
                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" checked={w.enabled} onChange={() => toggleWidget(w.id)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {w.enabled && (
                      <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-blue-100 pt-3">
                        {/* Chart Type */}
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Chart Type</label>
                          <div className="flex gap-1.5">
                            {CHART_OPTIONS.map(opt => (
                              <button key={opt.value}
                                onClick={() => setWidgetChartType(w.id, opt.value as any)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${w.chartType === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                <opt.icon size={12} /> {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Width */}
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Width</label>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'third', label: '1/3' },
                              { value: 'half', label: '1/2' },
                              { value: 'full', label: 'Full' },
                            ].map(s => (
                              <button key={s.value}
                                onClick={() => setWidgetSpan(w.id, s.value as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${w.span === s.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Preview */}
                        <div className="ml-auto flex items-end">
                          <div className="flex gap-1">
                            {w.span === 'full'
                              ? <div className="w-16 h-3 bg-blue-200 rounded" />
                              : w.span === 'half'
                              ? <><div className="w-8 h-3 bg-blue-200 rounded" /><div className="w-8 h-3 bg-slate-100 rounded" /></>
                              : <><div className="w-5 h-3 bg-blue-200 rounded" /><div className="w-5 h-3 bg-slate-100 rounded" /><div className="w-5 h-3 bg-slate-100 rounded" /></>
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredWidgets.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <LayoutGrid size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No widgets match your search</p>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                {enabledCount} widgets will be displayed on your dashboard
              </p>
              <button onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'}`}>
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Dashboard</>}
              </button>
            </div>
          </div>
        )}

        {/* ==================== GENERAL TAB ==================== */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><Palette className="w-5 h-5" /> Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                <div className="flex gap-3">
                  {(['light', 'dark', 'system'] as const).map(theme => (
                    <button key={theme} onClick={() => setSettings({ ...settings, theme })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${settings.theme === theme ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      {theme === 'light' && <Sun className="w-4 h-4" />}
                      {theme === 'dark' && <Moon className="w-4 h-4" />}
                      {theme === 'system' && <Palette className="w-4 h-4" />}
                      <span className="capitalize">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"><Globe className="w-4 h-4 inline mr-1" /> Language</label>
                <select value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })}
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Auto Logout (minutes)</label>
                <select value={settings.autoLogout} onChange={e => setSettings({ ...settings, autoLogout: parseInt(e.target.value) })}
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', icon: Mail, desc: 'Receive updates via email' },
                { key: 'pushNotifications', label: 'Push Notifications', icon: Bell, desc: 'Browser push notifications' },
                { key: 'smsNotifications', label: 'SMS Notifications', icon: Smartphone, desc: 'Text messages for urgent updates' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg"><Icon className="w-5 h-5 text-slate-600" /></div>
                      <div><h3 className="font-medium text-slate-800">{item.label}</h3><p className="text-sm text-slate-500">{item.desc}</p></div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings[item.key as keyof SettingsState] as boolean}
                        onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                );
              })}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-medium text-slate-800 mb-3">Digest Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={settings.dailyDigest} onChange={e => setSettings({ ...settings, dailyDigest: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <div><span className="font-medium text-slate-800">Daily Digest</span><p className="text-sm text-slate-500">Summary of daily activities</p></div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={settings.weeklyReport} onChange={e => setSettings({ ...settings, weeklyReport: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <div><span className="font-medium text-slate-800">Weekly Report</span><p className="text-sm text-slate-500">Comprehensive weekly summary</p></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRIVACY TAB ==================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><Shield className="w-5 h-5" /> Privacy & Security</h2>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 flex items-center gap-2"><Database className="w-4 h-4" /> Data Retention</h3>
                <p className="text-sm text-amber-700 mt-1">Automatically delete data older than {settings.dataRetention} months</p>
                <input type="range" min="1" max="60" value={settings.dataRetention} onChange={e => setSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
                  className="w-full mt-3 accent-amber-500" />
                <div className="flex justify-between text-xs text-amber-600 mt-1"><span>1 month</span><span className="font-medium">{settings.dataRetention} months</span><span>60 months</span></div>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h3 className="font-medium text-slate-800">Security Options</h3>
                <div className="mt-3 space-y-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Change Password</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Enable Two-Factor Authentication</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Manage Active Sessions</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DATA TAB ==================== */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><Database className="w-5 h-5" /> Data Management</h2>
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h3 className="font-medium text-slate-800 flex items-center gap-2"><Download className="w-4 h-4" /> Export Data</h3>
                <p className="text-sm text-slate-500 mt-1">Download a backup of your settings and preferences</p>
                <button onClick={handleExportData} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Export Settings</button>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h3 className="font-medium text-slate-800 flex items-center gap-2"><Upload className="w-4 h-4" /> Import Data</h3>
                <p className="text-sm text-slate-500 mt-1">Restore settings from a backup file</p>
                <label className="mt-3 inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm cursor-pointer">
                  Import Settings<input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-800 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Clear Data</h3>
                <p className="text-sm text-red-600 mt-1">Permanently delete all local data and reset settings</p>
                <button onClick={() => { if (confirm('Sure? This will delete all settings.')) { localStorage.clear(); window.location.reload(); } }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">Clear All Data</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={props.className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
