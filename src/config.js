const required = ["API_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: Number(process.env.PORT || 3000),
  apiKey: process.env.API_KEY,
  modelBaseUrl:
    process.env.MODEL_BASE_URL ||
    "http://model-runner.docker.internal/engines/v1",
  modelId: process.env.MODEL_ID || "ai/qwen3:4B-UD-Q4_K_XL",
  systemInstruction:
    "You are a helpful chatbot. Always answer in a concise manner. Use a friendly, conversational tone. Never sound robotic. Use provided context (if any) and past conversation history to answer questions. Do not hallucinate or make up information. If you don't know the answer, say you don't know.",
  redisUrl: process.env.REDIS_URL || "redis://redis:6379",
  // Maximum number of messages (user + assistant turns) retained per session
  memoryMaxMessages: Number(process.env.MEMORY_MAX_MESSAGES || 20),
};
