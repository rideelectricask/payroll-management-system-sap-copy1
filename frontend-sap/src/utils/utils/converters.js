import { isNumber, isString } from "lodash";
import { parse, format, isValid } from "date-fns";
import { EXCEL_DATE_OFFSET, MS_PER_DAY } from "../config/constants.js";
import { validateDateRange, validateTimeFormat } from "./validators.js";

export const parseTimeToMinutes = (timeStr) => {
if (!validateTimeFormat(timeStr)) return null;

const cleanTime = timeStr.split(" ")[0];
const [hours, minutes] = cleanTime.split(":").map(Number);

return hours * 60 + minutes;
};

const tryParseDate = (dateStr) => {
const formats = [
'MM/dd/yyyy',
'M/dd/yyyy', 
'MM/d/yyyy',
'M/d/yyyy',
'dd/MM/yyyy',
'd/MM/yyyy',
'dd/M/yyyy',
'd/M/yyyy',
'yyyy-MM-dd',
'yyyy/MM/dd'
];

for (const formatStr of formats) {
try {
const parsed = parse(dateStr, formatStr, new Date());
if (isValid(parsed)) {
return parsed;
}
} catch (error) {
continue;
}
}

try {
const directParse = new Date(dateStr);
if (isValid(directParse) && !isNaN(directParse.getTime())) {
return directParse;
}
} catch (error) {
}

return null;
};

export const convertExcelDate = (excelDate) => {
if (isNumber(excelDate)) {
const jsDate = new Date((excelDate - EXCEL_DATE_OFFSET) * MS_PER_DAY);
return format(jsDate, 'dd/MM/yyyy');
}

if (isString(excelDate)) {
const dateStr = excelDate.trim();

if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
const [day, month, year] = dateStr.split('/').map(Number);
if (validateDateRange(day, month, year)) {
return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
}
}

const parsed = tryParseDate(dateStr);
if (parsed) {
return format(parsed, 'dd/MM/yyyy');
}
}

return "";
};

const tryParseDateTime = (dateStr) => {
const formats = [
'yyyy-MM-dd HH:mm:ss xxx',
'yyyy-MM-dd HH:mm:ss',
'MM/dd/yyyy HH:mm:ss',
'M/dd/yyyy HH:mm:ss',
'dd/MM/yyyy HH:mm:ss',
'd/MM/yyyy HH:mm:ss',
'MM/dd/yyyy H:mm:ss',
'M/dd/yyyy H:mm:ss',
'dd/MM/yyyy H:mm:ss',
'd/MM/yyyy H:mm:ss'
];

for (const formatStr of formats) {
try {
const parsed = parse(dateStr, formatStr, new Date());
if (isValid(parsed)) {
return parsed;
}
} catch (error) {
continue;
}
}

try {
const directParse = new Date(dateStr);
if (isValid(directParse) && !isNaN(directParse.getTime())) {
return directParse;
}
} catch (error) {
}

return null;
};

export const convertDateTimeExcelFormat = (value) => {
if (isNumber(value)) {
const jsDate = new Date((value - EXCEL_DATE_OFFSET) * MS_PER_DAY);
return format(jsDate, 'dd/MM/yyyy HH:mm:ss');
}

if (isString(value)) {
const dateStr = value.trim();

if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$/)) {
const [datePart, timePart] = dateStr.split(' ');
const [day, month, year] = datePart.split('/').map(Number);

if (validateDateRange(day, month, year)) {
const baseDate = new Date(year, month - 1, day);

if (timePart) {
const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
baseDate.setHours(hours, minutes, seconds);
}

return format(baseDate, 'dd/MM/yyyy HH:mm:ss');
}
}

const parsed = tryParseDateTime(dateStr);
if (parsed) {
return format(parsed, 'dd/MM/yyyy HH:mm:ss');
}
}

return "";
};