import axios from 'axios';

const API_CONFIG = {
  BASE_URL: (typeof window !== 'undefined' && window.REACT_APP_API_URL) || 
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
    'https://backend-pms-production-0cec.up.railway.app/api',
  TIMEOUT: 120000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1500,
  CACHE_TTL: 5 * 60 * 1000,
  UPLOAD_TIMEOUT: 300000,
  BATCH_SIZE: 5000,
  CHUNK_SIZE: 2500,
  CONCURRENT_LIMIT: 300
};

const requestCache = new Map();
const responseCache = new Map();

const createHttpAgents = () => {
  if (typeof window === 'undefined' && typeof require === 'function') {
    try {
      const http = require('http');
      const https = require('https');
      return {
        httpAgent: new http.Agent({ keepAlive: true, maxSockets: 300, keepAliveMsecs: 60000 }),
        httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 300, keepAliveMsecs: 60000 })
      };
    } catch (error) {
      return {};
    }
  }
  return {};
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  ...createHttpAgents()
});

const performanceMonitor = {
  requests: new Map(),
  now() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  },
  start(requestId) {
    this.requests.set(requestId, {
      startTime: this.now(),
      timestamp: new Date().toISOString()
    });
  },
  end(requestId, success = true, error = null) {
    const request = this.requests.get(requestId);
    if (request) {
      const duration = this.now() - request.startTime;
      if (!success && error && error.status !== 409) {
        console.log(`API Error: ${requestId} - ${duration.toFixed(2)}ms`, { error: error.message });
      }
      this.requests.delete(requestId);
      return duration;
    }
    return 0;
  }
};

const generateRequestKey = (config) => {
  const { method = 'get', url, params, data } = config;
  return `${method.toUpperCase()}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`;
};

const cache = {
  set(key, data, ttl = API_CONFIG.CACHE_TTL) {
    const expiry = Date.now() + ttl;
    responseCache.set(key, { data, expiry });
  },
  get(key) {
    const cached = responseCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      responseCache.delete(key);
    }
    return null;
  },
  clear() {
    responseCache.clear();
  },
  size() {
    return responseCache.size;
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

apiClient.interceptors.request.use(
  async (config) => {
    const requestId = `${config.method?.toUpperCase()}_${config.url}_${Date.now()}`;
    config.requestId = requestId;
    performanceMonitor.start(requestId);

    const token = localStorage.getItem('token');
    if (token && !config.url?.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get' || !config.method) {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    if (config.method === 'post' && (config.url?.includes('upload') || config.url?.includes('append') || config.url?.includes('replace'))) {
      config.timeout = API_CONFIG.UPLOAD_TIMEOUT;
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
    }

    return config;
  },
  (error) => {
    console.error('API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const { config } = response;
    performanceMonitor.end(config.requestId, true);

    if (config.method === 'get' || !config.method) {
      const requestKey = generateRequestKey(config);
      cache.set(requestKey, response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (originalRequest) {
      performanceMonitor.end(originalRequest.requestId, false, { status, message: error.message });
    }

    if (status === 401 && !originalRequest.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const shouldRetry = (
      !originalRequest._retry &&
      (originalRequest.retry || 0) < API_CONFIG.MAX_RETRIES &&
      (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || status >= 500) &&
      !originalRequest.url?.includes('upload') &&
      !originalRequest.url?.includes('append') &&
      !originalRequest.url?.includes('replace')
    );

    if (shouldRetry) {
      originalRequest._retry = true;
      originalRequest.retry = (originalRequest.retry || 0) + 1;
      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest.retry - 1);
      await sleep(delay);
      originalRequest.timeout = Math.min(originalRequest.timeout * 1.3, 180000);
      return apiClient(originalRequest);
    }

    if (originalRequest) {
      const requestKey = generateRequestKey(originalRequest);
      requestCache.delete(requestKey);
    }

    return Promise.reject(error);
  }
);

export const apiCall = async (endpoint, options = {}) => {
  try {
    const config = {
      url: endpoint,
      method: 'get',
      ...options
    };

    const response = await apiClient(config);
    return response.data;

  } catch (error) {
    const enhancedError = new Error(error.response?.data?.message || error.message);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.statusText = error.response?.statusText;
    enhancedError.response = error.response;
    enhancedError.data = error.response?.data;

    if (error.response?.status !== 409) {
      console.error('API Error Details:', {
        message: enhancedError.message,
        status: enhancedError.status,
        endpoint: endpoint
      });
    }

    throw enhancedError;
  }
};

const validateDataPayload = (data, operation) => {
  if (!data || !Array.isArray(data)) {
    throw new Error(`Invalid data format for ${operation}: Expected array`);
  }

  if (data.length === 0) {
    throw new Error(`Empty data array for ${operation}`);
  }

  return true;
};

export const fetchShipmentData = async (page = 1, limit = API_CONFIG.CHUNK_SIZE, year = null) => {
  try {
    const params = { page, limit };
    if (year) params.year = year;
    
    const data = await apiCall('/shipment/data', {
      params,
      timeout: 180000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || typeof data !== 'object') {
      console.error('Invalid response structure:', data);
      return [];
    }

    const shipments = data?.data || [];
    return shipments;
  } catch (error) {
    console.error('Shipment data fetch failed:', error.message);
    
    if (error.status === 500) {
      throw new Error(`Server error while fetching shipment data: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch shipment data: ${error.message}`);
  }
};

export const fetchAllShipmentData = async (onProgress = null, year = null) => {
  try {
    const yearParam = year || new Date().getFullYear();
    
    let allData = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = API_CONFIG.CHUNK_SIZE;

    while (hasMore) {
      const response = await apiCall('/shipment/data', {
        params: { 
          page: currentPage, 
          limit,
          year: yearParam
        },
        timeout: 180000,
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response || typeof response !== 'object') {
        console.error('Invalid response structure:', response);
        break;
      }

      const chunk = response?.data || [];
      const pagination = response?.pagination || {};

      if (chunk.length > 0) {
        allData = allData.concat(chunk);
        
        if (onProgress) {
          onProgress({
            current: currentPage,
            total: pagination.totalPages || 1,
            loaded: allData.length,
            totalRecords: pagination.totalRecords || allData.length,
            percentage: pagination.totalRecords ? Math.round((allData.length / pagination.totalRecords) * 100) : 0
          });
        }
      }

      hasMore = pagination.hasNextPage && chunk.length === limit;
      currentPage++;

      if (currentPage > 500) {
        console.warn('Reached maximum page limit (500)');
        break;
      }

      if (hasMore) {
        await sleep(100);
      }
    }

    return allData;

  } catch (error) {
    console.error('Fetch all shipment data failed:', error.message);
    
    if (error.status === 500) {
      throw new Error(`Server error while fetching all shipment data: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch all shipment data: ${error.message}`);
  }
};

export const fetchShipmentStats = async (year = null) => {
  try {
    const params = {};
    if (year) params.year = year;
    
    const data = await apiCall('/shipment/stats', {
      params,
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return data?.data || {};
  } catch (error) {
    console.error('Shipment stats fetch failed:', error.message);
    throw new Error(`Failed to fetch shipment stats: ${error.message}`);
  }
};

export const fetchShipmentFilters = async (year = null) => {
  try {
    const params = {};
    if (year) params.year = year;
    
    const data = await apiCall('/shipment/filters', {
      params,
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return data?.data || {};
  } catch (error) {
    console.error('Shipment filters fetch failed:', error.message);
    throw new Error(`Failed to fetch shipment filters: ${error.message}`);
  }
};

export const fetchAvailableYears = async () => {
  try {
    const data = await apiCall('/shipment/years', {
      timeout: 30000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return data?.data || [];
  } catch (error) {
    console.error('Available years fetch failed:', error.message);
    throw new Error(`Failed to fetch available years: ${error.message}`);
  }
};

export const fetchShipmentDataByYear = async (year, onProgress = null) => {
  try {
    let allData = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = API_CONFIG.CHUNK_SIZE;

    while (hasMore) {
      const response = await apiCall('/shipment/data', {
        params: { 
          page: currentPage, 
          limit,
          year: year
        },
        timeout: 180000,
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response || typeof response !== 'object') {
        console.error('Invalid response structure:', response);
        break;
      }

      const chunk = response?.data || [];
      const pagination = response?.pagination || {};

      if (chunk.length > 0) {
        allData = allData.concat(chunk);
        
        if (onProgress) {
          onProgress({
            current: currentPage,
            total: pagination.totalPages || 1,
            loaded: allData.length,
            totalRecords: pagination.totalRecords || allData.length,
            percentage: pagination.totalRecords ? Math.round((allData.length / pagination.totalRecords) * 100) : 0
          });
        }
      }

      hasMore = pagination.hasNextPage && chunk.length === limit;
      currentPage++;

      if (currentPage > 500) {
        console.warn('Reached maximum page limit (500)');
        break;
      }

      if (hasMore) {
        await sleep(100);
      }
    }

    return allData;

  } catch (error) {
    console.error(`Fetch shipment data for year ${year} failed:`, error.message);
    
    if (error.status === 500) {
      throw new Error(`Server error while fetching shipment data for year ${year}: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch shipment data for year ${year}: ${error.message}`);
  }
};

export const fetchMitraDashboardAnalytics = async () => {
  try {
    const data = await apiCall('/mitra/dashboard-analytics', {
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    console.log('✅ Mitra Dashboard Analytics retrieved successfully');
    return data.data;
  } catch (error) {
    console.error('❌ Mitra Dashboard Analytics fetch failed:', error.message);
    
    if (error.status === 500) {
      throw new Error('Server error while fetching dashboard analytics. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to fetch dashboard analytics');
  }
};

export const fetchProjectAnalysisData = async (filters = {}) => {
  try {
    const data = await apiCall('/shipment/analysis/project-monthly', {
      params: filters,
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const analysis = data?.data || [];
    return analysis;
  } catch (error) {
    console.error('Project analysis fetch failed:', error);
    throw new Error(`Failed to fetch project analysis: ${error.message}`);
  }
};

export const fetchMitraDashboardAnalyticsWithFilters = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.year) params.append('year', filters.year);
    if (filters.month) params.append('month', filters.month);
    if (filters.week) params.append('week', filters.week);

    const queryString = params.toString();
    const endpoint = `/mitra/dashboard-analytics${queryString ? `?${queryString}` : ''}`;

    const data = await apiCall(endpoint, {
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    console.log('✅ Filtered Mitra Dashboard Analytics retrieved successfully');
    return data.data;
  } catch (error) {
    console.error('❌ Filtered Mitra Dashboard Analytics fetch failed:', error.message);
    
    if (error.status === 500) {
      throw new Error('Server error while fetching dashboard analytics. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to fetch dashboard analytics');
  }
};

export const extractAvailableFiltersFromData = (dashboardData) => {
  if (!dashboardData) {
    return {
      years: [],
      months: [],
      weeks: []
    };
  }

  const years = new Set();
  const months = new Set();
  const weeks = new Set();

  if (dashboardData.monthlyData) {
    dashboardData.monthlyData.forEach(item => {
      if (item.year) years.add(item.year);
      if (item.month) months.add(item.month);
    });
  }

  if (dashboardData.weeklyData) {
    dashboardData.weeklyData.forEach(item => {
      if (item.year) years.add(item.year);
      if (item.month) months.add(item.month);
      if (item.week) weeks.add(item.week);
    });
  }

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    years: Array.from(years).sort((a, b) => b.localeCompare(a)),
    months: MONTHS.filter(m => months.has(m)),
    weeks: Array.from(weeks).sort()
  };
};

export const fetchProjectWeeklyData = async (filters = {}) => {
  try {
    const data = await apiCall('/shipment/analysis/project-weekly', {
      params: filters,
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const analysis = data?.data || [];
    return analysis;
  } catch (error) {
    console.error('Project weekly fetch failed:', error);
    throw new Error(`Failed to fetch project weekly data: ${error.message}`);
  }
};

export const fetchMitraAnalysisData = async (filters = {}) => {
  try {
    const data = await apiCall('/shipment/analysis/mitra-monthly', {
      params: filters,
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const analysis = data?.data || [];
    return analysis;
  } catch (error) {
    console.error('Mitra analysis fetch failed:', error);
    throw new Error(`Failed to fetch mitra analysis: ${error.message}`);
  }
};

export const fetchMitraWeeklyData = async (filters = {}) => {
  try {
    const data = await apiCall('/shipment/analysis/mitra-weekly', {
      params: filters,
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const analysis = data?.data || [];
    return analysis;
  } catch (error) {
    console.error('Mitra weekly fetch failed:', error);
    throw new Error(`Failed to fetch mitra weekly data: ${error.message}`);
  }
};

export const fetchRiderActiveInactiveStats = async () => {
  try {
    const data = await apiCall('/mitra/rider-active-inactive-stats', {
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const stats = data?.data || [];
    return data;
  } catch (error) {
    console.error('Rider active/inactive stats fetch failed:', error.message);
    throw new Error(`Failed to fetch rider active/inactive stats: ${error.message}`);
  }
};

export const fetchRiderWeeklyStats = async () => {
  try {
    const data = await apiCall('/mitra/rider-weekly-stats', {
      timeout: 120000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const stats = data?.data || [];
    return data;
  } catch (error) {
    console.error('Rider weekly stats fetch failed:', error.message);
    throw new Error(`Failed to fetch rider weekly stats: ${error.message}`);
  }
};

export const fetchActiveRidersDetails = async (month, year, week = null) => {
  try {
    const endpoint = week 
      ? `/mitra/active-riders-details?month=${month}&year=${year}&week=${encodeURIComponent(week)}`
      : `/mitra/active-riders-details?month=${month}&year=${year}`;
    
    const result = await apiCall(endpoint, {
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return result;
  } catch (error) {
    console.error('Active riders details fetch failed:', error.message);
    throw new Error(`Failed to fetch active riders details: ${error.message}`);
  }
};

export const fetchInactiveRidersDetails = async (month, year, week = null) => {
  try {
    const endpoint = week 
      ? `/mitra/inactive-riders-details?month=${month}&year=${year}&week=${encodeURIComponent(week)}`
      : `/mitra/inactive-riders-details?month=${month}&year=${year}`;
    
    const result = await apiCall(endpoint, {
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return result;
  } catch (error) {
    console.error('Inactive riders details fetch failed:', error.message);
    throw new Error(`Failed to fetch inactive riders details: ${error.message}`);
  }
};

export const fetchMitraData = async () => {
  try {
    const data = await apiCall('/mitra/data/all', {
      timeout: 60000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const mitras = Array.isArray(data) ? data : data?.data || [];
    return mitras;
  } catch (error) {
    console.error('Mitra data fetch failed:', error.message);
    throw new Error(`Failed to fetch mitra data: ${error.message}`);
  }
};

export const batchUploadToServer = async (data, onProgress = null) => {
  try {
    validateDataPayload(data, 'segment upload');

    const totalRecords = data.length;
    const batchSize = API_CONFIG.BATCH_SIZE;
    const totalBatches = Math.ceil(totalRecords / batchSize);

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let allErrors = [];
    let isFirstBatch = true;

    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      if (onProgress) {
        onProgress({
          current: currentBatch - 1,
          total: totalBatches,
          percentage: Math.round(((currentBatch - 1) / totalBatches) * 100)
        });
      }

      let batchSuccess = false;
      let retryCount = 0;
      const maxRetries = 2;

      while (!batchSuccess && retryCount < maxRetries) {
        try {
          let result;

          if (isFirstBatch) {
            result = await apiCall('/upload', {
              method: 'post',
              data: batch,
              timeout: API_CONFIG.UPLOAD_TIMEOUT,
            });
            isFirstBatch = false;
          } else {
            result = await apiCall('/append', {
              method: 'post',
              data: batch,
              timeout: API_CONFIG.UPLOAD_TIMEOUT,
            });
          }

          if (result && result.summary && result.summary.success) {
            const processedInBatch = result.summary.totalRecords || batch.length;
            totalSuccessful += processedInBatch;
            batchSuccess = true;
          } else {
            throw new Error(`Invalid server response for segment ${currentBatch}: ${JSON.stringify(result)}`);
          }

        } catch (batchError) {
          retryCount++;

          if (retryCount < maxRetries) {
            const retryDelay = 1500 * Math.pow(2, retryCount - 1);
            await sleep(retryDelay);
          } else {
            const errorMessage = `Segment ${currentBatch} failed after ${maxRetries} attempts: ${batchError.message}`;
            allErrors.push(errorMessage);
          }
        }
      }

      if (!batchSuccess) {
        throw new Error(`Critical error: Segment ${currentBatch} could not be processed after ${maxRetries} attempts`);
      }

      totalProcessed += batch.length;

      if (currentBatch < totalBatches) {
        await sleep(1000);
      }
    }

    if (onProgress) {
      onProgress({
        current: totalBatches,
        total: totalBatches,
        percentage: 100
      });
    }

    if (allErrors.length > 0) {
      console.warn('Some segments had errors:', allErrors);
    }

    return {
      success: true,
      message: `Data berhasil diunggah: ${totalSuccessful} records tersimpan dari ${totalProcessed}`,
      totalRecords: totalSuccessful,
      totalProcessed: totalProcessed,
      totalBatches: totalBatches,
      errors: allErrors
    };

  } catch (error) {
    const errorMessage = error.message.includes('Critical error') ? 
      error.message : 
      `Gagal mengunggah data: ${error.message}`;

    throw new Error(errorMessage);
  }
};

export const uploadDataToServer = async (data) => {
  try {
    validateDataPayload(data, 'upload');

    const totalRecords = data.length;

    const result = await apiCall('/upload', {
      method: 'post',
      data: data,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      message: result?.message || `Data berhasil diunggah: ${totalRecords} records`,
      totalRecords: totalRecords,
      ...result
    };

  } catch (error) {
    console.error('Upload data failed:', error);
    throw new Error(`Gagal mengunggah data: ${error.response?.data?.message || error.message}`);
  }
};

export const appendDataToServer = async (data) => {
  try {
    validateDataPayload(data, 'append');

    const result = await apiCall('/append', {
      method: 'post',
      data: data,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      message: result?.message || 'Data berhasil ditambahkan ke server',
      count: data.length,
      ...result
    };
  } catch (error) {
    console.error('Append data failed:', error);
    throw new Error(`Gagal menambahkan data: ${error.response?.data?.message || error.message}`);
  }
};

export const replaceDataToServer = async (data) => {
  try {
    validateDataPayload(data, 'replace');

    const result = await apiCall('/replace', {
      method: 'post',
      data: data,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      message: result?.message || 'Data berhasil diganti di server',
      count: data.length,
      ...result
    };
  } catch (error) {
    console.error('Replace data failed:', error);
    throw new Error(`Gagal mengganti data: ${error.response?.data?.message || error.message}`);
  }
};

export const fetchDriverData = async () => {
  try {
    const data = await apiCall('/driver/data', {
      timeout: 45000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const drivers = Array.isArray(data) ? data : data?.data || [];
    return drivers;
  } catch (error) {
    console.error('Driver data fetch failed:', error);
    throw new Error(`Failed to fetch driver data: ${error.message}`);
  }
};

export const fetchBonusData = async (options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 1000, 
      useChunking = true 
    } = options;

    if (useChunking) {
      const chunks = [];
      let currentPage = page;
      let hasMore = true;

      while (hasMore) {
        const chunkData = await apiCall('/bonus/data', {
          params: { page: currentPage, limit },
          timeout: 45000
        });

        const records = Array.isArray(chunkData) ? chunkData : chunkData?.data || [];

        if (records.length > 0) {
          chunks.push(...records);
          currentPage++;
          hasMore = records.length === limit;
        } else {
          hasMore = false;
        }

        if (currentPage > 100) {
          break;
        }
      }

      return chunks;
    } else {
      const data = await apiCall('/bonus/data', {
        timeout: 60000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const bonusData = Array.isArray(data) ? data : data?.data || [];
      return bonusData;
    }

  } catch (error) {
    console.error('Bonus data fetch error:', error);
    throw new Error(`Failed to fetch bonus data: ${error.message}`);
  }
};

export const fetchData = async (selectedTags = []) => {
  try {
    if (selectedTags.length === 0) {
      const data = await apiCall('/data', {
        headers: { 
          'Cache-Control': 'max-age=300, must-revalidate',
          'X-Use-Cache': 'true'
        },
        timeout: 120000
      });
      
      const result = Array.isArray(data) ? data : (data?.data || []);
      console.log('API fetchData - No tags - Result length:', result.length);
      return result;
    }

    const BATCH_SIZE = 3;
    const results = [];

    for (let i = 0; i < selectedTags.length; i += BATCH_SIZE) {
      const batch = selectedTags.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(tag =>
        apiCall(`/data/${tag.toLowerCase()}`, {
          headers: { 
            'Cache-Control': 'max-age=300, must-revalidate',
            'X-Use-Cache': 'true'
          },
          timeout: 60000
        }).then(res => {
          const parsed = Array.isArray(res) ? res : (res?.data || []);
          console.log(`API fetchData - Tag "${tag}" - Result length:`, parsed.length);
          return parsed;
        })
        .catch(err => {
          console.warn(`Failed to fetch data for tag '${tag}':`, err.message);
          return [];
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      if (i + BATCH_SIZE < selectedTags.length) {
        await sleep(100);
      }
    }

    console.log('API fetchData - With tags - Total results:', results.length);
    return results;

  } catch (error) {
    console.error('API fetchData error:', error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
};

export const uploadFleetData = async (data) => {
  try {
    validateDataPayload(data, 'fleet upload');

    const result = await apiCall('/fleet/upload', {
      method: 'post',
      data: data,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      message: result?.message || `Data fleet berhasil diunggah: ${data.length} records`,
      totalRecords: data.length,
      ...result
    };

  } catch (error) {
    console.error('Upload fleet data failed:', error);
    throw new Error(`Gagal mengunggah data fleet: ${error.response?.data?.message || error.message}`);
  }
};

export const fetchFleetData = async (options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 1000, 
      search = ''
    } = options;

    const data = await apiCall('/fleet/data', {
      params: { page, limit, search },
      timeout: 45000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const fleetData = Array.isArray(data) ? data : data?.data || [];
    return fleetData;

  } catch (error) {
    console.error('Fleet data fetch failed:', error);
    throw new Error(`Failed to fetch fleet data: ${error.message}`);
  }
};

export const fetchFleetStats = async () => {
  try {
    const data = await apiCall('/fleet/stats', {
      timeout: 30000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    return data?.data || {};

  } catch (error) {
    console.error('Fleet stats fetch failed:', error);
    throw new Error(`Failed to fetch fleet statistics: ${error.message}`);
  }
};

export const fetchFleetByPlate = async (plate) => {
  try {
    const data = await apiCall(`/fleet/plate/${encodeURIComponent(plate)}`, {
      timeout: 30000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    return data?.data || null;

  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    console.error('Fleet data by plate fetch failed:', error);
    throw new Error(`Failed to fetch fleet data: ${error.message}`);
  }
};

export const updateFleetData = async (id, data) => {
  try {
    const result = await apiCall(`/fleet/${id}`, {
      method: 'put',
      data: data,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return result;

  } catch (error) {
    console.error('Update fleet data failed:', error);
    throw new Error(`Gagal memperbarui data fleet: ${error.response?.data?.message || error.message}`);
  }
};

export const deleteFleetData = async (id) => {
  try {
    const result = await apiCall(`/fleet/${id}`, {
      method: 'delete',
      timeout: 30000
    });

    return result;

  } catch (error) {
    console.error('Delete fleet data failed:', error);
    throw new Error(`Gagal menghapus data fleet: ${error.response?.data?.message || error.message}`);
  }
};

export const fetchMitraPerformanceData = async (driverId) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const data = await apiCall(`/mitra/performance/${driverId}`, {
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  } catch (error) {
    console.error('Mitra performance data fetch failed:', error.message);
    
    if (error.status === 404) {
      throw new Error('Mitra not found. Please check the driver ID.');
    }
    
    if (error.status === 500) {
      throw new Error('Server error while fetching performance data. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to fetch mitra performance data');
  }
};

export const fetchFilteredMitraPerformance = async (driverId, filters = {}) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const params = new URLSearchParams();
    
    if (filters.periodType) params.append('periodType', filters.periodType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.selectedWeek) params.append('selectedWeek', filters.selectedWeek);
    if (filters.selectedMonth) params.append('selectedMonth', filters.selectedMonth);
    if (filters.selectedYear) params.append('selectedYear', filters.selectedYear);

    const queryString = params.toString();
    const endpoint = `/mitra/performance/${driverId}${queryString ? `?${queryString}` : ''}`;

    console.log('🌐 API Request:', endpoint);

    const data = await apiCall(endpoint, {
      timeout: 60000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    console.log('✅ API Response received:', data.data);
    return data.data;
  } catch (error) {
    console.error('❌ Filtered mitra performance data fetch failed:', error.message);
    
    if (error.status === 404) {
      throw new Error('Mitra not found. Please check the driver ID.');
    }
    
    if (error.status === 500) {
      throw new Error('Server error while fetching performance data. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to fetch filtered mitra performance data');
  }
};

export const fetchAllMitraPerformance = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.periodType) params.append('periodType', filters.periodType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientName) params.append('clientName', filters.clientName);
    if (filters.projectName) params.append('projectName', filters.projectName);
    if (filters.hub) params.append('hub', filters.hub);
    if (filters.dropPoint) params.append('dropPoint', filters.dropPoint);

    const queryString = params.toString();
    const endpoint = `/mitra/all-performance${queryString ? `?${queryString}` : ''}`;

    console.log('🌐 API Request All Mitra Performance (Top 19):', endpoint);

    const data = await apiCall(endpoint, {
      timeout: 180000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    console.log('✅ API Response Top 19 Mitra Performance received:', data.data);
    return data.data;
  } catch (error) {
    console.error('❌ All Mitra Performance data fetch failed:', error.message);
    
    if (error.status === 404) {
      throw new Error('All mitra performance endpoint not found');
    }
    
    if (error.status === 500) {
      throw new Error('Server error while fetching all mitra performance data');
    }
    
    throw new Error(error.message || 'Failed to fetch all mitra performance data');
  }
};

export const exportAllMitraPerformanceData = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.periodType) params.append('periodType', filters.periodType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientName) params.append('clientName', filters.clientName);
    if (filters.projectName) params.append('projectName', filters.projectName);
    if (filters.hub) params.append('hub', filters.hub);
    if (filters.dropPoint) params.append('dropPoint', filters.dropPoint);

    const queryString = params.toString();
    const endpoint = `/mitra/all-performance${queryString ? `?${queryString}` : ''}`;

    console.log('🌐 API Export Request:', endpoint);

    const data = await apiCall(endpoint, {
      timeout: 180000,
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw new Error(error.message || 'Failed to export data');
  }
};

export const uploadFile = async (endpoint, file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      url: endpoint,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    };

    const response = await apiClient(config);
    return response.data;

  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
};

export const batchOperation = async (endpoint, data, batchSize = 100) => {
  try {
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const batchResult = await apiCall(endpoint, {
        method: 'post',
        data: batch,
        timeout: 60000
      });

      results.push(batchResult);

      if (i + batchSize < data.length) {
        await sleep(200);
      }
    }

    return results;

  } catch (error) {
    throw new Error(`Segment operation failed: ${error.message}`);
  }
};

export const healthCheck = async () => {
  try {
    const start = performanceMonitor.now();
    const response = await apiCall('/health');
    const duration = performanceMonitor.now() - start;

    return {
      status: 'healthy',
      responseTime: Math.round(duration),
      timestamp: new Date().toISOString(),
      ...response
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const cacheUtils = {
  clear: () => cache.clear(),
  size: () => cache.size(),
  info: () => {
    const memoryInfo = (typeof performance !== 'undefined' && performance.memory) ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : null;

    return {
      cacheSize: cache.size(),
      requestCacheSize: requestCache.size,
      memoryUsage: memoryInfo
    };
  }
};

if (typeof window !== 'undefined') {
  setInterval(() => {
    const expired = [];
    for (const [key, value] of responseCache.entries()) {
      if (value.expiry <= Date.now()) {
        expired.push(key);
      }
    }
    expired.forEach(key => responseCache.delete(key));

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired cache entries`);
    }
  }, 60000);
}

export default apiClient;