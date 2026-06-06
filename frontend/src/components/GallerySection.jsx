import { useState } from "react";

// Imagens de placeholder — substitua pelos caminhos reais das suas imagens
const SAMPLE_IMAGES = [
  {
    id: 1,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+01",
    label: "Amostra 01",
    description: "Cariótipo masculino normal",
    result: {
      label: "Cariótipo Normal (46,XY)",
      confidence: 98.1,
      detail: "46 cromossomos detectados sem alterações estruturais.",
    },
  },
  {
    id: 2,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+02",
    label: "Amostra 02",
    description: "Cariótipo feminino normal",
    result: {
      label: "Cariótipo Normal (46,XX)",
      confidence: 97.6,
      detail: "46 cromossomos detectados sem alterações estruturais.",
    },
  },
  {
    id: 3,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+03",
    label: "Amostra 03",
    description: "Trissomia do cromossomo 21",
    result: {
      label: "Trissomia 21 (47,XY,+21)",
      confidence: 95.4,
      detail: "47 cromossomos detectados. Presença de cópia extra no par 21.",
    },
  },
  {
    id: 4,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+04",
    label: "Amostra 04",
    description: "Síndrome de Turner",
    result: {
      label: "Monossomia X (45,X)",
      confidence: 96.2,
      detail: "45 cromossomos detectados. Ausência de um cromossomo sexual.",
    },
  },
  {
    id: 5,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+05",
    label: "Amostra 05",
    description: "Síndrome de Klinefelter",
    result: {
      label: "XXY (47,XXY)",
      confidence: 94.8,
      detail: "47 cromossomos detectados. Cromossomo X extra identificado.",
    },
  },
  {
    id: 6,
    src: "https://placehold.co/400x300/e8f0fb/1d5fa8?text=Cariograma+06",
    label: "Amostra 06",
    description: "Trissomia do cromossomo 18",
    result: {
      label: "Trissomia 18 (47,XX,+18)",
      confidence: 93.7,
      detail: "47 cromossomos detectados. Cópia extra identificada no par 18.",
    },
  },
];

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    </svg>
  );
}

export default function GallerySection() {
  const [selected, setSelected] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = async (sample) => {
    setSelected(sample);
    setResult(null);
    setIsAnalyzing(true);

    // Simulação — será substituída pela chamada real à API
    await new Promise((r) => setTimeout(r, 1800));
    setResult(sample.result);
    setIsAnalyzing(false);
  };

  return (
    <section id="gallery" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
            Teste Rápido
          </p>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">
            Exemplos de Análise
          </h2>
          <p className="mt-2 text-[#6b6b6b]">
            Clique em uma das amostras abaixo para ver o modelo em ação.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Galeria de imagens ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelect(sample)}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                  selected?.id === sample.id
                    ? "border-[#1d5fa8] shadow-md"
                    : "border-[#e0ddd6] hover:border-[#1d5fa8]/40"
                }`}
              >
                <img
                  src={sample.src}
                  alt={sample.label}
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="bg-white px-2 py-1.5 text-left">
                  <p className="text-xs font-semibold text-[#1a1a1a]">
                    {sample.label}
                  </p>
                  <p className="truncate text-[10px] text-[#9e9e9e]">
                    {sample.description}
                  </p>
                </div>

                {/* Indicador de selecionado */}
                {selected?.id === sample.id && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1d5fa8]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* ── Painel de resultado ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-[#f5f4f0]">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">
                {selected ? selected.label : "Resultado"}
              </h3>
              <p className="text-xs text-[#9e9e9e]">
                {selected ? selected.description : "Selecione uma amostra ao lado"}
              </p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              {/* Vazio */}
              {!selected && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="mb-3 text-[#d0cdc6]">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 9h6M9 12h6M9 15h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#9e9e9e]">
                    Nenhuma amostra selecionada
                  </p>
                </div>
              )}

              {/* Carregando */}
              {selected && isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center min-h-[220px]">
                  {/* Preview da imagem selecionada */}
                  <img
                    src={selected.src}
                    alt={selected.label}
                    className="mb-4 h-32 w-48 rounded-lg border border-[#e0ddd6] object-cover opacity-60"
                  />
                  <div className="mb-2 text-[#1d5fa8]">
                    <SpinnerIcon />
                  </div>
                  <p className="text-sm text-[#6b6b6b]">Analisando amostra...</p>
                </div>
              )}

              {/* Resultado */}
              {selected && result && !isAnalyzing && (
                <div className="flex flex-1 flex-col gap-4">
                  {/* Imagem + badge */}
                  <div className="relative overflow-hidden rounded-xl border border-[#e0ddd6]">
                    <img
                      src={selected.src}
                      alt={selected.label}
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-md bg-[#1d5fa8] px-2 py-1">
                      <p className="text-xs font-semibold text-white">
                        {result.confidence}% confiança
                      </p>
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  <div className="rounded-xl border border-[#e8f0fb] bg-[#e8f0fb] px-4 py-3">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {result.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6b6b6b]">
                      {result.detail}
                    </p>
                  </div>

                  {/* Nota do modelo */}
                  <div className="mt-auto flex items-start gap-2 rounded-lg bg-white px-3 py-2.5">
                    <svg className="mt-0.5 shrink-0 text-[#9e9e9e]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-[#9e9e9e]">
                      Resultado gerado pelo modelo YOLO. Não substitui avaliação clínica.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
