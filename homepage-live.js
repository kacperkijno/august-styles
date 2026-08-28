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
  function gcs(el) {
    var d = el.ownerDocument, w = (d && d.defaultView) || window;
    return w.getComputedStyle(el);
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
      var c = gcs(p).backgroundColor;
      if (!przezroczyste(c)) return c;
      p = p.parentElement;
    }
    return 'rgb(249, 247, 241)';   /* domyslnie Cream */
  }
  /* Reczne bloki Raw HTML deklaruja wariant wprost: .pdk-btn--ghost na
     /pitching-decoded, .ak-btn--forest i .ak-btn--terracotta na /academy.
     Ta deklaracja jest wiazaca — na stronie ksiazki regula .pdk-btn maluje
     WSZYSTKIE przyciski terakota, wiec zgadywanie z wyliczonego tla
     zrobiloby z ghosta akcent i oba CTA w hero wygladalyby identycznie. */
  function zadeklarowany(el) {
    var c = ' ' + (el.className || '') + ' ';
    if (/--ghost/.test(c))       return ciemnoPod(el) ? 'ghost-light' : 'ghost';
    if (/--terracotta/.test(c))  return 'terra';
    if (/--forest/.test(c))      return 'forest';
    return null;
  }
  function ciemnoPod(el) { return lum(tloPod(el)) < 0.35; }

  /* Pasek nawigacji, a nie dowolny <header>. Sekcje hero na /about,
     /consulting i /pitching-decoded to <header class="akb-hero|akc-hero|
     pdk-hero"> — semantyczny naglowek sekcji, nie nawigacja. Samo
     closest('header') robilo z tamtejszych CTA male przyciski.
     Pasek poznajemy po tym, ze zawiera menu. */
  function wNawigacji(el) {
    var h = el.closest('header');
    if (h && (h.getAttribute('type') === 'WebsiteHeader' || h.querySelector('[id^="menu-"]'))) return true;
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
    var s2 = gcs(e);
    var maTlo = !przezroczyste(s2.backgroundColor);
    var maRamke = parseFloat(s2.borderTopWidth) > 0 && s2.borderTopStyle !== 'none'
                  && !przezroczyste(s2.borderTopColor);
    return maTlo || maRamke;
  }

  function kandydaci(root) {
    var out = [], widziane = [];
    var dodaj = function (e) { if (widziane.indexOf(e) === -1) { widziane.push(e); out.push(e); } };
    var a = root.querySelectorAll(SEL);
    for (var i = 0; i < a.length; i++) dodaj(a[i]);
    var b = root.querySelectorAll('a,button,input[type="submit"]');
    for (var j = 0; j < b.length; j++) if (wygladaJakPrzycisk(b[j])) dodaj(b[j]);
    return out;
  }

  var WARIANTY = ['akb--forest', 'akb--terra', 'akb--ghost', 'akb--ghost-light'];

  /* Wariant liczymy przy CHWILOWO ZDJETYCH wlasnych klasach. Inaczej przy
     drugim przebiegu odczytalibysmy kolor, ktory sami przed chwila nalozylismy,
     i pierwszy — czesto bledny — strzal utrwalilby sie na zawsze.
     Tak bylo z "Log in": przy pierwszym pomiarze, zanim arkusz ulozyl pasek,
     przycisk mial tlo terakotowe i dostawal .akb--terra. Widac to bylo jako
     migniecie terakota przed ustabilizowaniem sie strony. */
  function wariantDla(e) {
    var zdjete = [];
    for (var i = 0; i < WARIANTY.length; i++) {
      if (e.classList.contains(WARIANTY[i])) { zdjete.push(WARIANTY[i]); e.classList.remove(WARIANTY[i]); }
    }
    var w = zadeklarowany(e);
    if (!w) {
      var bg = gcs(e).backgroundColor;
      if (przezroczyste(bg)) {
        w = ciemnoPod(e) ? 'ghost-light' : 'ghost';
      } else {
        var v = rgb(bg);                       /* terakota ma przewage czerwieni */
        w = (v && v.r > v.g) ? 'terra' : 'forest';
      }
    }
    for (var j = 0; j < zdjete.length; j++) e.classList.add(zdjete[j]);
    return w;
  }

  function oznacz(root) {
    root = root || document;
    var lista = kandydaci(root);
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i];

      var wariant = wariantDla(e);
      var poprzedni = e.getAttribute('data-akb');
      if (poprzedni && poprzedni !== wariant) e.classList.remove('akb--' + poprzedni);
      e.classList.add('akb', 'akb--' + wariant);
      /* maly rozmiar wylacznie w pasku nawigacji. Wczesniej bylo tu takze
         "albo przycisk jest nizszy niz 40px" — i to zmniejszalo przyciski
         w hero /pitching-decoded, ktore w chwili pomiaru nie mialy jeszcze
         docelowej wysokosci. Wysokosc nie moze decydowac o wariancie,
         skoro to wariant ustala wysokosc. */
      if (wNawigacji(e)) e.classList.add('akb--sm');
      else e.classList.remove('akb--sm');
      e.setAttribute('data-akb', wariant);
    }
  }

  /* Formularze systeme (newsletter w stopce, formularz kontaktowy) siedza
     w <iframe>. Ramka ma wlasny dokument, wiec nasz arkusz do niej nie
     dociera — przyciski w srodku zostawaly poza systemem: "Send message"
     mial 52px, font 18 i jasna terakote, i nie reagowal na hover.
     Ramki sa same-origin, wiec doklejamy im ten sam arkusz i klasyfikujemy
     ich przyciski tak samo jak na stronie. */
  var ARKUSZ = 'https://kacperkijno.github.io/august-styles/homepage-live.css';

  function ramki() {
    var lista = document.querySelectorAll('iframe');
    for (var i = 0; i < lista.length; i++) {
      (function (f) {
        var doc;
        try { doc = f.contentDocument; } catch (e) { return; }   /* cross-origin */
        if (!doc || !doc.head) return;
        if (!doc.getElementById('ak-buttons')) {
          var l = doc.createElement('link');
          l.id = 'ak-buttons'; l.rel = 'stylesheet'; l.href = ARKUSZ;
          doc.head.appendChild(l);
        }
        oznacz(doc);
        if (!f.getAttribute('data-ak-hook')) {
          f.setAttribute('data-ak-hook', '1');
          f.addEventListener('load', function () { setTimeout(function () { ramki(); }, 60); });
        }
      })(lista[i]);
    }
  }

  function przebieg() { oznacz(); ramki(); }

  function start() {
    przebieg();
    /* styled-components i arkusze systeme ustawiaja sie po pierwszym paincie,
       wiec przeliczamy jeszcze raz, gdy kolory sa juz finalne */
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () { przebieg(); setTimeout(przebieg, 250); });
    }
    setTimeout(przebieg, 600);
    setTimeout(przebieg, 1600);
    setTimeout(przebieg, 3500);
    /* systeme dorenderowuje sekcje (lejki, checkout) po pierwszym paincie */
    if (window.MutationObserver && document.body) {
      var mo = new MutationObserver(function () { oznacz(); ramki(); });
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

/* ============================================================================
   SYSTEM TYPOGRAFICZNY — nadawanie stopni (2026-08-28)
   ----------------------------------------------------------------------------
   Specyfikacja: "August Kjerland Design System/typography.html".
   Reguly: blok "SYSTEM TYPOGRAFICZNY" w homepage-live.css i sales-page.css.

   Po co JS: systeme wpisuje wlasne nazwy krojow w kontenery `text-*`,
   `headline-*` i `bulletlist-*`, a w `text-*` sa ZAROWNO naglowki (Caslon),
   jak i tekst (Haas). Z samego CSS nie da sie ich odroznic — nie ma selektora
   "element, ktory ma teraz Caslona". Skrypt czyta wyliczony styl i dokleja
   klase stopnia; wartosci siedza w CSS, nie tutaj.

   Czego NIE rusza: przyciskow (maja wlasny system, klasa .akb), paska
   nawigacji, oraz elementow, ktorych rozmiar odbiega od skali o wiecej niz
   4px — to zwykle liczby i znaki firmowe, nie tekst.
   ============================================================================ */
(function () {
  var SERIF = [112, 88, 54, 40, 36, 30, 24, 21];
  var SANS  = [20, 15, 14, 12];
  var TOL   = 4;   /* dalej niz 4px od skali = zostawiamy w spokoju */

  function gcs(el) {
    var d = el.ownerDocument, w = (d && d.defaultView) || window;
    return w.getComputedStyle(el);
  }
  function najblizszy(v, skala) {
    var best = null, dist = 1e9;
    for (var i = 0; i < skala.length; i++) {
      var d = Math.abs(skala[i] - v);
      if (d < dist) { dist = d; best = skala[i]; }
    }
    return dist <= TOL ? best : null;
  }
  function pomijamy(e) {
    if (e.closest('.akb, [id^="button-"], [id^="loginbutton-"], [id^="submit-button-"], [id^="payment-button-"]')) return true;
    if (e.closest('header[type="WebsiteHeader"]')) return true;
    var row = e.closest('[id^="row-"]');
    if (row && row.querySelector('[id^="menu-"]')) return true;
    return false;
  }
  function widoczny(e) {
    var r = e.getBoundingClientRect();
    return r.width >= 16 && r.height >= 6;
  }

  function stopnie() {
    var el = document.querySelectorAll('p,span,li,div,a,em,strong,b,i,h1,h2,h3,h4,h5,h6,td,th,label,figcaption,small');
    for (var i = 0; i < el.length; i++) {
      var e = el[i];
      if (e.children.length) continue;                 /* tylko liscie tekstowe */
      if (!(e.textContent || '').trim()) continue;
      if (e.getAttribute('data-akt')) continue;
      if (pomijamy(e) || !widoczny(e)) continue;

      var s = gcs(e);
      var serif = /caslon/i.test(s.fontFamily);
      var fs = parseFloat(s.fontSize);
      var fw = parseInt(s.fontWeight, 10) || 400;
      var ls = parseFloat(s.letterSpacing) || 0;
      var caps = s.textTransform === 'uppercase';
      var klasy = ['akt', serif ? 'akt-serif' : 'akt-sans'];

      /* eyebrow rozpoznajemy po ksztalcie, nie po miejscu: wersaliki,
         maly stopien i rozstrzelone swiatlo */
      var eyebrow = !serif && caps && fs <= 17 && ls > 1;

      if (eyebrow) {
        klasy.push('akt-eyebrow');
      } else {
        var cel = najblizszy(fs, serif ? SERIF : SANS);
        if (cel) klasy.push((serif ? 'akt-h' : 'akt-t') + cel);
        klasy.push(fw >= 500 ? 'akt-w500' : 'akt-w400');
      }

      /* kolory — tylko scalanie bliskich wariantow tego samego zamiaru */
      var c = (s.color || '').replace(/\s/g, '');
      if (/^rgba?\(45,45,45,0?\.7\d*\)$/.test(c) || c === 'rgb(90,90,90)') klasy.push('akt-ink72');
      else if (/^rgba\(45,45,45,0?\.[45]\d*\)$/.test(c)) klasy.push('akt-ink62');

      e.classList.add.apply(e.classList, klasy);
      e.setAttribute('data-akt', '1');
    }
  }

  function listy() {
    var ul = document.querySelectorAll('ul,ol');
    for (var i = 0; i < ul.length; i++) {
      var l = ul[i];
      if (l.getAttribute('data-akt-list')) continue;
      if (pomijamy(l)) continue;
      var li = l.querySelector('li');
      if (!li || !(li.textContent || '').trim()) continue;
      /* lista numerowana 01-05 na / ma wlasny licznik — nie dotykamy */
      if (l.closest('#section-22d30859')) continue;

      var typ = 'dot';
      if (l.tagName === 'OL') typ = 'num';
      else if (l.querySelector('i.fa-check, svg')) typ = 'check';

      l.classList.add('akt-list', 'akt-list--' + typ);
      /* jasnosc tla decyduje o kolorze pozycji */
      var p = l.parentElement, bg = null;
      while (p && !bg) {
        var b = gcs(p).backgroundColor;
        if (b && b !== 'rgba(0, 0, 0, 0)' && !/,\s*0\)$/.test(b)) bg = b;
        p = p.parentElement;
      }
      if (bg) {
        var m = bg.match(/[\d.]+/g);
        if (m) {
          var f = function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
          var lum = 0.2126 * f(+m[0]) + 0.7152 * f(+m[1]) + 0.0722 * f(+m[2]);
          if (lum < 0.35) l.classList.add('akt-list--dark');
        }
      }
      l.setAttribute('data-akt-list', typ);
    }
  }

  function przebieg() { try { stopnie(); listy(); } catch (e) {} }

  function start() {
    przebieg();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () { setTimeout(przebieg, 200); });
    }
    setTimeout(przebieg, 900);
    setTimeout(przebieg, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ============================================================================
   SYSTEM FORMULARZY — nadawanie wariantu (2026-08-28)
   ----------------------------------------------------------------------------
   Specyfikacja: "August Kjerland Design System/forms.html".
   Reguly: blok "SYSTEM FORMULARZY" w homepage-live.css i sales-page.css.

   O wariancie decyduje jasnosc tla POD polem, a tego nie da sie sprawdzic
   selektorem CSS — stad JS. Obejmuje takze pola w ramkach systeme
   (newsletter w stopce, formularz kontaktowy), bo tam siedzi polowa
   wszystkich pol w serwisie.

   Czego NIE rusza: pol Stripe. Numer karty, data i CVC renderuja sie w ramce
   z js.stripe.com — inna domena, nasz CSS tam nie siega i nie powinien.
   ============================================================================ */
(function () {
  var SEL = 'input[type="text"],input[type="email"],input[type="tel"],input[type="number"],'
          + 'input[type="search"],input:not([type]),textarea,select,[id^="field-"]';

  function gcs(el) {
    var d = el.ownerDocument, w = (d && d.defaultView) || window;
    return w.getComputedStyle(el);
  }
  function lum(c) {
    var m = (c || '').match(/[\d.]+/g); if (!m) return 1;
    var f = function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(+m[0]) + 0.7152 * f(+m[1]) + 0.0722 * f(+m[2]);
  }
  function tloWokol(start) {
    var p = start;
    while (p) {
      var c = gcs(p).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)' && !/,\s*0\)$/.test(c)) return c;
      p = p.parentElement;
    }
    return null;
  }
  /* Pole w ramce systeme ma nad soba wylacznie przezroczyste tla — o tym,
     czy jest na ciemnym, decyduje to, co lezy pod SAMA RAMKA w dokumencie
     nadrzednym. Bez tego newsletter w ciemnej stopce dostawal jasny wariant. */
  function ciemnoPod(el) {
    var c = tloWokol(el.parentElement);
    if (!c) {
      var d = el.ownerDocument, w = d && d.defaultView;
      var ramka = w && w.frameElement;
      if (ramka) { try { c = tloWokol(ramka.parentElement); } catch (e) {} }
    }
    return c ? lum(c) < 0.35 : false;
  }

  function oznacz(root) {
    var l = root.querySelectorAll(SEL);
    for (var i = 0; i < l.length; i++) {
      var e = l[i];
      var t = (e.getAttribute('type') || '').toLowerCase();
      if (t === 'hidden' || t === 'checkbox' || t === 'radio' || t === 'submit' || t === 'button') continue;
      if (e.getBoundingClientRect().height < 10) continue;
      var ciemno = ciemnoPod(e);
      var chce = ciemno ? 'akf-dark' : 'akf-light';
      if (e.getAttribute('data-akf') === chce) continue;
      e.classList.remove('akf-dark', 'akf-light');
      e.classList.add('akf', chce);
      e.setAttribute('data-akf', chce);

      /* Pola newslettera w ramce systeme trzymaja `height:54px` z arkusza,
         ktorego nie da sie odczytac ani przebic selektorem — nawet regula
         z !important przegrywa, bo tamta ma ID. Inline z priorytetem
         "important" jest jedynym, co nad tym wygrywa. Robimy to tylko dla
         pol jednolinijkowych, ktore faktycznie odstaja: textarea i pole
         wiadomosci maja zostac wysokie — stad gorna granica 80px. Pole
         "Message" na /contact to <input>, nie <textarea>, wiec sam tag by
         go nie ochronil: przy pierwszym podejsciu inline sciagnal je
         ze 122px na 49px. */
      var wys = e.getBoundingClientRect().height;
      if (e.tagName !== 'TEXTAREA' && wys > 50 && wys < 80) {
        try {
          e.style.setProperty('height', 'auto', 'important');
          e.style.setProperty('min-height', '48px', 'important');
        } catch (err) {}
      }
    }
  }

  function ramki() {
    var l = document.querySelectorAll('iframe');
    for (var i = 0; i < l.length; i++) {
      try {
        var d = l[i].contentDocument;
        if (d && d.body) oznacz(d);
      } catch (e) { /* cross-origin, np. Stripe */ }
    }
  }

  function przebieg() { try { oznacz(document); ramki(); } catch (e) {} }

  /* Czesc formularzy w lejkach wstawia sie na strone dopiero po zaladowaniu —
     kilka setTimeout by ich nie zlapalo. Obserwujemy wiec drzewo i reagujemy
     na dodane wezly, z krotkim zdlawieniem, zeby nie liczyc przy kazdej
     najmniejszej zmianie. Obserwator zostaje na cale zycie strony:
     formularz moze pojawic sie tez po interakcji (krok lejka, popup). */
  var czeka = null;
  function zaplanuj() {
    if (czeka) return;
    czeka = setTimeout(function () { czeka = null; przebieg(); }, 150);
  }

  function pilnuj(doc) {
    if (!doc || !doc.body || doc.__akfObs) return;
    try {
      var mo = new MutationObserver(function (zm) {
        for (var i = 0; i < zm.length; i++) {
          if (zm[i].addedNodes && zm[i].addedNodes.length) { zaplanuj(); return; }
        }
      });
      mo.observe(doc.body, { childList: true, subtree: true });
      doc.__akfObs = 1;
    } catch (e) {}
  }

  function pilnujRamek() {
    var l = document.querySelectorAll('iframe');
    for (var i = 0; i < l.length; i++) {
      (function (f) {
        try { if (f.contentDocument) pilnuj(f.contentDocument); } catch (e) {}
        if (!f.getAttribute('data-akf-hook')) {
          f.setAttribute('data-akf-hook', '1');
          f.addEventListener('load', function () {
            setTimeout(function () { przebieg(); pilnujRamek(); }, 80);
          });
        }
      })(l[i]);
    }
  }

  function start() {
    przebieg();
    pilnuj(document);
    pilnujRamek();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () { setTimeout(function () { przebieg(); pilnujRamek(); }, 200); });
    }
    setTimeout(function () { przebieg(); pilnujRamek(); }, 900);
    setTimeout(function () { przebieg(); pilnujRamek(); }, 2600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
