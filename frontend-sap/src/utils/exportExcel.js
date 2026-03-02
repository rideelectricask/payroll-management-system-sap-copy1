import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { groupByCourierAndDate, getDriverData, findDriverByCode, formatGroupedDataForExport } from "./processors/groupData";
import { processHubData, calculateSummaryMetrics, generateChartData, getTopPerformers, getPriorityAreas, getVolumeLeaders } from "./processors/processorHub";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-pms-production-0cec.up.railway.app/api';

const normalizeMongoData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => normalizeMongoData(item));

  const normalized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      if (value.$oid) normalized[key] = value.$oid;
      else if (value.$numberInt) normalized[key] = parseInt(value.$numberInt, 10);
      else if (value.$numberDouble) normalized[key] = parseFloat(value.$numberDouble);
      else if (value.$numberLong) normalized[key] = parseInt(value.$numberLong, 10);
      else if (value.$date && value.$date.$numberLong) normalized[key] = new Date(parseInt(value.$date.$numberLong, 10));
      else if (value.$date) normalized[key] = new Date(value.$date);
      else normalized[key] = normalizeMongoData(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
};

const formatDurationToHMS = (hours) => {
  if (!hours || hours === 0) return "00:00:00";
  const totalMinutes = hours * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.floor((totalMinutes % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDistanceWithTwoDecimals = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

const getMergedDataColumns = () => [
  "Client Name", "Project Name", "Date", "HUB", "Order Code", "Weight", "Distance",
  "Cnee Name", "Cnee Address 1", "Cnee Address 2", "Cnee Area", "Location Expected",
  "Cnee Phone", "Slot Time", "ETA", "Courier Code", "Courier Name", "Unit",
  "Receiver", "Receiving Date", "Receiving Time", "DropOff Done", "Total Pengiriman",
  "Cost", "Add Cost 1", "Add Cost 2", "Add Charge 1", "Add Charge 2", "Selling Price",
  "Profit", "Zona", "Distance Cost For Client", "Distance Cost Above 30Km For Client",
  "Weight Cost For Client", "Total Cost For Client", "Delivery Status"
];

const getOriginalDataColumns = () => [
  "Client Name", "Project Name", "Date", "HUB", "Order Code", "Weight", "Distance",
  "Cnee Name", "Cnee Address 1", "Cnee Address 2", "Cnee Area", "Location Expected",
  "Cnee Phone", "Slot Time", "ETA", "Courier Code", "Courier Name", "Receiver",
  "Receiving Date", "Receiving Time", "DropOff Done", "Delivery Status"
];

const getGroupedDataColumns = () => [
  "Client Name", "Order Code", "Courier Name", "Courier Code", "HUB", "DropOff Done",
  "Total Pengiriman", "Cost", "Add Cost 1", "Add Cost 2", "Add Charge 1", "Add Charge 2",
  "Selling Price", "Profit", "Zona", "Distance Cost For Client",
  "Distance Cost Above 30Km For Client", "Weight Cost For Client", "Total Cost For Client",
  "Delivery Status"
];

const getRiderPerformanceColumns = () => [
  "HUB", "Courier Code", "Courier Name", "Performance Badge", "Rank", "Percentile",
  "Performance Score", "Total Deliveries", "On Time Deliveries", "Late Deliveries",
  "On Time %", "Late %", "Delivery Ratio", "Distance Total (km)", "Cost (IDR)",
  "Profit (IDR)", "Net Profit (IDR)", "Total Delivery Time", "Total Distance (km)",
  "Total Round Up"
];

const getAllUniqueDates = (allDisplayData) => {
  const dateSet = new Set();
  allDisplayData.forEach(rider => {
    if (rider.uniqueDates && Array.isArray(rider.uniqueDates)) {
      rider.uniqueDates.forEach(date => dateSet.add(date));
    }
  });
  return Array.from(dateSet).sort();
};

const getDynamicRiderPerformanceColumns = (allDisplayData) => {
  const basicColumns = getRiderPerformanceColumns();
  const uniqueDates = getAllUniqueDates(allDisplayData);
  const dynamicColumns = uniqueDates.map(date => `${date} (Del|RU|Dist|Time)`);
  const additionalColumns = [
    "Avg Daily Deliveries (All Days)", "Avg Daily Round Up (All Days)",
    "Avg Daily Distance (All Days)", "Avg Daily Time (All Days)",
    "Avg Daily Deliveries (Active Days)", "Avg Daily Round Up (Active Days)",
    "Avg Daily Distance (Active Days)", "Avg Daily Time (Active Days)",
    "Performance Analysis"
  ];
  return [...basicColumns, ...dynamicColumns, ...additionalColumns];
};

const formatRiderPerformanceData = (allDisplayData) => {
  if (!allDisplayData || !Array.isArray(allDisplayData)) return [];

  const uniqueDates = getAllUniqueDates(allDisplayData);

  return allDisplayData.map(rider => {
    const topPerformerData = rider.topPerformerData || {};
    const indicator = topPerformerData.indicator || {};
    const advancedInsights = topPerformerData.advancedInsights || {};

    const formattedRider = {
      "HUB": rider.hub || '',
      "Courier Code": rider.courierCode || '',
      "Courier Name": rider.courierName || '',
      "Performance Badge": indicator.badge || '',
      "Rank": topPerformerData.rank || '',
      "Percentile": topPerformerData.percentile ? parseFloat(topPerformerData.percentile).toFixed(2) : '',
      "Performance Score": topPerformerData.score ? parseFloat(topPerformerData.score).toFixed(5) : '',
      "Total Deliveries": Number(rider.totalDeliveries) || 0,
      "On Time Deliveries": Number(rider.onTimeDeliveries) || 0,
      "Late Deliveries": Number(rider.lateDeliveries) || 0,
      "On Time %": parseFloat(rider.onTimePercentage || 0).toFixed(2),
      "Late %": parseFloat(rider.latePercentage || 0).toFixed(2),
      "Delivery Ratio": parseFloat(rider.deliveryRatio || 0).toFixed(2),
      "Distance Total (km)": formatDistanceWithTwoDecimals(rider.distanceTotal || 0),
      "Cost (IDR)": formatCurrency(rider.cost || 0),
      "Profit (IDR)": formatCurrency(rider.profit || 0),
      "Net Profit (IDR)": formatCurrency(rider.netProfit || 0),
      "Total Delivery Time": formatDurationToHMS(rider.totalDeliveryTime || 0),
      "Total Distance (km)": formatDistanceWithTwoDecimals(rider.totalDistance || 0),
      "Total Round Up": Number(rider.totalRoundUp) || 0
    };

    uniqueDates.forEach(date => {
      const deliveries = Number(rider.deliveriesByDate?.[date] || 0);
      const roundUp = parseFloat(rider.roundUpByDate?.[date] || 0).toFixed(2);
      const distance = formatDistanceWithTwoDecimals(rider.distanceByDate?.[date] || 0);
      const deliveryTime = formatDurationToHMS(rider.deliveryTimeByDate?.[date] || 0);
      formattedRider[`${date} (Del|RU|Dist|Time)`] = `${deliveries} | ${roundUp} | ${distance} | ${deliveryTime}`;
    });

    formattedRider["Avg Daily Deliveries (All Days)"] = parseFloat(rider.avgAllCount || 0).toFixed(2);
    formattedRider["Avg Daily Round Up (All Days)"] = parseFloat(rider.avgAllRoundUp || 0).toFixed(2);
    formattedRider["Avg Daily Distance (All Days)"] = formatDistanceWithTwoDecimals(rider.avgAllDistance || 0);
    formattedRider["Avg Daily Time (All Days)"] = formatDurationToHMS(rider.avgAllTime || 0);
    formattedRider["Avg Daily Deliveries (Active Days)"] = parseFloat(rider.avgCount || 0).toFixed(2);
    formattedRider["Avg Daily Round Up (Active Days)"] = parseFloat(rider.avgRoundUp || 0).toFixed(2);
    formattedRider["Avg Daily Distance (Active Days)"] = formatDistanceWithTwoDecimals(rider.avgDistance || 0);
    formattedRider["Avg Daily Time (Active Days)"] = formatDurationToHMS(rider.avgTime || 0);
    formattedRider["Performance Analysis"] = advancedInsights.detailedAnalysis || '';

    return formattedRider;
  });
};

const formatDashboardData = (hubAnalysisData) => {
  if (!hubAnalysisData || !Array.isArray(hubAnalysisData) || hubAnalysisData.length === 0) {
    return { performanceData: [], summaryData: [], insightsData: [] };
  }

  const processedData = processHubData(hubAnalysisData);
  if (!processedData || processedData.length === 0) {
    return { performanceData: [], summaryData: [], insightsData: [] };
  }

  const summaryMetrics = calculateSummaryMetrics(processedData);
  const topPerformers = getTopPerformers(processedData);
  const priorityAreas = getPriorityAreas(processedData);
  const volumeLeaders = getVolumeLeaders(processedData);

  const sortedProcessedData = [...processedData].sort((a, b) => b.persentaseTepat - a.persentaseTepat);

  const performanceData = sortedProcessedData.map((item, index) => ({
    "Rank": index + 1,
    "Location": item.lokasi,
    "Short Name": item.shortName,
    "Category": item.kategori,
    "Total Shipments": item.totalPengiriman,
    "Late Shipments": item.terlambat,
    "On Time Percentage": parseFloat(item.persentaseTepat).toFixed(2),
    "Late Percentage": parseFloat(item.selisihPersentase).toFixed(2),
    "Performance Level": item.tingkatKinerja,
    "Performance Score": parseFloat(item.persentaseTepat).toFixed(2)
  }));

  const summaryData = [
    {
      "Metric": "Total Pengiriman",
      "Value": summaryMetrics.totalPengiriman.toLocaleString('id-ID'),
      "Unit": "shipments",
      "Description": "Total shipments across all locations"
    },
    {
      "Metric": "Tepat Waktu",
      "Value": summaryMetrics.tepatWaktu.toLocaleString('id-ID'),
      "Unit": "shipments",
      "Description": `${summaryMetrics.avgPerformance.toFixed(2)}% success rate`
    },
    {
      "Metric": "Keterlambatan",
      "Value": summaryMetrics.totalTerlambat.toLocaleString('id-ID'),
      "Unit": "shipments",
      "Description": `${summaryMetrics.keterlambatanRate.toFixed(2)}% delay rate`
    },
    {
      "Metric": "Average Performance",
      "Value": summaryMetrics.avgPerformance.toFixed(2),
      "Unit": "percentage",
      "Description": "Network-wide performance average"
    },
    {
      "Metric": "Delay Rate",
      "Value": summaryMetrics.keterlambatanRate.toFixed(2),
      "Unit": "percentage",
      "Description": "Overall delay rate across network"
    }
  ];

  const insightsData = [
    ...topPerformers.map(item => ({
      "Category": "Top Performer",
      "Location": item.lokasi,
      "Short Name": item.shortName,
      "Value": item.totalPengiriman,
      "Percentage": parseFloat(item.persentaseTepat).toFixed(2),
      "Performance Level": item.tingkatKinerja
    })),
    ...priorityAreas.map(item => ({
      "Category": "Priority Area",
      "Location": item.lokasi,
      "Short Name": item.shortName,
      "Value": item.totalPengiriman,
      "Percentage": parseFloat(item.persentaseTepat).toFixed(2),
      "Performance Level": item.tingkatKinerja
    })),
    ...volumeLeaders.map(leader => {
      const leaderData = sortedProcessedData.find(item => item.shortName === leader);
      return {
        "Category": "Volume Leader",
        "Location": leaderData?.lokasi || leader,
        "Short Name": leader,
        "Value": leaderData?.totalPengiriman || 0,
        "Percentage": leaderData ? parseFloat(leaderData.persentaseTepat).toFixed(2) : '0.00',
        "Performance Level": leaderData?.tingkatKinerja || 'N/A'
      };
    })
  ];

  return { performanceData, summaryData, insightsData };
};

const callChartGenerationAPI = async (dashboardData) => {
  const response = await fetch(`${API_BASE_URL}/chart/generate-dashboard-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dashboardData)
  });

  if (!response.ok) {
    throw new Error(`Chart generation failed: ${response.status} ${response.statusText}`);
  }

  return await response.blob();
};

const mergeDataByOrderCode = async (originalData, groupedData) => {
  const normalizedOriginal = normalizeMongoData(originalData);
  const normalizedGrouped = normalizeMongoData(groupedData);
  const groupedDataColumns = getGroupedDataColumns();
  const originalDataColumns = getOriginalDataColumns();

  const convertArrayToObject = (arrayData, columns) => {
    if (!Array.isArray(arrayData)) return arrayData;
    const result = {};
    arrayData.forEach((value, index) => {
      if (index < columns.length) result[columns[index]] = value;
    });
    return result;
  };

  const processedOriginal = normalizedOriginal.map(item => 
    Array.isArray(item) ? convertArrayToObject(item, originalDataColumns) : item
  );

  const processedGrouped = normalizedGrouped.map(item => 
    Array.isArray(item) ? convertArrayToObject(item, groupedDataColumns) : item
  );

  const groupedMap = new Map();
  processedGrouped.forEach(item => {
    const orderCode = item["Order Code"];
    if (orderCode) groupedMap.set(orderCode, item);
  });

  const drivers = await getDriverData();
  const mergedColumns = getMergedDataColumns();

  return processedOriginal.map(originalItem => {
    const orderCode = originalItem["Order Code"];
    const groupedItem = groupedMap.get(orderCode) || {};
    const merged = {};

    mergedColumns.forEach(key => {
      if (key === "Courier Name" && originalItem["Courier Code"]) {
        const driver = findDriverByCode(originalItem["Courier Code"], drivers);
        merged[key] = driver ? (driver.fullName || originalItem["Courier Name"] || '') : (originalItem["Courier Name"] || '');
      } else if (key === "Unit") {
        if (originalItem["Unit"] && originalItem["Unit"].trim() !== '') {
          merged[key] = originalItem["Unit"];
        } else if (originalItem["Courier Code"]) {
          const driver = findDriverByCode(originalItem["Courier Code"], drivers);
          merged[key] = driver ? (driver.unit || '') : '';
        } else {
          merged[key] = '';
        }
      } else if (key === "Distance Cost For Client") {
        merged[key] = groupedItem["distanceCostForClient"] || 0;
      } else if (key === "Distance Cost Above 30Km For Client") {
        merged[key] = groupedItem["distanceCostAbove30KmForClient"] || 0;
      } else if (key === "Weight Cost For Client") {
        merged[key] = groupedItem["weightCostForClient"] || 0;
      } else if (key === "Total Cost For Client") {
        merged[key] = groupedItem["totalCostForClient"] || 0;
      } else if (originalItem.hasOwnProperty(key)) {
        const value = originalItem[key];
        if (value instanceof Date) merged[key] = value.toLocaleDateString('id-ID');
        else if (typeof value === 'number') merged[key] = value;
        else if (value === null || value === undefined) merged[key] = '';
        else merged[key] = String(value);
      } else if (groupedItem.hasOwnProperty(key)) {
        const value = groupedItem[key];
        if (value instanceof Date) merged[key] = value.toLocaleDateString('id-ID');
        else if (typeof value === 'number') merged[key] = value;
        else if (value === null || value === undefined) merged[key] = '';
        else merged[key] = String(value);
      } else {
        merged[key] = '';
      }
    });

    return merged;
  });
};

const createWorksheetWithData = (data, sheetName) => {
  if (!data || data.length === 0) return XLSX.utils.json_to_sheet([]);

  const worksheet = XLSX.utils.json_to_sheet(data, {
    skipHeader: false,
    dateNF: 'dd/mm/yyyy'
  });

  const headers = Object.keys(data[0] || {});
  const columnWidths = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });

  worksheet['!cols'] = columnWidths;
  return worksheet;
};

export const exportDashboardToExcel = async (hubAnalysisData) => {
  if (!hubAnalysisData || hubAnalysisData.length === 0) {
    throw new Error('No dashboard data available for export');
  }

  const { performanceData, summaryData, insightsData } = formatDashboardData(hubAnalysisData);
  const dashboardData = { performanceData, summaryData, insightsData };
  const chartBlob = await callChartGenerationAPI(dashboardData);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  saveAs(chartBlob, `Dashboard_Analytics_${timestamp}.xlsx`);
  return true;
};

export const exportToExcel = async (rawData, filteredData, groupedData = [], chartSeries = [], chartOptions = {}, allDisplayData = null) => {
  const dataToExport = filteredData && filteredData.length > 0 ? filteredData : rawData;

  if (!dataToExport || dataToExport.length === 0) {
    throw new Error('No data available for export');
  }

  let groupedDataToUse = groupedData;
  if (!groupedDataToUse || groupedDataToUse.length === 0) {
    groupedDataToUse = await groupByCourierAndDate(rawData);
  }

  const mergedData = await mergeDataByOrderCode(dataToExport, groupedDataToUse);
  const profitGrafikData = await formatGroupedDataForExport(groupedDataToUse);
  const workbook = XLSX.utils.book_new();

  const sheet1 = createWorksheetWithData(mergedData, "Data Blibli");
  XLSX.utils.book_append_sheet(workbook, sheet1, "Data Blibli");

  const sheet2 = createWorksheetWithData(profitGrafikData, "Profit & Grafik");
  XLSX.utils.book_append_sheet(workbook, sheet2, "Profit & Grafik");

  if (allDisplayData && allDisplayData.length > 0) {
    const riderPerformanceData = formatRiderPerformanceData(allDisplayData);
    const sheet3 = createWorksheetWithData(riderPerformanceData, "Rider Performance");
    XLSX.utils.book_append_sheet(workbook, sheet3, "Rider Performance");
  }

  const excelBuffer = XLSX.write(workbook, { 
    bookType: "xlsx", 
    type: "array",
    cellStyles: true,
    compression: true
  });

  const dataBlob = new Blob([excelBuffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  saveAs(dataBlob, `Data_Blibli_${timestamp}.xlsx`);
  return true;
};