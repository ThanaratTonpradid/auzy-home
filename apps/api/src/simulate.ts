/**
 * Walks the demo climate device so the dashboard looks live without hardware.
 * Run after `pnpm db:seed` while the API is up: `pnpm simulate`
 */
import { clamp, formatIso, round, roundNumber } from "@smart-home/utils";

const API = process.env.API_URL ?? "http://localhost:3001";
const KEY = process.env.DEVICE_KEY ?? "sh_demo_living_room_climate";

let temperature = 24.4;
let humidity = 50;

function step(value: number, min: number, max: number, jitter: number) {
  return clamp(value + (Math.random() - 0.5) * jitter, min, max);
}

console.log(`Simulating ESP32 climate → ${API}/v1/ingest`);

while (true) {
  temperature = step(temperature, 21, 28, 0.6);
  humidity = step(humidity, 35, 70, 2);

  const payload = {
    temperature: roundNumber(temperature, 1),
    humidity: roundNumber(humidity, 0),
    rssi: -55 - round(Math.random() * 15),
  };

  try {
    const response = await fetch(`${API}/v1/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": KEY,
      },
      body: JSON.stringify(payload),
    });
    const body = await response.text();
    console.log(formatIso(), response.status, payload, body);
    if (body.includes('"action"')) {
      console.log("  pending power command in ingest response");
    }
  } catch (error) {
    console.error("API unreachable — is `pnpm dev` running?", error);
  }

  await new Promise((resolve) => setTimeout(resolve, 4000));
}
