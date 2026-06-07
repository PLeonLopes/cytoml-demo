export default function Hero() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#f5f4f0] py-24">
      {/* Grid decorativo de fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Blob de cor suave */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#1d5fa8] opacity-[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1d5fa8]/20 bg-[#e8f0fb] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d5fa8]" />
          <span className="text-xs font-medium uppercase tracking-widest text-[#1d5fa8]">
            Visão Computacional · Citogenética · Aprendizado Profundo
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d5fa8]" />
        </div>
       
        {/* Título */}
        <h1 className="mx-auto mb-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-[#1a1a1a]">
          Uso de Visão Computacional para análise automatizada de{" "}
          <span className="text-[#1d5fa8]">Cariótipos</span> e identificação de{" "}
          <span className="text-[#1d5fa8]">Aneuploidias</span>
        </h1>

        {/* Subtítulo */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#6b6b6b]">
          Sistema desenvolvido com o modelo YOLO para detecção e classificação
          automática de cromossomos. Faça o upload de um exame e obtenha a
          análise em segundos.
        </p>

        {/* Ações */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => scrollTo("upload")}
            className="rounded-md bg-[#1d5fa8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#174d8a] active:scale-95"
          >
            Analisar Imagem
          </button>
          <button
            onClick={() => scrollTo("gallery")}
            className="rounded-md border border-[#1a1a1a]/15 bg-white px-6 py-3 text-sm font-semibold text-[#1a1a1a] transition-all hover:border-[#1d5fa8]/30 hover:bg-[#e8f0fb] active:scale-95"
          >
            Ver Exemplos
          </button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#e0ddd6]">
          {[
            { value: "YOLO", label: "Modelo de Detecção" },
            { value: "46", label: "Cromossomos Detectados" },
            { value: "TCC", label: "Projeto Acadêmico" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-5 text-center">
              <p className="text-2xl font-bold text-[#1d5fa8]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#9e9e9e]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
