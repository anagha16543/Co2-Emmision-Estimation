
import requests
import json
import pandas as pd
from io import StringIO

BASE_URL = "http://localhost:5000"

# Kaggle-like dataset content
CSV_CONTENT = """Manufacturer,Model,Description,Transmission,Engine Capacity,Fuel Type,Metric Combined,CO2 g/km,Emissions CO [mg/km]
Ford,Fiesta,1.0 EcoBoost,Manual,1000,Petrol,5.0,114,200
Ford,Focus,1.5 EcoBlue,Manual,1500,Diesel,4.5,120,150
Volkswagen,Golf,2.0 TDI,Automatic,2000,Diesel,5.2,135,160
Toyota,Yaris,1.5 Hybrid,Automatic,1500,Hybrid,3.8,85,50
BMW,3 Series,320i,Automatic,2000,Petrol,6.5,150,180
"""

def reproduce_failure():
    print(f"Testing upload with Kaggle-like columns at {BASE_URL}...")
    
    files = {"file": ("kaggle_sample.csv", StringIO(CSV_CONTENT), "text/csv")}
    try:
        response = requests.post(f"{BASE_URL}/upload", files=files)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code != 200:
            print("\n❌ Validation Failed as expected (reproduced).")
        else:
            print("\n✅ Verification passed (cannot reproduce).")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    reproduce_failure()
