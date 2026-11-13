"""Recorte de cada cromossomo e redimensionamento para a entrada do classificador.

Replicado de `clamp_box`, `crop_box` e `stretch` em
https://github.com/irlvinicius/CytoML/blob/main/src/classification/crops.py
(as funções de augmentation e de letterbox do treino ficaram de fora).
"""

import cv2
import numpy as np

DEFAULT_SIZE = 224


def clamp_box(
    xmin: float, ymin: float, xmax: float, ymax: float, width: int, height: int
) -> tuple[int, int, int, int] | None:
    """Arredonda a bbox para fora, limita aos bordos da imagem e devolve None se ficar vazia."""
    x0 = max(0, int(np.floor(xmin)))
    y0 = max(0, int(np.floor(ymin)))
    x1 = min(width, int(np.ceil(xmax)))
    y1 = min(height, int(np.ceil(ymax)))
    if x1 <= x0 or y1 <= y0:
        return None
    return x0, y0, x1, y1


def crop_box(image: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = box
    return image[y0:y1, x0:x1]


def stretch(image: np.ndarray, size: int = DEFAULT_SIZE) -> np.ndarray:
    """Redimensiona para size x size sem preservar a proporção -- equivalente ao `target_size`
    do Keras usado pelo paper de referência (Rosas-Alatriste et al., 2026)."""
    height, width = image.shape[:2]
    shrinking = size * size < width * height
    interpolation = cv2.INTER_AREA if shrinking else cv2.INTER_CUBIC
    return cv2.resize(image, (size, size), interpolation=interpolation)
