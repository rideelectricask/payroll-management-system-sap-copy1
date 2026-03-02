import * as XLSX from "xlsx";

const HEADER_MAPPINGS = {
  mitraId: ['mitra_id', 'mitraid', 'mitra id', 'id'],
  username: ['username', 'user name', 'user_name'],
  fullName: ['full_name', 'fullname', 'full name', 'name', 'nama'],
  phoneNumber: ['phone_number', 'phonenumber', 'phone number', 'phone', 'no hp', 'no_hp', 'nohp'],
  unitName: ['unit_name', 'unitname', 'unit name', 'unit'],
  assistantCoordinator: ['assistant_coordinator', 'assistantcoordinator', 'assistant coordinator', 'askor'],
  commissionFee: ['commission_fee', 'commissionfee', 'commission fee', 'fee', 'komisi'],
  mitraStatus: ['mitra_status', 'mitrastatus', 'mitra status', 'status'],
  city: ['city', 'kota', 'lokasi'],
  attendance: ['attendance', 'kehadiran', 'absensi'],
  otp: ['otp', 'kode otp'],
  bankInfoProvided: ['bank_info_provided', 'bankinfoprovided', 'bank info provided', 'bank info', 'info bank'],
  appVersion: ['app_version', 'appversion', 'app version', 'version'],
  appVersionCode: ['app_version_code', 'appversioncode', 'app version code', 'version code'],
  appApiVersion: ['app_api_version', 'appapiversion', 'app api version', 'api version'],
  androidVersion: ['android_version', 'androidversion', 'android version', 'android'],
  lastActive: ['last_active', 'lastactive', 'last active', 'terakhir aktif'],
  createdAt: ['created_at', 'createdat', 'created at', 'dibuat'],
  registeredAt: ['registered_at', 'registeredat', 'registered at', 'terdaftar'],
  hubCategory: ['hub_category', 'hubcategory', 'hub category', 'kategori hub'],
  businessCategory: ['business_category', 'businesscategory', 'business category', 'kategori bisnis']
};

const normalizeValue = (value, field) => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value).trim();

  if (stringValue.toLowerCase() === 'null' || stringValue === '') {
    return '';
  }

  switch (field) {
    case 'phoneNumber':
      const cleaned = stringValue.replace(/[^\d]/g, '');
      if (!cleaned) return '';
      if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
      if (cleaned.startsWith('62')) return cleaned;
      return '62' + cleaned;
    case 'assistantCoordinator':
      const lowerValue = stringValue.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') return 'TRUE';
      if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') return 'FALSE';
      return stringValue;
    case 'commissionFee':
      const numericValue = stringValue.replace(/[^\d]/g, '');
      return numericValue || '';
    case 'mitraStatus':
      const status = stringValue.toLowerCase();
      if (status === 'active' || status === 'aktif') return 'Active';
      if (status === 'inactive' || status === 'tidak aktif') return 'Inactive';
      return stringValue;
    case 'bankInfoProvided':
      const bankInfo = stringValue.toLowerCase();
      if (bankInfo === 'yes' || bankInfo === 'ya' || bankInfo === 'true' || bankInfo === '1') return 'Yes';
      if (bankInfo === 'no' || bankInfo === 'tidak' || bankInfo === 'false' || bankInfo === '0') return 'No';
      return stringValue;
    case 'attendance':
      const attend = stringValue.toLowerCase();
      if (attend === 'online') return 'Online';
      if (attend === 'offline') return 'Offline';
      return stringValue;
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

  if (!record.phoneNumber || record.phoneNumber.trim().length === 0) {
    errors.push(`Row ${index + 2}: PHONE NUMBER is required`);
  } else if (record.phoneNumber.length > 15) {
    errors.push(`Row ${index + 2}: PHONE NUMBER must not exceed 15 digits`);
  }

  return errors;
};

export const parseMitraExcelFile = async (file) => {
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
      } else if (field === 'phoneNumber') {
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
        mitraId: getValue('mitraId', 'mitraId'),
        username: getValue('username', 'username'),
        fullName: getValue('fullName', 'fullName'),
        phoneNumber: normalizeValue(row[headerMap.phoneNumber], 'phoneNumber'),
        unitName: getValue('unitName', 'unitName'),
        assistantCoordinator: getValue('assistantCoordinator', 'assistantCoordinator'),
        commissionFee: getValue('commissionFee', 'commissionFee'),
        mitraStatus: getValue('mitraStatus', 'mitraStatus'),
        city: getValue('city', 'city'),
        attendance: getValue('attendance', 'attendance'),
        otp: getValue('otp', 'otp'),
        bankInfoProvided: getValue('bankInfoProvided', 'bankInfoProvided'),
        appVersion: getValue('appVersion', 'appVersion'),
        appVersionCode: getValue('appVersionCode', 'appVersionCode'),
        appApiVersion: getValue('appApiVersion', 'appApiVersion'),
        androidVersion: getValue('androidVersion', 'androidVersion'),
        lastActive: getValue('lastActive', 'lastActive'),
        createdAt: getValue('createdAt', 'createdAt'),
        registeredAt: getValue('registeredAt', 'registeredAt'),
        hubCategory: getValue('hubCategory', 'hubCategory'),
        businessCategory: getValue('businessCategory', 'businessCategory')
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
        `Please ensure all required fields (Phone Number) are filled correctly.`;

      throw new Error(errorMessage);
    }

    if (processedData.length === 0) {
      throw new Error("Tidak ada data valid yang dapat diproses");
    }

    console.log(`✅ Successfully processed ${processedData.length} mitra records`);

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