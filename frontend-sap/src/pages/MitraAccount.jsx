import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Package, CheckCircle, MapPin, Phone, User, Calendar, Loader2, AlertCircle, XCircle, FileSpreadsheet, Zap, Filter, BarChart3, Maximize2, Minimize2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { fetchFilteredMitraPerformance } from '../services/api';
import { showSuccessNotification, showErrorNotification } from '../utils/notificationService';
import DatePicker from '../components/calendar/Datepicker';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);

const API_BASE_URL = window.REACT_APP_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const PERIOD_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const MetricCard = ({ title, value, change, icon: Icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded">
        <Icon size={20} className="text-gray-600" />
      </div>
    </div>
    {change !== null && (
      <div className="flex items-center gap-1.5 text-xs">
        {change >= 0 ? (
          <>
            <TrendingUp size={14} className="text-green-600" />
            <span className="text-green-600 font-medium">+{change.toFixed(1)}%</span>
          </>
        ) : (
          <>
            <TrendingDown size={14} className="text-red-600" />
            <span className="text-red-600 font-medium">{change.toFixed(1)}%</span>
          </>
        )}
        <span className="text-gray-500">vs last period</span>
      </div>
    )}
  </div>
);

const InsightCard = ({ title, description, type, recommendations }) => {
  const typeConfig = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    danger: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`border ${config.border} ${config.bg} rounded-lg p-5 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={config.color} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">{title}</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{description}</p>
          {recommendations && recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Recommendations:</p>
              <ul className="space-y-1.5">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExportProgressModal = ({ isOpen, onClose, exportType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full border border-gray-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Report</h3>
              <p className="text-gray-700 text-sm mb-4">
                {exportType === 'formula' 
                  ? 'Creating comprehensive analytics with Excel formulas and shipment data...'
                  : 'Creating quick performance summary report...'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 animate-pulse" style={{ width: '75%' }}></div>
              </div>
              {exportType === 'formula' && (
                <p className="text-xs text-gray-600 mt-3">
                  Processing delivery data for formula calculations...
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PeriodSelector = ({ currentPeriod, onPeriodChange, disabled = false }) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
      {Object.entries(PERIOD_TYPES).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onPeriodChange(value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            currentPeriod === value
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </button>
      ))}
    </div>
  );
};

const ChartContainer = ({ title, children, expanded, onToggle, id }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${expanded ? 'col-span-2' : ''}`} id={id}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">{title}</h2>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title={expanded ? "Minimize chart" : "Expand chart"}
        >
          {expanded ? <Minimize2 size={16} className="text-gray-600" /> : <Maximize2 size={16} className="text-gray-600" />}
        </button>
      </div>
      <div className={expanded ? 'h-96' : 'h-64'}>
        {children}
      </div>
    </div>
  );
};

export default function MitraAccount() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [currentExportType, setCurrentExportType] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [periodType, setPeriodType] = useState(PERIOD_TYPES.MONTHLY);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState({});
  const [dateResetTrigger, setDateResetTrigger] = useState(0);

  const buildFilterParams = useCallback(() => {
    const filters = { periodType };

    if (dateRange.start && dateRange.end) {
      filters.startDate = dayjs(dateRange.start).format('YYYY-MM-DD');
      filters.endDate = dayjs(dateRange.end).format('YYYY-MM-DD');
    }

    if (periodType === PERIOD_TYPES.WEEKLY && selectedWeek) {
      filters.selectedWeek = selectedWeek;
      if (selectedMonth && selectedYear) {
        filters.selectedMonth = selectedMonth;
        filters.selectedYear = selectedYear;
      }
    }

    if (periodType === PERIOD_TYPES.MONTHLY && selectedMonth && selectedYear) {
      filters.selectedMonth = selectedMonth;
      filters.selectedYear = selectedYear;
    }

    if (periodType === PERIOD_TYPES.YEARLY && selectedYear) {
      filters.selectedYear = selectedYear;
    }

    return filters;
  }, [periodType, dateRange, selectedWeek, selectedMonth, selectedYear]);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const filters = buildFilterParams();
      
      const data = await fetchFilteredMitraPerformance(driverId, filters);
      setPerformanceData(data);
    } catch (err) {
      setError(err.message || 'Failed to load performance data');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [driverId, buildFilterParams]);

  useEffect(() => {
    if (driverId) {
      fetchPerformanceData();
    }
  }, [driverId, fetchPerformanceData]);

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setDateRange({ start: startDate, end: endDate });
    
    if (!startDate && !endDate) {
      setDateResetTrigger(prev => prev + 1);
      setSelectedWeek('');
      setSelectedMonth('');
      setSelectedYear('');
      setPeriodType(PERIOD_TYPES.MONTHLY);
      return;
    }
    
    if (startDate && endDate) {
      const daysDiff = dayjs(endDate).diff(dayjs(startDate), 'day');
      
      let newPeriodType = PERIOD_TYPES.MONTHLY;
      if (daysDiff === 0) {
        newPeriodType = PERIOD_TYPES.DAILY;
      } else if (daysDiff <= 7) {
        newPeriodType = PERIOD_TYPES.WEEKLY;
      } else if (daysDiff <= 31) {
        newPeriodType = PERIOD_TYPES.MONTHLY;
      } else {
        newPeriodType = PERIOD_TYPES.YEARLY;
      }
      
      setPeriodType(newPeriodType);
    }
  }, []);

  const handlePeriodTypeChange = useCallback((newPeriodType) => {
    setPeriodType(newPeriodType);
    
    setSelectedWeek('');
    setSelectedMonth('');
    setSelectedYear('');
  }, []);

  const toggleChartExpansion = useCallback((chartId) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }));
  }, []);

  const filteredMetrics = useMemo(() => {
    if (!performanceData?.metrics) return {};
    return performanceData.metrics;
  }, [performanceData]);

  const filteredTrends = useMemo(() => {
    if (!performanceData?.trends) return [];
    return performanceData.trends;
  }, [performanceData]);

  const filteredProjectBreakdown = useMemo(() => {
    if (!performanceData?.projectBreakdown) return [];
    return performanceData.projectBreakdown;
  }, [performanceData]);

  const performanceScore = useMemo(() => {
    if (!filteredMetrics) return 0;

    const weights = {
      deliveryRate: 0.30,
      onTimeRate: 0.25,
      activityLevel: 0.20,
      consistency: 0.15,
      growth: 0.10
    };

    const deliveryRate = parseFloat(filteredMetrics.deliveryRate) || 0;
    const onTimeRate = parseFloat(filteredMetrics.onTimeRate) || 0;
    const totalDeliveries = parseInt(filteredMetrics.totalDeliveries) || 0;
    const cancelRate = parseFloat(filteredMetrics.cancelRate) || 0;
    const growthRate = parseFloat(filteredMetrics.growthRate) || 0;

    const deliveryScore = Math.min(100, (deliveryRate / 95) * 100);
    const onTimeScore = Math.min(100, (onTimeRate / 90) * 100);
    const activityScore = Math.min(100, (totalDeliveries / 100) * 100);
    const consistencyScore = Math.max(0, 100 - (cancelRate * 10));
    
    let growthScore = 50 + growthRate;
    if (growthRate < 0) {
      growthScore = Math.max(0, 50 + growthRate);
    }
    growthScore = Math.max(0, Math.min(100, growthScore));

    const totalScore = (
      deliveryScore * weights.deliveryRate +
      onTimeScore * weights.onTimeRate +
      activityScore * weights.activityLevel +
      consistencyScore * weights.consistency +
      growthScore * weights.growth
    );

    return totalScore;
  }, [filteredMetrics]);

  const radarData = useMemo(() => {
    if (!performanceData?.radarData) return [];
    
    const totalDeliveries = parseInt(filteredMetrics.totalDeliveries) || 0;
    const growthRate = parseFloat(filteredMetrics.growthRate) || 0;
    
    return performanceData.radarData.map(item => {
      if (item.metric === 'Growth' && totalDeliveries === 0) {
        return { ...item, value: 0 };
      }
      return item;
    });
  }, [performanceData, filteredMetrics]);

  const filteredInsights = useMemo(() => {
    if (!performanceData || !dateRange.start || !dateRange.end) {
      return [];
    }

    const insights = [];
    const metrics = filteredMetrics;
    const totalDeliveries = parseInt(metrics.totalDeliveries) || 0;

    if (totalDeliveries === 0) {
      insights.push({
        type: 'warning',
        title: 'No Delivery Data Available',
        description: 'There are no delivery records in the selected period. Performance metrics cannot be calculated.',
        recommendations: [
          'Select a different date range with delivery data',
          'Check if the driver has any deliveries in the system',
          'Verify the driver ID is correct'
        ]
      });
      return insights;
    }

    if (metrics.deliveryRate >= 95) {
      insights.push({
        type: 'success',
        title: 'Excellent Delivery Success Rate',
        description: `Outstanding performance with ${metrics.deliveryRate.toFixed(1)}% successful deliveries in selected period.`,
        recommendations: [
          'Maintain current service quality standards',
          'Share best practices with team'
        ]
      });
    } else if (metrics.deliveryRate < 85) {
      insights.push({
        type: 'danger',
        title: 'Delivery Rate Below Target',
        description: `Current delivery success rate of ${metrics.deliveryRate.toFixed(1)}% is below the 85% minimum threshold.`,
        recommendations: [
          'Review failed delivery reasons',
          'Improve customer communication',
          'Ensure vehicle maintenance'
        ]
      });
    }

    if (metrics.onTimeRate >= 92) {
      insights.push({
        type: 'success',
        title: 'Exceptional On-Time Performance',
        description: `On-time delivery rate of ${metrics.onTimeRate.toFixed(1)}% exceeds the 90% benchmark.`,
        recommendations: [
          'Continue using current routing strategies'
        ]
      });
    } else if (metrics.onTimeRate < 90) {
      insights.push({
        type: 'warning',
        title: 'On-Time Performance Needs Improvement',
        description: `On-time delivery rate is ${metrics.onTimeRate.toFixed(1)}%, below the 90% target.`,
        recommendations: [
          'Start deliveries earlier',
          'Use real-time traffic apps',
          'Build buffer time for delays'
        ]
      });
    }

    return insights;
  }, [performanceData, filteredMetrics, dateRange]);

  const handleExportPerformance = useCallback(async (withFormula = true) => {
    if (!performanceData) {
      showErrorNotification('Export Failed', 'No performance data available to export');
      return;
    }

    const trendCount = filteredTrends?.length || 0;
    const hasValidTrends = trendCount >= 2 && 
      !(trendCount === 1 && filteredTrends[0].month === 'No Data');

    if (withFormula && (!performanceData.shipmentData || performanceData.shipmentData.length === 0)) {
      showErrorNotification(
        'Export Failed', 
        'Formula-based export requires shipment data. Please use Quick Export instead.'
      );
      return;
    }

    if (!hasValidTrends) {
      const proceed = window.confirm(
        `⚠️ LIMITED DATA WARNING\n\n` +
        `Current data: ${trendCount} period(s)\n` +
        `Recommended: At least 2 months for full analysis\n\n` +
        `Export will include:\n` +
        `✓ Raw delivery data\n` +
        `✓ Basic statistics\n` +
        `✓ Cost analysis\n` +
        `✓ Project breakdown\n` +
        `✓ Operational insights\n` +
        `✓ Data visualization\n` +
        `✗ Trend analysis (requires ≥2 periods)\n` +
        `✗ Forecast calculations (requires ≥2 periods)\n` +
        `✗ Growth metrics (requires ≥2 periods)\n` +
        `✗ Advanced analytics (requires ≥2 periods)\n\n` +
        `Continue with limited export?`
      );
      
      if (!proceed) return;
    }

    setIsExporting(true);
    setShowExportProgress(true);
    setCurrentExportType(withFormula ? 'formula' : 'quick');

    try {
      const token = localStorage.getItem('token');
      
      const exportPayload = {
        profile: performanceData.profile,
        metrics: filteredMetrics,
        trends: filteredTrends,
        projectBreakdown: filteredProjectBreakdown,
        radarData: radarData,
        recentDeliveries: performanceData.shipmentData?.slice(0, 10) || [],
        performanceScore: performanceScore,
        insights: filteredInsights,
        generatedAt: new Date().toISOString(),
        driverId: driverId,
        dataQuality: {
          trendCount: trendCount,
          hasValidTrends: hasValidTrends,
          shipmentCount: performanceData.shipmentData?.length || 0,
          limitedAnalysis: !hasValidTrends
        },
        dateRange: dateRange,
        periodType: periodType,
        appliedFilters: buildFilterParams()
      };

      if (withFormula && performanceData.shipmentData) {
        exportPayload.shipmentData = performanceData.shipmentData;
      }

      const endpoint = withFormula 
        ? `${API_BASE_URL}/chart/generate-mitra-performance-formula`
        : `${API_BASE_URL}/chart/generate-mitra-performance-quick`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(exportPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate performance report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const suffix = withFormula ? 'Formula' : 'Quick';
      const periodLabel = periodType.charAt(0).toUpperCase() + periodType.slice(1);
      const filterLabel = dateRange.start ? 'Filtered' : 'All';
      const limitedTag = !hasValidTrends ? '_LIMITED' : '';
      link.download = `Mitra_Performance_${suffix}_${filterLabel}_${periodLabel}_${performanceData.profile.name}_${new Date().toISOString().slice(0, 10)}${limitedTag}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessNotification(
        'Export Successful',
        !hasValidTrends 
          ? `Limited analysis report generated (${trendCount} period). Add more data for full features.`
          : withFormula 
            ? 'Performance analytics report with Excel formulas has been generated'
            : 'Quick performance summary report has been generated'
      );
    } catch (error) {
      showErrorNotification(
        'Export Failed',
        error.message || 'Failed to generate performance report'
      );
    } finally {
      setIsExporting(false);
      setShowExportProgress(false);
      setCurrentExportType('');
    }
  }, [performanceData, filteredMetrics, filteredTrends, filteredProjectBreakdown, radarData, performanceScore, filteredInsights, driverId, dateRange, periodType, buildFilterParams]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 text-sm">Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-lg p-8 text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Performance data not found for this mitra partner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ExportProgressModal 
        isOpen={showExportProgress} 
        onClose={() => setShowExportProgress(false)}
        exportType={currentExportType}
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <ArrowLeft size={18} />
            Back to Mitra List
          </button>

          <div className="flex items-center gap-3">
            <DatePicker 
              onDateRangeChange={handleDateRangeChange}
              disabled={isExporting || isRefreshing}
              resetTrigger={dateResetTrigger}
            />
            
            <PeriodSelector 
              currentPeriod={periodType}
              onPeriodChange={handlePeriodTypeChange}
              disabled={isExporting || isRefreshing}
            />
            
            {isRefreshing && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 size={16} className="text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-700">Refreshing...</span>
              </div>
            )}

            <button
              onClick={() => handleExportPerformance(false)}
              disabled={isExporting || isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              {isExporting && currentExportType === 'quick' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Quick Export
                </>
              )}
            </button>

            <button
              onClick={() => handleExportPerformance(true)}
              disabled={isExporting || isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              {isExporting && currentExportType === 'formula' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={18} />
                  Export with Formulas
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">{performanceData.profile.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <User size={16} />
                  <span>ID: {performanceData.profile.driverId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={16} />
                  <span>{performanceData.profile.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{performanceData.profile.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <span>Joined: {formatDate(performanceData.profile.joinedDate)}</span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              performanceData.profile.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {performanceData.profile.status}
            </div>
          </div>
        </div>

        {dateRange.start && dateRange.end && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Showing data for: {dayjs(dateRange.start).format('DD MMM YYYY')} - {dayjs(dateRange.end).format('DD MMM YYYY')}
              </span>
              <span className="text-sm text-blue-600 capitalize">
                ({periodType} view)
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Deliveries"
            value={filteredMetrics.totalDeliveries?.toLocaleString() || 0}
            change={filteredMetrics.growthRate}
            icon={Package}
          />
          <MetricCard
            title="Success Rate"
            value={`${filteredMetrics.deliveryRate?.toFixed(1) || 0}%`}
            change={null}
            icon={CheckCircle}
          />
          <MetricCard
            title="On-Time Delivery"
            value={`${filteredMetrics.onTimeRate?.toFixed(1) || 0}%`}
            change={null}
            icon={CheckCircle}
          />
          <MetricCard
            title="Avg Distance"
            value={`${filteredMetrics.avgDistance?.toFixed(1) || 0} km`}
            change={null}
            icon={MapPin}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartContainer 
            title={`${periodType.charAt(0).toUpperCase() + periodType.slice(1)} Performance Trend`}
            expanded={expandedCharts['trend']}
            onToggle={() => toggleChartExpansion('trend')}
            id="trend-chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={periodType === PERIOD_TYPES.DAILY ? -45 : 0}
                  textAnchor={periodType === PERIOD_TYPES.DAILY ? "end" : "middle"}
                  height={periodType === PERIOD_TYPES.DAILY ? 80 : 30}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Deliveries"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer 
            title="Performance Radar"
            expanded={expandedCharts['radar']}
            onToggle={() => toggleChartExpansion('radar')}
            id="radar-chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Radar 
                  name="Score" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.5} 
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <ChartContainer 
          title="Delivery Distribution by Project"
          expanded={expandedCharts['project']}
          onToggle={() => toggleChartExpansion('project')}
          id="project-chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredProjectBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="project" 
                stroke="#6b7280" 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                angle={-15} 
                textAnchor="end" 
                height={80}
              />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" fill="#6366f1" name="Deliveries" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {filteredInsights.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredInsights.map((insight, idx) => (
                <InsightCard key={idx} {...insight} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Performance Summary</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-3">
              <strong>{performanceData.profile.name}</strong> has achieved an overall performance rating of{' '}
              <strong className="text-blue-600">{performanceScore.toFixed(1)}/100</strong>, placing this mitra in the{' '}
              <strong>
                {performanceScore >= 90 ? 'Excellent' : 
                 performanceScore >= 80 ? 'Very Good' : 
                 performanceScore >= 70 ? 'Good' : 'Fair'}
              </strong> category.
            </p>
            
            <p className="mb-3">
              {filteredMetrics.growthRate > 0 ? (
                <>
                  This mitra demonstrates positive growth with a <strong className="text-green-600">{filteredMetrics.growthRate.toFixed(1)}%</strong> increase in delivery volume.
                </>
              ) : filteredMetrics.growthRate < 0 ? (
                <>
                  Recent performance shows a <strong className="text-orange-600">{Math.abs(filteredMetrics.growthRate).toFixed(1)}%</strong> decline in delivery volume.
                </>
              ) : (
                <>
                  Performance remains stable with consistent delivery patterns.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}