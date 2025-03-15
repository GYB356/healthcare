import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

export const loginRateLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 login attempts per minute per IP
  message: "Too many login attempts. Try again later.",
}); 