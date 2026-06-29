(function () {
  function slug(s) {
    return (s || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  function scan() {
    const main = document.getElementById('main'); if (!main) return;
    const tables = main.querySelectorAll('table');
    const items = [];
    tables.forEach(tbl => {
      const rows = tbl.querySelectorAll('tbody tr');
      rows.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        const first = tds[0]; const third = tds[2];
        if (!first) return;
        const strong = first.querySelector('strong');
        const title = strong ? strong.textContent.trim() : (first.textContent || '').trim();
        if (!title) return;
        const id = 'ch-' + slug(title);
        if (!tr.id) tr.id = id;
        const duration = third ? (third.textContent || '').trim() : '';
        const links = Array.from(first.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
        items.push({ id, title, duration, links });
      });
    });
    function chapterIcon(title) {
      const t = (title || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase();
      if (/suite|recurr/.test(t)) return 'list-ordered';
      if (/limite/.test(t)) return 'trending-up';
      if (/continuit/.test(t)) return 'infinity';
      if (/deriv|convexit/.test(t)) return 'function-square';
      if (/vecteur|droite|plan|espace/.test(t)) return 'axis-3d';
      if (/produit scalaire/.test(t)) return 'circle-dot';
      if (/logarithme|logarithm/.test(t)) return 'scan-line';
      if (/primitiv|integral|integrale|integr/.test(t)) return 'chart-area';
      if (/binomial|binomiale/.test(t)) return 'dice-3';
      if (/denombrement/.test(t)) return 'grid-3x3';
      if (/(variable )?aleatoire(s)?|variables aleatoires/.test(t)) return 'dice-5';
      if (/trigo|sinus|cosinus/.test(t)) return 'sine-wave';
      return 'bar-chart-3';
    }
    const target = document.getElementById('timeline');
    if (target) {
      if (!items.length) { target.innerHTML = '<small>Explore tes ressources, et tes progrès s\'afficheront ici !</small>'; }
      else {
        const div = document.createElement('div'); div.className = 'timeline alt';
        items.forEach((it, idx) => {
          const row = document.createElement('div'); row.className = 'row';
          const left = document.createElement('div'); left.className = 'cell left';
          const right = document.createElement('div'); right.className = 'cell right';
          const a = document.createElement('a'); a.href = '#' + it.id; a.textContent = it.title + (it.duration ? ' (' + it.duration + ' sem.)' : '');
          const detail = document.createElement('div'); detail.className = 'badges';
          if (it.links && it.links.length) { it.links.forEach(l => { const b = document.createElement('span'); b.className = 'badge'; b.textContent = l.text; detail.appendChild(b); }); }
          const marker = document.createElement('div'); marker.className = 'marker'; const icon = document.createElement('i'); icon.setAttribute('data-lucide', chapterIcon(it.title)); icon.setAttribute('aria-hidden', 'true'); marker.appendChild(icon);
          const cardWrap = document.createElement('div'); cardWrap.className = 'timeline-card'; cardWrap.appendChild(a); cardWrap.appendChild(detail);
          if (idx % 2 === 0) { left.appendChild(cardWrap); row.appendChild(left); row.appendChild(marker); row.appendChild(right); }
          else { row.appendChild(left); row.appendChild(marker); right.appendChild(cardWrap); row.appendChild(right); }
          div.appendChild(row);
        });
        target.innerHTML = ''; target.appendChild(div);
      }
    }
    const grid = document.getElementById('chapters-grid');
    if (grid) {
      grid.innerHTML = '';
      if (!items.length) { grid.innerHTML = '<small>Aucune entrée détectée.</small>'; }
      else {
        const cont = document.createElement('div'); cont.className = 'grid cols-3';
        items.forEach((it, idx) => {
          const card = document.createElement('div'); card.className = 'card';
          const title = document.createElement('strong'); title.textContent = (idx + 1) + '. ' + it.title; card.appendChild(title);
          if (it.duration) { const b = document.createElement('div'); b.className = 'badges'; const d = document.createElement('span'); d.className = 'badge'; d.textContent = 'Durée: ' + it.duration + ' sem.'; b.appendChild(d); card.appendChild(b); }
          if (it.links && it.links.length) { const b = document.createElement('div'); b.className = 'badges'; it.links.forEach(l => { const s = document.createElement('a'); s.href = l.href; s.target = '_blank'; s.rel = 'noopener'; const span = document.createElement('span'); span.className = 'badge'; span.textContent = l.text; s.appendChild(span); b.appendChild(s); }); card.appendChild(b); }
          cont.appendChild(card);
        });
        grid.appendChild(cont);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
