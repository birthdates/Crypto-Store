import redis from "redis";
export const redisClient = redis.createClient();

export const incr = function (key: string): Promise<number> {
  return new Promise((resolve, reject) => {
    redisClient.incr(key, (err: any, reply: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};

export const del = function (key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    redisClient.del(key, (err: any, reply: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};
export const get = function (key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err: any, reply: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
};
