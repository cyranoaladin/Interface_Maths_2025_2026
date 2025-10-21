(function(){
  const KEY = 'neon';
  function apply(on){
    const root = document.documentElement;
    if (on){ root.setAttribute('data-neon','on'); } else { root.removeAttribute('data-neon'); }
    try{ localStorage.setItem(KEY, on ? 'on' : 'off') }catch{}
    const btn = document.getElementById('neon-toggle');
    if (btn){ btn.setAttribute('aria-pressed', on ? 'true':'false'); btn.textContent = on ? 'Néon: on' : 'Néon'; }
  }
  function init(){
    const saved = (()=>{ try { return localStorage.getItem(KEY) } catch{ return null } })();
    apply(saved === 'on');
    const btn = document.getElementById('neon-toggle');
    if (btn){
      btn.addEventListener('click', ()=>{
        const on = document.documentElement.getAttribute('data-neon') === 'on';
        apply(!on);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
