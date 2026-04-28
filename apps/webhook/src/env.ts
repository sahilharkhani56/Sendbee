import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  WEBHOOK_PORT: z.coerce.number().default(4001),

  DATABASE_URL: z.string().url(),

  // Meta challenge verification token.
  WA_VERIFY_TOKEN: z.string().optional(),
  WA_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // Used for x-hub-signature-256 verification.
  WA_APP_SECRET: z.string().optional(),

  // Optional: enables webhook dedupe + 24h session tracking.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid webhook environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const verifyToken = parsed.data.WA_WEBHOOK_VERIFY_TOKEN ?? parsed.data.WA_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("Missing WA_VERIFY_TOKEN (or WA_WEBHOOK_VERIFY_TOKEN)");
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();
export const webhookVerifyToken = env.WA_WEBHOOK_VERIFY_TOKEN ?? env.WA_VERIFY_TOKEN!;
