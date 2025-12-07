from app import app, db, User

def reset(username, new_password):
    print(f"Resetting password for {username}...")
    with app.app_context():
        user = User.query.filter_by(username=username.lower()).first()
        if user:
            user.set_password(new_password)
            db.session.commit()
            print(f"Password for '{username}' has been reset to '{new_password}'.")
        else:
            print(f"User '{username}' not found.")

if __name__ == "__main__":
    print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    username = "anagha"
    password = "123"
    with app.app_context():
        # Ensure tables exist
        db.create_all()
        
        user = User.query.filter_by(username=username).first()
        if user:
            print(f"User '{username}' found. Resetting password...")
            user.set_password(password)
            db.session.commit()
            print("Password reset.")
        else:
            print(f"User '{username}' NOT found. Creating...")
            new_user = User(username=username)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            print("User created.")
            
        # Verify
        u = User.query.filter_by(username=username).first()
        if u and u.check_password(password):
             print("VERIFICATION: User exists and password is valid.")
        else:
             print("VERIFICATION: FAILED.")
