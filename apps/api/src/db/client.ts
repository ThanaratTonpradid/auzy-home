import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "../env.js";
import * as schema from "./schema.js";

const url = env.databaseUrl.startsWith("file:")
  ? env.databaseUrl
  : `file:${env.databaseUrl}`;

export const sqlite = createClient({ url });
export const db = drizzle(sqlite, { schema });
