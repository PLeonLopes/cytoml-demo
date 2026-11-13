"""Análise de uma metáfase: bytes da imagem -> resposta da API (cariótipo, cromossomos, imagens, tempos)."""

import time

import cv2
import numpy as np

from ..pipeline.classes import DENVER_CLASSES
from ..pipeline.karyotype import INCONSISTENT, NORMAL, NUMERICAL, pair_number
from ..pipeline.onnx_pipeline import preprocess
from .models import get_pipeline
from .render import annotate, jpeg_data_uri, karyogram_data_uri

STATUS_CODES = {NORMAL: "normal", NUMERICAL: "numerical", INCONSISTENT: "inconsistent"}
MAX_SIDE = 4000  # as metáfases do conjunto de dados têm cerca de 1300 px de lado
# vagas de `assign_classes` (2 normais + 2 extras por tipo; o Y tem 1 normal): acima disso, vale o argmax
MAX_SLOTS = sum((1 if c == "Y" else 2) + 2 for c in DENVER_CLASSES)


def decode_image(data: bytes) -> np.ndarray:
    """Decodifica como o `cv2.imread` do CytoML (BGR, orientação EXIF aplicada)."""
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Não foi possível ler o arquivo como imagem.")
    return image


def _ms(start: float) -> int:
    return round((time.perf_counter() - start) * 1000)


def analyze(data: bytes) -> dict:
    t_total = time.perf_counter()
    warnings = []

    image = decode_image(data)
    if max(image.shape[:2]) > MAX_SIDE:
        ratio = MAX_SIDE / max(image.shape[:2])
        image = cv2.resize(image, None, fx=ratio, fy=ratio, interpolation=cv2.INTER_AREA)
        warnings.append(f"Imagem reduzida para {MAX_SIDE} px no maior lado antes da análise.")

    pipeline = get_pipeline()

    t = time.perf_counter()
    filtered = preprocess(image)  # mediana + CLAHE + JPEG, como nas imagens de treino
    preprocess_ms = _ms(t)

    t = time.perf_counter()
    result = pipeline.run(filtered, preprocessed=True)  # detecção, recortes, classificação e λ
    inference_ms = _ms(t)

    interpretation = result.interpretation
    karyotype = {
        "formula": interpretation.formula,
        "status": interpretation.status,
        "status_code": STATUS_CODES[interpretation.status],
        "findings": list(interpretation.findings),
        "total": len(result.labels),
        "counts": result.counts,
        "alerts": result.alerts,
    }
    if not result.labels:
        karyotype.update(status="nenhum cromossomo encontrado", status_code="no_detections", findings=[])
        warnings.append("Nenhum cromossomo encontrado. A imagem é uma metáfase?")
    elif len(result.labels) > MAX_SLOTS:
        warnings.append("Mais cromossomos detectados do que o esperado; a contagem pode não ser confiável.")

    chromosomes = [
        {
            "id": i + 1,
            "bbox": [round(float(v), 1) for v in box],
            "detection_confidence": round(float(score), 4),
            "class_name": label,
            "pair": pair_number(label),
            "class_probability": round(float(probs[DENVER_CLASSES.index(label)]), 4),
        }
        for i, (box, score, probs, label) in enumerate(
            zip(result.boxes, result.scores, result.probs, result.labels, strict=True)
        )
    ]

    t = time.perf_counter()
    karyogram = karyogram_data_uri(result.crops, result.labels, result.alerts) if result.labels else None
    images = {
        "preprocessed": jpeg_data_uri(filtered),
        "annotated": jpeg_data_uri(annotate(filtered, result.boxes, result.labels, result.alerts)),
        "karyogram": karyogram,
    }
    render_ms = _ms(t)

    return {
        "karyotype": karyotype,
        "chromosomes": chromosomes,
        "images": images,
        "timing_ms": {
            "preprocess": preprocess_ms,
            "inference": inference_ms,
            "render": render_ms,
            "total": _ms(t_total),
        },
        "model": {
            "detector": "YOLO26m (mediana + CLAHE)",
            "classifier": "ResNet-50",
            "detector_conf": pipeline.conf,
        },
        "warnings": warnings,
    }
