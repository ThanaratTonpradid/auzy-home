# Auzy Smart Home

Monorepo for a small home hub: register ESP32, NodeMCU, Arduino, and similar
boards, ingest their sensor JSON over HTTP, and send on/off commands back on
the next ingest.

```
apps/web          Vite + TanStack Router dashboard
apps/api          Hono ingest + device registry (SQLite + Redis sessions)
packages/shared   Zod contracts shared by web and API
packages/utils    dayjs / numbro / lodash helpers
firmware/         Arduino sketches for ESP32 and NodeMCU
openapi/          HTTP contract
```

## Quick start

Needs Node 18.18+ and pnpm. Redis is recommended for sessions and the command
queue (`docker compose up -d`). Without Redis the API still runs, using
in-memory sessions that disappear on restart. Redis Insight is the web UI for
keys, sessions, and the command list.

```bash
docker compose up -d
pnpm install
pnpm db:seed
pnpm dev
```

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/health](http://localhost:3001/health)
- Scalar docs: [http://localhost:3001/scalar](http://localhost:3001/scalar) (`/docs` and `/openapi.yaml` too)
- Redis Insight: [http://localhost:5540](http://localhost:5540)
- Demo login: `demo@smarthome.local` / `demo1234`

In another terminal, walk the seeded climate sensor without hardware:

```bash
pnpm simulate
pnpm test
```

## Device flow

1. Sign in and open **Register device**.
2. Copy the API key (shown once; it is hashed at rest).
3. Flash `firmware/esp32-http` or `firmware/nodemcu-http` (use the computer's
   LAN IP, not `localhost`).
4. The board POSTs JSON to `/v1/ingest`. The device card goes **online**.
5. **Turn on / Turn off** queues a Redis command. The board applies it from the
   ingest response (GPIO 5 in the example sketches).

```bash
curl -X POST http://localhost:3001/v1/ingest \
  -H 'Content-Type: application/json' \
  -H 'X-Api-Key: sh_demo_living_room_climate' \
  -d '{"temperature":25.1,"humidity":47}'
```

Web sessions are httpOnly cookies backed by Redis (`auzy_session`). Device API
keys are SHA-256 hashed in SQLite; live device presence is a short Redis session.
Browse Redis at [http://localhost:5540](http://localhost:5540). SQLite is the
file `apps/api/data/smarthome.db` (open with `sqlite3` or a desktop DB browser).

The HTTP contract lives in `openapi/openapi.yaml` and is served as Scalar docs at `/scalar`.
