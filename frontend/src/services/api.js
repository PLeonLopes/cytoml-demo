const API_URL = import.meta.env.VITE_API_URL || "https://cytoml-api-762616154335.southamerica-east1.run.app";

// Extrai uma mensagem legível do envelope de erro do backend.
// O campo "message" pode ser texto, um objeto {code, message} ou erros por campo ({image: ["..."]}).
function errorMessage(error, fallback) {
  let message = error?.message ?? error;
  if (message && typeof message === "object") {
    message = message.message ?? Object.values(message).flat()[0];
  }
  return typeof message === "string" && message ? message : fallback;
}

// Health Check endpoint
export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/analysis/health/`);

  if (!response.ok) {
    throw new Error("Serviço indisponível.");
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error("Backend retornou erro no health check.");
  }

  return json.data; // { status: "ok", models_loaded: true }
}

// Análise
export async function analyzeImage(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_URL}/api/analysis/analyze/`, {
    method: "POST",
    body: formData,
    // Não definir Content-Type manualmente: o browser define sozinho com o boundary do multipart
  });

  // Lê o corpo antes de checar o status: os erros 400 trazem a mensagem do backend
  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    throw new Error(errorMessage(json?.error, `Erro ao analisar imagem (HTTP ${response.status}).`));
  }

  return json.data;
  // Retorna o JSON da API:
  // {
  //   karyotype: { formula, status, status_code, findings, total, counts, alerts },
  //   chromosomes: [{ id, bbox, detection_confidence, class_name, pair, class_probability }, ...],
  //   images: { preprocessed, annotated, karyogram },
  //   timing_ms: { preprocess, inference, render, total },
  //   model: { detector, classifier, detector_conf },
  //   warnings: [...]
  // }
}
