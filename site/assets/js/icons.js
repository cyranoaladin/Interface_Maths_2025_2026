(function(){
  function init(){
    if (window.lucide && typeof window.lucide.createIcons === 'function'){
      try { window.lucide.createIcons(); } catch(_){}
    }
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})();
