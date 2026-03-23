/* ============================================
   NEXUS — Campagnes
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCampagnesChart();
  initChartTabs();
  initNavItems();
  initTableRows();
  initDatePicker();
  initExport();
  initNouvelleCampagne();
});

/* ============================================
   1. CAMPAGNES CHART
   ============================================ */

const CAMPAGNES_DATA = {
  '7J': {
    labels:    ['L 24', 'M 25', 'M 26', 'J 27', 'V 28', 'S 29', 'D 30'],
    envois:    [38200, 44100, 40800, 52300, 47600, 61400, 55900],
    ouvertures:[10800, 12500, 11600, 14900, 13500, 17400, 15800],
  },
  '30J': {
    labels:    ['S1', 'S2', 'S3', 'S4'],
    envois:    [148000, 172000, 160000, 194000],
    ouvertures:[41900, 48700, 45300, 54900],
  },
  '90J': {
    labels:    ['Sep', 'Oct', 'Nov'],
    envois:    [520000, 610000, 674910],
    ouvertures:[147000, 172800, 191000],
  },
};

function initCampagnesChart() {
  buildCampagnesChart('7J');
}

function buildCampagnesChart(period) {
  const chart = document.getElementById('campagnesChart');
  if (!chart) return;

  const d    = CAMPAGNES_DATA[period] || CAMPAGNES_DATA['7J'];
  const maxV = Math.max(...d.envois);

  chart.innerHTML = '';

  d.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className    = 'bar primary';
    b1.style.height = (d.envois[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className    = 'bar secondary';
    b2.style.height = (d.ouvertures[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className   = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    const fmt = v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v;
    tip.innerHTML = 'Envois : <b>' + fmt(d.envois[i]) + '</b> &nbsp;&middot;&nbsp; Ouv. : <b>' + fmt(d.ouvertures[i]) + '</b>';

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
      if (group) group.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      buildCampagnesChart(tab.textContent.trim());
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
   4. NAV ITEMS — delegation (sidebar injectee dynamiquement)
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
   5. DATE PICKER
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
    showToastNotif('OK Periode mise a jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

/* ============================================
   6. EXPORT
   ============================================ */
function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;

  const menu = document.createElement('div');
  menu.className     = 'export-menu';
  menu.style.display = 'none';
  menu.innerHTML = '<div class="export-item" data-fmt="CSV">Exporter en CSV</div>' +
                   '<div class="export-item" data-fmt="JSON">Exporter en JSON</div>' +
                   '<div class="export-item" data-fmt="PDF">Exporter en PDF</div>';
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
      if (fmt === 'CSV') {
        const csv  = 'Campagne,Canal,Envois,Ouvertures,Clics,Revenus,Statut\nPromo Black Friday,Email,84200,28.4%,9.2%,18420,Actif\nRelance panier,SMS,12840,41.2%,18.7%,9810,Actif';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-campagnes.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = { campagnes: [{ nom: 'Promo Black Friday', canal: 'Email', envois: 84200 }] };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = 'nexus-campagnes.json';
        a.click();
      }
    });
  });
}

/* ============================================
   7. MODAL NOUVELLE CAMPAGNE
   ============================================ */
function initNouvelleCampagne() {
  const openBtn   = document.getElementById('campagneBtn');
  const modal     = document.getElementById('campagneModal');
  const closeBtn  = document.getElementById('campagneClose');
  const cancelBtn = document.getElementById('campagneCancelBtn');
  const createBtn = document.getElementById('campagneCreateBtn');
  if (!openBtn || !modal) return;

  const dateInput = document.getElementById('campagneDate');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  createBtn.addEventListener('click', () => {
    const nomInput = document.getElementById('campagneNom');
    const canal    = document.getElementById('campagneCanal').value;
    const audience = document.getElementById('campagneAudience').value;

    if (!nomInput.value.trim()) {
      nomInput.style.borderColor = 'var(--red)';
      nomInput.focus();
      return;
    }
    nomInput.style.borderColor = '';

    createBtn.textContent = 'Creation...';
    createBtn.disabled    = true;

    setTimeout(() => {
      const nomVal = nomInput.value.trim();
      close();
      createBtn.textContent = 'Creer la campagne';
      createBtn.disabled    = false;
      nomInput.value = '';
      showToastNotif('Campagne "' + nomVal + '" (' + canal + ' - ' + audience + ') creee');
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
