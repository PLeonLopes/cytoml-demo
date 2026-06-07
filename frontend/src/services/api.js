const API_URL = import.meta.env.VITE_API_URL || "https://cytoml-demo-1.onrender.com";

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

  return json.data; // { status: "ok" }
}

// Análise
export async function analyzeImage(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_URL}/api/analysis/analyze/`, {
    method: "POST",
    body: formData,
    // Não definir Content-Type manualmente — o browser define sozinho com o boundary do multipart
  });

  if (!response.ok) {
    throw new Error(`Erro ao analisar imagem (HTTP ${response.status}).`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || "Erro desconhecido na análise.");
  }

  return json.data;
  // Retorna:
  // {
  //   annotated_image: "data:image/png;base64,...",
  //   analysis: { total_detections, inference_time_ms, avg_confidence, min_confidence, max_confidence },
  //   detections: [{ id, class_id, class_name, confidence, bbox }, ...]
  // }
}
