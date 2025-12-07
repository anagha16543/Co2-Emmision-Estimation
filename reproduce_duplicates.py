import pandas as pd
import requests
import json
from io import StringIO

BASE_URL = "http://localhost:5000"

# CSV with two columns that will map to "EngineSize"
# "Engine Size" -> EngineSize
# "EngineSize" -> EngineSize
CSV_CONTENT = """Engine Size,EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
2.0,2.0,4,Gasoline,8.5,196
3.5,3.5,6,Gasoline,12.0,250
"""

def reproduce():
    print(f"Testing upload with duplicate normalized columns at {BASE_URL}...")
    
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
