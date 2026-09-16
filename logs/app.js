/* ============================================
   NEXUS — Logs
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initLogsVolumeChart();
  initChartTabs();
  initNavItems();
  initLiveUpdates();
  initFilters();
  initSearch();
  initClear();
  initDatePicker();
  initExport();
  initPauseBtn();
});

/* ============================================
   1. LOGS VOLUME CHART
   ============================================ */
const VOLUME_DATA = {
  '15min': {
    labels: NexusDates.lastTimes(8, 2),
    info:   [820,  940,  880,  1020, 960,  1140, 1080, 1200],
    warn:   [28,   34,   26,   42,   38,   48,   44,   52],
    error:  [2,    4,    3,    6,    4,    5,    3,    7],
  },
  '1H': {
    labels: NexusDates.lastTimes(7, 10),
    info:   [7200,  8400,  7800,  9100,  8600,  10200, 9800],
    warn:   [240,   280,   260,   310,   290,   340,   320],
    error:  [14,    18,    12,    24,    20,    28,    22],
  },
  '6H': {
    labels: NexusDates.lastTimes(7, 60, true),
    info:   [42000, 48000, 52000, 46000, 44000, 58000, 54000],
    warn:   [1400,  1600,  1800,  1500,  1480,  1940,  1820],
    error:  [80,    92,    104,   86,    84,    112,   96],
  },
};

function initLogsVolumeChart() { buildLogsVolumeChart('15min'); }

function buildLogsVolumeChart(period) {
  const chart = document.getElementById('logsVolumeChart');
  if (!chart) return;
  const d = VOLUME_DATA[period] || VOLUME_DATA['15min'];
  const maxV = Math.max(...d.info);
  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    // Stacked bars (error on top, warn, info at bottom)
    const bErr = document.createElement('div');
    bErr.className = 'bar-seg';
    bErr.style.cssText = 'background:var(--red); height:' + Math.max((d.error[i] / maxV * 130), 2) + 'px;';

    const bWarn = document.createElement('div');
    bWarn.className = 'bar-seg';
    bWarn.style.cssText = 'background:var(--amber); height:' + Math.max((d.warn[i] / maxV * 130), 2) + 'px;';

    const bInfo = document.createElement('div');
    bInfo.className = 'bar-seg';
    bInfo.style.cssText = 'background:var(--blue); height:' + (d.info[i] / maxV * 130) + 'px; border-radius: 2px 2px 0 0;';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    grp.appendChild(bErr);
    grp.appendChild(bWarn);
    grp.appendChild(bInfo);
    grp.appendChild(lbl);
    chart.appendChild(grp);
  });
}

/* ============================================
   2. CHART TABS
   ============================================ */
function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.chart-tabs');
      if (group) group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      buildLogsVolumeChart(tab.textContent.trim());
    });
  });
}

/* ============================================
   3. NAV ITEMS — délégation (sidebar injectée dynamiquement)
   ============================================ */
function initNavItems() {
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
   4. LIVE UPDATES — Simulation entrées en temps réel
   ============================================ */
const LOG_TEMPLATES = [
  { level: 'INFO',  svc: 'api-gateway',  msg: 'GET /api/v2/users 200 — 28ms' },
  { level: 'INFO',  svc: 'auth',         msg: 'Token validated for user #48291' },
  { level: 'INFO',  svc: 'database',     msg: 'Query executed — 12ms — SELECT users' },
  { level: 'WARN',  svc: 'sms',          msg: 'SMS delivery delayed — queue size 142' },
  { level: 'WARN',  svc: 'reporting',    msg: 'Report generation slow — 4.8s' },
  { level: 'ERROR', svc: 'sms',          msg: 'SMS Provider timeout after 30s' },
  { level: 'INFO',  svc: 'payment',      msg: 'Payment processed — TXN-8821 — EUR 2,990' },
  { level: 'INFO',  svc: 'api-gateway',  msg: 'POST /api/v2/orders 201 — 84ms' },
  { level: 'DEBUG', svc: 'database',     msg: 'Connection pool: 18/32 active' },
  { level: 'WARN',  svc: 'auth',         msg: 'Failed login attempt — IP 185.220.101.4' },
  { level: 'ERROR', svc: 'reporting',    msg: 'Job #4821 failed — OutOfMemoryError' },
  { level: 'INFO',  svc: 'api-gateway',  msg: 'DELETE /api/v2/sessions 204 — 14ms' },
  { level: 'INFO',  svc: 'database',     msg: 'Index scan: orders_by_date — 8ms' },
  { level: 'DEBUG', svc: 'auth',         msg: 'Session refreshed — user #12048' },
  { level: 'WARN',  svc: 'payment',      msg: 'Retry attempt 2/3 for TXN-9031' },
];

let _totalCount  = 284910;
let _errorCount  = 47;
let _warnCount   = 312;
let _allLogs     = [];
let _activeLevel = 'ALL';
let _activeSvc   = 'ALL';
let _searchQuery = '';

function pad(n) { return String(n).padStart(2, '0'); }

function makeEntry(tpl, date) {
  const ts = date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate())
           + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  return { level: tpl.level, svc: tpl.svc, msg: tpl.msg, ts };
}

function initLiveUpdates() {
  // Seed 50 initial logs
  for (let i = 49; i >= 0; i--) {
    const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    _allLogs.push(makeEntry(tpl, new Date(Date.now() - i * 1200 - Math.random() * 600)));
  }
  renderTerminal();

  setInterval(() => {
    if (window._nexusPaused) return;
    const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const entry = makeEntry(tpl, new Date());
    _allLogs.unshift(entry);
    if (_allLogs.length > 300) _allLogs.pop();

    _totalCount += Math.floor(Math.random() * 4) + 1;
    if (tpl.level === 'ERROR') _errorCount++;
    if (tpl.level === 'WARN')  _warnCount++;

    const totalEl = document.getElementById('totalLogs');
    const errEl   = document.getElementById('errorCount');
    const warnEl  = document.getElementById('warnCount');
    if (totalEl) totalEl.textContent = _totalCount.toLocaleString('fr-FR');
    if (errEl)   errEl.textContent   = _errorCount;
    if (warnEl)  warnEl.textContent  = _warnCount;

    renderTerminal();
  }, 1800);
}

function renderTerminal() {
  const inner = document.getElementById('terminalInner');
  if (!inner) return;

  const filtered = _allLogs.filter(e => {
    if (_activeLevel !== 'ALL' && e.level !== _activeLevel) return false;
    if (_activeSvc   !== 'ALL' && e.svc   !== _activeSvc)   return false;
    if (_searchQuery && !e.msg.toLowerCase().includes(_searchQuery)
                     && !e.svc.toLowerCase().includes(_searchQuery)) return false;
    return true;
  }).slice(0, 100);

  const countEl = document.getElementById('logCount');
  if (countEl) countEl.textContent = 'Affichage de ' + filtered.length + ' entrées';

  // CSS classes from style.css: .log-line, .log-error, .log-warn, .log-debug
  // .log-ts, .log-lvl, .log-lvl-info/warn/error/debug, .log-svc, .log-msg
  const lvlClass = { INFO: 'log-lvl-info', WARN: 'log-lvl-warn', ERROR: 'log-lvl-error', DEBUG: 'log-lvl-debug' };
  const lineClass = { ERROR: 'log-error', WARN: 'log-warn', DEBUG: 'log-debug' };

  const wasAtBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 20;

  inner.innerHTML = filtered.map(e =>
    '<div class="log-line ' + (lineClass[e.level] || '') + '">'
    + '<span class="log-ts">' + e.ts + '&nbsp;&nbsp;</span>'
    + '<span class="log-lvl ' + (lvlClass[e.level] || '') + '">[' + e.level.padEnd(5) + ']&nbsp;</span>'
    + '<span class="log-svc">' + e.svc.padEnd(14) + '&nbsp;</span>'
    + '<span class="log-msg">' + e.msg + '</span>'
    + '</div>'
  ).join('');

  if (wasAtBottom) inner.scrollTop = inner.scrollHeight;
}

/* ============================================
   5. FILTRES niveau & service
   ============================================ */
function initFilters() {
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeLevel = btn.dataset.level;
      renderTerminal();
    });
  });

  const svcFilter = document.getElementById('svcFilter');
  if (svcFilter) {
    svcFilter.addEventListener('change', () => {
      _activeSvc = svcFilter.value;
      renderTerminal();
    });
  }
}

/* ============================================
   6. SEARCH
   ============================================ */
function initSearch() {
  const input = document.getElementById('logSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    _searchQuery = input.value.toLowerCase().trim();
    renderTerminal();
  });
}

/* ============================================
   7. CLEAR
   ============================================ */
function initClear() {
  const btn = document.getElementById('clearBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    _allLogs = [];
    renderTerminal();
    showToastNotif('Terminal effacé');
  });
}

/* ============================================
   8. DATE PICKER
   ============================================ */
function initDatePicker() {
  const btn       = document.getElementById('dateRangeBtn');
  const popup     = document.getElementById('datePickerPopup');
  const label     = document.getElementById('dateRangeLabel');
  const presets   = document.querySelectorAll('.dp-preset');
  const applyBtn  = document.getElementById('dpApply');
  const cancelBtn = document.getElementById('dpCancel');
  const startIn   = document.getElementById('dpStart');
  const endIn     = document.getElementById('dpEnd');
  if (!btn || !popup) return;

  const today = toLocalISODate(new Date());
  if (startIn) startIn.value = today;
  if (endIn)   endIn.value   = today;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });
  popup.addEventListener('click', e => e.stopPropagation());

  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const days = parseInt(p.dataset.days);
      const end = new Date(), start = new Date();
      if (days > 0) start.setDate(end.getDate() - days);
      startIn.value = toLocalISODate(start);
      endIn.value   = toLocalISODate(end);
    });
  });

  applyBtn.addEventListener('click', () => {
    const ap = document.querySelector('.dp-preset.active');
    if (ap && ap.dataset.label) {
      label.textContent = ap.dataset.label;
    } else {
      const s = new Date(startIn.value + 'T00:00'), e = new Date(endIn.value + 'T00:00'); if (isNaN(s) || isNaN(e) || s > e) { showToastNotif('Période invalide : vérifiez les dates'); return; }
      const fmt = d => d.toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'});
      label.textContent = fmt(s) + ' — ' + fmt(e);
    }
    popup.style.display = 'none';
    showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

/* ============================================
   9. EXPORT
   ============================================ */
function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;
  const menu = document.createElement('div');
  menu.className     = 'export-menu';
  menu.style.display = 'none';
  menu.innerHTML = '<div class="export-item" data-fmt="CSV">Exporter en CSV</div>'
                 + '<div class="export-item" data-fmt="JSON">Exporter en JSON</div>';
  btn.parentElement.appendChild(menu);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  menu.addEventListener('click', e => e.stopPropagation());

  menu.querySelectorAll('.export-item').forEach(item => {
    item.addEventListener('click', () => {
      const fmt = item.dataset.fmt;
      menu.style.display = 'none';
      showToastNotif('Export ' + fmt + ' en cours...');
      const visible = _allLogs.slice(0, 100);
      if (fmt === 'CSV') {
        const csv = 'Timestamp,Level,Service,Message\n'
          + visible.map(e => '"' + e.ts + '","' + e.level + '","' + e.svc + '","' + e.msg + '"').join('\n');
        const blob = new Blob([csv], {type:'text/csv'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-logs.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const blob = new Blob([JSON.stringify(visible, null, 2)], {type:'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-logs.json';
        a.click();
      }
    });
  });
}

/* ============================================
   10. PAUSE BUTTON
   ============================================ */
function initPauseBtn() {
  const btn       = document.getElementById('pauseBtn');
  const liveBadge = document.getElementById('liveBadge');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window._nexusPaused = !window._nexusPaused;
    if (window._nexusPaused) {
      btn.textContent = 'Reprendre';
      btn.classList.add('active');
      if (liveBadge) liveBadge.classList.add('paused');
      showToastNotif('Live updates en pause');
    } else {
      btn.textContent = 'Pause';
      btn.classList.remove('active');
      if (liveBadge) liveBadge.classList.remove('paused');
      showToastNotif('Live updates reprises');
    }
  });
}

/* ============================================
   TOAST
   ============================================ */
let _toastTimer = null;
function showToastNotif(msg) {
  const t = document.getElementById('toastNotif');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* Date locale au format AAAA-MM-JJ (toISOString renvoie la date UTC) */
function toLocalISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
