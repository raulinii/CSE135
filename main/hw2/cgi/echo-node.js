#!/usr/bin/env node

const querystring = require("querystring");

let body = "";
process.stdin.on("data", chunk => body += chunk);
process.stdin.on("end", () => {

const method = process.env.REQUEST_METHOD;
const contentType = process.env.CONTENT_TYPE || "";
const time = new Date().toISOString();
const ip = process.env.REMOTE_ADDR;
const ua = process.env.HTTP_USER_AGENT || "Unknown";

let data = {};

if (method === "GET") {
data = querystring.parse(process.env.QUERY_STRING || "");
} else if (contentType.includes("application/json")) {
data = body ? JSON.parse(body) : {};
} else {
data = querystring.parse(body);
}

// Always text/plain
console.log("Content-Type: text/plain\n");

console.log("Echo Node");
console.log("---------");
console.log(`Method: ${method}`);
console.log(`Time: ${time}`);
console.log(`IP: ${ip}`);
console.log(`User-Agent: ${ua}`);
console.log("Data Received:");

// IMPORTANT PART
if (contentType.includes("application/json")) {
console.log(JSON.stringify(data, null, 2));
} else {
for (const key in data) {
console.log(`${key}: ${data[key]}`);
}
}
});
