import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMitraAuth } from '../contexts/mitraAuthContext.jsx';
import { Package, User, Phone, Loader2, AlertCircle, Building2 } from 'lucide-react';

export default function MitraLogin() {
  const [driverId, setDriverId] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [project, setProject] = useState('jne');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useMitraAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mitra', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(driverId, driverPhone, project);
      if (result.success) {
        navigate('/mitra', { replace: true });
      } else {
        setError(result.message || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const projects = [
    { value: 'jne', label: 'JNE' },
    { value: 'mup', label: 'MUP' },
    { value: 'indomaret', label: 'Indomaret' },
    { value: 'unilever', label: 'Unilever' },
    { value: 'wings', label: 'Wings' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mitra Login</h1>
          <p className="text-gray-600">Sign in to Driver Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {projects.map((proj) => (
                  <option key={proj.value} value={proj.value}>
                    {proj.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-2">
              Driver ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="driver_id"
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Enter your driver ID"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="driver_phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="driver_phone"
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Use your Driver ID and registered phone number</p>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}
" File mitraAuthContext.jsx "
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
" File mitraAuthMiddleware.js "
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_MITRA_SECRET || 'pms-mitra-secret-key-2025';

const authenticateMitra = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'mitra') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    req.mitra = {
      driver_id: decoded.driver_id,
      driver_name: decoded.driver_name,
      driver_phone: decoded.driver_phone,
      project: decoded.project,
      user_id: decoded.user_id,
      blitz_username: decoded.blitz_username,
      blitz_password: decoded.blitz_password
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = { authenticateMitra };