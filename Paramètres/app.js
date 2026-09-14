/* ============================================
   NEXUS — Paramètres
   Fichier : app.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
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
});

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
  document.querySelectorAll('.notif-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
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
  // Session revoke
  document.querySelectorAll('.session-revoke').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.session-item');
      if (!item) return;
      btn.textContent = 'Révoqué';
      btn.disabled = true;
      btn.style.opacity = '0.4';
      item.style.opacity = '0.4';
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
    resetBtn.addEventListener('click', () => {
      if (confirm('Réinitialiser toutes les données analytiques ? Cette action est irréversible.')) {
        resetBtn.textContent = 'Réinitialisation…';
        resetBtn.disabled = true;
        setTimeout(() => {
          resetBtn.textContent = '✓ Réinitialisé';
          showToast('Données analytiques réinitialisées', 'success');
        }, 1200);
      }
    });
  }

  // Delete workspace
  const deleteBtn = document.getElementById('deleteWorkspaceBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const confirmed = prompt('Tapez "SUPPRIMER" pour confirmer la suppression définitive du workspace :');
      if (confirmed === 'SUPPRIMER') {
        deleteBtn.textContent = '✕ Suppression en cours…';
        deleteBtn.disabled = true;
        showToast('Suppression initiée — vous serez déconnecté dans 5s', 'error');
      } else if (confirmed !== null) {
        showToast('Confirmation incorrecte — annulé', 'error');
      }
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
