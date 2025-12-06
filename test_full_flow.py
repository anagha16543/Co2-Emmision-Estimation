import requests
import json
import time

API_BASE = "http://localhost:5000"

# 1. Create Synthetic Data (20 rows)
csv_lines = ["EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions"]
for i in range(20):
    # vary values slightly
    csv_lines.append(f"{2.0 + i*0.1},{4 if i%2==0 else 6},Gasoline,{8.5 + i*0.2},{200 + i*5}")

csv_text = "\n".join(csv_lines)

# 2. Upload
print("--- Uploading ---")
try:
    resp = requests.post(f"{API_BASE}/upload", json={"csv_text": csv_text})
    print(f"Upload Status: {resp.status_code}")
    print(resp.json())
    if resp.status_code != 200:
        exit(1)
except Exception as e:
    print(f"Upload failed: {e}")
    exit(1)

# 3. Train
print("\n--- Training ---")
login_resp = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "password123"})
# Create user if not exists
if login_resp.status_code != 200:
    requests.post(f"{API_BASE}/auth/signup", json={"username": "testuser", "password": "password123"})
    login_resp = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "password123"})

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

try:
    resp = requests.post(f"{API_BASE}/train", json={"csv_text": csv_text, "model": "linear", "cv": 3}, headers=headers)
    print(f"Train Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Train Success!")
        print(json.dumps(resp.json(), indent=2))
    else:
        print("Train Failed")
        print(resp.text)
except Exception as e:
    print(f"Train request failed: {e}")
