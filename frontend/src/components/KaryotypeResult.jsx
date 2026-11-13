import { useEffect, useState } from "react";

// Peças do resultado do cariótipo, usadas pelos painéis do upload e da galeria.

const PAIRS = [
  "A1", "A2", "A3", "B4", "B5", "C6", "C7", "C8", "C9", "C10", "C11", "C12",
  "D13", "D14", "D15", "E16", "E17", "E18", "F19", "F20", "G21", "G22", "X", "Y",
];

const pairLabel = (className) => (className === "X" || className === "Y" ? className : className.slice(1));

const STATUS = {
  normal:        { label: "Normal",                 className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  numerical:     { label: "Alteração numérica",     className: "bg-red-50 text-[#c62828] border-red-200" },
  inconsistent:  { label: "Contagem inconsistente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  no_detections: { label: "Sem cromossomos",        className: "bg-[#f5f4f0] text-[#6b6b6b] border-[#e0ddd6]" },
};

// Na ordem da pipeline; o resultado abre no cariograma (a última etapa)
const TABS = [
  { key: "original",     label: "Original" },
  { key: "preprocessed", label: "Pré-processada" },
  { key: "annotated",    label: "Detecções" },
  { key: "karyogram",    label: "Cariograma" },
];

export function StatusBadge({ code }) {
  const status = STATUS[code] ?? STATUS.no_detections;
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}>
      {status.label}
    </span>
  );
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Quebra um achado do backend em título + complemento, para não virar um texto corrido:
// "trissomia do 21 (Síndrome de Down)"                  -> "Trissomia do 21" + selo "Síndrome de Down"
// "X a mais e 22 a menos com 46 cromossomos: provável…" -> "Provável erro de classificação" + detalhe
function parseFinding(text) {
  const colon = text.indexOf(": ");
  if (colon >= 0) {
    return { title: capitalize(text.slice(colon + 2)), detail: capitalize(text.slice(0, colon)) };
  }
  const named = text.match(/^(.*) \((.*)\)$/);
  if (named) return { title: capitalize(named[1]), tag: named[2] };
  return { title: capitalize(text) };
}

// Uma linha do resumo: rótulo | valor | referência (como num laudo)
function SummaryRow({ label, reference, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b6b] sm:w-24 sm:shrink-0">{label}</span>
      <div className="flex flex-1 items-baseline justify-between gap-3 text-sm text-[#1a1a1a]">
        <div className="min-w-0">{children}</div>
        {reference && <span className="shrink-0 text-[11px] text-[#6b6b6b]">ref. {reference}</span>}
      </div>
    </div>
  );
}

// Uma alteração de autossomo: "+21  cromossomo 21 · 3 cópias"
function AutosomeChange({ className, alert }) {
  const delta = alert.observed - alert.expected;
  const copies = alert.observed === 1 ? "1 cópia" : `${alert.observed} cópias`;
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-9 shrink-0 rounded bg-white px-1 text-center text-xs font-bold text-[#c62828]">
        {delta > 0 ? "+" : "−"}{pairLabel(className)}
      </span>
      <span>
        Cromossomo {pairLabel(className)} <span className="text-[#6b6b6b]">· {copies}</span>
      </span>
    </div>
  );
}

// Caixa azul-clara: fórmula, leitura de cada parte (com referência) e interpretação
export function KaryotypeSummary({ karyotype, warnings = [] }) {
  const { counts, alerts } = karyotype;
  const isEmpty = karyotype.status_code === "no_detections";
  const sex = "X".repeat(counts.X ?? 0) + "Y".repeat(counts.Y ?? 0) || "nenhum";
  const sexAltered = "X" in alerts || "Y" in alerts;
  const autosomeChanges = PAIRS.filter((c) => c in alerts && c !== "X" && c !== "Y");
  const findings = karyotype.findings.map(parseFinding);

  return (
    <div className="rounded-xl border border-[#e8f0fb] bg-[#e8f0fb] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1d5fa8]">Cariótipo gerado</p>
          {!isEmpty && (
            <>
              <p className="mt-1 break-all text-2xl font-bold tracking-tight text-[#1a1a1a]">{karyotype.formula}</p>
              <p className="text-[10px] text-[#6b6b6b]">fórmula do cariótipo (notação citogenética)</p>
            </>
          )}
        </div>
        <StatusBadge code={karyotype.status_code} />
      </div>

      {!isEmpty && (
        <div className="mt-2 divide-y divide-[#d3e1f3] border-t border-[#d3e1f3]">
          <SummaryRow label="Total" reference="46">
            <span className={karyotype.total !== 46 ? "font-semibold text-[#c62828]" : ""}>{karyotype.total}</span> cromossomos
          </SummaryRow>
          <SummaryRow label="Sexuais" reference="XX ou XY">
            <span className={sexAltered ? "font-semibold text-[#c62828]" : ""}>{sex}</span>
          </SummaryRow>
          <SummaryRow label="Autossomos" reference="2 de cada">
            {autosomeChanges.length === 0 ? (
              <span className="text-[#6b6b6b]">Sem alterações</span>
            ) : (
              <div className="flex flex-col gap-1">
                {autosomeChanges.map((c) => <AutosomeChange key={c} className={c} alert={alerts[c]} />)}
              </div>
            )}
          </SummaryRow>
          {findings.length > 0 && (
            <SummaryRow label="Interpretação">
              <ul className="flex flex-col gap-1.5">
                {findings.map((f) => (
                  <li key={f.title + (f.detail ?? "")}>
                    <span className="font-semibold">{f.title}</span>
                    {f.tag && (
                      <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#1d5fa8]">
                        {f.tag}
                      </span>
                    )}
                    {f.detail && <p className="text-xs text-[#6b6b6b]">{f.detail}</p>}
                  </li>
                ))}
              </ul>
            </SummaryRow>
          )}
        </div>
      )}

      {warnings.map((warning) => (
        <p key={warning} className="mt-2 flex items-start gap-1.5 text-xs text-[#6b6b6b]">
          <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {warning}
        </p>
      ))}
    </div>
  );
}

function ImageModal({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="relative max-h-full max-w-6xl overflow-auto rounded-xl bg-white p-2 shadow-xl">
        <img src={src} alt={alt} className="max-h-[88vh] w-auto object-contain" />
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#6b6b6b] shadow-sm transition hover:text-[#1a1a1a]"
          aria-label="Fechar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Caixa da imagem com abas na ordem da pipeline (Original → … → Cariograma) e botão de ampliar
export function ImageTabs({ images, original, heightClass = "h-96" }) {
  const sources = { ...images, original };
  const tabs = TABS.filter((t) => sources[t.key]);
  const [active, setActive] = useState(sources.karyogram ? "karyogram" : "annotated");
  const [zoomed, setZoomed] = useState(false);
  const current = tabs.find((t) => t.key === active) ?? tabs[tabs.length - 1];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e0ddd6] bg-[#f5f4f0]">
      <div className="flex items-center justify-between gap-2 border-b border-[#e0ddd6] px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {tabs.map((t, i) => (
            <div key={t.key} className="flex items-center gap-0.5">
              {i > 0 && (
                <svg className="shrink-0 text-[#c4c1ba]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              )}
              <button
                onClick={() => setActive(t.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  current.key === t.key ? "bg-white text-[#1d5fa8] shadow-sm" : "text-[#6b6b6b] hover:text-[#1d5fa8]"
                }`}
              >
                {t.label}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setZoomed(true)}
          title="Ampliar"
          aria-label="Ampliar"
          className="shrink-0 rounded-md p-1.5 text-[#6b6b6b] transition hover:bg-white hover:text-[#1d5fa8]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
      <button onClick={() => setZoomed(true)} className="block w-full cursor-zoom-in">
        <img src={sources[current.key]} alt={current.label} className={`${heightClass} w-full object-contain`} />
      </button>
      {zoomed && <ImageModal src={sources[current.key]} alt={current.label} onClose={() => setZoomed(false)} />}
    </div>
  );
}

// Lista colapsável com a contagem de cada par (1 a 22, X, Y); pares em alerta em vermelho
export function PairCounts({ karyotype }) {
  const [open, setOpen] = useState(false);
  const alerts = karyotype.alerts;

  return (
    <div className="rounded-xl border border-[#e0ddd6] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f5f4f0]"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b6b]">
          Contagem por par
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9e9e9e" strokeWidth="2.5"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="grid grid-cols-6 gap-1.5 border-t border-[#e0ddd6] p-3 sm:grid-cols-8">
          {PAIRS.map((c) => {
            const alert = alerts[c];
            return (
              <div
                key={c}
                title={alert ? `${alert.observed} (esperado ${alert.expected})` : undefined}
                className={`flex flex-col items-center rounded-md border py-1 ${
                  alert ? "border-red-200 bg-red-50" : "border-[#e0ddd6] bg-[#f5f4f0]"
                }`}
              >
                <span className={`text-[10px] font-semibold ${alert ? "text-[#c62828]" : "text-[#9e9e9e]"}`}>
                  {pairLabel(c)}
                </span>
                <span className={`text-sm font-bold ${alert ? "text-[#c62828]" : "text-[#1a1a1a]"}`}>
                  {karyotype.counts[c] ?? 0}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
