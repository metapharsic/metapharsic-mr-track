import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, Package, Award,
  ArrowUpRight, ArrowDownRight, Target,
  Calendar, MapPin, Clock, FileText, Download, Upload
} from 'lucide-react';
import { api } from '../services/api';
import { MR, Sale, Target as TargetType, ForecastData } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [mrs, setMrs] = useState<MR[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.mrs.getAll(),
      api.sales.getAll(),
      api.targets.getAll(),
      api.sales.getForecast()
    ]).then(([mrsData, salesData, targetsData, forecastData]) => {
      setMrs(mrsData);
      setSales(salesData);
      setTargets(targetsData);
      setForecast(forecastData);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });
  }, []);

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalTarget = targets.reduce((sum, t) => sum + t.target_value, 0);
  const achievementRate = (totalSales / totalTarget) * 100;

  const stats = [
    { label: 'Total Sales', value: `₹${(totalSales / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'bg-blue-500', trend: '+12.5%', isUp: true },
    { label: 'Active MRs', value: mrs.length.toString(), icon: Users, color: 'bg-purple-500', trend: '0%', isUp: true },
    { label: 'Target Achievement', value: `${achievementRate.toFixed(1)}%`, icon: Target, color: 'bg-emerald-500', trend: '+5.2%', isUp: true },
    { label: 'Top Performer', value: mrs.sort((a, b) => b.performance_score - a.performance_score)[0]?.name || 'N/A', icon: Award, color: 'bg-amber-500', trend: 'Elite', isUp: true },
  ];

  // Combine historical targets and forecast for the chart
  const chartData = [
    ...targets.map(t => ({
      name: new Date(t.month).toLocaleString('default', { month: 'short' }),
      month: t.month,
      sales: t.achieved_value,
      target: t.target_value,
      isForecast: false
    })),
    ...forecast.map(f => ({
      name: new Date(f.month).toLocaleString('default', { month: 'short' }),
      month: f.month,
      forecast: f.predicted_sales,
      target: null,
      confidence_high: f.confidence_high,
      confidence_low: f.confidence_low,
      isForecast: true
    }))
  ].sort((a, b) => a.month.localeCompare(b.month));

  const mrPerformance = mrs.map(mr => ({
    name: mr.name.split(' ')[0],
    sales: mr.total_sales,
    score: mr.performance_score
  })).sort((a, b) => b.sales - a.sales);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Executive Dashboard</h2>
          <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Calendar size={16} />
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            Generate Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.isUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
              )}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue vs Target & Forecast</h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-slate-600">Actual Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-400 opacity-50"></div>
                <span className="text-slate-600">AI Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-slate-400 border-dashed"></div>
                <span className="text-slate-600">Target</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `₹${value/100000}L`} />
                <Tooltip 
                   content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-sm font-bold text-slate-900 mb-2">{label} {data.isForecast ? '(Forecast)' : ''}</p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-xs">
                              <span className="text-slate-500">{entry.name}:</span>
                              <span className="font-bold text-slate-900">₹{entry.value.toLocaleString()}</span>
                            </div>
                          ))}
                          {data.isForecast && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence Range</p>
                              <p className="text-xs font-medium text-slate-600">
                                ₹{data.confidence_low.toLocaleString()} - ₹{data.confidence_high.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Actual Sales"
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  name="AI Forecast"
                  stroke="#60a5fa" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorForecast)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  name="Target"
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* MR Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performers</h3>
          <div className="space-y-6">
            {mrPerformance.slice(0, 5).map((mr, i) => (
              <div key={mr.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-700">{mr.name}</span>
                    <span className="text-xs font-medium text-slate-500">₹{(mr.sales / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(mr.sales / mrPerformance[0].sales) * 100}%` }}
                      className="bg-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            View All Performance
          </button>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Sales Activity</h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sale.customer_name}</p>
                    <p className="text-xs text-slate-500">{sale.date} • {sale.sale_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{sale.amount.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-medium">Paid</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">AI Insights</h3>
            <p className="text-slate-400 text-sm mb-8">Based on current trends and territory performance.</p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Projected Revenue Growth</p>
                  <p className="text-xs text-slate-400 mt-1">Territory Hyderabad West is showing a 15% upward trend in Cardiology prescriptions. Recommend increasing stock of CardiCare Plus.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Target Alert</p>
                  <p className="text-xs text-slate-400 mt-1">3 MRs are within 5% of their monthly targets. Sending motivational nudges and bonus incentive reminders.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Route Optimization</p>
                  <p className="text-xs text-slate-400 mt-1">New clinics identified in Gachibowli area. 12 potential Tier-A doctors added to the directory for assignment.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => navigate('/data-management')}
                className="flex-1 px-4 py-3 flex items-center justify-center gap-2 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                <FileText size={16} />
                Manage Data
              </button>
              <button
                onClick={() => navigate('/data-management?q=download')}
                className="flex-1 px-4 py-3 flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
              >
                <Download size={16} />
                Export Reports
              </button>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
