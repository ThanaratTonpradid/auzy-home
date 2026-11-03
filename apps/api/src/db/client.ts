import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "../env.js";
import * as schema from "./schema.js";

// env.ts sets process.env.TZ (default Asia/Bangkok) before this module loads,
// so SQLite datetime('now','localtime') and Node timestamps stay aligned.
const url = env.databaseUrl.startsWith("file:")
  ? env.databaseUrl
  : `file:${env.databaseUrl}`;

export const sqlite = createClient({ url });
export const db = drizzle(sqlite, { schema });
