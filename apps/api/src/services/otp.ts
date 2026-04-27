import crypto from "crypto";
import { redis } from "../redis";

const OTP_EXPIRY = 300; // 5 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const MAX_SENDS_PER_HOUR = 5;

interface OtpData {
  code: string;
  attempts: number;
}

function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  return String(crypto.randomInt(100000, 999999));
}

export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const rateKey = `otp_rate:${phone}`;
  const sendCount = await redis.incr(rateKey);

  if (sendCount === 1) {
    await redis.expire(rateKey, RATE_LIMIT_WINDOW);
  }

  if (sendCount > MAX_SENDS_PER_HOUR) {
    return { success: false, message: "Too many OTP requests. Try again later." };
  }

  const code = generateOtp();
  const otpKey = `otp:${phone}`;

  await redis.set(otpKey, JSON.stringify({ code, attempts: 0 } satisfies OtpData), {
    ex: OTP_EXPIRY,
  });

  // In production, send via MSG91 / WhatsApp
  // For dev, log the OTP (never log in production)
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${phone}: ${code}`);
  }

  return { success: true, message: "OTP sent successfully" };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; message: string }> {
  const otpKey = `otp:${phone}`;
  const raw = await redis.get<string>(otpKey);

  if (!raw) {
    return { valid: false, message: "OTP expired or not found" };
  }

  const data: OtpData = typeof raw === "string" ? JSON.parse(raw) : raw;

  if (data.attempts >= MAX_ATTEMPTS) {
    await redis.del(otpKey);
    return { valid: false, message: "Too many wrong attempts. Request a new OTP." };
  }

  if (data.code !== code) {
    data.attempts += 1;
    const ttl = await redis.ttl(otpKey);
    await redis.set(otpKey, JSON.stringify(data), { ex: ttl > 0 ? ttl : OTP_EXPIRY });
    return { valid: false, message: "Invalid OTP" };
  }

  // OTP is correct — delete it so it can't be reused
  await redis.del(otpKey);
  return { valid: true, message: "OTP verified" };
}
