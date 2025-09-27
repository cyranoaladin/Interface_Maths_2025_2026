import { useEffect, useState } from 'react';
import { Card } from "../ui/Card"; import { Badge } from "../ui/Badge";

type Resource = { title?: string; url?: string; tags?: string[]; group?: string; desc?: string };

export default function Sommaire(){
  const [items, setItems] = useState<Resource[]>([]);
  useEffect(()=>{
    fetch('/site/assets/contents.json')
      .then(r=> r.ok ? r.json() : Promise.reject())
      .then((data)=>{
        const groups = (data && (data.groups || data.All || data.all)) || {};
        const flat = Object.values(groups as any).flat();
        setItems(Array.isArray(flat) ? (flat as any[]).slice(0,9) : []);
      })
      .catch(()=>{
        const s=document.createElement('script'); s.src='/site/assets/contents.static.js';
        s.onload=()=>{ try { const g=(window as any).__SITE_CONTENTS__?.groups || {}; const flat=Object.values(g).flat(); setItems(Array.isArray(flat)? (flat as any[]).slice(0,9):[]);} catch(e){ setItems([]);} };
        document.head.appendChild(s);
      });
  },[]);

  const cards = items.length ? items.map((it:any)=> ({ t: it.title || it.t || 'Ressource', d: it.desc || it.d || 'Ressource', tags: it.tags || [] })) : [
    { t:'Suites numériques', d:'Suites arithmétiques et géométriques', tags:['Analyse'] },
    { t:'Probabilités', d:'Lois de probabilité et applications', tags:['Probabilités'] },
    { t:"Géométrie dans l'espace", d:'Vecteurs, droites et plans', tags:['Géométrie'] },
  ];

  return(<section className="py-14 px-6"><div className="max-w-7xl mx-auto"><h2 className="text-2xl font-semibold mb-6">Sommaire des chapitres</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{cards.map((c,i)=> (
    <Card key={c.t + i} className="p-6 hover:-translate-y-1 transition">
      <strong className="block text-lg mb-1">{c.t}</strong>
      <small className="block text-slate-600 mb-2">{c.d}</small>
      <div className="flex gap-2">{c.tags.map((t:string)=> <Badge key={t}>{t}</Badge>)}</div>
    </Card>
  ))}</div></div></section>)
}
