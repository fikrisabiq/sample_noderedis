const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
// const keys = require("../config/keys");

const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  retry_strategy: () => 1000,
});

client.on('error', function (err) {
  console.error('Errro encountered: ', err);
});

client.on('connect', () => {
  console.log('Redis connected');
});

client.HGET = util.promisify(client.HGET);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = { time: 60 }) {
  this.useCache = true;
  this.time = options.time;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

  return this;
};
console.log('query protype cache');

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    console.log('query exec');
    return await exec.apply(this, arguments);
  }
  console.log('ava');

  const key = JSON.stringify({
    ...this.getQuery(),
  });
  console.log(`key: ${key}`);

  console.log('menunggu cache value');
  console.log(this.hashKey);
  console.log(this.getQuery());
  console.log(this);
  const cacheValue = await client.HGET(this.hashKey, key);
  console.log(`cachevalue: ${cacheValue}`);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    console.log('Response from Redis');
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  const result = await exec.apply(this, arguments);
  console.log(this.time);
  client.hset(this.hashKey, key, JSON.stringify(result));
  client.expire(this.hashKey, this.time);

  console.log('Response from MongoDB');
  return result;
};

module.exports = {
  clearKey(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
