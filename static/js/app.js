/**
 * AER Core: Multi-Answer Abductive Event Reasoning
 * Classic Aquamarine & Slate Controller
 */

// Application State
const state = {
  activeTab: 'playground',
  presets: [],
  filteredPresets: [],
  currentPresetId: null,
  activeSplit: 'sample_data',
  datasetPage: 1,
  datasetPerPage: 10,
  datasetTotalPages: 1,
  metricsData: null,
  statsData: null,
  charts: {},
  documents: []
};

// Tab titles map
const TAB_TITLES = {
  playground: 'Inference Lab & Causal Playground',
  variations: 'Scenario Variations & Hypotheses Catalog',
  metrics: 'Benchmark Performance & Calibration Metrics',
  dataset: 'SemEval Dataset Explorer (600 Questions)',
  distribution: 'Bias Analysis & Class Prior Distribution',
  roadmap: 'System Architecture & Scientific Roadmap',
  api: 'Interactive REST API Sandbox'
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  setupEventListeners();
  loadPresets();
  loadMetrics();
  loadDatasetStats();
  loadRoadmap();
  setupApiConsole();
  loadDatasetPage(1);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to execute reasoning
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (state.activeTab === 'playground') {
        e.preventDefault();
        triggerReasoning();
      }
    }
  });

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    const varMenu = document.getElementById('variation-menu-dropdown');
    const varBtn = document.getElementById('btn-variation-menu');
    if (varMenu && !varMenu.classList.contains('hidden') && !varMenu.contains(e.target) && !varBtn?.contains(e.target)) {
      varMenu.classList.add('hidden');
    }
  });
});

// Setup DOM event listeners
function setupEventListeners() {
  const thresholdSlider = document.getElementById('input-threshold');
  const thresholdVal = document.getElementById('threshold-val');
  if (thresholdSlider && thresholdVal) {
    thresholdSlider.addEventListener('input', (e) => {
      thresholdVal.textContent = parseFloat(e.target.value).toFixed(2);
    });
  }
}

// -----------------------------------------------------------------------------
// TAB MANAGEMENT (VERTICAL SIDEBAR)
// -----------------------------------------------------------------------------
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update sidebar links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });

  const activeLink = document.getElementById(`nav-${tabId}`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Update content sections
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });

  const activeSection = document.getElementById(`tab-${tabId}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
  }

  // Update header title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && TAB_TITLES[tabId]) {
    pageTitle.textContent = TAB_TITLES[tabId];
  }

  // Render or resize charts when switching to relevant tabs
  if (tabId === 'metrics') {
    setTimeout(renderMetricsCharts, 60);
  } else if (tabId === 'distribution') {
    setTimeout(renderDistributionCharts, 60);
  } else if (tabId === 'variations') {
    renderVariationsCatalog();
  }

  lucide.createIcons();
}

// -----------------------------------------------------------------------------
// PRESETS & VARIATIONS MANAGEMENT
// -----------------------------------------------------------------------------
async function loadPresets() {
  try {
    const res = await fetch('/api/presets');
    const presets = await res.json();
    state.presets = presets;
    state.filteredPresets = presets;

    renderVariationsCatalog();

    // Auto-load first preset if available
    if (presets.length > 0) {
      loadPresetIntoPlayground(presets[0].id);
    }
  } catch (err) {
    console.error('Failed to load presets:', err);
  }
}

function renderVariationsCatalog() {
  const container = document.getElementById('variations-catalog-grid');
  if (!container) return;
  container.innerHTML = '';

  const list = state.filteredPresets.length > 0 ? state.filteredPresets : state.presets;

  list.forEach(preset => {
    const card = document.createElement('div');
    card.className = 'bg-[#070a12] border border-[#1e293b] hover:border-teal-500/50 rounded-xl p-5 space-y-3 transition-all flex flex-col justify-between';

    const goldenBadges = (preset.golden || 'A').split(',').map(g => {
      return `<span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-teal-500/15 text-teal-300 border border-teal-500/30">Cause ${g.trim()}</span>`;
    }).join(' ');

    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">${preset.domain || preset.category}</span>
          <span class="text-[10px] font-mono text-slate-400">${preset.variation_type || preset.type}</span>
        </div>
        <h4 class="text-sm font-bold text-white">${preset.title}</h4>
        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${preset.event}</p>
      </div>

      <div class="pt-3 border-t border-[#1e293b] flex items-center justify-between">
        <div class="flex items-center space-x-1">${goldenBadges}</div>
        <button type="button" onclick="loadPresetIntoPlayground('${preset.id}'); switchTab('playground');" class="text-xs px-3 py-1.5 btn-aquamarine text-white flex items-center space-x-1">
          <i data-lucide="play" class="w-3.5 h-3.5"></i>
          <span>Load in Lab</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

function filterPresetsByDomain(domain) {
  if (domain === 'all') {
    state.filteredPresets = state.presets;
  } else {
    state.filteredPresets = state.presets.filter(p => p.domain === domain || p.category?.includes(domain));
  }
  renderVariationsCatalog();
}

function loadRandomVariation() {
  if (state.presets.length === 0) return;
  const randIdx = Math.floor(Math.random() * state.presets.length);
  const randomPreset = state.presets[randIdx];
  loadPresetIntoPlayground(randomPreset.id);
}

function toggleVariationMenu() {
  const menu = document.getElementById('variation-menu-dropdown');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Dynamic Variation Generator (Counterfactual, Multi-Confluence, Distractor, Negative)
async function applyDynamicVariation(mode) {
  const menu = document.getElementById('variation-menu-dropdown');
  if (menu) menu.classList.add('hidden');

  const event = document.getElementById('input-event')?.value.trim();
  const options = {
    A: document.getElementById('opt-A')?.value.trim() || '',
    B: document.getElementById('opt-B')?.value.trim() || '',
    C: document.getElementById('opt-C')?.value.trim() || '',
    D: document.getElementById('opt-D')?.value.trim() || ''
  };

  if (!event) {
    alert('Please enter or select a target event first.');
    return;
  }

  const btn = document.getElementById('btn-variation-menu');
  if (btn) {
    btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin text-teal-400"></i><span>Mutating...</span>`;
    lucide.createIcons();
  }

  try {
    const res = await fetch('/api/generate-variation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event,
        documents: state.documents,
        options: options,
        mode: mode
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    state.documents = data.documents;
    renderDocumentFields();

    ['A', 'B', 'C', 'D'].forEach(opt => {
      const el = document.getElementById(`opt-${opt}`);
      if (el) el.value = data.options[opt] || '';
    });

    // Update active banner
    const subEl = document.getElementById('active-scenario-sub');
    if (subEl) subEl.textContent = `Variation: ${data.variation_label}`;

    // Execute reasoning on new variation
    triggerReasoning();
  } catch (err) {
    console.error('Failed to generate variation:', err);
    alert('Variation error: ' + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5 text-teal-400"></i><span>Mutate</span><i data-lucide="chevron-down" class="w-3 h-3 ml-1"></i>`;
      lucide.createIcons();
    }
  }
}

function loadPresetIntoPlayground(presetId) {
  const preset = state.presets.find(p => p.id === presetId);
  if (!preset) return;

  state.currentPresetId = presetId;

  // Update active scenario strip
  const titleEl = document.getElementById('active-scenario-title');
  const badgeEl = document.getElementById('active-scenario-badge');
  const subEl = document.getElementById('active-scenario-sub');

  if (titleEl) titleEl.textContent = preset.title;
  if (badgeEl) badgeEl.textContent = preset.domain || preset.category;
  if (subEl) subEl.textContent = `${preset.variation_type || preset.type} • Expected: [${preset.golden || 'A'}]`;

  // Populate Target Event
  const eventInput = document.getElementById('input-event');
  if (eventInput) eventInput.value = preset.event;

  // Populate Documents
  state.documents = [...preset.documents];
  renderDocumentFields();

  // Populate Options
  ['A', 'B', 'C', 'D'].forEach(opt => {
    const el = document.getElementById(`opt-${opt}`);
    if (el) el.value = preset.options[opt] || '';
  });

  resetPlaygroundResults();
  triggerReasoning();
}

function renderDocumentFields() {
  const container = document.getElementById('documents-container');
  if (!container) return;
  container.innerHTML = '';

  state.documents.forEach((doc, idx) => {
    const docDiv = document.createElement('div');
    docDiv.className = 'bg-[#070a12] p-4 rounded-xl border border-[#1e293b] space-y-2';
    docDiv.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-slate-400 flex items-center space-x-1.5">
          <i data-lucide="file-text" class="w-3.5 h-3.5 text-teal-400"></i>
          <span>Document ${idx + 1}</span>
        </span>
        ${
          state.documents.length > 1
            ? `<button type="button" onclick="removeDocumentField(${idx})" class="text-rose-400 hover:text-rose-300 text-[11px] flex items-center space-x-1">
                 <i data-lucide="trash-2" class="w-3 h-3"></i>
                 <span>Remove</span>
               </button>`
            : ''
        }
      </div>
      <textarea rows="2" oninput="updateDocumentText(${idx}, this.value)" class="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-y" placeholder="Context document snippet...">${doc}</textarea>
    `;
    container.appendChild(docDiv);
  });

  lucide.createIcons();
}

function addDocumentField() {
  state.documents.push('');
  renderDocumentFields();
}

function removeDocumentField(index) {
  if (state.documents.length > 1) {
    state.documents.splice(index, 1);
    renderDocumentFields();
  }
}

function updateDocumentText(index, value) {
  if (state.documents[index] !== undefined) {
    state.documents[index] = value;
  }
}

function resetPlaygroundFields() {
  const eventInput = document.getElementById('input-event');
  if (eventInput) eventInput.value = '';

  state.documents = [''];
  renderDocumentFields();

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const el = document.getElementById(`opt-${opt}`);
    if (el) el.value = '';
  });

  resetPlaygroundResults();
}

function resetPlaygroundResults() {
  const labelsContainer = document.getElementById('cause-labels-container');
  if (labelsContainer) {
    labelsContainer.innerHTML = '<span class="text-sm text-slate-400 italic">Ready to reason. Click "Reason & Predict Causes".</span>';
  }

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const valEl = document.getElementById(`val-prob-${opt}`);
    const barEl = document.getElementById(`bar-prob-${opt}`);
    const badgeEl = document.getElementById(`badge-status-${opt}`);
    const cardEl = document.getElementById(`card-prob-${opt}`);
    const evidEl = document.getElementById(`evidence-${opt}`);

    if (valEl) valEl.textContent = '0.0%';
    if (barEl) barEl.style.width = '0%';
    if (badgeEl) {
      badgeEl.textContent = 'Pending';
      badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-[#1e293b] text-slate-400 font-medium';
    }
    if (cardEl) {
      cardEl.className = 'bg-[#070a12] border border-[#1e293b] rounded-xl p-3.5 space-y-2 transition-all';
    }
    if (evidEl) {
      evidEl.classList.add('hidden');
      evidEl.innerHTML = '';
    }
  });

  const rawViewer = document.getElementById('raw-json-viewer');
  if (rawViewer) rawViewer.textContent = '{"status": "awaiting_inference"}';
}

// -----------------------------------------------------------------------------
// REASONING INFERENCE EXECUTION
// -----------------------------------------------------------------------------
async function triggerReasoning() {
  const event = document.getElementById('input-event')?.value.trim();
  const threshold = parseFloat(document.getElementById('input-threshold')?.value || 0.5);

  const options = {
    A: document.getElementById('opt-A')?.value.trim() || '',
    B: document.getElementById('opt-B')?.value.trim() || '',
    C: document.getElementById('opt-C')?.value.trim() || '',
    D: document.getElementById('opt-D')?.value.trim() || ''
  };

  if (!event) {
    alert('Please enter a target event description.');
    return;
  }

  const btn = document.getElementById('btn-predict');
  const statusIndicator = document.getElementById('status-indicator');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-white"></i><span>Inferring Hypotheses...</span>`;
    lucide.createIcons();
  }

  if (statusIndicator) {
    statusIndicator.textContent = 'Evaluating ALBERT...';
    statusIndicator.className = 'text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-medium border border-teal-500/30';
  }

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event,
        documents: state.documents.filter(d => d.trim()),
        options: options,
        threshold: threshold
      })
    });

    const result = await res.json();
    displayInferenceResults(result);
  } catch (err) {
    console.error('Inference error:', err);
    alert('Failed to execute reasoning inference: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>Reason & Predict Causes</span><span class="text-[10px] bg-black/25 px-2 py-0.5 rounded ml-2 font-mono">Ctrl + ↵</span>`;
      lucide.createIcons();
    }
    if (statusIndicator) {
      statusIndicator.textContent = 'Complete';
      statusIndicator.className = 'text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-bold border border-teal-500/30';
    }
  }
}

function displayInferenceResults(result) {
  const labelsContainer = document.getElementById('cause-labels-container');
  const banner = document.getElementById('cause-banner');

  if (labelsContainer && banner) {
    labelsContainer.innerHTML = '';

    if (result.predicted_labels && result.predicted_labels.length > 0) {
      const isMulti = result.predicted_labels.length > 1;

      banner.className = `p-4 rounded-xl border text-center space-y-2 transition-all ${
        isMulti
          ? 'bg-teal-950/30 border-teal-500/40'
          : 'bg-[#0d1322] border-teal-600/40'
      }`;

      const titleSpan = banner.querySelector('span');
      if (titleSpan) {
        titleSpan.innerHTML = isMulti
          ? '<span class="text-teal-400 font-bold uppercase tracking-wider">✨ Multi-Answer Confluence Discovered (' + result.predicted_labels.length + ' Causes)</span>'
          : '<span class="text-teal-300 font-bold uppercase tracking-wider">🎯 Single Cause Identified</span>';
      }

      result.predicted_labels.forEach(lbl => {
        const badge = document.createElement('div');
        badge.className = 'px-3.5 py-1.5 rounded-xl font-bold text-sm shadow flex items-center space-x-1.5 btn-aquamarine text-white';
        badge.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Option ${lbl}</span>`;
        labelsContainer.appendChild(badge);
      });

      if (result.top_1_fallback_applied) {
        const fallbackNotice = document.createElement('div');
        fallbackNotice.className = 'text-[11px] text-amber-400/90 italic pt-1';
        fallbackNotice.textContent = 'All probabilities were below threshold; top-1 fallback was applied.';
        labelsContainer.appendChild(fallbackNotice);
      }
    } else {
      labelsContainer.innerHTML = '<span class="text-sm text-slate-400">No causes met the threshold.</span>';
    }
  }

  // Update Individual Option Probability Cards
  const probs = result.probabilities || {};
  const evidence = result.evidence || {};
  const threshold = result.threshold || 0.5;

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const p = probs[opt] || 0.0;
    const pPct = (p * 100).toFixed(1);
    const isSelected = result.predicted_labels?.includes(opt);

    const valEl = document.getElementById(`val-prob-${opt}`);
    const barEl = document.getElementById(`bar-prob-${opt}`);
    const badgeEl = document.getElementById(`badge-status-${opt}`);
    const cardEl = document.getElementById(`card-prob-${opt}`);
    const evidEl = document.getElementById(`evidence-${opt}`);

    if (valEl) valEl.textContent = `${pPct}%`;
    if (barEl) barEl.style.width = `${Math.min(100, Math.max(3, p * 100))}%`;

    if (badgeEl) {
      if (isSelected) {
        badgeEl.textContent = `Identified Cause (P ≥ ${(threshold).toFixed(2)})`;
        badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30';
      } else {
        badgeEl.textContent = `Ruled Out (P < ${(threshold).toFixed(2)})`;
        badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-[#1e293b] text-slate-400 font-medium';
      }
    }

    if (cardEl) {
      if (isSelected) {
        cardEl.className = `bg-[#0d1322] border rounded-xl p-3.5 space-y-2 transition-all option-card-${opt} border-teal-500/40`;
      } else {
        cardEl.className = 'bg-[#070a12] border border-[#1e293b] rounded-xl p-3.5 space-y-2 transition-all opacity-80';
      }
    }

    if (evidEl) {
      const evList = evidence[opt] || [];
      if (isSelected && evList.length > 0) {
        evidEl.classList.remove('hidden');
        evidEl.innerHTML = `
          <div class="text-[10px] uppercase font-bold text-teal-400 mb-1 flex items-center space-x-1">
            <i data-lucide="quote" class="w-3 h-3 text-teal-400"></i>
            <span>Supporting Context Evidence (Doc ${evList[0].doc_idx}):</span>
          </div>
          <p class="italic text-slate-300">"${evList[0].sentence}"</p>
        `;
      } else {
        evidEl.classList.add('hidden');
        evidEl.innerHTML = '';
      }
    }
  });

  // Update raw JSON inspector
  const rawViewer = document.getElementById('raw-json-viewer');
  if (rawViewer) {
    rawViewer.textContent = JSON.stringify(result, null, 2);
  }

  lucide.createIcons();
}

// -----------------------------------------------------------------------------
// BENCHMARK METRICS & CALIBRATION (CLASSIC AQUAMARINE & SLATE CHARTS)
// -----------------------------------------------------------------------------
async function loadMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    state.metricsData = data;

    renderConfusionCards(data.per_option_metrics);
    renderCalibrationTable(data.sample_dev_comparisons);
    renderMetricsCharts();
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

function renderConfusionCards(perOption) {
  const container = document.getElementById('confusion-cards-container');
  if (!container || !perOption) return;
  container.innerHTML = '';

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const m = perOption[opt] || {};
    const card = document.createElement('div');
    card.className = `bg-[#070a12] border border-[#1e293b] rounded-xl p-4 space-y-3 option-card-${opt}`;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="px-2 py-0.5 rounded text-xs font-bold badge-${opt}">Option ${opt}</span>
        <span class="font-mono text-xs font-bold text-teal-400">F1: ${(m.f1_score * 100).toFixed(2)}%</span>
      </div>

      <!-- 2x2 Matrix Mini Grid -->
      <div class="grid grid-cols-2 gap-1.5 text-center font-mono text-[11px]">
        <div class="bg-teal-950/40 border border-teal-500/20 p-2 rounded-lg">
          <div class="text-[9px] text-slate-400 uppercase font-sans">True Pos (TP)</div>
          <div class="font-bold text-teal-400 text-sm">${m.tp}</div>
        </div>
        <div class="bg-[#111827] border border-[#1e293b] p-2 rounded-lg">
          <div class="text-[9px] text-slate-400 uppercase font-sans">False Pos (FP)</div>
          <div class="font-bold text-rose-400 text-sm">${m.fp}</div>
        </div>
        <div class="bg-[#111827] border border-[#1e293b] p-2 rounded-lg">
          <div class="text-[9px] text-slate-400 uppercase font-sans">False Neg (FN)</div>
          <div class="font-bold text-amber-400 text-sm">${m.fn}</div>
        </div>
        <div class="bg-[#0b0f19] border border-[#1e293b] p-2 rounded-lg">
          <div class="text-[9px] text-slate-400 uppercase font-sans">True Neg (TN)</div>
          <div class="font-bold text-slate-300 text-sm">${m.tn}</div>
        </div>
      </div>

      <div class="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-[#1e293b]">
        <div class="flex justify-between">
          <span>Precision:</span>
          <span class="font-mono text-slate-200">${(m.precision * 100).toFixed(2)}%</span>
        </div>
        <div class="flex justify-between">
          <span>Recall:</span>
          <span class="font-mono text-slate-200">${(m.recall * 100).toFixed(2)}%</span>
        </div>
        <div class="flex justify-between">
          <span>Prob RMSE:</span>
          <span class="font-mono text-slate-200">${m.rmse.toFixed(4)}</span>
        </div>
        <div class="flex justify-between">
          <span>ROC-AUC:</span>
          <span class="font-mono text-slate-200">${m.roc_auc.toFixed(4)}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderCalibrationTable(samples) {
  const tbody = document.getElementById('calibration-table-body');
  if (!tbody || !samples) return;
  tbody.innerHTML = '';

  samples.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#111827] transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-teal-400 font-bold">${s.id}</td>
      <td class="py-2.5 px-3 text-slate-200 font-bold">${s.actual}</td>
      <td class="py-2.5 px-3 text-teal-300 font-bold">${s.pred}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded text-[10px] bg-teal-500/15 text-teal-300 border border-teal-500/30">
          ✅ Exact
        </span>
      </td>
      <td class="py-2.5 px-3 text-slate-400">${s.pa.toFixed(3)}</td>
      <td class="py-2.5 px-3 text-slate-400">${s.pb.toFixed(3)}</td>
      <td class="py-2.5 px-3 text-slate-400">${s.pc.toFixed(3)}</td>
      <td class="py-2.5 px-3 text-slate-400">${s.pd.toFixed(3)}</td>
      <td class="py-2.5 px-3 text-amber-400">${s.rmse.toFixed(4)}</td>
      <td class="py-2.5 px-3">
        <button onclick="inspectSample('${s.id}')" class="text-teal-400 hover:text-teal-300 text-[11px] underline">Inspect</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMetricsCharts() {
  if (!state.metricsData) return;
  const history = state.metricsData.epoch_history || [];

  // Chart 1: Training Convergence (Classic Aquamarine)
  const ctxConv = document.getElementById('chart-convergence')?.getContext('2d');
  if (ctxConv) {
    if (state.charts.convergence) state.charts.convergence.destroy();

    state.charts.convergence = new Chart(ctxConv, {
      type: 'line',
      data: {
        labels: history.map(h => `Epoch ${h.epoch}`),
        datasets: [
          {
            label: 'Exact Match Accuracy (%)',
            data: history.map(h => h.exact_match_acc),
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            yAxisID: 'yAcc',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Train Loss',
            data: history.map(h => h.train_loss),
            borderColor: '#38bdf8',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            yAxisID: 'yLoss',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          yAcc: {
            position: 'left',
            min: 60,
            max: 100,
            grid: { color: '#1e293b' },
            ticks: { color: '#14b8a6', callback: val => `${val}%` }
          },
          yLoss: {
            position: 'right',
            min: 0,
            max: 0.5,
            grid: { drawOnChartArea: false },
            ticks: { color: '#38bdf8' }
          }
        }
      }
    });
  }

  // Chart 2: F1 & RMSE Progression (Classic Cyan & Amber)
  const ctxF1 = document.getElementById('chart-f1-rmse')?.getContext('2d');
  if (ctxF1) {
    if (state.charts.f1Rmse) state.charts.f1Rmse.destroy();

    state.charts.f1Rmse = new Chart(ctxF1, {
      type: 'line',
      data: {
        labels: history.map(h => `Epoch ${h.epoch}`),
        datasets: [
          {
            label: 'Macro F1-Score',
            data: history.map(h => h.macro_f1),
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            yAxisID: 'yF1',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Probability RMSE',
            data: history.map(h => h.prob_rmse),
            borderColor: '#f59e0b',
            borderDash: [4, 4],
            yAxisID: 'yRmse',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          yF1: {
            position: 'left',
            min: 0.8,
            max: 1.0,
            grid: { color: '#1e293b' },
            ticks: { color: '#06b6d4' }
          },
          yRmse: {
            position: 'right',
            min: 0,
            max: 0.35,
            grid: { drawOnChartArea: false },
            ticks: { color: '#f59e0b' }
          }
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
// DATASET EXPLORER
// -----------------------------------------------------------------------------
function setDatasetSplit(splitName) {
  state.activeSplit = splitName;
  state.datasetPage = 1;

  const btnSample = document.getElementById('split-sample');
  const btnDev = document.getElementById('split-dev');

  if (splitName === 'sample_data') {
    btnSample.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white shadow';
    btnDev.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
  } else {
    btnDev.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white shadow';
    btnSample.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
  }

  loadDatasetPage(1);
}

let searchDebounceTimeout = null;
function debounceDatasetSearch() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    loadDatasetPage(1);
  }, 300);
}

async function loadDatasetPage(page) {
  state.datasetPage = page;
  const search = document.getElementById('dataset-search')?.value.trim() || '';
  const answerType = document.getElementById('filter-type')?.value || 'all';
  const label = document.getElementById('filter-label')?.value || '';

  const params = new URLSearchParams({
    split: state.activeSplit,
    page: page,
    per_page: state.datasetPerPage,
    search: search,
    type: answerType,
    label: label
  });

  try {
    const res = await fetch(`/api/samples?${params.toString()}`);
    const data = await res.json();
    renderDatasetTable(data);
  } catch (err) {
    console.error('Failed to load dataset samples:', err);
  }
}

function renderDatasetTable(data) {
  const tbody = document.getElementById('dataset-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.datasetTotalPages = data.total_pages;

  const pageInfo = document.getElementById('dataset-page-info');
  const pageNum = document.getElementById('dataset-page-num');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  if (pageInfo) {
    const start = (data.page - 1) * data.per_page + 1;
    const end = Math.min(data.page * data.per_page, data.total);
    pageInfo.textContent = data.total > 0
      ? `Showing ${start} - ${end} of ${data.total} questions (${state.activeSplit})`
      : 'No matching questions found';
  }

  if (pageNum) pageNum.textContent = data.page;
  if (btnPrev) btnPrev.disabled = data.page <= 1;
  if (btnNext) btnNext.disabled = data.page >= data.total_pages;

  if (data.samples.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No questions matched the criteria.</td></tr>`;
    return;
  }

  data.samples.forEach(q => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#111827] transition-colors';

    const goldenBadges = q.golden_answer.split(',').map(g => {
      const gClean = g.trim();
      const col = gClean === 'A' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
                  gClean === 'B' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                  gClean === 'C' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                  'bg-pink-500/15 text-pink-300 border-pink-500/30';
      return `<span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${col}">${gClean}</span>`;
    }).join(' ');

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-teal-400 font-bold whitespace-nowrap">${q.id}</td>
      <td class="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">Topic ${q.topic_id || '-'}</td>
      <td class="py-3 px-4 text-slate-200 max-w-md truncate" title="${q.target_event}">${q.target_event}</td>
      <td class="py-3 px-4 whitespace-nowrap">${goldenBadges}</td>
      <td class="py-3 px-4 whitespace-nowrap">
        <span class="px-2 py-0.5 rounded text-[10px] font-medium ${q.is_multi ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-[#1e293b] text-slate-400'}">
          ${q.is_multi ? 'Multi-Answer' : 'Single'}
        </span>
      </td>
      <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
        <button onclick="inspectSample('${q.id}')" class="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-teal-400 text-xs transition-colors">
          Inspect
        </button>
        <button onclick="loadSampleDirectlyToLab('${q.id}')" class="px-2.5 py-1 rounded btn-aquamarine text-white text-xs transition-colors">
          Load in Lab
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function prevDatasetPage() {
  if (state.datasetPage > 1) {
    loadDatasetPage(state.datasetPage - 1);
  }
}

function nextDatasetPage() {
  if (state.datasetPage < state.datasetTotalPages) {
    loadDatasetPage(state.datasetPage + 1);
  }
}

// -----------------------------------------------------------------------------
// SAMPLE INSPECTION MODAL
// -----------------------------------------------------------------------------
async function inspectSample(sampleId) {
  try {
    const res = await fetch(`/api/samples/${sampleId}?split=${state.activeSplit}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const modal = document.getElementById('sample-modal');
    const modalId = document.getElementById('sample-modal-id');
    const modalTitle = document.getElementById('sample-modal-title');
    const modalContent = document.getElementById('sample-modal-content');
    const loadBtn = document.getElementById('sample-modal-load-btn');

    if (modalId) modalId.textContent = data.question.id;
    if (modalTitle) modalTitle.textContent = `${data.topic} (${data.split})`;

    if (loadBtn) {
      loadBtn.onclick = () => {
        loadQuestionDataIntoLab(data);
        closeSampleModal();
        switchTab('playground');
      };
    }

    if (modalContent) {
      const q = data.question;
      const golden = q.golden_answer || '';
      const docs = data.documents || [];

      modalContent.innerHTML = `
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-teal-400">Target Event:</span>
          <div class="p-3 bg-[#070a12] rounded-xl border border-[#1e293b] text-slate-200 text-xs font-medium">
            ${q.target_event}
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Options:</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            ${['A', 'B', 'C', 'D'].map(opt => {
              const isGold = golden.includes(opt);
              return `
                <div class="p-3 rounded-xl border ${isGold ? 'bg-teal-950/30 border-teal-500/40 text-teal-200' : 'bg-[#070a12] border-[#1e293b] text-slate-300'}">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b]">Option ${opt}</span>
                    ${isGold ? '<span class="text-[10px] font-bold text-teal-400">✅ Golden Cause</span>' : ''}
                  </div>
                  <div>${q['option_' + opt] || '-'}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supporting Context Documents (${docs.length} docs):</span>
          <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
            ${docs.map((doc, idx) => `
              <div class="p-3 bg-[#070a12] rounded-xl border border-[#1e293b] space-y-1">
                <div class="flex items-center justify-between text-[11px] font-semibold text-teal-400">
                  <span>${doc.title || `Document ${idx+1}`}</span>
                  <span class="text-slate-500 text-[10px]">${doc.source || ''}</span>
                </div>
                <p class="text-[11px] text-slate-400 leading-relaxed">${doc.content || doc.snippet || ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    alert('Failed to inspect sample: ' + err.message);
  }
}

function closeSampleModal() {
  const modal = document.getElementById('sample-modal');
  if (modal) modal.classList.add('hidden');
}

async function loadSampleDirectlyToLab(sampleId) {
  try {
    const res = await fetch(`/api/samples/${sampleId}?split=${state.activeSplit}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    loadQuestionDataIntoLab(data);
    switchTab('playground');
  } catch (err) {
    alert('Failed to load sample: ' + err.message);
  }
}

function loadQuestionDataIntoLab(data) {
  const q = data.question;
  const docs = data.documents || [];

  const titleEl = document.getElementById('active-scenario-title');
  const badgeEl = document.getElementById('active-scenario-badge');
  const subEl = document.getElementById('active-scenario-sub');

  if (titleEl) titleEl.textContent = `Sample ${q.id}`;
  if (badgeEl) badgeEl.textContent = data.topic || 'Dataset Benchmark';
  if (subEl) subEl.textContent = `Golden Cause: [${q.golden_answer || 'A'}]`;

  const eventInput = document.getElementById('input-event');
  if (eventInput) eventInput.value = q.target_event;

  state.documents = docs.map(d => `${d.title || ''}\n${d.content || d.snippet || ''}`.trim());
  if (state.documents.length === 0) {
    state.documents = ['No supporting context document in bundle.'];
  }
  renderDocumentFields();

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const el = document.getElementById(`opt-${opt}`);
    if (el) el.value = q['option_' + opt] || '';
  });

  resetPlaygroundResults();
  triggerReasoning();
}

// -----------------------------------------------------------------------------
// BIAS & CLASS DISTRIBUTION CHARTS
// -----------------------------------------------------------------------------
async function loadDatasetStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    state.statsData = data;
    renderDistributionCharts();
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function renderDistributionCharts() {
  if (!state.statsData) return;
  const trainStats = state.statsData.train_data;

  // Chart 3: Single vs Multi-Answer Doughnut
  const ctxSingleMulti = document.getElementById('chart-single-multi')?.getContext('2d');
  if (ctxSingleMulti) {
    if (state.charts.singleMulti) state.charts.singleMulti.destroy();

    state.charts.singleMulti = new Chart(ctxSingleMulti, {
      type: 'doughnut',
      data: {
        labels: ['Single-Answer (57.28%)', 'Multi-Answer (42.72%)'],
        datasets: [{
          data: [trainStats.single_answer_count, trainStats.multi_answer_count],
          backgroundColor: ['#14b8a6', '#0f766e'],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  }

  // Chart 4: Option Frequency Bar Chart
  const ctxOptFreq = document.getElementById('chart-option-freq')?.getContext('2d');
  if (ctxOptFreq) {
    if (state.charts.optFreq) state.charts.optFreq.destroy();

    state.charts.optFreq = new Chart(ctxOptFreq, {
      type: 'bar',
      data: {
        labels: ['Option A', 'Option B', 'Option C', 'Option D'],
        datasets: [{
          label: 'Occurrence (%)',
          data: [
            trainStats.option_percentages.A,
            trainStats.option_percentages.B,
            trainStats.option_percentages.C,
            trainStats.option_percentages.D
          ],
          backgroundColor: ['#14b8a6', '#0d9488', '#0f766e', '#115e59'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: {
            min: 0,
            max: 50,
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8', callback: val => `${val}%` }
          }
        }
      }
    });
  }

  // Chart 5: Top Answer Combinations
  const ctxComb = document.getElementById('chart-combinations')?.getContext('2d');
  if (ctxComb) {
    if (state.charts.combinations) state.charts.combinations.destroy();

    const topCombs = trainStats.top_combinations || [];
    state.charts.combinations = new Chart(ctxComb, {
      type: 'bar',
      data: {
        labels: topCombs.map(c => `[${c.comb}]`),
        datasets: [{
          label: 'Sample Count',
          data: topCombs.map(c => c.count),
          backgroundColor: '#14b8a6',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
// ARCHITECTURE ROADMAP
// -----------------------------------------------------------------------------
async function loadRoadmap() {
  try {
    const res = await fetch('/api/roadmap');
    const data = await res.json();
    const container = document.getElementById('roadmap-container');
    if (!container || !data.iterations) return;
    container.innerHTML = '';

    data.iterations.forEach((item, idx) => {
      const isBaseline = idx === 0;
      const card = document.createElement('div');
      card.className = `p-5 rounded-xl border space-y-2 ${
        isBaseline
          ? 'bg-[#0d1322] border-teal-500/50 shadow-sm'
          : 'bg-[#070a12] border-[#1e293b]'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-sm text-teal-400">${item.version}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${
            isBaseline
              ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30'
              : 'bg-[#1e293b] text-slate-400'
          }">${item.status}</span>
        </div>
        <div class="font-semibold text-xs text-white">${item.name}</div>
        <p class="text-xs text-slate-400 leading-relaxed">${item.description}</p>
        <div class="text-[11px] pt-2 border-t border-[#1e293b] flex items-center justify-between">
          <span class="text-slate-400">Macro F1:</span>
          <span class="font-mono font-bold text-teal-400">${item.f1_score}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load roadmap:', err);
  }
}

// -----------------------------------------------------------------------------
// REST API SANDBOX CONSOLE
// -----------------------------------------------------------------------------
function setupApiConsole() {
  const reqBody = document.getElementById('api-req-body');
  if (!reqBody) return;

  const sampleReq = {
    event: "Over 14,000 corporate cloud instances crashed in synchronized failure across European datacenters.",
    documents: [
      "A kernel-level cybersecurity telemetry driver update contained an out-of-bounds memory read error.",
      "The update caused Windows kernel exceptions and crash loops at 04:09 UTC."
    ],
    options: {
      A: "A kernel-level cybersecurity driver update triggered fatal memory crash loops.",
      B: "A state-sponsored DDoS attack flooded edge gateways.",
      C: "Undersea fiber optic cables were severed by fishing trawlers.",
      D: "None of the others"
    },
    threshold: 0.50
  };

  reqBody.value = JSON.stringify(sampleReq, null, 2);
}

async function sendApiRequest() {
  const reqBodyEl = document.getElementById('api-req-body');
  const resBodyEl = document.getElementById('api-res-body');
  const statusEl = document.getElementById('api-status');

  try {
    const payload = JSON.parse(reqBodyEl.value);
    if (statusEl) {
      statusEl.textContent = 'Sending...';
      statusEl.className = 'text-xs font-mono text-teal-400';
    }

    const t0 = performance.now();
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const t1 = performance.now();

    const data = await res.json();
    if (statusEl) {
      statusEl.textContent = `${res.status} ${res.statusText} (${Math.round(t1 - t0)}ms)`;
      statusEl.className = res.ok ? 'text-xs font-mono text-teal-400 font-bold' : 'text-xs font-mono text-rose-400 font-bold';
    }

    if (resBodyEl) {
      resBodyEl.textContent = JSON.stringify(data, null, 2);
    }
  } catch (err) {
    if (resBodyEl) resBodyEl.textContent = 'JSON Parse or Network Error: ' + err.message;
    if (statusEl) {
      statusEl.textContent = 'Error';
      statusEl.className = 'text-xs font-mono text-rose-400 font-bold';
    }
  }
}

function copyCurlSnippet() {
  const reqBodyEl = document.getElementById('api-req-body');
  const jsonStr = reqBodyEl.value.replace(/'/g, "'\\''");
  const curl = `curl -X POST http://127.0.0.1:5005/api/predict \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonStr}'`;

  navigator.clipboard.writeText(curl).then(() => {
    alert('cURL command copied to clipboard!');
  }).catch(() => {
    alert('Please copy manually:\n' + curl);
  });
}

// -----------------------------------------------------------------------------
// IMAGE LIGHTBOX MODAL
// -----------------------------------------------------------------------------
function openImageModal(imgSrc, title) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');

  if (modalImg) modalImg.src = imgSrc;
  if (modalTitle) modalTitle.textContent = title;
  if (modal) modal.classList.remove('hidden');
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) modal.classList.add('hidden');
}
