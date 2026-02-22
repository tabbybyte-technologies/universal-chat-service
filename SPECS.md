Create a docker compose stack with the following services:

## Service 1: Node JS API

- User nodejs alpine slim base image to create a lightweight API server.
- Use Hono and expose a endpoint `POST /chat` that accepts a JSON payload with a mandatory `message` field and responds with a JSON object containing a  `error: false` and a `reply` field on success. On error, respond with `error: true` and an appropriate error message in `reason` field. Add minimal validations.
- This endpoint must be authenticated using a simple API key mechanism. The client must include an `X-API-KEY` header for this.
-   add a minimal `ANY /health` endpoint (unauthenticated) that returns a JSON object with `status: "ok"`.
- the controller code for /chat:
  - pass the `message` received to a Vercel ai sdk core `generateText` call
  - it should have a fixed system instruction
  - for model use the package `@ai-sdk/openai-compatible`
  - it should connect to a running llama cpp server endpoint in Service 2
  - messages array format should be used (assume single message turn for now)
  - keep things simple, yet modular
  - DO NOT add extra convoluted code like tests, deep validations, server checks, etc

## Service 2: Llama CPP Server

- Use the official Llama CPP Docker image to run a openai compatible Llama CPP server.
- Expose the necessary ports for inter service communication with the Node JS API service.
- no externally accessible port
- Ensure that the server is configured to accept requests from the Node JS API service.
- a gguf model file would be placed at a top-level dir `models/` which should be mounted as a volume in the Llama CPP container.
- this .gguf model file should be gitignored, but the `models/` folder be .gitkeeped to allow for the volume mount.

## Service 3: Redis - Use the official Redis Docker image to run a Redis server.
- Expose the necessary ports for inter service communication with the Node JS API service.
- no externally accessible port
- Ensure that the server is configured to accept requests from the Node JS API service.