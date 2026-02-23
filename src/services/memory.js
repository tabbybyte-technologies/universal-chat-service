import { createClient } from "redis";
import { config } from "../config.js";

// TTL (24 hours by default)
const SESSION_TTL_SECONDS = 60 * 60 * 24;

/**
 * Build the Redis key: chat:<userId>::<domain>:<category>
 * @param {string} userId
 * @param {string} [domain="universal"]
 * @param {string} [category="general"]
 */
function buildKey(userId, domain = "universal", category = "general") {
  return `chat:${userId}::${domain}:${category}`;
}

let client;

async function getClient() {
  if (client) return client;

  client = createClient({ url: config.redisUrl });

  client.on("error", (err) => {
    console.error("[memory] Redis client error:", err.message);
  });

  await client.connect();
  console.log("[memory] Connected to Redis at", config.redisUrl);
  return client;
}

/**
 * Append a single message to a session's history.
 * @param {string} userId
 * @param {"user"|"assistant"} role
 * @param {string} content
 * @param {string} [domain]
 * @param {string} [category]
 */
export async function appendMessage(userId, role, content, domain, category) {
  const redis = await getClient();
  const key = buildKey(userId, domain, category);
  const entry = JSON.stringify({ role, content });

  // Push to the right of the list, then trim to max length
  await redis.rPush(key, entry);
  await redis.lTrim(key, -config.memoryMaxMessages, -1);
  await redis.expire(key, SESSION_TTL_SECONDS);
}

/**
 * Retrieve the full history for a session as an array of {role, content} objects.
 * @param {string} userId
 * @param {string} [domain]
 * @param {string} [category]
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function getHistory(userId, domain, category) {
  const redis = await getClient();
  const key = buildKey(userId, domain, category);

  const entries = await redis.lRange(key, 0, -1);
  return entries.map((e) => JSON.parse(e));
}

/**
 * Delete history for a user, using wildcard matching for any omitted scope component.
 *
 * | domain | category | pattern used                        |
 * |--------|----------|-------------------------------------|
 * | ✔      | ✔        | `chat:<userId>::<domain>:<category>` (exact, no scan) |
 * | ✔      | ✗        | `chat:<userId>::<domain>:*`          |
 * | ✗      | ✔        | `chat:<userId>::*:<category>`        |
 * | ✗      | ✗        | `chat:<userId>::*`                   |
 *
 * @param {string} userId
 * @param {string} [domain]
 * @param {string} [category]
 * @returns {Promise<number>} number of keys deleted
 */
export async function clearHistory(userId, domain, category) {
  const redis = await getClient();

  // Exact key — skip the scan entirely
  if (domain && category) {
    return redis.del(buildKey(userId, domain, category));
  }

  const domainGlob = domain || "*";
  const categoryGlob = category || "*";
  const pattern = `chat:${userId}::${domainGlob}:${categoryGlob}`;

  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }
  if (keys.length === 0) return 0;
  return redis.del(keys);
}
