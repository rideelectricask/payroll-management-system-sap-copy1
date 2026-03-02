const dateCache = new Map();

export const parseDate = (dateStr) => {
if (dateCache.has(dateStr)) {
return dateCache.get(dateStr);
}

const parts = dateStr.split('/');
if (parts.length === 3) {
const day = parseInt(parts[0], 10);
const month = parseInt(parts[1], 10);
const year = parseInt(parts[2], 10);
const date = new Date(year, month - 1, day);
dateCache.set(dateStr, date);
return date;
}

const date = new Date(dateStr);
dateCache.set(dateStr, date);
return date;
};

export const parseDateTime = (dateTimeStr) => {
if (!dateTimeStr || typeof dateTimeStr !== 'string') return null;

const cacheKey = dateTimeStr;
if (dateCache.has(cacheKey)) {
return dateCache.get(cacheKey);
}

const cleaned = dateTimeStr.toString().trim();
const parts = cleaned.split(' ');
if (parts.length < 2) return null;

const datePart = parts[0];
const timePart = parts[1];

const dateComponents = datePart.split('/');
if (dateComponents.length !== 3) return null;

const timeComponents = timePart.split(':');
if (timeComponents.length < 2) return null;

const day = parseInt(dateComponents[0], 10);
const month = parseInt(dateComponents[1], 10);
const year = parseInt(dateComponents[2], 10);
const hour = parseInt(timeComponents[0], 10);
const minute = parseInt(timeComponents[1], 10);
const second = timeComponents.length >= 3 ? parseInt(timeComponents[2], 10) : 0;

if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute) || isNaN(second)) {
return null;
}

const date = new Date(year, month - 1, day, hour, minute, second);
dateCache.set(cacheKey, date);
return date;
};

export const sortDates = (dates) => {
return [...dates].sort((a, b) => {
const dateA = parseDate(a);
const dateB = parseDate(b);
return dateA.getTime() - dateB.getTime();
});
};

export const getDynamicCourierTableHead = (uniqueDates = []) => {
const sortedDates = sortDates(uniqueDates);
const baseHeaders = [
"HUB",
"Courier Code", 
"Courier Name",
"Total Deliveries",
"On-Time Deliveries",
"Late Deliveries", 
"On-Time %",
"Late %",
"Delivery Ratio",
"Total Distance",
"Total Fee",
"Total Revenue",
"Total Gross Profit",
"Top Performer"
];

const dateHeaders = sortedDates.map(date => `${date} (Deliveries-Weight-Distance-Duration)`);
return [...baseHeaders, ...dateHeaders, "Avg All Metrics"];
};