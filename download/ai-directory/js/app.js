/**
 * AI Directory — app.js
 * Application logic: animated counters, mock data, future API integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initSearchFunctionality();
  console.log('🤖 AI Directory loaded successfully!');
});

/* ──────────────────────────────────────────
   Animated Number Counters
   ────────────────────────────────────────── */
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
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.textContent.replace(/[\d,]/g, ''); // capture existing suffix like "+", "K+"
  const duration = 2000; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    el.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ──────────────────────────────────────────
   Mock Search Functionality
   (Replace with real API integration later)
   ────────────────────────────────────────── */
function initSearchFunctionality() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  // Sample tools data for demo search
  const sampleTools = [
    { name: 'ChatGPT', category: 'Chatbot', desc: 'OpenAI\'s conversational AI assistant' },
    { name: 'Midjourney', category: 'Image Generation', desc: 'AI-powered image creation tool' },
    { name: 'Stable Diffusion', category: 'Image Generation', desc: 'Open-source image generation model' },
    { name: 'Copilot', category: 'Code Assistant', desc: 'AI pair programmer by GitHub' },
    { name: 'Jasper', category: 'Writing', desc: 'AI content generation platform' },
    { name: 'DALL-E 3', category: 'Image Generation', desc: 'OpenAI\'s latest image generation model' },
    { name: 'Claude', category: 'Chatbot', desc: 'Anthropic\'s AI assistant' },
    { name: 'Whisper', category: 'Speech', desc: 'OpenAI speech recognition model' },
    { name: 'Runway ML', category: 'Video', desc: 'AI video generation and editing' },
    { name: 'Notion AI', category: 'Productivity', desc: 'AI-powered writing assistant in Notion' },
    { name: 'Gamma', category: 'Presentations', desc: 'AI-powered presentation maker' },
    { name: 'Perplexity', category: 'Search', desc: 'AI-powered search engine' },
  ];

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

      const filtered = sampleTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.category.toLowerCase().includes(query) ||
          tool.desc.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        searchResults.innerHTML = `
          <div class="px-5 py-8 text-center text-gray-500">
            <p>No results found for "${escapeHTML(searchInput.value)}"</p>
          </div>`;
        return;
      }

      searchResults.innerHTML = filtered
        .map(
          (tool) => `
        <a href="#tools" class="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer search-result-link" data-tool="${escapeHTML(tool.name)}">
          <div class="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-white">${escapeHTML(tool.name)}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">${escapeHTML(tool.category)}</span>
            </div>
            <p class="text-sm text-gray-500 truncate">${escapeHTML(tool.desc)}</p>
          </div>
          <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </a>`
        )
        .join('');
    }, 200);
  });
}

/* ──────────────────────────────────────────
   Utility — escape HTML to prevent XSS
   ────────────────────────────────────────── */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
