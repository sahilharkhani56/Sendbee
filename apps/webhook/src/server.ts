import Fastify from "fastify";

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
});

const PORT = Number(process.env.WEBHOOK_PORT) || 4001;

// WhatsApp webhook verification (GET)
app.get("/webhook", async (req, reply) => {
  const mode = (req.query as Record<string, string>)["hub.mode"];
  const token = (req.query as Record<string, string>)["hub.verify_token"];
  const challenge = (req.query as Record<string, string>)["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    return reply.send(challenge);
  }
  return reply.status(403).send("Forbidden");
});

// WhatsApp webhook events (POST)
app.post("/webhook", async (req, reply) => {
  // TODO: Validate signature, parse events, push to queue
  app.log.info({ body: req.body }, "Webhook received");
  return reply.status(200).send("OK");
});

// Health check
app.get("/health", async () => ({ status: "ok" }));

async function main() {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🪝 Webhook server running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
