/* ============================================
   NEXUS — Produits
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initProduitsChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initSearch();
  initDatePicker();
  initExport();
  initNouveauProduit();
});

/* ============================================
   1. PRODUITS CHART — Ventes & Retours
   ============================================ */
const PRODUITS_DATA = {
  '7J': {
    labels:  NexusDates.last7(),
    ventes:  [142, 184, 162, 210, 188, 248, 224],
    retours: [4,   6,   3,   8,   5,   7,   6],
  },
  '30J': {
    labels:  ['S1', 'S2', 'S3', 'S4'],
    ventes:  [840, 980, 920, 1204],
    retours: [24,  32,  28,  38],
  },
  '90J': {
    labels:  NexusDates.lastMonths(3),
    ventes:  [3200, 3840, 4248],
    retours: [88,   108,  120],
  },
};

function initProduitsChart() { buildProduitsChart('7J'); }

function buildProduitsChart(period) {
  const chart = document.getElementById('produitsChart');
  if (!chart) return;
  const d    = PRODUITS_DATA[period] || PRODUITS_DATA['7J'];
  const maxV = Math.max(...d.ventes);
  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (d.ventes[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar secondary';
    b2.style.height = Math.max((d.retours[i] / maxV * 140), 2) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = 'Ventes : <b>' + d.ventes[i] + '</b> &nbsp;&middot;&nbsp; Retours : <b>' + d.retours[i] + '</b>';

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
      buildProduitsChart(tab.textContent.trim());
    });
  });
}

/* ============================================
   3. TABLE ROWS — sélection
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
   4. SEARCH — filtre sur le tableau
   ============================================ */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('#produitsBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ============================================
   5. NAV ITEMS — délégation
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
   6. DATE PICKER
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

  btn.addEventListener('click', (e) => { e.stopPropagation(); popup.style.display = popup.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });
  popup.addEventListener('click', e => e.stopPropagation());

  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const days = parseInt(p.dataset.days), end = new Date(), start = new Date();
      start.setDate(end.getDate() - days);
      startIn.value = toLocalISODate(start);
      endIn.value   = toLocalISODate(end);
    });
  });

  applyBtn.addEventListener('click', () => {
    const s = new Date(startIn.value + 'T00:00'), e = new Date(endIn.value + 'T00:00'); if (isNaN(s) || isNaN(e) || s > e) { showToastNotif('Période invalide : vérifiez les dates'); return; }
    const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    label.textContent = fmt(s) + ' — ' + fmt(e);
    popup.style.display = 'none';
    showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

/* ============================================
   7. EXPORT
   ============================================ */
function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;

  const menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.style.display = 'none';
  menu.innerHTML = '<div class="export-item" data-fmt="CSV">📊 Exporter en CSV</div>'
                 + '<div class="export-item" data-fmt="JSON">📋 Exporter en JSON</div>';
  btn.parentElement.appendChild(menu);

  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  menu.addEventListener('click', e => e.stopPropagation());

  menu.querySelectorAll('.export-item').forEach(item => {
    item.addEventListener('click', () => {
      const fmt = item.dataset.fmt;
      menu.style.display = 'none';
      showToastNotif('✓ Export ' + fmt + ' en cours…');
      if (fmt === 'CSV') {
        const csv = 'SKU,Nom,Categorie,Prix,Stock,Ventes\nSKU-0041,NEXUS Dashboard Pro,SaaS,89/mois,-,2841\nSKU-0082,Analytics API v3,API,299/mois,-,604\nSKU-0117,Plugin SEO Booster,Plugin,49,12,381';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-produits.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { produits: [{ sku: 'SKU-0041', nom: 'NEXUS Dashboard Pro', categorie: 'SaaS', prix: '89/mois', ventes: 2841 }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-produits.json';
        a.click();
      }
    });
  });
}

/* ============================================
   8. MODAL NOUVEAU PRODUIT
   ============================================ */
function initNouveauProduit() {
  const openBtn   = document.getElementById('produitBtn');
  const modal     = document.getElementById('produitModal');
  const closeBtn  = document.getElementById('produitClose');
  const cancelBtn = document.getElementById('produitCancelBtn');
  const createBtn = document.getElementById('produitCreateBtn');
  if (!openBtn || !modal) return;

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  createBtn.addEventListener('click', () => {
    const nomInput = document.getElementById('produitNom');
    const nom      = nomInput.value.trim();
    const cat      = document.getElementById('produitCategorie').value;
    const prix     = document.getElementById('produitPrix').value;
    const stock    = document.getElementById('produitStock').value;
    const statut   = document.querySelector('input[name="produitStatut"]:checked')?.value || 'Actif';

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
      createBtn.textContent = 'Créer le produit';
      createBtn.disabled    = false;
      nomInput.value = '';
      document.getElementById('produitPrix').value  = '';
      document.getElementById('produitStock').value = '';
      const prixStr  = prix  ? ' · €' + parseFloat(prix).toFixed(2) : '';
      const stockStr = stock ? ' · Stock ' + stock : '';
      showToastNotif('✓ Produit "' + nom + '" (' + cat + prixStr + stockStr + ' · ' + statut + ') créé');
    }, 900);
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
