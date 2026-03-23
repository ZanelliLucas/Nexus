/* ============================================
   NEXUS — Clients
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initClientsChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initDatePicker();
  initExport();
  initNouveauClient();
});

/* ============================================
   1. CLIENTS CHART — Acquisitions vs Churns
   ============================================ */

const CLIENTS_DATA = {
  '7J': {
    labels:   ['L 24', 'M 25', 'M 26', 'J 27', 'V 28', 'S 29', 'D 30'],
    nouveaux: [48,  62,  41,  74,  58,  88,  72],
    churns:   [8,   11,  7,   12,  9,   6,   10],
  },
  '30J': {
    labels:   ['S1',  'S2',  'S3',  'S4'],
    nouveaux: [280,   340,   298,   366],
    churns:   [42,    58,    49,    61],
  },
  '90J': {
    labels:   ['Sep', 'Oct', 'Nov'],
    nouveaux: [920,   1060,  1284],
    churns:   [148,   172,   196],
  },
};

function initClientsChart() {
  buildClientsChart('7J');
}

function buildClientsChart(period) {
  const chart = document.getElementById('clientsChart');
  if (!chart) return;

  const d    = CLIENTS_DATA[period] || CLIENTS_DATA['7J'];
  const maxV = Math.max(...d.nouveaux);

  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (d.nouveaux[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar churn';
    b2.style.height = (d.churns[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = `Nouveaux : <b>${d.nouveaux[i]}</b> &nbsp;·&nbsp; Churns : <b>${d.churns[i]}</b>`;

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
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.chart-tabs');
      if (group) group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      buildClientsChart(tab.textContent.trim());
    });
  });
}

/* ============================================
   3. TABLE ROWS
   ============================================ */
function initTableRows() {
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach(row => {
    row.addEventListener('click', () => {
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
   BOUTONS TOPBAR — Date picker, Export, Client
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
      const days = parseInt(p.dataset.days);
      const end  = new Date(), start = new Date();
      start.setDate(end.getDate() - days);
      startIn.value = start.toISOString().slice(0, 10);
      endIn.value   = end.toISOString().slice(0, 10);
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
    <div class="export-item" data-fmt="JSON">📋 Exporter en JSON</div>
    <div class="export-item" data-fmt="PDF">📄 Exporter en PDF</div>`;
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
        const csv  = 'Nom,Email,Plan,LTV,Statut\nSophie Martin,sophie@acme.com,Enterprise,€8 400,Actif\nJulien Morel,j.morel@beta.io,Pro,€3 200,Actif';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-clients.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { clients: [{ nom: 'Sophie Martin', email: 'sophie@acme.com', plan: 'Enterprise', ltv: 8400 }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-clients.json';
        a.click();
      }
    });
  });
}

function initNouveauClient() {
  const openBtn   = document.getElementById('clientBtn');
  const modal     = document.getElementById('clientModal');
  const closeBtn  = document.getElementById('clientClose');
  const cancelBtn = document.getElementById('clientCancelBtn');
  const createBtn = document.getElementById('clientCreateBtn');
  if (!openBtn || !modal) return;

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  createBtn.addEventListener('click', () => {
    const nom      = document.getElementById('clientNom').value.trim();
    const email    = document.getElementById('clientEmail').value.trim();
    const plan     = document.getElementById('clientPlan').value;
    const nomInput = document.getElementById('clientNom');

    if (!nom) {
      nomInput.style.borderColor = 'var(--red)';
      nomInput.focus();
      return;
    }
    nomInput.style.borderColor = '';

    createBtn.textContent = 'Création…';
    createBtn.disabled    = true;
    setTimeout(() => {
      close();
      createBtn.textContent = 'Créer le client';
      createBtn.disabled    = false;
      nomInput.value = '';
      document.getElementById('clientEmail').value = '';
      document.getElementById('clientLoc').value = '';
      showToastNotif(`✓ Client "${nom}" (${plan}) créé`);
    }, 900);
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
