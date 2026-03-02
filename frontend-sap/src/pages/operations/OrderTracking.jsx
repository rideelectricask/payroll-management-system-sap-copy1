import { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, Package, Loader2, RefreshCw, Search, CheckCircle, Clock, Truck, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const API_URL = 'https://backend-pms-production-0cec.up.railway.app';

const STATUS_CONFIG = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <CheckCircle size={13} />, label: 'Completed' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: <Truck size={13} />, label: 'In Transit' },
  assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <Clock size={13} />, label: 'Assigned' },
  created: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: <Package size={13} />, label: 'Created' },
  unassigned: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <AlertCircle size={13} />, label: 'Unassigned' },
};

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = dateVal.$date ? new Date(dateVal.$date) : new Date(dateVal);
  return isNaN(d) ? '-' : d.toLocaleString('id-ID');
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unassigned;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function OrderDetailRow({ order, isExpanded, onToggle }) {
  return (
    <>
      <tr className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : ''}`} onClick={onToggle}>
        <td className="px-4 py-3 text-gray-400">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
        <td className="px-4 py-3 font-medium text-blue-700 whitespace-nowrap">{order.merchant_order_id}</td>
        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={order.assignment_status} /></td>
        <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-sm">{order.sender_name}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-gray-900">{order.consignee_name?.substring(0, 28)}{order.consignee_name?.length > 28 ? '…' : ''}</div>
          <div className="text-xs text-gray-500">{order.consignee_phone}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-gray-900">{order.destination_city}</div>
          <div className="text-xs text-gray-500">{order.destination_district}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${order.payment_type === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
            {order.payment_type?.toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-amber-600">
          {order.payment_type === 'cod' && order.cod_amount > 0 ? `Rp ${Number(order.cod_amount).toLocaleString('id-ID')}` : '-'}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
          {order.assigned_to_driver_name || <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.batch_id || '-'}</td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(order.createdAt)}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-blue-50 border-b border-blue-100">
          <td colSpan={11} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-2">Info Pengirim</p>
                <p><span className="text-gray-500">Nama:</span> {order.sender_name}</p>
                <p><span className="text-gray-500">Telp:</span> {order.sender_phone}</p>
                <p><span className="text-gray-500">Pickup Note:</span> {order.pickup_instructions || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-2">Info Penerima</p>
                <p><span className="text-gray-500">Nama:</span> {order.consignee_name}</p>
                <p><span className="text-gray-500">Telp:</span> {order.consignee_phone}</p>
                <p><span className="text-gray-500">Alamat:</span> {order.destination_address}</p>
                <p><span className="text-gray-500">Kode Pos:</span> {order.destination_postalcode}</p>
                <p><span className="text-gray-500">Dropoff Note:</span> {order.dropoff_instructions || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-2">Info Pengiriman</p>
                <p><span className="text-gray-500">Produk:</span> {order.product_details || '-'}</p>
                <p><span className="text-gray-500">Berat:</span> {order.weight} kg</p>
                <p><span className="text-gray-500">Nilai Barang:</span> {order.item_value > 0 ? `Rp ${Number(order.item_value).toLocaleString('id-ID')}` : '-'}</p>
                {order.assigned_to_driver_name && (
                  <>
                    <p><span className="text-gray-500">Driver:</span> {order.assigned_to_driver_name}</p>
                    <p><span className="text-gray-500">Driver Telp:</span> {order.assigned_to_driver_phone}</p>
                    <p><span className="text-gray-500">Driver ID:</span> {order.assigned_to_driver_id}</p>
                    <p><span className="text-gray-500">Assigned At:</span> {formatDate(order.assigned_at)}</p>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function OrderTracking({ selectedProject = 'jne' }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/merchant-orders/${selectedProject}/all`);
      const result = await response.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadOrders();
    setExpandedOrder(null);
    setSearch('');
    setTrackingInput('');
    setStatusFilter('all');
    setPaymentFilter('all');
  }, [loadOrders]);

  const getProjectTitle = () => {
    const titles = { jne: 'JNE', mup: 'MUP', sayurbox: 'Sayurbox Distribution', unilever: 'Unilever Distribution', wings: 'Wings Distribution' };
    return titles[selectedProject] || selectedProject.toUpperCase();
  };

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.assignment_status === 'completed').length,
    inProgress: orders.filter(o => o.assignment_status === 'in_progress').length,
    assigned: orders.filter(o => o.assignment_status === 'assigned').length,
    unassigned: orders.filter(o => !o.assignment_status || o.assignment_status === 'unassigned').length,
    totalCOD: orders.filter(o => o.payment_type === 'cod').reduce((sum, o) => sum + (o.cod_amount || 0), 0),
  }), [orders]);

  const handleTrackSearch = () => {
    if (!trackingInput.trim()) return;
    setSearch(trackingInput.trim());
    setStatusFilter('all');
    setPaymentFilter('all');
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        order.merchant_order_id?.toLowerCase().includes(q) ||
        order.consignee_name?.toLowerCase().includes(q) ||
        order.consignee_phone?.includes(q) ||
        order.destination_city?.toLowerCase().includes(q) ||
        order.destination_address?.toLowerCase().includes(q) ||
        order.sender_name?.toLowerCase().includes(q) ||
        order.assigned_to_driver_name?.toLowerCase().includes(q) ||
        order.batch_id?.toString().includes(q);
      const matchStatus = statusFilter === 'all' || order.assignment_status === statusFilter || (!order.assignment_status && statusFilter === 'unassigned');
      const matchPayment = paymentFilter === 'all' || order.payment_type === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getProjectTitle()} Order Tracking</h1>
              <p className="text-gray-500 text-sm">Lacak status pengiriman secara real-time dari database</p>
            </div>
          </div>
          <button onClick={loadOrders} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Refresh
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrackSearch()}
              placeholder="Cari nomor order, nama penerima, nomor HP, kota tujuan..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleTrackSearch} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Track Order
          </button>
          {search && (
            <button onClick={() => { setSearch(''); setTrackingInput(''); }} className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Orders', value: stats.total, active: statusFilter === 'all' && paymentFilter === 'all', onClick: () => { setStatusFilter('all'); setPaymentFilter('all'); }, valueColor: 'text-gray-800' },
          { label: 'Completed', value: stats.completed, active: statusFilter === 'completed', onClick: () => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed'), valueColor: 'text-green-700' },
          { label: 'In Transit', value: stats.inProgress, active: statusFilter === 'in_progress', onClick: () => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress'), valueColor: 'text-blue-700' },
          { label: 'Assigned', value: stats.assigned, active: statusFilter === 'assigned', onClick: () => setStatusFilter(statusFilter === 'assigned' ? 'all' : 'assigned'), valueColor: 'text-yellow-700' },
          { label: 'Unassigned', value: stats.unassigned, active: statusFilter === 'unassigned', onClick: () => setStatusFilter(statusFilter === 'unassigned' ? 'all' : 'unassigned'), valueColor: 'text-red-700' },
          { label: 'Total COD', value: `Rp ${Number(stats.totalCOD).toLocaleString('id-ID')}`, active: paymentFilter === 'cod', onClick: () => setPaymentFilter(paymentFilter === 'cod' ? 'all' : 'cod'), valueColor: 'text-amber-700', small: true },
        ].map((stat, i) => (
          <button key={i} onClick={stat.onClick} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left ${stat.active ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
            <p className={`font-bold ${stat.small ? 'text-sm' : 'text-2xl'} ${stat.valueColor}`}>{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter tabel..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Status</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="created">Created</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Payment</option>
            <option value="cod">COD</option>
            <option value="non_cod">Non-COD</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{filteredOrders.length} dari {orders.length} order</span>
        </div>

        <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">{orders.length === 0 ? 'Belum ada data order' : 'Tidak ada hasil yang sesuai'}</p>
              <p className="text-sm text-gray-500 mt-1">{orders.length === 0 ? 'Upload merchant orders terlebih dahulu' : 'Coba ubah filter atau kata kunci pencarian'}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  {['Order ID', 'Status', 'Sender', 'Penerima', 'Kota Tujuan', 'Payment', 'COD', 'Driver', 'Batch ID', 'Dibuat'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <OrderDetailRow
                    key={order._id}
                    order={order}
                    isExpanded={expandedOrder === order._id}
                    onToggle={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}