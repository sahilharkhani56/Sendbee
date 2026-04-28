import { Redis } from "@upstash/redis";
import { env } from "./env";

const hasRedisConfig = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasRedisConfig
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function markWebhookMessageProcessed(
  messageId: string,
  ttlSeconds = 24 * 60 * 60
): Promise<boolean> {
  if (!redis) {
    return true;
  }

  const key = `wa_dedup:${messageId}`;
  const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

export async function touchWaSessionWindow(
  tenantId: string,
  phoneE164: string,
  ttlSeconds = 24 * 60 * 60
): Promise<void> {
  if (!redis) {
    return;
  }

  const key = `wa_session:${tenantId}:${phoneE164}`;
  await redis.set(key, new Date().toISOString(), { ex: ttlSeconds });
}
