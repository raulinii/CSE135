const collector = (function() {
  'use strict';

  // ================================
  // Private State
  // ================================

  let config = {};
  let initialized = false;
  const globalProps = {};

  let lcpValue = 0;
  let clsValue = 0;
  let inpValue = 0;

  const reportedErrors = new Set();
  let errorCount = 0;
  const MAX_ERRORS = 10;

  const defaults = {
    endpoint: 'https://collector.raulc.xyz/collect',
    enableTechnographics: true,
    enableTiming: true,
    enableVitals: true,
    enableErrors: true,
    sampleRate: 1.0,
    debug: false,
    respectConsent: true,
    detectBots: true
  };

    let lastActivityTime = Date.now();
    let idleStartTime = null;
    let isIdle = false;

    const IDLE_THRESHOLD = 2000; // 2 seconds

  // ================================
  // Utilities
  // ================================

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  function log(...args) {
    if (config.debug) {
      console.log('[Collector]', ...args);
    }
  }

  function warn(...args) {
    console.warn('[Collector]', ...args);
  }

  function shouldSample() {
    const sampled = sessionStorage.getItem('_collector_sampled');
    if (sampled !== null) return sampled === 'true';

    const result = Math.random() < config.sampleRate;
    sessionStorage.setItem('_collector_sampled', String(result));
    return result;
  }

  function hasConsent() {
  if (navigator.globalPrivacyControl) return false;

  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const cookie = c.trim();
    if (cookie.indexOf('analytics_consent=') === 0) {
      return cookie.split('=')[1] === 'true';
    }
  }

  return false;
}

function isBot() {
  if (navigator.webdriver) return true;

  const ua = navigator.userAgent;
  if (/HeadlessChrome|PhantomJS|Lighthouse/i.test(ua)) return true;

  if (/Chrome/.test(ua) && !window.chrome) return true;

  if (window._phantom || window.__nightmare || window.callPhantom) return true;

  return false;
}

const RETRY_CAP = 50;

function queueForRetry(payload) {
  const queue = JSON.parse(sessionStorage.getItem('_collector_retry') || '[]');
  if (queue.length >= RETRY_CAP) return;

  queue.push(payload);
  sessionStorage.setItem('_collector_retry', JSON.stringify(queue));
}

function processRetryQueue() {
  const queue = JSON.parse(sessionStorage.getItem('_collector_retry') || '[]');
  if (!queue.length) return;

  sessionStorage.removeItem('_collector_retry');
  queue.forEach((p) => send(p));
}

let pageShowTime = Date.now();
let totalVisibleTime = 0;

function initTimeOnPage() {
  pageShowTime = Date.now();
  totalVisibleTime = 0;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      totalVisibleTime += Date.now() - pageShowTime;

      send({
        type: 'page_exit',
        timeOnPage: totalVisibleTime,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });

    } else {
      pageShowTime = Date.now();
    }
  });
}

function detectImagesEnabled(callback) {
  const img = new Image();

  img.onload = function() {
    callback(true);
  };

  img.onerror = function() {
    callback(false);
  };

  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
}

function detectCSSEnabled() {
  const el = document.createElement('div');
  el.style.display = 'none';
  document.body.appendChild(el);

  const computed = window.getComputedStyle(el);
  const enabled = computed.display === 'none';

  document.body.removeChild(el);
  return enabled;
}

function sendActivity(type, data) {
  if (!initialized) return;

  send({
    type: 'activity',
    activityType: type,
    data: data,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    session: getSessionId()
  });
}

  // ================================
  // Sending
  // ================================

    function send(payload) {
    if (config.debug) {
        console.log('[Collector] Would send:', payload);
        return;
    }

    performance.mark('collector_send_start');

    const blob = new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
    );

    if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon(config.endpoint, blob);

        if (!ok) {
        queueForRetry(payload);   
        }

    } else {
        fetch(config.endpoint, {
        method: 'POST',
        body: blob,
        keepalive: true
        }).catch((err) => {
        warn('Send failed:', err.message);
        queueForRetry(payload);   
        });
    }

    performance.mark('collector_send_end');
    performance.measure('collector_send', 'collector_send_start', 'collector_send_end');
    }

  // ================================
  // Session + Payload
  // ================================

  function getSessionId() {
    let sid = sessionStorage.getItem('_collector_sid');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('_collector_sid', sid);
    }
    return sid;
  }

  function buildPayload(eventName) {
    const payload = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      type: eventName,
      session: getSessionId()
    };

    for (const k of Object.keys(globalProps)) {
      payload[k] = globalProps[k];
    }

    return payload;
  }

  // ================================
  // Technographics
  // ================================

  function getTechnographics() {
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
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      cores: navigator.hardwareConcurrency || 0,
      memory: navigator.deviceMemory || 0,
      network: networkInfo,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // ================================
  // Timing + Resources
  // ================================

  function getNavigationTiming() {
    const entries = performance.getEntriesByType('navigation');
    if (!entries.length) return {};

    const n = entries[0];

    return {
      dnsLookup: round(n.domainLookupEnd - n.domainLookupStart),
      tcpConnect: round(n.connectEnd - n.connectStart),
      tlsHandshake: n.secureConnectionStart > 0
        ? round(n.connectEnd - n.secureConnectionStart) : 0,
      ttfb: round(n.responseStart - n.requestStart),
      download: round(n.responseEnd - n.responseStart),
      domInteractive: round(n.domInteractive - n.fetchStart),
      domComplete: round(n.domComplete - n.fetchStart),
      loadEvent: round(n.loadEventEnd - n.fetchStart),
      fetchTime: round(n.responseEnd - n.fetchStart),
      transferSize: n.transferSize,
      headerSize: n.transferSize - n.encodedBodySize
    };
  }

  function getResourceSummary() {
    const resources = performance.getEntriesByType('resource');

    const summary = {
      script: { count: 0, totalSize: 0, totalDuration: 0 },
      link: { count: 0, totalSize: 0, totalDuration: 0 },
      img: { count: 0, totalSize: 0, totalDuration: 0 },
      font: { count: 0, totalSize: 0, totalDuration: 0 },
      fetch: { count: 0, totalSize: 0, totalDuration: 0 },
      xmlhttprequest: { count: 0, totalSize: 0, totalDuration: 0 },
      other: { count: 0, totalSize: 0, totalDuration: 0 }
    };

    resources.forEach((r) => {
      const type = summary[r.initiatorType] ? r.initiatorType : 'other';
      summary[type].count++;
      summary[type].totalSize += r.transferSize || 0;
      summary[type].totalDuration += r.duration || 0;
    });

    return {
      totalResources: resources.length,
      byType: summary
    };
  }

  // ================================
  // Web Vitals (Module 06)
  // ================================

  function observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.renderTime || lastEntry.loadTime;
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  function observeCLS() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }

  function observeINP() {
    const interactions = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) {
          interactions.push(entry.duration);
        }
      }
      if (interactions.length > 0) {
        interactions.sort((a, b) => b - a);
        inpValue = interactions[0];
      }
    });
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  }

  const thresholds = {
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    inp: [200, 500]
  };

  function getVitalsScore(metric, value) {
    const t = thresholds[metric];
    if (!t) return null;
    if (value <= t[0]) return 'good';
    if (value <= t[1]) return 'needsImprovement';
    return 'poor';
  }

  function sendVitals() {
    const vitals = {
      lcp: { value: round(lcpValue), score: getVitalsScore('lcp', lcpValue) },
      cls: { value: round(clsValue * 1000) / 1000, score: getVitalsScore('cls', clsValue) },
      inp: { value: round(inpValue), score: getVitalsScore('inp', inpValue) }
    };

    send({
      type: 'vitals',
      vitals,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  function initVitalsObservers() {
    observeLCP();
    observeCLS();
    observeINP();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendVitals();
      }
    });
  }

  // ================================
  // Error Tracking (Module 07)
  // ================================

  function reportError(errorData) {
    if (errorCount >= MAX_ERRORS) return;

    const key = `${errorData.type}:${errorData.message}:${errorData.source || ''}:${errorData.line || ''}`;
    if (reportedErrors.has(key)) return;

    reportedErrors.add(key);
    errorCount++;

    send({
      type: 'error',
      error: errorData,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }

  function initErrorTracking() {
    window.addEventListener('error', (event) => {
      if (event instanceof ErrorEvent) {
        reportError({
          type: 'js-error',
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error ? event.error.stack : ''
        });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      reportError({
        type: 'promise-rejection',
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : ''
      });
    });

    window.addEventListener('error', (event) => {
      if (!(event instanceof ErrorEvent)) {
        const target = event.target;
        if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
          reportError({
            type: 'resource-error',
            tagName: target.tagName,
            src: target.src || target.href || ''
          });
        }
      }
    }, true);
  }

// ================================
// Activity Tracking (Module)
// ================================  

function initActivityTracking() {

  // Mouse move (MDN: mousemove)
  document.addEventListener('mousemove', (e) => {
    registerActivity();
    sendActivity('mousemove', {
      x: e.clientX,
      y: e.clientY
    });
  });

  // Mouse click (MDN: click)
  document.addEventListener('click', (e) => {
    registerActivity();
    sendActivity('click', {
      button: e.button,
      x: e.clientX,
      y: e.clientY
    });
  });

  // Scroll (MDN: scroll)
  document.addEventListener('scroll', () => {
    registerActivity();
    sendActivity('scroll', {
      scrollX: window.scrollX,
      scrollY: window.scrollY
    });
  });

  // Keyboard down (MDN: keydown)
  document.addEventListener('keydown', (e) => {
    registerActivity();
    sendActivity('keydown', {
      key: e.key,
      code: e.code
    });
  });

  // Keyboard up (MDN: keyup)
  document.addEventListener('keyup', (e) => {
    registerActivity();
    sendActivity('keyup', {
      key: e.key,
      code: e.code
    });
  });
}

function registerActivity() {
  const now = Date.now();

  // If user was idle, record idle end
  if (isIdle) {
    sendActivity('idle_end', {
      idleDuration: now - idleStartTime
    });

    isIdle = false;
    idleStartTime = null;
  }

  lastActivityTime = now;
}

function startIdleTimer() {
  setInterval(() => {
    const now = Date.now();

    if (!isIdle && now - lastActivityTime >= IDLE_THRESHOLD) {
      isIdle = true;
      idleStartTime = lastActivityTime;

      sendActivity('idle_start', {
        idleStartedAt: new Date(idleStartTime).toISOString()
      });
    }
  }, 500);
}
// ================================
// Extensions (Module 09)
// ================================

const extensions = {};

function use(extension) {
  if (!extension || !extension.name) {
    warn('Extension must have a name property');
    return;
  }

  if (extensions[extension.name]) {
    warn(`Extension "${extension.name}" already registered`);
    return;
  }

  extensions[extension.name] = extension;

  if (typeof extension.init === 'function') {
    extension.init({
      track: track,
      set: set,
      getConfig: () => config,
      getSessionId: getSessionId
    });
  }

  log('Extension registered:', extension.name);
}
// ================================
// Module 10: Command Queue
// ================================

function processQueue(publicAPI) {
  const queue = window._cq || [];

  for (const args of queue) {
    const method = args[0];
    const params = args.slice(1);

    if (typeof publicAPI[method] === 'function') {
      publicAPI[method](...params);
    }
  }

  // Replace queue with live executor
  window._cq = {
    push: function(args) {
      const method = args[0];
      const params = args.slice(1);

      if (typeof publicAPI[method] === 'function') {
        publicAPI[method](...params);
      }
    }
  };
}

  // ================================
  // Public API
  // ================================

  function init(options) {
    if (initialized) {
      warn('collector.init() called more than once');
      return;
    }
    performance.mark('collector_init_start');
    config = {};
    for (const key of Object.keys(defaults)) {
      config[key] = (options && options[key] !== undefined)
        ? options[key]
        : defaults[key];
    }
    if (config.respectConsent && !hasConsent()) {
    return;
    }

    if (config.detectBots && isBot()) {
    return;
    }
    if (!shouldSample()) return;

    initialized = true;
    processRetryQueue();
    initTimeOnPage();
    initActivityTracking();
    startIdleTimer();
    if (config.enableErrors) initErrorTracking();
    if (config.enableVitals) initVitalsObservers();

    window.addEventListener('load', () => {
      setTimeout(() => {
        detectImagesEnabled(function(imagesEnabled) {

  const payload = buildPayload('pageview');

  payload.static = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    javascriptEnabled: true,
    imagesEnabled: imagesEnabled,
    cssEnabled: detectCSSEnabled(),

    screenWidth: window.screen.width,
    screenHeight: window.screen.height,

    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,

    networkType: navigator.connection && navigator.connection.effectiveType
      ? navigator.connection.effectiveType
      : null
  };

  if (config.enableTiming) {
  const nav = performance.getEntriesByType('navigation')[0];

  if (nav) {
    payload.performance = {
      timing: getNavigationTiming(),

      pageStart: nav.startTime,
      pageEnd: nav.loadEventEnd,

      totalLoadTime: round(nav.loadEventEnd - nav.startTime)
    };
  }
}

  send(payload);

});
      }, 0);
    });
    performance.mark('collector_init_end');
    performance.measure('collector_init', 'collector_init_start', 'collector_init_end');
  }

  function track(eventName, data) {
    if (!initialized) return;
    const payload = buildPayload(eventName);
    if (data) payload.data = data;
    send(payload);
  }

  function set(key, value) {
    globalProps[key] = value;
  }

  function identify(userId) {
    globalProps.userId = userId;
  }

  const publicAPI = {
  init,
  track,
  set,
  identify,
  use
};
processQueue(publicAPI);
return publicAPI;

})();