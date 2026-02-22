#!/usr/bin/env php
<?php
header("Content-Type: text/plain");

$method = $_SERVER["REQUEST_METHOD"];
$time = date("Y-m-d H:i:s");
$ip = $_SERVER["REMOTE_ADDR"];
$userAgent = $_SERVER["HTTP_USER_AGENT"] ?? "Unknown";

$data = [];

// Read body for POST / PUT / DELETE
$raw = file_get_contents("php://input");
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

if ($contentType === "application/json") {
  $data = json_decode($raw, true);
} else {
  parse_str($raw, $data);
}

// GET parameters
if ($method === "GET") {
  $data = $_GET;
}

echo "Echo PHP\n";
echo "--------\n";
echo "Method: $method\n";
echo "Time: $time\n";
echo "IP: $ip\n";
echo "User-Agent: $userAgent\n";
echo "Data Received:\n";

if ($contentType === "application/json") {
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
} else {
    print_r($data);
}

