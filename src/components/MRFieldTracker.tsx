import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';
import VoiceRecorder, { VisitRecordingData } from './VoiceRecorder';
import { cn } from '../lib/utils';
import {
  MapPin, Camera, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, X, FileText, Calendar, Navigation, Mic
} from 'lucide-react';

const STEPS = ['gps', 'photo', 'record', 'outcome', 'checkout'] as const;
type Step = typeof STEPS[number];

export default function MRFieldTracker() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [mrs, setMrs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(user?.mr_id || null);
  const [currentStep, setCurrentStep] = useState<Step>('gps');
  const [gpsCheckin, setGpsCheckin] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsCheckout, setGpsCheckout] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [recordingData, setRecordingData] = useState<VisitRecordingData | null>(null);
  const [outcomeData, setOutcomeData] = useState<{
    productsDetailed: string;
    samplesGiven: string;
    doctorFeedback: string;
    orderPlaced: number;
    followUpDate: string;
    keyDiscussion: string;
  }>({ productsDetailed: '', samplesGiven: '', doctorFeedback: '', orderPlaced: 0, followUpDate: '', keyDiscussion: '' });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pastHistory, setPastHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [visitStartTime, setVisitStartTime] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const mrProfile = mrs.find(m => m.id === user?.mr_id || m.id === user?.id) || mrs[0];
  const mrId = selectedMrId ?? user?.mr_id ?? (mrs[0]?.id ?? 0);

  useEffect(() => {
    Promise.all([
      api.mrs.getAll(),
      api.visits.getSchedules(),
    ]).then(([m, s]) => {
      setMrs(m);
      setSchedules(s);
      if (!selectedMrId && user?.role === 'admin' && m.length > 0) {
        setSelectedMrId(m[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mrId) return;
    Promise.all([
      api.visitRecords.getAll(mrId),
      api.dailySummaries.get(mrId),
    ]).then(([recs, sum]) => {
      const daySched = schedules.filter((v: any) => {
        const hasRecord = recs.some((r: any) => r.scheduled_visit_id === v.id || r.entity_name === v.doctor_name);
        return v.mr_id === mrId && !hasRecord && v.status !== 'completed';
      });
      setTodayVisits(daySched);
      setSummary(sum);

      // Auto-resume if there's an in-progress visit
      const inProgress = daySched.find((v: any) => v.status === 'in_progress');
      if (inProgress && !activeVisit) {
        setActiveVisit({
          id: inProgress.id,
          entityName: inProgress.doctor_name,
          entityType: inProgress.entity_type || 'doctor',
          clinic: inProgress.clinic,
          scheduled_time: inProgress.scheduled_time
        });
        setCurrentStep('gps');
      }
    }).catch(() => {});
  }, [mrId, schedules, activeVisit]);

  // Load history when active visit starts
  useEffect(() => {
    if (activeVisit) {
      setVisitStartTime(Date.now());
      setFetchingHistory(true);
      const entityName = activeVisit.entityName || activeVisit.doctor_name;
      api.visitRecords.getAll(undefined, entityName)
        .then(records => {
          // Sort by date/id descending and take top 3
          const sorted = records.sort((a: any, b: any) => 
            new Date(b.created_at || b.visit_date).getTime() - new Date(a.created_at || a.visit_date).getTime()
          ).slice(0, 3);
          setPastHistory(sorted);
        })
        .finally(() => setFetchingHistory(false))
        .catch(() => {});
    } else {
      setPastHistory([]);
    }
  }, [activeVisit]);


  const captureGps = useCallback((onSuccess: (loc: { lat: number; lng: number; accuracy?: number }) => void) => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        onSuccess(loc);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message || 'Failed to get location');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetVisitState = () => {
    setCurrentStep('gps');
    setGpsCheckin(null);
    setGpsCheckout(null);
    setPhotoDataUrl(null);
    setRecordingData(null);
    setOutcomeData({ productsDetailed: '', samplesGiven: '', doctorFeedback: '', orderPlaced: 0, followUpDate: '', keyDiscussion: '' });
    setGpsError(null);
    setActiveVisit(null);
  };

  const handleSubmitVisit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        scheduled_visit_id: activeVisit.id || null,
        mr_id: mrId,
        mr_name: user?.name,
        entity_name: activeVisit.entityName || activeVisit.doctor_name || activeVisit.pharmacy_name || activeVisit.hospital_name || 'Unknown Entity',
        entity_type: activeVisit.entityType || (activeVisit.doctor_name ? 'doctor' : activeVisit.pharmacy_name ? 'pharmacy' : activeVisit.hospital_name ? 'hospital' : 'doctor'),
        clinic: activeVisit.clinic || activeVisit.pharmacy_name || activeVisit.hospital_name,
        check_in_lat: gpsCheckin?.lat,
        check_in_lng: gpsCheckin?.lng,
        check_in_time: gpsCheckin ? new Date().toISOString() : null, // Record precise check-in
        arrival_time: new Date().toISOString(), // Structured for Admin
        check_out_lat: gpsCheckout?.lat,
        check_out_lng: gpsCheckout?.lng,
        check_out_time: new Date().toISOString(),
        duration_minutes: visitStartTime ? Math.round((new Date().getTime() - visitStartTime) / 60000) : 0,
        photo_data_url: photoDataUrl,
        recording_id: recordingData?.id,
        transcript: recordingData?.transcript,
        speaking_time_seconds: recordingData ? 30 : 0, // Mock duration or from recorder
        products_detailed: outcomeData.productsDetailed,
        samples_given: outcomeData.samplesGiven,
        key_discussion: outcomeData.keyDiscussion,
        doctor_feedback: outcomeData.doctorFeedback,
        order_placed: outcomeData.orderPlaced,
        follow_up_date: outcomeData.followUpDate || null,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      await api.visitRecords.create(payload);
      addNotification({
        title: 'Visit Completed',
        message: `Visit to ${activeVisit?.entityName || activeVisit?.doctor_name} recorded successfully.`,
        type: 'success',
        link: '/field-tracker'
      });
      setTodayVisits(prev => prev.filter((v: any) => v.id !== activeVisit?.id));
      resetVisitState();
    } catch (error) {
      console.error('Visit submission error:', error);
      addNotification({ 
        title: 'Visit Submission Failed', 
        message: 'Could not save the visit record. Please try again or contact support.', 
        type: 'error',
        link: '/field-tracker'
      });
    }
    setSubmitting(false);
  };

  const stepIndex = STEPS.indexOf(currentStep);
  const canProceedNext =
    (currentStep === 'gps' && !!gpsCheckin) ||
    currentStep === 'photo' ||
    currentStep === 'record' ||
    (currentStep === 'outcome' &&
      (outcomeData.productsDetailed.trim().length > 0 || outcomeData.keyDiscussion.trim().length > 0 || outcomeData.doctorFeedback.trim().length > 0)) ||
    (currentStep === 'checkout' && !!gpsCheckout);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8 px-4 md:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 md:p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">{mrProfile?.name?.split(' ').map((n: string) => n[0]).join('')}</div>
          <div>
            <h2 className="text-lg font-bold">{mrProfile?.name}</h2>
            <p className="text-blue-200 text-xs">{mrProfile?.territory}</p>
          </div>
        </div>
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Completed</p><p className="text-lg md:text-xl font-bold">{summary.completed_visits || 0}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Pending</p><p className="text-lg md:text-xl font-bold">{summary.scheduled_visits - summary.completed_visits || todayVisits.length}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Missed</p><p className="text-lg md:text-xl font-bold text-red-300">{summary.missed_visits || 0}</p></div>
            <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-blue-200 font-bold uppercase">Compliance</p><p className="text-lg md:text-xl font-bold">{summary.schedule_compliance}%</p></div>
          </div>
        )}
      </div>

      {/* Today's Pending Visits */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" />Today's Schedule ({todayVisits.length})</h3>
        {todayVisits.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 text-center text-gray-400 text-sm">No pending visits left for today.</div>
        ) : todayVisits.filter(v => v.status !== 'in_progress').length > 0 ? (
          <div className="space-y-3">
            {todayVisits.filter(v => v.status !== 'in_progress').map((v) => (
              <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{v.scheduled_time}</div>
                  <div>
                    <p className="font-medium text-gray-900">{v.doctor_name}{v.purpose && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-1 font-bold">{v.purpose}</span>}</p>
                    <p className="text-xs text-gray-500">{v.clinic} <span className="text-blue-500">#{v.priority}</span></p>
                  </div>
                </div>
                {!activeVisit && (
                  <button onClick={() => { setActiveVisit(v); }}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">
                    Start Visit
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {!activeVisit && todayVisits.length === 0 && (
        <button onClick={() => setActiveVisit({ id: 0, entityName: 'Quick Visit', entityType: 'doctor', clinic: '', scheduled_time: 'Now' })}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
          Start New Visit
        </button>
      )}

      {/* Active Visit Flow */}
      {activeVisit && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeVisit.entityName || activeVisit.doctor_name}</h2>
              <p className="text-sm text-gray-500">{activeVisit.clinic}</p>
            </div>
            <button onClick={resetVisitState} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Past History Context Section - EXPERT FEATURE */}
          {pastHistory.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Past Interaction Context
              </h4>
              <div className="space-y-3">
                {pastHistory.map((h, idx) => (
                  <div key={idx} className="bg-white/60 p-2.5 rounded-lg border border-blue-50 text-[13px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-700">{new Date(h.created_at || h.visit_date).toLocaleDateString()}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">SALE: ₹{h.order_placed || h.order_value || 0}</span>
                    </div>
                    <p className="text-gray-600 italic line-clamp-2">"{(h.doctor_feedback || h.notes || 'No notes saved').substring(0, 100)}..."</p>
                    {h.products_detailed && <p className="text-[11px] text-blue-600 mt-1 font-medium">Detailed: {h.products_detailed}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-between px-2">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => {
                    // Allow going back to any previous step or current step
                    if (i <= stepIndex) setCurrentStep(step);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < stepIndex ? "bg-green-500 text-white" :
                    currentStep === step ? "bg-blue-600 text-white ring-2 ring-blue-300" :
                    "bg-gray-200 text-gray-500"
                  )}
                >
                  {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-1", i < stepIndex ? "bg-green-500" : "bg-gray-200")} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step labels */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-gray-400 text-center flex-1">Check-in</span>
            <span className="text-[10px] text-gray-400 text-center flex-1">Photo</span>
            <span className="text-[10px] text-gray-400 text-center flex-1">Record</span>
            <span className="text-[10px] text-gray-400 text-center flex-1">Outcome</span>
            <span className="text-[10px] text-gray-400 text-center flex-1">Checkout</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-bold text-gray-900">{activeVisit?.entityName || activeVisit?.doctor_name || 'Unscheduled Visit'}</span>
            <button onClick={resetVisitState}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
          </div>

          {/* Step: GPS Check-in */}
          {currentStep === 'gps' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><MapPin className="w-4 h-4 text-blue-600" />GPS Check-in</div>
              <p className="text-xs text-gray-500">Capture your location to start the visit.</p>
              {gpsLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Getting your location...</div>
              )}
              {gpsError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />{gpsError}
                </div>
              )}
              {gpsCheckin && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold">Location captured</span></div>
                  <p className="text-xs text-green-600 font-mono">{gpsCheckin.lat.toFixed(6)}, {gpsCheckin.lng.toFixed(6)}{gpsCheckin.accuracy ? ` (±${Math.round(gpsCheckin.accuracy)}m)` : ''}</p>
                  <button onClick={() => setGpsCheckin(null)} className="text-xs text-green-500 underline">Retake</button>
                </div>
              )}
              {!gpsCheckin && !gpsLoading && (
                <button onClick={() => captureGps(setGpsCheckin)} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700">
                  Capture My Location
                </button>
              )}
            </div>
          )}

          {/* Step: Photo */}
          {currentStep === 'photo' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><Camera className="w-4 h-4 text-blue-600" />Clinic Photo</div>
              <p className="text-xs text-gray-500">Take or upload a photo of the clinic/reception.</p>
              <input type="file" ref={photoInputRef} accept="image/*;capture=environment" onChange={handlePhotoCapture} className="hidden" />
              {photoDataUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={photoDataUrl} alt="Clinic" className="w-full h-48 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => { setPhotoDataUrl(null); photoInputRef.current?.click(); }} className="bg-black/60 text-white px-2 py-1 rounded text-xs">Retake</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /><span className="text-xs">Photo captured</span></div>
                </div>
              ) : (
                <button onClick={() => photoInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Tap to take a photo</p>
                  <p className="text-xs text-gray-400 mt-1">or choose from gallery</p>
                </button>
              )}
            </div>
          )}

          {/* Step: Voice Recording */}
          {currentStep === 'record' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><Mic className="w-4 h-4 text-blue-600" />Voice Recording</div>
              <p className="text-xs text-gray-500">Record your conversation with the doctor. Speak about products, samples, and feedback.</p>
              {recordingData ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold">Recording saved</span></div>
                  {recordingData.transcript && (
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-500 font-bold mb-1">Transcript</p>
                      <p className="text-xs text-gray-700">{recordingData.transcript}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className={cn("px-2 py-1 rounded text-xs font-bold", recordingData.isLead ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500")}>
                      {recordingData.isLead ? `Lead (${recordingData.leadConfidence}%)` : 'No Lead'}
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs font-bold", recordingData.isSale ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500")}>
                      {recordingData.isSale ? `Sale: ₹${recordingData.saleAmount}` : 'No Sale'}
                    </div>
                  </div>
                  <button onClick={() => setRecordingData(null)} className="text-xs text-green-500 underline">Re-record</button>
                </div>
              ) : (
                <VoiceRecorder
                  mrId={mrId}
                  mrName={mrProfile?.name}
                  entityType={activeVisit?.entityType || 'doctor'}
                  entityName={activeVisit?.entityName || activeVisit?.name || activeVisit?.doctor_name || 'Unknown'}
                  onRecordingComplete={(data) => {
                    setRecordingData(data);
                    if (data.shouldScheduleFollowUp && data.followUpPurpose) {
                      setOutcomeData(prev => ({ ...prev, followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] }));
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Step: Outcome Form */}
          {currentStep === 'outcome' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><FileText className="w-4 h-4 text-blue-600" />Visit Outcome</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Key Discussion Points</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={3}
                    placeholder="What topics were discussed..."
                    value={outcomeData.keyDiscussion}
                    onChange={e => setOutcomeData(p => ({ ...p, keyDiscussion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Products Detailed</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={2}
                    value={outcomeData.productsDetailed}
                    onChange={e => setOutcomeData(p => ({ ...p, productsDetailed: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Samples Given</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={2}
                    placeholder="e.g., 2 strips of Product A, 5 sachets of Product B"
                    value={outcomeData.samplesGiven}
                    onChange={e => setOutcomeData(p => ({ ...p, samplesGiven: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Doctor's Feedback</label>
                  <textarea
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={3}
                    placeholder="Doctor's response, interest level, concerns..."
                    value={outcomeData.doctorFeedback}
                    onChange={e => setOutcomeData(p => ({ ...p, doctorFeedback: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Order Placed (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={outcomeData.orderPlaced}
                      onChange={e => setOutcomeData(p => ({ ...p, orderPlaced: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={outcomeData.followUpDate}
                      onChange={e => setOutcomeData(p => ({ ...p, followUpDate: e.target.value }))}
                    />
                  </div>
                </div>
                {recordingData?.transcript && (
                  <details className="bg-gray-50 rounded-lg p-3">
                    <summary className="text-xs font-bold text-gray-500 cursor-pointer">View transcript (optional)</summary>
                    <p className="text-xs text-gray-700 mt-2">{recordingData.transcript}</p>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Step: GPS Checkout */}
          {currentStep === 'checkout' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><Navigation className="w-4 h-4 text-blue-600" />GPS Checkout</div>
              <p className="text-xs text-gray-500">Capture your location to complete the visit record.</p>
              {submitting && (
                <div className="flex items-center justify-center gap-2 py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span className="text-sm text-gray-500">Submitting visit...</span></div>
              )}
              {gpsCheckout && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold">Checkout location captured</span></div>
                  <p className="text-xs text-green-600 font-mono">{gpsCheckout.lat.toFixed(6)}, {gpsCheckout.lng.toFixed(6)}</p>
                </div>
              )}
              {!gpsCheckout && !submitting && (
                <button onClick={() => captureGps(setGpsCheckout)} disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                  Capture Checkout Location
                </button>
              )}
              {gpsCheckout && !submitting && (
                <button onClick={handleSubmitVisit} className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />Complete & Submit Visit
                </button>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {!submitting && currentStep !== 'checkout' && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {stepIndex > 0 && (
                <button onClick={() => setCurrentStep(STEPS[stepIndex - 1])}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-1">
                  Previous
                </button>
              )}
              <button
                onClick={() => setCurrentStep(STEPS[stepIndex + 1])}
                disabled={!canProceedNext}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
                {currentStep === 'record' && !recordingData ? 'Skip Recording' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
