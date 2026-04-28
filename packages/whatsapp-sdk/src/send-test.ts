import { WhatsAppClient } from "./client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeToE164(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\D/g, "")}`;
  }

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return `+${digits}`;
}

async function main() {
  const phoneNumberId = requireEnv("WA_PHONE_NUMBER_ID");
  const accessToken = requireEnv("WA_ACCESS_TOKEN");
  const to = normalizeToE164(requireEnv("WA_TEST_TO"));
  const message = process.env.WA_TEST_TEXT ?? "Hello from WhatsApp CRM Step 3 test.";

  const client = new WhatsAppClient({
    phoneNumberId,
    accessToken,
  });

  const result = await client.sendText({
    to,
    body: message,
  });

  console.log(JSON.stringify({ ok: true, to, messageId: result.messageId }, null, 2));
}

main().catch((error) => {
  console.error("send:test failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
