import { useState, useRef } from "react";

// Ícone de upload
function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// Ícone de carregando
function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    </svg>
  );
}

// Card de cromossomo no resultado
function ChromosomeTag({ label, count }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#e0ddd6] bg-[#f5f4f0] px-3 py-2">
      <span className="text-xs font-medium text-[#1a1a1a]">{label}</span>
      <span className="rounded-full bg-[#e8f0fb] px-2 py-0.5 text-xs font-semibold text-[#1d5fa8]">
        {count}
      </span>
    </div>
  );
}

export default function UploadSection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setResult(null);

    // Simulação — será substituída pela chamada real à API
    await new Promise((r) => setTimeout(r, 2000));
    setResult({
      status: "normal",
      label: "Cariótipo Normal (46,XY)",
      confidence: 97.3,
      chromosomes: [
        { label: "Par 1–3 (Grupo A)", count: "6 detectados" },
        { label: "Par 4–5 (Grupo B)", count: "4 detectados" },
        { label: "Par 6–12 (Grupo C)", count: "14 detectados" },
        { label: "Par 13–15 (Grupo D)", count: "6 detectados" },
        { label: "Par 16–18 (Grupo E)", count: "6 detectados" },
        { label: "Par 19–20 (Grupo F)", count: "4 detectados" },
        { label: "Par 21–22 (Grupo G)", count: "4 detectados" },
        { label: "Cromossomos Sexuais", count: "XY" },
      ],
    });

    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <section id="upload" className="bg-[#f5f4f0] py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho da seção */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
            Análise de Imagem
          </p>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">
            Envie o Cariograma
          </h2>
          <p className="mt-2 text-[#6b6b6b]">
            Faça o upload da imagem do exame e receba a análise automática do
            modelo.
          </p>
        </div>

        {/* Painel principal — dois quadrados */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Quadrado 1: Upload ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-white shadow-sm">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">
                Imagem de Entrada
              </h3>
              <p className="text-xs text-[#9e9e9e]">
                Formatos aceitos: JPG, PNG, TIFF
              </p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              {!preview ? (
                /* Área de drag & drop */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-[#1d5fa8] bg-[#e8f0fb]"
                      : "border-[#d0cdc6] hover:border-[#1d5fa8]/50 hover:bg-[#f5f4f0]"
                  } min-h-[280px]`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                  <div className={`mb-4 ${isDragging ? "text-[#1d5fa8]" : "text-[#9e9e9e]"}`}>
                    <UploadIcon />
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    Arraste a imagem aqui
                  </p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">
                    ou clique para selecionar
                  </p>
                </div>
              ) : (
                /* Preview da imagem */
                <div className="flex flex-1 flex-col gap-4">
                  <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#f5f4f0]">
                    <img
                      src={preview}
                      alt="Preview do cariograma"
                      className="h-full w-full object-contain"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#6b6b6b] shadow-sm transition hover:text-[#1a1a1a]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <p className="truncate text-xs text-[#9e9e9e]">
                    {image?.name}
                  </p>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-auto flex items-center justify-center gap-2 rounded-md bg-[#1d5fa8] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#174d8a] disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <SpinnerIcon />
                        Analisando...
                      </>
                    ) : (
                      "Analisar Cariograma"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Quadrado 2: Resultado ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-white shadow-sm">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">
                Resultado da Análise
              </h3>
              <p className="text-xs text-[#9e9e9e]">
                Gerado automaticamente pelo modelo YOLO
              </p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              {/* Estado vazio */}
              {!result && !isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[280px]">
                  <div className="mb-3 rounded-full bg-[#f5f4f0] p-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#6b6b6b]">
                    Aguardando análise
                  </p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">
                    Envie uma imagem e clique em "Analisar"
                  </p>
                </div>
              )}

              {/* Estado carregando */}
              {isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center min-h-[280px]">
                  <div className="mb-4 text-[#1d5fa8]">
                    <SpinnerIcon />
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    Processando imagem...
                  </p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">
                    O modelo está analisando os cromossomos
                  </p>
                </div>
              )}

              {/* Resultado */}
              {result && !isAnalyzing && (
                <div className="flex flex-1 flex-col gap-4">
                  {/* Badge de diagnóstico */}
                  <div className="flex items-center gap-3 rounded-xl border border-[#e8f0fb] bg-[#e8f0fb] px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d5fa8]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {result.label}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">
                        Confiança: {result.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Lista de cromossomos */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9e9e9e]">
                      Cromossomos Detectados
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {result.chromosomes.map((c) => (
                        <ChromosomeTag key={c.label} label={c.label} count={c.count} />
                      ))}
                    </div>
                  </div>

                  {/* Botão de nova análise */}
                  <button
                    onClick={handleReset}
                    className="mt-auto rounded-md border border-[#e0ddd6] bg-[#f5f4f0] py-2.5 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#e8f0fb] hover:text-[#1d5fa8]"
                  >
                    Nova Análise
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
