import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Truck, User, Upload, RefreshCw, Loader2,
  FileSpreadsheet, Trash2, CheckSquare, Square, MapPin, Zap,
  Navigation, Package, Route, ChevronDown, ChevronUp,
  Search, X, AlertCircle, Warehouse, Activity,
  Shield, ArrowLeftRight, Eye, Info, BarChart2, Move, Send
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { API_URL, GOOGLE_MAPS_API_KEY, DRIVER_COLORS, SLA_THRESHOLDS } from './constants';
import {
  hasCoords,
  enrichOrdersWithCoords,
  kMeansCluster,
  buildOptimalRoute,
  buildReassignedRoute,
  generateDeliveryStrategy,
  getSlaStatus,
  fetchDirections,
  buildMapsUrl,
} from './generateStrategy';
import {
  validateInvoiceStatuses,
  checkRiderCondition,
  executeAssign,
} from './assignValidation';
import {
  BlitzStatusBadge,
  BatchIdCell,
  SlaIndicator,
  RouteInsightPanel,
  RiderStatusDot,
  SlaWarningBanner,
} from './StrategyTableHelpers';

const fetchBlitzOrdersData = async (merchantOrderIds) => {
  if (!merchantOrderIds || merchantOrderIds.length === 0) return {};
  try {
    const res = await fetch(`${API_URL}/api/blitz-proxy/search-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantOrderIds }),
    });
    const data = await res.json();
    if (data.success) return data.data;
    return {};
  } catch {
    return {};
  }
};

const fetchDriverAttendanceStatus = async (driverPhone) => {
  try {
    const res = await fetch(`${API_URL}/api/blitz-proxy/driver-attendance/${driverPhone}`);
    const data = await res.json();
    if (data.success) return data.status || 'offline';
    return 'offline';
  } catch {
    return 'offline';
  }
};

const fetchActiveBatchId = async (driverId) => {
  try {
    const res = await fetch(`${API_URL}/api/blitz-proxy/active-batch/${driverId}`);
    const data = await res.json();
    if (data.success && data.batchId) return data.batchId;
    return null;
  } catch {
    return null;
  }
};

const fetchNearbyDrivers = async (lat, lon) => {
  try {
    const res = await fetch(`${API_URL}/api/blitz-proxy/nearby-drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    });
    const data = await res.json();
    if (data.success) return data.data?.driverList || [];
    return [];
  } catch {
    return [];
  }
};

const fetchPickupPoints = async (project) => {
  try {
    const senderRes = await fetch(`${API_URL}/api/merchant-orders/${project}/all`);
    const senderData = await senderRes.json();
    if (!senderData.success) return [];
    const uniqueSenders = [...new Set(senderData.data.map((o) => o.sender_name).filter(Boolean))];
    if (!uniqueSenders.length) return [];
    const res = await fetch(
      `${API_URL}/api/merchant-orders/${project}/validate-multiple-senders`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderNames: uniqueSenders }),
      }
    );
    const data = await res.json();
    if (data.success && data.data) {
      return Object.entries(data.data).map(([name, entry]) => {
        const coords =
          entry.location?.coordinates?.length === 2
            ? { lat: entry.location.coordinates[1], lng: entry.location.coordinates[0] }
            : null;
        return {
          sender_name: name,
          coords,
          hasCoords: !!(coords && coords.lat !== 0 && coords.lng !== 0),
        };
      });
    }
    return [];
  } catch {
    return [];
  }
};

function AssignConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmColor }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
            <p className="text-gray-600 text-xs mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Tidak</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${confirmColor || 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel || 'Ya'}</button>
        </div>
      </div>
    </div>
  );
}

function MapView({ orders, strategyList, selectedOrders: selIds, onOrderSelect, focusedDriverIdx, onFocusCleared, onClearFocus, reassignTarget, onReassignOrder, searchHighlightIds }) {
  const mapRef = useRef(null);
  const mapInstRef = useRef(null);
  const markersRef = useRef([]);
  const rendererRef = useRef([]);
  const polylinesRef = useRef([]);
  const originMarkersRef = useRef([]);
  const iwRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodePct, setGeocodePct] = useState(0);
  const [enriched, setEnriched] = useState([]);
  const [trafficVisible, setTrafficVisible] = useState(false);
  const [activeFocusIdx, setActiveFocusIdx] = useState(null);

  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return; }
    const existing = document.getElementById('gmap-sdk');
    if (existing) { existing.addEventListener('load', () => setMapLoaded(true)); return; }
    const s = document.createElement('script');
    s.id = 'gmap-sdk';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    s.async = true; s.onload = () => setMapLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    mapInstRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -6.2, lng: 106.8 }, zoom: 11,
      mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
    });
    iwRef.current = new window.google.maps.InfoWindow();
    trafficLayerRef.current = new window.google.maps.TrafficLayer();
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !orders.length) return;
    if (!orders.some((o) => !hasCoords(o))) { setEnriched(orders); return; }
    setGeocoding(true);
    enrichOrdersWithCoords(orders, (pct) => setGeocodePct(pct)).then((e) => {
      setEnriched(e);
      setGeocoding(false);
    });
  }, [orders, mapLoaded]);

  const toggleTraffic = useCallback(() => {
    if (!trafficLayerRef.current || !mapInstRef.current) return;
    if (trafficVisible) { trafficLayerRef.current.setMap(null); setTrafficVisible(false); }
    else { trafficLayerRef.current.setMap(mapInstRef.current); setTrafficVisible(true); }
  }, [trafficVisible]);

  useEffect(() => {
    if (!mapInstRef.current || !mapLoaded || focusedDriverIdx === null || focusedDriverIdx === undefined) return;
    if (!strategyList?.length || focusedDriverIdx >= strategyList.length) return;
    setActiveFocusIdx(focusedDriverIdx);
    const strategy = strategyList[focusedDriverIdx];
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;
    if (strategy.originCoords) { bounds.extend({ lat: strategy.originCoords.lat, lng: strategy.originCoords.lng }); hasPoints = true; }
    strategy.route.forEach((o) => { if (hasCoords(o)) { bounds.extend({ lat: o.dropoff_lat, lng: o.dropoff_long }); hasPoints = true; } });
    if (hasPoints) mapInstRef.current.fitBounds(bounds, { padding: 80 });
    if (!trafficVisible && trafficLayerRef.current) { trafficLayerRef.current.setMap(mapInstRef.current); setTrafficVisible(true); }
    onFocusCleared?.();
  }, [focusedDriverIdx, strategyList, mapLoaded]);

  const clearMap = () => {
    [...markersRef.current, ...originMarkersRef.current].forEach((m) => m.setMap(null));
    rendererRef.current.forEach((r) => r.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    markersRef.current = []; rendererRef.current = []; polylinesRef.current = []; originMarkersRef.current = [];
  };

  useEffect(() => {
    if (!mapInstRef.current || !mapLoaded) return;
    clearMap();
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;
    const isFocused = activeFocusIdx !== null && strategyList?.length > activeFocusIdx;

    if (strategyList?.length > 0) {
      strategyList.forEach((strategy, stratIdx) => {
        const color = strategy.color;
        const isActive = !isFocused || stratIdx === activeFocusIdx;
        const dimOpacity = 0.12;

        if (strategy.originCoords) {
          const pos = { lat: strategy.originCoords.lat, lng: strategy.originCoords.lng };
          const fillColor = isActive ? color : '#9CA3AF';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="50" viewBox="0 0 44 50" opacity="${isActive ? 1 : dimOpacity}"><path d="M22 0C9.85 0 0 9.85 0 22c0 16.5 22 28 22 28s22-11.5 22-28C44 9.85 34.15 0 22 0z" fill="${fillColor}"/><rect x="10" y="11" width="24" height="22" rx="3" fill="white"/><rect x="16" y="22" width="5" height="11" fill="${fillColor}"/><rect x="23" y="17" width="7" height="7" fill="${fillColor}"/></svg>`;
          const iw = `<div style="font-family:sans-serif;padding:8px;max-width:220px"><b style="color:${color}">🏭 ${strategy.pickupPoint?.sender_name || '-'}</b><br><span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px;display:inline-block;margin-top:4px">Driver: ${strategy.driver?.driver_name} — ${strategy.route.length} stops</span></div>`;
          const m = new window.google.maps.Marker({ position: pos, map: mapInstRef.current, icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(44, 50) }, zIndex: isActive ? 200 : 1 });
          m.addListener('click', () => { iwRef.current.setContent(iw); iwRef.current.open(mapInstRef.current, m); });
          originMarkersRef.current.push(m);
          if (isActive) { bounds.extend(pos); hasPoints = true; }
        }

        strategy.route.forEach((order, si) => {
          if (!hasCoords(order)) return;
          const pos = { lat: order.dropoff_lat, lng: order.dropoff_long };
          const isSearchMatch = !searchHighlightIds || searchHighlightIds.size === 0 || searchHighlightIds.has(order._id);
          const effectiveActive = isActive && isSearchMatch;
          const markerOpacity = effectiveActive ? 1 : (searchHighlightIds && searchHighlightIds.size > 0 ? 0.08 : dimOpacity);
          const markerScale = isSearchMatch && searchHighlightIds?.size > 0 ? [40, 46] : [34, 40];
          const markerColor = effectiveActive ? color : '#D1D5DB';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${markerScale[0]}" height="${markerScale[1]}" viewBox="0 0 34 40" opacity="${markerOpacity}"><path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 23 17 23s17-10.25 17-23C34 7.611 26.389 0 17 0z" fill="${markerColor}"${isSearchMatch && searchHighlightIds?.size > 0 ? ' stroke="#FFFFFF" stroke-width="1.5"' : ''}/><circle cx="17" cy="17" r="10" fill="white" opacity="0.95"/><text x="17" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${markerColor}">${si + 1}</text></svg>`;

          let iwContent;
          if (reassignTarget) {
            const isSameDriver = reassignTarget._id === strategy.driver?._id;
            iwContent = `<div style="font-family:sans-serif;padding:10px;max-width:260px"><b style="color:#1e40af;font-size:12px">${order.merchant_order_id}</b><br/><span style="font-size:11px;color:#374151">👤 ${order.consignee_name}</span><br/><span style="font-size:10px;color:#6B7280">${order.destination_address?.substring(0, 70)}…</span>${order.payment_type === 'cod' ? `<br/><b style="color:#f59e0b;font-size:11px">💰 COD: Rp ${Number(order.cod_amount).toLocaleString('id-ID')}</b>` : ''}<br/><span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px;display:inline-block;margin-top:5px">${strategy.driver?.driver_name} — Stop #${si + 1}</span>${!isSameDriver ? `<div style="margin-top:8px;padding:6px 8px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px"><div style="font-size:11px;color:#1e40af;margin-bottom:4px">🔄 Pindah ke: <b>${reassignTarget.driver_name}</b></div><button onclick="window.__mapReassign('${order._id}','${stratIdx}')" style="background:#2563EB;color:white;border:none;padding:4px 12px;border-radius:5px;font-size:11px;cursor:pointer;font-weight:600;width:100%">Pindahkan Order Ini</button></div>` : `<div style="margin-top:8px;padding:4px 8px;background:#F0FDF4;border:1px dashed #86EFAC;border-radius:6px;font-size:10px;color:#16A34A">✓ Sudah di driver ini</div>`}</div>`;
          } else {
            iwContent = `<div style="font-family:sans-serif;padding:8px;max-width:240px"><b style="color:#1e40af">${order.merchant_order_id}</b><br>👤 ${order.consignee_name}<br><span style="font-size:11px;color:#666">${order.destination_address?.substring(0, 80)}…</span>${order.payment_type === 'cod' ? `<br><b style="color:#f59e0b">💰 COD: Rp ${Number(order.cod_amount).toLocaleString('id-ID')}</b>` : ''}<br><span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px;display:inline-block;margin-top:4px">${strategy.driver?.driver_name} — Stop #${si + 1}</span>${strategy.mapsUrl ? `<br><a href="${strategy.mapsUrl}" target="_blank" style="font-size:11px;color:#2563eb;margin-top:4px;display:inline-block">🗺 Google Maps</a>` : ''}</div>`;
          }

          const marker = new window.google.maps.Marker({ position: pos, map: mapInstRef.current, icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(34, 40) }, zIndex: isSearchMatch && searchHighlightIds?.size > 0 ? 500 + si : (effectiveActive ? 10 + si : 1) });
          marker.addListener('click', () => {
            window.__mapReassign = (orderId, fromStratIdxStr) => { onReassignOrder?.(orderId, parseInt(fromStratIdxStr)); iwRef.current.close(); };
            iwRef.current.setContent(iwContent);
            iwRef.current.open(mapInstRef.current, marker);
          });
          markersRef.current.push(marker);
          if (isActive) { bounds.extend(pos); hasPoints = true; }
        });

        if (strategy.directionsResult) {
          const renderer = new window.google.maps.DirectionsRenderer({ map: mapInstRef.current, directions: strategy.directionsResult, suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeColor: isActive ? color : '#D1D5DB', strokeOpacity: isActive ? 0.9 : 0.15, strokeWeight: isActive ? 5 : 2, icons: isActive ? [{ icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: color, fillOpacity: 1, strokeWeight: 0 }, offset: '35%', repeat: '90px' }] : [] } });
          rendererRef.current.push(renderer);
          if (isActive) { strategy.directionsResult.routes[0].legs.forEach((leg) => leg.steps.forEach((step) => step.path.forEach((p) => bounds.extend(p)))); hasPoints = true; }
        } else {
          const coords = [];
          if (strategy.originCoords) coords.push({ lat: strategy.originCoords.lat, lng: strategy.originCoords.lng });
          strategy.route.filter((o) => hasCoords(o)).forEach((o) => coords.push({ lat: o.dropoff_lat, lng: o.dropoff_long }));
          if (coords.length > 1) {
            const pl = new window.google.maps.Polyline({ path: coords, strokeColor: isActive ? color : '#D1D5DB', strokeOpacity: isActive ? 0.7 : 0.15, strokeWeight: isActive ? 4 : 2, geodesic: true, icons: isActive ? [{ icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: color, fillOpacity: 1 }, offset: '50%', repeat: '90px' }] : [] });
            pl.setMap(mapInstRef.current);
            polylinesRef.current.push(pl);
          }
        }
      });
    } else {
      enriched.filter((o) => hasCoords(o)).forEach((order) => {
        const pos = { lat: order.dropoff_lat, lng: order.dropoff_long };
        const isSelected = selIds.has(order._id);
        const c = isSelected ? '#2563EB' : '#9CA3AF';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 19 13 19S26 22.75 26 13C26 5.82 20.18 0 13 0z" fill="${c}"/><circle cx="13" cy="13" r="5.5" fill="white" opacity="0.9"/></svg>`;
        const iw = `<div style="font-family:sans-serif;padding:8px;max-width:220px"><b style="color:#1e40af">${order.merchant_order_id}</b><br>👤 ${order.consignee_name}<br><span style="font-size:11px;color:#666">${order.destination_address?.substring(0, 70)}…</span></div>`;
        const marker = new window.google.maps.Marker({ position: pos, map: mapInstRef.current, icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(26, 32) } });
        marker.addListener('click', () => { iwRef.current.setContent(iw); iwRef.current.open(mapInstRef.current, marker); onOrderSelect?.(order._id); });
        markersRef.current.push(marker); bounds.extend(pos); hasPoints = true;
      });
    }
    if (hasPoints && !isFocused) mapInstRef.current.fitBounds(bounds, { padding: 60 });
  }, [enriched, strategyList, mapLoaded, selIds, activeFocusIdx, reassignTarget]);

  const handleClearFocus = () => {
    setActiveFocusIdx(null);
    onClearFocus?.();
    if (mapInstRef.current && strategyList?.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;
      strategyList.forEach((s) => {
        if (s.originCoords) { bounds.extend({ lat: s.originCoords.lat, lng: s.originCoords.lng }); hasPoints = true; }
        s.route.forEach((o) => { if (hasCoords(o)) { bounds.extend({ lat: o.dropoff_lat, lng: o.dropoff_long }); hasPoints = true; } });
      });
      if (hasPoints) mapInstRef.current.fitBounds(bounds, { padding: 60 });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 500 }}>
      <div ref={mapRef} className="w-full h-full" />
      {mapLoaded && (
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button onClick={toggleTraffic} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md transition-all border ${trafficVisible ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            <Activity size={12} />{trafficVisible ? 'Traffic ON' : 'Traffic'}
          </button>
          {trafficVisible && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 text-xs">
              <p className="font-semibold text-gray-600 mb-1.5">Kondisi Lalu Lintas</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5"><div className="w-4 h-2 rounded-full bg-green-500" /><span className="text-gray-600">Lancar</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-2 rounded-full bg-orange-400" /><span className="text-gray-600">Padat</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-2 rounded-full bg-red-500" /><span className="text-gray-600">Macet</span></div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeFocusIdx !== null && strategyList?.length > 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-md rounded-lg px-3 py-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: strategyList[activeFocusIdx]?.color }} />
            <span className="font-semibold text-gray-700">Fokus: {strategyList[activeFocusIdx]?.driver?.driver_name}</span>
            <span className="text-gray-400">· {strategyList[activeFocusIdx]?.route?.length} stops</span>
          </div>
          <button onClick={handleClearFocus} className="flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 font-medium">
            <Eye size={11} /> Tampilkan Semua
          </button>
        </div>
      )}
      {reassignTarget && strategyList?.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <div className="bg-blue-700 text-white rounded-lg px-3 py-2 text-xs shadow-lg flex items-center gap-2 pointer-events-auto">
            <ArrowLeftRight size={12} className="flex-shrink-0" />
            <span>Mode Pindah Aktif — klik titik order mana saja untuk memindahkannya ke <b>{reassignTarget.driver_name}</b></span>
          </div>
        </div>
      )}
      {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-50"><div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><p className="text-sm text-gray-500">Memuat peta…</p></div></div>}
      {mapLoaded && geocoding && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
          <div className="text-center w-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">Geocoding alamat…</p>
            <p className="text-xs text-gray-500 mb-2">{geocodePct}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${geocodePct}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyResultList({ strategyList, errors, onClose, onFocusDriver, onReassignOrders, selectedProject, blitzData, isFetchingBlitz, onRefreshBlitz, onAssignSuccess }) {
  const [expanded, setExpanded] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [moveTargetDriverIdx, setMoveTargetDriverIdx] = useState(null);
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [sourceDriverIdx, setSourceDriverIdx] = useState(null);
  const [riderStatuses, setRiderStatuses] = useState({});
  const [riderBatchIds, setRiderBatchIds] = useState({});
  const [isFetchingStatuses, setIsFetchingStatuses] = useState(false);
  const [assigningDriverIds, setAssigningDriverIds] = useState(new Set());
  const [assignModal, setAssignModal] = useState({ open: false, type: null, stratIdx: null });
  const [assignTarget, setAssignTarget] = useState(null);

  useEffect(() => {
    if (!strategyList.length) return;
    setIsFetchingStatuses(true);
    const fetchAll = async () => {
      const statuses = {};
      const batchIds = {};
      for (const strategy of strategyList) {
        const phone = strategy.driver?.driver_phone;
        const driverId = strategy.driver?.driver_id;
        const id = strategy.driver?._id;
        if (!phone) { statuses[id] = 'unknown'; continue; }
        const [attendance, batchId] = await Promise.all([
          fetchDriverAttendanceStatus(phone),
          driverId ? fetchActiveBatchId(driverId) : Promise.resolve(null),
        ]);
        batchIds[id] = batchId || null;
        if (batchId) {
          statuses[id] = 'online';
        } else if (attendance !== 'online') {
          statuses[id] = 'offline';
        } else if (strategy.originCoords) {
          const nearby = await fetchNearbyDrivers(strategy.originCoords.lat, strategy.originCoords.lng);
          const found = nearby.find((d) => d.driver_phone === phone);
          statuses[id] = found ? 'online_at_pickup' : 'online';
        } else {
          statuses[id] = 'online';
        }
      }
      setRiderStatuses(statuses);
      setRiderBatchIds(batchIds);
      setIsFetchingStatuses(false);
    };
    fetchAll();
  }, [strategyList]);

  const totals = useMemo(() => ({
    orders: strategyList.reduce((s, r) => s + r.route.length, 0),
    dist: strategyList.reduce((s, r) => s + parseFloat(r.totalDistance || 0), 0).toFixed(1),
    atRisk: strategyList.filter((r) => r.slaStatus?.level !== 'ok').length,
  }), [strategyList]);

  const handleToggleInvoiceInDriver = (orderId, stratIdx) => {
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
        const stillHasFromSource = strategyList[stratIdx]?.route.some((o) => next.has(o._id));
        if (!stillHasFromSource && sourceDriverIdx === stratIdx) setSourceDriverIdx(null);
      } else {
        next.add(orderId);
        setSourceDriverIdx(stratIdx);
      }
      return next;
    });
  };

  const handleSelectAllInDriver = (stratIdx) => {
    const strategy = strategyList[stratIdx];
    const driverOrderIds = strategy.route.map((o) => o._id);
    const allSelected = driverOrderIds.every((id) => selectedInvoices.has(id));
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        driverOrderIds.forEach((id) => next.delete(id));
        if (sourceDriverIdx === stratIdx) setSourceDriverIdx(null);
      } else {
        driverOrderIds.forEach((id) => next.add(id));
        setSourceDriverIdx(stratIdx);
      }
      return next;
    });
  };

  const handleMoveSelected = () => {
    if (!selectedInvoices.size || moveTargetDriverIdx === null) return;
    onReassignOrders?.(Array.from(selectedInvoices), moveTargetDriverIdx);
    setSelectedInvoices(new Set());
    setMoveTargetDriverIdx(null);
    setShowMovePanel(false);
    setSourceDriverIdx(null);
  };

  const handleAssignClick = async (stratIdx) => {
    if (isFetchingBlitz) {
      alert('Pengecekan status order masih berjalan. Harap tunggu hingga selesai sebelum melakukan Assign.');
      return;
    }

    const strategy = strategyList[stratIdx];
    const driverId = strategy.driver?._id;
    if (assigningDriverIds.has(driverId)) return;

    const validation = validateInvoiceStatuses(strategy.route, blitzData);
    if (!validation.valid) { alert(validation.message); return; }

    const riderStatus = riderStatuses[driverId] || 'unknown';
    const riderCondition = checkRiderCondition(riderStatus);
    setAssignTarget({ stratIdx, strategy });

    if (!riderCondition.canDirectAssign) {
      setAssignModal({ open: true, type: riderCondition.modalType, stratIdx });
      return;
    }
    await doAssign(stratIdx, strategy, false);
  };

  const doAssign = async (stratIdx, strategy, batchOnly) => {
    const driverId = strategy.driver?._id;
    setAssigningDriverIds((prev) => new Set(prev).add(driverId));
    setAssignModal({ open: false, type: null, stratIdx: null });
    try {
      const validRes = await fetch(
        `${API_URL}/api/merchant-orders/${selectedProject}/validate-multiple-senders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderNames: [...new Set(strategy.route.map((o) => o.sender_name).filter(Boolean))] }),
        }
      );
      const validData = await validRes.json();
      if (!validData.success) { alert(`Validasi sender gagal: ${validData.message}`); return; }

      const { totalSuccess, totalFail, failMessages } = await executeAssign(
        strategy, selectedProject, validData.data, batchOnly, API_URL
      );

      if (totalFail === 0) {
        alert(`✅ Berhasil assign ${totalSuccess} order(s)!`);
        onAssignSuccess?.();
      } else {
        let msg = '';
        if (totalSuccess > 0) { msg += `✅ Berhasil: ${totalSuccess} order(s)\n`; onAssignSuccess?.(); }
        msg += `❌ Gagal: ${totalFail} order(s)\n${failMessages.join('\n')}`;
        alert(msg);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setAssigningDriverIds((prev) => { const next = new Set(prev); next.delete(driverId); return next; });
    }
  };

  const handleModalConfirm = () => {
    if (!assignTarget) return;
    doAssign(assignTarget.stratIdx, assignTarget.strategy, true);
  };

  const selectedCount = selectedInvoices.size;
  const availableTargetDrivers = useMemo(
    () => strategyList.map((s, i) => ({ ...s, idx: i })).filter((_, i) => i !== sourceDriverIdx),
    [strategyList, sourceDriverIdx]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <AssignConfirmModal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, type: null, stratIdx: null })}
        onConfirm={handleModalConfirm}
        title={assignModal.type === 'offline' ? 'Rider Offline' : 'Rider di Luar Lokasi Pickup'}
        message={assignModal.type === 'offline'
          ? 'Rider dalam kondisi offline. Order tidak dapat langsung di-assign. Apakah tetap ingin melanjutkan create batch?'
          : 'Rider sedang online namun berada di luar lokasi pickup. Order tidak dapat langsung di-assign. Apakah tetap ingin melanjutkan create batch?'}
        confirmLabel="Ya, Lanjutkan Create Batch"
        confirmColor="bg-amber-600 hover:bg-amber-700"
      />

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" />
          <div>
            <h3 className="text-base font-bold">Hasil Delivery Strategy</h3>
            <p className="text-xs opacity-75">{strategyList.length} driver · {totals.orders} orders · {totals.dist} km total{totals.atRisk > 0 ? ` · ⚠ ${totals.atRisk} risiko SLA` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFetchingBlitz && <span className="text-xs opacity-70 flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Cek status order…</span>}
          {isFetchingStatuses && <span className="text-xs opacity-70 flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Status rider…</span>}
          <button
            onClick={onRefreshBlitz}
            disabled={isFetchingBlitz}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingBlitz ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Refresh Status
          </button>
          {selectedCount > 0 && (
            <button onClick={() => setShowMovePanel(!showMovePanel)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium">
              <Move size={13} />{selectedCount} dipilih · Pindahkan
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
        </div>
      </div>

      {showMovePanel && selectedCount > 0 && (
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-indigo-800">
            <Move size={14} />
            <span className="font-semibold">{selectedCount} invoice dipilih</span>
            <span className="text-indigo-600">· Pindahkan ke driver:</span>
          </div>
          <select value={moveTargetDriverIdx ?? ''} onChange={(e) => setMoveTargetDriverIdx(e.target.value === '' ? null : Number(e.target.value))} className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">— Pilih Driver Tujuan —</option>
            {availableTargetDrivers.map((s) => (
              <option key={s.idx} value={s.idx}>{s.driver.driver_name} (saat ini {s.route.length} orders)</option>
            ))}
          </select>
          <button onClick={handleMoveSelected} disabled={moveTargetDriverIdx === null} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <ArrowLeftRight size={13} />Pindahkan Sekarang
          </button>
          <button onClick={() => { setShowMovePanel(false); setSelectedInvoices(new Set()); setMoveTargetDriverIdx(null); setSourceDriverIdx(null); }} className="text-xs text-indigo-500 hover:text-indigo-700">Batal</button>
        </div>
      )}

      {errors?.length > 0 && <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">{errors.map((e, i) => <div key={i} className="flex items-center gap-2 text-amber-700 text-xs"><AlertCircle size={12} />{e}</div>)}</div>}

      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
        {[
          { icon: <Truck size={15} className="text-blue-600" />, label: 'Driver', value: strategyList.length },
          { icon: <Package size={15} className="text-indigo-600" />, label: 'Total Order', value: totals.orders },
          { icon: <Route size={15} className="text-green-600" />, label: 'Total Jarak', value: `${totals.dist} km` },
          { icon: <Shield size={15} className={totals.atRisk > 0 ? 'text-red-600' : 'text-green-600'} />, label: 'Risiko SLA', value: totals.atRisk > 0 ? `${totals.atRisk} driver` : 'Aman', valueColor: totals.atRisk > 0 ? 'text-red-600' : 'text-green-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 text-center shadow-sm">
            <div className="flex justify-center mb-1">{item.icon}</div>
            <div className={`text-base font-bold ${item.valueColor || 'text-gray-800'}`}>{item.value}</div>
            <div className="text-xs text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
        {strategyList.map((strategy, idx) => {
          const driverOrderIds = strategy.route.map((o) => o._id);
          const allDriverSelected = driverOrderIds.length > 0 && driverOrderIds.every((id) => selectedInvoices.has(id));
          const someDriverSelected = driverOrderIds.some((id) => selectedInvoices.has(id));
          const isSourceDriver = sourceDriverIdx === idx;
          const driverId = strategy.driver?._id;
          const riderStatus = riderStatuses[driverId] || 'unknown';
          const activeBatchId = riderBatchIds[driverId] || null;
          const isCurrentlyAssigning = assigningDriverIds.has(driverId);

          return (
            <div key={idx} className="border rounded-xl overflow-hidden" style={{ borderColor: strategy.color + '50' }}>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderLeft: `4px solid ${strategy.color}` }} onClick={() => setExpanded(expanded === idx ? null : idx)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: strategy.color }}>{idx + 1}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{strategy.driver?.driver_name}</span>
                      <RiderStatusDot status={riderStatus} activeBatchId={activeBatchId} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${strategy.isRoadBased ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{strategy.isRoadBased ? '🛣 Road-based' : '⚠ Estimasi'}</span>
                      {strategy.originCoords && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">📦 {strategy.pickupPoint?.sender_name?.substring(0, 20)}</span>}
                      <SlaIndicator estimatedMinutes={strategy.estimatedTime} />
                      {strategy.insight && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">⚡ {strategy.insight.method}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{strategy.driver?.driver_id} · {strategy.driver?.driver_phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-center hidden sm:block"><div className="font-bold text-gray-800">{strategy.route.length}</div><div className="text-xs text-gray-400">Orders</div></div>
                  <div className="text-center hidden sm:block"><div className="font-bold text-gray-800">{strategy.totalDistance} km</div><div className="text-xs text-gray-400">Jarak</div></div>
                  <div className="text-center"><div className="font-bold text-blue-600">{strategy.etaFinish}</div><div className="text-xs text-gray-400">ETA</div></div>
                  <div className="text-center hidden sm:block"><div className="font-bold text-purple-600">{strategy.estimatedTime} min</div><div className="text-xs text-gray-400">Durasi</div></div>
                  {strategy.totalCOD > 0 && <div className="text-center hidden md:block"><div className="font-bold text-amber-600 text-xs">Rp {Number(strategy.totalCOD).toLocaleString('id-ID')}</div><div className="text-xs text-gray-400">COD</div></div>}
                  <button onClick={(e) => { e.stopPropagation(); onFocusDriver?.(idx); }} className="flex items-center gap-1 text-xs px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-700 font-medium" title="Fokus di peta"><MapPin size={11} /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAssignClick(idx); }}
                    disabled={isCurrentlyAssigning || isFetchingBlitz}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCurrentlyAssigning ? <Loader2 size={11} className="animate-spin" /> : isFetchingBlitz ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                    {isCurrentlyAssigning ? 'Assigning…' : isFetchingBlitz ? 'Checking…' : 'Assign'}
                  </button>
                  {strategy.mapsUrl && <a href={strategy.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"><Navigation size={12} />Nav</a>}
                  {expanded === idx ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>

              {expanded === idx && (
                <div className="border-t border-gray-100">
                  <SlaWarningBanner slaStatus={strategy.slaStatus} estimatedTime={strategy.estimatedTime} />
                  {strategy.originCoords && <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700"><MapPin size={12} /><span>Berangkat dari: <b>{strategy.pickupPoint?.sender_name}</b> ({strategy.originCoords.lat.toFixed(4)}, {strategy.originCoords.lng.toFixed(4)})</span></div>}
                  <RouteInsightPanel insight={strategy.insight} />
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={() => handleSelectAllInDriver(idx)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-medium transition-colors">
                      {allDriverSelected ? <CheckSquare size={13} className="text-blue-600" /> : someDriverSelected ? <CheckSquare size={13} className="text-gray-400" /> : <Square size={13} />}
                      {allDriverSelected ? 'Deselect Semua' : 'Select Semua'}
                    </button>
                    {someDriverSelected && <span className="text-xs text-blue-600 font-medium">{driverOrderIds.filter((id) => selectedInvoices.has(id)).length} invoice dipilih</span>}
                    {someDriverSelected && isSourceDriver && (
                      <button onClick={() => setShowMovePanel(true)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium ml-auto">
                        <Move size={11} />Pindahkan Terpilih
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 w-8">
                            <button onClick={() => handleSelectAllInDriver(idx)}>
                              {allDriverSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
                            </button>
                          </th>
                          {['Stop', 'Order ID', 'Penerima', 'Kota', 'Tipe', 'COD', 'Status', 'Batch ID'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-400 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {strategy.route.map((order, si) => {
                          const isSelected = selectedInvoices.has(order._id);
                          const orderBlitzInfo = blitzData[order.merchant_order_id];
                          return (
                            <tr key={si} className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`} onClick={() => handleToggleInvoiceInDriver(order._id, idx)}>
                              <td className="px-3 py-2" onClick={(e) => { e.stopPropagation(); handleToggleInvoiceInDriver(order._id, idx); }}>
                                {isSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
                              </td>
                              <td className="px-3 py-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: strategy.color }}>{si + 1}</div></td>
                              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{order.merchant_order_id}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{order.consignee_name?.substring(0, 28)}</td>
                              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{order.destination_city}</td>
                              <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full text-xs ${order.payment_type === 'cod' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{order.payment_type?.toUpperCase()}</span></td>
                              <td className="px-3 py-2 text-amber-600 font-medium whitespace-nowrap">{order.payment_type === 'cod' && order.cod_amount > 0 ? `Rp ${Number(order.cod_amount).toLocaleString('id-ID')}` : '-'}</td>
                              <td className="px-3 py-2">
                                <BlitzStatusBadge blitzInfo={orderBlitzInfo} isLoading={isFetchingBlitz} />
                              </td>
                              <td className="px-3 py-2">
                                <BatchIdCell blitzInfo={orderBlitzInfo} isLoading={isFetchingBlitz} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeliveryAssignment({ selectedProject = 'jne' }) {
  const [assignments, setAssignments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingPickupPoints, setIsLoadingPickupPoints] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectedDrivers, setSelectedDrivers] = useState(new Set());
  const [driverPickupMap, setDriverPickupMap] = useState({});
  const [statistics, setStatistics] = useState({ totalDrivers: 0, uniqueUsers: 0 });
  const [driverSearch, setDriverSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSenderFilter, setOrderSenderFilter] = useState('all');
  const [mapOrderSearch, setMapOrderSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState({ stage: '', pct: 0 });
  const [strategyList, setStrategyList] = useState([]);
  const [strategyErrors, setStrategyErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('map');
  const [focusedDriverIdx, setFocusedDriverIdx] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState(null);
  const [mapStrategyKey, setMapStrategyKey] = useState(0);

  // Unified blitz data state — shared antara tab Orders dan tab Strategy
  const [blitzData, setBlitzData] = useState({});
  const [isFetchingBlitz, setIsFetchingBlitz] = useState(false);

  const [driverRiderStatuses, setDriverRiderStatuses] = useState({});
  const [driverActiveBatchIds, setDriverActiveBatchIds] = useState({});
  const [isFetchingDriverStatuses, setIsFetchingDriverStatuses] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/delivery/${selectedProject}/all`);
      const result = await res.json();
      if (result.success) {
        setAssignments(result.data);
        setStatistics({ totalDrivers: result.data.length, uniqueUsers: new Set(result.data.map((d) => d.user_id)).size });
      }
    } catch {} finally { setIsLoading(false); }
  }, [selectedProject]);

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/api/merchant-orders/${selectedProject}/all`);
      const result = await res.json();
      if (result.success) setOrders(result.data);
    } catch {} finally { setIsLoadingOrders(false); }
  }, [selectedProject]);

  const loadPickupPoints = useCallback(async () => {
    setIsLoadingPickupPoints(true);
    try { const points = await fetchPickupPoints(selectedProject); setPickupPoints(points); }
    catch {} finally { setIsLoadingPickupPoints(false); }
  }, [selectedProject]);

  useEffect(() => {
    loadData(); loadOrders(); loadPickupPoints();
    setStrategyList([]); setStrategyErrors([]);
    setSelectedOrders(new Set()); setSelectedDrivers(new Set()); setDriverPickupMap({});
    setReassignTargetId(null); setFocusedDriverIdx(null);
    setBlitzData({});
  }, [loadData, loadOrders, loadPickupPoints]);

  const fetchDriverStatuses = useCallback(async (driverList) => {
    if (!driverList.length) return;
    setIsFetchingDriverStatuses(true);
    const statuses = {};
    const batchIds = {};
    for (const driver of driverList) {
      const phone = driver.driver_phone;
      const driverId = driver.driver_id;
      const id = driver._id;
      if (!phone) { statuses[id] = 'unknown'; batchIds[id] = null; continue; }
      const [attendance, batchId] = await Promise.all([
        fetchDriverAttendanceStatus(phone),
        driverId ? fetchActiveBatchId(driverId) : Promise.resolve(null),
      ]);
      batchIds[id] = batchId || null;
      statuses[id] = batchId ? 'online' : attendance !== 'online' ? 'offline' : 'online';
    }
    setDriverRiderStatuses(statuses);
    setDriverActiveBatchIds(batchIds);
    setIsFetchingDriverStatuses(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'driver' && assignments.length > 0) fetchDriverStatuses(assignments);
  }, [activeTab, assignments, fetchDriverStatuses]);

  // Fungsi fetch Blitz yang menyimpan ke unified state
  const fetchBlitzForIds = useCallback(async (merchantOrderIds, forceRefresh = false) => {
    if (!merchantOrderIds || merchantOrderIds.length === 0) return;
    const uniqueIds = [...new Set(merchantOrderIds)];
    // Hanya fetch ID yang belum ada di cache, kecuali forceRefresh
    const idsToFetch = forceRefresh
      ? uniqueIds
      : uniqueIds.filter((id) => !(id in blitzData));
    if (idsToFetch.length === 0) return; // semua sudah di cache, skip fetch
    setIsFetchingBlitz(true);
    const data = await fetchBlitzOrdersData(idsToFetch);
    setBlitzData((prev) => ({ ...prev, ...data }));
    setIsFetchingBlitz(false);
  }, [blitzData]);

  // search-orders HANYA dipanggil dari:
  // 1. Tombol "Refresh Status" di tab Orders → fetchBlitzForIds(..., true)
  // 2. Tombol "Refresh Status" di tab Strategy → fetchStrategyBlitz(strategyList, true)
  // 3. Saat Generate selesai → fetchStrategyBlitz(results)
  // Tidak ada auto-fetch saat tab berpindah.

  const fetchStrategyBlitz = useCallback(async (currentStrategyList, forceRefresh = false) => {
    const ids = (currentStrategyList || strategyList).flatMap((s) => s.route.map((o) => o.merchant_order_id));
    if (!ids.length) return;
    await fetchBlitzForIds(ids, forceRefresh);
  }, [strategyList, fetchBlitzForIds]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearch.toLowerCase();
      const matchSearch = !q || o.merchant_order_id?.toLowerCase().includes(q) || o.consignee_name?.toLowerCase().includes(q) || o.destination_city?.toLowerCase().includes(q) || o.sender_name?.toLowerCase().includes(q);
      const matchStatus = orderStatusFilter === 'all' || o.assignment_status === orderStatusFilter || (!o.assignment_status && orderStatusFilter === 'unassigned');
      const matchSender = orderSenderFilter === 'all' || o.sender_name === orderSenderFilter;
      return matchSearch && matchStatus && matchSender;
    });
  }, [orders, orderSearch, orderStatusFilter, orderSenderFilter]);

  const handleSelectOrder = useCallback((id) => setSelectedOrders((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const handleSelectAllOrders = useCallback(() => {
    const validFiltered = filteredOrders.filter((o) => o.assignment_status !== 'completed');
    const allSelected = validFiltered.length > 0 && validFiltered.every((o) => selectedOrders.has(o._id));
    if (allSelected) {
      setSelectedOrders((prev) => { const next = new Set(prev); validFiltered.forEach((o) => next.delete(o._id)); return next; });
    } else {
      setSelectedOrders((prev) => { const next = new Set(prev); validFiltered.forEach((o) => next.add(o._id)); return next; });
    }
  }, [filteredOrders, selectedOrders]);

  const handleToggleDriver = useCallback((id) => {
    setSelectedDrivers((prev) => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); setDriverPickupMap((m) => { const n = { ...m }; delete n[id]; return n; }); }
      else s.add(id);
      return s;
    });
  }, []);

  const handleSetDriverPickup = useCallback((driverId, pickupPoint) => {
    setDriverPickupMap((prev) => ({ ...prev, [driverId]: pickupPoint }));
  }, []);

  const filteredDrivers = useMemo(() => assignments.filter((d) => !driverSearch || d.driver_name.toLowerCase().includes(driverSearch.toLowerCase()) || d.driver_id.toString().includes(driverSearch) || d.driver_phone.includes(driverSearch)), [assignments, driverSearch]);
  const uniqueSenders = useMemo(() => [...new Set(orders.map((o) => o.sender_name).filter(Boolean))].sort(), [orders]);
  const selectedDriverList = useMemo(() => assignments.filter((d) => selectedDrivers.has(d._id)), [assignments, selectedDrivers]);
  const readyDrivers = useMemo(() => selectedDriverList.filter((d) => driverPickupMap[d._id]?.hasCoords), [selectedDriverList, driverPickupMap]);
  const canGenerate = selectedOrders.size > 0 && readyDrivers.length > 0;
  const reassignTarget = useMemo(() => reassignTargetId ? assignments.find((a) => a._id === reassignTargetId) || null : null, [reassignTargetId, assignments]);

  const refreshDirectionsForStrategies = useCallback(async (updatedList, affectedIdxs) => {
    const STOP_SEC = SLA_THRESHOLDS.STOP_TIME_MINUTES * 60;
    // Refresh setiap driver yang terpengaruh secara paralel
    const refreshPromises = [...affectedIdxs].map(async (idx) => {
      const strategy = updatedList[idx];
      if (!strategy || strategy.route.length === 0) return { idx, patch: { directionsResult: null, isRoadBased: false } };
      const reoptimizedRoute = buildReassignedRoute(strategy.route, strategy.originCoords);
      const roadData = await fetchDirections(strategy.originCoords, reoptimizedRoute);
      if (roadData) {
        const totalDurSec = roadData.totalDuration + reoptimizedRoute.length * STOP_SEC;
        const estimatedMinutes = Math.round(totalDurSec / 60);
        return {
          idx,
          patch: {
            route: reoptimizedRoute,
            directionsResult: roadData.directionsResult,
            totalDistance: (roadData.totalDistance / 1000).toFixed(1),
            estimatedTime: estimatedMinutes,
            slaStatus: getSlaStatus(estimatedMinutes),
            etaFinish: new Date(Date.now() + totalDurSec * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isRoadBased: true,
            mapsUrl: buildMapsUrl(strategy.originCoords, reoptimizedRoute),
          },
        };
      }
      return {
        idx,
        patch: {
          route: reoptimizedRoute,
          directionsResult: null,
          isRoadBased: false,
          mapsUrl: buildMapsUrl(strategy.originCoords, reoptimizedRoute),
        },
      };
    });

    const patches = await Promise.all(refreshPromises);

    // Terapkan semua patch ke state terbaru (bukan dari closure lama)
    setStrategyList((current) => {
      const next = [...current];
      for (const { idx, patch } of patches) {
        next[idx] = { ...next[idx], ...patch };
      }
      return next;
    });
    setMapStrategyKey((k) => k + 1);
  }, []);

  const handleReassignOrder = useCallback((orderId, fromStratIdx) => {
    if (!reassignTarget) return;
    // 1. Update state secara sinkron dulu (pindahkan order)
    let updatedList = null;
    let affectedIdxs = null;
    setStrategyList((prev) => {
      const next = prev.map((s) => ({ ...s, route: [...s.route] }));
      const fromStrategy = next[fromStratIdx];
      if (!fromStrategy) return prev;
      const orderIdx = fromStrategy.route.findIndex((o) => o._id === orderId);
      if (orderIdx === -1) return prev;
      const [order] = fromStrategy.route.splice(orderIdx, 1);
      const toStratIdx = next.findIndex((s) => s.driver._id === reassignTarget._id);
      if (toStratIdx === -1 || toStratIdx === fromStratIdx) {
        fromStrategy.route.splice(orderIdx, 0, order);
        return prev;
      }
      next[toStratIdx].route.push(order);
      // Set sementara garis lurus sambil tunggu directions
      next[fromStratIdx] = { ...next[fromStratIdx], directionsResult: null, isRoadBased: false };
      next[toStratIdx]   = { ...next[toStratIdx],   directionsResult: null, isRoadBased: false };
      updatedList  = next;
      affectedIdxs = new Set([fromStratIdx, toStratIdx]);
      return next;
    });
    setMapStrategyKey((k) => k + 1);
    // 2. Fetch directions setelah state selesai diupdate
    if (updatedList && affectedIdxs) {
      refreshDirectionsForStrategies(updatedList, affectedIdxs);
    }
  }, [reassignTarget, refreshDirectionsForStrategies]);

  const handleBulkReassignOrders = useCallback((orderIds, toStratIdx) => {
    let updatedList = null;
    let affectedIdxs = null;
    setStrategyList((prev) => {
      const next = prev.map((s) => ({ ...s, route: [...s.route] }));
      const orderIdSet = new Set(orderIds);
      const touched = new Set();
      const movedOrders = [];
      next.forEach((strategy, idx) => {
        if (idx === toStratIdx) return;
        const remaining = [];
        strategy.route.forEach((o) => {
          if (orderIdSet.has(o._id)) { movedOrders.push(o); touched.add(idx); }
          else remaining.push(o);
        });
        if (touched.has(idx)) next[idx] = { ...next[idx], route: remaining };
      });
      if (movedOrders.length > 0) {
        next[toStratIdx] = { ...next[toStratIdx], route: [...next[toStratIdx].route, ...movedOrders] };
        touched.add(toStratIdx);
      }
      touched.forEach((idx) => {
        next[idx] = { ...next[idx], directionsResult: null, isRoadBased: false };
      });
      updatedList  = next;
      affectedIdxs = touched;
      return next;
    });
    setMapStrategyKey((k) => k + 1);
    if (updatedList && affectedIdxs) {
      refreshDirectionsForStrategies(updatedList, affectedIdxs);
    }
  }, [refreshDirectionsForStrategies]);

  const handleGenerateStrategy = async () => {
    if (!selectedOrders.size) { alert('Pilih minimal 1 order'); return; }
    if (!readyDrivers.length) { alert('Pilih minimal 1 driver dengan pickup point valid'); return; }
    setIsGenerating(true);
    setGenStage({ stage: 'geocoding', pct: 0 });
    setStrategyList([]); setStrategyErrors([]); setReassignTargetId(null); setFocusedDriverIdx(null);
    try {
      const results = await generateDeliveryStrategy(
        selectedOrders, filteredOrders, readyDrivers, driverPickupMap, assignments, setGenStage
      );
      if (!results.length) { alert('Tidak ada hasil strategy yang berhasil'); return; }
      setStrategyList(results);
      setStrategyErrors([]);
      setActiveTab('strategy');
      setMapStrategyKey((k) => k + 1);
      fetchStrategyBlitz(results);
    } catch (err) {
      alert('Gagal generate strategy: ' + err.message);
    } finally {
      setIsGenerating(false);
      setGenStage({ stage: '', pct: 0 });
    }
  };

  const stageLabel = () => {
    const { stage, pct } = genStage;
    if (stage === 'geocoding') return `Geocoding… ${pct}%`;
    if (stage === 'directions') return `Arah & Traffic… ${pct}%`;
    return 'Memproses…';
  };

  const ordersForMap = useMemo(() => {
    const base = orders.slice(0, 300);
    if (!mapOrderSearch.trim()) return base;
    const q = mapOrderSearch.toLowerCase();
    return base.filter((o) => o.merchant_order_id?.toLowerCase().includes(q) || o.consignee_name?.toLowerCase().includes(q) || o.destination_city?.toLowerCase().includes(q) || o.destination_address?.toLowerCase().includes(q));
  }, [orders, mapOrderSearch]);

  const mapSearchHighlightIds = useMemo(() => {
    if (!mapOrderSearch.trim()) return null;
    const q = mapOrderSearch.toLowerCase();
    const ids = new Set();
    const searchIn = strategyList.length > 0 ? strategyList.flatMap((s) => s.route) : ordersForMap;
    searchIn.forEach((o) => {
      if (o.merchant_order_id?.toLowerCase().includes(q) || o.consignee_name?.toLowerCase().includes(q) || o.destination_city?.toLowerCase().includes(q) || o.destination_address?.toLowerCase().includes(q)) ids.add(o._id);
    });
    return ids;
  }, [mapOrderSearch, strategyList, ordersForMap]);

  const getProjectTitle = () => ({ jne: 'JNE', mup: 'MUP', sayurbox: 'Sayurbox', unilever: 'Unilever', wings: 'Wings' }[selectedProject] || selectedProject.toUpperCase());
  const filteredValidCount = filteredOrders.filter((o) => o.assignment_status !== 'completed').length;
  const filteredAllSelected = filteredValidCount > 0 && filteredOrders.filter((o) => o.assignment_status !== 'completed').every((o) => selectedOrders.has(o._id));
  const handleDriverChipClick = (idx) => { setActiveTab('map'); setFocusedDriverIdx(idx); };
  const strategyListForMap = useMemo(() => strategyList.length > 0 ? strategyList : null, [strategyList, mapStrategyKey]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'driver') fetchDriverStatuses(assignments);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; e.target.value = null;
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) { alert('Format file tidak didukung.'); return; }
    setIsUploading(true); setUploadProgress({ percentage: 0 });
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => { try { const wb = XLSX.read(ev.target.result, { type: 'binary' }); resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })); } catch (err) { reject(err); } };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsBinaryString(file);
      });
      if (data.length < 2) throw new Error('File kosong');
      const headers = data[0].map((h) => h.toString().toLowerCase().trim());
      const transformed = data.slice(1).filter((row) => row.some((c) => c?.toString().trim())).map((row) => {
        const obj = {}; headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return { user_id: obj.user_id?.toString() || '', driver_id: obj.driver_id?.toString() || '', driver_name: obj.driver_name?.toString() || '', driver_phone: obj.driver_phone?.toString() || '' };
      }).filter((o) => o.user_id && o.driver_id && o.driver_name);
      const res = await fetch(`${API_URL}/api/delivery/${selectedProject}/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: transformed }) });
      const result = await res.json();
      if (result.success) { setUploadProgress({ percentage: 100 }); alert(`Berhasil upload ${result.count} driver`); await loadData(); setTimeout(() => setUploadProgress(null), 2000); }
      else throw new Error(result.message);
    } catch (err) { alert(`Upload gagal: ${err.message}`); setUploadProgress(null); }
    finally { setIsUploading(false); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Hapus semua data driver?')) return;
    try {
      const res = await fetch(`${API_URL}/api/delivery/${selectedProject}/all`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { alert('Semua data dihapus'); await loadData(); }
    } catch { alert('Gagal menghapus'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Truck className="w-6 h-6 text-blue-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{getProjectTitle()} — Delivery Assignment</h1>
              <p className="text-gray-400 text-xs mt-0.5">Geo-Cluster + Sweep + 2-Opt Routing · Road-based · SLA-aware · Redistribusi Manual</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canGenerate && (
              <button onClick={handleGenerateStrategy} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-sm disabled:opacity-60 text-sm">
                {isGenerating ? <><Loader2 size={15} className="animate-spin" />{stageLabel()}</> : <><Zap size={15} />Generate ({selectedOrders.size} orders, {readyDrivers.length} driver)</>}
              </button>
            )}
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id={`fu-${selectedProject}`} />
            <label htmlFor={`fu-${selectedProject}`} className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? <><Loader2 size={14} className="animate-spin" />Uploading…</> : <><Upload size={14} />Import Driver</>}
            </label>
            <button onClick={() => { loadData(); loadOrders(); loadPickupPoints(); }} disabled={isLoading} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Refresh
            </button>
            <button onClick={handleDeleteAll} disabled={!assignments.length} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-40">
              <Trash2 size={14} />Delete All
            </button>
          </div>
        </div>
        {(selectedOrders.size > 0 || selectedDrivers.size > 0) && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-blue-700"><Package size={14} /><span><b>{selectedOrders.size}</b> orders</span></div>
            <div className="w-px h-4 bg-blue-300" />
            <div className="flex items-center gap-2 text-blue-700"><User size={14} /><span><b>{selectedDrivers.size}</b> driver dipilih</span></div>
            <div className="w-px h-4 bg-blue-300" />
            <div className="flex items-center gap-2 text-blue-700"><Warehouse size={14} /><span><b>{readyDrivers.length}</b> siap (pickup ✓)</span></div>
            {selectedDrivers.size > 0 && selectedDrivers.size > readyDrivers.length && (
              <span className="text-amber-600 text-xs flex items-center gap-1"><AlertCircle size={12} />{selectedDrivers.size - readyDrivers.length} driver belum pickup point</span>
            )}
          </div>
        )}
      </div>

      {uploadProgress && (
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="flex justify-between mb-2 text-sm"><span className="font-medium text-blue-800">Upload Progress</span><span className="text-blue-600">{Math.round(uploadProgress.percentage)}%</span></div>
          <div className="w-full bg-blue-100 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress.percentage}%` }} /></div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Driver', value: statistics.totalDrivers, icon: <User size={18} className="text-blue-500" /> },
          { label: 'Pickup Points', value: pickupPoints.length, icon: <Warehouse size={18} className="text-green-500" /> },
          { label: 'Total Orders', value: orders.length, icon: <Package size={18} className="text-purple-500" /> },
          { label: 'Unassigned', value: orders.filter((o) => o.assignment_status === 'unassigned').length, icon: <AlertCircle size={18} className="text-orange-500" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-gray-400 text-xs">{s.label}</p><p className="text-2xl font-bold text-gray-800">{s.value}</p></div>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'map', label: 'Peta Drop Points', icon: <MapPin size={15} /> },
            { id: 'orders', label: `Pilih Orders (${selectedOrders.size})`, icon: <Package size={15} /> },
            { id: 'driver', label: `Pilih Driver (${selectedDrivers.size}${readyDrivers.length > 0 ? ` · ${readyDrivers.length} siap` : ''})`, icon: <User size={15} /> },
            ...(strategyList.length > 0 ? [{ id: 'strategy', label: 'Hasil Strategy', icon: <Zap size={15} />, dot: true }] : [])
          ].map((tab) => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {tab.icon}{tab.label}{tab.dot && <span className="ml-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'map' && (
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="relative flex-1 min-w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={mapOrderSearch} onChange={(e) => setMapOrderSearch(e.target.value)} placeholder="Cari order di peta…" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {mapOrderSearch && <button onClick={() => setMapOrderSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  {strategyList.length > 0 ? (
                    <>
                      <span className="text-sm text-gray-500 items-center gap-1.5 hidden sm:flex"><span className="inline-block w-2 h-2 bg-green-500 rounded-full" />Rute aktual dari pickup point masing-masing driver</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {strategyList.map((s, i) => (
                          <button key={i} onClick={() => handleDriverChipClick(i)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-medium transition-all hover:opacity-80 hover:scale-105 active:scale-95 shadow-sm" style={{ backgroundColor: s.color }}>
                            <MapPin size={10} />{s.driver.driver_name.split(' ')[0]} ({s.route.length})
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">{ordersForMap.filter((o) => hasCoords(o)).length} dari {ordersForMap.length} order ditampilkan</p>
                  )}
                </div>
              </div>
              <MapView key={mapStrategyKey} orders={ordersForMap} strategyList={strategyListForMap} selectedOrders={selectedOrders} onOrderSelect={handleSelectOrder} focusedDriverIdx={focusedDriverIdx} onFocusCleared={() => setFocusedDriverIdx(null)} onClearFocus={() => setFocusedDriverIdx(null)} reassignTarget={reassignTarget} onReassignOrder={handleReassignOrder} searchHighlightIds={mapSearchHighlightIds} />
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Cari order ID, penerima, kota, sender…" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {orderSearch && <button onClick={() => setOrderSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                </div>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="all">Semua Status</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={orderSenderFilter} onChange={(e) => setOrderSenderFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-48">
                  <option value="all">Semua Sender</option>
                  {uniqueSenders.map((s) => <option key={s} value={s}>{s.length > 30 ? s.substring(0, 30) + '…' : s}</option>)}
                </select>
                <span className="text-xs text-gray-400">{filteredOrders.length} dari {orders.length}</span>
                {isFetchingBlitz && <span className="text-xs text-purple-500 flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Cek Blitz…</span>}
                <button
                  onClick={() => fetchBlitzForIds(filteredOrders.slice(0, 200).map((o) => o.merchant_order_id), true)}
                  disabled={isFetchingBlitz}
                  className="text-xs px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={11} />Refresh Status
                </button>
                <button onClick={handleSelectAllOrders} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium ml-auto">{filteredAllSelected ? 'Deselect All' : 'Select All'}</button>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ maxHeight: 360 }}>
                {isLoadingOrders
                  ? <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
                  : orders.length === 0
                    ? <div className="text-center py-10 text-gray-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Upload merchant orders terlebih dahulu</p></div>
                    : filteredOrders.length === 0
                      ? <div className="text-center py-10 text-gray-400"><Search className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Tidak ada order yang sesuai filter</p></div>
                      : (
                        <table className="min-w-full text-sm divide-y divide-gray-100">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-left"><button onClick={handleSelectAllOrders} className="text-blue-600">{filteredAllSelected ? <CheckSquare size={17} /> : <Square size={17} />}</button></th>
                              {['Order ID', 'Sender', 'Penerima', 'Kota', 'Tipe', 'Status', 'Batch ID', 'Koordinat'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredOrders.map((order) => {
                              const blitzInfo = blitzData[order.merchant_order_id];
                              return (
                                <tr key={order._id} className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedOrders.has(order._id) ? 'bg-blue-50' : ''}`} onClick={() => handleSelectOrder(order._id)}>
                                  <td className="px-3 py-2 text-blue-600">{selectedOrders.has(order._id) ? <CheckSquare size={17} /> : <Square size={17} />}</td>
                                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{order.merchant_order_id}</td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">{order.sender_name?.substring(0, 28) || '—'}</td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{order.consignee_name?.substring(0, 24)}</td>
                                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{order.destination_city}</td>
                                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full text-xs ${order.payment_type === 'cod' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{order.payment_type?.toUpperCase()}</span></td>
                                  <td className="px-3 py-2"><BlitzStatusBadge blitzInfo={blitzInfo} isLoading={isFetchingBlitz} /></td>
                                  <td className="px-3 py-2"><BatchIdCell blitzInfo={blitzInfo} isLoading={isFetchingBlitz} /></td>
                                  <td className="px-3 py-2 text-xs">{hasCoords(order) ? <span className="text-green-600 flex items-center gap-1"><MapPin size={11} />Ada</span> : <span className="text-gray-300">—</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
              </div>
            </div>
          )}

          {activeTab === 'driver' && (
            <div>
              <div className="flex gap-3 mb-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-48">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} placeholder="Cari driver…" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <span className="text-sm text-gray-400">{filteredDrivers.length} driver</span>
                {isLoadingPickupPoints && <span className="text-xs text-blue-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Memuat pickup points…</span>}
                {isFetchingDriverStatuses && <span className="text-xs text-green-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Cek status rider…</span>}
              </div>

              {strategyList.length > 0 && (
                <div className={`mb-3 p-3 rounded-lg border text-xs flex items-start gap-2 ${reassignTarget ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <ArrowLeftRight size={13} className="flex-shrink-0 mt-0.5" />
                  <div>
                    {reassignTarget
                      ? <><b>Mode Pindah Aktif</b> — target: <span className="font-semibold">{reassignTarget.driver_name}</span>. Buka tab <b>Peta Drop Points</b> lalu klik titik order yang ingin dipindahkan.</>
                      : <><b>Pemindahan Order:</b> Klik tombol <b>"Set Tujuan"</b> di samping driver yang ingin menerima order, kemudian buka Peta dan klik titik order untuk memindahkannya.</>
                    }
                  </div>
                  {reassignTarget && <button onClick={() => setReassignTargetId(null)} className="ml-auto flex-shrink-0 text-blue-500 hover:text-blue-700"><X size={13} /></button>}
                </div>
              )}

              <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ maxHeight: 440 }}>
                {isLoading
                  ? <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
                  : filteredDrivers.length === 0
                    ? <div className="text-center py-10 text-gray-400"><FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Upload file Excel driver terlebih dahulu</p></div>
                    : (
                      <table className="min-w-full text-sm divide-y divide-gray-100">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 w-8" />
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Driver ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Nama Driver</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Phone</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Pickup Point</th>
                            {strategyList.length > 0 && <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">Pindah Order</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {filteredDrivers.map((driver, dIdx) => {
                            const isSelected = selectedDrivers.has(driver._id);
                            const isReassignTarget = reassignTargetId === driver._id;
                            const assignedPickup = driverPickupMap[driver._id];
                            const color = DRIVER_COLORS[dIdx % DRIVER_COLORS.length];
                            const driverInStrategy = strategyList.find((s) => s.driver._id === driver._id);
                            const riderStatus = driverRiderStatuses[driver._id] || 'unknown';
                            const activeBatchId = driverActiveBatchIds[driver._id] || null;
                            return (
                              <tr key={driver._id} className={`transition-colors ${isReassignTarget ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}>
                                <td className="px-3 py-3 cursor-pointer" onClick={() => handleToggleDriver(driver._id)}>
                                  {isSelected ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}><div className="w-2 h-2 rounded-full bg-white" /></div> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                                </td>
                                <td className="px-3 py-3 font-mono text-gray-600 text-xs whitespace-nowrap cursor-pointer" onClick={() => handleToggleDriver(driver._id)}>{driver.driver_id}</td>
                                <td className="px-3 py-3 cursor-pointer" onClick={() => handleToggleDriver(driver._id)}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isSelected ? color : '#EFF6FF' }}>
                                      <User size={13} style={{ color: isSelected ? 'white' : '#2563EB' }} />
                                    </div>
                                    <span className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{driver.driver_name}</span>
                                    {driverInStrategy && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{driverInStrategy.route.length} orders</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap cursor-pointer" onClick={() => handleToggleDriver(driver._id)}>{driver.driver_phone}</td>
                                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                  {isFetchingDriverStatuses ? <span className="flex items-center gap-1 text-xs text-gray-400"><Loader2 size={10} className="animate-spin" />…</span> : <RiderStatusDot status={riderStatus} activeBatchId={activeBatchId} />}
                                </td>
                                <td className="px-3 py-3 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                                  {isSelected ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex-1">
                                        <Warehouse size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <select value={assignedPickup?.sender_name || ''} onChange={(e) => { const found = pickupPoints.find((p) => p.sender_name === e.target.value); handleSetDriverPickup(driver._id, found || null); }} className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer" style={{ borderColor: assignedPickup?.hasCoords ? '#bbf7d0' : assignedPickup ? '#fecaca' : undefined }}>
                                          <option value="">— Pilih Pickup Point —</option>
                                          {pickupPoints.map((p) => (<option key={p.sender_name} value={p.sender_name} disabled={!p.hasCoords}>{p.sender_name}{!p.hasCoords ? ' ⚠ no coords' : ''}</option>))}
                                        </select>
                                      </div>
                                      {assignedPickup ? assignedPickup.hasCoords ? <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap"><MapPin size={10} />Valid</span> : <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 whitespace-nowrap"><AlertCircle size={10} />No Coords</span> : null}
                                    </div>
                                  ) : <span className="text-xs text-gray-300 italic">Centang driver untuk memilih pickup point</span>}
                                </td>
                                {strategyList.length > 0 && (
                                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                    {driverInStrategy ? (
                                      <button onClick={() => { const newTarget = reassignTargetId === driver._id ? null : driver._id; setReassignTargetId(newTarget); if (newTarget) setActiveTab('map'); }} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${isReassignTarget ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}>
                                        <ArrowLeftRight size={11} />{isReassignTarget ? '✓ Target Aktif' : 'Set Tujuan'}
                                      </button>
                                    ) : <span className="text-xs text-gray-300 italic">Tidak ada di strategy</span>}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
              </div>

              {selectedDriverList.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ringkasan Driver Terpilih</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDriverList.map((d, i) => {
                      const pickup = driverPickupMap[d._id];
                      const globalIdx = assignments.findIndex((a) => a._id === d._id);
                      const color = DRIVER_COLORS[globalIdx % DRIVER_COLORS.length];
                      return (
                        <div key={d._id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs" style={{ borderColor: color + '60', backgroundColor: color + '10' }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}><span className="text-white font-bold" style={{ fontSize: 9 }}>{i + 1}</span></div>
                          <span className="font-semibold" style={{ color }}>{d.driver_name.split(' ')[0]}</span>
                          {pickup?.hasCoords ? <span className="text-green-600 flex items-center gap-0.5"><MapPin size={9} />{pickup.sender_name.length > 16 ? pickup.sender_name.substring(0, 16) + '…' : pickup.sender_name}</span> : <span className="text-amber-500 flex items-center gap-0.5"><AlertCircle size={9} />belum dipilih</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'strategy' && strategyList.length > 0 && (
            <StrategyResultList
              strategyList={strategyList}
              errors={strategyErrors}
              onClose={() => { setStrategyList([]); setStrategyErrors([]); setActiveTab('map'); setReassignTargetId(null); setFocusedDriverIdx(null); setMapStrategyKey((k) => k + 1); setBlitzData({}); }}
              onFocusDriver={handleDriverChipClick}
              onReassignOrders={handleBulkReassignOrders}
              selectedProject={selectedProject}
              blitzData={blitzData}
              isFetchingBlitz={isFetchingBlitz}
              onRefreshBlitz={() => fetchStrategyBlitz(strategyList, true)}
              onAssignSuccess={() => fetchStrategyBlitz(strategyList, true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}