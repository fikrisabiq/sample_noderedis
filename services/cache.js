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

client.connect().then(() => {
  client.get = util.promisify(client.get);
  const exec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.cache = function (options = { time: 5 }) {
    this.useCache = true;
    this.time = options.time;
    this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

    return this;
  };

  mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
      return await exec.apply(this, arguments);
    }

    const key = JSON.stringify({
      ...this.getQuery(),
    });

    const cacheValue = await client.get(this.hashKey, key);

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
});
