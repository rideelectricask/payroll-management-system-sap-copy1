import { isString } from "lodash";
import { 
BATCH_1_START, 
BATCH_1_END, 
WEIGHT_THRESHOLD, 
DISTANCE_THRESHOLD, 
WEIGHT_BASE, 
WEIGHT_CHARGE_RATE,
BATCH_TYPES,
SLOT_TIME_MAP,
BATCH_ETA_MAP,
DELIVERY_STATUS
} from "../config/constants.js";
import { parseTimeToMinutes } from "./converters.js";
import { normalize } from "./formatters.js";

export const parseTimeToBatch = (timeStr) => {
const totalMinutes = parseTimeToMinutes(timeStr);
return totalMinutes && totalMinutes >= BATCH_1_START && totalMinutes <= BATCH_1_END 
? BATCH_TYPES.BATCH_1 
: BATCH_TYPES.BATCH_2;
};

export const getETAFromSlotTime = (slotTime) => {
if (!isString(slotTime)) return DELIVERY_STATUS.INVALID;
const normalizedSlotTime = normalize(slotTime);
const eta = SLOT_TIME_MAP.get(normalizedSlotTime);
return eta || DELIVERY_STATUS.INVALID;
};

export const getETAFromBatch = (batch) => {
return BATCH_ETA_MAP.get(batch) || "No valid time";
};

export const compareDeliveryTime = (receivingTime, etaTime) => {
if (!receivingTime || !etaTime || etaTime === DELIVERY_STATUS.INVALID || etaTime === "No valid time") {
return "";
}

const receivingMinutes = parseTimeToMinutes(receivingTime);
const etaMinutes = parseTimeToMinutes(etaTime);

if (receivingMinutes === null || etaMinutes === null) return "";

return receivingMinutes <= etaMinutes ? DELIVERY_STATUS.ONTIME : DELIVERY_STATUS.LATE;
};

export const calculateWeightMetrics = (weight) => {
const numericWeight = Number(weight) || 0;
const integerPart = Math.floor(numericWeight);
const decimalPart = numericWeight - integerPart;
const roundDown = numericWeight < 1 ? 0 : integerPart;
const roundUp = decimalPart > WEIGHT_THRESHOLD ? integerPart + 1 : integerPart;
const weightDecimal = Number((numericWeight - roundDown).toFixed(2));
const addCharge1 = roundUp < WEIGHT_BASE ? 0 : (roundUp - WEIGHT_BASE) * WEIGHT_CHARGE_RATE;

return {
weight: numericWeight.toFixed(2),
roundDown,
roundUp,
weightDecimal,
addCharge1: addCharge1.toString()
};
};

export const calculateDistanceMetrics = (distance) => {
const distanceVal = Number(distance) || 0;
const integerPart = Math.floor(distanceVal);
const decimalPart = distanceVal - integerPart;
const roundDown = distanceVal < 1 ? 0 : integerPart;
const roundUp = decimalPart > DISTANCE_THRESHOLD ? integerPart + 1 : integerPart;

return {
distance: distanceVal,
roundDownDistance: roundDown,
roundUpDistance: roundUp
};
};