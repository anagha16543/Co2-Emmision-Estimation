import requests
import sys

BASE_URL = "http://localhost:5000"

def test_signup(username, password):
    print(f"Testing Signup for {username}...")
    try:
        r = requests.post(f"{BASE_URL}/auth/signup", json={"username": username, "password": password})
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code == 201
    except Exception as e:
        print(f"Signup Exception: {e}")
        return False

def test_login(username, password):
    print(f"Testing Login for {username}...")
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code == 200
    except Exception as e:
        print(f"Login Exception: {e}")
        return False

if __name__ == "__main__":
    u = "testuser_" + str(sys.argv[1] if len(sys.argv) > 1 else "1")
    p = "password123"
    
    if test_signup(u, p):
        test_login(u, p)
    else:
        print("Signup failed, attempting login anyway (in case user exists)...")
        test_login(u, p)
