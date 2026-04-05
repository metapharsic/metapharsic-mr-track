import React, { useState, useRef, useCallback } from 'react';
import {
  Mic, Square, Play, Pause, Loader2, Zap,
  CheckCircle2, AlertCircle, Clock,
  Languages, X, Send
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface VisitRecordingData {
  id: number;
  mrId: number;
  entityType: 'doctor' | 'chemist' | 'hospital';
  entityName: string;
  transcript: string;
  language: 'en' | 'hi' | 'te';
  isLead: boolean;
  leadConfidence: number;
  leadReasoning: string;
  isSale: boolean;
  saleAmount: number;
  saleDetails: string;
  shouldScheduleFollowUp: boolean;
  followUpPurpose: string;
  shouldRequestApproval: boolean;
  status: 'pending_review' | 'approved' | 'rejected';
  timestamp: string;
}

interface VoiceRecorderProps {
  mrId: number;
  entityType: 'doctor' | 'chemist' | 'hospital';
  entityName: string;
  onRecordingComplete: (recording: VisitRecordingData) => void;
  onLeadDetected?: (lead: { doctorName: string; priority: string; reason: string }) => void;
  onSaleDetected?: (sale: { entity: string; amount: number; details: string }) => void;
  onFollowUpScheduled?: (followUp: { date: string; purpose: string }) => void;
}

const LEAD_SIGNALS = [
  { words: ['interested', 'would like', 'want', 'need', 'looking for'], weight: 3 },
  { words: ['send me', 'send us', 'bring me', 'bring us', 'share the'], weight: 2 },
  { words: ['samples', 'sample', 'trial', 'try'], weight: 2 },
  { words: ['follow up', 'follow-up', 'call back', 'visit again', 'come back'], weight: 3 },
  { words: ['presentation', 'demo', 'show me', 'tell me more'], weight: 2 },
  { words: ['proposal', 'quotation', 'rate card', 'price list', 'discount'], weight: 3 },
  { words: ['bulk', 'big order', 'monthly order'], weight: 4 },
  { words: ['credit', 'later', 'next month', 'deferred payment'], weight: 2 },
  { words: ['competitor', 'currently using', 'switching', 'change from'], weight: 3 },
  { words: ['prescribe', 'start using', 'recommend', 'try your product'], weight: 4 },
  { words: ['impressed', 'better', 'effective', 'works well', 'good results'], weight: 2 },
];

const SALE_SIGNALS = [
  { words: ['order', 'purchase', 'buy', 'stock up'], weight: 3 },
  { words: ['rupees', 'amount', 'payment', 'pay', 'bill'], weight: 2 },
  { words: ['quantity', 'units', 'boxes', 'strips', 'pieces'], weight: 2 },
  { words: ['invoice', 'challan', 'delivery', 'supply'], weight: 3 },
];

interface DetectionResult {
  isLead: boolean;
  leadConfidence: number;
  leadReasoning: string;
  isSale: boolean;
  saleConfidence: number;
  saleAmount: number;
  saleDetails: string;
  shouldScheduleFollowUp: boolean;
  followUpPurpose: string;
  shouldRequestApproval: boolean;
}

function analyzeText(text: string): DetectionResult {
  const lower = text.toLowerCase();
  let leadScore = 0;
  let leadMatches: string[] = [];
  for (const s of LEAD_SIGNALS) {
    for (const w of s.words) {
      if (lower.includes(w)) { leadScore += s.weight; leadMatches.push(w); }
    }
  }
  const leadConfidence = Math.min(leadScore * 10, 95);

  let saleScore = 0;
  let saleMatches: string[] = [];
  for (const s of SALE_SIGNALS) {
    for (const w of s.words) {
      if (lower.includes(w)) { saleScore += s.weight; saleMatches.push(w); }
    }
  }

  const amountMatch = lower.match(/(?:₹|rs\.?\s*)?(\d[\d,]*)/g);
  let saleAmount = 0;
  if (amountMatch && saleScore >= 2) {
    const amounts = amountMatch.map(s => parseInt(s.replace(/[^0-9]/g, '')).valueOf() || 0);
    saleAmount = amounts.reduce((max, val) => Math.max(max, val), 0);
  }

  const isLead = leadScore >= 3;
  const isSale = saleScore >= 3 && saleAmount > 0;
  const shouldScheduleFollowUp = ['follow up', 'follow-up', 'call back', 'visit again', 'come back', 'next week', 'next month', 'tomorrow', 'meeting', 'appointment'].some(w => lower.includes(w));
  const followUpPurpose = leadMatches.length > 0 ? `Follow-up: ${leadMatches.slice(0, 3).join(', ')}` : 'General follow-up visit';
  const shouldRequestApproval = saleAmount > 50000 || leadScore >= 6;

  const leadReasoning = isLead ? `Interest signals: ${leadMatches.join(', ')}` : 'No clear lead signals detected.';
  const saleDetails = isSale ? `Keywords: ${saleMatches.join(', ')}. Amount: ${saleAmount}` : 'N/A';

  return { isLead, leadConfidence, leadReasoning, isSale, saleConfidence: Math.min(saleScore * 15, 90), saleAmount, saleDetails, shouldScheduleFollowUp, followUpPurpose, shouldRequestApproval };
}

const LANGUAGES = [
  { code: 'en' as const, label: 'English', short: 'EN' },
  { code: 'hi' as const, label: 'Hindi', short: 'HI' },
  { code: 'te' as const, label: 'Telugu', short: 'TE' },
];

export default function VoiceRecorder({ mrId, entityType, entityName, onRecordingComplete, onLeadDetected, onSaleDetected, onFollowUpScheduled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [approvalSent, setApprovalSent] = useState(false);
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recogRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = !!SR;

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();

      if (supported) {
        const r = new SR();
        const map = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
        r.lang = map[language];
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (ev: any) => {
          let inter = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            if (ev.results[i].isFinal) setTranscript(p => p + ev.results[i][0].transcript);
            else inter += ev.results[i][0].transcript;
          }
          setInterimText(inter);
        };
        r.onerror = () => { r.stop(); setManualMode(true); };
        recogRef.current = r;
        r.start();
      } else setManualMode(true);

      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      setIsRecording(true);
      setTranscript('');
      setDetection(null);
      setApprovalSent(false);
      setSaved(false);
      setManualMode(false);
    } catch {
      setManualMode(true);
    }
  }, [supported]);

  const process = useCallback(() => {
    const d = analyzeText(transcript);
    setDetection(d);
    if (d.isLead && onLeadDetected) onLeadDetected({ doctorName: entityName, priority: d.leadConfidence > 70 ? 'high' : 'medium', reason: d.leadReasoning });
    if (d.isSale && onSaleDetected) onSaleDetected({ entity: entityName, amount: d.saleAmount, details: d.saleDetails });
    if (d.shouldScheduleFollowUp && onFollowUpScheduled) onFollowUpScheduled({ date: new Date(Date.now() + 86400000).toISOString().split('T')[0], purpose: d.followUpPurpose });
    onRecordingComplete({ id: Date.now(), mrId, entityType, entityName, transcript, language: selectedLang, isLead: d.isLead, leadConfidence: d.leadConfidence, leadReasoning: d.leadReasoning, isSale: d.isSale, saleAmount: d.saleAmount, saleDetails: d.saleDetails, shouldScheduleFollowUp: d.shouldScheduleFollowUp, followUpPurpose: d.followUpPurpose, shouldRequestApproval: d.shouldRequestApproval, status: 'pending_review', timestamp: new Date().toISOString() });
  }, [transcript, entityName, mrId, entityType, selectedLang, onRecordingComplete, onLeadDetected, onSaleDetected, onFollowUpScheduled]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t: any) => t.stop());
    recogRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    process();
  }, [process]);

  const togglePause = () => {
    if (isPaused) {
      recorderRef.current?.resume();
      recogRef.current?.start();
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      recorderRef.current?.pause();
      recogRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  const [selectedLang, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [saving, setSaving] = useState(false);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const sendApproval = async () => {
    if (!detection) return;
    setSaving(true);
    try {
      await fetch('/api/approval-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mr_id: mrId, mr_name: `MR ${mrId}`, type: detection.shouldRequestApproval ? 'sale' : 'reschedule', description: `Action for ${entityType}: ${entityName}`, details: { transcript, detection: { isLead: detection.isLead, isSale: detection.isSale, saleAmount: detection.saleAmount } }, status: 'pending', created_at: new Date().toISOString() }) });
      setApprovalSent(true);
    } catch { /* fail silently */ }
    setSaving(false);
  };

  const handleSave = () => { setSaved(true); };

  if (!isRecording && !detection && manualMode) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p className="text-sm text-amber-700 font-medium">Voice unavailable. Type visit notes:</p>
        <textarea className="w-full p-3 border border-amber-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" rows={4} placeholder="Type visit notes..." value={transcript} onChange={e => setTranscript(e.target.value)} />
        <button onClick={() => { const d = analyzeText(transcript); setDetection(d); }} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Analyze Notes</button>
      </div>
    );
  }

  if (!isRecording && detection) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" />Visit Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("p-3 rounded-lg border", detection.isLead ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100")}>
              <div className="flex items-center gap-2 mb-1">{detection.isLead ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}<span className={cn("text-xs font-bold", detection.isLead ? "text-green-700" : "text-gray-500")}>{detection.isLead ? 'Lead' : 'No Lead'}</span></div>
              {detection.isLead && <p className="text-xs text-green-600">{detection.leadConfidence}% — {detection.leadReasoning}</p>}
            </div>
            <div className={cn("p-3 rounded-lg border", detection.isSale ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100")}>
              <div className="flex items-center gap-2 mb-1">{detection.isSale ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-gray-400" />}<span className={cn("text-xs font-bold", detection.isSale ? "text-emerald-700" : "text-gray-500")}>{detection.isSale ? 'Sale' : 'No Sale'}</span></div>
              {detection.isSale && <p className="text-xs text-emerald-600">&#8377;{detection.saleAmount.toLocaleString()} — {detection.saleDetails}</p>}
            </div>
          </div>
          {detection.shouldScheduleFollowUp && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-600" /><span className="text-xs font-bold text-blue-700">Follow-up Needed</span></div><p className="text-xs text-blue-600">{detection.followUpPurpose}</p></div>}
          {detection.shouldRequestApproval && !approvalSent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-xs font-bold text-amber-700">Approval Required</span></div>
              <button onClick={sendApproval} disabled={saving} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 disabled:opacity-50">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}<span>Request Approval</span></button>
            </div>
          )}
          {approvalSent && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approval request sent</p>}
        </div>
        {transcript && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Transcript ({LANGUAGES.find(l => l.code === selectedLang)?.label})</p><p className="text-sm text-gray-800">{transcript}</p></div>}
        {!saved && <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><CheckCircle2 className="w-4 h-4" />Save Recording</button>}
        {saved && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Saved</p>}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {!isRecording && <div className="flex items-center gap-2"><Languages className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-600">Language:</span><div className="flex gap-1">{LANGUAGES.map(l => <button key={l.code} onClick={() => setLanguage(l.code)} className={cn("px-3 py-1 rounded-full text-xs font-bold", l.code === selectedLang ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>{l.short}</button>)}</div></div>}
      {isRecording && interimText && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-xs text-blue-400 font-bold mb-1">Listening ({LANGUAGES.find(l => l.code === selectedLang)?.short})...</p><p className="text-sm text-blue-800 italic">{interimText}</p></div>}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button onClick={start} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/20"><Mic className="w-5 h-5" /><span>Start Recording</span></button>
        ) : (
          <><div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><span className="text-red-600 font-bold">{fmt(recordingTime)}</span></div><button onClick={togglePause} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">{isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button><button onClick={stop} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900"><Square className="w-4 h-4" /><span>Stop & Analyze</span></button></>
        )}
      </div>
      {manualMode && isRecording && <textarea className="w-full p-3 border border-gray-200 rounded-lg text-sm" rows={3} placeholder="Type notes while recording..." value={transcript} onChange={e => setTranscript(e.target.value)} />}
    </div>
  );
}
