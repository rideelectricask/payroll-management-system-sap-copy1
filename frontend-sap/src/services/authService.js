const API_BASE_URL = 'https://driver-api.rideblitz.id/v2/panel';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNSwidXNlcl9uYW1lIjoibWVyYXBpIiwicm9sZSI6InBhbmVsIiwic2NvcGUiOlsicGFuZWwiLCJkcml2ZXJhcHAtYW5kcm9pZCJdLCJleHAiOjE3NzM5ODk0MjMsImp0aSI6Im1lcmFwaSIsImlhdCI6MTc3MTM5NzQyM30.h-RUgSerIhQFjecxDr7yUZ25zpJGCA8zMKMuadmtOaE';

const MAX_CONCURRENT_REQUESTS = 10;
const OFFSET_PER_PAGE = 100;
const REQUEST_TIMEOUT = 45000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;
const BATCH_DELAY = 300;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createAbortController = (timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  return controller;
};

const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetryableError = 
        error.message.includes('timeout') || 
        error.message.includes('network') || 
        error.message.includes('fetch') ||
        error.message.includes('aborted');
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      const backoffDelay = delay * Math.pow(1.5, attempt);
      console.warn(`Retry attempt ${attempt + 1}/${retries} after ${backoffDelay}ms`);
      await sleep(backoffDelay);
    }
  }
};

export const getDriverList = async (params = {}) => {
  const {
    sort = -1,
    status = [1, 2, 8, 3, 4, 5, 6, 7],
    attendance = '',
    page = 1,
    offset = 100,
    term = '',
    app_version_name = '',
    bank_info_provided = 'undefined',
  } = params;

  const statusParams = status.map(s => `status=${s}`).join('&');
  const queryString = `sort=${sort}&${statusParams}&attendance=${attendance}&page=${page}&offset=${offset}&term=${term}&app_version_name=${app_version_name}&bank_info_provided=${bank_info_provided}`;

  return retryWithBackoff(async () => {
    const controller = createAbortController(REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}/driver-list?${queryString}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': AUTH_TOKEN,
          'Connection': 'keep-alive',
        },
        signal: controller.signal,
        keepalive: true
      });

      if (!response.ok) {
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

export const autoLogin = async () => {
  return true;
};