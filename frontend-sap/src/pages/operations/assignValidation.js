import { ASSIGNABLE_BLITZ_STATUSES } from './constants';

export const isBlitzStatusAssignable = (merchantOrderId, blitzData) => {
  const d = blitzData[merchantOrderId];
  if (!d || !d.exists) return true;
  const status = d.order_status?.toLowerCase();
  return ASSIGNABLE_BLITZ_STATUSES.includes(status);
};

export const validateInvoiceStatuses = (route, blitzData) => {
  const invalidOrders = route.filter(
    (o) => !isBlitzStatusAssignable(o.merchant_order_id, blitzData)
  );
  if (invalidOrders.length === 0) return { valid: true };
  const names = invalidOrders
    .map(
      (o) =>
        `${o.merchant_order_id} (${blitzData[o.merchant_order_id]?.order_status || 'unknown'})`
    )
    .join(', ');
  return {
    valid: false,
    message: `Invoice berikut tidak dapat di-assign karena statusnya tidak valid:\n${names}`,
  };
};

export const checkRiderCondition = (riderStatus) => {
  if (riderStatus === 'offline') {
    return {
      canDirectAssign: false,
      modalType: 'offline',
      message:
        'Rider dalam kondisi offline. Order tidak dapat langsung di-assign. Apakah tetap ingin melanjutkan create batch?',
    };
  }
  if (riderStatus === 'online') {
    return {
      canDirectAssign: false,
      modalType: 'outside_pickup',
      message:
        'Rider sedang online namun berada di luar lokasi pickup. Order tidak dapat langsung di-assign. Apakah tetap ingin melanjutkan create batch?',
    };
  }
  return { canDirectAssign: true, modalType: null, message: null };
};

export const buildAssignPayload = (strategy, selectedProject, validationMap, batchOnly) => {
  const senderNames = [
    ...new Set(strategy.route.map((o) => o.sender_name).filter(Boolean)),
  ];
  const groupedBySender = {};
  strategy.route.forEach((o) => {
    const sn = o.sender_name || senderNames[0];
    if (!groupedBySender[sn]) groupedBySender[sn] = [];
    groupedBySender[sn].push(o._id);
  });
  return {
    senderNames,
    groupedBySender,
    driverId: strategy.driver.driver_id,
    driverName: strategy.driver.driver_name,
    driverPhone: strategy.driver.driver_phone,
    project: selectedProject,
    batchOnly,
    validationMap,
  };
};

export const executeAssign = async (strategy, selectedProject, validationMap, batchOnly, API_URL) => {
  const payload = buildAssignPayload(strategy, selectedProject, validationMap, batchOnly);
  let totalSuccess = 0;
  let totalFail = 0;
  const failMessages = [];

  for (const [senderName, senderOrderIds] of Object.entries(payload.groupedBySender)) {
    const validationData = payload.validationMap[senderName];
    if (!validationData) {
      failMessages.push(`${senderName}: validation data tidak ditemukan`);
      totalFail += senderOrderIds.length;
      continue;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/merchant-orders/${selectedProject}/assign-with-blitz-admin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderIds: senderOrderIds,
            driverId: payload.driverId,
            driverName: payload.driverName,
            driverPhone: payload.driverPhone,
            activeBatchId: null,
            validationData,
            batchOnly,
          }),
        }
      );
      const result = await res.json();
      if (result.success) {
        totalSuccess += senderOrderIds.length;
      } else {
        totalFail += senderOrderIds.length;
        failMessages.push(`${senderName}: ${result.message || result.error}`);
      }
    } catch (err) {
      totalFail += senderOrderIds.length;
      failMessages.push(`${senderName}: ${err.message}`);
    }
  }

  return { totalSuccess, totalFail, failMessages };
};