import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MitraAuthContext = createContext(null);

const API_BASE_URL = 'https://backend-pms-production-0cec.up.railway.app/api';

export const MitraAuthProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mitra_token'));
  const [loading, setLoading] = useState(true);
  const [blitzAccessToken, setBlitzAccessToken] = useState(
    localStorage.getItem('blitz_access_token') || null
  );
  const [blitzCredentials, setBlitzCredentials] = useState(null);
  const [isNewLogin, setIsNewLogin] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('mitra_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/mitra-auth/verify`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (response.data.success) {
          const driverData = response.data.driver;
          setDriver(driverData);
          setToken(storedToken);
          setIsNewLogin(false);

          const existingBlitzToken = localStorage.getItem('blitz_access_token');

          if (existingBlitzToken) {
            setBlitzAccessToken(existingBlitzToken);
          } else {
            await loginToBlitzViaBackend(storedToken);
          }
        } else {
          clearLocalStorage();
          setToken(null);
          setDriver(null);
        }
      } catch {
        clearLocalStorage();
        setToken(null);
        setDriver(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem('mitra_token');
    localStorage.removeItem('blitz_access_token');
  };

  const authHeaders = (mitraToken) => ({
    Authorization: `Bearer ${mitraToken}`
  });

  const clearBlitzTokenCache = async (mitraToken) => {
    try {
      await axios.post(`${API_BASE_URL}/blitz-proxy/clear-cache`, {}, {
        headers: authHeaders(mitraToken)
      });
    } catch {
    }
  };

  const loginToBlitzViaBackend = async (mitraToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blitz-proxy/token`, {
        headers: authHeaders(mitraToken)
      });

      if (response.data.success && response.data.token) {
        const accessToken = response.data.token;
        setBlitzAccessToken(accessToken);
        localStorage.setItem('blitz_access_token', accessToken);
        return accessToken;
      }

      throw new Error('Failed to get Blitz token from backend');
    } catch {
      return null;
    }
  };

  const ensureBlitzToken = async () => {
    if (blitzAccessToken) return blitzAccessToken;

    const newToken = await loginToBlitzViaBackend(token);
    if (newToken) return newToken;

    throw new Error('Could not obtain Blitz access token');
  };

  const login = async (driver_id, driver_phone, project) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/mitra-auth/login`, {
        driver_id,
        driver_phone,
        project
      });

      if (response.data.success) {
        const { token: newToken, driver: newDriver } = response.data;

        clearLocalStorage();
        setBlitzAccessToken(null);
        setBlitzCredentials(null);

        localStorage.setItem('mitra_token', newToken);
        setToken(newToken);
        setDriver(newDriver);
        setIsNewLogin(true);

        if (newDriver.blitz_username && newDriver.blitz_password) {
          setBlitzCredentials({
            username: newDriver.blitz_username,
            password: newDriver.blitz_password
          });
        }

        await loginToBlitzViaBackend(newToken);

        return { success: true, driver: newDriver, isNewLogin: true };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await clearBlitzTokenCache(token);
        await axios.post(`${API_BASE_URL}/mitra-auth/logout`, {}, {
          headers: authHeaders(token)
        });
      }
    } catch {
    } finally {
      clearLocalStorage();
      setToken(null);
      setDriver(null);
      setBlitzAccessToken(null);
      setBlitzCredentials(null);
      setIsNewLogin(false);
    }
  };

  const refreshDriver = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/mitra-auth/verify`, {
        headers: authHeaders(token)
      });

      if (response.data.success) {
        setDriver(response.data.driver);
      }
    } catch {
    }
  };

  const fetchDriverProfile = async (driverId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blitz-proxy/driver-profile/${driverId}`, {
        headers: authHeaders(token),
        timeout: 30000
      });

      if (response.data.success) {
        const accountStatus = response.data.data?.driver_profile?.driver_Details?.account_state?.status || 'unknown';
        return { accountStatus, profileData: response.data.data };
      }

      return { accountStatus: 'unknown', profileData: null };
    } catch {
      return { accountStatus: 'unknown', profileData: null };
    }
  };

  const fetchActiveBatchId = async (driverId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blitz-proxy/active-batch/${driverId}`, {
        headers: authHeaders(token),
        timeout: 30000
      });

      if (response.data.success && response.data.batchId) {
        return response.data.batchId;
      }

      return null;
    } catch {
      return null;
    }
  };

  const fetchDriverAttendanceStatus = async (driverPhone) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blitz-proxy/driver-attendance/${driverPhone}`, {
        headers: authHeaders(token),
        timeout: 30000
      });

      if (response.data.success) {
        return response.data.status || 'offline';
      }

      return 'offline';
    } catch {
      return 'offline';
    }
  };

  const assignOrders = async (orderIds, activeBatchId, validationData) => {
    if (!token || !driver) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/merchant-orders/${driver.project}/assign-with-blitz`,
        {
          orderIds,
          driverId: driver.driver_id,
          driverName: driver.driver_name,
          driverPhone: driver.driver_phone,
          activeBatchId,
          validationData
        },
        {
          headers: authHeaders(token),
          timeout: 180000
        }
      );

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || 'Assignment failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Assignment failed',
        error: error.message
      };
    }
  };

  const value = {
    driver,
    token,
    loading,
    login,
    logout,
    refreshDriver,
    assignOrders,
    fetchActiveBatchId,
    fetchDriverAttendanceStatus,
    fetchDriverProfile,
    ensureBlitzToken,
    isAuthenticated: !!token && !!driver,
    isNewLogin,
    isBlitzReady: !!blitzAccessToken
  };

  return <MitraAuthContext.Provider value={value}>{children}</MitraAuthContext.Provider>;
};

export const useMitraAuth = () => {
  const context = useContext(MitraAuthContext);
  if (!context) {
    throw new Error('useMitraAuth must be used within a MitraAuthProvider');
  }
  return context;
};