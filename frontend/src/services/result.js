// Formatação do resultado da análise, usada pelos painéis do upload e da galeria.

export function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

// Os 3 números da linha de cards
export function resultStats(result) {
  return [
    { label: "Cromossomos",     value: result.karyotype.total },
    { label: "Pares em alerta", value: Object.keys(result.karyotype.alerts).length },
    {
      label: "Tempo",
      value: formatTime(result.timing_ms.total),
      // detalhamento mostrado no (i) do card
      info: [
        ["Pré-processamento", formatTime(result.timing_ms.preprocess)],
        ["Detecção e classificação", formatTime(result.timing_ms.inference)],
        ["Imagens e cariograma", formatTime(result.timing_ms.render)],
      ],
    },
  ];
}
