import React, { useMemo, useState, useCallback, useRef } from 'react';
import { User, Users, Calendar, TrendingUp, Download, ArrowLeft, Filter, Eye, X, Hash, Briefcase, Search, MapPin, Package, ChevronUp, ChevronDown, BarChart3, Activity, Target, FileSpreadsheet, Loader2 } from 'lucide-react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PaginationComponent from './PaginationComponent';

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

const DeliveryDetailModal = ({ isOpen, onClose, details, mitraName, client, year, period }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'delivery_date', direction: 'asc' });

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
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-2">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">{mitraName}</span> • {client} • {year} • {period}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="mb-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-800 text-sm">
                  Total Deliveries: {details.length}
                </span>
              </div>
            </div>
          </div>

          {sortedDetails.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No deliveries found for this period</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">#</th>
                      <th onClick={() => handleSort('mitra_name')} className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          Mitra {getSortIcon('mitra_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('delivery_date')} className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Date {getSortIcon('delivery_date')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('hub')} className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          Hub {getSortIcon('hub')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('weekly')} className="px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Hash size={14} />
                          Weekly {getSortIcon('weekly')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedDetails.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">{index + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-medium text-gray-900 max-w-[200px] truncate text-xs" title={record.mitra_name || '-'}>
                            {record.mitra_name || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{record.delivery_date || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-gray-700 max-w-[150px] truncate text-xs" title={record.hub || '-'}>
                            {record.hub || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap text-xs">{record.weekly || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-white">
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

const MitraAnalysis = ({ mitraData, onBack }) => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [sortConfig, setSortConfig] = useState({ key: 'mitra_name', direction: 'asc' });
  const [filterYear, setFilterYear] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterHub, setFilterHub] = useState('');
  const [searchMitra, setSearchMitra] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [detailModal, setDetailModal] = useState({ isOpen: false, details: [], mitraName: '', client: '', year: '', period: '', periodType: '' });
  const [isExporting, setIsExporting] = useState(false);

  const searchInputRef = useRef(null);

  const mitraMonthlyData = useMemo(() => {
    if (!mitraData || mitraData.length === 0) return [];

    const mitraMap = new Map();

    mitraData.forEach(record => {
      const mitraName = record.mitra_name;
      const client = record.client_name;
      const hub = record.hub;
      const dateStr = record.delivery_date;

      if (!mitraName || !client || client === '0' || !dateStr || dateStr === '-') return;

      const parsedDate = parseDateString(dateStr);
      if (!parsedDate) return;

      const { month, year } = parsedDate;
      const monthName = MONTHS[month];

      const key = `${mitraName}_${client}_${year}_${hub || '-'}`;

      if (!mitraMap.has(key)) {
        mitraMap.set(key, {
          mitra_name: mitraName,
          client,
          year,
          hub: hub || '-',
          monthlyDeliveries: {},
          monthlyDetails: {}
        });
      }

      const mitraEntry = mitraMap.get(key);

      if (!mitraEntry.monthlyDeliveries[monthName]) {
        mitraEntry.monthlyDeliveries[monthName] = 0;
        mitraEntry.monthlyDetails[monthName] = [];
      }

      mitraEntry.monthlyDeliveries[monthName]++;
      mitraEntry.monthlyDetails[monthName].push(record);
    });

    return Array.from(mitraMap.values()).map(data => {
      const monthlyData = {};
      const monthlyDetailsData = {};

      MONTHS.forEach(month => {
        monthlyData[month] = data.monthlyDeliveries[month] || 0;
        monthlyDetailsData[month] = data.monthlyDetails[month] || [];
      });

      const total = Object.values(data.monthlyDeliveries).reduce((sum, count) => sum + count, 0);

      return {
        mitra_name: data.mitra_name,
        client: data.client,
        year: data.year,
        hub: data.hub,
        ...monthlyData,
        monthlyDetails: monthlyDetailsData,
        total
      };
    });
  }, [mitraData]);

  const mitraWeeklyData = useMemo(() => {
    if (!mitraData || mitraData.length === 0) return [];

    const mitraMap = new Map();

    mitraData.forEach(record => {
      const mitraName = record.mitra_name;
      const client = record.client_name;
      const hub = record.hub;
      const weekly = record.weekly;
      const dateStr = record.delivery_date;

      if (!mitraName || !client || client === '0' || !weekly || weekly === '-' || !dateStr || dateStr === '-') return;

      const parsedDate = parseDateString(dateStr);
      if (!parsedDate) return;

      const { year } = parsedDate;

      const key = `${mitraName}_${client}_${year}_${hub || '-'}`;

      if (!mitraMap.has(key)) {
        mitraMap.set(key, {
          mitra_name: mitraName,
          client,
          year,
          hub: hub || '-',
          weeklyDeliveries: {},
          weeklyDetails: {}
        });
      }

      const mitraEntry = mitraMap.get(key);

      if (!mitraEntry.weeklyDeliveries[weekly]) {
        mitraEntry.weeklyDeliveries[weekly] = 0;
        mitraEntry.weeklyDetails[weekly] = [];
      }

      mitraEntry.weeklyDeliveries[weekly]++;
      mitraEntry.weeklyDetails[weekly].push(record);
    });

    return Array.from(mitraMap.values()).map(data => {
      const weeklyData = {};
      const weeklyDetailsData = {};
      const allWeeks = Object.keys(data.weeklyDeliveries).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      allWeeks.forEach(week => {
        weeklyData[week] = data.weeklyDeliveries[week] || 0;
        weeklyDetailsData[week] = data.weeklyDetails[week] || [];
      });

      const total = Object.values(data.weeklyDeliveries).reduce((sum, count) => sum + count, 0);

      return {
        mitra_name: data.mitra_name,
        client: data.client,
        year: data.year,
        hub: data.hub,
        ...weeklyData,
        weeklyDetails: weeklyDetailsData,
        total,
        weeks: allWeeks
      };
    });
  }, [mitraData]);

  const allWeeks = useMemo(() => {
    const weeks = new Set();
    mitraWeeklyData.forEach(data => {
      if (data.weeks) {
        data.weeks.forEach(week => weeks.add(week));
      }
    });
    return Array.from(weeks).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [mitraWeeklyData]);

  const currentData = activeTab === 'monthly' ? mitraMonthlyData : mitraWeeklyData;

  const filteredData = useMemo(() => {
    let filtered = currentData;

    if (searchMitra) {
      filtered = filtered.filter(item => 
        item.mitra_name.toLowerCase().includes(searchMitra.toLowerCase())
      );
    }

    if (filterClient) {
      filtered = filtered.filter(item => 
        item.client.toLowerCase().includes(filterClient.toLowerCase())
      );
    }

    if (filterYear) {
      filtered = filtered.filter(item => String(item.year) === String(filterYear));
    }

    if (filterHub) {
      filtered = filtered.filter(item => item.hub === filterHub);
    }

    return filtered;
  }, [currentData, searchMitra, filterClient, filterYear, filterHub]);

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
    const uniqueMitras = new Set(currentData.map(d => d.mitra_name)).size;
    const totalClients = new Set(currentData.map(d => d.client)).size;
    const totalHubs = new Set(currentData.map(d => d.hub).filter(h => h && h !== '-')).size;
    const totalDeliveries = currentData.reduce((sum, d) => sum + d.total, 0);
    const avgDeliveriesPerMitra = uniqueMitras > 0 ? totalDeliveries / uniqueMitras : 0;

    const mitraPerformance = currentData.map(d => ({
      name: d.mitra_name.length > 15 ? d.mitra_name.substring(0, 15) + '...' : d.mitra_name,
      fullName: d.mitra_name,
      total: d.total
    })).sort((a, b) => b.total - a.total).slice(0, 10);

    const clientDistribution = Array.from(
      currentData.reduce((acc, d) => {
        acc.set(d.client, (acc.get(d.client) || 0) + d.total);
        return acc;
      }, new Map())
    ).map(([name, value]) => ({ 
      name: name.length > 12 ? name.substring(0, 12) + '...' : name,
      fullName: name,
      value 
    }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const periodData = activeTab === 'monthly'
      ? MONTHS.map(month => ({
          period: month,
          deliveries: currentData.reduce((sum, d) => sum + (d[month] || 0), 0)
        }))
      : allWeeks.map(week => ({
          period: week,
          deliveries: currentData.reduce((sum, d) => sum + (d[week] || 0), 0)
        }));

    return {
      uniqueMitras,
      totalClients,
      totalHubs,
      totalDeliveries,
      avgDeliveriesPerMitra,
      mitraPerformance,
      clientDistribution,
      periodData
    };
  }, [currentData, activeTab, allWeeks]);

  const statistics = useMemo(() => {
    const uniqueMitras = new Set(currentData.map(d => d.mitra_name)).size;
    const totalClients = new Set(currentData.map(d => d.client)).size;
    const totalHubs = new Set(currentData.map(d => d.hub).filter(h => h && h !== '-')).size;
    const totalDeliveries = currentData.reduce((sum, d) => sum + d.total, 0);

    return {
      uniqueMitras,
      totalClients,
      totalHubs,
      totalDeliveries
    };
  }, [currentData]);

  const availableYears = useMemo(() => {
    return [...new Set(currentData.map(d => d.year))].sort((a, b) => b - a);
  }, [currentData]);

  const availableClients = useMemo(() => {
    return [...new Set(currentData.map(d => d.client))].sort();
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
    setFilterClient('');
    setFilterHub('');
    setSearchMitra('');
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleShowDetails = useCallback((row, period) => {
    const isMonthly = activeTab === 'monthly';
    const details = isMonthly ? row.monthlyDetails[period] : row.weeklyDetails[period];

    setDetailModal({
      isOpen: true,
      details: details || [],
      mitraName: row.mitra_name,
      client: row.client,
      year: row.year,
      period: period,
      periodType: isMonthly ? 'month' : 'week'
    });
  }, [activeTab]);

  const handleCloseModal = useCallback(() => {
    setDetailModal({ isOpen: false, details: [], mitraName: '', client: '', year: '', period: '', periodType: '' });
  }, []);

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

  const generateExportData = useCallback(() => {
    if (!sortedData || sortedData.length === 0) return null;

    const periodType = activeTab;
    const columns = activeTab === 'monthly' ? MONTHS : allWeeks;

    const metadata = {
      'Report Type': 'Mitra Analysis Report - All Divisions',
      'Period Type': periodType.toUpperCase(),
      'Generated At': new Date().toLocaleString('id-ID'),
      'Total Mitras': statistics.uniqueMitras,
      'Total Clients': statistics.totalClients,
      'Total Hubs': statistics.totalHubs,
      'Total Deliveries': statistics.totalDeliveries,
      'Active Filters': `Client: ${filterClient || 'All'}, Hub: ${filterHub || 'All'}, Year: ${filterYear || 'All'}`
    };

    const mitraAnalysis = sortedData.map(row => {
      const data = {
        'Mitra Name': row.mitra_name,
        'Client': row.client,
        'Hub': row.hub,
        'Year': row.year
      };

      columns.forEach(col => {
        data[col] = row[col] || 0;
      });

      data['Total'] = row.total;
      return data;
    });

    const shipmentData = mitraData
      .filter(record => {
        if (filterYear && String(record.delivery_date).includes('/')) {
          const parts = record.delivery_date.split('/');
          if (parts.length === 3 && String(parts[2]) !== String(filterYear)) return false;
        }
        if (filterClient && record.client_name !== filterClient) return false;
        if (filterHub && record.hub !== filterHub) return false;
        if (searchMitra && !record.mitra_name.toLowerCase().includes(searchMitra.toLowerCase())) return false;
        return true;
      })
      .map(record => ({
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
      'Unique Mitras': statistics.uniqueMitras,
      'Total Clients': statistics.totalClients,
      'Total Hubs': statistics.totalHubs,
      'Total Deliveries': statistics.totalDeliveries,
      'Avg Deliveries per Mitra': dashboardMetrics.avgDeliveriesPerMitra.toFixed(2)
    }];

    const mitraSummary = dashboardMetrics.mitraPerformance.map((m, idx) => ({
      'Rank': idx + 1,
      'Mitra Name': m.fullName,
      'Total Deliveries': m.total
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
      'Total Deliveries': count
    })).sort((a, b) => b['Total Deliveries'] - a['Total Deliveries']);

    const clientAnalysis = dashboardMetrics.clientDistribution.map((c, idx) => ({
      'Rank': idx + 1,
      'Client': c.fullName,
      'Total Deliveries': c.value,
      'Percentage': ((c.value / statistics.totalDeliveries) * 100).toFixed(2) + '%'
    }));

    const avgPerPeriod = statistics.totalDeliveries / columns.length;

    const insightsAnalysis = sortedData.slice(0, 20).map(row => {
      const performanceCategory = row.total > avgPerPeriod * 1.5 ? 'High Performer' 
        : row.total > avgPerPeriod ? 'Good Performer' 
        : 'Average Performer';
      
      const recommendation = row.total > avgPerPeriod * 1.5 
        ? 'Maintain performance and consider for expansion' 
        : row.total > avgPerPeriod 
        ? 'Monitor consistency and support growth' 
        : 'Review performance and provide training';
      
      const riskLevel = row.total < avgPerPeriod * 0.5 ? 'High Risk' : 'Low Risk';
      
      return {
        'Mitra Name': row.mitra_name,
        'Performance Category': performanceCategory,
        'Total Deliveries': row.total,
        'Recommendation': recommendation,
        'Risk Level': riskLevel
      };
    });

    const insightsManagement = sortedData.slice(0, 15).map(row => {
      const strategicValue = row.total > 100 ? 'Key Partner' 
        : row.total > 50 ? 'Growing Partner' 
        : 'Standard Partner';
      
      const investmentPriority = row.total > 100 ? 'High' 
        : row.total > 50 ? 'Medium' 
        : 'Low';
      
      const actionPlan = row.total > 100 
        ? 'Negotiate long-term contracts and increase allocation' 
        : row.total > 50 
        ? 'Provide growth incentives and training programs' 
        : 'Monitor performance closely and set improvement targets';
      
      return {
        'Mitra Name': row.mitra_name,
        'Strategic Value': strategicValue,
        'Investment Priority': investmentPriority,
        'Total Deliveries': row.total,
        'Action Plan': actionPlan
      };
    });

    const insightsOperational = hubAnalysis.slice(0, 10).map(hub => {
      const operationalStatus = hub['Total Deliveries'] > 200 ? 'High Volume Hub' 
        : hub['Total Deliveries'] > 100 ? 'Medium Volume Hub' 
        : 'Low Volume Hub';
      
      const resourceAllocation = hub['Total Deliveries'] > 200 
        ? 'Increase capacity and allocate more mitras' 
        : hub['Total Deliveries'] > 100 
        ? 'Maintain current resource level' 
        : 'Optimize resources and consolidate routes';
      
      const priority = hub['Total Deliveries'] > 200 ? 'Critical' : 'Standard';
      
      return {
        'Hub': hub.Hub,
        'Total Deliveries': hub['Total Deliveries'],
        'Operational Status': operationalStatus,
        'Resource Allocation': resourceAllocation,
        'Priority': priority
      };
    });

    return {
      metadata,
      mitraAnalysis,
      shipmentData,
      trends,
      summary,
      mitraSummary,
      hubAnalysis,
      clientAnalysis,
      insightsAnalysis,
      insightsManagement,
      insightsOperational,
      periodType,
      appliedFilters: {
        client: filterClient || 'All',
        hub: filterHub || 'All',
        year: filterYear || 'All',
        mitraSearch: searchMitra || 'None'
      }
    };
  }, [sortedData, mitraData, activeTab, allWeeks, statistics, dashboardMetrics, filterClient, filterHub, filterYear, searchMitra, currentData]);

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);

      const exportData = generateExportData();
      if (!exportData) {
        alert('No data available for export');
        return;
      }

      console.log('Export data prepared:', {
        mitraCount: exportData.mitraAnalysis?.length,
        shipmentCount: exportData.shipmentData?.length,
        periodType: exportData.periodType,
        hasMetadata: !!exportData.metadata
      });

      const response = await fetch(`${API_BASE_URL}/chart/generate-mitra-analysis`, {
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
      a.download = `Mitra_Analysis_Complete_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Export completed successfully');

    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}. Please check console for details.`);
    } finally {
      setIsExporting(false);
    }
  }, [generateExportData]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />;
  };

  if (!mitraData || mitraData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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

  const isMonthly = activeTab === 'monthly';
  const columns = isMonthly ? MONTH_SHORT : allWeeks;
  const fullColumns = isMonthly ? MONTHS : allWeeks;

  return (
    <div className="max-w-full mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <DeliveryDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleCloseModal}
        details={detailModal.details}
        mitraName={detailModal.mitraName}
        client={detailModal.client}
        year={detailModal.year}
        period={detailModal.period}
        periodType={detailModal.periodType}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <User className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">Mitra Performance Analytics</h1>
            </div>
            <p className="text-gray-600 text-sm">
              {isMonthly ? 'Delivery Count per Mitra by Month' : 'Delivery Count per Mitra by Week'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              disabled={isExporting || currentData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium shadow-sm"
            >
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
              Export Complete Analysis
            </button>
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm shadow-sm">
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => handleTabChange('monthly')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            Monthly
          </button>
          <button
            onClick={() => handleTabChange('weekly')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Hash size={16} className="inline mr-2" />
            Weekly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="Unique Mitras"
          value={statistics.uniqueMitras}
          icon={Users}
          color="purple"
          description="Active delivery partners"
        />
        <MetricCard
          title="Total Clients"
          value={statistics.totalClients}
          icon={Briefcase}
          color="blue"
          description="Unique client projects"
        />
        <MetricCard
          title="Total Deliveries"
          value={statistics.totalDeliveries.toLocaleString()}
          icon={Package}
          color="green"
          description="Completed shipments"
        />
        <MetricCard
          title="Avg per Mitra"
          value={dashboardMetrics.avgDeliveriesPerMitra.toFixed(1)}
          icon={Activity}
          color="orange"
          subtitle="deliveries"
          description="Average workload"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Top 10 Mitra Performance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dashboardMetrics.mitraPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" style={{ fontSize: '11px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  style={{ fontSize: '10px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value, name, props) => [value, `${props.payload.fullName}: ${value} deliveries`]}
                />
                <Bar dataKey="total" fill="#8b5cf6" name="Total Deliveries" radius={[0, 8, 8, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Client Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardMetrics.clientDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardMetrics.clientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value, name, props) => [value, `${props.payload.fullName}: ${value} deliveries`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Delivery Trends - {isMonthly ? 'Monthly' : 'Weekly'}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dashboardMetrics.periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                style={{ fontSize: '10px' }} 
              />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '11px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area 
                type="monotone" 
                dataKey="deliveries" 
                fill="#8b5cf6" 
                stroke="#8b5cf6" 
                fillOpacity={0.3}
                name="Total Deliveries"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="deliveries" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                name="Delivery Trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <div className="mb-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search mitra name..."
                value={searchMitra}
                onChange={(e) => {
                  setSearchMitra(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
              />
              {searchMitra && (
                <button
                  onClick={() => {
                    setSearchMitra('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={filterClient} onChange={(e) => { setFilterClient(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white min-w-[160px]">
              <option value="">All Clients</option>
              {availableClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>

            <select value={filterHub} onChange={(e) => { setFilterHub(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white min-w-[140px]">
              <option value="">All Hubs</option>
              {availableHubs.map(hub => (
                <option key={hub} value={hub}>{hub}</option>
              ))}
            </select>

            <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white min-w-[120px]">
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

          <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
            <span>
              Showing {sortedData.length} of {currentData.length} records
            </span>
            {sortedData.length !== currentData.length && (
              <span className="text-purple-600 font-medium">Filtered</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th onClick={() => handleSort('mitra_name')} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors sticky left-0 bg-gray-50 z-10 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>Mitra Name</span>
                    {getSortIcon('mitra_name')}
                  </div>
                </th>
                <th onClick={() => handleSort('client')} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>Client</span>
                    {getSortIcon('client')}
                  </div>
                </th>
                <th onClick={() => handleSort('hub')} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Hub</span>
                    {getSortIcon('hub')}
                  </div>
                </th>
                <th onClick={() => handleSort('year')} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Year</span>
                    {getSortIcon('year')}
                  </div>
                </th>
                {columns.map((col, index) => (
                  <th key={col} onClick={() => handleSort(fullColumns[index])} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>{col}</span>
                      {getSortIcon(fullColumns[index])}
                    </div>
                  </th>
                ))}
                <th onClick={() => handleSort('total')} className="px-3 py-3 text-center text-xs font-semibold text-purple-700 cursor-pointer hover:bg-gray-100 bg-purple-50 transition-colors whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Total</span>
                    {getSortIcon('total')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((row, index) => (
                <tr key={`${row.mitra_name}_${row.client}_${row.year}_${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 sticky left-0 bg-white whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate" title={row.mitra_name || ''}>
                      {row.mitra_name}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-700 max-w-[140px] truncate" title={row.client || ''}>
                      {row.client}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-center text-gray-700 whitespace-nowrap">
                    <div className="max-w-[90px] truncate mx-auto" title={row.hub || ''}>
                      {row.hub}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-center text-gray-700 whitespace-nowrap">
                    {row.year}
                  </td>
                  {fullColumns.map(col => (
                    <td key={col} className="px-3 py-3 text-center whitespace-nowrap">
                      {row[col] > 0 ? (
                        <button onClick={() => handleShowDetails(row, col)} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded transition-colors group" title="View details">
                          <span>{row[col]}</span>
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center bg-purple-50 whitespace-nowrap">
                    <span className="text-sm font-bold text-purple-700">{row.total}</span>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={fullColumns.length + 5} className="px-6 py-8 text-center text-gray-500">
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

export default MitraAnalysis;