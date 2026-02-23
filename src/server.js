import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { chatRouter } from "./routes/chat.js";
import { warmMemoryConnection } from "./services/memory.js";

const app = new Hono();

app.route("/", healthRouter);
app.route("/", chatRouter);

warmMemoryConnection().catch((err) => {
  console.warn("[memory] Redis warm-up failed:", err.message);
});

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`API server listening on http://localhost:${info.port}`);
  },
);
