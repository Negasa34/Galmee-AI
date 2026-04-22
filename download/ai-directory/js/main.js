/**
 * AI Directory — main.js
 * Core utilities: navbar scroll, mobile menu, search overlay, scroll animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initSearchOverlay();
  initScrollAnimations();
  initSmoothScroll();
  initCardGlow();
});

/* ──────────────────────────────────────────
   Navbar — background on scroll
   ────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load
}

/* ──────────────────────────────────────────
   Mobile Menu Toggle
   ────────────────────────────────────────── */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');
  if (!toggle || !menu) return;

  let isOpen = false;

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    menu.classList.toggle('hidden', !isOpen);
    iconOpen.classList.toggle('hidden', isOpen);
    iconClose.classList.toggle('hidden', !isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      isOpen = false;
      menu.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ──────────────────────────────────────────
   Search Overlay
   ────────────────────────────────────────── */
function initSearchOverlay() {
  const toggleBtn = document.getElementById('search-toggle');
  const overlay = document.getElementById('search-overlay');
  const backdrop = document.getElementById('search-backdrop');
  const searchInput = document.getElementById('search-input');
  if (!overlay || !toggleBtn) return;

  const openSearch = () => {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput?.focus(), 100);
  };

  const closeSearch = () => {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
  };

  toggleBtn.addEventListener('click', openSearch);
  backdrop?.addEventListener('click', closeSearch);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('hidden') ? openSearch() : closeSearch();
    }
    // ESC to close
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeSearch();
    }
  });
}

/* ──────────────────────────────────────────
   Scroll-triggered Animations (Intersection Observer)
   ────────────────────────────────────────── */
function initScrollAnimations() {
  const animatedEls = document.querySelectorAll('[data-animate]');

  if (!animatedEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animatedEls.forEach((el) => observer.observe(el));
}

/* ──────────────────────────────────────────
   Card Mouse Glow Effect
   ────────────────────────────────────────── */
function initCardGlow() {
  const selectors = '.tool-card, .hf-model-card';
  const cards = document.querySelectorAll(selectors);
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
}

/* ──────────────────────────────────────────
   Smooth Scroll for anchor links
   ────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}
