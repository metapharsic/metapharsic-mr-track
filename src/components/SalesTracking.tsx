import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sale, Product, MR } from '../types';
import { 
  Search, Filter, Plus, Download, 
  TrendingUp, Calendar, User, 
  Package, DollarSign, MoreVertical,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function SalesTracking() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api.sales.getAll(),
      api.products.getAll(),
      api.mrs.getAll()
    ]).then(([s, p, m]) => {
      setSales(s);
      setProducts(p);
      setMrs(m);
      setLoading(false);
    });
  }, []);

  const filteredSales = sales.filter(s => 
    s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mr_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-slate-900">Sales Tracking</h2>
          <p className="text-slate-500 mt-1">Monitor all sales transactions and prescription data.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
            <Download size={18} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={20} />
            New Sale Entry
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
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
          <Filter size={20} />
          Filters
        </button>
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
          <p className="text-sm text-slate-500">Showing <span className="font-bold text-slate-900">1 to {filteredSales.length}</span> of <span className="font-bold text-slate-900">{sales.length}</span> transactions</p>
          <div className="flex gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-50" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-50" disabled>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
