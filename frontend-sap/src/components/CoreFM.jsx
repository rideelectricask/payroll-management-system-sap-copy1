import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, Filter, RefreshCw, SortAsc, SortDesc, Database, FileSpreadsheet, TrendingUp, Users, MapPin, Car, Loader2, Download, Key, CheckCircle, XCircle, Clock } from "lucide-react";
import { getLarkRecords, refreshLarkToken, exportLarkData } from '../services/fleetApi';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import DatePicker from './calendar/Datepicker';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CoreFM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [tokenRefreshLoading, setTokenRefreshLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [resetDatePicker, setResetDatePicker] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const hasData = useMemo(() => {
    return data?.processedData?.data && data.processedData.data.length > 0;
  }, [data?.processedData?.data]);

  const shouldDisableFilters = useMemo(() => {
    return loading || !hasData;
  }, [loading, hasData]);

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await getLarkRecords();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date().toLocaleString('id-ID'));
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Connection error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    setTokenRefreshLoading(true);
    setError(null);

    try {
      const result = await refreshLarkToken();

      if (result.success) {
        console.log('✅ Lark tokens refreshed successfully');
        await loadData();
      } else {
        setError(result.error || 'Failed to refresh tokens');
      }
    } catch (err) {
      setError(`Token refresh failed: ${err.message}`);
    } finally {
      setTokenRefreshLoading(false);
    }
  }, [loadData]);

  const visibleFields = useMemo(() => {
    if (!data?.processedData?.fields) return [];
    return data.processedData.fields.filter(field => field.type !== 'file' && field.key !== 'SN');
  }, [data?.processedData?.fields]);

  const filterFields = useMemo(() => [
    { key: 'MERK UNIT', label: 'Merk Unit' },
    { key: 'PIC PENANGGUNGJAWAB', label: 'PIC' },
    { key: 'KOTA TEMPAT TINGGAL USER', label: 'Kota' },
    { key: 'NAMA PROJECT', label: 'Nama Project' },
    { key: 'STATUS', label: 'Status' }
  ], []);

  const availableFilters = useMemo(() => {
    if (!data?.processedData?.data) return {};

    const filters = {};

    filterFields.forEach(filterField => {
      const uniqueValues = [...new Set(
        data.processedData.data
          .map(record => record[filterField.key])
          .filter(value => value && value.toString().trim() && value !== '-')
      )].sort();

      if (uniqueValues.length > 0 && uniqueValues.length < 100) {
        filters[filterField.key] = uniqueValues;
      }
    });

    return filters;
  }, [data?.processedData?.data, filterFields]);

  const parseDate = (dateString) => {
    if (!dateString) return null;

    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    return new Date(dateString);
  };

  const isDateInRange = (recordDate) => {
    if (!dateRange.startDate || !dateRange.endDate || !recordDate) return true;

    const parsedDate = parseDate(recordDate);
    if (!parsedDate || isNaN(parsedDate.getTime())) return true;

    return parsedDate >= dateRange.startDate && parsedDate <= dateRange.endDate;
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data?.processedData?.data) return [];

    let filteredData = data.processedData.data;

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filteredData = filteredData.filter(record =>
        Object.entries(record).some(([key, value]) => {
          if (key.endsWith('_display') || key === 'record_id') return false;
          const field = data.processedData.fields.find(f => f.key === key);
          if (field && field.type === 'file') return false;
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredData = filteredData.filter(record =>
          record[key] && record[key].toString() === value
        );
      }
    });

    if (dateRange.startDate || dateRange.endDate) {
      filteredData = filteredData.filter(record => {
        const tanggalKeluar = record['TANGGAL KELUAR UNIT'];
        return isDateInRange(tanggalKeluar);
      });
    }

    if (sortConfig.key) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (sortConfig.direction === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
    }

    return filteredData;
  }, [data?.processedData?.data, debouncedSearchTerm, filters, dateRange, sortConfig, data?.processedData?.fields]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      debouncedSearchTerm ||
      Object.values(filters).some(value => value) ||
      dateRange.startDate ||
      dateRange.endDate ||
      sortConfig.key
    );
  }, [debouncedSearchTerm, filters, dateRange, sortConfig]);

  const exportData = useCallback(async () => {
    if (!data?.processedData?.data || data.processedData.data.length === 0) {
      setError('No data available to export');
      return;
    }

    setExportLoading(true);
    setError(null);

    try {
      const exportPayload = {
        data: data.processedData.data,
        fields: data.processedData.fields,
        hasActiveFilters: false
      };

      const blob = await exportLarkData(exportPayload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `corefm_full_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  }, [data?.processedData?.data, data?.processedData?.fields]);

  const statistics = useMemo(() => {
    if (!data?.processedData?.data) {
      return {
        total: 0,
        filtered: 0,
        uniqueUsers: 0,
        uniquePlates: 0,
        uniqueCities: 0,
        uniqueBrands: 0,
        activeRecords: 0,
        inactiveRecords: 0,
        withUsageDays: 0
      };
    }

    const records = data.processedData.data;
    const total = records.length;

    const uniqueUsers = new Set(
      records
        .map(record => record['NAMA LENGKAP USER SESUAI KTP'])
        .filter(name => name && name !== '-')
    ).size;

    const uniquePlates = new Set(
      records
        .map(record => record['NOMOR PLAT'])
        .filter(plate => plate && plate !== '-')
    ).size;

    const uniqueCities = new Set(
      records
        .map(record => record['KOTA TEMPAT TINGGAL USER'])
        .filter(city => city && city !== '-')
    ).size;

    const uniqueBrands = new Set(
      records
        .map(record => record['MERK UNIT'])
        .filter(brand => brand && brand !== '-')
    ).size;

    const activeRecords = records.filter(record => record['STATUS'] === 'ACTIVE').length;
    const inactiveRecords = records.filter(record => record['STATUS'] === 'INACTIVE').length;
    const withUsageDays = records.filter(record => record['LAMA PEMAKAIAN'] && record['LAMA PEMAKAIAN'] !== '').length;

    return {
      total,
      filtered: total,
      uniqueUsers,
      uniquePlates,
      uniqueCities,
      uniqueBrands,
      activeRecords,
      inactiveRecords,
      withUsageDays
    };
  }, [data?.processedData?.data]);

  useEffect(() => {
    loadData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setDateRange({ startDate, endDate });
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setDateRange({ startDate: null, endDate: null });
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
    setResetDatePicker(prev => prev + 1);
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

  const getStatusIcon = useCallback((status) => {
    if (status === 'ACTIVE') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status === 'INACTIVE') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  }, []);

  const getStatusBadge = useCallback((status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          ACTIVE
        </span>
      );
    } else if (status === 'INACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          INACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        -
      </span>
    );
  }, []);

  const getUsageDaysBadge = useCallback((usageDays) => {
    if (!usageDays || usageDays === '') {
      return '-';
    }

    const days = parseInt(usageDays);
    let colorClass = 'bg-blue-100 text-blue-800';

    if (days > 365) {
      colorClass = 'bg-red-100 text-red-800';
    } else if (days > 180) {
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else if (days > 90) {
      colorClass = 'bg-orange-100 text-orange-800';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        <Clock className="w-3 h-3" />
        {usageDays}
      </span>
    );
  }, []);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedData.length / itemsPerPage);
  }, [filteredAndSortedData.length, itemsPerPage]);

  const currentStatistics = useMemo(() => ({
    ...statistics,
    filtered: filteredAndSortedData.length
  }), [statistics, filteredAndSortedData.length]);

  const renderPagination = () => {
    const totalRecords = filteredAndSortedData.length;

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
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
              disabled={page === '...'}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : page === '...'
                  ? 'cursor-default'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">CoreFM Data Management</h1>
            </div>
            <p className="text-gray-600">Fleet & User Analytics Dashboard with Usage Duration Tracking</p>
          </div>
          <div className="text-right">
            <div className="flex gap-2 justify-end">
              <button
                onClick={refreshTokens}
                disabled={tokenRefreshLoading || loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:bg-gray-400 text-sm"
                title="Refresh Lark Access Token"
              >
                {tokenRefreshLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Refresh Token
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 text-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh Data
              </button>
              <button
                onClick={exportData}
                disabled={loading || exportLoading || !hasData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 text-sm"
                title="Export seluruh data dari endpoint Lark"
              >
                {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export Full Data
              </button>
            </div>
            {lastUpdated && (
              <p className="text-gray-500 text-xs mt-2">
                Update: {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '0' : currentStatistics.total.toLocaleString()}
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
              <p className="text-green-700 text-sm font-medium">Active Records</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '0' : currentStatistics.activeRecords.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">Inactive Records</p>
              <p className="text-2xl font-bold text-red-600">
                {loading ? '0' : currentStatistics.inactiveRecords.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-sm font-medium">Usage Tracked</p>
              <p className="text-2xl font-bold text-indigo-600">
                {loading ? '0' : currentStatistics.withUsageDays.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium">Unique Users</p>
              <p className="text-2xl font-bold text-yellow-600">
                {loading ? '0' : currentStatistics.uniqueUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Unique Cities</p>
              <p className="text-2xl font-bold text-purple-600">
                {loading ? '0' : currentStatistics.uniqueCities.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Vehicle Plates</p>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '0' : currentStatistics.uniquePlates.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorAlert 
            message={error} 
            onClose={() => setError(null)}
          />
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari nama, NIK, nomor plat, kota, merk unit..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={shouldDisableFilters}
              />
              {searchTerm && !shouldDisableFilters && (
                <button
                  onClick={() => handleSearchChange('')}
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={shouldDisableFilters}
                >
                  <option value="">Semua {filterField.label}</option>
                  {options.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              );
            })}

            <div className="relative">
              <DatePicker 
                onDateRangeChange={handleDateRangeChange}
                disabled={shouldDisableFilters}
                resetTrigger={resetDatePicker}
              />
            </div>

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
              Menampilkan {loading ? '0' : currentStatistics.filtered.toLocaleString()} dari {loading ? '0' : currentStatistics.total.toLocaleString()} records
            </span>
            {!loading && currentStatistics.filtered !== currentStatistics.total && (
              <span className="text-blue-600 font-medium">Filtered</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : data && data.processedData && data.processedData.data.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleFields.map((field, index) => (
                    <th
                      key={index}
                      className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors min-w-32"
                      onClick={() => handleSort(field.key)}
                    >
                      <div className="flex items-center">
                        <span className="truncate">{field.label}</span>
                        {getSortIcon(field.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((record, index) => {
                  return (
                    <tr key={record.record_id || index} className="hover:bg-gray-50 transition-colors">
                      {visibleFields.map((field, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-4 text-sm text-gray-900 min-w-32"
                        >
                          {field.key === 'STATUS' ? (
                            <div className="flex items-center">
                              {getStatusBadge(record[field.key])}
                            </div>
                          ) : field.key === 'LAMA PEMAKAIAN' ? (
                            <div className="flex items-center">
                              {getUsageDaysBadge(record[field.key])}
                            </div>
                          ) : (
                            <div 
                              className="max-w-xs truncate" 
                              title={record[field.key] || ''}
                            >
                              {record[field.key] || '-'}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">There are no records to display at this time.</p>
            </div>
          )}
        </div>

        {!loading && renderPagination()}
      </div>
    </div>
  );
}