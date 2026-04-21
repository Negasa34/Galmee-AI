/**
 * AI Directory — huggingface.js
 * Fetches trending AI models from Hugging Face Hub API (free, no API key required)
 * and renders them as live cards on the website.
 *
 * API docs: https://huggingface.co/docs/api-inference/index
 * Hub API:  https://huggingface.co/api/models
 */

/* ── Configuration ───────────────────────── */
const HF_CONFIG = {
  // Public Hugging Face Hub API — no API key needed
  baseUrl: 'https://huggingface.co/api/models',

  // Default query params — get trending/popular models
  defaultParams: {
    limit: '12',
    // filter: use empty string — we'll get a diverse mix of pipeline types
  },

  // How often to auto-refresh (5 minutes)
  refreshInterval: 5 * 60 * 1000,

  // Cache duration (30 seconds)
  cacheTTL: 30 * 1000,
};

/* ── Internal State ──────────────────────── */
let hfModelsCache = { data: null, timestamp: 0 };
let hfRefreshTimer = null;

/* ═══════════════════════════════════════════
   PUBLIC API — call from app.js bootstrap
   ═══════════════════════════════════════════ */

/**
 * Initialize the Hugging Face live models section.
 * Call once from DOMContentLoaded.
 */
function initHuggingFaceModels() {
  const container = document.getElementById('hf-models-grid');
  const statusEl  = document.getElementById('hf-status');
  const refreshBtn = document.getElementById('hf-refresh-btn');

  if (!container) return;

  // Fetch immediately on page load
  fetchAndRenderHFModels();

  // Wire up manual refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // Bypass cache on manual refresh
      hfModelsCache = { data: null, timestamp: 0 };
      fetchAndRenderHFModels();
    });
  }

  // Auto-refresh on interval
  if (hfRefreshTimer) clearInterval(hfRefreshTimer);
  hfRefreshTimer = setInterval(fetchAndRenderHFModels, HF_CONFIG.refreshInterval);
}

/* ═══════════════════════════════════════════
   FETCH & RENDER
   ═══════════════════════════════════════════ */

async function fetchAndRenderHFModels() {
  const container  = document.getElementById('hf-models-grid');
  const loading    = document.getElementById('hf-loading');
  const statusEl   = document.getElementById('hf-status');
  const empty      = document.getElementById('hf-empty');
  const countNum   = document.getElementById('hf-count-number');
  const countWrap  = document.getElementById('hf-count');

  if (!container) return;

  // Show loading state
  if (loading) loading.classList.remove('hidden');
  if (container) container.classList.add('hidden');
  if (empty) empty.classList.add('hidden');

  // Update status text
  updateHFStatus('Fetching latest models...');

  try {
    // Check cache first
    const now = Date.now();
    if (hfModelsCache.data && (now - hfModelsCache.timestamp) < HF_CONFIG.cacheTTL) {
      renderHFModels(hfModelsCache.data);
      updateHFStatus('Live');
      return;
    }

    // Build URL with query params
    const params = new URLSearchParams(HF_CONFIG.defaultParams).toString();
    const url = `${HF_CONFIG.baseUrl}?${params}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const rawModels = await response.json();

    if (!Array.isArray(rawModels) || rawModels.length === 0) {
      throw new Error('No models returned from API');
    }

    // Transform HF API response into our standard card format
    const models = rawModels.map(transformHFModel);

    // Update cache
    hfModelsCache = { data: models, timestamp: now };

    // Render
    renderHFModels(models);
    updateHFStatus('Live', new Date().toLocaleTimeString());

    console.log(`📦 Fetched ${models.length} models from Hugging Face`);

  } catch (error) {
    console.error('Hugging Face fetch failed:', error);

    // Fall back to cached data if available (even if stale)
    if (hfModelsCache.data) {
      renderHFModels(hfModelsCache.data);
      updateHFStatus('Cached (offline)');
      return;
    }

    // Show error state in the grid
    if (loading) loading.classList.add('hidden');
    container.classList.remove('hidden');
    if (empty) empty.classList.remove('hidden');
    if (countWrap) countWrap.classList.add('hidden');

    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <svg class="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-300 mb-2">Could not load Hugging Face models</h3>
        <p class="text-gray-500 text-sm max-w-md mx-auto mb-4">${escapeHTML(error.message)}. This may be a network issue or CORS restriction. Click retry to try again.</p>
        <button onclick="hfModelsCache={data:null,timestamp:0};fetchAndRenderHFModels();"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 transition-all">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          Retry
        </button>
      </div>`;

    updateHFStatus('Error');
  }
}

/* ═══════════════════════════════════════════
   TRANSFORM — HF API → our card format
   ═══════════════════════════════════════════ */

function transformHFModel(model) {
  // Extract org/name from modelId (e.g. "meta-llama/Llama-3-70b")
  const [author, ...nameParts] = (model.id || model.modelId || '').split('/');
  const modelName = nameParts.join('/') || author;

  // Pipeline tag → human readable category
  const pipeline = model.pipeline_tag || 'other';
  const category = getPipelineLabel(pipeline);

  // Format numbers
  const likes     = (model.likes || 0).toLocaleString();
  const downloads = formatDownloads(model.downloads || 0);

  // Tags (limit to 4)
  const tags = (model.tags || [])
    .filter(t => !t.includes('arxiv') && !t.includes('doi') && t !== pipeline && t !== 'transformers')
    .slice(0, 4);

  // Build description from tags or model card data
  let description = '';
  if (model.cardData && model.cardData.description) {
    description = model.cardData.description
      .replace(/<[^>]*>/g, '')    // strip HTML
      .replace(/\n/g, ' ')
      .substring(0, 160);
    if (description.length >= 160) description += '...';
  } else if (model.summary) {
    description = model.summary.substring(0, 160);
    if (description.length >= 160) description += '...';
  } else {
    description = `A ${category.toLowerCase()} model by ${author}. Explore its capabilities, benchmarks, and community usage on Hugging Face.`;
  }

  return {
    id:            model._id || model.id || modelName,
    name:          modelName,
    author:        author,
    category:      category,
    pipeline:      pipeline,
    description:   description,
    url:           `https://huggingface.co/${model.id || model.modelId}`,
    likes:         likes,
    downloads:     downloads,
    downloadsRaw:  model.downloads || 0,
    likesRaw:      model.likes || 0,
    lastModified:  model.lastModified || null,
    tags:          tags.length ? tags : [pipeline],
    source:        'huggingface',
    isPrivate:     model.private || false,
    isGated:       model.gated === 'auto' || model.gated === 'manual',
    libraryName:   model.library_name || null,
  };
}

/* ═══════════════════════════════════════════
   RENDER — create model cards
   ═══════════════════════════════════════════ */

function renderHFModels(models) {
  const container = document.getElementById('hf-models-grid');
  const loading   = document.getElementById('hf-loading');
  const empty     = document.getElementById('hf-empty');
  const countNum  = document.getElementById('hf-count-number');
  const countWrap = document.getElementById('hf-count');

  if (!container) return;

  // Update count
  if (countNum)  countNum.textContent = models.length;
  if (countWrap) countWrap.classList.remove('hidden');

  // Toggle visibility
  if (loading) loading.classList.add('hidden');
  if (empty)   empty.classList.add('hidden');
  container.classList.remove('hidden');

  container.innerHTML = models
    .map((model, i) => createHFModelCard(model, i))
    .join('');

  // Re-init card glow for new cards
  initCardGlow();
}

function createHFModelCard(model, index) {
  const pipelineIcon = getPipelineIcon(model.pipeline);
  const delay = Math.min(index * 50, 500);

  // Pick a display gradient based on pipeline
  const gradient = getPipelineGradient(model.pipeline);

  return `
    <article
      class="hf-model-card group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 flex flex-col
             hover:bg-white/[0.06] hover:border-brand-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]
             transition-all duration-300 opacity-0"
      style="animation: card-appear 0.5s ease-out ${delay}ms forwards;"
      data-pipeline="${escapeHTML(model.pipeline)}"
    >
      <!-- Top: Pipeline Icon + Category Badge -->
      <div class="flex items-start justify-between mb-4">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg">
          ${pipelineIcon}
        </div>
        <div class="flex items-center gap-2">
          ${model.isGated ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
              Gated
            </span>` : ''}
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] text-gray-400">
            ${escapeHTML(model.category)}
          </span>
        </div>
      </div>

      <!-- Author -->
      <div class="flex items-center gap-1.5 mb-1">
        <div class="w-4 h-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center">
          <span class="text-[8px] font-bold text-white">${escapeHTML(model.author.charAt(0).toUpperCase())}</span>
        </div>
        <span class="text-xs text-gray-500 font-medium">${escapeHTML(model.author)}</span>
      </div>

      <!-- Model Name -->
      <h3 class="text-base font-bold text-white mb-2 group-hover:text-brand-300 transition-colors leading-snug">
        ${escapeHTML(model.name)}
      </h3>

      <!-- Description -->
      <p class="text-sm text-gray-400 leading-relaxed mb-4 flex-1 line-clamp-3">
        ${escapeHTML(model.description)}
      </p>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1 mb-4">
        ${model.tags.slice(0, 3).map(tag => `<span class="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-gray-500 font-medium">${escapeHTML(tag)}</span>`).join('')}
      </div>

      <!-- Bottom: Stats + CTA -->
      <div class="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span class="inline-flex items-center gap-1" title="Likes">
            <svg class="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
            ${escapeHTML(model.likes)}
          </span>
          <span class="inline-flex items-center gap-1" title="Downloads">
            <svg class="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            ${escapeHTML(model.downloads)}
          </span>
        </div>
        <a
          href="${escapeHTML(model.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-300 text-xs font-semibold
                 hover:bg-brand-600 hover:text-white hover:border-brand-600 hover:shadow-lg hover:shadow-brand-500/20
                 transition-all duration-200"
        >
          View Model
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════════
   PIPELINE → UI MAPPING
   ═══════════════════════════════════════════ */

function getPipelineLabel(pipeline) {
  const labels = {
    'text-generation':                 'Text Generation',
    'text-to-image':                   'Image Generation',
    'image-generation':                'Image Generation',
    'automatic-speech-recognition':    'Speech Recognition',
    'feature-extraction':              'Feature Extraction',
    'summarization':                   'Summarization',
    'translation':                     'Translation',
    'text-classification':             'Text Classification',
    'question-answering':              'Question Answering',
    'fill-mask':                       'Fill Mask',
    'token-classification':            'Token Classification',
    'image-classification':            'Image Classification',
    'audio-classification':            'Audio Classification',
    'conversational':                  'Chatbot',
    'text2text-generation':            'Text-to-Text',
    'image-text-to-text':              'Visual QA',
    'visual-question-answering':       'Visual QA',
    'document-question-answering':     'Document QA',
    'image-segmentation':              'Image Segmentation',
    'object-detection':                'Object Detection',
    'audio-text-to-text':              'Speech to Text',
    'text-to-audio':                   'Text-to-Audio',
    'text-to-speech':                  'Text-to-Speech',
  };
  return labels[pipeline] || 'Model';
}

function getPipelineIcon(pipeline) {
  const icons = {
    'text-generation': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>',
    'text-to-image': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM16.5 7.5h.008v.008H16.5V7.5Z"/></svg>',
    'image-generation': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM16.5 7.5h.008v.008H16.5V7.5Z"/></svg>',
    'automatic-speech-recognition': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg>',
    'conversational': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>',
    'summarization': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>',
    'translation': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"/></svg>',
    'question-answering': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-2.25h.008v.008H12v-.008Zm-2.25 0h.008v.008H9.75v-.008ZM12 18c2.485 0 4.5-1.685 4.5-3.983V8.483C16.5 6.185 14.485 4.5 12 4.5S7.5 6.185 7.5 8.483v5.534C7.5 16.315 9.515 18 12 18Z"/></svg>',
    'feature-extraction': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"/></svg>',
    'text-classification': '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>',
  };
  return icons[pipeline] || icons['feature-extraction'];
}

function getPipelineGradient(pipeline) {
  const gradients = {
    'text-generation':                 'from-violet-500 to-purple-600',
    'text-to-image':                   'from-pink-500 to-rose-600',
    'image-generation':                'from-pink-500 to-rose-600',
    'automatic-speech-recognition':    'from-fuchsia-500 to-purple-600',
    'feature-extraction':              'from-cyan-500 to-blue-600',
    'summarization':                   'from-amber-500 to-orange-600',
    'translation':                     'from-teal-500 to-cyan-600',
    'text-classification':             'from-emerald-500 to-green-600',
    'question-answering':              'from-blue-500 to-indigo-600',
    'fill-mask':                       'from-indigo-500 to-violet-600',
    'token-classification':            'from-lime-500 to-emerald-600',
    'conversational':                  'from-violet-500 to-purple-600',
    'text2text-generation':            'from-sky-500 to-blue-600',
    'image-text-to-text':              'from-orange-500 to-amber-600',
    'visual-question-answering':       'from-orange-500 to-amber-600',
    'document-question-answering':     'from-blue-500 to-indigo-600',
    'image-segmentation':              'from-rose-500 to-pink-600',
    'object-detection':                'from-red-500 to-rose-600',
    'audio-text-to-text':              'from-fuchsia-500 to-purple-600',
    'text-to-audio':                   'from-fuchsia-500 to-purple-600',
    'text-to-speech':                  'from-fuchsia-500 to-purple-600',
  };
  return gradients[pipeline] || 'from-gray-500 to-gray-600';
}

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

function formatDownloads(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function updateHFStatus(text, time) {
  const el = document.getElementById('hf-status-text');
  if (el) {
    el.textContent = time ? `${text} · Updated ${time}` : text;
  }
}
