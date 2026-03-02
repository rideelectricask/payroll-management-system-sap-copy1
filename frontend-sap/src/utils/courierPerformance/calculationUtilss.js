import { TIME_CONSTANTS } from './constants.js';
import { parseDateTime } from './dateUtilss.js';

const MAX_CACHE_SIZE = 10000;
const CACHE_CLEANUP_THRESHOLD = 8000;

class LRUCache {
    constructor(maxSize = MAX_CACHE_SIZE) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return undefined;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

const formatCache = new LRUCache(5000);
const durationCache = new LRUCache(5000);
const averageCache = new LRUCache(3000);
const calculationCache = new LRUCache(2000);

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatPercentage = (value) => {
    if (typeof value !== 'number' || !isFinite(value)) return '0.00';

    const intValue = Math.round(value * 100);
    const cacheKey = intValue;

    const cached = formatCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const formatted = numberFormatter.format(value);
    formatCache.set(cacheKey, formatted);
    return formatted;
};

export const formatDurationToHMS = (totalHours) => {
    if (typeof totalHours !== 'number' || totalHours < 0 || !isFinite(totalHours)) {
        return '00:00:00';
    }

    const intHours = Math.round(totalHours * 1000);
    const cached = durationCache.get(intHours);
    if (cached !== undefined) return cached;

    const totalSeconds = Math.round(totalHours * TIME_CONSTANTS.HOURS_TO_SECONDS);
    const hours = Math.floor(totalSeconds / TIME_CONSTANTS.HOURS_TO_SECONDS);
    const minutes = Math.floor((totalSeconds % TIME_CONSTANTS.HOURS_TO_SECONDS) / TIME_CONSTANTS.MINUTES_TO_SECONDS);
    const seconds = totalSeconds % TIME_CONSTANTS.MINUTES_TO_SECONDS;

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    durationCache.set(intHours, formatted);
    return formatted;
};

export const calculateDeliveryDuration = (deliveryStart, dropOffDone) => {
    if (!deliveryStart || !dropOffDone) return 0;

    const cacheKey = `${deliveryStart}|${dropOffDone}`;
    const cached = durationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
        const startDate = parseDateTime(deliveryStart);
        const endDate = parseDateTime(dropOffDone);

        if (!startDate || !endDate) {
            durationCache.set(cacheKey, 0);
            return 0;
        }

        const timeDifferenceMs = endDate.getTime() - startDate.getTime();
        if (timeDifferenceMs < 0) {
            durationCache.set(cacheKey, 0);
            return 0;
        }

        const durationHours = Math.max(0, timeDifferenceMs / TIME_CONSTANTS.MS_TO_HOURS);
        durationCache.set(cacheKey, durationHours);
        return durationHours;
    } catch (error) {
        console.error('Error calculating delivery duration:', error);
        durationCache.set(cacheKey, 0);
        return 0;
    }
};

export const calculateAverageByDates = (dataByDate, uniqueDates = []) => {
    if (!dataByDate || !Array.isArray(uniqueDates) || uniqueDates.length === 0) {
        return 0;
    }

    const sortedDates = uniqueDates.sort();
    const dataKeys = Object.keys(dataByDate).sort();
    const dataValues = dataKeys.map(key => dataByDate[key]);
    const cacheKey = `${dataKeys.join(',')}-${dataValues.join(',')}-${sortedDates.join(',')}`;
    const cached = averageCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let totalValue = 0;
    let validCount = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
        const date = uniqueDates[i];
        const value = dataByDate[date] || 0;
        totalValue += value;
        validCount++;
    }

    const average = validCount > 0 ? totalValue / validCount : 0;
    averageCache.set(cacheKey, average);
    return average;
};

export const calculateCourierAverageMetrics = (courier, uniqueDates = []) => {
    if (!courier || !Array.isArray(uniqueDates) || uniqueDates.length === 0) {
        return {
            avgAllCount: 0,
            avgAllRoundUp: 0,
            avgAllDistance: 0,
            avgAllTime: 0
        };
    }

    const deliveriesByDate = courier.deliveriesByDate || {};
    const roundUpByDate = courier.roundUpByDate || {};
    const distanceByDate = courier.distanceByDate || {};
    const deliveryTimeByDate = courier.deliveryTimeByDate || {};

    const deliveryValues = uniqueDates.map(date => deliveriesByDate[date] || 0);
    const roundUpValues = uniqueDates.map(date => roundUpByDate[date] || 0);
    const distanceValues = uniqueDates.map(date => distanceByDate[date] || 0);
    const timeValues = uniqueDates.map(date => deliveryTimeByDate[date] || 0);

    const cacheKey = `${courier.courierCode}-${deliveryValues.join(',')}-${roundUpValues.join(',')}-${distanceValues.join(',')}-${timeValues.join(',')}-${uniqueDates.join(',')}`;
    const cached = calculationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let totalCount = 0;
    let totalRoundUp = 0;
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
        const date = uniqueDates[i];
        totalCount += deliveriesByDate[date] || 0;
        totalRoundUp += roundUpByDate[date] || 0;
        totalDistance += distanceByDate[date] || 0;
        totalTime += deliveryTimeByDate[date] || 0;
    }

    const dateCount = uniqueDates.length;
    const result = {
        avgAllCount: dateCount > 0 ? totalCount / dateCount : 0,
        avgAllRoundUp: dateCount > 0 ? totalRoundUp / dateCount : 0,
        avgAllDistance: dateCount > 0 ? totalDistance / dateCount : 0,
        avgAllTime: dateCount > 0 ? totalTime / dateCount : 0
    };

    calculationCache.set(cacheKey, result);
    return result;
};

export const calculateOverallAverageMetrics = (courierData, uniqueDates = []) => {
    if (!Array.isArray(courierData) || courierData.length === 0 || !Array.isArray(uniqueDates) || uniqueDates.length === 0) {
        return {
            avgAllCount: 0,
            avgAllRoundUp: 0,
            avgAllDistance: 0,
            avgAllTime: 0
        };
    }

    const cacheKey = `overall-${courierData.length}-${uniqueDates.join(',')}`;
    const cached = calculationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let totalCount = 0;
    let totalRoundUp = 0;
    let totalDistance = 0;
    let totalTime = 0;

    const courierLength = courierData.length;
    const datesLength = uniqueDates.length;

    for (let i = 0; i < courierLength; i++) {
        const courier = courierData[i];
        const deliveriesByDate = courier.deliveriesByDate || {};
        const roundUpByDate = courier.roundUpByDate || {};
        const distanceByDate = courier.distanceByDate || {};
        const deliveryTimeByDate = courier.deliveryTimeByDate || {};

        for (let j = 0; j < datesLength; j++) {
            const date = uniqueDates[j];
            totalCount += deliveriesByDate[date] || 0;
            totalRoundUp += roundUpByDate[date] || 0;
            totalDistance += distanceByDate[date] || 0;
            totalTime += deliveryTimeByDate[date] || 0;
        }
    }

    const totalEntries = courierLength * datesLength;
    const result = {
        avgAllCount: totalEntries > 0 ? totalCount / totalEntries : 0,
        avgAllRoundUp: totalEntries > 0 ? totalRoundUp / totalEntries : 0,
        avgAllDistance: totalEntries > 0 ? totalDistance / totalEntries : 0,
        avgAllTime: totalEntries > 0 ? totalTime / totalEntries : 0
    };

    calculationCache.set(cacheKey, result);
    return result;
};

export const calculateAverageValues = (courierData, uniqueDates, property) => {
    if (!Array.isArray(courierData) || courierData.length === 0 || !Array.isArray(uniqueDates) || uniqueDates.length === 0) {
        return {};
    }

    const results = {};
    const courierLength = courierData.length;

    for (let i = 0; i < courierLength; i++) {
        const courier = courierData[i];
        const courierCode = courier.courierCode;
        const dataByDate = courier[property] || {};
        const avgValue = calculateAverageByDates(dataByDate, uniqueDates);
        results[courierCode] = avgValue;
    }

    return results;
};

export const getUniqueHubCount = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;

    const uniqueHubs = new Set();
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item && item.hub) {
            uniqueHubs.add(item.hub);
        }
    }

    return uniqueHubs.size;
};

export const batchCalculateAverages = (courierDataBatch, uniqueDates) => {
    const results = new Array(courierDataBatch.length);

    for (let i = 0; i < courierDataBatch.length; i++) {
        const courier = courierDataBatch[i];
        results[i] = {
            courierCode: courier.courierCode,
            avgCount: calculateAverageByDates(courier.deliveriesByDate || {}, uniqueDates),
            avgRoundUp: calculateAverageByDates(courier.roundUpByDate || {}, uniqueDates),
            avgDistance: calculateAverageByDates(courier.distanceByDate || {}, uniqueDates),
            avgTime: calculateAverageByDates(courier.deliveryTimeByDate || {}, uniqueDates)
        };
    }

    return results;
};

export const clearCalculationCaches = () => {
    formatCache.clear();
    durationCache.clear();
    averageCache.clear();
    calculationCache.clear();
};

export const getCacheStats = () => {
    return {
        formatCache: formatCache.size(),
        durationCache: durationCache.size(),
        averageCache: averageCache.size(),
        calculationCache: calculationCache.size()
    };
};