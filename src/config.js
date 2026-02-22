const required = ['API_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: Number(process.env.PORT || 3000),
  apiKey: process.env.API_KEY,
  llamaBaseUrl: process.env.LLAMA_BASE_URL || 'http://llama-cpp:8080/v1',
  llamaModel: process.env.LLAMA_MODEL || 'local-model',
  llamaApiKey: process.env.LLAMA_API_KEY || 'dummy',
  systemInstruction:
    'You are a concise and helpful assistant. Answer directly and keep responses practical.',
};
