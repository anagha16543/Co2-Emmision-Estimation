from app import app, db
import os

def init():
    print("Initializing database...")
    try:
        db_uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if db_uri.startswith("sqlite:///") and os.path.exists(db_uri.replace("sqlite:///", "")):
         print(f"Database already exists at {db_uri}")
        
        with app.app_context():
            db.create_all()
            print("Database tables created successfully.")
            
        print("Initialization complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    init()
