import crypto from "node:crypto";
import Fastify from "fastify";
import rawBodyPlugin from "fastify-raw-body";
import { env, webhookVerifyToken } from "./env";
import { processWhatsAppWebhook, type WhatsAppWebhookPayload } from "./whatsapp-webhook";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
});

void app.register(rawBodyPlugin, {
  field: "rawBody",
  global: false,
  encoding: "utf8",
  runFirst: true,
});

app.get("/webhook", async (req, reply) => {
  const query = req.query as Record<string, string | undefined>;
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && token === webhookVerifyToken && challenge) {
    return reply.code(200).type("text/plain").send(challenge);
  }

  return reply.code(403).send({ error: "Forbidden" });
});

app.post(
  "/webhook",
  {
    config: {
      rawBody: true,
    },
  },
  async (req, reply) => {
    if (env.WA_APP_SECRET) {
      const signature = req.headers["x-hub-signature-256"];
      const rawBody = (req as unknown as { rawBody?: string }).rawBody;

      if (!isValidMetaSignature(signature, rawBody, env.WA_APP_SECRET)) {
        req.log.warn("Invalid webhook signature");
        return reply.code(401).send({ error: "Invalid signature" });
      }
    }

    const payload = req.body as WhatsAppWebhookPayload;

    try {
      await processWhatsAppWebhook(payload, req.log);
      return reply.code(200).send({ ok: true });
    } catch (error) {
      req.log.error({ error }, "Failed to process WhatsApp webhook");
      return reply.code(500).send({ error: "Webhook processing failed" });
    }
  }
);

app.get("/health", async () => ({ status: "ok" }));

async function main() {
  try {
    await app.listen({ port: env.WEBHOOK_PORT, host: "0.0.0.0" });
    console.log(`Webhook server running on port ${env.WEBHOOK_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

function isValidMetaSignature(
  signatureHeader: string | string[] | undefined,
  rawBody: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || Array.isArray(signatureHeader) || !rawBody) {
    return false;
  }

  const [algorithm, receivedHash] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !receivedHash) {
    return false;
  }

  const expectedHash = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const expected = Buffer.from(expectedHash, "utf8");
  const received = Buffer.from(receivedHash, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

void main();
