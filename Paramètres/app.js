/* ============================================
   NEXUS — Paramètres
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  restoreFields();
  initNav();
  initToggles();
  initDarkMode();
  initNotifChips();
  initProfileLiveUpdate();
  initPhotoUpload();
  initSaveDiscard();
  initSecurityActions();
  initApiActions();
  initDangerZone();
  initNavItems();
  initTwoFA();
  initIntegrations();
  initBilling();
  initWebhooks();
  initDataExport();
});

/* ============================================
   0. PERSISTANCE — état de la page dans localStorage
   ============================================ */
const SETTINGS_KEY = 'nexus_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch(e) { return {}; }
}

function saveSetting(key, value) {
  const s = loadSettings();
  s[key] = value;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e) {}
}

// "à l'instant", "il y a 5 min", "il y a 3 h", "le 14 sept."
function sinceText(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1)    return 'à l\'instant';
  if (min < 60)   return 'il y a ' + min + ' min';
  if (min < 1440) return 'il y a ' + Math.floor(min / 60) + ' h';
  return 'le ' + new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Champs enregistrés par "Enregistrer" : hors prénom/nom/email (gérés par NexusSidebar) et hors mots de passe
function persistedFields() {
  return [...document.querySelectorAll('.field-input:not([readonly]):not([type="password"]), .field-select, .field-textarea')]
    .filter(el => !['fieldPrenom', 'fieldNom', 'fieldEmail'].includes(el.id));
}

function saveFields() {
  saveSetting('fields', persistedFields().map(el => el.value));
}

function restoreFields() {
  const saved  = loadSettings().fields;
  const fields = persistedFields();
  if (!Array.isArray(saved) || saved.length !== fields.length) return;
  fields.forEach((el, i) => { el.value = saved[i]; });
}

/* ============================================
   1. NAVIGATION ENTRE SECTIONS
   ============================================ */
function initNav() {
  const btns   = document.querySelectorAll('.snav-item');
  const panels = document.querySelectorAll('.s-panel');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach(p => {
        p.classList.toggle('active', p.id === `panel-${target}`);
      });
    });
  });
}

/* ============================================
   2. TOGGLE SWITCHES — avec persistance
   ============================================ */
function initToggles() {
  // Restaurer états sauvegardés
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('nexus_toggles') || '{}'); } catch(e) {}
  document.querySelectorAll('.toggle[data-id]').forEach(tog => {
    const id = tog.dataset.id;
    if (id in saved) {
      tog.classList.toggle('active', saved[id]);
    }
  });

  document.querySelectorAll('.toggle').forEach(tog => {
    tog.addEventListener('click', () => {
      tog.classList.toggle('active');
      // Sauvegarder tous les états
      const states = {};
      document.querySelectorAll('.toggle[data-id]').forEach(t => {
        states[t.dataset.id] = t.classList.contains('active');
      });
      try { localStorage.setItem('nexus_toggles', JSON.stringify(states)); } catch(e) {}
      markDirty();
    });
  });
}

/* ============================================
   2b. MODE SOMBRE
   ============================================ */
function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  if (!toggle) return;

  // Aucun thème clair n'existe dans le CSS : le toggle reste activé
  toggle.classList.add('active');

  toggle.addEventListener('click', () => {
    // Le clic est déjà géré par initToggles — on rétablit l'état après
    setTimeout(() => {
      toggle.classList.add('active');
      showToast('Le thème clair n\'est pas encore disponible', '');
    }, 0);
  });
}

/* ============================================
   2c. CHANGER LA PHOTO
   ============================================ */
function initPhotoUpload() {
  const btn       = document.getElementById('changePhotoBtn');
  const fileInput = document.getElementById('photoFileInput');
  const avatarEl  = document.getElementById('avatarInitials');

  if (!btn || !fileInput || !avatarEl) return;

  btn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Remplacer les initiales par la photo
      avatarEl.textContent = '';
      avatarEl.style.backgroundImage  = `url(${e.target.result})`;
      avatarEl.style.backgroundSize   = 'cover';
      avatarEl.style.backgroundPosition = 'center';

      // Sauvegarder via NexusSidebar (localStorage + sessionStorage + cookie)
      try { NexusSidebar.saveAvatar(e.target.result); } catch(err) {}

      // Mettre à jour aussi la sidebar
      const sidebarAv = document.getElementById('sidebarAv');
      if (sidebarAv) {
        sidebarAv.textContent = '';
        sidebarAv.style.backgroundImage   = `url(${e.target.result})`;
        sidebarAv.style.backgroundSize    = 'cover';
        sidebarAv.style.backgroundPosition= 'center';
      }

      showToast('✓ Photo mise à jour', 'success');
      markDirty();
    };
    reader.readAsDataURL(file);
  });

  // Restaurer la photo sauvegardée au chargement
  let savedPhoto = null;
  try { savedPhoto = localStorage.getItem('nexus_avatar'); } catch(e) {}
  if (savedPhoto) {
    avatarEl.textContent = '';
    avatarEl.style.backgroundImage   = `url(${savedPhoto})`;
    avatarEl.style.backgroundSize    = 'cover';
    avatarEl.style.backgroundPosition= 'center';
  }
}

/* ============================================
   3. NOTIFICATION CHIPS
   ============================================ */
function initNotifChips() {
  const chips = [...document.querySelectorAll('.notif-chip')];
  const saved = loadSettings().chips;
  if (Array.isArray(saved) && saved.length === chips.length) {
    chips.forEach((chip, i) => chip.classList.toggle('active', !!saved[i]));
  }
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      saveSetting('chips', chips.map(c => c.classList.contains('active')));
      markDirty();
    });
  });
}

/* ============================================
   4. SAVE / DISCARD
   ============================================ */
let dirty = false;

// Snapshot des valeurs initiales pour pouvoir annuler
let savedValues = {};

function snapshotValues() {
  savedValues = {};
  document.querySelectorAll('.field-input:not([readonly]), .field-select, .field-textarea').forEach(el => {
    if (el.id) savedValues[el.id] = el.value;
  });
}

function markDirty() {
  dirty = true;
  const btn = document.getElementById('saveBtn');
  if (btn) {
    btn.textContent = '● Enregistrer les modifications';
    btn.style.background = '#2563EB';
  }
}

// Met à jour l'avatar et le nom affiché dès la frappe
function initProfileLiveUpdate() {
  const prenomInput = document.getElementById('fieldPrenom');
  const nomInput    = document.getElementById('fieldNom');

  // Pré-remplir les champs depuis le profil sauvegardé
  const saved = NexusSidebar.getProfile();
  if (prenomInput) prenomInput.value = saved.prenom || '';
  if (nomInput)    nomInput.value    = saved.nom    || '';
  const emailEl = document.getElementById('fieldEmail');
  if (emailEl)   emailEl.value      = saved.email  || '';

  // Mettre à jour le bloc avatar en haut du panel
  updateAvatarPanel(saved.prenom || '', saved.nom || '');

  function updateAvatarPanel(prenom, nom) {
    const ini  = ((prenom).charAt(0) + (nom).charAt(0)).toUpperCase() || 'JD';
    const full = [prenom, nom].filter(Boolean).join(' ') || 'Utilisateur';
    const avatarEl = document.getElementById('avatarInitials');
    const nameEl   = document.getElementById('avatarName');
    // Ne pas écrire les initiales par-dessus une photo
    if (avatarEl && !avatarEl.style.backgroundImage) avatarEl.textContent = ini;
    if (nameEl)   nameEl.textContent   = full;
  }

  function onNameChange() {
    const prenom = prenomInput ? prenomInput.value.trim() : '';
    const nom    = nomInput    ? nomInput.value.trim()    : '';
    updateAvatarPanel(prenom, nom);
    NexusSidebar.updateDisplay(prenom, nom);
    markDirty();
  }

  if (prenomInput) {
    prenomInput.addEventListener('input',  onNameChange);
    prenomInput.addEventListener('change', onNameChange);
  }
  if (nomInput) {
    nomInput.addEventListener('input',  onNameChange);
    nomInput.addEventListener('change', onNameChange);
  }
}

function initSaveDiscard() {
  // Snapshot initial
  snapshotValues();

  // Écouter tous les champs (hors readonly)
  document.querySelectorAll('.field-input:not([readonly]), .field-select, .field-textarea').forEach(el => {
    el.addEventListener('input',  markDirty);
    el.addEventListener('change', markDirty);
  });

  // Save — persiste dans localStorage
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = 'Enregistrement…';
      saveBtn.disabled = true;

      setTimeout(() => {
        // Lire les valeurs actuelles des champs
        const prenomEl = document.getElementById('fieldPrenom');
        const nomEl    = document.getElementById('fieldNom');
        const emailEl  = document.getElementById('fieldEmail');

        const prenom = prenomEl ? prenomEl.value.trim() : '';
        const nom    = nomEl    ? nomEl.value.trim()    : '';
        const email  = emailEl  ? emailEl.value.trim()  : '';

        // Sauvegarder via NexusSidebar (localStorage + mise à jour sidebar)
        NexusSidebar.saveProfile(prenom, nom, email);
        saveFields();

        // Nouveau snapshot pour le bouton Annuler
        snapshotValues();
        dirty = false;
        saveBtn.textContent = 'Enregistrer les modifications';
        saveBtn.style.background = '';
        saveBtn.disabled = false;
        showToast('✓ Modifications enregistrées', 'success');
      }, 600);
    });
  }

  // Discard — restaure le snapshot
  const discardBtn = document.getElementById('discardBtn');
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      if (!dirty) { showToast('Aucune modification à annuler', ''); return; }

      // Restaurer les valeurs sauvegardées
      Object.entries(savedValues).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });

      // Remettre avatar + nom à jour depuis les champs restaurés
      const prenomEl = document.getElementById('fieldPrenom');
      const nomEl    = document.getElementById('fieldNom');
      if (prenomEl && nomEl) {
        const prenom   = prenomEl.value.trim();
        const nom      = nomEl.value.trim();
        const initials = (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
        const fullName = [prenom, nom].filter(Boolean).join(' ');
        const avatarEl   = document.getElementById('avatarInitials');
        const nameEl     = document.getElementById('avatarName');
        const sidebarAv  = document.querySelector('.user-av');
        const sidebarName= document.querySelector('.user-name');
        if (avatarEl && !avatarEl.style.backgroundImage)   avatarEl.textContent  = initials;
        if (nameEl)      nameEl.textContent      = fullName;
        if (sidebarAv && !sidebarAv.style.backgroundImage) sidebarAv.textContent = initials;
        if (sidebarName) sidebarName.textContent = fullName;
      }

      dirty = false;
      const btn = document.getElementById('saveBtn');
      if (btn) { btn.textContent = 'Enregistrer les modifications'; btn.style.background = ''; }
      showToast('Modifications annulées', '');
    });
  }
}

/* ============================================
   5. SECURITY ACTIONS
   ============================================ */
function initSecurityActions() {
  const revoked = loadSettings().revoked || [];
  document.querySelectorAll('.session-item .session-revoke').forEach(btn => {
    const item = btn.closest('.session-item');
    const name = item.querySelector('.session-name').textContent;
    const revoke = () => {
      btn.textContent = 'Révoqué';
      btn.disabled = true;
      btn.style.opacity = '0.4';
      item.style.opacity = '0.4';
    };
    if (revoked.includes(name)) revoke();

    btn.addEventListener('click', () => {
      revoke();
      saveSetting('revoked', [...new Set([...(loadSettings().revoked || []), name])]);
      showToast('Session révoquée', 'success');
    });
  });
}

/* ============================================
   6. API KEY ACTIONS
   ============================================ */
function initApiActions() {
  // Reveal secret key
  const revealBtn = document.getElementById('revealBtn');
  const secKey    = document.getElementById('secKey');

  if (revealBtn && secKey) {
    revealBtn.addEventListener('click', () => {
      const isHidden = secKey.type === 'password';
      secKey.type = isHidden ? 'text' : 'password';
      revealBtn.textContent = isHidden ? 'Masquer' : 'Afficher';
    });
  }
}

// Global copy function (called from inline onclick)
window.copyKey = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const wasPassword = el.type === 'password';
  if (wasPassword) el.type = 'text';

  navigator.clipboard.writeText(el.value).then(() => {
    showToast('Clé copiée dans le presse-papiers', 'success');
  }).catch(() => {
    showToast('Impossible de copier', 'error');
  });

  if (wasPassword) el.type = 'password';
};

/* ============================================
   7. DANGER ZONE
   ============================================ */
function initDangerZone() {
  // Reset analytics
  const resetBtn = document.getElementById('resetAnalyticsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const ok = await NexusUI.confirm({
        title:  'Réinitialiser les données analytiques ?',
        text:   'Toutes les données d\'analytique seront effacées. Cette action est irréversible.',
        okText: 'Réinitialiser',
        danger: true,
      });
      if (!ok) return;
      resetBtn.textContent = 'Réinitialisation…';
      resetBtn.disabled = true;
      setTimeout(() => {
        resetBtn.textContent = '✓ Réinitialisé';
        showToast('Données analytiques réinitialisées', 'success');
      }, 1200);
    });
  }

  // Delete workspace
  const deleteBtn = document.getElementById('deleteWorkspaceBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await NexusUI.ask({
        title:       'Supprimer le workspace',
        text:        'Tapez SUPPRIMER pour confirmer la suppression définitive du workspace.',
        placeholder: 'SUPPRIMER',
        okText:      'Supprimer',
        danger:      true,
        validate:    v => v === 'SUPPRIMER' ? '' : 'Tapez exactement SUPPRIMER.',
      });
      if (confirmed === null) return;
      deleteBtn.textContent = '✕ Suppression programmée';
      deleteBtn.disabled = true;
      showToast('Suppression programmée — démo : aucune donnée n\'est supprimée', 'error');
    });
  }
}

/* ============================================
   8. TOAST
   ============================================ */
let toastTimer = null;

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.className   = 'toast show' + (type ? ` toast-${type}` : '');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================
   9. SIDEBAR NAV
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
   10. SÉCURITÉ — Reconfigurer la 2FA
   ============================================ */
function initTwoFA() {
  const btn = document.querySelector('.twofa-btn');
  const sub = document.querySelector('.twofa-sub');
  if (!btn || !sub) return;
  const setDate = date => { sub.textContent = 'Google Authenticator · Configurée le ' + date; };
  const saved = loadSettings().twofa;
  if (saved) setDate(saved);

  btn.addEventListener('click', async () => {
    const code = await NexusUI.ask({
      title:       'Reconfigurer la 2FA',
      text:        'Saisissez le code à 6 chiffres affiché dans votre application d\'authentification.',
      placeholder: '123456',
      okText:      'Vérifier',
      validate:    v => /^\d{6}$/.test(v.replace(/\s/g, '')) ? '' : 'Le code doit contenir 6 chiffres.',
    });
    if (code === null) return;
    const date = NexusDates.fmt('{dmy:0}');
    setDate(date);
    saveSetting('twofa', date);
    showToast('✓ Authentification à deux facteurs reconfigurée', 'success');
  });
}

/* ============================================
   11. INTÉGRATIONS — Connecter / Synchroniser
   ============================================ */
function initIntegrations() {
  const grid = document.querySelector('.integrations-grid');
  if (!grid) return;

  // État sauvegardé : { "Jira": { action: "Connecté", at: 1789… } }
  const render = (card, state) => {
    const status = card.querySelector('.integ-status');
    const btn    = card.querySelector('.integ-btn');
    card.classList.add('connected');
    status.className   = 'integ-status st-connected';
    status.textContent = '● Connecté';
    btn.className      = 'integ-btn integ-btn-config';
    btn.textContent    = 'Synchroniser';
    card.querySelector('.integ-meta').textContent = state.action + ' ' + sinceText(state.at);
  };
  const saved = loadSettings().integrations || {};
  grid.querySelectorAll('.integ-card').forEach(card => {
    const state = saved[card.querySelector('.integ-name').textContent];
    if (state) render(card, state);
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.integ-btn');
    if (!btn || btn.disabled) return;
    const card       = btn.closest('.integ-card');
    const name       = card.querySelector('.integ-name').textContent;
    const connecting = btn.classList.contains('integ-btn-connect');

    btn.disabled    = true;
    btn.textContent = connecting ? 'Connexion…' : 'Synchronisation…';

    setTimeout(() => {
      const state = { action: connecting ? 'Connecté' : 'Synchronisé', at: Date.now() };
      render(card, state);
      btn.disabled = false;
      const all = loadSettings().integrations || {};
      all[name] = state;
      saveSetting('integrations', all);
      showToast('✓ ' + name + (connecting ? ' connecté' : ' synchronisé'), 'success');
    }, 900);
  });
}

/* ============================================
   12. FACTURATION — Plan, factures PDF, carte
   ============================================ */
function initBilling() {
  // Passer à Enterprise
  const upgradeBtn = document.querySelector('.plan-card .tb-btn');
  const applyEnterprise = () => {
    document.querySelector('.plan-badge').textContent = 'ENTERPRISE';
    document.querySelector('.plan-name').textContent  = 'Plan Enterprise';
    document.querySelector('.plan-price').firstChild.nodeValue = '€299 / mois · Renouvellement le ';
    const role = document.querySelector('.avatar-role');
    if (role) role.textContent = 'Administrateur · Plan Enterprise';
    const sbPlan = document.querySelector('.user-plan');
    if (sbPlan) sbPlan.textContent = 'Enterprise · Admin';
    upgradeBtn.textContent   = 'Plan actuel';
    upgradeBtn.disabled      = true;
    upgradeBtn.style.opacity = '0.5';
  };
  if (upgradeBtn) {
    if (loadSettings().plan === 'Enterprise') applyEnterprise();
    upgradeBtn.addEventListener('click', async () => {
      const ok = await NexusUI.confirm({
        title:  'Passer au plan Enterprise',
        text:   'Utilisateurs illimités, 10 M d\'appels API par mois et support prioritaire pour €299 / mois. Le changement prend effet immédiatement.',
        okText: 'Confirmer',
      });
      if (!ok) return;
      applyEnterprise();
      saveSetting('plan', 'Enterprise');
      showToast('✓ Vous êtes passé au plan Enterprise', 'success');
    });
  }

  // Factures : vrai fichier PDF
  document.querySelectorAll('.inv-dl').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.invoice-item');
      const get  = sel => item.querySelector(sel).textContent.trim();
      downloadInvoice(get('.inv-date'), get('.inv-desc'), get('.inv-amount'), get('.inv-status'));
      showToast('✓ Facture ' + get('.inv-date') + ' téléchargée', 'success');
    });
  });

  // Carte bancaire : date d'expiration
  const cardBtn = document.querySelector('.card-payment .session-revoke');
  const cardExp = document.querySelector('.card-exp');
  if (cardBtn && cardExp) {
    const savedExp = loadSettings().cardExp;
    if (savedExp) cardExp.textContent = 'Expire ' + savedExp;
    cardBtn.addEventListener('click', async () => {
      const exp = await NexusUI.ask({
        title:       'Modifier la carte',
        text:        'Nouvelle date d\'expiration de la carte Visa •••• 4242.',
        placeholder: 'MM/AAAA',
        okText:      'Enregistrer',
        validate:    v => {
          const m = v.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
          if (!m) return 'Format attendu : MM/AAAA';
          return new Date(+m[2], +m[1], 0) < new Date() ? 'Cette date est déjà passée.' : '';
        },
      });
      if (exp === null) return;
      cardExp.textContent = 'Expire ' + exp;
      saveSetting('cardExp', exp);
      showToast('✓ Carte mise à jour', 'success');
    });
  }
}

function downloadInvoice(periode, desc, montant, statut) {
  const p   = NexusSidebar.getProfile();
  const num = 'NX-' + periode.replace(/\s+/g, '-').toUpperCase();
  const client = [p.prenom, p.nom].filter(Boolean).join(' ') + (p.email ? ' — ' + p.email : '');

  const blob = buildPdf([
    { text: 'NEXUS Analytics SAS', y: 780, size: 18, bold: true },
    { text: 'Facture ' + num,       y: 752, size: 12 },
    { text: 'Période : ' + periode, y: 734 },
    { text: 'Client : ' + client,   y: 716 },
    { text: 'Description',          y: 670, bold: true },
    { text: 'Montant',              y: 670, x: 460, bold: true },
    { text: desc,                   y: 648 },
    { text: montant,                y: 648, x: 460 },
    { text: 'Total TTC',            y: 612, size: 12, bold: true },
    { text: montant,                y: 612, x: 460, size: 12, bold: true },
    { text: 'Statut : ' + statut,   y: 590 },
    { text: 'Document généré par la démo NEXUS — sans valeur comptable.', y: 60, size: 9 },
  ]);

  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'facture-' + num.toLowerCase() + '.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// PDF minimal (une page A4, polices Helvetica standard) : aucune bibliothèque nécessaire
function buildPdf(lines) {
  const esc = s => s.replace(/[\\()]/g, '\\$&');
  let stream = 'BT\n';
  lines.forEach(l => {
    stream += '/' + (l.bold ? 'F2' : 'F1') + ' ' + (l.size || 11) + ' Tf 1 0 0 1 ' + (l.x || 56) + ' ' + l.y + ' Tm (' + esc(l.text) + ') Tj\n';
  });
  stream += 'ET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += (i + 1) + ' 0 obj\n' + obj + '\nendobj\n';
    return at;
  });
  const xref = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n'
       + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')
       + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';

  // Un caractère = un octet en WinAnsi (les offsets ci-dessus restent donc justes)
  const WIN = { 0x20AC: 0x80, 0x2014: 0x97, 0x2013: 0x96, 0x2019: 0x92, 0x2022: 0x95 };
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    const c = pdf.charCodeAt(i);
    bytes[i] = WIN[c] || (c < 256 ? c : 0x3F);
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

/* ============================================
   13. WEBHOOKS — Ajouter / Modifier
   ============================================ */
function initWebhooks() {
  const list = document.querySelector('.webhook-list');
  if (!list) return;
  const validate = v => /^https:\/\/[^\s/]+\.[^\s]+$/.test(v) ? '' : 'L\'URL doit commencer par https://';

  const render = (w) => {
    const item = document.createElement('div');
    item.className = 'webhook-item';
    item.innerHTML =
        '<div class="wh-left"><div class="wh-dot"></div>'
      + '<div><p class="wh-url"></p><p class="wh-events"></p></div></div>'
      + '<div class="wh-right"><span class="wh-rate"></span><button class="session-revoke">Modifier</button></div>';
    item.querySelector('.wh-dot').style.background = w.dot;
    item.querySelector('.wh-url').textContent      = w.url;
    item.querySelector('.wh-events').textContent   = w.events;
    const rate = item.querySelector('.wh-rate');
    rate.textContent = w.rate;
    rate.style.color = w.rateColor;
    return item;
  };
  const save = () => saveSetting('webhooks', [...list.querySelectorAll('.webhook-item')].map(item => ({
    url:       item.querySelector('.wh-url').textContent,
    events:    item.querySelector('.wh-events').textContent,
    rate:      item.querySelector('.wh-rate').textContent,
    rateColor: item.querySelector('.wh-rate').style.color,
    dot:       item.querySelector('.wh-dot').style.background,
  })));

  const saved = loadSettings().webhooks;
  if (Array.isArray(saved)) {
    list.innerHTML = '';
    saved.forEach(w => list.appendChild(render(w)));
  }

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('.session-revoke');
    if (!btn) return;
    const url = btn.closest('.webhook-item').querySelector('.wh-url');
    const v = await NexusUI.ask({ title: 'Modifier l\'endpoint', value: url.textContent, okText: 'Enregistrer', validate });
    if (v === null) return;
    url.textContent = v;
    save();
    showToast('✓ Endpoint mis à jour', 'success');
  });

  const addBtn = list.closest('.toggle-section').querySelector('.tb-btn');
  if (!addBtn) return;
  addBtn.addEventListener('click', async () => {
    const v = await NexusUI.ask({
      title:       'Ajouter un endpoint',
      text:        'Les événements seront envoyés en POST à cette URL.',
      placeholder: 'https://api.exemple.com/webhooks',
      okText:      'Ajouter',
      validate,
    });
    if (v === null) return;
    list.appendChild(render({
      url:       v,
      events:    'Tous les événements · en attente du premier envoi',
      rate:      '—',
      rateColor: 'var(--muted)',
      dot:       'var(--blue)',
    }));
    save();
    showToast('✓ Endpoint ajouté', 'success');
  });
}

/* ============================================
   14. EXPORT DES DONNÉES (JSON)
   ============================================ */
function initDataExport() {
  const btn = document.querySelector('.danger-btn-soft');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.disabled    = true;
    btn.textContent = 'Préparation…';
    setTimeout(() => {
      let preferences = {};
      try { preferences = JSON.parse(localStorage.getItem('nexus_toggles') || '{}'); } catch(e) {}
      const texts = sel => [...document.querySelectorAll(sel)].map(el => el.textContent.trim());
      const data = {
        exporte_le:   new Date().toISOString(),
        profil:       NexusSidebar.getProfile(),
        plan:         document.querySelector('.plan-name').textContent,
        preferences,
        integrations: [...document.querySelectorAll('.integ-card')].map(c => ({
          nom:    c.querySelector('.integ-name').textContent,
          statut: c.querySelector('.integ-status').textContent.replace(/^[●○]\s*/, ''),
        })),
        webhooks:     texts('.wh-url'),
        factures:     [...document.querySelectorAll('.invoice-item')].map(i => ({
          periode: i.querySelector('.inv-date').textContent,
          montant: i.querySelector('.inv-amount').textContent,
          statut:  i.querySelector('.inv-status').textContent,
        })),
      };
      const a = document.createElement('a');
      a.href     = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = 'nexus-donnees.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      btn.disabled    = false;
      btn.textContent = '↓ Exporter';
      showToast('✓ Archive de vos données téléchargée', 'success');
    }, 800);
  });
}
