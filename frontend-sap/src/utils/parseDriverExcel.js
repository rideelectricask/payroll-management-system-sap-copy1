import * as XLSX from "xlsx";

const HEADER_MAPPINGS = {
  username: ['username', 'rider username', 'Username', 'Rider Username'],
  unit: ['unit', 'Unit', 'UNIT'],
  fullName: ['fullname', 'full name', 'rider full name', 'Full Name', 'Rider Full Name', 'fullName'],
  courierId: ['courierid', 'courier id', 'Courier ID', 'courierId'],
  hubLocation: ['hublocation', 'hub location', 'Hub Location', 'hubLocation'],
  askor: ['askor', 'Askor', 'ASKOR'],
  fee: ['fee', 'Fee', 'FEE'],
  business: ['business', 'Business', 'BUSINESS']
};

const normalizeValue = (value, field) => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value).trim();

  if (stringValue.toLowerCase() === 'null' || stringValue === '') {
    return '';
  }

  switch (field) {
    case 'courierId':
      return stringValue.replace(/[^\d]/g, '');
    case 'askor':
      if (stringValue.toLowerCase() === 'true' || stringValue === '1') return 'TRUE';
      if (stringValue.toLowerCase() === 'false' || stringValue === '0') return 'FALSE';
      return stringValue.toUpperCase();
    case 'fee':
      const cleanFee = stringValue.replace(/[^\d.-]/g, '');
      return cleanFee || '0';
    case 'unit':
      return stringValue.toUpperCase();
    default:
      return stringValue;
  }
};

const findHeaderMapping = (headers, fieldMappings) => {
  for (const mapping of fieldMappings) {
    const found = headers.find(header => 
      header.toLowerCase().trim() === mapping.toLowerCase().trim()
    );
    if (found) return found;
  }
  return null;
};

const validateRecord = (record, index) => {
  const errors = [];
  const hasUsername = record.username && record.username.trim().length > 0;
  const hasFullName = record.fullName && record.fullName.trim().length > 0;
  const hasCourierId = record.courierId && record.courierId.trim().length > 0;

  if (!hasUsername && !hasFullName && !hasCourierId) {
    errors.push(`Row ${index + 2}: At least one of USERNAME, FULLNAME, or COURIER ID must have a value`);
  }

  return errors;
};

export const parseDriverExcelFile = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      throw new Error("File harus berformat Excel (.xlsx atau .xls)");
    }

    if (file.size === 0) {
      throw new Error("File Excel kosong atau rusak");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File terlalu besar. Maksimal 10MB");
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    if (!workbook.SheetNames.length) {
      throw new Error("File Excel tidak memiliki sheet");
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error("Sheet Excel tidak dapat dibaca");
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    if (jsonData.length === 0) {
      throw new Error("File Excel kosong atau tidak memiliki data");
    }

    if (jsonData.length < 2) {
      throw new Error("File Excel harus memiliki minimal header dan 1 baris data");
    }

    const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
    const dataRows = jsonData.slice(1).filter(row => 
      row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (headers.length === 0) {
      throw new Error("Header tidak ditemukan dalam file Excel");
    }

    if (dataRows.length === 0) {
      throw new Error("Tidak ada data yang valid ditemukan dalam file Excel");
    }

    const headerMap = {};
    const mappingErrors = [];

    for (const [field, mappings] of Object.entries(HEADER_MAPPINGS)) {
      const foundHeader = findHeaderMapping(headers, mappings);
      if (foundHeader) {
        headerMap[field] = headers.indexOf(foundHeader);
      } else if (['username', 'fullName', 'courierId'].includes(field)) {
        mappingErrors.push(`Header untuk field '${field}' tidak ditemukan. Expected: ${mappings.join(', ')}`);
      }
    }

    if (mappingErrors.length > 0) {
      throw new Error(`Header mapping errors:\n${mappingErrors.join('\n')}\n\nHeaders available: ${headers.join(', ')}`);
    }

    const processedData = [];
    const validationErrors = [];
    const invalidRows = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      const getValue = (fieldKey, field) => {
        if (headerMap[fieldKey] === undefined) return '';
        const rawValue = row[headerMap[fieldKey]];
        return normalizeValue(rawValue, field);
      };

      const record = {
        unit: getValue('unit', 'unit'),
        username: normalizeValue(row[headerMap.username], 'username'),
        fullName: normalizeValue(row[headerMap.fullName], 'fullName'),
        courierId: normalizeValue(row[headerMap.courierId], 'courierId'),
        hubLocation: getValue('hubLocation', 'hubLocation'),
        askor: headerMap.askor !== undefined ? normalizeValue(row[headerMap.askor], 'askor') : 'FALSE',
        fee: headerMap.fee !== undefined ? normalizeValue(row[headerMap.fee], 'fee') : '0',
        business: getValue('business', 'business')
      };

      const recordErrors = validateRecord(record, i);
      if (recordErrors.length > 0) {
        validationErrors.push(...recordErrors);
        invalidRows.push(i + 2);
      } else {
        processedData.push(record);
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = `Found ${validationErrors.length} invalid records that need to be fixed:\n\n` +
        `Rows: ${invalidRows.join(', ')}\n\n` +
        `Details:\n${validationErrors.join('\n')}\n\n` +
        `Please ensure at least one of USERNAME, FULLNAME, or COURIER ID has a value in each row.`;
      
      throw new Error(errorMessage);
    }

    if (processedData.length === 0) {
      throw new Error("Tidak ada data valid yang dapat diproses");
    }

    console.log(`✅ Successfully processed ${processedData.length} driver records`);

    return processedData;

  } catch (error) {
    console.error("❌ Excel parsing error:", error);
    throw new Error(`Gagal memproses file Excel: ${error.message}`);
  }
};

export const validateExcelStructure = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { bookSheets: true });

    const info = {
      isValid: true,
      sheetCount: workbook.SheetNames.length,
      sheets: workbook.SheetNames,
      errors: []
    };

    if (info.sheetCount === 0) {
      info.isValid = false;
      info.errors.push("No sheets found in Excel file");
    }

    return info;
  } catch (error) {
    return {
      isValid: false,
      sheetCount: 0,
      sheets: [],
      errors: [error.message]
    };
  }
};