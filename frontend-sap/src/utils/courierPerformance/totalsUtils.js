import { processDeliveryData } from './dataProcessing.js';

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