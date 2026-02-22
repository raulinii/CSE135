#!/usr/bin/env python3
import os
from datetime import datetime
print("Content-Type: text/html")
print()

print("<html>")
print("""<script src="https://cdn.logr-in.com/LogRocket.min.js" crossorigin="anonymous"></script>
<script>window.LogRocket && window.LogRocket.init('rke3q3/wwwraulcxyz');</script>""")
print("""
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BEZXSPNWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BEZXSPNWWZ');
</script>
""")
print("<body>")
print("<h1>Hello from Python</h1>")
print("<p>Team: Raul</p>")
print("<p>Language: Python</p>")
print(f"<p>Generated on: {datetime.now()}</p>")
print(f"<p>IP:{os.environ.get('REMOTE_ADDR')}</p>")
print("</body></html>")
