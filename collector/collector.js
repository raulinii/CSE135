(function() {
  'use strict';

  const endpoint = 'https://collector.raulc.xyz/collect';

  function getSessionId() {
  let sid = sessionStorage.getItem('_collector_sid');
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('_collector_sid', sid);
  }
  return sid;
}

  function getTechnographics() {
  // Network info (feature-detected)
  let networkInfo = {};
  if ('connection' in navigator) {
    const conn = navigator.connection;
    networkInfo = {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    };
  }

  return {
    // Browser identification
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,

    // Viewport (current browser window)
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    // Screen (physical display)
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,

    // Hardware
    cores: navigator.hardwareConcurrency || 0,
    memory: navigator.deviceMemory || 0,

    // Network
    network: networkInfo,

    // Preferences
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

function send(payload) {
    const json = JSON.stringify(payload);
    const blob = new Blob([json], { type: 'application/json' });

    // Strategy 1: sendBeacon
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }

    // Strategy 2: fetch with keepalive
    fetch(endpoint, {
      method: 'POST',
      body: json,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    }).catch(() => {
      // Strategy 3: plain fetch
      fetch(endpoint, {
        method: 'POST',
        body: json,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    });
  }


  function sendBeacon() {
        const payload = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        type: 'pageview',
        session: getSessionId(),
        technographics: getTechnographics()
    };
        send(payload);
    }



  // Fire on page load
  if (document.readyState === 'complete') {
    sendBeacon();
  } else {
    window.addEventListener('load', sendBeacon);
  }
})();