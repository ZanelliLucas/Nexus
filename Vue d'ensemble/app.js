/* ============================================
   NEXUS — Analytics Dashboard
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initBarChart();
  initLiveActivity();
  initChartTabs();
  initNavItems();
  initDatePicker();
  initExport();
  initRapport();
});

/* ============================================
   1. BAR CHART — Génération dynamique
   ============================================ */
function initBarChart() {
  const chart = document.getElementById('barChart');
  if (!chart) return;

  const days = NexusDates.last7();
  const rev  = [65, 82, 71, 90, 78, 95, 88];
  const ses  = [45, 60, 55, 70, 62, 75, 68];
  const maxV = Math.max(...rev);

  days.forEach((day, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className = 'bar primary';
    b1.style.height = (rev[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className = 'bar secondary';
    b2.style.height = (ses[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'bar-label';
    lbl.textContent = day;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = `Rev : <b>€${rev[i]}k</b> &nbsp;·&nbsp; Sessions : <b>${ses[i]}k</b>`;

    grp.appendChild(b1);
    grp.appendChild(b2);
    grp.appendChild(lbl);
    grp.appendChild(tip);
    chart.appendChild(grp);
  });
}

/* ============================================
   2. LIVE ACTIVITY — Simulation temps réel
   ============================================ */
function initLiveActivity() {
  const activities = [
    {
      color : 'var(--green)',
      msg   : '<strong>Commande</strong> — €189 de Pierre M.',
      time  : 'à l\'instant'
    },
    {
      color : 'var(--blue)',
      msg   : '<strong>Nouvel utilisateur</strong> depuis Lyon',
      time  : 'à l\'instant'
    },
    {
      color : 'var(--violet)',
      msg   : '<strong>Rapport</strong> généré automatiquement',
      time  : 'à l\'instant'
    },
    {
      color : 'var(--amber)',
      msg   : '<strong>Alerte stock</strong> — Produit #B104 critique',
      time  : 'à l\'instant'
    },
    {
      color : 'var(--green)',
      msg   : '<strong>Paiement reçu</strong> — Abonnement Enterprise €299',
      time  : 'à l\'instant'
    },
    {
      color : 'var(--red)',
      msg   : '<strong>Échec paiement</strong> — Commande #9012 refusée',
      time  : 'à l\'instant'
    },
  ];

  let index = 0;

  setInterval(() => {
    const items = document.querySelectorAll('.ac-item');
    if (!items.length) return;

    const data  = activities[index % activities.length];
    const first = items[0];

    const dot  = first.querySelector('.ac-dot');
    const msg  = first.querySelector('.ac-msg');
    const time = first.querySelector('.ac-time');

    if (dot)  dot.style.background = data.color;
    if (msg)  msg.innerHTML        = data.msg;
    if (time) time.textContent     = data.time;

    first.style.background = 'rgba(59, 130, 246, 0.07)';
    setTimeout(() => { first.style.background = ''; }, 1200);

    updateActivityTimes(items);

    index++;
  }, 5000);
}

function updateActivityTimes(items) {
  const labels = [
    'il y a 5 min',
    'il y a 10 min',
    'il y a 15 min',
    'il y a 22 min',
    'il y a 38 min',
  ];

  items.forEach((item, i) => {
    if (i === 0) return;
    const time = item.querySelector('.ac-time');
    if (time && labels[i - 1]) {
      time.textContent = labels[i - 1];
    }
  });
}

/* ============================================
   3. CHART TABS — Changement de période
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

      const period = tab.textContent.trim();
      refreshBarChart(period);
    });
  });
}

function refreshBarChart(period) {
  const chart = document.getElementById('barChart');
  if (!chart) return;

  const data = {
    '7J' : {
      labels : NexusDates.last7(),
      rev    : [65, 82, 71, 90, 78, 95, 88],
      ses    : [45, 60, 55, 70, 62, 75, 68],
    },
    '30J': {
      labels : ['S1', 'S2', 'S3', 'S4'],
      rev    : [280, 310, 295, 340],
      ses    : [210, 240, 220, 260],
    },
    '90J': {
      labels : NexusDates.lastMonths(3),
      rev    : [820, 940, 1100],
      ses    : [630, 720, 850],
    },
  };

  const selected = data[period] || data['7J'];
  const maxV     = Math.max(...selected.rev);

  chart.innerHTML = '';

  selected.labels.forEach((label, i) => {
    const grp = document.createElement('div');
    grp.className = 'bar-group tooltip-container';

    const b1 = document.createElement('div');
    b1.className    = 'bar primary';
    b1.style.height = (selected.rev[i] / maxV * 140) + 'px';

    const b2 = document.createElement('div');
    b2.className    = 'bar secondary';
    b2.style.height = (selected.ses[i] / maxV * 140) + 'px';

    const lbl = document.createElement('span');
    lbl.className   = 'bar-label';
    lbl.textContent = label;

    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.innerHTML = `Rev : <b>${selected.rev[i]}k€</b> &nbsp;·&nbsp; Ses : <b>${selected.ses[i]}k</b>`;

    grp.appendChild(b1);
    grp.appendChild(b2);
    grp.appendChild(lbl);
    grp.appendChild(tip);
    chart.appendChild(grp);
  });
}

/* ============================================
   4. NAV ITEMS — Gestion de l'état actif
   (délégation sur sidebar car items générés dynamiquement)
   ============================================ */
function initNavItems() {
  // Délégation d'événement : écouter sur le parent stable (sidebar)
  // car les .sb-item sont injectés dynamiquement par sidebar.js
  const sidebar = document.querySelector('aside.sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('click', (e) => {
    const item = e.target.closest('.sb-item');
    if (!item) return;
    // Ne retirer active que si c'est un lien "#" (pas une vraie navigation)
    if (!item.getAttribute('href') || item.getAttribute('href') === '#') {
      sidebar.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
  });
}

/* ============================================
   5. BOUTONS TOPBAR
   ============================================ */



/* ── Calendrier ── */
function initDatePicker() {
  const btn    = document.getElementById('dateRangeBtn');
  const popup  = document.getElementById('datePickerPopup');
  const label  = document.getElementById('dateRangeLabel');
  const presets= document.querySelectorAll('.dp-preset');
  const applyBtn  = document.getElementById('dpApply');
  const cancelBtn = document.getElementById('dpCancel');
  const startIn   = document.getElementById('dpStart');
  const endIn     = document.getElementById('dpEnd');
  if (!btn || !popup) return;

  // Ouvrir / fermer
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', () => { if(popup) popup.style.display = 'none'; });
  popup.addEventListener('click', e => e.stopPropagation());

  // Presets
  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const days = parseInt(p.dataset.days);
      const end  = new Date();
      const start= new Date();
      start.setDate(end.getDate() - days);
      startIn.value = toLocalISODate(start);
      endIn.value   = toLocalISODate(end);
    });
  });

  // Appliquer
  applyBtn.addEventListener('click', () => {
    const s = new Date(startIn.value);
    const e = new Date(endIn.value);
    const fmt = d => d.toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'});
    label.textContent = fmt(s) + ' — ' + fmt(e);
    popup.style.display = 'none';
    showToastNotif('✓ Période mise à jour');
  });
  cancelBtn.addEventListener('click', () => { popup.style.display = 'none'; });
}

/* ── Exporter ── */
function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;

  // Menu déroulant
  const menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.style.display = 'none';
  menu.innerHTML = `
    <div class="export-item" data-fmt="CSV">📊 Exporter en CSV</div>
    <div class="export-item" data-fmt="JSON">📋 Exporter en JSON</div>
  `;
  btn.parentElement.style.position = 'relative';
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
      showToastNotif(`✓ Export ${fmt} en cours de téléchargement…`);

      // Simuler un téléchargement CSV réel
      if (fmt === 'CSV') {
        const csv = 'Pays,Visiteurs,Revenu\nFrance,18421,84200\nAllemagne,12840,61380\nRoyaume-Uni,10290,49100\nEspagne,7604,36200';
        const blob = new Blob([csv], {type:'text/csv'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-export.csv';
        a.click();
      } else if (fmt === 'JSON') {
        const data = {periode:NexusDates.fmt('{mon:0} {year:0}'), kpi:{revenu:284591, utilisateurs:48291, conversion:3.82, panier:94.30}};
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'nexus-export.json';
        a.click();
      }
    });
  });
}

/* ── Rapport ── */
function initRapport() {
  const openBtn  = document.getElementById('rapportBtn');
  const modal    = document.getElementById('rapportModal');
  const closeBtn = document.getElementById('rapportClose');
  const cancelBtn= document.getElementById('rapportCancelBtn');
  const genBtn   = document.getElementById('rapportGenBtn');
  if (!openBtn || !modal) return;

  const open  = () => { modal.style.display = 'flex'; };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  genBtn.addEventListener('click', () => {
    const nom  = document.getElementById('rapportNom').value || 'Rapport';
    const type = document.getElementById('rapportType').value;
    const fmt  = document.querySelector('input[name="fmt"]:checked')?.value || 'PDF';
    genBtn.textContent = 'Génération…';
    genBtn.disabled = true;
    setTimeout(() => {
      close();
      genBtn.textContent = 'Générer';
      genBtn.disabled = false;
      showToastNotif(`✓ "${nom}" (${type} · ${fmt}) généré avec succès`);
    }, 1200);
  });
}

/* ── Toast notifications ── */
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
