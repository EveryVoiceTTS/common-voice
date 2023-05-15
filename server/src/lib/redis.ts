import * as Redis from 'ioredis';
import * as Redlock from 'redlock';
import { getConfig } from '../config-helper';

export const redis = new Redis(getConfig().REDIS_URL);

export const redlock = new Redlock([redis], { retryCount: -1 });

export const useRedis = new Promise(resolve => {
  redis.on('ready', () => {
    console.log('useRedis: Using Redis');
    resolve(true);
  });
  redis.on('error', err => {
    console.log(`ERROR: Redis failed to connect to ${getConfig().REDIS_URL} with error: ${err}`);
    resolve(false);
    return redis.quit();
  });
}).then(val => {
  console.log('Cache is', val ? 'redis' : 'in-memory');
  return val;
});
