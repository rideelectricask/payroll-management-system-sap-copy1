import { 
COURIER_TABLE_HEAD,
PERFORMANCE_COLORS,
INFO_TEXTS
} from './constants.js';

import { 
getDynamicCourierTableHead,
sortDates
} from './dateUtilss.js';

import { 
formatPercentage,
formatDurationToHMS,
calculateDeliveryDuration,
calculateAverageByDates,
calculateOverallAverageMetrics,
calculateAverageValues,
getUniqueHubCount
} from './calculationUtilss.js';

import {
calculateDeliveryTimeByDateAndCourier,
calculateRoundUpByDateAndCourier,
calculateDistanceByDateAndCourier,
calculateTotalDistancesByCourier,
calculateCourierTotalDistances,
findDriverByCode,
getCourierNameForDisplay,
processDeliveryData,
validateCourierData,
processCourierPerformanceWithDates,
calculateCourierTotals
} from './dataProcessing.js';

import {
getPerformanceStyle,
getPerformanceIcon,
getPerformanceRating
} from './performanceUtils.js';

import { sortCourierData } from '../helpers/sortingUtils.js';
// import { calculateCourierTotals } from './totalsUtils.js';

class PerformanceAnalyzer {
constructor() {
this.scoreCache = new Map();
this.insightCache = new Map();
this.benchmarkCache = new Map();
this.maxCacheSize = 50000;
this.cacheHitRate = 0;
this.totalRequests = 0;
}

clearCache() {
this.scoreCache.clear();
this.insightCache.clear();
this.benchmarkCache.clear();
this.cacheHitRate = 0;
this.totalRequests = 0;
}

calculateBenchmarks(courierData) {
const cacheKey = `benchmarks_${courierData.length}`;

if (this.benchmarkCache.has(cacheKey)) {
this.totalRequests++;
this.cacheHitRate = (this.cacheHitRate * (this.totalRequests - 1) + 1) / this.totalRequests;
return this.benchmarkCache.get(cacheKey);
}

const metrics = {
onTimePercentages: [],
deliveryCounts: [],
profitMargins: [],
efficiencyScores: []
};

for (let i = 0; i < courierData.length; i++) {
const courier = courierData[i];
if (!courier) continue;

metrics.onTimePercentages.push(courier.onTimePercentage || 0);
metrics.deliveryCounts.push(courier.totalDeliveries || 0);

const profit = courier.profit || 0;
const cost = courier.costPlusAddCost1 || 0;
const margin = cost > 0 ? (profit - cost) / cost : 0;
metrics.profitMargins.push(margin);

const efficiency = this.calculateEfficiencyScore(courier);
metrics.efficiencyScores.push(efficiency);
}

const calculatePercentiles = (arr) => {
if (!arr || arr.length === 0) return this.getDefaultPercentiles();

const sorted = [...arr].filter(val => val != null).sort((a, b) => a - b);
const len = sorted.length;

if (len === 0) return this.getDefaultPercentiles();

return {
p25: sorted[Math.floor(len * 0.25)] || 0,
p50: sorted[Math.floor(len * 0.5)] || 0,
p75: sorted[Math.floor(len * 0.75)] || 0,
p90: sorted[Math.floor(len * 0.9)] || 0,
p95: sorted[Math.floor(len * 0.95)] || 0,
mean: sorted.reduce((sum, val) => sum + (val || 0), 0) / len,
std: this.calculateStandardDeviation(sorted),
min: sorted[0] || 0,
max: sorted[len - 1] || 0
};
};

const benchmarks = {
onTime: calculatePercentiles(metrics.onTimePercentages),
delivery: calculatePercentiles(metrics.deliveryCounts),
profit: calculatePercentiles(metrics.profitMargins),
efficiency: calculatePercentiles(metrics.efficiencyScores)
};

this.manageCacheSize(this.benchmarkCache);
this.benchmarkCache.set(cacheKey, benchmarks);
this.totalRequests++;
return benchmarks;
}

calculateEfficiencyScore(courier) {
if (!courier) return 0;

const onTimeRate = Math.min(Math.max((courier.onTimePercentage || 0) / 100, 0), 1);
const deliveryVolume = Math.min(Math.max((courier.totalDeliveries || 0) / 200, 0), 1);
const avgTime = courier.avgTime || 0;
const timeEfficiency = avgTime > 0 ? Math.min(Math.max(8 / avgTime, 0), 1) : 0;
const distanceEfficiency = courier.avgDistance > 0 ? Math.min(Math.max(10 / courier.avgDistance, 0), 1) : 0;

return (onTimeRate * 0.4) + (deliveryVolume * 0.3) + (timeEfficiency * 0.2) + (distanceEfficiency * 0.1);
}

calculateCourierScore(courierData, financialData) {
const cacheKey = `${courierData?.courierCode}_${courierData?.onTimePercentage}_${courierData?.totalDeliveries}_${financialData?.profit}_${financialData?.costPlusAddCost1}`;

if (this.scoreCache.has(cacheKey)) {
return this.scoreCache.get(cacheKey);
}

if (!courierData || !financialData) {
this.scoreCache.set(cacheKey, 0);
return 0;
}

const onTimePercentage = courierData.onTimePercentage || 0;
const totalDeliveries = courierData.totalDeliveries || 0;
const profit = financialData.profit || 0;
const cost = financialData.costPlusAddCost1 || 0;
const netProfit = profit - cost;

const weights = {
onTime: 0.35,
delivery: 0.25,
profit: 0.25,
efficiency: 0.15
};

const normalizedOnTime = Math.min(Math.max(onTimePercentage, 0), 100) / 100;
const normalizedDeliveries = Math.min(Math.max(totalDeliveries, 0), 200) / 200;

let normalizedProfit = 0;
if (netProfit > 0) {
normalizedProfit = Math.min(netProfit / 5000000, 1);
} else if (netProfit < 0) {
normalizedProfit = Math.max(netProfit / -1000000, -1);
}

const efficiencyScore = this.calculateEfficiencyScore(courierData);

const score = Math.max(0, Math.min(1,
(normalizedOnTime * weights.onTime) + 
(normalizedDeliveries * weights.delivery) + 
(normalizedProfit * weights.profit) +
(efficiencyScore * weights.efficiency)
));

this.manageCacheSize(this.scoreCache);
this.scoreCache.set(cacheKey, score);
return score;
}

generateAdvancedInsights(rank, totalCouriers, courierData, financialData, benchmarks) {
const cacheKey = `insights_${rank}_${totalCouriers}_${courierData?.courierCode}`;

if (this.insightCache.has(cacheKey)) {
return this.insightCache.get(cacheKey);
}

if (!courierData || !financialData || !benchmarks) {
const fallback = "Data tidak lengkap untuk analisis mendalam";
this.insightCache.set(cacheKey, fallback);
return fallback;
}

const onTimePercentage = courierData.onTimePercentage || 0;
const totalDeliveries = courierData.totalDeliveries || 0;
const profit = financialData.profit || 0;
const cost = financialData.costPlusAddCost1 || 0;
const netProfit = profit - cost;

const percentile = ((totalCouriers - rank + 1) / totalCouriers) * 100;

const insights = {
category: this.getPerformanceCategory(percentile),
strengths: [],
weaknesses: [],
recommendations: []
};

this.analyzeStrengths(insights, courierData, financialData, benchmarks);
this.analyzeWeaknesses(insights, courierData, financialData, benchmarks);
this.generateRecommendations(insights, courierData, financialData, benchmarks);

const result = this.formatInsightReport(insights, rank, totalCouriers);

this.manageCacheSize(this.insightCache);
this.insightCache.set(cacheKey, result);
return result;
}

getPerformanceCategory(percentile) {
if (percentile >= 95) return "Elite Performer";
if (percentile >= 90) return "Top Performer";
if (percentile >= 75) return "High Performer";
if (percentile >= 50) return "Above Average";
if (percentile >= 25) return "Average Performer";
return "Needs Improvement";
}

analyzeStrengths(insights, courierData, financialData, benchmarks) {
const onTimePercentage = courierData.onTimePercentage || 0;
const totalDeliveries = courierData.totalDeliveries || 0;
const profit = financialData.profit || 0;
const cost = financialData.costPlusAddCost1 || 0;
const netProfit = profit - cost;

if (onTimePercentage >= benchmarks.onTime.p75) {
insights.strengths.push("Ketepatan waktu sangat baik");
}

if (totalDeliveries >= benchmarks.delivery.p75) {
insights.strengths.push("Volume pengiriman tinggi");
}

if (netProfit > benchmarks.profit.mean) {
insights.strengths.push("Profitabilitas di atas rata-rata");
}

if (insights.strengths.length === 0) {
insights.strengths.push("Memiliki potensi untuk berkembang");
}
}

analyzeWeaknesses(insights, courierData, financialData, benchmarks) {
const onTimePercentage = courierData.onTimePercentage || 0;
const totalDeliveries = courierData.totalDeliveries || 0;
const profit = financialData.profit || 0;
const cost = financialData.costPlusAddCost1 || 0;
const netProfit = profit - cost;

if (onTimePercentage < benchmarks.onTime.p25) {
insights.weaknesses.push("Ketepatan waktu perlu peningkatan");
}

if (totalDeliveries < benchmarks.delivery.p25) {
insights.weaknesses.push("Volume pengiriman rendah");
}

if (netProfit < 0) {
insights.weaknesses.push("Margin keuntungan negatif");
}
}

generateRecommendations(insights, courierData, financialData, benchmarks) {
if (insights.weaknesses.includes("Ketepatan waktu perlu peningkatan")) {
insights.recommendations.push("Fokus pada peningkatan manajemen waktu dan perencanaan rute");
}

if (insights.weaknesses.includes("Volume pengiriman rendah")) {
insights.recommendations.push("Optimasi kapasitas pengiriman dan penjadwalan");
}

if (insights.weaknesses.includes("Margin keuntungan negatif")) {
insights.recommendations.push("Review struktur biaya dan pricing strategy");
}

if (insights.recommendations.length === 0) {
insights.recommendations.push("Maintain performa saat ini dan eksplorasi peluang growth");
}
}

formatInsightReport(insights, rank, totalCouriers) {
const { category, strengths, weaknesses, recommendations } = insights;

let report = `${category} (Rank ${rank}/${totalCouriers}): `;

if (strengths.length > 0) {
report += `KEKUATAN: ${strengths.join(", ")}. `;
}

if (weaknesses.length > 0) {
report += `AREA PERBAIKAN: ${weaknesses.join(", ")}. `;
}

if (recommendations.length > 0) {
report += `REKOMENDASI: ${recommendations.slice(0, 2).join(", ")}`;
}

return report;
}

getDefaultPercentiles() {
return {
p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, mean: 0, std: 0, min: 0, max: 0
};
}

manageCacheSize(cache) {
if (cache.size >= this.maxCacheSize) {
const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(this.maxCacheSize * 0.1));
keysToDelete.forEach(key => cache.delete(key));
}
}

calculateStandardDeviation(values) {
if (!values || values.length === 0) return 0;

const mean = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
const variance = values.reduce((sum, val) => sum + Math.pow((val || 0) - mean, 2), 0) / values.length;
return Math.sqrt(variance);
}
}

const performanceAnalyzer = new PerformanceAnalyzer();

export const logTableData = (courierData, uniqueDates, courierFinancialData, courierDistanceTotals, topPerformerRanks, totalCouriers, performanceReport) => {
if (!courierData || !Array.isArray(courierData)) {
console.log("❌ Invalid courier data provided");
return;
}

console.log("🔍 COMPLETE COURIER TABLE DATA - DISPLAY VALUES");
console.log("📊 Total Couriers:", courierData.length);
console.log("📅 Unique Dates:", uniqueDates);
console.log("🏆 Has Top Performer Ranks:", topPerformerRanks ? "Yes" : "No");
console.log("📈 Has Performance Report:", performanceReport ? "Yes" : "No");
console.log("💰 Has Financial Data:", courierFinancialData ? "Yes" : "No");
console.log("📏 Has Distance Totals:", courierDistanceTotals ? "Yes" : "No");
console.log("=".repeat(120));

courierData.forEach((courier, index) => {
if (!courier || !courier.courierCode) {
console.log(`❌ Invalid courier at index ${index}`);
return;
}

const courierCode = courier.courierCode;
const financialData = courierFinancialData[courierCode] || {};
const distanceTotal = courierDistanceTotals[courierCode] || 0;
const topPerformerRank = topPerformerRanks?.get(courierCode) || null;
const performanceData = performanceReport?.get(courierCode) || null;

const calculatedData = {
hub: courier.hub || "N/A",
courierCode: courierCode,
courierName: courier.courierName || "N/A",
totalDeliveries: courier.totalDeliveries || 0,
onTimeDeliveries: courier.onTimeDeliveries || 0,
lateDeliveries: courier.lateDeliveries || 0,
onTimePercentage: courier.onTimePercentage || 0,
latePercentage: courier.latePercentage || 0,
deliveryRatio: courier.totalDeliveries && courier.lateDeliveries ? 
((courier.totalDeliveries / (courier.totalDeliveries + courier.lateDeliveries)) * 100) : 0,
distanceTotal: distanceTotal,
cost: financialData.costPlusAddCost1 || 0,
profit: financialData.profit || 0,
netProfit: (financialData.profit || 0) - (financialData.costPlusAddCost1 || 0),
performanceRating: courier.performanceRating || "N/A",
performanceStyle: getPerformanceStyle(courier.onTimePercentage || 0),
performanceIcon: getPerformanceIcon(courier.onTimePercentage || 0),
totalDeliveryTime: courier.totalDeliveryTime || 0,
totalDistance: courier.totalDistance || 0,
totalRoundUp: courier.totalRoundUp || 0,
avgAllCount: courier.avgAllCount || 0,
avgAllRoundUp: courier.avgAllRoundUp || 0,
avgAllDistance: courier.avgAllDistance || 0,
avgAllTime: courier.avgAllTime || 0,
deliveriesByDate: courier.deliveriesByDate || {},
roundUpByDate: courier.roundUpByDate || {},
distanceByDate: courier.distanceByDate || {},
deliveryTimeByDate: courier.deliveryTimeByDate || {}
};

if (topPerformerRank && totalCouriers && performanceData) {
const percentile = ((totalCouriers - topPerformerRank + 1) / totalCouriers) * 100;
const indicator = getPerformanceIndicator(topPerformerRank, totalCouriers);

calculatedData.topPerformerData = {
rank: topPerformerRank,
totalCouriers: totalCouriers,
percentile: percentile,
indicator: indicator,
score: performanceData.score || 0,
reason: performanceData.reason || "N/A"
};
}

console.log(`📊 COURIER #${index + 1} - Complete Data Object:`, calculatedData);

console.log(`📅 Detailed Deliveries By Date:`);
uniqueDates.forEach(date => {
const deliveries = courier.deliveriesByDate?.[date] || 0;
const roundUp = courier.roundUpByDate?.[date] || 0;
const distance = courier.distanceByDate?.[date] || 0;
const deliveryTime = courier.deliveryTimeByDate?.[date] || 0;

console.log(`   ${date}: {
   deliveries: ${deliveries},
   roundUp: ${roundUp},
   distance: ${distance},
   deliveryTime: ${deliveryTime},
   roundUpFormatted: ${formatPercentage(roundUp)},
   distanceFormatted: ${formatPercentage(distance)},
   deliveryTimeFormatted: ${formatDurationToHMS(deliveryTime)}
}`);
});

console.log(`📈 Formatted Average Metrics:`);
console.log(`   avgAllCount: ${formatPercentage(courier.avgAllCount || 0)}`);
console.log(`   avgAllRoundUp: ${formatPercentage(courier.avgAllRoundUp || 0)}`);
console.log(`   avgAllDistance: ${formatPercentage(courier.avgAllDistance || 0)}`);
console.log(`   avgAllTime: ${formatDurationToHMS(courier.avgAllTime || 0)}`);

console.log("-".repeat(120));
});

console.log("✅ COURIER TABLE DATA LOGGING COMPLETED");
console.log("=".repeat(120));
};

export const getTopPerformerRanks = (courierData, courierFinancialData) => {
if (!courierData || !Array.isArray(courierData) || !courierFinancialData) {
return new Map();
}

const courierScores = [];

for (let i = 0; i < courierData.length; i++) {
const courier = courierData[i];
if (!courier || !courier.courierCode) continue;

const financialData = courierFinancialData[courier.courierCode] || {};
const score = performanceAnalyzer.calculateCourierScore(courier, financialData);

courierScores.push({
courierCode: courier.courierCode,
score: score,
courierData: courier,
financialData: financialData
});
}

courierScores.sort((a, b) => b.score - a.score);

const ranksMap = new Map();
for (let i = 0; i < courierScores.length; i++) {
ranksMap.set(courierScores[i].courierCode, i + 1);
}

return ranksMap;
};

export const generatePerformanceReport = (courierData, courierFinancialData) => {
if (!courierData || !Array.isArray(courierData) || !courierFinancialData) {
return new Map();
}

const benchmarks = performanceAnalyzer.calculateBenchmarks(courierData);
const courierScores = [];

for (let i = 0; i < courierData.length; i++) {
const courier = courierData[i];
if (!courier || !courier.courierCode) continue;

const financialData = courierFinancialData[courier.courierCode] || {};
const score = performanceAnalyzer.calculateCourierScore(courier, financialData);

courierScores.push({
courierCode: courier.courierCode,
score: score,
courierData: courier,
financialData: financialData
});
}

courierScores.sort((a, b) => b.score - a.score);

const reportMap = new Map();
for (let i = 0; i < courierScores.length; i++) {
const courier = courierScores[i];
const rank = i + 1;
const reason = performanceAnalyzer.generateAdvancedInsights(
rank, 
courierData.length, 
courier.courierData, 
courier.financialData, 
benchmarks
);

reportMap.set(courier.courierCode, {
rank: rank,
score: courier.score,
reason: reason,
benchmarks: benchmarks
});
}

return reportMap;
};

export const getPerformanceIndicator = (rank, totalCouriers) => {
if (!rank || !totalCouriers || rank <= 0 || totalCouriers <= 0) return null;

const percentile = ((totalCouriers - rank + 1) / totalCouriers) * 100;

if (percentile >= 95) {
return {
icon: "🏆",
badge: "ELITE",
color: "bg-yellow-100 text-yellow-800 border-yellow-300",
description: "Top 5% Elite Performer"
};
} else if (percentile >= 90) {
return {
icon: "🥇",
badge: "GOLD",
color: "bg-amber-100 text-amber-800 border-amber-300",
description: "Top 10% Gold Performer"
};
} else if (percentile >= 75) {
return {
icon: "🥈",
badge: "SILVER",
color: "bg-gray-100 text-gray-800 border-gray-300",
description: "Top 25% Silver Performer"
};
} else if (percentile >= 50) {
return {
icon: "🥉",
badge: "BRONZE",
color: "bg-orange-100 text-orange-800 border-orange-300",
description: "Above Average Performer"
};
} else if (percentile >= 25) {
return {
icon: "📊",
badge: "STANDARD",
color: "bg-blue-100 text-blue-800 border-blue-300",
description: "Average Performer"
};
} else {
return {
icon: "📈",
badge: "GROWTH",
color: "bg-green-100 text-green-800 border-green-300",
description: "Growth Potential"
};
}
};

export const clearPerformanceCache = () => {
performanceAnalyzer.clearCache();
};

export const getPerformanceCacheStats = () => {
return {
scoreCache: performanceAnalyzer.scoreCache.size,
insightCache: performanceAnalyzer.insightCache.size,
benchmarkCache: performanceAnalyzer.benchmarkCache.size,
cacheHitRate: performanceAnalyzer.cacheHitRate,
totalRequests: performanceAnalyzer.totalRequests
};
};

export {
COURIER_TABLE_HEAD,
PERFORMANCE_COLORS,
INFO_TEXTS,
getDynamicCourierTableHead,
getPerformanceStyle,
getPerformanceIcon,
getPerformanceRating,
formatPercentage,
formatDurationToHMS,
calculateDeliveryDuration,
calculateAverageByDates,
calculateOverallAverageMetrics,
calculateDeliveryTimeByDateAndCourier,
calculateRoundUpByDateAndCourier,
calculateDistanceByDateAndCourier,
calculateTotalDistancesByCourier,
calculateCourierTotalDistances,
calculateAverageValues,
getUniqueHubCount,
findDriverByCode,
getCourierNameForDisplay,
processDeliveryData,
validateCourierData,
processCourierPerformanceWithDates,
sortCourierData,
calculateCourierTotals
};