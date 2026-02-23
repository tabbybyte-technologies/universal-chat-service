const required = ['API_KEY'];

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
    'http://model-runner.docker.internal/engines/v1',
  modelId: process.env.MODEL_ID || 'ai/qwen3:4B-UD-Q4_K_XL',
  systemInstruction:
    'You are a concise and helpful assistant. Answer directly and keep responses practical.',
};
