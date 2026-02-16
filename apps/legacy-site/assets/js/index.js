function getToken() {
  try {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

function setLoginLabel() {
  const link = document.getElementById('login-link');
  if (!link) return;
  if (getToken()) {
    link.textContent = 'Mon espace';
    link.setAttribute('href', '/content/dashboard.html');
  } else {
    link.textContent = 'Se connecter';
    link.setAttribute('href', '/content/login.html');
  }
}

const entries = [
  { title: 'Suites numériques', href: '/content/EDS_terminale/Suites/' },
  { title: 'Second degré', href: '/content/EDS_premiere/Second_Degre/' },
  { title: 'Fonctions', href: '/content/EDS_terminale/Fonctions/' },
];

function readFavs() {
  try {
    const raw = localStorage.getItem('im_favs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavs(favs) {
  try {
    localStorage.setItem('im_favs', JSON.stringify(favs));
  } catch {}
}

function renderList(query) {
  const q = (query || '').trim().toLowerCase();
  const container = document.getElementById('auto-index-body');
  const count = document.getElementById('results-count');
  const badge = document.querySelector('[data-fav-badge]');
  if (!container || !count || !badge) return;

  const favs = readFavs();
  const filtered = entries.filter((e) => e.title.toLowerCase().includes(q));
  count.textContent = `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`;
  badge.textContent = String(favs.length);

  container.innerHTML = '';
  filtered.forEach((e) => {
    const card = document.createElement('article');
    card.className = 'resource-card card mt-6';
    card.innerHTML = `
      <a href="${e.href}">${e.title}</a>
      <button type="button" class="star-btn" aria-label="Favori">★</button>
    `;
    const btn = card.querySelector('.star-btn');
    btn?.addEventListener('click', () => {
      const list = readFavs();
      if (!list.includes(e.title)) list.push(e.title);
      writeFavs(list);
      badge.textContent = String(list.length);
    });
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setLoginLabel();
  const input = document.getElementById('search-input');
  input?.addEventListener('input', (e) => {
    const value = e.target && 'value' in e.target ? e.target.value : '';
    renderList(value);
  });
  renderList('');
});
