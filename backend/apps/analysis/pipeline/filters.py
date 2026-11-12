"""Pré-processamento do artigo: mediana (ruído sal e pimenta) + CLAHE no canal L do LAB.

Replicado de `denoise_and_enhance` em
https://github.com/irlvinicius/CytoML/blob/main/src/preprocessing/filters.py
"""

import cv2
import numpy as np


def denoise_and_enhance(
    image_bgr: np.ndarray,
    median_ksize: int = 3,
    clahe_clip: float = 2.0,
    clahe_tile: tuple[int, int] = (8, 8),
) -> np.ndarray:
    denoised = cv2.medianBlur(image_bgr, median_ksize)

    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=clahe_tile)
    l_enhanced = clahe.apply(l_channel)

    enhanced_lab = cv2.merge((l_enhanced, a_channel, b_channel))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
