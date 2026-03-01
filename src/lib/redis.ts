import Redis from "ioredis";

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    client.on("error", (err) => {
      console.error("[REDIS]", err.message);
    });

    return client;
  } catch {
    return null;
  }
}

const redis = createRedisClient();

async function isRedisAvailable(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

const OTP_PREFIX = "otp:";
const OTP_ATTEMPTS_PREFIX = "otp_attempts:";
const OTP_SEND_LIMIT_PREFIX = "otp_send:";
const RATE_LIMIT_PREFIX = "ratelimit:";
const CREDITS_PREFIX = "credits:";

export async function setOtp(
  email: string,
  code: string,
  ttl: number = 300
): Promise<void> {
  const key = `${OTP_PREFIX}${email}`;
  if (await isRedisAvailable()) {
    await redis!.set(key, code, "EX", ttl);
  } else {
    console.warn("[REDIS] Unavailable — using in-memory OTP store");
    memoryStore.set(key, { value: code, expiresAt: Date.now() + ttl * 1000 });
  }
}

export async function getOtp(email: string): Promise<string | null> {
  const key = `${OTP_PREFIX}${email}`;
  if (await isRedisAvailable()) {
    return redis!.get(key);
  }
  cleanExpired();
  const entry = memoryStore.get(key);
  return entry ? entry.value : null;
}

export async function deleteOtp(email: string): Promise<void> {
  const key = `${OTP_PREFIX}${email}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${email}`;
  if (await isRedisAvailable()) {
    await redis!.del(key, attemptsKey);
  } else {
    memoryStore.delete(key);
    memoryStore.delete(attemptsKey);
  }
}

export async function incrementOtpAttempts(email: string): Promise<number> {
  const key = `${OTP_ATTEMPTS_PREFIX}${email}`;
  const ttl = 300;
  if (await isRedisAvailable()) {
    const count = await redis!.incr(key);
    if (count === 1) await redis!.expire(key, ttl);
    return count;
  }
  cleanExpired();
  const existing = memoryStore.get(key);
  const count = existing ? parseInt(existing.value, 10) + 1 : 1;
  memoryStore.set(key, {
    value: count.toString(),
    expiresAt: existing?.expiresAt ?? Date.now() + ttl * 1000,
  });
  return count;
}

export async function getOtpAttempts(email: string): Promise<number> {
  const key = `${OTP_ATTEMPTS_PREFIX}${email}`;
  if (await isRedisAvailable()) {
    const value = await redis!.get(key);
    return value ? parseInt(value, 10) : 0;
  }
  cleanExpired();
  const entry = memoryStore.get(key);
  return entry ? parseInt(entry.value, 10) : 0;
}

export async function checkOtpSendLimit(
  email: string,
  maxPerWindow: number = 3,
  windowSeconds: number = 300
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds?: number }> {
  const key = `${OTP_SEND_LIMIT_PREFIX}${email}`;

  if (await isRedisAvailable()) {
    const count = await redis!.incr(key);
    if (count === 1) await redis!.expire(key, windowSeconds);
    const ttl = await redis!.ttl(key);
    if (count > maxPerWindow) {
      return { allowed: false, remaining: 0, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
    }
    return { allowed: true, remaining: maxPerWindow - count };
  }

  cleanExpired();
  const existing = memoryStore.get(key);
  const count = existing ? parseInt(existing.value, 10) + 1 : 1;
  const expiresAt = existing?.expiresAt ?? Date.now() + windowSeconds * 1000;
  memoryStore.set(key, { value: count.toString(), expiresAt });

  if (count > maxPerWindow) {
    const retryAfterSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: maxPerWindow - count };
}

export async function setRateLimit(
  key: string,
  ttl: number
): Promise<void> {
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  if (await isRedisAvailable()) {
    const current = await redis!.incr(redisKey);
    if (current === 1) await redis!.expire(redisKey, ttl);
  } else {
    cleanExpired();
    const existing = memoryStore.get(redisKey);
    const current = existing ? parseInt(existing.value, 10) + 1 : 1;
    memoryStore.set(redisKey, {
      value: current.toString(),
      expiresAt: existing?.expiresAt ?? Date.now() + ttl * 1000,
    });
  }
}

export async function getRateLimit(key: string): Promise<number> {
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  if (await isRedisAvailable()) {
    const value = await redis!.get(redisKey);
    return value ? parseInt(value, 10) : 0;
  }
  cleanExpired();
  const entry = memoryStore.get(redisKey);
  return entry ? parseInt(entry.value, 10) : 0;
}

export async function incrementCreditsUsed(userId: string): Promise<number> {
  const key = `${CREDITS_PREFIX}${userId}:daily`;
  if (await isRedisAvailable()) {
    const count = await redis!.incr(key);
    if (count === 1) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      await redis!.expire(key, ttl);
    }
    return count;
  }
  cleanExpired();
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
  const existing = memoryStore.get(key);
  const count = existing ? parseInt(existing.value, 10) + 1 : 1;
  memoryStore.set(key, {
    value: count.toString(),
    expiresAt: existing?.expiresAt ?? Date.now() + ttl * 1000,
  });
  return count;
}

export default redis;
