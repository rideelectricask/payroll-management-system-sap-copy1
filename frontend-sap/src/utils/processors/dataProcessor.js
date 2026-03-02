import { isString, isEmpty } from "lodash";
import { convertExcelDate, convertDateTimeExcelFormat } from "../utils/converters.js";
import { 
calculateWeightMetrics, 
calculateDistanceMetrics, 
parseTimeToBatch, 
getETAFromSlotTime, 
getETAFromBatch, 
compareDeliveryTime 
} from "../utils/calculators.js";
import { formatLatLong } from "../utils/formatters.js";
import { FIELD_MAPPINGS, BATCH_TYPES } from "../config/constants.js";

const formatWeight = (weight) => {
const numericWeight = Number(weight) || 0;
return numericWeight % 1 === 0 ? numericWeight.toString() : numericWeight.toFixed(2);
};

const processWeightMetrics = (weightValue) => {
const numericWeight = Number(weightValue) || 0;
const integerPart = Math.floor(numericWeight);
const decimalPart = numericWeight - integerPart;

const roundDown = numericWeight < 1 ? 0 : integerPart;
const roundUp = decimalPart > 0.30 ? integerPart + 1 : integerPart;
const weightDecimal = Number((numericWeight - roundDown).toFixed(2));
const addCharge1 = roundUp < 10 ? 0 : (roundUp - 10) * 400;

return {
weight: formatWeight(numericWeight),
roundDown,
roundUp,
weightDecimal,
addCharge1: addCharge1.toString()
};
};

export class DataProcessor {
constructor(headerMap) {
this.headerMap = headerMap;
}

processRowData(item) {
const getValue = (key) => this.headerMap.getValue(item, key);
const getNumber = (key) => this.headerMap.getNumber(item, key);

const pickupDoneAtRaw = getValue("Pickup done At (1st Attempt)");
const midmilePickupDoneAt = getValue("Midmile Pickup Done At");
const dropoffDoneAt = getValue("Dropoff done at");
const deliveryStart = getValue("Delivery Start");
const slotTime = getValue("Slot Time");

const pickupDoneDate = convertExcelDate(pickupDoneAtRaw);
const dropOffDoneDateTime = convertDateTimeExcelFormat(dropoffDoneAt);
const deliveryStartDateTime = convertDateTimeExcelFormat(deliveryStart);

const [receivingDate, receivingTime] = dropOffDoneDateTime.split(" ");
const [startDate, startTime] = deliveryStartDateTime.split(" ");

const weightMetrics = processWeightMetrics(getValue("Weight"));
const distanceMetrics = calculateDistanceMetrics(getValue("Distance Radial"));

let batch = BATCH_TYPES.BATCH_2;
if (isString(midmilePickupDoneAt)) {
const timeOnly = midmilePickupDoneAt.split(" ")[1];
if (timeOnly) batch = parseTimeToBatch(timeOnly);
}

const ETA = getETAFromSlotTime(slotTime);
const deliveryStatus = compareDeliveryTime(receivingTime, ETA);

const lat = getValue("Consignee Latitude");
const long = getValue("Consignee Longitude");
const lat_long = formatLatLong(lat, long);

return {
"Client Name": getValue("Business"),
"Project Name": getValue("Service Type"),
"Date": pickupDoneDate,
"Drop Point": getValue("Blitz Hub"),
"HUB": getValue("Business Hub"),
"Order Code": getValue("Merchant Order ID"),
"Weight": weightMetrics.weight,
"RoundDown": weightMetrics.roundDown,
"RoundUp": weightMetrics.roundUp,
"WeightDecimal": weightMetrics.weightDecimal,
"Distance": distanceMetrics.distance,
"RoundDown Distance": distanceMetrics.roundDownDistance,
"RoundUp Distance": distanceMetrics.roundUpDistance,
"Payment Term": getValue("Payment Type"),
"Cnee Name": getValue("Consignee Name"),
"Cnee Address 1": getValue("Consignee Address"),
"Cnee Address 2": getValue("Address Notes"),
"Cnee Area": getValue("Consignee City"),
"lat_long": lat_long,
"Location Expected": getValue("Location Expected"),
"Additional Notes For Address": getNumber("Consignee Postalcode"),
"Slot Time": slotTime,
"Cnee Phone": getValue("Consignee Phone"),
"Courier Code": getValue("Driver Code"),
"Courier Name": getValue("Driver Name"),
"Driver Phone": getValue("Driver Phone"),
"Receiver": getValue("Receiver"),
"Recipient Email": getValue("Recipient Email"),
"Items Name": getValue("Items Name"),
"Photo Delivery": getValue("Photo Delivery"),
"Batch": batch,
"ETA": ETA,
"Receiving Date": receivingDate || "",
"Receiving Time": receivingTime || "",
"Delivery Start Date": startDate || "",
"Delivery Start Time": startTime || "",
"Pickup Done": pickupDoneDate,
"DropOff Done": dropOffDoneDateTime,
"Delivery Start": deliveryStartDateTime,
"Add Charge 1": weightMetrics.addCharge1,
"Delivery Status": deliveryStatus,
"Unit": getValue("Unit") || ""
};
}

processReplaceRowData(item) {
const getValue = (key) => this.headerMap.getValue(item, key);
const getNumber = (key) => this.headerMap.getNumber(item, key);

const clientName = getValue("Business");
const orderCode = getValue("Merchant Order ID");

if (!clientName || !orderCode) {
throw new Error("Business dan Merchant Order ID harus diisi untuk replace data");
}

const updateData = {};

const pickupDoneAtRaw = getValue("Pickup done At (1st Attempt)");
const midmilePickupDoneAt = getValue("Midmile Pickup Done At");
const dropoffDoneAt = getValue("Dropoff done at");
const deliveryStart = getValue("Delivery Start");
const slotTime = getValue("Slot Time");

if (pickupDoneAtRaw) {
const pickupDoneDate = convertExcelDate(pickupDoneAtRaw);
if (pickupDoneDate) {
updateData["Pickup Done"] = pickupDoneDate;
updateData["Date"] = pickupDoneDate;
}
}

if (dropoffDoneAt) {
const dropOffDoneDateTime = convertDateTimeExcelFormat(dropoffDoneAt);
if (dropOffDoneDateTime) {
updateData["DropOff Done"] = dropOffDoneDateTime;
const [receivingDate, receivingTime] = dropOffDoneDateTime.split(" ");
if (receivingDate) updateData["Receiving Date"] = receivingDate;
if (receivingTime) updateData["Receiving Time"] = receivingTime;
}
}

if (deliveryStart) {
const deliveryStartDateTime = convertDateTimeExcelFormat(deliveryStart);
if (deliveryStartDateTime) {
updateData["Delivery Start"] = deliveryStartDateTime;
const [startDate, startTime] = deliveryStartDateTime.split(" ");
if (startDate) updateData["Delivery Start Date"] = startDate;
if (startTime) updateData["Delivery Start Time"] = startTime;
}
}

const weightValue = getValue("Weight");
if (weightValue !== null && weightValue !== undefined && weightValue !== "") {
const weightMetrics = processWeightMetrics(weightValue);
updateData["Weight"] = weightMetrics.weight;
updateData["RoundDown"] = weightMetrics.roundDown;
updateData["RoundUp"] = weightMetrics.roundUp;
updateData["WeightDecimal"] = weightMetrics.weightDecimal;
updateData["Add Charge 1"] = weightMetrics.addCharge1;
}

const distanceValue = getValue("Distance Radial");
if (distanceValue !== null && distanceValue !== undefined && distanceValue !== "") {
const distanceMetrics = calculateDistanceMetrics(distanceValue);
updateData["Distance"] = distanceMetrics.distance;
updateData["RoundDown Distance"] = distanceMetrics.roundDownDistance;
updateData["RoundUp Distance"] = distanceMetrics.roundUpDistance;
}

let calculatedETA = "";
if (slotTime) {
updateData["Slot Time"] = slotTime.toString().trim();
calculatedETA = getETAFromSlotTime(slotTime);
if (calculatedETA && calculatedETA !== "INVALID") {
updateData["ETA"] = calculatedETA;
}
}

if (midmilePickupDoneAt) {
let batch = BATCH_TYPES.BATCH_2;
if (isString(midmilePickupDoneAt)) {
const timeOnly = midmilePickupDoneAt.split(" ")[1];
if (timeOnly) batch = parseTimeToBatch(timeOnly);
}
updateData["Batch"] = batch;
if (!calculatedETA) {
calculatedETA = getETAFromBatch(batch);
if (calculatedETA && calculatedETA !== "No valid time") {
updateData["ETA"] = calculatedETA;
}
}
}

const lat = getValue("Consignee Latitude");
const long = getValue("Consignee Longitude");
if (lat && long) {
updateData["lat_long"] = formatLatLong(lat, long);
}

const postalCode = getNumber("Consignee Postalcode");
if (postalCode !== null && postalCode !== undefined && !isNaN(postalCode)) {
updateData["Additional Notes For Address"] = postalCode;
}

const fieldMappings = [
{ source: "Business", target: "Client Name" },
{ source: "Service Type", target: "Project Name" },
{ source: "Blitz Hub", target: "Drop Point" },
{ source: "Business Hub", target: "HUB" },
{ source: "Merchant Order ID", target: "Order Code" },
{ source: "Payment Type", target: "Payment Term" },
{ source: "Consignee Name", target: "Cnee Name" },
{ source: "Consignee Address", target: "Cnee Address 1" },
{ source: "Address Notes", target: "Cnee Address 2" },
{ source: "Consignee City", target: "Cnee Area" },
{ source: "Location Expected", target: "Location Expected" },
{ source: "Consignee Phone", target: "Cnee Phone" },
{ source: "Driver Code", target: "Courier Code" },
{ source: "Driver Name", target: "Courier Name" },
{ source: "Driver Phone", target: "Driver Phone" },
{ source: "Receiver", target: "Receiver" },
{ source: "Recipient Email", target: "Recipient Email" },
{ source: "Items Name", target: "Items Name" },
{ source: "Photo Delivery", target: "Photo Delivery" },
{ source: "Delivery status", target: "Delivery Status" },
{ source: "Unit", target: "Unit" }
];

fieldMappings.forEach(({ source, target }) => {
const value = getValue(source);
if (value !== null && value !== undefined && value !== "" && value !== "-") {
updateData[target] = value.toString().trim();
}
});

if (updateData["Receiving Time"] && updateData["ETA"]) {
const deliveryStatus = compareDeliveryTime(updateData["Receiving Time"], updateData["ETA"]);
if (deliveryStatus) {
updateData["Delivery Status"] = deliveryStatus;
}
}

return {
clientName: clientName.toString().trim(),
orderCode: orderCode.toString().trim(),
updateData
};
}
}