#!/usr/bin/env node

const now = new Date();
const ip = process.env.REMOTE_ADDR || "Unknown";

const data = {
  team: "raul",
  language: "node",
  date: now.toISOString(),
  ip: ip
};

console.log("Content-Type: application/json");
console.log("");
console.log(JSON.stringify(data, null, 2));
