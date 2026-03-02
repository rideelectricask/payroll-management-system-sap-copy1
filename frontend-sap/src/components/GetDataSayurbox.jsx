import React, { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Database, Upload, RefreshCw, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { batchUploadToServer, batchUploadEDataToServer } from '../services/apis';
import { downloadSayurboxTemplate, downloadEDataTemplate } from '../services/templateService';

const GetDataSayurbox = ({ isEDataMode = false, defaultUrl = '' }) => {
const [spreadsheetUrl, setSpreadsheetUrl] = useState(
defaultUrl || 
(isEDataMode 
? 'https://docs.google.com/spreadsheets/d/1ZxrOseShJ4QfkS38WkiihF4Up_JxHxmvnCO-WcCRdP4/edit?gid=0#gid=0'
: 'https://docs.google.com/spreadsheets/d/1xkEL08-_vD4vspYRRVR94w70Cm8J486J9VJv_fn9drA/edit?gid=123610688#gid=123610688')
);
const [isLoading, setIsLoading] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [isFileUploading, setIsFileUploading] = useState(false);
const [message, setMessage] = useState('');
const [messageType, setMessageType] = useState('');
const [extractedData, setExtractedData] = useState(null);
const [uploadProgress, setUploadProgress] = useState(null);
const [fileUploadProgress, setFileUploadProgress] = useState(null);

const validateGoogleSheetsUrl = (url) => {
const googleSheetsPattern = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
return googleSheetsPattern.test(url);
};

const extractSpreadsheetId = (url) => {
const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
return match ? match[1] : null;
};

const extractGidFromUrl = (url) => {
const gidMatch = url.match(/[#&]gid=([0-9]+)/);
return gidMatch ? gidMatch[1] : '0';
};

const convertToPublicUrls = (url) => {
const spreadsheetId = extractSpreadsheetId(url);
const gid = extractGidFromUrl(url);

if (!spreadsheetId) return null;

return {
csvUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
publicUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
embedUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml?gid=${gid}&single=true&output=csv`
};
};

const fetchWithCorsProxy = async (url) => {
const corsProxies = [
{
url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
transform: (response) => response.text()
},
{
url: `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`,
transform: (response) => response.text()
},
{
url: `https://proxy.cors.sh/${url}`,
transform: (response) => response.text(),
headers: { 'x-cors-api-key': 'temp_key' }
}
];

for (let i = 0; i < corsProxies.length; i++) {
try {
const proxy = corsProxies[i];
const headers = {
'Accept': 'text/csv,application/csv,text/plain,*/*',
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
...proxy.headers
};

const response = await fetch(proxy.url, {
method: 'GET',
headers,
mode: 'cors'
});

if (!response.ok) {
throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const csvData = await proxy.transform(response);

if (csvData && csvData.trim() && !csvData.includes('<!DOCTYPE html>')) {
return csvData;
}

throw new Error('Invalid CSV response');
} catch (error) {
if (i === corsProxies.length - 1) {
throw new Error('Semua CORS proxy gagal. Coba metode alternatif.');
}
}
}
};

const fetchDirectAccess = async (urls) => {
const methods = [
{ url: urls.publicUrl, name: 'Google Viz API' },
{ url: urls.csvUrl, name: 'Direct Export' },
{ url: urls.embedUrl, name: 'Public HTML Export' }
];

for (let method of methods) {
try {
const response = await fetch(method.url, {
method: 'GET',
headers: {
'Accept': 'text/csv,application/csv,text/plain',
'Cache-Control': 'no-cache'
},
mode: 'cors'
});

if (!response.ok) {
continue;
}

const csvData = await response.text();
if (csvData && csvData.trim() && !csvData.includes('<!DOCTYPE html>') && !csvData.includes('accounts.google.com')) {
return csvData;
}
} catch (error) {
continue;
}
}

throw new Error('Direct access failed');
};

const normalizeNumericValue = (value) => {
if (!value || value === '') return '';
const stringValue = value.toString().trim();
if (stringValue === '') return '';
return stringValue.replace(',', '.');
};

const parseCSVData = (csvText) => {
const result = [];
let currentRow = [];
let currentField = '';
let inQuotes = false;
let i = 0;

const text = csvText.trim();

while (i < text.length) {
const char = text[i];
const nextChar = text[i + 1];

if (char === '"') {
if (!inQuotes) {
inQuotes = true;
} else if (nextChar === '"') {
currentField += '"';
i++;
} else {
inQuotes = false;
}
} else if (char === ',' && !inQuotes) {
currentRow.push(currentField.trim());
currentField = '';
} else if ((char === '\n' || char === '\r') && !inQuotes) {
if (char === '\r' && nextChar === '\n') {
i++;
}

currentRow.push(currentField.trim());

if (currentRow.some(cell => cell !== '')) {
result.push([...currentRow]);
}
currentRow = [];
currentField = '';
} else {
if (inQuotes || (char !== '\r' && char !== '\n')) {
currentField += char;
}
}
i++;
}

if (currentField || currentRow.length > 0) {
currentRow.push(currentField.trim());
if (currentRow.some(cell => cell !== '')) {
result.push(currentRow);
}
}

const maxColumns = Math.max(...result.map(row => row.length));
return result.map(row => {
while (row.length < maxColumns) {
row.push('');
}
return row;
});
};

const parseExcelFile = async (file) => {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = (e) => {
try {
const data = e.target.result;
const workbook = XLSX.read(data, { type: 'binary' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
resolve(jsonData);
} catch (error) {
reject(new Error(`Gagal membaca file Excel: ${error.message}`));
}
};
reader.onerror = () => reject(new Error('Gagal membaca file'));
reader.readAsBinaryString(file);
});
};

const fetchSpreadsheetData = useCallback(async () => {
if (!spreadsheetUrl.trim()) {
setMessage('Silakan masukkan URL Google Spreadsheet');
setMessageType('error');
return;
}

if (!validateGoogleSheetsUrl(spreadsheetUrl)) {
setMessage('URL tidak valid. Pastikan menggunakan URL Google Spreadsheet yang benar');
setMessageType('error');
return;
}

setIsLoading(true);
setMessage('Mengambil data dari spreadsheet...');
setMessageType('info');

const originalConsoleError = console.error;
console.error = () => {};

try {
const urls = convertToPublicUrls(spreadsheetUrl);
if (!urls) {
throw new Error('Gagal mengekstrak ID spreadsheet dari URL');
}

let csvData;

try {
csvData = await fetchDirectAccess(urls);
} catch (directError) {
try {
csvData = await fetchWithCorsProxy(urls.publicUrl);
} catch (proxyError) {
throw new Error('Tidak dapat mengakses spreadsheet. Pastikan spreadsheet sudah dipublikasikan atau dapat diakses publik.');
}
}

if (!csvData || !csvData.trim()) {
throw new Error('Data spreadsheet kosong atau tidak dapat diakses');
}

const parsedData = parseCSVData(csvData);

if (parsedData.length === 0) {
throw new Error('Tidak ada data valid yang ditemukan di spreadsheet');
}

setExtractedData(parsedData);
setMessage(`Berhasil mengambil ${parsedData.length - 1} baris data dari spreadsheet`);
setMessageType('success');

} catch (error) {
let errorMessage = error.message;

if (errorMessage.includes('CORS') || errorMessage.includes('proxy')) {
errorMessage = 'Gagal mengambil data karena pembatasan CORS. Pastikan spreadsheet sudah public dan coba lagi.';
} else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
errorMessage = 'Akses ditolak. Pastikan spreadsheet dapat diakses public dengan setting "Anyone with the link can view".';
}

setMessage(`Gagal mengambil data: ${errorMessage}`);
setMessageType('error');
setExtractedData(null);
} finally {
console.error = originalConsoleError;
setIsLoading(false);
}
}, [spreadsheetUrl]);

const handleFileUpload = async (e) => {
const file = e.target.files[0];
e.target.value = null;

if (!file) {
setMessage('Tidak ada file yang dipilih');
setMessageType('error');
return;
}

if (!file.name.match(/\.(xlsx|xls)$/i)) {
setMessage('Format file tidak didukung. Silakan pilih file Excel (.xlsx atau .xls)');
setMessageType('error');
return;
}

setIsFileUploading(true);
setMessage('Membaca file Excel...');
setMessageType('info');
setFileUploadProgress({ current: 0, total: 1, percentage: 0 });

try {
const parsedData = await parseExcelFile(file);

if (parsedData.length === 0) {
throw new Error('File Excel kosong atau tidak dapat dibaca');
}

setExtractedData(parsedData);
setFileUploadProgress({ current: 1, total: 1, percentage: 100 });
setMessage(`Berhasil membaca ${parsedData.length - 1} baris data dari file Excel`);
setMessageType('success');

setTimeout(() => {
setFileUploadProgress(null);
}, 2000);

} catch (error) {
setMessage(`Gagal membaca file: ${error.message}`);
setMessageType('error');
setExtractedData(null);
setFileUploadProgress(null);
} finally {
setIsFileUploading(false);
}
};

const normalizeHeaderName = (header) => {
return header.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
};

const createHeaderMapping = (headers) => {
const normalizedHeaders = headers.map(normalizeHeaderName);
const headerMap = {};

if (isEDataMode) {
const fieldMappings = {
driver_name: ['driver_name'],
district: ['district'],
customer_name: ['customer_name'],
delivery_date: ['delivery_date'],
address: ['address'],
address_note: ['address_note'],
order_no: ['order_no'],
packaging_option: ['packaging_option'],
distance_in_km: ['distance_in_km'],
hubs: ['hubs'],
total_price: ['total_price'],
external_note: ['external_note'],
internal_note: ['internal_note'],
customer_note: ['customer_note'],
time_slot: ['time_slot'],
no_plastic: ['no_plastic'],
payment_method: ['payment_method'],
latitude: ['latitude'],
longitude: ['longitude'],
shipping_number: ['shipping_number_box_', 'shipping_number']
};

Object.keys(fieldMappings).forEach(field => {
const possibleNames = fieldMappings[field];
for (let possibleName of possibleNames) {
const index = normalizedHeaders.indexOf(possibleName);
if (index !== -1) {
headerMap[field] = index;
break;
}
}
});
} else {
const fieldMappings = {
order_no: ['merchant_order_id', 'order_no'],
time_slot: ['slot_time', 'time_slot'],
channel: ['business', 'channel'],
delivery_date: ['dropoff_done_at', 'delivery_date'],
driver_name: ['driver_code', 'driver_name'],
hub_name: ['business_hub', 'hub_name'],
shipped_at: ['pickup_done_at_1st_attempt', 'shipped_at'],
delivered_at: ['dropoff_done_at', 'delivered_at'],
pu_order: ['merchant_order_id', 'pu_order'],
time_slot_start: ['delivery_start', 'time_slot_start'],
late_pickup_minute: ['late_pickup_minute'],
pu_after_ts_minute: ['pu_after_ts_minute'],
time_slot_end: ['slot_time', 'time_slot_end'],
late_delivery_minute: ['late_delivery_minute'],
is_ontime: ['is_ontime'],
distance_in_km: ['distance_radial', 'distance_in_km'],
total_weight_perorder: ['weight', 'total_weight_perorder'],
payment_method: ['payment_type', 'payment_method'],
monthly: ['monthly']
};

Object.keys(fieldMappings).forEach(field => {
const possibleNames = fieldMappings[field];
for (let possibleName of possibleNames) {
const index = normalizedHeaders.indexOf(possibleName);
if (index !== -1) {
headerMap[field] = index;
break;
}
}
});
}

return headerMap;
};

const validateDataStructure = (data) => {
if (!data || data.length < 2) {
throw new Error('Data tidak memiliki header atau baris data');
}

const headers = data[0];
const headerMap = createHeaderMapping(headers);

if (isEDataMode) {
const requiredFields = ['order_no', 'distance_in_km'];
const missingFields = requiredFields.filter(field => headerMap[field] === undefined);

if (missingFields.length > 0) {
const availableHeaders = headers.join(', ');
throw new Error(`Header yang diperlukan tidak ditemukan: ${missingFields.join(', ')}. Header tersedia: ${availableHeaders}`);
}
} else {
const requiredFields = ['order_no', 'driver_name', 'hub_name'];
const missingFields = requiredFields.filter(field => headerMap[field] === undefined);
if (missingFields.length > 0) {
const availableHeaders = headers.join(', ');
throw new Error(`Header yang diperlukan tidak ditemukan: ${missingFields.join(', ')}. Header tersedia: ${availableHeaders}`);
}
}

return headerMap;
};

const validateDuplicateOrderNo = (data) => {
if (!data || data.length < 2) {
return { isValid: true, duplicates: [] };
}

const headerMap = validateDataStructure(data);
const orderNoIndex = headerMap.order_no;

if (orderNoIndex === undefined) {
return { isValid: true, duplicates: [] };
}

const orderNos = new Map();
const duplicates = [];

for (let i = 1; i < data.length; i++) {
const orderNo = data[i][orderNoIndex]?.toString().trim();

if (orderNo) {
if (orderNos.has(orderNo)) {
const existingRow = orderNos.get(orderNo);
if (!duplicates.some(d => d.orderNo === orderNo)) {
duplicates.push({
orderNo: orderNo,
firstRow: existingRow,
duplicateRows: [i + 1]
});
} else {
const existing = duplicates.find(d => d.orderNo === orderNo);
existing.duplicateRows.push(i + 1);
}
} else {
orderNos.set(orderNo, i + 1);
}
}
}

return { 
isValid: duplicates.length === 0, 
duplicates: duplicates 
};
};

const transformDataForUpload = (data) => {
const dataRows = data.slice(1);
const headerMap = validateDataStructure(data);

if (isEDataMode) {
return dataRows
.filter(row => row.some(cell => cell && cell.toString().trim()))
.map(row => {
const dataObj = {};

Object.keys(headerMap).forEach(field => {
const index = headerMap[field];
const value = index !== undefined ? (row[index] || '') : '';

if (field === 'distance_in_km' || field === 'total_price' || 
field === 'latitude' || field === 'longitude') {
const normalizedValue = normalizeNumericValue(value);
const numValue = parseFloat(normalizedValue) || 0;
dataObj[field] = isNaN(numValue) ? 0 : numValue;
} else {
dataObj[field] = value.toString().trim();
}
});

const requiredDefaults = {
driver_name: dataObj.driver_name || '',
district: dataObj.district || '',
customer_name: dataObj.customer_name || '',
delivery_date: dataObj.delivery_date || '',
address: dataObj.address || '',
address_note: dataObj.address_note || '',
order_no: dataObj.order_no || '',
packaging_option: dataObj.packaging_option || '',
distance_in_km: dataObj.distance_in_km || 0,
hubs: dataObj.hubs || '',
total_price: dataObj.total_price || 0,
external_note: dataObj.external_note || '',
internal_note: dataObj.internal_note || '',
customer_note: dataObj.customer_note || '',
time_slot: dataObj.time_slot || '',
no_plastic: dataObj.no_plastic || '',
payment_method: dataObj.payment_method || '',
latitude: dataObj.latitude || 0,
longitude: dataObj.longitude || 0,
shipping_number: dataObj.shipping_number || ''
};

return requiredDefaults;
})
.filter(obj => obj.order_no && (obj.distance_in_km || obj.distance_in_km === 0));
} else {
const requiredHeaders = [
'order_no', 'time_slot', 'channel', 'delivery_date', 'driver_name',
'hub_name', 'shipped_at', 'delivered_at', 'pu_order', 'time_slot_start',
'late_pickup_minute', 'pu_after_ts_minute', 'time_slot_end', 'late_delivery_minute',
'is_ontime', 'distance_in_km', 'total_weight_perorder', 'payment_method', 'monthly'
];

return dataRows
.filter(row => row.some(cell => cell && cell.toString().trim()))
.map(row => {
const dataObj = {};
requiredHeaders.forEach(header => {
const value = row[headerMap[header]] || '';

if (header === 'late_pickup_minute' || header === 'pu_after_ts_minute' || 
header === 'late_delivery_minute' || header === 'distance_in_km' || 
header === 'total_weight_perorder') {
const normalizedValue = normalizeNumericValue(value);
dataObj[header] = parseFloat(normalizedValue) || 0;
} else if (header === 'is_ontime') {
dataObj[header] = value.toLowerCase() === 'true' || value === '1';
} else {
dataObj[header] = value.toString().trim();
}
});
return dataObj;
})
.filter(obj => obj.order_no && obj.driver_name && obj.hub_name);
}
};

const uploadToDatabase = async () => {
if (!extractedData || extractedData.length === 0) {
setMessage('Tidak ada data untuk diupload');
setMessageType('error');
return;
}

const duplicateCheck = validateDuplicateOrderNo(extractedData);
if (!duplicateCheck.isValid) {
const totalDuplicateRows = duplicateCheck.duplicates.reduce((sum, dup) => sum + dup.duplicateRows.length, 0);
const uniqueOrderNos = duplicateCheck.duplicates.length;

const duplicateDetails = duplicateCheck.duplicates.slice(0, 10).map(dup => {
const allRows = [dup.firstRow, ...dup.duplicateRows];
return `Order No: ${dup.orderNo} (baris ${allRows.join(', ')})`;
}).join('\n');

const remainingCount = duplicateCheck.duplicates.length - 10;
const additionalInfo = remainingCount > 0 ? `\n\n...dan ${remainingCount} duplikasi lainnya` : '';

setMessage(`Ditemukan ${totalDuplicateRows} data duplikat pada ${uniqueOrderNos} Order No berbeda. Silakan perbaiki duplikasi sebelum upload.\n\nDuplikasi yang ditemukan:\n${duplicateDetails}${additionalInfo}`);
setMessageType('error');
return;
}

setIsUploading(true);
setUploadProgress({ current: 0, total: 1, percentage: 0 });

try {
const transformedData = transformDataForUpload(extractedData);

if (transformedData.length === 0) {
throw new Error('Tidak ada data valid untuk diupload setelah validasi');
}

const uploadFunction = isEDataMode ? batchUploadEDataToServer : batchUploadToServer;
const result = await uploadFunction(transformedData, (progress) => {
setUploadProgress(progress);
});

if (!result.success) {
throw new Error(result.message || 'Upload gagal dengan alasan tidak diketahui');
}

setUploadProgress({ current: result.totalBatches || 1, total: result.totalBatches || 1, percentage: 100 });
setMessage(`Upload berhasil! Total ${result.totalRecords} data telah disimpan ke database ${isEDataMode ? 'EData' : 'Sayurbox'}`);
setMessageType('success');

setTimeout(() => {
setUploadProgress(null);
}, 3000);

} catch (error) {
setUploadProgress(null);

let errorMessage = error.message;
if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
errorMessage = 'Upload gagal karena masalah koneksi. Periksa koneksi internet dan coba lagi.';
} else if (errorMessage.includes('500')) {
errorMessage = 'Upload gagal karena error server. Silakan coba lagi dalam beberapa saat.';
}

setMessage(`Upload gagal: ${errorMessage}`);
setMessageType('error');
} finally {
setIsUploading(false);
}
};

const downloadAsExcel = () => {
if (!extractedData || extractedData.length === 0) {
setMessage('Tidak ada data untuk diunduh');
setMessageType('error');
return;
}

try {
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(extractedData);

const colWidths = extractedData[0]?.map((_, colIndex) => {
const maxLength = Math.max(
...extractedData.map(row => (row[colIndex] || '').toString().length)
);
return { wch: Math.min(Math.max(maxLength, 10), 50) };
});

worksheet['!cols'] = colWidths;
const sheetName = isEDataMode ? 'EData' : 'Sayurbox Data';
XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const filename = isEDataMode 
? `edata_${timestamp}.xlsx` 
: `sayurbox_data_${timestamp}.xlsx`;

XLSX.writeFile(workbook, filename);

setMessage(`File Excel berhasil diunduh: ${filename}`);
setMessageType('success');

} catch (error) {
setMessage(`Gagal mengunduh file Excel: ${error.message}`);
setMessageType('error');
}
};

const handleDownloadTemplate = () => {
try {
const downloadFunction = isEDataMode ? downloadEDataTemplate : downloadSayurboxTemplate;
const result = downloadFunction();
setMessage(result.message);
setMessageType('success');
} catch (error) {
setMessage(`Gagal mengunduh template: ${error.message}`);
setMessageType('error');
}
};

const resetForm = () => {
setExtractedData(null);
setMessage('');
setMessageType('');
setUploadProgress(null);
setFileUploadProgress(null);
};

const shouldShowMessage = message && (!uploadProgress || messageType === 'success' || messageType === 'error') && (!fileUploadProgress || messageType === 'success' || messageType === 'error');
const dataTypeName = isEDataMode ? 'EData' : 'Sayurbox';
const requiredHeadersList = isEDataMode 
? 'driver_name, district, customer_name, delivery_date, address, address_note, order_no, packaging_option, distance_in_km, hubs, total_price, external_note, internal_note, customer_note, time_slot, no_plastic, payment_method, latitude, longitude, shipping_number (Box #)'
: 'order_no, time_slot, channel, delivery_date, driver_name, hub_name, shipped_at, delivered_at, pu_order, time_slot_start, late_pickup_minute, pu_after_ts_minute, time_slot_end, late_delivery_minute, is_ontime, distance_in_km, total_weight_perorder, payment_method, monthly';

return (
<div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
<div className="mb-6">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<FileSpreadsheet className="text-green-600" size={28} />
<h2 className="text-2xl font-bold text-gray-800">
{dataTypeName} Data Extractor
</h2>
</div>
<button
onClick={handleDownloadTemplate}
disabled={isLoading || isUploading || isFileUploading}
className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
>
<FileDown size={20} />
Download Template
</button>
</div>
<p className="text-gray-600 mt-2">
Ambil data dari Google Spreadsheet atau upload file Excel dan upload ke database
</p>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
<div className="space-y-4">
<h3 className="text-lg font-semibold text-gray-800">📄 Upload File Excel (Preview)</h3>
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
<input
type="file"
accept=".xlsx,.xls"
onChange={handleFileUpload}
className="hidden"
id="file-upload"
disabled={isLoading || isUploading || isFileUploading}
/>
<label
htmlFor="file-upload"
className={`cursor-pointer flex flex-col items-center gap-3 ${
isLoading || isUploading || isFileUploading ? 'opacity-50 cursor-not-allowed' : ''
}`}
>
<Upload className="text-blue-500" size={48} />
<div>
<p className="text-lg font-medium text-gray-700">
{isFileUploading ? 'Memproses File...' : 'Pilih File Excel untuk Preview'}
</p>
<p className="text-sm text-gray-500 mt-1">
Klik untuk memilih file .xlsx atau .xls
</p>
</div>
</label>
</div>

{fileUploadProgress && (
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-blue-800">
File Upload Progress
</span>
<span className="text-sm text-blue-600">
{Math.round(fileUploadProgress.percentage)}%
</span>
</div>
<div className="w-full bg-blue-200 rounded-full h-2">
<div 
className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
style={{ width: `${fileUploadProgress.percentage}%` }}
></div>
</div>
</div>
)}
</div>

<div className="space-y-4">
<h3 className="text-lg font-semibold text-gray-800">🌐 Google Spreadsheet</h3>
<div>
<label htmlFor="spreadsheet-url" className="block text-sm font-medium text-gray-700 mb-2">
URL Google Spreadsheet
</label>
<input
id="spreadsheet-url"
type="url"
value={spreadsheetUrl}
onChange={(e) => setSpreadsheetUrl(e.target.value)}
placeholder="https://docs.google.com/spreadsheets/d/..."
className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
disabled={isLoading || isUploading || isFileUploading}
/>
<p className="mt-1 text-sm text-gray-500">
Masukkan URL lengkap Google Spreadsheet
</p>
</div>

<button
onClick={fetchSpreadsheetData}
disabled={isLoading || isUploading || isFileUploading || !spreadsheetUrl.trim()}
className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
>
{isLoading ? (
<Loader2 className="animate-spin" size={20} />
) : (
<RefreshCw size={20} />
)}
{isLoading ? 'Mengambil Data...' : 'Ambil Data dari Spreadsheet'}
</button>
</div>
</div>

<div className="flex flex-wrap gap-3 mb-6">
{extractedData && (
<>
<button
onClick={uploadToDatabase}
disabled={isUploading || isLoading || isFileUploading}
className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
>
{isUploading ? (
<Loader2 className="animate-spin" size={20} />
) : (
<Database size={20} />
)}
{isUploading ? 'Mengupload...' : 'Upload ke Database'}
</button>

<button
onClick={downloadAsExcel}
disabled={isUploading || isLoading || isFileUploading}
className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
>
<Download size={20} />
Unduh Excel
</button>
</>
)}

{(extractedData || message) && (
<button
onClick={resetForm}
disabled={isLoading || isUploading || isFileUploading}
className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
>
Reset
</button>
)}
</div>

{uploadProgress && (
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-blue-800">
Database Upload Progress
</span>
<span className="text-sm text-blue-600">
{Math.round(uploadProgress.percentage)}%
</span>
</div>
<div className="w-full bg-blue-200 rounded-full h-3">
<div 
className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
style={{ width: `${uploadProgress.percentage}%` }}
></div>
</div>
</div>
)}

{shouldShowMessage && (
<div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
messageType === 'success' ? 'bg-green-50 border border-green-200' :
messageType === 'error' ? 'bg-red-50 border border-red-200' :
'bg-blue-50 border border-blue-200'
}`}>
{messageType === 'success' && <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />}
{messageType === 'error' && <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />}
{messageType === 'info' && <Loader2 className="text-blue-600 mt-0.5 flex-shrink-0 animate-spin" size={20} />}

<div>
<p className={`font-medium ${
messageType === 'success' ? 'text-green-800' :
messageType === 'error' ? 'text-red-800' :
'text-blue-800'
}`}>
{message}
</p>
</div>
</div>
)}

{extractedData && extractedData.length > 0 && (
<div className="border border-gray-200 rounded-lg overflow-hidden">
<div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
<h3 className="text-lg font-semibold text-gray-800">
Preview Data ({extractedData.length - 1} baris)
</h3>
<p className="text-sm text-gray-600">
Menampilkan maksimal 10 baris pertama
</p>
</div>

<div className="overflow-x-auto max-h-96">
<table className="w-full text-sm">
<tbody>
{extractedData.slice(0, 10).map((row, rowIndex) => (
<tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}>
{row.map((cell, cellIndex) => (
<td key={cellIndex} className="px-3 py-2 border-b border-gray-200 whitespace-nowrap text-xs">
{cell || '-'}
</td>
))}
</tr>
))}
</tbody>
</table>
</div>

{extractedData.length > 10 && (
<div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
... dan {extractedData.length - 10} baris lainnya
</div>
)}
</div>
)}

<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
<h4 className="font-medium text-yellow-800 mb-2">Catatan Penting:</h4>
<ul className="text-sm text-yellow-700 space-y-1">
<li>• Untuk Google Spreadsheet: Pastikan dapat diakses publik dengan setting "Anyone with the link can view"</li>
<li>• Untuk File Excel: Pilih file dengan format .xlsx atau .xls</li>
<li>• Data harus memiliki header: {requiredHeadersList}</li>
<li>• Gunakan tombol "Upload ke Database" untuk menyimpan data ke {dataTypeName} collection</li>
<li>• Data tidak akan dimuat otomatis, tekan tombol "Ambil Data dari Spreadsheet" untuk mengambil data</li>
</ul>
</div>
</div>
);
};

export default GetDataSayurbox;