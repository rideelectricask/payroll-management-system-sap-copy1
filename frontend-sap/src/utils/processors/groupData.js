import { DataProcessor } from '../../processors/DataProcessor.js';
import { CalculationUtils } from '../calculations/CalculationUtils.js';
import DataService from '../../services/DataService.js';
import ZoneAnalyzer from '../../analyzers/ZoneAnalyzer.js';

const dataProcessor = new DataProcessor();

const formatCurrency = (amount) => {
const formatter = new Intl.NumberFormat("id-ID");
return `Rp${formatter.format(amount || 0)}`;
};

const calculateProfit = (row) => {
return (row["Selling Price"] || 0) + 
(row["Add Charge 1"] || 0) + 
(row["Add Charge 2"] || 0) - 
(row["Cost"] || 0) - 
(row["Add Cost 1"] || 0) - 
(row["Add Cost 2"] || 0);
};

const convertArrayToObject = (arrayData) => {
if (!Array.isArray(arrayData)) {
return arrayData;
}

const headers = [
"Client Name", "Order Code", "Courier Name", "Courier Code", "HUB", 
"DropOff Done", "Total Pengiriman", "Cost", "Add Cost 1", 
"Add Cost 2", "Add Charge 1", "Add Charge 2", 
"Selling Price", "Profit", "Zona", "Delivery Status", "Unit"
];

const result = {};
arrayData.forEach((value, index) => {
if (index < headers.length) {
result[headers[index]] = value;
}
});

return result;
};

const logRowValues = (row, index) => {
const rowData = Array.isArray(row) ? convertArrayToObject(row) : row;
const calculatedProfit = calculateProfit(rowData);

const values = [
rowData["Client Name"] || "-",
rowData["Order Code"] || "-", 
rowData["Courier Name"] || "-",
rowData["Courier Code"] || "-",
rowData["HUB"] || "-",
rowData["DropOff Done"] || "-",
rowData["Total Pengiriman"] || 0,
formatCurrency(rowData["Cost"]),
formatCurrency(rowData["Add Cost 1"]),
formatCurrency(rowData["Add Cost 2"]),
formatCurrency(rowData["Add Charge 1"]),
formatCurrency(rowData["Add Charge 2"]),
formatCurrency(rowData["Selling Price"]),
formatCurrency(calculatedProfit),
rowData["Zona"] || "-",
rowData["Delivery Status"] || "-",
rowData["Unit"] || "-"
];

return values;
};

const logAllRowValues = (data, limit = 10) => {
const headers = [
"Client Name", "Order Code", "Courier Name", "Courier Code", "HUB", 
"Drop-off Completed", "Total Deliveries", "Base Cost", "Additional Cost 1", 
"Additional Cost 2", "Additional Charge 1", "Additional Charge 2", 
"Selling Price", "Profit", "Zone", "Delivery Status", "Unit"
];

data.slice(0, limit).forEach((row, index) => {
logRowValues(row, index);
});

const totals = calculateDataTotals(data);
};

const calculateDataTotals = (data) => {
return data.reduce((totals, row) => {
const rowData = Array.isArray(row) ? convertArrayToObject(row) : row;
const profit = calculateProfit(rowData);

totals.totalProfit += profit;
totals.totalSellingPrice += rowData["Selling Price"] || 0;
totals.totalCost += rowData["Cost"] || 0;
totals.totalAdditionalCharges += (rowData["Add Charge 1"] || 0) + (rowData["Add Charge 2"] || 0);
totals.totalAdditionalCosts += (rowData["Add Cost 1"] || 0) + (rowData["Add Cost 2"] || 0);

return totals;
}, {
totalProfit: 0,
totalSellingPrice: 0,
totalCost: 0,
totalAdditionalCharges: 0,
totalAdditionalCosts: 0
});
};

const logCourierSummary = (data) => {
const courierSummary = {};

data.forEach(row => {
const rowData = Array.isArray(row) ? convertArrayToObject(row) : row;
const courierName = rowData["Courier Name"];
const courierCode = rowData["Courier Code"];
const key = `${courierName}|${courierCode}`;

if (!courierSummary[key]) {
courierSummary[key] = {
courierName,
courierCode,
totalRecords: 0,
totalProfit: 0,
totalSellingPrice: 0,
totalCost: 0,
totalDeliveries: 0
};
}

const summary = courierSummary[key];
summary.totalRecords++;
summary.totalProfit += calculateProfit(rowData);
summary.totalSellingPrice += rowData["Selling Price"] || 0;
summary.totalCost += rowData["Cost"] || 0;
summary.totalDeliveries += rowData["Total Pengiriman"] || 0;
});

Object.values(courierSummary)
.sort((a, b) => b.totalProfit - a.totalProfit)
.forEach(summary => {
});
};

const logZoneAnalysisData = (data) => {
if (!data || data.length === 0) {
return;
}

data.forEach((item, index) => {
const rowData = Array.isArray(item) ? convertArrayToObject(item) : item;
});
};

export const formatGroupedDataForExport = async (groupedData) => {
if (!groupedData || groupedData.length === 0) {
return [];
}

const zoneAnalysisResult = await analyzeZonesByCourierAndHub(groupedData);

if (!zoneAnalysisResult || zoneAnalysisResult.length === 0) {
return [];
}

const exportData = zoneAnalysisResult.map(item => {
const zones = item.zones || {};

return {
"Hub": item.hub || "",
"Courier Name": item.courierName || "",
"Courier Code": item.courierCode || "",
"Zone 1": zones["ZONA 1"] || 0,
"Zone 2": zones["ZONA 2"] || 0,
"Zone 3": zones["ZONA 3"] || 0,
"Zone 4": zones["ZONA 4"] || 0,
"Zone 5": zones["ZONA 5"] || 0,
"Zone 6": zones["ZONA 6"] || 0,
"Total Packages": item.totalPacket || 0,
"Base Fee": item.fee || 0,
"Heavy Package Fee": item.heavyPrice || 0,
"Package Bonus": item.bonusPacket || 0,
"Festive Bonus": item.festiveBonus || 0,
"Post-Reconciliation": item.afterRekon || 0,
"Additional Personal": item.addPersonal || 0,
"Incentives": item.incentives || 0,
"Askor Fee": item.askorFee || 0,
"Total Fee": item.totalFee || 0
};
});

return exportData;
};

export const groupByCourierAndDate = async (data, bonusDataCache = null, forceRefreshBonus = false) => {
try {
const result = await dataProcessor.groupByCourierAndDate(data, bonusDataCache, forceRefreshBonus);

const processedResult = result.map(item => {
if (Array.isArray(item)) {
return convertArrayToObject(item);
}
return item;
});

logAllRowValues(processedResult, 5);
logCourierSummary(processedResult);

return processedResult;
} catch (error) {
console.error('Error in groupByCourierAndDate:', error);
throw error;
}
};

export const analyzeZonesByCourierAndHub = async (groupedData, bonusDataCache = null, forceRefreshBonus = false) => {
try {
const result = await ZoneAnalyzer.analyzeZonesByCourierAndHub(groupedData, bonusDataCache, forceRefreshBonus);

const processedResult = result.map(item => {
if (Array.isArray(item)) {
return convertArrayToObject(item);
}
return item;
});

if (processedResult.length > 0) {
logZoneAnalysisData(processedResult);
logAllRowValues(processedResult, 3);
}

return processedResult;
} catch (error) {
console.error('Error in analyzeZonesByCourierAndHub:', error);
throw error;
}
};

export const displayDriversWithAskorTrue = async (forceRefresh = false) => {
try {
const result = await ZoneAnalyzer.displayDriversWithAskorTrue(forceRefresh);
return result;
} catch (error) {
console.error('Error in displayDriversWithAskorTrue:', error);
throw error;
}
};

export const displayDriverBonusData = async (forceRefresh = false) => {
try {
const result = await ZoneAnalyzer.displayDriverBonusData(forceRefresh);
return result;
} catch (error) {
console.error('Error in displayDriverBonusData:', error);
throw error;
}
};

export const checkCourierBonusMatch = async (groupedData, bonusDataCache = null, forceRefreshBonus = false) => {
try {
const result = await ZoneAnalyzer.checkCourierBonusMatch(groupedData, bonusDataCache, forceRefreshBonus);
return result;
} catch (error) {
console.error('Error in checkCourierBonusMatch:', error);
throw error;
}
};

export const getDriverWeeklyEarnings = async (courierCode, driverDataCache = null, forceRefresh = false) => {
try {
const result = await ZoneAnalyzer.getDriverWeeklyEarnings(courierCode, driverDataCache, forceRefresh);
return result;
} catch (error) {
console.error(`Error getting weekly earnings for ${courierCode}:`, error);
return 0;
}
};

export const calculatePackageBonus = (totalPacket) => {
const result = CalculationUtils.calculatePackageBonus(totalPacket);
return result;
};

export const calculateWeeklyEarnings = (monthlyFee, cutoffData = null) => {
const result = CalculationUtils.calculateWeeklyEarnings(monthlyFee, cutoffData);
return result;
};

export const refreshBonusData = () => {
DataService.refreshBonusData();
};

export const refreshDriverData = () => {
DataService.refreshDriverData();
};

export const forceClearBonusCache = async () => {
try {
const result = await DataService.getBonusData(true);
return result;
} catch (error) {
console.error('Error clearing bonus cache:', error);
throw error;
}
};

export const forceClearDriverCache = async () => {
try {
const result = await DataService.getDriverData(true);
return result;
} catch (error) {
console.error('Error clearing driver cache:', error);
throw error;
}
};

export const getCacheStats = () => {
const result = DataService.getCacheStats();
return result;
};

export const getAskorTrueDrivers = async (forceRefresh = false) => {
try {
const result = await DataService.getAskorTrueDrivers(forceRefresh);
return result;
} catch (error) {
console.error('Error getting ASKOR TRUE drivers:', error);
throw error;
}
};

export const getBonusData = async (forceRefresh = false) => {
try {
const result = await DataService.getBonusData(forceRefresh);
return result;
} catch (error) {
console.error('Error getting bonus data:', error);
throw error;
}
};

export const getDriverData = async (forceRefresh = false) => {
try {
const result = await DataService.getDriverData(forceRefresh);
return result;
} catch (error) {
console.error('Error getting driver data:', error);
throw error;
}
};

export const findDriverByCode = (courierCode, drivers) => {
const result = DataService.findDriverByCode(courierCode, drivers);
return result;
};

export const findBonusByDriverName = (driverName, bonusData) => {
const result = DataService.findBonusByDriverName(driverName, bonusData);
return result;
};

export const displayTableRowValues = (data, startIndex = 0, limit = 10) => {
const displayData = data.slice(startIndex, startIndex + limit);
logAllRowValues(displayData, limit);

return displayData;
};

export const displayAskorTrueDrivers = displayDriversWithAskorTrue;
export const calculateDriverWeeklyEarnings = calculateWeeklyEarnings;
export { logRowValues, logAllRowValues, calculateDataTotals, logCourierSummary };