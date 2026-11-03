import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: `file:${path.join(os.tmpdir(), "auzy-api-test.db")}`,
      WEB_ORIGIN: "http://localhost:3000",
      COOKIE_SECURE: "false",
    },
  },
});
