import { fetchBonusData, fetchDriverData } from './api.js';
import CacheManager from '../cache/CacheManager.js';

class DataService {
constructor() {
this.bonusCacheName = 'bonusData';
this.driverCacheName = 'driverData';
this.initializeCaches();
}

initializeCaches() {
CacheManager.createCache(this.bonusCacheName);
CacheManager.createCache(this.driverCacheName);
}

async getBonusData(forceRefresh = false) {
if (!forceRefresh) {
const cachedData = CacheManager.get(this.bonusCacheName);
if (cachedData) return cachedData;
}

try {
console.log('🔄 Fetching fresh bonus data from API...');
CacheManager.invalidate(this.bonusCacheName);

const freshData = await fetchBonusData();
const normalizedData = freshData ? [...freshData] : [];

CacheManager.set(this.bonusCacheName, normalizedData);
return normalizedData;

} catch (error) {
console.error('Error fetching bonus data:', error);
CacheManager.invalidate(this.bonusCacheName);
return [];
}
}

async getDriverData(forceRefresh = false) {
if (!forceRefresh) {
const cachedData = CacheManager.get(this.driverCacheName);
if (cachedData) return cachedData;
}

try {
console.log('🔄 Fetching fresh driver data from API...');
CacheManager.invalidate(this.driverCacheName);

const freshData = await fetchDriverData();
const normalizedData = freshData ? [...freshData] : [];

CacheManager.set(this.driverCacheName, normalizedData);
return normalizedData;

} catch (error) {
console.error('Error fetching driver data:', error);
CacheManager.invalidate(this.driverCacheName);
return [];
}
}

async getAskorTrueDrivers(forceRefresh = false) {
const driverData = await this.getDriverData(forceRefresh);

if (driverData.length === 0) {
console.log('No driver data available');
return [];
}

const askorTrueDrivers = driverData.filter(driver => 
driver.askor && driver.askor.toString().toUpperCase() === 'TRUE'
);

return askorTrueDrivers;
}

createDriverIndex(drivers) {
const index = new Map();

drivers.forEach(driver => {
if (driver.courierId) {
index.set(driver.courierId.toLowerCase(), driver);
}
if (driver.username) {
index.set(driver.username.toLowerCase(), driver);
}
if (driver.fullName) {
index.set(driver.fullName.toLowerCase(), driver);
}
});

return index;
}

findDriverByCode(courierCode, drivers) {
const index = this.createDriverIndex(drivers);
return index.get(courierCode.toLowerCase()) || null;
}

findBonusByDriverName(driverName, bonusData) {
return bonusData.find(bonus => 
bonus.driverName && bonus.driverName.toLowerCase() === driverName.toLowerCase()
);
}

refreshBonusData() {
CacheManager.invalidate(this.bonusCacheName);
console.log('🔄 Bonus data will be refreshed on next request');
}

refreshDriverData() {
CacheManager.invalidate(this.driverCacheName);
console.log('🔄 Driver data will be refreshed on next request');
}

getCacheStats() {
return CacheManager.getStats();
}
}

export default new DataService();