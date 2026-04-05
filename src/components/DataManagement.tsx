import React, { useState, useRef } from 'react';
import { Upload, Download, BarChart3, Loader2, CheckCircle, AlertCircle, FileText, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { classifyMixedData, getClassificationSummary } from '../lib/dataClassifier';

interface DataStats {
  totalDoctors: number;
  totalPharmacies: number;
  totalHospitals: number;
  lastUpdated: string;
}

export default function DataManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'download' | 'powerbi'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classificationPreview, setClassificationPreview] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Fetch current data stats
  React.useEffect(() => {
    fetchDataStats();
  }, []);

  const fetchDataStats = async () => {
    try {
      const response = await fetch('/api/data-stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);
      setDataStats(data);
    } catch (error) {
      console.error('Failed to fetch data stats:', error);
    }
  };

  // Handle Excel file upload with smart classification
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsClassifying(true);
    setMessage(null);
    setClassificationPreview(null);

    try {
      // Parse Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Combine all sheets into one dataset
          let allRows: any[] = [];
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            allRows = allRows.concat(json);
          });

          // Classify the mixed data
          const { result: classifiedData, stats } = classifyMixedData(allRows);
          
          // Show preview
          setClassificationPreview({
            stats,
            data: classifiedData,
            summary: getClassificationSummary(stats)
          });

          setMessage({ 
            type: 'success', 
            text: `📊 Classification Complete! ${stats.doctors} Doctors, ${stats.rmp} RMPs, ${stats.pharmacies} Pharmacies, ${stats.medicalHalls} Medical Halls, ${stats.hospitals} Hospitals, ${stats.mrs} MRs detected. Review and confirm to upload.` 
          });

        } catch (error: any) {
          console.error('Classification error:', error);
          setMessage({ type: 'error', text: `Classification failed: ${error.message}` });
        } finally {
          setIsClassifying(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setIsClassifying(false);
    }
  };

  // Confirm and upload classified data
  const confirmAndUpload = async () => {
    if (!classificationPreview) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/upload-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classificationPreview.data),
      });

      if (response.ok) {
        let result = { totalAdded: 0 };
        const text = await response.text();
        if (text) {
          try {
            result = JSON.parse(text);
          } catch {
            // Server returned empty or non-JSON response, still treat as success
          }
        }
        setMessage({
          type: 'success',
          text: `✅ Data uploaded successfully! Added ${result.totalAdded} records to healthcare directory.`
        });
        setClassificationPreview(null);
        fetchDataStats();
        // Notify HealthcareDirectory to refresh
        window.dispatchEvent(new CustomEvent('healthcare-data-updated', { detail: result }));
      } else {
        const text = await response.text();
        if (text) {
          try {
            const error = JSON.parse(text);
            setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
          } catch {
            setMessage({ type: 'error', text: `Upload failed with status ${response.status}` });
          }
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Upload error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel file download
  const handleDownload = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/download-data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Add Doctors sheet
      if (data.doctors && data.doctors.length > 0) {
        const doctorWS = XLSX.utils.json_to_sheet(data.doctors);
        XLSX.utils.book_append_sheet(workbook, doctorWS, 'Doctors');
      }

      // Add Pharmacies sheet
      if (data.pharmacies && data.pharmacies.length > 0) {
        const pharmacyWS = XLSX.utils.json_to_sheet(data.pharmacies);
        XLSX.utils.book_append_sheet(workbook, pharmacyWS, 'Pharmacies');
      }

      // Add Hospitals sheet
      if (data.hospitals && data.hospitals.length > 0) {
        const hospitalWS = XLSX.utils.json_to_sheet(data.hospitals);
        XLSX.utils.book_append_sheet(workbook, hospitalWS, 'Hospitals');
      }

      // Add MRs sheet
      if (data.mrs && data.mrs.length > 0) {
        const mrWS = XLSX.utils.json_to_sheet(data.mrs);
        XLSX.utils.book_append_sheet(workbook, mrWS, 'MRs');
      }

      // Generate and download file
      const fileName = `Healthcare_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setMessage({ type: 'success', text: `Data downloaded successfully as ${fileName}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Download failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 ml-64">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Data Management</h1>
          </div>
          <p className="text-slate-600">Upload, download, and manage healthcare provider data with Power BI forecasting</p>
        </div>

        {/* Data Stats */}
        {dataStats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-xs text-slate-600 uppercase font-semibold">Total Doctors</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{dataStats.totalDoctors}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-xs text-slate-600 uppercase font-semibold">Total Pharmacies</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{dataStats.totalPharmacies}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-xs text-slate-600 uppercase font-semibold">Total Hospitals</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{dataStats.totalHospitals}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
              <p className="text-xs text-slate-600 uppercase font-semibold">Last Updated</p>
              <p className="text-sm font-bold text-amber-600 mt-2">{dataStats.lastUpdated}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle size={20} className="flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={18} />
            Upload Data
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'download'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download size={18} />
            Download Data
          </button>
          <button
            onClick={() => setActiveTab('powerbi')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'powerbi'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={18} />
            Power BI Dashboard
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Healthcare Data</h2>
                <p className="text-slate-600">Upload mixed Excel files with doctors, pharmacies, hospitals, and MR data in any format. Our AI engine will automatically categorize and segregate the entities.</p>
              </div>

              {!classificationPreview ? (
                <>
                  <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={48} className="mx-auto text-blue-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 mb-2">Click to upload or drag & drop</p>
                    <p className="text-slate-600 text-sm mb-4">Excel files (.xlsx, .xls) with mixed healthcare provider data</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isClassifying || isLoading}
                    />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Zap size={18} className="text-yellow-600" />
                      Smart AI Classification Features
                    </h3>
                    <ul className="text-sm text-slate-700 space-y-2">
                      <li>✅ <strong>Auto-Detect Entity Types:</strong> Identifies doctors, RMPs, pharmacies, medical halls, hospitals, and MRs</li>
                      <li>✅ <strong>Flexible Format:</strong> Works with any column order or naming convention</li>
                      <li>✅ <strong>Mixed Data Support:</strong> Handles distributed data across multiple sheets or single sheet</li>
                      <li>✅ <strong>Smart Segregation:</strong> Automatically categorizes based on content and keywords</li>
                      <li>✅ <strong>Preview & Confirm:</strong> Review classification before uploading</li>
                      <li>✅ <strong>Data Enrichment:</strong> Extracts relevant fields for each entity type</li>
                    </ul>
                  </div>

                  {isClassifying && (
                    <div className="flex items-center justify-center p-6 bg-blue-50 rounded-lg">
                      <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />
                      <span className="text-slate-700 font-medium">Analyzing and classifying your data...</span>
                    </div>
                  )}
                </>
              ) : (
                // Classification Preview
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3 mb-4">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Classification Complete! 🎯</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{classificationPreview.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Entity Preview Cards */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900">Entity Breakdown:</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {classificationPreview.stats.doctors > 0 && (
                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-600">
                          <p className="text-sm font-semibold text-slate-900">👨‍⚕️ Doctors</p>
                          <p className="text-2xl font-bold text-blue-600">{classificationPreview.stats.doctors}</p>
                        </div>
                      )}
                      {classificationPreview.stats.rmp > 0 && (
                        <div className="bg-emerald-50 p-3 rounded border-l-4 border-emerald-600">
                          <p className="text-sm font-semibold text-slate-900">🏥 RMPs</p>
                          <p className="text-2xl font-bold text-emerald-600">{classificationPreview.stats.rmp}</p>
                        </div>
                      )}
                      {classificationPreview.stats.pharmacies > 0 && (
                        <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-600">
                          <p className="text-sm font-semibold text-slate-900">💊 Pharmacies</p>
                          <p className="text-2xl font-bold text-purple-600">{classificationPreview.stats.pharmacies}</p>
                        </div>
                      )}
                      {classificationPreview.stats.medicalHalls > 0 && (
                        <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-600">
                          <p className="text-sm font-semibold text-slate-900">🏪 Medical Halls</p>
                          <p className="text-2xl font-bold text-amber-600">{classificationPreview.stats.medicalHalls}</p>
                        </div>
                      )}
                      {classificationPreview.stats.hospitals > 0 && (
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-600">
                          <p className="text-sm font-semibold text-slate-900">🏛️ Hospitals</p>
                          <p className="text-2xl font-bold text-red-600">{classificationPreview.stats.hospitals}</p>
                        </div>
                      )}
                      {classificationPreview.stats.mrs > 0 && (
                        <div className="bg-cyan-50 p-3 rounded border-l-4 border-cyan-600">
                          <p className="text-sm font-semibold text-slate-900">👔 MRs</p>
                          <p className="text-2xl font-bold text-cyan-600">{classificationPreview.stats.mrs}</p>
                        </div>
                      )}
                      {classificationPreview.stats.unclassified > 0 && (
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                          <p className="text-sm font-semibold text-slate-900">❓ Unclassified</p>
                          <p className="text-2xl font-bold text-gray-600">{classificationPreview.stats.unclassified}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setClassificationPreview(null)}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                      Upload Different File
                    </button>
                    <button
                      onClick={confirmAndUpload}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Confirm & Upload to Healthcare Directory
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Download Tab */}
          {activeTab === 'download' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Download Healthcare Data</h2>
                <p className="text-slate-600">Export all healthcare provider data as an Excel file with multiple sheets.</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg text-center">
                <Download size={48} className="mx-auto text-blue-600 mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-4">Download Complete Dataset</p>
                <p className="text-slate-600 mb-6 text-sm">Includes all Doctors, Pharmacies, Hospitals, and MR information</p>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download Excel File
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3">What's Included</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Doctors Data</p>
                      <p className="text-slate-600 text-xs">All RMP, specialists, clinics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Pharmacies</p>
                      <p className="text-slate-600 text-xs">Medical halls, chains, independent</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Hospitals</p>
                      <p className="text-slate-600 text-xs">Private, government, multi-specialty</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">MR Database</p>
                      <p className="text-slate-600 text-xs">Territory, performance scores</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Power BI Tab */}
          {activeTab === 'powerbi' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Power BI Analytics Dashboard</h2>
                <p className="text-slate-600">Advanced forecasting and analytics for healthcare provider performance and sales trends.</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8 rounded-lg border border-blue-200">
                <div className="text-center mb-6">
                  <BarChart3 size={64} className="mx-auto text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Power BI Embedded Dashboard</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Real-time analytics with forecasting models for doctor visits, pharmacy sales, hospital partnerships, and MR performance metrics.
                  </p>
                </div>

                {/* Power BI Embed URL Configuration */}
                <div className="bg-white p-6 rounded-lg mb-6 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-4">Setup Instructions</h4>
                  <ol className="space-y-3 text-sm text-slate-700">
                    <li><span className="font-semibold">1. Create Power BI Report:</span> Deploy your analytics report to Power BI Service</li>
                    <li><span className="font-semibold">2. Get Embed URL:</span> Copy the embed URL from Power BI workspace settings</li>
                    <li><span className="font-semibold">3. Configure Below:</span> Paste the URL to enable embedded dashboard</li>
                  </ol>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Power BI Embed URL</label>
                    <input
                      type="text"
                      placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
                      defaultValue={localStorage.getItem('powerbi_url') || ''}
                      onChange={(e) => localStorage.setItem('powerbi_url', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-slate-600 mt-2">Your Power BI dashboard will appear here once configured</p>
                  </div>

                  <button
                    onClick={() => {
                      const url = localStorage.getItem('powerbi_url');
                      if (url) {
                        window.open(url, '_blank');
                      } else {
                        alert('Please enter Power BI URL first');
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    Open Power BI Dashboard
                  </button>
                </div>

                {/* Dashboard Preview */}
                <div className="bg-slate-50 p-6 rounded-lg mt-6 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-4">Dashboard Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                      <p className="text-xs text-slate-600 font-semibold mb-1">Doctor Visits</p>
                      <p className="text-2xl font-bold text-blue-600">Forecasting</p>
                    </div>
                    <div className="bg-white p-4 rounded border-l-4 border-green-500">
                      <p className="text-xs text-slate-600 font-semibold mb-1">Pharmacy Sales</p>
                      <p className="text-2xl font-bold text-green-600">Trends</p>
                    </div>
                    <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                      <p className="text-xs text-slate-600 font-semibold mb-1">MR Performance</p>
                      <p className="text-2xl font-bold text-purple-600">Analytics</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
