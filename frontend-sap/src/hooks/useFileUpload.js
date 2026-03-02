import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { apiCall } from '../services/api';

const ALLOWED_FILE_TYPES = [
'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'application/vnd.ms-excel'
];

export const useFileUpload = (onDataUpdate) => {
const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef(null);

const clearStatusAfterDelay = useCallback((delay = 10000) => {
setTimeout(() => {
setUploadStatus({ type: '', message: '' });
}, delay);
}, []);

const validateFile = useCallback((file) => {
if (!file) {
throw new Error('Tidak ada file yang dipilih');
}

if (!ALLOWED_FILE_TYPES.includes(file.type)) {
throw new Error('File harus berformat Excel (.xlsx atau .xls)');
}

return true;
}, []);

const transformExcelData = useCallback((jsonData) => {
if (jsonData.length === 0) {
throw new Error('File Excel kosong atau tidak berisi data');
}

return jsonData.map((row, index) => {
console.log(`Processing row ${index + 1}:`, row);

const hub = String(row['HUB'] || row['Hub'] || row['hub'] || '').trim();
const driverName = String(row['Nama Driver'] || row['Driver Name'] || row['driverName'] || row['driver_name'] || '').trim();

if (!hub || !driverName) {
throw new Error(`Row ${index + 1}: Hub dan Driver Name wajib diisi`);
}

return {
hub,
driverName,
festiveBonus: parseInt(row['Festive Bonus'] || row['festiveBonus'] || row['festive_bonus'] || 0) || 0,
afterRekon: parseInt(row['After Rekon'] || row['afterRekon'] || row['after_rekon'] || 0) || 0,
addPersonal: parseInt(row['Add Personal'] || row['addPersonal'] || row['add_personal'] || 0) || 0,
incentives: parseInt(row['Incentives'] || row['incentives'] || 0) || 0
};
});
}, []);

const uploadToApi = useCallback(async (transformedData) => {
console.log('Data yang akan dikirim ke API:', transformedData);

try {
const result = await apiCall('/bonus/append', {
method: 'post',
data: transformedData,
timeout: 60000,
headers: {
'Content-Type': 'application/json',
}
});
return result;
} catch (error) {
console.error('API upload failed:', error);
throw error;
}
}, []);

const handleFileUpload = useCallback(async (event) => {
const file = event.target.files[0];

try {
validateFile(file);

setIsUploading(true);
setUploadStatus({ type: 'info', message: 'Sedang memproses file Excel...' });

console.log('Membaca file Excel:', file.name);
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const worksheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[worksheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Data dari Excel:', jsonData);

const transformedData = transformExcelData(jsonData);
const result = await uploadToApi(transformedData);

setUploadStatus({ 
type: 'success', 
message: `Berhasil mengunggah ${result.count || transformedData.length} data bonus ke database` 
});

if (onDataUpdate) {
console.log('Refreshing data...');
setTimeout(() => {
onDataUpdate();
}, 1000);
}

} catch (error) {
console.error('Upload error:', error);

let errorMessage = 'Terjadi kesalahan tidak diketahui';

if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend berjalan';
} else if (error.message.includes('404')) {
errorMessage = 'Endpoint API tidak ditemukan. Periksa konfigurasi routes';
} else if (error.message.includes('500')) {
errorMessage = 'Server error. Periksa log backend';
} else {
errorMessage = error.message;
}

setUploadStatus({ 
type: 'error', 
message: `Upload gagal: ${errorMessage}` 
});
} finally {
setIsUploading(false);
if (fileInputRef.current) {
fileInputRef.current.value = '';
}

clearStatusAfterDelay();
}
}, [validateFile, transformExcelData, uploadToApi, onDataUpdate, clearStatusAfterDelay]);

const testApiConnection = useCallback(async () => {
try {
console.log('Testing API connection...');
const data = await apiCall('/bonus/data');
console.log('Test response data:', data);
const dataArray = Array.isArray(data) ? data : data?.data || [];
setUploadStatus({ 
type: 'success', 
message: `API connection OK. Found ${dataArray.length} records in database` 
});
} catch (error) {
console.error('API test failed:', error);
setUploadStatus({ 
type: 'error', 
message: `API connection failed: ${error.message}` 
});
}

clearStatusAfterDelay(5000);
}, [clearStatusAfterDelay]);

const triggerFileInput = useCallback(() => {
if (fileInputRef.current) {
fileInputRef.current.click();
}
}, []);

return {
uploadStatus,
isUploading,
fileInputRef,
handleFileUpload,
testApiConnection,
triggerFileInput
};
};