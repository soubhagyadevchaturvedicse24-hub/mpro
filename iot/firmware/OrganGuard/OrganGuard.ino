/*******************************************************************************
 *  OrganGuard ESP32 — Organ Transport IoT Firmware
 *  ═══════════════════════════════════════════════════════════════════════════
 *  Hardware:
 *    RFID RC522       → SDA=5, SCK=18, MOSI=23, MISO=19, RST=27
 *    OLED SSD1306     → I2C SDA=21, SCL=22
 *    GPS NEO-7M       → RX=16, TX=17
 *    DS18B20 (temp)   → GPIO 4
 *    Reed Switch      → GPIO 14  (INPUT_PULLUP — LOW = closed, HIGH = open)
 *    Relay (solenoid) → GPIO 26  (HIGH = LOCKED)
 *    Buzzer           → GPIO 25
 *
 *  Behaviour:
 *    IDLE          → OLED shows "OrganGuard Ready", relay UNLOCKED, waits for RFID
 *    RFID SCANNED  → POSTs /device/access, locks relay, transitions to IN_TRANSIT
 *    IN_TRANSIT    → Every 5s: read DS18B20, GPS, reed → POST /device/telemetry
 *                    If reed opens → isTampered=true, buzzer BEEP, POST alert
 *    COMPLETED     → Relay UNLOCKS, display "Delivered ✓"
 ******************************************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// RFID
#include <SPI.h>
#include <MFRC522.h>

// OLED
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// DS18B20
#include <OneWire.h>
#include <DallasTemperature.h>

// GPS
#include <TinyGPSPlus.h>

// ═══════════════════════  PIN DEFINITIONS  ═══════════════════════════════════
#define RFID_SS     5
#define RFID_RST    27
#define DS18B20_PIN 4
#define REED_PIN    14
#define RELAY_PIN   26
#define BUZZER_PIN  25
#define GPS_RX      16
#define GPS_TX      17

#define OLED_WIDTH  128
#define OLED_HEIGHT 64
#define OLED_ADDR   0x3C

// ═══════════════════════  CONFIGURATION  ═════════════════════════════════════
const char* WIFI_SSID     = "Laptop_OrganShield";
const char* WIFI_PASS     = "password123";
const char* BACKEND_URL   = "http://192.168.137.1:5000/api/v1";  // Laptop hotspot gateway
const char* DEVICE_ID     = "BOX-2026-FABRIC-ALPHA";
const char* DEVICE_SECRET = "secret123";

const unsigned long TELEMETRY_INTERVAL_MS = 5000;  // send data every 5 seconds
const unsigned long DISPLAY_CYCLE_MS     = 3000;   // rotate display pages every 3s

// ═══════════════════════  GLOBAL OBJECTS  ════════════════════════════════════
MFRC522           rfid(RFID_SS, RFID_RST);
Adafruit_SSD1306  oled(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
OneWire           oneWire(DS18B20_PIN);
DallasTemperature tempSensor(&oneWire);
TinyGPSPlus       gps;
HardwareSerial    gpsSerial(1);  // UART1

// ═══════════════════════  STATE MACHINE  ═════════════════════════════════════
enum TransportState {
  STATE_IDLE,         // Waiting for RFID scan
  STATE_IN_TRANSIT,   // Actively transporting organ
  STATE_TAMPERED,     // Reed switch opened mid-transit
  STATE_COMPLETED     // Delivery done
};

TransportState    currentState    = STATE_IDLE;
String            activeMissionId = "";
String            lastRfidUid     = "";
float             lastTemp        = 4.0;
float             lastLat         = 0.0;
float             lastLng         = 0.0;
int               lastBattery     = 95;   // Simulated battery (could wire ADC later)
bool              isTampered      = false;
bool              reedOpen        = false;
unsigned long     lastTelemetryMs = 0;
unsigned long     lastDisplayMs   = 0;
int               displayPage     = 0;
unsigned long     transitStartMs  = 0;

// ═══════════════════════  SETUP  ═════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║   OrganGuard ESP32 Firmware v3.0    ║");
  Serial.println("╚══════════════════════════════════════╝");

  // Pin modes
  pinMode(REED_PIN,  INPUT_PULLUP);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);   // Start UNLOCKED
  digitalWrite(BUZZER_PIN, LOW);

  // OLED
  Wire.begin(21, 22);
  if (oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    drawBootScreen();
  } else {
    Serial.println("⚠ OLED init failed");
  }

  // RFID
  SPI.begin(18, 19, 23, RFID_SS);
  rfid.PCD_Init();
  Serial.println("✓ RFID RC522 ready");

  // DS18B20
  tempSensor.begin();
  Serial.println("✓ DS18B20 ready");

  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("✓ GPS NEO-7M ready");

  // WiFi
  connectWiFi();

  // Show idle screen
  drawIdleScreen();
}

// ═══════════════════════  MAIN LOOP  ═════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // Always feed GPS parser
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // ─── STATE: IDLE → Wait for RFID card ───────────────────────────────────
  if (currentState == STATE_IDLE) {
    checkRfid();
    if (now - lastDisplayMs > 2000) {
      drawIdleScreen();
      lastDisplayMs = now;
    }
  }

  // ─── STATE: IN_TRANSIT → Send telemetry, monitor reed switch ────────────
  else if (currentState == STATE_IN_TRANSIT || currentState == STATE_TAMPERED) {
    // Check reed switch for tamper
    reedOpen = digitalRead(REED_PIN) == HIGH;
    if (reedOpen && !isTampered) {
      isTampered = true;
      currentState = STATE_TAMPERED;
      Serial.println("🚨 TAMPER DETECTED! Reed switch OPEN during transit!");
      buzzerAlert(3);  // 3 short beeps
      // Send immediate tamper telemetry
      sendTelemetry(true);
    }

    // Periodic telemetry
    if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      readSensors();
      sendTelemetry(isTampered);
      lastTelemetryMs = now;
    }

    // Rotate display pages
    if (now - lastDisplayMs >= DISPLAY_CYCLE_MS) {
      displayPage = (displayPage + 1) % 4;
      drawTransitScreen();
      lastDisplayMs = now;
    }

    // Check for RFID scan again → could signal delivery/completion
    checkRfid();
  }

  // ─── STATE: COMPLETED → Show done, unlock ─────────────────────────────
  else if (currentState == STATE_COMPLETED) {
    if (now - lastDisplayMs > 5000) {
      drawCompletedScreen();
      lastDisplayMs = now;
    }
  }

  delay(50);  // Small yield
}

// ═══════════════════════  RFID  ══════════════════════════════════════════════
void checkRfid() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  Serial.println("🔑 RFID scanned: " + uid);
  lastRfidUid = uid;

  if (currentState == STATE_IDLE) {
    // ── Start transport ──
    drawMessage("RFID Scanned!", uid, "Authenticating...");
    buzzerBeep(1);

    bool ok = postRfidAccess(uid);
    if (ok) {
      currentState = STATE_IN_TRANSIT;
      transitStartMs = millis();
      isTampered = false;

      // LOCK the solenoid
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("🔒 Solenoid LOCKED");

      buzzerBeep(2);  // confirm beep
      drawMessage("TRANSPORT", "STARTED!", "Box LOCKED");
      delay(1500);
    } else {
      drawMessage("AUTH FAILED", uid, "Card not assigned");
      delay(2000);
      drawIdleScreen();
    }
  }
  else if (currentState == STATE_IN_TRANSIT || currentState == STATE_TAMPERED) {
    // ── Same card scanned again during transit → complete delivery ──
    if (uid == lastRfidUid) {
      Serial.println("✅ Same RFID re-scanned → marking COMPLETED");
      currentState = STATE_COMPLETED;

      // UNLOCK the solenoid
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("🔓 Solenoid UNLOCKED");

      buzzerBeep(3);
      drawCompletedScreen();

      // Reset after 10 seconds back to idle
      delay(10000);
      resetToIdle();
    }
  }
}

bool postRfidAccess(String uid) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/device/access";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-device-secret", DEVICE_SECRET);

  JsonDocument doc;
  doc["rfid"]      = uid;
  doc["timestamp"] = getIsoTimestamp();

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.printf("POST /device/access → %d\n", code);
  Serial.println(resp);

  if (code == 202) {
    // Parse response to get missionId
    JsonDocument respDoc;
    deserializeJson(respDoc, resp);
    if (respDoc.containsKey("missionId")) {
      activeMissionId = respDoc["missionId"].as<String>();
      Serial.println("✓ Mission: " + activeMissionId);
    }
    return true;
  }
  return false;
}

// ═══════════════════════  SENSORS  ═══════════════════════════════════════════
void readSensors() {
  // DS18B20 — real temperature
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t != DEVICE_DISCONNECTED_C && t > -50 && t < 80) {
    lastTemp = t;
  }

  // GPS
  if (gps.location.isValid()) {
    lastLat = gps.location.lat();
    lastLng = gps.location.lng();
  }

  // Battery simulation (decrement slowly)
  if (lastBattery > 5) {
    lastBattery -= random(0, 2);  // lose 0-1% per cycle
  }

  Serial.printf("📡 Temp=%.1f°C  GPS=%.4f,%.4f  Batt=%d%%  Reed=%s\n",
    lastTemp, lastLat, lastLng, lastBattery,
    reedOpen ? "OPEN(⚠)" : "CLOSED(✓)");
}

// ═══════════════════════  TELEMETRY  ═════════════════════════════════════════
void sendTelemetry(bool tampered) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (activeMissionId.length() == 0) return;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/device/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-device-secret", DEVICE_SECRET);

  JsonDocument doc;
  doc["missionId"]    = activeMissionId;
  doc["temperature"]  = round(lastTemp * 10.0) / 10.0;  // 1 decimal place
  doc["batteryLevel"] = lastBattery;
  doc["isTampered"]   = tampered;
  doc["speedKmh"]     = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
  doc["reedStatus"]   = reedOpen ? "Box Open" : "Box Closed";
  doc["buzzerStatus"] = tampered ? "ALERT" : "Normal";
  doc["rgbColor"]     = tampered ? "Red" : "Green";
  doc["rfidLastScanned"] = lastRfidUid;
  doc["firmwareVersion"] = "v3.0.0";

  JsonObject geo = doc["geoLocation"].to<JsonObject>();
  geo["type"] = "Point";
  JsonArray coords = geo["coordinates"].to<JsonArray>();
  coords.add(lastLng);
  coords.add(lastLat);

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();

  if (code == 200 || code == 201) {
    Serial.printf("✓ Telemetry sent (%d)\n", code);
  } else {
    Serial.printf("⚠ Telemetry failed: %d\n", code);
  }
}

// ═══════════════════════  DISPLAY SCREENS  ═══════════════════════════════════
void drawBootScreen() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(20, 0);
  oled.println("OrganGuard");
  oled.setCursor(30, 12);
  oled.println("v3.0.0");
  oled.drawLine(0, 24, 128, 24, SSD1306_WHITE);
  oled.setCursor(10, 30);
  oled.println("Initializing...");
  oled.setCursor(15, 45);
  oled.println("RFID | GPS | Temp");
  oled.display();
  delay(2000);
}

void drawIdleScreen() {
  oled.clearDisplay();
  oled.setTextSize(1);

  // Header
  oled.setCursor(15, 0);
  oled.println("OrganGuard READY");
  oled.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  // Status
  oled.setCursor(0, 16);
  oled.println("State: IDLE");
  oled.setCursor(0, 28);
  oled.println("Lock:  UNLOCKED");

  // Reed
  oled.setCursor(0, 40);
  oled.print("Reed:  ");
  oled.println(digitalRead(REED_PIN) == LOW ? "CLOSED" : "OPEN");

  // Prompt
  oled.setCursor(5, 54);
  oled.println("> Scan RFID to start");

  oled.display();
}

void drawTransitScreen() {
  oled.clearDisplay();
  oled.setTextSize(1);

  // Header with status
  oled.setCursor(0, 0);
  if (isTampered) {
    oled.println("!! TAMPER ALERT !!");
  } else {
    oled.println("IN TRANSIT");
  }
  oled.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  unsigned long elapsed = (millis() - transitStartMs) / 1000;
  int mins = elapsed / 60;
  int secs = elapsed % 60;

  switch (displayPage) {
    case 0:  // Temperature + Time
      oled.setCursor(0, 14);
      oled.setTextSize(2);
      oled.printf("%.1fC", lastTemp);
      oled.setTextSize(1);
      oled.setCursor(0, 34);
      oled.printf("Elapsed: %02d:%02d", mins, secs);
      oled.setCursor(0, 46);
      oled.printf("Battery: %d%%", lastBattery);
      oled.setCursor(0, 56);
      oled.printf("Lock: LOCKED");
      break;

    case 1:  // GPS
      oled.setCursor(0, 14);
      oled.println("GPS Location:");
      oled.setCursor(0, 28);
      if (lastLat != 0.0) {
        oled.printf("Lat: %.5f", lastLat);
        oled.setCursor(0, 40);
        oled.printf("Lng: %.5f", lastLng);
      } else {
        oled.println("Acquiring fix...");
      }
      oled.setCursor(0, 54);
      oled.printf("Sats: %d", gps.satellites.isValid() ? (int)gps.satellites.value() : 0);
      break;

    case 2:  // Security
      oled.setCursor(0, 14);
      oled.println("SECURITY STATUS:");
      oled.setCursor(0, 28);
      oled.printf("Reed: %s", reedOpen ? "OPEN !!" : "CLOSED OK");
      oled.setCursor(0, 40);
      oled.printf("Tamper: %s", isTampered ? "YES !!!" : "NO");
      oled.setCursor(0, 52);
      oled.printf("RFID: %s", lastRfidUid.c_str());
      break;

    case 3:  // Mission
      oled.setCursor(0, 14);
      oled.println("MISSION:");
      oled.setCursor(0, 28);
      oled.println(activeMissionId.length() > 16
        ? activeMissionId.substring(0, 16)
        : activeMissionId);
      oled.setCursor(0, 42);
      oled.printf("Packets: %d", (int)(elapsed / 5));
      oled.setCursor(0, 54);
      oled.println("Blockchain: LIVE");
      break;
  }

  oled.display();
}

void drawCompletedScreen() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(15, 0);
  oled.println("DELIVERY DONE");
  oled.drawLine(0, 12, 128, 12, SSD1306_WHITE);

  oled.setTextSize(2);
  oled.setCursor(40, 20);
  oled.println("OK");

  oled.setTextSize(1);
  oled.setCursor(15, 44);
  oled.println("Lock: UNLOCKED");
  oled.setCursor(10, 56);
  oled.println("Resetting soon...");

  oled.display();
}

void drawMessage(const char* line1, String line2, const char* line3) {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 10);
  oled.println(line1);
  oled.setCursor(0, 28);
  oled.println(line2);
  oled.setCursor(0, 46);
  oled.println(line3);
  oled.display();
}

// ═══════════════════════  BUZZER  ════════════════════════════════════════════
void buzzerBeep(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void buzzerAlert(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(300);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
}

// ═══════════════════════  WIFI  ══════════════════════════════════════════════
void connectWiFi() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 10);
  oled.println("Connecting WiFi...");
  oled.setCursor(0, 30);
  oled.println(WIFI_SSID);
  oled.display();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("📶 Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected: " + WiFi.localIP().toString());
    oled.clearDisplay();
    oled.setCursor(0, 10);
    oled.println("WiFi Connected!");
    oled.setCursor(0, 30);
    oled.println(WiFi.localIP().toString());
    oled.display();
    delay(1500);
  } else {
    Serial.println("\n⚠ WiFi failed — continuing offline");
    oled.clearDisplay();
    oled.setCursor(0, 20);
    oled.println("WiFi FAILED");
    oled.setCursor(0, 40);
    oled.println("Running offline...");
    oled.display();
    delay(2000);
  }
}

// ═══════════════════════  UTILITIES  ═════════════════════════════════════════
String getIsoTimestamp() {
  // Simple timestamp (no RTC, use millis-based placeholder)
  unsigned long s = millis() / 1000;
  char buf[30];
  snprintf(buf, sizeof(buf), "2026-01-01T%02lu:%02lu:%02luZ",
    (s / 3600) % 24, (s / 60) % 60, s % 60);
  return String(buf);
}

void resetToIdle() {
  currentState    = STATE_IDLE;
  activeMissionId = "";
  lastRfidUid     = "";
  isTampered      = false;
  reedOpen        = false;
  displayPage     = 0;
  lastBattery     = 95;
  digitalWrite(RELAY_PIN, LOW);   // Ensure unlocked
  digitalWrite(BUZZER_PIN, LOW);
  drawIdleScreen();
  Serial.println("♻ Reset to IDLE");
}
