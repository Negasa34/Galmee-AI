/**
 * AI Directory — app.js
 * Application logic: fetch data.json, render card grid, filters, counters, search
 */

/* ── Global State ────────────────────────── */
let allTools = [];
let currentFilter = 'all';

/* ── Bootstrap ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  fetchAndRenderTools();
  initFilterButtons();
  initSearchFunctionality();
  initHuggingFaceModels(); // ← Hugging Face live models
  console.log('🤖 AI Directory loaded successfully!');
});

/* ═══════════════════════════════════════════
   DATA FETCHING & CARD RENDERING
   ═══════════════════════════════════════════ */

async function fetchAndRenderTools() {
  const grid      = document.getElementById('tools-grid');
  const loading   = document.getElementById('tools-loading');
  const empty     = document.getElementById('tools-empty');
  const countWrap = document.getElementById('tools-count');
  const countNum  = document.getElementById('tools-count-number');

  if (!grid) return;

  try {
    const res = await fetch('data/data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allTools = await res.json();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    // Show a friendly inline error instead of breaking
    loading.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-300 mb-2">Unable to load tools</h3>
        <p class="text-gray-500">Make sure this page is served via a local server (e.g. <code class="text-brand-400">npx serve .</code>)</p>
      </div>`;
    return;
  }

  // Hide loading skeleton, show grid
  loading.classList.add('hidden');
  grid.classList.remove('hidden');
  countWrap.classList.remove('hidden');

  renderTools(allTools);
}

function renderTools(tools) {
  const grid     = document.getElementById('tools-grid');
  const empty    = document.getElementById('tools-empty');
  const countNum = document.getElementById('tools-count-number');

  if (!grid) return;

  countNum.textContent = tools.length;

  if (tools.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  empty.classList.add('hidden');

  grid.innerHTML = tools
    .map((tool, i) => createCard(tool, i))
    .join('');
}

function createCard(tool, index) {
  const pricingColor = getPricingColor(tool.pricing);
  const categoryIcon = getCategoryIcon(tool.category);
  const delay = Math.min(index * 60, 600); // stagger max 600ms

  return `
    <article
      class="tool-card group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 flex flex-col
             hover:bg-white/[0.06] hover:border-brand-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]
             transition-all duration-300 opacity-0"
      style="animation: card-appear 0.5s ease-out ${delay}ms forwards;"
      data-category="${escapeHTML(tool.category)}"
    >
      ${tool.featured ? '<div class="absolute -top-px -right-px px-3 py-1 rounded-tr-2xl rounded-bl-xl bg-gradient-to-r from-brand-600 to-purple-600 text-[11px] font-bold uppercase tracking-wider text-white">Featured</div>' : ''}

      <!-- Top: Icon + Category -->
      <div class="flex items-start justify-between mb-5">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${categoryIcon.gradient} flex items-center justify-center shadow-lg ${categoryIcon.shadow}">
          ${categoryIcon.svg}
        </div>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${categoryIcon.badgeColor}">
          ${escapeHTML(tool.category)}
        </span>
      </div>

      <!-- Name -->
      <h3 class="text-lg font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
        ${escapeHTML(tool.name)}
      </h3>

      <!-- Description -->
      <p class="text-sm text-gray-400 leading-relaxed mb-5 flex-1">
        ${escapeHTML(tool.description)}
      </p>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mb-5">
        ${tool.tags.map(tag => `<span class="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-gray-500 font-medium">#${escapeHTML(tag)}</span>`).join('')}
      </div>

      <!-- Bottom: Pricing + CTA -->
      <div class="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${pricingColor}">
          <span class="w-1.5 h-1.5 rounded-full ${pricingColor.includes('green') ? 'bg-green-400' : pricingColor.includes('yellow') ? 'bg-yellow-400' : 'bg-brand-400'}"></span>
          ${escapeHTML(tool.pricing)}
        </span>
        <a
          href="${escapeHTML(tool.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm font-semibold
                 hover:bg-brand-600 hover:text-white hover:border-brand-600 hover:shadow-lg hover:shadow-brand-500/20
                 transition-all duration-200"
        >
          Visit Website
          <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════════
   CATEGORY ICONS & COLORS
   ═══════════════════════════════════════════ */

function getCategoryIcon(category) {
  const icons = {
    'Large Language Models': {
      gradient: 'from-violet-500 to-purple-600',
      shadow:   'shadow-violet-500/20',
      badgeColor: 'bg-violet-500/10 text-violet-300',
      svg: '<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>'
    },
    'Image Generators': {
      gradient: 'from-pink-500 to-rose-600',
      shadow:   'shadow-pink-500/20',
      badgeColor: 'bg-pink-500/10 text-pink-300',
      svg: '<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM16.5 7.5h.008v.008H16.5V7.5Z"/></svg>'
    },
    'Video Creators': {
      gradient: 'from-red-500 to-rose-600',
      shadow:   'shadow-red-500/20',
      badgeColor: 'bg-red-500/10 text-red-300',
      svg: '<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>'
    },
    'Coding Assistants': {
      gradient: 'from-emerald-500 to-teal-600',
      shadow:   'shadow-emerald-500/20',
      badgeColor: 'bg-emerald-500/10 text-emerald-300',
      svg: '<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"/></svg>'
    },
    'AI for Healthcare': {
      gradient: 'from-cyan-500 to-blue-600',
      shadow:   'shadow-cyan-500/20',
      badgeColor: 'bg-cyan-500/10 text-cyan-300',
      svg: '<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>'
    }
  };

  return icons[category] || icons['Large Language Models'];
}

function getPricingColor(pricing) {
  switch (pricing) {
    case 'Free':     return 'text-green-400';
    case 'Freemium': return 'text-yellow-400';
    case 'Paid':     return 'text-brand-400';
    default:         return 'text-gray-400';
  }
}

/* ═══════════════════════════════════════════
   FILTER BUTTONS
   ═══════════════════════════════════════════ */

function initFilterButtons() {
  const buttons = document.querySelectorAll('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentFilter = btn.dataset.filter;

      const filtered = currentFilter === 'all'
        ? allTools
        : allTools.filter(t => t.category === currentFilter);

      renderTools(filtered);
    });
  });
}

/* ═══════════════════════════════════════════
   ANIMATED NUMBER COUNTERS
   ═══════════════════════════════════════════ */

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const suffix   = el.textContent.replace(/[\d,]/g, '');
  const duration = 2000;
  const start    = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ═══════════════════════════════════════════
   SEARCH — powered by data.json
   ═══════════════════════════════════════════ */

function initSearchFunctionality() {
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();

      if (!query) {
        searchResults.innerHTML = `
          <div class="px-5 py-8 text-center text-gray-500">
            <svg class="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p>Type to start searching...</p>
          </div>`;
        return;
      }

      // Search from live data (falls back to empty if data hasn't loaded yet)
      const data = allTools.length ? allTools : [];
      const filtered = data.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.category.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.tags.some(t => t.toLowerCase().includes(query))
      );

      if (filtered.length === 0) {
        searchResults.innerHTML = `
          <div class="px-5 py-8 text-center text-gray-500">
            <p>No results found for "${escapeHTML(searchInput.value)}"</p>
          </div>`;
        return;
      }

      searchResults.innerHTML = filtered
        .map((tool) => {
          const icon = getCategoryIcon(tool.category);
          return `
          <a href="#tools" class="search-result-link flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${icon.gradient} flex items-center justify-center flex-shrink-0">
              ${icon.svg.replace('w-6 h-6', 'w-5 h-5')}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-white">${escapeHTML(tool.name)}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">${escapeHTML(tool.category)}</span>
              </div>
              <p class="text-sm text-gray-500 truncate">${escapeHTML(tool.description)}</p>
            </div>
            <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>`;
        })
        .join('');
    }, 200);
  });
}

/* ═══════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════ */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
