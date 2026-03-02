import { useState, useEffect, useCallback } from 'react';
import { exportToExcel } from '../utils/exportExcel';

export const useDataProcessing = (
memoizedData, 
loading, 
isProcessing, 
handleGenerateGroupedData,
filteredData,
groupedData,
allDisplayData = null
) => {
const [dataProcessed, setDataProcessed] = useState(false);
const [isExporting, setIsExporting] = useState(false);

useEffect(() => {
if (memoizedData.length > 0 && !loading && !isProcessing && !dataProcessed && typeof handleGenerateGroupedData === 'function') {
const processData = async () => {
try {
await handleGenerateGroupedData();
setDataProcessed(true);
} catch (error) {
console.error('Error during auto-processing:', error);
setDataProcessed(false);
}
};
processData();
}
}, [memoizedData, loading, isProcessing, handleGenerateGroupedData, dataProcessed]);

useEffect(() => {
if (memoizedData.length === 0) {
setDataProcessed(false);
}
}, [memoizedData]);

const handleExport = useCallback(async () => {
if (isExporting) return;

setIsExporting(true);
try {
if (!memoizedData || memoizedData.length === 0) {
alert('No data available for export');
return;
}

const exportData = filteredData && filteredData.length > 0 ? filteredData : memoizedData;
const exportGroupedData = groupedData || [];

await exportToExcel(memoizedData, exportData, exportGroupedData, [], {}, allDisplayData);

} catch (err) {
console.error('Export failed:', err);
alert(`Export failed: ${err.message || 'Please try again.'}`);
} finally {
setIsExporting(false);
}
}, [memoizedData, filteredData, groupedData, allDisplayData, isExporting]);

const resetDataProcessed = useCallback(() => {
setDataProcessed(false);
}, []);

return {
dataProcessed,
isExporting,
handleExport,
resetDataProcessed
};
};