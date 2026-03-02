import * as XLSX from 'xlsx';

const EXPECTED_HEADERS = [
  'Join Date',
  'Resign Date',
  'ID',
  'Password',
  'Email Iseller',
  'Nama',
  'No KTP',
  'No Telepon',
  'Email',
  'Nama Outlet',
  'Reason',
  'Status',
  'Remark',
  'Motor Pribadi',
  'Client',
  'Tanggal Mundur',
  'Alasan Mundur'
];

export const validateExcelStructure = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            isValid: false,
            errors: ['No sheets found in Excel file'],
            sheetCount: 0
          });
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length === 0) {
          resolve({
            isValid: false,
            errors: ['Excel file is empty'],
            sheetCount: workbook.SheetNames.length
          });
          return;
        }

        const headers = jsonData[0];
        const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          resolve({
            isValid: false,
            errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
            sheetCount: workbook.SheetNames.length
          });
          return;
        }

        resolve({
          isValid: true,
          errors: [],
          sheetCount: workbook.SheetNames.length
        });
      } catch (error) {
        reject(new Error(`Failed to validate Excel structure: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const parseExcelDate = (excelDate) => {
  if (!excelDate) return '';
  
  if (typeof excelDate === 'number') {
    const date = XLSX.SSF.parse_date_code(excelDate);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  if (typeof excelDate === 'string') {
    const trimmedDate = excelDate.trim();
    
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = trimmedDate.match(format);
      if (match) {
        let year, month, day;
        
        if (format === formats[0] || format === formats[1]) {
          month = parseInt(match[1], 10);
          day = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
        } else {
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        }

        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
    
    const possibleDate = new Date(trimmedDate);
    if (!isNaN(possibleDate.getTime())) {
      const year = possibleDate.getFullYear();
      const month = possibleDate.getMonth() + 1;
      const day = possibleDate.getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return trimmedDate;
  }
  
  return '';
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value);
};

export const parseSellerExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const parsedData = jsonData.map((row) => ({
          joinDate: parseExcelDate(row['Join Date']),
          resignDate: parseExcelDate(row['Resign Date']),
          sellerId: normalizeValue(row['ID']),
          password: normalizeValue(row['Password']),
          emailIseller: normalizeValue(row['Email Iseller']),
          nama: normalizeValue(row['Nama']),
          noKtp: normalizeValue(row['No KTP']),
          noTelepon: normalizeValue(row['No Telepon']),
          email: normalizeValue(row['Email']),
          namaOutlet: normalizeValue(row['Nama Outlet']),
          reason: normalizeValue(row['Reason']),
          status: normalizeValue(row['Status']),
          remark: normalizeValue(row['Remark']),
          motorPribadi: normalizeValue(row['Motor Pribadi']),
          client: normalizeValue(row['Client']),
          tanggalMundur: parseExcelDate(row['Tanggal Mundur']),
          alasanMundur: normalizeValue(row['Alasan Mundur'])
        }));

        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};