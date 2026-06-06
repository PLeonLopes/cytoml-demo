import io
import base64
from PIL import Image
from ultralytics import YOLO
import os

# Carrega o modelo uma única vez quando o servidor sobe
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'best.pt')
model = YOLO(MODEL_PATH)

def run_inference(image_file) -> dict:
    """
    Recebe um arquivo de imagem, roda a inferência do YOLO
    e retorna a imagem anotada em base64 + dados das detecções.
    """
    image = Image.open(image_file).convert('RGB')

    results = model(image)
    result  = results[0]

    # Imagem anotada pelo YOLO
    annotated_array = result.plot()  # numpy array BGR
    annotated_image = Image.fromarray(annotated_array[..., ::-1])  # BGR → RGB

    # Converte para base64 para retornar via JSON
    buffer = io.BytesIO()
    annotated_image.save(buffer, format='PNG')
    encoded_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

    # Dados das detecções
    detections = []
    for box in result.boxes:
        detections.append({
            'class_id':    int(box.cls[0]),
            'class_name':  result.names[int(box.cls[0])],
            'confidence':  round(float(box.conf[0]), 4),
            'bbox':        box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
        })

    return {
        'annotated_image': f'data:image/png;base64,{encoded_image}',
        'total_detections': len(detections),
        'detections': detections,
    }
