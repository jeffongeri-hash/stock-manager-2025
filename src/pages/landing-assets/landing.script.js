(function() {
  // --- Promo video: autoplay, loading state, and replay fallback ---
  var pv = document.getElementById('promo-video');
  var pvFrame = pv && pv.closest('.promo-video-frame');
  var pvReplay = document.getElementById('promo-video-replay');
  if (pv && pvFrame) {
    var setState = function(s) { pvFrame.setAttribute('data-state', s); };
    pv.muted = true;
    pv.defaultMuted = true;
    pv.setAttribute('muted', '');
    pv.setAttribute('playsinline', '');

    var hideLoader = function() {
      if (pvFrame.getAttribute('data-state') === 'loading') setState('ready');
    };
    var showNeedsPlay = function() { setState('needs-play'); };

    var tryPlay = function() {
      pv.muted = true;
      var p = pv.play();
      if (p && typeof p.then === 'function') {
        p.then(function() { setState('playing'); })
         .catch(function() { showNeedsPlay(); });
      }
    };

    pv.addEventListener('loadeddata', hideLoader);
    pv.addEventListener('canplay', function() { hideLoader(); tryPlay(); });
    pv.addEventListener('playing', function() { setState('playing'); });
    pv.addEventListener('waiting', function() {
      if (pvFrame.getAttribute('data-state') !== 'needs-play') setState('loading');
    });
    pv.addEventListener('stalled', function() {
      if (pvFrame.getAttribute('data-state') !== 'needs-play') setState('loading');
    });
    pv.addEventListener('error', function() { setState('error'); });

    // Safety timeout — if nothing has loaded after 8s, surface the replay button
    setTimeout(function() {
      if (pv.readyState < 2 && pvFrame.getAttribute('data-state') === 'loading') {
        showNeedsPlay();
      }
    }, 8000);

    tryPlay();
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && pv.paused) tryPlay();
    });
    ['touchstart','click','scroll'].forEach(function(ev) {
      window.addEventListener(ev, tryPlay, { once: true, passive: true });
    });

    if (pvReplay) {
      pvReplay.addEventListener('click', function(e) {
        e.preventDefault();
        pv.muted = true;
        pv.currentTime = 0;
        setState('loading');
        var p = pv.play();
        if (p && typeof p.then === 'function') {
          p.then(function() { setState('playing'); })
           .catch(function() { showNeedsPlay(); });
        }
      });
    }
  }


  // --- Hero stat counters ---
  function animateNum(el, target, suffix, prefix) {
    if (!el) return;
    suffix = suffix || ''; prefix = prefix || '';
    var start = 0, dur = 1400, t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.floor(start + (target - start) * eased);
      el.textContent = prefix + v + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  animateNum(document.getElementById('stat-tools'), 18, '+');
  animateNum(document.getElementById('stat-calcs'), 60, '+');
  animateNum(document.getElementById('stat-charts'), 40, '+');
  var freeEl = document.getElementById('stat-free');
  if (freeEl) freeEl.textContent = '$0';

  // --- Scroll reveal ---
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
  }

  // --- Navigation wiring (dispatches custom event handled by React) ---
  function go(path) {
    window.dispatchEvent(new CustomEvent('lovable-navigate', { detail: path }));
  }
  function bind(selector, path) {
    document.querySelectorAll(selector).forEach(function(el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(ev) {
        ev.preventDefault();
        go(path);
      });
    });
  }

  // Nav buttons
  var btns = document.querySelectorAll('.nav-right .btn-nav');
  if (btns[0]) btns[0].addEventListener('click', function() { go('/auth'); });
  if (btns[1]) btns[1].addEventListener('click', function() { go('/portfolio'); });

  // Hero primary -> /portfolio (override scroll behavior on click)
  var heroPrimary = document.querySelector('.btn-hero-primary');
  if (heroPrimary) heroPrimary.addEventListener('click', function(ev) {
    // keep smooth scroll behavior — do nothing extra
  }, { capture: false });

  // Tool cards
  var routes = [
    '/fire-guide',
    '/retirement-planning',
    '/dividend-tracker',
    '/trading-toolkit',
    '/real-estate',
    '/car-finance'
  ];
  document.querySelectorAll('.tools-grid .tool-card').forEach(function(card, i) {
    var path = routes[i];
    if (!path) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() { go(path); });
  });

  // Pro demo cards
  var proRoutes = [
    '/ai-trade-journal',
    '/premarket-brief',
    '/weekly-fundamental-scan',
    '/fire-planning-suite'
  ];
  document.querySelectorAll('.pro-grid .pro-card').forEach(function(card, i) {
    var path = proRoutes[i];
    if (!path) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() { go(path); });
  });
})();
