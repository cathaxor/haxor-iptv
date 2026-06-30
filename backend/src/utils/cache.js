const NodeCache = require('node-cache');
const config = require('../config');

const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: 120,
  useClones: false,
  maxKeys: 5000,
});

function get(key) {
  return cache.get(key);
}

function set(key, value, ttl = null) {
  if (ttl) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
}

function del(key) {
  return cache.del(key);
}

function flush() {
  return cache.flushAll();
}

function delByPattern(pattern) {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  const matchedKeys = keys.filter((k) => regex.test(k));
  if (matchedKeys.length > 0) {
    cache.del(matchedKeys);
  }
  return matchedKeys.length;
}

function getStats() {
  return cache.getStats();
}

module.exports = { get, set, del, flush, delByPattern, getStats };
