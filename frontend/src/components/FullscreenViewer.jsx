import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Visualizador em tela cheia: o passo a passo da pipeline no topo, a imagem com zoom e,
// na etapa de detecções, os detalhes de cada cromossomo ao passar o mouse.

const DESCRIPTIONS = {
  original:     "Imagem enviada, sem nenhum tratamento.",
  preprocessed: "Filtro de mediana 3×3 e CLAHE na luminosidade: reduz o ruído e realça as bandas dos cromossomos.",
  annotated:    "O YOLO26m localiza cada cromossomo e a ResNet-50 classifica cada recorte em um dos 24 tipos. Passe o mouse numa caixa para ver os detalhes.",
  karyogram:    "Cromossomos organizados por par (1 a 22, X e Y), na mesma escala; pares fora do esperado em vermelho.",
};

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pct = (v) => `${(v * 100).toFixed(1)}%`;

function Tooltip({ hover, alerts }) {
  const { chromosome: c, x, y } = hover;
  const alert = alerts[c.class_name];
  return (
    <div
      className="pointer-events-none fixed z-[60] rounded-lg border border-[#e0ddd6] bg-white px-3 py-2 text-xs shadow-lg"
      style={{ left: x + 14, top: y + 14 }}
    >
      <p className={`text-sm font-bold ${alert ? "text-[#c62828]" : "text-[#1a1a1a]"}`}>Cromossomo {c.pair}</p>
      <p className="text-[#6b6b6b]">Classificação: <span className="font-semibold text-[#1a1a1a]">{pct(c.class_probability)}</span></p>
      <p className="text-[#6b6b6b]">Detecção: <span className="font-semibold text-[#1a1a1a]">{pct(c.detection_confidence)}</span></p>
      {alert && (
        <p className="mt-1 text-[#c62828]">Par fora do esperado: {alert.observed} (ref. {alert.expected})</p>
      )}
    </div>
  );
}

export default function FullscreenViewer({ steps, sources, initialKey, header, chromosomes = [], alerts = {}, onClose }) {
  const [index, setIndex] = useState(Math.max(0, steps.findIndex((s) => s.key === initialKey)));
  const [natural, setNatural] = useState(null); // tamanho real da imagem atual
  const [stage, setStage] = useState({ w: 0, h: 0 }); // área disponível para a imagem
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [hover, setHover] = useState(null);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef(null);
  const drag = useRef(null);

  const step = steps[index];
  const goTo = useCallback((i) => {
    const next = clamp(i, 0, steps.length - 1);
    setIndex((current) => {
      if (next !== current) setNatural(null); // o tamanho é lido de novo quando a imagem carrega
      return next;
    });
    setView({ scale: 1, x: 0, y: 0 });
    setHover(null);
  }, [steps.length]);

  // zoom mantendo fixo o ponto sob o cursor (mx, my: posição relativa ao centro da área)
  const zoomAt = useCallback((factor, mx = 0, my = 0) => {
    setView((v) => {
      const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
      if (scale === MIN_SCALE) return { scale, x: 0, y: 0 };
      const k = scale / v.scale;
      return { scale, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k };
    });
  }, []);

  // teclado: setas mudam de etapa, +/- dão zoom, Esc fecha; a página não rola por trás
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "+" || e.key === "=") zoomAt(1.25);
      else if (e.key === "-") zoomAt(0.8);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, goTo, zoomAt, onClose]);

  // tamanho da área da imagem (muda com a janela)
  useLayoutEffect(() => {
    const el = stageRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // roda do mouse = zoom (listener nativo para poder impedir a rolagem da página)
  useEffect(() => {
    const el = stageRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // arrastar para mover (mouse ou dedo)
  const onPointerDown = (e) => {
    if (view.scale === 1) return;
    drag.current = { x: e.clientX - view.x, y: e.clientY - view.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (drag.current) setView((v) => ({ ...v, x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }));
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  // a imagem cabe inteira na área quando o zoom é 1
  const fit = natural && stage.w && stage.h ? Math.min(stage.w / natural.w, stage.h / natural.h) : 0;
  const showBoxes = step.key === "annotated" && natural;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]/95 text-white">
      {/* Topo: resultado, passo a passo e descrição da etapa */}
      <div className="border-b border-white/10 bg-[#f5f4f0] px-4 py-3 text-[#1a1a1a] sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">{header}</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-full p-1.5 text-[#6b6b6b] transition hover:bg-white hover:text-[#1a1a1a]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ol className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <li key={s.key} className="flex shrink-0 items-center gap-1">
              {i > 0 && <span className={`h-px w-4 sm:w-8 ${i <= index ? "bg-[#1d5fa8]" : "bg-[#d0cdc6]"}`} />}
              <button
                onClick={() => goTo(i)}
                className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  i === index ? "bg-[#1d5fa8] text-white" : "text-[#6b6b6b] hover:bg-white hover:text-[#1d5fa8]"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  i === index ? "bg-white text-[#1d5fa8]" : i < index ? "bg-[#e8f0fb] text-[#1d5fa8]" : "bg-[#e0ddd6] text-[#6b6b6b]"
                }`}>
                  {i + 1}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-[#6b6b6b]">{DESCRIPTIONS[step.key]}</p>
      </div>

      {/* Imagem com zoom e arraste */}
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setView({ scale: 1, x: 0, y: 0 })}
        className={`relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden ${
          view.scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div
          className="relative shrink-0"
          style={{
            width: natural ? natural.w * fit : undefined,
            height: natural ? natural.h * fit : undefined,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: dragging ? "none" : "transform 80ms ease-out",
            visibility: natural ? "visible" : "hidden",
          }}
        >
          <img
            key={step.key}
            src={sources[step.key]}
            alt={step.label}
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="block h-full w-full rounded bg-white"
          />

          {/* Áreas sensíveis sobre cada caixa (coordenadas em pixels da imagem) */}
          {showBoxes && chromosomes.map((c) => {
            const [x1, y1, x2, y2] = c.bbox;
            const alert = c.class_name in alerts;
            return (
              <div
                key={c.id}
                onMouseMove={(e) => setHover({ chromosome: c, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                className={`absolute rounded-sm border-2 border-transparent transition-colors ${
                  alert ? "hover:border-[#c62828] hover:bg-[#c62828]/10" : "hover:border-[#1d5fa8] hover:bg-[#1d5fa8]/10"
                }`}
                style={{
                  left: `${(x1 / natural.w) * 100}%`,
                  top: `${(y1 / natural.h) * 100}%`,
                  width: `${((x2 - x1) / natural.w) * 100}%`,
                  height: `${((y2 - y1) / natural.h) * 100}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Rodapé: atalhos e controles de zoom */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-xs text-white/60 sm:px-6">
        <span className="hidden sm:inline">← → muda de etapa · roda do mouse = zoom · arrastar = mover · duplo clique = ajustar · Esc fecha</span>
        <span className="sm:hidden">Arraste para mover</span>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomAt(0.8)} aria-label="Diminuir zoom" className="rounded-md px-2.5 py-1 text-base text-white/80 hover:bg-white/10">−</button>
          <button onClick={() => setView({ scale: 1, x: 0, y: 0 })} className="w-14 rounded-md py-1 text-center tabular-nums hover:bg-white/10">
            {Math.round(view.scale * 100)}%
          </button>
          <button onClick={() => zoomAt(1.25)} aria-label="Aumentar zoom" className="rounded-md px-2.5 py-1 text-base text-white/80 hover:bg-white/10">+</button>
        </div>
      </div>

      {hover && <Tooltip hover={hover} alerts={alerts} />}
    </div>
  );
}
