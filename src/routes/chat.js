import { Hono } from 'hono';
import { apiKeyAuth } from '../middleware/auth.js';
import { generateReply } from '../services/ai-client.js';

export const chatRouter = new Hono();

chatRouter.use('/chat', apiKeyAuth);

chatRouter.post('/chat', async (c) => {
  try {
    const payload = await c.req.json().catch(() => null);

    if (!payload || typeof payload !== 'object') {
      return c.json(
        {
          error: true,
          reason: 'Invalid JSON payload',
        },
        400,
      );
    }

    const { message } = payload;

    if (typeof message !== 'string' || message.trim().length === 0) {
      return c.json(
        {
          error: true,
          reason: 'Field "message" is required and must be a non-empty string',
        },
        400,
      );
    }

    const reply = await generateReply(message.trim());

    return c.json({
      error: false,
      reply,
    });
  } catch (error) {
    return c.json(
      {
        error: true,
        reason: error instanceof Error ? error.message : 'Internal server error',
      },
      500,
    );
  }
});
