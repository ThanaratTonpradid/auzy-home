import { DEVICE_TYPE_LABELS, type DeviceType } from "@smart-home/shared";
import { lanHint } from "./format";

export function firmwareSketch(type: DeviceType, apiKey: string) {
  const host = lanHint();
  const isEsp8266 = type === "esp8266" || type === "nodemcu";
  const wifiHeader = isEsp8266 ? "<ESP8266WiFi.h>" : "<WiFi.h>";
  const httpHeader = isEsp8266 ? "<ESP8266HTTPClient.h>" : "<HTTPClient.h>";
  const label = DEVICE_TYPE_LABELS[type];

  return `// Auzy ingest + relay sketch for ${label}
#include ${wifiHeader}
#include ${httpHeader}

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* INGEST_URL = "${host}/v1/ingest";
const char* API_KEY = "${apiKey}";
const int RELAY_PIN = 5;
bool relayOn = false;

void applyCommands(const String& body) {
  int onPos = body.lastIndexOf("\\"action\\":\\"on\\"");
  int offPos = body.lastIndexOf("\\"action\\":\\"off\\"");
  if (onPos < 0 && offPos < 0) return;
  relayOn = onPos > offPos;
  digitalWrite(RELAY_PIN, relayOn ? HIGH : LOW);
}

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\\nWiFi ready");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Api-Key", API_KEY);

    String body = "{\\"temperature\\":24.5,\\"humidity\\":48,\\"power\\":";
    body += relayOn ? "true" : "false";
    body += ",\\"rssi\\":";
    body += WiFi.RSSI();
    body += "}";

    int code = http.POST(body);
    String response = http.getString();
    Serial.printf("ingest %d\\n", code);
    if (code >= 200 && code < 300) applyCommands(response);
    http.end();
  }
  delay(10000);
}
`;
}
