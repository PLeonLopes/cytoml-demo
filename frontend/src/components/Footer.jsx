export default function Footer() {
  return (
    <footer className="border-t border-[#e0ddd6] bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1d5fa8]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#1a1a1a]">CytoML</span>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-[#9e9e9e]">
            Trabalho de Conclusão de Curso · Sistema de Cariotipagem Automatizada
          </p>

          {/* Aviso clínico */}
          <p className="text-xs text-[#9e9e9e]">
            Apenas para fins acadêmicos
          </p>
        </div>
      </div>
    </footer>
  );
}
