import requests
import json

url = "http://localhost:5000/upload"
csv_data = """EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
2.0,4,Gasoline,8.5,196
3.5,6,Diesel,12.0,250
"""

payload = {"csv_text": csv_data}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Request failed: {e}")
