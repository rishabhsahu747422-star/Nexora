import redis from "../config/redis.js";
import ApiError from "../utils/ApiError.js";

// In-process memory blocklist ensures revoked tokens within node lifecycle are never bypassed
const localBlocklist = new Set();

/**
 * Persist revoked token to distributed Redis blocklist and local in-process cache
 */
export const blocklistToken = async (token, type = "accessToken", ttlSeconds = 3600) => {
  if (!token) return;
  const key = `Bearer:${type}:${token}`;
  localBlocklist.add(key);

  try {
    if (redis.status === "ready") {
      await redis.set(key, "revoked", "EX", ttlSeconds);
    }
  } catch (err) {
    console.warn(`[Security] Redis blocklist write failed: ${err.message}`);
    if (process.env.FAIL_CLOSED_AUTH === "true") {
      throw new ApiError(503, "Security service unavailable: unable to guarantee token revocation");
    }
  }
};

/**
 * Check if token is revoked.
 * Adheres to explicit FAIL_CLOSED_AUTH policy when configured.
 */
export const isTokenBlocklisted = async (token, type = "accessToken") => {
  if (!token) return true;
  const key = `Bearer:${type}:${token}`;

  // Check local cache
  if (localBlocklist.has(key)) {
    return true;
  }

  try {
    if (redis.status === "ready") {
      const val = await redis.get(key);
      if (val) return true;
    } else if (process.env.FAIL_CLOSED_AUTH === "true") {
      throw new ApiError(503, "Security verification service unavailable: blocklist unreachable");
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn(`[Security] Redis blocklist check failed: ${err.message}`);
    if (process.env.FAIL_CLOSED_AUTH === "true") {
      throw new ApiError(503, "Security verification service unavailable: blocklist unreachable");
    }
  }

  return false;
};
