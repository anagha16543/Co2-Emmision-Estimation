import requests
import json

BASE_URL = "http://localhost:5000"

CSV_CONTENT = """EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
2.0,4,Gasoline,8.5,196
3.5,6,Diesel,12.0,250
"""

def reproduce():
    print(f"Testing upload with test.csv content at {BASE_URL}...")
    
    # Simulate the frontend sending JSON with csv_text
    payload = {"csv_text": CSV_CONTENT}
    
    try:
        response = requests.post(f"{BASE_URL}/upload", json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response Body:")
            print(json.dumps(response.json(), indent=2))
        except:
            print(f"Raw Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    reproduce()
