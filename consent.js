/* ============================================================
   consent.js — baner zgody na cookies analityczne (GA4, Consent Mode v2)

   Jak to dziala:
   1. W HEAD kazdej strony, PRZED snippetem GA4, stoi linijka
      `consent-default` (patrz README / consent-head.snippet.html). Ustawia
      domyslnie analytics_storage = denied, chyba ze cookie `ak_consent`
      mowi `granted`. Bez tej linijki GA4 stawia _ga zanim ktokolwiek kliknie.
   2. Ten plik pokazuje baner, gdy wyboru jeszcze nie bylo, i po kliknieciu
      wysyla gtag('consent','update', ...) oraz zapisuje wybor w cookie
      `ak_consent` na .augustkjerland.com (180 dni), zeby dzialal i z www,
      i bez www, i na checkoutach.
   3. `window.akConsent.open()` otwiera baner ponownie (link „Cookie settings"
      na /legal-pages#cookies).

   Baner siedzi w Shadow DOM: klasyfikator przyciskow, typografii i kart
   z homepage-live.js go nie widzi, a arkusze serwisu go nie przemaluja.
   Laduje go homepage-live.js; /links (bez homepage-live.js) ma go w HEAD.
   ============================================================ */
(function () {
  'use strict';
  if (window.akConsent) return;

  var NAZWA = 'ak_consent';
  var DNI = 180;

  function odczyt() {
    var m = document.cookie.match(/(?:^|;\s*)ak_consent=(granted|denied)/);
    return m ? m[1] : null;
  }
  function domena() {
    var h = location.hostname;
    return /(^|\.)augustkjerland\.com$/.test(h) ? '; domain=.augustkjerland.com' : '';
  }
  function zapisz(v) {
    document.cookie = NAZWA + '=' + v + '; max-age=' + (DNI * 86400) + '; path=/; SameSite=Lax; Secure' + domena();
  }
  function gtagSafe() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }
    return window.gtag;
  }
  /* Po odmowie usuwamy _ga, jesli zostaly z czasow przed banerem. */
  function usunGa() {
    var c = document.cookie.split(';');
    var host = location.hostname.replace(/^www\./, '');
    for (var i = 0; i < c.length; i++) {
      var n = c[i].split('=')[0].trim();
      if (/^_ga(_|$)/.test(n)) {
        var wygas = n + '=; max-age=0; path=/';
        document.cookie = wygas;
        document.cookie = wygas + '; domain=.' + host;
        document.cookie = wygas + '; domain=' + location.hostname;
      }
    }
  }
  function ustaw(v) {
    zapisz(v);
    gtagSafe()('consent', 'update', { analytics_storage: v });
    if (v === 'denied') usunGa();
    zamknij();
  }

  var host = null;

  var CSS = [
    ':host{all:initial}',
    '.b{position:fixed;left:24px;bottom:24px;z-index:2147483000;box-sizing:border-box;width:400px;max-width:calc(100vw - 32px);',
    ' background:#F9F7F1;color:#2D2D2D;border:1px solid #D7DDD8;border-radius:4px;',
    ' box-shadow:0 12px 32px rgba(26,60,47,.14),0 2px 6px rgba(26,60,47,.08);padding:24px;',
    ' font-family:neue-haas-grotesk-display,AKHaas,NeueHaasDisplay,"Helvetica Neue",Arial,sans-serif;',
    ' opacity:0;transform:translateY(12px);transition:opacity .28s cubic-bezier(.2,.6,.2,1),transform .28s cubic-bezier(.2,.6,.2,1)}',
    '.b.on{opacity:1;transform:none}',
    'h2{margin:0 0 8px;font-family:adobe-caslon-pro,AKCaslon,Georgia,serif;font-weight:400;font-size:24px;line-height:1.25;color:#1A3C2F}',
    'p{margin:0 0 20px;font-size:15px;line-height:1.55;color:rgba(45,45,45,.86)}',
    'a{color:#9A5832;text-decoration:underline;text-underline-offset:2px}',
    'a:hover{color:#1A3C2F}',
    '.r{display:flex;gap:8px}',
    'button{flex:1 1 0;min-height:48px;padding:8px 24px;border-radius:4px;font:inherit;font-size:14px;font-weight:400;line-height:1.15;cursor:pointer;',
    ' transition:background-color .18s cubic-bezier(.2,.6,.2,1),border-color .18s cubic-bezier(.2,.6,.2,1)}',
    '.y{background:#1A3C2F;color:#F9F7F1;border:1px solid #1A3C2F}',
    '.y:hover{background:#234A3A}',
    '.n{background:transparent;color:#1A3C2F;border:1px solid rgba(26,60,47,.45)}',
    '.n:hover{background:rgba(26,60,47,.06);border-color:#1A3C2F}',
    'button:focus-visible,a:focus-visible{outline:2px solid #B46A3C;outline-offset:2px}',
    '@media(max-width:600px){.b{left:16px;right:16px;bottom:16px;width:auto;max-width:none;padding:20px}}',
    '@media(prefers-reduced-motion:reduce){.b{transition:none}}'
  ].join('\n');

  function otworz() {
    if (host) return;
    host = document.createElement('div');
    host.setAttribute('data-ak-consent', '');
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="b" role="dialog" aria-live="polite" aria-labelledby="akc-t" aria-describedby="akc-d">' +
        '<h2 id="akc-t">Cookies.</h2>' +
        '<p id="akc-d">We use analytics cookies to see which pages are useful. No ads and no tracking across other sites. ' +
        'You can change your choice at any time. <a href="https://www.augustkjerland.com/legal-pages#cookies">Cookie policy</a></p>' +
        '<div class="r"><button type="button" class="n" data-v="denied">Decline</button>' +
        '<button type="button" class="y" data-v="granted">Accept</button></div>' +
      '</div>';
    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button[data-v]') : null;
      if (t) ustaw(t.getAttribute('data-v'));
    });
    document.body.appendChild(host);
    var b = root.querySelector('.b');
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('on'); }); });
  }
  function zamknij() {
    if (!host) return;
    var h = host; host = null;
    var b = (h.shadowRoot || h).querySelector('.b');
    if (b) b.classList.remove('on');
    setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 300);
  }

  window.akConsent = { open: otworz, get: odczyt };

  /* Link „Cookie settings" gdziekolwiek w tresci: <a href="#cookie-settings"> */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href$="#cookie-settings"]') : null;
    if (a) { e.preventDefault(); otworz(); }
  });

  function start() {
    var v = odczyt();
    /* Wybor sprzed zaladowania strony: linijka w HEAD juz go podala jako
       default, tu tylko dla porzadku (strony, gdzie linijki jeszcze nie ma). */
    if (v) { gtagSafe()('consent', 'update', { analytics_storage: v }); return; }
    otworz();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
