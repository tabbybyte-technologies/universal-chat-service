import { Hono } from "hono";
import { stream } from "hono/streaming";
import { apiKeyAuth } from "../middleware/auth.js";
import { streamReply, generateReply } from "../services/ai-client.js";

export const chatRouter = new Hono();

chatRouter.use("/chat", apiKeyAuth);

chatRouter.post("/chat", async (c) => {
  try {
    const payload = await c.req.json().catch(() => null);

    if (!payload || typeof payload !== "object") {
      return c.json(
        {
          error: true,
          reason: "Invalid JSON payload",
        },
        400,
      );
    }

    const { message } = payload;

    if (typeof message !== "string" || message.trim().length === 0) {
      return c.json(
        {
          error: true,
          reason: 'Field "message" is required and must be a non-empty string',
        },
        400,
      );
    }

    const shouldStream = c.req.query("nostreaming") === undefined;

    if (!shouldStream) {
      const t0 = performance.now();
      const reply = await generateReply(message.trim());
      console.debug(
        `[chat] generation took ${(performance.now() - t0).toFixed(1)}ms`,
      );
      return c.json({ error: false, reply });
    }

    const textStream = streamReply(message.trim());

    return stream(c, async (s) => {
      try {
        const t0 = performance.now();
        for await (const chunk of textStream) {
          await s.write(chunk);
        }
        console.debug(
          `[chat] stream completed in ${(performance.now() - t0).toFixed(1)}ms`,
        );
      } catch (error) {
        await s.write(
          `\n[error] ${error instanceof Error ? error.message : "Internal server error"}`,
        );
      }
    });
  } catch (error) {
    return c.json(
      {
        error: true,
        reason:
          error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
