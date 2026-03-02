import { memo } from 'react';
import { Shield, BarChart2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { getSlaStatus } from './generateStrategy';

export const renderStatusBadge = (status) => {
  const cfg = {
    batched: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Batched' },
    assigned: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Assigned' },
    picked_up: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Picked Up' },
    in_transit: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'In Transit' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    driver_cancel: { bg: 'bg-red-100', text: 'text-red-700', label: 'Driver Cancel' },
    created: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Created' },
  }[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || 'Available' };
  return (
    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export const renderBatchId = (batchId) => {
  if (!batchId) return <span className="text-gray-300">—</span>;
  return (
    <span className="px-1.5 py-0.5 rounded-full text-xs font-mono bg-purple-100 text-purple-700">
      #{batchId}
    </span>
  );
};

export const BlitzStatusBadge = memo(({ blitzInfo, isLoading }) => {
  if (isLoading) return <span className="text-gray-300 text-xs">—</span>;
  if (blitzInfo === undefined) return <span className="text-gray-300 text-xs">—</span>;
  if (blitzInfo === null || !blitzInfo.exists) {
    return (
      <span className="px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        Available
      </span>
    );
  }
  return renderStatusBadge(blitzInfo.order_status);
});

export const BatchIdCell = memo(({ blitzInfo, isLoading }) => {
  if (isLoading) return <span className="text-gray-300 text-xs">—</span>;
  if (blitzInfo === undefined) return <span className="text-gray-300">—</span>;
  return renderBatchId(blitzInfo?.batch_id);
});

export const SlaIndicator = memo(({ estimatedMinutes }) => {
  const s = getSlaStatus(estimatedMinutes);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <Shield size={9} />
      {s.label}
    </span>
  );
});

export const RouteInsightPanel = memo(({ insight }) => {
  const [open, setOpen] = useState(false);
  if (!insight) return null;
  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left"
      >
        <BarChart2 size={13} className="text-indigo-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-indigo-700">
          Insight Routing — {insight.method}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {insight.totalOrders} order · {insight.totalCities} kota · estimasi hemat{' '}
          {insight.estimatedSaving}
        </span>
        {open ? (
          <ChevronUp size={13} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 bg-indigo-50/50">
          <div className="space-y-1.5">
            {insight.steps.map((step, i) => (
              <div key={i} className="flex gap-2 text-xs text-indigo-800">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const RiderStatusDot = memo(({ status, activeBatchId }) => {
  if (activeBatchId) {
    return (
      <span title={`Active Batch: #${activeBatchId}`} className="inline-flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
        <span className="text-xs text-purple-700 font-medium">Batch #{activeBatchId}</span>
      </span>
    );
  }
  if (status === 'online_at_pickup') {
    return (
      <span title="Online & di lokasi pickup" className="inline-flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
        <span className="text-xs text-green-700 font-medium">Di Pickup</span>
      </span>
    );
  }
  if (status === 'online') {
    return (
      <span title="Online, di luar lokasi pickup" className="inline-flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
        <span className="text-xs text-yellow-700 font-medium">Online</span>
      </span>
    );
  }
  if (status === 'offline') {
    return (
      <span title="Offline" className="inline-flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
        <span className="text-xs text-red-700 font-medium">Offline</span>
      </span>
    );
  }
  return (
    <span title="Status tidak diketahui" className="inline-flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
      <span className="text-xs text-gray-400 font-medium">—</span>
    </span>
  );
});

export const SlaWarningBanner = memo(({ slaStatus, estimatedTime }) => {
  if (slaStatus?.level === 'ok') return null;
  const isCritical = slaStatus?.level === 'critical';
  return (
    <div
      className={`px-4 py-2 border-b flex items-center gap-2 text-xs ${
        isCritical
          ? 'bg-red-50 border-red-100 text-red-700'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}
    >
      <AlertCircle size={12} />
      <span>
        Estimasi {estimatedTime} menit —{' '}
        {isCritical
          ? 'Risiko tinggi melewati SLA 4 jam'
          : 'Mendekati batas SLA, pantau ketat'}
      </span>
    </div>
  );
});