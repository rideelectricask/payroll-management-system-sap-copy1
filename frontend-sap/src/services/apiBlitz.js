import axios from 'axios';

const BACKEND_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api',
  TIMEOUT: 180000
};

const backendApiClient = axios.create({
  baseURL: BACKEND_API_CONFIG.BASE_URL,
  timeout: BACKEND_API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

backendApiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

backendApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getBulkMitraExtendedData = async (abortSignal = null) => {
  const startTime = Date.now();
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`📡 Requesting MitraExtended data (attempt ${attempt + 1}/${maxRetries})...`);
      
      const requestConfig = {
        timeout: 180000
      };

      if (abortSignal) {
        requestConfig.signal = abortSignal;
      }

      const response = await backendApiClient.get('/mitra/extended/bulk-all', requestConfig);

      if (!response.data?.success) {
        throw new Error('Invalid server response');
      }

      if (!Array.isArray(response.data.data)) {
        throw new Error('Expected array of mitra data');
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Received ${response.data.data.length.toLocaleString()} records in ${(duration/1000).toFixed(2)}s`);

      return response.data;

    } catch (error) {
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED') {
        console.log('⚠️ Request cancelled by user');
        throw new Error('Request cancelled by user');
      }

      attempt++;
      const duration = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn(`⏱️ Timeout on attempt ${attempt}/${maxRetries} after ${duration}ms`);
        
        if (attempt < maxRetries) {
          const retryDelay = 2000 * attempt;
          console.log(`🔄 Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      console.error(`❌ Request failed after ${duration}ms`);
      throw new Error(`Failed to fetch mitra extended data: ${error.message}`);
    }
  }
  
  throw new Error('Max retries reached for fetching mitra extended data');
};

let currentSyncId = null;

export const manualSyncMitraExtended = async (onProgress = null) => {
  try {
    console.log('🔄 Starting manual sync MitraExtended...');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}/mitra/extended/manual-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication failed. Please login again.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Only owner role can perform this action.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ Stream completed');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.syncId) {
              currentSyncId = data.syncId;
            }
            
            if (onProgress) {
              onProgress({
                current: data.percentage || 0,
                total: 100,
                percentage: data.percentage || 0,
                message: data.message || 'Processing...',
                stage: data.stage || 'processing'
              });
            }

            if (data.type === 'complete') {
              console.log('✅ Sync completed successfully');
              currentSyncId = null;
              return data.data || { success: true };
            }

            if (data.type === 'cancelled') {
              console.log('⚠️ Sync cancelled');
              currentSyncId = null;
              throw new Error('Sync cancelled by user');
            }

            if (data.type === 'error') {
              currentSyncId = null;
              throw new Error(data.error || 'Sync failed');
            }

          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        }
      }
    }

    currentSyncId = null;
    return { success: true };

  } catch (error) {
    console.error('❌ Manual sync error:', error.message);
    currentSyncId = null;
    throw new Error(`Failed to sync MitraExtended: ${error.message}`);
  }
};

export const cancelMitraExtendedSync = async () => {
  try {
    console.log('🛑 Cancelling MitraExtended sync...');
    
    const requestBody = currentSyncId ? { syncId: currentSyncId } : {};
    
    const response = await backendApiClient.post('/mitra/extended/cancel-sync', requestBody);
    
    console.log('✅ Cancel request sent successfully');
    currentSyncId = null;
    
    return response.data;
  } catch (error) {
    console.error('❌ Cancel sync error:', error.message);
    currentSyncId = null;
    throw new Error(`Failed to cancel sync: ${error.message}`);
  }
};

export const fetchExtendedDataByDriverId = async (driverId) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const response = await backendApiClient.get(`/mitra/extended/${driverId}`);
    return response.data?.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Extended data fetch failed:', error.message);
    throw new Error(`Failed to fetch extended data: ${error.message}`);
  }
};

export const saveExtendedData = async (driverId, extendedData) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const response = await backendApiClient.put(`/mitra/extended/${driverId}`, extendedData);
    return response.data;
  } catch (error) {
    console.error('Save extended data failed:', error.message);
    throw new Error(`Failed to save extended data: ${error.message}`);
  }
};

export const deleteExtendedData = async (driverId) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const response = await backendApiClient.delete(`/mitra/extended/${driverId}`);
    return response.data;
  } catch (error) {
    console.error('Delete extended data failed:', error.message);
    throw new Error(`Failed to delete extended data: ${error.message}`);
  }
};

export default backendApiClient;