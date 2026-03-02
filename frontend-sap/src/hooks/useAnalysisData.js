import { useMemo, useRef, useCallback, useEffect } from 'react';
import { 
processHubData, 
calculateSummaryMetrics, 
generateChartData, 
getTopPerformers, 
getPriorityAreas, 
getVolumeLeaders 
} from '../utils/processors/processorHub';

const createStableCache = (maxSize = 20) => {
const cache = new Map();

return {
get: (key) => {
if (!key) return null;
return cache.get(key) || null;
},
set: (key, value) => {
if (!key || !value) return;

if (cache.size >= maxSize) {
const firstKey = cache.keys().next().value;
cache.delete(firstKey);
}
cache.set(key, value);
},
clear: () => cache.clear(),
has: (key) => cache.has(key),
size: () => cache.size
};
};

const createDataHash = (data) => {
if (!data || !Array.isArray(data) || data.length === 0) return null;

try {
const sampleSize = Math.min(data.length, 10);
const sample = [];

const step = Math.max(1, Math.floor(data.length / sampleSize));

for (let i = 0; i < data.length; i += step) {
const item = data[i];
if (item?.hubName) {
sample.push({
hubName: item.hubName,
totalDeliveries: item.totalDeliveries || 0,
onTimePercentage: item.onTimePercentage || 0
});
}
if (sample.length >= sampleSize) break;
}

return JSON.stringify({
length: data.length,
sample: sample
});
} catch (error) {
console.error('Error creating data hash:', error);
return `fallback_${data.length}_${Date.now()}`;
}
};

const validateHubData = (data) => {
if (!data || !Array.isArray(data)) return false;
if (data.length === 0) return false;

for (let i = 0; i < Math.min(data.length, 3); i++) {
const item = data[i];
if (!item || typeof item !== 'object') return false;
if (!item.hubName || typeof item.totalDeliveries !== 'number') return false;
}
return true;
};

export const useAnalysisData = (hubAnalysisData) => {
const stableCache = useRef(createStableCache(15));
const processingSet = useRef(new Set());
const lastValidResult = useRef(null);
const mountedRef = useRef(true);

useEffect(() => {
mountedRef.current = true;
return () => {
mountedRef.current = false;
};
}, []);

const dataHash = useMemo(() => {
return createDataHash(hubAnalysisData);
}, [hubAnalysisData]);

const isValidInput = useMemo(() => {
return validateHubData(hubAnalysisData);
}, [hubAnalysisData]);

const processedResult = useMemo(() => {
if (!isValidInput || !dataHash) {
return lastValidResult.current;
}

const cached = stableCache.current.get(dataHash);
if (cached) {
return cached;
}

if (processingSet.current.has(dataHash)) {
return lastValidResult.current;
}

processingSet.current.add(dataHash);

try {
const processedData = processHubData(hubAnalysisData);
if (!processedData || processedData.length === 0) {
processingSet.current.delete(dataHash);
return lastValidResult.current;
}

const summaryMetrics = calculateSummaryMetrics(processedData);
const chartData = generateChartData(processedData);

const topPerformers = getTopPerformers(processedData);
const priorityAreas = getPriorityAreas(processedData);
const volumeLeaders = getVolumeLeaders(processedData);

const insights = {
topPerformers,
priorityAreas,
volumeLeaders
};

const sortedData = [...processedData].sort((a, b) => 
b.persentaseTepat - a.persentaseTepat);

const result = {
data: processedData,
summaryMetrics,
chartData,
insights,
sortedData
};

if (mountedRef.current) {
stableCache.current.set(dataHash, result);
lastValidResult.current = result;
}

processingSet.current.delete(dataHash);
return result;

} catch (error) {
console.error('Error processing analysis data:', error);
processingSet.current.delete(dataHash);
return lastValidResult.current;
}
}, [hubAnalysisData, dataHash, isValidInput]);

const clearCache = useCallback(() => {
stableCache.current.clear();
processingSet.current.clear();
lastValidResult.current = null;
}, []);

const memoizedResult = useMemo(() => {
if (!processedResult) {
return {
data: null,
summaryMetrics: null,
chartData: null,
insights: null,
sortedData: null,
isLoading: true
};
}

return {
data: processedResult.data,
summaryMetrics: processedResult.summaryMetrics,
chartData: processedResult.chartData,
insights: processedResult.insights,
sortedData: processedResult.sortedData,
isLoading: false
};
}, [processedResult]);

useEffect(() => {
return () => {
processingSet.current.clear();
};
}, []);

return {
...memoizedResult,
clearCache
};
};