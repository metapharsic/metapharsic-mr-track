import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Loader2, CheckCircle2, AlertCircle, Sparkles, Send, Trash2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface FieldSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  mrId: number;
}

export default function FieldSyncModal({ isOpen, onClose, mrId }: FieldSyncModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedActions, setParsedActions] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'processing' | 'synced' | 'error'>('idle');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      handleAnalyze();
    } else {
      setTranscript('');
      setParsedActions([]);
      setSyncStatus('idle');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    setSyncStatus('processing');
    try {
      const result = await geminiService.parseFieldSync(transcript);
      if (result && result.actions) {
        setParsedActions(result.actions);
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      setSyncStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsProcessing(true);
    setSyncStatus('processing');
    try {
      for (const action of parsedActions) {
        if (action.type === 'sale') {
          // Find product ID or default to 1
          await api.sales.create({
            mr_id: mrId,
            customer_name: action.entity_name,
            product_name: action.product_name || 'General Product',
            product_id: 1, // Defaulting for sync
            quantity: action.quantity || 1,
            amount: action.amount || 0,
            date: new Date().toISOString().split('T')[0]
          });
        } else if (action.type === 'payment') {
          // Need to find entity_credit_id from name
          const credits = await api.credits.getAll();
          const entity = credits.find((c: any) => c.entity_name.toLowerCase().includes(action.entity_name.toLowerCase()));
          if (entity) {
            await api.payments.create({
              entity_credit_id: entity.id,
              entity_name: entity.entity_name,
              mr_id: mrId,
              amount: action.amount || 0,
              payment_method: action.payment_method || 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Voice Synced'
            });
          }
        } else if (action.type === 'visit_summary') {
          await api.recordings.create({
            mr_id: mrId,
            entity_name: action.entity_name,
            transcript: transcript,
            summary: action.details || 'Voice reported visit.',
            is_sale: false,
            confidence: 1
          });
        }
      }
      setSyncStatus('synced');
      setTimeout(onClose, 2000);
    } catch (err) {
      setSyncStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">AI Voice Field Sync</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Multi-Action Reporting Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Recording Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Transcript</h3>
                {isListening && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-pulse">
                     <div className="w-2 h-2 bg-red-500 rounded-full" />
                     Live Recording
                  </span>
                )}
             </div>
             
             <div className={cn(
               "min-h-[120px] p-6 rounded-[2rem] border-2 transition-all relative group",
               isListening ? "border-red-200 bg-red-50/30" : "border-slate-100 bg-slate-50"
             )}>
                <p className={cn(
                  "text-lg leading-relaxed",
                  transcript ? "text-slate-900 font-medium" : "text-slate-400 italic"
                )}>
                  {transcript || 'Example: "Collected 5000 from MedPlus. They ordered 10 boxes of Paracet."'}
                </p>
                
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95",
                    isListening ? "bg-red-500 text-white ring-8 ring-red-100" : "bg-blue-600 text-white ring-8 ring-blue-100"
                  )}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
             </div>
          </div>

          {/* Parsed Actions Section */}
          <div className="pt-4 space-y-4">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Extracted Actions</h3>
             
             {isProcessing && syncStatus === 'processing' ? (
                <div className="py-12 flex flex-col items-center gap-4">
                   <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                   <p className="text-slate-600 font-bold">AI is parsing your field report...</p>
                </div>
             ) : parsedActions.length > 0 ? (
                <div className="space-y-3">
                   {parsedActions.map((action, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-shadow"
                      >
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                           action.type === 'sale' ? "bg-emerald-100 text-emerald-600" :
                           action.type === 'payment' ? "bg-blue-100 text-blue-600" :
                           "bg-purple-100 text-purple-600"
                         )}>
                            {action.type === 'sale' ? <Sparkles size={20}/> :
                             action.type === 'payment' ? <Send size={20}/> :
                             <Sparkles size={20}/>}
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-black uppercase text-slate-400">{action.type}</span>
                               <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{action.entity_name}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                               {action.type === 'sale' ? `${action.product_name} (${action.quantity} units) - ₹${action.amount?.toLocaleString()}` :
                                action.type === 'payment' ? `Collected ₹${action.amount?.toLocaleString()} via ${action.payment_method}` :
                                action.details}
                            </p>
                         </div>
                         <button onClick={() => setParsedActions(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                         </button>
                      </motion.div>
                   ))}
                </div>
             ) : syncStatus === 'synced' ? (
                <div className="py-12 flex flex-col items-center gap-4 text-emerald-600 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                   <CheckCircle2 size={48} className="animate-bounce" />
                   <div className="text-center">
                      <p className="text-lg font-black">All Actions Synced!</p>
                      <p className="text-sm font-medium">Database, Inventory, and Credits updated.</p>
                   </div>
                </div>
             ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                   <p className="text-slate-400 text-sm font-medium">Record a voice report to see extracted actions</p>
                </div>
             )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button 
            disabled={parsedActions.length === 0 || isProcessing || syncStatus === 'synced'}
            onClick={handleSyncAll}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            Confirm & Sync All Actions
          </button>
        </div>
      </motion.div>
    </div>
  );
}
