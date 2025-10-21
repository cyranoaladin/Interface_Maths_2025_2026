(function () {
  function oncePerDay(key, fn) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stamp = localStorage.getItem(key);
      if (stamp !== today) { fn(); localStorage.setItem(key, today); }
    } catch (_) {}
  }

  function celebrateAddFav() {
    oncePerDay('celebrate-fav', function () {
      const b = document.createElement('div');
      b.textContent = '✨';
      b.setAttribute('aria-hidden', 'true');
      b.style.cssText = 'position:fixed;right:16px;bottom:16px;font-size:28px;animation:ob-pop .9s ease;z-index:70';
      document.body.appendChild(b);
      setTimeout(function () { b.remove(); }, 1200);
    });
  }

  function showOnboarding() {
    try {
      if (localStorage.getItem('onboarding-done') === '1') return;
    } catch (_) {}
    const wrap = document.createElement('div');
    wrap.className = 'onboard';
    wrap.innerHTML = '\
    <div class="onboard-card" role="dialog" aria-modal="true" aria-labelledby="ob-title">\
      <h2 id="ob-title">Bienvenue 👋</h2>\
      <ol>\
        <li>Utilisez la <strong>Recherche</strong> (mots-clés).</li>\
        <li>Activez les <strong>Filtres</strong> par type de ressource.</li>\
        <li>Ajoutez à vos <strong>Favoris</strong> pour réviser plus vite.</li>\
      </ol>\
      <button id="ob-ok" class="btn">J’ai compris</button>\
    </div>';
    document.body.appendChild(wrap);
    const ok = document.getElementById('ob-ok');
    if (ok) ok.addEventListener('click', function () { try { localStorage.setItem('onboarding-done', '1'); } catch (_) {} wrap.remove(); });
  }

  // Expose pour usage interne
  window.celebrateAddFav = celebrateAddFav;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showOnboarding);
  } else {
    showOnboarding();
  }
})();
