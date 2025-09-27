import { Card } from "../ui/Card";
export default function Progression(){
  const chapters=[
    { w:'Semaine 1', t:'Suites numériques', d:'2 semaines', r:['Cours','Exercices'] },
    { w:'Semaine 3', t:'Fonctions et dérivées', d:'3 semaines', r:['Cours','Exercices','Évaluation'] },
  ];
  return(<section className="py-14 px-6 bg-gradient-to-b from-slate-50 to-white"><div className="max-w-7xl mx-auto"><h2 className="text-2xl font-semibold mb-6">Progression annuelle</h2><div className="relative"><div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 to-cyan-400" />{chapters.map((c,i)=> (
    <div key={c.t} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-8">
      {i%2===0? <div className="lg:pr-6"><Card className="inline-block max-w-[90%] p-5"><strong>{c.w} — {c.t}</strong><div className="text-sm text-slate-600">Durée estimée : {c.d}</div></Card></div> : <div/>}
      <div className="relative h-0"><span className="absolute left-1/2 -translate-x-1/2 -translate-y-3 inline-flex w-8 h-8 rounded-full bg-cyan-100 ring-2 ring-white"/></div>
      {i%2!==0? <div className="lg:pl-6"><Card className="inline-block max-w-[90%] p-5"><strong>{c.w} — {c.t}</strong><div className="text-sm text-slate-600">Durée estimée : {c.d}</div></Card></div> : <div/>}
    </div>
  ))}</div></div></section>)
}
