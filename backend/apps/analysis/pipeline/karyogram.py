"""Replicado de https://github.com/irlvinicius/CytoML/blob/main/src/classification/karyogram.py

Cariograma no layout clássico do exame.

Quatro linhas (1-5; 6-12; 13-18; 19-22, Y, X), homólogos lado a lado com o número do par
embaixo, sem molduras. Todos os cromossomos ficam na mesma escala em pixels da metáfase de
origem -- o tamanho relativo (1 grande, 21 pequeno) é parte do que o especialista lê no exame.
Classes com contagem fora do esperado têm o número em vermelho.

`karyogram_layout` só calcula posições (testável sem matplotlib); `plot_karyogram` desenha.
"""

from dataclasses import dataclass

import numpy as np

ROWS: list[list[str]] = [
    ["A1", "A2", "A3", "B4", "B5"],
    ["C6", "C7", "C8", "C9", "C10", "C11", "C12"],
    ["D13", "D14", "D15", "E16", "E17", "E18"],
    ["F19", "F20", "G21", "G22", "Y", "X"],
]
ALERT_COLOR = "#c62828"


def pair_label(class_name: str) -> str:
    """'A1' -> '1', 'C12' -> '12', 'X' -> 'X'."""
    return class_name if class_name in ("X", "Y") else class_name[1:]


@dataclass(frozen=True)
class Placement:
    class_name: str
    index: int
    x: float
    y: float  # base do cromossomo (eixo y para cima)
    width: float
    height: float


@dataclass(frozen=True)
class Label:
    class_name: str
    x: float
    y: float


@dataclass(frozen=True)
class Layout:
    placements: list[Placement]
    labels: list[Label]
    bounds: tuple[float, float, float, float]  # xmin, xmax, ymin, ymax


def karyogram_layout(sizes: dict[str, list[tuple[int, int]]], rows: list[list[str]] = ROWS) -> Layout:
    """Posições de cada cromossomo a partir de `sizes[classe] = [(altura, largura), ...]`.

    Espaçamentos proporcionais à largura mediana dos cromossomos. Classes sem nenhum cromossomo
    mantêm o espaço e o rótulo (uma monossomia ou um erro de detecção aparecem como lacuna).
    Cada linha fica centralizada, com os cromossomos apoiados na mesma linha de base.
    """
    widths = [w for items in sizes.values() for _, w in items]
    unit = float(np.median(widths)) if widths else 20.0
    homolog_gap, pair_gap = 0.3 * unit, 1.8 * unit
    empty_width, label_gap, row_gap = 1.5 * unit, 0.9 * unit, 1.4 * unit

    row_specs = []
    for row in rows:
        slots = []
        for class_name in row:
            items = sizes.get(class_name, [])
            width = sum(w for _, w in items) + homolog_gap * max(len(items) - 1, 0) if items else empty_width
            slots.append((class_name, items, width))
        row_width = sum(w for *_, w in slots) + pair_gap * (len(slots) - 1)
        row_height = max((h for _, items, _ in slots for h, _ in items), default=2 * unit)
        row_specs.append((slots, row_width, row_height))

    max_width = max(row_width for _, row_width, _ in row_specs)
    placements, labels = [], []
    top = 0.0
    for slots, row_width, row_height in row_specs:
        baseline = top - row_height
        x = (max_width - row_width) / 2
        for class_name, items, slot_width in slots:
            cursor = x
            for index, (h, w) in enumerate(items):
                placements.append(Placement(class_name, index, cursor, baseline, w, h))
                cursor += w + homolog_gap
            labels.append(Label(class_name, x + slot_width / 2, baseline - label_gap))
            x += slot_width + pair_gap
        top = baseline - label_gap - row_gap

    return Layout(placements, labels, (0.0, max_width, top + row_gap * 0.5, 0.0))


def plot_karyogram(
    images_by_class: dict[str, list[np.ndarray]],
    alerts: dict[str, dict[str, int]] | None = None,
    title: str | None = None,
    subtitle: str | None = None,
    width_inches: float = 13.0,
):
    """Desenha o cariograma e devolve a figura do matplotlib."""
    import matplotlib.pyplot as plt

    alerts = alerts or {}
    sizes = {c: [img.shape[:2] for img in imgs] for c, imgs in images_by_class.items()}
    layout = karyogram_layout(sizes)
    xmin, xmax, ymin, ymax = layout.bounds
    pad = 0.02 * (xmax - xmin)

    fig_height = width_inches * (ymax - ymin + 2 * pad) / (xmax - xmin + 2 * pad) + (0.9 if title else 0)
    fig, ax = plt.subplots(figsize=(width_inches, fig_height), dpi=130, facecolor="white")
    for p in layout.placements:
        image = images_by_class[p.class_name][p.index]
        ax.imshow(
            image, cmap="gray", vmin=0, vmax=255, interpolation="bilinear",
            extent=(p.x, p.x + p.width, p.y, p.y + p.height),
        )
    for label in layout.labels:
        alert = alerts.get(label.class_name)
        color = ALERT_COLOR if alert else "#222"
        ax.text(label.x, label.y, pair_label(label.class_name), ha="center", va="top",
                fontsize=13, color=color, fontweight="bold" if alert else "normal")
        if alert:
            ax.text(label.x, label.y - 1.6 * pad, f"{alert['observed']} (esperado {alert['expected']})",
                    ha="center", va="top", fontsize=7.5, color=color)

    ax.set_xlim(xmin - pad, xmax + pad)
    ax.set_ylim(ymin - pad, ymax + pad)
    ax.set_aspect("equal")
    ax.axis("off")
    if title:
        fig.suptitle(title, fontsize=15, fontweight="bold", x=0.02, ha="left", y=0.995)
    if subtitle:
        ax.set_title(subtitle, fontsize=10, color="#555", loc="left")
    fig.tight_layout()
    return fig
