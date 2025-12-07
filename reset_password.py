from backend.app import app, db, User

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
    reset("anagha", "123")
