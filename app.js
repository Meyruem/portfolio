/* ══════════════════════════════════════════════════════════════════════════
   PORTFOLIO — app.js  ·  thème, hero 3D, révélations au scroll, micro-mouvements
   Vanilla JS, sans dépendance. Respecte prefers-reduced-motion et le tactile.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root   = document.documentElement;

  /* ── THÈME ───────────────────────────────────────────────────────────── */
  function currentTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function propagateTheme() {
    var t = currentTheme();
    var as = document.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      var href = a.getAttribute('href');
      if (!href) continue;
      if (href.indexOf('http') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) continue;
      if (href.indexOf('.html') === -1) continue;            // ne touche que les liens internes .html
      var base = href.split('#')[0];
      a.setAttribute('href', base + '#t=' + t);
    }
  }

  function setBtnLabel() {
    var b = document.getElementById('theme-btn');
    if (b) b.textContent = currentTheme() === 'dark' ? 'Clair' : 'Sombre';
  }

  function toggleTheme() {
    var n = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem('theme', n); } catch (e) {}
    setBtnLabel();
    propagateTheme();
  }
  // exposé pour onclick="toggleTheme()"
  window.toggleTheme = toggleTheme;
  window._propagateTheme = propagateTheme;

  /* ── BARRE DE PROGRESSION + CURSEUR ──────────────────────────────────── */
  function injectChrome() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (fine && !reduce) {
      var glow = document.createElement('div');
      glow.className = 'cursor-glow';
      document.body.appendChild(glow);
      var gx = 0, gy = 0, cx = 0, cy = 0, shown = false, raf;
      function loop() {
        cx += (gx - cx) * 0.18; cy += (gy - cy) * 0.18;
        glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
        raf = requestAnimationFrame(loop);
      }
      window.addEventListener('mousemove', function (e) {
        gx = e.clientX; gy = e.clientY;
        if (!shown) { glow.style.opacity = '1'; shown = true; if (!raf) loop(); }
      });
      window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) glow.style.opacity = '0'; });
      // état "hover" sur éléments interactifs
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest('a, button, .poster, .sae-card, .contact-card, .compet-item')) glow.classList.add('is-hover');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest('a, button, .poster, .sae-card, .contact-card, .compet-item')) glow.classList.remove('is-hover');
      });
    }
  }

  /* ── RÉVÉLATIONS AU SCROLL ───────────────────────────────────────────── */
  function setupReveal() {
    // auto-marquage des blocs courants sur les pages internes
    var autoSel = 'main > .card, main > .detail-section, main > .bilan-section, main > .detail-hero,' +
                  'main > .showcase, main > .sae-grid, main > .contact-grid, main > .veille-media,' +
                  'main > .presentation-grid, main > .highlights, main > section, main > .featured,' +
                  'main > .year-header, main > .semester-title, .home-section';
    var autos = document.querySelectorAll(autoSel);
    for (var i = 0; i < autos.length; i++) {
      if (!autos[i].hasAttribute('data-reveal') && !autos[i].hasAttribute('data-stagger')) {
        autos[i].setAttribute('data-reveal', '');
      }
    }

    var targets = document.querySelectorAll('[data-reveal], [data-stagger]');
    if (reduce || !('IntersectionObserver' in window)) {
      for (var j = 0; j < targets.length; j++) targets[j].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    for (var k = 0; k < targets.length; k++) io.observe(targets[k]);
  }

  /* ── HERO 3D : tilt + parallax ───────────────────────────────────────── */
  function setupHero() {
    var hero = document.querySelector('.hero3d');
    if (!hero || reduce) return;
    var stack = hero.querySelector('.hero-photo-stack');
    var layers = hero.querySelectorAll('[data-depth]');
    var rx = 0, ry = 0, tx = 0, ty = 0, raf;

    function render() {
      if (stack) stack.style.transform = 'rotateX(' + ry.toFixed(2) + 'deg) rotateY(' + rx.toFixed(2) + 'deg)';
      for (var i = 0; i < layers.length; i++) {
        var d = parseFloat(layers[i].getAttribute('data-depth')) || 0;
        layers[i].style.transform = 'translate(' + (tx * d).toFixed(1) + 'px,' + (ty * d).toFixed(1) + 'px)';
      }
      raf = null;
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(render); }

    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 → 0.5
        var py = (e.clientY - r.top) / r.height - 0.5;
        rx = px * 14; ry = -py * 12;
        tx = px * 26; ty = py * 26;
        schedule();
      });
      hero.addEventListener('pointerleave', function () { rx = ry = tx = ty = 0; schedule(); });
    }

    // léger parallax au scroll pour les blobs
    var blobs = hero.querySelectorAll('.blob');
    if (blobs.length) {
      window.addEventListener('scroll', function () {
        var y = window.scrollY || 0;
        for (var i = 0; i < blobs.length; i++) {
          blobs[i].style.marginTop = (y * (0.04 + i * 0.02)).toFixed(1) + 'px';
        }
      }, { passive: true });
    }
  }

  /* ── BOUTONS MAGNÉTIQUES ─────────────────────────────────────────────── */
  function setupMagnetic() {
    if (!fine || reduce) return;
    var btns = document.querySelectorAll('.btn, .sec-link, .detail-back');
    btns.forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (mx * 0.18).toFixed(1) + 'px,' + (my * 0.22).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ── ÉCRAN DE CHARGEMENT ─────────────────────────────────────────────── */
  function hideLoader() {
    var ls = document.getElementById('loading-screen');
    if (!ls) return;
    ls.style.opacity = '0';
    setTimeout(function () { ls.style.display = 'none'; }, 500);
  }

  /* ── INIT ────────────────────────────────────────────────────────────── */
  function init() {
    setBtnLabel();
    propagateTheme();
    injectChrome();
    setupReveal();
    setupHero();
    setupMagnetic();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', hideLoader);
})();
