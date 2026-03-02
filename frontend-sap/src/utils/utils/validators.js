import { isString } from "lodash";
import { normalize } from "./formatters.js";

export const isInvalidValue = (value) => {
  if (value === null || value === undefined) return true;
  if (isString(value)) {
    const trimmed = value.trim();
    return trimmed === "" || trimmed === "-";
  }
  return false;
};

export const validateHeaders = (headersInFile, requiredHeaders) => {
  const missingHeaders = requiredHeaders.filter(
    required => !headersInFile.some(header => normalize(header) === normalize(required))
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Header tidak sesuai: ${missingHeaders.join(", ")}`);
  }
};

export const validateRequiredData = (headerMap, item, rowIndex, requiredFields) => {
  const errors = [];

  requiredFields.forEach(field => {
    if (isInvalidValue(headerMap.findValue(item, field))) {
      errors.push(`Baris ${rowIndex + 2}: Kolom '${field}' tidak boleh kosong atau berisi '-'`);
    }
  });

  return errors;
};

export const validateTimeFormat = (timeStr) => {
  if (!isString(timeStr)) return false;

  const cleanTime = timeStr.split(" ")[0];
  const [hours, minutes] = cleanTime.split(":").map(Number);

  return !(isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59);
};

export const validateDateRange = (day, month, year) => {
  return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900;
};