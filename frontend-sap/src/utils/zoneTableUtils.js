export const ZONE_TABLE_HEAD = [
  "Hub", "Courier Name", "Courier Code", "Zone 1", "Zone 2", "Zone 3",
  "Zone 4", "Zone 5", "Zone 6", "Total Packages", "Base Fee", "Heavy Package Fee",
  "Package Bonus", "Festive Bonus", "Post-Reconciliation", "Additional Personal", 
  "Incentives", "Askor Fee", "Total Fee"
];

export const HEADER_FIELD_MAPPING = {
  "Hub": "hub",
  "Courier Name": "courierName", 
  "Courier Code": "courierCode",
  "Zone 1": "zona1",
  "Zone 2": "zona2", 
  "Zone 3": "zona3",
  "Zone 4": "zona4",
  "Zone 5": "zona5",
  "Zone 6": "zona6",
  "Total Packages": "totalPacket",
  "Base Fee": "fee",
  "Heavy Package Fee": "heavyPrice",
  "Package Bonus": "bonusPacket",
  "Festive Bonus": "festiveBonus",
  "Post-Reconciliation": "afterRekon",
  "Additional Personal": "addPersonal",
  "Incentives": "incentives", 
  "Askor Fee": "askorFee",
  "Total Fee": "totalFee"
};

export const ZONE_COLORS = {
  ZONA1: "text-green-600",
  ZONA2: "text-green-700", 
  ZONA3: "text-yellow-600",
  ZONA4: "text-orange-600",
  ZONA5: "text-red-600",
  ZONA6: "text-red-800"
};

export const BONUS_THRESHOLDS = {
  HIGH: 120000,
  MEDIUM: 60000,
  LOW: 30000
};

export const getColumnWidth = (header, value = "") => {
  const baseWidths = {
    "Hub": "min-w-24",
    "Courier Name": "min-w-36", 
    "Courier Code": "min-w-28",
    "Zone 1": "min-w-20",
    "Zone 2": "min-w-20", 
    "Zone 3": "min-w-20",
    "Zone 4": "min-w-20",
    "Zone 5": "min-w-20",
    "Zone 6": "min-w-20",
    "Total Packages": "min-w-24",
    "Base Fee": "min-w-28",
    "Heavy Package Fee": "min-w-32",
    "Package Bonus": "min-w-32",
    "Festive Bonus": "min-w-32", 
    "Post-Reconciliation": "min-w-36",
    "Additional Personal": "min-w-36",
    "Incentives": "min-w-28",
    "Askor Fee": "min-w-28",
    "Total Fee": "min-w-28"
  };

  const valueLength = String(value).length;
  if (valueLength > 15) return "min-w-40";
  if (valueLength > 12) return "min-w-36"; 
  if (valueLength > 8) return "min-w-32";
  
  return baseWidths[header] || "min-w-24";
};

const styleCache = new Map();

export const getPackageBonusStyle = (bonusAmount) => {
  const key = `bonus_${bonusAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  let style;
  if (bonusAmount >= BONUS_THRESHOLDS.HIGH) {
    style = "font-bold text-green-800 bg-green-100";
  } else if (bonusAmount >= BONUS_THRESHOLDS.MEDIUM) {
    style = "font-bold text-blue-800 bg-blue-100";
  } else if (bonusAmount >= BONUS_THRESHOLDS.LOW) {
    style = "font-bold text-yellow-800 bg-yellow-100";
  } else {
    style = "font-medium text-gray-600 bg-gray-50";
  }

  styleCache.set(key, style);
  return style;
};

export const getFestiveBonusStyle = (festiveBonusAmount) => {
  const key = `festive_${festiveBonusAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  const style = festiveBonusAmount > 0 
    ? "font-bold text-emerald-800 bg-emerald-100"
    : "font-medium text-gray-600 bg-gray-50";

  styleCache.set(key, style);
  return style;
};

export const getAfterRekonStyle = (afterRekonAmount) => {
  const key = `rekon_${afterRekonAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  let style;
  if (afterRekonAmount > 0) {
    style = "font-bold text-green-800 bg-green-100";
  } else if (afterRekonAmount < 0) {
    style = "font-bold text-red-800 bg-red-100";
  } else {
    style = "font-medium text-gray-600 bg-gray-50";
  }

  styleCache.set(key, style);
  return style;
};

export const getAddPersonalStyle = (addPersonalAmount) => {
  const key = `personal_${addPersonalAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  const style = addPersonalAmount > 0 
    ? "font-bold text-purple-800 bg-purple-100"
    : "font-medium text-gray-600 bg-gray-50";

  styleCache.set(key, style);
  return style;
};

export const getIncentivesStyle = (incentivesAmount) => {
  const key = `incentives_${incentivesAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  const style = incentivesAmount > 0 
    ? "font-bold text-indigo-800 bg-indigo-100"
    : "font-medium text-gray-600 bg-gray-50";

  styleCache.set(key, style);
  return style;
};

export const getAskorFeeStyle = (askorFeeAmount) => {
  const key = `askor_${askorFeeAmount}`;
  if (styleCache.has(key)) return styleCache.get(key);

  const style = askorFeeAmount > 0 
    ? "font-bold text-teal-800 bg-teal-100"
    : "font-medium text-gray-600 bg-gray-50";

  styleCache.set(key, style);
  return style;
};

export const findDuplicateCourierNames = (data) => {
  if (!Array.isArray(data)) return [];

  const nameCount = new Map();

  data.forEach(item => {
    const name = item?.courierName;
    if (name && name.trim()) {
      const normalizedName = name.trim().toLowerCase();
      nameCount.set(normalizedName, (nameCount.get(normalizedName) || 0) + 1);
    }
  });

  const duplicates = [];
  for (const [name, count] of nameCount.entries()) {
    if (count > 1) {
      const originalName = data.find(item => 
        item?.courierName && item.courierName.trim().toLowerCase() === name
      )?.courierName;
      if (originalName) {
        duplicates.push(originalName);
      }
    }
  }

  return duplicates;
};

export const findDuplicateCourierCodes = (data) => {
  if (!Array.isArray(data)) return [];

  const codeCount = new Map();

  data.forEach(item => {
    const code = item?.courierCode;
    if (code && code.trim()) {
      const normalizedCode = code.trim().toLowerCase();
      codeCount.set(normalizedCode, (codeCount.get(normalizedCode) || 0) + 1);
    }
  });

  const duplicates = [];
  for (const [code, count] of codeCount.entries()) {
    if (count > 1) {
      const originalCode = data.find(item => 
        item?.courierCode && item.courierCode.trim().toLowerCase() === code
      )?.courierCode;
      if (originalCode) {
        duplicates.push(originalCode);
      }
    }
  }

  return duplicates;
};

export const getDuplicateNameStyle = () => {
  return "font-bold text-orange-800 bg-orange-100 border border-orange-300 px-2 py-1 rounded";
};

export const getDuplicateCodeStyle = () => {
  return "font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-1 rounded";
};

const sortCache = new WeakMap();

export const sortZoneData = (zoneData) => {
  if (!Array.isArray(zoneData)) return [];

  if (sortCache.has(zoneData)) {
    return sortCache.get(zoneData);
  }

  const sorted = [...zoneData].map(item => ({
    ...item,
    zona1: item.zones?.['ZONA 1'] || 0,
    zona2: item.zones?.['ZONA 2'] || 0, 
    zona3: item.zones?.['ZONA 3'] || 0,
    zona4: item.zones?.['ZONA 4'] || 0,
    zona5: item.zones?.['ZONA 5'] || 0,
    zona6: item.zones?.['ZONA 6'] || 0
  })).sort((a, b) => {
    const hubA = a.hub || "";
    const hubB = b.hub || "";
    const hubCompare = hubA.localeCompare(hubB);

    if (hubCompare !== 0) return hubCompare;

    const nameA = a.courierName || "";
    const nameB = b.courierName || "";
    return nameA.localeCompare(nameB);
  });

  sortCache.set(zoneData, sorted);
  return sorted;
};

export const calculateTotals = (sortedData) => {
  if (!Array.isArray(sortedData) || sortedData.length === 0) {
    return {
      zona1: 0, zona2: 0, zona3: 0, zona4: 0, zona5: 0, zona6: 0,
      totalPacket: 0, fee: 0, addWeight: 0, heavyPrice: 0, bonusPacket: 0, 
      festiveBonus: 0, bonusIdulAdha: 0, afterRekon: 0, addPersonal: 0, 
      incentives: 0, askorFee: 0, totalFee: 0
    };
  }

  const totals = {
    zona1: 0, zona2: 0, zona3: 0, zona4: 0, zona5: 0, zona6: 0,
    totalPacket: 0, fee: 0, addWeight: 0, heavyPrice: 0, bonusPacket: 0, 
    festiveBonus: 0, bonusIdulAdha: 0, afterRekon: 0, addPersonal: 0, 
    incentives: 0, askorFee: 0, totalFee: 0
  };

  for (let i = 0; i < sortedData.length; i++) {
    const row = sortedData[i];
    if (!row) continue;

    totals.zona1 += row.zona1 || 0;
    totals.zona2 += row.zona2 || 0;
    totals.zona3 += row.zona3 || 0;
    totals.zona4 += row.zona4 || 0;
    totals.zona5 += row.zona5 || 0;
    totals.zona6 += row.zona6 || 0;

    totals.totalPacket += row.totalPacket || 0;
    totals.fee += row.fee || 0;
    totals.addWeight += row.addWeight || 0;
    totals.heavyPrice += row.heavyPrice || 0;
    totals.bonusPacket += row.bonusPacket || 0;
    totals.festiveBonus += row.festiveBonus || 0;
    totals.bonusIdulAdha += row.bonusIdulAdha || 0;
    totals.afterRekon += row.afterRekon || 0;
    totals.addPersonal += row.addPersonal || 0;
    totals.incentives += row.incentives || 0;
    totals.askorFee += row.askorFee || 0;
    totals.totalFee += row.totalFee || 0;
  }

  return totals;
};

const formatCache = new Map();

export const formatCurrency = (amount) => {
  if (formatCache.has(amount)) return formatCache.get(amount);

  const formatted = (amount || 0).toLocaleString("id-ID");
  formatCache.set(amount, formatted);
  return formatted;
};

let hubCountCache = null;
let hubCountCacheKey = null;

export const getUniqueHubCount = (data) => {
  if (!Array.isArray(data)) return 0;

  const cacheKey = data.length;
  if (hubCountCache !== null && hubCountCacheKey === cacheKey) {
    return hubCountCache;
  }

  const hubs = new Set();
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.hub) {
      hubs.add(data[i].hub);
    }
  }

  hubCountCache = hubs.size;
  hubCountCacheKey = cacheKey;
  return hubs.size;
};

export const validateZoneData = (zoneData) => {
  return zoneData && Array.isArray(zoneData) && zoneData.length > 0;
};

export const createSearchIndex = (data) => {
  if (!Array.isArray(data)) return new Map();

  const index = new Map();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const searchableText = [
      row.hub || "",
      row.courierName || "", 
      row.courierCode || ""
    ].join(" ").toLowerCase();

    index.set(i, searchableText);
  }

  return index;
};

export const filterDataBySearch = (data, searchTerm, searchIndex) => {
  if (!searchTerm || !searchTerm.trim()) return data;
  if (!searchIndex || !Array.isArray(data)) return data;

  const term = searchTerm.toLowerCase().trim();
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const searchableText = searchIndex.get(i);
    if (searchableText && searchableText.includes(term)) {
      results.push(data[i]);
    }
  }

  return results;
};

export const processDataInBatches = async (data, batchSize = 1000, processor) => {
  if (!Array.isArray(data)) return [];

  const results = [];
  const totalBatches = Math.ceil(data.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, data.length);
    const batch = data.slice(start, end);

    const batchResult = await processor(batch, i);
    results.push(...batchResult);

    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
};

export const createWebWorker = (workerFunction) => {
  const workerCode = `
    self.onmessage = function(e) {
      const { data, id } = e.data;
      try {
        const result = (${workerFunction.toString()})(data);
        self.postMessage({ result, id });
      } catch (error) {
        self.postMessage({ error: error.message, id });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export const calculateTotalsWithWorker = (data) => {
  return new Promise((resolve, reject) => {
    const workerFunction = (data) => {
      const totals = {
        zona1: 0, zona2: 0, zona3: 0, zona4: 0, zona5: 0, zona6: 0,
        totalPacket: 0, fee: 0, addWeight: 0, heavyPrice: 0, bonusPacket: 0, 
        festiveBonus: 0, bonusIdulAdha: 0, afterRekon: 0, addPersonal: 0, 
        incentives: 0, askorFee: 0, totalFee: 0
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;

        totals.zona1 += row.zona1 || 0;
        totals.zona2 += row.zona2 || 0;
        totals.zona3 += row.zona3 || 0;
        totals.zona4 += row.zona4 || 0;
        totals.zona5 += row.zona5 || 0;
        totals.zona6 += row.zona6 || 0;

        totals.totalPacket += row.totalPacket || 0;
        totals.fee += row.fee || 0;
        totals.addWeight += row.addWeight || 0;
        totals.heavyPrice += row.heavyPrice || 0;
        totals.bonusPacket += row.bonusPacket || 0;
        totals.festiveBonus += row.festiveBonus || 0;
        totals.bonusIdulAdha += row.bonusIdulAdha || 0;
        totals.afterRekon += row.afterRekon || 0;
        totals.addPersonal += row.addPersonal || 0;
        totals.incentives += row.incentives || 0;
        totals.askorFee += row.askorFee || 0;
        totals.totalFee += row.totalFee || 0;
      }

      return totals;
    };

    const worker = createWebWorker(workerFunction);
    const id = Date.now();

    worker.onmessage = (e) => {
      const { result, error, id: responseId } = e.data;
      if (responseId === id) {
        worker.terminate();
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ data, id });
  });
};

export const clearCaches = () => {
  styleCache.clear();
  formatCache.clear();
  hubCountCache = null;
  hubCountCacheKey = null;
};

export const INFO_TEXTS = {
  PACKAGE_BONUSES: "Package Bonuses: Dynamic styling based on bonus amounts",
  FESTIVE_BONUS: "Festive Bonus: Special occasion bonuses for drivers",
  AFTER_REKON: "Post-Reconciliation: Adjustments after reconciliation process", 
  ADD_PERSONAL: "Additional Personal: Personal allowances and additions",
  INCENTIVES: "Incentives: Performance-based incentive payments",
  ASKOR_FEE: "Askor Fee: Weekly earnings from delivery activities"
};