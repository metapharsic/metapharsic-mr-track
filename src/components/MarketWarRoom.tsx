import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Search, Globe, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';

export default function MarketWarRoom() {
  const [intelligence, setIntelligence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.sales.getMarketIntelligence()
      .then(data => {
        setIntelligence(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = intelligence.filter(i => 
    i.territory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.main_competitor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Globe className="text-blue-600" />
             Market War Room
          </h2>
          <p className="text-slate-500 font-medium">AI-powered territory sentiment and competitor threat intelligence.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Territory..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
          >
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{item.territory}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {item.total_analyzed_visits} Recent Visit Signals
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    item.market_status === 'Dominant' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    item.market_status === 'Competitive' ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-red-50 text-red-700 border-red-100"
                  )}>
                    {item.market_status}
                  </div>
               </div>

               {/* Sentiment Meter */}
               <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Brain size={12} className="text-purple-500" />
                        Market Sentiment
                     </span>
                     <span className="text-lg font-black text-slate-900">{item.sentiment_score}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5">
                     <div 
                       className={cn(
                         "h-full rounded-full transition-all duration-1000",
                         item.sentiment_score > 70 ? "bg-emerald-500" : 
                         item.sentiment_score > 40 ? "bg-blue-500" : "bg-red-500"
                       )}
                       style={{ width: `${item.sentiment_score}%` }}
                     />
                  </div>
               </div>

               {/* Competitor Block */}
               <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 relative group-hover:bg-white transition-colors duration-500">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Competitor</span>
                     {item.competitor_threat_level === 'High Alert' && (
                       <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
                          <ShieldAlert size={12} /> High Alert
                       </span>
                     )}
                  </div>
                  <h4 className="font-black text-slate-900">{item.main_competitor}</h4>
                  <div className="mt-3 flex items-center gap-2">
                     <div className="flex -space-x-2">
                        {[...Array(Math.min(5, item.competitor_mentions))].map((_, i) => (
                           <div key={i} className="w-6 h-6 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[10px] text-red-600 font-bold">
                              !
                           </div>
                        ))}
                     </div>
                     <span className="text-[10px] font-bold text-slate-500">
                        {item.competitor_mentions} Mentions detected
                     </span>
                  </div>
               </div>
            </div>

            {/* Background Accent */}
            <div className={cn(
              "absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl opacity-10 transition-transform duration-700 group-hover:scale-150",
              item.sentiment_score > 70 ? "bg-emerald-400" : "bg-blue-400"
            )} />
          </motion.div>
        ))}
      </div>

      {/* Strategic Summary */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
         <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl font-black mb-4">Strategic Market Overview</h3>
            <p className="text-slate-400 leading-relaxed mb-8">
               Our AI has analyzed <strong>{intelligence.reduce((sum, i) => sum + i.total_analyzed_visits, 0)} signals</strong> from the field across {intelligence.length} territories. 
               We are seeing a <strong>{intelligence.filter(i => i.market_status === 'Under Pressure').length} territory risk profile</strong> in the current cycle.
            </p>
            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Top Growth Zone</p>
                  <p className="text-xl font-black">{intelligence.sort((a,b) => b.sentiment_score - a.sentiment_score)[0]?.territory || 'N/A'}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1">
                  <p className="text-[10px] font-black text-red-400 uppercase mb-1">Critical Competitor</p>
                  <p className="text-xl font-black">{intelligence.sort((a,b) => b.competitor_mentions - a.competitor_mentions)[0]?.main_competitor || 'None'}</p>
               </div>
            </div>
         </div>
         <Zap className="absolute right-[-50px] bottom-[-50px] w-80 h-80 text-white/5 rotate-12" />
      </div>
    </div>
  );
}
