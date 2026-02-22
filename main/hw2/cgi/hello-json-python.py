#!/usr/bin/env python3

import os,json
from datetime import datetime
print("Content-Type: application/json")
print()
jsonD = {
"team": "raul",
"language": "python",
"date": f"{datetime.now()}",
"ip": f"{os.environ.get('REMOTE_ADDR')}"
}

print(json.dumps(jsonD))

