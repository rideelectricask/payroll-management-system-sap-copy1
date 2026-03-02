import React, { useMemo, useState, useCallback } from 'react';
import { BarChart3, Calendar, Briefcase, TrendingUp, Download, ArrowLeft, Filter, Eye, X, User, MapPin, Package, Hash, Clock, FileText, ChevronUp, ChevronDown, Activity, Target, Award, Zap, Layers, Users, FileSpreadsheet, Loader2 } from 'lucide-react';
import PaginationComponent from './PaginationComponent';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE_URL = window.REACT_APP_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const parseDateString = (dateStr) => {
  if (!dateStr || dateStr === '-') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return { day, month, year };
};

const MetricCard = ({ title, value, icon: Icon, color = 'blue', subtitle, description }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2 bg-${color}-50 rounded-lg`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
    </div>
    {description && <p className="text-xs text-gray-600 mt-2">{description}</p>}
  </div>
);

const MitraDetailModal = ({ isOpen, onClose, details, project, year, period }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'mitra_name', direction: 'asc' });

  const sortedDetails = useMemo(() => {
    if (!details || details.length === 0) return [];
    
    const sorted = [...details].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal, 'id-ID')
        : bVal.localeCompare(aVal, 'id-ID');
    });

    return sorted;
  }, [details, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mitra Details</h3>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">{project}</span> • {year} • {period}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">
                  Total Unique Mitras: {details.length}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Click column headers to sort
              </div>
            </div>
          </div>

          {sortedDetails.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No mitras found for this period</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">#</th>
                      <th onClick={() => handleSort('mitra_name')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          Mitra Name {getSortIcon('mitra_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('delivery_date')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          Delivery Date {getSortIcon('delivery_date')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('hub')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          Hub {getSortIcon('hub')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('client_name')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} />
                          Client {getSortIcon('client_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('weekly')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Hash size={14} />
                          Weekly {getSortIcon('weekly')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('sla')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          SLA {getSortIcon('sla')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('order_code')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          Order Code {getSortIcon('order_code')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedDetails.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900 max-w-[200px] truncate" title={record.mitra_name || '-'}>
                            {record.mitra_name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-900" title={record.delivery_date || '-'}>
                            {record.delivery_date || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-700 max-w-[150px] truncate" title={record.hub || '-'}>
                            {record.hub || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-700 max-w-[150px] truncate" title={record.client_name || '-'}>
                            {record.client_name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{record.weekly || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            record.sla === 'On Time' ? 'bg-green-100 text-green-800' :
                            record.sla === 'Late' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.sla || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-700 font-mono text-xs max-w-[150px] truncate" title={record.order_code || '-'}>
                            {record.order_code || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModeModal = ({ isOpen, onClose, onExport, isExporting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Choose Export Mode</h3>
              <p className="text-sm text-gray-600 mt-1">Select calculation method for your export</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={() => onExport('formula')}
            disabled={isExporting}
            className="w-full p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-2">Formula Mode (Excel Calculated)</h4>
                <p className="text-sm text-gray-600 mb-3">All values calculated using Excel formulas. Dynamic recalculation enabled.</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Live calculations with formulas
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Fully auditable and traceable
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Real-time updates on data changes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    May take longer with large datasets
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onExport('static')}
            disabled={isExporting}
            className="w-full p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-2">Static Mode (System Calculated)</h4>
                <p className="text-sm text-gray-600 mb-3">Pre-calculated values for instant display. Optimized for performance.</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Instant file opening (&lt; 5 seconds)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Optimized for 30,000+ records
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    No formula recalculation overhead
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                    Static snapshot of current data
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {isExporting ? 'Exporting...' : 'Choose the mode that best fits your needs'}
            </p>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectAnalysis = ({ mitraData, onBack }) => {
  const [activeTab, setActiveTab] = useState('project');
  const [sortConfig, setSortConfig] = useState({ key: 'project', direction: 'asc' });
  const [filterYear, setFilterYear] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterHub, setFilterHub] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [detailModal, setDetailModal] = useState({ isOpen: false, details: [], project: '', year: '', period: '', periodType: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const projectMonthlyData = useMemo(() => {
    if (!mitraData || mitraData.length === 0) return [];

    const projectYearHubMap = new Map();

    mitraData.forEach(record => {
      const project = record.client_name;
      const hub = record.hub;
      const dateStr = record.delivery_date;
      const mitraName = record.mitra_name;

      if (!project || project === '0' || project === '-' || !dateStr || dateStr === '-' || !mitraName) return;

      const parsedDate = parseDateString(dateStr);
      if (!parsedDate) return;

      const { month, year } = parsedDate;
      const monthName = MONTHS[month];

      const key = `${project}_${year}_${hub || '-'}`;

      if (!projectYearHubMap.has(key)) {
        projectYearHubMap.set(key, {
          project,
          year,
          hub: hub || '-',
          monthlyMitras: {},
          monthlyDetails: {}
        });
      }

      const projectYearHubData = projectYearHubMap.get(key);

      if (!projectYearHubData.monthlyMitras[monthName]) {
        projectYearHubData.monthlyMitras[monthName] = new Set();
        projectYearHubData.monthlyDetails[monthName] = [];
      }

      projectYearHubData.monthlyMitras[monthName].add(mitraName);
      projectYearHubData.monthlyDetails[monthName].push(record);
    });

    return Array.from(projectYearHubMap.values()).map(data => {
      const monthlyData = {};
      const monthlyDetailsData = {};

      MONTHS.forEach(month => {
        monthlyData[month] = data.monthlyMitras[month] ? data.monthlyMitras[month].size : 0;
        monthlyDetailsData[month] = data.monthlyDetails[month] || [];
      });

      const uniqueMitras = new Set();
      Object.values(data.monthlyMitras).forEach(mitras => {
        mitras.forEach(mitra => uniqueMitras.add(mitra));
      });

      return {
        project: data.project,
        year: data.year,
        hub: data.hub,
        ...monthlyData,
        monthlyDetails: monthlyDetailsData,
        total: uniqueMitras.size
      };
    });
  }, [mitraData]);

  const projectWeeklyData = useMemo(() => {
    if (!mitraData || mitraData.length === 0) return [];

    const projectWeekHubMap = new Map();

    mitraData.forEach(record => {
      const project = record.client_name;
      const hub = record.hub;
      const weekly = record.weekly;
      const mitraName = record.mitra_name;
      const dateStr = record.delivery_date;

      if (!project || project === '0' || project === '-' || !weekly || weekly === '-' || !mitraName) return;

      const parsedDate = parseDateString(dateStr);
      if (!parsedDate) return;

      const { year } = parsedDate;

      const key = `${project}_${year}_${hub || '-'}`;

      if (!projectWeekHubMap.has(key)) {
        projectWeekHubMap.set(key, {
          project,
          year,
          hub: hub || '-',
          weeklyMitras: {},
          weeklyDetails: {}
        });
      }

      const projectWeekHubData = projectWeekHubMap.get(key);

      if (!projectWeekHubData.weeklyMitras[weekly]) {
        projectWeekHubData.weeklyMitras[weekly] = new Set();
        projectWeekHubData.weeklyDetails[weekly] = [];
      }

      projectWeekHubData.weeklyMitras[weekly].add(mitraName);
      projectWeekHubData.weeklyDetails[weekly].push(record);
    });

    return Array.from(projectWeekHubMap.values()).map(data => {
      const weeklyData = {};
      const weeklyDetailsData = {};
      const allWeeks = Object.keys(data.weeklyMitras).sort((a, b) => {
        const parseWeek = (w) => {
          const match = w.match(/(\w+)\s+W(\d+)/i);
          if (!match) return { monthIndex: 99, weekNum: 0 };
          const monthName = match[1];
          const weekNum = parseInt(match[2], 10);
          const monthIndex = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthName.toLowerCase()));
          return { monthIndex: monthIndex === -1 ? 99 : monthIndex, weekNum };
        };

        const aParsed = parseWeek(a);
        const bParsed = parseWeek(b);

        if (aParsed.monthIndex !== bParsed.monthIndex) {
          return aParsed.monthIndex - bParsed.monthIndex;
        }
        return aParsed.weekNum - bParsed.weekNum;
      });

      allWeeks.forEach(week => {
        weeklyData[week] = data.weeklyMitras[week] ? data.weeklyMitras[week].size : 0;
        weeklyDetailsData[week] = data.weeklyDetails[week] || [];
      });

      const uniqueMitras = new Set();
      Object.values(data.weeklyMitras).forEach(mitras => {
        mitras.forEach(mitra => uniqueMitras.add(mitra));
      });

      return {
        project: data.project,
        year: data.year,
        hub: data.hub,
        ...weeklyData,
        weeklyDetails: weeklyDetailsData,
        total: uniqueMitras.size,
        weeks: allWeeks
      };
    });
  }, [mitraData]);

  const allWeeks = useMemo(() => {
    const weeks = new Set();
    projectWeeklyData.forEach(data => {
      if (data.weeks) {
        data.weeks.forEach(week => weeks.add(week));
      }
    });
    return Array.from(weeks).sort((a, b) => {
      const parseWeek = (w) => {
        const match = w.match(/(\w+)\s+W(\d+)/i);
        if (!match) return { monthIndex: 99, weekNum: 0 };
        const monthName = match[1];
        const weekNum = parseInt(match[2], 10);
        const monthIndex = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthName.toLowerCase()));
        return { monthIndex: monthIndex === -1 ? 99 : monthIndex, weekNum };
      };

      const aParsed = parseWeek(a);
      const bParsed = parseWeek(b);

      if (aParsed.monthIndex !== bParsed.monthIndex) {
        return aParsed.monthIndex - bParsed.monthIndex;
      }
      return aParsed.weekNum - bParsed.weekNum;
    });
  }, [projectWeeklyData]);

  const currentData = activeTab === 'project' ? projectMonthlyData : projectWeeklyData;

  const filteredData = useMemo(() => {
    let filtered = currentData;

    if (filterProject) {
      filtered = filtered.filter(item => 
        item.project.toLowerCase().includes(filterProject.toLowerCase())
      );
    }

    if (filterYear) {
      filtered = filtered.filter(item => String(item.year) === String(filterYear));
    }

    if (filterHub) {
      filtered = filtered.filter(item => item.hub === filterHub);
    }

    return filtered;
  }, [currentData, filterProject, filterYear, filterHub]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      const isMonthOrWeek = MONTHS.includes(sortConfig.key) || allWeeks.includes(sortConfig.key);

      if (sortConfig.key === 'total' || isMonthOrWeek) {
        aVal = aVal || 0;
        bVal = bVal || 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });

    return sorted;
  }, [filteredData, sortConfig, allWeeks]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const dashboardMetrics = useMemo(() => {
    const totalProjects = new Set(currentData.map(d => d.project)).size;
    const totalHubs = new Set(currentData.map(d => d.hub).filter(h => h && h !== '-')).size;
    const totalYears = new Set(currentData.map(d => d.year)).size;
    
    const allMitras = new Set();
    mitraData.forEach(record => {
      const mitraName = record.mitra_name;
      const project = record.client_name;
      if (mitraName && project && project !== '0' && project !== '-') {
        allMitras.add(mitraName);
      }
    });
    const totalUniqueMitras = allMitras.size;

    const totalRecords = currentData.reduce((sum, d) => sum + d.total, 0);
    const avgMitrasPerProject = totalProjects > 0 ? totalRecords / totalProjects : 0;

    const projectPerformance = currentData
      .reduce((acc, d) => {
        const existing = acc.find(item => item.name === d.project);
        if (existing) {
          existing.mitras += d.total;
        } else {
          acc.push({ 
            name: d.project.length > 18 ? d.project.substring(0, 18) + '...' : d.project,
            fullName: d.project,
            mitras: d.total 
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.mitras - a.mitras)
      .slice(0, 10);

    const hubDistribution = Array.from(
      currentData.reduce((acc, d) => {
        if (d.hub && d.hub !== '-') {
          acc.set(d.hub, (acc.get(d.hub) || 0) + d.total);
        }
        return acc;
      }, new Map())
    ).map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value 
    }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const periodData = activeTab === 'project'
      ? MONTHS.map(month => ({
          period: month,
          mitras: currentData.reduce((sum, d) => sum + (d[month] || 0), 0)
        }))
      : allWeeks.map(week => ({
          period: week,
          mitras: currentData.reduce((sum, d) => sum + (d[week] || 0), 0)
        }));

    return {
      totalProjects,
      totalHubs,
      totalYears,
      totalUniqueMitras,
      totalRecords,
      avgMitrasPerProject,
      projectPerformance,
      hubDistribution,
      periodData
    };
  }, [currentData, activeTab, allWeeks, mitraData]);

  const statistics = useMemo(() => {
    const totalProjects = new Set(currentData.map(d => d.project)).size;
    const totalYears = new Set(currentData.map(d => d.year)).size;
    const totalHubs = new Set(currentData.map(d => d.hub).filter(h => h && h !== '-')).size;

    const allMitras = new Set();
    mitraData.forEach(record => {
      const mitraName = record.mitra_name;
      const project = record.client_name;
      if (mitraName && project && project !== '0' && project !== '-') {
        allMitras.add(mitraName);
      }
    });

    const totalRecords = currentData.reduce((sum, d) => sum + d.total, 0);

    return {
      totalProjects,
      totalYears,
      totalHubs,
      totalUniqueMitras: allMitras.size,
      totalRecords
    };
  }, [currentData, mitraData]);

  const availableYears = useMemo(() => {
    return [...new Set(currentData.map(d => d.year))].sort((a, b) => b - a);
  }, [currentData]);

  const availableProjects = useMemo(() => {
    return [...new Set(currentData.map(d => d.project))].sort();
  }, [currentData]);

  const availableHubs = useMemo(() => {
    return [...new Set(currentData.map(d => d.hub).filter(h => h && h !== '-'))].sort();
  }, [currentData]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterYear('');
    setFilterProject('');
    setFilterHub('');
    setCurrentPage(1);
  }, []);

  const handleShowDetails = useCallback((row, period) => {
    const isProject = activeTab === 'project';
    const details = isProject ? row.monthlyDetails[period] : row.weeklyDetails[period];

    setDetailModal({
      isOpen: true,
      details: details || [],
      project: row.project,
      year: row.year,
      period: period,
      periodType: isProject ? 'month' : 'week'
    });
  }, [activeTab]);

  const handleCloseModal = useCallback(() => {
    setDetailModal({ isOpen: false, details: [], project: '', year: '', period: '', periodType: '' });
  }, []);

  const generateExportData = useCallback(() => {
    if (!sortedData || sortedData.length === 0) return null;

    const periodType = activeTab === 'project' ? 'monthly' : 'weekly';
    const columns = activeTab === 'project' ? MONTHS : allWeeks;

    const metadata = {
      'Report Type': 'Project Analysis Report - All Divisions',
      'Period Type': periodType.toUpperCase(),
      'Generated At': new Date().toLocaleString('id-ID'),
      'Total Projects': statistics.totalProjects,
      'Total Hubs': statistics.totalHubs,
      'Total Unique Mitras': statistics.totalUniqueMitras,
      'Total Records': statistics.totalRecords,
      'Active Filters': `Project: ${filterProject || 'All'}, Hub: ${filterHub || 'All'}, Year: ${filterYear || 'All'}`,
      'Data Count': `${sortedData.length} projects analyzed`
    };

    const projectAnalysis = sortedData.map(row => {
      const data = {
        'Project': row.project,
        'Hub': row.hub,
        'Year': row.year
      };

      columns.forEach(col => {
        data[col] = row[col] || 0;
      });

      data['Total'] = row.total;
      return data;
    });

    const filteredShipmentData = mitraData.filter(record => {
      if (filterYear && record.delivery_date) {
        const parts = record.delivery_date.split('/');
        if (parts.length === 3 && String(parts[2]) !== String(filterYear)) return false;
      }
      if (filterProject && record.client_name !== filterProject) return false;
      if (filterHub && record.hub !== filterHub) return false;
      return true;
    });

    const shipmentData = filteredShipmentData.map(record => ({
      'Mitra Name': record.mitra_name || '-',
      'Client Name': record.client_name || '-',
      'Delivery Date': record.delivery_date || '-',
      'Hub': record.hub || '-',
      'Drop Point': record.drop_point || '-',
      'Weekly': record.weekly || '-',
      'Order Code': record.order_code || '-',
      'Weight': record.weight || '-',
      'Distance (km)': record.distance_km || '-',
      'Cost': record.cost || '-',
      'SLA': record.sla || '-'
    }));

    const trends = dashboardMetrics.periodData;

    const summary = [{
      'Total Projects': statistics.totalProjects,
      'Total Hubs': statistics.totalHubs,
      'Total Unique Mitras': statistics.totalUniqueMitras,
      'Total Records': statistics.totalRecords,
      'Avg Mitras per Project': dashboardMetrics.avgMitrasPerProject.toFixed(2)
    }];

    const projectSummary = dashboardMetrics.projectPerformance.map((p, idx) => ({
      'Rank': idx + 1,
      'Project': p.fullName,
      'Total Unique Mitras': p.mitras
    }));

    const hubAnalysis = Array.from(
      currentData.reduce((acc, d) => {
        if (d.hub && d.hub !== '-') {
          acc.set(d.hub, (acc.get(d.hub) || 0) + d.total);
        }
        return acc;
      }, new Map())
    ).map(([hub, count]) => ({
      'Hub': hub,
      'Total Unique Mitras': count
    })).sort((a, b) => b['Total Unique Mitras'] - a['Total Unique Mitras']);

    const avgPerPeriod = statistics.totalRecords / columns.length;

    const insightsAnalysis = sortedData.slice(0, 20).map(row => {
      const performanceCategory = row.total > avgPerPeriod * 1.5 ? 'High Performer' 
        : row.total > avgPerPeriod ? 'Good Performer' 
        : 'Average Performer';
      
      const recommendation = row.total > avgPerPeriod * 1.5 
        ? 'Strategic project - maintain and expand mitra allocation' 
        : row.total > avgPerPeriod 
        ? 'Growing project - monitor and support growth' 
        : 'Review project requirements and mitra engagement';
      
      const riskLevel = row.total < avgPerPeriod * 0.5 ? 'High Risk' : 'Low Risk';
      
      return {
        'Project': row.project,
        'Hub': row.hub,
        'Performance Category': performanceCategory,
        'Total Unique Mitras': row.total,
        'Recommendation': recommendation,
        'Risk Level': riskLevel
      };
    });

    const insightsManagement = sortedData.slice(0, 15).map(row => {
      const strategicValue = row.total > 50 ? 'Key Project' 
        : row.total > 25 ? 'Growing Project' 
        : 'Standard Project';
      
      const investmentPriority = row.total > 50 ? 'High' 
        : row.total > 25 ? 'Medium' 
        : 'Low';
      
      const actionPlan = row.total > 50 
        ? 'Increase mitra allocation and optimize delivery routes' 
        : row.total > 25 
        ? 'Provide additional support and monitor mitra satisfaction' 
        : 'Evaluate project viability and improve mitra retention';
      
      return {
        'Project': row.project,
        'Hub': row.hub,
        'Strategic Value': strategicValue,
        'Investment Priority': investmentPriority,
        'Total Unique Mitras': row.total,
        'Action Plan': actionPlan
      };
    });

    const insightsOperational = hubAnalysis.slice(0, 10).map(hub => {
      const operationalStatus = hub['Total Unique Mitras'] > 100 ? 'High Capacity Hub' 
        : hub['Total Unique Mitras'] > 50 ? 'Medium Capacity Hub' 
        : 'Low Capacity Hub';
      
      const resourceAllocation = hub['Total Unique Mitras'] > 100 
        ? 'Optimize mitra distribution and expand capacity' 
        : hub['Total Unique Mitras'] > 50 
        ? 'Maintain current allocation level' 
        : 'Consolidate routes and improve efficiency';
      
      const priority = hub['Total Unique Mitras'] > 100 ? 'Critical' : 'Standard';
      
      return {
        'Hub': hub.Hub,
        'Total Unique Mitras': hub['Total Unique Mitras'],
        'Operational Status': operationalStatus,
        'Resource Allocation': resourceAllocation,
        'Priority': priority
      };
    });

    return {
      metadata,
      projectAnalysis,
      shipmentData,
      trends,
      summary,
      projectSummary,
      hubAnalysis,
      insightsAnalysis,
      insightsManagement,
      insightsOperational,
      periodType,
      appliedFilters: {
        project: filterProject || 'All',
        hub: filterHub || 'All',
        year: filterYear || 'All'
      }
    };
  }, [sortedData, mitraData, activeTab, allWeeks, statistics, dashboardMetrics, filterProject, filterHub, filterYear, currentData]);

  const handleExportData = useCallback(async (mode) => {
    try {
      setIsExporting(true);

      const exportData = generateExportData();
      if (!exportData) {
        alert('No data available for export');
        return;
      }

      const endpoint = mode === 'formula' 
        ? `${API_BASE_URL}/chart/generate-project-analysis-formula`
        : `${API_BASE_URL}/chart/generate-project-analysis`;

      console.log(`Export mode: ${mode}, endpoint: ${endpoint}`);
      console.log('Export data prepared:', {
        projectCount: exportData.projectAnalysis?.length,
        shipmentCount: exportData.shipmentData?.length,
        periodType: exportData.periodType,
        hasMetadata: !!exportData.metadata,
        mode: mode
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Export error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      console.log('Blob received, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const modeLabel = mode === 'formula' ? 'Formula' : 'Static';
      a.download = `Project_Analysis_${modeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Export completed successfully');
      setExportModalOpen(false);

    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}. Please check console for details.`);
    } finally {
      setIsExporting(false);
    }
  }, [generateExportData]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  if (!mitraData || mitraData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipment Data Available</h3>
          <p className="text-gray-600">Please load shipment data first.</p>
          <button onClick={onBack} className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm mx-auto">
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>
    );
  }

  const isProject = activeTab === 'project';
  const columns = isProject ? MONTH_SHORT : allWeeks;
  const fullColumns = isProject ? MONTHS : allWeeks;

  return (
    <div className="max-w-full mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <MitraDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleCloseModal}
        details={detailModal.details}
        project={detailModal.project}
        year={detailModal.year}
        period={detailModal.period}
        periodType={detailModal.periodType}
      />

      <ExportModeModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportData}
        isExporting={isExporting}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Project Performance Analytics</h1>
            </div>
            <p className="text-gray-600 text-sm">
              {isProject ? 'Unique Mitras per Project by Month' : 'Unique Mitras per Project by Week'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={isExporting || currentData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm shadow-sm"
            >
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
              {isExporting ? 'Exporting...' : 'Export Analysis'}
            </button>
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm shadow-sm">
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button onClick={() => handleTabChange('project')} className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'project' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              Monthly
            </div>
          </button>
          <button onClick={() => handleTabChange('mitra')} className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'mitra' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              Weekly
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Projects"
          value={dashboardMetrics.totalProjects}
          icon={Briefcase}
          color="blue"
          description="Active client projects"
        />
        <MetricCard
          title="Unique Mitras"
          value={dashboardMetrics.totalUniqueMitras}
          icon={Users}
          color="green"
          description="Delivery partners engaged"
        />
        <MetricCard
          title="Total Hubs"
          value={dashboardMetrics.totalHubs}
          icon={MapPin}
          color="purple"
          description="Distribution centers"
        />
        <MetricCard
          title="Avg Mitras/Project"
          value={dashboardMetrics.avgMitrasPerProject.toFixed(1)}
          icon={Activity}
          color="orange"
          subtitle="mitras"
          description="Resource allocation"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Top 10 Project Performance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dashboardMetrics.projectPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  style={{ fontSize: '11px' }}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize={11}>
                        <title>{payload.value}</title>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value, name, props) => [value, `${props.payload.fullName}: ${value} mitras`]}
                />
                <Bar dataKey="mitras" fill="#3b82f6" name="Unique Mitras" radius={[0, 8, 8, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Hub Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardMetrics.hubDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardMetrics.hubDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value, name, props) => [value, `${props.payload.fullName}: ${value} mitras`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Mitra Engagement Trends - {isProject ? 'Monthly' : 'Weekly'}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dashboardMetrics.periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                style={{ fontSize: '11px' }} 
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area 
                type="monotone" 
                dataKey="mitras" 
                fill="#3b82f6" 
                stroke="#3b82f6" 
                fillOpacity={0.3}
                name="Unique Mitras"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="mitras" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                name="Mitra Trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select value={filterProject} onChange={(e) => { setFilterProject(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]">
              <option value="">All Projects</option>
              {availableProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            <select value={filterHub} onChange={(e) => { setFilterHub(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]">
              <option value="">All Hubs</option>
              {availableHubs.map(hub => (
                <option key={hub} value={hub}>{hub}</option>
              ))}
            </select>

            <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]">
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
              <Filter size={16} />
              Clear Filters
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {sortedData.length} of {currentData.length} records</span>
            {sortedData.length !== currentData.length && (<span className="text-blue-600 font-medium">Filtered</span>)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th onClick={() => handleSort('project')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors sticky left-0 bg-gray-50 z-10 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    Project {getSortIcon('project')}
                  </div>
                </th>
                <th onClick={() => handleSort('hub')} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    Hub {getSortIcon('hub')}
                  </div>
                </th>
                <th onClick={() => handleSort('year')} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    Year {getSortIcon('year')}
                  </div>
                </th>
                {columns.map((col, index) => (
                  <th key={col} onClick={() => handleSort(fullColumns[index])} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {col} {getSortIcon(fullColumns[index])}
                    </div>
                  </th>
                ))}
                <th onClick={() => handleSort('total')} className="px-4 py-3 text-center text-xs font-semibold text-blue-700 cursor-pointer hover:bg-gray-100 bg-blue-50 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    Total {getSortIcon('total')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((row, index) => (
                <tr key={`${row.project}_${row.year}_${row.hub}_${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={row.project || ''}>
                      {row.project}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-center text-gray-700 whitespace-nowrap">
                    <div className="max-w-[100px] truncate mx-auto" title={row.hub || ''}>
                      {row.hub}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-center text-gray-700 whitespace-nowrap">{row.year}</td>
                  {fullColumns.map(col => (
                    <td key={col} className="px-3 py-3 text-center whitespace-nowrap">
                      {row[col] > 0 ? (
                        <button onClick={() => handleShowDetails(row, col)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors group" title="View details">
                          <span>{row[col]}</span>
                          <Eye size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center bg-blue-50 whitespace-nowrap">
                    <span className="text-sm font-bold text-blue-700">{row.total}</span>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={fullColumns.length + 4} className="px-6 py-8 text-center text-gray-500">
                    No data available for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={sortedData.length}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
};

export default ProjectAnalysis;