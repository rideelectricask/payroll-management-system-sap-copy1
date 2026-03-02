import { apiCall } from './api.js';

export const updateDataFromServer = async (updatePayload) => {
try {
if (!updatePayload) {
throw new Error('Update payload is required');
}

const payloadArray = Array.isArray(updatePayload) ? updatePayload : [updatePayload];
console.log('Updating data on server...', payloadArray);

const formattedPayload = payloadArray.map(item => {
if (!item.clientName || !item.orderCode || !item.updateData) {
throw new Error('Missing required fields: clientName, orderCode, or updateData');
}

return {
clientName: String(item.clientName).trim(),
orderCode: String(item.orderCode).trim(),
updateData: item.updateData
};
});

console.log('Formatted payload for API:', formattedPayload);

const result = await apiCall('/replace', {
method: 'post',
data: formattedPayload,
timeout: 60000,
headers: {
'Content-Type': 'application/json',
}
});

console.log('API response:', result);

if (result && result.summary && result.summary.success) {
console.log(`Data updated successfully: ${formattedPayload.length} records`);
return {
success: true,
message: result?.message || 'Data berhasil diupdate',
count: formattedPayload.length,
updatedRecords: result.updatedRecords || [],
...result
};
} else {
throw new Error(`Update operation failed: ${result?.message || 'Unknown error'}`);
}

} catch (error) {
console.error('Update data failed:', error);
throw new Error(`Gagal mengupdate data: ${error.response?.data?.message || error.message}`);
}
};

export const deleteDataFromServer = async (deletePayload) => {
try {
if (!Array.isArray(deletePayload) || deletePayload.length === 0) {
throw new Error('Delete payload is empty or invalid');
}

const validPayload = deletePayload.filter(item => 
item && 
item.clientName && 
item.orderCode && 
item.clientName.trim() !== '' && 
item.orderCode.trim() !== ''
);

if (validPayload.length === 0) {
throw new Error('No valid items found in delete payload');
}

console.log('Deleting data from server...', { 
total: deletePayload.length,
valid: validPayload.length,
invalid: deletePayload.length - validPayload.length
});

const formattedPayload = validPayload.map(item => ({
clientName: item.clientName || item["Client Name"],
orderCode: item.orderCode || item["Order Code"]
}));

const result = await apiCall('/delete', {
method: 'post',
data: formattedPayload,
timeout: 60000,
headers: {
'Content-Type': 'application/json',
}
});

if (result && result.summary && result.summary.success) {
console.log(`Data deleted successfully: ${formattedPayload.length} records`);
return {
success: true,
message: result?.message || 'Data berhasil dihapus',
count: formattedPayload.length,
deletedRecords: result.deletedRecords || [],
...result
};
} else {
throw new Error(`Delete operation failed: ${result?.message || 'Unknown error'}`);
}

} catch (error) {
console.error('Delete data failed:', error);
throw new Error(`Gagal menghapus data: ${error.response?.data?.message || error.message}`);
}
};