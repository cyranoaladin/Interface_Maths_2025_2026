(function () {
  function updateFavBadge() {
    try {
      const favBadge = document.getElementById('fav-count');
      if (!favBadge) return;
      const raw = localStorage.getItem('favorites');
      const n = raw ? (JSON.parse(raw) || []).length : 0;
      favBadge.textContent = String(n);
      favBadge.style.display = n > 0 ? 'inline-block' : 'none';
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
