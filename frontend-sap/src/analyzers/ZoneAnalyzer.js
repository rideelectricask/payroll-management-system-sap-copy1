import { DateUtils } from '../utils/helpers/dateUtils.js';
import { CalculationUtils } from '../utils/calculations/CalculationUtils.js';
import DataService from '../services/DataService.js';

export class ZoneAnalyzer {
constructor() {
this.driverIndex = new Map();
this.bonusIndex = new Map();
this.cutoffDataCache = null;
}

async displayDriversWithAskorTrue(forceRefresh = false) {
try {
const askorTrueDrivers = await DataService.getAskorTrueDrivers(forceRefresh);

if (askorTrueDrivers.length === 0) {
return [];
}

const cutoffData = this.getCutoffData();
askorTrueDrivers.forEach((driver, index) => {
this.displayDriverInfo(driver, index, cutoffData);
});

return askorTrueDrivers;
} catch (error) {
console.error('Error fetching driver data with ASKOR TRUE:', error);
return [];
}
}

displayDriverInfo(driver, index, cutoffData) {
if (driver.fee && !isNaN(driver.fee)) {
const earnings = CalculationUtils.calculateWeeklyEarnings(Number(driver.fee), cutoffData);
this.displayEarningsInfo(earnings);
}
}

displayEarningsInfo(earnings) {
}

getCutoffData() {
if (!this.cutoffDataCache) {
this.cutoffDataCache = DateUtils.getWeeklyCutoffCalculation();
}
return this.cutoffDataCache;
}

async getDriverWeeklyEarnings(courierCode, driverDataCache = null, forceRefresh = false) {
let driverData = driverDataCache;
if (!driverData || forceRefresh) {
driverData = await DataService.getDriverData(forceRefresh);
}

if (driverData.length === 0) return 0;

const driver = DataService.findDriverByCode(courierCode, driverData);

if (driver && driver.askor && driver.askor.toString().toUpperCase() === 'TRUE' && driver.fee && !isNaN(driver.fee)) {
const cutoffData = this.getCutoffData();
const earnings = CalculationUtils.calculateWeeklyEarnings(Number(driver.fee), cutoffData);
const weeklyAmount = Math.round(earnings.weeklyEarnings);
return weeklyAmount;
} else {
return 0;
}
}

async analyzeZonesByCourierAndHub(groupedData, bonusDataCache = null, forceRefreshBonus = false) {
if (!groupedData || !Array.isArray(groupedData)) {
groupedData = [];
}

const analysis = {};
let bonusData = bonusDataCache;
let driverData = null;

if (!bonusData || forceRefreshBonus) {
bonusData = await DataService.getBonusData(true);
}

try {
driverData = await DataService.getDriverData(forceRefreshBonus);
} catch (error) {
console.error('Error fetching driver data:', error);
driverData = [];
}

const askorTrueDrivers = await this.displayDriversWithAskorTrue(forceRefreshBonus);

const matchedBonuses = await this.checkCourierBonusMatch(groupedData, bonusData, forceRefreshBonus);

groupedData.forEach(row => {
const courierName = row["Courier Name"];
const courierCode = row["Courier Code"];
const hub = row["HUB"];
const zona = row["Zona"];
const totalPengiriman = row["Total Pengiriman"] || 0;
const weight = row["Weight"] || 0;
const addCost1 = row["Add Cost 1"] || 0;

if (row["Client Name"] !== "Sayurbox" || !zona || !courierName || !hub) return;

const key = `${hub}|${courierName}`;

if (!analysis[key]) {
const matchedBonus = matchedBonuses.find(bonus => 
bonus.courierCode === courierCode
);

const bonusValues = matchedBonus ? {
festiveBonus: Number(matchedBonus.festiveBonus) || 0,
afterRekon: Number(matchedBonus.afterRekon) || 0,
addPersonal: Number(matchedBonus.addPersonal) || 0,
incentives: Number(matchedBonus.incentives) || 0
} : CalculationUtils.getDefaultBonusValues(courierCode, bonusData);

analysis[key] = {
hub: hub,
courierName: courierName,
courierCode: courierCode || "",
zones: {
"ZONA 1": 0,
"ZONA 2": 0,
"ZONA 3": 0,
"ZONA 4": 0,
"ZONA 5": 0,
"ZONA 6": 0
},
totalPacket: 0,
totalWeight: 0,
fee: 0,
addWeight: 0,
heavyPrice: 0,
bonusPacket: 0,
festiveBonus: bonusValues.festiveBonus,
afterRekon: bonusValues.afterRekon,
addPersonal: bonusValues.addPersonal,
incentives: bonusValues.incentives,
askorFee: 0,
totalFee: 0
};
}

if (analysis[key].zones[zona] !== undefined) {
analysis[key].zones[zona] += totalPengiriman;
}

analysis[key].totalPacket += totalPengiriman;
analysis[key].totalWeight += weight;
analysis[key].heavyPrice += addCost1;
});

askorTrueDrivers.forEach(driver => {
const courierCode = driver.courierId || driver.username || "";
const courierName = driver.fullName || driver.username || "";
const hub = driver.hubLocation || "Unknown HUB";

const key = `${hub}|${courierName}`;

if (!analysis[key]) {
const bonusValues = CalculationUtils.getDefaultBonusValues(courierCode, bonusData);

analysis[key] = {
hub: hub,
courierName: courierName,
courierCode: courierCode,
zones: {
"ZONA 1": 0,
"ZONA 2": 0,
"ZONA 3": 0,
"ZONA 4": 0,
"ZONA 5": 0,
"ZONA 6": 0
},
totalPacket: 0,
totalWeight: 0,
fee: 0,
addWeight: 0,
heavyPrice: 0,
bonusPacket: 0,
festiveBonus: bonusValues.festiveBonus,
afterRekon: bonusValues.afterRekon,
addPersonal: bonusValues.addPersonal,
incentives: bonusValues.incentives,
askorFee: 0,
totalFee: 0
};
}
});

const askorPromises = Object.keys(analysis).map(async (key) => {
const data = analysis[key];
const courierCode = data.courierCode;

try {
const weeklyEarnings = await this.getDriverWeeklyEarnings(courierCode, driverData, false);
data.askorFee = weeklyEarnings;
} catch (error) {
console.error(`Error calculating weekly earnings for ${courierCode}:`, error);
data.askorFee = 0;
}
});

await Promise.all(askorPromises);

Object.keys(analysis).forEach(key => {
const data = analysis[key];
const totalPacket = data.totalPacket;

data.fee = CalculationUtils.calculateZoneFee(data.zones);
data.addWeight = CalculationUtils.calculateAddWeight(data.totalWeight);
data.bonusPacket = CalculationUtils.calculatePackageBonus(totalPacket);

data.totalFee = data.fee + data.heavyPrice + data.bonusPacket + 
data.festiveBonus + data.afterRekon + data.addPersonal + 
data.incentives + data.askorFee;
});

const result = Object.values(analysis);
return result;
}

async checkCourierBonusMatch(groupedData, bonusDataCache = null, forceRefreshBonus = false) {
try {
let bonusData = bonusDataCache;
if (!bonusData || forceRefreshBonus) {
bonusData = await DataService.getBonusData(forceRefreshBonus);
}

if (bonusData.length === 0) {
return [];
}

const courierCodes = [...new Set(groupedData
.filter(row => row["Courier Code"])
.map(row => row["Courier Code"]))];

const matchedBonuses = [];

courierCodes.forEach(courierCode => {
const matchingBonus = DataService.findBonusByDriverName(courierCode, bonusData);

if (matchingBonus) {
matchedBonuses.push({
courierCode,
festiveBonus: Number(matchingBonus.festiveBonus) || 0,
afterRekon: Number(matchingBonus.afterRekon) || 0,
addPersonal: Number(matchingBonus.addPersonal) || 0,
incentives: Number(matchingBonus.incentives) || 0
});
} else {
const defaultBonus = CalculationUtils.getDefaultBonusValues(courierCode, bonusData);
matchedBonuses.push({
courierCode,
festiveBonus: defaultBonus.festiveBonus,
afterRekon: defaultBonus.afterRekon,
addPersonal: defaultBonus.addPersonal,
incentives: defaultBonus.incentives
});
}
});

return matchedBonuses;
} catch (error) {
console.error('Error checking courier bonus match:', error);
return [];
}
}

async displayDriverBonusData(forceRefresh = false) {
try {
const bonusData = await DataService.getBonusData(forceRefresh);

if (bonusData.length === 0) {
console.log('Using default values for all couriers');
}

return bonusData;
} catch (error) {
console.error('Error fetching driver bonus data:', error);
return [];
}
}
}

export default new ZoneAnalyzer();