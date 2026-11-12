"""Pipeline do artigo, replicada do repositório CytoML
(https://github.com/irlvinicius/CytoML): `src/inference/onnx_pipeline.py` e dependências.

Só onnxruntime, OpenCV, NumPy e SciPy: sem torch nem ultralytics. Os parâmetros (limiar 0,437,
λ = 16, mediana + CLAHE + JPEG) são os mesmos que reproduzem a Tabela 5 do artigo.
"""
