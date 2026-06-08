export default function Footer() {
  return (
    <footer className="border-t border-[#e0ddd6] bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo */}
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1d5fa8]">
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

          {/* Info */}
          <p className="text-center text-xs text-[#9e9e9e]">
            Trabalho de Conclusão de Curso 2026.1 · Sistema de Cariotipagem Automatizada
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
