import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT,
});

redis.on("connect", () => {
  console.log("Reedis Connected");
});
export default redis;
