import { test } from '@playwright/test';

test('cleanup service workers, caches, storage', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      try {
        // Optional: clear IndexedDB if supported
        // @ts-ignore
        const dbs = (indexedDB && indexedDB.databases) ? await indexedDB.databases() : [];
        for (const db of dbs || []) {
          await new Promise(resolve => {
            const req = indexedDB.deleteDatabase(db.name as string);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
            req.onblocked = () => resolve(true);
          });
        }
      } catch {}
    } catch {}
  });
});
