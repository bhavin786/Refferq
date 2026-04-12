import { NextResponse } from 'next/server';

/**
 * GET /api/public/tracking-snippet
 *
 * Returns the JavaScript tracking snippet that upemaster.com embeds.
 * The snippet:
 *   1. Reads the affiliate_attribution cookie (set by /r/[code] redirect)
 *   2. Also reads ?ref= query param as fallback
 *   3. Exposes window.UPEPartner.trackConversion(email, amount, currency) for
 *      upemaster.com to call after a successful signup or subscription payment
 *
 * No auth required — public endpoint, script contains no secrets.
 */
export async function GET() {
  const snippet = `
(function(w) {
  'use strict';
  var PORTAL = 'https://partner.upemaster.com';
  var PUBLIC_KEY = 'pk_e8cc2dab4dde6d28b5bec0ddae843d13130bbd5104d56e166bf638a78b6fbfbc';
  var DEFAULT_REF = 'UPEADM-8B93';

  function getCookie(name) {
    try {
      var m = document.cookie.match('(^|;)\\\\s*' + name + '\\\\s*=\\\\s*([^;]+)');
      return m ? decodeURIComponent(m.pop()) : null;
    } catch(e) { return null; }
  }

  function getUrlParam(name) {
    try {
      return new URLSearchParams(w.location.search).get(name);
    } catch(e) { return null; }
  }

  function getAttribution() {
    // Priority: cookie > URL param > default
    var cookie = getCookie('affiliate_attribution');
    if (cookie) {
      try { return JSON.parse(cookie); } catch(e) {}
    }
    var ref = getUrlParam('ref');
    if (ref) return { referral_code: ref };
    return { referral_code: DEFAULT_REF };
  }

  function trackConversion(customerEmail, amount, currency, orderId, metadata) {
    var attr = getAttribution();
    var payload = {
      referralCode: attr.referral_code || DEFAULT_REF,
      customerEmail: customerEmail || '',
      amount: amount || 0,
      currency: currency || 'INR',
      orderId: orderId || null,
      url: w.location.href,
      timestamp: new Date().toISOString(),
      metadata: Object.assign({ attribution_key: attr.attribution_key }, metadata || {})
    };
    fetch(PORTAL + '/api/track/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PUBLIC_KEY
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function(r) {
      if (!r.ok) r.json().then(function(d) { console.warn('[UPEPartner] Conversion track failed:', d); });
    }).catch(function(e) { console.warn('[UPEPartner] Conversion track error:', e); });
  }

  function setAttributionCookie(code) {
    // Only set if not already attributed — first-click wins
    if (getCookie('affiliate_attribution')) return;
    var expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = 'affiliate_attribution=' + encodeURIComponent(JSON.stringify({
      referral_code: code,
      attribution_key: code + '_' + Date.now()
    })) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function trackClick(referralCode) {
    var code = referralCode || getUrlParam('ref');
    if (!code) return;
    setAttributionCookie(code);
    fetch(PORTAL + '/api/track/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': PUBLIC_KEY },
      body: JSON.stringify({
        referralCode: code,
        url: w.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }),
      keepalive: true
    }).catch(function(){});
  }

  // Auto-track click on page load if ?ref= is in URL
  if (getUrlParam('ref')) { trackClick(getUrlParam('ref')); }

  w.UPEPartner = { trackConversion: trackConversion, trackClick: trackClick, getAttribution: getAttribution };
})(window);
`.trim();

  return new NextResponse(snippet, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': 'https://upemaster.com',
    },
  });
}
