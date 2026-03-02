import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { fetchSellerData, apiCall } from "../services/sellerApi";
import FileUpload from "../components/FileUpload";
import { parseSellerExcelFile, validateExcelStructure } from "../utils/parseSellerExcel";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert";
// import { downloadSellerTemplate } from "../services/sellerTemplateService";
import { showSuccessNotification, showErrorNotification } from "../utils/notificationService";
import { Download, Loader2, Trash2, Edit2, X, Save, AlertCircle, FileDown, AlertTriangle, Database, SortAsc, SortDesc } from "lucide-react";
import * as XLSX from 'xlsx';

const DuplicateModal = memo(({ isOpen, duplicates, onClose, onDownload }) => {
if (!isOpen || !duplicates) return null;

const totalDuplicates = duplicates.total || 0;
const inFileCount = duplicates.inPayload?.length || 0;
const inDatabaseCount = duplicates.inDatabase?.length || 0;

return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
<div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200">
<div className="p-5 border-b border-gray-200 bg-red-50/80">
<div className="flex items-start justify-between">
<div className="flex items-start gap-3">
<div className="flex-shrink-0 bg-red-100 rounded-full p-2">
<AlertTriangle className="w-5 h-5 text-red-600" />
</div>
<div>
<h3 className="text-lg font-semibold text-gray-900 mb-1">
Data Duplikat Terdeteksi
</h3>
<p className="text-sm text-gray-700">
Ditemukan {totalDuplicates} data duplikat. Harap perbaiki sebelum melanjutkan.
</p>
</div>
</div>
<button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
<X size={20} />
</button>
</div>
</div>

<div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
<div className="grid grid-cols-2 gap-3 mb-5">
<div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
<p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat dalam File</p>
<p className="text-2xl font-bold text-gray-900">{inFileCount}</p>
</div>
<div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
<p className="text-xs text-gray-600 uppercase font-medium mb-1">Duplikat di Database</p>
<p className="text-2xl font-bold text-gray-900">{inDatabaseCount}</p>
</div>
</div>

{inFileCount > 0 && (
<div className="mb-5">
<h4 className="font-semibold text-gray-900 mb-3 text-sm">Duplikat dalam File yang Diunggah</h4>
<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-100">
<tr>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ID</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nama</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email Iseller</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Field Duplikat</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-100">
{duplicates.inPayload?.map((dup, idx) => (
<tr key={idx} className="hover:bg-gray-50">
<td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.sellerId || '-'}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.nama || '-'}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.emailIseller || '-'}</td>
<td className="px-4 py-2 text-sm">
<div className="flex flex-wrap gap-1">
{dup.duplicateFields.map((field, i) => (
<span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
{field}
</span>
))}
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
</div>
)}

{inDatabaseCount > 0 && (
<div>
<h4 className="font-semibold text-gray-900 mb-3 text-sm">Duplikat dengan Data di Database</h4>
<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-100">
<tr>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Baris</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">ID</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Nama</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email Iseller</th>
<th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Field Duplikat</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-100">
{duplicates.inDatabase?.map((dup, idx) => (
<tr key={idx} className="hover:bg-gray-50">
<td className="px-4 py-2 text-sm text-gray-900 font-medium">{dup.row}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.sellerId || '-'}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.nama || '-'}</td>
<td className="px-4 py-2 text-sm text-gray-700">{dup.data.emailIseller || '-'}</td>
<td className="px-4 py-2 text-sm">
<div className="flex flex-wrap gap-1">
{dup.duplicateFields.map((field, i) => (
<span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
{field}
</span>
))}
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
</div>
)}
</div>

<div className="p-4 border-t border-gray-200 bg-white/90">
<div className="flex justify-between items-center">
<p className="text-sm text-gray-600">Perbaiki data duplikat dan unggah ulang</p>
<div className="flex gap-2">
<button onClick={onDownload} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
<FileDown size={16} />
Download Detail
</button>
<button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm">
Tutup
</button>
</div>
</div>
</div>
</div>
</div>
);
});

const BulkActionBar = memo(({ selectedItems, onBulkDelete, onSelectAll, onDeselectAll, totalItems }) => {
if (selectedItems.length <= 1) return null;

return (
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="font-semibold text-blue-900 text-sm">
{selectedItems.length} items selected
</span>
<div className="flex gap-2">
<button onClick={onSelectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
Select All ({totalItems})
</button>
<button onClick={onDeselectAll} className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
Deselect All
</button>
</div>
</div>
<button onClick={onBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm">
<Trash2 size={16} />
Delete Selected
</button>
</div>
</div>
);
});

const ConfirmationModal = memo(({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya", cancelText = "Batal", isLoading = false }) => {
if (!isOpen) return null;

return (
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
<div className="p-6">
<div className="flex items-start gap-4">
<div className="flex-shrink-0">
<AlertCircle className="w-6 h-6 text-red-600" />
</div>
<div className="flex-1">
<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
<p className="text-gray-700 text-sm">{message}</p>
</div>
</div>
<div className="flex justify-end gap-3 mt-6">
<button onClick={onCancel} disabled={isLoading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
{cancelText}
</button>
<button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
{isLoading && <Loader2 size={16} className="animate-spin" />}
{isLoading ? 'Processing...' : confirmText}
</button>
</div>
</div>
</div>
</div>
);
});

const EditableCell = memo(({ item, field, value, isEditing, editingId, onStartEdit, onChange, onSave, onCancel, className, isLastCell = false }) => {
const [localValue, setLocalValue] = useState(value);

useEffect(() => {
setLocalValue(value);
}, [value, editingId]);

const handleChange = useCallback((e) => {
const newValue = e.target.value;
setLocalValue(newValue);
onChange(field, newValue);
}, [field, onChange]);

if (isEditing) {
return (
<td className={className}>
{isLastCell ? (
<div className="flex items-center gap-2">
<input type="text" value={localValue} onChange={handleChange} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus={field === 'alasanMundur'} />
<div className="flex gap-1">
<button onClick={onSave} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Save">
<Save size={16} />
</button>
<button onClick={onCancel} className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors" title="Cancel">
<X size={16} />
</button>
</div>
</div>
) : (
<input type="text" value={localValue} onChange={handleChange} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
)}
</td>
);
}

return (
<td className={className} title={value || '-'} onDoubleClick={() => onStartEdit(item)}>
<div className="truncate">{value || '-'}</div>
</td>
);
});

const SellerRow = memo(({ item, isSelected, onSelect, editingItem, editFormData, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete }) => {
const handleCheckboxChange = useCallback((e) => {
onSelect(item._id, e.target.checked);
}, [item._id, onSelect]);

const handleStartEdit = useCallback(() => {
onStartEdit(item);
}, [item, onStartEdit]);

const handleDelete = useCallback(() => {
onDelete(item);
}, [item, onDelete]);

const isEditing = editingItem === item._id;

const columns = [
{ key: 'joinDate', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'resignDate', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'sellerId', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'password', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'emailIseller', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'nama', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'noKtp', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'noTelepon', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'email', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'namaOutlet', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'reason', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'status', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'remark', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'motorPribadi', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'client', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'tanggalMundur', width: 'px-6 py-4 whitespace-nowrap text-sm' },
{ key: 'alasanMundur', width: 'px-6 py-4 whitespace-nowrap text-sm' }
];

return (
<tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
<td className="px-6 py-4 whitespace-nowrap text-sm">
<input type="checkbox" checked={isSelected} onChange={handleCheckboxChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm">
<div className="flex gap-1">
<button onClick={handleStartEdit} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Edit">
<Edit2 size={16} />
</button>
<button onClick={handleDelete} className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Delete">
<Trash2 size={16} />
</button>
</div>
</td>
{columns.map((col, colIndex) => {
if (col.key === 'status') {
return (
<td key={col.key} className={col.width}>
{isEditing ? (
<select value={editFormData[col.key]} onChange={(e) => onEditChange(col.key, e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
<option value="Active">Active</option>
<option value="Resigned">Resigned</option>
<option value="Suspended">Suspended</option>
</select>
) : (
<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
item[col.key] === 'Active' ? 'bg-green-100 text-green-800' : 
item[col.key] === 'Resigned' ? 'bg-red-100 text-red-800' : 
'bg-yellow-100 text-yellow-800'
}`}>
{item[col.key]}
</span>
)}
</td>
);
}

return (
<EditableCell key={col.key} item={item} field={col.key} value={isEditing ? editFormData[col.key] : item[col.key]} isEditing={isEditing} editingId={editingItem} onStartEdit={handleStartEdit} onChange={onEditChange} onSave={onSaveEdit} onCancel={onCancelEdit} className={`${col.width} text-gray-900 border-r border-gray-200 last:border-r-0`} isLastCell={colIndex === columns.length - 1} />
);
})}
</tr>
);
});

export default function MitraMobileSelling() {
const [state, setState] = useState({
data: [],
sellers: [],
error: "",
success: "",
isLoading: false,
isUploading: false,
uploadProgress: 0,
searchTerm: "",
currentPage: 1,
itemsPerPage: 25,
isDownloadingTemplate: false,
isExporting: false
});

const [sortConfig, setSortConfig] = useState({
key: 'nama',
direction: 'asc'
});

const [previewSort, setPreviewSort] = useState({
field: null,
direction: 'asc'
});

const [editingItem, setEditingItem] = useState(null);
const [editFormData, setEditFormData] = useState({});
const [selectedItems, setSelectedItems] = useState(new Set());
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteTarget, setDeleteTarget] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
const [duplicateData, setDuplicateData] = useState(null);
const [showDuplicateModal, setShowDuplicateModal] = useState(false);

const filteredAndSortedSellers = useMemo(() => {
let filtered = state.sellers.filter(seller =>
Object.values(seller).some(value =>
String(value).toLowerCase().includes(state.searchTerm.toLowerCase())
)
);

filtered.sort((a, b) => {
const aVal = a[sortConfig.key];
const bVal = b[sortConfig.key];

if (aVal == null && bVal == null) return 0;
if (aVal == null) return 1;
if (bVal == null) return -1;

const aStr = String(aVal).toLowerCase();
const bStr = String(bVal).toLowerCase();

const aNum = Number(aVal);
const bNum = Number(bVal);

if (!isNaN(aNum) && !isNaN(bNum)) {
return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
}

if (sortConfig.direction === 'asc') {
return aStr.localeCompare(bStr, 'id-ID', { numeric: true, sensitivity: 'base' });
} else {
return bStr.localeCompare(aStr, 'id-ID', { numeric: true, sensitivity: 'base' });
}
});

return filtered;
}, [state.sellers, state.searchTerm, sortConfig]);

const paginatedSellers = useMemo(() => {
const startIndex = (state.currentPage - 1) * state.itemsPerPage;
return filteredAndSortedSellers.slice(startIndex, startIndex + state.itemsPerPage);
}, [filteredAndSortedSellers, state.currentPage, state.itemsPerPage]);

const totalPages = Math.ceil(filteredAndSortedSellers.length / state.itemsPerPage);

const updateState = useCallback((updates) => {
setState(prev => ({ ...prev, ...updates }));
}, []);

const clearMessages = useCallback(() => {
setTimeout(() => {
updateState({ error: "", success: "" });
}, 5000);
}, [updateState]);

const handleDownloadDuplicateReport = useCallback(() => {
if (!duplicateData) return;

const reportData = [];

if (duplicateData.inPayload) {
duplicateData.inPayload.forEach(dup => {
reportData.push({
Tipe: 'Duplikat dalam File',
Baris: dup.row,
ID: dup.data.sellerId || '',
Nama: dup.data.nama || '',
'Email Iseller': dup.data.emailIseller || '',
'Field Duplikat': dup.duplicateFields.join(', ')
});
});
}

if (duplicateData.inDatabase) {
duplicateData.inDatabase.forEach(dup => {
reportData.push({
Tipe: 'Duplikat dengan Database',
Baris: dup.row,
ID: dup.data.sellerId || '',
Nama: dup.data.nama || '',
'Email Iseller': dup.data.emailIseller || '',
'Field Duplikat': dup.duplicateFields.join(', ')
});
});
}

const ws = XLSX.utils.json_to_sheet(reportData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Duplicate Report');

const wscols = [
{ wch: 25 },
{ wch: 10 },
{ wch: 15 },
{ wch: 25 },
{ wch: 30 },
{ wch: 30 }
];
ws['!cols'] = wscols;

const timestamp = new Date().toISOString().slice(0, 10);
XLSX.writeFile(wb, `Seller_Duplicate_Report_${timestamp}.xlsx`);

showSuccessNotification("Download Berhasil", "Laporan duplikat berhasil diunduh");
}, [duplicateData]);

const handleCloseDuplicateModal = useCallback(() => {
setShowDuplicateModal(false);
setDuplicateData(null);
updateState({ data: [] });
}, [updateState]);

const handleDownloadTemplate = useCallback(async () => {
updateState({ isDownloadingTemplate: true });
try {
const result = downloadSellerTemplate();
showSuccessNotification("Template Downloaded", result.message);
} catch (error) {
showErrorNotification("Download Failed", error.message);
} finally {
updateState({ isDownloadingTemplate: false });
}
}, [updateState]);

const handleExportData = useCallback(async () => {
updateState({ isExporting: true });
try {
const dataToExport = filteredAndSortedSellers.map(seller => ({
'Join Date': seller.joinDate || '',
'Resign Date': seller.resignDate || '',
ID: seller.sellerId || '',
Password: seller.password || '',
'Email Iseller': seller.emailIseller || '',
Nama: seller.nama || '',
'No KTP': seller.noKtp || '',
'No Telepon': seller.noTelepon || '',
Email: seller.email || '',
'Nama Outlet': seller.namaOutlet || '',
Reason: seller.reason || '',
Status: seller.status || '',
Remark: seller.remark || '',
'Motor Pribadi': seller.motorPribadi || '',
Client: seller.client || '',
'Tanggal Mundur': seller.tanggalMundur || '',
'Alasan Mundur': seller.alasanMundur || ''
}));

const ws = XLSX.utils.json_to_sheet(dataToExport);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Seller Data');

const wscols = [
{ wch: 12 },
{ wch: 12 },
{ wch: 10 },
{ wch: 15 },
{ wch: 25 },
{ wch: 20 },
{ wch: 18 },
{ wch: 15 },
{ wch: 25 },
{ wch: 20 },
{ wch: 15 },
{ wch: 10 },
{ wch: 15 },
{ wch: 15 },
{ wch: 15 },
{ wch: 15 },
{ wch: 20 }
];
ws['!cols'] = wscols;

const timestamp = new Date().toISOString().slice(0, 10);
XLSX.writeFile(wb, `Seller_Data_Export_${timestamp}.xlsx`);

showSuccessNotification("Export Success", `Successfully exported ${dataToExport.length} seller records`);
} catch (error) {
showErrorNotification("Export Failed", error.message);
} finally {
updateState({ isExporting: false });
}
}, [filteredAndSortedSellers, updateState]);

const fetchSellers = useCallback(async () => {
try {
updateState({ isLoading: true, error: "" });
const sellersData = await fetchSellerData();
updateState({ 
sellers: sellersData || [], 
isLoading: false,
success: `Loaded ${sellersData?.length || 0} seller records`
});
clearMessages();
} catch (err) {
console.error("Failed to fetch sellers:", err.message);
updateState({ 
error: `Failed to load seller data: ${err.message}`, 
isLoading: false 
});
clearMessages();
}
}, [updateState, clearMessages]);

useEffect(() => {
fetchSellers();
}, [fetchSellers]);

const handleFileUpload = useCallback(async (e) => {
e.preventDefault();
const file = e.target.files[0];
e.target.value = null;

updateState({ error: "", success: "", data: [] });
setDuplicateData(null);
setShowDuplicateModal(false);

if (!file) {
updateState({ error: "No file selected." });
clearMessages();
return;
}

try {
updateState({ isLoading: true });

console.log("Validating Excel structure...");
const structureInfo = await validateExcelStructure(file);

if (!structureInfo.isValid) {
throw new Error(`Invalid Excel file: ${structureInfo.errors.join(', ')}`);
}

console.log(`Excel file info: ${structureInfo.sheetCount} sheets found`);

console.log("Parsing Excel file...");
const parsedData = await parseSellerExcelFile(file);

updateState({ 
data: parsedData, 
isLoading: false,
success: `Successfully parsed ${parsedData.length} seller records from Excel file`
});

console.log("Data parsed successfully:", parsedData.length, "records");
clearMessages();

} catch (err) {
console.error("File parsing failed:", err.message);
updateState({ 
error: `File parsing failed: ${err.message}`, 
isLoading: false 
});
clearMessages();
}
}, [updateState, clearMessages]);

const handleUploadToServer = useCallback(async () => {
if (!state.data.length) {
updateState({ error: "No data to upload" });
clearMessages();
return;
}

let progressInterval;

try {
updateState({ isUploading: true, uploadProgress: 0, error: "", success: "" });

progressInterval = setInterval(() => {
updateState(prev => ({
uploadProgress: Math.min(prev.uploadProgress + 10, 90)
}));
}, 200);

const response = await apiCall('/seller/upload', {
method: 'POST',
data: state.data,
timeout: 30000
});

if (progressInterval) clearInterval(progressInterval);

updateState({
isUploading: false,
uploadProgress: 100,
success: `${response.message || 'Data uploaded successfully'}. ${state.data.length} records saved.`,
data: []
});

setTimeout(fetchSellers, 1000);
clearMessages();

} catch (err) {
if (progressInterval) clearInterval(progressInterval);

if (err.status === 409 && err.data?.duplicates) {
console.log("Duplicate data detected, showing modal");
setDuplicateData(err.data.duplicates);
setShowDuplicateModal(true);

updateState({
isUploading: false,
uploadProgress: 0,
error: ""
});
return;
}

updateState({
isUploading: false,
uploadProgress: 0,
error: `Upload failed: ${err.message}`
});
clearMessages();
}
}, [state.data, updateState, clearMessages, fetchSellers]);

const handleEdit = useCallback((item) => {
setEditingItem(item._id);
setEditFormData({ ...item });
}, []);

const handleCancelEdit = useCallback(() => {
setEditingItem(null);
setEditFormData({});
}, []);

const handleEditChange = useCallback((field, value) => {
setEditFormData(prev => ({
...prev,
[field]: value
}));
}, []);

const handleSaveEdit = useCallback(async () => {
try {
await apiCall(`/seller/data/${editingItem}`, {
method: 'PUT',
data: editFormData
});

showSuccessNotification("Update Success", `Seller "${editFormData.nama}" updated successfully`);
setEditingItem(null);
setEditFormData({});
await fetchSellers();
} catch (error) {
const status = error.status || error.originalError?.response?.status;
const responseData = error.data || error.originalError?.response?.data;

if (status === 409) {
showErrorNotification("Data Duplikat", responseData?.message || "Data duplikat ditemukan");
} else {
showErrorNotification("Update Failed", `Failed to update seller: ${error.message}`);
}
}
}, [editingItem, editFormData, fetchSellers]);

const handleDelete = useCallback((item) => {
setDeleteTarget({ type: 'single', id: item._id, name: item.nama });
setShowDeleteConfirm(true);
}, []);

const handleBulkDelete = useCallback(() => {
if (selectedItems.size === 0) {
showErrorNotification("Selection Error", "Select at least one item to delete");
return;
}
setDeleteTarget({ type: 'multiple', ids: Array.from(selectedItems), count: selectedItems.size });
setShowDeleteConfirm(true);
}, [selectedItems]);

const confirmDelete = useCallback(async () => {
setIsDeleting(true);
try {
if (deleteTarget.type === 'single') {
await apiCall(`/seller/data/${deleteTarget.id}`, {
method: 'DELETE'
});
showSuccessNotification("Delete Success", `Seller "${deleteTarget.name}" deleted successfully`);
} else {
await apiCall('/seller/data/bulk-delete', {
method: 'DELETE',
data: { ids: deleteTarget.ids }
});
showSuccessNotification("Delete Success", `Successfully deleted ${deleteTarget.count} sellers`);
setSelectedItems(new Set());
}
await fetchSellers();
} catch (error) {
showErrorNotification("Delete Failed", `Failed to delete seller(s): ${error.message}`);
} finally {
setIsDeleting(false);
setShowDeleteConfirm(false);
setDeleteTarget(null);
}
}, [deleteTarget, fetchSellers]);

const cancelDelete = useCallback(() => {
setShowDeleteConfirm(false);
setDeleteTarget(null);
}, []);

const handleSelectAll = useCallback(() => {
setSelectedItems(new Set(filteredAndSortedSellers.map(s => s._id)));
}, [filteredAndSortedSellers]);

const handleDeselectAll = useCallback(() => {
setSelectedItems(new Set());
}, []);

const handleSelectItem = useCallback((id, checked) => {
setSelectedItems(prev => {
const newSelected = new Set(prev);
if (checked) {
newSelected.add(id);
} else {
newSelected.delete(id);
}
return newSelected;
});
}, []);

const handleSearch = useCallback((searchTerm) => {
updateState({ searchTerm, currentPage: 1 });
}, [updateState]);

const handleSort = useCallback((key) => {
setSortConfig(prev => ({
key,
direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
}));
updateState({ currentPage: 1 });
}, [updateState]);

const getSortIcon = useCallback((column) => {
if (sortConfig.key !== column) {
return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
}
return sortConfig.direction === 'asc' 
? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
: <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
}, [sortConfig]);

const handlePageChange = useCallback((page) => {
updateState({ currentPage: page });
}, [updateState]);

const handlePreviewSort = useCallback((field) => {
setPreviewSort(prev => ({
field,
direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
}));
}, []);

const sortedPreviewData = useMemo(() => {
if (!state.data.length || !previewSort.field) return state.data;

const sorted = [...state.data].sort((a, b) => {
const aVal = a[previewSort.field];
const bVal = b[previewSort.field];

if (aVal == null && bVal == null) return 0;
if (aVal == null) return 1;
if (bVal == null) return -1;

const aStr = String(aVal).toLowerCase();
const bStr = String(bVal).toLowerCase();

const aNum = Number(aVal);
const bNum = Number(bVal);

if (!isNaN(aNum) && !isNaN(bNum)) {
return previewSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
}

if (previewSort.direction === 'asc') {
return aStr.localeCompare(bStr, 'id-ID', { numeric: true, sensitivity: 'base' });
} else {
return bStr.localeCompare(aStr, 'id-ID', { numeric: true, sensitivity: 'base' });
}
});

return sorted;
}, [state.data, previewSort]);

const currentPageIds = useMemo(() => {
return paginatedSellers.map(item => item._id);
}, [paginatedSellers]);

const isAllCurrentSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
const isIndeterminate = currentPageIds.some(id => selectedItems.has(id)) && !isAllCurrentSelected;

const handleMasterCheckbox = useCallback((checked) => {
const newSelected = new Set(selectedItems);
if (checked) {
currentPageIds.forEach(id => newSelected.add(id));
} else {
currentPageIds.forEach(id => newSelected.delete(id));
}
setSelectedItems(newSelected);
}, [selectedItems, currentPageIds]);

return (
<div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
<DuplicateModal 
isOpen={showDuplicateModal} 
duplicates={duplicateData} 
onClose={handleCloseDuplicateModal}
onDownload={handleDownloadDuplicateReport}
/>

<ConfirmationModal isOpen={showDeleteConfirm} title="Confirm Delete" message={deleteTarget?.type === 'single' ? `Are you sure you want to delete seller "${deleteTarget.name}"?` : `Are you sure you want to delete ${deleteTarget?.count} selected sellers?`} onConfirm={confirmDelete} onCancel={cancelDelete} confirmText="Yes, Delete" cancelText="Cancel" isLoading={isDeleting} />

<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
<h1 className="text-2xl font-bold text-gray-800">Mitra Mobile Selling Information System</h1>
<div className="flex items-center gap-3">
<div className="flex items-center gap-3 text-sm text-gray-600">
<span>Total Sellers: {state.sellers.length}</span>
{filteredAndSortedSellers.length !== state.sellers.length && (
<span>| Filtered: {filteredAndSortedSellers.length}</span>
)}
</div>
<button onClick={handleExportData} disabled={state.isExporting || state.sellers.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm">
{state.isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
Export Data
</button>
<button onClick={handleDownloadTemplate} disabled={state.isDownloadingTemplate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm">
{state.isDownloadingTemplate ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
Download Template
</button>
</div>
</div>

<div className="bg-white rounded-lg shadow-sm !border-gray-300 border p-6">
<h2 className="text-lg font-semibold mb-4">Upload Seller Data</h2>
<FileUpload onFileSelect={handleFileUpload} isLoading={state.isLoading} accept=".xlsx,.xls" />

{state.isUploading && (
<div className="mt-4">
<div className="flex justify-between text-sm text-gray-600 mb-1">
<span>Uploading data...</span>
<span>{state.uploadProgress}%</span>
</div>
<div className="w-full bg-gray-200 rounded-full h-2">
<div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${state.uploadProgress}%` }}></div>
</div>
</div>
)}
</div>

{state.error && <ErrorAlert message={state.error} />}
{state.success && <SuccessAlert message={state.success} />}

{state.data.length > 0 && (
<div className="border border-gray-200 rounded-lg overflow-hidden">
<div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
<h3 className="text-lg font-semibold text-gray-800">
Preview Data ({state.data.length} baris)
</h3>
<p className="text-sm text-gray-600">
Menampilkan maksimal 5 baris pertama. Klik header untuk mengurutkan data.
</p>
</div>

<div className="overflow-x-auto max-h-96">
<table className="w-full text-sm">
<thead className="bg-gray-50 sticky top-0">
<tr>
{[
{ key: 'joinDate', label: 'Join Date' },
{ key: 'resignDate', label: 'Resign Date' },
{ key: 'sellerId', label: 'ID' },
{ key: 'password', label: 'Password' },
{ key: 'emailIseller', label: 'Email Iseller' },
{ key: 'nama', label: 'Nama' },
{ key: 'noKtp', label: 'No KTP' },
{ key: 'noTelepon', label: 'No Telepon' },
{ key: 'email', label: 'Email' },
{ key: 'namaOutlet', label: 'Nama Outlet' },
{ key: 'reason', label: 'Reason' },
{ key: 'status', label: 'Status' },
{ key: 'remark', label: 'Remark' },
{ key: 'motorPribadi', label: 'Motor Pribadi' },
{ key: 'client', label: 'Client' },
{ key: 'tanggalMundur', label: 'Tanggal Mundur' },
{ key: 'alasanMundur', label: 'Alasan Mundur' }
].map(({ key, label }) => (
<th
key={key}
onClick={() => handlePreviewSort(key)}
className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
>
<div className="flex items-center gap-1">
{label}
{previewSort.field === key && (
<span className="text-blue-500">
{previewSort.direction === 'asc' ? '↑' : '↓'}
</span>
)}
</div>
</th>
))}
</tr>
</thead>
<tbody>
{sortedPreviewData.slice(0, 5).map((row, rowIndex) => (
<tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-100">
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.joinDate || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.resignDate || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.sellerId || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.password || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.emailIseller || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.nama || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.noKtp || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.noTelepon || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.email || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.namaOutlet || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.reason || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">
{row.status === 'Active' ? (
<span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
Active
</span>
) : row.status === 'Resigned' ? (
<span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
Resigned
</span>
) : (
row.status || '-'
)}
</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.remark || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.motorPribadi || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.client || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap border-r border-gray-200">{row.tanggalMundur || '-'}</td>
<td className="px-3 py-2 text-xs whitespace-nowrap">{row.alasanMundur || '-'}</td>
</tr>
))}
</tbody>
</table>
</div>

{state.data.length > 5 && (
<div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t border-gray-200">
... dan {state.data.length - 5} baris lainnya
</div>
)}

<div className="bg-white px-4 py-3 border-t border-gray-200 flex justify-end">
<button
onClick={handleUploadToServer}
disabled={state.isUploading}
className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
>
{state.isUploading ? (
<Loader2 className="animate-spin" size={20} />
) : (
<Database size={20} />
)}
{state.isUploading ? 'Mengupload...' : 'Upload ke Database'}
</button>
</div>
</div>
)}

{state.isLoading && <LoadingSpinner message="Processing data..." />}

<BulkActionBar selectedItems={Array.from(selectedItems)} onBulkDelete={handleBulkDelete} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} totalItems={filteredAndSortedSellers.length} />

<div className="bg-white rounded-lg shadow-sm !border-gray-300 border p-4">
<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
<div className="flex-1 max-w-md">
<input type="text" placeholder="Search sellers..." value={state.searchTerm} onChange={(e) => handleSearch(e.target.value)} className="w-full px-4 py-2 !border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
</div>
<div className="flex items-center gap-2 text-sm text-gray-600">
<label>Items per page:</label>
<select value={state.itemsPerPage} onChange={(e) => updateState({ itemsPerPage: Number(e.target.value), currentPage: 1 })} className="px-2 py-1 !border-gray-300 border rounded">
<option value={25}>25</option>
<option value={50}>50</option>
<option value={100}>100</option>
</select>
</div>
</div>
</div>

<div className="bg-white rounded-lg shadow-sm !border-gray-300 border overflow-hidden">
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
<input type="checkbox" checked={isAllCurrentSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} onChange={(e) => handleMasterCheckbox(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
{[
{ key: 'joinDate', label: 'Join Date' },
{ key: 'resignDate', label: 'Resign Date' },
{ key: 'sellerId', label: 'ID' },
{ key: 'password', label: 'Password' },
{ key: 'emailIseller', label: 'Email Iseller' },
{ key: 'nama', label: 'Nama' },
{ key: 'noKtp', label: 'No KTP' },
{ key: 'noTelepon', label: 'No Telepon' },
{ key: 'email', label: 'Email' },
{ key: 'namaOutlet', label: 'Nama Outlet' },
{ key: 'reason', label: 'Reason' },
{ key: 'status', label: 'Status' },
{ key: 'remark', label: 'Remark' },
{ key: 'motorPribadi', label: 'Motor Pribadi' },
{ key: 'client', label: 'Client' },
{ key: 'tanggalMundur', label: 'Tanggal Mundur' },
{ key: 'alasanMundur', label: 'Alasan Mundur' }
].map(({ key, label }) => (
<th key={key} onClick={() => handleSort(key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200 last:border-r-0 select-none">
<div className="flex items-center">
<span className="truncate">{label}</span>
{getSortIcon(key)}
</div>
</th>
))}
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{paginatedSellers.map((seller) => (
<SellerRow key={seller._id} item={seller} isSelected={selectedItems.has(seller._id)} onSelect={handleSelectItem} editingItem={editingItem} editFormData={editFormData} onStartEdit={handleEdit} onEditChange={handleEditChange} onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit} onDelete={handleDelete} />
))}
{paginatedSellers.length === 0 && (
<tr>
<td colSpan={19} className="px-6 py-8 text-center text-gray-500">
{state.searchTerm ? 'No sellers found matching your search.' : 'No seller data available.'}
</td>
</tr>
)}
</tbody>
</table>
</div>

{totalPages > 1 && (
<div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
<div className="text-sm text-gray-600">
Showing {((state.currentPage - 1) * state.itemsPerPage) + 1} to{' '}
{Math.min(state.currentPage * state.itemsPerPage, filteredAndSortedSellers.length)} of{' '}
{filteredAndSortedSellers.length} results
</div>
<div className="flex items-center gap-2">
<button onClick={() => handlePageChange(state.currentPage - 1)} disabled={state.currentPage === 1} className="px-3 py-1 text-sm !border-gray-300 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
Previous
</button>

{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
const pageNum = state.currentPage <= 3 ? i + 1 : state.currentPage - 2 + i;
if (pageNum > totalPages) return null;
return (
<button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 text-sm !border-gray-300 border rounded hover:bg-gray-100 ${state.currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : ''}`}>
{pageNum}
</button>
);
})}

<button onClick={() => handlePageChange(state.currentPage + 1)} disabled={state.currentPage === totalPages} className="px-3 py-1 text-sm !border-gray-300 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
Next
</button>
</div>
</div>
)}
</div>
</div>
);
}