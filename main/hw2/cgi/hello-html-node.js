#!/usr/bin/env node

const now = new Date();
const ip = process.env.REMOTE_ADDR || "Unknown";

console.log("Content-Type: text/html");
console.log("");

console.log(`
<!DOCTYPE html>
<html>
<head><title>Hello Node</title></head>
<body>
  <h1>Hello from Node.js</h1>
  <p>Team: Raul</p>
  <p>Language: Node.js</p>
  <p>Generated on: ${now}</p>
  <p>IP: ${ip}</p>
</body>
</html>
`);
console.log(`
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BEZXSPNWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BEZXSPNWWZ');
</script>
`);
console.log(`<script src="https://cdn.logr-in.com/LogRocket.min.js" crossorigin="anonymous"></script>
<script>window.LogRocket && window.LogRocket.init('rke3q3/wwwraulcxyz');</script>`);


