(function () {
  const QUOTES = [
    { t: "Les mathématiques sont la poésie des sciences.", a: "— Karl Weierstrass" },
    { t: "Ce n’est pas que je sois si intelligent ; je reste plus longtemps sur les problèmes.", a: "— Albert Einstein" },
    { t: "Rien ne se fait sans un peu d’enthousiasme.", a: "— Henri Poincaré" },
    { t: "La chance sourit aux esprits préparés.", a: "— Louis Pasteur" },
    { t: "La véritable découverte ne consiste pas à chercher de nouveaux paysages, mais à avoir de nouveaux yeux.", a: "— Marcel Proust" },
    { t: "Les mathématiques sont l’alphabet avec lequel Dieu a écrit l’univers.", a: "— Galilée" }
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
