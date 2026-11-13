"""Imagens da resposta: detecções anotadas (JPEG) e cariograma (PNG), em data URI base64."""

import base64
import io
import threading

import cv2
import matplotlib

matplotlib.use("Agg")  # sem interface gráfica no servidor
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from matplotlib.patches import FancyBboxPatch  # noqa: E402

from ..pipeline.karyogram import ROWS, karyogram_layout, pair_label  # noqa: E402
from ..pipeline.karyotype import pair_number  # noqa: E402
from ..pipeline.postprocess import karyogram_crop  # noqa: E402

BOX_COLOR = (168, 95, 29)  # #1d5fa8 em BGR, a cor das caixas no site original
ALERT_COLOR = (40, 40, 198)  # #c62828 em BGR, a mesma cor de alerta do cariograma

# Cariograma: cores do site
INK, MUTED_LINE, BLUE, GROUP_LINE = "#1a1a1a", "#c9c5bc", "#1d5fa8", "#d3e1f3"
RED, ALERT_FILL, ALERT_EDGE = "#c62828", "#fdecea", "#f3b7b1"
DENVER_GROUPS = {
    "A": ["A1", "A2", "A3"], "B": ["B4", "B5"],
    "C": ["C6", "C7", "C8", "C9", "C10", "C11", "C12"],
    "D": ["D13", "D14", "D15"], "E": ["E16", "E17", "E18"],
    "F": ["F19", "F20"], "G": ["G21", "G22"], "Sexuais": ["Y", "X"],
}

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


def plot_karyogram(images_by_class: dict[str, list[np.ndarray]], alerts: dict, width_inches: float = 13.0):
    """Cariograma com as posições de `karyogram_layout` (replicado do CytoML), no visual do site:
    grupos de Denver (A a G e sexuais), linha de base sob cada par e pares em alerta destacados."""
    sizes = {c: [img.shape[:2] for img in imgs] for c, imgs in images_by_class.items()}
    layout = karyogram_layout(sizes)
    xmin, xmax, ymin, ymax = layout.bounds
    widths = [w for items in sizes.values() for _, w in items]
    unit = float(np.median(widths)) if widths else 20.0
    pad = 0.03 * (xmax - xmin)
    header = 1.6 * unit  # espaço das letras dos grupos acima da primeira linha

    # extensão horizontal e linha de base de cada par (pares vazios usam a posição do rótulo)
    extent = {}
    for p in layout.placements:
        x0, x1, _ = extent.get(p.class_name, (p.x, p.x + p.width, p.y))
        extent[p.class_name] = (min(x0, p.x), max(x1, p.x + p.width), p.y)
    for label in layout.labels:
        extent.setdefault(label.class_name, (label.x - 0.6 * unit, label.x + 0.6 * unit, label.y + 0.9 * unit))

    def top_of(c):
        return extent[c][2] + max((h for h, _ in sizes.get(c, [])), default=2 * unit)

    row_of = {c: i for i, row in enumerate(ROWS) for c in row}
    row_top = {i: max(top_of(c) for c in row) for i, row in enumerate(ROWS)}

    height = width_inches * (ymax - ymin + 2 * pad + header) / (xmax - xmin + 2 * pad)
    fig, ax = plt.subplots(figsize=(width_inches, height), dpi=150, facecolor="white")

    for c in alerts:  # fundo vermelho-claro nos pares fora do esperado
        x0, x1, base = extent[c]
        ax.add_patch(FancyBboxPatch(
            (x0 - 0.35 * unit, base - 1.45 * unit), (x1 - x0) + 0.7 * unit, top_of(c) - base + 1.6 * unit,
            boxstyle=f"round,pad=0,rounding_size={0.4 * unit}", fc=ALERT_FILL, ec=ALERT_EDGE, lw=1, zorder=0,
        ))
    for p in layout.placements:
        # multiplica o recorte (fundo branco) pela cor do fundo: some o quadrado branco
        gray = images_by_class[p.class_name][p.index].astype(np.float32) / 255
        background = np.array([0xFD, 0xEC, 0xEA]) / 255 if p.class_name in alerts else np.ones(3)
        ax.imshow(gray[..., None] * background, interpolation="lanczos",
                  extent=(p.x, p.x + p.width, p.y, p.y + p.height), zorder=2)
    for label in layout.labels:
        x0, x1, base = extent[label.class_name]
        alert = alerts.get(label.class_name)
        color = RED if alert else INK
        ax.plot([x0 - 0.15 * unit, x1 + 0.15 * unit], [base - 0.25 * unit] * 2,
                color=RED if alert else MUTED_LINE, lw=1.6, solid_capstyle="round", zorder=3)
        ax.text(label.x, base - 0.55 * unit, pair_label(label.class_name), ha="center", va="top",
                fontsize=12, color=color, fontweight="bold" if alert else "medium", zorder=3)
        if alert:
            ax.text(label.x, base - 1.15 * unit, f"{alert['observed']} (ref. {alert['expected']})",
                    ha="center", va="top", fontsize=7.5, color=RED)
    for name, members in DENVER_GROUPS.items():
        x0 = min(extent[c][0] for c in members)
        x1 = max(extent[c][1] for c in members)
        y = row_top[row_of[members[0]]] + 0.35 * unit
        ax.plot([x0, x1], [y, y], color=GROUP_LINE, lw=1.2)
        ax.text(x0, y + 0.15 * unit, name, ha="left", va="bottom", fontsize=10, color=BLUE, fontweight="bold")

    ax.set_xlim(xmin - pad, xmax + pad)
    ax.set_ylim(ymin - pad, ymax + pad + header)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.tight_layout(pad=0.4)
    return fig


def karyogram_data_uri(crops: list[np.ndarray], labels: list[str], alerts: dict) -> str:
    """Cariograma no layout do exame, com os cromossomos em pé (`karyogram_crop`)."""
    images_by_class: dict[str, list[np.ndarray]] = {}
    for crop, label in zip(crops, labels, strict=True):
        images_by_class.setdefault(label, []).append(karyogram_crop(crop))

    buffer = io.BytesIO()
    with _plot_lock:
        fig = plot_karyogram(images_by_class, alerts)
        try:
            fig.savefig(buffer, format="png", facecolor="white")
        finally:
            plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
