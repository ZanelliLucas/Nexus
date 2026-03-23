/* ============================================
   NEXUS — sidebar.js  v4
   Compatible file:// — pas de localStorage cross-dossier
   Stratégie : cookie-like via document.cookie (partagé par domaine/chemin)
   + fallback paramètre URL
   ============================================ */

(function () {

  /* ════════════════════════════════════════
     PROFIL — stockage via cookie (fonctionne en file://)
     ════════════════════════════════════════ */

  function saveProfile(data) {
    // Stocker dans TOUS les localStorage possibles + cookie
    const json = JSON.stringify(data);
    try { localStorage.setItem('nexus_profile', json); } catch(e){}
    try { sessionStorage.setItem('nexus_profile', json); } catch(e){}
    // Cookie lisible par tous les sous-dossiers du même domaine
    try {
      document.cookie = 'nexus_profile=' + encodeURIComponent(json) + '; path=/; max-age=31536000';
    } catch(e){}
  }

  function loadProfile() {
    // 1. Essayer localStorage
    try {
      const raw = localStorage.getItem('nexus_profile');
      if (raw) { const p = JSON.parse(raw); if (p && p.prenom) return p; }
    } catch(e){}

    // 2. Essayer sessionStorage
    try {
      const raw = sessionStorage.getItem('nexus_profile');
      if (raw) { const p = JSON.parse(raw); if (p && p.prenom) return p; }
    } catch(e){}

    // 3. Essayer cookie
    try {
      const match = document.cookie.match(/nexus_profile=([^;]+)/);
      if (match) {
        const p = JSON.parse(decodeURIComponent(match[1]));
        if (p && p.prenom) return p;
      }
    } catch(e){}

    // 4. Défauts
    return { prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@nexus.io' };
  }

  function saveAvatar(dataUrl) {
    try { localStorage.setItem('nexus_avatar', dataUrl); } catch(e){}
    try { sessionStorage.setItem('nexus_avatar', dataUrl); } catch(e){}
    // Cookie trop grand pour une image — on garde juste un flag
    try { document.cookie = 'nexus_has_avatar=1; path=/; max-age=31536000'; } catch(e){}
  }

  function loadAvatar() {
    try {
      const v = localStorage.getItem('nexus_avatar');
      if (v) return v;
    } catch(e){}
    try {
      const v = sessionStorage.getItem('nexus_avatar');
      if (v) return v;
    } catch(e){}
    return null;
  }

  function getInitials(p) {
    return (((p.prenom||'').charAt(0)) + ((p.nom||'').charAt(0))).toUpperCase() || 'JD';
  }

  function getFullName(p) {
    return [(p.prenom||'').trim(),(p.nom||'').trim()].filter(Boolean).join(' ') || 'Utilisateur';
  }

  /* ════════════════════════════════════════
     NAVIGATION
     ════════════════════════════════════════ */
  const PAGE_MAP = {
    "Vue d'ensemble": "../Vue d'ensemble/index.html",
    "Analytique":     "../Analytique/index.html",
    "Rapports":       "../Rapports/index.html",
    "Campagnes":      "../Campagnes/index.html",
    "Revenus":        "../Revenus/index.html",
    "Clients":        "../Clients/index.html",
    "Produits":       "../Produits/index.html",
    "Commandes":      "../Commandes/index.html",
    "Performance":    "../Performance/index.html",
    "Logs":           "../Logs/index.html",
    "Param\u00e8tres":"../Param\u00e8tres/index.html",
  };

  const NAV = [
    { label:'Principal', items:[
      { name:"Vue d'ensemble", icon:'◈' },
      { name:'Analytique', icon:'◫', badge:'NEW' },
      { name:'Rapports', icon:'◉' },
      { name:'Campagnes', icon:'▤' },
    ]},
    { label:'Commerce', items:[
      { name:'Revenus', icon:'◈' },
      { name:'Clients', icon:'⊞' },
      { name:'Produits', icon:'◧' },
      { name:'Commandes', icon:'◈' },
    ]},
    { label:'Syst\u00e8me', items:[
      { name:'Performance', icon:'◩' },
      { name:'Logs', icon:'◈' },
      { name:'Param\u00e8tres', icon:'◧' },
    ]},
  ];

  function getActivePage() {
    const parts = window.location.pathname.split('/');
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(parts[i]);
      if (seg && seg !== 'index.html') return seg;
    }
    // Fallback sur le titre de la page (utile en file://)
    return document.title.replace(/^NEXUS\s*[—-]\s*/i, '').trim();
  }

  /* ════════════════════════════════════════
     BUILD + INJECT
     ════════════════════════════════════════ */
  function buildHTML(profile) {
    const active = getActivePage();
    const ini  = getInitials(profile);
    const name = getFullName(profile);
    let sections = '';
    NAV.forEach(function(sec) {
      let items = '';
      sec.items.forEach(function(item) {
        const isActive = decodeURIComponent(active) === item.name || active === item.name;
        const badge = item.badge ? '<span class="sb-badge">'+item.badge+'</span>' : '';
        items += '<a href="'+(PAGE_MAP[item.name]||'#')+'" class="sb-item'+(isActive?' active':'')+'"><span class="sb-icon">'+item.icon+'</span> '+item.name+badge+'</a>';
      });
      sections += '<div class="sb-section"><p class="sb-section-label">'+sec.label+'</p>'+items+'</div>';
    });
    return '<div class="sb-logo"><div class="logo-icon">Nx</div><span class="logo-text">Nexus</span></div>'
      + sections
      + '<div class="sb-bottom"><div class="sb-user"><div class="user-av" id="sidebarAv">'+ini+'</div><div><p class="user-name" id="sidebarName">'+name+'</p><p class="user-plan">Pro &middot; Admin</p></div></div></div>';
  }

  function applyAvatar() {
    const photo = loadAvatar();
    const av = document.getElementById('sidebarAv');
    if (!av || !photo) return;
    av.textContent = '';
    av.style.backgroundImage = 'url('+photo+')';
    av.style.backgroundSize = 'cover';
    av.style.backgroundPosition = 'center';
  }

  function inject() {
    const sidebar = document.querySelector('aside.sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = buildHTML(loadProfile());
    applyAvatar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  /* ════════════════════════════════════════
     API PUBLIQUE
     ════════════════════════════════════════ */
  window.NexusSidebar = {
    updateDisplay: function(prenom, nom) {
      const av = document.getElementById('sidebarAv');
      const nm = document.getElementById('sidebarName');
      if (av && !loadAvatar()) av.textContent = getInitials({prenom:prenom,nom:nom});
      if (nm) nm.textContent = getFullName({prenom:prenom,nom:nom});
    },
    saveProfile: function(prenom, nom, email) {
      saveProfile({prenom:prenom, nom:nom, email:email});
      this.updateDisplay(prenom, nom);
    },
    saveAvatar: saveAvatar,
    getProfile: loadProfile,
    refresh: inject,
  };

})();
