(function(){
  const KEY = 'theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function apply(theme){
    if (theme === 'dark' || theme === 'light' || theme === 'energie' || theme === 'pure'){
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem(KEY, theme); } catch(_) {}
      if (btn){
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        const label = theme === 'dark' ? 'Thème: sombre' : theme === 'light' ? 'Thème: clair' : theme === 'energie' ? 'Thème: énergie' : 'Thème: pur';
        btn.textContent = label;
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
      const order = ['dark','light','energie','pure'];
      const current = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const idx = Math.max(0, order.indexOf(current));
      const next = order[(idx + 1) % order.length];
      apply(next);
    });
  }
})();

