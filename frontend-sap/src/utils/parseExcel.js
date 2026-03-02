import * as XLSX from "xlsx";
import { REQUIRED_HEADERS, REQUIRED_REPLACE_HEADERS } from "./config/constants.js";
import { validateHeaders, validateRequiredData } from "./utils/validators.js";
import { HeaderMapper } from "./mappers/headerMapper.js";
import { DataProcessor } from "./processors/dataProcessor";

class ExcelParser {
constructor() {
this.workbookOptions = { 
cellDates: true, 
cellNF: false, 
cellText: false,
dense: true
};
}

async _readExcelFile(file) {
try {
const buffer = await file.arrayBuffer();
const workbook = XLSX.read(buffer, this.workbookOptions);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

if (jsonData.length === 0) {
throw new Error("File Excel kosong!");
}

return { jsonData, headers: Object.keys(jsonData[0]) };
} catch (error) {
throw new Error(`Error reading Excel file: ${error.message}`);
}
}

_validateDuplicates(jsonData, headerMap) {
const orderCodeOccurrences = new Map();

for (let index = 0; index < jsonData.length; index++) {
const item = jsonData[index];
const orderCode = headerMap.getValue(item, "Merchant Order ID");

if (orderCode && orderCode.toString().trim()) {
const trimmedOrderCode = orderCode.toString().trim();
const excelRowNumber = index + 2;

if (!orderCodeOccurrences.has(trimmedOrderCode)) {
orderCodeOccurrences.set(trimmedOrderCode, []);
}
orderCodeOccurrences.get(trimmedOrderCode).push(excelRowNumber);
}
}

const duplicateGroups = new Map();
for (const [orderCode, rows] of orderCodeOccurrences) {
if (rows.length > 1) {
duplicateGroups.set(orderCode, rows);
}
}

if (duplicateGroups.size > 0) {
const duplicateDetails = [];
const duplicateSummary = [];
let totalDuplicateRows = 0;

for (const [orderCode, rows] of duplicateGroups) {
const duplicateCount = rows.length - 1;
totalDuplicateRows += duplicateCount;

duplicateDetails.push(`Order Code '${orderCode}' ditemukan pada baris: ${rows.join(', ')}`);
duplicateSummary.push(`'${orderCode}' (${rows.length} kali)`);
}

const summaryMessage = `${totalDuplicateRows} duplikasi Order Code ditemukan dari ${duplicateGroups.size} Order Code berbeda`;
const detailMessage = duplicateDetails.join('\n');
const quickSummary = `Order Code yang duplikat: ${duplicateSummary.join(', ')}`;

throw new Error(`${summaryMessage}\n\n${quickSummary}\n\nDetail lengkap:\n${detailMessage}`);
}
}

async _processData(jsonData, headerMap, processor, requiredFields) {
const validationErrors = [];
const validData = [];

for (let index = 0; index < jsonData.length; index++) {
const item = jsonData[index];

try {
const rowErrors = validateRequiredData(headerMap, item, index, requiredFields);

if (rowErrors.length > 0) {
validationErrors.push(...rowErrors);
continue;
}

const processedData = processor(item);
validData.push(processedData);
} catch (error) {
validationErrors.push(`Baris ${index + 2}: Error processing data - ${error.message}`);
}
}

if (validationErrors.length > 0) {
throw new Error(`${validationErrors.length} baris data tidak valid:\n${validationErrors.join('\n')}`);
}

return validData;
}

async parseExcelFile(file) {
try {
const { jsonData, headers } = await this._readExcelFile(file);
validateHeaders(headers, REQUIRED_HEADERS);

const headerMap = new HeaderMapper(headers);

this._validateDuplicates(jsonData, headerMap);
const dataProcessor = new DataProcessor(headerMap);

return await this._processData(
jsonData, 
headerMap, 
(item) => dataProcessor.processRowData(item),
REQUIRED_HEADERS
);
} catch (error) {
throw new Error(`Error parsing Excel file: ${error.message}`);
}
}

async parseReplaceExcelFile(file) {
try {
const { jsonData, headers } = await this._readExcelFile(file);
validateHeaders(headers, REQUIRED_REPLACE_HEADERS);

const headerMap = new HeaderMapper(headers);
this._validateDuplicates(jsonData, headerMap);
const dataProcessor = new DataProcessor(headerMap);

return await this._processData(
jsonData, 
headerMap, 
(item) => dataProcessor.processReplaceRowData(item),
REQUIRED_REPLACE_HEADERS
);
} catch (error) {
throw new Error(`Error parsing replace Excel file: ${error.message}`);
}
}
}

const excelParser = new ExcelParser();

export const parseExcelFile = (file) => excelParser.parseExcelFile(file);
export const parseReplaceExcelFile = (file) => excelParser.parseReplaceExcelFile(file);

export { REQUIRED_HEADERS as requiredHeaders, REQUIRED_REPLACE_HEADERS as requiredReplaceHeaders } from "./config/constants.js";