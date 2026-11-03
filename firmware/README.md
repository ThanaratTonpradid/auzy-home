# Firmware examples

Boards do not need a special SDK. Any ESP32, NodeMCU, ESP8266, or Arduino-class
device that can make an HTTP POST can talk to Auzy.

## Contract

- **URL:** `http://<computer-lan-ip>:3001/v1/ingest`
- **Header:** `X-Api-Key: <key from the dashboard>`
- **Body:** JSON object of sensor fields. Include `"power": true|false` if the board has a relay.

```json
{ "temperature": 24.6, "humidity": 51, "rssi": -62 }
```

Numbers, booleans, and short strings are stored. Nested `{ "readings": { ... } }`
is also accepted.

`localhost` will not work from the microcontroller. Use the Mac/PC LAN address
(`192.168.x.x`). The computer firewall must allow port **3001**.

## Sketches

- `esp32-http/` — Arduino-ESP32 `WiFi.h` + `HTTPClient.h`
- `nodemcu-http/` — ESP8266/NodeMCU `ESP8266WiFi.h` + `ESP8266HTTPClient.h`

The dashboard device page generates the same sketch with your key filled in.

## On / off commands

The hub queues power commands in Redis (not RabbitMQ — one extra process is
enough for a LAN hub, and ESP sketches already speak HTTP).

1. Toggle **Turn on / Turn off** on the device page.
2. The next `POST /v1/ingest` response includes `"commands":[{ "action": "on" }]`.
3. Firmware drives `RELAY_PIN` (default GPIO 5).

Boards that ingest rarely can also `GET /v1/commands` with the same API key.
