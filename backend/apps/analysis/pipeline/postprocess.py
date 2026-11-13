"""Recorte de cada cromossomo para o cariograma: isolado em fundo branco, em pé e, quando o
centrômero é identificável, com o braço curto (p) para cima. Serve só para a visualização: o
classificador continua recebendo o recorte cru.

Replicado de `karyogram_crop` e das funções de que ela depende em
https://github.com/irlvinicius/CytoML/blob/main/src/classification/postprocess.py
"""

import math

import cv2
import numpy as np


def _ellipse(size: int) -> np.ndarray:
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))


def foreground_mask(image_gray: np.ndarray, close: bool = False) -> np.ndarray:
    """Máscara (0/255) por threshold global de Otsu: separa cromossomo (escuro) do fundo (claro)
    sem cortar as bandas claras, ao contrário do threshold adaptativo do paper.

    Sem fechamento morfológico por padrão: ele gruda no cromossomo central pedaços de vizinhos a
    poucos pixels de distância. O custo é que uma banda muito clara atravessando o cromossomo
    inteiro pode parti-lo (~2% dos recortes numa amostra do teste, contra ~7% em que o
    fechamento grudava um vizinho) -- `_central_and_others` usa a versão fechada nesses casos.
    """
    blurred = cv2.GaussianBlur(image_gray, (5, 5), 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    if close:
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, _ellipse(5), iterations=2)
    return binary


def grow_mask(central: np.ndarray, others: np.ndarray, dilate_px: int) -> np.ndarray:
    """Dilata a máscara do cromossomo central sem invadir pixels de outros objetos -- evita que
    uma faixa fina de um vizinho próximo entre na imagem (e vire uma lasca depois de girar)."""
    if dilate_px <= 0:
        return central
    return cv2.dilate(central, _ellipse(2 * dilate_px + 1)) & cv2.bitwise_not(others)


def _central_and_others(
    image_gray: np.ndarray, min_split_ratio: float = 0.3
) -> tuple[np.ndarray, np.ndarray] | None:
    """(objeto central preenchido, demais objetos). Se o objeto da máscara sem fechamento tiver
    menos de `min_split_ratio` da área do objeto com fechamento, o cromossomo provavelmente foi
    partido por uma banda clara -- usa a versão com fechamento."""
    plain = _select_central(foreground_mask(image_gray))
    if plain is None:
        return None
    closed = _select_central(foreground_mask(image_gray, close=True))
    if closed is not None and (plain[0] > 0).sum() < min_split_ratio * (closed[0] > 0).sum():
        return closed
    return plain


def _select_central(foreground: np.ndarray) -> tuple[np.ndarray, np.ndarray] | None:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(foreground)
    if count <= 1:
        return None
    height, width = foreground.shape[:2]
    center = labels[height // 4 : 3 * height // 4, width // 4 : 3 * width // 4]
    in_center = np.bincount(center.ravel(), minlength=count)
    in_center[0] = 0
    if in_center.max() > 0:
        label = int(in_center.argmax())
    else:
        label = int(stats[1:, cv2.CC_STAT_AREA].argmax()) + 1

    component = (labels == label).astype(np.uint8) * 255
    contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(component)
    cv2.drawContours(filled, contours, -1, 255, thickness=cv2.FILLED)
    return filled, foreground & cv2.bitwise_not(filled)


def principal_angle(mask: np.ndarray) -> float:
    """Ângulo (graus, eixo x da imagem, y para baixo) do eixo maior do objeto, via PCA dos pixels."""
    ys, xs = np.nonzero(mask)
    if len(xs) < 2:
        return 90.0
    eigenvalues, eigenvectors = np.linalg.eigh(np.cov(np.stack([xs, ys]).astype(np.float64)))
    vx, vy = eigenvectors[:, np.argmax(eigenvalues)]
    return math.degrees(math.atan2(vy, vx))


def rotate_upright(image_gray: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Gira imagem e máscara para o eixo maior ficar vertical, sem cortar cantos, e apara na máscara."""
    height, width = image_gray.shape[:2]
    side = int(math.ceil(math.hypot(height, width))) + 2
    top, left = (side - height) // 2, (side - width) // 2
    padded_image = np.full((side, side), 255, dtype=image_gray.dtype)
    padded_mask = np.zeros((side, side), dtype=np.uint8)
    padded_image[top : top + height, left : left + width] = image_gray
    padded_mask[top : top + height, left : left + width] = mask

    matrix = cv2.getRotationMatrix2D((side / 2, side / 2), principal_angle(mask) - 90, 1.0)
    image_rot = cv2.warpAffine(padded_image, matrix, (side, side), flags=cv2.INTER_LINEAR, borderValue=255)
    mask_rot = cv2.warpAffine(padded_mask, matrix, (side, side), flags=cv2.INTER_NEAREST, borderValue=0)

    x, y, w, h = cv2.boundingRect(mask_rot)
    image_rot, mask_rot = image_rot[y : y + h, x : x + w], mask_rot[y : y + h, x : x + w]
    if w > h:  # objeto quase redondo: o PCA pode deixar deitado
        image_rot, mask_rot = cv2.rotate(image_rot, cv2.ROTATE_90_CLOCKWISE), cv2.rotate(mask_rot, cv2.ROTATE_90_CLOCKWISE)
    return image_rot, mask_rot


def centromere_row(mask: np.ndarray, end_margin: float = 0.15, min_narrowing: float = 0.8) -> int | None:
    """Linha mais estreita do cromossomo em pé (ideia do KarySOM: o centrômero é a parte mais fina),
    longe das pontas. `None` se o estreitamento não for nítido (largura mínima acima de
    `min_narrowing` x a mediana) -- aí a orientação fica como está."""
    widths = (mask > 0).sum(axis=1).astype(np.float64)
    height = len(widths)
    lo, hi = int(height * end_margin), int(math.ceil(height * (1 - end_margin)))
    if hi - lo < 3:
        return None
    kernel = max(3, height // 12)
    smooth = np.convolve(widths, np.ones(kernel) / kernel, mode="same")
    interior = smooth[lo:hi]
    row = lo + int(np.argmin(interior))
    return row if smooth[row] < min_narrowing * np.median(interior) else None


def karyogram_crop(image_gray: np.ndarray, dilate_px: int = 3, margin: int = 3) -> np.ndarray:
    """Recorte para o cariograma: cromossomo central isolado em fundo branco, em pé, com o braço
    curto (p) para cima quando o centrômero é identificável. Mantém a escala em pixels."""
    result = _central_and_others(image_gray)
    if result is None:
        return image_gray.copy()
    mask = grow_mask(*result, dilate_px)
    isolated = np.where(mask > 0, image_gray, 255).astype(image_gray.dtype)
    upright, upright_mask = rotate_upright(isolated, mask)

    row = centromere_row(upright_mask)
    if row is not None and row > upright_mask.shape[0] / 2:
        upright = np.flipud(upright)
    return np.pad(upright, margin, constant_values=255)
