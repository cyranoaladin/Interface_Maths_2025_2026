import { Button } from "../ui/Button";
import CitationRotative from '../CitationRotative';
export default function Hero() {
  return (
    <section className="text-white py-16 px-6 bg-[radial-gradient(60vmax_60vmax_at_80%_-10%,rgba(6,182,212,.25),transparent_60%),linear-gradient(135deg,rgba(15,23,42,.94),rgba(124,58,237,.45))]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-bold mb-3">Interface Maths 2025–2026</h1>
          <p className="text-lg mb-4">
            Ressources et progressions pour les élèves de Première et Terminale spécialité
            mathématiques.
          </p>
          <Citations />
          <div className="flex gap-3 mt-6">
            <Button variant="primary">
              <a href="/site/EDS_premiere/index.html">Première</a>
            </Button>
            <Button variant="primary">
              <a href="/site/EDS_terminale/index.html">Terminale</a>
            </Button>
            <Button variant="primary">
              <a href="/site/Maths_expertes/index.html">Maths expertes</a>
            </Button>
                    <CitationRotative />
        </div>
        </div>
        <div>
          <img
            src="/assets/illustrations/hero-mesh.svg"
            alt="Illustration mathématique abstraite"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
