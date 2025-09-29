(() => {
  const container = document.getElementById('auto-index-body');
  if (!container) return;

  const searchInput = document.getElementById('search-input');
  const tagFiltersEl = document.getElementById('tag-filters');
  const typeFiltersEl = document.getElementById('type-filters');
  const tabAll = document.getElementById('tab-all');
  const tabFav = document.getElementById('tab-fav');
  const suggestionsEl = document.getElementById('search-suggestions');
  const resetBtn = document.getElementById('reset-filters');
  let fullGroups = null;
  let allItems = [];
  let query = '';
  let tagFilter = '';
  let favoritesOnly = false;

  const TAGS = ['Analyse', 'Probabilités', 'Géométrie', 'Arithmétique', 'Algèbre', 'Trigonométrie'];
  const TYPES = ['Cours', 'Fiche', 'Exercices', 'Éval', 'Article'];
  let typeFilter = '';

  function normalize(str) {
    return (str || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase();
  }

  function sortItems(items) {
    const isProg = (t) => /^progression\b/i.test(t.trim());
    return [...items].sort((a, b) => {
      const ap = isProg(a.title) ? 0 : 1;
      const bp = isProg(b.title) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.title.localeCompare(b.title, 'fr');
    });
  }

  function computeType(it) {
    const t = normalize(it.title);
    if (/\bcours\b/.test(t)) return 'Cours';
    if (/(\bfiche\b|mémo|méthodo)/.test(t)) return 'Fiche';
    if (/exercices?/.test(t)) return 'Exercices';
    if (/(éval|evaluation|corrigé|corrige)/.test(t)) return 'Éval';
    if (/article|note/.test(t)) return 'Article';
    return '';
  }
  function typeIcon(type) {
    switch (type) {
      case 'Cours': return 'book-open';
      case 'Fiche': return 'file-text';
      case 'Exercices': return 'divide-square';
      case 'Éval': return 'target';
      case 'Article': return 'compass';
      default: return '';
    }
  }

  function computeTags(it) {
    const t = normalize(it.title);
    const tags = new Set();
    if (/(suite|limite|continuit|d[ée]riv|convexit|int[ée]gral|primit|exponent|log)/.test(t)) tags.add('Analyse');
    if (/(probabilit|binomial|loi|variable al[ée]atoire|esp[ée]rance|variance)/.test(t)) tags.add('Probabilités');
    if (/(g[ée]om[ée]tr|vecteur|produit scalaire|droite|plan|espace)/.test(t)) tags.add('Géométrie');
    if (/(arithm[ée]tique|divisibilit|congruence)/.test(t)) tags.add('Arithmétique');
    if (/(polyn[ôo]me|second degr|calcul litt[ée]ral)/.test(t)) tags.add('Algèbre');
    if (/(trigo|sinus|cosinus|cercle trigonom)/.test(t)) tags.add('Trigonométrie');
    return Array.from(tags);
  }
  function tagIcon(name) {
    switch (name) {
      case 'Analyse': return 'trending-up';
      case 'Algèbre': return 'sigma';
      case 'Géométrie': return 'shapes';
      case 'Probabilités': return 'dice-5';
      case 'Trigonométrie': return 'sine-wave';
      case 'Arithmétique': return 'hash';
      default: return '';
    }
  }

  function readFavorites() {
    try {
      const raw = localStorage.getItem('favorites');
      if (!raw) return new Set();
      return new Set(JSON.parse(raw));
    } catch { return new Set(); }
  }
  function writeFavorites(set) {
    try { localStorage.setItem('favorites', JSON.stringify(Array.from(set))); } catch {}
  }

  const favSet = readFavorites();

  function flattenGroups(groups) {
    const arr = [];
    for (const [label, items] of Object.entries(groups)) {
      if (label === 'Autres') continue;
      for (const it of items) { arr.push({ ...it, group: label }); }
    }
    return arr;
  }

  function buildTagChips() {
    if (!tagFiltersEl) return;
    tagFiltersEl.innerHTML = '';
    TAGS.forEach(tag => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = tag;
      b.dataset.tag = tag;
      b.setAttribute('aria-pressed', tagFilter === tag ? 'true' : 'false');
      b.addEventListener('click', () => {
        tagFilter = (tagFilter === tag ? '' : tag);
        buildTagChips(); buildTypeChips();
        render(fullGroups || {});
        updateSuggestions();
      });
      tagFiltersEl.appendChild(b);
    });
  }

  function buildTypeChips() {
    if (!typeFiltersEl) return;
    typeFiltersEl.innerHTML = '';
    TYPES.forEach(tp => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = tp;
      b.dataset.type = tp;
      b.setAttribute('aria-pressed', typeFilter === tp ? 'true' : 'false');
      b.addEventListener('click', () => {
        typeFilter = (typeFilter === tp ? '' : tp);
        buildTypeChips(); buildTagChips();
        render(fullGroups || {});
        updateSuggestions();
      });
      typeFiltersEl.appendChild(b);
    });
  }

  function updateSuggestions() {
    if (!suggestionsEl) return;
    const q = normalize(query);
    suggestionsEl.innerHTML = '';
    if (!q || q.length < 2) { return; }
    const matches = allItems.filter(it => normalize(it.title).includes(q))
      .slice(0, 8);
    if (!matches.length) return;
    const ul = document.createElement('ul'); ul.className = 'suggestions-list';
    matches.forEach(it => {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = it.url; a.target = '_blank'; a.rel = 'noopener';
      const spanT = document.createElement('span'); spanT.textContent = it.title;
      const spanG = document.createElement('span'); spanG.textContent = it.group || ''; spanG.className = 'suggestion-group';
      a.appendChild(spanT); a.appendChild(spanG);
      li.appendChild(a); ul.appendChild(li);
    });
    suggestionsEl.appendChild(ul);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch {}
    }
  }

  function render(groups) {
    const frag = document.createDocumentFragment();
    const q = normalize(query);
    for (const [label, items] of Object.entries(groups)) {
      if (label === 'Autres') continue; // masquer le groupe "Autres"
      const itemsSorted = sortItems(items);
      const filtered = itemsSorted.filter(it => {
        const matchQ = q ? normalize(it.title).includes(q) : true;
        const tags = computeTags(it);
        const matchTag = tagFilter ? tags.includes(tagFilter) : true;
        const isFav = favSet.has(it.url);
        const matchFav = favoritesOnly ? isFav : true;
        const tp = computeType(it);
        const matchType = typeFilter ? (tp === typeFilter) : true;
        return matchQ && matchTag && matchFav && matchType;
      });
      if (!filtered.length) continue;
      const section = document.createElement('section');
      const h3 = document.createElement('h3'); h3.textContent = label;
      const grid = document.createElement('div'); grid.className = 'grid cols-3';
      filtered.forEach(it => {
        const type = computeType(it);
        const card = document.createElement('div'); card.className = 'card resource-card' + (type ? (' type-' + normalize(type)) : '');
        const a = document.createElement('a'); a.className = 'card-link'; a.href = it.url; a.target = '_blank'; a.rel = 'noopener';
        const title = document.createElement('strong'); title.textContent = it.title;
        const head = document.createElement('div'); head.className = 'card-head';
        const bigIco = document.createElement('i'); bigIco.className = 'card-big-icon icon-type-' + normalize(computeType(it) || 'default'); bigIco.setAttribute('data-lucide', typeIcon(computeType(it)) || 'file');
        head.appendChild(bigIco); head.appendChild(title); a.appendChild(head);
        const badges = document.createElement('div'); badges.className = 'badges';
        if (type) { const b = document.createElement('span'); b.className = 'badge type-' + normalize(type); const ico = document.createElement('i'); ico.setAttribute('data-lucide', typeIcon(type)); ico.setAttribute('aria-hidden', 'true'); b.appendChild(ico); const tt = document.createTextNode(' ' + type); b.appendChild(tt); badges.appendChild(b); }
        const tags = computeTags(it);
        tags.forEach(t => { const b = document.createElement('span'); b.className = 'badge tag-' + normalize(t); const ti = document.createElement('i'); ti.setAttribute('data-lucide', tagIcon(t)); ti.setAttribute('aria-hidden', 'true'); b.appendChild(ti); b.appendChild(document.createTextNode(' ' + t)); badges.appendChild(b); });
        // Academic description based on tag/type
        const description = (() => {
          const t = normalize(it.title);
          if (tags.includes('Analyse')) {
            if (/log/.test(t)) return 'Fonction logarithme népérien';
            if (/int[ée]gr/.test(t)) return 'Calcul intégral et applications';
            if (/suite|arithm|g[ée]om[ée]tr/.test(t)) return 'Suites arithmétiques et géométriques';
            if (/d[ée]riv|convex/.test(t)) return 'Définitions, propriétés et exercices';
          }
          if (tags.includes('Probabilités')) return 'Lois de probabilité et applications';
          if (tags.includes('Géométrie')) return 'Vecteurs, droites et plans';
          if (tags.includes('Arithmétique')) return 'Divisibilité et congruences';
          if (tags.includes('Algèbre')) return 'Polynômes, égalités et méthodes';
          if (tags.includes('Trigonométrie')) return 'Fonctions sinus et cosinus';
          return it.group ? ('Ressource — ' + it.group) : 'Ressource';
        })();
        const sub = document.createElement('small'); sub.className = 'small subdesc'; sub.textContent = description; a.appendChild(sub);
        a.appendChild(badges);
        const star = document.createElement('button'); star.type = 'button'; star.className = 'star-btn'; star.setAttribute('aria-label', 'Ajouter aux favoris'); star.setAttribute('aria-pressed', favSet.has(it.url) ? 'true' : 'false');
        const icon = document.createElement('i'); icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('data-lucide', 'heart');
        star.appendChild(icon);
        star.addEventListener('click', (e) => {
          e.preventDefault();
          const has = favSet.has(it.url);
          if (has) favSet.delete(it.url); else favSet.add(it.url);
          writeFavorites(favSet);
          star.setAttribute('aria-pressed', favSet.has(it.url) ? 'true' : 'false');
          render(fullGroups || {});
        });
        card.appendChild(a);
        card.appendChild(star);
        grid.appendChild(card);
      });
      section.appendChild(h3); section.appendChild(grid);
      frag.appendChild(section);
    }
    container.innerHTML = '';
    if (!frag.childNodes.length) { container.innerHTML = '<small>Aucun contenu détecté.</small>'; updateCount(0); return; }
    container.appendChild(frag);
    // mettre à jour le compteur
    try {
      const numCards = container.querySelectorAll('.resource-card').length;
      updateCount(numCards);
    } catch {}
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch {}
    }
  }

  function setDataAndRender(groups) {
    fullGroups = groups;
    allItems = flattenGroups(groups);
    buildTagChips(); buildTypeChips();
    render(fullGroups);
    updateSuggestions();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => { query = e.target.value || ''; render(fullGroups || {}); updateSuggestions(); });
  }
  function setTab() {
    if (tabAll) tabAll.setAttribute('aria-selected', favoritesOnly ? 'false' : 'true');
    if (tabFav) tabFav.setAttribute('aria-selected', favoritesOnly ? 'true' : 'false');
  }
  if (tabAll) { tabAll.addEventListener('click', () => { favoritesOnly = false; setTab(); render(fullGroups || {}); updateSuggestions(); }); }
  if (tabFav) { tabFav.addEventListener('click', () => { favoritesOnly = true; setTab(); render(fullGroups || {}); updateSuggestions(); }); }
  setTab();
  if (location.hash && /favoris/i.test(location.hash)) { favoritesOnly = true; setTab(); }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      typeFilter = ''; tagFilter = ''; query = '';
      if (searchInput) searchInput.value = '';
      buildTypeChips(); buildTagChips(); setTab();
      render(fullGroups || {}); updateSuggestions();
    });
  }

  function updateCount(n) {
    const el = document.getElementById('results-count');
    if (!el) return;
    el.textContent = n === 1 ? '1 résultat' : (n + ' résultats');
  }

  function groupTree(node) {
    const groups = {
      'EDS Première': [],
      'EDS Terminale': [],
      'Maths expertes': [],
      Autres: [],
    };
    function walk(n, basePath = []) {
      if (!n || !n.children) return;
      for (const c of n.children) {
        if (c.type === 'dir') walk(c, basePath.concat(c.name));
        else if (c.type === 'file') {
          const path = (c.path || '').toLowerCase();
          const item = { title: c.title || c.name, url: '/content/' + c.path };
          if (path.startsWith('eds_premiere/')) groups['EDS Première'].push(item);
          else if (path.startsWith('eds_terminale/')) groups['EDS Terminale'].push(item);
          else if (path.startsWith('maths_expertes/')) groups['Maths expertes'].push(item);
          else groups['Autres'].push(item);
        }
      }
    }
    walk(node);
    return groups;
  }

  // Préférer le statique en production (pas d'API sur le VPS)
  const isHttp = location.protocol === 'http:' || location.protocol === 'https:';

  function fetchApiTree() {
    return fetch('/api/tree').then(r => {
      if (!r.ok) throw new Error('no api');
      return r.json();
    });
  }

  function handleApiTree(tree) {
    const groups = groupTree(tree);
    setDataAndRender(groups);
  }

  function handleApiError(e) {
    container.innerHTML = '<small>Impossible de charger le sommaire.</small>';
  }

  const tryApi = () =>
    fetchApiTree()
      .then(handleApiTree)
      .catch(handleApiError);

  const tryStaticJson = () => fetch('assets/contents.json').then(r => { if (!r.ok) throw new Error('no contents.json'); return r.json(); }).then(data => { if (data && data.groups) setDataAndRender(data.groups); else throw new Error('invalid contents.json'); });
  const tryStaticJs = () => new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'assets/contents.static.js'; s.onload = () => { try { if (window.__SITE_CONTENTS__?.groups) { setDataAndRender(window.__SITE_CONTENTS__.groups); resolve(); } else reject(new Error('no data')); } catch (e) { reject(e); } }; s.onerror = reject; document.head.appendChild(s);
  });
  // Ordre optimisé pour file:// : JS statique -> JSON -> API
  tryStaticJs()
    .catch(() => tryStaticJson())
    .catch(() => (isHttp ? tryApi() : Promise.reject()))
    .catch(() => {
      container.innerHTML = '<small>Impossible de charger le sommaire.</small>';
    });
})();
