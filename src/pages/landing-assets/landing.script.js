(function() {
  // --- Force autoplay on promo video (mobile + desktop) ---
  var pv = document.getElementById('promo-video');
  if (pv) {
    pv.muted = true;
    pv.defaultMuted = true;
    pv.setAttribute('muted', '');
    pv.setAttribute('playsinline', '');
    var tryPlay = function() {
      var p = pv.play();
      if (p && typeof p.catch === 'function') p.catch(function(){});
    };
    tryPlay();
    pv.addEventListener('loadedmetadata', tryPlay);
    pv.addEventListener('canplay', tryPlay);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) tryPlay();
    });
    ['touchstart','click','scroll'].forEach(function(ev) {
      window.addEventListener(ev, tryPlay, { once: true, passive: true });
    });
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
})();
