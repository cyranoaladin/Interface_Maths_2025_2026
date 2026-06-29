(function () {
  function updateFavBadge() {
    try {
      const favBadge = document.getElementById('fav-count');
      const favDot = document.querySelector('[data-fav-badge]');
      const raw = localStorage.getItem('favorites');
      const n = raw ? (JSON.parse(raw) || []).length : 0;
      if (favBadge) {
        favBadge.textContent = String(n);
        favBadge.style.display = n > 0 ? 'inline-block' : 'none';
      }
      if (favDot) {
        favDot.textContent = n > 0 ? String(n) : '';
        favDot.style.display = n > 0 ? 'inline-block' : 'none';
      }
    } catch (_) {}
  }
  function init() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (_) {}
    }
    updateFavBadge();
    // mettre à jour dès qu'un favori change
    window.addEventListener('storage', (e) => { if (e.key === 'favorites') updateFavBadge(); });
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && (t.closest && t.closest('.star-btn'))) setTimeout(updateFavBadge, 50);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
