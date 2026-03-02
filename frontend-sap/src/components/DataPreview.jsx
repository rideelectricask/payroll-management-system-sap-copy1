import React from 'react';

const DataPreview = ({ data, onUpload, isUploading }) => {
if (!data || data.length === 0) return null;

const previewData = data.slice(0, 5);

return (
<div className="bg-white rounded-lg shadow-sm border p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-lg font-semibold">Data Preview</h3>
<span className="text-sm text-gray-600">{data.length} records ready to upload</span>
</div>

<div className="overflow-x-auto mb-4">
<table className="min-w-full text-sm border">
<thead>
<tr className="bg-gray-50">
<th className="px-3 py-2 border text-left">Business</th>
<th className="px-3 py-2 border text-left">Unit</th>
<th className="px-3 py-2 border text-left">Username</th>
<th className="px-3 py-2 border text-left">Full Name</th>
<th className="px-3 py-2 border text-left">Courier ID</th>
<th className="px-3 py-2 border text-left">Hub Location</th>
<th className="px-3 py-2 border text-left">Askor</th>
<th className="px-3 py-2 border text-left">Fee</th>
</tr>
</thead>
<tbody>
{previewData.map((record, index) => (
<tr key={index} className="hover:bg-gray-50">
<td className="px-3 py-2 border">{record.business || '-'}</td>
<td className="px-3 py-2 border">{record.unit || '-'}</td>
<td className="px-3 py-2 border">{record.username}</td>
<td className="px-3 py-2 border">{record.fullName}</td>
<td className="px-3 py-2 border">{record.courierId}</td>
<td className="px-3 py-2 border">{record.hubLocation || '-'}</td>
<td className="px-3 py-2 border">
<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
record.askor === 'TRUE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}`}>
{record.askor}
</span>
</td>
<td className="px-3 py-2 border">
{record.fee && record.fee !== '0' ? `Rp ${Number(record.fee).toLocaleString('id-ID')}` : '-'}
</td>
</tr>
))}
</tbody>
</table>
</div>

{data.length > 5 && (
<p className="text-sm text-gray-600 mb-4">
... and {data.length - 5} more records
</p>
)}

<button
onClick={onUpload}
disabled={isUploading}
className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
>
{isUploading ? (
<>
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
Uploading...
</>
) : (
<>
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
</svg>
Save to Database
</>
)}
</button>
</div>
);
};

export default DataPreview;