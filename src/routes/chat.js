import { Hono } from "hono";
import { stream } from "hono/streaming";
import { apiKeyAuth } from "../middleware/auth.js";
import { streamReply, generateReply } from "../services/ai-client.js";
import {
  appendAssistantMessageInBackground,
  prepareTurn,
} from "../services/memory.js";

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

    const { message, userId, domain, category } = payload;

    if (typeof message !== "string" || message.trim().length === 0) {
      return c.json(
        {
          error: true,
          reason: 'Field "message" is required and must be a non-empty string',
        },
        400,
      );
    }

    if (!userId || typeof userId !== "string") {
      return c.json(
        {
          error: true,
          reason: 'Field "userId" is required and must be a non-empty string',
        },
        400,
      );
    }

    const userMessage = message.trim();

    const { messages, appendUserMessagePromise } = await prepareTurn(
      userId,
      userMessage,
      domain,
      category,
    );

    const shouldStream = c.req.query("nostreaming") === undefined;

    if (!shouldStream) {
      const t0 = performance.now();
      const [reply] = await Promise.all([generateReply(messages), appendUserMessagePromise]);
      void appendAssistantMessageInBackground(userId, reply, domain, category);
      console.debug(
        `[chat] generation took ${(performance.now() - t0).toFixed(1)}ms`,
      );
      return c.json({ error: false, reply, userId });
    }

    const textStream = streamReply(messages);

    return stream(c, async (s) => {
      const t0 = performance.now();
      let fullReply = "";
      try {
        // Drain the stream; user-append resolves in the background.
        await appendUserMessagePromise;
        for await (const chunk of textStream) {
          fullReply += chunk;
          await s.write(chunk);
        }

        void appendAssistantMessageInBackground(userId, fullReply, domain, category);

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
