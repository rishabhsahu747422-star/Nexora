import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT,
});

redis.on("connect", () => {
  console.log("Redis Connected");
});
redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});
export default redis;
