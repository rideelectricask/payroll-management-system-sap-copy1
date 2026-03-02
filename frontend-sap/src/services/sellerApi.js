import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };
    return Promise.reject(customError);
  }
);

export const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', data = null, timeout = 30000 } = options;

  try {
    const response = await axiosInstance({
      url: endpoint,
      method,
      data,
      timeout,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSellerData = async () => {
  try {
    const response = await apiCall('/seller/data');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching seller data:', error);
    throw error;
  }
};

export const uploadSellerData = async (data) => {
  try {
    const response = await apiCall('/seller/upload', {
      method: 'POST',
      data,
      timeout: 30000,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateSeller = async (id, data) => {
  try {
    const response = await apiCall(`/seller/data/${id}`, {
      method: 'PUT',
      data,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteSeller = async (id) => {
  try {
    const response = await apiCall(`/seller/data/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const bulkDeleteSeller = async (ids) => {
  try {
    const response = await apiCall('/seller/data/bulk-delete', {
      method: 'DELETE',
      data: { ids },
    });
    return response;
  } catch (error) {
    throw error;
  }
};