import requests

BASE_URL = "http://localhost:5000"

def test_upload():
    # Test 1: Valid CSV
    valid_csv = """EngineSize,Cylinders,FuelConsumption,CO2Emissions
2.0,4,8.5,196
3.0,6,10.0,250
1.5,4,6.0,140
2.5,4,9.0,210
3.5,6,11.0,280"""
    
    print("\n--- Test 1: Valid CSV ---")
    try:
        response = requests.post(f"{BASE_URL}/upload", json={"csv_text": valid_csv})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 2: Missing Column
    print("\n--- Test 2: Missing CO2Emissions ---")
    invalid_csv = """EngineSize,Cylinders,FuelConsumption
2.0,4,8.5
3.0,6,10.0"""
    try:
        response = requests.post(f"{BASE_URL}/upload", json={"csv_text": invalid_csv})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_upload()
