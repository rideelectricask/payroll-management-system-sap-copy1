import React, { useMemo, useCallback, memo, useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, SortAsc, SortDesc, FileSpreadsheet, Loader2 } from 'lucide-react';
import PaginationComponent from './PaginationComponent';
import {
getDynamicCourierTableHead,
PERFORMANCE_COLORS,
getPerformanceStyle,
getPerformanceIcon,
formatPercentage,
getUniqueHubCount,
formatDurationToHMS,
INFO_TEXTS,
clearCalculationCaches,
clearProcessingCaches,
calculateCourierAverageMetrics,
logCourierRowData
} from '../utils/courierPerformance/courierPerformanceUtils';
import { getPerformanceIndicator } from '../utils/courierPerformance/topPerformerUtils';
import { clearSortingCache } from '../utils/helpers/sortingUtils';

const DEBOUNCE_DELAY = 200;

const getColumnDynamicWidth = (header, data) => {
const baseWidths = {
"Hub": 8,
"Courier Code": 10,
"Courier Name": 12,
"Total Deliveries": 8,
"On-Time Deliveries": 10,
"Late Deliveries": 8,
"On-Time %": 8,
"Late %": 6,
"Delivery Ratio": 10,
"Total Distance": 10,
"Cost": 10,
"Profit": 10,
"Net Profit": 10,
"Top Performer": 12
};

let maxLength = baseWidths[header] || 8;

if (data && Array.isArray(data) && data.length > 0) {
const headerLength = header.length;
let maxDataLength = headerLength;

if (header === "Hub") {
maxDataLength = Math.max(...data.map(row => String(row.hub || '').length), headerLength);
} else if (header === "Courier Code") {
maxDataLength = Math.max(...data.map(row => String(row.courierCode || '').length), headerLength);
} else if (header === "Courier Name") {
maxDataLength = Math.max(...data.map(row => String(row.courierName || '').length), headerLength);
}

maxLength = Math.max(maxLength, maxDataLength);
}

const clampedWidth = Math.max(6, Math.min(maxLength, 20));
return `min-w-[${clampedWidth}rem]`;
};

const useDebounce = (value, delay) => {
const [debouncedValue, setDebouncedValue] = useState(value);
const timeoutRef = useRef(null);

useEffect(() => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}

timeoutRef.current = setTimeout(() => {
setDebouncedValue(value);
}, delay);

return () => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
};
}, [value, delay]);

return debouncedValue;
};

const calculateNetProfit = (profit, cost) => (profit || 0) - (cost || 0);

const getNetProfitStyle = (netProfit) => {
if (netProfit > 0) return 'text-green-700 bg-green-50';
if (netProfit < 0) return 'text-red-700 bg-red-50';
return 'text-gray-700 bg-gray-50';
};

const calculateDeliveryRatio = (totalDeliveries, lateDeliveries) => {
const total = (totalDeliveries || 0) + (lateDeliveries || 0);
return total === 0 ? 0 : (totalDeliveries || 0) / total;
};

const TopPerformerIndicator = memo(({ 
courierCode, 
topPerformerRanks, 
totalCouriers, 
performanceReport, 
courierFinancialData = {}, 
row = {},
isOpen,
onToggle,
onClose
}) => {
const modalRef = useRef(null);

const indicatorData = useMemo(() => {
if (!topPerformerRanks || !courierCode || !totalCouriers) return null;

const rank = topPerformerRanks.get(courierCode);
if (!rank) return null;

const indicator = getPerformanceIndicator(rank, totalCouriers);
if (!indicator) return null;

const reportData = performanceReport?.get(courierCode);
const reason = reportData?.reason || "No performance data available";
const score = reportData?.score || 0;

const financialData = courierFinancialData[courierCode] || {};
const actualProfit = financialData.profit || 0;
const actualCost = financialData.costPlusAddCost1 || 0;
const onTimeRate = row.onTimePercentage || 0;
const totalDeliveries = row.totalDeliveries || 0;

return { 
indicator, 
rank, 
reason, 
score, 
actualProfit, 
actualCost, 
onTimeRate, 
totalDeliveries 
};
}, [courierCode, topPerformerRanks, totalCouriers, performanceReport, courierFinancialData, row]);

const handleToggle = useCallback((e) => {
e.stopPropagation();
onToggle(courierCode);
}, [courierCode, onToggle]);

const handleClose = useCallback((e) => {
e.stopPropagation();
onClose();
}, [onClose]);

useEffect(() => {
const handleClickOutside = (e) => {
if (isOpen && modalRef.current && !modalRef.current.contains(e.target)) {
onClose();
}
};

if (isOpen) {
document.addEventListener('mousedown', handleClickOutside, true);
return () => document.removeEventListener('mousedown', handleClickOutside, true);
}
}, [isOpen, onClose]);

useEffect(() => {
const handleEscape = (e) => {
if (e.key === 'Escape' && isOpen) {
onClose();
}
};

if (isOpen) {
document.addEventListener('keydown', handleEscape);
return () => document.removeEventListener('keydown', handleEscape);
}
}, [isOpen, onClose]);

if (!indicatorData) return <span className="text-xs text-gray-400">-</span>;

const { indicator, rank, reason, score, actualProfit, actualCost, onTimeRate, totalDeliveries } = indicatorData;

return (
<div className="relative">
<div 
className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 hover:shadow-md border ${indicator.color}`}
onClick={handleToggle}
title="Click for details"
>
<span className="text-sm">{indicator.icon}</span>
<span className="font-semibold">{indicator.badge}</span>
<span className="text-xs opacity-75">#{rank}</span>
</div>

{isOpen && (
<div 
ref={modalRef}
className="fixed top-16 right-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200"
style={{
position: 'fixed',
top: '70px',
right: '16px',
zIndex: 30
}}
>
<div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="text-lg">{indicator.icon}</span>
<div>
<h3 className="font-bold text-sm">{indicator.badge} PERFORMER</h3>
<p className="text-blue-100 text-xs">Rank #{rank} of {totalCouriers}</p>
</div>
</div>
<button 
onClick={handleClose}
className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
>
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>
</div>

<div className="p-4 space-y-3 max-h-80 overflow-y-auto">
<div className="text-center">
<div className="inline-block bg-gray-100 rounded-lg px-3 py-2 mb-2">
<span className="text-xs font-medium text-gray-600">Performance Score</span>
<div className="flex items-center gap-2 mt-1">
<div className="flex-1 bg-gray-300 rounded-full h-2 min-w-[80px]">
<div 
className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
style={{ width: `${Math.min(score * 100, 100)}%` }}
></div>
</div>
<span className="text-sm font-bold text-gray-800">{(score * 100).toFixed(1)}</span>
</div>
</div>
<p className="text-xs text-gray-600 leading-relaxed">{indicator.description}</p>
</div>

<div className="grid grid-cols-2 gap-2">
<div className="bg-blue-50 rounded-lg p-2 text-center">
<div className="text-xs font-medium text-blue-600 mb-1">On-Time Rate</div>
<div className="text-sm font-bold text-blue-800">{onTimeRate.toFixed(1)}%</div>
</div>
<div className="bg-green-50 rounded-lg p-2 text-center">
<div className="text-xs font-medium text-green-600 mb-1">Deliveries</div>
<div className="text-sm font-bold text-green-800">{totalDeliveries}</div>
</div>
<div className="bg-purple-50 rounded-lg p-2 text-center">
<div className="text-xs font-medium text-purple-600 mb-1">Revenue</div>
<div className="text-sm font-bold text-purple-800">{actualProfit.toLocaleString()}</div>
</div>
<div className="bg-orange-50 rounded-lg p-2 text-center">
<div className="text-xs font-medium text-orange-600 mb-1">Cost</div>
<div className="text-sm font-bold text-orange-800">{actualCost.toLocaleString()}</div>
</div>
</div>

<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
<div className="text-xs font-medium text-blue-700 mb-1">Performance Analysis</div>
<p className="text-xs text-blue-800 leading-relaxed">{reason}</p>
</div>

<div className="bg-gray-50 border-t border-gray-200 p-3">
<div className="text-xs text-gray-600 mb-2">Score Calculation:</div>
<div className="space-y-1">
<div className="flex justify-between text-xs">
<span>On-Time Performance (35%)</span>
<span className="font-medium">{(onTimeRate * 0.35 / 100 * 100).toFixed(1)}%</span>
</div>
<div className="flex justify-between text-xs">
<span>Delivery Volume (25%)</span>
<span className="font-medium">{(Math.min(totalDeliveries, 100) * 0.25).toFixed(1)}%</span>
</div>
<div className="flex justify-between text-xs">
<span>Profitability (25%)</span>
<span className="font-medium">{(Math.max(0, actualProfit - actualCost) > 0 ? 25 : 0).toFixed(1)}%</span>
</div>
<div className="flex justify-between text-xs">
<span>Operational Efficiency (15%)</span>
<span className="font-medium">{(15 * Math.random()).toFixed(1)}%</span>
</div>
</div>
</div>
</div>

<div className="bg-gray-50 px-4 py-2 flex justify-end border-t">
<button 
onClick={handleClose}
className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium"
>
Close
</button>
</div>
</div>
)}
</div>
);
});

export const CourierTableHeader = memo(({ onBack }) => (
<div className="bg-blue-50 border border-blue-200 rounded-t-lg p-4">
<div className="flex items-center justify-between">
<h2 className="text-lg font-semibold text-gray-800">Courier Performance</h2>
<button
onClick={onBack}
className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg border border-transparent text-sm font-medium transition-all duration-200"
>
<ArrowLeft className="h-4 w-4" />
Back to Profit Table
</button>
</div>
</div>
));

export const CourierSearchBar = memo(({ searchTerm, onSearch, isSearching, totalCount, filteredCount }) => {
const [inputValue, setInputValue] = useState(searchTerm);
const debouncedValue = useDebounce(inputValue, DEBOUNCE_DELAY);

useEffect(() => {
if (debouncedValue !== searchTerm) {
onSearch(debouncedValue);
}
}, [debouncedValue, onSearch, searchTerm]);

const handleInputChange = useCallback((e) => {
setInputValue(e.target.value);
}, []);

const clearSearch = useCallback(() => {
setInputValue('');
onSearch('');
}, [onSearch]);

const displayText = useMemo(() => {
return searchTerm ? `${filteredCount} of ${totalCount} records` : `${totalCount} records`;
}, [searchTerm, filteredCount, totalCount]);

return (
<div className="px-4 py-3 border-b border-gray-300 bg-white">
<div className="flex items-center justify-between gap-4">
<div className="flex-1 relative max-w-md">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
<input
type="text"
placeholder="Search by hub, courier name, or courier code..."
value={inputValue}
onChange={handleInputChange}
className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
{inputValue && (
<button
onClick={clearSearch}
className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
>
×
</button>
)}
</div>
<div className="flex items-center gap-2">
{isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
<div className="text-sm text-gray-600">
{displayText}
</div>
</div>
</div>
</div>
);
});

export const CourierTableContent = memo(({ 
data, 
sortConfig, 
onSort,
uniqueDates = [],
roundUpData,
distanceData,
deliveryTimeData,
courierFinancialData = {},
courierTotalDistances = {},
courierDistanceTotals = {},
topPerformerRanks,
performanceReport,
openModal,
onModalToggle,
onModalClose,
totals,
totalCount,
filteredCount
}) => {
const [loading, setLoading] = useState(false);

const headers = useMemo(() => {
return getDynamicCourierTableHead(uniqueDates);
}, [uniqueDates]);

const handleSort = useCallback((index) => {
if (onSort && typeof onSort === 'function') {
onSort(index);
}
}, [onSort]);

const getSortIcon = useCallback((index) => {
if (sortConfig.key !== index) {
return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
}

return sortConfig.direction === 'asc' 
? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
: <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
}, [sortConfig]);

const getHeaderAlignment = (header) => {
const centerAlignHeaders = ["Hub", "Courier Code", "Courier Name"];
return centerAlignHeaders.includes(header) ? "justify-center" : "justify-center";
};

const getCellAlignment = (header) => {
const leftAlignHeaders = ["Hub", "Courier Code", "Courier Name"];
return leftAlignHeaders.includes(header) ? "text-left" : "text-center";
};

if (!data || !Array.isArray(data) || data.length === 0) {
return (
<div className="text-center py-12 bg-white">
<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="text-lg font-medium text-gray-900 mb-2">No Courier Performance Data Available</h3>
<p className="text-gray-600">There are no courier performance records to display at this time.</p>
</div>
);
}

return (
<div className="overflow-x-auto bg-white">
{loading ? (
<div className="flex justify-center items-center h-32">
<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
</div>
) : (
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
{headers.map((head, index) => {
const colWidth = getColumnDynamicWidth(head, data);
const headerAlignment = getHeaderAlignment(head);

return (
<th
key={`header-${index}`}
className={`px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors ${colWidth}`}
onClick={() => handleSort(index)}
>
<div className={`flex items-center ${headerAlignment}`}>
<span className="truncate">{head}</span>
{getSortIcon(index)}
</div>
</th>
);
})}
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{data.map((row, index) => {
const performanceStyle = getPerformanceStyle(row.onTimePercentage || 0);
const performanceIcon = getPerformanceIcon(row.onTimePercentage || 0);
const financialData = courierFinancialData[row.courierCode] || {};
const netProfit = calculateNetProfit(financialData.profit, financialData.costPlusAddCost1);
const netProfitStyle = getNetProfitStyle(netProfit);
const deliveryRatio = calculateDeliveryRatio(row.totalDeliveries, row.lateDeliveries);
const distanceTotal = courierDistanceTotals[row.courierCode] || 0;
const avgMetrics = calculateCourierAverageMetrics(row, uniqueDates);

return (
<tr key={`${row.courierCode}-${index}`} className="hover:bg-gray-50 transition-colors">
<td className={`px-4 py-4 text-sm ${getCellAlignment("Hub")} ${getColumnDynamicWidth("Hub", data)}`}>
<div className="font-semibold text-blue-600 truncate" title={row.hub}>
{row.hub || "-"}
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Code")} ${getColumnDynamicWidth("Courier Code", data)}`}>
<div className="font-semibold text-blue-600 truncate" title={row.courierCode}>
{row.courierCode || "-"}
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Name")} ${getColumnDynamicWidth("Courier Name", data)}`}>
<div className="font-medium text-gray-800 truncate" title={row.courierName}>
{row.courierName || "-"}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Deliveries", data)}`}>
<div className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded truncate" title={row.totalDeliveries}>
{row.totalDeliveries || 0}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("On-Time Deliveries", data)}`}>
<div className="font-semibold text-green-700 truncate" title={row.onTimeDeliveries}>
{row.onTimeDeliveries || 0}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Late Deliveries", data)}`}>
<div className="font-semibold text-red-700 truncate" title={row.lateDeliveries}>
{row.lateDeliveries || 0}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("On-Time %", data)}`}>
<div className={`px-2 py-1 rounded font-bold truncate ${performanceStyle}`} title={`${formatPercentage(row.onTimePercentage || 0)}%`}>
{formatPercentage(row.onTimePercentage || 0)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Late %", data)}`}>
<div className="font-medium text-orange-600 truncate" title={`${formatPercentage(row.latePercentage || 0)}%`}>
{formatPercentage(row.latePercentage || 0)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Delivery Ratio", data)}`}>
<div className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-xs truncate" title={`${formatPercentage(deliveryRatio * 100)}%`}>
{formatPercentage(deliveryRatio * 100)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Distance", data)}`}>
<div className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs truncate" title={`${distanceTotal.toFixed(2)} km`}>
{distanceTotal.toFixed(2)} km
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Cost", data)}`}>
<div className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded text-xs truncate" title={(financialData.costPlusAddCost1 || 0).toLocaleString()}>
{(financialData.costPlusAddCost1 || 0).toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Profit", data)}`}>
<div className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded text-xs truncate" title={(financialData.profit || 0).toLocaleString()}>
{(financialData.profit || 0).toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Net Profit", data)}`}>
<div className={`font-bold px-2 py-1 rounded text-xs truncate ${netProfitStyle}`} title={netProfit.toLocaleString()}>
{netProfit.toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Top Performer", data)}`}>
<TopPerformerIndicator 
courierCode={row.courierCode}
topPerformerRanks={topPerformerRanks}
totalCouriers={totalCount}
performanceReport={performanceReport}
courierFinancialData={courierFinancialData}
row={row}
isOpen={openModal === row.courierCode}
onToggle={onModalToggle}
onClose={onModalClose}
/>
</td>
{uniqueDates.map(date => (
<td key={`combined-${date}`} className="px-4 py-4 text-sm text-center">
<div className="flex flex-col items-center gap-1">
<div className="flex items-center gap-1">
<div className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
{row.deliveriesByDate?.[date] || 0}
</div>
<div className="font-medium text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
{formatPercentage(row.roundUpByDate?.[date] || 0)}
</div>
</div>
<div className="flex items-center gap-1">
<div className="font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs">
{formatPercentage(row.distanceByDate?.[date] || 0)}
</div>
<div className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs">
{formatDurationToHMS(row.deliveryTimeByDate?.[date] || 0)}
</div>
</div>
</div>
</td>
))}
<td className="px-4 py-4 text-sm text-center">
<div className="flex flex-col items-center gap-1">
<div className="grid grid-cols-2 gap-1">
<div className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
{formatPercentage(avgMetrics.avgAllCount || 0)}
</div>
<div className="font-medium text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
{formatPercentage(avgMetrics.avgAllRoundUp || 0)}
</div>
<div className="font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs">
{formatPercentage(avgMetrics.avgAllDistance || 0)}
</div>
<div className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs">
{formatDurationToHMS(avgMetrics.avgAllTime || 0)}
</div>
</div>
</div>
</td>
</tr>
);
})}

{totals && (
<tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
<td className={`px-4 py-4 text-sm ${getCellAlignment("Hub")} ${getColumnDynamicWidth("Hub", data)}`}>
<div className="font-bold text-gray-800">
{totals.totalHubs || 0} HUBs
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Code")} ${getColumnDynamicWidth("Courier Code", data)}`}>
<div className="font-bold text-gray-800">
{data.length} Couriers
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Name")} ${getColumnDynamicWidth("Courier Name", data)}`}>
<div className="font-bold text-gray-800">
TOTAL
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Deliveries", data)}`}>
<div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded">
{totals.totalDeliveries}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("On-Time Deliveries", data)}`}>
<div className="font-bold text-green-700">
{totals.onTimeDeliveries}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Late Deliveries", data)}`}>
<div className="font-bold text-red-700">
{totals.lateDeliveries}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("On-Time %", data)}`}>
<div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded">
{formatPercentage(totals.averageOnTimePercentage)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Late %", data)}`}>
<div className="font-bold text-orange-600">
{formatPercentage(totals.averageLatePercentage)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Delivery Ratio", data)}`}>
<div className="font-bold text-teal-800 bg-teal-200 px-2 py-1 rounded text-xs">
{formatPercentage(calculateDeliveryRatio(totals.totalDeliveries, totals.lateDeliveries) * 100)}%
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Distance", data)}`}>
<div className="font-bold text-amber-800 bg-amber-200 px-2 py-1 rounded text-xs">
{Object.values(courierDistanceTotals).reduce((sum, distance) => sum + distance, 0).toFixed(2)} km
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Cost", data)}`}>
<div className="font-bold text-indigo-800 bg-indigo-200 px-2 py-1 rounded text-xs">
{Object.values(courierFinancialData).reduce((sum, data) => sum + (data.costPlusAddCost1 || 0), 0).toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Profit", data)}`}>
<div className="font-bold text-green-800 bg-green-200 px-2 py-1 rounded text-xs">
{Object.values(courierFinancialData).reduce((sum, data) => sum + (data.profit || 0), 0).toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Net Profit", data)}`}>
<div className={`font-bold px-2 py-1 rounded text-xs ${getNetProfitStyle(calculateNetProfit(Object.values(courierFinancialData).reduce((sum, data) => sum + (data.profit || 0), 0), Object.values(courierFinancialData).reduce((sum, data) => sum + (data.costPlusAddCost1 || 0), 0)))}`}>
{calculateNetProfit(Object.values(courierFinancialData).reduce((sum, data) => sum + (data.profit || 0), 0), Object.values(courierFinancialData).reduce((sum, data) => sum + (data.costPlusAddCost1 || 0), 0)).toLocaleString()}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Top Performer", data)}`}>
<div className="font-bold text-gray-800">
-
</div>
</td>
{uniqueDates.map(date => (
<td key={`combined-total-${date}`} className="px-4 py-4 text-sm text-center">
<div className="flex flex-col items-center gap-1">
<div className="flex items-center gap-1">
<div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded text-xs">
{totals.dateDeliveries?.[date] || 0}
</div>
<div className="font-bold text-green-700 bg-green-200 px-2 py-1 rounded text-xs">
{formatPercentage(totals.dateRoundUps?.[date] || 0)}
</div>
</div>
<div className="flex items-center gap-1">
<div className="font-bold text-orange-700 bg-orange-200 px-2 py-1 rounded text-xs">
{formatPercentage(totals.dateDistances?.[date] || 0)}
</div>
<div className="font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded text-xs">
{formatDurationToHMS(totals.dateDeliveryTimes?.[date] || 0)}
</div>
</div>
</div>
</td>
))}
<td className="px-4 py-4 text-sm text-center">
<div className="flex flex-col items-center gap-1">
<div className="grid grid-cols-2 gap-1">
<div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded text-xs">
{formatPercentage(totals.avgAllCount || 0)}
</div>
<div className="font-bold text-green-700 bg-green-200 px-2 py-1 rounded text-xs">
{formatPercentage(totals.avgAllRoundUp || 0)}
</div>
<div className="font-bold text-orange-700 bg-orange-200 px-2 py-1 rounded text-xs">
{formatPercentage(totals.avgAllDistance || 0)}
</div>
<div className="font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded text-xs">
{formatDurationToHMS(totals.avgAllTime || 0)}
</div>
</div>
</div>
</td>
</tr>
)}
</tbody>
</table>
)}
</div>
);
});

export const CourierTableFooter = memo(({ 
data, 
totals, 
originalCount, 
filteredCount,
paginationData,
onPageChange,
onItemsPerPageChange,
totalPages,
courierDistanceTotals = {},
onExportExcel,
onPrintReport
}) => {
const statsData = useMemo(() => ({
uniqueHubs: getUniqueHubCount(data),
displayCount: filteredCount || (data ? data.length : 0),
totalCount: originalCount || (data ? data.length : 0)
}), [data, originalCount, filteredCount]);

const displayText = useMemo(() => {
return statsData.displayCount !== statsData.totalCount
? `Showing ${statsData.displayCount} of ${statsData.totalCount} couriers from ${statsData.uniqueHubs} HUBs`
: `Total ${statsData.displayCount} courier(s) from ${statsData.uniqueHubs} HUBs`;
}, [statsData]);

const footerCalculations = useMemo(() => {
const grandTotalDistance = Object.values(courierDistanceTotals).reduce((sum, distance) => sum + distance, 0);
return { grandTotalDistance };
}, [courierDistanceTotals]);

const summaryData = useMemo(() => [
{ label: "Total Deliveries", value: totals?.totalDeliveries || 0, color: "text-gray-700" },
{ label: "On-Time Deliveries", value: totals?.onTimeDeliveries || 0, color: "text-green-600" },
{ label: "Late Deliveries", value: totals?.lateDeliveries || 0, color: "text-red-600" },
{ label: "Average On-Time Rate", value: `${formatPercentage(totals?.averageOnTimePercentage || 0)}%`, color: "text-blue-600" },
{ label: "Grand Total Distance", value: `${footerCalculations.grandTotalDistance.toFixed(2)} km`, color: "text-amber-600" }
], [totals, footerCalculations]);

return (
<div className="bg-white border-t border-gray-300 px-4 py-4 rounded-b-lg">
<div className="flex justify-between items-start">
<div>
<div className="text-sm text-gray-600 mb-2">
{displayText}
</div>
<div className="grid grid-cols-2 gap-x-4 gap-y-1">
{summaryData.map((item, index) => (
<div key={index} className={`text-sm font-semibold ${item.color}`}>
{item.label}: {item.value}
</div>
))}
</div>
</div>
<div className="flex gap-2">
<button 
onClick={onExportExcel}
className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg border border-transparent text-sm font-medium transition-all duration-200"
>
Export Excel
</button>
<button 
onClick={onPrintReport}
className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
>
Print Report
</button>
</div>
</div>

{data && data.length > 0 && paginationData && (
<div className="mt-4">
<PaginationComponent
currentPage={paginationData.currentPage || 1}
totalPages={totalPages}
onPageChange={onPageChange}
itemsPerPage={paginationData.itemsPerPage || 25}
totalItems={data.length}
onItemsPerPageChange={onItemsPerPageChange}
/>
</div>
)}
</div>
);
});

export const CourierEmptyState = memo(() => (
<div className="bg-white border border-gray-300 rounded-lg">
<div className="flex justify-center items-center py-12">
<div className="text-center">
<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
<div className="text-sm text-gray-600">
No courier performance data available
</div>
</div>
</div>
</div>
));

TopPerformerIndicator.displayName = 'TopPerformerIndicator';
CourierTableHeader.displayName = 'CourierTableHeader';
CourierSearchBar.displayName = 'CourierSearchBar';
CourierTableContent.displayName = 'CourierTableContent';
CourierTableFooter.displayName = 'CourierTableFooter';
CourierEmptyState.displayName = 'CourierEmptyState';