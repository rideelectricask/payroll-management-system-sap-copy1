import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Button } from "@material-tailwind/react";

import { useTableData } from "../hooks/useTableData";
import { useTableState } from "../hooks/useTableState";
import { useProfitData } from "../hooks/useProfitData";
import { useBonusData } from "../hooks/useBonusData";
import { useCourierPerformance } from "../utils/courierPerformance/courierPerformanceUtils";
import { useHubAnalysis } from "../hooks/useHubAnalysis";
import { useBonusMatching } from "../hooks/useBonusMatching";
import { useDataProcessing } from "../hooks/useDataProcessing";

import DataTable from "../components/DataTable";
import ProfitTable from "../components/ProfitTable";
import AnalisisHUB from "../components/AnalisisHUB";
import CourierPerformanceTable from "../components/CourierPerformanceTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";

import { 
getTopPerformerRanks, 
generatePerformanceReport, 
getPerformanceIndicator 
} from "../utils/courierPerformance/topPerformerUtils";

import { exportDashboardToExcel } from "../utils/exportExcel";

const TABLE_HEAD = [
"Client Name", "Batch", "Date", "HUB", "Order Code", "Weight", "Distance", "Cnee Name", "Cnee Address 1",
"Cnee Address 2", "Cnee Area", "Location", "Cnee Phone", "Slot Time", "ETA", "Courier Code", "Courier Name",
"Receiver", "Receiving Date", "Receiving Time", "DropOff Done", "Delivery Status"
];

const useCompareData = () => {
const [compareResult, setCompareResult] = useState(null);
const [isReloading, setIsReloading] = useState(false);

const handleCompareResult = useCallback((result) => {
setCompareResult(result);
}, []);

const handleCloseCompareResult = useCallback(() => {
setCompareResult(null);
}, []);

return {
compareResult,
isReloading,
setIsReloading,
handleCompareResult,
handleCloseCompareResult
};
};

const useDataRefresh = (refreshData) => {
const [forceRefreshKey, setForceRefreshKey] = useState(0);

const handleDataReload = useCallback(async (setIsReloading) => {
try {
setIsReloading(true);
await refreshData();
setForceRefreshKey(prev => prev + 1);
} catch (error) {
console.error('Error reloading data:', error);
alert('Gagal memuat ulang data. Silakan refresh halaman.');
} finally {
setIsReloading(false);
}
}, [refreshData]);

return { forceRefreshKey, handleDataReload };
};

const useProcessedData = (data, driverMap, dataVersion, forceRefreshKey) => {
const memoizedData = useMemo(() => {
if (!data || !Array.isArray(data)) return [];
return data.filter(row => {
if (!row) return false;
if (typeof row !== 'object') return false;
return row["Order Code"] && row["Client Name"];
});
}, [data, dataVersion, forceRefreshKey]);

const memoizedDrivers = useMemo(() => {
return Object.entries(driverMap).map(([username, fullName]) => ({
username,
fullName
}));
}, [driverMap]);

return { memoizedData, memoizedDrivers };
};

const calculateInternalMetrics = (row, uniqueDates) => {
if (!row || !uniqueDates || uniqueDates.length === 0) return {};

const { deliveriesByDate = {}, roundUpByDate = {}, distanceByDate = {}, deliveryTimeByDate = {} } = row;

const getTotals = (dateObj) => Object.values(dateObj).reduce((sum, val) => sum + (val || 0), 0);
const getActiveDays = (dateObj) => Object.keys(dateObj).filter(date => dateObj[date] > 0).length;

const totals = {
count: getTotals(deliveriesByDate),
roundUp: getTotals(roundUpByDate),
distance: getTotals(distanceByDate),
time: getTotals(deliveryTimeByDate)
};

const activeDays = {
count: getActiveDays(deliveriesByDate),
roundUp: getActiveDays(roundUpByDate),
distance: getActiveDays(distanceByDate),
time: getActiveDays(deliveryTimeByDate)
};

const totalDays = uniqueDates.length;

return {
avgAllCount: totalDays > 0 ? totals.count / totalDays : 0,
avgAllRoundUp: totalDays > 0 ? totals.roundUp / totalDays : 0,
avgAllDistance: totalDays > 0 ? totals.distance / totalDays : 0,
avgAllTime: totalDays > 0 ? totals.time / totalDays : 0,
avgCount: activeDays.count > 0 ? totals.count / activeDays.count : 0,
avgRoundUp: activeDays.roundUp > 0 ? totals.roundUp / activeDays.roundUp : 0,
avgDistance: activeDays.distance > 0 ? totals.distance / activeDays.distance : 0,
avgTime: activeDays.time > 0 ? totals.time / activeDays.time : 0
};
};

const createTopPerformerData = (rank, performanceData, totalCouriers) => {
if (!rank || !performanceData || !totalCouriers) return null;

const percentile = ((totalCouriers - rank + 1) / totalCouriers) * 100;
const reason = performanceData.reason || '';

const getCategory = (reason) => {
if (reason.includes("Elite")) return "Elite Performer";
if (reason.includes("Gold")) return "Top Performer";
if (reason.includes("Silver")) return "High Performer";
if (reason.includes("Bronze")) return "Above Average";
if (reason.includes("Standard")) return "Average Performer";
return "Needs Improvement";
};

const getPerformanceMetric = (value, benchmark, percentile) => {
if (percentile >= 90) return "excellent";
if (percentile >= 75) return "good";
if (percentile >= 50) return "average";
return "below_average";
};

return {
rank,
totalCouriers,
percentile,
indicator: getPerformanceIndicator(rank, totalCouriers),
score: performanceData.score || 0,
reason,
benchmarks: performanceData.benchmarks || {},
advancedInsights: {
category: getCategory(reason),
detailedAnalysis: reason,
performanceMetrics: {
onTimeVsBenchmark: getPerformanceMetric(null, null, percentile),
deliveryVsBenchmark: "average",
profitVsBenchmark: "average",
efficiencyScore: performanceData.score || 0
},
recommendations: reason.includes("REKOMENDASI:") ? 
reason.split("REKOMENDASI: ")[1]?.split(".") || [] : []
}
};
};

const useAllDisplayData = (courierPerformanceData, uniqueDates, courierFinancialData, courierTotalDistances) => {
const [allDisplayData, setAllDisplayData] = useState(null);

useEffect(() => {
if (!courierPerformanceData?.length || !courierFinancialData || 
!Object.keys(courierFinancialData).length || !uniqueDates?.length) {
return;
}

const topPerformerRanks = getTopPerformerRanks(courierPerformanceData, courierFinancialData);
const performanceReport = generatePerformanceReport(courierPerformanceData, courierFinancialData);
const totalCouriers = courierPerformanceData.length;

const allDisplayDataGenerated = courierPerformanceData.map(row => {
const courierCode = row.courierCode;
const financialData = courierFinancialData[courierCode] || {};
const distanceTotal = courierTotalDistances[courierCode]?.totalDistance || 0;
const netProfit = (financialData.profit || 0) - (financialData.costPlusAddCost1 || 0);
const deliveryRatio = ((row.totalDeliveries || 0) / 
((row.totalDeliveries || 0) + (row.lateDeliveries || 0))) * 100 || 0;

const calculatedAvgMetrics = calculateInternalMetrics(row, uniqueDates);
const rank = topPerformerRanks.get(courierCode);
const performanceData = performanceReport.get(courierCode);
const topPerformerData = createTopPerformerData(rank, performanceData, totalCouriers);

return {
courierCode: courierCode || "",
courierName: row.courierName || "",
hub: row.hub || "",
totalDeliveries: row.totalDeliveries || 0,
onTimeDeliveries: row.onTimeDeliveries || 0,
lateDeliveries: row.lateDeliveries || 0,
onTimePercentage: row.onTimePercentage || 0,
latePercentage: row.latePercentage || 0,
performanceRating: row.performanceRating || "N/A",
deliveryRatio,
distanceTotal,
cost: financialData.costPlusAddCost1 || 0,
profit: financialData.profit || 0,
netProfit,
totalDeliveryTime: row.totalDeliveryTime || 0,
totalDistance: row.totalDistance || 0,
totalRoundUp: row.totalRoundUp || 0,
deliveriesByDate: row.deliveriesByDate || {},
roundUpByDate: row.roundUpByDate || {},
distanceByDate: row.distanceByDate || {},
deliveryTimeByDate: row.deliveryTimeByDate || {},
...calculatedAvgMetrics,
uniqueDates: uniqueDates || [],
topPerformerData
};
});

setAllDisplayData(allDisplayDataGenerated);
}, [courierPerformanceData, uniqueDates, courierFinancialData, courierTotalDistances]);

return allDisplayData;
};

const CompareResultDisplay = ({ compareResult, onClose }) => {
if (!compareResult) return null;

const { summary } = compareResult;

return (
<div className="w-full bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
<div className="flex justify-between items-start mb-4">
<div className="flex-1">
<h3 className="text-lg font-semibold text-gray-800 mb-2">Compare Result</h3>
{summary && (
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
<div className="bg-blue-50 p-3 rounded">
<p className="text-sm text-gray-600">Total Checked</p>
<p className="text-xl font-bold text-blue-600">{summary.totalChecked || 0}</p>
</div>
<div className="bg-green-50 p-3 rounded">
<p className="text-sm text-gray-600">Updated</p>
<p className="text-xl font-bold text-green-600">{summary.totalUpdated || 0}</p>
</div>
<div className="bg-yellow-50 p-3 rounded">
<p className="text-sm text-gray-600">Matched</p>
<p className="text-xl font-bold text-yellow-600">{summary.matchedRecords || 0}</p>
</div>
<div className="bg-red-50 p-3 rounded">
<p className="text-sm text-gray-600">Not Matched</p>
<p className="text-xl font-bold text-red-600">{summary.notMatchedRecords || 0}</p>
</div>
</div>
)}
</div>
<button
onClick={onClose}
className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
>
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>

<div className="space-y-4">
{compareResult.unmatchedExcelCodes?.length > 0 && (
<div>
<h3 className="text-sm font-semibold text-gray-800 mb-2">
Order Code Excel yang tidak cocok dengan data Sayurbox 
({compareResult.displayInfo?.excelDisplayed || compareResult.unmatchedExcelCodes.length} dari {compareResult.displayInfo?.excelTotal || compareResult.summary?.unmatchedExcelCount || compareResult.unmatchedExcelCodes.length}):
</h3>
<div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
<div className="text-sm text-red-600">
<div className="font-mono">
{compareResult.unmatchedExcelCodes.join(', ')}
{compareResult.displayInfo && compareResult.displayInfo.excelTotal > compareResult.displayInfo.excelDisplayed && (
<span className="text-gray-500 italic ml-2">
... dan {compareResult.displayInfo.excelTotal - compareResult.displayInfo.excelDisplayed} Order Code lainnya
</span>
)}
</div>
</div>
</div>
</div>
)}

{compareResult.unmatchedSayurboxCodes?.length > 0 && (
<div>
<h3 className="text-sm font-semibold text-gray-800 mb-2">
Order Code Sayurbox yang tidak cocok dengan data Excel 
({compareResult.displayInfo?.sayurboxDisplayed || compareResult.unmatchedSayurboxCodes.length} dari {compareResult.displayInfo?.sayurboxTotal || compareResult.summary?.unmatchedSayurboxCount || compareResult.unmatchedSayurboxCodes.length}):
</h3>
<div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
<div className="text-sm text-orange-600">
<div className="font-mono">
{compareResult.unmatchedSayurboxCodes.join(', ')}
{compareResult.displayInfo && compareResult.displayInfo.sayurboxTotal > compareResult.displayInfo.sayurboxDisplayed && (
<span className="text-gray-500 italic ml-2">
... dan {compareResult.displayInfo.sayurboxTotal - compareResult.displayInfo.sayurboxDisplayed} Order Code lainnya
</span>
)}
</div>
</div>
</div>
</div>
)}
</div>
</div>
);
};

const CostAndFinancialIntelligence = ({ tagFilterProps }) => {
const { selectedTags, setFilteredTags } = tagFilterProps;
const [hubAnalysisComplete, setHubAnalysisComplete] = useState(false);

const {
data,
driverMap,
loading,
error,
getCourierNameForDisplay,
refreshData,
ROWS_PER_PAGE,
dataVersion
} = useTableData(selectedTags);

const { bonusData, bonusLoading, bonusError } = useBonusData();
const { forceRefreshKey, handleDataReload } = useDataRefresh(refreshData);
const { memoizedData, memoizedDrivers } = useProcessedData(data, driverMap, dataVersion, forceRefreshKey);

const {
compareResult,
isReloading,
setIsReloading,
handleCompareResult,
handleCloseCompareResult
} = useCompareData();

const handleDataReloadWithLoading = useCallback(() => {
return handleDataReload(setIsReloading);
}, [handleDataReload]);

useEffect(() => {
const uniqueTags = [...new Set(memoizedData.map(row => row?.['Client Name'] || '').filter(Boolean))];
setFilteredTags(uniqueTags);
}, [memoizedData, setFilteredTags]);

const {
searchTerm,
setSearchTerm,
currentPage,
setCurrentPage,
paginatedData,
filteredData,
totalPages,
handleSort
} = useTableState(data, getCourierNameForDisplay, ROWS_PER_PAGE, TABLE_HEAD);

const {
groupedData,
showGroupedTable,
isProcessing,
handleGenerateGroupedData,
refreshGroupedData,
resetProfitView
} = useProfitData(memoizedData, getCourierNameForDisplay, forceRefreshKey);

const {
courierPerformanceData,
deliveryCountsByDate,
uniqueDates,
roundUpData,
distanceData,
deliveryTimeData,
courierFinancialData,
courierTotalDistances,
showCourierPerformance,
handleCourierPerformanceAnalysis,
handleCourierDataUpdate,
handleBackToProfitFromCourier
} = useCourierPerformance(memoizedData, memoizedDrivers, getCourierNameForDisplay, groupedData);

const { hubAnalysisData, showChart, isAnalyzing, handleShowChart, analyzeHubData } = useHubAnalysis(memoizedData);
const { matchedBonusData, handleZoneAnalysis } = useBonusMatching(memoizedData, bonusData);

const allDisplayData = useAllDisplayData(courierPerformanceData, uniqueDates, courierFinancialData, courierTotalDistances);

const { dataProcessed, handleExport } = useDataProcessing(
memoizedData,
loading,
isProcessing,
handleGenerateGroupedData,
filteredData,
groupedData,
allDisplayData
);

const handleShowChartStable = useCallback(async () => {
if (isAnalyzing || showChart) return;

try {
await handleShowChart();
setHubAnalysisComplete(true);
} catch (error) {
console.error('Error showing chart:', error);
alert('Gagal menampilkan analisis HUB. Silakan coba lagi.');
}
}, [handleShowChart, isAnalyzing, showChart]);

const handleDashboardExport = useCallback(async () => {
if (isAnalyzing) {
alert('Analisis HUB sedang berlangsung. Mohon tunggu sebentar.');
return;
}

try {
let dataToExport = hubAnalysisData;

if (!dataToExport || dataToExport.length === 0) {
if (!memoizedData || memoizedData.length === 0) {
alert('Tidak ada data untuk membuat dashboard. Pastikan data sudah dimuat terlebih dahulu.');
return;
}

const hubDataForAnalysis = memoizedData.map(row => {
const deliveryStatus = row["Delivery Status"];
const isOnTime = deliveryStatus === "ONTIME" || deliveryStatus === "ON TIME";
const isLate = deliveryStatus === "LATE";
const hub = row["HUB"] || "Unknown HUB";

return {
hubName: hub,
totalDeliveries: 1,
onTimeDeliveries: isOnTime ? 1 : 0,
lateDeliveries: isLate ? 1 : 0,
onTimePercentage: 0,
latePercentage: 0,
kategori: hub.includes('Satellite') ? 'Hub Satelit' : 'Hub Utama',
tingkatKinerja: 'Processing'
};
});

const hubAggregated = {};
hubDataForAnalysis.forEach(item => {
const hubName = item.hubName;
if (!hubAggregated[hubName]) {
hubAggregated[hubName] = {
hubName: hubName,
totalDeliveries: 0,
onTimeDeliveries: 0,
lateDeliveries: 0,
kategori: item.kategori
};
}
hubAggregated[hubName].totalDeliveries += item.totalDeliveries;
hubAggregated[hubName].onTimeDeliveries += item.onTimeDeliveries;
hubAggregated[hubName].lateDeliveries += item.lateDeliveries;
});

dataToExport = Object.values(hubAggregated).map(hub => {
const newHub = Object.assign({}, hub);
newHub.onTimePercentage = hub.totalDeliveries > 0 ? (hub.onTimeDeliveries / hub.totalDeliveries) * 100 : 0;
newHub.latePercentage = hub.totalDeliveries > 0 ? (hub.lateDeliveries / hub.totalDeliveries) * 100 : 0;
newHub.tingkatKinerja = hub.totalDeliveries > 0 && (hub.onTimeDeliveries / hub.totalDeliveries) * 100 >= 99.5 ? 'Perfect' :
hub.totalDeliveries > 0 && (hub.onTimeDeliveries / hub.totalDeliveries) * 100 >= 98 ? 'Excellent' :
hub.totalDeliveries > 0 && (hub.onTimeDeliveries / hub.totalDeliveries) * 100 >= 97 ? 'Good' : 'Needs Improvement';
return newHub;
});
}

if (!dataToExport || dataToExport.length === 0) {
alert('Data dashboard kosong setelah proses analisis');
return;
}

await exportDashboardToExcel(dataToExport);
} catch (error) {
console.error('Error exporting dashboard:', error);
alert('Gagal mengekspor data dashboard: ' + error.message);
}
}, [hubAnalysisData, memoizedData, isAnalyzing]);

const isDataLoading = loading || bonusLoading || isReloading || isProcessing;
const hasValidData = !isDataLoading && memoizedData.length > 0;
const shouldShowTable = hasValidData && !isReloading;

if (error || bonusError) {
return (
<div className="space-y-4">
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
<p className="text-red-800">Error: {error || bonusError}</p>
<Button 
className="mt-2" 
size="sm" 
color="red" 
variant="outlined"
onClick={() => window.location.reload()}
>
Retry
</Button>
</div>
</div>
);
}

if (showCourierPerformance) {
return (
<ErrorBoundary>
<CourierPerformanceTable 
courierData={courierPerformanceData}
deliveryCountsByDate={deliveryCountsByDate}
uniqueDates={uniqueDates}
roundUpData={roundUpData}
distanceData={distanceData}
deliveryTimeData={deliveryTimeData}
courierFinancialData={courierFinancialData}
courierTotalDistances={courierTotalDistances}
onBack={handleBackToProfitFromCourier}
onDataUpdate={handleCourierDataUpdate}
/>
</ErrorBoundary>
);
}

return (
<ErrorBoundary>
<div className="space-y-6">
<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
<div className="flex-1">
<p className="text-gray-600 text-sm mt-1">
{selectedTags.length > 0 && `Filtered by: ${selectedTags.join(', ')}`}
</p>
</div>
</div>

<CompareResultDisplay 
compareResult={compareResult} 
onClose={handleCloseCompareResult} 
/>

<div className="flex-1">
{isDataLoading && (
<LoadingSpinner message={
isReloading ? "Reloading table data..." :
loading ? "Loading table data..." : 
isProcessing ? "Processing data..." : "Loading bonus data..."
} />
)}

{shouldShowTable && !showGroupedTable && (
<div className="space-y-4">
<DataTable 
data={paginatedData || []}
searchTerm={searchTerm}
setSearchTerm={setSearchTerm}
currentPage={currentPage}
setCurrentPage={setCurrentPage}
totalPages={totalPages}
handleSort={handleSort}
tableHead={TABLE_HEAD}
getCourierNameForDisplay={getCourierNameForDisplay}
getLocationForDisplay={(row) => row?.Location || ''}
loading={false}
/>
</div>
)}

{shouldShowTable && showGroupedTable && groupedData?.length > 0 && (
<div className="space-y-4">
<ProfitTable 
groupedData={groupedData} 
onShowChart={handleShowChartStable}
onZoneAnalysis={handleZoneAnalysis}
onCourierPerformance={handleCourierPerformanceAnalysis}
matchedBonusData={matchedBonusData}
onCompareResult={handleCompareResult}
onDataReload={handleDataReloadWithLoading}
onExport={handleExport}
onDashboardExport={handleDashboardExport}
isDataLoading={isDataLoading}
shouldShowTable={shouldShowTable}
isReloading={isReloading}
memoizedDataLength={memoizedData.length}
key={`profit-table-${forceRefreshKey}`}
/>
{showChart && (
<AnalisisHUB 
hubAnalysisData={hubAnalysisData}
/>
)}
</div>
)}

{!isDataLoading && memoizedData.length === 0 && (
<div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
<p className="text-gray-600">No data available. Please upload or select data to display.</p>
</div>
)}
</div>
</div>
</ErrorBoundary>
);
};

export default CostAndFinancialIntelligence;