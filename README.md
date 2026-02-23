# universal-chat-service

A lightweight, Dockerized chat API built with [Hono](https://hono.dev/) and the [Vercel AI SDK](https://sdk.vercel.ai/). It exposes a simple REST endpoint that forwards messages to a local LLM served by [Docker Model Runner](https://docs.docker.com/ai/model-runner/), backed by Redis.

## Stack

| Service | Technology |
|---|---|
| API | Node.js 22 · Hono · Vercel AI SDK (`@ai-sdk/openai-compatible`) |
| LLM | Docker Model Runner (OpenAI-compatible endpoint) |
| Cache / broker | Redis 7 alpine |

## Project structure

```
src/
├── config.js              # Centralised env-var config
├── server.js              # Entry point – mounts routes
├── middleware/
│   └── auth.js            # X-API-KEY header guard
├── routes/
│   ├── chat.js            # POST /chat
│   └── health.js          # ANY  /health
└── services/
    └── ai-client.js       # Vercel AI SDK wrapper
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.40 with **Docker Model Runner** enabled (Settings → Features in development)

## Quick start

1. **Copy the env file and set your API key**

   ```bash
   cp .env.example .env   # or create .env manually
   # Set at minimum: API_KEY=your-secret-key
   ```

2. **Start the stack**

   ```bash
   docker compose up --build
   ```

   The API will be available at `http://localhost:3030` by default.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `API_KEY` | `change-me` | Secret key sent by clients in the `X-API-KEY` header. **Required.** |
| `PORT` | `3000` (container) / `3030` (host) | Port the API listens on |
| `MODEL_BASE_URL` | `http://model-runner.docker.internal/engines/v1` | Base URL of the OpenAI-compatible LLM endpoint |
| `MODEL_ID` | `ai/qwen3:4B-UD-Q4_K_XL` | Model identifier forwarded to the provider |
| `DMR_MODEL` | `ai/qwen3:4B-UD-Q4_K_XL` | Docker Model Runner model to pull and serve |

> `MODEL_BASE_URL` and `MODEL_ID` are injected automatically by Docker Compose via the `models:` block, so you only need to set them manually when running outside of Compose.

## API reference

### `ANY /health`

Unauthenticated liveness check.

**Response `200`**
```json
{ "status": "ok" }
```

---

### `POST /chat`

Send a message to the LLM and receive a reply.

**Headers**

| Header | Required | Description |
|---|---|---|
| `X-API-KEY` | Yes | Must match the `API_KEY` env variable |
| `Content-Type` | Yes | `application/json` |

**Query parameters**

| Parameter | Required | Description |
|---|---|---|
| `nostreaming` | No | When present (any value), disables streaming and returns a buffered JSON response instead |

By default the response is streamed as plain text (`text/plain; charset=utf-8`, chunked transfer encoding). Pass `?nostreaming` to receive a single JSON object once the full reply is ready.

**Request body**

```json
{ "message": "What is the capital of France?" }
```

**Success response — streaming (default)**

Chunked plain-text stream of the reply as it is generated.

**Success response — non-streaming (`?nostreaming`)**

```json
{
  "error": false,
  "reply": "Paris."
}
```

**Error response**

```json
{
  "error": true,
  "reason": "<description>"
}
```

| Status | Cause |
|---|---|
| `400` | Missing / invalid JSON or empty `message` field |
| `401` | Missing or incorrect `X-API-KEY` |
| `500` | LLM or unexpected server error |

## Development (without Docker)

```bash
npm install
API_KEY=dev-key node src/server.js
```

The service connects to whatever `MODEL_BASE_URL` resolves to, so you can point it at any running OpenAI-compatible server (Ollama, llama.cpp, etc.).

## License

MIT
