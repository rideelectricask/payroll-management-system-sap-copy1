class CacheManager {
    constructor() {
        this.caches = new Map();
        this.defaultTTL = 5 * 60 * 1000;
    }

    createCache(name, ttl = this.defaultTTL) {
        this.caches.set(name, {
            data: null,
            timestamp: null,
            ttl: ttl
        });
    }

    set(name, data) {
        if (!this.caches.has(name)) {
            this.createCache(name);
        }
        
        const cache = this.caches.get(name);
        cache.data = Array.isArray(data) ? [...data] : data;
        cache.timestamp = Date.now();
        
        console.log(`✅ Cache '${name}' updated: ${Array.isArray(data) ? data.length : 1} records`);
    }

    get(name) {
        const cache = this.caches.get(name);
        if (!cache || !this.isValid(name)) {
            return null;
        }
        
        console.log(`📋 Using cached data for '${name}'`);
        return Array.isArray(cache.data) ? [...cache.data] : cache.data;
    }

    isValid(name) {
        const cache = this.caches.get(name);
        if (!cache || !cache.timestamp) return false;
        return (Date.now() - cache.timestamp) < cache.ttl;
    }

    invalidate(name) {
        if (this.caches.has(name)) {
            const cache = this.caches.get(name);
            cache.data = null;
            cache.timestamp = null;
            console.log(`🗑️ Cache '${name}' invalidated`);
        }
    }

    clear() {
        this.caches.clear();
        console.log('🗑️ All caches cleared');
    }

    getStats() {
        const stats = {};
        for (const [name, cache] of this.caches) {
            stats[name] = {
                hasData: !!cache.data,
                isValid: this.isValid(name),
                timestamp: cache.timestamp,
                ttl: cache.ttl
            };
        }
        return stats;
    }
}

export default new CacheManager();