/* ============================================
   NEXUS — Performance
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initUptimeDots();
  initLatencyChart();
  initChartTabs();
  initNavItems();
  initLiveUpdates();
  initDatePicker();
  initExport();
  initPauseBtn();
});

/* ============================================
   1. UPTIME DOTS
   ============================================ */
function initUptimeDots() {
  const container = document.getElementById('uptimeDots');
  if (!container) return;
  const issues = new Set([14, 28, 47, 62, 71]);
  const partial = new Set([8, 31, 55, 80]);
  for (let i = 0; i < 90; i++) {
    const dot = document.createElement('div');
    dot.className = 'uptime-dot';
    if (issues.has(i)) { dot.style.background = 'var(--red)'; dot.title = `Jour -${90-i}: Incident`; }
    else if (partial.has(i)) { dot.style.background = 'var(--amber)'; dot.title = `Jour -${90-i}: Dégradé`; }
    else { dot.style.background = 'var(--green)'; dot.style.opacity = '0.7'; dot.title = `Jour -${90-i}: OK`; }
    container.appendChild(dot);
  }
}

/* ============================================
   2. LATENCY CHART
   ============================================ */
const LATENCY_DATA = {
  '1H':  { labels: NexusDates.lastTimes(7, 10), p50: [28,32,26,35,29,24,30], p95: [72,88,64,98,80,68,84],   p99: [148,184,132,210,168,140,172] },
  '6H':  { labels: NexusDates.lastTimes(7, 60), p50: [24,28,38,42,30,26,30], p95: [60,72,104,118,82,74,84],  p99: [122,148,214,248,172,152,172] },
  '24H': { labels: NexusDates.lastTimes(7, 180, true), p50: [18,20,35,44,31,28,22], p95: [44,52,92,120,86,74,60],   p99: [88,108,188,252,178,152,122] },
};

function initLatencyChart() { buildLatencyChart('1H'); }

function buildLatencyChart(period) {
  const container = document.getElementById('latencyChart');
  if (!container) return;
  const d = LATENCY_DATA[period] || LATENCY_DATA['1H'];
  const h = 180, w = container.clientWidth || 300, max = Math.max(...d.p99) * 1.1, n = d.labels.length;
  const toX = i => (i / (n-1)) * w;
  const toY = v => h - (v / max * h);
  const buildPath = vals => vals.map((v,i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  container.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible;">
    <defs>
      <linearGradient id="lp99" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EF4444" stop-opacity=".12"/><stop offset="100%" stop-color="#EF4444" stop-opacity="0"/></linearGradient>
      <linearGradient id="lp95" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3B82F6" stop-opacity=".12"/><stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/></linearGradient>
      <linearGradient id="lp50" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22C55E" stop-opacity=".15"/><stop offset="100%" stop-color="#22C55E" stop-opacity="0"/></linearGradient>
    </defs>
    ${[0.25,0.5,0.75].map(pct=>`<line x1="0" y1="${(h*pct).toFixed(0)}" x2="${w}" y2="${(h*pct).toFixed(0)}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`).join('')}
    <path d="${buildPath(d.p99)} L${w},${h} L0,${h} Z" fill="url(#lp99)"/>
    <path d="${buildPath(d.p95)} L${w},${h} L0,${h} Z" fill="url(#lp95)"/>
    <path d="${buildPath(d.p50)} L${w},${h} L0,${h} Z" fill="url(#lp50)"/>
    <path d="${buildPath(d.p99)}" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${buildPath(d.p95)}" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${buildPath(d.p50)}" fill="none" stroke="#22C55E" stroke-width="2"   stroke-linejoin="round"/>
    <circle cx="${toX(n-1).toFixed(1)}" cy="${toY(d.p99[n-1]).toFixed(1)}" r="3" fill="#EF4444"/>
    <circle cx="${toX(n-1).toFixed(1)}" cy="${toY(d.p95[n-1]).toFixed(1)}" r="3" fill="#3B82F6"/>
    <circle cx="${toX(n-1).toFixed(1)}" cy="${toY(d.p50[n-1]).toFixed(1)}" r="3" fill="#22C55E"/>
    ${d.labels.map((lbl,i)=>`<text x="${toX(i).toFixed(1)}" y="${h+16}" text-anchor="middle" fill="#71717A" font-size="9" font-family="'JetBrains Mono',monospace">${lbl}</text>`).join('')}
  </svg>`;
}

/* ============================================
   3. CHART TABS
   ============================================ */
function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.chart-tabs');
      if (group) group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      buildLatencyChart(tab.textContent.trim());
    });
  });
}

/* ============================================
   4. LIVE UPDATES
   ============================================ */
function initLiveUpdates() {
  function jitter(base, range) { return Math.round(base + (Math.random() - 0.5) * range); }
  function updateArc(id, pct) { const el = document.getElementById(id); if (el) el.setAttribute('stroke-dashoffset', (201 * (1 - pct / 100)).toFixed(1)); }
  function updateText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function tick() {
    if (window._nexusPaused) return;
    const cpu = jitter(62, 8), mem = jitter(74, 4), net = jitter(58, 10);
    updateArc('cpuArc', cpu); updateArc('memArc', mem); updateArc('netArc', net);
    updateText('cpuVal', cpu); updateText('memVal', mem); updateText('netVal', net);
    updateText('cpuPct', cpu+'%'); updateText('memPct', mem+'%'); updateText('netPct', net+'%');
    updateText('rpsValue', jitter(2841, 120).toLocaleString('fr-FR'));
    updateText('netIn',  (jitter(1840,80)/1000).toFixed(2)+' GB/s');
    updateText('netOut', (jitter(920,60)/1000).toFixed(2)+' GB/s');
  }
  setInterval(tick, 2000);
}

/* ============================================
   5. NAV ITEMS
   ============================================ */
function initNavItems() {
  // Délégation sur le parent stable : les .sb-item sont injectés dynamiquement par sidebar.js
  const sidebar = document.querySelector('aside.sidebar');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const item = e.target.closest('.sb-item');
    if (!item) return;
    if (!item.getAttribute('href') || item.getAttribute('href') === '#') {
      sidebar.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
  });
}

/* ============================================
   6. TOPBAR — Date picker, Export, Pause
   ============================================ */
function initDatePicker() {
  const btn = document.getElementById('dateRangeBtn'), popup = document.getElementById('datePickerPopup');
  const label = document.getElementById('dateRangeLabel'), presets = document.querySelectorAll('.dp-preset');
  const applyBtn = document.getElementById('dpApply'), cancelBtn = document.getElementById('dpCancel');
  const startIn = document.getElementById('dpStart'), endIn = document.getElementById('dpEnd');
  if (!btn || !popup) return;

  const today = toLocalISODate(new Date());
  if (startIn) startIn.value = today;
  if (endIn)   endIn.value   = today;

  btn.addEventListener('click', (e) => { e.stopPropagation(); popup.style.display = popup.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });
  popup.addEventListener('click', e => e.stopPropagation());

  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(x => x.classList.remove('active')); p.classList.add('active');
      const days = parseInt(p.dataset.days), end = new Date(), start = new Date();
      if (days > 0) start.setDate(end.getDate() - days);
      startIn.value = toLocalISODate(start); endIn.value = toLocalISODate(end);
    });
  });

  applyBtn.addEventListener('click', () => {
    const ap = document.querySelector('.dp-preset.active');
    if (ap?.dataset.label) { label.textContent = ap.dataset.label; }
    else { const s = new Date(startIn.value + 'T00:00'), e = new Date(endIn.value + 'T00:00'); if (isNaN(s) || isNaN(e) || s > e) { showToastNotif('Période invalide : vérifiez les dates'); return; } const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}); label.textContent = fmt(s)+' — '+fmt(e); }
    popup.style.display = 'none'; showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;
  const menu = document.createElement('div'); menu.className = 'export-menu'; menu.style.display = 'none';
  menu.innerHTML = `<div class="export-item" data-fmt="CSV">📊 Métriques en CSV</div><div class="export-item" data-fmt="JSON">📋 Métriques en JSON</div>`;
  btn.parentElement.appendChild(menu);
  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  menu.addEventListener('click', e => e.stopPropagation());
  menu.querySelectorAll('.export-item').forEach(item => {
    item.addEventListener('click', () => {
      const fmt = item.dataset.fmt; menu.style.display = 'none'; showToastNotif(`✓ Export ${fmt} en cours…`);
      if (fmt === 'CSV') { const csv = 'Métrique,Valeur,Unité\nUptime,99.94,%\nLatence P50,30,ms\nLatence P95,84,ms\nRPS,2841,req/s'; const blob = new Blob([csv],{type:'text/csv'}); const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nexus-performance.csv'; a.click(); }
      else if (fmt === 'JSON') { const data = {uptime:99.94,latence:{p50:30,p95:84,p99:172},rps:2841}; const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nexus-performance.json'; a.click(); }
    });
  });
}

function initPauseBtn() {
  const btn = document.getElementById('pauseBtn');
  const liveBadge = document.getElementById('liveBadge');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window._nexusPaused = !window._nexusPaused;
    if (window._nexusPaused) {
      btn.textContent = '▶ Reprendre'; btn.style.color = 'var(--amber)'; btn.style.borderColor = 'rgba(245,158,11,0.3)';
      if (liveBadge) liveBadge.style.opacity = '0.4';
      showToastNotif('⏸ Live updates en pause');
    } else {
      btn.textContent = '⏸ Pause'; btn.style.color = ''; btn.style.borderColor = '';
      if (liveBadge) liveBadge.style.opacity = '1';
      showToastNotif('▶ Live updates reprises');
    }
  });
}

let _toastTimer = null;
function showToastNotif(msg) {
  const t = document.getElementById('toastNotif');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* Date locale au format AAAA-MM-JJ (toISOString renvoie la date UTC) */
function toLocalISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
