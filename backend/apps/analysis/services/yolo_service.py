import io
import base64
import logging

from PIL import Image
from ultralytics import YOLO
from django.conf import settings

logger = logging.getLogger(__name__)

_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        model_path = settings.YOLO_MODEL_PATH
        logger.info(f"Carregando modelo YOLO em: {model_path}")
        _model = YOLO(model_path)
        logger.info("Modelo carregado com sucesso.")
    return _model


def run_inference(image_file) -> dict:
    model = get_model()

    image = Image.open(image_file).convert("RGB")

    results = model(image)
    result = results[0]

    # Imagem anotada pelo YOLO (numpy array BGR → RGB)
    annotated_array = result.plot()
    annotated_image = Image.fromarray(annotated_array[..., ::-1])

    # Converte para base64
    buffer = io.BytesIO()
    annotated_image.save(buffer, format="PNG")
    encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Dados das detecções
    detections = []
    for box in result.boxes:
        detections.append(
            {
                "class_id": int(box.cls[0]),
                "class_name": result.names[int(box.cls[0])],
                "confidence": round(float(box.conf[0]), 4),
                "bbox": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
            }
        )

    # Média dos confidence scores
    total = len(detections)
    avg_accuracy = round(sum(d["confidence"] for d in detections) / total, 4) if total > 0 else 0.0

    return {
        "annotated_image": f"data:image/png;base64,{encoded_image}",
        "total_detections": total,
        "avg_accuracy": avg_accuracy,
        "detections": detections,
    }