import { normalize } from "../utils/formatters.js";

export class HeaderMapper {
  constructor(headers) {
    this.headerMap = new Map();
    this.cache = new Map();
    
    headers.forEach(header => {
      this.headerMap.set(normalize(header), header);
    });
  }

  findValue(jsonItem, targetHeader) {
    const cacheKey = `${targetHeader}_${JSON.stringify(Object.keys(jsonItem))}`;
    
    if (this.cache.has(cacheKey)) {
      const actualHeader = this.cache.get(cacheKey);
      return actualHeader ? jsonItem[actualHeader] : "";
    }

    const normalizedTarget = normalize(targetHeader);
    const actualHeader = this.headerMap.get(normalizedTarget);
    
    this.cache.set(cacheKey, actualHeader);
    
    return actualHeader ? jsonItem[actualHeader] : "";
  }

  getValue(jsonItem, key) {
    return this.findValue(jsonItem, key);
  }

  getNumber(jsonItem, key) {
    return Number(this.findValue(jsonItem, key)) || 0;
  }
}