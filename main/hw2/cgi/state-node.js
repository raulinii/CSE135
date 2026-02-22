#!/usr/bin/env node

const fs = require("fs");
const querystring = require("querystring");

// REQUIRED CGI HEADER
console.log("Content-Type: text/html\n");

const query = querystring.parse(process.env.QUERY_STRING || "");
const action = query.action;

// Simple file-based state (server-side)
const STATE_FILE = "/tmp/state-node.txt";

console.log("<h1>State Demo (Node)</h1>");

if (action === "set") {
  const value = query.value ?? "";

  fs.writeFileSync(STATE_FILE, value, "utf8");

  console.log(`<p>Saved value: <strong>${value}</strong></p>`);
  console.log(`<a href="/cgi-bin/state-node.js?action=get">View Saved State</a>`);

} else if (action === "get") {
  if (fs.existsSync(STATE_FILE)) {
    const value = fs.readFileSync(STATE_FILE, "utf8");
    console.log(`<p>Saved value: <strong>${value}</strong></p>`);
  } else {
    console.log("<p>No value saved yet.</p>");
  }

  console.log(`<a href="/hw2/state-node-set.html">Back to Set Page</a>`);

} else if (action === "clear") {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  console.log("<p>State cleared.</p>");
  console.log(`<a href="/hw2/state-node-set.html">Back to Set Page</a>`);

} else {
  console.log("<p>Invalid action</p>");
}
