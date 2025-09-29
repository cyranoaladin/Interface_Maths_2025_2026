(function () {
  const QUOTES = [
    { t: "Rien ne se fait sans un peu d’enthousiasme.", a: "— Henri Poincaré" },
    { t: "Les mathématiques sont la poésie des sciences.", a: "— Novalis" },
    { t: "La mathématique est la clé et la porte des sciences.", a: "— Roger Bacon" },
    { t: "Les nombres gouvernent le monde.", a: "— Pythagore" }
  ];
  function pick() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
  function init() {
    const bq = document.getElementById('hero-quote'); if (!bq) return;
    const p = bq.querySelector('p'); const c = bq.querySelector('cite');
    const q = pick();
    if (p) p.textContent = q.t;
    if (c) c.textContent = q.a;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
