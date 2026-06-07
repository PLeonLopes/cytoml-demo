import { useState } from "react";
import { analyzeImage } from "../services/api";

// Amostras de Sample
const SAMPLES = [
  { id: 1, src: "/samples/1_CN_104173.jpg", label: "Amostra 01", description: "Cariótipo Normal" },
  { id: 2, src: "/samples/2_CN_104081.jpg", label: "Amostra 02", description: "Cariótipo Normal" },
  { id: 3, src: "/samples/3_TTT21_1053273.jpg", label: "Amostra 03", description: "Trissomia do cromossomo 21" },
  { id: 4, src: "/samples/4_Tx_1052773.jpg", label: "Amostra 04", description: "Síndrome de Turner" },
  { id: 5, src: "/samples/5_TTT8_1050762.jpg", label: "Amostra 05", description: "Trissomia do Cromossomo 8 - Síndrome de Warkany" },
  { id: 6, src: "/samples/6_TTT18_1051261.jpg", label: "Amostra 06", description: "Trissomia do cromossomo 18 - Síndrome de Edwards" },
];

// Helpers
function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

// Converte URL/placeholder em File para enviar à API
async function urlToFile(src, filename) {
  const res  = await fetch(src);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

// Ícones
function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    </svg>
  );
}

// Linha de stats horizontais
function StatsRow({ analysis }) {
  const stats = [
    { label: "Detectados",  value: analysis.total_detections },
    { label: "Conf. média", value: formatPct(analysis.avg_confidence) },
    { label: "Inferência",  value: formatTime(analysis.inference_time_ms) },
  ];
  return (
    <div className="grid grid-cols-3 divide-x divide-[#e0ddd6] rounded-xl border border-[#e0ddd6] bg-[#f5f4f0] overflow-hidden">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center py-2.5 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9e9e9e]">
            {s.label}
          </span>
          <span className="mt-0.5 text-base font-bold text-[#1d5fa8]">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// Painel de resultado da galeria
function ResultPanel({ sample, result }) {
  const [showDetections, setShowDetections] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Imagem anotada pelo modelo */}
      <div className="overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#f5f4f0]">
        <img
          src={result.annotated_image}
          alt={`Análise — ${sample.label}`}
          className="h-56 w-full object-contain"
        />
      </div>

      {/* Stats horizontais */}
      <StatsRow analysis={result.analysis} />

      {/* Diagnóstico */}
      <div className="rounded-xl border border-[#e8f0fb] bg-[#e8f0fb] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1d5fa8]">
          Diagnóstico gerado
        </p>
        <p className="mt-1 text-sm font-medium text-[#1a1a1a]">
          {result.analysis.total_detections} cromossomos detectados com confiança média de{" "}
          {formatPct(result.analysis.avg_confidence)}.
        </p>
      </div>

      {/* Detecções individuais — colapsável */}
      <div className="rounded-xl border border-[#e0ddd6] overflow-hidden">
        <button
          onClick={() => setShowDetections((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-[#f5f4f0]"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b6b]">
            Detecções individuais ({result.detections.length})
          </span>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#9e9e9e" strokeWidth="2.5"
            className={`transition-transform duration-200 ${showDetections ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showDetections && (
          <div className="max-h-36 overflow-y-auto border-t border-[#e0ddd6]">
            {result.detections.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-[#e0ddd6] px-4 py-1.5 last:border-0">
                <span className="text-xs text-[#1a1a1a]">#{d.id} — {d.class_name}</span>
                <span className="rounded-full bg-[#e8f0fb] px-2 py-0.5 text-xs font-semibold text-[#1d5fa8]">
                  {formatPct(d.confidence)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aviso clínico */}
      <div className="flex items-start gap-2 rounded-lg bg-[#f5f4f0] px-3 py-2">
        <svg className="mt-0.5 shrink-0 text-[#9e9e9e]" width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs text-[#9e9e9e]">
          Resultado gerado pelo modelo YOLO. Não substitui avaliação clínica especializada.
        </p>
      </div>
    </div>
  );
}

// Componente principal
export default function GallerySection() {
  const [selected, setSelected]     = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const handleSelect = async (sample) => {
    if (isAnalyzing) return;
    setSelected(sample);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const file = await urlToFile(sample.src, `${sample.label}.jpg`);
      const data = await analyzeImage(file);
      setResult(data);
    } catch (err) {
      setError("Não foi possível analisar esta amostra. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="gallery" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
            Teste Rápido
          </p>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Exemplos de Análise</h2>
          <p className="mt-2 text-[#6b6b6b]">
            Clique em uma das amostras abaixo para ver o modelo em ação.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Grade de amostras ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 content-start">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelect(sample)}
                disabled={isAnalyzing}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all disabled:cursor-not-allowed ${
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
                  <p className="text-xs font-semibold text-[#1a1a1a]">{sample.label}</p>
                  <p className="truncate text-[10px] text-[#9e9e9e]">{sample.description}</p>
                </div>

                {/* Check de selecionado */}
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

          {/* ── Painel lateral de resultado ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-[#f5f4f0]">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">
                {selected ? selected.label : "Resultado"}
              </h3>
              <p className="text-xs text-[#9e9e9e]">
                {selected ? selected.description : "Selecione uma amostra ao lado"}
              </p>
            </div>

            <div className="flex flex-1 flex-col p-5">
              {/* Vazio */}
              {!selected && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[320px]">
                  <div className="mb-3 text-[#d0cdc6]">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 9h6M9 12h6M9 15h4"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#9e9e9e]">Nenhuma amostra selecionada</p>
                </div>
              )}

              {/* Carregando */}
              {selected && isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center min-h-[320px]">
                  <img
                    src={selected.src}
                    alt={selected.label}
                    className="mb-4 h-32 w-48 rounded-lg border border-[#e0ddd6] object-cover opacity-50"
                  />
                  <div className="mb-2 text-[#1d5fa8]"><SpinnerIcon /></div>
                  <p className="text-sm text-[#6b6b6b]">Analisando amostra...</p>
                </div>
              )}

              {/* Erro */}
              {selected && error && !isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[320px]">
                  <div className="mb-3 rounded-full bg-red-50 p-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a]">Falha na análise</p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">{error}</p>
                  <button
                    onClick={() => handleSelect(selected)}
                    className="mt-4 rounded-md border border-[#e0ddd6] bg-white px-4 py-2 text-xs font-medium text-[#6b6b6b] transition hover:bg-[#e8f0fb] hover:text-[#1d5fa8]"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Resultado */}
              {selected && result && !isAnalyzing && (
                <ResultPanel sample={selected} result={result} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
