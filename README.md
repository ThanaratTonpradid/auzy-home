# Auzy Smart Home

Monorepo for a small home hub: register ESP32, NodeMCU, Arduino, and similar
boards, ingest their sensor JSON over HTTP, and send on/off commands back on
the next ingest.

## Project structure

```
smart-home/
├── apps/
│   ├── api/                 Hono API — auth, devices, ingest, commands
│   │   └── src/
│   │       ├── routes/      HTTP handlers
│   │       ├── lib/         sessions, commands, api-key, status
│   │       ├── db/          SQLite schema, migrate, seed
│   │       └── middleware/  user + device auth
│   └── web/                 Vite SPA dashboard
│       └── src/
│           ├── pages/       overview, devices, rooms, auth
│           ├── components/  AppShell, DeviceCard, shadcn/ui
│           ├── hooks/       TanStack Query hooks
│           └── lib/         API client + domain formatters
├── packages/
│   ├── shared/              Zod contracts (auth, device, telemetry)
│   └── utils/               dayjs / numbro / lodash helpers (Asia/Bangkok)
├── firmware/
│   ├── esp32-http/          Arduino sketch — ESP32 ingest client
│   └── nodemcu-http/        Arduino sketch — NodeMCU ingest client
├── openapi/                 OpenAPI contract (served at /scalar)
├── docker-compose.yml       Redis + Redis Insight
└── turbo.json               Monorepo task runner
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Monorepo | pnpm workspaces, Turborepo, TypeScript |
| Web | Vite, React 19, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS 4 |
| API | Hono, Drizzle ORM, libSQL/SQLite, Redis (ioredis), Argon2, Vitest |
| Shared | Zod (`@smart-home/shared`), dayjs / numbro / lodash-es (`@smart-home/utils`) |
| Docs | OpenAPI + Scalar |
| Firmware | Arduino (ESP32 / NodeMCU HTTP ingest) |
| Timezone | `Asia/Bangkok` (`+07:00`) — process `TZ` + dayjs default |

## Quick start

**Requirements:** Node 18.18+, pnpm 10. Redis is recommended for sessions and the
command queue. Without Redis the API still runs with in-memory sessions (lost on
restart).

```bash
# 1. Infra
docker compose up -d

# 2. Install + seed demo data
pnpm install
pnpm db:seed

# 3. Run API (:3001) + web (:3000)
pnpm dev
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| API health | http://localhost:3001/health |
| Scalar docs | http://localhost:3001/scalar |
| Redis Insight | http://localhost:5540 |

**Demo login:** `demo@smarthome.local` / `demo1234`

Optional — simulate the seeded climate sensor without hardware, then run tests:

```bash
pnpm simulate
pnpm test
```

Copy `.env.example` into `apps/api/.env` and `apps/web/.env` as needed. Defaults
include `TZ=Asia/Bangkok` and `VITE_API_URL=http://localhost:3001`.

## Device flow

1. Sign in and open **Register device**.
2. Copy the API key (shown once; hashed at rest).
3. Flash `firmware/esp32-http` or `firmware/nodemcu-http` (use the computer’s
   LAN IP, not `localhost`).
4. The board POSTs JSON to `/v1/ingest` → device goes **online**.
5. **Turn on / Turn off** queues a Redis command; the board applies it from the
   next ingest response (GPIO 5 in the example sketches).

```bash
curl -X POST http://localhost:3001/v1/ingest \
  -H 'Content-Type: application/json' \
  -H 'X-Api-Key: sh_demo_living_room_climate' \
  -d '{"temperature":25.1,"humidity":47}'
```

Web sessions use an httpOnly cookie (`auzy_session`) backed by Redis. Device API
keys are SHA-256 hashed in SQLite; live presence is a short Redis session.
SQLite file: `apps/api/data/smarthome.db`.
