"""Carrega os dois modelos ONNX uma única vez por processo e devolve a pipeline pronta."""

import logging
import threading

from django.conf import settings

from ..pipeline.onnx_pipeline import KaryotypePipeline

logger = logging.getLogger(__name__)

_pipeline: KaryotypePipeline | None = None
_lock = threading.Lock()  # o gunicorn roda com mais de uma thread


def get_pipeline() -> KaryotypePipeline:
    global _pipeline
    if _pipeline is None:
        with _lock:
            if _pipeline is None:
                logger.info(
                    "Carregando modelos: %s e %s",
                    settings.DETECTOR_MODEL_PATH,
                    settings.CLASSIFIER_MODEL_PATH,
                )
                _pipeline = KaryotypePipeline(settings.DETECTOR_MODEL_PATH, settings.CLASSIFIER_MODEL_PATH)
                logger.info("Modelos carregados.")
    return _pipeline
