import { hashApiKey, apiKeyHint } from "../lib/api-key.js";
import { sqlite } from "./client.js";

function columnNames(rows: Array<Record<string, unknown>>) {
  return new Set(
    rows.map((row) => String(row.name ?? row.Name ?? "")).filter(Boolean),
  );
}

export async function migrate() {
  await sqlite.execute("PRAGMA foreign_keys = ON;");
  await sqlite.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT,
      notes TEXT,
      api_key_hash TEXT NOT NULL UNIQUE,
      api_key_hint TEXT NOT NULL,
      power_state TEXT NOT NULL DEFAULT 'unknown',
      last_seen_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS devices_user_idx ON devices(user_id);

    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      payload TEXT NOT NULL,
      received_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS readings_device_time_idx ON readings(device_id, received_at);
  `);

  await migrateLegacyDevices();
  await sqlite.execute("CREATE INDEX IF NOT EXISTS devices_api_key_hash_idx ON devices(api_key_hash)");
}

async function migrateLegacyDevices() {
  const info = await sqlite.execute("PRAGMA table_info(devices)");
  const columns = columnNames(info.rows as Array<Record<string, unknown>>);
  if (!columns.has("api_key") || columns.has("api_key_hash")) return;

  if (!columns.has("api_key_hash")) {
    await sqlite.execute("ALTER TABLE devices ADD COLUMN api_key_hash TEXT");
  }
  if (!columns.has("api_key_hint")) {
    await sqlite.execute("ALTER TABLE devices ADD COLUMN api_key_hint TEXT");
  }
  if (!columns.has("power_state")) {
    await sqlite.execute("ALTER TABLE devices ADD COLUMN power_state TEXT NOT NULL DEFAULT 'unknown'");
  }

  const rows = await sqlite.execute("SELECT id, api_key FROM devices");
  for (const row of rows.rows as unknown as Array<{ id: string; api_key: string }>) {
    if (!row.api_key) continue;
    await sqlite.execute({
      sql: "UPDATE devices SET api_key_hash = ?, api_key_hint = ? WHERE id = ?",
      args: [hashApiKey(row.api_key), apiKeyHint(row.api_key), row.id],
    });
  }

  await sqlite.execute("PRAGMA foreign_keys = OFF;");
  await sqlite.executeMultiple(`
    CREATE TABLE devices_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT,
      notes TEXT,
      api_key_hash TEXT NOT NULL UNIQUE,
      api_key_hint TEXT NOT NULL,
      power_state TEXT NOT NULL DEFAULT 'unknown',
      last_seen_at INTEGER,
      created_at INTEGER NOT NULL
    );
    INSERT INTO devices_new (
      id, user_id, room_id, name, type, model, notes,
      api_key_hash, api_key_hint, power_state, last_seen_at, created_at
    )
    SELECT
      id, user_id, room_id, name, type, model, notes,
      api_key_hash, api_key_hint, COALESCE(power_state, 'unknown'), last_seen_at, created_at
    FROM devices;
    DROP TABLE devices;
    ALTER TABLE devices_new RENAME TO devices;
    CREATE INDEX IF NOT EXISTS devices_user_idx ON devices(user_id);
    CREATE INDEX IF NOT EXISTS devices_api_key_hash_idx ON devices(api_key_hash);
  `);
  await sqlite.execute("PRAGMA foreign_keys = ON;");
}
