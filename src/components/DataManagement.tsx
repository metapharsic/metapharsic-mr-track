import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Download, BarChart3, FileText, Zap,
  Users, Package, Stethoscope, TrendingUp,
  Loader2, CheckCircle, AlertCircle, ExternalLink,
  Search, Database, ShieldCheck, ArrowRight,
  FileDown, Calendar
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

export default function DataManagement() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'download' | 'analytics' | 'quality' | 'powerbi'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classificationPreview, setClassificationPreview] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadType, setDownloadType] = useState<'all' | 'doctors' | 'pharmacies' | 'hospitals' | 'mrs'>('all');
  const [isDragOver, setIsDragOver] = useState(false);

  React.useEffect(() => {
    fetchDataStats();
    fetchDataQuality();
  }, []);

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
            const json = XLSX.utils.sheet_to_json(worksheet);
            allRows = allRows.concat(json);
          });

          const { result: classifiedData, stats } = classifyMixedData(allRows);

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
      const response = await fetch('/api/upload-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classificationPreview.data),
      });

      if (response.ok) {
        let result = { totalAdded: 0 };
        const text = await response.text();
        if (text) {
          try { result = JSON.parse(text); } catch { /* skip */ }
        }
        setMessage({
          type: 'success',
          text: `Data uploaded successfully! Added ${result.totalAdded} records to healthcare directory.`
        });
        setClassificationPreview(null);
        setSelectedFile(null);
        fetchDataStats();
        fetchDataQuality();
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
            { key: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
            { key: 'quality' as const, icon: ShieldCheck, label: 'Data Quality' },
            { key: 'powerbi' as const, icon: FileText, label: 'Power BI' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
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
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h3 className="font-bold text-slate-900">Classification Complete</h3>
                        <pre className="text-xs text-slate-600 mt-1 whitespace-pre-wrap font-mono">{classificationPreview.summary}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {classificationPreview.stats.doctors > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600">
                        <p className="text-sm font-semibold text-slate-700">Doctors</p>
                        <p className="text-xl font-bold text-blue-600">{classificationPreview.stats.doctors}</p>
                      </div>
                    )}
                    {classificationPreview.stats.rmp > 0 && (
                      <div className="bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-600">
                        <p className="text-sm font-semibold text-slate-700">RMPs</p>
                        <p className="text-xl font-bold text-emerald-600">{classificationPreview.stats.rmp}</p>
                      </div>
                    )}
                    {classificationPreview.stats.pharmacies > 0 && (
                      <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-600">
                        <p className="text-sm font-semibold text-slate-700">Pharmacies</p>
                        <p className="text-xl font-bold text-purple-600">{classificationPreview.stats.pharmacies}</p>
                      </div>
                    )}
                    {classificationPreview.stats.hospitals > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-600">
                        <p className="text-sm font-semibold text-slate-700">Hospitals</p>
                        <p className="text-xl font-bold text-red-600">{classificationPreview.stats.hospitals}</p>
                      </div>
                    )}
                    {classificationPreview.stats.mrs > 0 && (
                      <div className="bg-cyan-50 p-3 rounded-lg border-l-4 border-cyan-600">
                        <p className="text-sm font-semibold text-slate-700">MRs</p>
                        <p className="text-xl font-bold text-cyan-600">{classificationPreview.stats.mrs}</p>
                      </div>
                    )}
                    {classificationPreview.stats.unclassified > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
                        <p className="text-sm font-semibold text-slate-700">Unclassified</p>
                        <p className="text-xl font-bold text-gray-600">{classificationPreview.stats.unclassified}</p>
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
                      {isLoading ? 'Uploading...' : 'Confirm & Upload'}
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
      </div>
    </div>
  );
}
