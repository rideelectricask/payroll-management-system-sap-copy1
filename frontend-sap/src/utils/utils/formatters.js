import { memoize, isString } from "lodash";

export const normalize = memoize((str) => {
if (!isString(str)) return "";
return str.replace(/\s+/g, ' ').trim().toLowerCase();
});

export const formatLatLong = (lat, long) => {
return (lat && long) ? `${lat}, ${long}` : "";
};

export const formatNumber = (value) => {
return Number(value) || 0;
};

export const formatWeight = (weight) => {
const numericWeight = Number(weight) || 0;
return numericWeight % 1 === 0 ? numericWeight.toString() : numericWeight.toFixed(2);
};