/* ═══════════════════════════════
   Dr. Fixit Mobile — Shared JS
   ═══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Active nav link ──
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('active');
  });

  // ── Mobile hamburger ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);

  function openMenu()  { mobileMenu?.classList.add('open');    overlay.classList.add('active'); }
  function closeMenu() { mobileMenu?.classList.remove('open'); overlay.classList.remove('active'); }

  hamburger?.addEventListener('click', () =>
    mobileMenu?.classList.contains('open') ? closeMenu() : openMenu()
  );
  overlay.addEventListener('click', closeMenu);
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // ── Scroll reveal (single + directional + stagger) ──
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger')
    .forEach(el => revealObs.observe(el));

  // ── Count-up animation for stat numbers ──
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const el = e.target;
      const raw = el.textContent.trim();
      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      const suffix = raw.replace(/[0-9.,]/g, '');
      if (isNaN(num) || num === 0) return;
      const duration = 1800;
      const start = performance.now();
      const isFloat = raw.includes('.');
      requestAnimationFrame(function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = num * ease;
        el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString()) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      });
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num').forEach(el => countObs.observe(el));

  // ── Ripple effect on buttons ──
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top  - size / 2;
      const circle = document.createElement('span');
      circle.className = 'ripple-circle';
      Object.assign(circle.style, {
        width: size + 'px', height: size + 'px',
        left: x + 'px', top: y + 'px'
      });
      this.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  });

  // ── Nav shadow on scroll ──
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── Smooth card tilt on hover (desktop only) ──
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.srv-card, .loc-card, .why-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `translateY(-5px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
        card.style.transition = 'transform .1s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform .4s ease, box-shadow .3s ease, border-color .3s ease';
      });
    });
  }

  // ── Ripple on all primary/cta buttons ──
  document.querySelectorAll('.btn-primary, .btn-cta').forEach(btn => {
    if (!btn.classList.contains('ripple')) btn.classList.add('ripple');
  });

  // ── Parallax blobs on mouse move (home only) ──
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length) {
    document.addEventListener('mousemove', e => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 18;
      const cy = (e.clientY / window.innerHeight - 0.5) * 18;
      blobs.forEach((b, i) => {
        const factor = (i + 1) * 0.4;
        b.style.transform = `translate(${cx * factor}px, ${cy * factor}px)`;
      });
    }, { passive: true });
  }

});
