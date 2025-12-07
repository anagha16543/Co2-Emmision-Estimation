import requests
import sys

BASE_URL = "http://localhost:5000"

def restore(username, password):
    print(f"Restoring user '{username}'...")
    # Try signup
    r = requests.post(f"{BASE_URL}/auth/signup", json={"username": username, "password": password})
    if r.status_code == 201:
        print("Success: Account created.")
        return True
    elif r.status_code == 400 and "already exists" in r.text.lower():
        print("Account already exists. Testing login...")
        # Try login
        r_login = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if r_login.status_code == 200:
            print("Success: Account exists and password is correct.")
            return True
        else:
            print("Error: Account exists but password mismatch.")
            return False
    else:
        print(f"Error creating account: {r.status_code} {r.text}")
        return False

if __name__ == "__main__":
    restore("Anagha", "123")
