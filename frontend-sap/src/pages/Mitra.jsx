import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useMitraAuth } from '../contexts/mitraAuthContext';
import {
  Package, User, Phone, LogOut, Loader2, FileSpreadsheet,
  Search, SortAsc, SortDesc, CheckSquare, Square, Send, Lock,
  X, ChevronLeft, ChevronRight, Hash, Truck, MapPin, RotateCcw, AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://backend-pms-production-0cec.up.railway.app/api';

const createAuthAxios = (token) => {
  const instance = axios.create({ baseURL: API_BASE_URL });
  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return instance;
};

const useDebounce = (value, delay) => {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
};

const useWindowWidth = () => {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 375);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
};

const TERMINAL = ['driver_cancel', 'cancelled'];
const isTerminal = (s) => TERMINAL.includes(s?.toLowerCase());

const STATUS = {
  batched:       { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE', dot: '#6366F1', label: 'Batched' },
  assigned:      { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', dot: '#F59E0B', label: 'Assigned' },
  picked_up:     { bg: '#E0F2FE', color: '#0C4A6E', border: '#BAE6FD', dot: '#0EA5E9', label: 'Picked Up' },
  in_transit:    { bg: '#EFF6FF', color: '#1E3A8A', border: '#BFDBFE', dot: '#3B82F6', label: 'In Transit' },
  delivered:     { bg: '#F0FDF4', color: '#14532D', border: '#BBF7D0', dot: '#22C55E', label: 'Delivered' },
  cancelled:     { bg: '#FFF1F2', color: '#881337', border: '#FECDD3', dot: '#F43F5E', label: 'Cancelled' },
  driver_cancel: { bg: '#FFF1F2', color: '#881337', border: '#FECDD3', dot: '#F43F5E', label: 'Driver Cancel' },
};
const getStatus = (s) => STATUS[s?.toLowerCase()] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', dot: '#94A3B8', label: s || 'Available' };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  body {
    font-family: 'DM Sans', sans-serif;
    background: #F1F5F9;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .mtr-mono { font-family: 'DM Mono', monospace; }
  .mtr-row:hover td { background: #F8FAFC !important; }
  .mtr-sk { animation: shimmer 1.4s ease-in-out infinite; background: #F1F5F9; border-radius: 6px; }
  .mtr-root { width: 100%; max-width: 100vw; overflow-x: hidden; min-height: 100vh; background: #F1F5F9; }
  .mtr-header { width: 100%; max-width: 100vw; overflow: hidden; }
  .mtr-main { width: 100%; max-width: 100vw; overflow-x: hidden; }
  button { font-family: inherit; -webkit-tap-highlight-color: transparent; }
  input, select { font-family: inherit; -webkit-tap-highlight-color: transparent; }
  input:focus, select:focus { outline: 2px solid #2563EB; outline-offset: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
`;

const StatusPill = memo(({ status, driverName }) => {
  const c = getStatus(status);
  return (
    <div>
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, background:c.bg, color:c.color, border:`1px solid ${c.border}`, fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
        {c.label}
      </span>
      {driverName && !isTerminal(status) && (
        <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={driverName}>{driverName}</div>
      )}
    </div>
  );
});

const OnlineBadge = memo(({ status }) => {
  const on = status?.toLowerCase() === 'online';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background: on?'#F0FDF4':'#FFF1F2', color: on?'#15803D':'#BE123C', border:`1px solid ${on?'#BBF7D0':'#FECDD3'}`, fontSize:12, fontWeight:700, letterSpacing:'0.02em', whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background: on?'#22C55E':'#F43F5E', boxShadow: on?'0 0 0 2.5px #BBF7D0':undefined }} />
      {on ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
});

const BatchChip = memo(({ batchId }) => (
  <span className="mtr-mono" style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:7, background:'#F5F3FF', color:'#6D28D9', border:'1px solid #DDD6FE', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>#{batchId}</span>
));

const Sk = ({ w, h = 14 }) => <div className="mtr-sk" style={{ width: w, height: h }} />;

const SkRows = () => (
  <>
    {[...Array(7)].map((_, i) => (
      <tr key={i} style={{ borderBottom:'1px solid #F1F5F9' }}>
        <td style={{ padding:'13px 16px' }}><Sk w={18} h={18} /></td>
        <td style={{ padding:'13px 16px' }}><Sk w={180} /></td>
        <td style={{ padding:'13px 16px' }}><div style={{ display:'flex', flexDirection:'column', gap:6 }}><Sk w={130} /><Sk w={90} h={11} /></div></td>
        <td style={{ padding:'13px 16px' }}><Sk w={110} /></td>
        <td style={{ padding:'13px 16px' }}><Sk w={150} /></td>
        <td style={{ padding:'13px 16px' }}><Sk w={80} h={22} /></td>
        <td style={{ padding:'13px 16px' }}><Sk w={64} h={22} /></td>
        <td style={{ padding:'13px 16px' }} />
      </tr>
    ))}
  </>
);

const SkCards = () => (
  <div style={{ padding:'12px 12px', display:'flex', flexDirection:'column', gap:8 }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{ background:'#FFFFFF', borderRadius:14, border:'1px solid #F1F5F9', padding:16 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <Sk w={18} h={18} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
            <Sk w="70%" />
            <Sk w="45%" h={11} />
          </div>
          <Sk w={72} h={24} />
        </div>
      </div>
    ))}
  </div>
);

const MobileCard = memo(({ order, isSelected, isSelectable, showUnassign, onSelect, onUnassign, blitzData, batchId, batchDriver, isFetchingBlitzData, unassigningOrders }) => {
  const terminated = blitzData && isTerminal(blitzData.order_status);
  const isUnassigning = unassigningOrders.has(order._id);
  return (
    <div style={{ background:'#FFFFFF', borderRadius:14, border: isSelected ? '1.5px solid #2563EB' : '1px solid #F1F5F9', boxShadow: isSelected ? '0 0 0 3px #DBEAFE' : '0 1px 3px rgba(0,0,0,0.04)', padding:14, opacity:(!isSelectable && !showUnassign) ? 0.5 : 1, transition:'border 0.12s, box-shadow 0.12s' }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <div style={{ paddingTop:1, flexShrink:0 }}>
          {isSelectable
            ? <button onClick={() => onSelect(order._id, order)} style={{ background:'none', border:'none', padding:0, cursor:'pointer', color: isSelected ? '#2563EB' : '#CBD5E1', display:'flex' }}>
                {isSelected ? <CheckSquare size={19} /> : <Square size={19} />}
              </button>
            : <Lock size={16} color="#CBD5E1" title={terminated ? `Status: ${blitzData?.order_status}` : isFetchingBlitzData ? 'Memuat...' : batchDriver?.driverName ? `Locked: ${batchDriver.driverName}` : 'Validating...'} />
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p className="mtr-mono" style={{ fontSize:12, fontWeight:600, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }} title={order.merchant_order_id}>
            {order.merchant_order_id || '—'}
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 10px' }}>
            {order.consignee_name && <span style={{ fontSize:12, color:'#64748B', display:'flex', alignItems:'center', gap:3 }}><User size={10} color="#94A3B8" />{order.consignee_name}</span>}
            {order.destination_city && <span style={{ fontSize:12, color:'#64748B', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10} color="#94A3B8" />{order.destination_city}</span>}
          </div>
          {order.pickup_instructions && <p style={{ fontSize:11, color:'#94A3B8', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{order.pickup_instructions}</p>}
        </div>
        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          {isFetchingBlitzData && !blitzData
            ? <Loader2 size={13} color="#94A3B8" style={{ animation:'spin 1s linear infinite' }} />
            : <StatusPill status={blitzData?.order_status ?? null} driverName={!terminated ? batchDriver?.driverName : null} />
          }
          {batchId && <BatchChip batchId={batchId} />}
        </div>
      </div>
      {showUnassign && (
        <div style={{ marginTop:11, paddingTop:11, borderTop:'1px solid #F8FAFC' }}>
          <button onClick={() => onUnassign(order)} disabled={isUnassigning} style={{ background:'none', border:'none', padding:0, cursor: isUnassigning ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#EF4444', opacity: isUnassigning ? 0.5 : 1 }}>
            {isUnassigning ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <X size={12} />}
            {isUnassigning ? 'Melepas...' : 'Lepas dari batch'}
          </button>
        </div>
      )}
    </div>
  );
});

const ActionBtn = ({ onClick, disabled, color = '#2563EB', bg, border, children, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border: border || 'none', background: disabled ? '#E2E8F0' : (bg || color), color: disabled ? '#94A3B8' : (bg ? color : '#FFFFFF'), fontSize:13, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', transition:'opacity 0.12s', whiteSpace:'nowrap', flexShrink:0 }}>
    {children}
  </button>
);

export default function Mitra() {
  const { driver, token, logout, assignOrders, fetchActiveBatchId, fetchDriverAttendanceStatus } = useMitraAuth();
  const winW = useWindowWidth();
  const isMobile = winW < 1024;
  const isSmall = winW < 480;

  const authAxiosRef = useRef(null);
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; authAxiosRef.current = createAuthAxios(token); }, [token]);
  if (!authAxiosRef.current) authAxiosRef.current = createAuthAxios(token);

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

  const debouncedSearch = useDebounce(searchTerm, 400);
  const abortRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const driverRef = useRef(driver);
  useEffect(() => { driverRef.current = driver; }, [driver]);

  // ── Viewport & overflow fix – injected programmatically so it works
  //    even if the host index.html is missing the meta viewport tag
  useEffect(() => {
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.appendChild(vp); }
    vp.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    const prev = { htmlOX: document.documentElement.style.overflowX, bodyOX: document.body.style.overflowX, bodyW: document.body.style.width, bodyMW: document.body.style.maxWidth };
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.width = '100%';
    document.body.style.maxWidth = '100vw';
    return () => {
      document.documentElement.style.overflowX = prev.htmlOX;
      document.body.style.overflowX = prev.bodyOX;
      document.body.style.width = prev.bodyW;
      document.body.style.maxWidth = prev.bodyMW;
    };
  }, []);

  const PM = { jne: 'JNE', mup: 'MUP', indomaret: 'Indomaret', unilever: 'Unilever', wings: 'Wings' };
  const aStatuses = useMemo(() => ['unassigned', 'assigned', 'created', 'in_progress', 'completed', 'cancelled'], []);

  useEffect(() => { if (!driver && !token) window.location.href = '/login-mitra'; }, [driver, token]);

  useEffect(() => {
    if (driver?.driver_id && driver?.driver_phone && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setIsLoadingBatchId(true); setIsLoadingAttendance(true);
      fetchDriverAttendanceStatus(driver.driver_phone).then(s => setAttendanceStatus(s)).catch(() => setAttendanceStatus('offline')).finally(() => setIsLoadingAttendance(false));
      fetchActiveBatchId(driver.driver_id).then(b => setActiveBatchId(b)).catch(() => setActiveBatchId(null)).finally(() => setIsLoadingBatchId(false));
    }
  }, [driver, fetchActiveBatchId, fetchDriverAttendanceStatus]);

  const loadActiveBatchId = useCallback(async () => {
    const d = driverRef.current; if (!d?.driver_id) return;
    setIsLoadingBatchId(true);
    try { setActiveBatchId(await fetchActiveBatchId(d.driver_id)); } catch { } finally { setIsLoadingBatchId(false); }
  }, [fetchActiveBatchId]);

  const loadAttendanceStatus = useCallback(async () => {
    const d = driverRef.current; if (!d?.driver_phone) return;
    setIsLoadingAttendance(true);
    try { setAttendanceStatus(await fetchDriverAttendanceStatus(d.driver_phone)); } catch { setAttendanceStatus('offline'); } finally { setIsLoadingAttendance(false); }
  }, [fetchDriverAttendanceStatus]);

  useEffect(() => {
    if (activeTab === 'profile' && driverRef.current?.driver_id) { loadAttendanceStatus(); loadActiveBatchId(); }
  }, [activeTab, loadAttendanceStatus, loadActiveBatchId]);

  const fetchBlitzDataInBackground = useCallback(async (orders) => {
    if (!orders?.length) return;
    const ids = orders.map(o => o.merchant_order_id).filter(Boolean);
    if (!ids.length) return;
    setIsFetchingBlitzData(true);
    try {
      const BS = 3;
      for (let i = 0; i < ids.length; i += BS) {
        try {
          const res = await authAxiosRef.current.post('/blitz-proxy/search-orders', { merchantOrderIds: ids.slice(i, i + BS) }, { timeout: 30000 });
          if (res.data.success && res.data.data) {
            const br = res.data.data;
            setBlitzOrdersData(prev => ({ ...prev, ...br }));
            [...new Set(Object.values(br).map(d => d?.batch_id).filter(b => b && b > 0))].forEach(async bId => {
              try {
                const r = await authAxiosRef.current.get(`/blitz-proxy/batch-details/${bId}`, { timeout: 30000 });
                if (r.data.result && r.data.data) {
                  const { driver: dv = {}, orders: ords = [] } = r.data.data;
                  const info = ords.length === 0 ? { isAssigned:false, isEmpty:true }
                    : dv.id > 0 && dv.name ? { isAssigned:true, isEmpty:false, driverId:dv.id, driverName:dv.name, driverMobile:dv.mobile }
                    : { isAssigned:false, isEmpty:false };
                  setBatchDriverData(prev => ({ ...prev, [bId]: info }));
                }
              } catch { }
            });
          }
        } catch { }
        if (i + BS < ids.length) await new Promise(r => setTimeout(r, 150));
      }
    } catch { } finally { setIsFetchingBlitzData(false); }
  }, []);

  const loadOrders = useCallback(async () => {
    const d = driverRef.current; if (!d?.project) return;
    const ct = tokenRef.current; if (!ct) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    hasLoadedRef.current = true;
    setIsLoadingOrders(true); setOrdersError(null); setBlitzOrdersData({}); setBatchDriverData({});
    try {
      const res = await createAuthAxios(ct).get(`/merchant-orders/${d.project}/mitra/all`, { signal: abortRef.current.signal });
      if (res.data.success) { const o = res.data.data || []; setAllOrders(o); fetchBlitzDataInBackground(o); }
      else setOrdersError(res.data.message || 'Gagal memuat orders');
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') setOrdersError(err.response?.data?.message || 'Gagal memuat merchant orders');
    } finally { setIsLoadingOrders(false); abortRef.current = null; }
  }, [fetchBlitzDataInBackground]);

  useEffect(() => {
    if (!driver?.project || !token || hasLoadedRef.current) return;
    const t = setTimeout(loadOrders, 300);
    return () => { clearTimeout(t); if (abortRef.current) abortRef.current.abort(); };
  }, [driver?.project, token, loadOrders]);

  const filtered = useMemo(() => {
    let f = [...allOrders];
    if (debouncedSearch) { const q = debouncedSearch.toLowerCase(); f = f.filter(o => Object.values(o).some(v => v && v.toString().toLowerCase().includes(q))); }
    if (assignmentFilter) f = f.filter(o => (o.assignment_status || 'unassigned') === assignmentFilter);
    if (sortConfig.key) f.sort((a, b) => { const av = a[sortConfig.key]||'', bv = b[sortConfig.key]||''; return sortConfig.direction === 'asc' ? av.toString().localeCompare(bv.toString()) : bv.toString().localeCompare(av.toString()); });
    return f;
  }, [allOrders, debouncedSearch, assignmentFilter, sortConfig]);

  const paginated = useMemo(() => { const s = (currentPage-1)*itemsPerPage; return filtered.slice(s, s+itemsPerPage); }, [filtered, currentPage, itemsPerPage]);
  const totalPages = useMemo(() => Math.ceil(filtered.length/itemsPerPage), [filtered.length, itemsPerPage]);

  const isSelectable = useCallback((order) => {
    if (isFetchingBlitzData) return false;
    const bd = blitzOrdersData[order.merchant_order_id];
    if (bd && isTerminal(bd.order_status)) return false;
    const bId = bd?.batch_id;
    if (!bId || bId === 0) return true;
    const bdrv = batchDriverData[bId];
    if (!bdrv) return false;
    if (bdrv.isEmpty) return true;
    if (bdrv.isAssigned) return parseInt(bdrv.driverId) === parseInt(driverRef.current?.driver_id);
    return true;
  }, [blitzOrdersData, batchDriverData, isFetchingBlitzData]);

  const canUnassign = useCallback((order) => {
    if (isFetchingBlitzData) return false;
    const bd = blitzOrdersData[order.merchant_order_id];
    if (!bd || isTerminal(bd.order_status)) return false;
    const bId = bd?.batch_id; if (!bId) return false;
    const bdrv = batchDriverData[bId]; if (!bdrv?.isAssigned) return false;
    return parseInt(bdrv.driverId) === parseInt(driverRef.current?.driver_id);
  }, [blitzOrdersData, batchDriverData, isFetchingBlitzData]);

  const selectableOnPage = useMemo(() => paginated.filter(o => isSelectable(o)), [paginated, isSelectable]);
  const unassignableSelected = useMemo(() => allOrders.filter(o => selectedOrders.has(o._id) && canUnassign(o)), [allOrders, selectedOrders, canUnassign]);

  const handleSort = useCallback((key) => { setSortConfig(p => ({ key, direction: p.key===key && p.direction==='asc' ? 'desc' : 'asc' })); setCurrentPage(1); }, []);
  const handleSelectAll = useCallback(() => { if (selectedOrders.size===selectableOnPage.length && selectableOnPage.length>0) setSelectedOrders(new Set()); else setSelectedOrders(new Set(selectableOnPage.map(o => o._id))); }, [selectableOnPage, selectedOrders.size]);
  const handleSelectOrder = useCallback((id, order) => { if (!isSelectable(order)) return; setSelectedOrders(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, [isSelectable]);

  const handleUnassignOrder = async (order) => {
    const bd = blitzOrdersData[order.merchant_order_id], bId = bd?.batch_id;
    if (!bId) { alert('Order tidak memiliki batch ID'); return; }
    if (!window.confirm(`Unassign order ${order.merchant_order_id} dari batch ${bId}?`)) return;
    const d = driverRef.current;
    setUnassigningOrders(p => new Set(p).add(order._id));
    try {
      const res = await authAxiosRef.current.post('/blitz-proxy/remove-order-from-batch', { batchId:bId, merchantOrderId:order.merchant_order_id, orderId:order._id, project:d.project }, { timeout:60000 });
      if (res.data.success) { alert(`✅ Order ${order.merchant_order_id} berhasil di-unassign dari batch ${bId}`); await loadOrders(); await loadActiveBatchId(); }
      else alert(`❌ Gagal unassign: ${res.data.message}`);
    } catch (err) { alert(`❌ Gagal unassign: ${err.response?.data?.message || err.message}`); }
    finally { setUnassigningOrders(p => { const s = new Set(p); s.delete(order._id); return s; }); }
  };

  const handleBulkUnassign = async () => {
    if (!unassignableSelected.length) { alert('Tidak ada order yang dapat di-unassign'); return; }
    const bIds = [...new Set(unassignableSelected.map(o => blitzOrdersData[o.merchant_order_id]?.batch_id).filter(Boolean))];
    if (!window.confirm(`Unassign ${unassignableSelected.length} order(s) dari batch ${bIds.join(', ')}?`)) return;
    const d = driverRef.current; setIsBulkUnassigning(true);
    let ok = 0, fail = 0; const errs = [];
    for (const order of unassignableSelected) {
      const bId = blitzOrdersData[order.merchant_order_id]?.batch_id;
      if (!bId) { fail++; errs.push(`${order.merchant_order_id}: No batch ID`); continue; }
      try {
        const res = await authAxiosRef.current.post('/blitz-proxy/remove-order-from-batch', { batchId:bId, merchantOrderId:order.merchant_order_id, orderId:order._id, project:d.project }, { timeout:60000 });
        if (res.data.success) ok++; else throw new Error(res.data.message);
      } catch (err) { fail++; errs.push(`${order.merchant_order_id}: ${err.message}`); }
    }
    setIsBulkUnassigning(false);
    alert(`✅ Berhasil: ${ok} order(s)${fail > 0 ? `\n❌ Gagal: ${fail}\n${errs.slice(0,5).join('\n')}` : ''}`);
    setSelectedOrders(new Set()); await loadOrders(); await loadActiveBatchId();
  };

  const handleAssign = async () => {
    if (!selectedOrders.size) { alert('Pilih minimal 1 order'); return; }
    const d = driverRef.current; setIsLoadingAttendance(true);
    try {
      const cs = await fetchDriverAttendanceStatus(d.driver_phone); setAttendanceStatus(cs); setIsLoadingAttendance(false);
      if (cs !== 'online') { alert('⚠️ Driver harus ONLINE di Blitz terlebih dahulu.\n\n1. Buka aplikasi Blitz\n2. Ubah status ke ONLINE\n3. Coba assign kembali'); return; }
      const allData = (await authAxiosRef.current.get(`/merchant-orders/${d.project}/mitra/all`)).data.data || [];
      const selList = allData.filter(o => selectedOrders.has(o._id));
      const senders = [...new Set(selList.map(o => o.sender_name))];
      if (senders.length > 1) {
        const vr = await authAxiosRef.current.post(`/merchant-orders/${d.project}/validate-multiple-senders`, { senderNames: senders });
        if (!vr.data.success) { alert(`⚠️ Sender tidak terdaftar:\n${(vr.data.invalidSenders||[]).join('\n')}`); return; }
        const vMap = vr.data.data, grouped = {};
        selList.forEach(o => { if (!grouped[o.sender_name]) grouped[o.sender_name]=[]; grouped[o.sender_name].push(o); });
        if (!window.confirm(`Assign order dari ${senders.length} sender ke driver ${d.driver_name}?\n\n${Object.entries(grouped).map(([n,os]) => `• ${n} (${os.length} order)`).join('\n')}`)) return;
        setIsAssigning(true);
        let ts = 0, tf = 0; const fm = [];
        for (const [sn, sOrds] of Object.entries(grouped)) {
          const vd = vMap[sn], oids = sOrds.map(o => o._id), [lon, lat] = vd.location.coordinates;
          let cb = activeBatchId;
          if (cb) { const nr = await authAxiosRef.current.post('/blitz-proxy/nearby-drivers', { lat, lon }); if (!nr.data.success || !nr.data.data.driverList?.find(dr => dr.driver_phone===d.driver_phone)) cb = null; }
          try {
            let result;
            if (cb) {
              const ar = await authAxiosRef.current.post('/blitz-proxy/add-to-existing-batch', { orders:sOrds, batchId:cb, hubId:vd.business_hub, business:vd.business, city:vd.city, serviceType:vd.service_type }, { timeout:180000 });
              if (ar.data.success) { await assignOrders(oids, cb, vd); result = { success:true }; } else result = { success:false, message:ar.data.message };
            } else result = await assignOrders(oids, null, vd);
            if (result.success) ts += oids.length; else { tf += oids.length; fm.push(`${sn}: ${result.message}`); }
          } catch (err) { tf += oids.length; fm.push(`${sn}: ${err.message}`); }
        }
        setIsAssigning(false);
        alert(`✅ Berhasil assign ${ts} order(s)${tf>0 ? `\n❌ Gagal: ${tf}\n${fm.join('\n')}` : ''}`);
        setSelectedOrders(new Set()); await loadOrders(); setActiveBatchId(await fetchActiveBatchId(d.driver_id)); await loadAttendanceStatus(); return;
      }
      const sn = senders[0];
      const vr = await authAxiosRef.current.post(`/merchant-orders/${d.project}/validate-sender`, { senderName: sn });
      if (!vr.data.success) { alert(`⚠️ Sender "${sn}" tidak terdaftar.`); return; }
      const vd = vr.data.data, [lon, lat] = vd.location.coordinates;
      if (!activeBatchId) {
        const nr = await authAxiosRef.current.post('/blitz-proxy/nearby-drivers', { lat, lon });
        if (!nr.data.success) { alert('⚠️ Gagal mengecek driver nearby.'); return; }
        if (!nr.data.data.driverList?.find(dr => dr.driver_phone===d.driver_phone)) { alert('⚠️ Driver tidak ditemukan di area pickup.\n\n1. Pastikan ONLINE di Blitz\n2. Berada di area yang sesuai\n3. GPS aktif'); return; }
      }
      if (!window.confirm(`Assign ${selectedOrders.size} order(s) ke driver ${d.driver_name}?`)) return;
      setIsAssigning(true);
      const oids = Array.from(selectedOrders); let result;
      if (activeBatchId) {
        const ar = await authAxiosRef.current.post('/blitz-proxy/add-to-existing-batch', { orders:allData.filter(o => oids.includes(o._id)), batchId:activeBatchId, hubId:vd.business_hub, business:vd.business, city:vd.city, serviceType:vd.service_type }, { timeout:180000 });
        if (ar.data.success) { await assignOrders(oids, activeBatchId, vd); result = { success:true, addedToExistingBatch:true, batchId:activeBatchId, assignedCount:oids.length, driverInfo:{ driverName:d.driver_name } }; }
        else result = { success:false, message:ar.data.message };
      } else result = await assignOrders(oids, null, vd);
      if (result.success) {
        alert(result.addedToExistingBatch
          ? `✅ Ditambahkan ke batch #${activeBatchId}\nJumlah: ${result.assignedCount} order\nDriver: ${result.driverInfo.driverName}`
          : result.batchId ? `✅ Batch baru dibuat!\nBatch ID: #${result.batchId}\nJumlah: ${result.assignedCount} order\nDriver: ${result.driverInfo?.driverName}`
          : `⚠️ Assignment selesai. ${result.message||''}`);
        setSelectedOrders(new Set()); await loadOrders(); setActiveBatchId(await fetchActiveBatchId(d.driver_id)); await loadAttendanceStatus();
      } else alert(`❌ Gagal assign: ${result.message}\n${result.error||''}`);
    } catch (err) { alert(`Terjadi kesalahan: ${err.response?.data?.message || err.message || 'Unknown error'}`); }
    finally { setIsAssigning(false); setIsLoadingAttendance(false); }
  };

  const SortIco = useCallback(({ col }) => {
    if (sortConfig.key !== col) return <SortAsc size={12} color="#CBD5E1" />;
    return sortConfig.direction === 'asc' ? <SortAsc size={12} color="#2563EB" /> : <SortDesc size={12} color="#2563EB" />;
  }, [sortConfig]);

  const handleLogout = async () => { await logout(); window.location.href = '/login-mitra'; };
  const isAssignBlocked = isFetchingBlitzData || isAssigning || isLoadingAttendance;
  const projectLabel = PM[driver?.project] || driver?.project;

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const total = filtered.length;
    const pages = (() => {
      const delta = isSmall ? 0 : 1, range = [], res = [];
      for (let i = Math.max(2, currentPage-delta); i <= Math.min(totalPages-1, currentPage+delta); i++) range.push(i);
      if (currentPage-delta > 2) res.push(1, '…'); else res.push(1);
      res.push(...range);
      if (currentPage+delta < totalPages-1) res.push('…', totalPages); else res.push(totalPages);
      return res;
    })();
    const btnBase = { display:'flex', alignItems:'center', gap:3, padding:'6px 10px', borderRadius:8, border:'1px solid #E2E8F0', background:'#FFFFFF', fontSize:12, cursor:'pointer' };
    return (
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10, padding:'12px 16px', borderTop:'1px solid #F1F5F9', background:'#FAFAFA' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'#64748B' }}>
            <strong style={{ color:'#1E293B' }}>{((currentPage-1)*itemsPerPage)+1}–{Math.min(currentPage*itemsPerPage, total)}</strong> / {total}
          </span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding:'4px 8px', borderRadius:7, border:'1px solid #E2E8F0', fontSize:12, color:'#475569', background:'#FFFFFF', cursor:'pointer' }}>
            {[25,50,100].map(n => <option key={n} value={n}>{n}/hal</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          <button onClick={() => setCurrentPage(p => p-1)} disabled={currentPage===1} style={{ ...btnBase, color: currentPage===1?'#CBD5E1':'#475569', cursor: currentPage===1?'not-allowed':'pointer' }}><ChevronLeft size={13} /></button>
          {pages.map((p, i) => (
            <button key={i} onClick={() => typeof p==='number' ? setCurrentPage(p) : null} disabled={p==='…'} style={{ minWidth:32, height:32, padding:'0 6px', borderRadius:8, border: p===currentPage?'none':'1px solid #E2E8F0', background: p===currentPage?'#2563EB':'#FFFFFF', color: p===currentPage?'#FFFFFF':p==='…'?'#CBD5E1':'#475569', fontSize:12, fontWeight: p===currentPage?700:400, cursor: p==='…'?'default':'pointer' }}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => p+1)} disabled={currentPage===totalPages} style={{ ...btnBase, color: currentPage===totalPages?'#CBD5E1':'#475569', cursor: currentPage===totalPages?'not-allowed':'pointer' }}><ChevronRight size={13} /></button>
        </div>
      </div>
    );
  };

  if (!driver) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#F8FAFC' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #DBEAFE', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:14, color:'#64748B', fontWeight:500 }}>Memuat dashboard...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="mtr-root">

        {/* HEADER */}
        <header className="mtr-header" style={{ background:'#1E293B', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.18)' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding: isMobile ? '10px 12px' : '0 24px', width:'100%' }}>
            {isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Row 1: Logo + Logout */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, width:'100%', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0, flex:1 }}>
                    <div style={{ width:30, height:30, background:'#2563EB', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Truck size={15} color="#FFF" />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F8FAFC', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Mitra Dashboard</div>
                      <div style={{ fontSize:11, color:'#64748B', lineHeight:1.2 }}>{projectLabel}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8, border:'1px solid #334155', background:'transparent', fontSize:12, fontWeight:600, color:'#94A3B8', cursor:'pointer', flexShrink:0 }}>
                    <LogOut size={13} />Logout
                  </button>
                </div>
                {/* Row 2: Tabs — full width */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, background:'#0F172A', borderRadius:10, padding:4 }}>
                  {[{id:'profile',label:'Profile',icon:<User size={13}/>},{id:'orders',label:'Merchant Orders',icon:<Package size={13}/>}].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 4px', borderRadius:7, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background: activeTab===tab.id?'#2563EB':'transparent', color: activeTab===tab.id?'#FFFFFF':'#64748B', whiteSpace:'nowrap', width:'100%' }}>
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <div style={{ width:32, height:32, background:'#2563EB', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Truck size={17} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#F8FAFC', lineHeight:1.2 }}>Mitra Dashboard</div>
                    <div style={{ fontSize:11, color:'#64748B', lineHeight:1.2 }}>{projectLabel}</div>
                  </div>
                </div>
                <nav style={{ display:'flex', gap:4, background:'#0F172A', borderRadius:10, padding:4 }}>
                  {[{id:'profile',label:'Profile',icon:<User size={14}/>},{id:'orders',label:'Merchant Orders',icon:<Package size={14}/>}].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:7, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background: activeTab===tab.id?'#2563EB':'transparent', color: activeTab===tab.id?'#FFFFFF':'#64748B' }}>
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </nav>
                <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #334155', background:'transparent', fontSize:13, fontWeight:600, color:'#94A3B8', cursor:'pointer', flexShrink:0 }}>
                  <LogOut size={14} />Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MAIN */}
        <main className="mtr-main" style={{ maxWidth:1280, margin:'0 auto', padding: isMobile ? '14px 12px 24px' : '24px 24px 32px' }}>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: isMobile ? '100%' : 600, animation:'fadeUp 0.2s ease', width:'100%', minWidth:0 }}>
              {/* Driver Card */}
              <div style={{ background:'#FFFFFF', borderRadius:16, border:'1px solid #E2E8F0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden', marginBottom:14 }}>
                {/* Card header */}
                <div style={{ padding:'16px 16px 14px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <div style={{ width:40, height:40, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <User size={20} color="#2563EB" />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{driver.driver_name}</div>
                      <div style={{ fontSize:12, color:'#94A3B8' }}>Mitra {projectLabel}</div>
                    </div>
                  </div>
                  <div style={{ flexShrink:0 }}>
                    {isLoadingAttendance
                      ? <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94A3B8' }}><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} />Memuat...</span>
                      : <OnlineBadge status={attendanceStatus} />
                    }
                  </div>
                </div>
                {/* Info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#F8FAFC' }}>
                  {[
                    { label:'Driver ID', icon:<Hash size={13} color="#94A3B8"/>, value: <span className="mtr-mono" style={{ fontSize:15, fontWeight:700, color:'#1E293B' }}>{driver.driver_id}</span> },
                    { label:'No Telepon', icon:<Phone size={13} color="#94A3B8"/>, value: <span style={{ fontSize:14, fontWeight:600, color:'#1E293B' }}>{driver.driver_phone}</span> },
                  ].map(({ label, icon, value }) => (
                    <div key={label} style={{ background:'#FFFFFF', padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                        {icon}
                        <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                      </div>
                      {value}
                    </div>
                  ))}
                  <div style={{ background:'#FFFFFF', padding:'14px 16px', gridColumn:'1 / -1', borderTop:'1px solid #F8FAFC' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
                      <Truck size={13} color="#94A3B8" />
                      <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Batch Aktif</span>
                    </div>
                    {isLoadingBatchId
                      ? <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94A3B8' }}><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} />Memuat...</span>
                      : activeBatchId ? <BatchChip batchId={activeBatchId} /> : <span style={{ fontSize:13, color:'#94A3B8' }}>Tidak ada batch aktif</span>
                    }
                  </div>
                </div>
              </div>
              {/* Guide */}
              <div style={{ background:'#EFF6FF', borderRadius:14, border:'1px solid #BFDBFE', padding:'14px 16px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:32, height:32, background:'#DBEAFE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Package size={16} color="#2563EB" />
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#1E3A8A', marginBottom:4 }}>Cara Penggunaan</p>
                    <p style={{ fontSize:12, color:'#3B82F6', lineHeight:1.6 }}>
                      Buka tab <strong>Merchant Orders</strong> → Pilih order tersedia → Klik <strong>Assign</strong>. Pastikan status driver <strong>ONLINE</strong> di Blitz sebelum assign.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div style={{ background:'#FFFFFF', borderRadius:16, border:'1px solid #E2E8F0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden', animation:'fadeUp 0.2s ease', width:'100%', minWidth:0 }}>

              {/* Toolbar */}
              <div style={{ padding: isMobile ? '14px 14px 12px' : '18px 20px 14px', borderBottom:'1px solid #F1F5F9' }}>
                {/* Title row */}
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'#1E293B' }}>Merchant Orders</span>
                      <span style={{ padding:'2px 9px', background:'#F1F5F9', borderRadius:99, fontSize:12, fontWeight:700, color:'#64748B' }}>{filtered.length}</span>
                      {isFetchingBlitzData && (
                        <span style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:99, fontSize:11, color:'#92400E', fontWeight:600 }}>
                          <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }} />Sinkronisasi...
                        </span>
                      )}
                    </div>
                    {selectedOrders.size > 0 && <div style={{ fontSize:12, color:'#2563EB', marginTop:3, fontWeight:500 }}>{selectedOrders.size} order dipilih</div>}
                  </div>
                  {/* Action buttons */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    {unassignableSelected.length > 0 && (
                      <ActionBtn onClick={handleBulkUnassign} disabled={isBulkUnassigning} color="#FFFFFF" bg="#DC2626">
                        {isBulkUnassigning ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : <X size={13} />}
                        Lepas ({unassignableSelected.length})
                      </ActionBtn>
                    )}
                    <ActionBtn onClick={handleAssign} disabled={selectedOrders.size===0 || isAssignBlocked} title={isFetchingBlitzData?'Menunggu sinkronisasi...':selectedOrders.size===0?'Pilih order dulu':''}>
                      {isAssigning || isLoadingAttendance
                        ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} />{isLoadingAttendance?'Mengecek...':'Assign...'}</>
                        : isFetchingBlitzData
                          ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} />Tunggu...</>
                          : <><Send size={13} />Assign{selectedOrders.size>0?` (${selectedOrders.size})`:''}</>
                      }
                    </ActionBtn>
                    <ActionBtn onClick={loadOrders} disabled={isLoadingOrders} color="#475569" bg="#FFFFFF" border="1px solid #E2E8F0">
                      {isLoadingOrders ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
                      {!isSmall && 'Refresh'}
                    </ActionBtn>
                  </div>
                </div>
                {/* Search + filter */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  <div style={{ position:'relative', flex:'1 1 160px', minWidth:0 }}>
                    <Search size={14} color="#94A3B8" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input
                      type="text" placeholder="Cari order ID, nama, kota..." value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      disabled={isLoadingOrders}
                      style={{ width:'100%', paddingLeft:34, paddingRight: searchTerm?30:12, paddingTop:9, paddingBottom:9, border:'1px solid #E2E8F0', borderRadius:9, fontSize:13, color:'#1E293B', background:'#F8FAFC' }}
                    />
                    {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:2, display:'flex' }}><X size={13} /></button>}
                  </div>
                  <select value={assignmentFilter} onChange={e => { setAssignmentFilter(e.target.value); setCurrentPage(1); setSelectedOrders(new Set()); }} disabled={isLoadingOrders}
                    style={{ padding:'9px 10px', border:'1px solid #E2E8F0', borderRadius:9, fontSize:13, color:'#475569', background:'#F8FAFC', cursor:'pointer', minWidth:0, flexShrink:1 }}>
                    <option value="">Semua Status</option>
                    {aStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                  {(searchTerm || assignmentFilter) && (
                    <button onClick={() => { setSearchTerm(''); setAssignmentFilter(''); setSortConfig({ key:'createdAt', direction:'desc' }); setCurrentPage(1); }} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 12px', borderRadius:9, border:'1px solid #E2E8F0', background:'#FFFFFF', fontSize:13, color:'#475569', cursor:'pointer' }}>
                      <X size={13} />Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              {isLoadingOrders ? (
                isMobile ? <SkCards /> : <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse' }}><tbody><SkRows /></tbody></table></div>
              ) : ordersError ? (
                <div style={{ textAlign:'center', padding:'56px 20px' }}>
                  <div style={{ width:48, height:48, background:'#FFF1F2', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <AlertCircle size={22} color="#F43F5E" />
                  </div>
                  <p style={{ fontSize:15, fontWeight:700, color:'#1E293B', marginBottom:6 }}>Gagal memuat orders</p>
                  <p style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>{ordersError}</p>
                  <ActionBtn onClick={loadOrders} color="#475569" bg="#FFFFFF" border="1px solid #E2E8F0"><RotateCcw size={13} />Coba lagi</ActionBtn>
                </div>
              ) : paginated.length === 0 ? (
                <div style={{ textAlign:'center', padding:'56px 20px' }}>
                  <div style={{ width:48, height:48, background:'#F8FAFC', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <FileSpreadsheet size={22} color="#CBD5E1" />
                  </div>
                  <p style={{ fontSize:15, fontWeight:700, color:'#1E293B', marginBottom:6 }}>{searchTerm||assignmentFilter ? 'Tidak ada hasil' : 'Belum ada orders'}</p>
                  <p style={{ fontSize:13, color:'#94A3B8' }}>{searchTerm||assignmentFilter ? 'Coba ubah atau hapus filter' : 'Orders dari merchant akan tampil di sini'}</p>
                </div>
              ) : isMobile ? (
                <>
                  {/* Mobile select-all bar */}
                  <div style={{ padding:'9px 14px', borderBottom:'1px solid #F1F5F9', background:'#FAFAFA', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <button onClick={handleSelectAll} disabled={selectableOnPage.length===0} style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none', cursor: selectableOnPage.length===0?'not-allowed':'pointer', fontSize:13, fontWeight:600, color: selectedOrders.size>0?'#2563EB':'#64748B', opacity: selectableOnPage.length===0?0.4:1 }}>
                      {selectedOrders.size===selectableOnPage.length && selectableOnPage.length>0 ? <CheckSquare size={16} color="#2563EB"/> : <Square size={16} />}
                      {selectedOrders.size > 0 ? `${selectedOrders.size} dipilih` : 'Pilih semua'}
                    </button>
                    <div style={{ display:'flex', gap:10 }}>
                      {[['merchant_order_id','ID'],['createdAt','Tgl']].map(([k,l]) => (
                        <button key={k} onClick={() => handleSort(k)} style={{ display:'flex', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', fontSize:12, color: sortConfig.key===k?'#2563EB':'#94A3B8', fontWeight:600 }}>
                          {l}<SortIco col={k} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Cards */}
                  <div style={{ padding:'10px 10px', display:'flex', flexDirection:'column', gap:8 }}>
                    {paginated.map((order, i) => {
                      const bd = blitzOrdersData[order.merchant_order_id], bId = bd?.batch_id, bdrv = bId ? batchDriverData[bId] : null;
                      return <MobileCard key={order._id||i} order={order} isSelected={selectedOrders.has(order._id)} isSelectable={isSelectable(order)} showUnassign={canUnassign(order)} onSelect={handleSelectOrder} onUnassign={handleUnassignOrder} blitzData={bd} batchId={bId} batchDriver={bdrv} isFetchingBlitzData={isFetchingBlitzData} unassigningOrders={unassigningOrders} />;
                    })}
                  </div>
                  <Pagination />
                </>
              ) : (
                <>
                  <div style={{ overflowX:'auto', width:'100%' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:880 }}>
                      <thead>
                        <tr style={{ background:'#FAFAFA', borderBottom:'2px solid #F1F5F9' }}>
                          <th style={{ padding:'12px 16px', width:46, textAlign:'center' }}>
                            <button onClick={handleSelectAll} disabled={selectableOnPage.length===0} style={{ background:'none', border:'none', padding:0, cursor: selectableOnPage.length===0?'not-allowed':'pointer', color: selectedOrders.size===selectableOnPage.length && selectableOnPage.length>0?'#2563EB':'#CBD5E1', display:'flex', opacity: selectableOnPage.length===0?0.4:1 }}>
                              {selectedOrders.size===selectableOnPage.length && selectableOnPage.length>0 ? <CheckSquare size={17}/> : <Square size={17}/>}
                            </button>
                          </th>
                          {[['merchant_order_id','Order ID'],['consignee_name','Penerima'],['destination_city','Kota Tujuan'],['pickup_instructions','Instruksi']].map(([k,l]) => (
                            <th key={k} onClick={() => handleSort(k)} style={{ padding:'12px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}>{l}<SortIco col={k} /></div>
                            </th>
                          ))}
                          <th style={{ padding:'12px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>Status</th>
                          <th style={{ padding:'12px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Batch</th>
                          <th style={{ width:70 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((order, i) => {
                          const bd = blitzOrdersData[order.merchant_order_id], bId = bd?.batch_id, bdrv = bId ? batchDriverData[bId] : null;
                          const sel = isSelectable(order), showU = canUnassign(order), term = bd && isTerminal(bd.order_status);
                          const rowSel = selectedOrders.has(order._id), isUn = unassigningOrders.has(order._id);
                          return (
                            <tr key={order._id||i} className="mtr-row" style={{ borderBottom:'1px solid #F8FAFC', background: rowSel?'#EFF6FF':'#FFFFFF', opacity:(!sel&&!showU)?0.45:1, transition:'background 0.1s' }}>
                              <td style={{ padding:'12px 16px', textAlign:'center' }}>
                                {sel
                                  ? <button onClick={() => handleSelectOrder(order._id, order)} style={{ background:'none', border:'none', padding:0, cursor:'pointer', color: rowSel?'#2563EB':'#CBD5E1', display:'flex' }}>{rowSel?<CheckSquare size={17}/>:<Square size={17}/>}</button>
                                  : <Lock size={14} color="#CBD5E1" title={term?`Status: ${bd?.order_status}`:isFetchingBlitzData?'Memuat...':bdrv?.driverName?`Locked: ${bdrv.driverName}`:'Validating...'} />
                                }
                              </td>
                              <td style={{ padding:'12px 14px' }}>
                                <span className="mtr-mono" style={{ fontSize:12, fontWeight:600, color:'#1E293B', display:'block', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={order.merchant_order_id}>{order.merchant_order_id||'—'}</span>
                              </td>
                              <td style={{ padding:'12px 14px' }}>
                                <div style={{ fontSize:13, fontWeight:600, color:'#1E293B', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{order.consignee_name||'—'}</div>
                                {order.consignee_phone && <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{order.consignee_phone}</div>}
                              </td>
                              <td style={{ padding:'12px 14px' }}><span style={{ fontSize:13, color:'#475569', display:'block', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{order.destination_city||'—'}</span></td>
                              <td style={{ padding:'12px 14px' }}><span style={{ fontSize:12, color:'#94A3B8', display:'block', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{order.pickup_instructions||'—'}</span></td>
                              <td style={{ padding:'12px 14px' }}>
                                {isFetchingBlitzData && !bd
                                  ? <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#94A3B8' }}><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} />Memuat</span>
                                  : <StatusPill status={bd?.order_status??null} driverName={!term?bdrv?.driverName:null} />
                                }
                              </td>
                              <td style={{ padding:'12px 14px' }}>
                                {bId ? (
                                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                    <BatchChip batchId={bId} />
                                    {!term && showU && <span style={{ fontSize:11, color:'#16A34A', fontWeight:600 }}>✓ Batch Anda</span>}
                                    {!term && bdrv?.isAssigned && !showU && <span style={{ fontSize:11, color:'#DC2626', fontWeight:600 }}>🔒 Dikunci</span>}
                                  </div>
                                ) : isFetchingBlitzData ? <Loader2 size={12} color="#E2E8F0" style={{ animation:'spin 1s linear infinite' }} /> : <span style={{ color:'#E2E8F0' }}>—</span>}
                              </td>
                              <td style={{ padding:'12px 14px', textAlign:'right' }}>
                                {showU && (
                                  <button onClick={() => handleUnassignOrder(order)} disabled={isUn} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, color:'#EF4444', background:'none', border:'none', cursor: isUn?'not-allowed':'pointer', opacity: isUn?0.5:1, padding:'4px 6px', borderRadius:6 }}>
                                    {isUn ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }} /> : <X size={11} />}
                                    Lepas
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}