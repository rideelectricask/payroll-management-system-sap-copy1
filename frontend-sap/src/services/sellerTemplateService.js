const API_BASE_URL = 'https://driver-api.rideblitz.id/v2/panel';
const BUSINESS_HUB_URL = 'https://driver-api.rideblitz.id/panel';

const getAuthToken = () => {
  const storedToken = localStorage.getItem('driver_api_token');
  if (storedToken && storedToken !== 'undefined' && storedToken.trim() !== '') {
    return storedToken;
  }
  
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNSwidXNlcl9uYW1lIjoibWVyYXBpIiwicm9sZSI6InBhbmVsIiwic2NvcGUiOlsicGFuZWwiLCJkcml2ZXJhcHAtYW5kcm9pZCJdLCJleHAiOjE3NzM5ODk0MjMsImp0aSI6Im1lcmFwaSIsImlhdCI6MTc3MTM5NzQyM30.h-RUgSerIhQFjecxDr7yUZ25zpJGCA8zMKMuadmtOaE';
};

export const getDriverList = async (params = {}) => {
  const {
    sort = -1,
    status = [1, 2, 8, 3, 4, 5, 6, 7],
    attendance = '',
    page = 1,
    offset = 10000,
    term = '',
    app_version_name = '',
    bank_info_provided = 'undefined',
  } = params;

  const statusParams = status.map(s => `status=${s}`).join('&');
  const queryString = `sort=${sort}&${statusParams}&attendance=${attendance}&page=${page}&offset=${offset}&term=${term}&app_version_name=${app_version_name}&bank_info_provided=${bank_info_provided}`;

  return retryWithBackoff(async () => {
    const controller = createAbortController(REQUEST_TIMEOUT);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/driver-list?${queryString}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': token,
        },
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('driver_api_token');
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  });
};

export const getBusinessHub = async (driverId = 0) => {
  return retryWithBackoff(async () => {
    const controller = createAbortController(REQUEST_TIMEOUT);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${BUSINESS_HUB_URL}/business-hub/${driverId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': token,
        },
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('driver_api_token');
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  });
};

export const getAllBusinessHubData = async () => {
  try {
    console.log('Fetching business hub data from:', `${BUSINESS_HUB_URL}/business-hub/0`);
    const response = await getBusinessHub(0);
    
    console.log('Business hub response:', response);

    if (!response || !response.data) {
      console.warn('Invalid response structure');
      return { hubData: {}, businessData: {} };
    }

    const responseData = response.data;
    const hubData = {};
    const businessData = {};

    if (responseData.hub_data && typeof responseData.hub_data === 'object') {
      Object.entries(responseData.hub_data).forEach(([id, name]) => {
        hubData[id] = name;
      });
    }

    if (responseData.business_data && typeof responseData.business_data === 'object') {
      Object.entries(responseData.business_data).forEach(([id, name]) => {
        businessData[id] = name;
      });
    }

    console.log(`✅ Loaded ${Object.keys(hubData).length} hubs and ${Object.keys(businessData).length} businesses`);
    
    return { hubData, businessData };
  } catch (error) {
    console.error('❌ Failed to fetch business hub data:', error);
    return { hubData: {}, businessData: {} };
  }
};

export const autoLogin = async () => {
  const token = getAuthToken();
  
  if (!token || token === 'undefined' || token.trim() === '') {
    console.error('No valid token available');
    return false;
  }
  
  try {
    const testResponse = await fetch(`${BUSINESS_HUB_URL}/business-hub/0`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': token,
      },
    });

    if (testResponse.status === 401) {
      localStorage.removeItem('driver_api_token');
      console.error('Token expired or invalid');
      return false;
    }

    return testResponse.ok;
  } catch (error) {
    console.error('Auto login failed:', error);
    return false;
  }
};