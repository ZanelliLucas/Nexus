/* ============================================
   NEXUS — dates.js
   Dates de démo calculées à partir d'aujourd'hui,
   pour que le site ne soit jamais daté.

   HTML : le texte affiché reste le fallback sans JS,
          le gabarit est dans data-date :
     <span data-date="{dm:-2}">28 Nov</span>
     <input data-date="{iso1:0}" data-date-attr="value">

   Jetons ({type:décalage}) :
     dm    jour J+n        → "28 Nov"
     dmy   jour J+n        → "28 Nov 2026"
     iso   jour J+n        → "2026-11-28"
     iso1  1er du mois M+n → "2026-11-01"
     mon   mois M+n        → "Nov"
     Month mois M+n        → "Novembre"
     year  mois M+n        → "2026"
     q     mois M+n        → "Q4"

   JS : NexusDates.last7(), lastMonths(n), lastTimes(n, pasMin, court)
        pour les libellés d'axes des graphiques.
   ============================================ */

(function () {

  const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const MOIS        = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const JOURS       = 'DLMMJVS'; // getDay() : 0 = dimanche

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function addDays(n)   { return new Date(today.getFullYear(), today.getMonth(), today.getDate() + n); }
  function addMonths(n) { return new Date(today.getFullYear(), today.getMonth() + n, 1); }
  function pad(n)       { return String(n).padStart(2, '0'); }
  function iso(d)       { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  const TOKENS = {
    dm:    n => { const d = addDays(n); return d.getDate() + ' ' + MOIS_COURTS[d.getMonth()]; },
    dmy:   n => { const d = addDays(n); return d.getDate() + ' ' + MOIS_COURTS[d.getMonth()] + ' ' + d.getFullYear(); },
    iso:   n => iso(addDays(n)),
    iso1:  n => iso(addMonths(n)),
    mon:   n => MOIS_COURTS[addMonths(n).getMonth()],
    Month: n => MOIS[addMonths(n).getMonth()],
    year:  n => String(addMonths(n).getFullYear()),
    q:     n => 'Q' + (Math.floor(addMonths(n).getMonth() / 3) + 1),
  };

  // Remplace les jetons {type:n} d'une chaîne
  function fmt(tpl) {
    return tpl.replace(/\{(\w+):([+-]?\d+)\}/g, (m, type, n) => TOKENS[type] ? TOKENS[type](parseInt(n, 10)) : m);
  }

  // Libellés des 7 derniers jours, aujourd'hui inclus : ['M 8', …, 'L 14']
  function last7() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(-i);
      out.push(JOURS[d.getDay()] + ' ' + d.getDate());
    }
    return out;
  }

  // Libellés des n derniers mois, mois courant inclus : ['Juil', 'Août', 'Sep']
  function lastMonths(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(MOIS_COURTS[addMonths(-i).getMonth()]);
    return out;
  }

  // n libellés horaires espacés de stepMin minutes, le dernier = maintenant arrondi au pas
  // inférieur (heure locale) : lastTimes(7, 10) → ['13h50', …, '14h50'] ; short → '14h'
  function lastTimes(n, stepMin, short) {
    const d = new Date();
    const end = Math.floor((d.getHours() * 60 + d.getMinutes()) / stepMin) * stepMin;
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const t = ((end - i * stepMin) % 1440 + 1440) % 1440;
      out.push(pad(Math.floor(t / 60)) + 'h' + (short ? '' : pad(t % 60)));
    }
    return out;
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-date]').forEach(el => {
      const val = fmt(el.dataset.date);
      if (el.dataset.dateAttr) el.setAttribute(el.dataset.dateAttr, val);
      else el.textContent = val;
    });
  }

  window.NexusDates = { fmt, iso, addDays, last7, lastMonths, lastTimes, apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply());
  } else {
    apply();
  }

})();
