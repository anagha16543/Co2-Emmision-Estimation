import requests
import sys

BASE_URL = "http://localhost:5000"

def test_login():
    username = "Anagha"
    password = "password"
    
    print(f"Attempting login for {username} with password '{password}'...")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": password
        })
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("Login SUCCESS!")
        else:
            print("Login FAILED!")
            
    except Exception as e:
        print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    test_login()
