export default function Hero() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#f5f4f0] py-14 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#1d5fa8] opacity-[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6 text-center">
        {/* Badge — some no mobile */}
        <div className="mb-5 hidden sm:inline-flex items-center gap-2 rounded-full border border-[#1d5fa8]/20 bg-[#e8f0fb] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d5fa8]" />
          <span className="text-xs font-medium uppercase tracking-widest text-[#1d5fa8]">
            Visão Computacional · Citogenética · Aprendizado Profundo
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d5fa8]" />
        </div>

        {/* Título */}
        <h1 className="mx-auto mb-4 max-w-3xl text-3xl md:text-5xl font-bold leading-tight tracking-tight text-[#1a1a1a]">
          Análise Automatizada de{" "}
          <span className="text-[#1d5fa8]">Cariótipos</span> e identificação de{" "}
          <span className="text-[#1d5fa8]">Aneuploidias</span>
        </h1>

        {/* Subtítulo */}
        <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg leading-relaxed text-[#6b6b6b]">
          Sistema com modelo YOLO para detecção e classificação automática de cromossomos. Faça o upload de um exame e obtenha a análise em segundos.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => scrollTo("upload")}
            className="w-full sm:w-auto rounded-md bg-[#1d5fa8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#174d8a] active:scale-95"
          >
            Analisar Imagem
          </button>
          <button
            onClick={() => scrollTo("gallery")}
            className="w-full sm:w-auto rounded-md border border-[#1a1a1a]/15 bg-white px-6 py-3 text-sm font-semibold text-[#1a1a1a] transition-all hover:border-[#1d5fa8]/30 hover:bg-[#e8f0fb] active:scale-95"
          >
            Ver Exemplos
          </button>
        </div>
      </div>
    </section>
  );
}