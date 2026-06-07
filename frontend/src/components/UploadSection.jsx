import { useState, useRef } from "react";
import { analyzeImage } from "../services/api";

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SpinnerIcon({ size = 24 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    </svg>
  );
}

function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function StatCard({ label, value }) {
  return (
    <div className="flex flex-col rounded-lg border border-[#e0ddd6] bg-[#f5f4f0] px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9e9e9e]">{label}</span>
      <span className="mt-0.5 text-base font-bold text-[#1d5fa8]">{value}</span>
    </div>
  );
}

// Redimensionamento
const MAX_SIZE = 1024;
const QUALITY  = 0.85;

function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width  = MAX_SIZE;
        } else {
          width  = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        QUALITY
      );
    };
    img.src = url;
  });
}

// Painel de resultado
function ResultPanel({ result, onReset }) {
  const [showDetections, setShowDetections] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Imagem anotada — maior */}
      <div className="overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#f5f4f0]">
        <img
          src={result.annotated_image}
          alt="Cariograma anotado pelo modelo"
          className="h-96 w-full object-contain"
        />
      </div>

      {/* 3 métricas em linha */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Detectados"      value={result.analysis.total_detections} />
        <StatCard label="Conf. média"     value={formatPct(result.analysis.avg_confidence)} />
        <StatCard label="Inferência"      value={formatTime(result.analysis.inference_time_ms)} />
      </div>

      {/* Detecções individuais — colapsável */}
      <div className="rounded-xl border border-[#e0ddd6] overflow-hidden">
        <button
          onClick={() => setShowDetections((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f5f4f0]"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b6b]">
            Detecções individuais ({result.detections.length})
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#9e9e9e" strokeWidth="2.5"
            className={`transition-transform duration-200 ${showDetections ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showDetections && (
          <div className="max-h-44 overflow-y-auto border-t border-[#e0ddd6]">
            {result.detections.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border-b border-[#e0ddd6] px-4 py-2 last:border-0"
              >
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
      <div className="flex items-start gap-2 rounded-lg bg-[#f5f4f0] px-3 py-2.5">
        <svg className="mt-0.5 shrink-0 text-[#9e9e9e]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs text-[#9e9e9e]">
          Resultado gerado pelo modelo YOLO. Não substitui avaliação clínica especializada.
        </p>
      </div>

      <button
        onClick={onReset}
        className="rounded-md border border-[#e0ddd6] bg-[#f5f4f0] py-2.5 text-sm font-medium text-[#6b6b6b] transition hover:bg-[#e8f0fb] hover:text-[#1d5fa8]"
      >
        Nova Análise
      </button>
    </div>
  );
}

// Componente principal
export default function UploadSection() {
  const [image, setImage]             = useState(null);
  const [preview, setPreview]         = useState(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [imageInfo, setImageInfo]     = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setResult(null);
    setError(null);
    setImageInfo(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const originalKB = (image.size / 1024).toFixed(0);
      const resized     = await resizeImage(image);
      const resizedKB   = (resized.size / 1024).toFixed(0);
      setImageInfo({ originalKB, resizedKB });
      const data = await analyzeImage(resized);
      setResult(data);
    } catch (err) {
      setError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setImageInfo(null);
  };

  return (
    <section id="upload" className="bg-[#f5f4f0] py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Cabeçalho da seção */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
            Análise de Imagem
          </p>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Envie o Cariograma</h2>
          <p className="mt-2 text-[#6b6b6b]">
            Faça o upload da imagem do exame e receba a análise automática do modelo.
          </p>
        </div>

        {/* Painel principal — dois quadrados */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Quadrado 1: Upload ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-white shadow-sm">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Imagem de Entrada</h3>
              <p className="text-xs text-[#9e9e9e]">Formatos aceitos: JPG, PNG, TIFF</p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              {!preview ? (
                /* Área de drag & drop */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all min-h-[380px] ${
                    isDragging
                      ? "border-[#1d5fa8] bg-[#e8f0fb]"
                      : "border-[#d0cdc6] hover:border-[#1d5fa8]/50 hover:bg-[#f5f4f0]"
                  }`}
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
                  <p className="text-sm font-medium text-[#1a1a1a]">Arraste a imagem aqui</p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">ou clique para selecionar</p>
                </div>
              ) : (
                /* Preview da imagem */
                <div className="flex flex-1 flex-col gap-4">
                  <div className="relative min-h-[380px] overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#f5f4f0]">
                    <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                    <button
                      onClick={handleReset}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#6b6b6b] shadow-sm transition hover:text-[#1a1a1a]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs text-[#9e9e9e]">{image?.name}</p>
                    {imageInfo && (
                      <span className="ml-2 shrink-0 rounded-full bg-[#e8f0fb] px-2 py-0.5 text-[10px] font-medium text-[#1d5fa8]">
                        {imageInfo.originalKB} KB → {imageInfo.resizedKB} KB
                      </span>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                      <svg className="mt-0.5 shrink-0 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-auto flex items-center justify-center gap-2 rounded-md bg-[#1d5fa8] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#174d8a] disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  >
                    {isAnalyzing ? <><SpinnerIcon size={20} /> Analisando...</> : "Analisar Cariograma"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Quadrado 2: Resultado ── */}
          <div className="flex flex-col rounded-2xl border border-[#e0ddd6] bg-white shadow-sm">
            <div className="border-b border-[#e0ddd6] px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Resultado da Análise</h3>
              <p className="text-xs text-[#9e9e9e]">Gerado automaticamente pelo modelo YOLO</p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              {!result && !isAnalyzing && !error && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[380px]">
                  <div className="mb-3 rounded-full bg-[#f5f4f0] p-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#6b6b6b]">Aguardando análise</p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">Envie uma imagem e clique em "Analisar"</p>
                </div>
              )}

              {/* Estado carregando */}
              {isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center min-h-[380px]">
                  <div className="mb-4 text-[#1d5fa8]"><SpinnerIcon /></div>
                  <p className="text-sm font-medium text-[#1a1a1a]">Processando imagem...</p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">O modelo está detectando os cromossomos</p>
                </div>
              )}

              {error && !result && !isAnalyzing && (
                <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[380px]">
                  <div className="mb-3 rounded-full bg-red-50 p-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#1a1a1a]">Falha na análise</p>
                  <p className="mt-1 text-xs text-[#9e9e9e]">{error}</p>
                </div>
              )}

              {result && !isAnalyzing && (
                <ResultPanel result={result} onReset={handleReset} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
