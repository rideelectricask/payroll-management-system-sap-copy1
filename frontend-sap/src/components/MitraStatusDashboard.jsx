import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Users, TrendingUp, Calendar, Loader2, AlertCircle, RefreshCw, Download, Maximize2, Minimize2, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PaginationComponent from './PaginationComponent';

const API_BASE_URL = window.REACT_APP_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const STATUS_COLORS = {
  'Active': '#10B981',
  'Driver Training': '#F59E0B',
  'New': '#3B82F6',
  'Pending Verification': '#8B5CF6',
  'Registered': '#6366F1',
  'Inactive': '#EF4444',
  'Banned': '#DC2626',
  'Invalid Documents': '#F97316'
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      </div>
      <div className={`p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-xl`}>
        <Icon size={28} className={`text-${color}-600`} />
      </div>
    </div>
  </div>
);

const StatusCard = ({ status, count, percentage, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
        <span className="text-sm font-semibold text-gray-900">{status}</span>
      </div>
      <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{percentage.toFixed(1)}%</span>
    </div>
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-2xl font-bold text-gray-900">{count}</span>
      <span className="text-xs text-gray-500">mitra</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500 ease-out" 
        style={{ 
          width: `${percentage}%`,
          backgroundColor: color
        }}
      />
    </div>
  </div>
);

const FilterBar = ({ filters, onFilterChange, onClearFilters, availableYears, availableMonths, availableWeeks, isLoading, viewMode }) => {
  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filter Data</h3>
          <button
            onClick={onClearFilters}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <X size={14} />
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.year || ''}
            onChange={(e) => onFilterChange('year', e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filters.month || ''}
            onChange={(e) => onFilterChange('month', e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <option value="">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <select
            value={filters.week || ''}
            onChange={(e) => onFilterChange('week', e.target.value)}
            disabled={isLoading || viewMode === 'monthly'}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <option value="">All Weeks</option>
            {availableWeeks.map(week => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>
        </div>

        {(filters.year || filters.month || filters.week) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Filter size={14} />
            <span>
              Filter aktif: 
              {filters.year && ` Tahun ${filters.year}`}
              {filters.month && `, Bulan ${filters.month}`}
              {filters.week && `, Minggu ${filters.week}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MitraStatusDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'period', direction: 'desc' });
  
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    week: ''
  });

  const availableYears = useMemo(() => {
    if (!dashboardData) return [];
    
    const years = new Set();
    const dataSource = viewMode === 'monthly' ? dashboardData.monthlyData : dashboardData.weeklyData;
    
    dataSource?.forEach(item => {
      if (item.year) years.add(item.year);
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [dashboardData, viewMode]);

  const availableMonths = useMemo(() => {
    if (!dashboardData) return [];
    
    const months = new Set();
    const dataSource = viewMode === 'monthly' ? dashboardData.monthlyData : dashboardData.weeklyData;
    
    dataSource?.forEach(item => {
      if (filters.year && item.year !== filters.year) return;
      if (item.month) months.add(item.month);
    });
    
    return MONTHS.filter(m => months.has(m));
  }, [dashboardData, filters.year, viewMode]);

  const availableWeeks = useMemo(() => {
    if (!dashboardData?.weeklyData || viewMode === 'monthly') return [];
    
    const weeks = new Set();
    
    dashboardData.weeklyData.forEach(item => {
      if (filters.year && item.year !== filters.year) return;
      if (filters.month && item.month !== filters.month) return;
      if (item.week) weeks.add(item.week);
    });
    
    return Array.from(weeks).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numB - numA;
    });
  }, [dashboardData, filters.year, filters.month, viewMode]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.week && viewMode === 'weekly') params.append('week', filters.week);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/mitra/dashboard-analytics${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
      
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, viewMode]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: value };
      
      if (filterKey === 'year' && !value) {
        newFilters.month = '';
        newFilters.week = '';
      }
      
      if (filterKey === 'month' && !value) {
        newFilters.week = '';
      }
      
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ year: '', month: '', week: '' });
    setCurrentPage(1);
  }, []);

  const statusDistribution = useMemo(() => {
    if (!dashboardData?.statusDistribution) return [];
    
    return dashboardData.statusDistribution.map(item => ({
      status: item.status,
      count: item.count,
      percentage: item.percentage,
      color: STATUS_COLORS[item.status] || '#6B7280'
    }));
  }, [dashboardData]);

  const trendData = useMemo(() => {
    if (!dashboardData) return [];

    const data = viewMode === 'monthly' ? dashboardData.monthlyData : dashboardData.weeklyData;
    
    const parsePeriodForSorting = (item) => {
      const year = parseInt(item.year);
      
      if (viewMode === 'monthly') {
        const monthIndex = MONTHS.indexOf(item.month);
        return year * 100 + monthIndex;
      } else {
        const monthIndex = MONTHS.indexOf(item.month);
        const weekNum = parseInt(item.week.replace(/[^\d]/g, '')) || 0;
        return year * 10000 + monthIndex * 100 + weekNum;
      }
    };

    const sortedData = [...data].sort((a, b) => {
      return parsePeriodForSorting(a) - parsePeriodForSorting(b);
    });

    return sortedData.map(item => {
      let period;
      if (viewMode === 'monthly') {
        period = `${item.month} ${item.year}`;
      } else {
        period = `${item.week} ${item.month} ${item.year}`;
      }
      
      const totalPartners = item.total || 0;
      const retentionRate = item.retentionRate !== null && item.retentionRate !== undefined ? item.retentionRate : 0;
      
      return {
        period,
        totalPartners,
        activeRiders: item.riderActiveCount || item.activeCount || 0,
        inactiveRiders: item.riderInactiveCount || item.inactiveCount || 0,
        retentionRate: retentionRate
      };
    });
  }, [dashboardData, viewMode]);

  const detailedAnalysis = useMemo(() => {
    if (!dashboardData) return [];
    
    const data = viewMode === 'monthly' ? dashboardData.monthlyData : dashboardData.weeklyData;
    
    return data.map((item) => {
      const period = viewMode === 'monthly' ? item.month : item.week;
      const month = item.month;
      const year = item.year;
      
      return {
        period,
        month,
        year,
        activeRiders: item.riderActiveCount || item.activeCount || 0,
        inactiveRiders: item.riderInactiveCount || item.inactiveCount || 0,
        active: item.statusCounts?.Active || 0,
        new: item.statusCounts?.New || 0,
        driverTraining: item.statusCounts?.['Driver Training'] || 0,
        registered: item.statusCounts?.Registered || 0,
        inactive: item.statusCounts?.Inactive || 0,
        banned: item.statusCounts?.Banned || 0,
        invalidDocuments: item.statusCounts?.['Invalid Documents'] || 0,
        pendingVerification: item.statusCounts?.['Pending Verification'] || 0,
        totalPartners: item.total || 0,
        newJoining: item.gettingValue || 0,
        retentionRate: item.retentionRate !== null && item.retentionRate !== undefined ? item.retentionRate : null,
        churnRate: item.churnRate !== null && item.churnRate !== undefined ? item.churnRate : null
      };
    });
  }, [dashboardData, viewMode]);

  const sortedDetailedAnalysis = useMemo(() => {
    const sorted = [...detailedAnalysis].sort((a, b) => {
      const getWeekNumber = (weekStr) => {
        const match = weekStr.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };

      const getMonthNumber = (monthStr) => {
        const months = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4,
          'May': 5, 'June': 6, 'July': 7, 'August': 8,
          'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        return months[monthStr] || 0;
      };

      if (sortConfig.key === 'period' && viewMode === 'weekly') {
        const weekA = getWeekNumber(a.period);
        const weekB = getWeekNumber(b.period);
        const monthA = getMonthNumber(a.month);
        const monthB = getMonthNumber(b.month);
        const yearA = parseInt(a.year);
        const yearB = parseInt(b.year);

        if (yearA !== yearB) {
          return sortConfig.direction === 'desc' ? yearB - yearA : yearA - yearB;
        }
        if (monthA !== monthB) {
          return sortConfig.direction === 'desc' ? monthB - monthA : monthA - monthB;
        }
        return sortConfig.direction === 'desc' ? weekB - weekA : weekA - weekB;
      }

      if (sortConfig.key === 'period' && viewMode === 'monthly') {
        const monthA = getMonthNumber(a.period);
        const monthB = getMonthNumber(b.period);
        const yearA = parseInt(a.year);
        const yearB = parseInt(b.year);

        if (yearA !== yearB) {
          return sortConfig.direction === 'desc' ? yearB - yearA : yearA - yearB;
        }
        return sortConfig.direction === 'desc' ? monthB - monthA : monthA - monthB;
      }

      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
      }

      return sortConfig.direction === 'desc' 
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });

    return sorted;
  }, [detailedAnalysis, sortConfig, viewMode]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedDetailedAnalysis.slice(startIndex, endIndex);
  }, [sortedDetailedAnalysis, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedDetailedAnalysis.length / itemsPerPage);
  }, [sortedDetailedAnalysis.length, itemsPerPage]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const getSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={16} className="inline ml-1" />
      : <ChevronDown size={16} className="inline ml-1" />;
  }, [sortConfig]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleExportData = useCallback(() => {
    if (!dashboardData) return;

    const csvContent = [
      ['Period Type', 'View Mode', viewMode === 'monthly' ? 'Monthly' : 'Weekly'],
      ['Applied Filters', `Year: ${filters.year || 'All'}, Month: ${filters.month || 'All'}, Week: ${filters.week || 'All'}`],
      ['Total Partners', dashboardData.summary?.totalMitras || 0],
      ['Active Riders', dashboardData.riderMetrics?.currentActiveRiders || 0],
      ['Training Count', dashboardData.summary?.trainingCount || 0],
      [],
      viewMode === 'weekly' 
        ? ['Period', 'Month', 'Year', 'Active Riders', 'Inactive Riders', 'Active Status', 'New', 'Training', 'Registered', 'Total', 'New Joining', 'Retention %', 'Churn %']
        : ['Period', 'Year', 'Active Riders', 'Inactive Riders', 'Active Status', 'New', 'Training', 'Registered', 'Total', 'New Joining', 'Retention %', 'Churn %'],
      ...sortedDetailedAnalysis.map(row => 
        viewMode === 'weekly'
          ? [
              row.period,
              row.month,
              row.year,
              row.activeRiders,
              row.inactiveRiders,
              row.active,
              row.new,
              row.driverTraining,
              row.registered,
              row.totalPartners,
              row.newJoining,
              row.retentionRate !== null ? row.retentionRate.toFixed(2) : '-',
              row.churnRate !== null ? row.churnRate.toFixed(2) : '-'
            ]
          : [
              row.period,
              row.year,
              row.activeRiders,
              row.inactiveRiders,
              row.active,
              row.new,
              row.driverTraining,
              row.registered,
              row.totalPartners,
              row.newJoining,
              row.retentionRate !== null ? row.retentionRate.toFixed(2) : '-',
              row.churnRate !== null ? row.churnRate.toFixed(2) : '-'
            ]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mitra_Status_Dashboard_${viewMode}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [dashboardData, sortedDetailedAnalysis, viewMode, filters]);

  const handleBack = () => {
    window.location.href = '/driver-management/mitra-performance';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 text-sm font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Users className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">Mitra Lifecycle Dashboard</h1>
              </div>
              <p className="text-gray-600 text-sm">Track partner journey from onboarding to retention across all lifecycle stages</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200 text-sm font-medium shadow-sm"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={fetchDashboardData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-all duration-200 text-sm font-medium shadow-sm"
              >
                {isRefreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Refresh
              </button>
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => {
                setViewMode('monthly');
                if (filters.week) {
                  setFilters(prev => ({ ...prev, week: '' }));
                }
              }}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Monthly
              </div>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Weekly
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            availableYears={availableYears}
            availableMonths={availableMonths}
            availableWeeks={availableWeeks}
            isLoading={isRefreshing}
            viewMode={viewMode}
          />
        </div>

        {dashboardData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricCard
                title="Total Partners"
                value={dashboardData.summary.totalMitras}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Active Riders"
                value={viewMode === 'monthly' 
                  ? dashboardData.riderMetrics.currentActiveRiders
                  : dashboardData.riderMetrics.currentWeekActiveRiders}
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="In Training"
                value={dashboardData.summary.trainingCount}
                icon={Calendar}
                color="orange"
              />
              <MetricCard
                title="Pending Verification"
                value={dashboardData.summary.pendingCount}
                icon={AlertCircle}
                color="purple"
              />
            </div>

            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statusDistribution.map((item) => (
                  <StatusCard
                    key={item.status}
                    status={item.status}
                    count={item.count}
                    percentage={item.percentage}
                    color={item.color}
                  />
                ))}
              </div>
            </div>

            {isChartExpanded && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsChartExpanded(false)} />
            )}
            
            <div className={`bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 transition-all duration-300 ${isChartExpanded ? 'fixed inset-0 z-50 m-4' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Rider Activity Trends ({viewMode === 'monthly' ? 'Monthly' : 'Weekly'})
                </h2>
                <button
                  onClick={() => setIsChartExpanded(!isChartExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 rounded-lg transition-colors font-medium text-sm"
                  title={isChartExpanded ? 'Minimize' : 'Show Full'}
                >
                  {isChartExpanded ? (
                    <>
                      <Minimize2 size={18} />
                      <span>Minimize</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={18} />
                      <span>Show Full</span>
                    </>
                  )}
                </button>
              </div>
              <div className={isChartExpanded ? 'h-[calc(100vh-180px)]' : 'h-96'}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="period" 
                      angle={-45} 
                      textAnchor="end" 
                      height={isChartExpanded ? 120 : 100}
                      style={{ fontSize: isChartExpanded ? '13px' : '11px' }} 
                    />
                    <YAxis yAxisId="left" style={{ fontSize: isChartExpanded ? '14px' : '12px' }} />
                    <YAxis yAxisId="right" orientation="right" style={{ fontSize: isChartExpanded ? '14px' : '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: isChartExpanded ? '14px' : '12px' }} />
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="totalPartners" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3} 
                      name="Total Partners" 
                      strokeWidth={isChartExpanded ? 3 : 2}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="activeRiders" 
                      stroke="#10b981" 
                      strokeWidth={isChartExpanded ? 3 : 2}
                      name="Active Riders" 
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="inactiveRiders" 
                      stroke="#ef4444" 
                      strokeWidth={isChartExpanded ? 3 : 2}
                      name="Inactive Riders" 
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="retentionRate" 
                      fill="#f59e0b" 
                      name="Retention %" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Detailed {viewMode === 'monthly' ? 'Monthly' : 'Weekly'} Analysis
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('period')} 
                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Period {getSortIcon('period')}
                      </th>
                      {viewMode === 'weekly' && (
                        <th 
                          onClick={() => handleSort('month')} 
                          className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                        >
                          Month {getSortIcon('month')}
                        </th>
                      )}
                      <th 
                        onClick={() => handleSort('year')} 
                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Year {getSortIcon('year')}
                      </th>
                      <th 
                        onClick={() => handleSort('activeRiders')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Active {getSortIcon('activeRiders')}
                      </th>
                      <th 
                        onClick={() => handleSort('inactiveRiders')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Inactive {getSortIcon('inactiveRiders')}
                      </th>
                      <th 
                        onClick={() => handleSort('active')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Active Status {getSortIcon('active')}
                      </th>
                      <th 
                        onClick={() => handleSort('new')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        New {getSortIcon('new')}
                      </th>
                      <th 
                        onClick={() => handleSort('driverTraining')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Training {getSortIcon('driverTraining')}
                      </th>
                      <th 
                        onClick={() => handleSort('registered')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Registered {getSortIcon('registered')}
                      </th>
                      <th 
                        onClick={() => handleSort('totalPartners')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Total {getSortIcon('totalPartners')}
                      </th>
                      <th 
                        onClick={() => handleSort('newJoining')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        New Joining {getSortIcon('newJoining')}
                      </th>
                      <th 
                        onClick={() => handleSort('retentionRate')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Retention % {getSortIcon('retentionRate')}
                      </th>
                      <th 
                        onClick={() => handleSort('churnRate')} 
                        className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        Churn % {getSortIcon('churnRate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedData.map((row, index) => (
                      <tr key={`${row.period}-${row.year}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{row.period}</td>
                        {viewMode === 'weekly' && (
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{row.month}</td>
                        )}
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{row.year}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.activeRiders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.inactiveRiders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.active}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.new}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.driverTraining}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-violet-100 text-violet-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.registered}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-900 rounded font-bold text-sm min-w-[3rem]">
                            {row.totalPartners}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded font-semibold text-sm min-w-[3rem]">
                            {row.newJoining}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded font-bold text-sm min-w-[4rem]">
                            {row.retentionRate !== null ? `${row.retentionRate.toFixed(2)}%` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 rounded font-bold text-sm min-w-[4rem]">
                            {row.churnRate !== null ? `${row.churnRate.toFixed(2)}%` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={sortedDetailedAnalysis.length}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}