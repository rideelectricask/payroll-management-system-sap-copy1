import * as XLSX from 'xlsx';

const REQUIRED_HEADERS = [
  'client_name', 
  'project_name', 
  'delivery_date', 
  'drop_point', 
  'hub', 
  'order_code', 
  'weight', 
  'distance_km', 
  'mitra_code', 
  'mitra_name', 
  'receiving_date', 
  'vehicle_type', 
  'cost', 
  'sla', 
  'weekly'
];

const REQUIRED_FIELD = 'mitra_name';

const isHeaderRow = (row) => {
  if (!row || row.length === 0) return false;

  const firstCell = String(row[0] || '').toLowerCase().trim();
  const headerKeywords = ['client', 'project', 'delivery', 'drop', 'hub', 'order', 'mitra', 'vehicle', 'weekly'];

  return headerKeywords.some(keyword => firstCell.includes(keyword));
};

const normalizeHeader = (header) => {
  if (!header) return '';

  const cleaned = header.toString().trim().toLowerCase().replace(/\s+/g, '_');

  const mapping = {
    'client_name': 'client_name',
    'client': 'client_name',
    'clientname': 'client_name',
    'project_name': 'project_name',
    'project': 'project_name',
    'projectname': 'project_name',
    'delivery_date': 'delivery_date',
    'delivery': 'delivery_date',
    'deliverydate': 'delivery_date',
    'date': 'delivery_date',
    'drop_point': 'drop_point',
    'drop': 'drop_point',
    'droppoint': 'drop_point',
    'point': 'drop_point',
    'hub': 'hub',
    'order_code': 'order_code',
    'order': 'order_code',
    'ordercode': 'order_code',
    'code': 'order_code',
    'weight': 'weight',
    'wt': 'weight',
    'distance_km': 'distance_km',
    'distance': 'distance_km',
    'distancekm': 'distance_km',
    'km': 'distance_km',
    'mitra_code': 'mitra_code',
    'mitracode': 'mitra_code',
    'mitra_name': 'mitra_name',
    'mitra': 'mitra_name',
    'mitraname': 'mitra_name',
    'name': 'mitra_name',
    'receiving_date': 'receiving_date',
    'receiving': 'receiving_date',
    'receivingdate': 'receiving_date',
    'receive': 'receiving_date',
    'vehicle_type': 'vehicle_type',
    'vehicle': 'vehicle_type',
    'vehicletype': 'vehicle_type',
    'type': 'vehicle_type',
    'cost': 'cost',
    'price': 'cost',
    'amount': 'cost',
    'sla': 'sla',
    'status': 'sla',
    'weekly': 'weekly',
    'week': 'weekly',
    'wk': 'weekly'
  };

  return mapping[cleaned] || cleaned;
};

const convertExcelDate = (excelDate) => {
  if (!excelDate) return '-';
  
  const dateStr = String(excelDate).trim();
  
  if (dateStr === '' || dateStr === '-') return '-';
  
  if (dateStr.includes('/') || dateStr.includes('-')) {
    return dateStr;
  }
  
  const numericValue = Number(dateStr);
  if (!isNaN(numericValue) && numericValue > 1000) {
    const date = XLSX.SSF.parse_date_code(numericValue);
    if (date && date.d && date.m && date.y) {
      const day = String(date.d).padStart(2, '0');
      const month = String(date.m).padStart(2, '0');
      const year = date.y;
      return `${day}/${month}/${year}`;
    }
  }
  
  return dateStr;
};

export const validateExcelStructure = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            isValid: false,
            errors: ['Excel file tidak memiliki sheet']
          });
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          resolve({
            isValid: false,
            errors: ['Sheet kosong atau tidak ada data']
          });
          return;
        }

        const firstRow = jsonData[0];
        const hasHeader = isHeaderRow(firstRow);

        console.log('First row:', firstRow);
        console.log('Has header row:', hasHeader);

        if (!hasHeader) {
          console.log('Excel detected without header row - will use column indices');

          if (firstRow.length < 15) {
            resolve({
              isValid: false,
              errors: ['Excel harus memiliki minimal 15 kolom sesuai format template']
            });
            return;
          }

          resolve({
            isValid: true,
            hasHeader: false,
            errors: []
          });
          return;
        }

        const headers = firstRow.map(h => normalizeHeader(h)).filter(h => h);
        const uniqueHeaders = [...new Set(headers)];

        console.log('Normalized headers:', uniqueHeaders);
        console.log('Required headers:', REQUIRED_HEADERS);

        const missingHeaders = REQUIRED_HEADERS.filter(req => !uniqueHeaders.includes(req));

        if (missingHeaders.length > 0) {
          resolve({
            isValid: false,
            errors: [`Header tidak lengkap. Missing: ${missingHeaders.join(', ')}`]
          });
          return;
        }

        resolve({
          isValid: true,
          hasHeader: true,
          errors: []
        });

      } catch (error) {
        resolve({
          isValid: false,
          errors: [`Error membaca file: ${error.message}`]
        });
      }
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        errors: ['Gagal membaca file Excel']
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseMitraExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: false,
          cellNF: false,
          cellText: false
        });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          raw: false,
          dateNF: 'dd/mm/yyyy'
        });

        if (!rawData || rawData.length === 0) {
          reject(new Error('Tidak ada data dalam file Excel'));
          return;
        }

        const firstRow = rawData[0];
        const hasHeader = isHeaderRow(firstRow);

        console.log('Parsing Excel - Has header:', hasHeader);

        let jsonData;

        if (hasHeader) {
          jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
        } else {
          const headers = [
            'client_name', 
            'project_name', 
            'delivery_date', 
            'drop_point', 
            'hub', 
            'order_code', 
            'weight', 
            'distance_km', 
            'mitra_code', 
            'mitra_name', 
            'receiving_date', 
            'vehicle_type', 
            'cost', 
            'sla', 
            'weekly'
          ];

          jsonData = rawData.map(row => {
            if (row.length < 15) return null;

            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter(row => row !== null);
        }

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Tidak ada data valid dalam file Excel'));
          return;
        }

        const parsedData = jsonData.map((row, index) => {
          const normalizedRow = {};

          if (hasHeader) {
            Object.keys(row).forEach(key => {
              const normalizedKey = normalizeHeader(key);
              if (normalizedKey) {
                normalizedRow[normalizedKey] = row[key];
              }
            });
          } else {
            REQUIRED_HEADERS.forEach((header, idx) => {
              normalizedRow[header] = row[header];
            });
          }

          const rowNumber = hasHeader ? index + 2 : index + 1;

          if (!normalizedRow[REQUIRED_FIELD] || String(normalizedRow[REQUIRED_FIELD]).trim() === '') {
            throw new Error(`Baris ${rowNumber}: Field '${REQUIRED_FIELD}' wajib diisi`);
          }

          return {
            client_name: String(normalizedRow.client_name || '').trim() || '-',
            project_name: String(normalizedRow.project_name || '').trim() || '-',
            delivery_date: convertExcelDate(normalizedRow.delivery_date),
            drop_point: String(normalizedRow.drop_point || '').trim() || '-',
            hub: String(normalizedRow.hub || '').trim() || '-',
            order_code: String(normalizedRow.order_code || '').trim() || '-',
            weight: String(normalizedRow.weight || '').trim() || '-',
            distance_km: String(normalizedRow.distance_km || '').trim() || '-',
            mitra_code: String(normalizedRow.mitra_code || '').trim() || '-',
            mitra_name: String(normalizedRow.mitra_name || '').trim(),
            receiving_date: convertExcelDate(normalizedRow.receiving_date),
            vehicle_type: String(normalizedRow.vehicle_type || '').trim() || '-',
            cost: String(normalizedRow.cost || '').trim() || '-',
            sla: String(normalizedRow.sla || '').trim() || '-',
            weekly: String(normalizedRow.weekly || '').trim() || '-'
          };
        });

        console.log(`Parsed ${parsedData.length} shipment records from Excel`);
        console.log('Sample parsed data:', parsedData[0]);
        
        resolve(parsedData);

      } catch (error) {
        console.error('Excel parsing error:', error.message);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file Excel'));
    };

    reader.readAsArrayBuffer(file);
  });
};