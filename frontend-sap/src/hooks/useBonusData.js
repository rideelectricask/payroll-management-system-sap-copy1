// hooks/useBonusData.js
import { useState, useEffect } from 'react';
import { fetchBonusData } from '../services/api';

export const useBonusData = () => {
const [bonusData, setBonusData] = useState([]);
const [bonusLoading, setBonusLoading] = useState(false);
const [bonusError, setBonusError] = useState(null);

// Fetch bonus data on mount
useEffect(() => {
const loadBonusData = async () => {
setBonusLoading(true);
setBonusError(null);

try {
console.log("🔄 Mengambil data bonus dari API...");
const result = await fetchBonusData();

// Pastikan data adalah array
const dataArray = Array.isArray(result) ? result : result.data || [];

console.log("✅ Data bonus berhasil diambil:", dataArray.length, "records");
setBonusData(dataArray);
} catch (err) {
console.error('❌ Failed to fetch bonus data:', err.message);
setBonusError(`Failed to load bonus data: ${err.message}`);
setBonusData([]);
} finally {
setBonusLoading(false);
}
};

loadBonusData();
}, []);

return {
bonusData,
bonusLoading,
bonusError
};
};