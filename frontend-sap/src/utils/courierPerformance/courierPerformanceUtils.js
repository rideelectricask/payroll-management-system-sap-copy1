import { useState, useMemo, useCallback } from 'react';
import _ from 'lodash';

export const COURIER_TABLE_HEAD = [
  "On Time %",
  "Late %", 
  "Delivery Ratio",
  "Distance Total",
  "Cost",
  "Profit",
  "Net Profit",
  "Performance Rank"
];

export const PERFORMANCE_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800', 
  average: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export const INFO_TEXTS = {
  onTimePercentage: "Persentase pengiriman tepat waktu",
  latePercentage: "Persentase pengiriman terlambat",
  deliveryRatio: "Rasio keberhasilan pengiriman",
  distanceTotal: "Total jarak tempuh kurir",
  cost: "Total biaya operasional",
  profit: "Total keuntungan",
  netProfit: "Keuntungan bersih setelah dikurangi biaya"
};

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
  calculateCourierAverageMetrics,
  calculateAverageValues,
  getUniqueHubCount,
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
  clearProcessingCaches,
  calculateCourierTotals
} from './dataProcessing.js';

import {
  getPerformanceStyle,
  getPerformanceIcon,
  getPerformanceRating
} from './performanceUtils.js';

import { sortCourierData } from '../helpers/sortingUtils.js';

const loggedCouriers = new Set();

export const clearCalculationCaches = () => {
  if (typeof clearProcessingCaches === 'function') {
    clearProcessingCaches();
  }
  loggedCouriers.clear();
};

const calculateDeliveryRatio = (totalDeliveries, lateDeliveries) => {
  const total = (totalDeliveries || 0) + (lateDeliveries || 0);
  return total === 0 ? 0 : (totalDeliveries || 0) / total;
};

const calculateNetProfit = (profit, cost) => (profit || 0) - (cost || 0);

const getNetProfitStyle = (netProfit) => {
  if (netProfit > 0) return 'text-green-700 bg-green-50';
  if (netProfit < 0) return 'text-red-700 bg-red-50';
  return 'text-gray-700 bg-gray-50';
};

const calculateInternalCourierAverageMetrics = (row, uniqueDates) => {
  if (!row || !uniqueDates || uniqueDates.length === 0) {
    return {
      avgAllCount: 0,
      avgAllRoundUp: 0,
      avgAllDistance: 0,
      avgAllTime: 0,
      avgCount: 0,
      avgRoundUp: 0,
      avgDistance: 0,
      avgTime: 0
    };
  }

  const totalDays = uniqueDates.length;
  const deliveriesByDate = row.deliveriesByDate || {};
  const roundUpByDate = row.roundUpByDate || {};
  const distanceByDate = row.distanceByDate || {};
  const deliveryTimeByDate = row.deliveryTimeByDate || {};

  const totalCount = Object.values(deliveriesByDate).reduce((sum, val) => sum + (val || 0), 0);
  const totalRoundUp = Object.values(roundUpByDate).reduce((sum, val) => sum + (val || 0), 0);
  const totalDistance = Object.values(distanceByDate).reduce((sum, val) => sum + (val || 0), 0);
  const totalTime = Object.values(deliveryTimeByDate).reduce((sum, val) => sum + (val || 0), 0);

  const activeDaysCount = Object.keys(deliveriesByDate).filter(date => deliveriesByDate[date] > 0).length;
  const activeDaysRoundUp = Object.keys(roundUpByDate).filter(date => roundUpByDate[date] > 0).length;
  const activeDaysDistance = Object.keys(distanceByDate).filter(date => distanceByDate[date] > 0).length;
  const activeDaysTime = Object.keys(deliveryTimeByDate).filter(date => deliveryTimeByDate[date] > 0).length;

  const avgAllCount = totalDays > 0 ? totalCount / totalDays : 0;
  const avgAllRoundUp = totalDays > 0 ? totalRoundUp / totalDays : 0;
  const avgAllDistance = totalDays > 0 ? totalDistance / totalDays : 0;
  const avgAllTime = totalDays > 0 ? totalTime / totalDays : 0;

  const avgCount = activeDaysCount > 0 ? totalCount / activeDaysCount : 0;
  const avgRoundUp = activeDaysRoundUp > 0 ? totalRoundUp / activeDaysRoundUp : 0;
  const avgDistance = activeDaysDistance > 0 ? totalDistance / activeDaysDistance : 0;
  const avgTime = activeDaysTime > 0 ? totalTime / activeDaysTime : 0;

  return {
    avgAllCount,
    avgAllRoundUp,
    avgAllDistance,
    avgAllTime,
    avgCount,
    avgRoundUp,
    avgDistance,
    avgTime
  };
};

const getTopPerformerIndicatorData = (courierCode, topPerformerRanks, totalCouriers, performanceReport) => {
  if (!topPerformerRanks || !courierCode || !totalCouriers) return null;

  const rank = topPerformerRanks.get(courierCode);
  if (!rank) return null;

  const reportData = performanceReport?.get(courierCode);
  const reason = reportData?.reason || "Tidak ada data";
  const score = reportData?.score || 0;
  const benchmarks = reportData?.benchmarks || {};

  const percentile = ((totalCouriers - rank + 1) / totalCouriers) * 100;
  let indicator = null;

  if (percentile >= 95) {
    indicator = {
      icon: "🏆",
      badge: "ELITE",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      description: "Top 5% Elite Performer"
    };
  } else if (percentile >= 90) {
    indicator = {
      icon: "🥇",
      badge: "GOLD",
      color: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Top 10% Gold Performer"
    };
  } else if (percentile >= 75) {
    indicator = {
      icon: "🥈",
      badge: "SILVER",
      color: "bg-gray-100 text-gray-800 border-gray-300",
      description: "Top 25% Silver Performer"
    };
  } else if (percentile >= 50) {
    indicator = {
      icon: "🥉",
      badge: "BRONZE",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      description: "Above Average Performer"
    };
  } else if (percentile >= 25) {
    indicator = {
      icon: "📊",
      badge: "STANDARD",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      description: "Average Performer"
    };
  } else {
    indicator = {
      icon: "📈",
      badge: "GROWTH",
      color: "bg-green-100 text-green-800 border-green-300",
      description: "Growth Potential"
    };
  }

  return {
    rank,
    percentile,
    indicator,
    reason,
    score,
    benchmarks
  };
};

export const processUniqueDates = (memoizedData) => {
  if (!memoizedData.length) return [];

  const dates = new Set();
  memoizedData.forEach(row => {
    if (row.Date) {
      dates.add(row.Date);
    }
  });

  return Array.from(dates).sort((a, b) => {
    const parseDate = (dateStr) => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month - 1, day);
      }
      return new Date(dateStr);
    };
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA.getTime() - dateB.getTime();
  });
};

export const calculateCourierFinancialData = (groupedData) => {
  if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) {
    return {};
  }

  const financialData = {};
  const groupedByCourier = _.groupBy(groupedData, row => row["Courier Code"]);

  Object.entries(groupedByCourier).forEach(([courierCode, courierRecords]) => {
    if (!courierCode || courierCode === 'undefined') return;

    const aggregatedData = courierRecords.reduce((acc, row) => {
      acc.cost += (row["Cost"] || 0);
      acc.addCost1 += (row["Add Cost 1"] || 0);
      acc.addCost2 += (row["Add Cost 2"] || 0);
      acc.addCharge1 += (row["Add Charge 1"] || 0);
      acc.addCharge2 += (row["Add Charge 2"] || 0);
      acc.sellingPrice += (row["Selling Price"] || 0);
      acc.profit += (row["Profit"] || 0);
      return acc;
    }, {
      cost: 0,
      addCost1: 0,
      addCost2: 0,
      addCharge1: 0,
      addCharge2: 0,
      sellingPrice: 0,
      profit: 0
    });

    const costPlusAddCost1 = aggregatedData.cost + aggregatedData.addCost1;

    financialData[courierCode] = {
      courierCode,
      costPlusAddCost1,
      profit: aggregatedData.profit,
      cost: aggregatedData.cost,
      addCost1: aggregatedData.addCost1,
      addCost2: aggregatedData.addCost2,
      addCharge1: aggregatedData.addCharge1,
      addCharge2: aggregatedData.addCharge2,
      sellingPrice: aggregatedData.sellingPrice
    };
  });

  return financialData;
};

export const calculateCourierMetricsAndCounts = (memoizedData, getCourierNameForDisplay) => {
  if (!memoizedData.length) return { deliveryCounts: {}, totalDistances: {} };

  const courierDeliveries = {};
  const totalDistances = {};

  memoizedData.forEach(row => {
    const courierCode = row["Courier Code"];
    const courierName = getCourierNameForDisplay(row) || row["Courier Name"];
    const date = row["Date"];
    const roundUpValue = parseFloat(row["RoundUp"]) || 0;
    const distanceValue = parseFloat(row["Distance"]) || 0;

    if (!courierCode) return;

    if (!courierDeliveries[courierCode]) {
      courierDeliveries[courierCode] = {
        courierName: courierName,
        deliveriesByDate: {},
        roundUpByDate: {},
        distanceByDate: {},
        deliveryTimeByDate: {}
      };
    }

    if (!totalDistances[courierCode]) {
      totalDistances[courierCode] = {
        courierCode,
        courierName,
        totalDistance: 0,
        deliveryCount: 0
      };
    }

    if (date) {
      if (!courierDeliveries[courierCode].deliveriesByDate[date]) {
        courierDeliveries[courierCode].deliveriesByDate[date] = 0;
      }
      if (!courierDeliveries[courierCode].roundUpByDate[date]) {
        courierDeliveries[courierCode].roundUpByDate[date] = 0;
      }
      if (!courierDeliveries[courierCode].distanceByDate[date]) {
        courierDeliveries[courierCode].distanceByDate[date] = 0;
      }
      if (!courierDeliveries[courierCode].deliveryTimeByDate[date]) {
        courierDeliveries[courierCode].deliveryTimeByDate[date] = 0;
      }

      courierDeliveries[courierCode].deliveriesByDate[date]++;
      courierDeliveries[courierCode].roundUpByDate[date] += roundUpValue;
      courierDeliveries[courierCode].distanceByDate[date] += distanceValue;
    }

    totalDistances[courierCode].totalDistance += distanceValue;
    totalDistances[courierCode].deliveryCount++;
  });

  return {
    deliveryCounts: courierDeliveries,
    totalDistances
  };
};

export const processDataCalculations = (memoizedData) => {
  const roundUpData = calculateRoundUpByDateAndCourier(memoizedData);
  const distanceData = calculateDistanceByDateAndCourier(memoizedData);
  const deliveryTimeData = calculateDeliveryTimeByDateAndCourier(memoizedData);

  Object.entries(deliveryTimeData).forEach(([courierCode, dateTimes]) => {
    Object.entries(dateTimes).forEach(([date, time]) => {
      formatDurationToHMS(time);
    });
  });

  return {
    roundUpData,
    distanceData,
    deliveryTimeData
  };
};

export const processComprehensiveCourierData = (
  memoizedData,
  memoizedDrivers,
  getCourierNameForDisplay,
  groupedData
) => {
  if (!memoizedData.length) {
    return {
      performanceData: [],
      deliveryCounts: {},
      dates: [],
      roundUpData: {},
      distanceData: {},
      deliveryTimeData: {},
      financialData: {},
      totalDistancesData: {}
    };
  }

  const { roundUpData, distanceData, deliveryTimeData } = processDataCalculations(memoizedData);

  const performanceData = processCourierPerformanceWithDates(
    memoizedData,
    memoizedDrivers,
    roundUpData,
    distanceData,
    deliveryTimeData
  );

  const { deliveryCounts, totalDistances } = calculateCourierMetricsAndCounts(memoizedData, getCourierNameForDisplay);
  const dates = processUniqueDates(memoizedData);
  const financialData = calculateCourierFinancialData(groupedData);

  return {
    performanceData,
    deliveryCounts,
    dates,
    roundUpData,
    distanceData,
    deliveryTimeData,
    financialData,
    totalDistancesData: totalDistances
  };
};

export const logCourierFinancialData = (data) => {
  const groupedByCourier = _.groupBy(data, row => row["Courier Name"]);
  let recordIndex = 0;

  Object.entries(groupedByCourier).forEach(([courierName, courierRecords]) => {
    recordIndex++;

    const aggregatedData = courierRecords.reduce((acc, row) => {
      acc.cost += (row["Cost"] || 0);
      acc.addCost1 += (row["Add Cost 1"] || 0);
      acc.addCost2 += (row["Add Cost 2"] || 0);
      acc.addCharge1 += (row["Add Charge 1"] || 0);
      acc.addCharge2 += (row["Add Charge 2"] || 0);
      acc.sellingPrice += (row["Selling Price"] || 0);
      acc.profit += (row["Profit"] || 0);
      return acc;
    }, {
      cost: 0,
      addCost1: 0,
      addCost2: 0,
      addCharge1: 0,
      addCharge2: 0,
      sellingPrice: 0,
      profit: 0
    });

    const costPlusAddCost1 = aggregatedData.cost + aggregatedData.addCost1;
    const courierCode = courierRecords[0]["Courier Code"] || 'N/A';
  });
};

export const logCourierRowData = (rowData) => {
  if (rowData) {
    console.log("Courier Row Data:", rowData);
  }
};

export const useCourierPerformance = (memoizedData, memoizedDrivers, getCourierNameForDisplay, groupedData) => {
  const [showCourierPerformance, setShowCourierPerformance] = useState(false);

  const processedCourierData = useMemo(() => {
    return processComprehensiveCourierData(
      memoizedData,
      memoizedDrivers,
      getCourierNameForDisplay,
      groupedData
    );
  }, [memoizedData, memoizedDrivers, getCourierNameForDisplay, groupedData]);

  const handleCourierPerformanceAnalysisCallback = useCallback(() => {
    setShowCourierPerformance(true);
    if (groupedData && groupedData.length > 0) {
      logCourierFinancialData(groupedData);
    }
    return processedCourierData;
  }, [processedCourierData, groupedData]);

  const handleCourierDataUpdateCallback = useCallback(() => {
    return processedCourierData;
  }, [processedCourierData]);

  const handleBackToProfitFromCourier = useCallback(() => {
    setShowCourierPerformance(false);
  }, []);

  return {
    courierPerformanceData: processedCourierData.performanceData,
    deliveryCountsByDate: processedCourierData.deliveryCounts,
    uniqueDates: processedCourierData.dates,
    roundUpData: processedCourierData.roundUpData,
    distanceData: processedCourierData.distanceData,
    deliveryTimeData: processedCourierData.deliveryTimeData,
    courierFinancialData: processedCourierData.financialData,
    courierTotalDistances: processedCourierData.totalDistancesData,
    showCourierPerformance,
    handleCourierPerformanceAnalysis: handleCourierPerformanceAnalysisCallback,
    handleCourierDataUpdate: handleCourierDataUpdateCallback,
    handleBackToProfitFromCourier
  };
};

export {
  getDynamicCourierTableHead,
  sortDates,
  getPerformanceStyle,
  getPerformanceIcon,
  getPerformanceRating,
  formatPercentage,
  formatDurationToHMS,
  calculateDeliveryDuration,
  calculateAverageByDates,
  calculateOverallAverageMetrics,
  calculateCourierAverageMetrics,
  calculateDeliveryTimeByDateAndCourier,
  calculateRoundUpByDateAndCourier,
  calculateDistanceByDateAndCourier,
  calculateTotalDistancesByCourier,
  calculateCourierTotalDistances,
  calculateAverageValues,
  getUniqueHubCount,
  findDriverByCode,
  processDeliveryData,
  validateCourierData,
  processCourierPerformanceWithDates,
  sortCourierData,
  calculateCourierTotals,
  clearProcessingCaches,
  calculateDeliveryRatio,
  calculateNetProfit,
  getNetProfitStyle,
  getTopPerformerIndicatorData
};