import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { 
  Search, Filter, Plus, Package, 
  AlertCircle, ChevronRight, Info,
  Heart, Brain, Wind, Activity, Pill
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const departmentIcons: Record<string, any> = {
  'Cardiology': Heart,
  'Neurology': Brain,
  'Pulmonology': Wind,
  'Endocrinology': Activity,
  'Gastroenterology': Pill,
  'General Medicine': Package
};

export default function ProductPortfolio() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    api.products.getAll().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const departments = ['All', ...Array.from(new Set(products.map(p => p.department)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.composition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    return matchesSearch && matchesDept;
  });

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
          <h2 className="text-3xl font-bold text-slate-900">Product Portfolio</h2>
          <p className="text-slate-500 mt-1">Manage your pharmaceutical inventory and product details.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          <Plus size={20} />
          Add New Product
        </button>
      </header>

      {/* Department Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              selectedDept === dept 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by product name or composition..." 
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

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Pricing (PTS/MRP)</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product, i) => {
                const Icon = departmentIcons[product.department] || Package;
                const isLowStock = product.stock <= product.reorder_level;
                
                return (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"
                        )}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.composition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-bold text-slate-900">₹{product.pts}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">₹{product.mrp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              isLowStock ? "bg-red-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, (product.stock / (product.reorder_level * 3)) * 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-bold",
                          isLowStock ? "text-red-600" : "text-emerald-600"
                        )}>
                          {product.stock}
                        </span>
                        {isLowStock && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Info size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
