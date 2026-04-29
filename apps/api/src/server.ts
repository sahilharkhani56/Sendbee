import { buildApp } from "./app";
import { env } from "./env";
import { initSocketServer } from "./socket";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });

    // Initialize Socket.io on the underlying HTTP server
    const httpServer = app.server;
    initSocketServer(httpServer);

    console.log(`🚀 API server running on http://${env.HOST}:${env.PORT}`);
    console.log(`🔌 Socket.io attached (WebSocket + polling)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
