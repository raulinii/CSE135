#!/usr/bin/env python3
import os
import uuid
import http.cookies
import cgi
from datetime import datetime

SESSION_STORE = "/tmp/python_sessions"

os.makedirs(SESSION_STORE, exist_ok=True)

cookie = http.cookies.SimpleCookie(os.environ.get("HTTP_COOKIE"))
session_id = cookie["SESSION_ID"].value if "SESSION_ID" in cookie else None

if not session_id:
    session_id = str(uuid.uuid4())

session_file = f"{SESSION_STORE}/{session_id}.txt"

form = cgi.FieldStorage()
action = form.getfirst("action", "")

print("Content-Type: text/plain")


print(f"Set-Cookie: SESSION_ID={session_id}; Path=/; HttpOnly")
print()

if action == "set":
    name = form.getfirst("name", "")
    color = form.getfirst("color", "")
    with open(session_file, "w") as f:
        f.write(f"name={name}\ncolor={color}\ntime={datetime.now()}")
    print("State saved successfully.")
    print("\nGo back and view your saved state.")

elif action == "view":
    if os.path.exists(session_file):
        with open(session_file) as f:
            print("Saved State\n------------")
            print(f.read())
    else:
        print("No state saved.")

elif action == "clear":
    if os.path.exists(session_file):
        os.remove(session_file)
    print("State cleared.")

else:
    print("Invalid action.")
