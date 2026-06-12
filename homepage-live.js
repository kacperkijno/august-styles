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

  /* --- 2b. Generic scroll reveal (framework pillars, testimonials) ---
     JS adds .ak-reveal (so without JS nothing is hidden), then the
     observer adds .ak-in to play the rise animation. Staggered per group. */
  function initReveal() {
    var groups = [
      ['#row-feedd8db', '#row-a1582001', '#row-47647d37'],                                   // Framework numbered boxes
      ['#row-90b835d4', '#row-9ba983ac', '#row-db1956fa', '#row-f1101f63', '#row-407010f1']  // Testimonials cards
    ];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = [];
    groups.forEach(function (sels) {
      sels.forEach(function (sel, i) {
        var el = document.querySelector(sel);
        if (!el) return;
        el.classList.add('ak-reveal');
        el.style.animationDelay = (i * 90) + 'ms';   // stagger within the group
        targets.push(el);
      });
    });
    if (!targets.length) return;

    if (reduce) {
      targets.forEach(function (el) { el.classList.add('ak-in'); });
      return;
    }

    /* Scroll-based detection (more reliable than IntersectionObserver on
       this systeme.io page — IO did not fire for these nodes). Reveal an
       element once its top crosses ~88% of the viewport height. */
    function reveal() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var k = targets.length - 1; k >= 0; k--) {
        var r = targets[k].getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) {
          targets[k].classList.add('ak-in');
          targets.splice(k, 1);
        }
      }
      if (!targets.length) window.removeEventListener('scroll', onScroll);
    }
    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () { reveal(); ticking = false; });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    reveal(); // reveal anything already in view on load

    /* Safety net: never leave content hidden, even if scroll never fires. */
    setTimeout(function () {
      targets.slice().forEach(function (el) { el.classList.add('ak-in'); });
    }, 4000);
  }

  /* --- 3. Header scroll state ---------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector('header[type="WebsiteHeader"]');
    if (!header) return;

    /* Homepage has a dark hero behind a transparent nav → reveal the solid
       bar on scroll. Other pages (materials, etc.) have no dark hero, so the
       transparent default is unreadable on a light page — pin the solid bar
       from the top and skip the scroll toggle. */
    var isHome = location.pathname === '/' ||
                 !!document.getElementById('section-e8a2d9b7');
    if (!isHome) {
      header.classList.add('is-scrolled');
      return;
    }

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

  /* --- 4. Latest writing (auto from the systeme blog RSS) ----
     Drop <div id="ak-latest-writing" data-count="3"></div> anywhere
     (a raw-HTML widget). This fetches /blog/feed (same-origin, no CORS),
     renders the newest N posts as fully-clickable cards, and auto-updates
     whenever August publishes — no manual editing. */
  function initLatestWriting() {
    var host = document.getElementById('ak-latest-writing');
    if (!host) return;
    var count = parseInt(host.getAttribute('data-count'), 10) || 3;

    fetch('/blog/feed', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'application/xml');
        var items = [].slice.call(doc.querySelectorAll('item')).slice(0, count);
        if (!items.length) return;

        host.classList.add('ak-writing-grid');
        host.innerHTML = '';

        items.forEach(function (it) {
          var get = function (t) { var n = it.querySelector(t); return n ? n.textContent : ''; };
          var title = get('title');
          var link = get('link');
          var cat = get('category');
          var enc = it.querySelector('enclosure');
          var imgUrl = enc ? enc.getAttribute('url') : '';

          var date = '';
          var pd = get('pubDate');
          if (pd) {
            var d = new Date(pd);
            if (!isNaN(d.getTime())) {
              date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            }
          }

          var a = document.createElement('a');
          a.className = 'ak-writing-card';
          a.href = link;

          if (imgUrl) {
            var thumb = document.createElement('div');
            thumb.className = 'ak-writing-thumb';
            var img = document.createElement('img');
            img.src = imgUrl; img.alt = title; img.loading = 'lazy';
            thumb.appendChild(img);
            a.appendChild(thumb);
          }

          var body = document.createElement('div');
          body.className = 'ak-writing-body';
          if (cat) {
            var eb = document.createElement('span');
            eb.className = 'ak-writing-eyebrow';
            eb.textContent = cat;
            body.appendChild(eb);
          }
          var h = document.createElement('h3');
          h.className = 'ak-writing-title';
          h.textContent = title;
          body.appendChild(h);
          if (date) {
            var dt = document.createElement('span');
            dt.className = 'ak-writing-date';
            dt.textContent = date;
            body.appendChild(dt);
          }
          a.appendChild(body);
          host.appendChild(a);
        });
      })
      .catch(function () { /* on failure leave whatever is in the host (static fallback) */ });
  }

  /* --- Boot ---------------------------------------------- */
  function init() {
    applyHomeClass();
    initCardReveal();
    initReveal();
    initHeaderScroll();
    initLatestWriting();
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
