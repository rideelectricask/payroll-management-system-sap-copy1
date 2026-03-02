const PERFORMANCE_THRESHOLDS = Object.freeze({
  PERFECT: 99.5,
  EXCELLENT: 98,
  GOOD: 97
});

const CATEGORY_MAPPINGS = Object.freeze({
  Satellite: 'Hub Satelit',
  O2O: 'O2O',
  default: 'Hub Utama'
});

const getPerformanceLevel = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.PERFECT) return 'Perfect';
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (percentage >= PERFORMANCE_THRESHOLDS.GOOD) return 'Good';
  return 'Needs Improvement';
};

const getCategory = (hubName) => {
  if (hubName.includes('Satellite')) return CATEGORY_MAPPINGS.Satellite;
  if (hubName.includes('O2O')) return CATEGORY_MAPPINGS.O2O;
  return CATEGORY_MAPPINGS.default;
};

export const processHubData = (hubAnalysisData) => {
  if (!hubAnalysisData?.length) return null;

  const length = hubAnalysisData.length;
  const processedData = new Array(length);

  for (let i = 0; i < length; i++) {
    const item = hubAnalysisData[i];
    const hubName = item.hubName || '';
    const shortName = hubName.split(' - ')[0].replace('Satellite HUB ', 'Sat. ');
    const onTimePercentage = item.onTimePercentage || 0;
    const totalDeliveries = item.totalDeliveries || 0;
    const lateDeliveries = item.lateDeliveries || 0;

    processedData[i] = {
      lokasi: hubName,
      shortName,
      totalPengiriman: totalDeliveries,
      terlambat: lateDeliveries,
      persentaseTepat: onTimePercentage,
      selisihPersentase: item.latePercentage || 0,
      kategori: item.kategori || getCategory(hubName),
      tingkatKinerja: item.tingkatKinerja || getPerformanceLevel(onTimePercentage)
    };
  }

  return processedData;
};

export const calculateSummaryMetrics = (data) => {
  let totalPengiriman = 0;
  let totalTerlambat = 0;

  const length = data.length;
  for (let i = 0; i < length; i++) {
    totalPengiriman += data[i].totalPengiriman;
    totalTerlambat += data[i].terlambat;
  }

  const tepatWaktu = totalPengiriman - totalTerlambat;
  const avgPerformance = totalPengiriman > 0 ? (tepatWaktu / totalPengiriman * 100) : 0;
  const keterlambatanRate = totalPengiriman > 0 ? (totalTerlambat / totalPengiriman * 100) : 0;

  return {
    totalPengiriman,
    totalTerlambat,
    avgPerformance,
    tepatWaktu,
    keterlambatanRate
  };
};

export const generateChartData = (data) => {
  const length = data.length;
  const performanceData = new Array(length);
  const volumeData = new Array(length);
  const trendData = new Array(length);

  for (let i = 0; i < length; i++) {
    const item = data[i];

    performanceData[i] = {
      nama: item.shortName,
      tepatWaktu: item.persentaseTepat,
      terlambat: item.selisihPersentase,
      volume: item.totalPengiriman,
      kategori: item.kategori
    };

    volumeData[i] = {
      name: item.shortName,
      value: item.totalPengiriman,
      terlambat: item.terlambat,
      kategori: item.kategori
    };

    trendData[i] = {
      lokasi: item.shortName,
      performance: item.persentaseTepat,
      volume: Math.floor(item.totalPengiriman / 50),
      delay: item.terlambat
    };
  }

  performanceData.sort((a, b) => b.tepatWaktu - a.tepatWaktu);
  volumeData.sort((a, b) => b.value - a.value);

  return { performanceData, volumeData, trendData };
};

export const getTopPerformers = (data, count = 3) => {
  if (!data || data.length === 0) return [];
  if (data.length <= count) {
    return [...data].sort((a, b) => b.persentaseTepat - a.persentaseTepat);
  }

  const sorted = [...data].sort((a, b) => b.persentaseTepat - a.persentaseTepat);
  return sorted.slice(0, count);
};

export const getPriorityAreas = (data, count = 3) => {
  if (!data || data.length === 0) return [];
  if (data.length <= count) {
    return [...data].sort((a, b) => b.selisihPersentase - a.selisihPersentase);
  }

  const sorted = [...data].sort((a, b) => b.selisihPersentase - a.selisihPersentase);
  return sorted.slice(0, count);
};

export const getVolumeLeaders = (data, count = 2) => {
  if (!data || data.length === 0) return [];
  if (data.length <= count) {
    const sorted = [...data].sort((a, b) => b.totalPengiriman - a.totalPengiriman);
    return sorted.map(item => item.shortName);
  }

  const sorted = [...data].sort((a, b) => b.totalPengiriman - a.totalPengiriman);
  return sorted.slice(0, count).map(item => item.shortName);
};