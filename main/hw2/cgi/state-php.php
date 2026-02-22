#!/usr/bin/env php
<?php
header("Content-Type: text/plain");
session_start();

$action = $_GET['action'] ?? '';

echo "State PHP\n";
echo "---------\n";

if ($action === "set") {
    $value = $_REQUEST['value'] ?? '(missing)';
    $_SESSION['value'] = $value;
    echo "Saved value: $value\n";
}
elseif ($action === "get") {
    if (isset($_SESSION['value'])) {
        echo "Saved value: " . $_SESSION['value'] . "\n";
    } else {
        echo "No value saved\n";
    }
}
elseif ($action === "clear") {
    session_destroy();
    echo "State cleared\n";
}
else {
    echo "Invalid action\n";
}

