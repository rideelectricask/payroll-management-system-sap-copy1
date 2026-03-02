import { calculateDeliveryDuration, calculateAverageByDates, calculateOverallAverageMetrics, batchCalculateAverages, calculateCourierAverageMetrics } from './calculationUtilss.js';
import { sortDates } from './dateUtilss.js';
import { DELIVERY_STATUS } from './constants.js';

const BATCH_SIZE = 1000;
const MAX_CACHE_SIZE = 5000;

class OptimizedCache {
constructor(maxSize = MAX_CACHE_SIZE) {
this.maxSize = maxSize;
this.cache = new Map();
this.accessCount = new Map();
}

get(key) {
if (this.cache.has(key)) {
this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
return this.cache.get(key);
}
return undefined;
}

set(key, value) {
if (this.cache.size >= this.maxSize) {
this.evictLeastUsed();
}
this.cache.set(key, value);
this.accessCount.set(key, 1);
}

evictLeastUsed() {
let leastUsedKey = null;
let minAccess = Infinity;

for (const [key, count] of this.accessCount) {
if (count < minAccess) {
minAccess = count;
leastUsedKey = key;
}
}

if (leastUsedKey) {
this.cache.delete(leastUsedKey);
this.accessCount.delete(leastUsedKey);
}
}

clear() {
this.cache.clear();
this.accessCount.clear();
}

size() {
return this.cache.size;
}
}

const processCache = new OptimizedCache(3000);
const courierNameCache = new OptimizedCache(1000);
const deliveryTimeCache = new OptimizedCache(2000);
const roundUpCache = new OptimizedCache(2000);
const distanceCache = new OptimizedCache(2000);

const initializeDateTotals = (uniqueDates) => {
const dateDeliveries = {};
const dateRoundUps = {};
const dateDistances = {};
const dateDeliveryTimes = {};

for (const date of uniqueDates) {
dateDeliveries[date] = 0;
dateRoundUps[date] = 0;
dateDistances[date] = 0;
dateDeliveryTimes[date] = 0;
}

return { dateDeliveries, dateRoundUps, dateDistances, dateDeliveryTimes };
};

const processDateData = (item, acc) => {
const processDateEntries = (dateObject, accObject) => {
if (dateObject) {
for (const [date, value] of Object.entries(dateObject)) {
accObject[date] = (accObject[date] || 0) + value;
}
}
};

processDateEntries(item.deliveriesByDate, acc.dateDeliveries);
processDateEntries(item.roundUpByDate, acc.dateRoundUps);
processDateEntries(item.distanceByDate, acc.dateDistances);
processDateEntries(item.deliveryTimeByDate, acc.dateDeliveryTimes);
};

const calculateTotalAverages = (totals, dataLength) => {
if (dataLength === 0) return totals;

return {
...totals,
averageOnTimePercentage: totals.onTimePercentageSum / dataLength,
averageLatePercentage: totals.latePercentageSum / dataLength,
avgCount: totals.avgCountSum / dataLength,
avgRoundUp: totals.avgRoundUpSum / dataLength,
avgDistance: totals.avgDistanceSum / dataLength,
avgTime: totals.avgTimeSum / dataLength,
avgAllCount: totals.avgAllCountSum / dataLength,
avgAllRoundUp: totals.avgAllRoundUpSum / dataLength,
avgAllDistance: totals.avgAllDistanceSum / dataLength,
avgAllTime: totals.avgAllTimeSum / dataLength
};
};

export const calculateDeliveryTimeByDateAndCourier = (data) => {
if (!Array.isArray(data) || data.length === 0) return {};

const cacheKey = `delivery_time_${data.length}_${data[0]?.["Date"] || ''}_${data[data.length - 1]?.["Date"] || ''}`;
const cached = deliveryTimeCache.get(cacheKey);
if (cached !== undefined) return cached;

const deliveryTimeSummary = {};
const dataLength = data.length;

for (let i = 0; i < dataLength; i++) {
const row = data[i];
const courierCode = row["Courier Code"];
const date = row["Date"];
const deliveryStart = row["Delivery Start"];
const dropOffDone = row["DropOff Done"];

if (!courierCode || !date) continue;

const duration = calculateDeliveryDuration(deliveryStart, dropOffDone);

if (!deliveryTimeSummary[courierCode]) {
deliveryTimeSummary[courierCode] = {};
}
if (!deliveryTimeSummary[courierCode][date]) {
deliveryTimeSummary[courierCode][date] = 0;
}
deliveryTimeSummary[courierCode][date] += duration;
}

deliveryTimeCache.set(cacheKey, deliveryTimeSummary);
return deliveryTimeSummary;
};

export const calculateRoundUpByDateAndCourier = (data) => {
if (!Array.isArray(data) || data.length === 0) return {};

const cacheKey = `roundup_${data.length}_${data[0]?.["Date"] || ''}_${data[data.length - 1]?.["Date"] || ''}`;
const cached = roundUpCache.get(cacheKey);
if (cached !== undefined) return cached;

const roundUpSummary = {};
const dataLength = data.length;

for (let i = 0; i < dataLength; i++) {
const row = data[i];
const courierCode = row["Courier Code"];
const date = row["Date"];
const roundUpValue = parseFloat(row["RoundUp"]) || 0;

if (!courierCode || !date) continue;

if (!roundUpSummary[courierCode]) {
roundUpSummary[courierCode] = {};
}
if (!roundUpSummary[courierCode][date]) {
roundUpSummary[courierCode][date] = 0;
}
roundUpSummary[courierCode][date] += roundUpValue;
}

roundUpCache.set(cacheKey, roundUpSummary);
return roundUpSummary;
};

export const calculateDistanceByDateAndCourier = (data) => {
if (!Array.isArray(data) || data.length === 0) return {};

const cacheKey = `distance_${data.length}_${data[0]?.["Date"] || ''}_${data[data.length - 1]?.["Date"] || ''}`;
const cached = distanceCache.get(cacheKey);
if (cached !== undefined) return cached;

const distanceSummary = {};
const dataLength = data.length;

for (let i = 0; i < dataLength; i++) {
const row = data[i];
const courierCode = row["Courier Code"];
const date = row["Date"];
const distanceValue = parseFloat(row["Distance"]) || 0;

if (!courierCode || !date) continue;

if (!distanceSummary[courierCode]) {
distanceSummary[courierCode] = {};
}
if (!distanceSummary[courierCode][date]) {
distanceSummary[courierCode][date] = 0;
}
distanceSummary[courierCode][date] += distanceValue;
}

distanceCache.set(cacheKey, distanceSummary);
return distanceSummary;
};

export const calculateTotalDistancesByCourier = (data) => {
if (!Array.isArray(data) || data.length === 0) return {};

const distanceTotals = {};
const dataLength = data.length;

for (let i = 0; i < dataLength; i++) {
const row = data[i];
const courierCode = row["Courier Code"];
const courierName = row["Courier Name"];
const distanceValue = parseFloat(row["Distance"]) || 0;

if (courierCode) {
distanceTotals[courierCode] = (distanceTotals[courierCode] || 0) + distanceValue;
}

if (courierName && courierName !== courierCode) {
distanceTotals[courierName] = (distanceTotals[courierName] || 0) + distanceValue;
}
}

return distanceTotals;
};

export const calculateCourierTotalDistances = (courierData) => {
if (!Array.isArray(courierData) || courierData.length === 0) return {};

const totalDistances = {};
const courierLength = courierData.length;

for (let i = 0; i < courierLength; i++) {
const courier = courierData[i];
const courierCode = courier.courierCode;
const courierName = courier.courierName;
const totalDistance = parseFloat(courier.totalDistance) || 0;

if (courierCode) {
totalDistances[courierCode] = totalDistance;
}
if (courierName && courierName !== courierCode) {
totalDistances[courierName] = totalDistance;
}
}

return totalDistances;
};

export const findDriverByCode = (courierCode, drivers) => {
if (!courierCode || !Array.isArray(drivers) || drivers.length === 0) return null;

const cacheKey = courierCode.toLowerCase();
const cached = courierNameCache.get(cacheKey);
if (cached !== undefined) return cached;

const lowerCourierCode = courierCode.toLowerCase();

for (let i = 0; i < drivers.length; i++) {
const driver = drivers[i];
if (driver.username && driver.username.toLowerCase() === lowerCourierCode) {
courierNameCache.set(cacheKey, driver);
return driver;
}
}

courierNameCache.set(cacheKey, null);
return null;
};

export const getCourierNameForDisplay = (courierCode, courierName, drivers) => {
if (courierName && courierName.toString().trim() !== "" && courierName !== courierCode) {
return courierName;
}

if (courierCode && Array.isArray(drivers) && drivers.length > 0) {
const driver = findDriverByCode(courierCode, drivers);
if (driver && driver.fullName) {
return driver.fullName;
}
}

return courierCode || "";
};

export const processDeliveryDataInBatches = (data, drivers = []) => {
if (!Array.isArray(data) || data.length === 0) return [];

const results = [];
const totalBatches = Math.ceil(data.length / BATCH_SIZE);

for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
const startIndex = batchIndex * BATCH_SIZE;
const endIndex = Math.min(startIndex + BATCH_SIZE, data.length);
const batch = data.slice(startIndex, endIndex);

const batchResults = batch.map(courier => {
const uniqueDates = courier.uniqueDates || [];
const averageMetrics = calculateCourierAverageMetrics(courier, uniqueDates);

return {
...courier,
avgCount: calculateAverageByDates(courier.deliveriesByDate || {}, uniqueDates),
avgRoundUp: calculateAverageByDates(courier.roundUpByDate || {}, uniqueDates),
avgDistance: calculateAverageByDates(courier.distanceByDate || {}, uniqueDates),
avgTime: calculateAverageByDates(courier.deliveryTimeByDate || {}, uniqueDates),
avgAllCount: averageMetrics.avgAllCount,
avgAllRoundUp: averageMetrics.avgAllRoundUp,
avgAllDistance: averageMetrics.avgAllDistance,
avgAllTime: averageMetrics.avgAllTime
};
});

results.push(...batchResults);
}

return results;
};

export const processDeliveryData = (data, drivers = []) => {
if (!Array.isArray(data) || data.length === 0) return [];

if (data.length > BATCH_SIZE) {
return processDeliveryDataInBatches(data, drivers);
}

const results = new Array(data.length);
for (let i = 0; i < data.length; i++) {
const courier = data[i];
const uniqueDates = courier.uniqueDates || [];
const averageMetrics = calculateCourierAverageMetrics(courier, uniqueDates);

results[i] = {
...courier,
avgCount: calculateAverageByDates(courier.deliveriesByDate || {}, uniqueDates),
avgRoundUp: calculateAverageByDates(courier.roundUpByDate || {}, uniqueDates),
avgDistance: calculateAverageByDates(courier.distanceByDate || {}, uniqueDates),
avgTime: calculateAverageByDates(courier.deliveryTimeByDate || {}, uniqueDates),
avgAllCount: averageMetrics.avgAllCount,
avgAllRoundUp: averageMetrics.avgAllRoundUp,
avgAllDistance: averageMetrics.avgAllDistance,
avgAllTime: averageMetrics.avgAllTime
};
}

return results;
};

export const validateCourierData = (data) => {
return Array.isArray(data) && data.length > 0 && data.every(item => 
item && typeof item === 'object' && item.courierCode
);
};

export const optimizedProcessCourierPerformanceWithDates = (data, drivers = []) => {
if (!Array.isArray(data) || data.length === 0) return [];

const courierMap = new Map();
const uniqueDatesSet = new Set();
const dataLength = data.length;

for (let i = 0; i < dataLength; i++) {
const row = data[i];
const courierCode = row["Courier Code"];
const date = row["Date"];

if (!courierCode || courierCode === 'Unknown') continue;
if (date) uniqueDatesSet.add(date);

if (!courierMap.has(courierCode)) {
courierMap.set(courierCode, {
rows: [],
courierName: row["Courier Name"],
hub: row["HUB"] || 'Unknown',
totalDeliveries: 0,
lateDeliveries: 0,
deliveriesByDate: {},
roundUpByDate: {},
distanceByDate: {},
deliveryTimeByDate: {},
totalRoundUp: 0,
totalDistance: 0,
totalDeliveryTime: 0
});
}

const courierData = courierMap.get(courierCode);
courierData.rows.push(row);
courierData.totalDeliveries++;

if (row["Delivery Status"]?.toString().trim() === DELIVERY_STATUS.LATE) {
courierData.lateDeliveries++;
}

if (date) {
courierData.deliveriesByDate[date] = (courierData.deliveriesByDate[date] || 0) + 1;

const roundUpValue = parseFloat(row["RoundUp"]) || 0;
const distanceValue = parseFloat(row["Distance"]) || 0;
const deliveryDuration = calculateDeliveryDuration(row["Delivery Start"], row["DropOff Done"]);

courierData.roundUpByDate[date] = (courierData.roundUpByDate[date] || 0) + roundUpValue;
courierData.distanceByDate[date] = (courierData.distanceByDate[date] || 0) + distanceValue;
courierData.deliveryTimeByDate[date] = (courierData.deliveryTimeByDate[date] || 0) + deliveryDuration;

courierData.totalRoundUp += roundUpValue;
courierData.totalDistance += distanceValue;
courierData.totalDeliveryTime += deliveryDuration;
}
}

const uniqueDates = sortDates(Array.from(uniqueDatesSet));
const result = [];

for (const [courierCode, courierData] of courierMap) {
const onTimeDeliveries = courierData.totalDeliveries - courierData.lateDeliveries;
const onTimePercentage = courierData.totalDeliveries > 0 ? 
((onTimeDeliveries / courierData.totalDeliveries) * 100) : 0;

let performanceRating = 'Needs Improvement';
if (onTimePercentage >= 99) performanceRating = 'Excellent';
else if (onTimePercentage >= 95) performanceRating = 'Good';
else if (onTimePercentage >= 90) performanceRating = 'Average';

const courierName = getCourierNameForDisplay(courierCode, courierData.courierName, drivers);

const avgCount = calculateAverageByDates(courierData.deliveriesByDate, uniqueDates);
const avgRoundUp = calculateAverageByDates(courierData.roundUpByDate, uniqueDates);
const avgDistance = calculateAverageByDates(courierData.distanceByDate, uniqueDates);
const avgTime = calculateAverageByDates(courierData.deliveryTimeByDate, uniqueDates);

const courierObject = {
courierCode,
courierName,
hub: courierData.hub,
totalDeliveries: courierData.totalDeliveries,
onTimeDeliveries,
lateDeliveries: courierData.lateDeliveries,
deliveriesByDate: courierData.deliveriesByDate,
roundUpByDate: courierData.roundUpByDate,
distanceByDate: courierData.distanceByDate,
deliveryTimeByDate: courierData.deliveryTimeByDate,
uniqueDates
};

const avgAllMetrics = calculateCourierAverageMetrics(courierObject, uniqueDates);

result.push({
courierCode,
courierName,
hub: courierData.hub,
totalDeliveries: courierData.totalDeliveries,
onTimeDeliveries,
lateDeliveries: courierData.lateDeliveries,
onTimePercentage: parseFloat(onTimePercentage.toFixed(2)),
latePercentage: parseFloat(((courierData.lateDeliveries / courierData.totalDeliveries) * 100).toFixed(2)),
performanceRating,
deliveriesByDate: courierData.deliveriesByDate,
roundUpByDate: courierData.roundUpByDate,
distanceByDate: courierData.distanceByDate,
deliveryTimeByDate: courierData.deliveryTimeByDate,
totalRoundUp: courierData.totalRoundUp,
totalDistance: courierData.totalDistance,
totalDeliveryTime: courierData.totalDeliveryTime,
avgCount,
avgRoundUp,
avgDistance,
avgTime,
avgAllCount: avgAllMetrics.avgAllCount,
avgAllRoundUp: avgAllMetrics.avgAllRoundUp,
avgAllDistance: avgAllMetrics.avgAllDistance,
avgAllTime: avgAllMetrics.avgAllTime,
uniqueDates
});
}

return result.sort((a, b) => b.onTimePercentage - a.onTimePercentage);
};

export const processCourierPerformanceWithDates = optimizedProcessCourierPerformanceWithDates;

export const calculateCourierTotals = (data, uniqueDates = [], drivers = []) => {
if (!Array.isArray(data) || data.length === 0) {
const { dateDeliveries, dateRoundUps, dateDistances, dateDeliveryTimes } = initializeDateTotals(uniqueDates);

return {
totalDeliveries: 0,
onTimeDeliveries: 0,
lateDeliveries: 0,
averageOnTimePercentage: 0,
averageLatePercentage: 0,
avgCount: 0,
avgRoundUp: 0,
avgDistance: 0,
avgTime: 0,
avgAllCount: 0,
avgAllRoundUp: 0,
avgAllDistance: 0,
avgAllTime: 0,
totalRoundUp: 0,
totalDistance: 0,
totalDeliveryTime: 0,
dateDeliveries,
dateRoundUps,
dateDistances,
dateDeliveryTimes
};
}

const processedData = processDeliveryData(data, drivers);
const { dateDeliveries, dateRoundUps, dateDistances, dateDeliveryTimes } = initializeDateTotals(uniqueDates);

const totals = processedData.reduce((acc, item) => {
acc.totalDeliveries += item.totalDeliveries || 0;
acc.onTimeDeliveries += item.onTimeDeliveries || 0;
acc.lateDeliveries += item.lateDeliveries || 0;
acc.onTimePercentageSum += item.onTimePercentage || 0;
acc.latePercentageSum += item.latePercentage || 0;
acc.avgCountSum += item.avgCount || 0;
acc.avgRoundUpSum += item.avgRoundUp || 0;
acc.avgDistanceSum += item.avgDistance || 0;
acc.avgTimeSum += item.avgTime || 0;
acc.avgAllCountSum += item.avgAllCount || 0;
acc.avgAllRoundUpSum += item.avgAllRoundUp || 0;
acc.avgAllDistanceSum += item.avgAllDistance || 0;
acc.avgAllTimeSum += item.avgAllTime || 0;
acc.totalRoundUp += item.totalRoundUp || 0;
acc.totalDistance += item.totalDistance || 0;
acc.totalDeliveryTime += item.totalDeliveryTime || 0;

processDateData(item, acc);

return acc;
}, {
totalDeliveries: 0,
onTimeDeliveries: 0,
lateDeliveries: 0,
onTimePercentageSum: 0,
latePercentageSum: 0,
avgCountSum: 0,
avgRoundUpSum: 0,
avgDistanceSum: 0,
avgTimeSum: 0,
avgAllCountSum: 0,
avgAllRoundUpSum: 0,
avgAllDistanceSum: 0,
avgAllTimeSum: 0,
totalRoundUp: 0,
totalDistance: 0,
totalDeliveryTime: 0,
dateDeliveries,
dateRoundUps,
dateDistances,
dateDeliveryTimes
});

for (const date of uniqueDates) {
totals.dateDeliveries[date] = totals.dateDeliveries[date] || 0;
totals.dateRoundUps[date] = totals.dateRoundUps[date] || 0;
totals.dateDistances[date] = totals.dateDistances[date] || 0;
totals.dateDeliveryTimes[date] = totals.dateDeliveryTimes[date] || 0;
}

return calculateTotalAverages(totals, processedData.length);
};

export const clearProcessingCaches = () => {
processCache.clear();
courierNameCache.clear();
deliveryTimeCache.clear();
roundUpCache.clear();
distanceCache.clear();
};

export const getProcessingCacheStats = () => {
return {
processCache: processCache.size(),
courierNameCache: courierNameCache.size(),
deliveryTimeCache: deliveryTimeCache.size(),
roundUpCache: roundUpCache.size(),
distanceCache: distanceCache.size()
};
};