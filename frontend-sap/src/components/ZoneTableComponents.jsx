import React, { useMemo, useCallback, useState, useRef, useEffect, memo } from 'react';
import { Search, Upload, TestTube, ArrowLeft, SortAsc, SortDesc, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import {
ZONE_TABLE_HEAD,
ZONE_COLORS,
HEADER_FIELD_MAPPING,
getPackageBonusStyle,
getFestiveBonusStyle,
getAfterRekonStyle,
getAddPersonalStyle,
getAskorFeeStyle,
getIncentivesStyle,
formatCurrency,
getUniqueHubCount,
INFO_TEXTS,
findDuplicateCourierNames,
findDuplicateCourierCodes,
getDuplicateNameStyle,
getDuplicateCodeStyle
} from '../utils/zoneTableUtils';
import { useFileUpload } from '../hooks/useFileUpload';
import { downloadZoneTemplate } from '../services/templateService';
import { showSuccessNotification, showErrorNotification } from '../utils/notificationService';

const DEBOUNCE_DELAY = 200;

const getColumnDynamicWidth = (header, data) => {
const baseWidths = {
"Hub": 8,
"Courier Name": 12,
"Courier Code": 10,
"Zone 1": 6,
"Zone 2": 6,
"Zone 3": 6,
"Zone 4": 6,
"Zone 5": 6,
"Zone 6": 6,
"Total Packages": 8,
"Base Fee": 10,
"Heavy Package Fee": 12,
"Package Bonus": 12,
"Festive Bonus": 12,
"Post-Reconciliation": 14,
"Additional Personal": 14,
"Incentives": 10,
"Askor Fee": 10,
"Total Fee": 10
};

const fieldName = HEADER_FIELD_MAPPING[header] || header;
let maxLength = baseWidths[header] || 8;

if (data && Array.isArray(data) && data.length > 0) {
const headerLength = header.length;
const maxDataLength = Math.max(
...data.map(row => String(row[fieldName] || '').length),
headerLength
);
maxLength = Math.max(maxLength, maxDataLength);
}

const clampedWidth = Math.max(6, Math.min(maxLength, 20));
return `min-w-[${clampedWidth}rem]`;
};

const useDebounce = (value, delay) => {
const [debouncedValue, setDebouncedValue] = useState(value);
const timeoutRef = useRef(null);

useEffect(() => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}

timeoutRef.current = setTimeout(() => {
setDebouncedValue(value);
}, delay);

return () => {
if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
};
}, [value, delay]);

return debouncedValue;
};

const InfoTexts = memo(() => {
const infoItems = useMemo(() => [
{ text: INFO_TEXTS.PACKAGE_BONUSES, color: "text-blue-600" },
{ text: INFO_TEXTS.FESTIVE_BONUS, color: "text-green-600" },
{ text: INFO_TEXTS.AFTER_REKON, color: "text-orange-600" },
{ text: INFO_TEXTS.ADD_PERSONAL, color: "text-purple-600" },
{ text: INFO_TEXTS.INCENTIVES, color: "text-pink-600" },
{ text: INFO_TEXTS.ASKOR_FEE, color: "text-teal-600" }
], []);

return (
<div className="mt-2 space-y-1">
{infoItems.map((item, index) => (
<div key={index} className={`text-sm font-medium ${item.color}`}>
{item.text}
</div>
))}
</div>
);
});

const ActionButtons = memo(({ isUploading, onTestApi, onTriggerUpload, onBack, isDownloadingTemplate, onDownloadTemplate }) => {
const buttons = useMemo(() => [
{
color: "bg-blue-600 hover:bg-blue-700 text-white",
onClick: onTestApi,
icon: <TestTube className="h-4 w-4" />,
text: "Test API",
disabled: false
},
{
color: "bg-orange-600 hover:bg-orange-700 text-white",
onClick: onTriggerUpload,
icon: isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />,
text: isUploading ? 'Uploading...' : 'Upload Excel',
disabled: isUploading
},
{
color: "bg-blue-600 hover:bg-blue-700 text-white",
onClick: onDownloadTemplate,
icon: isDownloadingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />,
text: "Download Template",
disabled: isDownloadingTemplate
},
{
color: "bg-gray-600 hover:bg-gray-700 text-white",
onClick: onBack,
icon: <ArrowLeft className="h-4 w-4" />,
text: "Back to Profit Table",
disabled: false
}
], [isUploading, onTestApi, onTriggerUpload, onBack, isDownloadingTemplate, onDownloadTemplate]);

return (
<div className="flex gap-2">
{buttons.map((btn, index) => (
<button
key={index}
onClick={btn.onClick}
disabled={btn.disabled}
className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent text-sm font-medium transition-all duration-200 ${btn.color} disabled:opacity-50 disabled:cursor-not-allowed`}
>
{btn.icon}
{btn.text}
</button>
))}
</div>
);
});

const HiddenFileInput = memo(React.forwardRef(({ onFileUpload, onDataRefresh }, ref) => {
const handleFileChange = useCallback(async (event) => {
try {
await onFileUpload(event);
if (onDataRefresh) {
await onDataRefresh();
}
} catch (error) {
console.error('Error during file upload and refresh:', error);
}
}, [onFileUpload, onDataRefresh]);

return (
<input
ref={ref}
type="file"
accept=".xlsx,.xls"
onChange={handleFileChange}
className="hidden"
/>
);
}));

const UploadStatusAlert = memo(({ uploadStatus }) => {
if (!uploadStatus.message) return null;

const alertColor = uploadStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
uploadStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800';

return (
<div className="mt-3">
<div className={`border rounded-lg p-3 ${alertColor}`}>
<div className="text-sm font-medium">
{uploadStatus.message}
</div>
{uploadStatus.progress > 0 && uploadStatus.progress < 100 && (
<div className="mt-2">
<div className="w-full bg-gray-200 rounded-full h-2">
<div 
className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
style={{ width: `${uploadStatus.progress}%` }}
></div>
</div>
</div>
)}
</div>
</div>
);
});

export const ZoneTableHeader = memo(({
onTestApi,
onTriggerUpload,
onBack,
onDataRefresh
}) => {
const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
const {
uploadStatus,
isUploading,
fileInputRef,
handleFileUpload,
testApiConnection,
triggerFileInput
} = useFileUpload(onDataRefresh);

const handleDownloadTemplate = useCallback(async () => {
setIsDownloadingTemplate(true);
try {
const result = downloadZoneTemplate();
showSuccessNotification("Template Downloaded", result.message);
} catch (error) {
showErrorNotification("Download Failed", error.message);
} finally {
setIsDownloadingTemplate(false);
}
}, []);

return (
<div className="bg-blue-50 border border-blue-200 rounded-t-lg p-4">
<div className="flex items-center justify-between">
<h2 className="text-lg font-semibold text-gray-800">Zone Analysis</h2>
<div className="flex gap-2 items-center">
<ActionButtons
isUploading={isUploading}
onTestApi={testApiConnection}
onTriggerUpload={triggerFileInput}
onBack={onBack}
isDownloadingTemplate={isDownloadingTemplate}
onDownloadTemplate={handleDownloadTemplate}
/>
<HiddenFileInput
ref={fileInputRef}
onFileUpload={handleFileUpload}
onDataRefresh={onDataRefresh}
/>
</div>
</div>
<UploadStatusAlert uploadStatus={uploadStatus} />
</div>
);
});

export const SearchBar = memo(({ searchTerm, onSearch, isSearching, totalCount, filteredCount }) => {
const [inputValue, setInputValue] = useState(searchTerm);
const debouncedValue = useDebounce(inputValue, DEBOUNCE_DELAY);

useEffect(() => {
if (debouncedValue !== searchTerm) {
onSearch(debouncedValue);
}
}, [debouncedValue, onSearch, searchTerm]);

const handleInputChange = useCallback((e) => {
setInputValue(e.target.value);
}, []);

const clearSearch = useCallback(() => {
setInputValue('');
onSearch('');
}, [onSearch]);

const displayText = useMemo(() => {
return searchTerm ? `${filteredCount} of ${totalCount} records` : `${totalCount} records`;
}, [searchTerm, filteredCount, totalCount]);

return (
<div className="px-4 py-3 border-b border-gray-300 bg-white">
<div className="flex items-center justify-between gap-4">
<div className="flex-1 relative max-w-md">
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
<input
type="text"
placeholder="Search by hub, driver name, or courier code..."
value={inputValue}
onChange={handleInputChange}
className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
{inputValue && (
<button
onClick={clearSearch}
className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
>
×
</button>
)}
</div>
<div className="flex items-center gap-2">
{isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
<div className="text-sm text-gray-600">
{displayText}
</div>
</div>
</div>
</div>
);
});

export const ZoneTableContent = memo(({ 
data, 
sortConfig, 
onSort, 
totalCount,
filteredCount
}) => {
const [loading, setLoading] = useState(false);

const handleSort = useCallback((headerName) => {
const fieldName = HEADER_FIELD_MAPPING[headerName];
if (onSort && typeof onSort === 'function' && fieldName) {
onSort(fieldName);
}
}, [onSort]);

const getSortIcon = useCallback((headerName) => {
const fieldName = HEADER_FIELD_MAPPING[headerName];
if (sortConfig.key !== fieldName) {
return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
}

return sortConfig.direction === 'asc' 
? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
: <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
}, [sortConfig]);

const duplicateNames = useMemo(() => findDuplicateCourierNames(data), [data]);
const duplicateCodes = useMemo(() => findDuplicateCourierCodes(data), [data]);

const totals = useMemo(() => {
if (!data || !Array.isArray(data)) return null;

return data.reduce((acc, row) => {
acc.zona1 += row.zona1 || 0;
acc.zona2 += row.zona2 || 0;
acc.zona3 += row.zona3 || 0;
acc.zona4 += row.zona4 || 0;
acc.zona5 += row.zona5 || 0;
acc.zona6 += row.zona6 || 0;
acc.totalPacket += row.totalPacket || 0;
acc.fee += row.fee || 0;
acc.heavyPrice += row.heavyPrice || 0;
acc.bonusPacket += row.bonusPacket || 0;
acc.festiveBonus += row.festiveBonus || 0;
acc.afterRekon += row.afterRekon || 0;
acc.addPersonal += row.addPersonal || 0;
acc.incentives += row.incentives || 0;
acc.askorFee += row.askorFee || 0;
acc.totalFee += row.totalFee || 0;
return acc;
}, {
zona1: 0, zona2: 0, zona3: 0, zona4: 0, zona5: 0, zona6: 0,
totalPacket: 0, fee: 0, heavyPrice: 0, bonusPacket: 0,
festiveBonus: 0, afterRekon: 0, addPersonal: 0, incentives: 0,
askorFee: 0, totalFee: 0
});
}, [data]);

if (!data || !Array.isArray(data) || data.length === 0) {
return (
<div className="text-center py-12 bg-white">
<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="text-lg font-medium text-gray-900 mb-2">No Zone Data Available</h3>
<p className="text-gray-600">There are no zone analysis records to display at this time.</p>
</div>
);
}

const getHeaderAlignment = (header) => {
return "justify-center";
};

const getCellAlignment = (header) => {
const leftAlignHeaders = ["Hub", "Courier Name", "Courier Code"];
return leftAlignHeaders.includes(header) ? "text-left" : "text-center";
};

return (
<div className="overflow-x-auto bg-white">
{loading ? (
<div className="flex justify-center items-center h-32">
<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
</div>
) : (
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
{ZONE_TABLE_HEAD.map((head) => {
const colWidth = getColumnDynamicWidth(head, data);
const headerAlignment = getHeaderAlignment(head);

return (
<th
key={head}
className={`px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors ${colWidth}`}
onClick={() => handleSort(head)}
>
<div className={`flex items-center ${headerAlignment}`}>
<span className="truncate">{head}</span>
{getSortIcon(head)}
</div>
</th>
);
})}
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{data.map((row, index) => {
const isDuplicateName = duplicateNames.includes(row.courierName);
const isDuplicateCode = duplicateCodes.includes(row.courierCode);
const nameStyle = isDuplicateName ? getDuplicateNameStyle() : "font-medium text-gray-800";
const codeStyle = isDuplicateCode ? getDuplicateCodeStyle() : "font-medium text-gray-800";

return (
<tr key={`${row.hub}-${row.courierName}-${row.courierCode}-${index}`} className="hover:bg-gray-50 transition-colors">
<td className={`px-4 py-4 text-sm ${getCellAlignment("Hub")} ${getColumnDynamicWidth("Hub", data)}`}>
<div className="font-semibold text-blue-600 truncate" title={row.hub}>
{row.hub || "-"}
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Name")} ${getColumnDynamicWidth("Courier Name", data)}`}>
<div className={`${nameStyle} truncate`} title={row.courierName}>
{row.courierName || "-"}
</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Code")} ${getColumnDynamicWidth("Courier Code", data)}`}>
<div className={`${codeStyle} truncate`} title={row.courierCode}>
{row.courierCode || "-"}
</div>
</td>

{[1, 2, 3, 4, 5, 6].map(zoneNum => (
<td key={`zona-${zoneNum}`} className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth(`Zone ${zoneNum}`, data)}`}>
<div className={`font-bold ${ZONE_COLORS[`ZONA${zoneNum}`]} truncate`} title={row[`zona${zoneNum}`]}>
{row[`zona${zoneNum}`] || 0}
</div>
</td>
))}

<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Packages", data)}`}>
<div className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded truncate" title={row.totalPacket}>
{row.totalPacket || 0}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Base Fee", data)}`}>
<div className="font-semibold text-green-700 truncate" title={formatCurrency(row.fee)}>
{formatCurrency(row.fee)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Heavy Package Fee", data)}`}>
<div className="font-semibold text-purple-600 truncate" title={formatCurrency(row.heavyPrice)}>
{formatCurrency(row.heavyPrice)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Package Bonus", data)}`}>
<div className={`px-2 py-1 rounded truncate ${getPackageBonusStyle(row.bonusPacket || 0)}`} title={formatCurrency(row.bonusPacket)}>
{formatCurrency(row.bonusPacket)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Festive Bonus", data)}`}>
<div className={`px-2 py-1 rounded truncate ${getFestiveBonusStyle(row.festiveBonus || 0)}`} title={formatCurrency(row.festiveBonus)}>
{formatCurrency(row.festiveBonus)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Post-Reconciliation", data)}`}>
<div 
className={`px-2 py-1 rounded truncate ${getAfterRekonStyle(row.afterRekon || 0)}`}
title={`After Rekon: ${formatCurrency(row.afterRekon)}`}
>
{formatCurrency(row.afterRekon)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Additional Personal", data)}`}>
<div className={`px-2 py-1 rounded truncate ${getAddPersonalStyle(row.addPersonal || 0)}`} title={formatCurrency(row.addPersonal)}>
{formatCurrency(row.addPersonal)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Incentives", data)}`}>
<div 
className={`px-2 py-1 rounded truncate ${getIncentivesStyle(row.incentives || 0)}`}
title={`Incentives: ${formatCurrency(row.incentives)}`}
>
{formatCurrency(row.incentives)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Askor Fee", data)}`}>
<div 
className={`px-2 py-1 rounded truncate ${getAskorFeeStyle(row.askorFee || 0)}`}
title={`Askor Fee (Weekly Earnings): Rp ${(row.askorFee || 0).toLocaleString('id-ID')}`}
>
{formatCurrency(row.askorFee)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Fee", data)}`}>
<div className="font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded truncate" title={formatCurrency(row.totalFee)}>
{formatCurrency(row.totalFee)}
</div>
</td>
</tr>
);
})}

{totals && (
<tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
<td className={`px-4 py-4 text-sm ${getCellAlignment("Hub")} ${getColumnDynamicWidth("Hub", data)}`}>
<div className="font-bold text-gray-800">TOTAL</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Name")} ${getColumnDynamicWidth("Courier Name", data)}`}>
<div className="font-bold text-gray-800">{data.length} Drivers</div>
</td>
<td className={`px-4 py-4 text-sm ${getCellAlignment("Courier Code")} ${getColumnDynamicWidth("Courier Code", data)}`}>
<div className="font-bold text-gray-800">-</div>
</td>

{[1, 2, 3, 4, 5, 6].map(zoneNum => (
<td key={`total-zona-${zoneNum}`} className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth(`Zone ${zoneNum}`, data)}`}>
<div className={`font-bold ${ZONE_COLORS[`ZONA${zoneNum}`]}`}>
{totals[`zona${zoneNum}`]}
</div>
</td>
))}

<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Packages", data)}`}>
<div className="font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded">
{totals.totalPacket}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Base Fee", data)}`}>
<div className="font-bold text-green-700">
{formatCurrency(totals.fee)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Heavy Package Fee", data)}`}>
<div className="font-bold text-purple-600">
{formatCurrency(totals.heavyPrice)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Package Bonus", data)}`}>
<div className={`px-2 py-1 rounded font-bold ${getPackageBonusStyle(totals.bonusPacket)}`}>
{formatCurrency(totals.bonusPacket)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Festive Bonus", data)}`}>
<div className={`px-2 py-1 rounded font-bold ${getFestiveBonusStyle(totals.festiveBonus)}`}>
{formatCurrency(totals.festiveBonus)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Post-Reconciliation", data)}`}>
<div className={`font-bold ${totals.afterRekon >= 0 ? 'text-green-600' : 'text-red-600'}`}>
{formatCurrency(totals.afterRekon)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Additional Personal", data)}`}>
<div className="font-bold text-indigo-600">
{formatCurrency(totals.addPersonal)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Incentives", data)}`}>
<div className={`px-2 py-1 rounded font-bold ${getIncentivesStyle(totals.incentives)}`}>
{formatCurrency(totals.incentives)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Askor Fee", data)}`}>
<div className={`px-2 py-1 rounded font-bold ${getAskorFeeStyle(totals.askorFee)}`}>
{formatCurrency(totals.askorFee)}
</div>
</td>
<td className={`px-4 py-4 text-sm text-center ${getColumnDynamicWidth("Total Fee", data)}`}>
<div className="font-bold text-blue-900 bg-blue-200 px-2 py-1 rounded">
{formatCurrency(totals.totalFee)}
</div>
</td>
</tr>
)}
</tbody>
</table>
)}
</div>
);
});

export const ZoneTableFooter = memo(({ data, totals, originalCount, filteredCount, onExportExcel, onPrintReport }) => {
const statsData = useMemo(() => ({
uniqueHubs: getUniqueHubCount(data),
displayCount: filteredCount || (data ? data.length : 0),
totalCount: originalCount || (data ? data.length : 0)
}), [data, originalCount, filteredCount]);

const displayText = useMemo(() => {
return statsData.displayCount !== statsData.totalCount
? `Showing ${statsData.displayCount} of ${statsData.totalCount} drivers from ${statsData.uniqueHubs} HUBs`
: `Total ${statsData.displayCount} driver(s) from ${statsData.uniqueHubs} HUBs`;
}, [statsData]);

const summaryData = useMemo(() => [
{ label: "Total Packages", value: totals?.totalPacket || 0, color: "text-gray-700" },
{ label: "Total Fee", value: totals?.totalFee || 0, color: "text-gray-700" },
{ label: "Total Festive Bonus", value: totals?.festiveBonus || 0, color: "text-green-600" },
{ label: "Total Incentives", value: totals?.incentives || 0, color: "text-pink-600" },
{ label: "Total Askor Fee", value: totals?.askorFee || 0, color: "text-teal-600" }
], [totals]);

return (
<div className="bg-white border-t border-gray-300 px-4 py-4 rounded-b-lg">
<div className="flex justify-between items-start">
<div>
<div className="text-sm text-gray-600 mb-2">
{displayText}
</div>
<div className="grid grid-cols-2 gap-x-4 gap-y-1">
{summaryData.map((item, index) => (
<div key={index} className={`text-sm font-semibold ${item.color}`}>
{item.label}: {formatCurrency(item.value)}
</div>
))}
</div>
</div>
<div className="flex gap-2">
<button 
onClick={onExportExcel}
className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg border border-transparent text-sm font-medium transition-all duration-200"
>
Export Excel
</button>
<button 
onClick={onPrintReport}
className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
>
Print Report
</button>
</div>
</div>
</div>
);
});

export const EmptyState = memo(() => (
<div className="bg-white border border-gray-300 rounded-lg">
<div className="flex justify-center items-center py-12">
<div className="text-center">
<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
<div className="text-sm text-gray-600">
No zone analysis data available
</div>
</div>
</div>
</div>
));

InfoTexts.displayName = 'InfoTexts';
ActionButtons.displayName = 'ActionButtons';
HiddenFileInput.displayName = 'HiddenFileInput';
UploadStatusAlert.displayName = 'UploadStatusAlert';
ZoneTableHeader.displayName = 'ZoneTableHeader';
SearchBar.displayName = 'SearchBar';
ZoneTableContent.displayName = 'ZoneTableContent';
ZoneTableFooter.displayName = 'ZoneTableFooter';
EmptyState.displayName = 'EmptyState';