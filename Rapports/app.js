/* ============================================
   NEXUS — Rapports
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initRapportsChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initDatePicker();
  initExport();
  initRapport();
});

/* ============================================
   1. RAPPORTS CHART — Génération dynamique
   ============================================ */

const RAPPORTS_DATA = {
  '7J': {
    labels:    NexusDates.last7(),
    generes:   [48, 62, 55, 71, 58, 80, 74],
    planifies: [12, 18, 14, 22, 16, 20, 18],
  },
  '30J': {
    labels:    ['S1', 'S2', 'S3', 'S4'],
    generes:   [280, 320, 295, 389],
    planifies: [60, 75, 68, 82],
  },
  '90J': {
    labels:    NexusDates.lastMonths(3),
    generes:   [940, 1080, 1284],
    planifies: [210, 245, 280],
  },
};

function initRapportsChart() {
  buildRapportsChart('7J');
}

function buildRapportsChart(period) {
  const chart = document.getElementById('rapportsChart');
  if (!chart) return;

  const d    = RAPPORTS_DATA[period] || RAPPORTS_DATA['7J'];
  const maxV = Math.max(...d.generes);

  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (d.generes[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar secondary';
    b2.style.height = (d.planifies[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = `Générés : <b>${d.generes[i]}</b> &nbsp;·&nbsp; Planifiés : <b>${d.planifies[i]}</b>`;

    grp.appendChild(b1);
    grp.appendChild(b2);
    grp.appendChild(lbl);
    grp.appendChild(tip);
    chart.appendChild(grp);
  });
}

/* ============================================
   2. CHART TABS
   ============================================ */
function initChartTabs() {
  const tabs = document.querySelectorAll('.chart-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.chart-tabs');
      if (group) {
        group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      }
      tab.classList.add('active');
      buildRapportsChart(tab.textContent.trim());
    });
  });
}

/* ============================================
   3. TABLE ROWS — Actions au clic
   ============================================ */
function initTableRows() {
  const rows = document.querySelectorAll('tbody tr');

  rows.forEach(row => {
    row.addEventListener('click', () => {
      // Retirer la sélection des autres lignes
      rows.forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
    });
  });
}

/* ============================================
   4. NAV ITEMS
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
   BOUTONS TOPBAR — Date picker, Export, Rapport
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
      const days  = parseInt(p.dataset.days);
      const end   = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      startIn.value = toLocalISODate(start);
      endIn.value   = toLocalISODate(end);
    });
  });

  applyBtn.addEventListener('click', () => {
    const s   = new Date(startIn.value);
    const e   = new Date(endIn.value);
    const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    label.textContent   = fmt(s) + ' — ' + fmt(e);
    popup.style.display = 'none';
    showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;

  const menu = document.createElement('div');
  menu.className     = 'export-menu';
  menu.style.display = 'none';
  menu.innerHTML = `
    <div class="export-item" data-fmt="CSV">📊 Exporter en CSV</div>
    <div class="export-item" data-fmt="JSON">📋 Exporter en JSON</div>`;
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
      showToastNotif(`✓ Export ${fmt} en cours…`);
      if (fmt === 'CSV') {
        const csv  = 'Rapport,Type,Statut,Date\nRapport Mensuel,Exécutif,Livré,' + NexusDates.fmt('{iso:0}') + '\nAnalyse Trafic,Analytique,Livré,' + NexusDates.fmt('{iso:-3}');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-rapports.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { rapports: [{ nom: 'Rapport Mensuel', type: 'Exécutif', statut: 'Livré' }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-rapports.json';
        a.click();
      }
    });
  });
}

function initRapport() {
  const openBtn   = document.getElementById('rapportBtn');
  const modal     = document.getElementById('rapportModal');
  const closeBtn  = document.getElementById('rapportClose');
  const cancelBtn = document.getElementById('rapportCancelBtn');
  const genBtn    = document.getElementById('rapportGenBtn');
  if (!openBtn || !modal) return;

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  genBtn.addEventListener('click', () => {
    const nom      = document.getElementById('rapportNom').value || 'Rapport';
    const type     = document.getElementById('rapportType').value;
    const fmt      = document.querySelector('input[name="fmt"]:checked')?.value || 'PDF';
    const schedule = document.getElementById('rapportSchedule').value;
    genBtn.textContent = 'Création…';
    genBtn.disabled    = true;
    setTimeout(() => {
      close();
      genBtn.textContent = 'Créer le rapport';
      genBtn.disabled    = false;
      const msg = schedule === 'Une seule fois'
        ? `✓ "${nom}" (${type} · ${fmt}) créé`
        : `✓ "${nom}" planifié · ${schedule}`;
      showToastNotif(msg);
    }, 1200);
  });
}

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
