const items=[
  { t: "Les mathématiques sont la poésie des sciences.", a: "— Karl Weierstrass" },
  { t: "Rien ne se fait sans un peu d’enthousiasme.", a: "— Henri Poincaré" },
  { t: "Ce n’est pas que je sois si intelligent ; je reste plus longtemps sur les problèmes.", a: "— Albert Einstein" }
];
export default function Citations(){const q=items[Math.floor(Math.random()*items.length)];return(<blockquote className="italic text-slate-200/90"><p>{q.t}</p><cite className="not-italic block text-slate-300 text-sm">{q.a}</cite></blockquote>)}
