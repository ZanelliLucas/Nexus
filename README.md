# NEXUS — démo de tableau de bord

Démo d'un tableau de bord d'administration (analytique, commerce, campagnes, supervision système) en HTML, CSS et JavaScript, sans framework ni build. Toutes les données sont simulées.

**En ligne :** https://nexus-sigma-pearl.vercel.app

## Structure

```
index.html              Accueil (liste des modules)
vercel.json             En-têtes et redirections des anciennes adresses
assets/
  css/responsive.css    Adaptations tablette & mobile communes aux dashboards
  js/sidebar.js         Barre latérale injectée dans chaque page (profil, plan, navigation)
  js/dates.js           Dates et heures de démo calculées à partir du jour de la visite
  js/ui.js              Boutons de tableaux (Voir tout, Filtrer, Rechercher) et fenêtres de saisie
  img/                  Favicon, icône iOS, image de partage
vue-ensemble/  analytique/  rapports/  campagnes/  revenus/  clients/
produits/  commandes/  performance/  logs/  parametres/
  index.html            Page du module
  style.css             Styles de la page
  app.js                Graphiques et interactions de la page
```

Chaque page charge, dans cet ordre : `style.css`, `assets/css/responsive.css`, puis `dates.js`, `ui.js`, `app.js` et `sidebar.js`.

## Fonctionnement

- **Dates automatiques** : dans le HTML, une date s'écrit avec un gabarit, par exemple `<span data-date="{dm:-2}">28 Nov</span>` (il y a 2 jours). Les jetons disponibles sont décrits en tête de `assets/js/dates.js`. Dans les scripts : `NexusDates.last7()`, `lastMonths(n)`, `lastTimes(n, pasMin)`.
- **Boutons de tableaux** : ajouter `data-action="voir-tout"`, `"filtrer"` ou `"rechercher"` sur un bouton placé dans une `.table-card`.
- **Fenêtres de saisie** : `await NexusUI.ask({ title, validate })` et `await NexusUI.confirm({ title })` plutôt que `prompt()` / `confirm()`.
- **Persistance** : le profil et la photo (`nexus_profile`, `nexus_avatar`), les interrupteurs (`nexus_toggles`) et le reste des paramètres (`nexus_settings`) sont stockés dans le `localStorage` du visiteur. `localStorage.clear()` remet la démo à zéro.

## Lancer en local

```bash
python -m http.server 5500
```

Puis ouvrir http://localhost:5500. Ouvrir `index.html` directement dans le navigateur fonctionne aussi.

## Déploiement

Chaque push sur `main` est déployé automatiquement par Vercel.
