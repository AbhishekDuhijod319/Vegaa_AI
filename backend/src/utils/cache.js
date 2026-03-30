const NodeCache = require('node-cache');

// Shared caches with different TTLs per use case
const imageCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });     // 24h
const placesCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });       // 1h
const weatherCache = new NodeCache({ stdTTL: 900, checkperiod: 300 });       // 15min

/**
 * Generic get-or-fetch with caching
 * @param {NodeCache} cache - Cache instance
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @returns {Promise<*>} Cached or fresh data
 */
const getOrFetch = async (cache, key, fetchFn) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const data = await fetchFn();
  cache.set(key, data);
  return data;
};

const getCacheStats = () => ({
  images: imageCache.getStats(),
  places: placesCache.getStats(),
  weather: weatherCache.getStats(),
});

module.exports = {
  imageCache,
  placesCache,
  weatherCache,
  getOrFetch,
  getCacheStats,
};
