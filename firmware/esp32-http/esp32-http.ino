/*
  Auzy ingest + power command example — ESP32 (Arduino core)

  1. Register the board in the Auzy dashboard to get an API key.
  2. Set WIFI_SSID, WIFI_PASS, INGEST_URL, and API_KEY below.
  3. INGEST_URL must use this computer's LAN IP, not localhost.
  4. On/off commands ride back on the ingest response (Redis queue on the hub).
*/

#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* INGEST_URL = "http://YOUR_LAN_IP:3001/v1/ingest";
const char* API_KEY = "PASTE_DEVICE_API_KEY";
const int RELAY_PIN = 5;

bool relayOn = false;

void applyCommands(const String& body) {
  int onPos = body.lastIndexOf("\"action\":\"on\"");
  int offPos = body.lastIndexOf("\"action\":\"off\"");
  if (onPos < 0 && offPos < 0) return;
  relayOn = onPos > offPos;
  digitalWrite(RELAY_PIN, relayOn ? HIGH : LOW);
  Serial.printf("relay %s\n", relayOn ? "on" : "off");
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
  Serial.println("\nWiFi ready");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Api-Key", API_KEY);

    String body = "{\"temperature\":24.5,\"humidity\":48,\"power\":";
    body += relayOn ? "true" : "false";
    body += ",\"rssi\":";
    body += WiFi.RSSI();
    body += "}";

    int code = http.POST(body);
    String response = http.getString();
    Serial.printf("ingest %d %s\n", code, response.c_str());
    if (code >= 200 && code < 300) {
      applyCommands(response);
    }
    http.end();
  }
  delay(10000);
}
