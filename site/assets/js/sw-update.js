(function () {
  if (!('serviceWorker' in navigator)) return;
  function injectButton() {
    const id = 'sw-update-btn';
    if (document.getElementById(id)) return;
    const btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.textContent = 'Mettre à jour le site';
    btn.style.position = 'fixed'; btn.style.right = '16px'; btn.style.bottom = '16px'; btn.style.zIndex = '60';
    btn.style.display = 'none';
    btn.addEventListener('click', () => { navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.update()))).then(() => location.reload()); });
    document.body.appendChild(btn);
    return btn;
  }
  const btn = injectButton();
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (btn) btn.style.display = 'inline-flex'; });
})();
