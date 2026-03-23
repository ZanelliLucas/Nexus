/* ============================================
   NEXUS — Revenus
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initRevenusChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initDatePicker();
  initExport();
  initNouvelleTransaction();
});

/* ============================================
   1. REVENUS CHART
   ============================================ */

const REVENUS_DATA = {
  '7J': {
    labels: ['L 24', 'M 25', 'M 26', 'J 27', 'V 28', 'S 29', 'D 30'],
    bruts:  [8200, 10400, 9100, 12800, 10600, 15200, 13400],
    nets:   [6100, 7800,  6800, 9600,  7900,  11400, 10000],
  },
  '30J': {
    labels: ['S1', 'S2', 'S3', 'S4'],
    bruts:  [58000, 68000, 72000, 86591],
    nets:   [43000, 51000, 54000, 64800],
  },
  '90J': {
    labels: ['Sep', 'Oct', 'Nov'],
    bruts:  [218000, 253000, 284591],
    nets:   [163000, 189000, 213000],
  },
};

function initRevenusChart() {
  buildRevenusChart('7J');
}

function buildRevenusChart(period) {
  const chart = document.getElementById('revenusChart');
  if (!chart) return;

  const d    = REVENUS_DATA[period] || REVENUS_DATA['7J'];
  const maxV = Math.max(...d.bruts);

  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (d.bruts[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar secondary';
    b2.style.height = (d.nets[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';

    const fmt = (v) => v >= 1000 ? '€' + (v / 1000).toFixed(1) + 'k' : '€' + v;
    tip.innerHTML = `Brut : <b>${fmt(d.bruts[i])}</b> &nbsp;·&nbsp; Net : <b>${fmt(d.nets[i])}</b>`;

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
      buildRevenusChart(tab.textContent.trim());
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
   BOUTONS TOPBAR — Date picker, Export, Transaction
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
        const csv  = 'ID,Client,Montant,Source,Statut\n#TXN-8821,Acme Corp,€2 400,Abonnement,Complété\n#TXN-8820,Studio Delta,€890,Marketplace,Complété';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-revenus.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { transactions: [{ id: 'TXN-8821', client: 'Acme Corp', montant: 2400, source: 'Abonnement' }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-revenus.json';
        a.click();
      }
    });
  });
}

function initNouvelleTransaction() {
  const openBtn   = document.getElementById('transactionBtn');
  const modal     = document.getElementById('transactionModal');
  const closeBtn  = document.getElementById('transactionClose');
  const cancelBtn = document.getElementById('transactionCancelBtn');
  const createBtn = document.getElementById('transactionCreateBtn');
  if (!openBtn || !modal) return;

  const dateInput = document.getElementById('txDate');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  createBtn.addEventListener('click', () => {
    const desc    = document.getElementById('txDescription').value.trim();
    const montant = document.getElementById('txMontant').value;
    const type    = document.querySelector('input[name="txType"]:checked')?.value || 'Entrée';
    const source  = document.getElementById('txSource').value;
    const descInput = document.getElementById('txDescription');

    if (!desc) {
      descInput.style.borderColor = 'var(--red)';
      descInput.focus();
      return;
    }
    descInput.style.borderColor = '';

    createBtn.textContent = 'Enregistrement…';
    createBtn.disabled    = true;
    setTimeout(() => {
      close();
      createBtn.textContent = 'Enregistrer';
      createBtn.disabled    = false;
      descInput.value = '';
      document.getElementById('txMontant').value = '';
      const sign = type === 'Entrée' ? '+' : '-';
      const amt  = montant ? `€${parseFloat(montant).toFixed(2)}` : '';
      showToastNotif(`✓ Transaction "${desc}" (${sign}${amt} · ${source}) enregistrée`);
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
