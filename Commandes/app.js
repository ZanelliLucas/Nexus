/* ============================================
   NEXUS — Commandes
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCommandesChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initSearch();
  initDatePicker();
  initExport();
  initNouvelleCommande();
});

/* ============================================
   1. COMMANDES CHART
   ============================================ */

const COMMANDES_DATA = {
  '7J': {
    labels:   NexusDates.last7(),
    recues:   [82,  108, 94,  138, 120, 162, 144],
    livrees:  [74,   96, 86,  122, 108, 148, 132],
  },
  '30J': {
    labels:   ['S1', 'S2', 'S3', 'S4'],
    recues:   [620, 740, 680, 978],
    livrees:  [586, 700, 644, 908],
  },
  '90J': {
    labels:   NexusDates.lastMonths(3),
    recues:   [2400, 2720, 3018],
    livrees:  [2288, 2592, 2938],
  },
};

function initCommandesChart() {
  buildCommandesChart('7J');
}

function buildCommandesChart(period) {
  const chart = document.getElementById('commandesChart');
  if (!chart) return;

  const d    = COMMANDES_DATA[period] || COMMANDES_DATA['7J'];
  const maxV = Math.max(...d.recues);

  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (d.recues[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar secondary';
    b2.style.height = (d.livrees[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v;
    tip.innerHTML = `Reçues : <b>${fmt(d.recues[i])}</b> &nbsp;·&nbsp; Livrées : <b>${fmt(d.livrees[i])}</b>`;

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
      buildCommandesChart(tab.textContent.trim());
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
   4. SEARCH FILTER
   ============================================ */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('#commandesBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
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
   BOUTONS TOPBAR — Date picker, Export, Commande
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
        const csv  = 'ID,Client,Montant,Transporteur,Statut\n#CMD-4821,Acme Corp,€2 400,Chronopost,Livrée\n#CMD-4820,Studio Delta,€890,Colissimo,Expédiée';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-commandes.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { commandes: [{ id: 'CMD-4821', client: 'Acme Corp', montant: 2400, transporteur: 'Chronopost', statut: 'Livrée' }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-commandes.json';
        a.click();
      }
    });
  });
}

function initNouvelleCommande() {
  const openBtn   = document.getElementById('commandeBtn');
  const modal     = document.getElementById('commandeModal');
  const closeBtn  = document.getElementById('commandeClose');
  const cancelBtn = document.getElementById('commandeCancelBtn');
  const createBtn = document.getElementById('commandeCreateBtn');
  if (!openBtn || !modal) return;

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  createBtn.addEventListener('click', () => {
    const client      = document.getElementById('commandeClient').value.trim();
    const produit     = document.getElementById('commandeProduit').value.trim();
    const montant     = document.getElementById('commandeMontant').value;
    const transporteur= document.getElementById('commandeTransporteur').value;
    const statut      = document.querySelector('input[name="commandeStatut"]:checked')?.value || 'En préparation';
    const clientInput = document.getElementById('commandeClient');

    if (!client) {
      clientInput.style.borderColor = 'var(--red)';
      clientInput.focus();
      return;
    }
    clientInput.style.borderColor = '';

    createBtn.textContent = 'Création…';
    createBtn.disabled    = true;
    setTimeout(() => {
      close();
      createBtn.textContent = 'Créer la commande';
      createBtn.disabled    = false;
      clientInput.value = '';
      document.getElementById('commandeProduit').value  = '';
      document.getElementById('commandeMontant').value  = '';
      const amt = montant ? ` · €${parseFloat(montant).toFixed(2)}` : '';
      showToastNotif(`✓ Commande "${client}"${amt} (${transporteur} · ${statut}) créée`);
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

/* Date locale au format AAAA-MM-JJ (toISOString renvoie la date UTC) */
function toLocalISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
