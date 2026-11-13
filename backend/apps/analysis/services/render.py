"""Imagens da resposta: detecções anotadas (JPEG) e cariograma (PNG), em data URI base64."""

import base64
import io
import threading

import cv2
import matplotlib

matplotlib.use("Agg")  # sem interface gráfica no servidor
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from ..pipeline.karyogram import plot_karyogram  # noqa: E402
from ..pipeline.karyotype import pair_number  # noqa: E402
from ..pipeline.postprocess import karyogram_crop  # noqa: E402

BOX_COLOR = (168, 95, 29)  # #1d5fa8 em BGR, a cor das caixas no site original
ALERT_COLOR = (40, 40, 198)  # #c62828 em BGR, a mesma cor de alerta do cariograma

_plot_lock = threading.Lock()  # o pyplot não é thread-safe e o gunicorn roda com 2 threads


def jpeg_data_uri(image_bgr: np.ndarray, quality: int = 90) -> str:
    ok, buffer = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("falha ao codificar a imagem em JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buffer.tobytes()).decode("ascii")


def annotate(image_bgr: np.ndarray, boxes: np.ndarray, labels: list[str], alerts: dict) -> np.ndarray:
    """Caixa de cada cromossomo com o número do par; classes fora do esperado em vermelho."""
    out = image_bgr.copy()
    scale = max(out.shape[:2]) / 1000
    thickness = max(1, round(2 * scale))
    font_scale = 0.5 * max(scale, 0.6)
    for (x1, y1, x2, y2), label in zip(boxes, labels, strict=True):
        color = ALERT_COLOR if label in alerts else BOX_COLOR
        p1, p2 = (int(x1), int(y1)), (int(x2), int(y2))
        cv2.rectangle(out, p1, p2, color, thickness)

        text = pair_number(label)
        (tw, th), base = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        ty = max(p1[1], th + base + 2)
        cv2.rectangle(out, (p1[0], ty - th - base - 2), (p1[0] + tw + 4, ty), color, cv2.FILLED)
        cv2.putText(out, text, (p1[0] + 2, ty - base), cv2.FONT_HERSHEY_SIMPLEX, font_scale,
                    (255, 255, 255), thickness, cv2.LINE_AA)
    return out


def karyogram_data_uri(crops: list[np.ndarray], labels: list[str], alerts: dict) -> str:
    """Cariograma no layout do exame, com os cromossomos em pé (`karyogram_crop`)."""
    images_by_class: dict[str, list[np.ndarray]] = {}
    for crop, label in zip(crops, labels, strict=True):
        images_by_class.setdefault(label, []).append(karyogram_crop(crop))

    buffer = io.BytesIO()
    with _plot_lock:
        fig = plot_karyogram(images_by_class, alerts=alerts)
        try:
            fig.savefig(buffer, format="png", facecolor="white")
        finally:
            plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
