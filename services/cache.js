const mongoose = require('mongoose');
const redis = require('redis');

(async () => {
  const client = redis.createClient({
    url: 'redis://192.168.56.54:6379',
  });

  const client2 = redis.createClient({
    url: 'redis://192.168.56.55:6379',
  });

  client.on('error', (err) => console.log('Redis Client Error 1', err));
  client2.on('error', (err) => console.log('Redis Client Error 2', err));

  await client.connect();
  console.log('Redis1 connected');
  await client2.connect();
  console.log('Redis2 connected');

  const exec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.cache = function () {
    this.useCache = true;
    this.time = 60;
    this.hashKey = JSON.stringify(this.mongooseCollection.name);
    console.log(this.time);

    return this;
  };

  mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
      return await exec.apply(this, arguments);
    }

    const key = 'bookCache';
    const cacheValue = await client2.HGET(this.hashKey, key);

    if (cacheValue) {
      const doc = JSON.parse(cacheValue);

      console.log('Response from Redis');
      return Array.isArray(doc)
        ? doc.map((d) => new this.model(d))
        : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    console.log(this.time);
    client.HSET(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, this.time);

    console.log('Response from MongoDB');
    return result;
  };

  module.exports = {
    clearKey(hashKey) {
      client.del(JSON.stringify(hashKey));
    },
  };
})();
