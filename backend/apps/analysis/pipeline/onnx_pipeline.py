"""Replicado de https://github.com/irlvinicius/CytoML/blob/main/src/inference/onnx_pipeline.py
(só os imports e os caminhos dos modelos mudaram).

Pipeline completa só com onnxruntime (sem torch nem ultralytics), para o site de demonstração.

Imagem BGR -> mediana + CLAHE -> detector ONNX (YOLO26m, NMS embutido) -> recortes em cinza ->
classificador ONNX (ResNet-50) -> `assign_classes` (restrição λ) -> `interpret`.

Reproduz o caminho de `evaluate_karyotype.py` (que gerou a Tabela 5 do artigo):
- o letterbox é o mesmo do Ultralytics (`LetterBox`, interpolação linear, padding 114, centralizado),
  só que sempre em 640x640, que é o tamanho fixo do ONNX exportado;
- os recortes saem da imagem pré-processada em tons de cinza, com `clamp_box`;
- o classificador recebe o recorte esticado para 224x224 e normalizado com as médias do ImageNet.

`evaluate_onnx.py` confere, no teste inteiro, que os números batem com os do artigo.
"""

from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from .classes import DENVER_CLASSES
from .crops import clamp_box, crop_box, stretch
from .filters import denoise_and_enhance
from .karyotype import Interpretation, assign_classes, count_by_class, interpret, numerical_alerts

# Limiar que maximiza o F1 do detector na validação (`evaluate_karyotype.detector_confidence`)
DETECTOR_CONF = 0.437
# λ escolhido na validação por `evaluate_karyotype.choose_penalty`
EXTRA_PENALTY = 16.0

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def letterbox(image: np.ndarray, size: int = 640, pad_value: int = 114) -> tuple[np.ndarray, float, int, int]:
    """Igual ao `LetterBox` do Ultralytics com `auto=False`: devolve (imagem, escala, pad_x, pad_y)."""
    height, width = image.shape[:2]
    ratio = min(size / height, size / width)
    new_w, new_h = round(width * ratio), round(height * ratio)
    dw, dh = (size - new_w) / 2, (size - new_h) / 2
    if (width, height) != (new_w, new_h):
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    top, bottom = round(dh - 0.1), round(dh + 0.1)
    left, right = round(dw - 0.1), round(dw + 0.1)
    image = cv2.copyMakeBorder(image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(pad_value,) * 3)
    return image, ratio, left, top


def preprocess(image_bgr: np.ndarray) -> np.ndarray:
    """Mediana + CLAHE seguidos de codificação e decodificação em JPEG (qualidade padrão do OpenCV, 95).

    O `pipeline.py` salva as imagens filtradas em JPEG, e foi nessas imagens que os dois modelos foram
    treinados e avaliados. Repetir a compressão deixa a entrada idêntica, pixel a pixel, à do artigo;
    sem ela, a Tabela 5 piora cerca de 3 pontos percentuais.
    """
    ok, buffer = cv2.imencode(".jpg", denoise_and_enhance(image_bgr))
    if not ok:
        raise RuntimeError("falha ao codificar a imagem pré-processada")
    return cv2.imdecode(buffer, cv2.IMREAD_COLOR)


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


def classifier_input(crop_gray: np.ndarray, size: int = 224) -> np.ndarray:
    """Recorte em cinza -> 3x224x224 normalizado (mesmo `preprocess` do treino, com resize="stretch")."""
    canvas = stretch(crop_gray, size=size)
    rgb = np.stack([canvas] * 3, axis=-1).astype(np.float32) / 255.0
    return ((rgb - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1)


@dataclass
class Result:
    preprocessed: np.ndarray  # imagem BGR após mediana + CLAHE
    boxes: np.ndarray  # (N, 4) xyxy na imagem original
    scores: np.ndarray  # (N,) confiança do detector
    probs: np.ndarray  # (N, 24) probabilidades do classificador
    labels: list[str]  # classe final de cada recorte (com a restrição)
    crops: list[np.ndarray] = field(repr=False)  # recortes em cinza da imagem pré-processada
    counts: dict[str, int] = field(default_factory=dict)
    interpretation: Interpretation | None = None
    alerts: dict[str, dict[str, int]] = field(default_factory=dict)


class KaryotypePipeline:
    def __init__(
        self,
        detector_path: Path | str,
        classifier_path: Path | str,
        conf: float = DETECTOR_CONF,
        extra_penalty: float | None = EXTRA_PENALTY,
        providers: list[str] | None = None,
        threads: int | None = None,
        batch_size: int = 32,
    ):
        options = ort.SessionOptions()
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        if threads:
            options.intra_op_num_threads = threads
        providers = providers or ["CPUExecutionProvider"]
        self.detector = ort.InferenceSession(str(detector_path), options, providers=providers)
        self.classifier = ort.InferenceSession(str(classifier_path), options, providers=providers)
        self.detector_input = self.detector.get_inputs()[0].name
        self.classifier_input = self.classifier.get_inputs()[0].name
        self.imgsz = int(self.detector.get_inputs()[0].shape[2])
        self.conf = conf
        self.extra_penalty = extra_penalty
        self.batch_size = batch_size

    def detect(self, image_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Caixas (xyxy, coordenadas da imagem) e confianças acima de `conf`."""
        padded, ratio, pad_x, pad_y = letterbox(image_bgr, self.imgsz)
        tensor = padded[..., ::-1].transpose(2, 0, 1)[None].astype(np.float32) / 255.0  # BGR -> RGB
        preds = self.detector.run(None, {self.detector_input: np.ascontiguousarray(tensor)})[0][0]
        preds = preds[preds[:, 4] >= self.conf]
        boxes = (preds[:, :4] - [pad_x, pad_y, pad_x, pad_y]) / ratio
        height, width = image_bgr.shape[:2]
        boxes[:, [0, 2]] = boxes[:, [0, 2]].clip(0, width)
        boxes[:, [1, 3]] = boxes[:, [1, 3]].clip(0, height)
        return boxes.astype(np.float32), preds[:, 4].astype(np.float32)

    def classify(self, crops: list[np.ndarray]) -> np.ndarray:
        if not crops:
            return np.empty((0, len(DENVER_CLASSES)), dtype=np.float32)
        out = []
        for start in range(0, len(crops), self.batch_size):
            batch = np.stack([classifier_input(c) for c in crops[start : start + self.batch_size]])
            out.append(self.classifier.run(None, {self.classifier_input: batch})[0])
        return softmax(np.concatenate(out)).astype(np.float32)

    def labels_from_probs(self, probs: np.ndarray) -> list[str]:
        if self.extra_penalty is None:
            return [DENVER_CLASSES[i] for i in probs.argmax(axis=1)]
        return assign_classes(probs, extra_penalty=self.extra_penalty)

    def run(self, image_bgr: np.ndarray, preprocessed: bool = False) -> Result:
        """`preprocessed=True` pula o pré-processamento (imagem já filtrada, como em data/processed)."""
        filtered = image_bgr if preprocessed else preprocess(image_bgr)
        boxes, scores = self.detect(filtered)
        gray = cv2.cvtColor(filtered, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        kept, crops = [], []
        for i, (x1, y1, x2, y2) in enumerate(boxes):
            box = clamp_box(x1, y1, x2, y2, width, height)
            if box is not None:
                kept.append(i)
                crops.append(crop_box(gray, box))
        boxes, scores = boxes[kept], scores[kept]
        probs = self.classify(crops)
        labels = self.labels_from_probs(probs)
        counts = count_by_class(labels)
        return Result(
            preprocessed=filtered, boxes=boxes, scores=scores, probs=probs, labels=labels, crops=crops,
            counts=counts, interpretation=interpret(counts), alerts=numerical_alerts(counts),
        )
