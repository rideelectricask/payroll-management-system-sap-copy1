import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Package, Users, Calendar, Loader2, AlertCircle, RefreshCw, X, Download, FileSpreadsheet, BarChart3, Activity, DollarSign, Zap, Info } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area } from 'recharts';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import DatePicker from '../components/calendar/Datepicker';

const API_BASE_URL = window.REACT_APP_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const PERIOD_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const EXPORT_TEMPLATES = {
  ANALYSIS: 'analysis',
  MANAGEMENT: 'management',
  OPERATIONAL: 'operational'
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#F43F5E', '#6366F1'];

const PERFORMANCE_LEVEL_COLORS = {
  'Excellent': '#3B82F6',
  'Very Good': '#10B981',
  'Good': '#F59E0B',
  'Average': '#EF4444',
  'Needs Improvement': '#8B5CF6'
};

const PERFORMANCE_LEVEL_INFO = {
  'Excellent': { min: 90, description: 'Outstanding performance across all metrics' },
  'Very Good': { min: 80, max: 89, description: 'Strong performance with minor improvements needed' },
  'Good': { min: 70, max: 79, description: 'Satisfactory performance with room for growth' },
  'Average': { min: 60, max: 69, description: 'Meets basic requirements, needs improvement' },
  'Needs Improvement': { max: 59, description: 'Below standards, requires immediate attention' }
};

const MetricCard = ({ title, value, change, icon: Icon, color = 'blue', subtitle }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2 bg-${color}-50 rounded-lg`}>
        <Icon size={18} className={`text-${color}-600`} />
      </div>
    </div>
    {change !== null && change !== undefined && (
      <div className="flex items-center gap-1.5 text-xs mt-2">
        {change >= 0 ? (
          <>
            <TrendingUp size={12} className="text-green-600" />
            <span className="text-green-600 font-medium">+{change.toFixed(1)}%</span>
          </>
        ) : (
          <>
            <TrendingDown size={12} className="text-red-600" />
            <span className="text-red-600 font-medium">{change.toFixed(1)}%</span>
          </>
        )}
        <span className="text-gray-500">vs previous</span>
      </div>
    )}
  </div>
);

const PeriodSelector = ({ currentPeriod, onPeriodChange, disabled = false }) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      {Object.entries(PERIOD_TYPES).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onPeriodChange(value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            currentPeriod === value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </button>
      ))}
    </div>
  );
};

const RankBadge = ({ rank }) => {
  let bgColor = 'bg-gray-100 text-gray-700';
  let icon = null;

  if (rank === 1) {
    bgColor = 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400';
    icon = '🥇';
  } else if (rank === 2) {
    bgColor = 'bg-gray-200 text-gray-800 border-2 border-gray-400';
    icon = '🥈';
  } else if (rank === 3) {
    bgColor = 'bg-orange-100 text-orange-800 border-2 border-orange-400';
    icon = '🥉';
  } else if (rank <= 10) {
    bgColor = 'bg-blue-100 text-blue-800';
  }

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${bgColor}`}>
      {icon && <span>{icon}</span>}
      <span>#{rank}</span>
    </div>
  );
};

const CustomRadarTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3">
      <p className="font-bold text-sm text-gray-900 mb-2">{payload[0].payload.metric}</p>
      {payload.map((entry, index) => {
        const labelKey = `${entry.dataKey}_label`;
        const displayName = entry.payload[labelKey] || entry.name;
        return (
          <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 text-xs mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="font-medium">{displayName}</span>
            </div>
            <span className="font-bold">{entry.value.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const levelInfo = PERFORMANCE_LEVEL_INFO[data.name];
  const percentage = ((data.value / data.payload.total) * 100).toFixed(1);
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: data.payload.fill }}></div>
        <h4 className="font-bold text-sm text-gray-900">{data.name}</h4>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Jumlah Mitra:</span>
          <span className="font-bold">{data.value}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Persentase:</span>
          <span className="font-bold">{percentage}%</span>
        </div>
        {levelInfo && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-gray-700 font-medium">Kriteria:</p>
            <p className="text-gray-600 mt-1">
              {levelInfo.min && levelInfo.max ? 
                `Score ${levelInfo.min}-${levelInfo.max}%` : 
                levelInfo.min ? 
                `Score ≥${levelInfo.min}%` : 
                `Score <${levelInfo.max}%`}
            </p>
            <p className="text-gray-600 mt-1 italic">{levelInfo.description}</p>
          </div>
        )}
      </div>
      {data.payload.mitras && data.payload.mitras.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-gray-700 font-medium mb-1">Top Mitras:</p>
          <div className="max-h-32 overflow-y-auto">
            {data.payload.mitras.slice(0, 5).map((mitra, idx) => (
              <p key={idx} className="text-xs text-gray-600">• {mitra}</p>
            ))}
            {data.payload.mitras.length > 5 && (
              <p className="text-xs text-gray-500 italic mt-1">+{data.payload.mitras.length - 5} lainnya</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceLevelInfo = () => {
  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <Info size={18} className="text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-blue-900">Kategori Performance Level</h4>
          <p className="text-xs text-blue-700 mt-1">Klasifikasi berdasarkan Performance Score (kombinasi on-time rate, delivery volume, dan success rate)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        {Object.entries(PERFORMANCE_LEVEL_INFO).map(([level, info]) => (
          <div key={level} className="flex items-start gap-2">
            <div className="w-3 h-3 rounded mt-0.5" style={{ backgroundColor: PERFORMANCE_LEVEL_COLORS[level] }}></div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900">{level}</span>
              <span className="text-gray-600 ml-2">
                ({info.min && info.max ? `${info.min}-${info.max}%` : info.min ? `≥${info.min}%` : `<${info.max}%`})
              </span>
              <p className="text-gray-600 mt-0.5">{info.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FilterSection = ({ filters, availableFilters, onFilterChange, onClearFilters, onDateRangeChange, disabled, dateResetTrigger }) => {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.clientName) count++;
    if (filters.projectName) count++;
    if (filters.hub) count++;
    if (filters.dropPoint) count++;
    if (filters.startDate && filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            <X size={14} />
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
          <DatePicker 
            onDateRangeChange={onDateRangeChange}
            disabled={disabled}
            resetTrigger={dateResetTrigger}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
          <select
            value={filters.clientName || ''}
            onChange={(e) => onFilterChange('clientName', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            {availableFilters.clients?.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
          <select
            value={filters.projectName || ''}
            onChange={(e) => onFilterChange('projectName', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            <option value="">All Projects</option>
            {availableFilters.projects?.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hub</label>
          <select
            value={filters.hub || ''}
            onChange={(e) => onFilterChange('hub', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            <option value="">All Hubs</option>
            {availableFilters.hubs?.map(hub => (
              <option key={hub} value={hub}>{hub}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Drop Point</label>
          <select
            value={filters.dropPoint || ''}
            onChange={(e) => onFilterChange('dropPoint', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            <option value="">All Drop Points</option>
            {availableFilters.dropPoints?.map(dp => (
              <option key={dp} value={dp}>{dp}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const PerformanceHeatmap = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const heatmapRef = useRef(null);

  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.slice(0, 20).map((mitra, idx) => ({
      id: idx,
      name: mitra.name.substring(0, 20),
      deliveries: mitra.totalDeliveries,
      onTimeRate: mitra.onTimeRate,
      score: mitra.performanceScore,
      avgCost: mitra.avgCost,
      costPerKm: mitra.costPerKm,
      onTimeDeliveries: Math.round(mitra.totalDeliveries * (mitra.onTimeRate / 100)),
      lateDeliveries: Math.round(mitra.totalDeliveries * ((100 - mitra.onTimeRate) / 100))
    }));
  }, [data]);

  const getColorByScore = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getColorByOnTime = (rate) => {
    if (rate >= 92) return '#10B981';
    if (rate >= 85) return '#F59E0B';
    return '#EF4444';
  };

  const handleCellHover = useCallback((event, cellData) => {
    if (!cellData) {
      setHoveredCell(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    
    const popupWidth = 256;
    const popupHeight = 240;
    
    let left = rect.right + 10;
    let top = rect.top;
    
    if (left + popupWidth > window.innerWidth) {
      left = rect.left - popupWidth - 10;
    }
    
    if (top + popupHeight > window.innerHeight) {
      top = window.innerHeight - popupHeight - 20;
    }
    
    if (top < 0) {
      top = 20;
    }
    
    setPopupPosition({ top, left });
    setHoveredCell(cellData);
  }, []);

  if (heatmapData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500">
        <AlertCircle size={48} className="mb-3 text-gray-400" />
        <p className="text-sm font-medium">No Data Available</p>
      </div>
    );
  }

  return (
    <div ref={heatmapRef} className="relative">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: '200px repeat(4, 1fr)' }}>
            <div className="bg-gray-100 p-2 font-bold text-xs text-gray-700 rounded">Mitra</div>
            <div className="bg-gray-100 p-2 font-bold text-xs text-gray-700 text-center rounded">Deliveries</div>
            <div className="bg-gray-100 p-2 font-bold text-xs text-gray-700 text-center rounded">On-Time %</div>
            <div className="bg-gray-100 p-2 font-bold text-xs text-gray-700 text-center rounded">Score</div>
            <div className="bg-gray-100 p-2 font-bold text-xs text-gray-700 text-center rounded">Cost/Km</div>

            {heatmapData.map((mitra) => (
              <React.Fragment key={mitra.id}>
                <div className="bg-gray-50 p-2 text-xs font-medium text-gray-900 truncate rounded">
                  {mitra.name}
                </div>

                <div 
                  className="relative p-2 text-xs font-bold text-center rounded cursor-pointer transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: `${getColorByScore(mitra.score)}20`,
                    color: getColorByScore(mitra.score)
                  }}
                  onMouseEnter={(e) => handleCellHover(e, { type: 'deliveries', data: mitra })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {mitra.deliveries}
                </div>

                <div 
                  className="relative p-2 text-xs font-bold text-center rounded cursor-pointer transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: `${getColorByOnTime(mitra.onTimeRate)}20`,
                    color: getColorByOnTime(mitra.onTimeRate)
                  }}
                  onMouseEnter={(e) => handleCellHover(e, { type: 'onTime', data: mitra })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {mitra.onTimeRate.toFixed(1)}%
                </div>

                <div 
                  className="relative p-2 text-xs font-bold text-center rounded cursor-pointer transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: `${getColorByScore(mitra.score)}20`,
                    color: getColorByScore(mitra.score)
                  }}
                  onMouseEnter={(e) => handleCellHover(e, { type: 'score', data: mitra })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {mitra.score.toFixed(0)}
                </div>

                <div 
                  className="relative p-2 text-xs font-bold text-center rounded cursor-pointer transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: mitra.costPerKm < 5000 ? '#10B98120' : mitra.costPerKm < 7000 ? '#F59E0B20' : '#EF444420',
                    color: mitra.costPerKm < 5000 ? '#10B981' : mitra.costPerKm < 7000 ? '#F59E0B' : '#EF4444'
                  }}
                  onMouseEnter={(e) => handleCellHover(e, { type: 'cost', data: mitra })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  Rp {(mitra.costPerKm / 1000).toFixed(1)}k
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {hoveredCell && (
        <div 
          className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 min-w-64"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
        >
          <h4 className="font-bold text-sm text-gray-900 mb-2">{hoveredCell.data.name}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deliveries:</span>
              <span className="font-bold">{hoveredCell.data.deliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">On-Time Deliveries:</span>
              <span className="font-bold">{hoveredCell.data.onTimeDeliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Late Deliveries:</span>
              <span className="font-bold">{hoveredCell.data.lateDeliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">On-Time Rate:</span>
              <span className="font-bold">{hoveredCell.data.onTimeRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Performance Score:</span>
              <span className="font-bold">{hoveredCell.data.score.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Cost/Delivery:</span>
              <span className="font-bold">Rp {hoveredCell.data.avgCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost per Km:</span>
              <span className="font-bold">Rp {hoveredCell.data.costPerKm.toLocaleString()}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Performance Analysis:</span>
              <div className="mt-1">
                {hoveredCell.data.onTimeRate >= 92 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Excellent on-time performance</span>
                  </div>
                ) : hoveredCell.data.onTimeRate >= 85 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-600">Good on-time performance</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">Needs improvement</span>
                  </div>
                )}
              </div>
              <div className="mt-1">
                {hoveredCell.data.costPerKm < 5000 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Cost efficient</span>
                  </div>
                ) : hoveredCell.data.costPerKm < 7000 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-600">Average cost efficiency</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">High cost per km</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
          <span>Excellent (≥90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
          <span>Good (80-89%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
          <span>Fair (70-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
          <span>Needs Improvement (&lt;70%)</span>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, onExport, isExporting }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(EXPORT_TEMPLATES.MANAGEMENT);

  if (!isOpen) return null;

  const templates = [
    {
      id: EXPORT_TEMPLATES.ANALYSIS,
      name: 'Data Analysis',
      icon: BarChart3,
      description: 'Detailed performance metrics, SLA validation, and trend analysis',
      color: 'blue'
    },
    {
      id: EXPORT_TEMPLATES.MANAGEMENT,
      name: 'Management',
      icon: Activity,
      description: 'Executive KPIs, strategic insights, and efficiency metrics',
      color: 'purple'
    },
    {
      id: EXPORT_TEMPLATES.OPERATIONAL,
      name: 'Operational',
      icon: Zap,
      description: 'Field monitoring, delivery tracking, and mitra performance',
      color: 'green'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Export Performance Data</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Choose export template based on your team needs</p>
        </div>

        <div className="p-6 space-y-3">
          {templates.map(template => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedTemplate === template.id
                    ? `border-${template.color}-500 bg-${template.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 bg-${template.color}-100 rounded-lg`}>
                    <Icon size={20} className={`text-${template.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className={`w-5 h-5 rounded-full bg-${template.color}-500 flex items-center justify-center`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(selectedTemplate)}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AllMitraPerformanceDashboard() {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState(PERIOD_TYPES.MONTHLY);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateResetTrigger, setDateResetTrigger] = useState(0);
  const [filters, setFilters] = useState({
    clientName: '',
    projectName: '',
    hub: '',
    dropPoint: '',
    startDate: null,
    endDate: null
  });
  const [availableFilters, setAvailableFilters] = useState({
    clients: [],
    projects: [],
    hubs: [],
    dropPoints: []
  });
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const buildApiFilters = useCallback(() => {
    const apiFilters = { periodType };
    
    if (filters.startDate && filters.endDate) {
      apiFilters.startDate = dayjs(filters.startDate).format('YYYY-MM-DD');
      apiFilters.endDate = dayjs(filters.endDate).format('YYYY-MM-DD');
    }

    if (filters.clientName) apiFilters.clientName = filters.clientName;
    if (filters.projectName) apiFilters.projectName = filters.projectName;
    if (filters.hub) apiFilters.hub = filters.hub;
    if (filters.dropPoint) apiFilters.dropPoint = filters.dropPoint;

    return apiFilters;
  }, [periodType, filters]);

  const fetchData = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      
      setIsRefreshing(true);
      setError(null);

      const apiFilters = buildApiFilters();

      const response = await fetch(`${API_BASE_URL}/mitra/all-performance-full?${new URLSearchParams(apiFilters)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      
      if (!isMountedRef.current) return;

      setPerformanceData(data.data);

      if (data.data.availableFilters) {
        setAvailableFilters(data.data.availableFilters);
        
        if (!firstLoadComplete && data.data.availableFilters.clients && data.data.availableFilters.clients.length > 0) {
          setFilters(prev => ({
            ...prev,
            clientName: data.data.availableFilters.clients[0]
          }));
          setFirstLoadComplete(true);
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError(err.message || 'Failed to load performance data');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [buildApiFilters, firstLoadComplete]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  }, []);

  const handlePeriodTypeChange = useCallback((newPeriodType) => {
    setPeriodType(newPeriodType);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      clientName: availableFilters.clients.length > 0 ? availableFilters.clients[0] : '',
      projectName: '',
      hub: '',
      dropPoint: '',
      startDate: null,
      endDate: null
    });
    setDateResetTrigger(prev => prev + 1);
  }, [availableFilters.clients]);

  const generateExportData = useCallback((template) => {
    if (!performanceData) return null;

    const metadata = {
      'Report Type': template === EXPORT_TEMPLATES.ANALYSIS ? 'Data Analysis Report' 
        : template === EXPORT_TEMPLATES.MANAGEMENT ? 'Management Report'
        : 'Operational Report',
      'Generated At': new Date().toLocaleString(),
      'Period Type': periodType,
      'Date Range': filters.startDate && filters.endDate 
        ? `${dayjs(filters.startDate).format('DD MMM YYYY')} - ${dayjs(filters.endDate).format('DD MMM YYYY')}` 
        : 'All Time',
      'Client Filter': filters.clientName || 'All',
      'Project Filter': filters.projectName || 'All',
      'Hub Filter': filters.hub || 'All',
      'Drop Point Filter': filters.dropPoint || 'All',
      'Total Mitras': performanceData.mitras.length,
      'Total Projects': performanceData.totalProjects,
      'Total Hubs': performanceData.totalHubs,
      'Total Drop Points': performanceData.totalDropPoints
    };

    if (template === EXPORT_TEMPLATES.ANALYSIS) {
      return {
        metadata,
        mitras: performanceData.mitras.map(m => ({
          'Rank': m.rank,
          'Mitra Name': m.name,
          'Total Deliveries': m.totalDeliveries,
          'On Time Deliveries': Math.round(m.totalDeliveries * (m.onTimeRate / 100)),
          'On Time Rate (%)': m.onTimeRate.toFixed(2),
          'Delivery Success Rate (%)': m.deliveryRate.toFixed(2),
          'Total Cost': m.totalCost,
          'Avg Cost per Delivery': m.avgCost.toFixed(2),
          'Total Distance (km)': m.totalDistance.toFixed(2),
          'Avg Distance per Delivery (km)': m.avgDistance.toFixed(2),
          'Cost per Km': m.costPerKm.toFixed(2),
          'Unique Projects': m.uniqueProjects,
          'Unique Hubs': m.uniqueHubs,
          'Unique Drop Points': m.uniqueDropPoints,
          'Active Weeks': m.weekCount,
          'Performance Score': m.performanceScore,
          'Performance Level': m.performanceLevel
        })),
        trends: performanceData.trends || []
      };
    } else if (template === EXPORT_TEMPLATES.MANAGEMENT) {
      return {
        metadata,
        summary: [{
          'Total Mitras': performanceData.mitras.length,
          'Total Deliveries': performanceData.mitras.reduce((sum, m) => sum + m.totalDeliveries, 0),
          'Total Cost': performanceData.mitras.reduce((sum, m) => sum + m.totalCost, 0),
          'Avg On-Time Rate (%)': (performanceData.mitras.reduce((sum, m) => sum + m.onTimeRate, 0) / performanceData.mitras.length).toFixed(2),
          'Avg Performance Score': (performanceData.mitras.reduce((sum, m) => sum + m.performanceScore, 0) / performanceData.mitras.length).toFixed(2)
        }],
        topPerformers: performanceData.mitras.slice(0, 10).map(m => ({
          'Rank': m.rank,
          'Mitra Name': m.name,
          'Performance Score': m.performanceScore,
          'Total Deliveries': m.totalDeliveries,
          'On Time Rate (%)': m.onTimeRate.toFixed(2),
          'Total Cost': m.totalCost
        })),
        insights: performanceData.mitras.map(m => ({
          'Mitra Name': m.name,
          'Strategic Recommendation': m.performanceScore >= 90 ? 'Maintain Excellence' 
            : m.performanceScore >= 80 ? 'Monitor & Support'
            : m.performanceScore >= 70 ? 'Improvement Plan Required'
            : 'Urgent Attention Needed',
          'Cost Efficiency': m.costPerKm < 5000 ? 'Excellent' : m.costPerKm < 7000 ? 'Good' : 'Needs Optimization'
        }))
      };
    } else {
      return {
        metadata,
        operational: performanceData.mitras.map(m => ({
          'Mitra Name': m.name,
          'Status': m.performanceLevel,
          'Total Deliveries': m.totalDeliveries,
          'On Time Rate (%)': m.onTimeRate.toFixed(2),
          'Active Weeks': m.weekCount,
          'Coverage': `${m.uniqueHubs} hubs, ${m.uniqueProjects} projects`,
          'Avg Distance (km)': m.avgDistance.toFixed(2),
          'Field Action': m.onTimeRate < 85 ? 'Require Training' : m.onTimeRate < 92 ? 'Monitor Performance' : 'On Track'
        }))
      };
    }
  }, [performanceData, periodType, filters]);

  const handleExportData = useCallback(async (template) => {
    try {
      setIsExporting(true);

      const exportData = generateExportData(template);
      if (!exportData) {
        return;
      }

      const wb = XLSX.utils.book_new();

      const metadataSheet = XLSX.utils.json_to_sheet([exportData.metadata]);
      XLSX.utils.book_append_sheet(wb, metadataSheet, 'Report Info');

      if (template === EXPORT_TEMPLATES.ANALYSIS) {
        const mitraSheet = XLSX.utils.json_to_sheet(exportData.mitras);
        XLSX.utils.book_append_sheet(wb, mitraSheet, 'Performance Analysis');

        if (exportData.trends && exportData.trends.length > 0) {
          const trendsSheet = XLSX.utils.json_to_sheet(exportData.trends);
          XLSX.utils.book_append_sheet(wb, trendsSheet, 'Trends');
        }
      } else if (template === EXPORT_TEMPLATES.MANAGEMENT) {
        const summarySheet = XLSX.utils.json_to_sheet(exportData.summary);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

        const topPerformersSheet = XLSX.utils.json_to_sheet(exportData.topPerformers);
        XLSX.utils.book_append_sheet(wb, topPerformersSheet, 'Top Performers');

        const insightsSheet = XLSX.utils.json_to_sheet(exportData.insights);
        XLSX.utils.book_append_sheet(wb, insightsSheet, 'Strategic Insights');
      } else {
        const operationalSheet = XLSX.utils.json_to_sheet(exportData.operational);
        XLSX.utils.book_append_sheet(wb, operationalSheet, 'Operational Status');
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Mitra_Performance_${template}_${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [generateExportData]);

  const aggregateMetrics = useMemo(() => {
    if (!performanceData?.mitras) return null;

    const totalDeliveries = performanceData.mitras.reduce((sum, m) => sum + (m.totalDeliveries || 0), 0);
    const totalCost = performanceData.mitras.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const avgOnTimeRate = performanceData.mitras.length > 0 
      ? performanceData.mitras.reduce((sum, m) => sum + (m.onTimeRate || 0), 0) / performanceData.mitras.length 
      : 0;
    const avgPerformanceScore = performanceData.mitras.length > 0
      ? performanceData.mitras.reduce((sum, m) => sum + (m.performanceScore || 0), 0) / performanceData.mitras.length
      : 0;

    return {
      totalMitras: performanceData.mitras.length,
      totalDeliveries,
      totalCost,
      avgOnTimeRate,
      avgPerformanceScore,
      totalProjects: performanceData.totalProjects || 0,
      totalHubs: performanceData.totalHubs || 0,
      totalDropPoints: performanceData.totalDropPoints || 0
    };
  }, [performanceData]);

  const topPerformers = useMemo(() => {
    if (!performanceData?.mitras) return [];
    return performanceData.mitras.slice(0, 10);
  }, [performanceData]);

  const performanceDistribution = useMemo(() => {
    if (!performanceData?.mitras) return [];
    const levels = {};
    const mitrasByLevel = {};
    
    performanceData.mitras.forEach(m => {
      const level = m.performanceLevel;
      levels[level] = (levels[level] || 0) + 1;
      if (!mitrasByLevel[level]) {
        mitrasByLevel[level] = [];
      }
      mitrasByLevel[level].push(m.name);
    });
    
    const total = performanceData.mitras.length;
    
    return Object.entries(levels).map(([level, count]) => ({ 
      level, 
      count,
      total,
      mitras: mitrasByLevel[level]
    }));
  }, [performanceData]);

  const radarChartData = useMemo(() => {
    if (!performanceData?.mitras || performanceData.mitras.length === 0) return [];
    
    const top5 = performanceData.mitras.slice(0, 5);
    const metrics = ['Deliveries', 'On-Time', 'Cost Eff.', 'Projects', 'Hubs'];
    
    return metrics.map((metric, metricIdx) => {
      const data = { metric, id: `metric-${metricIdx}` };
      top5.forEach((mitra, idx) => {
        const mitraKey = `mitra_${idx}`;
        const mitraLabel = `${mitra.name.substring(0, 12)} (#${mitra.rank})`;
        
        if (metric === 'Deliveries') {
          data[mitraKey] = Math.min(100, (mitra.totalDeliveries / 500) * 100);
        } else if (metric === 'On-Time') {
          data[mitraKey] = mitra.onTimeRate;
        } else if (metric === 'Cost Eff.') {
          data[mitraKey] = Math.max(0, 100 - (mitra.avgCost / 100));
        } else if (metric === 'Projects') {
          data[mitraKey] = Math.min(100, (mitra.uniqueProjects / 10) * 100);
        } else if (metric === 'Hubs') {
          data[mitraKey] = Math.min(100, (mitra.uniqueHubs / 5) * 100);
        }
        
        data[`${mitraKey}_label`] = mitraLabel;
      });
      return data;
    });
  }, [performanceData]);
  
  const radarChartKeys = useMemo(() => {
    if (!performanceData?.mitras || performanceData.mitras.length === 0) return [];
    const top5 = performanceData.mitras.slice(0, 5);
    return top5.map((mitra, idx) => ({
      key: `mitra_${idx}`,
      label: `${mitra.name.substring(0, 12)} (#${mitra.rank})`,
      color: COLORS[idx]
    }));
  }, [performanceData]);

  const costEfficiencyData = useMemo(() => {
    if (!performanceData?.mitras) return [];
    return performanceData.mitras.slice(0, 10).map(m => ({
      name: m.name.substring(0, 15),
      costPerKm: m.costPerKm,
      avgCost: m.avgCost
    }));
  }, [performanceData]);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="absolute -bottom-1 left-0 w-12 h-1 bg-blue-200 rounded-full animate-ping"></div>
        </div>
        <p className="text-gray-600 text-sm">Loading Top 19 Mitra Performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportData}
        isExporting={isExporting}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/driver-management/mitra-performance')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Back to Mitra List
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isRefreshing || !performanceData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium shadow-sm"
            >
              <FileSpreadsheet size={16} />
              Export Data
            </button>

            <PeriodSelector 
              currentPeriod={periodType}
              onPeriodChange={handlePeriodTypeChange}
              disabled={isRefreshing}
            />

            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors text-sm font-medium shadow-sm"
            >
              {isRefreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Top 19 Mitra Performance Dashboard</h1>
          <p className="text-gray-600 text-sm">Comprehensive performance analytics for best performing mitra partners</p>
          {filters.startDate && filters.endDate && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-blue-600" />
              <span className="text-blue-800 font-medium">
                Period: {dayjs(filters.startDate).format('DD MMM YYYY')} - {dayjs(filters.endDate).format('DD MMM YYYY')}
              </span>
              <span className="text-blue-600 capitalize">({periodType} view)</span>
            </div>
          )}
        </div>

        <FilterSection
          filters={filters}
          availableFilters={availableFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onDateRangeChange={handleDateRangeChange}
          disabled={isRefreshing}
          dateResetTrigger={dateResetTrigger}
        />

        {aggregateMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Top Performers"
              value={aggregateMetrics.totalMitras}
              change={null}
              icon={Users}
              color="blue"
              subtitle="Best 19 mitras"
            />
            <MetricCard
              title="Total Deliveries"
              value={aggregateMetrics.totalDeliveries.toLocaleString()}
              change={null}
              icon={Package}
              color="green"
            />
            <MetricCard
              title="Avg Performance"
              value={`${aggregateMetrics.avgPerformanceScore.toFixed(1)}%`}
              change={null}
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="Avg On-Time Rate"
              value={`${aggregateMetrics.avgOnTimeRate.toFixed(1)}%`}
              change={null}
              icon={Activity}
              color="orange"
            />
            <MetricCard
              title="Total Cost"
              value={`Rp ${(aggregateMetrics.totalCost / 1000000).toFixed(1)}M`}
              change={null}
              icon={DollarSign}
              color="indigo"
              subtitle={`${aggregateMetrics.totalProjects} projects`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top 10 Performers by Deliveries</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '10px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="totalDeliveries" fill="#3b82f6" name="Deliveries" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance Level Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={performanceDistribution} 
                    dataKey="count" 
                    nameKey="level" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={(entry) => `${entry.level}: ${entry.count}`}
                  >
                    {performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PERFORMANCE_LEVEL_COLORS[entry.level] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <PerformanceLevelInfo />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Top 5 Comparative Analysis</h2>
            <p className="text-xs text-gray-600 mb-4">Perbandingan multi-dimensi 5 mitra terbaik berdasarkan performance score</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" style={{ fontSize: '11px' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: '10px' }} />
                  {radarChartKeys.map((item, idx) => (
                    <Radar 
                      key={`radar-${item.key}`}
                      name={item.label} 
                      dataKey={item.key} 
                      stroke={item.color} 
                      fill={item.color} 
                      fillOpacity={0.3} 
                    />
                  ))}
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold mb-1">Penjelasan Metrik:</p>
                  <ul className="space-y-1">
                    <li>• <strong>Deliveries:</strong> Volume pengiriman (normalized)</li>
                    <li>• <strong>On-Time:</strong> Persentase ketepatan waktu</li>
                    <li>• <strong>Cost Eff.:</strong> Efisiensi biaya per pengiriman</li>
                    <li>• <strong>Projects:</strong> Diversifikasi project</li>
                    <li>• <strong>Hubs:</strong> Coverage area hub</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Cost Efficiency Analysis</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: '10px' }} />
                  <YAxis yAxisId="left" style={{ fontSize: '11px' }} />
                  <YAxis yAxisId="right" orientation="right" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="avgCost" fill="#8B5CF6" name="Avg Cost" />
                  <Line yAxisId="right" type="monotone" dataKey="costPerKm" stroke="#F59E0B" strokeWidth={2} name="Cost/Km" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance Score Ranking</h2>
            <div className="h-80 overflow-y-auto">
              <div className="space-y-3">
                {performanceData?.mitras.map((mitra) => (
                  <div key={mitra.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <RankBadge rank={mitra.rank} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{mitra.name}</p>
                      <p className="text-xs text-gray-500">{mitra.totalDeliveries} deliveries • {mitra.onTimeRate.toFixed(1)}% on-time</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{mitra.performanceScore}%</p>
                      <p className="text-xs text-gray-500">{mitra.performanceLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance Heatmap</h2>
            <div className="h-80 overflow-y-auto">
              <PerformanceHeatmap data={performanceData?.mitras || []} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance Trend Over Time ({periodType.charAt(0).toUpperCase() + periodType.slice(1)})</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="totalDeliveries" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Total Deliveries" />
                <Line yAxisId="right" type="monotone" dataKey="avgOnTimeRate" stroke="#10b981" strokeWidth={2} name="Avg On-Time Rate (%)" />
                <Bar yAxisId="left" dataKey="uniqueMitraCount" fill="#f59e0b" name="Active Mitras" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}