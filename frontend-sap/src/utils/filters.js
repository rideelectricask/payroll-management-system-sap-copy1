import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

export const parseDeliveryDate = (dateString) => {
  if (!dateString || dateString === '-') return null;
  
  const ddMMyyyyMatch = dateString.match(/(\d{1,2})\/(\d{2})\/(\d{4})/);
  if (ddMMyyyyMatch) {
    const [_, day, month, year] = ddMMyyyyMatch;
    const parsed = dayjs(`${year}-${month}-${day}`, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
  }
  
  const yyyyMMddMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (yyyyMMddMatch) {
    const parsed = dayjs(dateString, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
  }
  
  return null;
};

export const filterByPeriod = (data, periodType, selectedDate, selectedWeek, selectedMonth, selectedYear) => {
  if (!data || data.length === 0) return [];

  console.log('🔍 Filtering by period:', periodType, { selectedDate, selectedWeek, selectedMonth, selectedYear });

  switch (periodType) {
    case 'daily':
      return filterByDaily(data, selectedDate);
    case 'weekly':
      return filterByWeekly(data, selectedWeek, selectedMonth, selectedYear);
    case 'monthly':
      return filterByMonthly(data, selectedMonth, selectedYear);
    case 'yearly':
      return filterByYearly(data, selectedYear);
    default:
      return data;
  }
};

const filterByDaily = (data, selectedDate) => {
  if (!selectedDate) return data;
  
  const targetDate = dayjs(selectedDate);
  const filtered = data.filter(item => {
    const itemDate = parseDeliveryDate(item.delivery_date);
    return itemDate && itemDate.isSame(targetDate, 'day');
  });
  
  console.log(`📅 Daily filter: ${filtered.length} of ${data.length} records match`);
  return filtered;
};

const filterByWeekly = (data, selectedWeek, selectedMonth, selectedYear) => {
  if (!selectedWeek) return data;
  
  const filtered = data.filter(item => {
    const itemWeek = item.weekly;
    if (!itemWeek || itemWeek === '-') return false;
    
    const weekMatch = itemWeek.toLowerCase().trim() === selectedWeek.toLowerCase().trim();
    
    if (selectedMonth && selectedYear) {
      const itemDate = parseDeliveryDate(item.delivery_date);
      if (!itemDate) return false;
      
      const monthMatch = itemDate.month() + 1 === parseInt(selectedMonth);
      const yearMatch = itemDate.year() === parseInt(selectedYear);
      
      return weekMatch && monthMatch && yearMatch;
    }
    
    return weekMatch;
  });
  
  console.log(`📅 Weekly filter (${selectedWeek}): ${filtered.length} of ${data.length} records match`);
  return filtered;
};

const filterByMonthly = (data, selectedMonth, selectedYear) => {
  if (!selectedMonth || !selectedYear) return data;
  
  const filtered = data.filter(item => {
    const itemDate = parseDeliveryDate(item.delivery_date);
    if (!itemDate) return false;
    
    const monthMatch = itemDate.month() + 1 === parseInt(selectedMonth);
    const yearMatch = itemDate.year() === parseInt(selectedYear);
    
    return monthMatch && yearMatch;
  });
  
  console.log(`📅 Monthly filter (${selectedMonth}/${selectedYear}): ${filtered.length} of ${data.length} records match`);
  return filtered;
};

const filterByYearly = (data, selectedYear) => {
  if (!selectedYear) return data;
  
  const filtered = data.filter(item => {
    const itemDate = parseDeliveryDate(item.delivery_date);
    if (!itemDate) return false;
    
    return itemDate.year() === parseInt(selectedYear);
  });
  
  console.log(`📅 Yearly filter (${selectedYear}): ${filtered.length} of ${data.length} records match`);
  return filtered;
};

export const filterByDateRange = (data, startDate, endDate) => {
  if (!data || data.length === 0) return [];
  if (!startDate || !endDate) return data;
  
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');
  
  const filtered = data.filter(item => {
    const itemDate = parseDeliveryDate(item.delivery_date);
    if (!itemDate) return false;
    return itemDate.isBetween(start, end, 'day', '[]');
  });
  
  console.log(`📅 Date range filter: ${filtered.length} of ${data.length} records match`);
  return filtered;
};

export const getAvailableWeeks = (data, month = null, year = null) => {
  if (!data || data.length === 0) return [];
  
  let filteredData = data;
  if (month && year) {
    filteredData = filterByMonthly(data, month, year);
  }
  
  const weeks = [...new Set(filteredData.map(item => item.weekly).filter(week => week && week !== '-'))];
  return weeks.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
};

export const getAvailableMonths = (data) => {
  if (!data || data.length === 0) return [];
  
  const monthsSet = new Set();
  data.forEach(item => {
    const parsedDate = parseDeliveryDate(item.delivery_date);
    if (parsedDate) {
      monthsSet.add(`${parsedDate.year()}-${String(parsedDate.month() + 1).padStart(2, '0')}`);
    }
  });
  
  return Array.from(monthsSet).sort().map(monthYear => {
    const [year, month] = monthYear.split('-');
    return {
      value: month,
      label: dayjs(`${year}-${month}-01`).format('MMMM YYYY'),
      year
    };
  });
};

export const getAvailableYears = (data) => {
  if (!data || data.length === 0) return [];
  
  const years = new Set();
  data.forEach(item => {
    const parsedDate = parseDeliveryDate(item.delivery_date);
    if (parsedDate) {
      years.add(parsedDate.year());
    }
  });
  
  return Array.from(years).sort((a, b) => b - a);
};

export const calculateMetrics = (filteredData) => {
  if (!filteredData || filteredData.length === 0) {
    return {
      totalDeliveries: 0,
      totalCost: 0,
      avgCost: 0,
      onTimeDeliveries: 0,
      onTimeRate: 0,
      avgDistance: 0,
      totalDistance: 0,
      costPerKm: 0
    };
  }
  
  const totalDeliveries = filteredData.length;
  const totalCost = filteredData.reduce((sum, item) => {
    const cost = parseFloat(item.cost) || 0;
    return sum + cost;
  }, 0);
  const avgCost = totalCost / totalDeliveries;
  
  const onTimeDeliveries = filteredData.filter(item => {
    const sla = (item.sla || '').toLowerCase();
    return sla.includes('ontime') || sla === 'ontime';
  }).length;
  const onTimeRate = (onTimeDeliveries / totalDeliveries) * 100;
  
  const totalDistance = filteredData.reduce((sum, item) => {
    const distance = parseFloat(item.distance_km) || 0;
    return sum + distance;
  }, 0);
  const avgDistance = totalDistance / totalDeliveries;
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
  
  return {
    totalDeliveries,
    totalCost,
    avgCost,
    onTimeDeliveries,
    onTimeRate,
    avgDistance,
    totalDistance,
    costPerKm
  };
};

export const groupDataByPeriod = (data, periodType) => {
  if (!data || data.length === 0) return [];
  
  const grouped = {};
  
  data.forEach(item => {
    const itemDate = parseDeliveryDate(item.delivery_date);
    if (!itemDate) return;
    
    let key;
    switch (periodType) {
      case 'daily':
        key = itemDate.format('DD/MM/YYYY');
        break;
      case 'weekly':
        key = item.weekly || `Week ${itemDate.isoWeek()}`;
        break;
      case 'monthly':
        key = itemDate.format('MMMM YYYY');
        break;
      case 'yearly':
        key = itemDate.format('YYYY');
        break;
      default:
        key = itemDate.format('MMMM YYYY');
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        deliveries: 0,
        cost: 0,
        distance: 0,
        onTimeCount: 0
      };
    }
    
    grouped[key].deliveries += 1;
    grouped[key].cost += parseFloat(item.cost) || 0;
    grouped[key].distance += parseFloat(item.distance_km) || 0;
    
    const sla = (item.sla || '').toLowerCase();
    if (sla.includes('ontime') || sla === 'ontime') {
      grouped[key].onTimeCount += 1;
    }
  });
  
  return Object.values(grouped).map(group => ({
    ...group,
    onTimeRate: group.deliveries > 0 ? (group.onTimeCount / group.deliveries) * 100 : 0,
    avgCost: group.deliveries > 0 ? group.cost / group.deliveries : 0,
    avgDistance: group.deliveries > 0 ? group.distance / group.deliveries : 0
  }));
};