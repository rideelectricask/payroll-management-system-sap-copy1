import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import GetDataSayurbox from "../components/GetDataSayurbox";
import FilterDataTable from "../components/FilterDataTable";
import { parseExcelFile, parseReplaceExcelFile } from "../utils/parseExcel";
import { batchUploadToServer as batchUploadAPI } from "../services/api";

function PMS() {
const [data, setData] = useState([]);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const [appendLoading, setAppendLoading] = useState(false);
const [replaceLoading, setReplaceLoading] = useState(false);
const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });
const [appendProgress, setAppendProgress] = useState({ current: 0, total: 0, percentage: 0 });
const [replaceProgress, setReplaceProgress] = useState({ current: 0, total: 0, percentage: 0 });
const [activeTab, setActiveTab] = useState("upload");

const resetError = () => setError("");
const resetProgress = () => setUploadProgress({ current: 0, total: 0, percentage: 0 });
const resetAppendProgress = () => setAppendProgress({ current: 0, total: 0, percentage: 0 });
const resetReplaceProgress = () => setReplaceProgress({ current: 0, total: 0, percentage: 0 });

const createErrorModal = (title, message) => {
const modal = document.createElement('div');
modal.className = 'fixed top-4 right-4 z-50 animate-slide-in';

modal.innerHTML = `
<div class="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-4 max-w-md">
<div class="flex items-start gap-3">
<div class="text-red-500 text-xl">⚠️</div>
<div class="flex-1">
<h3 class="text-sm font-semibold text-red-800 mb-1">${title}</h3>
<div class="text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-line">${message}</div>
</div>
<button class="text-gray-400 hover:text-gray-600 text-lg leading-none" onclick="this.closest('.fixed').remove()">×</button>
</div>
</div>
`;

const style = document.createElement('style');
style.textContent = `
@keyframes slide-in {
from { transform: translateX(100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.3s ease-out; }
`;
document.head.appendChild(style);
document.body.appendChild(modal);

setTimeout(() => modal.remove(), 8000);
};

const createSuccessModal = (title, message) => {
const modal = document.createElement('div');
modal.className = 'fixed top-4 right-4 z-50 animate-slide-in';

modal.innerHTML = `
<div class="bg-white border-l-4 border-green-500 shadow-lg rounded-lg p-4 max-w-md">
<div class="flex items-start gap-3">
<div class="text-green-500 text-xl">✅</div>
<div class="flex-1">
<h3 class="text-sm font-semibold text-green-800 mb-1">${title}</h3>
<div class="text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-line">${message}</div>
</div>
<button class="text-gray-400 hover:text-gray-600 text-lg leading-none" onclick="this.closest('.fixed').remove()">×</button>
</div>
</div>
`;

const style = document.createElement('style');
style.textContent = `
@keyframes slide-in {
from { transform: translateX(100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.3s ease-out; }
`;
document.head.appendChild(style);
document.body.appendChild(modal);

setTimeout(() => modal.remove(), 8000);
};

const displayDetailedError = (errorMessage) => {
const lines = errorMessage.split('\n');

if (lines.length <= 1) {
alert(errorMessage);
return;
}

const summaryLine = lines[0];
const remainingLines = lines.slice(1);

let title = "Error Validasi Data";
let formattedMessage = summaryLine;

if (summaryLine.includes("duplikasi Order Code")) {
title = "Duplikasi Order Code Ditemukan";
const duplicateMatch = summaryLine.match(/(\d+) duplikasi.*?(\d+) Order Code/);
if (duplicateMatch) {
const [, duplicateCount, uniqueCount] = duplicateMatch;
formattedMessage = `🔍 Ringkasan:\n• ${duplicateCount} baris duplikat ditemukan\n• ${uniqueCount} Order Code berbeda yang bermasalah\n• Perbaiki duplikasi ini sebelum upload\n\n`;
}
}

if (remainingLines.length > 0) {
formattedMessage += remainingLines.join('\n');
}

createErrorModal(title, formattedMessage);
};

const displayReplaceResult = (result) => {
const { summary } = result;

let title = "Replace Data Berhasil";
let message = `${result.message}\n\n`;

if (summary) {
message += `📊 Ringkasan:\n`;
message += `• Total diproses: ${summary.totalRecords || 0}\n`;
message += `• Data baru: ${summary.insertedRecords || 0}\n`;
message += `• Data diperbarui: ${summary.updatedRecords || 0}\n`;
message += `• Total di database: ${summary.databaseTotal}\n`;
}

createSuccessModal(title, message);
};

const displayAppendResult = (result) => {
const { summary } = result;

let title = "Append Data Berhasil";
let message = `${result.message}\n\n`;

if (summary) {
message += `📊 Ringkasan:\n`;
message += `• Total diproses: ${summary.totalRecords || 0}\n`;
message += `• Data baru: ${summary.insertedRecords || 0}\n`;
message += `• Data diperbarui: ${summary.updatedRecords || 0}\n`;
message += `• Total di database: ${summary.databaseTotal}\n`;
}

createSuccessModal(title, message);
};

const handleFileUpload = async (e) => {
e.preventDefault();
const file = e.target.files[0];
e.target.value = null;
resetError();
resetProgress();

if (!file) {
setError("Tidak ada file yang dipilih.");
return;
}

setLoading(true);

try {
const parsedData = await parseExcelFile(file);

if (parsedData.length === 0) {
throw new Error("Tidak ada data valid yang dapat diproses dari file Excel");
}

const result = await batchUploadAPI(parsedData, (progress) => {
setUploadProgress(progress);
});

if (result?.success) {
createSuccessModal("Upload Berhasil", `${result.message}\nJumlah data berhasil diproses: ${parsedData.length}`);
setData([]);
resetProgress();
} else {
throw new Error(result?.message || "Respons server tidak valid");
}

} catch (err) {
const errorMessage = err.response?.data?.message || err.message || "Gagal memproses data";
setError(`Proses gagal: ${errorMessage}`);
displayDetailedError(errorMessage);
resetProgress();
} finally {
setLoading(false);
}
};

const handleAppendFileUpload = async (e) => {
e.preventDefault();
const file = e.target.files[0];
e.target.value = null;
resetError();
resetAppendProgress();

if (!file) {
setError("Tidak ada file yang dipilih.");
return;
}

setAppendLoading(true);

try {
const parsedData = await parseExcelFile(file);

if (parsedData.length === 0) {
throw new Error("Tidak ada data valid yang dapat diproses dari file Excel");
}

setAppendProgress({ current: 0, total: 1, percentage: 0 });

const result = await batchUploadAPI(parsedData, (progress) => {
setAppendProgress(progress);
});

setAppendProgress({ current: 1, total: 1, percentage: 100 });

if (result?.success) {
displayAppendResult(result);
resetAppendProgress();
} else {
throw new Error(result?.message || "Respons server tidak valid");
}
} catch (err) {
const errorMessage = err.response?.data?.message || err.message || "Gagal menambahkan data";
setError(`Append gagal: ${errorMessage}`);
displayDetailedError(errorMessage);
resetAppendProgress();
} finally {
setAppendLoading(false);
}
};

const handleReplaceFileUpload = async (e) => {
e.preventDefault();
const file = e.target.files[0];
e.target.value = null;
resetError();
resetReplaceProgress();

if (!file) {
setError("Tidak ada file yang dipilih.");
return;
}

setReplaceLoading(true);

try {
const parsedData = await parseReplaceExcelFile(file);

if (parsedData.length === 0) {
throw new Error("Tidak ada data valid yang dapat diproses dari file Excel");
}

const result = await batchUploadAPI(parsedData, (progress) => {
setReplaceProgress(progress);
});

if (result?.success) {
displayReplaceResult(result);
resetReplaceProgress();
} else {
throw new Error(result?.message || "Respons server tidak valid");
}
} catch (err) {
const errorMessage = err.response?.data?.message || err.message || "Gagal mengganti data";
setError(`Replace gagal: ${errorMessage}`);
displayDetailedError(errorMessage);
resetReplaceProgress();
} finally {
setReplaceLoading(false);
}
};

const isAnyLoading = loading || appendLoading || replaceLoading;

const TabButton = ({ id, label, isActive, onClick }) => (
<button
onClick={() => onClick(id)}
className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
isActive
? 'bg-white text-blue-600 border-b-2 border-blue-600'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
}`}
>
{label}
</button>
);

return (
<div className="flex flex-col gap-4 p-6">
<h1 className="text-2xl font-bold text-gray-800">Import Data Management</h1>

<div className="bg-white rounded-lg shadow-lg overflow-hidden">
<div className="flex border-b border-gray-200">
<TabButton
id="upload"
label="📤 Upload Data"
isActive={activeTab === "upload"}
onClick={setActiveTab}
/>
<TabButton
id="extract"
label="📊 Extract from Sayurbox"
isActive={activeTab === "extract"}
onClick={setActiveTab}
/>
<TabButton
id="edata"
label="📋 Extract EData"
isActive={activeTab === "edata"}
onClick={setActiveTab}
/>
<TabButton
id="filter"
label="🔍 Filter Data Table"
isActive={activeTab === "filter"}
onClick={setActiveTab}
/>
</div>

<div className="p-6">
{activeTab === "upload" && (
<div className="flex flex-col gap-6">
<div className="border border-gray-300 rounded-lg p-4">
<h2 className="text-lg font-semibold mb-4">📁 Upload File Excel</h2>
<FileUpload 
onFileSelect={handleFileUpload} 
disabled={isAnyLoading}
/>

{loading && uploadProgress.total > 0 && (
<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-blue-800">
Upload Progress
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
</div>

<div className="border border-green-300 rounded-lg p-4 bg-green-50">
<h2 className="text-lg font-medium mb-2">➕ Tambah Data Excel</h2>
<p className="text-sm text-green-700 mb-3">Menambahkan data baru atau memperbarui data yang sudah ada</p>
<input
type="file"
accept=".xlsx, .xls"
onChange={handleAppendFileUpload}
className="hidden"
id="append-upload"
disabled={isAnyLoading}
/>
<label
htmlFor="append-upload"
className={`cursor-pointer bg-gradient-to-tr from-green-500 to-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-3 hover:shadow-lg w-max transition-all ${
isAnyLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
}`}
>
{appendLoading ? '⏳ Processing...' : '➕ Tambah Data Excel'}
</label>

{appendLoading && appendProgress.total > 0 && (
<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-green-800">
Append Progress
</span>
<span className="text-sm text-green-600">
{Math.round(appendProgress.percentage)}%
</span>
</div>
<div className="w-full bg-green-200 rounded-full h-3">
<div 
className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out" 
style={{ width: `${appendProgress.percentage}%` }}
></div>
</div>
</div>
)}
</div>

<div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
<h2 className="text-lg font-medium mb-2">🔄 Replace Data Excel</h2>
<p className="text-sm text-orange-700 mb-3">Mengganti data yang sudah ada berdasarkan Business dan Order Code</p>
<input
type="file"
accept=".xlsx, .xls"
onChange={handleReplaceFileUpload}
className="hidden"
id="replace-upload"
disabled={isAnyLoading}
/>
<label
htmlFor="replace-upload"
className={`cursor-pointer bg-gradient-to-tr from-orange-500 to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-3 hover:shadow-lg w-max transition-all ${
isAnyLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
}`}
>
{replaceLoading ? '⏳ Processing...' : '🔄 Replace Excel Data'}
</label>

{replaceLoading && replaceProgress.total > 0 && (
<div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
<div className="flex items-center justify-between mb-2">
<span className="text-sm font-medium text-orange-800">
Replace Progress
</span>
<span className="text-sm text-orange-600">
{Math.round(replaceProgress.percentage)}%
</span>
</div>
<div className="w-full bg-orange-200 rounded-full h-3">
<div 
className="bg-orange-600 h-3 rounded-full transition-all duration-500 ease-out" 
style={{ width: `${replaceProgress.percentage}%` }}
></div>
</div>
</div>
)}
</div>

{error && (
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
<div className="flex items-start gap-2">
<span className="text-red-500 mt-0.5">⚠️</span>
<div>
<p className="font-medium">Error</p>
<p className="text-sm">{error}</p>
</div>
</div>
</div>
)}

{data.length > 0 && (
<div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
<p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
{data.length} records
</span>
Data siap untuk diunggah ke server
</p>
<button
onClick={() => batchUploadAPI(data, setUploadProgress)}
disabled={isAnyLoading}
className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg w-max transition-all ${
isAnyLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:scale-105'
}`}
>
{loading ? '⏳ Uploading...' : '💾 Simpan ke Database'}
</button>
</div>
)}
</div>
)}

{activeTab === "extract" && (
<GetDataSayurbox isEDataMode={false} />
)}

{activeTab === "edata" && (
<GetDataSayurbox isEDataMode={true} />
)}

{activeTab === "filter" && (
<FilterDataTable />
)}
</div>
</div>
</div>
);
}

export default PMS;