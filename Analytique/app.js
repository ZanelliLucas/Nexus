/* ============================================
   NEXUS — Analytique
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTrafficChart();
  initChartTabs();
  initNavItems();
  initDatePicker();
  initExport();
  initRapport();
});

const TRAFFIC_DATA = {
  '7J': {
    labels:   ['L 24', 'M 25', 'M 26', 'J 27', 'V 28', 'S 29', 'D 30'],
    sessions: [32, 41, 38, 52, 44, 61, 55],
    uniques:  [22, 29, 27, 38, 31, 44, 40],
  },
  '30J': {
    labels:   ['S1', 'S2', 'S3', 'S4'],
    sessions: [148, 172, 160, 194],
    uniques:  [110, 128, 118, 142],
  },
  '90J': {
    labels:   ['Jan', 'Fév', 'Mar'],
    sessions: [520, 610, 680],
    uniques:  [390, 460, 510],
  },
};

function initTrafficChart() { buildTrafficChart('7J'); }

function buildTrafficChart(period) {
  const chart = document.getElementById('trafficChart');
  if (!chart) return;
  const d = TRAFFIC_DATA[period] || TRAFFIC_DATA['7J'];
  const maxV = Math.max(...d.sessions);
  chart.innerHTML = '';
  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';
    const b1 = document.createElement('div'); b1.className = 'bar primary'; b1.style.height = (d.sessions[i] / maxV * 140) + 'px';
    const b2 = document.createElement('div'); b2.className = 'bar secondary'; b2.style.height = (d.uniques[i] / maxV * 140) + 'px';
    const lbl = document.createElement('span'); lbl.className = 'bar-label'; lbl.textContent = label;
    const tip = document.createElement('div'); tip.className = 'tooltip';
    tip.innerHTML = `Sessions : <b>${d.sessions[i]}k</b> &nbsp;·&nbsp; Uniques : <b>${d.uniques[i]}k</b>`;
    grp.appendChild(b1); grp.appendChild(b2); grp.appendChild(lbl); grp.appendChild(tip);
    chart.appendChild(grp);
  });
}

function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.chart-tabs');
      if (group) group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      buildTrafficChart(tab.textContent.trim());
    });
  });
}

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

function initDatePicker() {
  const btn = document.getElementById('dateRangeBtn'), popup = document.getElementById('datePickerPopup');
  const label = document.getElementById('dateRangeLabel'), presets = document.querySelectorAll('.dp-preset');
  const applyBtn = document.getElementById('dpApply'), cancelBtn = document.getElementById('dpCancel');
  const startIn = document.getElementById('dpStart'), endIn = document.getElementById('dpEnd');
  if (!btn || !popup) return;
  btn.addEventListener('click', (e) => { e.stopPropagation(); popup.style.display = popup.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });
  popup.addEventListener('click', e => e.stopPropagation());
  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(x => x.classList.remove('active')); p.classList.add('active');
      const days = parseInt(p.dataset.days), end = new Date(), start = new Date();
      start.setDate(end.getDate() - days); startIn.value = start.toISOString().slice(0, 10); endIn.value = end.toISOString().slice(0, 10);
    });
  });
  applyBtn.addEventListener('click', () => {
    const s = new Date(startIn.value), e = new Date(endIn.value);
    const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    label.textContent = fmt(s) + ' — ' + fmt(e); popup.style.display = 'none'; showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;
  const menu = document.createElement('div'); menu.className = 'export-menu'; menu.style.display = 'none';
  menu.innerHTML = `<div class="export-item" data-fmt="CSV">📊 Exporter en CSV</div><div class="export-item" data-fmt="JSON">📋 Exporter en JSON</div><div class="export-item" data-fmt="PDF">📄 Exporter en PDF</div>`;
  btn.parentElement.appendChild(menu);
  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  menu.addEventListener('click', e => e.stopPropagation());
  menu.querySelectorAll('.export-item').forEach(item => {
    item.addEventListener('click', () => {
      const fmt = item.dataset.fmt; menu.style.display = 'none'; showToastNotif(`✓ Export ${fmt} en cours…`);
      if (fmt === 'CSV') { const csv = 'Métrique,Valeur\nSessions,248391\nRebond,38.4%'; const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nexus-analytique.csv'; a.click(); }
      else if (fmt === 'JSON') { const data = { periode: 'Mar 2025', kpi: { sessions: 248391, rebond: 38.4 } }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nexus-analytique.json'; a.click(); }
    });
  });
}

function initRapport() {
  const openBtn = document.getElementById('rapportBtn'), modal = document.getElementById('rapportModal');
  const closeBtn = document.getElementById('rapportClose'), cancelBtn = document.getElementById('rapportCancelBtn'), genBtn = document.getElementById('rapportGenBtn');
  if (!openBtn || !modal) return;
  const open = () => { modal.style.display = 'flex'; }, close = () => { modal.style.display = 'none'; };
  openBtn.addEventListener('click', open); closeBtn.addEventListener('click', close); cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  genBtn.addEventListener('click', () => {
    const nom = document.getElementById('rapportNom').value || 'Rapport';
    const type = document.getElementById('rapportType').value;
    const fmt = document.querySelector('input[name="fmt"]:checked')?.value || 'PDF';
    genBtn.textContent = 'Génération…'; genBtn.disabled = true;
    setTimeout(() => { close(); genBtn.textContent = 'Générer'; genBtn.disabled = false; showToastNotif(`✓ "${nom}" (${type} · ${fmt}) généré`); }, 1200);
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
