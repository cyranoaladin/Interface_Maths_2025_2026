(function(){
  const KEY = 'theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function apply(theme){
    if (theme === 'dark' || theme === 'light'){
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem(KEY, theme); } catch(_) {}
      if (btn){
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        btn.textContent = theme === 'dark' ? 'Thème: sombre' : 'Thème: clair';
      }
    } else {
      root.removeAttribute('data-theme');
      try { localStorage.removeItem(KEY); } catch(_) {}
    }
  }

  const saved = (()=>{ try { return localStorage.getItem(KEY); } catch(_) { return null; } })();
  if (saved){
    apply(saved);
  } else if (btn){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    btn.setAttribute('aria-pressed', prefersDark ? 'true' : 'false');
    btn.textContent = prefersDark ? 'Thème: sombre' : 'Thème: clair';
  }

  if (btn){
    btn.addEventListener('click', function(){
      const current = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      apply(next);
    });
  }
})();

