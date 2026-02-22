#!/usr/bin/env node

console.log("Content-Type: text/plain");
console.log("");

for (const [key, value] of Object.entries(process.env)) {
  console.log(`${key}=${value}`);
}
