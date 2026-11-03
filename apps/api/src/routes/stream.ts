import { nowMs } from "@smart-home/utils";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { subscribe } from "../lib/events.js";
import { requireUser, type AuthedEnv } from "../middleware/auth.js";

export const streamRoutes = new Hono<AuthedEnv>();
streamRoutes.use("*", requireUser);

streamRoutes.get("/", (c) => {
  const userId = c.get("userId");
  return streamSSE(c, async (stream) => {
    let closed = false;
    const unsubscribe = subscribe((event) => {
      if (closed || event.userId !== userId) return;
      void stream.writeSSE({
        event: "reading",
        data: JSON.stringify(event),
      });
    });

    stream.onAbort(() => {
      closed = true;
      unsubscribe();
    });

    while (!closed) {
      await stream.writeSSE({ event: "ping", data: String(nowMs()) });
      await stream.sleep(15_000);
    }
  });
});
