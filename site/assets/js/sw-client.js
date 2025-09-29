if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw && nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    });
  }).catch(() => {});
}

function showUpdateToast() {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;background:#151823;color:#e9edf1;border:1px solid #2a2f3a;border-radius:12px;padding:10px 14px;z-index:80;box-shadow:0 10px 30px rgba(0,0,0,.25)';
  t.innerHTML = 'Nouvelle version disponible <button id="upd" class="btn" style="margin-left:10px">Mettre à jour</button>';
  document.body.appendChild(t);
  const btn = document.getElementById('upd');
  if (btn) btn.onclick = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      regs.forEach(r => r.waiting && r.waiting.postMessage({ type: 'SKIP_WAITING' }));
    } catch (_) {}
    location.reload();
  };
}

navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RELOAD') location.reload();
});
