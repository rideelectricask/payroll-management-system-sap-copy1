import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchData, fetchDriverData, cacheUtils } from '../services/api';

const ROWS_PER_PAGE = 50;

export const useTableData = (selectedTags) => {
  const [data, setData] = useState([]);
  const [driverMap, setDriverMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  const clearCache = useCallback(() => {
    try {
      if (cacheUtils && typeof cacheUtils.clear === 'function') {
        cacheUtils.clear();
        console.log('All caches cleared completely');
      }
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  }, []);

  const loadDriverData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clearCache();
      }
      console.log('Fetching driver data...');
      const drivers = await fetchDriverData();
      const map = {};
      (drivers || []).forEach((driver) => {
        map[driver.username] = driver.fullName;
      });
      setDriverMap(map);
      console.log(`Driver data loaded: ${Object.keys(map).length} drivers`);
    } catch (err) {
      console.error('❌ Failed to fetch driver data:', err.message);
      setError('Failed to load driver data');
    }
  }, [clearCache]);

  const loadData = useCallback(async (forceClearCache = false) => {
    setLoading(true);
    setError(null);

    try {
      if (forceClearCache) {
        clearCache();
      }

      console.log('Fetching table data...', { selectedTags: selectedTags.length });
      const result = await fetchData(selectedTags);

      console.log('Raw API Response:', result);

      let processedData = [];
      
      if (Array.isArray(result)) {
        processedData = result;
      } else if (result && typeof result === 'object') {
        if (Array.isArray(result.data)) {
          processedData = result.data;
        } else if (result.records && Array.isArray(result.records)) {
          processedData = result.records;
        }
      }

      console.log('Processed data length:', processedData.length);

      if (processedData.length > 0) {
        console.log('Sample first record keys:', Object.keys(processedData[0]));
        console.log('Sample first record:', processedData[0]);
      }

      const validData = processedData.filter(row => {
        if (!row || typeof row !== 'object') return false;
        return Object.keys(row).length > 1;
      });

      console.log('Valid data length:', validData.length);

      setData(validData);
      setDataVersion(prev => prev + 1);
      setLastRefreshTime(Date.now());
      console.log(`✅ Table data loaded successfully: ${validData.length} records`);
    } catch (err) {
      console.error('❌ Failed to fetch data:', err);
      setError('Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, clearCache]);

  const refreshData = useCallback(async () => {
    console.log('Refreshing table data with full cache clear...');
    clearCache();
    await Promise.all([
      loadDriverData(true),
      loadData(true)
    ]);
    console.log('Table data refreshed successfully');
  }, [loadData, loadDriverData, clearCache]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCourierNameForDisplay = useCallback((row) => {
    if (row["Courier Name"] && row["Courier Name"].toString().trim() !== "") {
      return row["Courier Name"];
    }
    if (row["Courier Code"] && driverMap[row["Courier Code"]]) {
      return driverMap[row["Courier Code"]];
    }
    return "";
  }, [driverMap]);

  const getLocationForDisplay = useCallback((row) => {
    const latLong = row["lat_long"];
    const locationExpected = row["Location Expected"];

    const isValidValue = (value) => {
      return value !== null && 
        value !== undefined && 
        value.toString().trim() !== "" &&
        value.toString().trim() !== "0" &&
        value.toString().trim() !== "null" &&
        value.toString().trim() !== "undefined";
    };

    if (isValidValue(latLong)) {
      return latLong.toString().trim();
    } else if (isValidValue(locationExpected)) {
      return locationExpected.toString().trim();
    }

    return "";
  }, []);

  return {
    data,
    driverMap,
    loading,
    error,
    getCourierNameForDisplay,
    getLocationForDisplay,
    refreshData,
    dataVersion,
    lastRefreshTime,
    ROWS_PER_PAGE
  };
};