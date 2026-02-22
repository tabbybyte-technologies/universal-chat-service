import { config } from '../config.js';

export async function apiKeyAuth(c, next) {
  const apiKey = c.req.header('X-API-KEY');

  if (!apiKey || apiKey !== config.apiKey) {
    return c.json(
      {
        error: true,
        reason: 'Unauthorized: invalid or missing X-API-KEY header',
      },
      401,
    );
  }

  await next();
}
