import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Download, BarChart3, FileText, Zap,
  Users, Package, Stethoscope, TrendingUp,
  Loader2, CheckCircle, AlertCircle, ExternalLink,
  Search, Database, ShieldCheck, ArrowRight,
  FileDown, Calendar, ClipboardList, Brain, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { classifyMixedData, getClassificationSummary } from '../lib/dataClassifier';

interface DataStats {
  totalDoctors: number;
  totalPharmacies: number;
  totalHospitals: number;
  lastUpdated: string;
}

interface DataQuality {
  doctors: { completeness: number; duplicates: number; total: number };
  pharmacies: { completeness: number; duplicates: number; total: number };
  hospitals: { completeness: number; duplicates: number; total: number };
  overallScore: number;
  totalDuplicates: number;
  suggestions: string[];
}

/**
 * Smart sheet parser: detects the actual header row by finding the first row
 * with 3+ non-empty text cells, then maps subsequent rows using those headers.
 * Handles Excel files with merged title rows at the top (e.g. min_row=3 or 4 in Python).
 */
function parseSheetSmart(worksheet: any): any[] {
  const rawArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  if (!rawArray || rawArray.length === 0) return [];

  // Find the first row with at least 3 non-empty string/text cells — that's the real header row
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(6, rawArray.length); i++) {
    const row = rawArray[i];
    if (!row) continue;
    const textCells = row.filter(
      (cell: any) => cell !== null && cell !== undefined && typeof cell === 'string' && cell.trim().length > 1
    ).length;
    if (textCells >= 3) {
      headerRowIdx = i;
      break;
    }
  }

  const headers: string[] = (rawArray[headerRowIdx] || []).map(
    (h: any) => (h !== null && h !== undefined ? String(h).trim() : '')
  );

  const result: any[] = [];
  for (let i = headerRowIdx + 1; i < rawArray.length; i++) {
    const row = rawArray[i];
    if (!row) continue;
    // Skip completely empty rows
    if (row.every((cell: any) => cell === null || cell === undefined || String(cell).trim() === '')) continue;
    const obj: any = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
    });
    result.push(obj);
  }
  return result;
}

export default function DataManagement() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'download' | 'analytics' | 'quality' | 'powerbi' | 'pending'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classificationPreview, setClassificationPreview] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadType, setDownloadType] = useState<'all' | 'doctors' | 'pharmacies' | 'hospitals' | 'mrs'>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewTab, setPreviewTab] = useState<'doctors' | 'pharmacies' | 'hospitals' | 'mrs' | 'unclassified'>('doctors');
  
  // NEW: Pending entities state
  const [pendingEntities, setPendingEntities] = useState<any[]>([]);
  const [pendingStats, setPendingStats] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [mrs, setMrs] = useState<any[]>([]);

  React.useEffect(() => {
    fetchDataStats();
    fetchDataQuality();
    fetchPendingEntities();
    fetchMRs();
  }, []);
  
  const fetchPendingEntities = async () => {
    try {
      const [entitiesRes, statsRes] = await Promise.all([
        fetch('/api/pending-entities'),
        fetch('/api/pending-entities/stats')
      ]);
      
      if (entitiesRes.ok) {
        const entities = await entitiesRes.json();
        setPendingEntities(entities);
      }
      
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setPendingStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch pending entities:', error);
    }
  };
  
  const fetchMRs = async () => {
    try {
      const response = await fetch('/api/mrs');
      if (response.ok) {
        const data = await response.json();
        setMrs(data);
      }
    } catch (error) {
      console.error('Failed to fetch MRs:', error);
    }
  };
  
  const handleAIAssign = async (optimization = 'balanced') => {
    setIsAssigning(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/pending-entities/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimization })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: 'success',
          text: `AI assigned ${result.assignments?.length || 0} entities to ${new Set(result.assignments?.map((a: any) => a.assigned_mr_id)).size} MRs`
        });
        fetchPendingEntities();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `Assignment failed: ${error.message}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Assignment error: ${error.message}` });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleManualAssign = async (entityId: number, mrId: number) => {
    setIsAssigning(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/pending-entities/${entityId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mr_id: mrId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: 'success',
          text: `Entity assigned to ${result.entity?.assigned_mr_id ? 'MR' : 'MR'} successfully`
        });
        setShowAssignModal(false);
        setSelectedEntity(null);
        fetchPendingEntities();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: `Assignment failed: ${error.message}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Assignment error: ${error.message}` });
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchDataStats = async () => {
    try {
      const response = await fetch('/api/data-stats');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      if (!text) throw new Error('Empty response');
      setDataStats(JSON.parse(text));
    } catch (error) {
      console.error('Failed to fetch data stats:', error);
    }
  };

  const fetchDataQuality = async () => {
    try {
      const response = await fetch('/api/data-quality');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      if (!text) throw new Error('Empty response');
      setDataQuality(JSON.parse(text));
    } catch (error) {
      console.error('Failed to fetch data quality:', error);
    }
  };

  const handleFileUpload = async (file?: File) => {
    const targetFile = file || fileInputRef.current?.files?.[0];
    if (!targetFile) return;

    setSelectedFile(targetFile);
    setIsClassifying(true);
    setMessage(null);
    setClassificationPreview(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });

          let allRows: any[] = [];
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Use smart header detection to handle multi-row title Excel files
            const sheetRows = parseSheetSmart(worksheet);
            allRows = allRows.concat(sheetRows);
          });

          const { result: classifiedData, stats } = classifyMixedData(allRows);

          // Auto-select the first non-empty tab
          const firstTab = classifiedData.doctors.length > 0 ? 'doctors' :
            classifiedData.pharmacies.length > 0 ? 'pharmacies' :
            classifiedData.hospitals.length > 0 ? 'hospitals' :
            classifiedData.mrs.length > 0 ? 'mrs' : 'unclassified';
          setPreviewTab(firstTab as any);

          setClassificationPreview({
            stats,
            data: classifiedData,
            summary: getClassificationSummary(stats)
          });

          setMessage({
            type: 'success',
            text: `Classification Complete! ${stats.doctors} Doctors, ${stats.rmp} RMPs, ${stats.pharmacies} Pharmacies, ${stats.medicalHalls} Medical Halls, ${stats.hospitals} Hospitals, ${stats.mrs} MRs detected. Review and confirm to upload.`
          });
        } catch (error: any) {
          setMessage({ type: 'error', text: `Classification failed: ${error.message}` });
        } finally {
          setIsClassifying(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(targetFile);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setIsClassifying(false);
    }
  };

  const confirmAndUpload = async () => {
    if (!classificationPreview) return;
    setIsLoading(true);
    setMessage(null);

    try {
      // Send with autoAssign flag to also add directly to healthcare directory
      const uploadPayload = {
        ...classificationPreview.data,
        autoAssign: true  // This ensures data goes to both pending queue AND active directory
      };
      
      const response = await fetch('/api/upload-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadPayload),
      });

      if (response.ok) {
        let result = { totalAdded: 0, pendingCount: 0 };
        const text = await response.text();
        if (text) {
          try { result = JSON.parse(text); } catch { /* skip */ }
        }
        setMessage({
          type: 'success',
          text: `Data uploaded successfully! Added ${result.totalAdded} records to healthcare directory. ${result.pendingCount || 0} entities also queued for AI assignment.`
        });
        setClassificationPreview(null);
        setSelectedFile(null);
        fetchDataStats();
        fetchDataQuality();
        fetchPendingEntities();
        window.dispatchEvent(new CustomEvent('healthcare-data-updated', { detail: result }));
      } else {
        const text = await response.text();
        try {
          const error = JSON.parse(text);
          setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
        } catch {
          setMessage({ type: 'error', text: `Upload failed with status ${response.status}` });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Upload error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/download-data');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      if (!text) throw new Error('Empty response');
      const data = JSON.parse(text);

      const workbook = XLSX.utils.book_new();
      const sheets: { key: string; name: string }[] = [
        { key: 'doctors', name: 'Doctors' },
        { key: 'pharmacies', name: 'Pharmacies' },
        { key: 'hospitals', name: 'Hospitals' },
        { key: 'mrs', name: 'MRs' },
      ];

      if (downloadType === 'all') {
        sheets.forEach(({ key, name }) => {
          if (data[key]?.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data[key]);
            XLSX.utils.book_append_sheet(workbook, ws, name);
          }
        });
      } else {
        const key = downloadType === 'mrs' ? 'mrs' : downloadType;
        if (data[key]?.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data[key]);
          XLSX.utils.book_append_sheet(workbook, ws, sheets.find(s => s.key === key)?.name || 'Data');
        }
      }

      const fileName = `Healthcare_Data_${downloadType === 'all' ? 'Complete' : downloadType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      setMessage({ type: 'success', text: `Downloaded ${fileName}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileUpload(file);
    } else {
      setMessage({ type: 'error', text: 'Please upload an Excel file (.xlsx or .xls)' });
    }
  }, []);

  const quickActions = [
    { icon: Stethoscope, label: 'Healthcare Directory', path: '/directory', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Package, label: 'Product Portfolio', path: '/products', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'MR Management', path: '/mrs', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, label: 'Reports & Analytics', path: '/performance', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 ml-64">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Data Management</h1>
          </div>
          <p className="text-slate-600">Upload, download, analyze and manage healthcare provider data</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Access</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, path, color, bg }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`${bg} p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 text-left group`}
              >
                <Icon size={20} className={color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 truncate">{label}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    View <ExternalLink size={10} />
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Stats */}
        {dataStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Doctors</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{dataStats.totalDoctors}</p>
              <button onClick={() => navigate('/directory')} className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1">View <ExternalLink size={10} /></button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Pharmacies</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{dataStats.totalPharmacies}</p>
              <button onClick={() => navigate('/directory')} className="text-xs text-green-600 hover:underline mt-1 flex items-center gap-1">View <ExternalLink size={10} /></button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Hospitals</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{dataStats.totalHospitals}</p>
              <button onClick={() => navigate('/directory')} className="text-xs text-purple-600 hover:underline mt-1 flex items-center gap-1">View <ExternalLink size={10} /></button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Last Updated</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{dataStats.lastUpdated}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-0 bg-white rounded-t-xl border border-b-0 border-slate-200 p-1">
          {[
            { key: 'upload' as const, icon: Upload, label: 'Upload' },
            { key: 'download' as const, icon: Download, label: 'Download' },
            { key: 'pending' as const, icon: ClipboardList, label: 'Pending', badge: pendingStats?.pending },
            { key: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
            { key: 'quality' as const, icon: ShieldCheck, label: 'Data Quality' },
            { key: 'powerbi' as const, icon: FileText, label: 'Power BI' },
          ].map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors relative ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6">

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Healthcare Data</h2>
                <p className="text-slate-500 text-sm">Upload mixed Excel files — AI will auto-classify entities</p>
              </div>

              {!classificationPreview ? (
                <>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload size={48} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-lg font-semibold text-slate-700 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-slate-500 mb-3">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                    {!selectedFile && (
                      <p className="text-slate-500 text-sm">Excel files (.xlsx, .xls) with mixed healthcare provider data</p>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={() => handleFileUpload()}
                      className="hidden"
                      disabled={isClassifying || isLoading}
                    />
                  </div>

                  {isClassifying && (
                    <div className="flex items-center justify-center p-6 bg-blue-50 rounded-xl mt-4">
                      <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />
                      <span className="text-slate-700 font-medium">Analyzing and classifying your data...</span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  {/* Classification Complete Banner */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <h3 className="font-bold text-slate-900 text-lg">Classification Complete — {classificationPreview.stats.totalRows} rows processed</h3>
                    </div>
                    {/* Summary chips */}
                    <div className="flex flex-wrap gap-2">
                      {classificationPreview.stats.doctors > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          <Stethoscope size={12} /> {classificationPreview.stats.doctors} Doctors
                        </span>
                      )}
                      {classificationPreview.stats.rmp > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                          <UserCheck size={12} /> {classificationPreview.stats.rmp} RMPs
                        </span>
                      )}
                      {classificationPreview.stats.pharmacies > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          <Package size={12} /> {classificationPreview.stats.pharmacies} Pharmacies
                        </span>
                      )}
                      {classificationPreview.stats.medicalHalls > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                          <Package size={12} /> {classificationPreview.stats.medicalHalls} Medical Halls
                        </span>
                      )}
                      {classificationPreview.stats.hospitals > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          <Users size={12} /> {classificationPreview.stats.hospitals} Hospitals
                        </span>
                      )}
                      {classificationPreview.stats.mrs > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold">
                          <Users size={12} /> {classificationPreview.stats.mrs} MRs
                        </span>
                      )}
                      {classificationPreview.stats.unclassified > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          <AlertCircle size={12} /> {classificationPreview.stats.unclassified} Unclassified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabbed Data Preview */}
                  <div className="mb-5">
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 flex-wrap">
                      {[
                        { key: 'doctors' as const, label: `Doctors (${(classificationPreview.data.doctors?.length || 0) + (classificationPreview.stats.rmp || 0)})`, color: 'blue', show: (classificationPreview.data.doctors?.length || 0) > 0 },
                        { key: 'pharmacies' as const, label: `Pharmacies (${classificationPreview.data.pharmacies?.length || 0})`, color: 'purple', show: (classificationPreview.data.pharmacies?.length || 0) > 0 },
                        { key: 'hospitals' as const, label: `Hospitals (${classificationPreview.data.hospitals?.length || 0})`, color: 'red', show: (classificationPreview.data.hospitals?.length || 0) > 0 },
                        { key: 'mrs' as const, label: `MRs (${classificationPreview.data.mrs?.length || 0})`, color: 'cyan', show: (classificationPreview.data.mrs?.length || 0) > 0 },
                        { key: 'unclassified' as const, label: `Unclassified (${classificationPreview.data.unclassified?.length || 0})`, color: 'gray', show: (classificationPreview.data.unclassified?.length || 0) > 0 },
                      ].filter(t => t.show).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setPreviewTab(key)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            previewTab === key
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Doctors Table */}
                    {previewTab === 'doctors' && classificationPreview.data.doctors?.length > 0 && (
                      <div className="overflow-auto max-h-72 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-blue-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">#</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Specialty</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Clinic</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Territory</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Tier</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Contact</th>
                              <th className="text-left py-2 px-3 font-semibold text-blue-700">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classificationPreview.data.doctors.map((d: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{d.name || '—'}</td>
                                <td className="py-2 px-3 text-slate-600">{d.specialty || '—'}</td>
                                <td className="py-2 px-3 text-slate-600">{d.clinic || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{d.territory || '—'}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                    d.tier === 'A' ? 'bg-green-100 text-green-700' :
                                    d.tier === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{d.tier || 'B'}</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{d.contact || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    d.isRMP ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                  }`}>{d.isRMP ? 'RMP' : 'Doctor'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pharmacies Table */}
                    {previewTab === 'pharmacies' && classificationPreview.data.pharmacies?.length > 0 && (
                      <div className="overflow-auto max-h-72 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-purple-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">#</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Owner</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Type</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Territory</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Tier</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Contact</th>
                              <th className="text-left py-2 px-3 font-semibold text-purple-700">Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classificationPreview.data.pharmacies.map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{p.name || '—'}</td>
                                <td className="py-2 px-3 text-slate-600">{p.owner || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{p.type || '—'}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{p.territory || '—'}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                    p.tier === 'A' ? 'bg-green-100 text-green-700' :
                                    p.tier === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{p.tier || 'B'}</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{p.contact || '—'}</td>
                                <td className="py-2 px-3 text-slate-500 max-w-32 truncate">{p.address || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Hospitals Table */}
                    {previewTab === 'hospitals' && classificationPreview.data.hospitals?.length > 0 && (
                      <div className="overflow-auto max-h-72 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-red-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">#</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Type</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Beds</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Territory</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Tier</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Contact</th>
                              <th className="text-left py-2 px-3 font-semibold text-red-700">Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classificationPreview.data.hospitals.map((h: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{h.name || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">{h.type || '—'}</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{h.beds || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{h.territory || '—'}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                    h.tier === 'A' ? 'bg-green-100 text-green-700' :
                                    h.tier === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>{h.tier || 'B'}</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{h.contact || '—'}</td>
                                <td className="py-2 px-3 text-slate-500 max-w-32 truncate">{h.address || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* MRs Table */}
                    {previewTab === 'mrs' && classificationPreview.data.mrs?.length > 0 && (
                      <div className="overflow-auto max-h-72 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-cyan-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">#</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Territory</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Contact</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Email</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Salary</th>
                              <th className="text-left py-2 px-3 font-semibold text-cyan-700">Performance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classificationPreview.data.mrs.map((m: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{m.name || '—'}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{m.territory || '—'}</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{m.contact || m.phone || '—'}</td>
                                <td className="py-2 px-3 text-slate-600">{m.email || '—'}</td>
                                <td className="py-2 px-3 text-slate-600">{m.base_salary ? `₹${m.base_salary.toLocaleString()}` : '—'}</td>
                                <td className="py-2 px-3">
                                  {m.performance_score ? (
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                      m.performance_score >= 80 ? 'bg-green-100 text-green-700' :
                                      m.performance_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{m.performance_score}%</span>
                                  ) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Unclassified Table */}
                    {previewTab === 'unclassified' && classificationPreview.data.unclassified?.length > 0 && (
                      <div className="overflow-auto max-h-72 rounded-xl border border-amber-200 bg-amber-50">
                        <div className="p-3 border-b border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                            <AlertCircle size={12} />
                            These rows could not be auto-classified. Check your Excel column headers.
                          </p>
                        </div>
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-amber-100">
                            {classificationPreview.data.unclassified.slice(0, 20).map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-amber-100/50">
                                <td className="py-2 px-3 text-amber-600 font-semibold w-8">{i + 1}</td>
                                <td className="py-2 px-3">
                                  <pre className="text-amber-700 whitespace-pre-wrap break-all font-mono text-xs">
                                    {JSON.stringify(row, null, 2).substring(0, 200)}
                                  </pre>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setClassificationPreview(null); setSelectedFile(null); }}
                      className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                    >
                      Upload Different File
                    </button>
                    <button
                      onClick={confirmAndUpload}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      {isLoading ? 'Uploading...' : `Confirm & Save to Healthcare Directory`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download Tab */}
          {activeTab === 'download' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Download Healthcare Data</h2>
                <p className="text-slate-500 text-sm">Export data as Excel — select entity type below</p>
              </div>

              <div className="flex gap-2 mb-4">
                {[
                  { key: 'all' as const, label: 'All Data', icon: Database },
                  { key: 'doctors' as const, label: 'Doctors', icon: Stethoscope },
                  { key: 'pharmacies' as const, label: 'Pharmacies', icon: Package },
                  { key: 'hospitals' as const, label: 'Hospitals', icon: Users },
                  { key: 'mrs' as const, label: 'MRs', icon: TrendingUp },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDownloadType(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      downloadType === key
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 text-center">
                <FileDown size={40} className="mx-auto text-blue-600 mb-3" />
                <p className="font-semibold text-slate-800 mb-1">Download {downloadType === 'all' ? 'Complete Dataset' : downloadType}</p>
                <p className="text-xs text-slate-500 mb-4">Includes all {downloadType === 'all' ? 'entity types' : downloadType} data as Excel workbook</p>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isLoading ? 'Generating...' : `Download ${downloadType}`}
                </button>
              </div>
            </div>
          )}

          {/* Pending Assignments Tab */}
          {activeTab === 'pending' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Pending Assignments</h2>
                  <p className="text-slate-500 text-sm">AI-powered assignment of uploaded entities to MRs</p>
                </div>
                <button
                  onClick={() => handleAIAssign('balanced')}
                  disabled={isAssigning || pendingEntities.filter(e => e.status === 'pending').length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isAssigning ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                  {isAssigning ? 'Assigning...' : 'Auto-Assign with AI'}
                </button>
              </div>

              {pendingStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-600 uppercase font-semibold">Pending</p>
                    <p className="text-2xl font-bold text-amber-700">{pendingStats.pending}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 uppercase font-semibold">Assigned</p>
                    <p className="text-2xl font-bold text-green-700">{pendingStats.assigned}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 uppercase font-semibold">Doctors</p>
                    <p className="text-2xl font-bold text-blue-700">{pendingStats.by_type?.doctors || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 uppercase font-semibold">Pharmacies</p>
                    <p className="text-2xl font-bold text-purple-700">{pendingStats.by_type?.pharmacies || 0}</p>
                  </div>
                </div>
              )}

              {pendingEntities.filter(e => e.status === 'pending').length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                  <ClipboardList size={48} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-lg font-semibold text-slate-700 mb-1">No Pending Entities</p>
                  <p className="text-slate-500 text-sm">Upload Excel files to add entities to the pending queue</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Entity</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Type</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Territory</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Tier</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Upload Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingEntities.filter(e => e.status === 'pending').map((entity) => (
                        <tr key={entity.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{entity.entity_data?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{entity.entity_data?.clinic || entity.entity_data?.specialty || ''}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                              {entity.entity_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{entity.territory || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entity.tier === 'A' ? 'bg-green-100 text-green-700' :
                              entity.tier === 'B' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {entity.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(entity.upload_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedEntity(entity); setShowAssignModal(true); }}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 inline-flex items-center gap-1"
                              >
                                <UserCheck size={14} />
                                Assign
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && dataStats && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Data Analytics</h2>
                <p className="text-slate-500 text-sm">Overview of your healthcare data distribution</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Entity Distribution</h3>
                  {[
                    { label: 'Doctors', count: dataStats.totalDoctors, color: 'bg-blue-500' },
                    { label: 'Pharmacies', count: dataStats.totalPharmacies, color: 'bg-green-500' },
                    { label: 'Hospitals', count: dataStats.totalHospitals, color: 'bg-purple-500' },
                  ].map(item => {
                    const total = dataStats.totalDoctors + dataStats.totalPharmacies + dataStats.totalHospitals;
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.label} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Quick Export</h3>
                  <p className="text-sm text-slate-600 mb-4">Export specific entity data for reporting</p>
                  <div className="space-y-2">
                    <button onClick={() => { setDownloadType('doctors'); setActiveTab('download'); }} className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                      <span className="text-sm font-medium text-slate-700">Export Doctors</span>
                      <ArrowRight size={16} className="text-slate-400" />
                    </button>
                    <button onClick={() => { setDownloadType('pharmacies'); setActiveTab('download'); }} className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                      <span className="text-sm font-medium text-slate-700">Export Pharmacies</span>
                      <ArrowRight size={16} className="text-slate-400" />
                    </button>
                    <button onClick={() => { setDownloadType('hospitals'); setActiveTab('download'); }} className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                      <span className="text-sm font-medium text-slate-700">Export Hospitals</span>
                      <ArrowRight size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Quality Tab */}
          {activeTab === 'quality' && dataQuality && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Data Quality</h2>
                <p className="text-slate-500 text-sm">Data completeness, duplicates, and improvement suggestions</p>
              </div>

              <div className="bg-green-50 rounded-xl p-5 border border-green-200 mb-6 text-center">
                <ShieldCheck size={32} className="mx-auto text-green-600 mb-2" />
                <p className="text-sm text-slate-500 uppercase font-semibold">Overall Data Quality Score</p>
                <p className="text-5xl font-bold text-green-700">{dataQuality.overallScore}%</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { entity: 'Doctors', data: dataQuality.doctors, color: 'blue' },
                  { entity: 'Pharmacies', data: dataQuality.pharmacies, color: 'green' },
                  { entity: 'Hospitals', data: dataQuality.hospitals, color: 'purple' },
                ].map(item => (
                  <div key={item.entity} className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">{item.entity}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Completeness</span>
                        <span className={`font-bold text-${item.color}-600`}>{item.data.completeness}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-${item.color}-500 rounded-full transition-all`} style={{ width: `${item.data.completeness}%` }} />
                      </div>
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-slate-500">Records</span>
                        <span className="font-medium">{item.data.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Duplicates</span>
                        <span className={`font-medium ${item.data.duplicates > 0 ? 'text-red-500' : 'text-green-500'}`}>{item.data.duplicates}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {dataQuality.suggestions.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Zap size={16} /> Improvement Suggestions
                  </h4>
                  <ul className="space-y-1.5">
                    {dataQuality.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Power BI Tab */}
          {activeTab === 'powerbi' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Power BI Analytics</h2>
                <p className="text-slate-500 text-sm">Configure and access Power BI dashboards</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <div className="bg-white p-5 rounded-xl border border-slate-200 mb-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Setup Instructions</h4>
                  <ol className="space-y-2 text-sm text-slate-700">
                    <li><span className="font-semibold">1.</span> Create your report in Power BI Service</li>
                    <li><span className="font-semibold">2.</span> Copy the embed URL from Power BI workspace</li>
                    <li><span className="font-semibold">3.</span> Paste the URL below to embed</li>
                  </ol>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">Power BI Embed URL</label>
                    <input
                      type="text"
                      placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
                      defaultValue={localStorage.getItem('powerbi_url') || ''}
                      onChange={(e) => localStorage.setItem('powerbi_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const url = localStorage.getItem('powerbi_url');
                      if (url) window.open(url, '_blank');
                      else alert('Please enter a Power BI URL first');
                    }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                  >
                    Open Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-slate-500 font-semibold">Doctor Visits</p>
                    <p className="text-lg font-bold text-blue-600">Forecasting</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                    <p className="text-xs text-slate-500 font-semibold">Pharmacy Sales</p>
                    <p className="text-lg font-bold text-green-600">Trends</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border-l-4 border-purple-500">
                    <p className="text-xs text-slate-500 font-semibold">MR Performance</p>
                    <p className="text-lg font-bold text-purple-600">Analytics</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Assignment Modal */}
        {showAssignModal && selectedEntity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Assign Entity to MR</h3>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-slate-800">{selectedEntity.entity_data?.name}</p>
                <p className="text-sm text-slate-600">{selectedEntity.entity_data?.clinic || selectedEntity.entity_data?.specialty}</p>
                <p className="text-xs text-slate-500 mt-2">Territory: {selectedEntity.territory} | Tier: {selectedEntity.tier}</p>
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Select MR</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const mrId = parseInt(e.target.value);
                  if (mrId) handleManualAssign(selectedEntity.id, mrId);
                }}
                defaultValue=""
              >
                <option value="" disabled>Choose an MR...</option>
                {mrs
                  .filter(mr => mr.territory && selectedEntity.territory && 
                    (mr.territory.toLowerCase().includes(selectedEntity.territory.toLowerCase()) ||
                     selectedEntity.territory.toLowerCase().includes(mr.territory.toLowerCase())))
                  .map(mr => (
                    <option key={mr.id} value={mr.id}>
                      {mr.name} - {mr.territory.split('(')[0].trim()} (Score: {mr.performance_score})
                    </option>
                  ))}
                {mrs.filter(mr => mr.territory && selectedEntity.territory && 
                    (mr.territory.toLowerCase().includes(selectedEntity.territory.toLowerCase()) ||
                     selectedEntity.territory.toLowerCase().includes(mr.territory.toLowerCase()))).length === 0 && (
                  <option disabled>No matching MRs in this territory</option>
                )}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
