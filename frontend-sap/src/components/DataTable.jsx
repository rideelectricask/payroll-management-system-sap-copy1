import React from 'react';
import {
Card,
CardHeader,
Input,
Typography,
CardBody,
CardFooter,
Button,
} from "@material-tailwind/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";

const TABLE_HEAD = [
"Client Name", "Batch", "Date", "HUB", "Order Code", "Weight", "Distance", "Cnee Name", "Cnee Address 1",
"Cnee Address 2", "Cnee Area", "Location", "Cnee Phone", "Slot Time", "ETA", "Courier Code", "Courier Name",
"Receiver", "Receiving Date", "Receiving Time", "DropOff Done", "Delivery Status"
];

const getDeliveryStatusColor = (status) => {
const colorMap = {
"ONTIME": "text-green-600",
"DELAY": "text-red-600",
"EARLY": "text-blue-600"
};
return colorMap[status] || "text-blue-gray-600";
};

const DataTable = ({
searchTerm = "",
setSearchTerm,
data = [],
currentPage = 1,
setCurrentPage,
totalPages = 1,
handleSort,
getCourierNameForDisplay,
getLocationForDisplay,
loading = false,
tableHead = TABLE_HEAD
}) => {
const safeData = Array.isArray(data) ? data : [];

if (loading) {
return (
<Card>
<CardBody className="flex justify-center items-center py-20">
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
<Typography className="ml-4" variant="small" color="gray">
Loading data...
</Typography>
</CardBody>
</Card>
);
}

return (
<Card>
<CardHeader floated={false} shadow={false} className="rounded-none">
<div className="mb-4 flex items-center justify-between gap-8">
<div>
<Typography variant="h5" color="blue-gray">
Data Table
</Typography>
<Typography color="gray" className="mt-1 font-normal">
See information about all deliveries ({safeData.length} items)
</Typography>
</div>
<div className="w-full md:w-72">
<Input
label="Search"
value={searchTerm}
onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
icon={<i className="fas fa-search" />}
/>
</div>
</div>
</CardHeader>

<CardBody className="overflow-scroll px-0">
<table className="w-full min-w-max table-auto text-left">
<thead>
<tr>
{tableHead.map((head) => (
<th
key={head}
onClick={() => handleSort && handleSort(head)}
className={`border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 transition-colors hover:bg-blue-gray-50 ${
handleSort ? 'cursor-pointer' : ''
}`}
>
<Typography
variant="small"
color="blue-gray"
className="flex items-center justify-between leading-none opacity-70"
>
{head}
{handleSort && <ChevronUpDownIcon strokeWidth={2} className="h-4 w-4" />}
</Typography>
</th>
))}
</tr>
</thead>
<tbody>
{safeData.length === 0 ? (
<tr>
<td colSpan={tableHead.length} className="p-4 text-center">
<Typography variant="small" color="blue-gray" className="font-normal">
No data found
</Typography>
</td>
</tr>
) : (
safeData.map((row, idx) => {
const isLast = idx === safeData.length - 1;
const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

return (
<tr key={idx} className="hover:bg-blue-gray-50/50 transition-colors">
{tableHead.map((key) => {
let cellValue = "";
let cellClass = "font-normal";

if (key === "Courier Name") {
cellValue = getCourierNameForDisplay ? getCourierNameForDisplay(row) : (row["Courier Name"] || "");
} else if (key === "Location") {
cellValue = getLocationForDisplay ? getLocationForDisplay(row) : (row["Location"] || "");
} else if (key === "Delivery Status") {
cellValue = (row && row[key]) ? row[key] : "";
cellClass = `font-semibold ${getDeliveryStatusColor(cellValue)}`;
} else {
cellValue = (row && row[key]) ? row[key] : "";
}

return (
<td key={key} className={classes}>
<Typography variant="small" color="blue-gray" className={cellClass}>
{cellValue}
</Typography>
</td>
);
})}
</tr>
);
})
)}
</tbody>
</table>
</CardBody>

<CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
<Typography variant="small" color="blue-gray" className="font-normal">
Page {currentPage} of {totalPages}
</Typography>
<div className="flex gap-2">
<Button
variant="outlined"
size="sm"
disabled={currentPage === 1}
onClick={() => setCurrentPage && setCurrentPage((p) => Math.max(p - 1, 1))}
>
Previous
</Button>
<Button
variant="outlined"
size="sm"
disabled={currentPage === totalPages}
onClick={() => setCurrentPage && setCurrentPage((p) => Math.min(p + 1, totalPages))}
>
Next
</Button>
</div>
</CardFooter>
</Card>
);
};

export default React.memo(DataTable);