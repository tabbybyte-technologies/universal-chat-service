import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.all("/health", (c) =>
  c.json({
    status: "ok",
  }),
);
