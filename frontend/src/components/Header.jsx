export default function Header() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e0ddd6] bg-[#f5f4f0]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1d5fa8]">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none">
                <path d="M11 7c0 4 3 5 5 9s5 5 5 9"/>
                <path d="M21 7c0 4-3 5-5 9s-5 5-5 9"/>
                <line x1="12.5" y1="11" x2="19.5" y2="11"/>
                <line x1="11" y1="16" x2="21" y2="16"/>
                <line x1="12.5" y1="21" x2="19.5" y2="21"/>
              </g>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#1a1a1a]">
            CytoML
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Análise", id: "upload" },
            { label: "Teste Rápido", id: "gallery" },
            { label: "Sobre", id: "about" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm font-medium text-[#6b6b6b] transition-colors hover:text-[#1a1a1a]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() => scrollTo("upload")}
          className="rounded-md bg-[#1d5fa8] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#174d8a] active:scale-95"
        >
          Iniciar Análise
        </button>
      </div>
    </header>
  );
}
