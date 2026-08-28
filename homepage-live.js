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

  /* --- 3b. Header scroll state — STRONY LEJKA I BLOGA -------
     Website ma <header type="WebsiteHeader">; lejki i blog maja zwykly
     wiersz systeme z blokiem menu w srodku. Ta sama logika, inny nosnik:
     przezroczysty pasek nad ciemnym hero, solidny cream po 40 px.
     Na stronach bez ciemnego hero solidny pasek od razu — inaczej cream
     linki bylyby nieczytelne na jasnym tle. */
  function initFunnelNav() {
    var menu = document.querySelector('[id^="menu-"]');
    if (!menu) return;
    var bar = menu.closest('[id^="row-"]');
    if (!bar) return;
    /* Website ma wlasna obsluge (initHeaderScroll) — nie dublujemy. */
    if (bar.closest('header[type="WebsiteHeader"]')) return;

    /* Strony lejka z CIEMNYM hero — tam pasek ma byc przezroczysty na gorze,
       zeby zdjecie/tlo wchodzilo pod niego jak na stronie glownej.
       Lista jawna, tak samo jak w initHeaderScroll wyzej: prosciej ja
       przejrzec niz zgadywac luminancje bloku, ktory systeme moze
       przebudowac. Nowa strona z ciemnym hero → dopisz sciezke tutaj. */
    var DARK_HERO = ['/cultural-communication', '/pitching-decoded'];
    var path = location.pathname.replace(/\/+$/, '') || '/';
    if (DARK_HERO.indexOf(path) === -1) return;   /* solidny pasek zostaje */

    var threshold = 40, over = null;
    function check() {
      var atTop = window.scrollY <= threshold;
      if (atTop !== over) {
        bar.classList.toggle('ak-nav-over-hero', atTop);
        over = atTop;
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* --- 3. Header scroll state ---------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector('header[type="WebsiteHeader"]');
    if (!header) return;

    /* Homepage has a dark hero behind a transparent nav → reveal the solid
       bar on scroll. Other pages (materials, etc.) have no dark hero, so the
       transparent default is unreadable on a light page — pin the solid bar
       from the top and skip the scroll toggle. */
    /* Transparent nav + scroll-reveal ONLY on pages with a DARK hero behind
       the bar: home, plus the /about (.akb-hero) and /consulting (.akc-hero)
       blocks. Pages without a dark hero (e.g. /academy, /materials) would lose
       the cream nav text on a light hero, so pin the solid bar and skip toggle. */
    var darkHero = location.pathname === '/' ||
                 !!document.getElementById('section-e8a2d9b7') ||
                 !!document.querySelector('.akb-hero, .akc-hero');
    if (!darkHero) {
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

        host.classList.add('ak-writing-list');
        host.innerHTML = '';

        var ARROW = '<svg class="post__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
        var fixedEyebrow = host.getAttribute('data-eyebrow') || '';

        items.forEach(function (it) {
          var get = function (t) { var n = it.querySelector(t); return n ? n.textContent : ''; };
          var a = document.createElement('a');
          a.className = 'post';
          a.href = get('link');

          var main = document.createElement('span');
          main.className = 'post__main';
          /* systeme's RSS has no <category>; fall back to data-eyebrow if set. */
          var cat = get('category') || fixedEyebrow;
          if (cat) {
            var c = document.createElement('span');
            c.className = 'post__cat';
            c.textContent = cat;
            main.appendChild(c);
          }
          var t = document.createElement('span');
          t.className = 'post__title';
          t.textContent = get('title');
          main.appendChild(t);

          a.appendChild(main);
          a.insertAdjacentHTML('beforeend', ARROW);
          host.appendChild(a);
        });
      })
      .catch(function () { /* on failure leave whatever is in the host (static fallback) */ });
  }


  /* --- H1 na /blog -----------------------------------------
     Strona listy wpisow nie ma naglowka: edytor bloga w systeme
     sklada sie z paska, komponentu "Blog content" i stopki, a
     dolozenie elementu wymaga przeciagniecia myszka (drag & drop,
     ktorego nie da sie wykonac programowo). Do czasu recznego
     dodania go w systeme wstawiamy prawdziwy <h1> tutaj.
     Zabezpieczenie: jesli strona kiedys dostanie wlasny H1,
     ta funkcja sama sie wycofa. --------------------------- */
  function initBlogHeading() {
    var path = location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/blog') return;
    if (document.querySelector('h1')) return;      /* strona ma juz H1 */
    /* lista wpisow jest renderowana przez Reacta juz po DOMContentLoaded,
       wiec probujemy przez chwile, zamiast raz */
    var prob = 0;
    var wstaw = function () {
      if (document.querySelector('h1')) return true;
      var list = document.querySelector('[id^="blogpostlisting-"]');
      if (!list || !list.parentNode) return false;
      var h = document.createElement('h1');
      h.className = 'ak-blog-h1';
      h.textContent = 'Practical notes on pitching and cross-cultural business.';
      /* naglowek ma stac nad CALA trescia bloga, nie miedzy karuzela
         wyroznionego wpisu a siatka pozostalych */
      var wew = list.closest('[id^="section-"]');
      var zew = wew && wew.parentElement ? wew.parentElement.closest('[id^="section-"]') : null;
      var kotwica = zew ? zew.querySelector('[id^="section-"]') : null;
      if (!kotwica || !kotwica.parentNode) kotwica = list;
      kotwica.parentNode.insertBefore(h, kotwica);
      return true;
    };
    if (wstaw()) return;
    var timer = setInterval(function () {
      if (wstaw() || ++prob > 40) clearInterval(timer);   /* max 8 s */
    }, 200);
  }


  /* --- alt dla logotypow klientow -------------------------------
     35 logotypow w marquee nie ma atrybutu alt — dla czytnika ekranu
     to 35 pustych obrazkow, a Google nie wie, co przedstawiaja.
     HTML marquee jest wklejony jako Raw HTML na kilku stronach, wiec
     zamiast poprawiac go w kazdej z osobna nadajemy alt tutaj.
     Nazwy wlasne z mapy; reszta z nazwy pliku. ------------------- */
  var LOGO_ALT = {
    'bi-norwegian': 'BI Norwegian Business School',
    'uia': 'University of Agder',
    'palantir': 'Palantir',
    'grieg-seafood': 'Grieg Seafood',
    'ncc': 'NCC',
    'friele': 'Friele',
    'dale-of-norway': 'Dale of Norway',
    'synnove-finden': 'Synnove Finden',
    'hansa-borg': 'Hansa Borg Bryggerier',
    'bergen-naringsrad': 'Bergen Naringsrad',
    'bergens-rederiforening': 'Bergens Rederiforening',
    'maritimt-forum': 'Maritimt Forum',
    'stromberg-gruppen': 'Stromberg Gruppen',
    'olden': 'Olden',
    'necon': 'Necon',
    'moderne-transport': 'Moderne Transport',
    'samarbeidsradet-sunnhordland': 'Samarbeidsradet for Sunnhordland',
    'frydeno-sabb-motor': 'Frydenbo Sabb Motor',
    'bjarne-johnsen': 'Bjarne Johnsen',
    'forinnova': 'Forinnova',
    'havstad-tinn': 'Havstad Tinn',
    'mecmar': 'Mecmar',
    'metasystems': 'MetaSystems',
    'nera-networks': 'Nera Networks',
    'bygge-kompaniet': 'Bygge Kompaniet',
    'byggservice': 'Byggservice',
    'energi-teknikk': 'Energi Teknikk',
    'fitjar-mekaniske': 'Fitjar Mekaniske Verksted',
    'hmr-elektro': 'HMR Elektro',
    'kvinnherad-elektro': 'Kvinnherad Elektro',
    'risnes-sonner': 'Risnes & Sonner',
    'smv': 'SMV',
    'trucknor': 'Trucknor',
    'boardbrain': 'Boardbrain',
    'sirius-act': 'Sirius ACT'
  };

  function initLogoAlt() {
    var loga = document.querySelectorAll(
      '.marquee__track img, .logo-slot img,' +      /* home, kursy */
      '.akb-mq__group img, .akb-slot img,' +        /* /about */
      '.akc-mq__group img, .akc-slot img'           /* /consulting */
    );
    if (!loga.length) return;
    for (var i = 0; i < loga.length; i++) {
      var img = loga[i];
      if ((img.getAttribute('alt') || '').trim()) continue;
      var src = (img.currentSrc || img.src || '');
      var plik = src.split('/').pop().replace(/\.(png|svg|jpe?g|webp)$/i, '').toLowerCase();
      var nazwa = LOGO_ALT[plik];
      if (!nazwa) {
        /* z nazwy pliku: "bygge-kompaniet" -> "Bygge Kompaniet" */
        nazwa = plik.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      }
      img.setAttribute('alt', nazwa + ' logo');
    }
  }


  /* --- alt dla pozostalych obrazow ------------------------------
     Widgety Image w systeme nie maja atrybutu alt. Mapujemy po nazwie
     pliku, bo ten sam obraz wraca na kilku stronach pod roznymi id
     (avatary opinii sa i na home, i na /academy).
     Docelowo do wpisania w panelu systeme, przy kazdym obrazie
     osobno — dopoki tego nie ma, opisy ida stad. ---------------- */
  var IMG_ALT = {
    'C45D5D7C-DED7-4089-8039-040BB51F1FC7': 'Greta N., interior designer',
    '564532217_10161734967827681': 'Ingunn E., baker',
    '1772914831569': 'Preethy M. J., Norstellar',
    '432136413_1867835113645540': 'Elise U. L., Norstellar',
    '1681044482483': 'Kacper K., freelance graphic designer',
    'augustlogowhite': 'August Kjerland',
    '3L3A3140': 'August Kjerland teaching a cross-cultural communication session',
    '3L3A3811': 'August Kjerland during a workshop',
    '3L3A3308': 'August Kjerland presenting the pitching webinar',
    'TheCross-CulturalNegotiationPlaybook': 'Cover of The Cross-Cultural Negotiation Playbook',
    'presentation-room-podium': 'A presentation room with a podium',
    'klarna': 'Klarna'
  };

  function initImageAlt() {
    var przejscie = function () {
      var brakuje = 0;
      var obrazy = document.querySelectorAll('img');
      for (var i = 0; i < obrazy.length; i++) {
        var img = obrazy[i];
        if ((img.getAttribute('alt') || '').trim()) continue;
        var src = (img.currentSrc || img.src || '');
        if (!src) { brakuje++; continue; }          /* jeszcze sie nie zaladowal */
        var trafiony = false;
        for (var klucz in IMG_ALT) {
          if (src.indexOf(klucz) > -1) { img.setAttribute('alt', IMG_ALT[klucz]); trafiony = true; break; }
        }
        if (!trafiony) brakuje++;
      }
      return brakuje;
    };
    /* Czesc obrazow systeme pojawia sie w DOM dopiero po chwili.
       NIE wolno konczyc, gdy akurat nie ma nic do zrobienia — obraz
       moze sie jeszcze nie wyrenderowac. Chodzimy przez pelne 10 s. */
    przejscie();
    var prob = 0;
    var timer = setInterval(function () {
      przejscie();
      if (++prob > 50) clearInterval(timer);   /* 50 x 200 ms = 10 s */
    }, 200);
  }

  /* --- Boot ---------------------------------------------- */
  function init() {
    applyHomeClass();
    initCardReveal();
    initReveal();
    initHeaderScroll();
    initFunnelNav();
    initLatestWriting();
    initBlogHeading();
    initLogoAlt();
    initImageAlt();
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

/* ============================================================================
   SYSTEM PRZYCISKOW — nadawanie wariantu (2026-08-28)
   ----------------------------------------------------------------------------
   Specyfikacja i uzasadnienie: "August Kjerland Design System/buttons.html",
   reguly: blok "SYSTEM PRZYCISKOW" w homepage-live.css i sales-page.css.

   systeme nie daje przyciskom klas. Tlo trzyma w styled-components
   (`sc-dUYLmI epEwHm`), a te nazwy zmieniaja sie przy kazdym rebuildzie
   platformy — nie da sie na nich oprzec. Zostaje ID, ale ono ginie, gdy ktos
   skasuje i doda blok w edytorze; wczesniejsza wersja CSS miala z tego powodu
   wpisana na sztywno liste 18 ID-kow tylko po to, zeby ustawic kolor tekstu.

   Ten skrypt patrzy na to, co widac: wyliczone tlo przycisku i jasnosc tla pod
   nim. Na tej podstawie doklada `.akb--forest|terra|ghost|ghost-light`, a w
   pasku nawigacji rowniez `.akb--sm`. Nowy przycisk dodany w edytorze zalapie
   wariant sam.
   ============================================================================ */
(function () {
  /* Celujemy najpierw w prefiksy ID (systeme), potem w recznie budowane
     przyciski w blokach Raw HTML (.ak-btn na /academy, .pdk-btn na
     /pitching-decoded). Na koncu heurystyka lapie te, ktore nie maja ani
     ID, ani wlasnej klasy — jak "Apply" na checkoucie, ktory ma wylacznie
     nazwy styled-components. */
  var SEL = '[id^="button-"],[id^="loginbutton-"],[id^="submit-button-"],'
          + '[id^="payment-button-"],.ak-btn,.pdk-btn';

  function rgb(c) {
    var m = (c || '').match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
  }
  function przezroczyste(c) {
    var v = rgb(c);
    return !v || v.a < 0.05;
  }
  /* luminancja wg WCAG — decyduje, czy ghost stoi na ciemnym czy na jasnym */
  function lum(c) {
    var v = rgb(c); if (!v) return 1;
    var f = function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(v.r) + 0.7152 * f(v.g) + 0.0722 * f(v.b);
  }
  /* pierwsze nieprzezroczyste tlo w gore drzewa */
  function tloPod(el) {
    var p = el.parentElement;
    while (p) {
      var c = getComputedStyle(p).backgroundColor;
      if (!przezroczyste(c)) return c;
      p = p.parentElement;
    }
    return 'rgb(249, 247, 241)';   /* domyslnie Cream */
  }
  function wNawigacji(el) {
    if (el.closest('header')) return true;
    var row = el.closest('[id^="row-"]');
    return !!(row && row.querySelector('[id^="menu-"]'));
  }

  /* wyglada jak przycisk: <a>/<button> o rozmiarze przycisku, z tlem albo
     ramka, z krotka etykieta i bez zagniezdzonego naglowka (to odsiewa
     karty-linki, ktore tez maja tlo) */
  function wygladaJakPrzycisk(e) {
    var r = e.getBoundingClientRect();
    if (r.height < 24 || r.height > 80 || r.width < 50 || r.width > 560) return false;
    var t = (e.textContent || '').trim();
    if (!t || t.length > 60) return false;
    if (e.querySelector('h1,h2,h3,h4,img,picture')) return false;
    var s2 = getComputedStyle(e);
    var maTlo = !przezroczyste(s2.backgroundColor);
    var maRamke = parseFloat(s2.borderTopWidth) > 0 && s2.borderTopStyle !== 'none'
                  && !przezroczyste(s2.borderTopColor);
    return maTlo || maRamke;
  }

  function kandydaci() {
    var out = [], widziane = [];
    var dodaj = function (e) { if (widziane.indexOf(e) === -1) { widziane.push(e); out.push(e); } };
    var a = document.querySelectorAll(SEL);
    for (var i = 0; i < a.length; i++) dodaj(a[i]);
    var b = document.querySelectorAll('a,button,input[type="submit"]');
    for (var j = 0; j < b.length; j++) if (wygladaJakPrzycisk(b[j])) dodaj(b[j]);
    return out;
  }

  function oznacz() {
    var lista = kandydaci();
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i];
      if (e.getAttribute('data-akb')) continue;

      var bg = getComputedStyle(e).backgroundColor;
      var wariant;

      if (przezroczyste(bg)) {
        /* ghost — o wariancie decyduje tlo pod przyciskiem, nie sam przycisk */
        wariant = lum(tloPod(e)) < 0.35 ? 'ghost-light' : 'ghost';
      } else {
        /* wypelniony — terakota ma przewage czerwieni, Forest zieleni */
        var v = rgb(bg);
        wariant = (v && v.r > v.g) ? 'terra' : 'forest';
      }

      e.classList.add('akb', 'akb--' + wariant);
      /* maly: pasek nawigacji oraz przyciski, ktore juz sa niskie i pelnia
         role elementu interfejsu, nie wezwania — np. "Apply" przy kuponie */
      if (wNawigacji(e) || e.getBoundingClientRect().height < 40) {
        e.classList.add('akb--sm');
      }
      e.setAttribute('data-akb', wariant);
    }
  }

  function start() {
    oznacz();
    /* systeme dorenderowuje sekcje (lejki, checkout) po pierwszym paincie */
    if (window.MutationObserver && document.body) {
      var mo = new MutationObserver(oznacz);
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 10000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
