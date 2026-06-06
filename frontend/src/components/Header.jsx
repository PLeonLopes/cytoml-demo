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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
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
