import io
import base64
import logging
import ast

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw
from django.conf import settings

logger = logging.getLogger(__name__)

_session = None
_input_size = 640


def get_session() -> ort.InferenceSession:
    global _session
    if _session is None:
        model_path = str(settings.YOLO_MODEL_PATH)
        logger.info(f"Carregando modelo ONNX em: {model_path}")
        _session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"]
        )
        logger.info("Modelo ONNX carregado com sucesso.")
    return _session


def _get_class_names(session: ort.InferenceSession) -> dict:
    """Extrai nomes das classes dos metadados do ONNX."""
    try:
        meta = session.get_modelmeta().custom_metadata_map
        if "names" in meta:
            return ast.literal_eval(meta["names"])
    except Exception:
        pass
    return {}


def _preprocess(image: Image.Image) -> tuple[np.ndarray, float, float, int, int]:
    """Letterbox: redimensiona mantendo aspect ratio com padding cinza."""
    orig_w, orig_h = image.size
    scale = min(_input_size / orig_w, _input_size / orig_h)
    new_w, new_h = int(orig_w * scale), int(orig_h * scale)

    resized = image.resize((new_w, new_h), Image.BILINEAR)
    canvas = Image.new("RGB", (_input_size, _input_size), (114, 114, 114))
    pad_x = (_input_size - new_w) // 2
    pad_y = (_input_size - new_h) // 2
    canvas.paste(resized, (pad_x, pad_y))

    arr = np.array(canvas, dtype=np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)[np.newaxis, ...]  # 1xCxHxW
    return arr, scale, pad_x, pad_y


def _postprocess_yolo26(
    outputs: list,
    scale: float,
    pad_x: int,
    pad_y: int,
    class_names: dict,
    conf_threshold: float = 0.25,
) -> list[dict]:
    """
    YOLO26 ONNX end-to-end: saída shape (1, 300, 6)
    Cada linha: [x1, y1, x2, y2, confidence, class_id]
    NMS já foi feito pelo modelo — só filtra por confiança.
    """
    preds = outputs[0]  # shape: (1, 300, 6)
    preds = preds[0]    # shape: (300, 6)

    detections = []
    for det in preds:
        x1, y1, x2, y2, confidence, class_id = det

        if confidence < conf_threshold:
            continue

        # Desfaz padding e escala para coordenadas originais
        x1 = (x1 - pad_x) / scale
        y1 = (y1 - pad_y) / scale
        x2 = (x2 - pad_x) / scale
        y2 = (y2 - pad_y) / scale

        cid = int(class_id)
        detections.append({
            "class_id": cid,
            "class_name": class_names.get(cid, str(cid)),
            "confidence": round(float(confidence), 4),
            "bbox": [round(float(v), 2) for v in [x1, y1, x2, y2]],
        })

    return detections


def _draw_boxes(image: Image.Image, detections: list[dict]) -> Image.Image:
    """Desenha bounding boxes na imagem usando só Pillow."""
    draw = ImageDraw.Draw(image)
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        label = f"{det['class_name']} {det['confidence']:.2f}"
        draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
        draw.text((x1, max(0, y1 - 12)), label, fill="red")
    return image


def run_inference(image_file) -> dict:
    session = get_session()
    class_names = _get_class_names(session)
    image = Image.open(image_file).convert("RGB")

    # Pré-processamento
    input_tensor, scale, pad_x, pad_y = _preprocess(image)

    # Inferência
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})

    # Pós-processamento (simples! YOLO26 já é end-to-end)
    detections = _postprocess_yolo26(outputs, scale, pad_x, pad_y, class_names)

    # Anotação
    annotated = _draw_boxes(image.copy(), detections)
    buffer = io.BytesIO()
    annotated.save(buffer, format="PNG")
    encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    total = len(detections)
    avg_accuracy = round(sum(d["confidence"] for d in detections) / total, 4) if total > 0 else 0.0

    return {
        "annotated_image": f"data:image/png;base64,{encoded_image}",
        "total_detections": total,
        "avg_accuracy": avg_accuracy,
        "detections": detections,
    }
