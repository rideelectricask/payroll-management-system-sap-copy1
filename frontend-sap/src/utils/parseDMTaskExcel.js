import * as XLSX from 'xlsx';

const COLUMN_MAPPING = {
  'user': ['user', 'User', 'USER'],
  'fullName': ['full_name', 'Full Name', 'fullName', 'FULL NAME', 'Nama Lengkap'],
  'date': ['date', 'Date', 'DATE', 'Tanggal'],
  'phoneNumber': ['phone_number', 'Phone Number', 'phoneNumber', 'PHONE NUMBER', 'No Telepon', 'Nomor Telepon'],
  'domicile': ['domicile', 'Domicile', 'DOMICILE', 'Domisili'],
  'city': ['city', 'City', 'CITY', 'Kota'],
  'project': ['project', 'Project', 'PROJECT', 'Proyek'],
  'replyRecord': ['reply_record', 'Reply Record', 'replyRecord', 'REPLY RECORD'],
  'finalStatus': ['final_status', 'Final Status', 'finalStatus', 'FINAL STATUS'],
  'note': ['note', 'Note', 'NOTE', 'Catatan'],
  'nik': ['nik', 'NIK', 'Nik']
};

const VALID_REPLY_RECORDS = ['Invited', 'Changed Mind', 'No Responses'];
const VALID_FINAL_STATUSES = ['Eligible', 'Not Eligible (Changed Project)', 'Not Eligible (Cancel)'];

const normalizeColumnName = (header) => {
  if (!header) return null;
  const normalized = String(header).trim();
  for (const [standardName, variations] of Object.entries(COLUMN_MAPPING)) {
    if (variations.some(v => v.toLowerCase() === normalized.toLowerCase())) {
      return standardName;
    }
  }
  return null;
};

const parseExcelDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const year = value.getFullYear();
    return `${month}/${day}/${year}`;
  }

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date && date.y && date.m && date.d) {
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      const year = date.y;
      return `${month}/${day}/${year}`;
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    const mmddyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch;
      const m = parseInt(month);
      const d = parseInt(day);
      const y = parseInt(year);
      
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
      }
    }

    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const y = parseInt(year);
      const m = parseInt(month);
      const d = parseInt(day);
      
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
      }
    }

    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);
      
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
      }
    }

    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const year = parsedDate.getFullYear();
      return `${month}/${day}/${year}`;
    }
  }

  return null;
};

const cleanPhoneNumber = (value) => {
  if (!value) return '';
  const cleaned = String(value).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return cleaned;
  }
  if (cleaned.startsWith('62')) {
    return '0' + cleaned.substring(2);
  }
  if (cleaned.length >= 9) {
    return '0' + cleaned;
  }
  return cleaned;
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).trim();
  return stringValue === '-' ? '' : stringValue;
};

const normalizeReplyRecord = (value) => {
  if (!value) return '';
  const normalized = String(value).trim();
  
  const mapping = {
    'invited': 'Invited',
    'changed mind': 'Changed Mind',
    'no responses': 'No Responses',
    'no response': 'No Responses'
  };

  const lower = normalized.toLowerCase();
  return mapping[lower] || normalized;
};

const normalizeFinalStatus = (value) => {
  if (!value) return '';
  const normalized = String(value).trim();
  
  const mapping = {
    'eligible': 'Eligible',
    'not eligible (changed project)': 'Not Eligible (Changed Project)',
    'not eligible (cancel)': 'Not Eligible (Cancel)',
    'not eligible(changed project)': 'Not Eligible (Changed Project)',
    'not eligible(cancel)': 'Not Eligible (Cancel)'
  };

  const lower = normalized.toLowerCase();
  return mapping[lower] || normalized;
};

const validateRow = (rowData, rowIndex) => {
  const errors = [];

  if (!rowData.fullName || !rowData.fullName.trim()) {
    errors.push(`FULL NAME wajib diisi`);
  }

  if (rowData.replyRecord && !VALID_REPLY_RECORDS.includes(rowData.replyRecord)) {
    errors.push(`Reply Record tidak valid. Gunakan: ${VALID_REPLY_RECORDS.join(', ')}`);
  }

  if (rowData.finalStatus && !VALID_FINAL_STATUSES.includes(rowData.finalStatus)) {
    errors.push(`Final Status tidak valid. Gunakan: ${VALID_FINAL_STATUSES.join(', ')}`);
  }

  return errors;
};

export const parseTaskExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log('📄 Reading Excel file...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array', 
          cellDates: true,
          dateNF: 'M/D/YYYY'
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki sheet');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        console.log(`📊 Processing sheet: ${firstSheetName}`);

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: 'M/D/YYYY',
          defval: ''
        });

        if (jsonData.length < 2) {
          throw new Error('File Excel harus memiliki minimal 1 baris header dan 1 baris data');
        }

        const headers = jsonData[0];
        const columnMap = {};
        
        headers.forEach((header, index) => {
          const standardName = normalizeColumnName(header);
          if (standardName) {
            columnMap[index] = standardName;
          }
        });

        console.log('🗂️  Column mapping:', columnMap);

        const requiredColumns = ['fullName'];
        const mappedColumns = Object.values(columnMap);
        const missingColumns = requiredColumns.filter(col => !mappedColumns.includes(col));

        if (missingColumns.length > 0) {
          throw new Error(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`);
        }

        const parsedData = [];
        const allParsedData = [];
        const validationErrors = [];
        const phoneNumberSet = new Set();
        const duplicatePhoneRows = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          const isEmptyRow = row.every(cell => !cell || String(cell).trim() === '');
          if (isEmptyRow) continue;

          const rowData = {
            user: '',
            fullName: '',
            date: null,
            phoneNumber: '',
            domicile: '',
            city: '',
            project: '',
            replyRecord: '',
            finalStatus: '',
            note: '',
            nik: ''
          };

          Object.entries(columnMap).forEach(([colIndex, fieldName]) => {
            const cellValue = row[colIndex];

            if (fieldName === 'date') {
              const parsedDate = parseExcelDate(cellValue);
              rowData[fieldName] = parsedDate;
              
              if (i === 1) {
                console.log('📅 Date Parsing Debug (First Row):', {
                  rawValue: cellValue,
                  valueType: typeof cellValue,
                  parsedDate: parsedDate
                });
              }
            } else if (fieldName === 'phoneNumber') {
              rowData[fieldName] = cleanPhoneNumber(cellValue);
            } else if (fieldName === 'replyRecord') {
              rowData[fieldName] = normalizeReplyRecord(cellValue);
            } else if (fieldName === 'finalStatus') {
              rowData[fieldName] = normalizeFinalStatus(cellValue);
            } else if (fieldName === 'user') {
              rowData[fieldName] = normalizeValue(cellValue).toLowerCase();
            } else {
              rowData[fieldName] = normalizeValue(cellValue);
            }
          });

          allParsedData.push({ ...rowData, _rowIndex: i + 1 });

          let isDuplicatePhone = false;
          if (rowData.phoneNumber && rowData.phoneNumber.trim()) {
            const normalizedPhone = rowData.phoneNumber.toLowerCase().trim();
            if (phoneNumberSet.has(normalizedPhone)) {
              duplicatePhoneRows.push({
                row: i + 1,
                phoneNumber: rowData.phoneNumber
              });
              isDuplicatePhone = true;
            } else {
              phoneNumberSet.add(normalizedPhone);
            }
          }

          const rowErrors = validateRow(rowData, i + 1);

          if (rowErrors.length > 0) {
            validationErrors.push({
              row: i + 1,
              errors: rowErrors
            });
          } else if (!isDuplicatePhone) {
            parsedData.push(rowData);
          }
        }

        if (duplicatePhoneRows.length > 0) {
          const duplicateError = new Error('Phone number duplicates detected');
          duplicateError.isDuplicateError = true;
          duplicateError.duplicates = {
            inPayload: duplicatePhoneRows.map(d => {
              const rowData = allParsedData.find(p => p._rowIndex === d.row);
              return {
                row: d.row,
                data: rowData || { phoneNumber: d.phoneNumber, fullName: '-' },
                duplicateFields: ['phoneNumber']
              };
            }),
            inDatabase: [],
            total: duplicatePhoneRows.length
          };
          duplicateError.allParsedData = allParsedData.map(item => {
            const { _rowIndex, ...cleanItem } = item;
            return cleanItem;
          });
          
          console.error('❌ Duplicate phone numbers found:', duplicatePhoneRows);
          throw duplicateError;
        }

        if (validationErrors.length > 0) {
          const errorMessage = `Ditemukan ${validationErrors.length} kesalahan pada ${validationErrors.length} baris yang perlu diperbaiki.\n\n` +
            `Baris yang perlu diperbaiki: ${validationErrors.map(e => e.row).join(', ')}\n\n` +
            `Detail kesalahan:\n${validationErrors.map(e => `Baris ${e.row}: ${e.errors.join(', ')}`).join('\n')}\n\n` +
            `Pastikan:\n` +
            `- FULL NAME wajib diisi (nama boleh duplikat)\n` +
            `- PHONE NUMBER tidak boleh duplikat dalam file\n` +
            `- Reply Record menggunakan nilai: ${VALID_REPLY_RECORDS.join(', ')}\n` +
            `- Final Status menggunakan nilai: ${VALID_FINAL_STATUSES.join(', ')}\n` +
            `- Format tanggal menggunakan M/D/YYYY, DD/MM/YYYY atau YYYY-MM-DD`;

          console.error('❌ Validation errors found:', validationErrors);
          throw new Error(errorMessage);
        }

        console.log(`✅ Successfully parsed ${parsedData.length} valid records from ${jsonData.length - 1} total rows`);
        resolve(parsedData);

      } catch (error) {
        console.error('❌ Excel parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file Excel'));
    };

    reader.readAsArrayBuffer(file);
  });
};