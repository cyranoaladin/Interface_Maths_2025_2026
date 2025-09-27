export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="font-semibold">Interface Maths</div>
        <nav className="flex gap-3 text-sm">
          <a href="/" className="hover:underline">
            Accueil
          </a>
          <a href="/premiere" className="hover:underline">
            Première
          </a>
          <a href="/terminale" className="hover:underline">
            Terminale
          </a>
          <a href="/expertes" className="hover:underline">
            Maths expertes
          </a>
        </nav>
      </div>
    </header>
  );
}
