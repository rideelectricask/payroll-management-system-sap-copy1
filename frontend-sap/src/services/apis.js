import axios from 'axios';

const API_CONFIG = {
  BASE_URL: 'https://backend-pms-production-0cec.up.railway.app/api',
  TIMEOUT: 90000,
  UPLOAD_TIMEOUT: 300000,
  COMPARE_TIMEOUT: 300000,
  BATCH_COMPARE_TIMEOUT: 600000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 3000,
  COMPARE_BATCH_SIZE: 500,
};

const apiClient = axios.create({
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
      console.log(`API ${success ? 'Success' : 'Error'}: ${requestId} - ${duration}ms`, 
        error ? { error: error.message } : {});
      this.requests.delete(requestId);
      return duration;
    }
    return 0;
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

apiClient.interceptors.request.use(
  (config) => {
    const requestId = `${config.method?.toUpperCase()}_${config.url}_${Date.now()}`;
    config.requestId = requestId;
    performanceMonitor.start(requestId);

    if (config.url?.includes('compare') || config.url?.includes('batch-compare')) {
      config.timeout = API_CONFIG.COMPARE_TIMEOUT;
    } else if (config.url?.includes('upload')) {
      config.timeout = API_CONFIG.UPLOAD_TIMEOUT;
    }

    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest) {
      performanceMonitor.end(originalRequest.requestId, false, error);
    }

    const shouldRetry = (
      !originalRequest._retry &&
      (originalRequest.retry || 0) < API_CONFIG.MAX_RETRIES &&
      (error.code === 'ECONNABORTED' || 
       error.message.includes('Network Error') ||
       (error.response?.status >= 500)) &&
      !originalRequest.url?.includes('upload') &&
      !originalRequest.url?.includes('batch-compare')
    );

    if (shouldRetry) {
      originalRequest._retry = true;
      originalRequest.retry = (originalRequest.retry || 0) + 1;

      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest.retry - 1);
      console.log(`Retrying request (${originalRequest.retry}/${API_CONFIG.MAX_RETRIES}): ${originalRequest.url}`);

      await sleep(delay);
      return apiClient(originalRequest);
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
    const enhancedError = new Error(`API call failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.statusText = error.response?.statusText;
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

export const getSayurboxData = async () => {
  try {
    return await apiCall('/sayurbox/data', {
      method: 'get',
      timeout: 180000
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data Sayurbox: ${error.message}`);
  }
};

export const getSayurboxDataPaginated = async (page = 1, limit = 1000) => {
  try {
    const data = await apiCall('/sayurbox/data', {
      method: 'get',
      params: { page, limit },
      timeout: 180000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return data;
  } catch (error) {
    throw new Error(`Gagal mengambil data Sayurbox: ${error.message}`);
  }
};

export const getEData = async () => {
  try {
    return await apiCall('/sayurbox/edata', {
      method: 'get',
      timeout: API_CONFIG.TIMEOUT
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data EData: ${error.message}`);
  }
};

export const getExcelData = async () => {
  try {
    return await apiCall('/data', {
      method: 'get', 
      timeout: 180000
    });
  } catch (error) {
    throw new Error(`Gagal mengambil data Excel: ${error.message}`);
  }
};

export const compareDataSayurbox = async () => {
  try {
    return await apiCall('/sayurbox/compare', {
      method: 'post',
      timeout: API_CONFIG.COMPARE_TIMEOUT
    });
  } catch (error) {
    throw new Error(`Compare data gagal: ${error.message}`);
  }
};

export const compareDataSayurboxBatch = async (onProgress = null) => {
  try {
    console.log('Starting compare process - loading data from database...');

    if (onProgress) {
      onProgress({ current: 0, total: 1, stage: 'loading_sayurbox', percentage: 0 });
    }

    let allSayurboxData = [];
    let sayurboxPage = 1;
    let sayurboxHasMore = true;
    const sayurboxLimit = 1000;

    while (sayurboxHasMore) {
      const response = await getSayurboxDataPaginated(sayurboxPage, sayurboxLimit);
      const chunk = response?.data || [];
      
      if (chunk.length > 0) {
        allSayurboxData = allSayurboxData.concat(chunk);
        
        if (onProgress) {
          onProgress({
            current: allSayurboxData.length,
            total: response.total || allSayurboxData.length,
            stage: 'loading_sayurbox',
            percentage: response.total ? Math.round((allSayurboxData.length / response.total) * 100) : 0
          });
        }
      }

      sayurboxHasMore = chunk.length === sayurboxLimit && response.total > allSayurboxData.length;
      sayurboxPage++;

      if (sayurboxPage > 100) break;
    }

    if (allSayurboxData.length === 0) {
      throw new Error('Data Sayurbox kosong di database. Silakan upload data Sayurbox terlebih dahulu.');
    }

    console.log(`Loaded ${allSayurboxData.length} Sayurbox records from database`);

    if (onProgress) {
      onProgress({ current: 0, total: 1, stage: 'loading_excel', percentage: 0 });
    }

    const excelResult = await getExcelData();
    const allExcelData = excelResult?.data || excelResult || [];

    if (!Array.isArray(allExcelData) || allExcelData.length === 0) {
      throw new Error('Data Excel kosong di database. Silakan upload data Excel terlebih dahulu.');
    }

    console.log(`Loaded ${allExcelData.length} Excel records from database`);

    const BATCH_SIZE = 500;
    const sayurboxMap = new Map();
    
    allSayurboxData.forEach(item => {
      if (item.orderNo) {
        const trimmedOrderNo = item.orderNo.toString().trim();
        sayurboxMap.set(trimmedOrderNo, {
          distanceInKm: parseFloat(item.distanceInKm) || 0,
          totalWeightPerorder: parseFloat(item.totalWeightPerorder) || 0
        });
      }
    });
    
    let totalChecked = 0;
    let totalMatched = 0;
    const unmatchedExcel = [];
    const unmatchedSayurbox = new Set();
    
    allSayurboxData.forEach(item => {
      if (item.orderNo) {
        unmatchedSayurbox.add(item.orderNo.toString().trim());
      }
    });
    
    const totalBatches = Math.ceil(allExcelData.length / BATCH_SIZE);
    
    console.log(`Starting comparison: ${totalBatches} batches to process`);

    for (let i = 0; i < allExcelData.length; i += BATCH_SIZE) {
      const batch = allExcelData.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      const batchOrderCodes = [];
      
      batch.forEach(excelItem => {
        const orderCode = excelItem["Order Code"];
        if (orderCode) {
          const trimmedOrderCode = orderCode.toString().trim();
          totalChecked++;
          
          if (sayurboxMap.has(trimmedOrderCode)) {
            totalMatched++;
            batchOrderCodes.push(trimmedOrderCode);
            unmatchedSayurbox.delete(trimmedOrderCode);
          } else {
            unmatchedExcel.push(trimmedOrderCode);
          }
        }
      });
      
      if (batchOrderCodes.length > 0) {
        try {
          const batchUpdateData = batchOrderCodes.map(orderCode => {
            const sayurboxData = sayurboxMap.get(orderCode);
            return {
              orderCode,
              distance: sayurboxData.distanceInKm,
              weight: sayurboxData.totalWeightPerorder
            };
          });

          await apiCall('/batch-compare', {
            method: 'post',
            data: { updateData: batchUpdateData },
            timeout: 180000
          });
          console.log(`Batch ${batchNumber}/${totalBatches}: ${batchOrderCodes.length} records matched and updated`);
        } catch (batchError) {
          console.warn(`Batch ${batchNumber} compare warning:`, batchError.message);
        }
      }
      
      if (onProgress) {
        onProgress({
          current: i + batch.length,
          total: allExcelData.length,
          batchNumber,
          totalBatches,
          stage: 'comparing',
          percentage: Math.round(((i + batch.length) / allExcelData.length) * 100)
        });
      }
      
      await sleep(100);
    }
    
    console.log(`Compare completed: ${totalMatched} matched, ${unmatchedExcel.length} unmatched Excel, ${unmatchedSayurbox.size} unmatched Sayurbox`);

    return {
      success: true,
      summary: {
        totalChecked,
        totalUpdated: totalMatched,
        matchedRecords: totalMatched,
        notMatchedRecords: totalChecked - totalMatched,
        unmatchedExcelCount: unmatchedExcel.length,
        unmatchedSayurboxCount: unmatchedSayurbox.size
      },
      unmatchedExcelCodes: unmatchedExcel.slice(0, 50),
      unmatchedSayurboxCodes: Array.from(unmatchedSayurbox).slice(0, 50),
      displayInfo: {
        excelDisplayed: Math.min(unmatchedExcel.length, 50),
        excelTotal: unmatchedExcel.length,
        sayurboxDisplayed: Math.min(unmatchedSayurbox.size, 50),
        sayurboxTotal: unmatchedSayurbox.size
      }
    };
  } catch (error) {
    console.error('Batch compare error:', error);
    throw new Error(`Batch compare gagal: ${error.message}`);
  }
};

export const compareOrderCodeData = async (orderCode) => {
  try {
    if (!orderCode || typeof orderCode !== 'string' || !orderCode.trim()) {
      throw new Error('Order Code tidak valid');
    }

    return await apiCall('/sayurbox/compare-order', {
      method: 'post',
      data: { orderCode: orderCode.trim() },
      timeout: API_CONFIG.COMPARE_TIMEOUT
    });
  } catch (error) {
    throw new Error(`Compare order code gagal: ${error.message}`);
  }
};

export const compareDataByOrderCode = async (orderCode) => {
  try {
    if (!orderCode || typeof orderCode !== 'string' || !orderCode.trim()) {
      throw new Error('Order Code tidak valid');
    }

    return await apiCall('/compare-distance', {
      method: 'post',
      data: { orderCode: orderCode.trim() },
      timeout: API_CONFIG.COMPARE_TIMEOUT
    });
  } catch (error) {
    throw new Error(`Compare distance gagal: ${error.message}`);
  }
};

export const batchCompareAllData = async (orderCodes, onProgress = null) => {
  try {
    if (!orderCodes || !Array.isArray(orderCodes) || orderCodes.length === 0) {
      throw new Error('Order codes array tidak valid');
    }

    const validOrderCodes = orderCodes.map(code => code && typeof code === 'string' ? code.trim() : '').filter(Boolean);

    if (validOrderCodes.length === 0) {
      throw new Error('Tidak ada order codes yang valid');
    }

    const totalRecords = validOrderCodes.length;
    const batchSize = API_CONFIG.COMPARE_BATCH_SIZE;
    const totalBatches = Math.ceil(totalRecords / batchSize);

    console.log(`Starting batch compare: ${totalRecords} records in ${totalBatches} batches`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let allErrors = [];

    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = validOrderCodes.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      if (onProgress) {
        onProgress({
          current: totalProcessed,
          total: totalRecords,
          percentage: Math.round((totalProcessed / totalRecords) * 100)
        });
      }

      try {
        const result = await apiCall('/batch-compare', {
          method: 'post',
          data: { orderCodes: batch },
          timeout: API_CONFIG.BATCH_COMPARE_TIMEOUT
        });

        if (result.success) {
          totalUpdated += result.totalUpdated || 0;
          totalProcessed += batch.length;
        } else {
          allErrors.push(`Batch ${currentBatch}: ${result.message}`);
        }
      } catch (batchError) {
        const errorMessage = `Batch ${currentBatch} failed: ${batchError.message}`;
        allErrors.push(errorMessage);
        console.error(errorMessage);
      }

      if (currentBatch < totalBatches) {
        await sleep(500);
      }
    }

    if (onProgress) {
      onProgress({
        current: totalRecords,
        total: totalRecords,
        percentage: 100
      });
    }

    return {
      success: true,
      message: `Batch compare selesai: ${totalUpdated} data berhasil diperbarui dari ${totalProcessed} data`,
      totalProcessed: totalProcessed,
      totalUpdated: totalUpdated,
      totalBatches: totalBatches,
      errors: allErrors,
      partialSuccess: allErrors.length > 0 && totalUpdated > 0
    };

  } catch (error) {
    console.error('Batch compare failed:', error.message);
    throw new Error(`Gagal menjalankan batch compare: ${error.message}`);
  }
};

const createBatchUploadFunction = (endpoint, dataType) => {
  return async (data, onProgress = null) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format: Expected non-empty array');
      }

      const requiredFields = dataType === 'edata' 
        ? ['order_no', 'distance_in_km']
        : ['order_no'];

      const firstRecord = data[0];
      const missingFields = requiredFields.filter(field => !firstRecord[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const totalRecords = data.length;
      const batchSize = API_CONFIG.BATCH_SIZE;
      const totalBatches = Math.ceil(totalRecords / batchSize);

      console.log(`Starting segment upload: ${totalRecords} records in ${totalBatches} segments`);

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
            const result = await apiCall(endpoint, {
              method: 'post',
              data: batch,
              timeout: API_CONFIG.UPLOAD_TIMEOUT,
            });

            if (result.summary?.totalRecords || result.count) {
              const processedInBatch = result.summary?.totalRecords || result.count;
              totalSuccessful += processedInBatch;
              batchSuccess = true;
            } else {
              throw new Error('Invalid server response');
            }
          } catch (batchError) {
            retryCount++;
            if (retryCount < maxRetries) {
              const retryDelay = 2000 * Math.pow(2, retryCount - 1);
              await sleep(retryDelay);
            } else {
              const errorMessage = `Segment ${currentBatch} failed: ${batchError.message}`;
              allErrors.push(errorMessage);
              console.error(errorMessage);

              if (currentBatch === 1) {
                throw new Error(`First segment failed: ${batchError.message}`);
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
        message: `Data berhasil diunggah: ${totalSuccessful} records tersimpan dari ${totalProcessed}`,
        totalRecords: totalSuccessful,
        totalProcessed: totalProcessed,
        totalBatches: totalBatches,
        errors: allErrors,
        partialSuccess: allErrors.length > 0 && totalSuccessful > 0
      };
    } catch (error) {
      console.error('Segment upload failed:', error.message);
      throw new Error(`Gagal mengunggah data: ${error.message}`);
    }
  };
};

export const batchUploadToServer = createBatchUploadFunction('/sayurbox/upload', 'sayurbox');
export const batchUploadEDataToServer = createBatchUploadFunction('/sayurbox/edata-upload', 'edata');

export const appendDataToServer = async (data, onProgress = null) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format: Expected non-empty array');
    }

    const result = await batchUploadToServer(data, onProgress);
    return result;
  } catch (error) {
    console.error('Append data failed:', error.message);
    throw new Error(`Gagal menambahkan data: ${error.message}`);
  }
};

export const replaceDataToServer = async (data, onProgress = null) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format: Expected non-empty array');
    }

    const result = await batchUploadToServer(data, onProgress);
    return result;
  } catch (error) {
    console.error('Replace data failed:', error.message);
    throw new Error(`Gagal mengganti data: ${error.message}`);
  }
};

export const uploadDataToServer = async (data, onProgress = null) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format: Expected non-empty array');
    }

    const result = await batchUploadToServer(data, onProgress);
    return result;
  } catch (error) {
    console.error('Upload data failed:', error.message);
    throw new Error(`Gagal mengunggah data: ${error.message}`);
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
    const start = Date.now();
    const response = await apiCall('/health');
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

export default apiClient;