import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import citations from '../data/citations.json';

type Citation = { auteur: string; citation: string };

export default function CitationRotative(){
  const [citationActuelle, setCitationActuelle] = useState<Citation | null>(null);
  useEffect(() => {
    changerCitation();
    const id = setInterval(changerCitation, 8000);
    return () => clearInterval(id);
  }, []);
  function changerCitation(){
    const idx = Math.floor(Math.random() * (citations as Citation[]).length);
    setCitationActuelle((citations as Citation[])[idx]);
  }
  if(!citationActuelle) return null;
  return (
    <div className="text-center mt-6 px-4">
      <Quote className="mx-auto text-cyan-300 w-8 h-8 mb-2 opacity-80" />
      <p className="text-lg italic text-slate-200">« {citationActuelle.citation} »</p>
      <p className="mt-2 text-sm font-semibold text-slate-400">— {citationActuelle.auteur}</p>
    </div>
  );
}
