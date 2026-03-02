export const REQUIRED_HEADERS = ["Business"];
export const REQUIRED_REPLACE_HEADERS = ["Business", "Merchant Order ID"];

export const OPTIONAL_HEADERS = [
"Service Type", "Pickup done At (1st Attempt)", "Weight", "Payment Type", "Consignee Name",
"Consignee Address", "Address Notes", "Consignee City", "Consignee Latitude", "Consignee Longitude",
"Location Expected", "Consignee Postalcode", "Consignee Phone", "Slot Time", "Driver Code",
"Driver Name", "Driver Phone", "Receiver", "Recipient Email", "Items Name", "Photo Delivery",
"Delivery Start", "Dropoff done at", "Merchant Order ID", "Blitz Hub", "Business Hub",
"Midmile Pickup Done At", "Distance Radial", "Delivery Status", "Unit"
];

export const SLOT_TIME_MAP = new Map([
["slot-0", "08:00:00"],
["slot-0bb", "08:00:00"],
["slot-1", "11:00:00"],
["slot-1bb", "11:00:00"],
["slot-12", "14:00:00"],
["slot-12bb", "14:00:00"],
["slot-2", "17:00:00"],
["slot-sameday03", "19:00:00"],
["slot-13", "21:00:00"],
["slot-sameday", "22:00:00"],
["slot-id32-02", "08:00:00"],
["slot-b2b-2", "08:00:00"]
]);

export const BATCH_ETA_MAP = new Map([
["Batch 1", "19:00:00"],
["Batch 2", "23:00:00"]
]);

export const EXCEL_DATE_OFFSET = 25569;
export const MS_PER_DAY = 86400 * 1000;
export const BATCH_1_START = 540;
export const BATCH_1_END = 840;
export const WEIGHT_THRESHOLD = 0.30;
export const DISTANCE_THRESHOLD = 0.30;
export const WEIGHT_BASE = 10;
export const WEIGHT_CHARGE_RATE = 400;

export const DELIVERY_STATUS = {
ONTIME: "ONTIME",
LATE: "LATE",
INVALID: "INVALID"
};

export const BATCH_TYPES = {
BATCH_1: "Batch 1",
BATCH_2: "Batch 2"
};

export const FIELD_MAPPINGS = [
{ source: "Business", target: "Client Name" },
{ source: ["Service Type", "channel"], target: "Project Name" },
{ source: "delivery_date", target: "Date", transform: "convertExcelDate" },
{ source: "Blitz Hub", target: "Drop Point" },
{ source: ["Business Hub", "hub_name"], target: "HUB" },
{ source: "Merchant Order ID", target: "Order Code" },
{ source: "Payment Type", target: "Payment Term" },
{ source: "Consignee Name", target: "Cnee Name" },
{ source: "Consignee Address", target: "Cnee Address 1" },
{ source: "Address Notes", target: "Cnee Address 2" },
{ source: "Consignee City", target: "Cnee Area" },
{ source: "Location Expected", target: "Location Expected" },
{ source: "Consignee Postalcode", target: "Additional Notes For Address", transform: "getNumber" },
{ source: "Consignee Phone", target: "Cnee Phone" },
{ source: "Driver Code", target: "Courier Code" },
{ source: "Driver Name", target: "Courier Name" },
{ source: "Driver Phone", target: "Driver Phone" },
{ source: "Receiver", target: "Receiver" },
{ source: "Recipient Email", target: "Recipient Email" },
{ source: "Items Name", target: "Items Name" },
{ source: "Photo Delivery", target: "Photo Delivery" },
{ source: "Unit", target: "Unit" }
];