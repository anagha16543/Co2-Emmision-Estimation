from app import app, db
import os

def init():
    print("Initializing database...")
    try:
        if os.path.exists("users.db"):
            print("Database already exists.")
        
        with app.app_context():
            db.create_all()
            print("Database tables created successfully.")
            
        print("Initialization complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    init()
