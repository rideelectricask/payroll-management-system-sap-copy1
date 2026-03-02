import * as XLSX from 'xlsx';

const MITRA_TEMPLATE_HEADERS = [
  'mitra_id',
  'username',
  'full_name',
  'phone_number',
  'unit_name',
  'assistant_coordinator',
  'commission_fee',
  'mitra_status',
  'city',
  'attendance',
  'otp',
  'bank_info_provided',
  'app_version',
  'app_version_code',
  'app_api_version',
  'android_version',
  'last_active',
  'created_at',
  'registered_at',
  'hub_category',
  'business_category'
];

const MITRA_SAMPLE_DATA = [
  {
    'mitra_id': '21342494',
    'username': 'gopururohim21342494',
    'full_name': 'gopururohim',
    'phone_number': '85215834844',
    'unit_name': 'EV',
    'assistant_coordinator': 'TRUE',
    'commission_fee': '500000',
    'mitra_status': 'Active',
    'city': 'Kota Jakarta Selatan',
    'attendance': 'Online',
    'otp': '844670',
    'bank_info_provided': 'No',
    'app_version': '4.2.1',
    'app_version_code': '41',
    'app_api_version': '34',
    'android_version': '14',
    'last_active': '7 Oct 2025 21:03 WIB',
    'created_at': '24 Jul 2024 20:06 WIB',
    'registered_at': '26 Jul 2024 07:50 WIB',
    'hub_category': 'Warehouse 1',
    'business_category': 'Blibli, Zalora, Merapi, Kopi Kenangan'
  },
  {
    'mitra_id': '21342495',
    'username': 'agungtrisno21342495',
    'full_name': 'agungtrisno',
    'phone_number': '81234567890',
    'unit_name': 'JKT',
    'assistant_coordinator': 'FALSE',
    'commission_fee': '450000',
    'mitra_status': 'Active',
    'city': 'Kota Jakarta Utara',
    'attendance': 'Online',
    'otp': '123456',
    'bank_info_provided': 'Yes',
    'app_version': '4.2.1',
    'app_version_code': '41',
    'app_api_version': '34',
    'android_version': '13',
    'last_active': '7 Oct 2025 20:00 WIB',
    'created_at': '20 Jul 2024 15:30 WIB',
    'registered_at': '21 Jul 2024 08:15 WIB',
    'hub_category': 'Warehouse 2',
    'business_category': 'Sayurbox, Titipku'
  }
];

const DRIVER_TEMPLATE_DATA = [
  {
    'Business': 'Sayurbox',
    'hubLocation': 'Cibitung - KAB BEKASI',
    'unit': '',
    'username': 'mitra-blitz-cbt-hasbymusandy',
    'fullName': 'Hasby Musandy',
    'courierId': '8977056500',
    'askor': 'TRUE',
    'fee': '500000'
  },
  {
    'Business': 'Sayurbox',
    'hubLocation': 'Bintaro - TANGSEL',
    'unit': '',
    'username': 'mitra-blitz-btr-winfyjanson',
    'fullName': 'Winfry Janson',
    'courierId': '81289907768',
    'askor': 'TRUE',
    'fee': '4551451'
  }
];

const FLEET_TEMPLATE_DATA = [
  {
    'Name': 'Antok Sepia Nugroho',
    'Status': 'ACTIVE',
    'Molis': 'IN-CHARGE',
    'Deduction Amount': 'Rp65,000',
    'Status Second': 'Rent-to-Owned',
    'Project': 'Allofresh',
    'Distribusi': 'Jabodetabek',
    'Rush Hour': '08.00 - 18.00',
    'Veh Numb': 'B 4441 SVO',
    'Type': 'CHARGED RIMAU',
    'Notes': 'PENGAMBILAN 12 AUG, POT 5 HARI'
  },
  {
    'Name': 'Ahmad Fauzi',
    'Status': 'ACTIVE',
    'Molis': 'IN-CHARGE',
    'Deduction Amount': 'Rp45,000',
    'Status Second': 'Rent Only',
    'Project': 'BL',
    'Distribusi': 'Duri Kosambi',
    'Rush Hour': '08.00 - 17.00',
    'Veh Numb': 'B 4258 SVJ',
    'Type': 'CHARGED MALEO',
    'Notes': ''
  }
];

const ZONE_TEMPLATE_DATA = [
  {
    'Hub': 'Bintaro - TANGSEL',
    'Driver Name': 'mitra-blitz-btr-adietarosa',
    'After Rekon': 49000,
    'Add Personal': 35000,
    'Festive Bonus': 35000,
    'Incentives': 49000
  },
  {
    'Hub': 'Bintaro - TANGSEL',
    'Driver Name': 'mitra-blitz-btr-adjiepratama',
    'After Rekon': '',
    'Add Personal': 84000,
    'Festive Bonus': 84000,
    'Incentives': 35000
  }
];

const SAYURBOX_TEMPLATE_DATA = [
  {
    'order_no': 'SA-9GH7JTDC3EJS-NR',
    'time_slot': 'slot-sameday',
    'channel': 'B2C',
    'delivery_date': '21/09/2025',
    'driver_name': 'mitra-blitz-cbt-dimasaji.k',
    'hub_name': 'Cibitung - KAB BEKASI',
    'shipped_at': '21/09/2025',
    'delivered_at': '9/21/2025 20:04',
    'pu_order': 'SA-9GH7JTDC3EJS-NR',
    'time_slot_start': '9/21/2025 20:02',
    'late_pickup_minute': 0,
    'pu_after_ts_minute': 0,
    'time_slot_end': 'slot-sameday',
    'late_delivery_minute': 0,
    'is_ontime': true,
    'distance_in_km': 4,
    'total_weight_perorder': 10.5,
    'payment_method': 'Cash on Delivery',
    'monthly': 'September 2025'
  }
];

const EDATA_TEMPLATE_DATA = [
  {
    'driver_name': 'mitra-blitz-cbt-dimasaji.k',
    'district': 'Kecamatan Serang Baru',
    'customer_name': 'Kumala',
    'delivery_date': '21/09/2025',
    'address': 'Kontrakan haji dikky Kecamatan Serang Baru Kabupaten Bekasi',
    'address_note': 'kalo udah sampe telp atau wa aja (0881036733930)',
    'order_no': 'SA-9GH7JTDC3EJS-NR',
    'packaging_option': 'Standard',
    'distance_in_km': 4,
    'hubs': 'Cibitung - KAB BEKASI',
    'total_price': 85000,
    'external_note': '',
    'internal_note': '',
    'customer_note': 'Delivered to customer',
    'time_slot': 'slot-sameday',
    'no_plastic': 'false',
    'payment_method': 'Cash on Delivery',
    'latitude': -6.362191778944353,
    'longitude': 107.08623775658383,
    'shipping_number': 'SB-001'
  }
];

const createWorksheet = (data) => {
  return XLSX.utils.json_to_sheet(data);
};

const setColumnWidths = (worksheet, widths) => {
  worksheet['!cols'] = widths.map(w => ({ wch: w }));
};

const applyHeaderStyle = (worksheet, headers, colorRGB = "4472C4") => {
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: colorRGB } },
    alignment: { horizontal: "center", vertical: "center" }
  };

  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = { t: 's', v: header };
    }
    worksheet[cellAddress].s = headerStyle;
  });
};

const addDataValidation = (worksheet, column, startRow, validValues) => {
  const range = { s: { r: startRow, c: column }, e: { r: 1000, c: column } };
  
  if (!worksheet['!dataValidation']) {
    worksheet['!dataValidation'] = [];
  }

  worksheet['!dataValidation'].push({
    type: 'list',
    allowBlank: true,
    sqref: XLSX.utils.encode_range(range),
    formulas: [validValues.map(v => `"${v}"`).join(',')]
  });
};

const generateFilename = (prefix) => {
  const currentDate = new Date().toISOString().split('T')[0];
  return `${prefix}_${currentDate}.xlsx`;
};

const createWorkbookAndDownload = (worksheet, sheetName, filename) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const downloadMitraTemplate = () => {
  try {
    const worksheet = createWorksheet(MITRA_SAMPLE_DATA);
    setColumnWidths(worksheet, [12, 25, 20, 15, 12, 20, 15, 12, 20, 12, 10, 18, 12, 15, 15, 15, 20, 20, 20, 20, 35]);
    applyHeaderStyle(worksheet, MITRA_TEMPLATE_HEADERS, "28A745");

    const filename = generateFilename('Mitra_Template');
    createWorkbookAndDownload(worksheet, 'Mitra Template', filename);

    return {
      success: true,
      message: `Template Mitra berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading mitra template:', error);
    throw new Error(`Gagal mengunduh template mitra: ${error.message}`);
  }
};

export const downloadDriverTemplate = () => {
  try {
    const worksheet = createWorksheet(DRIVER_TEMPLATE_DATA);
    setColumnWidths(worksheet, [15, 25, 10, 30, 20, 15, 10, 15]);

    const headers = ['Business', 'hubLocation', 'unit', 'username', 'fullName', 'courierId', 'askor', 'fee'];
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Driver_Template');
    createWorkbookAndDownload(worksheet, 'Driver Template', filename);

    return {
      success: true,
      message: `Template Driver berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading driver template:', error);
    throw new Error(`Gagal mengunduh template driver: ${error.message}`);
  }
};

export const downloadDMTaskTemplate = () => {
  try {
    const worksheet = createWorksheet(FLEET_TEMPLATE_DATA);
    setColumnWidths(worksheet, [20, 10, 12, 15, 15, 25, 20, 15, 12, 15, 50]);

    const headers = ['Name', 'Status', 'Molis', 'Deduction Amount', 'Status Second', 'Project', 'Distribusi', 'Rush Hour', 'Veh Numb', 'Type', 'Notes'];
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Fleet_Template');
    createWorkbookAndDownload(worksheet, 'Fleet Template', filename);

    return {
      success: true,
      message: `Template Fleet berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading fleet template:', error);
    throw new Error(`Gagal mengunduh template fleet: ${error.message}`);
  }
};

export const downloadZoneTemplate = () => {
  try {
    const worksheet = createWorksheet(ZONE_TEMPLATE_DATA);
    setColumnWidths(worksheet, [20, 30, 15, 15, 15, 15]);

    const headers = ['Hub', 'Driver Name', 'After Rekon', 'Add Personal', 'Festive Bonus', 'Incentives'];
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Zone_Template');
    createWorkbookAndDownload(worksheet, 'Zone Template', filename);

    return {
      success: true,
      message: `Template Zone berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading zone template:', error);
    throw new Error(`Gagal mengunduh template zone: ${error.message}`);
  }
};

export const downloadSayurboxTemplate = () => {
  try {
    const worksheet = createWorksheet(SAYURBOX_TEMPLATE_DATA);
    setColumnWidths(worksheet, [20, 15, 10, 15, 30, 25, 15, 20, 20, 20, 15, 15, 15, 15, 10, 15, 20, 20, 15]);

    const headers = Object.keys(SAYURBOX_TEMPLATE_DATA[0]);
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Sayurbox_Template');
    createWorkbookAndDownload(worksheet, 'Sayurbox Template', filename);

    return {
      success: true,
      message: `Template Sayurbox berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading sayurbox template:', error);
    throw new Error(`Gagal mengunduh template sayurbox: ${error.message}`);
  }
};

export const downloadTaskTemplate = () => {
  try {
    const templateData = [
      {
        user: 'Septa',
        full_name: 'Rizky Alviansyah',
        date: '19/07/2025',
        phone_number: '85770091019',
        domicile: 'Jagakarsa',
        city: 'Jakarta Selatan',
        project: 'Gomart',
        reply_record: 'Invited',
        final_status: 'Eligible',
        note: '',
        nik: ''
      },
      {
        user: 'Septa',
        full_name: 'Rusli',
        date: '19/07/2025',
        phone_number: '87742644480',
        domicile: 'Pancoran',
        city: 'Jakarta Selatan',
        project: 'Gomart',
        reply_record: 'Changed Mind',
        final_status: 'Not Eligible (Cancel)',
        note: '',
        nik: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    const wscols = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 35 },
      { wch: 30 },
      { wch: 20 }
    ];
    ws['!cols'] = wscols;

    const replyRecordOptions = ['Invited', 'Changed Mind', 'No Responses'];
    const finalStatusOptions = ['Eligible', 'Not Eligible (Changed Project)', 'Not Eligible (Cancel)'];

    addDataValidation(ws, 7, 1, replyRecordOptions);
    addDataValidation(ws, 8, 1, finalStatusOptions);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Task Template');

    XLSX.writeFile(wb, 'Task_Management_Template.xlsx');

    return {
      success: true,
      message: 'Template task berhasil diunduh dengan dropdown validation untuk Reply Record dan Final Status'
    };
  } catch (error) {
    console.error('Download template error:', error);
    throw new Error(`Gagal mengunduh template: ${error.message}`);
  }
};

export const downloadFleetTemplate = () => {
  try {
    const templateData = [
      {
        name: 'John Doe',
        no_telepon: '081234567890',
        status: 'ACTIVE',
        molis: 'YES',
        deduction_amount: '50000',
        status_second: '',
        project: 'GOMART',
        distribusi: 'JAKARTA',
        rush_hour: 'YES',
        veh_numb: 'B1234XYZ',
        type: 'MOTOR',
        notes: 'Driver aktif'
      },
      {
        name: 'Jane Smith',
        no_telepon: '089876543210',
        status: 'ACTIVE',
        molis: 'NO',
        deduction_amount: '0',
        status_second: '',
        project: 'GOFOOD',
        distribusi: 'BANDUNG',
        rush_hour: 'NO',
        veh_numb: 'D5678ABC',
        type: 'MOTOR',
        notes: 'Driver baru'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    const wscols = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fleet Template');

    XLSX.writeFile(wb, 'Fleet_Management_Template.xlsx');

    return {
      success: true,
      message: 'Template fleet berhasil diunduh'
    };
  } catch (error) {
    console.error('Download template error:', error);
    throw new Error(`Gagal mengunduh template: ${error.message}`);
  }
};

export const downloadEDataTemplate = () => {
  try {
    const worksheet = createWorksheet(EDATA_TEMPLATE_DATA);
    setColumnWidths(worksheet, [30, 20, 25, 15, 50, 50, 25, 20, 15, 25, 15, 30, 30, 30, 15, 10, 20, 12, 12, 20]);

    const headers = Object.keys(EDATA_TEMPLATE_DATA[0]);
    applyHeaderStyle(worksheet, headers, "28A745");

    const filename = generateFilename('EData_Template');
    createWorkbookAndDownload(worksheet, 'EData Template', filename);

    return {
      success: true,
      message: `Template EData berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error downloading edata template:', error);
    throw new Error(`Gagal mengunduh template edata: ${error.message}`);
  }
};

const createEmptyTemplateData = (headers) => {
  const emptyRow = {};
  headers.forEach(header => {
    emptyRow[header] = '';
  });
  return [emptyRow];
};

export const createEmptyDriverTemplate = () => {
  try {
    const headers = ['Business', 'hubLocation', 'unit', 'username', 'fullName', 'courierId', 'askor', 'fee'];
    const emptyData = createEmptyTemplateData(headers);

    const worksheet = createWorksheet(emptyData);
    setColumnWidths(worksheet, [15, 25, 10, 30, 20, 15, 10, 15]);
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Driver_Empty_Template');
    createWorkbookAndDownload(worksheet, 'Driver Template', filename);

    return {
      success: true,
      message: `Template driver kosong berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error creating empty driver template:', error);
    throw new Error(`Gagal membuat template driver kosong: ${error.message}`);
  }
};

export const createEmptyFleetTemplate = () => {
  try {
    const headers = ['Name', 'Status', 'Molis', 'Deduction Amount', 'Status Second', 'Project', 'Distribusi', 'Rush Hour', 'Veh Numb', 'Type', 'Notes'];
    const emptyData = createEmptyTemplateData(headers);

    const worksheet = createWorksheet(emptyData);
    setColumnWidths(worksheet, [20, 10, 12, 15, 15, 25, 20, 15, 12, 15, 50]);
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Fleet_Empty_Template');
    createWorkbookAndDownload(worksheet, 'Fleet Template', filename);

    return {
      success: true,
      message: `Template fleet kosong berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error creating empty fleet template:', error);
    throw new Error(`Gagal membuat template fleet kosong: ${error.message}`);
  }
};

export const createEmptyZoneTemplate = () => {
  try {
    const headers = ['Hub', 'Driver Name', 'After Rekon', 'Add Personal', 'Festive Bonus', 'Incentives'];
    const emptyData = createEmptyTemplateData(headers);

    const worksheet = createWorksheet(emptyData);
    setColumnWidths(worksheet, [20, 30, 15, 15, 15, 15]);
    applyHeaderStyle(worksheet, headers);

    const filename = generateFilename('Zone_Empty_Template');
    createWorkbookAndDownload(worksheet, 'Zone Template', filename);

    return {
      success: true,
      message: `Template zone kosong berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error creating empty zone template:', error);
    throw new Error(`Gagal membuat template zone kosong: ${error.message}`);
  }
};

export const createEmptyMitraTemplate = () => {
  try {
    const emptyData = createEmptyTemplateData(MITRA_TEMPLATE_HEADERS);

    const worksheet = createWorksheet(emptyData);
    setColumnWidths(worksheet, [12, 25, 20, 15, 12, 20, 15, 12, 20, 12, 10, 18, 12, 15, 15, 15, 20, 20, 20, 20, 35]);
    applyHeaderStyle(worksheet, MITRA_TEMPLATE_HEADERS, "28A745");

    const filename = generateFilename('Mitra_Empty_Template');
    createWorkbookAndDownload(worksheet, 'Mitra Template', filename);

    return {
      success: true,
      message: `Template mitra kosong berhasil diunduh: ${filename}`,
      filename
    };
  } catch (error) {
    console.error('Error creating empty mitra template:', error);
    throw new Error(`Gagal membuat template mitra kosong: ${error.message}`);
  }
};

export default {
  downloadMitraTemplate,
  downloadDriverTemplate,
  downloadFleetTemplate,
  downloadZoneTemplate,
  downloadSayurboxTemplate,
  downloadEDataTemplate,
  createEmptyDriverTemplate,
  createEmptyFleetTemplate,
  createEmptyZoneTemplate,
  createEmptyMitraTemplate,
  downloadDMTaskTemplate,
  downloadTaskTemplate
};