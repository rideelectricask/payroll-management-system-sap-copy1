import { getDynamicCourierTableHead } from './dateUtils.js';

const CACHE_SIZE_LIMIT = 1000;
const CACHE_TTL = 5 * 60 * 1000;

class SortCache {
  constructor(maxSize = CACHE_SIZE_LIMIT) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.timestamps = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > CACHE_TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return undefined;
    }

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.timestamps.delete(firstKey);
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  size() {
    return this.cache.size;
  }
}

const sortCache = new SortCache();

const fieldAccessors = {
  'HUB': item => item.hub || '',
  'Courier Code': item => item.courierCode || '',
  'Courier Name': item => item.courierName || '',
  'Total Deliveries': item => item.totalDeliveries || 0,
  'On-Time Deliveries': item => item.onTimeDeliveries || 0,
  'Late Deliveries': item => item.lateDeliveries || 0,
  'On-Time %': item => item.onTimePercentage || 0,
  'Late %': item => item.latePercentage || 0,
  'Delivery Ratio': item => {
    const total = (item.totalDeliveries || 0) + (item.lateDeliveries || 0);
    return total === 0 ? 0 : (item.totalDeliveries || 0) / total;
  },
  'Total Distance': item => item.totalDistance || 0,
  'Total Fee': item => item.costPlusAddCost1 || 0,
  'Total Revenue': item => item.profit || 0,
  'Total Gross Profit': item => (item.profit || 0) - (item.costPlusAddCost1 || 0),
  'Top Performer': item => item.topPerformerRank || 0,
  'Avg All Metrics': item => item.avgAllCount || 0,
  'Avg Count': item => item.avgCount || 0,
  'Avg RoundUp': item => item.avgRoundUp || 0,
  'Avg Distance': item => item.avgDistance || 0,
  'Avg Time': item => item.avgTime || 0
};

const getFieldValue = (item, field) => {
  if (fieldAccessors[field]) {
    return fieldAccessors[field](item);
  }

  if (field && field.includes('(Deliveries-Weight-Distance-Duration)')) {
    const dateOnly = field.replace(' (Deliveries-Weight-Distance-Duration)', '');
    return item.deliveriesByDate?.[dateOnly] || 0;
  }

  return 0;
};

const compareValues = (aValue, bValue, direction) => {
  if (aValue === bValue) return 0;

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return direction === 'asc' 
      ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
      : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
  }

  const numA = Number(aValue);
  const numB = Number(bValue);

  if (isNaN(numA) || isNaN(numB)) {
    return direction === 'asc' ? 
      String(aValue).localeCompare(String(bValue)) : 
      String(bValue).localeCompare(String(aValue));
  }

  return direction === 'asc' ? numA - numB : numB - numA;
};

const quickSort = (arr, compareFn, left = 0, right = arr.length - 1) => {
  if (left < right) {
    const pivotIndex = partition(arr, compareFn, left, right);
    quickSort(arr, compareFn, left, pivotIndex - 1);
    quickSort(arr, compareFn, pivotIndex + 1, right);
  }
  return arr;
};

const partition = (arr, compareFn, left, right) => {
  const pivot = arr[right];
  let i = left - 1;

  for (let j = left; j < right; j++) {
    if (compareFn(arr[j], pivot) <= 0) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
};

const insertionSort = (arr, compareFn) => {
  for (let i = 1; i < arr.length; i++) {
    const keyItem = arr[i];
    let j = i - 1;

    while (j >= 0 && compareFn(arr[j], keyItem) > 0) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = keyItem;
  }
  return arr;
};

const mergeSort = (arr, compareFn) => {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);

  return merge(left, right, compareFn);
};

const merge = (left, right, compareFn) => {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
};

const selectSortingAlgorithm = (dataSize) => {
  if (dataSize < 50) return 'insertion';
  if (dataSize < 1000) return 'quicksort';
  return 'mergesort';
};

const createSortKey = (data, sortConfig, uniqueDates) => {
  const dataHash = data.length > 0 ? 
    `${data[0].courierCode || ''}-${data[data.length - 1].courierCode || ''}` : 
    'empty';

  return `${data.length}-${sortConfig.key}-${sortConfig.direction}-${uniqueDates.length}-${dataHash}`;
};

export const sortCourierData = (data, sortConfig, uniqueDates = []) => {
  if (!Array.isArray(data) || data.length === 0 || !sortConfig) return data;

  const cacheKey = createSortKey(data, sortConfig, uniqueDates);
  const cached = sortCache.get(cacheKey);
  if (cached) return cached;

  const headers = getDynamicCourierTableHead(uniqueDates);
  const { key, direction } = sortConfig;
  const field = headers[key];

  if (!field) return data;

  const sortedData = [...data];
  const algorithm = selectSortingAlgorithm(data.length);

  const compareFn = (a, b) => {
    const aValue = getFieldValue(a, field);
    const bValue = getFieldValue(b, field);
    return compareValues(aValue, bValue, direction);
  };

  switch (algorithm) {
    case 'insertion':
      insertionSort(sortedData, compareFn);
      break;
    case 'quicksort':
      quickSort(sortedData, compareFn);
      break;
    case 'mergesort':
      const result = mergeSort(sortedData, compareFn);
      sortCache.set(cacheKey, result);
      return result;
    default:
      sortedData.sort(compareFn);
  }

  if (data.length > 50) {
    sortCache.set(cacheKey, sortedData);
  }

  return sortedData;
};

export const clearSortingCache = () => {
  sortCache.clear();
};

export const getSortingCacheStats = () => {
  return {
    size: sortCache.size(),
    maxSize: CACHE_SIZE_LIMIT,
    ttl: CACHE_TTL
  };
};