/* ============================================
   NEXUS — ui.js
   Actions communes, branchées via data-action :
     voir-tout  : tableau réduit à 4 lignes, déplié au clic
     filtrer    : menu des statuts (.status-pill) du tableau
     rechercher : champ de recherche dans l'en-tête de la carte

   NexusUI.ask(opts)     → Promise<valeur | null>
   NexusUI.confirm(opts) → Promise<boolean>
     opts : { title, text, value, placeholder, okText, danger,
              validate(v) → message d'erreur, ou '' si valide }
   ============================================ */

(function () {

  const PREVIEW = 4; // lignes visibles avant "Voir tout"

  const style = document.createElement('style');
  style.textContent = `
    tr.nx-hidden, tr.nx-collapsed { display: none; }

    .nx-menu {
      position: absolute; top: calc(100% + 6px); right: 0; z-index: 1000;
      min-width: 170px; padding: 6px;
      background: #1C1C1F; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .nx-menu-item { padding: 7px 10px; border-radius: 6px; font-size: 12px; color: #A1A1AA; cursor: pointer; white-space: nowrap; }
    .nx-menu-item:hover, .nx-menu-item.active { background: rgba(255,255,255,0.06); color: #FAFAFA; }

    .nx-search {
      width: 170px; max-width: 100%; padding: 6px 10px;
      font: inherit; font-size: 11px; color: #FAFAFA;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; outline: none;
    }
    .nx-search:focus { border-color: rgba(59,130,246,0.5); }

    .nx-overlay {
      position: fixed; inset: 0; z-index: 3000; padding: 16px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    }
    .nx-dialog {
      width: 420px; max-width: 100%; padding: 20px;
      background: #1C1C1F; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      font-family: 'Inter', sans-serif; color: #FAFAFA;
    }
    .nx-dialog-title   { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .nx-dialog-text    { font-size: 12px; color: #A1A1AA; line-height: 1.5; margin-bottom: 14px; }
    .nx-dialog-input {
      width: 100%; padding: 9px 12px; font: inherit; font-size: 13px; color: #FAFAFA;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; outline: none;
    }
    .nx-dialog-input:focus { border-color: rgba(59,130,246,0.5); }
    .nx-dialog-error   { min-height: 16px; margin-top: 6px; font-size: 11px; color: #EF4444; }
    .nx-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
  `;
  document.head.appendChild(style);

  /* ════════════════════════════════════════
     TABLEAUX
     ════════════════════════════════════════ */
  function cardOf(el) { return el.closest('.table-card, .chart-card, .side-card'); }
  function rows(card) { const tb = card && card.querySelector('tbody'); return tb ? [...tb.rows] : []; }

  // Recalcule les lignes visibles : filtre de statut, recherche, puis aperçu réduit
  function refresh(card) {
    const filter     = card.dataset.nxFilter || '';
    const query      = (card.dataset.nxQuery || '').toLowerCase();
    const pageSearch = card.querySelector('.search-input'); // recherche propre à la page (Commandes, Produits)
    const narrowed   = !!(filter || query || (pageSearch && pageSearch.value.trim()));
    const expanded   = card.dataset.nxExpanded === '1';
    let shown = 0;

    rows(card).forEach(row => {
      const pill  = row.querySelector('.status-pill');
      const match = (!filter || (pill && pill.textContent.trim() === filter))
                 && (!query  || row.textContent.toLowerCase().includes(query));
      row.classList.toggle('nx-hidden', !match);

      const visible  = match && row.style.display !== 'none';
      const collapse = visible && !narrowed && !expanded && shown >= PREVIEW;
      row.classList.toggle('nx-collapsed', collapse);
      if (visible && !collapse) shown++;
    });

    const btn = card.querySelector('[data-action="voir-tout"]');
    if (btn) {
      const total = rows(card).length;
      btn.style.display = total <= PREVIEW ? 'none' : '';
      btn.textContent   = expanded ? 'Réduire' : 'Voir tout (' + total + ')';
    }
  }

  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }

  function toggleFilterMenu(btn, card) {
    const wasOpen = openMenu && openMenu.parentElement === btn.parentElement;
    closeMenu();
    if (wasOpen) return;

    const statuses = [...new Set(rows(card)
      .map(r => r.querySelector('.status-pill'))
      .filter(Boolean)
      .map(p => p.textContent.trim()))];
    const current = card.dataset.nxFilter || '';

    const menu = document.createElement('div');
    menu.className = 'nx-menu';
    ['', ...statuses].forEach(s => {
      const item = document.createElement('div');
      item.className   = 'nx-menu-item' + (s === current ? ' active' : '');
      item.textContent = s || 'Tous les statuts';
      item.addEventListener('click', () => {
        card.dataset.nxFilter = s;
        btn.textContent = s ? '🔍 ' + s : '🔍 Filtrer';
        closeMenu();
        refresh(card);
      });
      menu.appendChild(item);
    });

    if (getComputedStyle(btn.parentElement).position === 'static') btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(menu);
    openMenu = menu;
  }

  function toggleSearch(btn, card) {
    let input = card.querySelector('.nx-search');
    if (input) {
      if (input.value) { input.focus(); return; }
      input.remove();
      return;
    }
    input = document.createElement('input');
    input.className   = 'nx-search';
    input.placeholder = 'Rechercher…';
    input.addEventListener('input', () => { card.dataset.nxQuery = input.value.trim(); refresh(card); });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      card.dataset.nxQuery = '';
      input.remove();
      refresh(card);
    });
    btn.parentElement.insertBefore(input, btn);
    input.focus();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.nx-menu')) return;
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.dataset.action !== 'filtrer') closeMenu();
    if (!btn) return;

    const card = cardOf(btn);
    if (!card) return;
    switch (btn.dataset.action) {
      case 'voir-tout':
        card.dataset.nxExpanded = card.dataset.nxExpanded === '1' ? '' : '1';
        refresh(card);
        break;
      case 'filtrer':    toggleFilterMenu(btn, card); break;
      case 'rechercher': toggleSearch(btn, card); break;
    }
  });

  // La recherche propre à la page masque des lignes : on recalcule l'aperçu derrière elle
  document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('search-input')) return;
    const card = cardOf(e.target);
    if (card) refresh(card);
  });

  /* ════════════════════════════════════════
     FENÊTRES DE SAISIE / CONFIRMATION
     ════════════════════════════════════════ */
  function dialog(o) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'nx-overlay';
      overlay.innerHTML =
          '<div class="nx-dialog" role="dialog" aria-modal="true">'
        +   '<p class="nx-dialog-title"></p><p class="nx-dialog-text"></p>'
        +   (o.input ? '<input class="nx-dialog-input"/><p class="nx-dialog-error"></p>' : '')
        +   '<div class="nx-dialog-actions">'
        +     '<button class="tb-btn ghost" data-nx="cancel">Annuler</button>'
        +     '<button class="tb-btn primary" data-nx="ok"></button>'
        +   '</div>'
        + '</div>';
      overlay.querySelector('.nx-dialog-title').textContent = o.title || '';
      overlay.querySelector('.nx-dialog-text').textContent  = o.text  || '';

      const ok    = overlay.querySelector('[data-nx="ok"]');
      const input = overlay.querySelector('.nx-dialog-input');
      const err   = overlay.querySelector('.nx-dialog-error');
      ok.textContent = o.okText || 'Valider';
      if (o.danger) ok.style.background = 'var(--red)';
      if (input) { input.value = o.value || ''; input.placeholder = o.placeholder || ''; }

      const done = (v) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve(v);
      };
      const submit = () => {
        const v   = input ? input.value.trim() : '';
        const msg = o.validate ? o.validate(v) : '';
        if (msg) { err.textContent = msg; input.focus(); return; }
        done(v);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') done(null);
        if (e.key === 'Enter')  submit();
      };

      ok.addEventListener('click', submit);
      overlay.querySelector('[data-nx="cancel"]').addEventListener('click', () => done(null));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) done(null); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      (input || ok).focus();
    });
  }

  function ask(opts)           { return dialog(Object.assign({}, opts, { input: true })); }
  function confirmDialog(opts) { return dialog(Object.assign({}, opts, { input: false })).then(v => v !== null); }

  function init() {
    document.querySelectorAll('[data-action="voir-tout"]').forEach(btn => {
      const card = cardOf(btn);
      if (card) refresh(card);
    });
  }

  window.NexusUI = { ask, confirm: confirmDialog, refresh };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
