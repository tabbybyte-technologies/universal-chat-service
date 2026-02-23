import { createClient } from "redis";
import { config } from "../config.js";

// TTL (24 hours by default)
const SESSION_TTL_SECONDS = 60 * 60 * 24;

// Single-command append/trim/expire for lower per-request overhead.
const APPEND_SCRIPT = `
  local key = KEYS[1]
  local maxMessages = tonumber(ARGV[1])
  local ttlSeconds = tonumber(ARGV[2])
  local entry = ARGV[3]

  redis.call("RPUSH", key, entry)
  if maxMessages and maxMessages > 0 then
    redis.call("LTRIM", key, -maxMessages, -1)
  end
  redis.call("EXPIRE", key, ttlSeconds)
  return 1
`;

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
let connectPromise;

async function getClient() {
  if (client?.isOpen) return client;
  if (connectPromise) return connectPromise;

  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on("error", (err) => {
      console.error("[memory] Redis client error:", err.message);
    });
  }

  connectPromise = client
    .connect()
    .then(() => {
      console.log("[memory] Connected to Redis");
      return client;
    })
    .finally(() => {
      connectPromise = undefined;
    });

  return connectPromise;
}

export async function warmMemoryConnection() {
  await getClient();
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

  await redis.eval(APPEND_SCRIPT, {
    keys: [key],
    arguments: [
      String(config.memoryMaxMessages),
      String(SESSION_TTL_SECONDS),
      entry,
    ],
  });
}

/**
 * Build the model message list for a new user turn and persist
 * the user message in the background.
 * @param {string} userId
 * @param {string} userMessage
 * @param {string} [domain]
 * @param {string} [category]
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function prepareTurn(userId, userMessage, domain, category) {
  const history = await getHistory(userId, domain, category);
  const messages = [...history, { role: "user", content: userMessage }];
  void appendMessage(
    userId,
    "user",
    userMessage,
    domain,
    category,
  ).catch((err) => {
    console.error("[memory] failed to append user message:", err.message);
  });
  return messages;
}

/**
 * Persist assistant output without putting it on the API response path.
 * @param {string} userId
 * @param {string} assistantMessage
 * @param {string} [domain]
 * @param {string} [category]
 */
export function appendAssistantMessageInBackground(
  userId,
  assistantMessage,
  domain,
  category,
) {
  void appendMessage(userId, "assistant", assistantMessage, domain, category).catch(
    (err) => {
      console.error("[memory] failed to append assistant message:", err.message);
    },
  );
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
