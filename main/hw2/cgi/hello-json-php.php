#!/usr/bin/env php
<?php
header("Content-Type: application/json");

$data = [
  "team" => "Raul",
  "language" => "PHP",
  "time" => date("Y-m-d H:i:s"),
  "ip" => $_SERVER["REMOTE_ADDR"]
];

echo json_encode($data);
