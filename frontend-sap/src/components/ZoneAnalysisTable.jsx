import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Card, CardBody } from "@material-tailwind/react";
import { useFileUpload } from '../hooks/useFileUpload';
import { 
sortZoneData, 
calculateTotals, 
validateZoneData,
createSearchIndex,
filterDataBySearch,
calculateTotalsWithWorker,
clearCaches,
processDataInBatches
} from '../utils/zoneTableUtils';
import PaginationComponent from './PaginationComponent';
import {
ZoneTableHeader,
ZoneTableContent,
ZoneTableFooter,
EmptyState,
SearchBar
} from '../components/ZoneTableComponents';

const LARGE_DATASET_THRESHOLD = 50000;

const ZoneAnalysisTable = React.memo(({ zoneData, onBack, onDataUpdate }) => {
const [searchTerm, setSearchTerm] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [totals, setTotals] = useState(null);
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(25);

const searchIndexRef = useRef(null);
const processedDataRef = useRef(null);
const totalsRef = useRef(null);
const filterCacheRef = useRef(new Map());

const handleDataUpdateAfterUpload = useCallback(async () => {
if (onDataUpdate) {
await onDataUpdate();
searchIndexRef.current = null;
processedDataRef.current = null;
totalsRef.current = null;
filterCacheRef.current.clear();
clearCaches();
}
}, [onDataUpdate]);

const processedData = useMemo(() => {
if (!validateZoneData(zoneData)) {
return { sortedData: [], searchIndex: null, dataLength: 0 };
}

const dataLength = zoneData.length;
if (processedDataRef.current?.dataLength === dataLength) {
return processedDataRef.current;
}

const sortedData = sortZoneData(zoneData);

if (!searchIndexRef.current) {
searchIndexRef.current = createSearchIndex(sortedData);
}

const result = { 
sortedData, 
searchIndex: searchIndexRef.current,
dataLength
};

processedDataRef.current = result;
return result;
}, [zoneData]);

const calculateTotalsAsync = useCallback(async (data) => {
if (!data || data.length === 0) return null;

const cacheKey = `totals_${data.length}`;
if (totalsRef.current && totalsRef.current.cacheKey === cacheKey) {
return totalsRef.current.data;
}

setIsProcessing(true);

try {
let result;
if (data.length > LARGE_DATASET_THRESHOLD) {
result = await calculateTotalsWithWorker(data);
} else {
result = calculateTotals(data);
}

totalsRef.current = { data: result, cacheKey };
return result;
} catch (error) {
console.warn('Worker calculation failed, falling back to sync:', error);
const result = calculateTotals(data);
totalsRef.current = { data: result, cacheKey };
return result;
} finally {
setIsProcessing(false);
}
}, []);

useEffect(() => {
if (processedData.sortedData.length > 0) {
calculateTotalsAsync(processedData.sortedData).then(setTotals);
}
}, [processedData.sortedData, calculateTotalsAsync]);

const filteredAndSortedData = useMemo(() => {
if (!processedData.sortedData.length) return [];

let filtered = processedData.sortedData;

if (searchTerm.trim()) {
const cacheKey = `${searchTerm}_${processedData.dataLength}`;
if (filterCacheRef.current.has(cacheKey)) {
filtered = filterCacheRef.current.get(cacheKey);
} else {
setIsSearching(true);
filtered = filterDataBySearch(
processedData.sortedData, 
searchTerm, 
processedData.searchIndex
);
filterCacheRef.current.set(cacheKey, filtered);
setIsSearching(false);
}
}

if (sortConfig.key) {
filtered = [...filtered].sort((a, b) => {
const aValue = a[sortConfig.key];
const bValue = b[sortConfig.key];

let aSort, bSort;

if (typeof aValue === 'number' && typeof bValue === 'number') {
aSort = aValue || 0;
bSort = bValue || 0;
} else {
aSort = (aValue || '').toString();
bSort = (bValue || '').toString();
}

if (typeof aSort === 'number') {
return sortConfig.direction === 'asc' ? aSort - bSort : bSort - aSort;
} else {
return sortConfig.direction === 'asc' 
? aSort.localeCompare(bSort) 
: bSort.localeCompare(aSort);
}
});
}

return filtered;
}, [processedData.sortedData, processedData.searchIndex, processedData.dataLength, searchTerm, sortConfig]);

const paginatedData = useMemo(() => {
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
return filteredAndSortedData.slice(startIndex, endIndex);
}, [filteredAndSortedData, currentPage, itemsPerPage]);

const totalPages = useMemo(() => {
return Math.ceil(filteredAndSortedData.length / itemsPerPage);
}, [filteredAndSortedData.length, itemsPerPage]);

const handleSearch = useCallback((term) => {
setSearchTerm(term);
setCurrentPage(1);
}, []);

const handleSort = useCallback((key) => {
setSortConfig(prevSort => ({
key,
direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
}));
setCurrentPage(1);
}, []);

const handlePageChange = useCallback((page) => {
setCurrentPage(page);
}, []);

const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
setItemsPerPage(newItemsPerPage);
setCurrentPage(1);
}, []);

const handleExportExcel = useCallback(() => {
console.log('Export to Excel functionality');
}, []);

const handlePrintReport = useCallback(() => {
console.log('Print report functionality');
}, []);

useEffect(() => {
return () => {
clearCaches();
filterCacheRef.current.clear();
};
}, []);

if (!validateZoneData(zoneData)) {
return <EmptyState />;
}

return (
<Card className="border-t !border-gray-300 p-4">
<ZoneTableHeader 
onTestApi={() => console.log('Test API')}
onTriggerUpload={() => console.log('Upload')}
onBack={onBack}
onDataRefresh={handleDataUpdateAfterUpload}
/>

<CardBody className="px-0">
<SearchBar
searchTerm={searchTerm}
onSearch={handleSearch}
isSearching={isSearching || isProcessing}
totalCount={processedData.sortedData.length}
filteredCount={filteredAndSortedData.length}
/>

<ZoneTableContent
data={paginatedData}
sortConfig={sortConfig}
onSort={handleSort}
totalCount={processedData.sortedData.length}
filteredCount={filteredAndSortedData.length}
/>

{paginatedData.length > 0 && (
<PaginationComponent
currentPage={currentPage}
totalPages={totalPages}
onPageChange={handlePageChange}
itemsPerPage={itemsPerPage}
totalItems={filteredAndSortedData.length}
onItemsPerPageChange={handleItemsPerPageChange}
/>
)}
</CardBody>

{totals && (
<ZoneTableFooter 
data={paginatedData}
totals={totals}
originalCount={processedData.sortedData.length}
filteredCount={filteredAndSortedData.length}
onExportExcel={handleExportExcel}
onPrintReport={handlePrintReport}
/>
)}
</Card>
);
});

ZoneAnalysisTable.displayName = 'ZoneAnalysisTable';

export default ZoneAnalysisTable;