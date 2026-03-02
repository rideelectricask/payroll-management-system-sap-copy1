import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Database, RefreshCw, Trash2, Search, Filter, SortAsc, SortDesc, Edit2, X, Save, Download, AlertTriangle, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadFleetData, getFleetData, getFleetFilters, updateFleetData, deleteFleetData, deleteMultipleFleetData, exportFleetData } from '../services/fleetApi';
import { downloadFleetTemplate } from '../services/templateService';
import { showSuccessNotification, showErrorNotification, displayDetailedError, displayUploadResult, displayDeleteResult, displayUpdateResult } from '../utils/notificationService';
import CoreFM from '../components/CoreFM';

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

const DuplicateModal = memo(({ isOpen, duplicates, onClose, onDownload }) => {
  if (!isOpen || !duplicates) return null;

  const totalDuplicates = duplicates.total || 0;
  const inFileCount = duplicates.inPayload?.length || 0;
  const inDatabaseCount = duplicates.inDatabase?.length || 0;

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
                  Data Duplikat Terdeteksi
                </h3>
                <p className="text-sm text-gray-700">
                  Ditemukan {totalDuplicates} data duplikat. Harap perbaiki sebelum melanjutkan.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat dalam File</p>
              <p className="text-2xl font-bold text-gray-900">{inFileCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat di Database</p>
              <p className="text-2xl font-bold text-gray-900">{inDatabaseCount}</p>
            </div>
          </div>

          {inFileCount > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Duplikat dalam File yang Diunggah</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nama</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">No Telepon</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Veh Numb</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Field Duplikat</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {duplicates.inPayload?.map((dup, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.phoneNumber || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.vehNumb || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {dup.duplicateFields.map((field, i) => (
                                <span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                                  {field === 'name' ? 'NAMA' : field === 'phoneNumber' ? 'NO TELEPON' : field === 'vehNumb' ? 'VEH. NUMB' : field}
                                </span>
                              ))}
                            </div>
                          </td>
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
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Duplikat dengan Data di Database</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nama</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">No Telepon</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Veh Numb</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Field Duplikat</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {duplicates.inDatabase?.map((dup, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.phoneNumber || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{dup.data.vehNumb || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {dup.duplicateFields.map((field, i) => (
                                <span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                                  {field === 'name' ? 'NAMA' : field === 'phoneNumber' ? 'NO TELEPON' : field === 'vehNumb' ? 'VEH. NUMB' : field}
                                </span>
                              ))}
                            </div>
                          </td>
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
            <p className="text-sm text-gray-600">Perbaiki data duplikat dan unggah ulang</p>
            <div className="flex gap-2">
              <button onClick={onDownload} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                <FileDown size={16} />
                Download Detail
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

const BulkActionBar = memo(({ selectedItems, onBulkDelete, onSelectAll, onDeselectAll, totalItems }) => {
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
        <div className="flex gap-2">
          <button onClick={onBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm">
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
});

const EditableCell = memo(({ item, field, value, isEditing, editingId, onStartEdit, onChange, onSave, onCancel, className, isLastCell = false }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value, editingId]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(field, newValue);
  }, [field, onChange]);

  if (isEditing) {
    return (
      <td className={className}>
        {isLastCell ? (
          <div className="flex items-center gap-2">
            <input type="text" value={localValue} onChange={handleChange} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus={field === 'notes'} />
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
          <input type="text" value={localValue} onChange={handleChange} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus={field === 'name'} />
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

const FleetRow = memo(({ item, isSelected, onSelect, editingItem, editFormData, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete }) => {
  const handleCheckboxChange = useCallback((e) => {
    onSelect(item._id, e.target.checked);
  }, [item._id, onSelect]);

  const handleStartEdit = useCallback(() => {
    onStartEdit(item);
  }, [item, onStartEdit]);

  const handleDelete = useCallback(() => {
    onDelete(item);
  }, [item, onDelete]);

  const isEditing = editingItem === item._id;

  const columns = [
    { key: 'name', width: 'w-40' },
    { key: 'phoneNumber', width: 'w-32' },
    { key: 'status', width: 'w-24' },
    { key: 'molis', width: 'w-28' },
    { key: 'deductionAmount', width: 'w-36' },
    { key: 'project', width: 'w-32' },
    { key: 'distribusi', width: 'w-32' },
    { key: 'rushHour', width: 'w-32' },
    { key: 'vehNumb', width: 'w-28' },
    { key: 'type', width: 'w-32' },
    { key: 'notes', width: 'w-40' }
  ];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="w-12 px-3 py-3 text-sm text-gray-900">
        <input type="checkbox" checked={isSelected} onChange={handleCheckboxChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      </td>
      <td className="w-20 px-3 py-3 text-sm">
        <div className="flex gap-1">
          <button onClick={handleStartEdit} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={handleDelete} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
      {columns.map((col, colIndex) => (
        <EditableCell key={col.key} item={item} field={col.key} value={isEditing ? editFormData[col.key] : item[col.key]} isEditing={isEditing} editingId={editingItem} onStartEdit={handleStartEdit} onChange={onEditChange} onSave={onSaveEdit} onCancel={onCancelEdit} className={`${col.width} px-3 py-3 text-sm ${col.key === 'name' || col.key === 'vehNumb' ? 'font-medium text-gray-900' : 'text-gray-900'}`} isLastCell={colIndex === columns.length - 1} />
      ))}
    </tr>
  );
});

const ConfirmationModal = memo(({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya", cancelText = "Batal", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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

export default function FleetManagement() {
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [fleetData, setFleetData] = useState([]);
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

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState({ status: '', project: '', type: '' });

  const [availableFilters, setAvailableFilters] = useState({
    statuses: [],
    projects: [],
    types: [],
    statistics: { total: 0, active: 0, inactive: 0 }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const hasData = useMemo(() => fleetData && fleetData.length > 0, [fleetData]);
  const shouldDisableFilters = useMemo(() => isLoadingData || !hasData, [isLoadingData, hasData]);

  const handleDownloadDuplicateReport = useCallback(() => {
    if (!duplicateData) return;

    const reportData = [];

    if (duplicateData.inPayload) {
      duplicateData.inPayload.forEach(dup => {
        reportData.push({
          Tipe: 'Duplikat dalam File',
          Baris: dup.row,
          Nama: dup.data.name || '',
          'No Telepon': dup.data.phoneNumber || '',
          'Veh Numb': dup.data.vehNumb || '',
          'Field Duplikat': dup.duplicateFields.join(', ')
        });
      });
    }

    if (duplicateData.inDatabase) {
      duplicateData.inDatabase.forEach(dup => {
        reportData.push({
          Tipe: 'Duplikat dengan Database',
          Baris: dup.row,
          Nama: dup.data.name || '',
          'No Telepon': dup.data.phoneNumber || '',
          'Veh Numb': dup.data.vehNumb || '',
          'Field Duplikat': dup.duplicateFields.join(', ')
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Duplicate Report');

    const wscols = [
      { wch: 25 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 }
    ];
    ws['!cols'] = wscols;

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Fleet_Duplicate_Report_${timestamp}.xlsx`);

    showSuccessNotification("Download Berhasil", "Laporan duplikat berhasil diunduh");
  }, [duplicateData]);

  const handleCloseDuplicateModal = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicateData(null);
    setExtractedData(null);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloadingTemplate(true);
    try {
      const result = downloadFleetTemplate();
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
      const blob = await exportFleetData({
        search: debouncedSearchTerm,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
        status: filters.status,
        project: filters.project,
        type: filters.type
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fleet_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessNotification("Export Berhasil", `Data fleet berhasil diekspor (${totalRecords} records)`);
    } catch (error) {
      showErrorNotification("Export Failed", error.message);
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, sortConfig, filters, totalRecords]);

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Gagal membaca file Excel: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsBinaryString(file);
    });
  };

  const normalizeHeaderName = (header) => {
    return header.toString().toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
  };

  const createHeaderMapping = (headers) => {
    const normalizedHeaders = headers.map(normalizeHeaderName);
    const headerMap = {};

    const fieldMappings = {
      name: ['name'],
      phoneNumber: ['no_telepon', 'phone_number', 'telepon'],
      status: ['status'],
      molis: ['molis'],
      deductionAmount: ['deduction_amount'],
      statusSecond: ['status_second'],
      project: ['project'],
      distribusi: ['distribusi'],
      rushHour: ['rush_hour'],
      vehNumb: ['veh_numb'],
      type: ['type'],
      notes: ['notes']
    };

    Object.keys(fieldMappings).forEach(field => {
      const possibleNames = fieldMappings[field];
      for (let possibleName of possibleNames) {
        const index = normalizedHeaders.indexOf(possibleName);
        if (index !== -1) {
          headerMap[field] = index;
          break;
        }
      }
    });

    return headerMap;
  };

  const validateDataStructure = (data) => {
    if (!data || data.length < 2) {
      throw new Error('Data tidak memiliki header atau baris data');
    }

    const headers = data[0];
    const headerMap = createHeaderMapping(headers);

    const requiredFields = ['name', 'vehNumb'];
    const missingFields = requiredFields.filter(field => headerMap[field] === undefined);

    if (missingFields.length > 0) {
      const availableHeaders = headers.join(', ');
      throw new Error(`Header yang diperlukan tidak ditemukan: ${missingFields.join(', ')}. Header tersedia: ${availableHeaders}`);
    }

    return headerMap;
  };

  const transformDataForUpload = (data) => {
    const dataRows = data.slice(1);
    const headerMap = validateDataStructure(data);

    return dataRows
      .filter(row => row.some(cell => cell && cell.toString().trim()))
      .map(row => {
        const dataObj = {};

        Object.keys(headerMap).forEach(field => {
          const index = headerMap[field];
          const value = index !== undefined ? (row[index] || '') : '';
          dataObj[field] = value.toString().trim();
        });

        return {
          name: dataObj.name || '',
          phoneNumber: dataObj.phoneNumber || '',
          status: dataObj.status || '',
          molis: dataObj.molis || '',
          deductionAmount: dataObj.deductionAmount || '',
          statusSecond: dataObj.statusSecond || '',
          project: dataObj.project || '',
          distribusi: dataObj.distribusi || '',
          rushHour: dataObj.rushHour || '',
          vehNumb: dataObj.vehNumb || '',
          type: dataObj.type || '',
          notes: dataObj.notes || ''
        };
      })
      .filter(obj => obj.name && obj.vehNumb);
  };

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
      const parsedData = await parseExcelFile(file);

      if (parsedData.length === 0) {
        throw new Error('File Excel kosong atau tidak dapat dibaca');
      }

      const transformedData = transformDataForUpload(parsedData);

      if (transformedData.length === 0) {
        throw new Error('Tidak ada data valid untuk diupload setelah validasi');
      }

      setExtractedData(parsedData);
      showSuccessNotification("File Read Successfully", `Berhasil membaca ${transformedData.length} baris data dari file Excel`);

    } catch (error) {
      showErrorNotification("File Reading Failed", `Gagal membaca file: ${error.message}`);
      setExtractedData(null);
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
      const transformedData = transformDataForUpload(extractedData);

      if (transformedData.length === 0) {
        throw new Error('Tidak ada data valid untuk diupload setelah validasi');
      }

      const result = await uploadFleetData(transformedData, (progress) => {
        setUploadProgress(progress);
      }, false);

      if (!result.success) {
        throw new Error(result.message || 'Upload gagal dengan alasan tidak diketahui');
      }

      setUploadProgress({ current: result.totalBatches || 1, total: result.totalBatches || 1, percentage: 100 });
      displayUploadResult(result, "Fleet Data Upload");

      await Promise.all([loadFleetData(), loadAvailableFilters()]);

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

  const handleEditChange = useCallback((field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    try {
      await updateFleetData(editingItem, editFormData);
      displayUpdateResult(editFormData.name);
      setEditingItem(null);
      setEditFormData({});
      await Promise.all([loadFleetData(), loadAvailableFilters()]);
    } catch (error) {
      showErrorNotification("Update Failed", `Gagal memperbarui data: ${error.message}`);
    }
  }, [editingItem, editFormData]);

  const handleDelete = useCallback((item) => {
    setDeleteTarget({ type: 'single', id: item._id, name: item.name });
    setShowDeleteConfirm(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedItems.size === 0) {
      showErrorNotification("Selection Error", "Pilih minimal satu item untuk dihapus");
      return;
    }
    setDeleteTarget({ type: 'multiple', ids: Array.from(selectedItems), count: selectedItems.size });
    setShowDeleteConfirm(true);
  }, [selectedItems]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single') {
        await deleteFleetData(deleteTarget.id);
        displayDeleteResult(1, false);
      } else {
        await deleteMultipleFleetData(deleteTarget.ids);
        displayDeleteResult(deleteTarget.count, true);
        setSelectedItems(new Set());
      }
      await Promise.all([loadFleetData(), loadAvailableFilters()]);
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
        status: filters.status,
        project: filters.project,
        type: filters.type
      };

      const result = await getFleetData(params);
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

  const loadFleetData = useCallback(async () => {
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
        status: filters.status,
        project: filters.project,
        type: filters.type
      };

      const result = await getFleetData(params);

      setFleetData(result.data || []);
      setTotalRecords(result.total || 0);
      setTotalPages(result.totalPages || 0);
      setHasMore(result.hasMore || false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading fleet data:', error);
        showErrorNotification("Data Load Failed", `Gagal memuat data fleet: ${error.message}`);
      }
    } finally {
      setIsLoadingData(false);
      abortControllerRef.current = null;
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig, filters]);

  const loadAvailableFilters = useCallback(async () => {
    try {
      const result = await getFleetFilters();
      setAvailableFilters({
        statuses: result.statuses || [],
        projects: result.projects || [],
        types: result.types || [],
        statistics: result.statistics || { total: 0, active: 0, inactive: 0 }
      });
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  }, []);

  useEffect(() => {
    loadFleetData();
  }, [loadFleetData]);

  useEffect(() => {
    loadAvailableFilters();
  }, [loadAvailableFilters]);

  useEffect(() => {
    if (totalRecords > 0) {
      loadAllItemIds();
    }
  }, [totalRecords, debouncedSearchTerm, sortConfig, filters, loadAllItemIds]);

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
    setFilters({ status: '', project: '', type: '' });
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

  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-300 bg-white">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} dari {totalRecords} data
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Per halaman:</span>
            <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))} className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Sebelumnya
          </button>

          {getPageNumbers().map((page, index) => (
            <button key={index} onClick={() => typeof page === 'number' ? handlePageChange(page) : null} disabled={page === '...'} className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${page === currentPage ? 'bg-blue-500 text-white border-blue-500' : page === '...' ? 'cursor-default' : 'hover:bg-gray-50'}`}>
              {page}
            </button>
          ))}

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Selanjutnya
          </button>
        </div>
      </div>
    );
  }, [currentPage, totalPages, itemsPerPage, totalRecords, handlePageChange, handleItemsPerPageChange]);

  const TabButton = memo(({ id, label, icon, isActive, onClick }) => (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
      {icon}
      {label}
    </button>
  ));

  const currentPageIds = useMemo(() => fleetData.map(item => item._id), [fleetData]);

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
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <DuplicateModal 
        isOpen={showDuplicateModal} 
        duplicates={duplicateData} 
        onClose={handleCloseDuplicateModal}
        onDownload={handleDownloadDuplicateReport}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={28} />
              Fleet Management System
            </h2>
            <p className="text-gray-600">Upload dan kelola data fleet dari file Excel</p>
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
          <TabButton id="upload" label="Upload & Manage Fleet" icon={<Upload size={18} />} isActive={activeTab === 'upload'} onClick={setActiveTab} />
          <TabButton id="corefm" label="CoreFM Dashboard" icon={<Database size={18} />} isActive={activeTab === 'corefm'} onClick={setActiveTab} />
        </div>
      </div>

      <ConfirmationModal isOpen={showDeleteConfirm} title="Konfirmasi Penghapusan" message={deleteTarget?.type === 'single' ? `Apakah Anda yakin ingin menghapus data "${deleteTarget.name}"?` : `Apakah Anda yakin ingin menghapus ${deleteTarget?.count} data terpilih?`} onConfirm={confirmDelete} onCancel={cancelDelete} confirmText="Ya, Hapus" cancelText="Batal" isLoading={isDeleting} />

      {activeTab === 'corefm' && (
        <div className="mb-6">
          <CoreFM />
        </div>
      )}

      {activeTab === 'upload' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Upload File Excel Fleet</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={isFileUploading || isUploading} />
                <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${isFileUploading || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="text-blue-500" size={48} />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {isFileUploading ? 'Memproses File...' : 'Pilih File Excel Fleet'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Klik untuk memilih file .xlsx atau .xls</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Statistik Fleet</h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <button onClick={loadFleetData} disabled={isLoadingData} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm">
                    {isLoadingData ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    Refresh
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">Total Unit</span>
                  <span className="text-xl font-bold text-blue-600">{availableFilters.statistics.total}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Unit Aktif</span>
                  <span className="text-xl font-bold text-green-600">{availableFilters.statistics.active}</span>
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
                <h3 className="text-lg font-semibold text-gray-800">Preview Data ({extractedData.length - 1} baris)</h3>
                <p className="text-sm text-gray-600">Menampilkan maksimal 5 baris pertama</p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <tbody>
                    {extractedData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 border-b border-gray-200 whitespace-nowrap text-xs">
                            {cell || '-'}
                          </td>
                        ))}
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

          <BulkActionBar selectedItems={Array.from(selectedItems)} onBulkDelete={handleBulkDelete} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} totalItems={totalRecords} />

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold">Data Fleet ({totalRecords} records)</h2>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input ref={searchInputRef} type="text" placeholder="Cari nama, nomor kendaraan, status, project, type..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters} />
                  {searchTerm && !shouldDisableFilters && (
                    <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters}>
                  <option value="">Semua Status</option>
                  {availableFilters.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select value={filters.project} onChange={(e) => handleFilterChange('project', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters}>
                  <option value="">Semua Project</option>
                  {availableFilters.projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>

                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={shouldDisableFilters}>
                  <option value="">Semua Type</option>
                  {availableFilters.types.map(type => (
                    <option key={type} value={type}>{type}</option>
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
              ) : fleetData.length > 0 ? (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input type="checkbox" checked={isAllCurrentSelected} ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate;
                          }} onChange={(e) => handleMasterCheckbox(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </th>
                        <th className="w-20 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                        {[
                          { key: 'name', label: 'Nama', width: 'w-40' },
                          { key: 'phoneNumber', label: 'No Telepon', width: 'w-32' },
                          { key: 'status', label: 'Status', width: 'w-24' },
                          { key: 'molis', label: 'Molis', width: 'w-28' },
                          { key: 'deductionAmount', label: 'Deduction Amount', width: 'w-36' },
                          { key: 'project', label: 'Project', width: 'w-32' },
                          { key: 'distribusi', label: 'Distribusi', width: 'w-32' },
                          { key: 'rushHour', label: 'Rush Hour', width: 'w-32' },
                          { key: 'vehNumb', label: 'Veh. Numb', width: 'w-28' },
                          { key: 'type', label: 'Type', width: 'w-32' },
                          { key: 'notes', label: 'Notes', width: 'w-40' }
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
                      {fleetData.map((item) => (
                        <FleetRow key={item._id} item={item} isSelected={selectedItems.has(item._id)} onSelect={handleSelectItem} editingItem={editingItem} editFormData={editFormData} onStartEdit={handleEdit} onEditChange={handleEditChange} onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit} onDelete={handleDelete} />
                      ))}
                    </tbody>
                  </table>
                  {renderPagination()}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm || filters.status || filters.project || filters.type ? 'Tidak ada data yang sesuai dengan filter' : 'Belum ada data fleet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filters.status || filters.project || filters.type ? 'Coba ubah atau hapus filter pencarian' : 'Upload file Excel untuk melihat data fleet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}