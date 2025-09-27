(function () {
  const TYPE_ICON = { 'Cours': 'book-open', 'Fiche': 'file-text', 'Exercices': 'divide-square', 'Éval': 'target', 'Article': 'compass' };
  function normalize(s) { return (s || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase(); }
  function computeType(title) {
    const t = normalize(title);
    if (/\bcours\b/.test(t)) return 'Cours';
    if (/(\bfiche\b|mémo|methodo|m[ée]thodo)/.test(t)) return 'Fiche';
    if (/exercices?/.test(t)) return 'Exercices';
    if (/(eval|[éé]val|corrig[ée]|corrige)/.test(t)) return 'Éval';
    if (/article|note/.test(t)) return 'Article';
    return '';
  }
  function computeTags(title) {
    const t = normalize(title), tags = new Set();
    if (/(suite|limite|deriv|convexit|integral|primit|exponent|log)/.test(t)) tags.add('Analyse');
    if (/(polynome|second degre|calcul litteral|arith|divisibil|congru)/.test(t)) tags.add('Algèbre');
    if (/(vecteur|produit scalaire|droite|plan|espace|geometr)/.test(t)) tags.add('Géométrie');
    if (/(probabilit|binomial|loi|variable aleatoire|esperance|variance)/.test(t)) tags.add('Probabilités');
    if (/(trigo|sinus|cosinus|cercle trigonom)/.test(t)) tags.add('Trigonométrie');
    if (/(arithmetique|divisibilit|congruence)/.test(t)) tags.add('Arithmétique');
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
  function readFav() { try { const r = localStorage.getItem('favorites'); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); } }
  function writeFav(s) { try { localStorage.setItem('favorites', JSON.stringify(Array.from(s))); } catch {} }

  function init() {
    const levelAttr = (document.body.getAttribute('data-level') || '').toLowerCase();
    if (!levelAttr) return;
    const levelMap = { 'eds_premiere': 'eds_premiere/', 'eds_terminale': 'eds_terminale/', 'maths_expertes': 'maths_expertes/' };
    const base = levelMap[levelAttr]; if (!base) return;
    const cardsEl = document.getElementById('level-cards'); if (!cardsEl) return;
    const searchEl = document.getElementById('level-search');
    const tagFiltersEl = document.getElementById('level-tag-filters');
    const typeFiltersEl = document.getElementById('level-type-filters');
    const resetBtn = document.getElementById('level-reset-filters');
    const TAGS = ['Analyse', 'Algèbre', 'Géométrie', 'Probabilités', 'Trigonométrie', 'Arithmétique'];
    const TYPES = ['Cours', 'Fiche', 'Exercices', 'Éval', 'Article'];
    let q = '', tag = '', type = '';
    const fav = readFav();

    function render(items) {
      const n = (s) => normalize(s);
      const filtered = items.filter(it => n(it.url || '').startsWith(base))
        .filter(it => q ? n(it.title).includes(n(q)) : true)
        .filter(it => type ? (computeType(it.title) === type) : true)
        .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
      cardsEl.innerHTML = '';
      if (!filtered.length) { cardsEl.innerHTML = '<small>Aucune ressource trouvée.</small>'; return; }
      filtered.forEach(it => {
        const type = computeType(it.title);
        const link = document.createElement('a'); link.className = 'card-link';
        const raw = (it.url || '').replace(/^\/+/, '');
        link.href = /^https?:\/\//.test(raw) ? raw : ('../' + raw);
        link.target = '_blank'; link.rel = 'noopener';
        const h = document.createElement('strong'); h.textContent = it.title;
        const head = document.createElement('div'); head.className = 'card-head';
        const typeSlug = type ? type.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu, '').replace(/[^a-z0-9]+/g, '-') : 'default';
        const bi = document.createElement('i'); bi.className = 'card-big-icon icon-type-' + typeSlug; bi.setAttribute('data-lucide', TYPE_ICON[type] || 'file'); head.appendChild(bi); head.appendChild(h);
        link.appendChild(head);
        const badges = document.createElement('div'); badges.className = 'badges';
        if (type) { const b = document.createElement('span'); b.className = 'badge'; const ico = document.createElement('i'); ico.setAttribute('data-lucide', TYPE_ICON[type] || ''); ico.setAttribute('aria-hidden', 'true'); b.appendChild(ico); b.appendChild(document.createTextNode(' ' + type)); badges.appendChild(b); }
        const tags = computeTags(it.title); tags.forEach(tt => { const b = document.createElement('span'); b.className = 'badge tag-' + n(tt); const ti = document.createElement('i'); ti.setAttribute('data-lucide', tagIcon(tt)); ti.setAttribute('aria-hidden', 'true'); b.appendChild(ti); b.appendChild(document.createTextNode(' ' + tt)); badges.appendChild(b); });
        const sub = document.createElement('small'); sub.className = 'small'; sub.textContent = type ? ('Ressource — ' + type) : 'Ressource'; link.appendChild(sub);
        link.appendChild(badges);
        const star = document.createElement('button'); star.type = 'button'; star.className = 'star-btn'; star.setAttribute('aria-pressed', fav.has(it.url) ? 'true' : 'false'); const i = document.createElement('i'); i.setAttribute('data-lucide', 'star'); i.setAttribute('aria-hidden', 'true'); star.appendChild(i);
        star.addEventListener('click', (e) => { e.preventDefault(); const has = fav.has(it.url); if (has) fav.delete(it.url); else fav.add(it.url); writeFav(fav); star.setAttribute('aria-pressed', fav.has(it.url) ? 'true' : 'false'); });
        const container = document.createElement('div'); container.className = 'card resource-card' + (type ? (' type-' + typeSlug) : ''); container.appendChild(link); container.appendChild(star);
        cardsEl.appendChild(container);
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch {}
      }
    }

    function buildTagChips() {
      tagFiltersEl.innerHTML = '';
      TAGS.forEach(tg => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = tg; b.dataset.tag = tg; b.setAttribute('aria-pressed', tag === tg ? 'true' : 'false');
        b.addEventListener('click', () => { tag = (tag === tg ? '' : tg); buildTagChips(); buildTypeChips(); fetchAndRender(); });
        tagFiltersEl.appendChild(b);
      });
    }

    function buildTypeChips() {
      if (!typeFiltersEl) return;
      typeFiltersEl.innerHTML = '';
      TYPES.forEach(tp => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = tp; b.dataset.type = tp; b.setAttribute('aria-pressed', type === tp ? 'true' : 'false');
        b.addEventListener('click', () => { type = (type === tp ? '' : tp); buildTypeChips(); buildTagChips(); fetchAndRender(); });
        typeFiltersEl.appendChild(b);
      });
    }

    function fetchAndRender() {
      // Prefer JSON, then static JS fallback (works in file://), else error
      const tryJson = () => fetch('../assets/contents.json')
        .then(r => { if (!r.ok) throw new Error('no json'); return r.json(); })
        .then(data => (data && data.all) ? data.all : []);
      const tryStaticJs = () => new Promise((resolve, reject) => {
        const s = document.createElement('script'); s.src = '../assets/contents.static.js';
        s.onload = () => {
          try {
            const all = (window.__SITE_CONTENTS__ && window.__SITE_CONTENTS__.all) ? window.__SITE_CONTENTS__.all : null;
            if (all) resolve(all); else reject(new Error('no static data'));
          } catch (e) { reject(e); }
        };
        s.onerror = reject; document.head.appendChild(s);
      })
        ;
      (tryJson().catch(() => tryStaticJs()))
        .then((all) => {
          let items = Array.isArray(all) ? all : [];
          if (tag) { items = items.filter(it => computeTags(it.title).includes(tag)); }
          render(items);
        })
        .catch(() => { cardsEl.innerHTML = '<small>Impossible de charger les ressources.</small>'; });
    }

    if (searchEl) { searchEl.addEventListener('input', e => { q = e.target.value || ''; fetchAndRender(); }); }
    if (resetBtn) { resetBtn.addEventListener('click', () => { q = ''; type = ''; tag = ''; if (searchEl) searchEl.value = ''; buildTypeChips(); buildTagChips(); fetchAndRender(); }); }
    buildTagChips(); buildTypeChips();
    fetchAndRender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
