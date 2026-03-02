import React, { memo, useMemo, useCallback, useState } from 'react';
import { RefreshCw, Download, Database, DollarSign, Building, TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import {
Card,
CardHeader,
Typography,
CardBody,
CardFooter,
Button,
Dialog,
DialogHeader,
DialogBody,
DialogFooter,
Input,
Select,
Option,
} from "@material-tailwind/react";
import ZoneAnalysisTable from './ZoneAnalysisTable';
import PaginationComponent from './PaginationComponent';
import CompareDataSayurbox from './compareDataSayurbox';
import { 
SearchInput, 
ClientSummary, 
ProfitTableContent,
EmptyState,
BulkActionBar,
formatCurrency 
} from './TableComponents';
import { useProfitTable } from '../hooks/useProfitTable';
import { showSuccessNotification, showErrorNotification } from '../utils/notificationService';
import { downloadSayurboxTemplate } from '../services/templateService';

const HeaderInfo = memo(({ 
totalRecords, 
totalClients, 
searchTerm, 
onSearchChange, 
filteredRecords, 
onCompareResult, 
onDataReload, 
onExport,
onDashboardExport,
isDataLoading,
shouldShowTable,
isReloading,
memoizedDataLength
}) => {
const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

const handleDownloadTemplate = useCallback(async () => {
setIsDownloadingTemplate(true);
try {
const result = downloadSayurboxTemplate();
showSuccessNotification("Template Downloaded", result.message);
} catch (error) {
showErrorNotification("Download Failed", error.message);
} finally {
setIsDownloadingTemplate(false);
}
}, []);

return (
<div className="mb-6">
<div className="flex items-center justify-between mb-4">
<div>
<div className="flex items-center gap-3 mb-1">
<Database className="w-6 h-6 text-blue-600" />
<h1 className="text-2xl font-bold text-gray-800">Financial Intelligence</h1>
</div>
<p className="text-gray-600">Fleet & Courier Profit Analytics</p>
</div>
<div className="text-right">
<div className="flex gap-2 justify-end">
<button
onClick={handleDownloadTemplate}
disabled={isDownloadingTemplate}
className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
>
{isDownloadingTemplate ? (
<Loader2 className="animate-spin" size={16} />
) : (
<Download size={16} />
)}
Sayurbox Template
</button>
<CompareDataSayurbox
onCompareResult={onCompareResult}
onDataReload={onDataReload}
disabled={isDataLoading || !memoizedDataLength}
loading={isReloading}
color="orange"
className="flex-shrink-0"
/>
<button 
onClick={onExport}
disabled={isDataLoading || !shouldShowTable}
className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
>
<Download size={16} />
Export
</button>
{onDashboardExport && (
<button 
onClick={onDashboardExport}
disabled={isDataLoading || (!shouldShowTable && !memoizedDataLength)}
className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
>
<BarChart3 size={16} />
Export Dashboard
</button>
)}
</div>
</div>
</div>

<div className="flex-1">
<SearchInput searchTerm={searchTerm} onSearchChange={onSearchChange}/>
</div>
</div>
);
});

const StatisticsCards = memo(({ totals, totalRecords, totalClients, filteredRecords }) => (
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
<div className="flex items-center justify-between">
<div>
<p className="text-blue-700 text-sm font-medium">Total Records</p>
<p className="text-2xl font-bold text-blue-600">
{totalRecords.toLocaleString()}
</p>
</div>
<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
<Database className="w-5 h-5 text-blue-600" />
</div>
</div>
</div>

<div className="bg-green-50 rounded-lg p-4 border border-green-200">
<div className="flex items-center justify-between">
<div>
<p className="text-green-700 text-sm font-medium">Total Profit</p>
<p className="text-2xl font-bold text-green-600">
{formatCurrency(totals.totalProfit)}
</p>
</div>
<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
<DollarSign className="w-5 h-5 text-green-600" />
</div>
</div>
</div>

<div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
<div className="flex items-center justify-between">
<div>
<p className="text-purple-700 text-sm font-medium">Unique Clients</p>
<p className="text-2xl font-bold text-purple-600">
{totalClients.toLocaleString()}
</p>
</div>
<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
<Building className="w-5 h-5 text-purple-600" />
</div>
</div>
</div>

<div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
<div className="flex items-center justify-between">
<div>
<p className="text-orange-700 text-sm font-medium">Selling Price</p>
<p className="text-2xl font-bold text-orange-600">
{formatCurrency(totals.totalSellingPrice)}
</p>
</div>
<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
<TrendingUp className="w-5 h-5 text-orange-600" />
</div>
</div>
</div>
</div>
));

const TableHeader = memo(({ filteredRecords, totalRecords, searchTerm }) => (
<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
<div className="flex items-center justify-between text-sm text-gray-600">
<span>
Menampilkan {filteredRecords.toLocaleString()} dari {totalRecords.toLocaleString()} records
</span>
{filteredRecords !== totalRecords && searchTerm && (
<span className="text-blue-600 font-medium">Filtered</span>
)}
</div>
</div>
));

const FooterSummary = memo(({ totals, onShowChart, onShowZoneAnalysis, onZoneAnalysis, onCourierPerformance }) => (
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
<div className="flex-1">
<Typography variant="small" color="blue-gray" className="font-semibold">
Total Profit: {formatCurrency(totals.totalProfit)}
</Typography>
<div className="flex flex-wrap gap-4 mt-2 text-xs">
<span className="text-blue-600">
Selling: {formatCurrency(totals.totalSellingPrice)}
</span>
<span className="text-red-600">
Cost: {formatCurrency(totals.totalCost)}
</span>
<span className="text-orange-600">
Charges: {formatCurrency(totals.totalAddCharge1 + totals.totalAddCharge2)}
</span>
</div>
</div>
<div className="flex gap-2 flex-wrap">
<Button 
color="green" 
size="sm" 
variant="outlined"
onClick={() => {
if (onZoneAnalysis) {
const matches = onZoneAnalysis();
}
onShowZoneAnalysis();
}}
className="flex items-center gap-2 hover:bg-green-50 transition-colors"
>
📊 Analisis Zona
</Button>
<Button 
color="blue" 
size="sm"
onClick={onShowChart}
className="hover:bg-blue-600 transition-colors"
>
Analisis HUB
</Button>
<Button 
color="purple" 
size="sm" 
variant="outlined"
onClick={onCourierPerformance}
className="flex items-center gap-2 hover:bg-purple-50 transition-colors"
>
🚚 Courier Performance
</Button>
</div>
</div>
));

const EditDialog = memo(({ open, editingRow, onClose, onSave, isUpdating }) => {
const [formData, setFormData] = useState({});

React.useEffect(() => {
if (editingRow) {
setFormData({
"Client Name": editingRow["Client Name"] || "",
"Project Name": editingRow["Project Name"] || "",
"Date": editingRow["Date"] || "",
"Drop Point": editingRow["Drop Point"] || "",
"HUB": editingRow["HUB"] || "",
"Order Code": editingRow["Order Code"] || "",
"Weight": editingRow["Weight"] || "",
"RoundDown": editingRow["RoundDown"] || 0,
"RoundUp": editingRow["RoundUp"] || 0,
"WeightDecimal": editingRow["WeightDecimal"] || 0,
"Distance": editingRow["Distance"] || 0,
"RoundDown Distance": editingRow["RoundDown Distance"] || 0,
"RoundUp Distance": editingRow["RoundUp Distance"] || 0,
"Payment Term": editingRow["Payment Term"] || "",
"Cnee Name": editingRow["Cnee Name"] || "",
"Cnee Address 1": editingRow["Cnee Address 1"] || "",
"Cnee Address 2": editingRow["Cnee Address 2"] || "",
"Cnee Area": editingRow["Cnee Area"] || "",
"lat_long": editingRow["lat_long"] || "",
"Location Expected": editingRow["Location Expected"] || "",
"Additional Notes For Address": editingRow["Additional Notes For Address"] || 0,
"Slot Time": editingRow["Slot Time"] || "",
"Cnee Phone": editingRow["Cnee Phone"] || "",
"Courier Code": editingRow["Courier Code"] || "",
"Courier Name": editingRow["Courier Name"] || "",
"Driver Phone": editingRow["Driver Phone"] || "",
"Receiver": editingRow["Receiver"] || "",
"Recipient Email": editingRow["Recipient Email"] || "",
"Items Name": editingRow["Items Name"] || "",
"Photo Delivery": editingRow["Photo Delivery"] || "",
"Batch": editingRow["Batch"] || "",
"ETA": editingRow["ETA"] || "",
"Receiving Date": editingRow["Receiving Date"] || "",
"Receiving Time": editingRow["Receiving Time"] || "",
"Delivery Start Date": editingRow["Delivery Start Date"] || "",
"Delivery Start Time": editingRow["Delivery Start Time"] || "",
"Pickup Done": editingRow["Pickup Done"] || "",
"DropOff Done": editingRow["DropOff Done"] || "",
"Delivery Start": editingRow["Delivery Start"] || "",
"Add Charge 1": editingRow["Add Charge 1"] || "",
"Delivery Status": editingRow["Delivery Status"] || "",
"Cost": editingRow["Cost"] || 0,
"Add Cost 1": editingRow["Add Cost 1"] || 0,
"Add Cost 2": editingRow["Add Cost 2"] || 0,
"Add Charge 2": editingRow["Add Charge 2"] || 0,
"Selling Price": editingRow["Selling Price"] || 0,
"Zona": editingRow["Zona"] || "",
"Total Pengiriman": editingRow["Total Pengiriman"] || 0,
});
}
}, [editingRow]);

const handleInputChange = (field, value) => {
setFormData(prev => ({
...prev,
[field]: value
}));
};

const handleSave = async () => {
try {
await onSave(formData);
} catch (error) {
console.error('Error saving data:', error);
}
};

if (!editingRow) return null;

return (
<Dialog open={open} handler={onClose} size="xl" className="max-h-[90vh] overflow-y-auto">
<DialogHeader>Edit Data - {editingRow["Order Code"]}</DialogHeader>
<DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<Input
label="Client Name"
value={formData["Client Name"]}
onChange={(e) => handleInputChange("Client Name", e.target.value)}
/>
<Input
label="Project Name"
value={formData["Project Name"]}
onChange={(e) => handleInputChange("Project Name", e.target.value)}
/>
<Input
label="Date"
value={formData["Date"]}
onChange={(e) => handleInputChange("Date", e.target.value)}
/>
<Input
label="Drop Point"
value={formData["Drop Point"]}
onChange={(e) => handleInputChange("Drop Point", e.target.value)}
/>
<Input
label="HUB"
value={formData["HUB"]}
onChange={(e) => handleInputChange("HUB", e.target.value)}
/>
<Input
label="Order Code"
value={formData["Order Code"]}
onChange={(e) => handleInputChange("Order Code", e.target.value)}
readOnly
className="bg-gray-50"
/>
<Input
label="Weight"
value={formData["Weight"]}
onChange={(e) => handleInputChange("Weight", e.target.value)}
/>
<Input
label="Round Down"
type="number"
value={formData["RoundDown"]}
onChange={(e) => handleInputChange("RoundDown", parseFloat(e.target.value) || 0)}
/>
<Input
label="Round Up"
type="number"
value={formData["RoundUp"]}
onChange={(e) => handleInputChange("RoundUp", parseFloat(e.target.value) || 0)}
/>
<Input
label="Weight Decimal"
type="number"
value={formData["WeightDecimal"]}
onChange={(e) => handleInputChange("WeightDecimal", parseFloat(e.target.value) || 0)}
/>
<Input
label="Distance"
type="number"
value={formData["Distance"]}
onChange={(e) => handleInputChange("Distance", parseFloat(e.target.value) || 0)}
/>
<Input
label="Round Down Distance"
type="number"
value={formData["RoundDown Distance"]}
onChange={(e) => handleInputChange("RoundDown Distance", parseFloat(e.target.value) || 0)}
/>
<Input
label="Round Up Distance"
type="number"
value={formData["RoundUp Distance"]}
onChange={(e) => handleInputChange("RoundUp Distance", parseFloat(e.target.value) || 0)}
/>
<Input
label="Payment Term"
value={formData["Payment Term"]}
onChange={(e) => handleInputChange("Payment Term", e.target.value)}
/>
<Input
label="Cnee Name"
value={formData["Cnee Name"]}
onChange={(e) => handleInputChange("Cnee Name", e.target.value)}
/>
<Input
label="Cnee Address 1"
value={formData["Cnee Address 1"]}
onChange={(e) => handleInputChange("Cnee Address 1", e.target.value)}
/>
<Input
label="Cnee Address 2"
value={formData["Cnee Address 2"]}
onChange={(e) => handleInputChange("Cnee Address 2", e.target.value)}
/>
<Input
label="Cnee Area"
value={formData["Cnee Area"]}
onChange={(e) => handleInputChange("Cnee Area", e.target.value)}
/>
<Input
label="Lat Long"
value={formData["lat_long"]}
onChange={(e) => handleInputChange("lat_long", e.target.value)}
/>
<Input
label="Location Expected"
value={formData["Location Expected"]}
onChange={(e) => handleInputChange("Location Expected", e.target.value)}
/>
<Input
label="Additional Notes"
type="number"
value={formData["Additional Notes For Address"]}
onChange={(e) => handleInputChange("Additional Notes For Address", parseInt(e.target.value) || 0)}
/>
<Input
label="Slot Time"
value={formData["Slot Time"]}
onChange={(e) => handleInputChange("Slot Time", e.target.value)}
/>
<Input
label="Cnee Phone"
value={formData["Cnee Phone"]}
onChange={(e) => handleInputChange("Cnee Phone", e.target.value)}
/>
<Input
label="Courier Code"
value={formData["Courier Code"]}
onChange={(e) => handleInputChange("Courier Code", e.target.value)}
/>
<Input
label="Courier Name"
value={formData["Courier Name"]}
onChange={(e) => handleInputChange("Courier Name", e.target.value)}
/>
<Input
label="Driver Phone"
value={formData["Driver Phone"]}
onChange={(e) => handleInputChange("Driver Phone", e.target.value)}
/>
<Input
label="Receiver"
value={formData["Receiver"]}
onChange={(e) => handleInputChange("Receiver", e.target.value)}
/>
<Input
label="Recipient Email"
value={formData["Recipient Email"]}
onChange={(e) => handleInputChange("Recipient Email", e.target.value)}
/>
<Input
label="Items Name"
value={formData["Items Name"]}
onChange={(e) => handleInputChange("Items Name", e.target.value)}
/>
<Input
label="Photo Delivery"
value={formData["Photo Delivery"]}
onChange={(e) => handleInputChange("Photo Delivery", e.target.value)}
/>
<Input
label="Batch"
value={formData["Batch"]}
onChange={(e) => handleInputChange("Batch", e.target.value)}
/>
<Input
label="ETA"
value={formData["ETA"]}
onChange={(e) => handleInputChange("ETA", e.target.value)}
/>
<Input
label="Receiving Date"
value={formData["Receiving Date"]}
onChange={(e) => handleInputChange("Receiving Date", e.target.value)}
/>
<Input
label="Receiving Time"
value={formData["Receiving Time"]}
onChange={(e) => handleInputChange("Receiving Time", e.target.value)}
/>
<Input
label="Delivery Start Date"
value={formData["Delivery Start Date"]}
onChange={(e) => handleInputChange("Delivery Start Date", e.target.value)}
/>
<Input
label="Delivery Start Time"
value={formData["Delivery Start Time"]}
onChange={(e) => handleInputChange("Delivery Start Time", e.target.value)}
/>
<Input
label="Pickup Done"
value={formData["Pickup Done"]}
onChange={(e) => handleInputChange("Pickup Done", e.target.value)}
/>
<Input
label="DropOff Done"
value={formData["DropOff Done"]}
onChange={(e) => handleInputChange("DropOff Done", e.target.value)}
/>
<Input
label="Delivery Start"
value={formData["Delivery Start"]}
onChange={(e) => handleInputChange("Delivery Start", e.target.value)}
/>
<Input
label="Add Charge 1"
value={formData["Add Charge 1"]}
onChange={(e) => handleInputChange("Add Charge 1", e.target.value)}
/>
<Input
label="Cost"
type="number"
value={formData["Cost"]}
onChange={(e) => handleInputChange("Cost", parseFloat(e.target.value) || 0)}
/>
<Input
label="Additional Cost 1"
type="number"
value={formData["Add Cost 1"]}
onChange={(e) => handleInputChange("Add Cost 1", parseFloat(e.target.value) || 0)}
/>
<Input
label="Additional Cost 2"
type="number"
value={formData["Add Cost 2"]}
onChange={(e) => handleInputChange("Add Cost 2", parseFloat(e.target.value) || 0)}
/>
<Input
label="Additional Charge 2"
type="number"
value={formData["Add Charge 2"]}
onChange={(e) => handleInputChange("Add Charge 2", parseFloat(e.target.value) || 0)}
/>
<Input
label="Selling Price"
type="number"
value={formData["Selling Price"]}
onChange={(e) => handleInputChange("Selling Price", parseFloat(e.target.value) || 0)}
/>
<Input
label="Zone"
value={formData["Zona"]}
onChange={(e) => handleInputChange("Zona", e.target.value)}
/>
<Input
label="Total Deliveries"
type="number"
value={formData["Total Pengiriman"]}
onChange={(e) => handleInputChange("Total Pengiriman", parseInt(e.target.value) || 0)}
/>
<div className="w-full">
<Select
label="Delivery Status"
value={formData["Delivery Status"]}
onChange={(value) => handleInputChange("Delivery Status", value)}
>
<Option value="">Select Status</Option>
<Option value="ONTIME">ON TIME</Option>
<Option value="LATE">LATE</Option>
</Select>
</div>
</div>
</DialogBody>
<DialogFooter className="space-x-2">
<Button variant="text" color="red" onClick={onClose} disabled={isUpdating}>
Cancel
</Button>
<Button color="green" onClick={handleSave} loading={isUpdating}>
{isUpdating ? "Saving..." : "Save Changes"}
</Button>
</DialogFooter>
</Dialog>
);
});

const DeleteDialog = memo(({ open, deletingItem, onClose, onConfirm, isDeleting }) => {
const isMultiple = Array.isArray(deletingItem);
const itemCount = isMultiple ? deletingItem.length : 1;
const itemText = isMultiple ? `${itemCount} items` : deletingItem?.["Order Code"] || "this item";

return (
<Dialog open={open} handler={onClose}>
<DialogHeader>Confirm Delete</DialogHeader>
<DialogBody>
<Typography>
Are you sure you want to delete {itemText}? This action cannot be undone.
</Typography>
{isMultiple && (
<div className="mt-4 max-h-40 overflow-y-auto">
<Typography variant="small" className="font-semibold mb-2">
Items to be deleted:
</Typography>
{deletingItem.slice(0, 10).map((item, index) => (
<Typography key={index} variant="small" color="gray" className="ml-2">
• {item["Client Name"]} - {item["Order Code"]}
</Typography>
))}
{deletingItem.length > 10 && (
<Typography variant="small" color="gray" className="ml-2">
... and {deletingItem.length - 10} more items
</Typography>
)}
</div>
)}
</DialogBody>
<DialogFooter className="space-x-2">
<Button variant="text" color="blue-gray" onClick={onClose} disabled={isDeleting}>
Cancel
</Button>
<Button color="red" onClick={onConfirm} loading={isDeleting}>
{isDeleting ? "Deleting..." : "Delete"}
</Button>
</DialogFooter>
</Dialog>
);
});

const ProfitTable = ({ 
groupedData, 
onShowChart, 
onZoneAnalysis, 
onCourierPerformance, 
matchedBonusData,
onCompareResult,
onDataReload,
onExport,
onDashboardExport,
isDataLoading,
shouldShowTable,
isReloading,
memoizedDataLength
}) => {
const {
showZoneAnalysis,
zoneAnalysisData,
searchTerm,
sortConfig,
sortedData,
clientSummary,
totals,
paginationData,
selectedItems,
editDialogOpen,
editingRow,
deleteDialogOpen,
deletingItem,
isUpdating,
isDeleting,
handleSort,
handleShowZoneAnalysis,
handleBackToProfit,
handlePageChange,
handleItemsPerPageChange,
handleSearchChange,
handleZoneDataUpdate,
handleItemSelect,
handleSelectAll,
handleDeselectAll,
handleEdit,
handleDelete,
handleBulkDelete,
handleEditSave,
handleEditClose,
handleDeleteConfirm,
handleDeleteClose
} = useProfitTable(groupedData);

const memoizedClientSummary = useMemo(() => clientSummary, [clientSummary]);
const memoizedTotals = useMemo(() => totals, [totals]);

const optimizedSearchChange = useCallback((value) => {
handleSearchChange(value);
}, [handleSearchChange]);

if (showZoneAnalysis) {
return (
<ZoneAnalysisTable 
zoneData={zoneAnalysisData} 
onBack={handleBackToProfit}
onDataUpdate={handleZoneDataUpdate}
matchedBonusData={matchedBonusData}
/>
);
}

if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) {
return (
<div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
<div className="text-center py-12">
<EmptyState message="No profit data available" />
</div>
</div>
);
}

const { currentData, startIndex, totalItems, totalPages } = paginationData;

return (
<div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
<HeaderInfo
totalRecords={sortedData.length}
totalClients={Object.keys(memoizedClientSummary).length}
searchTerm={searchTerm}
onSearchChange={optimizedSearchChange}
filteredRecords={sortedData.length}
onCompareResult={onCompareResult}
onDataReload={onDataReload}
onExport={onExport}
onDashboardExport={onDashboardExport}
isDataLoading={isDataLoading}
shouldShowTable={shouldShowTable}
isReloading={isReloading}
memoizedDataLength={memoizedDataLength}
/>

<StatisticsCards
totals={memoizedTotals}
totalRecords={sortedData.length}
totalClients={Object.keys(memoizedClientSummary).length}
filteredRecords={sortedData.length}
/>

<div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
<TableHeader
filteredRecords={sortedData.length}
totalRecords={groupedData.length}
searchTerm={searchTerm}
/>

<div className="overflow-hidden">
<BulkActionBar
selectedItems={selectedItems}
onBulkDelete={handleBulkDelete}
onSelectAll={handleSelectAll}
onDeselectAll={handleDeselectAll}
totalItems={currentData.length}
/>
<ProfitTableContent
data={currentData}
sortConfig={sortConfig}
onSort={handleSort}
startIndex={startIndex}
selectedItems={selectedItems}
onItemSelect={handleItemSelect}
onEdit={handleEdit}
onDelete={handleDelete}
onSelectAll={handleSelectAll}
onDeselectAll={handleDeselectAll}
currentPage={paginationData.currentPage || 1}
itemsPerPage={paginationData.itemsPerPage || 20}
/>
</div>

{totalItems > 0 && (
<PaginationComponent
currentPage={paginationData.currentPage || 1}
totalPages={totalPages}
onPageChange={handlePageChange}
itemsPerPage={paginationData.itemsPerPage || 20}
totalItems={totalItems}
onItemsPerPageChange={handleItemsPerPageChange}
/>
)}
</div>

<div className="mt-6">
<FooterSummary
totals={memoizedTotals}
onShowChart={onShowChart}
onShowZoneAnalysis={handleShowZoneAnalysis}
onZoneAnalysis={onZoneAnalysis}
onCourierPerformance={onCourierPerformance}
/>
</div>

<EditDialog
open={editDialogOpen}
editingRow={editingRow}
onClose={handleEditClose}
onSave={handleEditSave}
isUpdating={isUpdating}
/>

<DeleteDialog
open={deleteDialogOpen}
deletingItem={deletingItem}
onClose={handleDeleteClose}
onConfirm={handleDeleteConfirm}
isDeleting={isDeleting}
/>
</div>
);
};

HeaderInfo.displayName = 'HeaderInfo';
StatisticsCards.displayName = 'StatisticsCards';
TableHeader.displayName = 'TableHeader';
FooterSummary.displayName = 'FooterSummary';
EditDialog.displayName = 'EditDialog';
DeleteDialog.displayName = 'DeleteDialog';

export default memo(ProfitTable);