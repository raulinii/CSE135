#!/usr/bin/env python3
import os, sys, json, urllib.parse
from datetime import datetime

print("Content-Type: text/plain")
print()

method = os.environ.get("REQUEST_METHOD", "UNKNOWN")
content_type = os.environ.get("CONTENT_TYPE", "")
query = os.environ.get("QUERY_STRING", "")
user_agent = os.environ.get("HTTP_USER_AGENT", "")
ip = os.environ.get("HTTP_X_FORWARDED_FOR", os.environ.get("REMOTE_ADDR", ""))
time = datetime.now()

data = ""

if method == "GET":
    data = query
else:
    length = int(os.environ.get("CONTENT_LENGTH", 0))
    raw = sys.stdin.read(length)

    if "application/json" in content_type:
        try:
            data = json.loads(raw)
        except:
            data = raw
    else:
        data = urllib.parse.parse_qs(raw)

print("Echo Python")
print("------------")
print(f"Method: {method}")
print(f"Time: {time}")
print(f"IP: {ip}")
print(f"User-Agent: {user_agent}")
print("Data Received:")
print(data)
