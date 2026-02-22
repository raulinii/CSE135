#!/usr/bin/php-cgi
<?php
header("Content-Type: text/html");

$team = "Raul";
$language = "PHP";
$time = date("Y-m-d H:i:s");
$ip = $_SERVER["REMOTE_ADDR"];
?>

<!DOCTYPE html>
<html>
<head>
<script src="https://cdn.logr-in.com/LogRocket.min.js" crossorigin="anonymous"></script>
<script>window.LogRocket && window.LogRocket.init('rke3q3/wwwraulcxyz');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BEZXSPNWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BEZXSPNWWZ');
</script>

  <title>Hello HTML PHP</title>
</head>
<body>
  <h1>Hello HTML World</h1>
  <p>Team: <?= $team ?></p>
  <p>Language: <?= $language ?></p>
  <p>Generated on: <?= $time ?></p>
  <p>Your IP Address: <?= $ip ?></p>
</body>
</html>
