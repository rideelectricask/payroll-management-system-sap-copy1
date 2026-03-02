import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useMitraAuth } from '../contexts/mitraAuthContext';
import { Package, User, Phone, LogOut, Loader2, RefreshCw, FileSpreadsheet, Search, Filter, SortAsc, SortDesc, CheckSquare, Square, Send, Lock, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://backend-pms-production-0cec.up.railway.app/api';

const createAuthAxios = (token) => {
  const instance = axios.create({ baseURL: API_BASE_URL });
  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return instance;
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const TERMINAL_ORDER_STATUSES = ['driver_cancel', 'cancelled'];
const isTerminalStatus = (status) => TERMINAL_ORDER_STATUSES.includes(status?.toLowerCase());

const TabButton = memo(({ id, label, icon, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
    }`}
  >
    {icon}{label}
  </button>
));

const AttendanceStatusBadge = memo(({ status }) => {
  const cfg = {
    online: { cls: 'bg-green-50 text-green-800 border-green-200', label: 'ONLINE', icon: '🟢' },
    offline: { cls: 'bg-red-50 text-red-800 border-red-200', label: 'OFFLINE', icon: '🔴' },
  }[status?.toLowerCase()] || { cls: 'bg-gray-50 text-gray-800 border-gray-200', label: status?.toUpperCase() || 'OFFLINE', icon: '⚪' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
});

const BlitzStatusBadge = memo(({ status, driverName }) => {
  const cfg = {
    batched: { cls: 'bg-purple-50 text-purple-800 border-purple-200', label: 'Batched', icon: '📦' },
    assigned: { cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Assigned', icon: '👤' },
    picked_up: { cls: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Picked Up', icon: '📤' },
    in_transit: { cls: 'bg-indigo-50 text-indigo-800 border-indigo-200', label: 'In Transit', icon: '🚚' },
    delivered: { cls: 'bg-green-50 text-green-800 border-green-200', label: 'Delivered', icon: '✅' },
    cancelled: { cls: 'bg-red-50 text-red-800 border-red-200', label: 'Cancelled', icon: '❌' },
    driver_cancel: { cls: 'bg-red-50 text-red-800 border-red-200', label: 'Driver Cancel', icon: '❌' },
  }[status?.toLowerCase()] || { cls: 'bg-gray-50 text-gray-800 border-gray-200', label: status || 'Available', icon: '📋' };
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
        {cfg.icon} {cfg.label}
      </span>
      {driverName && !isTerminalStatus(status) && (
        <span className="text-xs text-gray-500 truncate max-w-[150px]" title={driverName}>👤 {driverName}</span>
      )}
    </div>
  );
});

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3" />
      <p className="text-sm text-gray-600">Loading orders...</p>
    </div>
  </div>
));

export default function Mitra() {
  const { driver, token, logout, assignOrders, fetchActiveBatchId, fetchDriverAttendanceStatus } = useMitraAuth();

  const authAxiosRef = useRef(null);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
    authAxiosRef.current = createAuthAxios(token);
  }, [token]);

  if (!authAxiosRef.current) {
    authAxiosRef.current = createAuthAxios(token);
  }

  const [activeTab, setActiveTab] = useState('profile');
  const [allOrders, setAllOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [blitzOrdersData, setBlitzOrdersData] = useState({});
  const [batchDriverData, setBatchDriverData] = useState({});
  const [isFetchingBlitzData, setIsFetchingBlitzData] = useState(false);
  const [unassigningOrders, setUnassigningOrders] = useState(new Set());
  const [isBulkUnassigning, setIsBulkUnassigning] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [isLoadingBatchId, setIsLoadingBatchId] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('offline');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [assignmentFilter, setAssignmentFilter] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const hasLoadedOrdersRef = useRef(false);
  const driverRef = useRef(driver);

  useEffect(() => { driverRef.current = driver; }, [driver]);

  const projectMapping = { jne: 'JNE', mup: 'MUP', indomaret: 'Indomaret', unilever: 'Unilever', wings: 'Wings' };
  const assignmentStatuses = useMemo(() => ['unassigned', 'assigned', 'created', 'in_progress', 'completed', 'cancelled'], []);

  useEffect(() => {
    if (!driver && !token) window.location.href = '/login-mitra';
  }, [driver, token]);

  useEffect(() => {
    if (driver?.driver_id && driver?.driver_phone && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setIsLoadingBatchId(true);
      setIsLoadingAttendance(true);
      fetchDriverAttendanceStatus(driver.driver_phone)
        .then(s => setAttendanceStatus(s))
        .catch(() => setAttendanceStatus('offline'))
        .finally(() => setIsLoadingAttendance(false));
      fetchActiveBatchId(driver.driver_id)
        .then(b => setActiveBatchId(b))
        .catch(() => setActiveBatchId(null))
        .finally(() => setIsLoadingBatchId(false));
    }
  }, [driver, fetchActiveBatchId, fetchDriverAttendanceStatus]);

  const loadActiveBatchId = useCallback(async () => {
    const d = driverRef.current;
    if (!d?.driver_id) return;
    setIsLoadingBatchId(true);
    try { setActiveBatchId(await fetchActiveBatchId(d.driver_id)); }
    catch { }
    finally { setIsLoadingBatchId(false); }
  }, [fetchActiveBatchId]);

  const loadAttendanceStatus = useCallback(async () => {
    const d = driverRef.current;
    if (!d?.driver_phone) return;
    setIsLoadingAttendance(true);
    try { setAttendanceStatus(await fetchDriverAttendanceStatus(d.driver_phone)); }
    catch { setAttendanceStatus('offline'); }
    finally { setIsLoadingAttendance(false); }
  }, [fetchDriverAttendanceStatus]);

  useEffect(() => {
    if (activeTab === 'profile' && driverRef.current?.driver_id) {
      loadAttendanceStatus();
      loadActiveBatchId();
    }
  }, [activeTab, loadAttendanceStatus, loadActiveBatchId]);

  const fetchBlitzDataInBackground = useCallback(async (orders) => {
    if (!orders?.length) return;
    const merchantOrderIds = orders.map(o => o.merchant_order_id).filter(Boolean);
    if (!merchantOrderIds.length) return;

    setIsFetchingBlitzData(true);
    try {
      const BATCH_SIZE = 3;
      for (let i = 0; i < merchantOrderIds.length; i += BATCH_SIZE) {
        const batch = merchantOrderIds.slice(i, i + BATCH_SIZE);
        try {
          const res = await authAxiosRef.current.post('/blitz-proxy/search-orders', { merchantOrderIds: batch }, { timeout: 30000 });
          if (res.data.success && res.data.data) {
            const batchResult = res.data.data;
            setBlitzOrdersData(prev => ({ ...prev, ...batchResult }));
            const newBatchIds = [...new Set(
              Object.values(batchResult).map(d => d?.batch_id).filter(b => b && b > 0)
            )];
            if (newBatchIds.length > 0) {
              newBatchIds.forEach(async (batchId) => {
                try {
                  const r = await authAxiosRef.current.get(`/blitz-proxy/batch-details/${batchId}`, { timeout: 30000 });
                  if (r.data.result && r.data.data) {
                    const d = r.data.data;
                    const driverData = d.driver || {};
                    const ordersCount = (d.orders || []).length;
                    const info = ordersCount === 0
                      ? { isAssigned: false, isEmpty: true }
                      : driverData.id > 0 && driverData.name
                        ? { isAssigned: true, isEmpty: false, driverId: driverData.id, driverName: driverData.name, driverMobile: driverData.mobile }
                        : { isAssigned: false, isEmpty: false };
                    setBatchDriverData(prev => ({ ...prev, [batchId]: info }));
                  }
                } catch { }
              });
            }
          }
        } catch { }
        if (i + BATCH_SIZE < merchantOrderIds.length) await new Promise(r => setTimeout(r, 150));
      }
    } catch { }
    finally { setIsFetchingBlitzData(false); }
  }, []);

  const loadOrders = useCallback(async () => {
    const d = driverRef.current;
    if (!d?.project) return;

    const currentToken = tokenRef.current;
    if (!currentToken) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    hasLoadedOrdersRef.current = true;

    setIsLoadingOrders(true);
    setOrdersError(null);
    setBlitzOrdersData({});
    setBatchDriverData({});

    const axiosInstance = createAuthAxios(currentToken);

    try {
      const res = await axiosInstance.get(`/merchant-orders/${d.project}/mitra/all`, {
        signal: abortControllerRef.current.signal
      });
      if (res.data.success) {
        const orders = res.data.data || [];
        setAllOrders(orders);
        fetchBlitzDataInBackground(orders);
      } else {
        setOrdersError(res.data.message || 'Failed to load orders');
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        setOrdersError(err.response?.data?.message || 'Failed to load merchant orders');
      }
    } finally {
      setIsLoadingOrders(false);
      abortControllerRef.current = null;
    }
  }, [fetchBlitzDataInBackground]);

  useEffect(() => {
    if (!driver?.project || !token) return;
    if (hasLoadedOrdersRef.current) return;

    const timer = setTimeout(() => {
      loadOrders();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [driver?.project, token, loadOrders]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...allOrders];
    if (debouncedSearchTerm) {
      const q = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(o => Object.values(o).some(v => v && v.toString().toLowerCase().includes(q)));
    }
    if (assignmentFilter) {
      filtered = filtered.filter(o => (o.assignment_status || 'unassigned') === assignmentFilter);
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const av = a[sortConfig.key] || '', bv = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc' ? av.toString().localeCompare(bv.toString()) : bv.toString().localeCompare(av.toString());
      });
    }
    return filtered;
  }, [allOrders, debouncedSearchTerm, assignmentFilter, sortConfig]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(start, start + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => Math.ceil(filteredAndSortedOrders.length / itemsPerPage), [filteredAndSortedOrders.length, itemsPerPage]);

  const isOrderSelectable = useCallback((order) => {
    if (isFetchingBlitzData) return false;
    const blitzData = blitzOrdersData[order.merchant_order_id];
    if (blitzData && isTerminalStatus(blitzData.order_status)) return false;
    const batchId = blitzData?.batch_id;
    if (!batchId || batchId === 0) return true;
    const batchDriver = batchDriverData[batchId];
    if (!batchDriver) return false;
    if (batchDriver.isEmpty) return true;
    if (batchDriver.isAssigned) return parseInt(batchDriver.driverId) === parseInt(driverRef.current?.driver_id);
    return true;
  }, [blitzOrdersData, batchDriverData, isFetchingBlitzData]);

  const canUnassign = useCallback((order) => {
    if (isFetchingBlitzData) return false;
    const blitzData = blitzOrdersData[order.merchant_order_id];
    if (!blitzData || isTerminalStatus(blitzData.order_status)) return false;
    const batchId = blitzData?.batch_id;
    if (!batchId) return false;
    const batchDriver = batchDriverData[batchId];
    if (!batchDriver?.isAssigned) return false;
    return parseInt(batchDriver.driverId) === parseInt(driverRef.current?.driver_id);
  }, [blitzOrdersData, batchDriverData, isFetchingBlitzData]);

  const selectableOrders = useMemo(() => paginatedOrders.filter(o => isOrderSelectable(o)), [paginatedOrders, isOrderSelectable]);
  const unassignableSelectedOrders = useMemo(() => allOrders.filter(o => selectedOrders.has(o._id) && canUnassign(o)), [allOrders, selectedOrders, canUnassign]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === selectableOrders.length && selectableOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(selectableOrders.map(o => o._id)));
    }
  }, [selectableOrders, selectedOrders.size]);

  const handleSelectOrder = useCallback((orderId, order) => {
    if (!isOrderSelectable(order)) return;
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  }, [isOrderSelectable]);

  const handleUnassignOrder = async (order) => {
    const blitzData = blitzOrdersData[order.merchant_order_id];
    const batchId = blitzData?.batch_id;
    if (!batchId) { alert('Order tidak memiliki batch ID'); return; }
    if (!window.confirm(`Unassign order ${order.merchant_order_id} dari batch ${batchId}?`)) return;

    const d = driverRef.current;
    setUnassigningOrders(prev => new Set(prev).add(order._id));
    try {
      const res = await authAxiosRef.current.post('/blitz-proxy/remove-order-from-batch', {
        batchId, merchantOrderId: order.merchant_order_id, orderId: order._id, project: d.project
      }, { timeout: 60000 });
      if (res.data.success) {
        alert(`✅ Order ${order.merchant_order_id} berhasil di-unassign dari batch ${batchId}`);
        await loadOrders();
        await loadActiveBatchId();
      } else {
        alert(`❌ Gagal unassign order: ${res.data.message}`);
      }
    } catch (err) {
      alert(`❌ Gagal unassign order: ${err.response?.data?.message || err.message}`);
    } finally {
      setUnassigningOrders(prev => { const s = new Set(prev); s.delete(order._id); return s; });
    }
  };

  const handleBulkUnassignOrders = async () => {
    if (!unassignableSelectedOrders.length) { alert('Tidak ada order yang dapat di-unassign'); return; }
    const batchIds = [...new Set(unassignableSelectedOrders.map(o => blitzOrdersData[o.merchant_order_id]?.batch_id).filter(Boolean))];
    if (!window.confirm(`Unassign ${unassignableSelectedOrders.length} order(s) dari batch ${batchIds.join(', ')}?`)) return;

    const d = driverRef.current;
    setIsBulkUnassigning(true);
    let successCount = 0, failCount = 0;
    const errors = [];

    for (const order of unassignableSelectedOrders) {
      const batchId = blitzOrdersData[order.merchant_order_id]?.batch_id;
      if (!batchId) { failCount++; errors.push(`${order.merchant_order_id}: No batch ID`); continue; }
      try {
        const res = await authAxiosRef.current.post('/blitz-proxy/remove-order-from-batch', {
          batchId, merchantOrderId: order.merchant_order_id, orderId: order._id, project: d.project
        }, { timeout: 60000 });
        if (res.data.success) successCount++;
        else throw new Error(res.data.message || 'Unassign failed');
      } catch (err) {
        failCount++;
        errors.push(`${order.merchant_order_id}: ${err.message}`);
      }
    }

    setIsBulkUnassigning(false);
    let msg = `✅ Berhasil unassign ${successCount} order(s)`;
    if (failCount > 0) msg += `\n\n⚠️ Gagal: ${failCount} order(s)${errors.length <= 5 ? '\n\n' + errors.join('\n') : ''}`;
    alert(msg);
    setSelectedOrders(new Set());
    await loadOrders();
    await loadActiveBatchId();
  };

  const handleAssignOrders = async () => {
    if (!selectedOrders.size) { alert('Silakan pilih minimal 1 order untuk di-assign'); return; }
    const d = driverRef.current;
    setIsLoadingAttendance(true);
    try {
      const currentStatus = await fetchDriverAttendanceStatus(d.driver_phone);
      setAttendanceStatus(currentStatus);
      setIsLoadingAttendance(false);

      if (currentStatus !== 'online') {
        alert('⚠️ Driver harus ONLINE di aplikasi Blitz terlebih dahulu sebelum dapat menerima assignment.\n\n📱 Silakan:\n1. Buka aplikasi Blitz\n2. Ubah status menjadi ONLINE\n3. Kemudian coba assign kembali');
        return;
      }

      const ordersRes = await authAxiosRef.current.get(`/merchant-orders/${d.project}/mitra/all`);
      const allOrdersData = ordersRes.data.data || [];
      const selectedOrdersList = allOrdersData.filter(o => selectedOrders.has(o._id));
      const senderNames = [...new Set(selectedOrdersList.map(o => o.sender_name))];

      if (senderNames.length > 1) {
        const validRes = await authAxiosRef.current.post(`/merchant-orders/${d.project}/validate-multiple-senders`, { senderNames });
        if (!validRes.data.success) {
          alert(`⚠️ Sender tidak terdaftar:\n\n${(validRes.data.invalidSenders || []).join('\n')}`);
          return;
        }
        const validationMap = validRes.data.data;
        const groupedBySender = {};
        selectedOrdersList.forEach(o => {
          if (!groupedBySender[o.sender_name]) groupedBySender[o.sender_name] = [];
          groupedBySender[o.sender_name].push(o);
        });
        const senderList = Object.entries(groupedBySender).map(([n, os]) => `• ${n} (${os.length} order)`).join('\n');
        if (!window.confirm(`Assign order dari ${senderNames.length} sender ke driver ${d.driver_name}?\n\nSender:\n${senderList}`)) return;

        setIsAssigning(true);
        let totalSuccess = 0, totalFail = 0;
        const failMessages = [];

        for (const [senderName, senderOrders] of Object.entries(groupedBySender)) {
          const validationData = validationMap[senderName];
          const orderIds = senderOrders.map(o => o._id);
          const [coordLon, coordLat] = validationData.location.coordinates;
          let currentBatch = activeBatchId;

          if (currentBatch) {
            const nearbyRes = await authAxiosRef.current.post('/blitz-proxy/nearby-drivers', { lat: coordLat, lon: coordLon });
            if (!nearbyRes.data.success || !nearbyRes.data.data.driverList?.find(dr => dr.driver_phone === d.driver_phone)) {
              currentBatch = null;
            }
          }

          try {
            let result;
            if (currentBatch) {
              const addRes = await authAxiosRef.current.post('/blitz-proxy/add-to-existing-batch', {
                orders: senderOrders, batchId: currentBatch, hubId: validationData.business_hub,
                business: validationData.business, city: validationData.city, serviceType: validationData.service_type
              }, { timeout: 180000 });
              if (addRes.data.success) {
                await assignOrders(orderIds, currentBatch, validationData);
                result = { success: true };
              } else result = { success: false, message: addRes.data.message };
            } else {
              result = await assignOrders(orderIds, null, validationData);
            }
            if (result.success) totalSuccess += orderIds.length;
            else { totalFail += orderIds.length; failMessages.push(`${senderName}: ${result.message}`); }
          } catch (err) {
            totalFail += orderIds.length;
            failMessages.push(`${senderName}: ${err.message}`);
          }
        }

        setIsAssigning(false);
        let alertMsg = `✅ Berhasil assign ${totalSuccess} order(s)`;
        if (totalFail > 0) alertMsg += `\n\n❌ Gagal assign ${totalFail} order(s):\n${failMessages.join('\n')}`;
        alert(alertMsg);
        setSelectedOrders(new Set());
        await loadOrders();
        setActiveBatchId(await fetchActiveBatchId(d.driver_id));
        await loadAttendanceStatus();
        return;
      }

      const senderName = senderNames[0];
      const validRes = await authAxiosRef.current.post(`/merchant-orders/${d.project}/validate-sender`, { senderName });
      if (!validRes.data.success) {
        alert(`⚠️ Sender "${senderName}" tidak terdaftar di AdminPanel Validations.`);
        return;
      }
      const validationData = validRes.data.data;
      const [coordLon, coordLat] = validationData.location.coordinates;

      if (!activeBatchId) {
        const nearbyRes = await authAxiosRef.current.post('/blitz-proxy/nearby-drivers', { lat: coordLat, lon: coordLon });
        if (!nearbyRes.data.success) { alert('⚠️ Gagal mengecek driver nearby. Silakan coba lagi.'); return; }
        if (!nearbyRes.data.data.driverList?.find(dr => dr.driver_phone === d.driver_phone)) {
          alert(`⚠️ Driver tidak ditemukan di area pickup.\n\nPastikan:\n1. Driver sudah ONLINE di aplikasi Blitz\n2. Driver berada di area yang sesuai\n3. GPS aktif di device driver`);
          return;
        }
      }

      if (!window.confirm(`Assign ${selectedOrders.size} order(s) ke driver ${d.driver_name}?`)) return;
      setIsAssigning(true);

      const orderIds = Array.from(selectedOrders);
      let result;

      if (activeBatchId) {
        const selectedOrdersData = allOrdersData.filter(o => orderIds.includes(o._id));
        const addRes = await authAxiosRef.current.post('/blitz-proxy/add-to-existing-batch', {
          orders: selectedOrdersData, batchId: activeBatchId, hubId: validationData.business_hub,
          business: validationData.business, city: validationData.city, serviceType: validationData.service_type
        }, { timeout: 180000 });
        if (addRes.data.success) {
          await assignOrders(orderIds, activeBatchId, validationData);
          result = { success: true, addedToExistingBatch: true, batchId: activeBatchId, assignedCount: orderIds.length, driverInfo: { driverName: d.driver_name } };
        } else result = { success: false, message: addRes.data.message };
      } else {
        result = await assignOrders(orderIds, null, validationData);
      }

      if (result.success) {
        const msg = result.addedToExistingBatch
          ? `✅ Berhasil menambahkan ${result.assignedCount} order(s) ke batch ${activeBatchId}!\n\nBatch ID: ${activeBatchId}\nDriver: ${result.driverInfo.driverName}`
          : result.batchId
            ? `✅ Berhasil create batch baru!\n\nBatch ID: ${result.batchId}\nTotal Orders: ${result.assignedCount}\nDriver: ${result.driverInfo?.driverName}`
            : `⚠️ Assignment selesai tapi ada kendala.\n\n${result.message || ''}`;
        alert(msg);
        setSelectedOrders(new Set());
        await loadOrders();
        setActiveBatchId(await fetchActiveBatchId(d.driver_id));
        await loadAttendanceStatus();
      } else {
        alert(`❌ Gagal assign orders: ${result.message}\n\n${result.error || ''}`);
      }
    } catch (err) {
      alert(`Terjadi kesalahan: ${err.response?.data?.message || err.message || 'Unknown error'}\n\nSilakan coba lagi atau hubungi admin.`);
    } finally {
      setIsAssigning(false);
      setIsLoadingAttendance(false);
    }
  };

  const getSortIcon = useCallback((col) => {
    if (sortConfig.key !== col) return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-blue-500" /> : <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
  }, [sortConfig]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const total = filteredAndSortedOrders.length;
    const getPages = () => {
      const delta = 2, range = [], result = [];
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) range.push(i);
      if (currentPage - delta > 2) result.push(1, '...');
      else result.push(1);
      result.push(...range);
      if (currentPage + delta < totalPages - 1) result.push('...', totalPages);
      else result.push(totalPages);
      return result;
    };
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} dari {total} data</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Per halaman:</span>
            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Sebelumnya</button>
          {getPages().map((p, i) => (
            <button key={i} onClick={() => typeof p === 'number' ? setCurrentPage(p) : null} disabled={p === '...'} className={`px-3 py-1.5 border rounded-md text-sm ${p === currentPage ? 'bg-blue-500 text-white border-blue-500' : p === '...' ? 'cursor-default border-gray-300 text-gray-400' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Selanjutnya</button>
        </div>
      </div>
    );
  };

  const handleLogout = async () => { await logout(); window.location.href = '/login-mitra'; };

  const isAssignBlocked = isFetchingBlitzData || isAssigning || isLoadingAttendance;

  if (!driver) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Mitra Dashboard</h1>
                  <p className="text-blue-100">{projectMapping[driver.project] || driver.project}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors">
                <LogOut size={18} />Logout
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <div className="flex space-x-2 py-3">
              <TabButton id="profile" label="Profile" icon={<User size={18} />} isActive={activeTab === 'profile'} onClick={setActiveTab} />
              <TabButton id="orders" label="Merchant Orders" icon={<Package size={18} />} isActive={activeTab === 'orders'} onClick={setActiveTab} />
            </div>
          </div>

          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2"><User className="w-5 h-5" />Informasi Driver</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Driver', value: driver.driver_name },
                    { label: 'Driver ID', value: driver.driver_id, mono: true },
                    { label: 'No Telepon', value: driver.driver_phone, icon: <Phone className="w-4 h-4 text-blue-600" /> },
                  ].map(({ label, value, mono, icon }) => (
                    <div key={label} className="bg-white rounded-lg p-4 border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium mb-1">{label}</p>
                      <p className={`text-gray-900 ${mono ? 'font-mono' : 'font-semibold'} flex items-center gap-2`}>{icon}{value}</p>
                    </div>
                  ))}
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-blue-700 font-medium mb-1">Status</p>
                    {isLoadingAttendance ? <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-gray-600 text-sm">Loading...</span></div> : <AttendanceStatusBadge status={attendanceStatus} />}
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-blue-700 font-medium mb-1">Active Batch ID</p>
                    {isLoadingBatchId ? <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-gray-600 text-sm">Loading...</span></div> : activeBatchId ? <span className="text-gray-900 font-mono font-semibold">#{activeBatchId}</span> : <span className="text-gray-400 text-sm">No active batch</span>}
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Selamat Datang!</h3>
                <p className="text-gray-700">Anda berhasil login sebagai mitra {projectMapping[driver.project] || driver.project}. Gunakan dashboard ini untuk melihat profil dan mengelola pesanan merchant Anda.</p>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-800">Merchant Orders ({filteredAndSortedOrders.length})</h2>
                      {isFetchingBlitzData && (
                        <span className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                          <Loader2 className="animate-spin" size={11} />Memuat status…
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unassignableSelectedOrders.length > 0 && (
                        <button onClick={handleBulkUnassignOrders} disabled={isBulkUnassigning} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                          {isBulkUnassigning ? <><Loader2 className="animate-spin" size={16} />Unassigning...</> : <><X size={16} />Unassign ({unassignableSelectedOrders.length})</>}
                        </button>
                      )}
                      <button
                        onClick={handleAssignOrders}
                        disabled={selectedOrders.size === 0 || isAssignBlocked}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        title={isFetchingBlitzData ? 'Menunggu status order selesai dimuat...' : ''}
                      >
                        {isAssigning || isLoadingAttendance
                          ? <><Loader2 className="animate-spin" size={16} />{isLoadingAttendance ? 'Checking...' : 'Assigning...'}</>
                          : isFetchingBlitzData
                            ? <><Loader2 className="animate-spin" size={16} />Loading Status...</>
                            : <><Send size={16} />Assign ({selectedOrders.size})</>
                        }
                      </button>
                      <button onClick={loadOrders} disabled={isLoadingOrders} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                        {isLoadingOrders ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}Refresh
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Cari order..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={isLoadingOrders}
                      />
                      {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <select value={assignmentFilter} onChange={e => { setAssignmentFilter(e.target.value); setCurrentPage(1); setSelectedOrders(new Set()); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" disabled={isLoadingOrders}>
                      <option value="">Semua Status</option>
                      {assignmentStatuses.map(s => <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>)}
                    </select>
                    <button onClick={() => { setSearchTerm(''); setAssignmentFilter(''); setSortConfig({ key: 'createdAt', direction: 'desc' }); setCurrentPage(1); }} disabled={isLoadingOrders} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:bg-gray-400">
                      <Filter size={16} />Reset Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingOrders ? <LoadingSpinner /> : ordersError ? (
                    <div className="text-center py-12 px-4">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-red-400 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Error Loading Orders</h3>
                      <p className="text-sm text-red-600">{ordersError}</p>
                    </div>
                  ) : paginatedOrders.length > 0 ? (
                    <>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <button onClick={handleSelectAll} disabled={selectableOrders.length === 0} className="flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                                {selectedOrders.size === selectableOrders.length && selectableOrders.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                              </button>
                            </th>
                            {[['merchant_order_id', 'Order ID'], ['consignee_name', 'Consignee'], ['destination_city', 'Destination'], ['pickup_instructions', 'Pickup Instructions']].map(([key, label]) => (
                              <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort(key)}>
                                <div className="flex items-center"><span>{label}</span>{getSortIcon(key)}</div>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedOrders.map((order, idx) => {
                            const blitzData = blitzOrdersData[order.merchant_order_id];
                            const batchId = blitzData?.batch_id;
                            const batchDriver = batchId ? batchDriverData[batchId] : null;
                            const selectable = isOrderSelectable(order);
                            const showUnassign = canUnassign(order);
                            const orderTerminated = blitzData && isTerminalStatus(blitzData.order_status);
                            return (
                              <tr key={order._id || idx} className={`hover:bg-gray-50 transition-colors ${!selectable && !showUnassign ? 'opacity-60 bg-gray-50' : ''}`}>
                                <td className="px-4 py-3">
                                  {selectable ? (
                                    <button onClick={() => handleSelectOrder(order._id, order)} className="flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-700">
                                      {selectedOrders.has(order._id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                  ) : (
                                    <Lock className="w-5 h-5 text-gray-400" title={orderTerminated ? `Order status: ${blitzData.order_status}` : isFetchingBlitzData ? 'Memuat status...' : batchDriver?.driverName ? `Locked by ${batchDriver.driverName}` : 'Validating...'} />
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  <div className="max-w-xs truncate" title={order.merchant_order_id}>{order.merchant_order_id || '-'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="max-w-xs truncate">{order.consignee_name || '-'}</div>
                                  <div className="text-xs text-gray-500">{order.consignee_phone || '-'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="max-w-xs truncate">{order.destination_city || '-'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <div className="max-w-xs truncate">{order.pickup_instructions || '-'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {isFetchingBlitzData && !blitzData ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Loader2 size={11} className="animate-spin" />Loading…</span>
                                  ) : blitzData ? (
                                    <BlitzStatusBadge status={blitzData.order_status} driverName={!orderTerminated ? batchDriver?.driverName : null} />
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-800 border-gray-200">📋 Available</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {batchId ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200">#{batchId}</span>
                                      {!orderTerminated && batchDriver?.isAssigned && !showUnassign && <span className="text-xs text-red-600 font-medium">🔒 Locked</span>}
                                      {!orderTerminated && showUnassign && <span className="text-xs text-green-600 font-medium">✅ Your Batch</span>}
                                    </div>
                                  ) : isFetchingBlitzData ? (
                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" />…</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {renderPagination()}
                    </>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{searchTerm || assignmentFilter ? 'Tidak ada data yang sesuai dengan filter' : 'Belum ada merchant orders'}</h3>
                      <p className="text-sm text-gray-500">{searchTerm || assignmentFilter ? 'Coba ubah atau hapus filter pencarian' : 'Data merchant orders akan muncul di sini'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}