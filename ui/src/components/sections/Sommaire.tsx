import { Card } from "../ui/Card"; import { Badge } from "../ui/Badge";
export default function Sommaire(){
  const cards=[
    { t:'Suites numériques', d:'Suites arithmétiques et géométriques', tags:['Analyse'] },
    { t:'Probabilités', d:'Lois de probabilité et applications', tags:['Probabilités'] },
    { t:'Géométrie dans l'espace', d:'Vecteurs, droites et plans', tags:['Géométrie'] },
  ];
  return(<section className="py-14 px-6"><div className="max-w-7xl mx-auto"><h2 className="text-2xl font-semibold mb-6">Sommaire des chapitres</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{cards.map((c)=> (
    <Card key={c.t} className="p-6 hover:-translate-y-1 transition">
      <strong className="block text-lg mb-1">{c.t}</strong>
      <small className="block text-slate-600 mb-2">{c.d}</small>
      <div className="flex gap-2">{c.tags.map(t=> <Badge key={t}>{t}</Badge>)}</div>
    </Card>
  ))}</div></div></section>)
}
