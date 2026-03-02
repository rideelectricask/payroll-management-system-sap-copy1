import { useState, useEffect, useCallback, useMemo } from "react";
import { Package, TrendingUp, CheckCircle, Truck, Clock, MapPin, RefreshCw, Loader2, Leaf, Upload, Download, Trash2, CheckSquare, Square } from "lucide-react";
import * as XLSX from 'xlsx';

const API_URL = 'https://backend-pms-production-0cec.up.railway.app';

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  created: 'bg-gray-100 text-gray-800',
  unassigned: 'bg-red-100 text-red-800',
};

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = dateVal.$date ? new Date(dateVal.$date) : new Date(dateVal);
  return isNaN(d) ? '-' : d.toLocaleString('id-ID');
};

export default function SayurboxDistribution() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const statistics = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.assignment_status === 'completed').length;
    const inTransit = orders.filter(o => o.assignment_status === 'in_progress').length;
    const processing = orders.filter(o => o.assignment_status === 'assigned' || o.assignment_status === 'created').length;
    const unassigned = orders.filter(o => !o.assignment_status || o.assignment_status === 'unassigned').length;
    const destinations = new Set(orders.map(o => o.destination_city)).size;
    const totalWeight = orders.reduce((sum, o) => sum + (parseFloat(o.weight) || 0), 0);
    const warehouses = new Set(orders.map(o => {
      const s = o.sender_name || '';
      if (s.includes('Jakarta') || s.includes('JKT')) return 'Jakarta';
      if (s.includes('Bogor') || s.includes('BGR')) return 'Bogor';
      if (s.includes('Tangerang') || s.includes('TNG')) return 'Tangerang';
      if (s.includes('Bekasi') || s.includes('BKS')) return 'Bekasi';
      return 'Other';
    })).size;
    const routes = new Set(orders.map(o =>
      `${o.sender_name?.split('-')[0]?.trim() || 'Unknown'}-${o.destination_city || 'Unknown'}`
    )).size;
    return { total, delivered, inTransit, processing, unassigned, destinations, totalWeight, warehouses: Math.max(warehouses, 1), activeRoutes: routes };
  }, [orders]);

  const warehouseData = useMemo(() => {
    const map = {};
    orders.forEach(order => {
      const s = order.sender_name || '';
      let warehouse = 'Other Warehouse';
      if (s.includes('Jakarta') || s.includes('JKT')) warehouse = 'Warehouse Jakarta';
      else if (s.includes('Bogor') || s.includes('BGR')) warehouse = 'Warehouse Bogor';
      else if (s.includes('Tangerang') || s.includes('TNG')) warehouse = 'Warehouse Tangerang';
      else if (s.includes('Bekasi') || s.includes('BKS')) warehouse = 'Warehouse Bekasi';
      if (!map[warehouse]) map[warehouse] = { name: warehouse, orders: 0, delivered: 0 };
      map[warehouse].orders++;
      if (order.assignment_status === 'completed') map[warehouse].delivered++;
    });
    return Object.values(map).map(w => ({
      ...w,
      rate: w.orders > 0 ? Math.round((w.delivered / w.orders) * 100) : 0
    })).sort((a, b) => b.orders - a.orders);
  }, [orders]);

  const performanceMetrics = useMemo(() => {
    if (orders.length === 0) return { avgDeliveryTime: 1.0, onTimeRate: 95, customerSatisfaction: 93 };
    const deliveredOrders = orders.filter(o => o.assignment_status === 'completed');
    const avgDeliveryTime = deliveredOrders.length > 0
      ? deliveredOrders.reduce((sum, o) => {
          const days = (new Date(o.updatedAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / deliveredOrders.length
      : 1.0;
    const onTimeRate = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 95;
    const codOrders = orders.filter(o => o.payment_type === 'cod').length;
    const successfulCod = orders.filter(o => o.payment_type === 'cod' && o.assignment_status === 'completed').length;
    const customerSatisfaction = codOrders > 0 ? Math.round((successfulCod / codOrders) * 100) : 93;
    return { avgDeliveryTime: avgDeliveryTime.toFixed(1), onTimeRate, customerSatisfaction };
  }, [orders]);

  const loadData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date().toLocaleString('id-ID'));
      setLoading(false);
    }, 500);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/merchant-orders/sayurbox/all`);
      const result = await response.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }, []);

  const readExcelFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(worksheet, { header: 1 }));
      } catch (error) { reject(error); }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsBinaryString(file);
  });

  const transformMerchantDataForUpload = (data) => {
    if (data.length < 2) throw new Error('File Excel kosong atau tidak valid');
    const headers = data[0].map(h => h.toString().toLowerCase().replace(/\*/g, '').trim());
    return data.slice(1)
      .filter(row => row.some(cell => cell && cell.toString().trim()))
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => { obj[header] = row[index] || ''; });
        return {
          merchant_order_id: obj.merchant_order_id?.toString() || '',
          weight: parseFloat(obj.weight) || 0,
          width: parseFloat(obj.width) || 0,
          height: parseFloat(obj.height) || 0,
          length: parseFloat(obj.length) || 0,
          payment_type: obj.payment_type?.toString() || 'non_cod',
          cod_amount: parseFloat(obj.cod_amount) || 0,
          sender_name: obj.sender_name?.toString() || '',
          sender_phone: obj.sender_phone?.toString() || '',
          pickup_instructions: obj.pickup_instructions?.toString() || '',
          consignee_name: obj.consignee_name?.toString() || '',
          consignee_phone: obj.consignee_phone?.toString() || '',
          destination_district: obj.destination_district?.toString() || '',
          destination_city: obj.destination_city?.toString() || '',
          destination_province: obj.destination_province?.toString() || '',
          destination_postalcode: obj.destination_postalcode?.toString() || '',
          destination_address: obj.destination_address?.toString() || '',
          dropoff_lat: parseFloat(obj.dropoff_lat) || 0,
          dropoff_long: parseFloat(obj.dropoff_long) || 0,
          dropoff_instructions: obj.dropoff_instructions?.toString() || '',
          item_value: parseFloat(obj.item_value) || 0,
          product_details: obj.product_details?.toString() || ''
        };
      })
      .filter(obj => obj.merchant_order_id && obj.consignee_name);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = null;
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Format file tidak didukung. Silakan pilih file Excel (.xlsx atau .xls)');
      return;
    }
    setIsUploading(true);
    setUploadProgress({ current: 0, total: 1, percentage: 0 });
    try {
      const data = await readExcelFile(file);
      const transformedData = transformMerchantDataForUpload(data);
      const response = await fetch(`${API_URL}/api/merchant-orders/sayurbox/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: transformedData }),
      });
      const result = await response.json();
      if (result.success) {
        setUploadProgress({ current: 1, total: 1, percentage: 100 });
        alert(`Berhasil mengupload ${result.count} data merchant order`);
        await loadOrders();
        setTimeout(() => setUploadProgress(null), 2000);
      } else {
        throw new Error(result.message || 'Upload gagal');
      }
    } catch (error) {
      alert(`Upload gagal: ${error.message}`);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === orders.length && orders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)));
    }
  }, [orders, selectedOrders.size]);

  const handleSelectOrder = useCallback((orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId);
      return newSet;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) { alert('Silakan pilih minimal 1 order untuk dihapus'); return; }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedOrders.size} order(s)?`)) return;
    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedOrders).map(id =>
        fetch(`${API_URL}/api/merchant-orders/sayurbox/${id}`, { method: 'DELETE' })
      ));
      alert(`Berhasil menghapus ${selectedOrders.size} order(s)`);
      setSelectedOrders(new Set());
      await loadOrders();
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert('Terjadi kesalahan saat menghapus orders');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
    loadOrders();
  }, [loadData, loadOrders]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Leaf className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-bold">Sayurbox Distribution</h2>
              <p className="text-sm opacity-90">Fresh Grocery Logistics Management</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedOrders.size > 0 && (
              <button onClick={handleBulkDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm">
                {isDeleting ? <><Loader2 size={16} className="animate-spin" />Deleting...</> : <><Trash2 size={16} />Delete ({selectedOrders.size})</>}
              </button>
            )}
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id="file-upload-sayurbox" disabled={isUploading} />
            <label htmlFor="file-upload-sayurbox" className={`flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? <><Loader2 size={16} className="animate-spin" />Uploading...</> : <><Upload size={16} />Import Excel</>}
            </label>
            <button onClick={loadOrders} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>
        {uploadProgress && (
          <div className="mb-2 bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${uploadProgress.percentage}%` }}></div>
          </div>
        )}
        {lastUpdated && <p className="text-xs opacity-75">Last updated: {lastUpdated}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-600 text-sm font-medium">Total Orders</p><p className="text-2xl font-bold text-gray-900">{statistics.total}</p></div>
            <Package className="w-8 h-8 text-green-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-600 text-sm font-medium">Delivered</p><p className="text-2xl font-bold text-green-600">{statistics.delivered}</p></div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-600 text-sm font-medium">Warehouses</p><p className="text-2xl font-bold text-emerald-600">{statistics.warehouses}</p></div>
            <Leaf className="w-8 h-8 text-emerald-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-600 text-sm font-medium">Total Weight</p><p className="text-2xl font-bold text-orange-600">{statistics.totalWeight.toLocaleString()} kg</p></div>
            <TrendingUp className="w-8 h-8 text-orange-600 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Performance by Warehouse
          </h3>
          <div className="space-y-4">
            {warehouseData.length > 0 ? warehouseData.map((warehouse) => (
              <div key={warehouse.name} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">{warehouse.name}</h4>
                  <span className="text-sm font-semibold text-green-600">{warehouse.rate}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><p className="text-xs">Total Orders</p><p className="font-semibold text-gray-900">{warehouse.orders}</p></div>
                  <div><p className="text-xs">Delivered</p><p className="font-semibold text-green-600">{warehouse.delivered}</p></div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${warehouse.rate}%` }}></div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Leaf className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No warehouse data available</p>
                <p className="text-xs">Upload merchant orders to see performance</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Distribution Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div><p className="text-sm text-gray-600">Active Routes</p><p className="text-2xl font-bold text-green-600">{statistics.activeRoutes}</p></div>
              <Truck className="w-10 h-10 text-green-600 opacity-80" />
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div><p className="text-sm text-gray-600">Delivery Locations</p><p className="text-2xl font-bold text-emerald-600">{statistics.destinations}</p></div>
              <MapPin className="w-10 h-10 text-emerald-600 opacity-80" />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div><p className="text-sm text-gray-600">In Transit</p><p className="text-2xl font-bold text-orange-600">{statistics.inTransit}</p></div>
              <Clock className="w-10 h-10 text-orange-600 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Project Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Avg Delivery Time</p>
            <p className="text-2xl font-bold">{performanceMetrics.avgDeliveryTime} days</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">On-Time Rate</p>
            <p className="text-2xl font-bold">{performanceMetrics.onTimeRate}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Customer Satisfaction</p>
            <p className="text-2xl font-bold">{performanceMetrics.customerSatisfaction}%</p>
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              Merchant Orders ({orders.length})
              {selectedOrders.size > 0 && <span className="ml-2 text-sm font-normal text-green-600">{selectedOrders.size} selected</span>}
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              <Download size={16} />Export
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <button onClick={handleSelectAll} className="flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-700">
                      {selectedOrders.size === orders.length && orders.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Batch ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Sender</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Consignee</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Destination</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Address</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Payment</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">COD Amt</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Weight</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Pickup Notes</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Driver</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Assigned At</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order._id || index} className={`hover:bg-gray-50 ${selectedOrders.has(order._id) ? 'bg-green-50' : ''}`}>
                    <td className="px-3 py-3">
                      <button onClick={() => handleSelectOrder(order._id)} className="flex items-center justify-center w-5 h-5 text-green-600 hover:text-green-700">
                        {selectedOrders.has(order._id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{order.merchant_order_id}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{order.batch_id || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.assignment_status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.assignment_status || 'unassigned'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{order.sender_name}</div>
                      <div className="text-xs text-gray-500">{order.sender_phone}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{order.consignee_name}</div>
                      <div className="text-xs text-gray-500">{order.consignee_phone}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{order.destination_city}</div>
                      <div className="text-xs text-gray-500">{order.destination_province}</div>
                      <div className="text-xs text-gray-400">{order.destination_district}</div>
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <div className="text-gray-700 truncate">{order.destination_address}</div>
                      <div className="text-xs text-gray-500">{order.destination_postalcode}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.payment_type === 'cod' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {order.payment_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {order.cod_amount > 0 ? `Rp ${Number(order.cod_amount).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{order.weight} kg</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{order.product_details || '-'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{order.pickup_instructions || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {order.assigned_to_driver_name ? (
                        <>
                          <div className="text-gray-900">{order.assigned_to_driver_name}</div>
                          <div className="text-xs text-gray-500">{order.assigned_to_driver_phone}</div>
                          <div className="text-xs text-gray-400">ID: {order.assigned_to_driver_id}</div>
                        </>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-xs">{formatDate(order.assigned_at)}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}