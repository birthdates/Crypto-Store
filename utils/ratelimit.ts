import { NextApiRequest, NextApiResponse } from "next";
import { redisClient, incr } from "./redis";

/**
 * Rate limit middleware conifguration
 */
export type RateLimitConfig = {
  expiry: number;
  max: number;
  id: string;
};

/**
 * Rate limit middleware
 * @param config Rate limit config
 * @returns Middleware
 */
export const RateLimit = (config: RateLimitConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.socket) return false;
    const address: string = req.socket.remoteAddress as string;
    const key: string = `ratelimits-${config.id}-${address}`;
    const amount: number = await incr(key);
    redisClient.expire(key, config.expiry);
    if (amount < config.max) return true;
    res.status(429).json({ error: "Too many requests" });
    return false;
  };
};
