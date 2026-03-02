import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Database, RefreshCw, Trash2, Search, Filter, SortAsc, SortDesc, Edit2, X, Save, Download, AlertTriangle, FileDown, User, Clock, History, TrendingUp, CheckCircle, ChevronDown, ChevronUp, Target, Zap, Award, Users, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadTaskData, getTaskData, getTaskFilters, updateTaskData, deleteTaskData, deleteMultipleTaskData, exportTaskData } from '../services/DMApi';
import { downloadTaskTemplate } from '../services/templateService';
import { parseTaskExcelFile } from '../utils/parseDMTaskExcel';
import { showSuccessNotification, showErrorNotification, displayDetailedError, displayUploadResult, displayDeleteResult, displayUpdateResult } from '../utils/notificationService';
import { useAuth } from '../contexts/authContext';
import PerformanceAnalytics from '../components/PerformanceAnalytics';
import PaginationComponent from '../components/PaginationComponent';

const useDebounce = (value, delay) => {
const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
const handler = setTimeout(() => {
setDebouncedValue(value);
}, delay);

return () => clearTimeout(handler);
}, [value, delay]);

return debouncedValue;
};

const formatDate = (date) => {
if (!date) return '-';
const d = new Date(date);
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
const year = d.getFullYear();
return `${month}/${day}/${year}`;
};

const formatDateTime = (date) => {
if (!date) return '-';
const d = new Date(date);
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
const year = d.getFullYear();
const hours = String(d.getHours()).padStart(2, '0');
const minutes = String(d.getMinutes()).padStart(2, '0');
return `${month}/${day}/${year} ${hours}:${minutes}`;
};

const AIPerformanceAnalysis = memo(({ task, onClose }) => {
  const successRate = task.finalStatus === 'Eligible' ? 100 : 0;
  const hasResponse = task.replyRecord && task.replyRecord !== '-';
  const responseRate = hasResponse ? 100 : 0;
  
  const analysis = useMemo(() => {
    const insights = {
      performanceLevel: '',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      appreciation: [],
      guidance: []
    };

    if (task.finalStatus === 'Eligible') {
      insights.performanceLevel = 'Successful';
      insights.appreciation.push('Task successfully completed with eligible status');
      insights.strengths.push('Met all qualification criteria', 'Positive outcome achieved');
    } else if (task.finalStatus?.includes('Not Eligible')) {
      insights.performanceLevel = 'Unsuccessful';
      insights.weaknesses.push('Did not meet eligibility criteria');
      if (task.finalStatus.includes('Changed Project')) {
        insights.recommendations.push('Review project alignment and requirements', 'Ensure better initial project matching');
      } else if (task.finalStatus.includes('Cancel')) {
        insights.recommendations.push('Investigate cancellation reasons', 'Improve engagement and retention strategies');
      }
    } else {
      insights.performanceLevel = 'Pending';
      insights.recommendations.push('Complete status assessment', 'Update final status for proper tracking');
    }

    if (task.replyRecord === 'Invited') {
      insights.strengths.push('Positive response received', 'Good engagement level');
      insights.appreciation.push('Successful invitation and acceptance');
    } else if (task.replyRecord === 'Changed Mind') {
      insights.weaknesses.push('Initial interest not maintained');
      insights.recommendations.push('Review expectation management', 'Improve follow-up communication strategy');
    } else if (task.replyRecord === 'No Responses') {
      insights.weaknesses.push('No response received from contact');
      insights.recommendations.push('Review contact timing and methods', 'Consider alternative communication channels');
    }

    if (task.note && task.note.trim()) {
      insights.strengths.push('Detailed notes documented for reference');
    }

    if (!task.phoneNumber || !task.phoneNumber.trim()) {
      insights.weaknesses.push('Missing contact information');
      insights.recommendations.push('Ensure complete contact details for future follow-ups');
    }

    insights.guidance.push(
      'Maintain detailed records for all task interactions',
      'Follow up promptly on pending tasks',
      'Document all communication attempts and outcomes'
    );

    return insights;
  }, [task]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2">
            <Zap className="text-indigo-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Task Analysis</h4>
            <p className="text-xs text-gray-600">Comprehensive assessment based on task data and outcomes</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target size={16} className="text-indigo-600" />
            Task Performance Indicators
          </h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Success Rate</p>
              <p className="text-lg font-bold text-indigo-600">{successRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Response Rate</p>
              <p className="text-lg font-bold text-blue-600">{responseRate}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {analysis.strengths.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Strengths
              </h5>
              <ul className="space-y-1.5">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                Areas for Improvement
              </h5>
              <ul className="space-y-1.5">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Target size={16} className="text-blue-600" />
              Recommendations
            </h5>
            <ul className="space-y-1.5">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.appreciation.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-emerald-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Award size={16} className="text-emerald-600" />
              Recognition
            </h5>
            <ul className="space-y-1.5">
              {analysis.appreciation.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">★</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.guidance.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <User size={16} className="text-cyan-600" />
              Guidance
            </h5>
            <ul className="space-y-1.5">
              {analysis.guidance.map((guide, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">◉</span>
                  <span>{guide}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

const UserProfileModal = memo(({ isOpen, userData, onClose }) => {
if (!isOpen || !userData) return null;

return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
<div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
<div className="flex items-start justify-between">
<div className="flex items-start gap-4">
<div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
<User className="w-8 h-8 text-blue-600" />
</div>
<div>
<h3 className="text-2xl font-bold text-gray-900 mb-1">{userData.fullName}</h3>
<p className="text-sm text-gray-600">{userData.phoneNumber}</p>
</div>
</div>
<button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
<X size={24} />
</button>
</div>
</div>

<div className="flex-1 overflow-y-auto p-6">
<div className="grid grid-cols-2 gap-4 mb-6">
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">User</p>
<p className="text-sm font-semibold text-gray-900">{userData.user || '-'}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Date</p>
<p className="text-sm font-semibold text-gray-900">{formatDate(userData.date)}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Domisili</p>
<p className="text-sm font-semibold text-gray-900">{userData.domicile || '-'}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Kota</p>
<p className="text-sm font-semibold text-gray-900">{userData.city || '-'}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Project</p>
<p className="text-sm font-semibold text-gray-900">{userData.project || '-'}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">NIK</p>
<p className="text-sm font-semibold text-gray-900">{userData.nik || '-'}</p>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Reply Record</p>
<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
userData.replyRecord === 'Invited' ? 'bg-green-100 text-green-800' :
userData.replyRecord === 'Changed Mind' ? 'bg-yellow-100 text-yellow-800' :
userData.replyRecord === 'No Responses' ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-500'
}`}>
{userData.replyRecord || '-'}
</span>
</div>
<div className="bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Final Status</p>
<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
userData.finalStatus === 'Eligible' ? 'bg-green-100 text-green-800' :
userData.finalStatus?.includes('Not Eligible') ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-500'
}`}>
{userData.finalStatus || '-'}
</span>
</div>
{userData.note && (
<div className="col-span-2 bg-gray-50 p-4 rounded-lg">
<p className="text-xs text-gray-500 uppercase font-medium mb-1">Catatan</p>
<p className="text-sm text-gray-900">{userData.note}</p>
</div>
)}
</div>

{(userData.editHistory?.length > 0 || userData.replyRecordHistory?.length > 0 || userData.finalStatusHistory?.length > 0) && (
<div className="mb-6">
<div className="flex items-center gap-2 mb-3">
<History className="w-5 h-5 text-blue-600" />
<h4 className="font-semibold text-gray-900">Riwayat Perubahan Status</h4>
</div>

{userData.editHistory?.length > 0 && (
<div className="mb-4">
<p className="text-sm font-medium text-gray-700 mb-2">Edit History:</p>
<div className="space-y-2">
{userData.editHistory.map((history, idx) => (
<div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
<div className="flex items-start justify-between">
<div>
<p className="text-sm">
<span className="font-medium text-gray-900">Field:</span> 
<span className="ml-2 text-gray-700">{history.fieldName}</span>
</p>
<p className="text-sm mt-1">
<span className="font-medium text-gray-900">Dari:</span> 
<span className="ml-2 text-gray-700">{history.oldValue || '-'}</span>
<span className="mx-2">→</span>
<span className="font-medium text-gray-900">Ke:</span>
<span className="ml-2 text-blue-700 font-semibold">{history.newValue}</span>
</p>
<p className="text-xs text-gray-600 mt-1">
Diubah oleh: <span className="font-medium">{history.editedBy}</span>
</p>
</div>
<div className="flex items-center gap-1 text-xs text-gray-500">
<Clock size={12} />
<span>{formatDateTime(history.editedAt)}</span>
</div>
</div>
</div>
))}
</div>
</div>
)}

{userData.replyRecordHistory?.length > 0 && (
<div className="mb-4">
<p className="text-sm font-medium text-gray-700 mb-2">Reply Record History:</p>
<div className="space-y-2">
{userData.replyRecordHistory.map((history, idx) => (
<div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
<div className="flex items-start justify-between">
<div>
<p className="text-sm">
<span className="font-medium text-gray-900">Dari:</span> 
<span className="ml-2 text-gray-700">{history.oldValue || '-'}</span>
<span className="mx-2">→</span>
<span className="font-medium text-gray-900">Ke:</span>
<span className="ml-2 text-green-700 font-semibold">{history.newValue}</span>
</p>
<p className="text-xs text-gray-600 mt-1">
Diubah oleh: <span className="font-medium">{history.editedBy}</span>
</p>
</div>
<div className="flex items-center gap-1 text-xs text-gray-500">
<Clock size={12} />
<span>{formatDateTime(history.editedAt)}</span>
</div>
</div>
</div>
))}
</div>
</div>
)}

{userData.finalStatusHistory?.length > 0 && (
<div>
<p className="text-sm font-medium text-gray-700 mb-2">Final Status History:</p>
<div className="space-y-2">
{userData.finalStatusHistory.map((history, idx) => (
<div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
<div className="flex items-start justify-between">
<div>
<p className="text-sm">
<span className="font-medium text-gray-900">Dari:</span> 
<span className="ml-2 text-gray-700">{history.oldValue || '-'}</span>
<span className="mx-2">→</span>
<span className="font-medium text-gray-900">Ke:</span>
<span className="ml-2 text-purple-700 font-semibold">{history.newValue}</span>
</p>
<p className="text-xs text-gray-600 mt-1">
Diubah oleh: <span className="font-medium">{history.editedBy}</span>
</p>
</div>
<div className="flex items-center gap-1 text-xs text-gray-500">
<Clock size={12} />
<span>{formatDateTime(history.editedAt)}</span>
</div>
</div>
</div>
))}
</div>
</div>
)}
</div>
)}

<div className="bg-gray-50 p-4 rounded-lg">
<div className="flex items-center justify-between text-xs text-gray-500">
<div>
<p>Created: {formatDateTime(userData.createdAt)}</p>
</div>
<div>
<p>Last Updated: {formatDateTime(userData.updatedAt)}</p>
</div>
</div>
</div>
</div>

<div className="p-4 border-t border-gray-200 bg-gray-50">
<button onClick={onClose} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
Tutup
</button>
</div>
</div>
</div>
);
});

const DuplicateModal = memo(({ isOpen, duplicates, onClose, onDownloadSeparated, originalData }) => {
  if (!isOpen || !duplicates) return null;

  const totalDuplicates = duplicates.total || 0;
  const inFileCount = duplicates.inPayload?.length || 0;
  const inDatabaseCount = duplicates.inDatabase?.length || 0;

  const getNonDuplicateCount = () => {
    if (!originalData) return 0;
    const duplicatePhones = new Set();
    
    duplicates.inPayload?.forEach(dup => {
      if (dup.data?.phoneNumber) {
        duplicatePhones.add(dup.data.phoneNumber);
      }
    });
    
    duplicates.inDatabase?.forEach(dup => {
      if (dup.data?.phoneNumber) {
        duplicatePhones.add(dup.data.phoneNumber);
      }
    });
    
    return originalData.filter(item => !duplicatePhones.has(item.phoneNumber)).length;
  };

  const nonDuplicateCount = getNonDuplicateCount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="p-5 border-b border-gray-200 bg-red-50/80">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Nomor Telepon Duplikat Terdeteksi
                </h3>
                <p className="text-sm text-gray-700">
                  Ditemukan {totalDuplicates} nomor telepon duplikat. Harap perbaiki sebelum melanjutkan.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat dalam File</p>
              <p className="text-2xl font-bold text-gray-900">{inFileCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat di Database</p>
              <p className="text-2xl font-bold text-gray-900">{inDatabaseCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
              <p className="text-xs text-green-600 uppercase font-medium mb-1">Data Valid (Non-Duplikat)</p>
              <p className="text-2xl font-bold text-green-900">{nonDuplicateCount}</p>
            </div>
          </div>

          {nonDuplicateCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">Data Valid Tersedia</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Terdapat {nonDuplicateCount} data yang tidak duplikat dan siap untuk diupload. 
                    Anda dapat mengunduh file terpisah yang berisi data valid dan data duplikat untuk diperbaiki.
                  </p>
                  <p className="text-xs text-green-700 font-medium">
                    File export akan berisi 2 sheet: "Data Valid" dan "Data Duplikat"
                  </p>
                </div>
              </div>
            </div>
          )}

          {inFileCount > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Nomor Telepon Duplikat dalam File yang Diunggah</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Full Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Phone Number</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">City</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Project</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {duplicates.inPayload?.map((dup, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.fullName || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              {dup.data.phoneNumber || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.city || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.project || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {inDatabaseCount > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Nomor Telepon yang Sudah Ada di Database</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Full Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Phone Number</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">City</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Project</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {duplicates.inDatabase?.map((dup, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.fullName || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              {dup.data.phoneNumber || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.city || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.project || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white/90">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {nonDuplicateCount > 0 
                ? `${nonDuplicateCount} data valid siap diupload, ${totalDuplicates} data perlu diperbaiki`
                : 'Perbaiki nomor telepon duplikat dan unggah ulang'
              }
            </p>
            <div className="flex gap-2">
              <button onClick={onDownloadSeparated} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                <FileDown size={16} />
                Download Terpisah (2 Sheet)
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const BulkActionBar = memo(({ selectedItems, onBulkDelete, onSelectAll, onDeselectAll, totalItems, canDelete }) => {
if (selectedItems.length <= 1) return null;

return (
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-6">
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="font-semibold text-blue-900 text-sm">
{selectedItems.length} items selected
</span>
<div className="flex gap-2">
<button onClick={onSelectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
Select All ({totalItems})
</button>
<button onClick={onDeselectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
Deselect All
</button>
</div>
</div>
{canDelete && (
<div className="flex gap-2">
<button onClick={onBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm">
<Trash2 size={16} />
Delete Selected
</button>
</div>
)}
</div>
</div>
);
});

const EditableCell = memo(({ item, field, value, isEditing, editingId, onStartEdit, onChange, onSave, onCancel, className, isLastCell = false, canEditUser = false }) => {
const [localValue, setLocalValue] = useState(value);

useEffect(() => {
setLocalValue(value);
}, [value, editingId]);

const handleChange = useCallback((e) => {
const newValue = e.target.value;
setLocalValue(newValue);
onChange(field, newValue);
}, [field, onChange]);

const handleSelectChange = useCallback(async (e) => {
const newValue = e.target.value;
setLocalValue(newValue);

const updatedData = { ...item, [field]: newValue };
try {
await updateTaskData(item._id, updatedData);
showSuccessNotification("Update Berhasil", `${field === 'replyRecord' ? 'Reply Record' : field === 'finalStatus' ? 'Final Status' : field === 'user' ? 'User' : field} berhasil diperbarui`);
onChange(field, newValue, true);
} catch (error) {
showErrorNotification("Update Failed", error.message || `Gagal memperbarui: ${error.message}`);
setLocalValue(value);
}
}, [item, field, value, onChange]);

if (field === 'user') {
if (!canEditUser) {
return (
<td className={className} title={value || '-'}>
<div className="truncate">{value || '-'}</div>
</td>
);
}

if (isEditing) {
return (
<td className={className}>
<input 
type="text" 
value={localValue} 
onChange={handleChange}
className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
/>
</td>
);
}

return (
<td className={className} title={value || '-'} onDoubleClick={() => onStartEdit(item)}>
<div className="truncate">{value || '-'}</div>
</td>
);
}

if (field === 'replyRecord') {
return (
<td className={className}>
<select 
value={localValue || '-'} 
onChange={handleSelectChange} 
className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-colors"
>
<option value="">-</option>
<option value="Invited">Invited</option>
<option value="Changed Mind">Changed Mind</option>
<option value="No Responses">No Responses</option>
</select>
</td>
);
}

if (field === 'finalStatus') {
return (
<td className={className}>
<select 
value={localValue || '-'} 
onChange={handleSelectChange} 
className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-colors"
>
<option value="">-</option>
<option value="Eligible">Eligible</option>
<option value="Not Eligible (Changed Project)">Not Eligible (Changed Project)</option>
<option value="Not Eligible (Cancel)">Not Eligible (Cancel)</option>
</select>
</td>
);
}

if (isEditing) {
return (
<td className={className}>
{isLastCell ? (
<div className="flex items-center gap-2">
<input type="text" value={localValue} onChange={handleChange} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus={field === 'fullName'} />
<div className="flex gap-1">
<button onClick={onSave} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Simpan">
<Save size={16} />
</button>
<button onClick={onCancel} className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors" title="Batal">
<X size={16} />
</button>
</div>
</div>
) : (
<input type="text" value={localValue} onChange={handleChange} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus={field === 'fullName'} />
)}
</td>
);
}

return (
<td className={className} title={value || '-'} onDoubleClick={() => onStartEdit(item)}>
<div className="truncate">{value || '-'}</div>
</td>
);
});

const TaskRow = memo(({ item, isSelected, onSelect, editingItem, editFormData, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete, onShowProfile, onShowDetails, canDelete, canEditUser, expandedTaskId }) => {
const handleCheckboxChange = useCallback((e) => {
onSelect(item._id, e.target.checked);
}, [item._id, onSelect]);

const handleStartEdit = useCallback(() => {
onStartEdit(item);
}, [item, onStartEdit]);

const handleDelete = useCallback(() => {
onDelete(item);
}, [item, onDelete]);

const handleShowProfile = useCallback(() => {
onShowProfile(item);
}, [item, onShowProfile]);

const handleShowDetails = useCallback(() => {
onShowDetails(item._id);
}, [item._id, onShowDetails]);

const isEditing = editingItem === item._id;
const isExpanded = expandedTaskId === item._id;

const columns = [
{ key: 'user', width: 'min-w-[128px]' },
{ key: 'fullName', width: 'min-w-[192px]' },
{ key: 'date', width: 'min-w-[128px]', formatter: formatDate },
{ key: 'phoneNumber', width: 'min-w-[144px]' },
{ key: 'domicile', width: 'min-w-[128px]' },
{ key: 'city', width: 'min-w-[128px]' },
{ key: 'project', width: 'min-w-[128px]' },
{ key: 'replyRecord', width: 'min-w-[160px]' },
{ key: 'finalStatus', width: 'min-w-[192px]' },
{ key: 'note', width: 'min-w-[192px]' },
{ key: 'nik', width: 'min-w-[144px]' }
];

return (
<>
<tr className="hover:bg-gray-50 transition-colors">
{canDelete && (
<td className="min-w-[48px] px-3 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
<input type="checkbox" checked={isSelected} onChange={handleCheckboxChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
</td>
)}
<td className={`min-w-[144px] px-3 py-3 text-sm ${canDelete ? 'sticky left-[48px]' : 'sticky left-0'} bg-white z-10 border-r border-gray-200`}>
<div className="flex gap-1">
<button onClick={handleShowProfile} className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors" title="Profile">
<User size={16} />
</button>
<button onClick={handleStartEdit} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Edit">
<Edit2 size={16} />
</button>
{canDelete && (
<button onClick={handleDelete} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Hapus">
<Trash2 size={16} />
</button>
)}
{/* <button onClick={handleShowDetails} className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors" title="Details">
{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
</button> */}
</div>
</td>
{columns.map((col, colIndex) => (
<EditableCell 
key={col.key} 
item={item} 
field={col.key} 
value={isEditing ? editFormData[col.key] : (col.formatter ? col.formatter(item[col.key]) : item[col.key])} 
isEditing={isEditing} 
editingId={editingItem} 
onStartEdit={handleStartEdit} 
onChange={onEditChange} 
onSave={onSaveEdit} 
onCancel={onCancelEdit} 
className={`${col.width} px-3 py-3 text-sm ${col.key === 'fullName' ? 'font-medium text-gray-900' : 'text-gray-900'}`} 
isLastCell={colIndex === columns.length - 1}
canEditUser={canEditUser}
/>
))}
</tr>
{isExpanded && (
<tr>
<td colSpan={canDelete ? 13 : 12} className="px-4 py-4 bg-gray-50">
<div className="grid grid-cols-3 gap-4">
<div className="bg-white p-4 rounded-lg border border-gray-200">
<p className="text-xs text-gray-600 uppercase font-medium mb-3">Contact Information</p>
<div className="space-y-2">
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Full Name:</span>
<span className="text-sm font-semibold text-gray-900">{item.fullName}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Phone:</span>
<span className="text-sm font-semibold text-blue-600">{item.phoneNumber || '-'}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">NIK:</span>
<span className="text-sm font-semibold text-gray-600">{item.nik || '-'}</span>
</div>
</div>
</div>
<div className="bg-white p-4 rounded-lg border border-gray-200">
<p className="text-xs text-gray-600 uppercase font-medium mb-3">Location Details</p>
<div className="space-y-2">
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Domicile:</span>
<span className="text-sm font-semibold text-gray-900">{item.domicile || '-'}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">City:</span>
<span className="text-sm font-semibold text-gray-900">{item.city || '-'}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Project:</span>
<span className="text-sm font-semibold text-purple-600">{item.project || '-'}</span>
</div>
</div>
</div>
<div className="bg-white p-4 rounded-lg border border-gray-200">
<p className="text-xs text-gray-600 uppercase font-medium mb-3">Status & Timeline</p>
<div className="space-y-2">
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Date:</span>
<span className="text-sm font-semibold text-gray-900">{formatDate(item.date)}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">User:</span>
<span className="text-sm font-semibold text-gray-900">{item.user || '-'}</span>
</div>
<div className="flex justify-between items-center">
<span className="text-sm text-gray-700">Created:</span>
<span className="text-sm font-semibold text-gray-600">{formatDateTime(item.createdAt)}</span>
</div>
</div>
</div>
</div>
{item.note && (
<div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
<p className="text-xs text-gray-600 uppercase font-medium mb-2">Notes</p>
<p className="text-sm text-gray-700">{item.note}</p>
</div>
)}
</td>
</tr>
)}
</>
);
});

const ConfirmationModal = memo(({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya", cancelText = "Batal", isLoading = false }) => {
if (!isOpen) return null;

return (
<div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
<div className="p-6">
<div className="flex items-start gap-4">
<div className="flex-shrink-0">
<AlertCircle className="w-6 h-6 text-red-600" />
</div>
<div className="flex-1">
<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
<p className="text-gray-700 text-sm">{message}</p>
</div>
</div>
<div className="flex justify-end gap-3 mt-6">
<button onClick={onCancel} disabled={isLoading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
{cancelText}
</button>
<button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
{isLoading && <Loader2 size={16} className="animate-spin" />}
{isLoading ? 'Menghapus...' : confirmText}
</button>
</div>
</div>
</div>
</div>
);
});

const TabButton = memo(({ id, label, icon, isActive, onClick }) => (
<button onClick={() => onClick(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
{icon}
{label}
</button>
));

export default function TaskManagement() {
const { user } = useAuth();
const [isFileUploading, setIsFileUploading] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [extractedData, setExtractedData] = useState(null);
const [uploadProgress, setUploadProgress] = useState(null);
const [taskData, setTaskData] = useState([]);
const [isLoadingData, setIsLoadingData] = useState(false);
const [totalRecords, setTotalRecords] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [hasMore, setHasMore] = useState(false);
const [activeTab, setActiveTab] = useState('upload');
const [editingItem, setEditingItem] = useState(null);
const [editFormData, setEditFormData] = useState({});
const [selectedItems, setSelectedItems] = useState(new Set());
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteTarget, setDeleteTarget] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
const [allItemIds, setAllItemIds] = useState(new Set());
const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
const [isExporting, setIsExporting] = useState(false);
const [duplicateData, setDuplicateData] = useState(null);
const [showDuplicateModal, setShowDuplicateModal] = useState(false);
const [showProfileModal, setShowProfileModal] = useState(false);
const [selectedUserData, setSelectedUserData] = useState(null);
const [expandedTaskId, setExpandedTaskId] = useState(null);
const [showAIAnalysisId, setShowAIAnalysisId] = useState(null);

const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(25);
const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
const [filters, setFilters] = useState({ city: '', project: '' });

const [availableFilters, setAvailableFilters] = useState({
cities: [],
projects: [],
statistics: { total: 0 }
});

const debouncedSearchTerm = useDebounce(searchTerm, 500);
const searchInputRef = useRef(null);
const abortControllerRef = useRef(null);

const hasData = useMemo(() => taskData && taskData.length > 0, [taskData]);
const shouldDisableFilters = useMemo(() => isLoadingData || !hasData, [isLoadingData, hasData]);

const PROTECTED_ROLES = ['admin', 'developer', 'support'];

const normalizeRole = (role) => {
  return role ? role.toLowerCase().trim() : '';
};

const canDelete = useMemo(() => {
  const userRole = normalizeRole(user?.role);
  return PROTECTED_ROLES.map(r => r.toLowerCase()).includes(userRole);
}, [user]);

const canEditUser = useMemo(() => {
  const userRole = normalizeRole(user?.role);
  return PROTECTED_ROLES.map(r => r.toLowerCase()).includes(userRole);
}, [user]);

const handleShowProfile = useCallback((userData) => {
setSelectedUserData(userData);
setShowProfileModal(true);
}, []);

const handleCloseProfile = useCallback(() => {
setShowProfileModal(false);
setSelectedUserData(null);
}, []);

const handleShowDetails = useCallback((taskId) => {
setExpandedTaskId(prev => prev === taskId ? null : taskId);
}, []);

const handleShowAIAnalysis = useCallback((taskId) => {
setShowAIAnalysisId(prev => prev === taskId ? null : taskId);
}, []);

const handleDownloadSeparatedReport = useCallback(() => {
  if (!duplicateData || !extractedData) return;

  const duplicatePhones = new Set();
  const allDuplicates = [];

  if (duplicateData.inPayload) {
    duplicateData.inPayload.forEach(dup => {
      if (dup.data?.phoneNumber) {
        duplicatePhones.add(dup.data.phoneNumber);
      }
      allDuplicates.push({
        'Tipe Duplikat': 'Duplikat dalam File',
        'Baris': dup.row,
        'User': dup.data.user || '',
        'Full Name': dup.data.fullName || '',
        'Date': dup.data.date ? formatDate(dup.data.date) : '',
        'Phone Number': dup.data.phoneNumber || '',
        'Domicile': dup.data.domicile || '',
        'City': dup.data.city || '',
        'Project': dup.data.project || '',
        'Reply Record': dup.data.replyRecord || '',
        'Final Status': dup.data.finalStatus || '',
        'Note': dup.data.note || '',
        'NIK': dup.data.nik || ''
      });
    });
  }

  if (duplicateData.inDatabase) {
    duplicateData.inDatabase.forEach(dup => {
      if (dup.data?.phoneNumber) {
        duplicatePhones.add(dup.data.phoneNumber);
      }
      allDuplicates.push({
        'Tipe Duplikat': 'Duplikat dengan Database',
        'Baris': dup.row,
        'User': dup.data.user || '',
        'Full Name': dup.data.fullName || '',
        'Date': dup.data.date ? formatDate(dup.data.date) : '',
        'Phone Number': dup.data.phoneNumber || '',
        'Domicile': dup.data.domicile || '',
        'City': dup.data.city || '',
        'Project': dup.data.project || '',
        'Reply Record': dup.data.replyRecord || '',
        'Final Status': dup.data.finalStatus || '',
        'Note': dup.data.note || '',
        'NIK': dup.data.nik || ''
      });
    });
  }

  const validData = extractedData.filter(item => !duplicatePhones.has(item.phoneNumber)).map(item => ({
    'User': item.user || '',
    'Full Name': item.fullName || '',
    'Date': item.date ? formatDate(item.date) : '',
    'Phone Number': item.phoneNumber || '',
    'Domicile': item.domicile || '',
    'City': item.city || '',
    'Project': item.project || '',
    'Reply Record': item.replyRecord || '',
    'Final Status': item.finalStatus || '',
    'Note': item.note || '',
    'NIK': item.nik || ''
  }));

  const wb = XLSX.utils.book_new();

  const wsValid = XLSX.utils.json_to_sheet(validData);
  const wscolsValid = [
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 20 }
  ];
  wsValid['!cols'] = wscolsValid;
  XLSX.utils.book_append_sheet(wb, wsValid, 'Data Valid');

  const wsDuplicate = XLSX.utils.json_to_sheet(allDuplicates);
  const wscolsDuplicate = [
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 20 }
  ];
  wsDuplicate['!cols'] = wscolsDuplicate;
  XLSX.utils.book_append_sheet(wb, wsDuplicate, 'Data Duplikat');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Task_Separated_Data_${timestamp}.xlsx`);

  showSuccessNotification(
    "Download Berhasil", 
    `File berhasil diunduh dengan ${validData.length} data valid dan ${allDuplicates.length} data duplikat`
  );
}, [duplicateData, extractedData]);

const handleCloseDuplicateModal = useCallback(() => {
setShowDuplicateModal(false);
setDuplicateData(null);
setExtractedData(null);
}, []);

const handleDownloadTemplate = useCallback(async () => {
setIsDownloadingTemplate(true);
try {
const result = downloadTaskTemplate();
showSuccessNotification("Template Downloaded", result.message);
} catch (error) {
showErrorNotification("Download Failed", error.message);
} finally {
setIsDownloadingTemplate(false);
}
}, []);

const handleExportData = useCallback(async () => {
setIsExporting(true);
try {
const blob = await exportTaskData({
search: debouncedSearchTerm,
sortKey: sortConfig.key,
sortDirection: sortConfig.direction,
city: filters.city,
project: filters.project
});

const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `Task_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
window.URL.revokeObjectURL(url);

showSuccessNotification("Export Berhasil", `Data task berhasil diekspor (${totalRecords} records)`);
} catch (error) {
showErrorNotification("Export Failed", error.message);
} finally {
setIsExporting(false);
}
}, [debouncedSearchTerm, sortConfig, filters, totalRecords]);

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  e.target.value = null;

  if (!file) {
    showErrorNotification("File Error", "Tidak ada file yang dipilih");
    return;
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showErrorNotification("Format Error", "Format file tidak didukung. Silakan pilih file Excel (.xlsx atau .xls)");
    return;
  }

  setIsFileUploading(true);

  try {
    const parsedData = await parseTaskExcelFile(file);

    if (parsedData.length === 0) {
      throw new Error('Tidak ada data valid untuk diupload setelah validasi');
    }

    setExtractedData(parsedData);
    showSuccessNotification("File Read Successfully", `Berhasil membaca ${parsedData.length} baris data dari file Excel`);

  } catch (error) {
    if (error.isDuplicateError && error.duplicates) {
      console.log("Duplicate phone numbers detected in file, showing modal");
      setExtractedData(error.allParsedData || []);
      setDuplicateData(error.duplicates);
      setShowDuplicateModal(true);
    } else {
      showErrorNotification("File Reading Failed", `Gagal membaca file: ${error.message}`);
      setExtractedData(null);
    }
  } finally {
    setIsFileUploading(false);
  }
};

const uploadToDatabase = async () => {
if (!extractedData || extractedData.length === 0) {
showErrorNotification("Upload Error", "Tidak ada data untuk diupload");
return;
}

setShowDuplicateModal(false);
setIsUploading(true);
setUploadProgress({ current: 0, total: 1, percentage: 0 });

try {
const result = await uploadTaskData(extractedData, (progress) => {
setUploadProgress(progress);
}, false);

if (!result.success) {
throw new Error(result.message || 'Upload gagal dengan alasan tidak diketahui');
}

setUploadProgress({ current: result.totalBatches || 1, total: result.totalBatches || 1, percentage: 100 });
displayUploadResult(result, "Task Data Upload");

await Promise.all([loadTaskData(), loadAvailableFilters()]);

setTimeout(() => {
setUploadProgress(null);
setExtractedData(null);
setDuplicateData(null);
}, 3000);

} catch (error) {
setUploadProgress(null);

if (error.status === 409 && error.data?.duplicates) {
console.log("Duplicate data detected, showing modal");
setDuplicateData(error.data.duplicates);
setShowDuplicateModal(true);
setIsUploading(false);
return;
}

let errorMessage = error.message;
if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
errorMessage = 'Upload gagal karena masalah koneksi. Periksa koneksi internet dan coba lagi.';
} else if (errorMessage.includes('500')) {
errorMessage = 'Upload gagal karena error server. Silakan coba lagi dalam beberapa saat.';
}

displayDetailedError(`Upload gagal: ${errorMessage}`, "Upload Failed");
} finally {
setIsUploading(false);
}
};

const handleEdit = useCallback((item) => {
setEditingItem(item._id);
setEditFormData({ ...item });
}, []);

const handleCancelEdit = useCallback(() => {
setEditingItem(null);
setEditFormData({});
}, []);

const handleEditChange = useCallback((field, value, shouldRefresh = false) => {
if (shouldRefresh) {
setTaskData(prevData => 
prevData.map(item => 
item._id === editingItem ? { ...item, [field]: value } : item
)
);
loadTaskData();
} else {
setEditFormData(prev => ({ ...prev, [field]: value }));
}
}, [editingItem]);

const handleSaveEdit = useCallback(async () => {
try {
const response = await updateTaskData(editingItem, editFormData);

if (response.success) {
displayUpdateResult(editFormData.fullName);

setTaskData(prevData => 
prevData.map(item => 
item._id === editingItem ? { ...item, ...response.data } : item
)
);

setEditingItem(null);
setEditFormData({});

await loadAvailableFilters();
} else {
throw new Error(response.message || 'Update failed');
}
} catch (error) {
showErrorNotification("Update Failed", error.message || `Gagal memperbarui data: ${error.message}`);
}
}, [editingItem, editFormData]);

const handleDelete = useCallback((item) => {
if (!canDelete) {
showErrorNotification("Permission Denied", "Anda tidak memiliki izin untuk menghapus data");
return;
}
setDeleteTarget({ type: 'single', id: item._id, name: item.fullName });
setShowDeleteConfirm(true);
}, [canDelete]);

const handleBulkDelete = useCallback(() => {
if (!canDelete) {
showErrorNotification("Permission Denied", "Anda tidak memiliki izin untuk menghapus data");
return;
}
if (selectedItems.size === 0) {
showErrorNotification("Selection Error", "Pilih minimal satu item untuk dihapus");
return;
}
setDeleteTarget({ type: 'multiple', ids: Array.from(selectedItems), count: selectedItems.size });
setShowDeleteConfirm(true);
}, [selectedItems, canDelete]);

const confirmDelete = useCallback(async () => {
setIsDeleting(true);
try {
if (deleteTarget.type === 'single') {
await deleteTaskData(deleteTarget.id);
displayDeleteResult(1, false);
} else {
await deleteMultipleTaskData(deleteTarget.ids);
displayDeleteResult(deleteTarget.count, true);
setSelectedItems(new Set());
}
await Promise.all([loadTaskData(), loadAvailableFilters()]);
} catch (error) {
showErrorNotification("Delete Failed", `Gagal menghapus data: ${error.message}`);
} finally {
setIsDeleting(false);
setShowDeleteConfirm(false);
setDeleteTarget(null);
}
}, [deleteTarget]);

const cancelDelete = useCallback(() => {
setShowDeleteConfirm(false);
setDeleteTarget(null);
}, []);

const loadAllItemIds = useCallback(async () => {
try {
const params = {
page: 1,
limit: totalRecords || 10000,
search: debouncedSearchTerm,
sortKey: sortConfig.key,
sortDirection: sortConfig.direction,
city: filters.city,
project: filters.project
};

const result = await getTaskData(params);
const ids = new Set(result.data.map(item => item._id));
setAllItemIds(ids);
} catch (error) {
console.error('Error loading all item IDs:', error);
}
}, [totalRecords, debouncedSearchTerm, sortConfig, filters]);

const handleSelectAll = useCallback(() => {
setSelectedItems(new Set(allItemIds));
}, [allItemIds]);

const handleDeselectAll = useCallback(() => {
setSelectedItems(new Set());
}, []);

const handleSelectItem = useCallback((id, checked) => {
setSelectedItems(prev => {
const newSelected = new Set(prev);
if (checked) {
newSelected.add(id);
} else {
newSelected.delete(id);
}
return newSelected;
});
}, []);

const loadTaskData = useCallback(async () => {
if (abortControllerRef.current) {
abortControllerRef.current.abort();
}

abortControllerRef.current = new AbortController();
setIsLoadingData(true);

try {
const params = {
page: currentPage,
limit: itemsPerPage,
search: debouncedSearchTerm,
sortKey: sortConfig.key,
sortDirection: sortConfig.direction,
city: filters.city,
project: filters.project
};

const result = await getTaskData(params);

setTaskData(result.data || []);
setTotalRecords(result.total || 0);
setTotalPages(result.totalPages || 0);
setHasMore(result.hasMore || false);
} catch (error) {
if (error.name !== 'AbortError') {
console.error('Error loading task data:', error);
showErrorNotification("Data Load Failed", `Gagal memuat data task: ${error.message}`);
}
} finally {
setIsLoadingData(false);
abortControllerRef.current = null;
}
}, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig, filters]);

const loadAvailableFilters = useCallback(async () => {
try {
const result = await getTaskFilters();
setAvailableFilters({
cities: result.cities || [],
projects: result.projects || [],
statistics: result.statistics || { total: 0 }
});
} catch (error) {
console.error('Error loading filters:', error);
}
}, []);

useEffect(() => {
loadTaskData();
}, [loadTaskData]);

useEffect(() => {
loadAvailableFilters();
}, [loadAvailableFilters]);

useEffect(() => {
if (totalRecords > 0 && canDelete) {
loadAllItemIds();
}
}, [totalRecords, debouncedSearchTerm, sortConfig, filters, canDelete, loadAllItemIds]);

const resetForm = () => {
setExtractedData(null);
setUploadProgress(null);
setDuplicateData(null);
setShowDuplicateModal(false);
};

const handleSort = useCallback((key) => {
setSortConfig(prevSort => ({
key,
direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
}));
setCurrentPage(1);
}, []);

const handlePageChange = useCallback((page) => {
setCurrentPage(page);
}, []);

const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
setItemsPerPage(newItemsPerPage);
setCurrentPage(1);
}, []);

const handleSearchChange = useCallback((value) => {
setSearchTerm(value);
setCurrentPage(1);
}, []);

const handleFilterChange = useCallback((filterKey, value) => {
setFilters(prev => ({ ...prev, [filterKey]: value }));
setCurrentPage(1);
}, []);

const clearAllFilters = useCallback(() => {
setSearchTerm('');
setFilters({ city: '', project: '' });
setSortConfig({ key: 'createdAt', direction: 'desc' });
setCurrentPage(1);
if (searchInputRef.current) {
searchInputRef.current.focus();
}
}, []);

const getSortIcon = useCallback((column) => {
if (sortConfig.key !== column) {
return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
}

return sortConfig.direction === 'asc' 
? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
: <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
}, [sortConfig]);

const currentPageIds = useMemo(() => taskData.map(item => item._id), [taskData]);

const isAllCurrentSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
const isIndeterminate = currentPageIds.some(id => selectedItems.has(id)) && !isAllCurrentSelected;

const handleMasterCheckbox = useCallback((checked) => {
const newSelected = new Set(selectedItems);
if (checked) {
currentPageIds.forEach(id => newSelected.add(id));
} else {
currentPageIds.forEach(id => newSelected.delete(id));
}
setSelectedItems(newSelected);
}, [selectedItems, currentPageIds]);

return (
<div className="max-w-[1800px] mx-auto p-6 bg-white rounded-lg shadow-lg">
<UserProfileModal 
isOpen={showProfileModal} 
userData={selectedUserData} 
onClose={handleCloseProfile}
/>

<DuplicateModal 
isOpen={showDuplicateModal} 
duplicates={duplicateData} 
onClose={handleCloseDuplicateModal}
onDownloadSeparated={handleDownloadSeparatedReport}
originalData={extractedData}
/>

<div className="mb-6">
<div className="flex items-center justify-between">
<div>
<h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
<FileSpreadsheet className="text-blue-600" size={28} />
Task Management System
</h2>
<p className="text-gray-600">Upload dan kelola data task dari file Excel</p>
</div>
<div className="flex items-center gap-3">
<button onClick={handleDownloadTemplate} disabled={isDownloadingTemplate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm">
{isDownloadingTemplate ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
Download Template
</button>
<button onClick={handleExportData} disabled={isExporting || !hasData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm">
{isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
Export Data
</button>
</div>
</div>
</div>

<div className="mb-6 border-b border-gray-200">
<div className="flex space-x-2">
<TabButton id="upload" label="Upload & Manage Tasks" icon={<Upload size={18} />} isActive={activeTab === 'upload'} onClick={setActiveTab} />
<TabButton id="analytics" label="Performance Analytics" icon={<TrendingUp size={18} />} isActive={activeTab === 'analytics'} onClick={setActiveTab} />
</div>
</div>

<ConfirmationModal isOpen={showDeleteConfirm} title="Konfirmasi Penghapusan" message={deleteTarget?.type === 'single' ? `Apakah Anda yakin ingin menghapus data "${deleteTarget.name}"?` : `Apakah Anda yakin ingin menghapus ${deleteTarget?.count} data terpilih?`} onConfirm={confirmDelete} onCancel={cancelDelete} confirmText="Ya, Hapus" cancelText="Batal" isLoading={isDeleting} />

{activeTab === 'analytics' && (
<div className="mb-6">
<PerformanceAnalytics onRefreshData={loadTaskData} />
</div>
)}

{activeTab === 'upload' && (
<>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
<div className="lg:col-span-2 space-y-4">
<h3 className="text-lg font-semibold text-gray-800">Upload File Excel Task</h3>
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
<input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={isFileUploading || isUploading} />
<label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${isFileUploading || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
<Upload className="text-blue-500" size={48} />
<div>
<p className="text-lg font-medium text-gray-700">
{isFileUploading ? 'Memproses File...' : 'Pilih File Excel Task'}
</p>
<p className="text-sm text-gray-500 mt-1">Klik untuk memilih file .xlsx atau .xls</p>
</div>
</label>
</div>
</div>

<div className="space-y-4">
<h3 className="text-lg font-semibold text-gray-800">Statistik Task</h3>
<div className="bg-gray-50 rounded-lg p-6 space-y-3">
<div className="flex justify-between items-center">
<button onClick={loadTaskData} disabled={isLoadingData} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm">
{isLoadingData ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
Refresh
</button>
</div>

<div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
<span className="text-sm font-medium text-blue-700">Total Records</span>
<span className="text-xl font-bold text-blue-600">{availableFilters.statistics.total}</span>
</div>

<div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
<span className="text-sm font-medium text-amber-700">Hasil Filter</span>
<span className="text-xl font-bold text-amber-600">{totalRecords}</span>
</div>
</div>
</div>
</div>

<div className="flex flex-wrap gap-3 mb-6">
{extractedData && (
<button onClick={uploadToDatabase} disabled={isUploading || isFileUploading} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
{isUploading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
{isUploading ? 'Mengupload...' : 'Upload ke Database'}
</button>
)}

{extractedData && (
<button onClick={resetForm} disabled={isFileUploading || isUploading} className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
<Trash2 size={20} />
Reset
</button>
)}
</div>

{uploadProgress && (
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-blue-800">Upload Progress</span>
<span className="text-sm text-blue-600">{Math.round(uploadProgress.percentage)}%</span>
</div>
<div className="w-full bg-blue-200 rounded-full h-3">
<div className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress.percentage}%` }}></div>
</div>
</div>
)}

{extractedData && extractedData.length > 0 && (
<div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
<div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
<h3 className="text-lg font-semibold text-gray-800">Preview Data ({extractedData.length} baris)</h3>
<p className="text-sm text-gray-600">Menampilkan maksimal 5 baris pertama</p>
</div>

<div className="overflow-x-auto max-h-96">
<table className="w-full text-sm">
<thead className="bg-gray-100">
<tr>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">User</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Full Name</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Date</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Phone Number</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Domicile</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">City</th>
<th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Project</th>
</tr>
</thead>
<tbody>
{extractedData.slice(0, 5).map((row, rowIndex) => (
<tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-200">
<td className="px-3 py-2 text-xs">{row.user || '-'}</td>
<td className="px-3 py-2 text-xs">{row.fullName || '-'}</td>
<td className="px-3 py-2 text-xs">{formatDate(row.date)}</td>
<td className="px-3 py-2 text-xs">{row.phoneNumber || '-'}</td>
<td className="px-3 py-2 text-xs">{row.domicile || '-'}</td>
<td className="px-3 py-2 text-xs">{row.city || '-'}</td>
<td className="px-3 py-2 text-xs">{row.project || '-'}</td>
</tr>
))}
</tbody>
</table>
</div>

{extractedData.length > 5 && (
<div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
... dan {extractedData.length - 5} baris lainnya
</div>
)}
</div>
)}

<BulkActionBar selectedItems={Array.from(selectedItems)} onBulkDelete={handleBulkDelete} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} totalItems={totalRecords} canDelete={canDelete} />

<div className="border border-gray-200 rounded-lg overflow-hidden">
<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
<h2 className="text-xl font-semibold">Data Task ({totalRecords} records)</h2>
</div>

<div className="flex flex-col lg:flex-row gap-3 mb-4">
<div className="flex-1 relative">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
<input ref={searchInputRef} type="text" placeholder="Cari nama, telepon, domisili, kota, project..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters} />
{searchTerm && !shouldDisableFilters && (
<button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
×
</button>
)}
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
<select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters}>
<option value="">Semua Kota</option>
{availableFilters.cities.map(city => (
<option key={city} value={city}>{city}</option>
))}
</select>

<select value={filters.project} onChange={(e) => handleFilterChange('project', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters}>
<option value="">Semua Project</option>
{availableFilters.projects.map(project => (
<option key={project} value={project}>{project}</option>
))}
</select>

<button onClick={clearAllFilters} disabled={shouldDisableFilters} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
<Filter size={16} />
Reset Filter
</button>
</div>
</div>

<div className="overflow-x-auto">
{isLoadingData ? (
<div className="flex justify-center items-center h-32">
<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
</div>
) : taskData.length > 0 ? (
<>
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50 sticky top-0 z-20">
<tr>
{canDelete && (
<th className="min-w-[48px] px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r border-gray-200">
<input type="checkbox" checked={isAllCurrentSelected} ref={(el) => {
if (el) el.indeterminate = isIndeterminate;
}} onChange={(e) => handleMasterCheckbox(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
</th>
)}
<th className={`min-w-[96px] px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${canDelete ? 'sticky left-[48px]' : 'sticky left-0'} bg-gray-50 z-30 border-r border-gray-200`}>
Actions
</th>
{[
{ key: 'user', label: 'User', width: 'min-w-[128px]' },
{ key: 'fullName', label: 'Full Name', width: 'min-w-[192px]' },
{ key: 'date', label: 'Date', width: 'min-w-[128px]' },
{ key: 'phoneNumber', label: 'Phone Number', width: 'min-w-[144px]' },
{ key: 'domicile', label: 'Domicile', width: 'min-w-[128px]' },
{ key: 'city', label: 'City', width: 'min-w-[128px]' },
{ key: 'project', label: 'Project', width: 'min-w-[128px]' },
{ key: 'replyRecord', label: 'Reply Record', width: 'min-w-[160px]' },
{ key: 'finalStatus', label: 'Final Status', width: 'min-w-[192px]' },
{ key: 'note', label: 'Note', width: 'min-w-[192px]' },
{ key: 'nik', label: 'NIK', width: 'min-w-[144px]' }
].map(({ key, label, width }) => (
<th key={key} className={`${width} px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors`} onClick={() => handleSort(key)}>
<div className="flex items-center">
<span className="truncate">{label}</span>
{getSortIcon(key)}
</div>
</th>
))}
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{taskData.map((item) => (
<TaskRow 
key={item._id} 
item={item} 
isSelected={selectedItems.has(item._id)} 
onSelect={handleSelectItem} 
editingItem={editingItem} 
editFormData={editFormData} 
onStartEdit={handleEdit} 
onEditChange={handleEditChange} 
onSaveEdit={handleSaveEdit} 
onCancelEdit={handleCancelEdit} 
onDelete={handleDelete} 
onShowProfile={handleShowProfile}
canDelete={canDelete}
/>
))}
</tbody>
</table>
</>
) : (
<div className="text-center py-12">
<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">
{searchTerm || filters.city || filters.project ? 'Tidak ada data yang sesuai dengan filter' : 'Belum ada data task'}
</h3>
<p className="mt-1 text-sm text-gray-500">
{searchTerm || filters.city || filters.project ? 'Coba ubah atau hapus filter pencarian' : 'Upload file Excel untuk melihat data task'}
</p>
</div>
)}
</div>

{taskData.length > 0 && (
<div className="bg-white border-t border-gray-200">
<PaginationComponent
currentPage={currentPage}
totalPages={totalPages}
onPageChange={handlePageChange}
itemsPerPage={itemsPerPage}
totalItems={totalRecords}
onItemsPerPageChange={handleItemsPerPageChange}
/>
</div>
)}
</div>
</>
)}
</div>
);
}