import serial
import serial.tools.list_ports
import requests
import json
import time

BACKEND_URL = "http://localhost:5000/api/v1/device/telemetry"
HEADERS = {
    "Content-Type": "application/json",
    "x-device-id": "BOX-2026-FABRIC-ALPHA",
    "x-device-secret": "secret123"
}

def find_com_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        print(f"Found Port: {port.device} - {port.description}")
        return port.device
    return None

def main():
    print("=== OrganShield Serial Bridge ===")
    port = find_com_port()
    
    if not port:
        print("No COM ports found! Please plug in your ESP32 via USB cable.")
        return

    print(f"Connecting to ESP32 on {port} at 115200 baud...")
    try:
        ser = serial.Serial(port, 115200, timeout=1)
        print(f"Successfully connected to {port}!")
        print("Listening for sensor data over USB... Press Ctrl+C to stop.\n")
    except Exception as e:
        print(f"Error opening port {port}: {e}")
        return

    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line.startswith('{') and line.endswith('}'):
                    try:
                        payload = json.loads(line)
                        print(f"Received from ESP32: {payload}")
                        
                        response = requests.post(BACKEND_URL, json=payload, headers=HEADERS)
                        if response.status_code in [200, 201]:
                            print(f"✅ Forwarded to Backend -> Status: {response.status_code} Success!\n")
                        else:
                            print(f"❌ Backend Error -> Status: {response.status_code}, Response: {response.text}\n")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
