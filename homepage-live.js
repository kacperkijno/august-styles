/* ============================================================
   AK Homepage — behaviour for augustkjerland.com root.
   Loaded via homepage-live.snippet.html (defer).
   Pairs with homepage-live.css.

   Does three things:
     1. Tags <body> with .ak-home (scope for About / Framework CSS).
     2. Reveals course cards on scroll (.is-visible).
     3. Toggles .is-scrolled on the systeme.io header after 40px.
   ============================================================ */
(function () {
  /* --- 1. Body scope class -------------------------------- */
  function applyHomeClass() {
    if (document.body && !document.body.classList.contains('ak-home')) {
      document.body.classList.add('ak-home');
    }
  }

  /* --- 2. Course cards entrance reveal -------------------- */
  function initCardReveal() {
    var cards = document.querySelectorAll('#row-4332dc25 > div[size="4"] > div');
    if (!cards.length) return;

    // Fallback: no IO support → show immediately
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'   /* trigger ~80px before bottom edge */
    });

    cards.forEach(function (c) { io.observe(c); });
  }

  /* --- 3. Header scroll state ---------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector('header[type="WebsiteHeader"]');
    if (!header) return;

    var threshold = 40;
    var state = false;

    function check() {
      var scrolled = window.scrollY > threshold;
      if (scrolled !== state) {
        header.classList.toggle('is-scrolled', scrolled);
        state = scrolled;
      }
    }

    window.addEventListener('scroll', check, { passive: true });
    check(); // run once on load (in case page restored mid-scroll)
  }

  /* --- Boot ---------------------------------------------- */
  function init() {
    applyHomeClass();
    initCardReveal();
    initHeaderScroll();
  }

  applyHomeClass(); // earliest possible, before paint where we can
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // systeme.io can re-render body classes — keep .ak-home pinned.
  if (window.MutationObserver) {
    var pin = function () {
      if (document.body) {
        new MutationObserver(applyHomeClass).observe(document.body, {
          attributes: true, attributeFilter: ['class']
        });
      }
    };
    if (document.body) pin();
    else document.addEventListener('DOMContentLoaded', pin);
  }
})();
