import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";
import PaginationComponent from "../components/PaginationComponent";
import DatePicker from "../components/calendar/Datepicker";
import { showSuccessNotification, showErrorNotification } from "../utils/notificationService";
import { Download, Loader2, SortAsc, SortDesc, Search, Filter, TrendingUp, Users, Calendar, RefreshCw, BarChart3, Database, Edit, Trash2, X, Save, MapPin, Zap, ExternalLink } from "lucide-react";
import MitraStatusDashboard from "../components/MitraStatusDashboard";
import { 
  fetchExtendedDataByDriverId,
  saveExtendedData, 
  deleteExtendedData,
  getBulkMitraExtendedData,
  manualSyncMitraExtended,
  cancelMitraExtendedSync
} from "../services/apiBlitz";

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

const SyncProgressModal = memo(({ isOpen, progress, onCancel, isCancelling }) => {
  if (!isOpen) return null;

  const getStageLabel = (stage) => {
    const stages = {
      'init': 'Initializing',
      'rideblitz_fetch': 'Fetching Rideblitz Data',
      'lark_fetch': 'Fetching Larksuite Data',
      'validation': 'Validating Data',
      'processing': 'Processing Profiles',
      'saving': 'Saving to Database',
      'finalizing': 'Finalizing',
      'complete': 'Complete',
      'cancelled': 'Cancelled'
    };
    return stages[stage] || 'Processing';
  };

  const isCancelled = progress.stage === 'cancelled';
  const isComplete = progress.percentage >= 100 || progress.stage === 'complete';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {isCancelled ? (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
              ) : isComplete ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isCancelled ? 'Sync Cancelled' : isComplete ? 'Sync Complete' : 'Syncing MitraExtended'}
              </h3>
              <p className="text-gray-700 text-sm mb-1">
                {getStageLabel(progress.stage)}
              </p>
              <p className="text-gray-600 text-xs mb-4">
                {progress.message || 'Processing data...'}
              </p>
              {!isCancelled && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              )}
              <div className="mt-3 flex justify-between items-center">
                {!isCancelled && (
                  <p className="text-xs text-gray-600">
                    Progress: {progress.percentage}%
                  </p>
                )}
                {progress.stage === 'saving' && !isCancelled && (
                  <p className="text-xs text-purple-600 font-medium">
                    Saving data...
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            {!isCancelled && !isComplete && (
              <button 
                onClick={onCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Sync'}
              </button>
            )}
            {(isComplete || isCancelled) && (
              <button 
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const ExtendedDataModal = memo(({ isOpen, onClose, driverId, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    remark: '',
    vehicle: '',
    operating_division: '',
    reason: '',
    lark_tanggal_keluar_unit: '',
    lark_nomor_plat: '',
    lark_merk_unit: '',
    lark_tanggal_pengembalian_unit: '',
    date_photo: '',
    doc_photo: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!driverId || !isOpen) return;

      setIsLoadingData(true);
      console.log('📥 Loading data for driver:', driverId);
      console.log('📦 Initial data provided:', initialData);

      try {
        let dataToUse = initialData;

        if (!initialData || Object.keys(initialData).length === 0) {
          console.log('⚠️ No initial data, fetching from API...');
          const fetchedData = await fetchExtendedDataByDriverId(driverId);
          console.log('📡 Fetched data from API:', fetchedData);
          dataToUse = fetchedData?.data || fetchedData || {};
        }

        const formatDateForInput = (dateValue) => {
          if (!dateValue) return '';
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error('Date format error:', error);
            return '';
          }
        };

        const newFormData = {
          remark: dataToUse.remark || '',
          vehicle: dataToUse.vehicle || '',
          operating_division: dataToUse.operating_division || '',
          reason: dataToUse.reason || '',
          lark_tanggal_keluar_unit: dataToUse.lark_tanggal_keluar_unit || '',
          lark_nomor_plat: dataToUse.lark_nomor_plat || '',
          lark_merk_unit: dataToUse.lark_merk_unit || '',
          lark_tanggal_pengembalian_unit: dataToUse.lark_tanggal_pengembalian_unit || '',
          date_photo: formatDateForInput(dataToUse.date_photo),
          doc_photo: dataToUse.doc_photo || ''
        };

        console.log('✅ Form data populated:', newFormData);
        setFormData(newFormData);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        showErrorNotification("Error", "Failed to load data: " + error.message);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [driverId, isOpen, initialData]);

  const handleChange = (field, value) => {
    console.log(`📝 Field changed: ${field} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving data for driver:', driverId);
      console.log('📤 Data to save:', formData);

      const dataToSave = {
        remark: formData.remark,
        vehicle: formData.vehicle,
        operating_division: formData.operating_division,
        reason: formData.reason,
        lark_tanggal_keluar_unit: formData.lark_tanggal_keluar_unit,
        lark_nomor_plat: formData.lark_nomor_plat,
        lark_merk_unit: formData.lark_merk_unit,
        lark_tanggal_pengembalian_unit: formData.lark_tanggal_pengembalian_unit,
        date_photo: formData.date_photo || null,
        doc_photo: formData.doc_photo
      };
      
      const result = await saveExtendedData(driverId, dataToSave);
      console.log('✅ Save result:', result);
      
      showSuccessNotification("Success", "Extended data saved successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error('❌ Save error:', error);
      showErrorNotification("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit Extended Data - Mitra ID: {driverId}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isLoadingData ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">Loading data...</span>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-5 pb-2 border-b border-gray-200">Operational & Vehicle Management</h4>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Owning Company</label>
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={(e) => handleChange('vehicle', e.target.value)}
                      placeholder="Enter company name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Operating Division</label>
                    <input
                      type="text"
                      value={formData.operating_division}
                      onChange={(e) => handleChange('operating_division', e.target.value)}
                      placeholder="e.g., Jakarta Division, Surabaya Division"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lark Merk</label>
                    <input
                      type="text"
                      value={formData.lark_merk_unit}
                      onChange={(e) => handleChange('lark_merk_unit', e.target.value)}
                      placeholder="e.g., Honda Beat, Yamaha NMAX"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lark Plat</label>
                    <input
                      type="text"
                      value={formData.lark_nomor_plat}
                      onChange={(e) => handleChange('lark_nomor_plat', e.target.value)}
                      placeholder="e.g., B 1234 XYZ"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lark Tgl Keluar</label>
                    <input
                      type="text"
                      value={formData.lark_tanggal_keluar_unit}
                      onChange={(e) => handleChange('lark_tanggal_keluar_unit', e.target.value)}
                      placeholder="e.g., 31/10/2025"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lark Tgl Kembali</label>
                    <input
                      type="text"
                      value={formData.lark_tanggal_pengembalian_unit}
                      onChange={(e) => handleChange('lark_tanggal_pengembalian_unit', e.target.value)}
                      placeholder="e.g., 31/12/2025"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Photo</label>
                    <input
                      type="date"
                      value={formData.date_photo}
                      onChange={(e) => handleChange('date_photo', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Doc Photo</label>
                    <input
                      type="text"
                      value={formData.doc_photo}
                      onChange={(e) => handleChange('doc_photo', e.target.value)}
                      placeholder="Enter photo URL or path"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Remark</label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => handleChange('remark', e.target.value)}
                    rows={3}
                    placeholder="Enter additional notes or remarks"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    rows={3}
                    placeholder="Enter reason for exit or termination"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isLoadingData}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isLoadingData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const MitraRow = memo(({ item, onNameClick, onEdit, onDelete, tableHeaders }) => {
  const formatHubBusinessData = (data) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return '-';
    }
    return Object.values(data).join(', ');
  };

  const formatDateOnly = (dateValue) => {
    if (!dateValue) return '-';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '-';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  };

  const renderCellContent = (key) => {
    const value = item[key];

    if (key === 'name') {
      return (
        <button
          onClick={() => onNameClick(item.driver_id)}
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
        >
          {value || '-'}
        </button>
      );
    }

    if (key === 'hub_data') {
      return formatHubBusinessData(item.hub_data);
    }

    if (key === 'business_data') {
      return formatHubBusinessData(item.business_data);
    }

    if (key === 'date_photo') {
      return formatDateOnly(value);
    }

    if (key === 'location') {
      if (item.current_lat && item.current_lon) {
        return (
          <a
            href={`https://www.google.com/maps?q=${item.current_lat},${item.current_lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <MapPin size={14} />
            View Map
          </a>
        );
      }
      return '-';
    }

    if (key === 'doc_photo') {
      if (value && value.trim() !== '') {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink size={14} />
            View Photo
          </a>
        );
      }
      return '-';
    }

    if (key === 'actions') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item.driver_id, item)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Extended Data"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(item.driver_id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Extended Data"
          >
            <Trash2 size={16} />
          </button>
        </div>
      );
    }

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {tableHeaders.map(({ key, section }) => {
        const cellKey = `${item.driver_id}-${key}`;
        
        return (
          <td 
            key={cellKey} 
            className={`px-4 py-3 text-sm whitespace-nowrap min-w-40 ${
              key === 'name' ? 'sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
            } ${
              key === 'actions' ? 'sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
            } ${
              section === 'bank' ? 'bg-cyan-50' :
              section === 'project' ? 'bg-blue-50' : 
              section === 'sewa' ? 'bg-green-50' : 
              section === 'lark' ? 'bg-purple-50' :
              section === 'document' ? 'bg-amber-50' :
              ''
            }`}
          >
            {renderCellContent(key)}
          </td>
        );
      })}
    </tr>
  );
});

export default function MitraPerformance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState({
    data: [],
    mitras: [],
    error: "",
    success: "",
    isLoading: false,
    searchTerm: "",
    currentPage: 1,
    itemsPerPage: 25,
    totalPages: 1,
    totalRecords: 0
  });

  const [sortConfig, setSortConfig] = useState({ key: 'driver_id', direction: 'desc' });
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [currentView, setCurrentView] = useState('main');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [dateResetTrigger, setDateResetTrigger] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditDriver, setCurrentEditDriver] = useState(null);
  const [currentEditData, setCurrentEditData] = useState(null);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 100,
    percentage: 0,
    message: '',
    stage: 'init'
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isOwner = useMemo(() => {
    return user?.role === 'owner';
  }, [user]);

  const hasData = useMemo(() => {
    return state.mitras && state.mitras.length > 0;
  }, [state.mitras]);

  const shouldDisableFilters = useMemo(() => {
    return state.isLoading || !hasData;
  }, [state.isLoading, hasData]);

  const filterFields = useMemo(() => [
    { key: 'status', label: 'Status' },
    { key: 'city', label: 'City' },
    { key: 'attendance', label: 'Attendance' }
  ], []);

  const parseCreatedAtDate = useCallback((dateString) => {
    if (!dateString || dateString === '-') return null;
    
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(AM|PM)/i,
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const year = parseInt(match[3]);
          let hours = parseInt(match[4]);
          const minutes = parseInt(match[5]);
          const ampm = match[6].toUpperCase();
          
          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          return new Date(year, month, day, hours, minutes);
        } else if (pattern === patterns[1]) {
          return new Date(match[1], parseInt(match[2]) - 1, match[3]);
        } else if (pattern === patterns[2]) {
          return new Date(match[3], parseInt(match[2]) - 1, match[1]);
        }
      }
    }

    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }, []);

  const loadAvailableFilters = useCallback(() => {
    if (!state.mitras || state.mitras.length === 0) return {};

    const filters = {};

    filterFields.forEach(filterField => {
      const uniqueValues = [...new Set(
        state.mitras
          .map(record => record[filterField.key])
          .filter(value => value && value.toString().trim() && value !== '-')
      )].sort();

      if (uniqueValues.length > 0 && uniqueValues.length < 100) {
        filters[filterField.key] = uniqueValues;
      }
    });

    setAvailableFilters(filters);
  }, [state.mitras, filterFields]);

  useEffect(() => {
    loadAvailableFilters();
  }, [loadAvailableFilters]);

  const filteredAndSortedMitras = useMemo(() => {
    let filtered = state.mitras.filter(mitra =>
      Object.values(mitra).some(value =>
        String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(record =>
          record[key] && record[key].toString() === value
        );
      }
    });

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(mitra => {
        const createdDate = parseCreatedAtDate(mitra.registered_at);
        if (!createdDate) return false;

        const startOfDay = new Date(dateRange.start);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);

        return createdDate >= startOfDay && createdDate <= endOfDay;
      });
    }

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (sortConfig.key === 'driver_id') {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      return sortConfig.direction === 'asc' 
        ? aStr.localeCompare(bStr, 'id-ID', { numeric: true, sensitivity: 'base' })
        : bStr.localeCompare(aStr, 'id-ID', { numeric: true, sensitivity: 'base' });
    });

    return filtered;
  }, [state.mitras, debouncedSearchTerm, sortConfig, filters, dateRange, parseCreatedAtDate]);

  const statistics = useMemo(() => {
    if (!state.mitras || state.mitras.length === 0) {
      return {
        total: 0,
        filtered: 0,
        activeCount: 0,
        inactiveCount: 0,
        uniqueCities: 0,
        uniqueHubs: 0
      };
    }

    const records = state.mitras;
    const total = records.length;

    const uniqueCities = new Set(
      records
        .map(record => record.city)
        .filter(city => city && city !== '-')
    ).size;

    const uniqueHubs = new Set(
      records
        .flatMap(record => {
          if (record.hub_data && typeof record.hub_data === 'object') {
            return Object.values(record.hub_data);
          }
          return [];
        })
        .filter(hub => hub && hub !== '-')
    ).size;

    const activeCount = records.filter(record => record.status === 'Active').length;
    const inactiveCount = records.filter(record => record.status === 'Inactive').length;

    return {
      total,
      filtered: total,
      activeCount,
      inactiveCount,
      uniqueCities,
      uniqueHubs
    };
  }, [state.mitras]);

  const currentStatistics = useMemo(() => ({
    ...statistics,
    filtered: filteredAndSortedMitras.length
  }), [statistics, filteredAndSortedMitras.length]);

  const paginatedMitras = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    return filteredAndSortedMitras.slice(startIndex, startIndex + state.itemsPerPage);
  }, [filteredAndSortedMitras, state.currentPage, state.itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedMitras.length / state.itemsPerPage);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      updateState({ error: "", success: "" });
    }, 3000);
  }, [updateState]);

  const fetchMitras = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      updateState({ isLoading: true });

      console.log('🔄 Fetching MitraExtended data from database...');

      const startTime = Date.now();
      const result = await getBulkMitraExtendedData(abortControllerRef.current.signal);
      
      if (!result || typeof result !== 'object' || !result.success || !Array.isArray(result.data)) {
        throw new Error('Invalid response from server');
      }

      if (result.data.length === 0) {
        console.warn('⚠️ Server returned empty data array');
        updateState({
          mitras: [],
          totalPages: 1,
          totalRecords: 0,
          error: '',
          isLoading: false
        });
        return;
      }

      const duration = Date.now() - startTime;
      
      console.log(`✅ Loaded ${result.data.length.toLocaleString()} records in ${duration}ms`);

      updateState({
        mitras: result.data,
        totalPages: result.pagination?.totalPages || 1,
        totalRecords: result.pagination?.totalRecords || result.data.length,
        success: `Successfully loaded ${result.data.length.toLocaleString()} mitra records`,
        isLoading: false,
        error: ''
      });

      clearMessages();

    } catch (err) {
      if (err.name === 'AbortError' || err.message.includes('abort') || err.message.includes('cancel')) {
        console.log('⚠️ Fetch aborted by user');
        return;
      }

      console.error('❌ Failed to load mitra data:', err.message);
      
      updateState({
        error: `Failed to load data: ${err.message}`,
        isLoading: false
      });
      
      clearMessages();
    }
  }, [updateState, clearMessages]);

  const handleManualSync = useCallback(async () => {
    if (!isOwner) {
      showErrorNotification("Access Denied", "Only owner role can perform this action");
      return;
    }

    if (isSyncing) {
      showErrorNotification("Warning", "Sync already in progress");
      return;
    }

    if (!window.confirm('This will fetch ALL data from Rideblitz and Larksuite APIs and REPLACE existing database records. This process may take several minutes. Continue?')) {
      return;
    }

    setIsSyncing(true);
    setShowSyncProgress(true);
    setIsCancelling(false);
    
    try {
      setSyncProgress({
        current: 0,
        total: 100,
        percentage: 0,
        message: 'Starting sync process...',
        stage: 'init'
      });

      await manualSyncMitraExtended((progress) => {
        setSyncProgress({
          current: progress.current || progress.percentage || 0,
          total: progress.total || 100,
          percentage: progress.percentage || 0,
          message: progress.message || 'Processing...',
          stage: progress.stage || 'processing'
        });
      });

      showSuccessNotification(
        "Sync Success",
        "MitraExtended data synced successfully"
      );

      setSyncProgress({
        current: 100,
        total: 100,
        percentage: 100,
        message: 'Sync completed! Refreshing data...',
        stage: 'complete'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchMitras();

    } catch (error) {
      console.error('❌ Manual sync error:', error);
      
      if (error.message.includes('cancel')) {
        setSyncProgress({
          current: 0,
          total: 100,
          percentage: 0,
          message: 'Sync cancelled by user',
          stage: 'cancelled'
        });
        showErrorNotification("Sync Cancelled", "Sync process was cancelled");
      } else {
        showErrorNotification("Sync Failed", error.message);
      }
    } finally {
      setIsSyncing(false);
      setIsCancelling(false);
      
      setTimeout(() => {
        setShowSyncProgress(false);
        setSyncProgress({
          current: 0,
          total: 100,
          percentage: 0,
          message: '',
          stage: 'init'
        });
      }, 2000);
    }
  }, [isSyncing, fetchMitras, isOwner]);

  const handleCancelSync = useCallback(async () => {
    if (!isSyncing) return;

    console.log('🛑 User requested IMMEDIATE sync cancellation');
    setIsCancelling(true);
    
    try {
      await cancelMitraExtendedSync();
      console.log('✅ Cancel request sent to server');
      
      setSyncProgress(prev => ({
        ...prev,
        message: 'Cancelling sync...',
        stage: 'cancelled'
      }));
    } catch (error) {
      console.error('❌ Cancel request failed:', error);
      showErrorNotification("Error", "Failed to cancel sync");
    }
  }, [isSyncing]);

  useEffect(() => {
    let isMounted = true;
    const hasExecutedRef = { current: false };
    
    console.log('🚀 Component mounted, starting data fetch...');
    
    const executeFetch = async () => {
      if (hasExecutedRef.current || !isMounted) {
        console.log('⏭️ Skipping duplicate fetch');
        return;
      }
      
      hasExecutedRef.current = true;
      await fetchMitras();
    };
    
    const timeoutId = setTimeout(() => {
      executeFetch();
    }, 100);
    
    return () => {
      console.log('🛑 Component unmounting...');
      isMounted = false;
      clearTimeout(timeoutId);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('⚠️ Fetch aborted due to unmount');
      }
    };
  }, [fetchMitras]);

  const handleSearch = useCallback((searchTerm) => {
    updateState({ searchTerm, currentPage: 1 });
  }, [updateState]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    updateState({ currentPage: 1 });
  }, [updateState]);

  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    updateState({ currentPage: 1 });
  }, [updateState]);

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setDateRange({ start: startDate, end: endDate });
    updateState({ currentPage: 1 });
  }, [updateState]);

  const clearAllFilters = useCallback(() => {
    updateState({ searchTerm: '' });
    setFilters({});
    setSortConfig({ key: 'driver_id', direction: 'desc' });
    setDateRange({ start: null, end: null });
    setDateResetTrigger(prev => prev + 1);
    updateState({ currentPage: 1 });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [updateState]);

  const getSortIcon = useCallback((column) => {
    if (sortConfig.key !== column) {
      return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
      : <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
  }, [sortConfig]);

  const handlePageChange = useCallback((page) => {
    updateState({ currentPage: page });
  }, [updateState]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    updateState({ itemsPerPage: newItemsPerPage, currentPage: 1 });
  }, [updateState]);

  const handleShowStatusDashboard = useCallback(() => {
    setCurrentView('status');
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentView('main');
  }, []);

  const handleNameClick = useCallback((driverId) => {
    if (driverId) {
      navigate(`/driver-management/mitra-account/${driverId}`);
    }
  }, [navigate]);

  const handleEdit = useCallback((driverId, mitraData) => {
    console.log('✏️ Opening edit modal for driver:', driverId);
    console.log('📦 Mitra data:', mitraData);
    
    setCurrentEditDriver(driverId);
    setCurrentEditData(mitraData);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this extended data?')) {
      return;
    }

    try {
      await deleteExtendedData(driverId);
      showSuccessNotification("Success", "Extended data deleted successfully");
      
      setState(prev => ({
        ...prev,
        mitras: prev.mitras.map(m => 
          m.driver_id === driverId 
            ? {
                ...m,
                remark: '',
                vehicle: '',
                operating_division: '',
                reason: '',
                lark_tanggal_keluar_unit: '',
                lark_nomor_plat: '',
                lark_merk_unit: '',
                lark_tanggal_pengembalian_unit: '',
                date_photo: null,
                doc_photo: ''
              }
            : m
        )
      }));
    } catch (error) {
      showErrorNotification("Error", error.message);
    }
  }, []);

  const handleSaveExtendedData = useCallback(async () => {
    const driverId = currentEditDriver;
    if (!driverId) return;

    try {
      console.log('🔄 Refreshing data after save for driver:', driverId);
      
      const updatedData = await fetchExtendedDataByDriverId(driverId);
      console.log('📡 Fetched updated data:', updatedData);
      
      const dataToUpdate = updatedData?.data || updatedData || {};
      
      setState(prev => ({
        ...prev,
        mitras: prev.mitras.map(mitra => 
          mitra.driver_id === driverId
            ? {
                ...mitra,
                ...dataToUpdate
              }
            : mitra
        )
      }));
      
      console.log('✅ State updated successfully');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
      showErrorNotification("Error", `Failed to refresh data: ${error.message}`);
    }
  }, [currentEditDriver]);

  const tableHeaders = [
    { key: 'driver_id', label: 'Mitra ID', section: 'general' },
    { key: 'name', label: "Mitra Name", section: 'general' },
    { key: 'phone_number', label: 'Phone Number', section: 'general' },
    { key: 'city', label: 'City', section: 'general' },
    { key: 'status', label: 'Mitra Status', section: 'general' },
    { key: 'attendance', label: 'Attendance', section: 'general' },
    { key: 'hub_data', label: 'Hub Category', section: 'general' },
    { key: 'business_data', label: 'Business Category', section: 'general' },
    { key: 'last_active', label: 'Last Active', section: 'general' },
    { key: 'registered_at', label: 'Registered At', section: 'general' },
    { key: 'location', label: 'Location', section: 'location' },
    { key: 'bank_name', label: 'Bank Name', section: 'bank' },
    { key: 'bank_account_number', label: 'Account Number', section: 'bank' },
    { key: 'bank_account_holder', label: 'Account Holder', section: 'bank' },
    { key: 'nik', label: 'NIK', section: 'document' },
    { key: 'sim_number', label: 'SIM Number', section: 'document' },
    { key: 'sim_expiry', label: 'SIM Expiry', section: 'document' },
    { key: 'remark', label: 'Remark', section: 'project' },
    { key: 'vehicle', label: 'Owning Company', section: 'project' },
    { key: 'operating_division', label: 'Operating Division', section: 'project' },
    { key: 'lark_tanggal_keluar_unit', label: 'Lark Tgl Keluar', section: 'lark' },
    { key: 'lark_nomor_plat', label: 'Lark Plat', section: 'lark' },
    { key: 'lark_merk_unit', label: 'Lark Merk', section: 'lark' },
    { key: 'lark_alamat', label: 'Lark Alamat', section: 'lark' },
    { key: 'lark_tanggal_pengembalian_unit', label: 'Lark Tgl Kembali', section: 'lark' },
    { key: 'lark_lama_pemakaian', label: 'Lark Lama Pakai', section: 'lark' },
    { key: 'lark_status', label: 'Lark Status', section: 'lark' },
    { key: 'date_photo', label: 'Date Photo', section: 'sewa' },
    { key: 'doc_photo', label: 'Doc Photo', section: 'sewa' },
    { key: 'reason', label: 'Reason', section: 'general' },
    { key: 'actions', label: 'Actions', section: 'general' }
  ];

  if (currentView === 'status') {
    return (
      <MitraStatusDashboard 
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-full mx-auto bg-gray-50 min-h-screen">
      <SyncProgressModal 
        isOpen={showSyncProgress}
        progress={syncProgress}
        onCancel={handleCancelSync}
        isCancelling={isCancelling}
      />

      <ExtendedDataModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setCurrentEditDriver(null);
          setCurrentEditData(null);
        }}
        driverId={currentEditDriver}
        initialData={currentEditData}
        onSave={handleSaveExtendedData}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Mitra Performance Dashboard</h1>
          </div>
          <p className="text-gray-600 text-sm">Manage and analyze mitra performance data</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShowStatusDashboard}
            disabled={state.isLoading || state.mitras.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            <BarChart3 size={16} />
            Mitra Lifecycle Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/driver-management/all-mitra-analytics')}
            disabled={state.isLoading || state.mitras.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            <TrendingUp size={16} />
            Analytics Dashboard
          </button>
          
          {isOwner && (
            <button 
              onClick={handleManualSync}
              disabled={state.isLoading || isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Refresh MitraExtended
            </button>
          )}
          
          <button 
            onClick={fetchMitras} 
            disabled={state.isLoading || isSyncing} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
            title="Refresh data from database"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-xs font-medium mb-1">Total Mitras</p>
              <p className="text-2xl font-bold text-blue-900">
                {state.isLoading ? '0' : currentStatistics.total.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-xs font-medium mb-1">Filtered</p>
              <p className="text-2xl font-bold text-green-600">
                {state.isLoading ? '0' : currentStatistics.filtered.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-xs font-medium mb-1">Active Mitra</p>
              <p className="text-2xl font-bold text-purple-600">
                {state.isLoading ? '0' : currentStatistics.activeCount.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-xs font-medium mb-1">Inactive Mitra</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.isLoading ? '0' : currentStatistics.inactiveCount.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-xs font-medium mb-1">Cities</p>
              <p className="text-2xl font-bold text-orange-600">
                {state.isLoading ? '0' : currentStatistics.uniqueCities.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-xs font-medium mb-1">Hub Categories</p>
              <p className="text-2xl font-bold text-indigo-600">
                {state.isLoading ? '0' : currentStatistics.uniqueHubs.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-200 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-700" />
            </div>
          </div>
        </div>
      </div>

      {state.error && <ErrorAlert message={state.error} />}
      {state.success && <SuccessAlert message={state.success} />}

      {state.isLoading && state.mitras.length === 0 && <LoadingSpinner message="Loading mitra data..." />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search mitra name, phone number, city..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                disabled={shouldDisableFilters}
              />
              {state.searchTerm && !shouldDisableFilters && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {filterFields.map((filterField) => {
              const options = availableFilters[filterField.key] || [];

              return (
                <select
                  key={filterField.key}
                  value={filters[filterField.key] || ''}
                  onChange={(e) => handleFilterChange(filterField.key, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={shouldDisableFilters}
                >
                  <option value="">All {filterField.label}</option>
                  {options.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              );
            })}

            <DatePicker 
              onDateRangeChange={handleDateRangeChange}
              disabled={shouldDisableFilters}
              resetTrigger={dateResetTrigger}
            />

            <button
              onClick={clearAllFilters}
              disabled={shouldDisableFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Filter size={16} />
              Reset Filter
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {state.isLoading ? '0' : currentStatistics.filtered.toLocaleString()} from {state.isLoading ? '0' : currentStatistics.total.toLocaleString()} records
            </span>
            {!state.isLoading && currentStatistics.filtered !== currentStatistics.total && (
              <span className="text-blue-600 font-medium">Filtered</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {state.isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
                <tr>
                  {tableHeaders.map(({ key, label, section }) => (
                    <th 
                      key={key} 
                      onClick={() => key !== 'actions' && handleSort(key)} 
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''
                      } transition-colors select-none min-w-40 whitespace-nowrap border-b border-gray-200 ${
                        section === 'bank' ? 'bg-cyan-50 text-cyan-700' :
                        section === 'project' ? 'bg-blue-50 text-blue-700' : 
                        section === 'sewa' ? 'bg-green-50 text-green-700' : 
                        section === 'lark' ? 'bg-purple-50 text-purple-700' :
                        section === 'document' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-700'
                      } ${key === 'name' ? 'sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''} ${key === 'actions' ? 'sticky right-0 z-20 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                    >
                      <div className="flex items-center">
                        {label}
                        {key !== 'actions' && getSortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedMitras.map((mitra) => (
                  <MitraRow 
                    key={mitra.driver_id} 
                    item={mitra}
                    onNameClick={handleNameClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    tableHeaders={tableHeaders}
                  />
                ))}
                {paginatedMitras.length === 0 && (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-6 py-8 text-center text-gray-500">
                      {state.searchTerm || dateRange.start ? 'No mitras found matching your search.' : 'No mitra data available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!state.isLoading && (
          <PaginationComponent
            currentPage={state.currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={state.itemsPerPage}
            totalItems={filteredAndSortedMitras.length}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
}