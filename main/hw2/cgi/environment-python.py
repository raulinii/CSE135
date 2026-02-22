#!/usr/bin/env python3

import os

print("Content-Type: text/html")
print()

print("<html><body>")
print("<h1>Environment Variables Python</h1>")

print("<h2>Client Information</h2>")
print("<ul>")
for key in ["REMOTE_ADDR", "REMOTE_PORT"]:
    if key in os.environ:
        print(f"<li>{key}: {os.environ[key]}</li>")
print("</ul>")

print("<h2>Request Information</h2>")
print("<ul>")
for key in ["REQUEST_METHOD", "QUERY_STRING", "CONTENT_TYPE", "CONTENT_LENGTH", "SCRIPT_NAME"]:
    if key in os.environ:
        print(f"<li>{key}: {os.environ[key]}</li>")
print("</ul>")

print("<h2>Server Information</h2>")
print("<ul>")
for key in ["SERVER_NAME", "SERVER_PORT", "SERVER_PROTOCOL", "SERVER_SOFTWARE", "DOCUMENT_ROOT"]:
    if key in os.environ:
        print(f"<li>{key}: {os.environ[key]}</li>")
print("</ul>")

print("<h2>Request Headers</h2>")
print("<ul>")
for key, value in os.environ.items():
    if key.startswith("HTTP_"):
        print(f"<li>{key}: {value}</li>")
print("</ul>")

print("</body></html>")
