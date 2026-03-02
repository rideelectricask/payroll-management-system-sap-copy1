import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { analyzeZonesByCourierAndHub, forceClearBonusCache } from '../utils/processors/groupData';
import { deleteDataFromServer, updateDataFromServer } from '../services/dataOperations';

const INITIAL_ITEMS_PER_PAGE = 25;
const PROCESSING_BATCH_SIZE = 10000;
const SEARCH_MIN_LENGTH = 2;

const createSearchableText = (row) => {
const clientName = row["Client Name"] || '';
const orderCode = row["Order Code"] || '';
const courierName = row["Courier Name"] || '';
const hub = row["HUB"] || '';
const zona = row["Zona"] || '';
return `${clientName} ${orderCode} ${courierName} ${hub} ${zona}`.toLowerCase();
};

const processDataChunkOptimized = (data, searchTerms) => {
if (!searchTerms || searchTerms.length === 0) return data;

const filteredData = [];
for (let i = 0; i < data.length; i++) {
const row = data[i];
if (!row) continue;

const searchText = createSearchableText(row);

let matches = true;
for (let j = 0; j < searchTerms.length; j++) {
if (!searchText.includes(searchTerms[j])) {
matches = false;
break;
}
}

if (matches) {
filteredData.push(row);
}
}

return filteredData;
};

const sortDataOptimized = (data, sortConfig) => {
if (!data || data.length === 0) return [];

if (!sortConfig.key) {
return data.sort((a, b) => {
const clientCompare = (a["Client Name"] || '').localeCompare(b["Client Name"] || '');
if (clientCompare !== 0) return clientCompare;

const courierCompare = (a["Courier Name"] || '').localeCompare(b["Courier Name"] || '');
if (courierCompare !== 0) return courierCompare;

const aDate = new Date(a["DropOff Done"] || 0);
const bDate = new Date(b["DropOff Done"] || 0);
return bDate - aDate;
});
}

const numericColumns = new Set([
'Cost', 'Add Cost 1', 'Add Cost 2', 'Add Charge 1', 'Add Charge 2',
'Selling Price', 'Profit', 'Total Pengiriman', 'RoundDown', 'RoundUp',
'WeightDecimal', 'Distance', 'RoundDown Distance', 'RoundUp Distance',
'Additional Notes For Address'
]);

const isNumeric = numericColumns.has(sortConfig.key);
const isDate = sortConfig.key === 'DropOff Done' || sortConfig.key === 'Date' || 
sortConfig.key === 'Receiving Date' || sortConfig.key === 'Delivery Start Date';
const isAsc = sortConfig.direction === 'asc';

return data.sort((a, b) => {
const aVal = a[sortConfig.key];
const bVal = b[sortConfig.key];

if (isNumeric) {
const aNum = parseFloat(aVal) || 0;
const bNum = parseFloat(bVal) || 0;
return isAsc ? aNum - bNum : bNum - aNum;
}

if (isDate) {
const aDate = new Date(aVal || 0);
const bDate = new Date(bVal || 0);
return isAsc ? aDate - bDate : bDate - aDate;
}

const aString = String(aVal || '');
const bString = String(bVal || '');
const comparison = aString.localeCompare(bString);
return isAsc ? comparison : -comparison;
});
};

const calculateTotalsOptimized = (data) => {
if (!data || data.length === 0) {
return {
totalProfit: 0,
totalSellingPrice: 0,
totalAddCharge1: 0,
totalAddCharge2: 0,
totalCost: 0,
totalAddCost1: 0,
totalAddCost2: 0
};
}

const totals = {
totalProfit: 0,
totalSellingPrice: 0,
totalAddCharge1: 0,
totalAddCharge2: 0,
totalCost: 0,
totalAddCost1: 0,
totalAddCost2: 0
};

for (let i = 0; i < data.length; i++) {
const row = data[i];
if (!row) continue;

totals.totalProfit += row["Profit"] || 0;
totals.totalSellingPrice += row["Selling Price"] || 0;
totals.totalAddCharge1 += row["Add Charge 1"] || 0;
totals.totalAddCharge2 += row["Add Charge 2"] || 0;
totals.totalCost += row["Cost"] || 0;
totals.totalAddCost1 += row["Add Cost 1"] || 0;
totals.totalAddCost2 += row["Add Cost 2"] || 0;
}

return totals;
};

const calculateClientSummaryOptimized = (data) => {
if (!data || data.length === 0) return {};

const summary = {};

for (let i = 0; i < data.length; i++) {
const row = data[i];
if (!row) continue;

const client = row["Client Name"] || 'Unknown';

if (!summary[client]) {
summary[client] = {
count: 0,
totalProfit: 0,
totalSellingPrice: 0,
totalAddCharge1: 0,
totalAddCharge2: 0,
totalCost: 0,
totalAddCost1: 0,
totalAddCost2: 0
};
}

const clientData = summary[client];
clientData.count++;
clientData.totalProfit += row["Profit"] || 0;
clientData.totalSellingPrice += row["Selling Price"] || 0;
clientData.totalAddCharge1 += row["Add Charge 1"] || 0;
clientData.totalAddCharge2 += row["Add Charge 2"] || 0;
clientData.totalCost += row["Cost"] || 0;
clientData.totalAddCost1 += row["Add Cost 1"] || 0;
clientData.totalAddCost2 += row["Add Cost 2"] || 0;
}

return summary;
};

export const useProfitTable = (groupedData) => {
const [showZoneAnalysis, setShowZoneAnalysis] = useState(false);
const [zoneAnalysisData, setZoneAnalysisData] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(INITIAL_ITEMS_PER_PAGE);
const [searchTerm, setSearchTerm] = useState('');
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
const [isLoadingZoneAnalysis, setIsLoadingZoneAnalysis] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [processedData, setProcessedData] = useState([]);
const [selectedItems, setSelectedItems] = useState([]);
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingRow, setEditingRow] = useState(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [deletingItem, setDeletingItem] = useState(null);
const [isUpdating, setIsUpdating] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [dataVersion, setDataVersion] = useState(0);
const [totals, setTotals] = useState({
totalProfit: 0,
totalSellingPrice: 0,
totalAddCharge1: 0,
totalAddCharge2: 0,
totalCost: 0,
totalAddCost1: 0,
totalAddCost2: 0
});
const [clientSummary, setClientSummary] = useState({});

const searchTimeoutRef = useRef(null);
const processingRef = useRef(false);
const dataVersionRef = useRef(0);
const searchableDataRef = useRef([]);

const resetTableState = useCallback(() => {
setCurrentPage(1);
setSearchTerm('');
setSortConfig({ key: null, direction: 'asc' });
setShowZoneAnalysis(false);
setZoneAnalysisData([]);
setProcessedData([]);
setSelectedItems([]);
setTotals({
totalProfit: 0,
totalSellingPrice: 0,
totalAddCharge1: 0,
totalAddCharge2: 0,
totalCost: 0,
totalAddCost1: 0,
totalAddCost2: 0
});
setClientSummary({});
}, []);

const refreshDataFromServer = useCallback(async () => {
try {
setDataVersion(prev => prev + 1);
if (window.location) {
window.location.reload();
}
} catch (error) {
console.error('Error refreshing data:', error);
}
}, []);

const searchTerms = useMemo(() => {
if (!searchTerm || searchTerm.length < SEARCH_MIN_LENGTH) return [];
return searchTerm.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
}, [searchTerm]);

const processedDataMemo = useMemo(() => {
if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) {
return [];
}

const validData = groupedData.filter(row => row != null);

if (searchTerms.length === 0) {
const sorted = sortDataOptimized([...validData], sortConfig);
return sorted;
}

const filtered = processDataChunkOptimized(validData, searchTerms);
const sorted = sortDataOptimized(filtered, sortConfig);
return sorted;
}, [groupedData, searchTerms, sortConfig]);

const totalsAndSummary = useMemo(() => {
const calculatedTotals = calculateTotalsOptimized(processedDataMemo);
const calculatedSummary = calculateClientSummaryOptimized(processedDataMemo);

return {
totals: calculatedTotals,
clientSummary: calculatedSummary
};
}, [processedDataMemo]);

useEffect(() => {
setProcessedData(processedDataMemo);
setTotals(totalsAndSummary.totals);
setClientSummary(totalsAndSummary.clientSummary);
}, [processedDataMemo, totalsAndSummary]);

const paginationData = useMemo(() => {
if (!processedData || processedData.length === 0) {
return {
totalPages: 0,
startIndex: 0,
endIndex: 0,
currentData: [],
totalItems: 0,
currentPage: 1,
itemsPerPage
};
}

const totalPages = Math.ceil(processedData.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = Math.min(startIndex + itemsPerPage, processedData.length);
const currentData = processedData.slice(startIndex, endIndex);

return {
totalPages,
startIndex,
endIndex,
currentData,
totalItems: processedData.length,
currentPage,
itemsPerPage
};
}, [processedData, currentPage, itemsPerPage]);

useEffect(() => {
setCurrentPage(1);
setSelectedItems([]);
}, [searchTerm, itemsPerPage]);

const handleSort = useCallback((key) => {
setSortConfig(prev => ({
key,
direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
}));
}, []);

const generateItemId = useCallback((row) => {
if (!row) return null;
const orderCode = row["Order Code"];
if (!orderCode || orderCode.trim() === '') {
return `${row["Client Name"] || 'Unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}
return orderCode.trim();
}, []);

const findRowFromOrderCode = useCallback((orderCode) => {
if (!orderCode || orderCode.trim() === '') {
return null;
}

return processedData.find(row => {
if (!row) return false;
const rowOrderCode = row["Order Code"];
return rowOrderCode && rowOrderCode.trim() === orderCode.trim();
});
}, [processedData]);

const handleItemSelect = useCallback((itemId, rowData) => {
if (!itemId) return;

setSelectedItems(prev => {
if (prev.includes(itemId)) {
return prev.filter(id => id !== itemId);
} else {
return [...prev, itemId];
}
});
}, []);

const handleSelectAll = useCallback(() => {
const { currentData } = paginationData;

if (!currentData || currentData.length === 0) return;

const allCurrentIds = currentData
.map(row => generateItemId(row))
.filter(id => id !== null);

if (allCurrentIds.length === 0) return;

setSelectedItems(prev => {
const currentSelected = prev.filter(id => allCurrentIds.includes(id));
if (currentSelected.length === allCurrentIds.length) {
return prev.filter(id => !allCurrentIds.includes(id));
} else {
return [...new Set([...prev, ...allCurrentIds])];
}
});
}, [paginationData, generateItemId]);

const handleDeselectAll = useCallback(() => {
setSelectedItems([]);
}, []);

const handleEdit = useCallback((row, rowId) => {
if (!row) return;
setEditingRow(row);
setEditDialogOpen(true);
}, []);

const handleDelete = useCallback((row, rowId) => {
if (!row) return;
setDeletingItem(row);
setDeleteDialogOpen(true);
}, []);

const handleBulkDelete = useCallback(() => {
if (selectedItems.length === 0) {
return;
}

const selectedRows = [];
const invalidItems = [];

selectedItems.forEach(orderCode => {
const row = findRowFromOrderCode(orderCode);
if (row && (row["Client Name"] || row["Order Code"])) {
selectedRows.push(row);
} else {
invalidItems.push(orderCode);
}
});

if (selectedRows.length === 0) {
alert('Tidak ada data valid yang dipilih untuk dihapus');
return;
}

setDeletingItem(selectedRows);
setDeleteDialogOpen(true);
}, [selectedItems, findRowFromOrderCode]);

const handleEditSave = useCallback(async (editedData) => {
if (isUpdating || !editingRow) return;
setIsUpdating(true);

try {
const clientName = editingRow["Client Name"];
const orderCode = editingRow["Order Code"];

if (!clientName || !orderCode) {
throw new Error('Client Name atau Order Code tidak ditemukan');
}

const numericFields = [
'Cost', 'Add Cost 1', 'Add Cost 2', 'Add Charge 1', 'Add Charge 2',
'Selling Price', 'RoundDown', 'RoundUp', 'WeightDecimal', 
'Distance', 'RoundDown Distance', 'RoundUp Distance'
];

const integerFields = [
'Total Pengiriman', 'Additional Notes For Address'
];

const processedUpdateData = {};

Object.keys(editedData).forEach(key => {
const value = editedData[key];

if (numericFields.includes(key)) {
const numValue = parseFloat(value);
processedUpdateData[key] = isNaN(numValue) ? 0 : numValue;
} else if (integerFields.includes(key)) {
const intValue = parseInt(value);
processedUpdateData[key] = isNaN(intValue) ? 0 : intValue;
} else if (key === 'Delivery Status') {
if (value && typeof value === 'string') {
const status = value.toString().trim().toUpperCase();
const validStatuses = ["ONTIME", "LATE", "DELAY", "EARLY"];
if (!validStatuses.includes(status)) {
if (status === "PENDING" || status === "ON TIME") {
processedUpdateData[key] = "ONTIME";
} else if (status === "DELAYED") {
processedUpdateData[key] = "DELAY";
} else {
processedUpdateData[key] = "ONTIME";
}
} else {
processedUpdateData[key] = status;
}
} else {
processedUpdateData[key] = "ONTIME";
}
} else {
processedUpdateData[key] = value === null || value === undefined ? '' : String(value);
}
});

const updatePayload = {
clientName: String(clientName).trim(),
orderCode: String(orderCode).trim(),
updateData: processedUpdateData
};

console.log('Sending update payload:', updatePayload);

const result = await updateDataFromServer(updatePayload);

if (result && result.success) {
console.log('Update successful:', result);
setEditDialogOpen(false);
setEditingRow(null);
setTimeout(() => {
refreshDataFromServer();
}, 500);
} else {
throw new Error(result?.message || 'Update operation failed');
}
} catch (error) {
console.error('Failed to update data:', error);
alert(`Gagal mengupdate data: ${error.message}`);
} finally {
setIsUpdating(false);
}
}, [editingRow, isUpdating, refreshDataFromServer]);

const handleDeleteConfirm = useCallback(async () => {
if (isDeleting || !deletingItem) return;
setIsDeleting(true);

try {
let deletePayload = [];

if (Array.isArray(deletingItem)) {
deletePayload = deletingItem.map(row => ({
clientName: row["Client Name"] || 'Unknown',
orderCode: row["Order Code"] || `Order-${Date.now()}`
}));
} else {
deletePayload = [{
clientName: deletingItem["Client Name"] || 'Unknown',
orderCode: deletingItem["Order Code"] || `Order-${Date.now()}`
}];
}

if (deletePayload.length === 0) {
throw new Error('No valid data to delete');
}

const result = await deleteDataFromServer(deletePayload);

if (result && result.success) {
setSelectedItems([]);
setDeleteDialogOpen(false);
setDeletingItem(null);
setTimeout(() => {
refreshDataFromServer();
}, 500);
} else {
throw new Error('Delete operation failed');
}
} catch (error) {
console.error('Failed to delete data:', error);
alert(`Gagal menghapus data: ${error.message}`);
} finally {
setIsDeleting(false);
}
}, [deletingItem, isDeleting, refreshDataFromServer]);

const handleEditClose = useCallback(() => {
setEditDialogOpen(false);
setEditingRow(null);
}, []);

const handleDeleteClose = useCallback(() => {
setDeleteDialogOpen(false);
setDeletingItem(null);
}, []);

const handleZoneDataUpdate = useCallback(async () => {
if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) return;

setIsLoadingZoneAnalysis(true);
try {
await forceClearBonusCache();
const analysisData = await analyzeZonesByCourierAndHub(groupedData, null, true);
setZoneAnalysisData(analysisData || []);
} catch (error) {
console.error('Error updating zone data:', error);
setZoneAnalysisData([]);
} finally {
setIsLoadingZoneAnalysis(false);
}
}, [groupedData]);

const handleShowZoneAnalysis = useCallback(async () => {
if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) return;

setIsLoadingZoneAnalysis(true);
setZoneAnalysisData([]);

try {
const analysisData = await analyzeZonesByCourierAndHub(groupedData, null, true);
setZoneAnalysisData(analysisData || []);
setShowZoneAnalysis(true);
} catch (error) {
console.error('Error in zone analysis:', error);
setZoneAnalysisData([]);
setShowZoneAnalysis(true);
} finally {
setIsLoadingZoneAnalysis(false);
}
}, [groupedData]);

const handleBackToProfit = useCallback(() => {
setShowZoneAnalysis(false);
setZoneAnalysisData([]);
}, []);

const handlePageChange = useCallback((page) => {
setCurrentPage(page);
setSelectedItems([]);
}, []);

const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
setItemsPerPage(newItemsPerPage);
setCurrentPage(1);
setSelectedItems([]);
}, []);

const handleSearchChange = useCallback((value) => {
if (searchTimeoutRef.current) {
clearTimeout(searchTimeoutRef.current);
}

setSearchTerm(value);
setSelectedItems([]);
}, []);

return {
showZoneAnalysis,
zoneAnalysisData,
currentPage,
itemsPerPage,
searchTerm,
sortConfig,
isLoadingZoneAnalysis,
sortedData: processedData,
clientSummary,
totals,
paginationData,
isDataLoading: isProcessing,
selectedItems,
editDialogOpen,
editingRow,
deleteDialogOpen,
deletingItem,
isUpdating,
isDeleting,
resetTableState,
handleSort,
handleShowZoneAnalysis,
handleBackToProfit,
handlePageChange,
handleItemsPerPageChange,
handleSearchChange,
handleZoneDataUpdate,
handleItemSelect,
handleSelectAll,
handleDeselectAll,
handleEdit,
handleDelete,
handleBulkDelete,
handleEditSave,
handleEditClose,
handleDeleteConfirm,
handleDeleteClose,
refreshDataFromServer
};
};