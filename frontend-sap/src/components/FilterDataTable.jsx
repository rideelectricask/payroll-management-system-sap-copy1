import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileSpreadsheet, Database, Eye, EyeOff, Filter, X, Loader2, AlertCircle, Search, RotateCw, CheckCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { groupByCourierAndDate } from '../utils/processors/groupData';
import { fetchData, fetchDriverData } from '../services/api';
import { compareOrderCodeData } from '../services/apis';

export default function FilterDataTable() {
const [result, setResult] = useState([]);
const [filteredResult, setFilteredResult] = useState([]);
const [rawData, setRawData] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [isInitializing, setIsInitializing] = useState(true);
const [error, setError] = useState(null);
const [driverMap, setDriverMap] = useState({});
const [isDriverDataLoaded, setIsDriverDataLoaded] = useState(false);
const [showFullData, setShowFullData] = useState(false);
const [filters, setFilters] = useState({
distance: '',
weight: '',
search: '',
projectName: ''
});
const [isFiltered, setIsFiltered] = useState(false);
const [comparingRows, setComparingRows] = useState(new Set());
const [compareResults, setCompareResults] = useState(new Map());
const [successfulCompares, setSuccessfulCompares] = useState(new Set());

const DISPLAY_COLUMNS = [
'Client Name',
'Project Name',
'Order Code', 
'Courier Code',
'Courier Name',
'Distance',
'Weight',
'Actions'
];

const loadDriverData = useCallback(async () => {
try {
const drivers = await fetchDriverData();
const map = {};
(drivers || []).forEach((driver) => {
map[driver.username] = driver.fullName;
});
setDriverMap(map);
setIsDriverDataLoaded(true);
console.log(`Driver data loaded: ${Object.keys(map).length} drivers`);
} catch (err) {
console.error('Failed to fetch driver data:', err.message);
setError('Gagal memuat data driver');
setIsDriverDataLoaded(true);
}
}, []);

const getCourierNameForDisplay = useCallback((row) => {
if (row["Courier Name"] && row["Courier Name"].toString().trim() !== "") {
return row["Courier Name"];
}
if (row["Courier Code"] && driverMap[row["Courier Code"]]) {
return driverMap[row["Courier Code"]];
}
return row["Courier Code"] || "";
}, [driverMap]);

const processRawData = useCallback(async (rawDataToProcess) => {
if (!rawDataToProcess || rawDataToProcess.length === 0) {
return [];
}

const processedData = rawDataToProcess.map(row => {
const courierName = getCourierNameForDisplay(row);
const roundUp = parseInt(row["RoundUp"]) || 0;
const roundUpDistance = parseInt(row["RoundUp Distance"]) || 0;
let additional1 = 0;
let additional2 = 0;

if (row["Client Name"] === "Sayurbox") {
if (roundUp >= 10) {
additional1 = (roundUp - 10) * 500;
}
if (roundUpDistance >= 30) {
additional2 = (roundUpDistance - 30) * 2000;
}
}

return {
...row,
"Courier Name": courierName,
"Additional RoundUp Fee": additional1,
"Additional Distance Fee": additional2,
"Add Charge 1": (parseInt(row["Add Charge 1"]) || 0) + additional1 + additional2,
};
});

const groupedResult = await groupByCourierAndDate(processedData);
return groupedResult;
}, [getCourierNameForDisplay]);

const fetchRawData = useCallback(async () => {
try {
const data = await fetchData([]);
if (!data || data.length === 0) {
throw new Error('No data received from API');
}
setRawData(data);
return data;
} catch (err) {
console.error('FilterDataTable fetch failed:', err);
throw err;
}
}, []);

const handleProcessData = useCallback(async () => {
setIsLoading(true);
setError(null);

try {
let dataToProcess = rawData;

if (rawData.length === 0) {
dataToProcess = await fetchRawData();
}

const processedResult = await processRawData(dataToProcess);
setResult(processedResult);
setFilteredResult(processedResult);
setIsFiltered(false);
setCompareResults(new Map());
setSuccessfulCompares(new Set());
} catch (err) {
console.error('FilterDataTable processing failed:', err);
setError(err.message);
} finally {
setIsLoading(false);
}
}, [rawData, fetchRawData, processRawData]);

const initializeData = useCallback(async () => {
setIsInitializing(true);
try {
await loadDriverData();
await handleProcessData();
} catch (err) {
setError('Gagal memuat data awal');
} finally {
setIsInitializing(false);
}
}, [loadDriverData, handleProcessData]);

const refreshDataAfterCompare = useCallback(async () => {
try {
const freshData = await fetchRawData();
const processedResult = await processRawData(freshData);
setResult(processedResult);

if (isFiltered) {
const filtered = applyFiltersToData(processedResult);
setFilteredResult(filtered);
} else {
setFilteredResult(processedResult);
}
} catch (err) {
console.error('Failed to refresh data:', err);
}
}, [fetchRawData, processRawData, isFiltered]);

const applyFiltersToData = useCallback((data) => {
if (!data || data.length === 0) return [];

let filtered = [...data];

if (filters.distance && filters.distance.trim() !== '') {
const distanceValue = parseFloat(filters.distance);
if (!isNaN(distanceValue)) {
filtered = filtered.filter(row => {
const distance = parseFloat(row["Distance"]) || 0;
return distance >= distanceValue;
});
}
}

if (filters.weight && filters.weight.trim() !== '') {
const weightValue = parseFloat(filters.weight);
if (!isNaN(weightValue)) {
filtered = filtered.filter(row => {
const weight = parseFloat(row["Weight"]) || 0;
return weight >= weightValue;
});
}
}

if (filters.projectName && filters.projectName.trim() !== '') {
const projectNameValue = filters.projectName.toLowerCase();
filtered = filtered.filter(row => {
const projectName = (row["Project Name"] || '').toString().toLowerCase();
return projectName.includes(projectNameValue);
});
}

if (filters.search && filters.search.trim() !== '') {
const searchTerm = filters.search.toLowerCase();
filtered = filtered.filter(row => {
const clientName = (row["Client Name"] || '').toString().toLowerCase();
const projectName = (row["Project Name"] || '').toString().toLowerCase();
const orderCode = (row["Order Code"] || '').toString().toLowerCase();
const courierCode = (row["Courier Code"] || '').toString().toLowerCase();
const courierName = (row["Courier Name"] || '').toString().toLowerCase();

return clientName.includes(searchTerm) || 
projectName.includes(searchTerm) ||
orderCode.includes(searchTerm) || 
courierCode.includes(searchTerm) || 
courierName.includes(searchTerm);
});
}

return filtered;
}, [filters]);

useEffect(() => {
initializeData();
}, []);

useEffect(() => {
if (isDriverDataLoaded && rawData.length > 0 && result.length > 0) {
console.log('Re-processing data with updated driver map...');
processRawData(rawData).then(reprocessedResult => {
setResult(reprocessedResult);
if (!isFiltered) {
setFilteredResult(reprocessedResult);
}
}).catch(err => {
console.error('Error re-processing data:', err);
});
}
}, [driverMap, isDriverDataLoaded, rawData, processRawData]);

const handleCompareRow = async (orderCode, rowIndex) => {
if (!orderCode) {
return;
}

const rowKey = `${orderCode}_${rowIndex}`;
setComparingRows(prev => new Set([...prev, rowKey]));

try {
const compareResult = await compareOrderCodeData(orderCode);

setCompareResults(prev => {
const newResults = new Map(prev);
newResults.set(rowKey, {
success: compareResult.success,
message: compareResult.message,
updated: compareResult.updated || false,
timestamp: Date.now()
});
return newResults;
});

if (compareResult.success && compareResult.updated) {
setSuccessfulCompares(prev => new Set([...prev, rowKey]));

setTimeout(async () => {
await refreshDataAfterCompare();
}, 1000);
}

} catch (error) {
setCompareResults(prev => {
const newResults = new Map(prev);
newResults.set(rowKey, {
success: false,
message: error.message,
updated: false,
timestamp: Date.now()
});
return newResults;
});
} finally {
setComparingRows(prev => {
const newSet = new Set(prev);
newSet.delete(rowKey);
return newSet;
});
}
};

const applyFilters = () => {
if (!result || result.length === 0) {
return;
}

const filtered = applyFiltersToData(result);
setFilteredResult(filtered);
setIsFiltered(true);
};

const clearFilters = () => {
setFilters({
distance: '',
weight: '',
search: '',
projectName: ''
});
setFilteredResult(result);
setIsFiltered(false);
};

const handleFilterChange = (key, value) => {
setFilters(prev => ({
...prev,
[key]: value
}));
};

const downloadAsExcel = () => {
const dataToDownload = isFiltered ? filteredResult : result;

if (!dataToDownload || dataToDownload.length === 0) {
return;
}

try {
const filteredData = dataToDownload.map(row => {
const filteredRow = {};
DISPLAY_COLUMNS.slice(0, -1).forEach(column => {
filteredRow[column] = row[column] || '';
});
return filteredRow;
});

const headers = DISPLAY_COLUMNS.slice(0, -1);
const excelData = [headers, ...filteredData.map(row => headers.map(header => row[header] || ''))];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(excelData);

const colWidths = headers.map((_, colIndex) => {
const maxLength = Math.max(
...excelData.map(row => (row[colIndex] || '').toString().length)
);
return { wch: Math.min(Math.max(maxLength, 12), 50) };
});

worksheet['!cols'] = colWidths;
XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data');

const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const filename = `filtered_data_${timestamp}.xlsx`;

XLSX.writeFile(workbook, filename);
} catch (error) {
console.error('Download failed:', error);
}
};

const getCompareButtonState = (orderCode, rowIndex) => {
const rowKey = `${orderCode}_${rowIndex}`;
const isComparing = comparingRows.has(rowKey);
const compareResult = compareResults.get(rowKey);
const isSuccessful = successfulCompares.has(rowKey);

return {
isComparing,
compareResult,
isSuccessful,
rowKey
};
};

const currentData = isFiltered ? filteredResult : result;
const displayData = showFullData ? currentData : currentData.slice(0, 15);

if (isInitializing) {
return (
<div className="min-h-96 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-300">
<Loader2 className="animate-spin text-gray-600 mb-4" size={32} />
<h2 className="text-xl font-semibold text-gray-800 mb-2">Memuat Filter Data Table</h2>
<p className="text-gray-600 text-center">
Sedang mengambil data driver dan memproses data...
</p>
</div>
);
}

return (
<div className="space-y-6">
<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
<div className="px-6 py-4 border-b border-gray-200">
<h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
<Database className="text-gray-600" size={24} />
Filter Data Table
</h2>
<p className="text-gray-600 mt-1">Filter dan analisis data pengiriman dengan compare individual</p>
</div>

<div className="p-6">
{error && (
<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
<AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
<div className="flex-1">
<p className="text-red-800 font-medium">Error</p>
<p className="text-red-700 text-sm">{error}</p>
</div>
<button
onClick={initializeData}
className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
>
Coba Lagi
</button>
</div>
)}

<div className="flex flex-wrap gap-3 mb-6">
<button 
onClick={handleProcessData}
disabled={isLoading || isInitializing}
className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
isLoading || isInitializing
? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
: 'bg-gray-800 text-white hover:bg-gray-900'
}`}
>
{isLoading ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
{isLoading ? 'Processing...' : 'Refresh Data'}
</button>

{currentData.length > 0 && (
<button
onClick={downloadAsExcel}
disabled={isLoading || isInitializing}
className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
>
<Download size={16} />
Download Excel
</button>
)}
</div>

{result.length > 0 && (
<div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
<div className="flex items-center gap-2 text-gray-700">
<Database size={16} />
<span className="font-medium">Data berhasil dimuat:</span>
<span className="font-semibold">{result.length}</span>
<span>records</span>
{isFiltered && (
<span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
Filtered: {filteredResult.length}
</span>
)}
</div>
</div>
)}

{isLoading && !isInitializing && (
<div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
<Loader2 className="animate-spin text-gray-600" size={16} />
<span className="text-gray-700">Fetching and processing data...</span>
</div>
)}

{result.length > 0 && (
<>
<div className="mb-6 bg-white border border-gray-200 rounded-lg">
<div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
<h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
<Filter size={18} />
Filter Data
</h3>
</div>

<div className="p-4">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Search Data
</label>
<div className="relative">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
<input
type="text"
value={filters.search}
onChange={(e) => handleFilterChange('search', e.target.value)}
placeholder="Cari Client, Project, Order, Courier..."
className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800"
/>
</div>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Project Name
</label>
<input
type="text"
value={filters.projectName}
onChange={(e) => handleFilterChange('projectName', e.target.value)}
placeholder="Contoh: B2C, B2B"
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Minimum Distance (km)
</label>
<input
type="number"
step="0.1"
value={filters.distance}
onChange={(e) => handleFilterChange('distance', e.target.value)}
placeholder="Contoh: 5.5"
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Minimum Weight (kg)
</label>
<input
type="number"
step="0.1"
value={filters.weight}
onChange={(e) => handleFilterChange('weight', e.target.value)}
placeholder="Contoh: 15.5"
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-800"
/>
</div>
</div>

<div className="flex flex-wrap gap-3 items-center">
<button
onClick={applyFilters}
disabled={isLoading}
className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
>
<Filter size={16} />
Apply Filters
</button>

{isFiltered && (
<button
onClick={clearFilters}
className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
>
<X size={16} />
Clear Filters
</button>
)}

<div className="ml-auto text-sm text-gray-600 flex items-center gap-2">
<span>Total Records:</span>
<span className="font-semibold text-gray-800">{currentData.length}</span>
{isFiltered && (
<span className="text-gray-500">
(dari {result.length} total)
</span>
)}
</div>
</div>
</div>
</div>

<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
<div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
<div>
<h3 className="text-lg font-semibold text-gray-800">
{isFiltered ? 'Filtered ' : ''}Data Results
</h3>
<p className="text-sm text-gray-600">
Menampilkan {displayData.length} dari {currentData.length} records
{isFiltered && (
<span className="text-gray-500 ml-1">
(filtered dari {result.length} total)
</span>
)}
</p>
</div>

{currentData.length > 15 && (
<button
onClick={() => setShowFullData(!showFullData)}
className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
>
{showFullData ? <EyeOff size={14} /> : <Eye size={14} />}
{showFullData ? 'Show Less' : 'Show All'}
</button>
)}
</div>

<div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
<table className="w-full text-sm">
<thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
<tr>
{DISPLAY_COLUMNS.map((column, index) => (
<th key={index} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
{column}
{(column === 'Distance' || column === 'Weight' || column === 'Project Name') && isFiltered && (
<span className="ml-1 text-gray-400">•</span>
)}
</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{displayData.map((row, rowIndex) => {
const orderCode = row["Order Code"];
const { isComparing, compareResult, isSuccessful } = getCompareButtonState(orderCode, rowIndex);

return (
<tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
{DISPLAY_COLUMNS.slice(0, -1).map((column, cellIndex) => {
const cellValue = row[column];
const displayValue = cellValue !== undefined && cellValue !== null ? cellValue.toString() : '-';

let cellClass = "px-4 py-3 text-gray-800 whitespace-nowrap";

if (isFiltered) {
const numValue = parseFloat(cellValue) || 0;
if (column === 'Distance' && filters.distance && numValue >= parseFloat(filters.distance)) {
cellClass += " bg-gray-100 font-medium";
} else if (column === 'Weight' && filters.weight && numValue >= parseFloat(filters.weight)) {
cellClass += " bg-gray-100 font-medium";
} else if (column === 'Project Name' && filters.projectName && 
(cellValue || '').toString().toLowerCase().includes(filters.projectName.toLowerCase())) {
cellClass += " bg-gray-100 font-medium";
}
}

if (isSuccessful && (column === 'Distance' || column === 'Weight')) {
cellClass += " bg-green-50 border-l-4 border-green-400";
}

return (
<td key={cellIndex} className={cellClass}>
{displayValue}
</td>
);
})}
<td className="px-4 py-3 text-gray-800 whitespace-nowrap">
<div className="flex items-center gap-2">
<button
onClick={() => handleCompareRow(orderCode, rowIndex)}
disabled={isComparing || !orderCode}
className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
isSuccessful
? 'bg-green-100 text-green-700 hover:bg-green-200 ring-2 ring-green-200'
: compareResult?.success
? 'bg-green-100 text-green-700 hover:bg-green-200'
: compareResult?.success === false
? 'bg-red-100 text-red-700 hover:bg-red-200'
: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
} disabled:opacity-50 disabled:cursor-not-allowed`}
title={
compareResult?.message || 
(isComparing ? 'Comparing...' : 'Compare dengan EData')
}
>
{isComparing ? (
<Loader2 className="animate-spin" size={14} />
) : isSuccessful ? (
<CheckCircle size={14} />
) : compareResult?.success ? (
<CheckCircle size={14} />
) : compareResult?.success === false ? (
<AlertCircle size={14} />
) : (
<RotateCw size={14} />
)}
</button>
{compareResult && (
<span className={`text-xs px-2 py-1 rounded ${
compareResult.success 
? 'bg-green-100 text-green-800' 
: 'bg-red-100 text-red-800'
}`}>
{compareResult.updated ? 'Updated' : compareResult.success ? 'Match' : 'Error'}
</span>
)}
</div>
</td>
</tr>
);
})}
</tbody>
</table>
</div>

{currentData.length > 15 && !showFullData && (
<div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-600 border-t border-gray-100">
... dan {currentData.length - 15} baris lainnya. Klik "Show All" untuk melihat semua data.
</div>
)}

{isFiltered && (
<div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
<div className="flex flex-wrap items-center gap-2 text-sm">
<Filter className="text-gray-500" size={14} />
<span className="font-medium text-gray-700">Active Filters:</span>
{filters.search && (
<span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
Search: {filters.search}
</span>
)}
{filters.projectName && (
<span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
Project: {filters.projectName}
</span>
)}
{filters.distance && (
<span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
Distance ≥ {filters.distance} km
</span>
)}
{filters.weight && (
<span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
Weight ≥ {filters.weight} kg
</span>
)}
</div>
</div>
)}
</div>
</>
)}

{result.length === 0 && !isLoading && !isInitializing && (
<div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
<Database className="mx-auto text-gray-400 mb-4" size={48} />
<h3 className="text-lg font-medium text-gray-800 mb-2">Tidak ada data</h3>
<p className="text-gray-600 mb-4">
Tidak ada data untuk ditampilkan. Klik "Refresh Data" untuk memuat ulang data dari server.
</p>
<button
onClick={handleProcessData}
className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto font-medium"
>
<Database size={16} />
Refresh Data
</button>
</div>
)}
</div>
</div>
</div>
);
}