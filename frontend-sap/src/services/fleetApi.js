import axios from 'axios';

const API_CONFIG = {
  BASE_URL: 'https://backend-pms-production-0cec.up.railway.app/api',
  TIMEOUT: 90000,
  UPLOAD_TIMEOUT: 300000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 1000,
};

const fleetApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const performanceMonitor = {
  requests: new Map(),

  start(requestId) {
    this.requests.set(requestId, {
      startTime: Date.now(),
      timestamp: new Date().toISOString()
    });
  },

  end(requestId, success = true, error = null) {
    const request = this.requests.get(requestId);
    if (request) {
      const duration = Date.now() - request.startTime;
      console.log(`Fleet API ${success ? 'Success' : 'Error'}: ${requestId} - ${duration}ms`, 
        error ? { error: error.message } : {});
      this.requests.delete(requestId);
      return duration;
    }
    return 0;
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

fleetApiClient.interceptors.request.use(
  (config) => {
    const requestId = `${config.method?.toUpperCase()}_${config.url}_${Date.now()}`;
    config.requestId = requestId;
    performanceMonitor.start(requestId);

    if (config.url?.includes('upload')) {
      config.timeout = API_CONFIG.UPLOAD_TIMEOUT;
    }

    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    console.log(`Fleet API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Fleet API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

fleetApiClient.interceptors.response.use(
  (response) => {
    const { config } = response;
    performanceMonitor.end(config.requestId, true);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (originalRequest) {
      performanceMonitor.end(originalRequest.requestId, false, error);
    }

    if (status === 409) {
      console.log(`Fleet API Duplicate Detection: ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - 409`);
      return Promise.reject(error);
    }

    const shouldRetry = (
      !originalRequest._retry &&
      (originalRequest.retry || 0) < API_CONFIG.MAX_RETRIES &&
      (error.code === 'ECONNABORTED' || 
       error.message.includes('Network Error') ||
       (status >= 500)) &&
      !originalRequest.url?.includes('upload')
    );

    if (shouldRetry) {
      originalRequest._retry = true;
      originalRequest.retry = (originalRequest.retry || 0) + 1;

      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest.retry - 1);
      console.log(`Retrying fleet request (${originalRequest.retry}/${API_CONFIG.MAX_RETRIES}): ${originalRequest.url}`);

      await sleep(delay);
      return fleetApiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const fleetApiCall = async (endpoint, options = {}) => {
  try {
    const config = {
      url: endpoint,
      method: 'get',
      ...options
    };

    const response = await fleetApiClient(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    if (status === 409 && responseData?.duplicates) {
      const enhancedError = new Error(responseData.message || 'Duplicate data detected');
      enhancedError.status = 409;
      enhancedError.data = responseData;
      enhancedError.duplicates = responseData.duplicates;
      throw enhancedError;
    }

    const enhancedError = new Error(`Fleet API call failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = status;
    enhancedError.statusText = error.response?.statusText;
    enhancedError.response = error.response;
    enhancedError.data = responseData;
    throw enhancedError;
  }
};

export const getLarkRecords = async () => {
  try {
    await sleep(500);
    return await fleetApiCall('/records/active');
  } catch (error) {
    throw new Error(`Gagal mengambil data Lark: ${error.message}`);
  }
};

export const refreshLarkToken = async () => {
  try {
    return await fleetApiCall('/lark/refresh-token', {
      method: 'post'
    });
  } catch (error) {
    throw new Error(`Gagal refresh token Lark: ${error.message}`);
  }
};

export const exportLarkData = async (exportPayload) => {
  try {
    const response = await fleetApiClient({
      url: '/records/export',
      method: 'post',
      data: {
        format: 'xlsx',
        data: exportPayload.data,
        fields: exportPayload.fields,
        searchTerm: exportPayload.searchTerm || '',
        filters: exportPayload.filters || {},
        sortConfig: exportPayload.sortConfig || {},
        dateRange: exportPayload.dateRange || null
      },
      responseType: 'blob'
    });

    return response.data;
  } catch (error) {
    throw new Error(`Gagal export data: ${error.message}`);
  }
};

export const exportFleetData = async (params = {}) => {
  try {
    const response = await fleetApiClient({
      url: '/fleet/export',
      method: 'post',
      data: {
        search: params.search || '',
        sortKey: params.sortKey || 'createdAt',
        sortDirection: params.sortDirection || 'desc',
        status: params.status || '',
        project: params.project || '',
        type: params.type || ''
      },
      responseType: 'blob',
      timeout: API_CONFIG.UPLOAD_TIMEOUT
    });

    return response.data;
  } catch (error) {
    throw new Error(`Gagal export data fleet: ${error.message}`);
  }
};

export const uploadFleetData = async (data, onProgress = null, replaceAll = false) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format: Expected non-empty array');
    }

    const requiredFields = ['name', 'vehNumb'];
    const firstRecord = data[0];
    const missingFields = requiredFields.filter(field => !firstRecord[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const totalRecords = data.length;
    const batchSize = API_CONFIG.BATCH_SIZE;
    const totalBatches = Math.ceil(totalRecords / batchSize);

    console.log(`Starting fleet ${replaceAll ? 'replacement' : 'upload'}: ${totalRecords} records in ${totalBatches} batches`);

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let allErrors = [];

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
      const maxRetries = 3;

      while (!batchSuccess && retryCount < maxRetries) {
        try {
          const config = {
            method: 'post',
            data: batch,
            timeout: API_CONFIG.UPLOAD_TIMEOUT,
          };

          if (replaceAll && currentBatch === 1) {
            config.headers = { 'x-replace-data': 'true' };
          }

          const result = await fleetApiCall('/fleet/upload', config);

          if (result.summary?.totalRecords || result.count) {
            const processedInBatch = result.summary?.totalRecords || result.count;
            totalSuccessful += processedInBatch;
            batchSuccess = true;
          } else {
            throw new Error('Invalid server response');
          }
        } catch (batchError) {
          if (batchError.status === 409) {
            throw batchError;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            const retryDelay = 2000 * Math.pow(2, retryCount - 1);
            await sleep(retryDelay);
          } else {
            const errorMessage = `Batch ${currentBatch} failed: ${batchError.message}`;
            allErrors.push(errorMessage);
            console.error(errorMessage);

            if (currentBatch === 1) {
              throw new Error(`First batch failed: ${batchError.message}`);
            }
            break;
          }
        }
      }

      totalProcessed += batch.length;

      if (currentBatch < totalBatches && batchSuccess) {
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

    if (totalSuccessful === 0) {
      throw new Error('No records were successfully uploaded');
    }

    return {
      success: true,
      message: replaceAll 
        ? `Fleet data berhasil diganti: ${totalSuccessful} records baru menggantikan semua data lama`
        : `Fleet data berhasil diunggah: ${totalSuccessful} records tersimpan dari ${totalProcessed}`,
      totalRecords: totalSuccessful,
      totalProcessed: totalProcessed,
      totalBatches: totalBatches,
      errors: allErrors,
      partialSuccess: allErrors.length > 0 && totalSuccessful > 0
    };
  } catch (error) {
    console.error('Fleet upload failed:', error.message);
    
    if (error.status === 409) {
      throw error;
    }
    
    throw new Error(`Gagal mengunggah data fleet: ${error.message}`);
  }
};

export const getFleetData = async (params = {}) => {
  try {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search || '',
      sortKey: params.sortKey || 'createdAt',
      sortDirection: params.sortDirection || 'desc',
      status: params.status || '',
      project: params.project || '',
      type: params.type || '',
      statusFilter: params.statusFilter || 'all'
    };

    return await fleetApiCall('/fleet/data', {
      method: 'get',
      params: queryParams,
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data fleet: ${error.message}`);
  }
};

export const getFleetFilters = async () => {
  try {
    return await fleetApiCall('/fleet/filters', {
      method: 'get',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal mengambil filter fleet: ${error.message}`);
  }
};

export const updateFleetData = async (id, data) => {
  try {
    if (!id) {
      throw new Error('ID fleet tidak valid');
    }

    const requiredFields = ['name', 'vehNumb'];
    const missingFields = requiredFields.filter(field => !data[field] || !data[field].toString().trim());

    if (missingFields.length > 0) {
      throw new Error(`Field wajib tidak boleh kosong: ${missingFields.join(', ')}`);
    }

    return await fleetApiCall(`/fleet/data/${id}`, {
      method: 'put',
      data: data,
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal memperbarui data fleet: ${error.message}`);
  }
};

export const deleteFleetData = async (id) => {
  try {
    if (!id) {
      throw new Error('ID fleet tidak valid');
    }

    return await fleetApiCall(`/fleet/data/${id}`, {
      method: 'delete',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal menghapus data fleet: ${error.message}`);
  }
};

export const deleteMultipleFleetData = async (ids) => {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('ID fleet tidak valid');
    }

    return await fleetApiCall('/fleet/data/bulk-delete', {
      method: 'delete',
      data: { ids },
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal menghapus data fleet: ${error.message}`);
  }
};

export const getFleetDataByPlat = async (vehNumb) => {
  try {
    if (!vehNumb || typeof vehNumb !== 'string' || !vehNumb.trim()) {
      throw new Error('Nomor kendaraan tidak valid');
    }

    return await fleetApiCall(`/fleet/plat/${encodeURIComponent(vehNumb.trim())}`, {
      method: 'get',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data fleet berdasarkan nomor kendaraan: ${error.message}`);
  }
};

export const deleteAllFleetData = async () => {
  try {
    return await fleetApiCall('/fleet/data', {
      method: 'delete',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal menghapus data fleet: ${error.message}`);
  }
};

export const getFleetInfo = async () => {
  try {
    return await fleetApiCall('/fleet/info', {
      method: 'get',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal mengambil info fleet: ${error.message}`);
  }
};

export const healthCheck = async () => {
  try {
    const start = Date.now();
    const response = await fleetApiCall('/health');
    const duration = Date.now() - start;

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

export default fleetApiClient;