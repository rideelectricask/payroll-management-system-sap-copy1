import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { fetchShipmentDataByYear, apiCall } from "../services/api";
import FileUpload from "../components/FileUpload";
import { parseMitraExcelFile, validateExcelStructure } from "../utils/parseShipmentExcel";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";
import PaginationComponent from "../components/PaginationComponent";
import { downloadMitraTemplate } from "../services/templateService";
import { showSuccessNotification, showErrorNotification } from "../utils/notificationService";
import { Download, Loader2, Trash2, Edit2, X, Save, AlertCircle, FileDown, Database, ChevronUp, ChevronDown, Search, Filter, TrendingUp, Users, Calendar, Briefcase, RefreshCw, BarChart3 } from "lucide-react";
import * as XLSX from 'xlsx';
import ProjectAnalysis from '../components/ProjectAnalysis';
import MitraAnalysis from '../components/MitraAnalysis';

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

const BulkActionBar = memo(({ selectedItems, onBulkDelete, onSelectAll, onDeselectAll, totalItems }) => {
  if (selectedItems.length <= 1) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-blue-900 text-sm">{selectedItems.length} items selected</span>
          <div className="flex gap-2">
            <button onClick={onSelectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
              Select All ({totalItems})
            </button>
            <button onClick={onDeselectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
              Deselect All
            </button>
          </div>
        </div>
        <button onClick={onBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm">
          <Trash2 size={16} />
          Delete Selected
        </button>
      </div>
    </div>
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
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
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
            <input type="text" value={localValue} onChange={handleChange} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <div className="flex gap-1">
              <button onClick={onSave} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Save">
                <Save size={16} />
              </button>
              <button onClick={onCancel} className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors" title="Cancel">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <input type="text" value={localValue} onChange={handleChange} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        )}
      </td>
    );
  }

  return (
    <td className={className} onDoubleClick={() => onStartEdit(item)}>
      <div className="truncate" title={value || '-'}>{value || '-'}</div>
    </td>
  );
});

const ShipmentRow = memo(({ item, isSelected, onSelect, editingItem, editFormData, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete }) => {
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
    { key: 'client_name', width: 'px-4 py-4 text-sm' },
    { key: 'project_name', width: 'px-4 py-4 text-sm' },
    { key: 'hub', width: 'px-4 py-4 text-sm' },
    { key: 'mitra_name', width: 'px-4 py-4 text-sm' },
    { key: 'delivery_date', width: 'px-4 py-4 text-sm' },
    { key: 'order_code', width: 'px-4 py-4 text-sm' },
    { key: 'vehicle_type', width: 'px-4 py-4 text-sm' },
    { key: 'sla', width: 'px-4 py-4 text-sm' },
    { key: 'weekly', width: 'px-4 py-4 text-sm' }
  ];

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
      <td className="px-4 py-4 text-sm text-center w-16">
        <input type="checkbox" checked={isSelected} onChange={handleCheckboxChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      </td>
      <td className="px-4 py-4 text-sm text-center w-24">
        <div className="flex gap-1 justify-center">
          <button onClick={handleStartEdit} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={handleDelete} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
      {columns.map((col, colIndex) => (
        <EditableCell 
          key={col.key} 
          item={item} 
          field={col.key} 
          value={isEditing ? editFormData[col.key] : item[col.key]} 
          isEditing={isEditing} 
          editingId={editingItem} 
          onStartEdit={handleStartEdit} 
          onChange={onEditChange} 
          onSave={onSaveEdit} 
          onCancel={onCancelEdit} 
          className={`${col.width} text-gray-900`} 
          isLastCell={colIndex === columns.length - 1} 
        />
      ))}
    </tr>
  );
});

export default function ShipmentPerformance() {
  const [state, setState] = useState({
    data: [],
    error: "",
    success: "",
    isLoading: false,
    isUploading: false,
    uploadProgress: 0,
    searchTerm: "",
    currentPage: 1,
    itemsPerPage: 25,
    isDownloadingTemplate: false,
    isExporting: false,
    loadProgress: { current: 0, total: 0, loaded: 0, totalRecords: 0, percentage: 0 }
  });

  const [sortConfig, setSortConfig] = useState({ key: 'client_name', direction: 'asc' });
  const [previewSort, setPreviewSort] = useState({ field: null, direction: 'asc' });
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showMitraAnalysis, setShowMitraAnalysis] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState([]);
  const [yearDataCache, setYearDataCache] = useState({});
  const [isLoadingYear, setIsLoadingYear] = useState(false);

  const debouncedSearchTerm = useDebounce(state.searchTerm, 500);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const allShipments = useMemo(() => {
    return yearDataCache[selectedYear] || [];
  }, [yearDataCache, selectedYear]);

  const hasData = useMemo(() => {
    return allShipments && allShipments.length > 0;
  }, [allShipments]);

  const shouldDisableFilters = useMemo(() => {
    return state.isLoading || isLoadingYear || !hasData;
  }, [state.isLoading, isLoadingYear, hasData]);

  const filterFields = useMemo(() => [
    { key: 'client_name', label: 'Client Name' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'hub', label: 'Hub' },
    { key: 'vehicle_type', label: 'Vehicle Type' },
    { key: 'sla', label: 'SLA' },
    { key: 'weekly', label: 'Weekly' }
  ], []);

  const extractYearFromDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return parts[2];
    }
    return null;
  };

  const loadAvailableYears = useCallback(async () => {
    try {
      console.log('Loading available years from API...');
      const years = await apiCall('/shipment/years', {
        timeout: 30000,
        headers: { 'Cache-Control': 'no-cache' }
      });

      const yearsList = years?.data || [];
      
      if (yearsList.length > 0) {
        setAvailableYears(yearsList);
        console.log(`Available years loaded: ${yearsList.join(', ')}`);
        
        if (!yearsList.includes(parseInt(selectedYear))) {
          const latestYear = yearsList[0];
          setSelectedYear(latestYear.toString());
          console.log(`Selected year reset to: ${latestYear}`);
        }
      } else {
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
        setSelectedYear(currentYear.toString());
        console.log(`No years found in data, using current year: ${currentYear}`);
      }
    } catch (error) {
      console.error('Failed to load available years:', error);
      const currentYear = new Date().getFullYear();
      setAvailableYears([currentYear]);
      setSelectedYear(currentYear.toString());
    }
  }, [selectedYear]);

  const loadAvailableFilters = useCallback(() => {
    if (!allShipments || allShipments.length === 0) return {};

    const filters = {};

    filterFields.forEach(filterField => {
      const uniqueValues = [...new Set(
        allShipments
          .map(record => record[filterField.key])
          .filter(value => value && value.toString().trim() && value !== '-')
      )].sort();

      if (uniqueValues.length > 0 && uniqueValues.length < 100) {
        filters[filterField.key] = uniqueValues;
      }
    });

    setAvailableFilters(filters);
  }, [allShipments, filterFields]);

  useEffect(() => {
    loadAvailableFilters();
  }, [loadAvailableFilters]);

  const filteredAndSortedShipments = useMemo(() => {
    let filtered = allShipments.filter(shipment =>
      Object.values(shipment).some(value =>
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

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

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
  }, [allShipments, debouncedSearchTerm, sortConfig, filters]);

  const statistics = useMemo(() => {
    if (!allShipments || allShipments.length === 0) {
      return {
        total: 0,
        filtered: 0,
        uniqueClients: 0,
        uniqueProjects: 0,
        uniqueHubs: 0,
        uniqueMitras: 0,
        uniqueWeeks: 0
      };
    }

    const records = allShipments;
    const total = records.length;

    const uniqueClients = new Set(
      records.map(record => record.client_name).filter(client => client && client !== '-')
    ).size;

    const uniqueProjects = new Set(
      records.map(record => record.project_name).filter(project => project && project !== '-')
    ).size;

    const uniqueHubs = new Set(
      records.map(record => record.hub).filter(hub => hub && hub !== '-')
    ).size;

    const uniqueMitras = new Set(
      records.map(record => record.mitra_name).filter(mitra => mitra && mitra !== '-')
    ).size;

    const uniqueWeeks = new Set(
      records.map(record => record.weekly).filter(week => week && week !== '-')
    ).size;

    return {
      total,
      filtered: total,
      uniqueClients,
      uniqueProjects,
      uniqueHubs,
      uniqueMitras,
      uniqueWeeks
    };
  }, [allShipments]);

  const currentStatistics = useMemo(() => ({
    ...statistics,
    filtered: filteredAndSortedShipments.length
  }), [statistics, filteredAndSortedShipments.length]);

  const paginatedShipments = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    return filteredAndSortedShipments.slice(startIndex, startIndex + state.itemsPerPage);
  }, [filteredAndSortedShipments, state.currentPage, state.itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedShipments.length / state.itemsPerPage);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      updateState({ error: "", success: "" });
    }, 5000);
  }, [updateState]);

  const handleDownloadTemplate = useCallback(async () => {
    updateState({ isDownloadingTemplate: true });
    try {
      const result = downloadMitraTemplate();
      showSuccessNotification("Template Downloaded", result.message);
    } catch (error) {
      showErrorNotification("Download Failed", error.message);
    } finally {
      updateState({ isDownloadingTemplate: false });
    }
  }, [updateState]);

  const handleExportData = useCallback(async () => {
    updateState({ isExporting: true });
    try {
      const dataToExport = filteredAndSortedShipments.map(shipment => ({
        'Client Name': shipment.client_name || '',
        'Project Name': shipment.project_name || '',
        'Delivery Date': shipment.delivery_date || '',
        'Drop Point': shipment.drop_point || '',
        'Hub': shipment.hub || '',
        'Order Code': shipment.order_code || '',
        'Weight': shipment.weight || '',
        'Distance KM': shipment.distance_km || '',
        'Mitra Code': shipment.mitra_code || '',
        'Mitra Name': shipment.mitra_name || '',
        'Receiving Date': shipment.receiving_date || '',
        'Vehicle Type': shipment.vehicle_type || '',
        'Cost': shipment.cost || '',
        'SLA': shipment.sla || '',
        'Weekly': shipment.weekly || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Shipment Data');

      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
        { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Shipment_Data_Export_${timestamp}.xlsx`);

      showSuccessNotification("Export Success", `Successfully exported ${dataToExport.length} shipment records`);
    } catch (error) {
      showErrorNotification("Export Failed", error.message);
    } finally {
      updateState({ isExporting: false });
    }
  }, [filteredAndSortedShipments, updateState]);

  const fetchYearData = useCallback(async (year) => {
    if (yearDataCache[year]) {
      console.log(`Using cached data for year ${year}`);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoadingYear(true);
      console.log(`Fetching shipment data for year ${year}...`);
      
      const shipmentsData = await fetchShipmentDataByYear(year, (progress) => {
        updateState({ loadProgress: progress });
      });
      
      setYearDataCache(prev => ({
        ...prev,
        [year]: shipmentsData || []
      }));
      
      console.log(`Loaded ${shipmentsData?.length || 0} shipment records for year ${year}`);
      
      updateState({ 
        success: `Loaded ${shipmentsData?.length || 0} shipment records for year ${year}`,
        loadProgress: { current: 0, total: 0, loaded: 0, totalRecords: 0, percentage: 0 }
      });
      clearMessages();
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateState({ 
          error: `Failed to load shipment data for year ${year}: ${err.message}`,
          loadProgress: { current: 0, total: 0, loaded: 0, totalRecords: 0, percentage: 0 }
        });
        clearMessages();
      }
    } finally {
      setIsLoadingYear(false);
      abortControllerRef.current = null;
    }
  }, [yearDataCache, updateState, clearMessages]);

  const handleRefreshData = useCallback(() => {
    setYearDataCache({});
    fetchYearData(selectedYear);
  }, [selectedYear, fetchYearData]);

  useEffect(() => {
    loadAvailableYears();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedYear && availableYears.length > 0) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, availableYears.length, fetchYearData]);

  const handleYearChange = useCallback((year) => {
    setSelectedYear(year);
    updateState({ currentPage: 1 });
  }, [updateState]);

  const handleFileUpload = useCallback(async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    e.target.value = null;

    updateState({ error: "", success: "", data: [] });

    if (!file) {
      updateState({ error: "No file selected." });
      clearMessages();
      return;
    }

    try {
      updateState({ isLoading: true });

      const structureInfo = await validateExcelStructure(file);
      if (!structureInfo.isValid) {
        throw new Error(`Invalid Excel file: ${structureInfo.errors.join(', ')}`);
      }

      const parsedData = await parseMitraExcelFile(file);

      updateState({ 
        data: parsedData, 
        isLoading: false,
        success: `Successfully parsed ${parsedData.length} shipment records from Excel file`
      });

      clearMessages();
    } catch (err) {
      updateState({ 
        error: `File parsing failed: ${err.message}`, 
        isLoading: false 
      });
      clearMessages();
    }
  }, [updateState, clearMessages]);

  const handleUploadToServer = useCallback(async () => {
    if (!state.data.length) {
      updateState({ error: "No data to upload" });
      clearMessages();
      return;
    }

    let progressInterval;

    try {
      updateState({ isUploading: true, uploadProgress: 0, error: "", success: "" });

      progressInterval = setInterval(() => {
        updateState(prev => ({
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      const response = await apiCall('/shipment/upload', {
        method: 'POST',
        data: state.data,
        timeout: 30000
      });

      if (progressInterval) clearInterval(progressInterval);

      updateState({
        isUploading: false,
        uploadProgress: 100,
        success: `${response.message || 'Data uploaded successfully'}. ${state.data.length} records saved.`,
        data: []
      });

      setTimeout(() => {
        setYearDataCache({});
        fetchYearData(selectedYear);
      }, 1000);
      
      clearMessages();
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);

      updateState({
        isUploading: false,
        uploadProgress: 0,
        error: `Upload failed: ${err.message}`
      });
      clearMessages();
    }
  }, [state.data, updateState, clearMessages, selectedYear, fetchYearData]);

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
      await apiCall(`/shipment/data/${editingItem}`, {
        method: 'PUT',
        data: editFormData
      });

      showSuccessNotification("Update Success", `Shipment "${editFormData.mitra_name}" updated successfully`);
      setEditingItem(null);
      setEditFormData({});
      
      setYearDataCache({});
      await fetchYearData(selectedYear);
    } catch (error) {
      showErrorNotification("Update Failed", `Failed to update shipment: ${error.message}`);
    }
  }, [editingItem, editFormData, selectedYear, fetchYearData]);

  const handleDelete = useCallback((item) => {
    setDeleteTarget({ type: 'single', id: item._id, name: item.mitra_name });
    setShowDeleteConfirm(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedItems.size === 0) {
      showErrorNotification("Selection Error", "Select at least one item to delete");
      return;
    }
    setDeleteTarget({ type: 'multiple', ids: Array.from(selectedItems), count: selectedItems.size });
    setShowDeleteConfirm(true);
  }, [selectedItems]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single') {
        await apiCall(`/shipment/data/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        showSuccessNotification("Delete Success", `Shipment "${deleteTarget.name}" deleted successfully`);
      } else {
        await apiCall('/shipment/data/bulk-delete', {
          method: 'DELETE',
          data: { ids: deleteTarget.ids }
        });
        showSuccessNotification("Delete Success", `Successfully deleted ${deleteTarget.count} shipments`);
        setSelectedItems(new Set());
      }
      
      setYearDataCache({});
      await fetchYearData(selectedYear);
    } catch (error) {
      showErrorNotification("Delete Failed", `Failed to delete shipment(s): ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, selectedYear, fetchYearData]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(new Set(filteredAndSortedShipments.map(d => d._id)));
  }, [filteredAndSortedShipments]);

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

  const clearAllFilters = useCallback(() => {
    updateState({ searchTerm: '' });
    setFilters({});
    setSortConfig({ key: 'client_name', direction: 'asc' });
    updateState({ currentPage: 1 });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [updateState]);

  const getSortIcon = useCallback((column) => {
    if (sortConfig.key !== column) {
      return null;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  }, [sortConfig]);

  const handlePageChange = useCallback((page) => {
    updateState({ currentPage: page });
  }, [updateState]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    updateState({ itemsPerPage: newItemsPerPage, currentPage: 1 });
  }, [updateState]);

  const handlePreviewSort = useCallback((field) => {
    setPreviewSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedPreviewData = useMemo(() => {
    if (!state.data.length || !previewSort.field) return state.data;

    const sorted = [...state.data].sort((a, b) => {
      const aVal = a[previewSort.field];
      const bVal = b[previewSort.field];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return previewSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      return previewSort.direction === 'asc'
        ? aStr.localeCompare(bStr, 'id-ID', { numeric: true, sensitivity: 'base' })
        : bStr.localeCompare(aStr, 'id-ID', { numeric: true, sensitivity: 'base' });
    });

    return sorted;
  }, [state.data, previewSort]);

  const currentPageIds = useMemo(() => {
    return paginatedShipments.map(item => item._id);
  }, [paginatedShipments]);

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

  const handleOpenProjectAnalysis = useCallback(() => {
    const allCachedData = Object.values(yearDataCache).flat();
    if (allCachedData.length === 0) {
      showErrorNotification("No Data", "Please load shipment data first");
      return;
    }
    setShowProjectAnalysis(true);
  }, [yearDataCache]);

  const handleCloseProjectAnalysis = useCallback(() => {
    setShowProjectAnalysis(false);
  }, []);

  const handleOpenMitraAnalysis = useCallback(() => {
    const allCachedData = Object.values(yearDataCache).flat();
    if (allCachedData.length === 0) {
      showErrorNotification("No Data", "Please load shipment data first");
      return;
    }
    setShowMitraAnalysis(true);
  }, [yearDataCache]);

  const handleCloseMitraAnalysis = useCallback(() => {
    setShowMitraAnalysis(false);
  }, []);

  const tableHeaders = [
    { key: 'client_name', label: 'Client Name' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'hub', label: 'Hub' },
    { key: 'mitra_name', label: 'Mitra Name' },
    { key: 'delivery_date', label: 'Delivery Date' },
    { key: 'order_code', label: 'Order Code' },
    { key: 'vehicle_type', label: 'Vehicle Type' },
    { key: 'sla', label: 'SLA' },
    { key: 'weekly', label: 'Weekly' }
  ];

  const allCachedShipments = useMemo(() => {
    return Object.values(yearDataCache).flat();
  }, [yearDataCache]);

  if (showProjectAnalysis) {
    return <ProjectAnalysis mitraData={allCachedShipments} onBack={handleCloseProjectAnalysis} />;
  }

  if (showMitraAnalysis) {
    return <MitraAnalysis mitraData={allCachedShipments} onBack={handleCloseMitraAnalysis} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <ConfirmationModal 
        isOpen={showDeleteConfirm} 
        title="Confirm Delete" 
        message={deleteTarget?.type === 'single' 
          ? `Are you sure you want to delete shipment "${deleteTarget.name}"?` 
          : `Are you sure you want to delete ${deleteTarget?.count} selected shipments?`
        } 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
        confirmText="Yes, Delete" 
        cancelText="Cancel" 
        isLoading={isDeleting} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Shipment Performance Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage and analyze shipment performance data</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenProjectAnalysis} 
            disabled={allCachedShipments.length === 0} 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            <BarChart3 size={16} />
            Project Analysis
          </button>
          <button 
            onClick={handleOpenMitraAnalysis} 
            disabled={allCachedShipments.length === 0} 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            <Users size={16} />
            Mitra Analysis
          </button>
          <button 
            onClick={handleRefreshData} 
            disabled={isLoadingYear} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            {isLoadingYear ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh Data
          </button>
          <button 
            onClick={handleExportData} 
            disabled={state.isExporting || allShipments.length === 0} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            {state.isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
            Export Data
          </button>
          <button 
            onClick={handleDownloadTemplate} 
            disabled={state.isDownloadingTemplate} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
          >
            {state.isDownloadingTemplate ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Template
          </button>
        </div>
      </div>

      {isLoadingYear && state.loadProgress.totalRecords > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between text-sm text-blue-700 mb-2">
            <span>Loading shipment data... Page {state.loadProgress.current} of {state.loadProgress.total}</span>
            <span>{state.loadProgress.loaded.toLocaleString()} / {state.loadProgress.totalRecords.toLocaleString()} records ({state.loadProgress.percentage}%)</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${state.loadProgress.percentage}%` }}></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Shipments</p>
              <p className="text-2xl font-bold text-blue-600">
                {isLoadingYear ? '0' : currentStatistics.total.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Filtered</p>
              <p className="text-2xl font-bold text-green-600">
                {isLoadingYear ? '0' : currentStatistics.filtered.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Unique Mitras</p>
              <p className="text-2xl font-bold text-purple-600">
                {isLoadingYear ? '0' : currentStatistics.uniqueMitras.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Clients</p>
              <p className="text-2xl font-bold text-orange-600">
                {isLoadingYear ? '0' : currentStatistics.uniqueClients.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border-gray-300 border p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Shipment Data</h2>
        <FileUpload onFileSelect={handleFileUpload} isLoading={state.isLoading} accept=".xlsx,.xls" />

        {state.isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading data...</span>
              <span>{state.uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${state.uploadProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {state.error && <ErrorAlert message={state.error} />}
      {state.success && <SuccessAlert message={state.success} />}

      {state.data.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Preview Data ({state.data.length} baris)</h3>
            <p className="text-sm text-gray-600">Menampilkan maksimal 5 baris pertama. Klik header untuk mengurutkan data.</p>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handlePreviewSort(key)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {previewSort.field === key && (
                          previewSort.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPreviewData.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-100">
                    {tableHeaders.map(({ key }) => (
                      <td key={key} className="px-4 py-3 text-xs whitespace-nowrap">
                        <div className="max-w-xs truncate" title={row[key] || '-'}>
                          {row[key] || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.data.length > 5 && (
            <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t border-gray-200">
              ... dan {state.data.length - 5} baris lainnya
            </div>
          )}

          <div className="bg-white px-4 py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleUploadToServer}
              disabled={state.isUploading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {state.isUploading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
              {state.isUploading ? 'Mengupload...' : 'Upload ke Database'}
            </button>
          </div>
        </div>
      )}

      {isLoadingYear && !state.loadProgress.totalRecords && <LoadingSpinner message="Processing data..." />}

      <BulkActionBar 
        selectedItems={Array.from(selectedItems)} 
        onBulkDelete={handleBulkDelete} 
        onSelectAll={handleSelectAll} 
        onDeselectAll={handleDeselectAll} 
        totalItems={filteredAndSortedShipments.length} 
      />

      <div className="bg-white rounded-lg shadow-sm border-gray-300 border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search client, project, hub, mitra name..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                disabled={shouldDisableFilters}
              />
              {state.searchTerm && !shouldDisableFilters && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-w-[140px]"
              disabled={isLoadingYear}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {filterFields.map((filterField) => {
              const options = availableFilters[filterField.key] || [];

              return (
                <select
                  key={filterField.key}
                  value={filters[filterField.key] || ''}
                  onChange={(e) => handleFilterChange(filterField.key, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-w-[140px]"
                  disabled={shouldDisableFilters}
                >
                  <option value="">All {filterField.label}</option>
                  {options.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              );
            })}

            <button
              onClick={clearAllFilters}
              disabled={shouldDisableFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              <Filter size={16} />
              Clear Filters
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
            <span>
              Showing {isLoadingYear ? '0' : currentStatistics.filtered.toLocaleString()} of {isLoadingYear ? '0' : currentStatistics.total.toLocaleString()} records
            </span>
            {!isLoadingYear && currentStatistics.filtered !== currentStatistics.total && (
              <span className="text-blue-600 font-medium">Filtered</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoadingYear ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    <input 
                      type="checkbox" 
                      checked={isAllCurrentSelected} 
                      ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} 
                      onChange={(e) => handleMasterCheckbox(e.target.checked)} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                  {tableHeaders.map(({ key, label }) => (
                    <th 
                      key={key} 
                      onClick={() => handleSort(key)} 
                      className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>{label}</span>
                        {getSortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedShipments.map((shipment) => (
                  <ShipmentRow 
                    key={shipment._id} 
                    item={shipment} 
                    isSelected={selectedItems.has(shipment._id)} 
                    onSelect={handleSelectItem} 
                    editingItem={editingItem} 
                    editFormData={editFormData} 
                    onStartEdit={handleEdit} 
                    onEditChange={handleEditChange} 
                    onSaveEdit={handleSaveEdit} 
                    onCancelEdit={handleCancelEdit} 
                    onDelete={handleDelete} 
                  />
                ))}
                {paginatedShipments.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      {state.searchTerm ? 'No shipments found matching your search.' : 'No shipment data available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!isLoadingYear && (
          <PaginationComponent
            currentPage={state.currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={state.itemsPerPage}
            totalItems={filteredAndSortedShipments.length}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
}