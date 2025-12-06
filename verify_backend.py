
import requests
import json
import pandas as pd
from pathlib import Path

BASE_URL = "http://localhost:5000"
CSV_PATH = Path("backend/sample_emissions.csv")

def run_verification():
    print(f"Verifying backend at {BASE_URL}...")
    
    # 0. Authenticate
    print("\n--- Testing /auth/signup & /auth/login ---")
    session = requests.Session()
    token = None
    try:
        # Signup (might fail if user exists, thats fine)
        requests.post(f"{BASE_URL}/auth/signup", json={"username": "testuser", "password": "testpassword"})
        
        # Login
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "testuser", "password": "testpassword"})
        if login_resp.status_code == 200:
            token = login_resp.json().get("access_token")
            print(f"Login Success! Token: {token[:10]}...")
            session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            print(f"Login Failed: {login_resp.text}")
            return
    except Exception as e:
        print(f"Auth Error: {e}")
        return

    # 1. Test Upload
    print("\n--- Testing /upload ---")
    try:
        with open(CSV_PATH, "rb") as f:
            files = {"file": ("sample_emissions.csv", f, "text/csv")}
            response = session.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            print("Upload Success!")
            # print(json.dumps(response.json(), indent=2))
            csv_text = CSV_PATH.read_text() # Get text for training
        else:
            print(f"Upload Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"Upload Error: {e}")
        return

    # 2. Test Train
    print("\n--- Testing /train ---")
    try:
        payload = {
            "csv_text": csv_text,
            "model": "ridge",
            "cv": 3
        }
        response = session.post(f"{BASE_URL}/train", json=payload)
        
        if response.status_code == 200:
            print("Train Success!")
            # print(json.dumps(response.json(), indent=2))
        else:
            print(f"Train Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"Train Error: {e}")
        return

    # 3. Test Predict
    print("\n--- Testing /predict ---")
    try:
        payload = {
            "features": {
                "EngineSize": 2.0,
                "Cylinders": 4,
                "FuelType": "Gasoline",
                "FuelConsumption": 8.5
            }
        }
        response = session.post(f"{BASE_URL}/predict", json=payload)
        
        if response.status_code == 200:
            print("Predict Success!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Predict Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"Predict Error: {e}")
        return

if __name__ == "__main__":
    run_verification()
