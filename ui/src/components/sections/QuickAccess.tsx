import { Card } from "../ui/Card";
export default function QuickAccess(){
  const items=[
    { title:'EDS Première', desc:'Ressources + Progression', href:'/premiere' },
    { title:'EDS Terminale', desc:'Ressources + Progression', href:'/terminale' },
    { title:'Maths expertes', desc:'Ressources + Progression', href:'/expertes' },
  ];
  return(<section className="py-14 px-6 bg-gradient-to-b from-slate-50 to-white"><div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">{items.map((it)=> (
    <a key={it.title} href={it.href} className="block">
      <Card className="p-6 hover:-translate-y-1 transition">
        <strong className="block text-lg">{it.title}</strong>
        <small className="text-slate-600">{it.desc}</small>
      </Card>
    </a>
  ))}</div></section>)
}
