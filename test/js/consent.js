const ConsentManager = {
  check: function() {
    if (navigator.globalPrivacyControl) return false;

    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const cookie = c.trim();
      if (cookie.indexOf('analytics_consent=') === 0) {
        return cookie.split('=')[1] === 'true';
      }
    }

    return false;
  },

  grant: function() {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `analytics_consent=true; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
  },

  revoke: function() {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `analytics_consent=false; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
    sessionStorage.removeItem('_collector_sid');
    sessionStorage.removeItem('_collector_sampled');
    sessionStorage.removeItem('_collector_retry');
  }
};